import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

test('validate:album-data exits 0 on current repo state', () => {
  const r = spawnSync(process.execPath, [path.resolve('scripts/validate-album-data.mjs')], {
    cwd: process.cwd(), encoding: 'utf8',
  });
  assert.equal(r.status, 0, `stdout:\n${r.stdout}\nstderr:\n${r.stderr}`);
});
