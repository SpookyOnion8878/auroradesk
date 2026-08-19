import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import Database from 'better-sqlite3';

/** Override via env DB_PATH (misal ':memory:' untuk test). Default: file di root project. */
export const DB_PATH = process.env.DB_PATH || join(process.cwd(), 'auroradesk.db');

if (DB_PATH !== ':memory:') {
	mkdirSync(dirname(DB_PATH), { recursive: true });
}

export const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Migrasi idempotent v1 — skema sesuai docs/data-model.md.
 * Perubahan schema berikutnya: naikkan user_version + block migrasi baru.
 */
db.exec(`
CREATE TABLE IF NOT EXISTS clients (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 200),
  email       TEXT NOT NULL CHECK (email LIKE '%_@_%' AND length(email) <= 254),
  phone       TEXT NOT NULL DEFAULT '',
  company     TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'active'
              CHECK (status IN ('active','inactive','vip')),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id            TEXT PRIMARY KEY,
  order_id      TEXT NOT NULL UNIQUE CHECK (length(order_id) BETWEEN 1 AND 60),
  title         TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 300),
  client_id     TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  amount_cents  INTEGER NOT NULL CHECK (amount_cents > 0),
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
  order_date    TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS order_status_history (
  id          TEXT PRIMARY KEY,
  order_id    TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status      TEXT NOT NULL
              CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
  changed_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_client      ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_status      ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date  ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_created_at  ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_history_order      ON order_status_history(order_id, changed_at);
`);

export function closeDb(): void {
	db.close();
}
