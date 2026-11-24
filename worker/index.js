// Uttar Fitness AI proxy — keeps the Gemini/Stripe keys on the server and only serves signed-in Uttar Fitness users.
// Secrets/vars (see wrangler.toml + README):
//   GEMINI_API_KEY      (secret)  your Google AI Studio key
//   FIREBASE_PROJECT_ID (var)     your Firebase project id
//   ALLOWED_ORIGINS     (var)     comma-separated list of allowed site origins
//   GEMINI_MODEL        (var, optional) defaults to gemini-3.5-flash
//   AI_USAGE / AI_ENTITLEMENTS (KV bindings, optional) server-side quota source
//   STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET (secrets, optional) billing
//   STRIPE_PRO_PRICE_ID / STRIPE_TOPUP_SMALL_PRICE_ID / STRIPE_TOPUP_LARGE_PRICE_ID (vars, optional)

import { verifyFirebaseToken } from './auth.js';
import {
  applyEntitlement,
  envNumber,
  monthKey,
  normalizeUsage,
  periodEndISO,
  readJson,
  recordUsage,
  safeEqualHex,
  secondsUntilPeriodEnd,
  stripeEntitlementTtl,
  topUpAllowance,
  usagePayload,
  writeJson,
} from './quota.js';

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

function allowedOrigins(env) {
  return (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
}

function corsHeaders(origin, env) {
  const ok = origin && allowedOrigins(env).includes(origin);
  return {
    ...(ok ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body, status, cors = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

async function authenticate(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const { uid } = await verifyFirebaseToken(token, env.FIREBASE_PROJECT_ID);
  return uid;
}

async function getEntitlement(env, uid) {
  const stored = await readJson(env.AI_ENTITLEMENTS, `ent:${uid}`).catch(() => null);
  return applyEntitlement(env, stored);
}

async function getUsage(env, uid) {
  const stored = await readJson(env.AI_USAGE, `usage:${uid}:${monthKey()}`).catch(() => null);
  return normalizeUsage(stored);
}

async function persistUsage(env, uid, usage) {
  if (!env.AI_USAGE) return;
  await writeJson(env.AI_USAGE, `usage:${uid}:${monthKey()}`, usage, secondsUntilPeriodEnd()).catch(() => {});
}

function quotaResponse(entitlement, usage, persisted = true) {
  const payload = usagePayload(entitlement, usage);
  payload.persisted = persisted;
  return payload;
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
  for (let i = 1; i < contents.length; i += 1) {
    if (contents[i].role === fixed[fixed.length - 1].role) {
      fixed.push({ role: contents[i].role === 'user' ? 'model' : 'user', parts: [{ text: '...' }] });
    }
    fixed.push(contents[i]);
  }
  return fixed;
}

function safeMode(value) {
  return ['chat', 'workout', 'plan', 'formcheck'].includes(value) ? value : 'chat';
}

function validateReturnUrl(value, env, origin) {
  try {
    const url = new URL(value);
    if (allowedOrigins(env).includes(url.origin) || (origin && url.origin === origin)) return url.toString();
  } catch {
    // Fall through to the configured app origin.
  }
  return `${origin || 'https://xfit-bpe.pages.dev'}/ai-upgrade`;
}

function withQuery(url, params) {
  const parsed = new URL(url);
  for (const [key, value] of Object.entries(params)) parsed.searchParams.set(key, value);
  return parsed.toString();
}

async function stripeRequest(env, path, { method = 'GET', body, idempotencyKey } = {}) {
  if (!env.STRIPE_SECRET_KEY) throw new Error('Stripe is not configured.');
  const response = await fetch(`https://api.stripe.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Stripe error ${response.status}`);
  return data;
}

async function verifyStripeSignature(payload, header, secret) {
  if (!header || !secret) return false;
  const parts = {};
  for (const chunk of header.split(',')) {
    const [key, ...rest] = chunk.split('=');
    if (key && rest.length) parts[key.trim()] = rest.join('=').trim();
  }
  const timestamp = Number.parseInt(parts.t, 10);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${payload}`));
  const expected = [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return (parts.v1 || '').split(' ').some((candidate) => safeEqualHex(candidate, expected));
}

async function handleUsage(request, env, cors, uid) {
  const entitlement = await getEntitlement(env, uid);
  const usage = await getUsage(env, uid);
  return json(
    {
      usage: quotaResponse(entitlement, usage, Boolean(env.AI_USAGE)),
      billingEnabled: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PRO_PRICE_ID),
      serverConfigured: Boolean(env.AI_USAGE),
    },
    200,
    cors,
  );
}

async function handleCheckout(request, env, cors, uid, origin) {
  const body = (await request.json().catch(() => ({}))) || {};
  const kind = body.kind;
  const priceIds = {
    pro: env.STRIPE_PRO_PRICE_ID,
    'topup-small': env.STRIPE_TOPUP_SMALL_PRICE_ID,
    'topup-large': env.STRIPE_TOPUP_LARGE_PRICE_ID,
  };
  if (!Object.prototype.hasOwnProperty.call(priceIds, kind)) {
    return json({ error: 'Choose an Uttar AI plan.' }, 400, cors);
  }
  if (!priceIds[kind]) {
    return json({ error: 'Uttar AI checkout is not configured yet.' }, 503, cors);
  }

  const params = new URLSearchParams();
  params.set('mode', kind === 'pro' ? 'subscription' : 'payment');
  params.set('line_items[0][price]', priceIds[kind]);
  params.set('line_items[0][quantity]', '1');
  params.set(
    'success_url',
    withQuery(validateReturnUrl(body.successUrl, env, origin), {
      status: 'success',
      session_id: '{CHECKOUT_SESSION_ID}',
    }),
  );
  params.set('cancel_url', withQuery(validateReturnUrl(body.cancelUrl, env, origin), { status: 'cancelled' }));
  params.set('client_reference_id', uid);
  params.set('metadata[uid]', uid);
  params.set('metadata[kind]', kind);
  params.set('allow_promotion_codes', 'true');

  try {
    const session = await stripeRequest(env, '/v1/checkout/sessions', {
      method: 'POST',
      body: params,
      idempotencyKey: crypto.randomUUID(),
    });
    return json({ url: session.url }, 200, cors);
  } catch (error) {
    return json({ error: error.message || 'Could not start checkout.' }, 502, cors);
  }
}

async function handleWebhook(request, env) {
  const payload = await request.text();
  if (payload.length > MAX_BODY_CHARS) return json({ error: 'Payload too large' }, 413);
  const valid = await verifyStripeSignature(payload, request.headers.get('Stripe-Signature'), env.STRIPE_WEBHOOK_SECRET);
  if (!valid) return json({ error: 'Invalid signature' }, 400);

  let event;
  try {
    event = JSON.parse(payload);
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  if (event.id) {
    const seen = await readJson(env.AI_ENTITLEMENTS, `event:${event.id}`).catch(() => null);
    if (seen) return json({ received: true, duplicate: true });
    await writeJson(env.AI_ENTITLEMENTS, `event:${event.id}`, { at: new Date().toISOString() }, 60 * 60 * 24 * 30).catch(() => {});
  }

  const object = event.data?.object || {};
  if (event.type === 'checkout.session.completed') {
    const uid = object.metadata?.uid || object.client_reference_id;
    const kind = object.metadata?.kind;
    const paid = !object.payment_status || ['paid', 'no_payment_required'].includes(object.payment_status);
    if (uid && paid && ['pro', 'topup-small', 'topup-large'].includes(kind)) {
      const key = `ent:${uid}`;
      const next = { ...(await getEntitlement(env, uid)) };
      if (kind === 'pro') {
        next.plan = 'pro';
        next.customerId = object.customer || next.customerId || null;
        next.subscriptionId = object.subscription || next.subscriptionId || null;
        next.periodEnd = periodEndISO();
        if (object.subscription) {
          await writeJson(env.AI_ENTITLEMENTS, `sub:${object.subscription}`, { uid }, 60 * 60 * 24 * 90).catch(() => {});
        }
      } else {
        const allowance = topUpAllowance(env, kind);
        next.topUpRequests = envNumber(next.topUpRequests, 0) + allowance.requests;
        next.topUpTokens = envNumber(next.topUpTokens, 0) + allowance.tokens;
      }
      next.updatedAt = new Date().toISOString();
      await writeJson(env.AI_ENTITLEMENTS, key, next, stripeEntitlementTtl()).catch(() => {});
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const mapping = await readJson(env.AI_ENTITLEMENTS, `sub:${object.id}`).catch(() => null);
    if (mapping?.uid) {
      const current = { ...(await getEntitlement(env, mapping.uid)) };
      current.plan = 'free';
      current.subscriptionId = null;
      current.periodEnd = periodEndISO();
      current.updatedAt = new Date().toISOString();
      await writeJson(env.AI_ENTITLEMENTS, `ent:${mapping.uid}`, current, stripeEntitlementTtl()).catch(() => {});
    }
  }

  return json({ received: true });
}

async function handleGenerate(request, env, cors, uid) {
  if (rateLimited(uid)) {
    return json({ error: 'Too many requests — try again in a minute.', code: 'AI_RATE_LIMITED' }, 429, cors);
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_CHARS) return json({ error: 'Request too large' }, 413, cors);
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'Invalid JSON' }, 400, cors);
  }
  const { system, messages, maxTokens, image, mode } = body || {};
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return json({ error: 'Invalid messages' }, 400, cors);
  }
  if (system != null && (typeof system !== 'string' || system.length > MAX_SYSTEM_CHARS)) {
    return json({ error: 'Invalid system prompt' }, 400, cors);
  }

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
  const requestMode = safeMode(mode);

  // A paid allowance is enforced only when KV is bound. Without KV the proxy
  // keeps working exactly as before, with the configured free limits reported
  // as informational only.
  let entitlement = null;
  let usage = null;
  if (env.AI_USAGE) {
    entitlement = await getEntitlement(env, uid);
    usage = await getUsage(env, uid);
    const payload = quotaResponse(entitlement, usage, true);
    if (payload.requestsRemaining <= 0 || payload.tokensRemaining <= 0) {
      return json(
        {
          error: 'You have used your Uttar AI allowance for this month. You can still use every other Uttar Fitness feature.',
          code: 'AI_LIMIT_REACHED',
          usage: payload,
        },
        402,
        cors,
      );
    }
  }

  if (!env.GEMINI_API_KEY) return json({ error: 'AI is not configured on the server.' }, 500, cors);

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

  if (env.AI_USAGE) {
    const tokens = envNumber(data.usageMetadata?.totalTokenCount, outTokens);
    usage = recordUsage(usage, { tokens, mode: requestMode });
    await persistUsage(env, uid, usage);
  }

  return json(
    {
      text,
      usage: entitlement && usage ? quotaResponse(entitlement, usage, true) : null,
    },
    200,
    cors,
  );
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const pathname = new URL(request.url).pathname.replace(/\/+$/, '') || '/';

    if (pathname.endsWith('/stripe/webhook')) {
      if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
      return handleWebhook(request, env);
    }

    const cors = corsHeaders(origin, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (!cors['Access-Control-Allow-Origin']) return json({ error: 'Origin not allowed' }, 403, cors);

    let uid;
    try {
      uid = await authenticate(request, env);
    } catch {
      return json({ error: 'Please sign in again.' }, 401, cors);
    }

    if (request.method === 'GET' && pathname.endsWith('/usage')) {
      return handleUsage(request, env, cors, uid);
    }
    if (request.method === 'POST' && pathname.endsWith('/checkout')) {
      return handleCheckout(request, env, cors, uid, origin);
    }
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, cors);
    return handleGenerate(request, env, cors, uid);
  },
};
