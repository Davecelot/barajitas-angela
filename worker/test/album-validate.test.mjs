import { test } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) globalThis.crypto = webcrypto;

// Pull the validator out of album.ts via a re-export. Since album.ts doesn't
// export it, we read the module and probe behavior via handlePutAlbum with a
// stub env + stubbed putAlbum is too entangled. Instead, exercise validation
// through a thin direct import by exposing it. To keep this test independent,
// duplicate the validator's contract here using the same constants and
// re-import the SUT only for happy-path through handlePutAlbum.
//
// Simpler approach: import the file as a module, monkey-patching is invasive.
// Instead, write tests for the *router/handler* via a stubbed env in a later
// integration phase. This file pins behavioral invariants of the validator
// by replicating the public contract from album.ts and asserting it matches.
// Maintained by hand — see worker/src/handlers/album.ts validateAlbumPayload.

const album = await import('../src/handlers/album.ts');

// album.ts intentionally does not export validateAlbumPayload; expose it via
// the handler with a stubbed env. We construct fake admin JWT payload and a
// fake env whose putAlbum is captured.
function makeReq(body, headers = {}) {
  const json = JSON.stringify(body);
  return new Request('http://x/api/album', {
    method: 'PUT',
    body: json,
    headers: { 'Content-Type': 'application/json', 'Content-Length': String(json.length), ...headers },
  });
}

function makeEnv(captureRef) {
  return {
    DB: {
      prepare() {
        return {
          bind() { return this; },
          async first() { return null; },
          async run() {
            captureRef.called = (captureRef.called ?? 0) + 1;
            return { success: true };
          },
        };
      },
    },
    JWT_SECRET: 'x'.repeat(64),
    ALLOWED_ORIGIN: 'https://example.com',
    JWT_TTL_SECONDS: '60',
  };
}

const adminUser = { sub: 'angela', role: 'admin', name: 'Angela', iat: 0, exp: 9999999999 };
const visitorUser = { sub: 'visitor', role: 'normal', name: 'V', iat: 0, exp: 9999999999 };

test('PUT /api/album rejects non-admin', async () => {
  const cap = {};
  const res = await album.handlePutAlbum(makeReq({ collected: [], repeated: {} }), makeEnv(cap), visitorUser);
  assert.equal(res.status, 403);
  assert.equal(cap.called, undefined);
});

test('PUT /api/album accepts well-formed admin payload', async () => {
  const cap = {};
  const res = await album.handlePutAlbum(
    makeReq({ collected: ['a', 'b'], repeated: { a: 1, b: 2 } }),
    makeEnv(cap),
    adminUser,
  );
  assert.equal(res.status, 200);
  assert.equal(cap.called, 1);
});

test('PUT rejects invalid JSON', async () => {
  const req = new Request('http://x/api/album', {
    method: 'PUT',
    body: '{not json',
    headers: { 'Content-Type': 'application/json', 'Content-Length': '9' },
  });
  const res = await album.handlePutAlbum(req, makeEnv({}), adminUser);
  assert.equal(res.status, 400);
});

test('PUT rejects oversized body (byte-counted, not Content-Length-trusted)', async () => {
  const huge = JSON.stringify({ collected: Array(2000).fill('x'.repeat(50)), repeated: {} });
  assert.ok(huge.length > 64 * 1024);
  const req = new Request('http://x/api/album', {
    method: 'PUT',
    body: huge,
    headers: { 'Content-Type': 'application/json' },
  });
  const res = await album.handlePutAlbum(req, makeEnv({}), adminUser);
  assert.equal(res.status, 413);
});

test('PUT enforces byte cap even when Content-Length lies (small)', async () => {
  // Content-Length spoofed small; actual body is small — should not 413 on size, should 400 on shape.
  const req = new Request('http://x/api/album', {
    method: 'PUT',
    body: '{"bad":1}',
    headers: { 'Content-Type': 'application/json', 'Content-Length': '1' },
  });
  const res = await album.handlePutAlbum(req, makeEnv({}), adminUser);
  assert.equal(res.status, 400);
});

test('PUT rejects malformed payload shapes', async () => {
  const cases = [
    { collected: 'not-array', repeated: {} },
    { collected: [], repeated: 'not-object' },
    { collected: [123], repeated: {} },
    { collected: [''], repeated: {} },
    { collected: ['x'.repeat(65)], repeated: {} },
    { collected: [], repeated: { a: 'not-number' } },
    { collected: [], repeated: { a: -1 } },
    { collected: [], repeated: { a: 1.5 } },
    { collected: [], repeated: { a: 1000 } },
    { collected: [], repeated: { '': 1 } },
    { collected: Array(5001).fill('x'), repeated: {} },
  ];
  for (const body of cases) {
    const res = await album.handlePutAlbum(makeReq(body), makeEnv({}), adminUser);
    assert.equal(res.status, 400, `expected 400 for ${JSON.stringify(body).slice(0, 60)}`);
  }
});

test('PUT dedupes collected and drops zero-count repeated', async () => {
  const cap = { writes: [] };
  const env = {
    ...makeEnv({}),
    DB: {
      prepare(sql) {
        return {
          bind(...args) {
            // putAlbum now uses INSERT ... ON CONFLICT UPSERT instead of UPDATE.
            if (sql.includes('album_state')) cap.writes.push(args);
            return this;
          },
          async first() { return null; },
          async run() { return { success: true }; },
        };
      },
    },
  };
  const res = await album.handlePutAlbum(
    makeReq({ collected: ['a', 'b', 'a'], repeated: { a: 0, b: 3 } }),
    env,
    adminUser,
  );
  assert.equal(res.status, 200);
  assert.equal(cap.writes.length, 1);
  const [collectedJson, repeatedJson] = cap.writes[0];
  assert.deepEqual(JSON.parse(collectedJson), ['a', 'b']);
  assert.deepEqual(JSON.parse(repeatedJson), { b: 3 });
});

test('GET /api/album returns parsed state', async () => {
  const env = {
    ...makeEnv({}),
    DB: {
      prepare() {
        return {
          bind() { return this; },
          async first() {
            return {
              collected_json: '["x","y"]',
              repeated_json: '{"y":2}',
              updated_at: 12345,
              updated_by: 'angela',
            };
          },
          async run() { return { success: true }; },
        };
      },
    },
  };
  const res = await album.handleGetAlbum(new Request('http://x/api/album'), env, visitorUser);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body, { collected: ['x', 'y'], repeated: { y: 2 }, updatedAt: 12345, updatedBy: 'angela' });
});
