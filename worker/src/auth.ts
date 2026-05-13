const PBKDF2_ITERATIONS = 210_000;
const PBKDF2_HASH: 'SHA-256' = 'SHA-256';
const PBKDF2_KEY_LEN_BITS = 256;
const PBKDF2_SALT_BYTES = 16;
const PBKDF2_MIN_ITERATIONS = 100_000;
const PBKDF2_MAX_ITERATIONS = 10_000_000;
const JWT_ALG = 'HS256';
const JWT_HS256_MIN_SECRET_BYTES = 32;
const JWT_IAT_SKEW_SECONDS = 60;
const B64URL_ALPHABET = /^[A-Za-z0-9_-]*$/;

function b64urlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function b64urlDecode(s: string): Uint8Array {
  if (!B64URL_ALPHABET.test(s)) throw new Error('invalid base64url');
  if (s.length % 4 === 1) throw new Error('invalid base64url length');
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64urlEncodeJson(value: unknown): string {
  return b64urlEncode(new TextEncoder().encode(JSON.stringify(value)));
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: PBKDF2_HASH },
    key,
    PBKDF2_KEY_LEN_BITS,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(PBKDF2_SALT_BYTES));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${b64urlEncode(salt)}$${b64urlEncode(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterStr = parts[1]!;
  if (!/^[1-9][0-9]*$/.test(iterStr)) return false;
  const iterations = Number(iterStr);
  if (!Number.isInteger(iterations) || iterations < PBKDF2_MIN_ITERATIONS || iterations > PBKDF2_MAX_ITERATIONS) return false;
  let salt: Uint8Array;
  let expected: Uint8Array;
  try {
    salt = b64urlDecode(parts[2]!);
    expected = b64urlDecode(parts[3]!);
  } catch {
    return false;
  }
  const actual = await pbkdf2(password, salt, iterations);
  return constantTimeEqual(actual, expected);
}

export interface JwtPayload {
  sub: string;
  role: 'admin' | 'normal';
  name: string;
  iat: number;
  exp: number;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  const bytes = new TextEncoder().encode(secret);
  if (bytes.length < JWT_HS256_MIN_SECRET_BYTES) {
    throw new Error(`JWT secret must be at least ${JWT_HS256_MIN_SECRET_BYTES} bytes`);
  }
  return crypto.subtle.importKey(
    'raw',
    bytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function signJwt(payload: Omit<JwtPayload, 'iat' | 'exp'>, secret: string, ttlSeconds: number): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const full: JwtPayload = { ...payload, iat: now, exp: now + ttlSeconds };
  const header = b64urlEncodeJson({ alg: JWT_ALG, typ: 'JWT' });
  const body = b64urlEncodeJson(full);
  const signingInput = `${header}.${body}`;
  const key = await hmacKey(secret);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput)));
  return `${signingInput}.${b64urlEncode(sig)}`;
}

export async function verifyJwt(token: string, secret: string): Promise<JwtPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header64, body64, sig64] = parts as [string, string, string];
  let sig: Uint8Array;
  let headerObj: { alg?: string; typ?: string };
  let payload: JwtPayload;
  try {
    sig = b64urlDecode(sig64);
    headerObj = JSON.parse(new TextDecoder().decode(b64urlDecode(header64)));
    payload = JSON.parse(new TextDecoder().decode(b64urlDecode(body64))) as JwtPayload;
  } catch {
    return null;
  }
  if (headerObj.alg !== JWT_ALG || headerObj.typ !== 'JWT') return null;
  const key = await hmacKey(secret);
  const expected = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header64}.${body64}`)),
  );
  if (!constantTimeEqual(sig, expected)) return null;
  if (typeof payload.exp !== 'number' || typeof payload.iat !== 'number') return null;
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) return null;
  if (payload.iat > now + JWT_IAT_SKEW_SECONDS) return null;
  if (payload.role !== 'admin' && payload.role !== 'normal') return null;
  if (typeof payload.sub !== 'string' || payload.sub.length === 0) return null;
  return payload;
}

export function extractBearer(req: Request): string | null {
  const h = req.headers.get('Authorization');
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1]!.trim() : null;
}
