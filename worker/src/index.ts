import type { Env } from './env.ts';
import { preflightResponse, withCors } from './cors.ts';
import { handleLogin } from './handlers/login.ts';
import { handleGetAlbum, handlePutAlbum } from './handlers/album.ts';
import { extractBearer, verifyJwt } from './auth.ts';

function notFound(): Response {
  return new Response(JSON.stringify({ error: 'not_found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}

function unauthorized(): Response {
  return new Response(JSON.stringify({ error: 'unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function requireAuth(req: Request, env: Env) {
  const token = extractBearer(req);
  if (!token) return null;
  return verifyJwt(token, env.JWT_SECRET);
}

async function route(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path === '/api/login') return handleLogin(req, env);

  if (path === '/api/album') {
    if (req.method === 'GET') return handleGetAlbum(req, env);
    if (req.method === 'PUT') {
      const user = await requireAuth(req, env);
      if (!user) return unauthorized();
      return handlePutAlbum(req, env, user);
    }
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', Allow: 'GET, PUT' },
    });
  }

  if (path === '/api/health') {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return notFound();
}

function harden(res: Response): Response {
  const headers = new Headers(res.headers);
  if (!headers.has('Cache-Control')) headers.set('Cache-Control', 'no-store');
  if (!headers.has('X-Content-Type-Options')) headers.set('X-Content-Type-Options', 'nosniff');
  if (!headers.has('Referrer-Policy')) headers.set('Referrer-Policy', 'no-referrer');
  return new Response(res.body, { status: res.status, headers });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    try {
      if (req.method === 'OPTIONS') return preflightResponse(req, env);
      const res = await route(req, env);
      return harden(withCors(res, req, env));
    } catch (err) {
      // Never leak internals to the client.
      console.error('unhandled', err);
      return harden(withCors(
        new Response(JSON.stringify({ error: 'internal_error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }),
        req,
        env,
      ));
    }
  },
} satisfies ExportedHandler<Env>;
