import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

// A browser bundle is public: even a hashed replacement cannot provide a
// server-side password or authorization boundary.
test('does not ship a browser-side password database', () => {
  const file = new URL('../src/data/users.json', import.meta.url)
  if (!fs.existsSync(file)) return
  const users = JSON.parse(fs.readFileSync(file, 'utf8'))
  assert.equal(users.some((user) => Object.keys(user).some((key) => /password|secret|token/i.test(key))), false,
    'The frontend must not contain account credentials')
})
