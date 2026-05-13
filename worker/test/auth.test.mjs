import { test } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';

// Polyfill global crypto for the auth module (Workers has it; Node also exposes webcrypto).
if (!globalThis.crypto) globalThis.crypto = webcrypto;

// Auth module is TS; we import the source through a tiny inline transform alternative:
// the file is plain TS targetting ES2022 with no exotic syntax beyond `as` casts and
// interface declarations, both stripped by `node --experimental-strip-types`.
// Requires Node >= 22.6 with --experimental-strip-types, or Node >= 23.6 (auto-strips).
const auth = await import('../src/auth.ts');

test('hashPassword + verifyPassword round-trip succeeds', async () => {
  for (let i = 0; i < 10; i++) {
    const pw = `pw-${i}-${Math.random().toString(36).slice(2)}`;
    const stored = await auth.hashPassword(pw);
    assert.match(stored, /^pbkdf2\$210000\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/);
    assert.equal(await auth.verifyPassword(pw, stored), true);
    assert.equal(await auth.verifyPassword(pw + 'x', stored), false);
    assert.equal(await auth.verifyPassword('', stored), false);
  }
});

test('verifyPassword rejects malformed stored strings', async () => {
  assert.equal(await auth.verifyPassword('x', ''), false);
  assert.equal(await auth.verifyPassword('x', 'pbkdf2$xx$yy'), false);
  assert.equal(await auth.verifyPassword('x', 'scrypt$1$aa$bb'), false);
  assert.equal(await auth.verifyPassword('x', 'pbkdf2$0$aa$bb'), false);
  assert.equal(await auth.verifyPassword('x', 'pbkdf2$99999999999$aa$bb'), false);
});

test('signJwt + verifyJwt round-trip', async () => {
  const secret = 'super-secret-test-value-padded-to-32-bytes-or-more';
  const token = await auth.signJwt({ sub: 'angela', role: 'admin', name: 'Angela' }, secret, 60);
  const payload = await auth.verifyJwt(token, secret);
  assert.ok(payload);
  assert.equal(payload.sub, 'angela');
  assert.equal(payload.role, 'admin');
  assert.equal(payload.name, 'Angela');
  assert.ok(payload.exp > payload.iat);
});

test('verifyJwt rejects tampered signature', async () => {
  const secret = 'secret-padded-to-thirty-two-bytes-min!!';
  const token = await auth.signJwt({ sub: 'a', role: 'normal', name: 'A' }, secret, 60);
  const parts = token.split('.');
  parts[2] = parts[2].slice(0, -2) + (parts[2].endsWith('A') ? 'BB' : 'AA');
  assert.equal(await auth.verifyJwt(parts.join('.'), secret), null);
});

test('verifyJwt rejects wrong secret', async () => {
  const s1 = 'secret-one-padded-to-thirty-two-bytes!';
  const s2 = 'secret-two-padded-to-thirty-two-bytes!';
  const token = await auth.signJwt({ sub: 'a', role: 'normal', name: 'A' }, s1, 60);
  assert.equal(await auth.verifyJwt(token, s2), null);
});

test('verifyJwt rejects expired token', async () => {
  const s = 'secret-padded-to-thirty-two-bytes-min!!';
  const token = await auth.signJwt({ sub: 'a', role: 'normal', name: 'A' }, s, -10);
  assert.equal(await auth.verifyJwt(token, s), null);
});

test('signJwt rejects short secret (RFC 7518 §3.2)', async () => {
  await assert.rejects(
    () => auth.signJwt({ sub: 'a', role: 'normal', name: 'A' }, 'too-short', 60),
    /at least 32 bytes/,
  );
});

test('b64urlDecode rejects non-alphabet chars (used via verifyJwt)', async () => {
  const secret = 'secret-padded-to-thirty-two-bytes-min!!';
  // Token with `+` in the payload segment — invalid base64url.
  assert.equal(await auth.verifyJwt('aaa.b+b.ccc', secret), null);
  // Token with whitespace.
  assert.equal(await auth.verifyJwt('aaa. bb.ccc', secret), null);
  // Wrong segment count.
  assert.equal(await auth.verifyJwt('aaa.bbb', secret), null);
  assert.equal(await auth.verifyJwt('', secret), null);
  assert.equal(await auth.verifyJwt('a.b.c.d', secret), null);
});

test('verifyPassword rejects tampered low-iter hash (downgrade defense)', async () => {
  // Hand-craft a stored hash claiming 1000 iters — below MIN.
  const fakeSalt = Buffer.alloc(16, 1).toString('base64url');
  const fakeHash = Buffer.alloc(32, 2).toString('base64url');
  assert.equal(await auth.verifyPassword('anything', `pbkdf2$1000$${fakeSalt}$${fakeHash}`), false);
  assert.equal(await auth.verifyPassword('anything', `pbkdf2$1e5$${fakeSalt}$${fakeHash}`), false);
  assert.equal(await auth.verifyPassword('anything', `pbkdf2$+210000$${fakeSalt}$${fakeHash}`), false);
});

test('hashPassword produces unique salts (different ciphertexts for same password)', async () => {
  const h1 = await auth.hashPassword('same-password-123');
  const h2 = await auth.hashPassword('same-password-123');
  assert.notEqual(h1, h2);
});

test('verifyJwt rejects bad role', async () => {
  // Hand-craft a token with a bogus role.
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({ sub: 'a', role: 'superuser', name: 'A', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 60 }),
  ).toString('base64url');
  // Sign with correct secret so signature passes; role check should still reject.
  const secret = 'secret-padded-to-thirty-two-bytes-min!!';
  const key = await webcrypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = new Uint8Array(await webcrypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${body}`)));
  const sigB64 = Buffer.from(sig).toString('base64url');
  assert.equal(await auth.verifyJwt(`${header}.${body}.${sigB64}`, secret), null);
});

test('extractBearer parses Authorization header', () => {
  const req1 = new Request('http://x', { headers: { Authorization: 'Bearer abc.def.ghi' } });
  assert.equal(auth.extractBearer(req1), 'abc.def.ghi');
  const req2 = new Request('http://x');
  assert.equal(auth.extractBearer(req2), null);
  const req3 = new Request('http://x', { headers: { Authorization: 'Basic xxx' } });
  assert.equal(auth.extractBearer(req3), null);
});
