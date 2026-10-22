import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createAuthClient, TOKEN_KEY, LOGOUT_KEY } from '../src/utils/auth.ts'

const admin = { id: 'test-admin', name: 'Test admin', role: 'admin' }
const reader = { id: 'test-reader', name: 'Test reader', role: 'normal' }
const apiUrl = 'https://auth.example.invalid/'

function storage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value) },
    removeItem: (key) => { values.delete(key) },
  }
}
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } })

test('rejects a forged legacy localStorage identity without sending a request', async () => {
  const saved = storage({ 'barajitas-auth-user': JSON.stringify(admin), 'barajitas-collected': '["mex-1"]' })
  const client = createAuthClient({ apiUrl, storage: saved, fetcher: () => assert.fail('no token to validate') })
  await client.restore()
  assert.equal(client.getSnapshot(), null)
  assert.equal(saved.getItem('barajitas-auth-user'), null)
  assert.equal(saved.getItem('barajitas-collected'), '["mex-1"]')
})

test('fails closed when the API is absent or does not use HTTPS', async () => {
  for (const address of [undefined, 'http://auth.example.invalid', 'https://user:password@auth.example.invalid', 'not-a-url']) {
    const client = createAuthClient({ apiUrl: address, storage: storage(), fetcher: () => assert.fail('untrusted destination') })
    assert.equal(client.configured, false)
    assert.equal(await client.login('example', 'example'), false)
    assert.equal(client.getSnapshot(), null)
  }
})

test('validates stored tokens with the server before restoring any role', async () => {
  const saved = storage({ [TOKEN_KEY]: 'test.signed.token' })
  let calls = 0
  const client = createAuthClient({ apiUrl, storage: saved, fetcher: async (url, options) => {
    calls++
    assert.equal(url.pathname, '/api/me')
    assert.equal(options.headers.Authorization, 'Bearer test.signed.token')
    assert.equal(options.redirect, 'error')
    assert.equal(options.cache, 'no-store')
    return json({ user: reader })
  } })
  assert.equal(client.getSnapshot(), null)
  await client.restore()
  assert.deepEqual(client.getSnapshot(), reader)
  assert.equal(calls, 1)
})

test('rejects unavailable, invalid and malformed session responses', async () => {
  const responses = [
    () => json({ user: admin }, 401),
    () => json({ user: { ...admin, role: 'owner' } }),
    () => json({ user: { id: 'test-admin', role: 'admin' } }),
    () => new Response('not json'),
    () => { throw new Error('offline') },
  ]
  for (const response of responses) {
    const saved = storage({ [TOKEN_KEY]: 'test.signed.token' })
    const client = createAuthClient({ apiUrl, storage: saved, fetcher: async () => response() })
    await client.restore()
    assert.equal(client.getSnapshot(), null)
    assert.equal(saved.getItem(TOKEN_KEY), null)
  }
})

test('ignores a login role until the returned token is validated server-side', async () => {
  const saved = storage()
  const paths = []
  const client = createAuthClient({ apiUrl, storage: saved, fetcher: async (url, options) => {
    paths.push(url.pathname)
    if (url.pathname === '/api/login') {
      assert.equal(options.method, 'POST')
      return json({ token: 'test.signed.token', user: admin })
    }
    return json({ user: reader })
  } })
  assert.equal(await client.login('example', 'example'), true)
  assert.deepEqual(client.getSnapshot(), reader)
  assert.equal(JSON.parse(saved.getItem(TOKEN_KEY)).token, 'test.signed.token')
  assert.deepEqual(paths, ['/api/login', '/api/me'])
})

test('does not trust credentials or admin fields echoed by a failed backend', async () => {
  const client = createAuthClient({ apiUrl, storage: storage(), fetcher: async (url) =>
    url.pathname === '/api/login' ? json({ token: 'test.signed.token', user: admin }) : json({ user: admin }, 403) })
  assert.equal(await client.login('example', 'example'), false)
  assert.equal(client.getSnapshot(), null)
})

test('logout invalidates a pending validation and clears only the auth token', async () => {
  let resolve
  const pending = new Promise((r) => { resolve = r })
  const saved = storage({ [TOKEN_KEY]: 'test.signed.token', 'barajitas-repeated': '{"mex-1":2}' })
  const client = createAuthClient({ apiUrl, storage: saved, fetcher: () => pending })
  const restore = client.restore()
  client.logout()
  resolve(json({ user: admin }))
  await restore
  assert.equal(client.getSnapshot(), null)
  assert.equal(saved.getItem(TOKEN_KEY), null)
  assert.equal(saved.getItem('barajitas-repeated'), '{"mex-1":2}')
})

test('effect cancellation preserves token for React StrictMode restoration', async () => {
  const saved = storage({ [TOKEN_KEY]: 'test.signed.token' })
  const client = createAuthClient({ apiUrl, storage: saved, fetcher: async () => json({ user: admin }) })
  const first = client.restore()
  client.cancelPending()
  await first
  assert.equal(client.getSnapshot(), null)
  assert.equal(saved.getItem(TOKEN_KEY), 'test.signed.token')
  await client.restore()
  assert.deepEqual(client.getSnapshot(), admin)
})

