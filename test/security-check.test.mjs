import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SCRIPT = path.resolve('scripts/security-check.mjs');

function runIn(cwd, args = []) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { cwd, encoding: 'utf8' });
}

function makeFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sec-fix-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  spawnSync('git', ['config', 'user.email', 't@t'], { cwd: dir });
  spawnSync('git', ['config', 'user.name', 't'], { cwd: dir });
  fs.mkdirSync(path.join(dir, 'scripts'), { recursive: true });
  fs.copyFileSync(SCRIPT, path.join(dir, 'scripts/security-check.mjs'));
  fs.writeFileSync(path.join(dir, '.gitignore'),
    'node_modules\ndist\n.env\n.env.local\n.dev.vars\n');
  return dir;
}

function commitAll(dir) {
  spawnSync('git', ['add', '-A'], { cwd: dir });
  spawnSync('git', ['commit', '-q', '-m', 'fix'], { cwd: dir });
}

test('passes on clean repo', () => {
  const dir = makeFixture();
  fs.writeFileSync(path.join(dir, 'README.md'), '# ok\n');
  commitAll(dir);
  const r = runIn(dir);
  assert.equal(r.status, 0, r.stderr + r.stdout);
});

test('blocks tracked .env file', () => {
  const dir = makeFixture();
  fs.writeFileSync(path.join(dir, '.env'), 'X=1\n');
  spawnSync('git', ['add', '-f', '.env'], { cwd: dir });
  spawnSync('git', ['commit', '-q', '-m', 'leak'], { cwd: dir });
  const r = runIn(dir);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Tracked sensitive file/);
});

test('allows .env.example', () => {
  const dir = makeFixture();
  fs.writeFileSync(path.join(dir, '.env.example'), 'VITE_API_URL=https://example.com\n');
  commitAll(dir);
  const r = runIn(dir);
  assert.equal(r.status, 0, r.stderr);
});

test('detects AWS access key in source', () => {
  const dir = makeFixture();
  fs.writeFileSync(path.join(dir, 'leak.txt'), 'const k = "AKIAABCDEFGHIJKLMNOP";\n');
  commitAll(dir);
  const r = runIn(dir);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /AWS access key/);
});

test('detects private key block', () => {
  const dir = makeFixture();
  fs.writeFileSync(path.join(dir, 'key.txt'),
    '-----BEGIN RSA PRIVATE KEY-----\nABC\n-----END RSA PRIVATE KEY-----\n');
  commitAll(dir);
  const r = runIn(dir);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Private key block/);
});

test('blocks VITE_SECRET-style names', () => {
  const dir = makeFixture();
  fs.writeFileSync(path.join(dir, '.env.example'), 'VITE_API_SECRET=xxx\n');
  commitAll(dir);
  const r = runIn(dir);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Disallowed secret-named VITE_/);
});

test('detects project legacy admin password', () => {
  const dir = makeFixture();
  fs.writeFileSync(path.join(dir, 'src.js'), 'const p = "barajitas2026";\n');
  commitAll(dir);
  const r = runIn(dir);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Project legacy admin password/);
});

test('--staged scans only staged files', () => {
  const dir = makeFixture();
  fs.writeFileSync(path.join(dir, 'committed.txt'), 'AKIAABCDEFGHIJKLMNOP\n');
  spawnSync('git', ['add', 'committed.txt'], { cwd: dir });
  // Bypass hook would be needed in real repo, but no hook installed here.
  const c1 = spawnSync('git', ['commit', '-q', '-m', 'old'], { cwd: dir });
  assert.equal(c1.status, 0);
  // Now: nothing staged -> --staged should pass even though tree has the secret.
  const r = runIn(dir, ['--staged']);
  // Tracked content scan is skipped under --staged, so it should pass.
  assert.equal(r.status, 0, r.stderr + r.stdout);
});
