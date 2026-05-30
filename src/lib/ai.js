// Shared AI helper — uses Google Gemini
const GEMINI_MODEL = 'gemini-1.5-flash';

export async function callAI({ system, messages, maxTokens = 1000 }) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('Add your Gemini API key to the .env file as VITE_GEMINI_API_KEY');
  }

  // Build contents — filter out any empty messages
  const contents = messages
    .filter(m => m.content && m.content.trim())
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  // Gemini requires conversation to start with 'user' role
  if (contents.length === 0 || contents[0].role !== 'user') {
    contents.unshift({ role: 'user', parts: [{ text: 'Hello' }] });
  }

  // Gemini cannot have two consecutive same-role messages — interleave if needed
  const fixed = [contents[0]];
  for (let i = 1; i < contents.length; i++) {
    if (contents[i].role === fixed[fixed.length - 1].role) {
      // Insert a filler message of opposite role
      const filler = contents[i].role === 'user' ? 'model' : 'user';
      fixed.push({ role: filler, parts: [{ text: '...' }] });
    }
    fixed.push(contents[i]);
  }

  const body = {
    contents: fixed,
    ...(system && { system_instruction: { parts: [{ text: system }] } }),
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.7,
    },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    const msg = data?.error?.message || `Gemini error ${res.status}`;
    console.error('Gemini API error:', data);
    throw new Error(msg);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!text) {
    console.error('Gemini returned no text:', data);
    throw new Error('No response from Gemini');
  }
  return text;
}