test('another tab logout immediately invalidates this tab without changing album data', async () => {
  const saved = storage({ [TOKEN_KEY]: 'test.signed.token', 'barajitas-collected': '["mex-1"]' })
  const options = { apiUrl, storage: saved, fetcher: async () => json({ user: admin }) }
  const first = createAuthClient(options)
  const second = createAuthClient(options)
  await Promise.all([first.restore(), second.restore()])
  assert.deepEqual(second.getSnapshot(), admin)
  first.logout()
  await second.handleStorageChange(TOKEN_KEY)
  assert.equal(second.getSnapshot(), null)
  assert.equal(saved.getItem('barajitas-collected'), '["mex-1"]')
})

test('cross-tab logout cannot be undone by an older pending session validation', async () => {
  let resolve
  const pending = new Promise((done) => { resolve = done })
  const saved = storage({ [TOKEN_KEY]: 'test.signed.token' })
  const client = createAuthClient({ apiUrl, storage: saved, fetcher: () => pending })
  const restoring = client.restore()
  saved.removeItem(TOKEN_KEY)
  await client.handleStorageChange(null)
  resolve(json({ user: admin }))
  await restoring
  assert.equal(client.getSnapshot(), null)
  assert.equal(saved.getItem(TOKEN_KEY), null)
})

test('unrelated album storage changes do not invalidate authentication', async () => {
  const saved = storage({ [TOKEN_KEY]: 'test.signed.token' })
  let validations = 0
  const client = createAuthClient({ apiUrl, storage: saved, fetcher: async () => {
    validations++
    return json({ user: admin })
  } })
  await client.restore()
  await client.handleStorageChange('barajitas-collected')
  assert.deepEqual(client.getSnapshot(), admin)
  assert.equal(validations, 1)
})

test('another tab logout fences an earlier pending login even before storage events arrive', async () => {
  const saved = storage({ [TOKEN_KEY]: 'test.signed.token' })
  const first = createAuthClient({ apiUrl, storage: saved, fetcher: async () => json({ user: admin }) })
  await first.restore()
  let finishLogin
  const pendingResponse = new Promise((resolve) => { finishLogin = resolve })
  const second = createAuthClient({ apiUrl, storage: saved, fetcher: async (url) =>
    url.pathname === '/api/login' ? pendingResponse : json({ user: admin }) })
  const pendingLogin = second.login('example', 'example')
  assert.equal(saved.getItem(TOKEN_KEY), null)
  // Removing an already absent token emits no browser storage event.
  first.logout()
  finishLogin(json({ token: 'new.test.token' }))
  assert.equal(await pendingLogin, false)
  assert.equal(first.getSnapshot(), null)
  assert.equal(second.getSnapshot(), null)
  assert.equal(saved.getItem(TOKEN_KEY), null)
})

test('a new explicit login remains possible after another tab logout', async () => {
  const saved = storage()
  const first = createAuthClient({ apiUrl, storage: saved })
  first.logout()
  const second = createAuthClient({ apiUrl, storage: saved, fetcher: async (url) =>
    url.pathname === '/api/login' ? json({ token: 'new.test.token' }) : json({ user: reader }) })
  assert.equal(await second.login('example', 'example'), true)
  assert.deepEqual(second.getSnapshot(), reader)
  // A queued notification for the earlier logout must not delete a newer login.
  await second.handleStorageChange(LOGOUT_KEY)
  assert.deepEqual(second.getSnapshot(), reader)
  assert.equal(JSON.parse(saved.getItem(TOKEN_KEY)).token, 'new.test.token')
})

test('a queued earlier logout notification does not cancel a newer pending login', async () => {
  const saved = storage()
  createAuthClient({ apiUrl, storage: saved }).logout()
  let finishLogin
  const pendingResponse = new Promise((resolve) => { finishLogin = resolve })
  const client = createAuthClient({ apiUrl, storage: saved, fetcher: async (url) =>
    url.pathname === '/api/login' ? pendingResponse : json({ user: reader }) })
  const login = client.login('example', 'example')
  await client.handleStorageChange(LOGOUT_KEY)
  finishLogin(json({ token: 'new.test.token' }))
  assert.equal(await login, true)
  assert.deepEqual(client.getSnapshot(), reader)
})

test('logout interleaving with token persistence cannot leave a restorable older session', async () => {
  const saved = storage()
  const originalSetItem = saved.setItem
  let interleave = true
  saved.setItem = (key, value) => {
    if (key === TOKEN_KEY && interleave) {
      interleave = false
      // Simulate another document completing logout between the final read/write.
      originalSetItem(LOGOUT_KEY, 'test-newer-logout-revision')
    }
    originalSetItem(key, value)
  }
  const client = createAuthClient({ apiUrl, storage: saved, fetcher: async (url) =>
    url.pathname === '/api/login' ? json({ token: 'older.test.token' }) : json({ user: admin }) })
  assert.equal(await client.login('example', 'example'), false)
  const other = createAuthClient({ apiUrl, storage: saved, fetcher: async () => json({ user: admin }) })
  await other.restore()
  assert.equal(client.getSnapshot(), null)
  assert.equal(other.getSnapshot(), null)
})
