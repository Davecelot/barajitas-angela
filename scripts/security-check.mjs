#!/usr/bin/env node
// Repository security gate: secret scan + ignore hygiene + env policy.
// Exits non-zero on blockers. Safe to run locally and in CI.

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const STAGED_ONLY = process.argv.includes('--staged');
const STRICT = process.argv.includes('--strict');

const BLOCK_FILE_PATTERNS = [
  /(^|\/)\.env$/,
  /(^|\/)\.env\.(local|development|production|staging|test)$/i,
  /(^|\/)\.dev\.vars$/,
  /(^|\/)id_(rsa|ed25519|ecdsa|dsa)$/,
  /\.(pem|key|p12|pfx|asc|jks)$/i,
  /(^|\/)credentials(\.json)?$/i,
  /(^|\/)service-account.*\.json$/i,
  /(^|\/)\.npmrc$/,
];

// Allow-listed example/sample files.
const ALLOW_FILE_PATTERNS = [
  /(^|\/)\.env\.example$/,
  /(^|\/)\.dev\.vars\.example$/,
];

// High-confidence secret content patterns.
const SECRET_CONTENT_PATTERNS = [
  { name: 'AWS access key', re: /AKIA[0-9A-Z]{16}/ },
  { name: 'AWS secret key', re: /aws_secret_access_key\s*=\s*['"]?[A-Za-z0-9/+=]{40}['"]?/i },
  { name: 'Google API key', re: /AIza[0-9A-Za-z_\-]{35}/ },
  { name: 'GitHub token', re: /gh[pousr]_[A-Za-z0-9]{36,}/ },
  { name: 'Slack token', re: /xox[abprs]-[A-Za-z0-9-]{10,}/ },
  { name: 'Stripe live key', re: /sk_live_[A-Za-z0-9]{20,}/ },
  { name: 'Private key block', re: /-----BEGIN (RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/ },
  { name: 'JWT-like token', re: /eyJ[A-Za-z0-9_\-]{10,}\.eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}/ },
  // Project-specific tokens that must never ship in source bundles.
  { name: 'Project legacy admin password', re: /barajitas2026|album2026/ },
  { name: 'pbkdf2 password hash', re: /pbkdf2\$\d+\$[A-Za-z0-9_\-]+\$[A-Za-z0-9_\-]+/ },
];

// Paths skipped when scanning content.
const SCAN_SKIP_DIRS = new Set([
  'node_modules', 'dist', '.git', '.wrangler', '.playwright-cli',
  '.skilly-hand', 'docs',
]);
const SCAN_SKIP_FILE_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.pdf',
  '.woff', '.woff2', '.ttf', '.otf', '.mp4', '.mp3', '.zip', '.gz',
]);

const blockers = [];
const warnings = [];

function isAllowed(rel) {
  return ALLOW_FILE_PATTERNS.some((re) => re.test(rel));
}

function checkTrackedSensitiveFiles() {
  const tracked = execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter(Boolean);
  for (const rel of tracked) {
    if (isAllowed(rel)) continue;
    for (const re of BLOCK_FILE_PATTERNS) {
      if (re.test(rel)) {
        blockers.push(`Tracked sensitive file: ${rel}`);
        break;
      }
    }
  }
}

function listFilesToScan() {
  if (STAGED_ONLY) {
    const out = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' });
    return out.split('\n').filter(Boolean);
  }
  const out = execSync('git ls-files', { encoding: 'utf8' });
  return out.split('\n').filter(Boolean);
}

function shouldScan(rel) {
  const parts = rel.split('/');
  if (parts.some((p) => SCAN_SKIP_DIRS.has(p))) return false;
  const ext = path.extname(rel).toLowerCase();
  if (SCAN_SKIP_FILE_EXT.has(ext)) return false;
  // Skip the security script itself (it intentionally contains the patterns).
  if (rel === 'scripts/security-check.mjs') return false;
  if (rel.endsWith('security-check.test.mjs')) return false;
  // Skip files explicitly allowlisted (they contain pattern strings by design).
  const ALLOWLIST = new Set([
    '.github/workflows/deploy-pages.yml',
    'worker/test/auth.test.mjs',
  ]);
  if (ALLOWLIST.has(rel)) return false;
  return true;
}

function scanContent() {
  const files = listFilesToScan();
  for (const rel of files) {
    if (!shouldScan(rel)) continue;
    const abs = path.join(ROOT, rel);
    let content;
    try {
      const stat = fs.statSync(abs);
      if (stat.size > 2 * 1024 * 1024) continue;
      content = fs.readFileSync(abs, 'utf8');
    } catch {
      continue;
    }
    for (const { name, re } of SECRET_CONTENT_PATTERNS) {
      const m = content.match(re);
      if (m) blockers.push(`Secret pattern "${name}" in ${rel} (match: ${m[0].slice(0, 24)}...)`);
    }
  }
}

function checkGitignoreHygiene() {
  const required = ['.env', '.env.local', '.dev.vars', 'node_modules', 'dist'];
  let gi = '';
  try { gi = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8'); } catch {
    blockers.push('Missing .gitignore at repository root.');
    return;
  }
  const lines = gi.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const entry of required) {
    const covered = lines.some((l) =>
      l === entry ||
      l === `${entry}/` ||
      l === `${entry}*` ||
      l === `${entry}.*` ||
      (l.startsWith(entry) && (l.endsWith('*') || l.endsWith('/*'))),
    );
    if (!covered) warnings.push(`gitignore missing entry: ${entry}`);
  }
}

function checkEnvExampleHasNoSecrets() {
  const candidates = ['.env.example', 'worker/.dev.vars.example'];
  for (const rel of candidates) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) continue;
    const content = fs.readFileSync(abs, 'utf8');
    for (const { name, re } of SECRET_CONTENT_PATTERNS) {
      if (re.test(content)) blockers.push(`Example file ${rel} contains secret-like value: ${name}`);
    }
  }
}

function checkViteEnvPolicy() {
  // Vite inlines anything prefixed VITE_*. Disallow obvious secret names.
  const banned = /VITE_[A-Z0-9_]*(SECRET|TOKEN|KEY|PASSWORD|PRIVATE)/;
  const files = ['.env.example', '.env.local', '.env', '.env.production', '.env.development'];
  for (const rel of files) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) continue;
    const content = fs.readFileSync(abs, 'utf8');
    const m = content.match(banned);
    if (m) blockers.push(`Disallowed secret-named VITE_* variable in ${rel}: ${m[0]}`);
  }
}

function report() {
  if (blockers.length) {
    console.error('\n[security-check] BLOCKERS:');
    for (const b of blockers) console.error('  - ' + b);
  }
  if (warnings.length) {
    console.error('\n[security-check] warnings:');
    for (const w of warnings) console.error('  - ' + w);
  }
  if (!blockers.length && !warnings.length) {
    console.log('[security-check] OK');
  }
  if (blockers.length || (STRICT && warnings.length)) process.exit(1);
}

checkTrackedSensitiveFiles();
checkGitignoreHygiene();
checkEnvExampleHasNoSecrets();
checkViteEnvPolicy();
scanContent();
report();
