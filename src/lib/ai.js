// Shared AI helper — uses Google Gemini
// gemini-1.5-flash has the most generous free tier
const GEMINI_MODEL = 'gemini-1.5-flash-8b';

export async function callAI({ system, messages, maxTokens = 1000 }) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('Add your Gemini API key to the .env file as VITE_GEMINI_API_KEY');
  }

  // Gemini uses "user" and "model" roles
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  // Ensure conversation starts with "user" role (Gemini requirement)
  if (contents.length > 0 && contents[0].role !== 'user') {
    contents.unshift({ role: 'user', parts: [{ text: '.' }] });
  }

  const body = {
    contents,
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
