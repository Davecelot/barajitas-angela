import type { Env } from './env.ts';

export interface UserRow {
  id: string;
  username: string;
  name: string;
  password_hash: string;
  role: 'admin' | 'normal';
}

export interface AlbumRow {
  collected_json: string;
  repeated_json: string;
  updated_at: number;
  updated_by: string | null;
}

export async function findUserByUsername(env: Env, username: string): Promise<UserRow | null> {
  const normalized = username.trim().toLowerCase();
  if (!normalized) return null;
  const row = await env.DB
    .prepare('SELECT id, username, name, password_hash, role FROM users WHERE LOWER(username) = ? LIMIT 1')
    .bind(normalized)
    .first<UserRow>();
  return row ?? null;
}

export async function getAlbum(env: Env): Promise<AlbumRow> {
  const selectSql = 'SELECT collected_json, repeated_json, updated_at, updated_by FROM album_state WHERE id = 1';
  const row = await env.DB.prepare(selectSql).first<AlbumRow>();
  if (row) return row;
  const now = Math.floor(Date.now() / 1000);
  await env.DB
    .prepare('INSERT OR IGNORE INTO album_state (id, collected_json, repeated_json, updated_at) VALUES (1, ?, ?, ?)')
    .bind('[]', '{}', now)
    .run();
  // Re-select to return the authoritative row (handles concurrent first-callers).
  const created = await env.DB.prepare(selectSql).first<AlbumRow>();
  if (created) return created;
  return { collected_json: '[]', repeated_json: '{}', updated_at: now, updated_by: null };
}

export async function putAlbum(
  env: Env,
  collectedJson: string,
  repeatedJson: string,
  updatedBy: string,
): Promise<number> {
  const now = Math.floor(Date.now() / 1000);
  // UPSERT so the write succeeds even if the seed row is missing (defense-in-depth
  // for environments where the migration's INSERT OR IGNORE didn't run).
  await env.DB
    .prepare(
      'INSERT INTO album_state (id, collected_json, repeated_json, updated_at, updated_by) VALUES (1, ?, ?, ?, ?) ' +
        'ON CONFLICT(id) DO UPDATE SET collected_json = excluded.collected_json, repeated_json = excluded.repeated_json, ' +
        'updated_at = excluded.updated_at, updated_by = excluded.updated_by',
    )
    .bind(collectedJson, repeatedJson, now, updatedBy)
    .run();
  return now;
}
