// Verifies a Firebase Auth ID token (RS256 JWT) using only WebCrypto — no dependencies.
// Checks: signature (Google's rotating public keys), alg, aud, iss, exp, iat, sub.

const JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

let jwksCache = { keys: null, fetchedAt: 0 };
const JWKS_TTL_MS = 60 * 60 * 1000;

function b64urlToBytes(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(str.length / 4) * 4, '=');
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function parseJson(bytes) {
  return JSON.parse(new TextDecoder().decode(bytes));
}

async function getJwks(fetchImpl = fetch) {
  const now = Date.now();
  if (jwksCache.keys && now - jwksCache.fetchedAt < JWKS_TTL_MS) return jwksCache.keys;
  const res = await fetchImpl(JWKS_URL);
  if (!res.ok) throw new Error('Could not load Firebase public keys');
  const { keys } = await res.json();
  jwksCache = { keys, fetchedAt: now };
  return keys;
}

export function _resetJwksCache() {
  jwksCache = { keys: null, fetchedAt: 0 };
}

/**
 * @returns {Promise<{uid: string, claims: object}>} — throws Error on any failure.
 */
export async function verifyFirebaseToken(token, projectId, { fetchImpl = fetch, nowSec } = {}) {
  if (!token || typeof token !== 'string') throw new Error('Missing token');
  if (!projectId) throw new Error('Server misconfigured: no project id');

  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed token');
  const [h, p, s] = parts;

  let header, payload;
  try {
    header = parseJson(b64urlToBytes(h));
    payload = parseJson(b64urlToBytes(p));
  } catch {
    throw new Error('Malformed token');
  }

  if (header.alg !== 'RS256') throw new Error('Unsupported algorithm');
  if (!header.kid) throw new Error('Missing key id');

  const keys = await getJwks(fetchImpl);
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('Unknown signing key');

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const ok = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    b64urlToBytes(s),
    new TextEncoder().encode(`${h}.${p}`)
  );
  if (!ok) throw new Error('Bad signature');

  const now = nowSec ?? Math.floor(Date.now() / 1000);
  if (payload.aud !== projectId) throw new Error('Wrong audience');
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) throw new Error('Wrong issuer');
  if (typeof payload.exp !== 'number' || payload.exp <= now) throw new Error('Token expired');
  if (typeof payload.iat !== 'number' || payload.iat > now + 60) throw new Error('Token issued in the future');
  if (!payload.sub || typeof payload.sub !== 'string') throw new Error('Missing subject');

  return { uid: payload.sub, claims: payload };
}
