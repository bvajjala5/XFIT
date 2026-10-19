// Run: node --test worker/
import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyFirebaseToken, _resetJwksCache } from './auth.js';

const PROJECT = 'demo-xfit';
const b64u = (buf) => Buffer.from(buf).toString('base64url');

async function makeKeyAndFetch() {
  const kp = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify']
  );
  const jwk = { ...(await crypto.subtle.exportKey('jwk', kp.publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' };
  const fetchImpl = async () => ({ ok: true, json: async () => ({ keys: [jwk] }) });
  return { kp, fetchImpl };
}

async function sign(kp, payload, header = { alg: 'RS256', kid: 'k1', typ: 'JWT' }) {
  const h = b64u(JSON.stringify(header));
  const p = b64u(JSON.stringify(payload));
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', kp.privateKey, new TextEncoder().encode(`${h}.${p}`));
  return `${h}.${p}.${b64u(sig)}`;
}

const now = Math.floor(Date.now() / 1000);
const good = { aud: PROJECT, iss: `https://securetoken.google.com/${PROJECT}`, sub: 'user123', iat: now - 5, exp: now + 3600 };

test('accepts a valid token', async () => {
  _resetJwksCache();
  const { kp, fetchImpl } = await makeKeyAndFetch();
  const r = await verifyFirebaseToken(await sign(kp, good), PROJECT, { fetchImpl });
  assert.equal(r.uid, 'user123');
});

for (const [name, patch, msg] of [
  ['wrong audience', { aud: 'other' }, /audience/],
  ['wrong issuer', { iss: 'https://evil.example' }, /issuer/],
  ['expired', { exp: now - 10 }, /expired/],
  ['future iat', { iat: now + 1000 }, /future/],
  ['missing sub', { sub: '' }, /subject/],
]) {
  test(`rejects ${name}`, async () => {
    _resetJwksCache();
    const { kp, fetchImpl } = await makeKeyAndFetch();
    await assert.rejects(verifyFirebaseToken(await sign(kp, { ...good, ...patch }), PROJECT, { fetchImpl }), msg);
  });
}

test('rejects a token signed by a different key', async () => {
  _resetJwksCache();
  const { fetchImpl } = await makeKeyAndFetch();
  const { kp: attacker } = await makeKeyAndFetch();
  await assert.rejects(verifyFirebaseToken(await sign(attacker, good), PROJECT, { fetchImpl }), /signature/);
});

test('rejects alg=none and garbage', async () => {
  _resetJwksCache();
  const { kp, fetchImpl } = await makeKeyAndFetch();
  await assert.rejects(verifyFirebaseToken(await sign(kp, good, { alg: 'none', kid: 'k1' }), PROJECT, { fetchImpl }), /algorithm/);
  await assert.rejects(verifyFirebaseToken('not.a.jwt', PROJECT, { fetchImpl }));
  await assert.rejects(verifyFirebaseToken('', PROJECT, { fetchImpl }));
});
