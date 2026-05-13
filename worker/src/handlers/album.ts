import type { Env } from '../env.ts';
import type { JwtPayload } from '../auth.ts';
import { getAlbum, putAlbum } from '../db.ts';

const MAX_BODY_BYTES = 64 * 1024;
const MAX_STICKER_ID_LEN = 64;
const MAX_COLLECTED = 5000;
const MAX_REPEATED_VALUE = 999;

function json(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function isStickerId(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0 && v.length <= MAX_STICKER_ID_LEN;
}

function validateAlbumPayload(body: unknown): { collected: string[]; repeated: Record<string, number> } | null {
  if (typeof body !== 'object' || body === null) return null;
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.collected)) return null;
  if (b.collected.length > MAX_COLLECTED) return null;
  const collected: string[] = [];
  const seen = new Set<string>();
  for (const item of b.collected) {
    if (!isStickerId(item)) return null;
    if (seen.has(item)) continue;
    seen.add(item);
    collected.push(item);
  }
  if (typeof b.repeated !== 'object' || b.repeated === null || Array.isArray(b.repeated)) return null;
  const repeatedIn = b.repeated as Record<string, unknown>;
  const repeated: Record<string, number> = {};
  let repeatedKeys = 0;
  for (const [k, v] of Object.entries(repeatedIn)) {
    repeatedKeys++;
    if (repeatedKeys > MAX_COLLECTED) return null;
    if (!isStickerId(k)) return null;
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > MAX_REPEATED_VALUE) return null;
    if (v > 0) repeated[k] = v;
  }
  return { collected, repeated };
}

export async function handleGetAlbum(_req: Request, env: Env): Promise<Response> {
  const row = await getAlbum(env);
  let collected: unknown;
  let repeated: unknown;
  try {
    collected = JSON.parse(row.collected_json);
    repeated = JSON.parse(row.repeated_json);
  } catch {
    return json(500, { error: 'corrupt_state' });
  }
  return json(200, {
    collected,
    repeated,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  });
}

export async function handlePutAlbum(req: Request, env: Env, user: JwtPayload): Promise<Response> {
  if (user.role !== 'admin') return json(403, { error: 'forbidden' });

  let raw: unknown;
  try {
    const buf = await req.arrayBuffer();
    if (buf.byteLength > MAX_BODY_BYTES) return json(413, { error: 'payload_too_large' });
    raw = JSON.parse(new TextDecoder().decode(buf));
  } catch {
    return json(400, { error: 'invalid_json' });
  }
  const validated = validateAlbumPayload(raw);
  if (!validated) return json(400, { error: 'invalid_payload' });

  const collectedJson = JSON.stringify(validated.collected);
  const repeatedJson = JSON.stringify(validated.repeated);
  if (collectedJson.length + repeatedJson.length > MAX_BODY_BYTES) {
    return json(413, { error: 'payload_too_large' });
  }
  const updatedAt = await putAlbum(env, collectedJson, repeatedJson, user.sub);
  return json(200, { ok: true, updatedAt });
}
