import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('.gitignore excludes env/secrets material', () => {
  const gi = fs.readFileSync(path.resolve('.gitignore'), 'utf8');
  for (const required of ['.env', '.env.local', 'node_modules', 'dist']) {
    assert.ok(
      gi.split('\n').some((l) => l.trim() === required || l.trim() === `${required}/`),
      `.gitignore missing entry: ${required}`,
    );
  }
});
