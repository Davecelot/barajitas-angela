import type { Env } from '../env.ts';
import { ttlSeconds } from '../env.ts';
import { findUserByUsername } from '../db.ts';
import { verifyPassword, signJwt, hashPassword } from '../auth.ts';

// Pre-computed dummy hash used to equalize timing when the user doesn't exist.
// Computation kicks off at module load so the cost is amortized across the
// isolate's lifetime; the first login that misses awaits the same promise.
const DUMMY_HASH_PROMISE: Promise<string> = hashPassword('dummy-equalizer-not-a-real-password');

interface LoginBody {
  username: unknown;
  password: unknown;
}

function badRequest(): Response {
  return new Response(JSON.stringify({ error: 'invalid_request' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}

function unauthorized(): Response {
  return new Response(JSON.stringify({ error: 'invalid_credentials' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function handleLogin(req: Request, env: Env): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', Allow: 'POST' },
    });
  }
  let body: LoginBody;
  try {
    const buf = await req.arrayBuffer();
    if (buf.byteLength > 4096) {
      return new Response(JSON.stringify({ error: 'payload_too_large' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    body = JSON.parse(new TextDecoder().decode(buf)) as LoginBody;
  } catch {
    return badRequest();
  }
  if (
    typeof body !== 'object' ||
    body === null ||
    typeof body.username !== 'string' ||
    typeof body.password !== 'string' ||
    body.username.length === 0 ||
    body.username.length > 64 ||
    body.password.length === 0 ||
    body.password.length > 256
  ) {
    return badRequest();
  }

  const user = await findUserByUsername(env, body.username);

  if (!user) {
    // Run PBKDF2 against a dummy hash to keep timing similar to the user-found path.
    await verifyPassword(body.password, await DUMMY_HASH_PROMISE);
    return unauthorized();
  }

  const ok = await verifyPassword(body.password, user.password_hash);
  if (!ok) return unauthorized();

  const token = await signJwt(
    { sub: user.id, role: user.role, name: user.name },
    env.JWT_SECRET,
    ttlSeconds(env),
  );

  return new Response(
    JSON.stringify({ token, user: { id: user.id, name: user.name, role: user.role } }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}
