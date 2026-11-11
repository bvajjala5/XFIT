// Uttar Fitness AI proxy — keeps the Gemini API key on the server and only serves signed-in Uttar Fitness users.
// Secrets/vars (see wrangler.toml + README):
//   GEMINI_API_KEY      (secret)  your Google AI Studio key
//   FIREBASE_PROJECT_ID (var)     your Firebase project id
//   ALLOWED_ORIGINS     (var)     comma-separated list of allowed site origins
//   GEMINI_MODEL        (var, optional) defaults to gemini-3.5-flash

import { verifyFirebaseToken } from './auth.js';

const MAX_BODY_CHARS = 2_000_000;
const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 6000;
const MAX_SYSTEM_CHARS = 6000;
const MAX_OUTPUT_TOKENS = 2000;
// Form checks send one compressed camera frame. 1.5 MB of base64 is roughly a
// 1.1 MB image — far more than the app's 720px JPEGs ever produce.
const MAX_IMAGE_BASE64 = 1_500_000;

// Best-effort per-isolate limiter (resets when the isolate recycles). For hard limits,
// add Cloudflare's Rate Limiting rules in the dashboard for this Worker's route.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 10;
const hits = new Map();
function rateLimited(uid) {
  const now = Date.now();
  const recent = (hits.get(uid) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    hits.set(uid, recent);
    return true;
  }
  recent.push(now);
  hits.set(uid, recent);
  if (hits.size > 5000) hits.clear();
  return false;
}

function corsHeaders(origin, env) {
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const ok = origin && allowed.includes(origin);
  return {
    ...(ok ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

// Gemini needs: first turn from the user, strictly alternating roles.
function toGeminiContents(messages) {
  const contents = messages
    .filter((m) => m && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content.slice(0, MAX_MESSAGE_CHARS) }],
    }));
  if (contents.length === 0 || contents[0].role !== 'user') {
    contents.unshift({ role: 'user', parts: [{ text: 'Hello' }] });
  }
  const fixed = [contents[0]];
  for (let i = 1; i < contents.length; i++) {
    if (contents[i].role === fixed[fixed.length - 1].role) {
      fixed.push({ role: contents[i].role === 'user' ? 'model' : 'user', parts: [{ text: '...' }] });
    }
    fixed.push(contents[i]);
  }
  return fixed;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const cors = corsHeaders(origin, env);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, cors);
    if (!cors['Access-Control-Allow-Origin']) return json({ error: 'Origin not allowed' }, 403, cors);

    // 1. Authenticate
    const auth = request.headers.get('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    let uid;
    try {
      ({ uid } = await verifyFirebaseToken(token, env.FIREBASE_PROJECT_ID));
    } catch {
      return json({ error: 'Please sign in again.' }, 401, cors);
    }

    if (rateLimited(uid)) return json({ error: 'Too many requests — try again in a minute.' }, 429, cors);

    // 2. Validate input
    const raw = await request.text();
    if (raw.length > MAX_BODY_CHARS) return json({ error: 'Request too large' }, 413, cors);
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return json({ error: 'Invalid JSON' }, 400, cors);
    }
    const { system, messages, maxTokens, image } = body || {};
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
      return json({ error: 'Invalid messages' }, 400, cors);
    }
    if (system != null && (typeof system !== 'string' || system.length > MAX_SYSTEM_CHARS)) {
      return json({ error: 'Invalid system prompt' }, 400, cors);
    }

    // Optional vision input for form checks: one inline image, attached to the
    // first user turn.
    let imagePart = null;
    if (image != null) {
      if (
        typeof image !== 'object' ||
        typeof image.data !== 'string' ||
        typeof image.mimeType !== 'string' ||
        !/^image\/(jpeg|png|webp)$/.test(image.mimeType)
      ) {
        return json({ error: 'Invalid image' }, 400, cors);
      }
      if (image.data.length > MAX_IMAGE_BASE64) {
        return json({ error: 'Image too large' }, 413, cors);
      }
      imagePart = { inline_data: { mime_type: image.mimeType, data: image.data } };
    }

    const outTokens = Math.min(Math.max(parseInt(maxTokens, 10) || 1000, 1), MAX_OUTPUT_TOKENS);

    if (!env.GEMINI_API_KEY) return json({ error: 'AI is not configured on the server.' }, 500, cors);

    // 3. Call Gemini (key goes in a header, never in the URL). Thinking is disabled so the
    // output-token budget is spent on the answer itself. If the primary model is overloaded
    // (503) or rate limited (429), retry with a lighter model.
    const models = [...new Set([env.GEMINI_MODEL, 'gemini-3.5-flash', 'gemini-3.1-flash-lite'].filter(Boolean))];
    const contents = toGeminiContents(messages);
    if (imagePart) contents[0].parts.unshift(imagePart);
    const callGemini = async (model, generationConfig) => {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
          body: JSON.stringify({
            contents,
            ...(system && { system_instruction: { parts: [{ text: system }] } }),
            generationConfig,
          }),
        }
      );
      return { res, data: await res.json().catch(() => ({})) };
    };

    let geminiRes;
    let data = {};
    for (const model of models) {
      let attempt = await callGemini(model, {
        maxOutputTokens: outTokens,
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 },
      });
      // Some models reject disabling thinking; retry once without the hint.
      if (attempt.res.status === 400) {
        attempt = await callGemini(model, { maxOutputTokens: outTokens, temperature: 0.7 });
      }
      ({ res: geminiRes, data } = attempt);
      if (geminiRes.ok) break;
      console.error('Gemini error', model, geminiRes.status, JSON.stringify(data?.error || {}));
      if (geminiRes.status !== 429 && geminiRes.status < 500) break;
    }

    if (!geminiRes.ok) {
      return json({ error: 'The AI service had a problem. Try again shortly.' }, 502, cors);
    }
    const text = (data.candidates?.[0]?.content?.parts || [])
      .map((p) => p?.text || '')
      .join('')
      .trim();
    if (!text) return json({ error: 'No response from AI' }, 502, cors);
    return json({ text }, 200, cors);
  },
};
