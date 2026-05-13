import type { Env } from './env.ts';

const ALLOWED_METHODS = 'GET, POST, PUT, OPTIONS';
const ALLOWED_HEADERS = 'Authorization, Content-Type';
const MAX_AGE = '600';

function isConfiguredOrigin(allowed: string): boolean {
  // Fail closed on unsafe/unset values.
  if (!allowed) return false;
  if (allowed === '*' || allowed === 'null') return false;
  if (allowed.includes('example.')) return false;
  if (!/^https:\/\/[^\s/]+$/.test(allowed)) return false;
  return true;
}

function isAllowedOrigin(reqOrigin: string | null, allowed: string): boolean {
  if (!reqOrigin) return false;
  if (!isConfiguredOrigin(allowed)) return false;
  return reqOrigin === allowed;
}

export function corsHeaders(req: Request, env: Env): Headers {
  const headers = new Headers();
  // Always advertise Vary: Origin to prevent intermediary cache poisoning.
  headers.set('Vary', 'Origin');
  const origin = req.headers.get('Origin');
  if (isAllowedOrigin(origin, env.ALLOWED_ORIGIN)) {
    headers.set('Access-Control-Allow-Origin', origin!);
  }
  headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS);
  headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS);
  headers.set('Access-Control-Max-Age', MAX_AGE);
  return headers;
}

export function preflightResponse(req: Request, env: Env): Response {
  const origin = req.headers.get('Origin');
  if (!isAllowedOrigin(origin, env.ALLOWED_ORIGIN)) {
    return new Response(null, { status: 403 });
  }
  return new Response(null, { status: 204, headers: corsHeaders(req, env) });
}

export function withCors(res: Response, req: Request, env: Env): Response {
  const cors = corsHeaders(req, env);
  const merged = new Headers(res.headers);
  cors.forEach((v, k) => merged.set(k, v));
  return new Response(res.body, { status: res.status, headers: merged });
}
