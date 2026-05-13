#!/usr/bin/env node
// Run `npm audit` for the root workspace. Fails on high/critical.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const STRICT = process.argv.includes('--strict');
const LEVEL = STRICT ? 'moderate' : 'high';
const ROOT = process.cwd();

const targets = [ROOT];

let failed = false;
for (const cwd of targets) {
  if (!fs.existsSync(path.join(cwd, 'package-lock.json'))) {
    console.warn(`[deps] skipping ${path.relative(ROOT, cwd) || '.'} (no package-lock.json)`);
    continue;
  }
  console.log(`[deps] auditing ${path.relative(ROOT, cwd) || '.'} (level=${LEVEL})`);
  const result = spawnSync('npm', ['audit', `--audit-level=${LEVEL}`, '--omit=dev'], {
    cwd, stdio: 'inherit', encoding: 'utf8',
  });
  if (result.status !== 0) failed = true;
}

if (failed) {
  console.error('[deps] vulnerable dependencies at level >=', LEVEL);
  process.exit(1);
}
console.log('[deps] OK');
