-- Initial schema for barajitas-api.
-- Apply with: npx wrangler d1 migrations apply barajitas-db --local
--             npx wrangler d1 migrations apply barajitas-db --remote

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'normal'))
);

CREATE TABLE IF NOT EXISTS album_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  collected_json TEXT NOT NULL DEFAULT '[]',
  repeated_json TEXT NOT NULL DEFAULT '{}',
  updated_at INTEGER NOT NULL,
  updated_by TEXT
);

INSERT OR IGNORE INTO album_state (id, collected_json, repeated_json, updated_at)
  VALUES (1, '[]', '{}', CAST(strftime('%s', 'now') AS INTEGER));
