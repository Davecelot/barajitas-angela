#!/usr/bin/env node
// Usage: node scripts/hash-password.mjs '<password>'
// Prints a pbkdf2$<iter>$<saltB64url>$<hashB64url> string to stdout.

import { webcrypto } from 'node:crypto';

const ITERATIONS = 210_000;
const SALT_BYTES = 16;
const KEY_LEN_BITS = 256;

function b64url(bytes) {
  return Buffer.from(bytes).toString('base64url');
}

async function pbkdf2(password, salt) {
  const key = await webcrypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );
  const bits = await webcrypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    key,
    KEY_LEN_BITS,
  );
  return new Uint8Array(bits);
}

const pw = process.argv[2];
if (!pw || typeof pw !== 'string') {
  console.error("Usage: node scripts/hash-password.mjs '<password>'");
  process.exit(2);
}
if (pw.length < 12) {
  console.error('Refusing to hash passwords shorter than 12 characters (OWASP 2026 minimum).');
  process.exit(2);
}

const salt = webcrypto.getRandomValues(new Uint8Array(SALT_BYTES));
const hash = await pbkdf2(pw, salt);
process.stdout.write(`pbkdf2$${ITERATIONS}$${b64url(salt)}$${b64url(hash)}\n`);
