import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('.env.example has https:// VITE_API_URL', () => {
  const text = fs.readFileSync(path.resolve('.env.example'), 'utf8');
  const m = text.match(/^VITE_API_URL=(.+)$/m);
  assert.ok(m, 'VITE_API_URL missing from .env.example');
  assert.match(m[1].trim(), /^https:\/\//, 'VITE_API_URL must use https:// scheme');
});

test('.env.local (if present) has https:// VITE_API_URL', () => {
  const p = path.resolve('.env.local');
  if (!fs.existsSync(p)) return;
  const text = fs.readFileSync(p, 'utf8');
  const m = text.match(/^VITE_API_URL=(.+)$/m);
  if (!m) return;
  assert.match(m[1].trim(), /^https:\/\//, 'VITE_API_URL in .env.local must use https:// scheme');
});

test('.gitignore excludes env/secrets material', () => {
  const gi = fs.readFileSync(path.resolve('.gitignore'), 'utf8');
  for (const required of ['.env', '.env.local', 'node_modules', 'dist']) {
    assert.ok(
      gi.split('\n').some((l) => l.trim() === required || l.trim() === `${required}/`),
      `.gitignore missing entry: ${required}`,
    );
  }
});
