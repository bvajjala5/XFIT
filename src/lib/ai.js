// AI helper — talks to the XFit AI proxy (see /worker). The Gemini API key lives on
// the proxy, never in this app. Requests are authenticated with the user's Firebase ID token.
import { auth } from './firebase';

const PROXY_URL = import.meta.env.VITE_AI_PROXY_URL;

export async function callAI({ system, messages, maxTokens = 1000 }) {
  if (!PROXY_URL) {
    throw new Error('AI is not set up yet. Add VITE_AI_PROXY_URL (see worker/README.md).');
  }
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in to use AI features.');

  const token = await user.getIdToken();
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ system, messages, maxTokens }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `AI error ${res.status}`);
  if (!data.text) throw new Error('No response from AI');
  return data.text;
}
