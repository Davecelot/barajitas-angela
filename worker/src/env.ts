export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  ALLOWED_ORIGIN: string;
  JWT_TTL_SECONDS: string;
}

export function ttlSeconds(env: Env): number {
  const n = Number(env.JWT_TTL_SECONDS);
  if (!Number.isInteger(n) || n < 60 || n > 60 * 60 * 24 * 90) return 60 * 60 * 24 * 30;
  return n;
}
