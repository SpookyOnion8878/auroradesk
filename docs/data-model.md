# Data Model — AuroraDesk

> Kompas Stage 11: Entities, relationships, constraints, lifecycle. Implementasi: SQLite (ADR-0002).

---

## 1. Conceptual Model

```
Client 1 ────< Order >──── 1 OrderStatusHistory
(id)           (id)          (id, immutable, append-only)
```

- Client memiliki banyak Order (FK `orders.client_id → clients.id`, ON DELETE RESTRICT).
- Order memiliki banyak OrderStatusHistory (FK, ON DELETE CASCADE).
- Order bisa tanpa history hanya pada saat baru dibuat (history baris pertama ditulis bersamaan).

## 2. Skema SQLite

```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS clients (
  id          TEXT PRIMARY KEY,            -- ulid/nanoid
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
  id          TEXT PRIMARY KEY,
  order_id    TEXT NOT NULL UNIQUE CHECK (length(order_id) BETWEEN 1 AND 60),
  title       TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 300),
  client_id   TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
  order_date  TEXT NOT NULL,               -- ISO date 'YYYY-MM-DD' (bukan datetime)
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
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
```

## 3. Aturan & Invariant (business rules)

| #    | Aturan                                                                 | Enforcement                                                |
| ---- | ---------------------------------------------------------------------- | ---------------------------------------------------------- |
| BR-1 | Status order harus salah satu dari 6 nilai legal                       | CHECK constraint + zod                                     |
| BR-2 | Transisi status hanya mengikuti state machine (domain/order-status.ts) | **Server** (route) + UI menyembunyikan transisi ilegal     |
| BR-3 | History status immutable — tidak ada UPDATE/DELETE                     | Tidak ada API untuk mutasi history                         |
| BR-4 | Hapus klien diblokir jika masih memiliki order                         | FK `ON DELETE RESTRICT` → 409 HAS_ORDERS                   |
| BR-5 | Hapus order menghapus history-nya                                      | FK `ON DELETE CASCADE` (history tidak berguna tanpa order) |
| BR-6 | `amount` disimpan sebagai integer cents — tidak pernah float           | Kolom INTEGER + konversi di domain/money.ts                |
| BR-7 | `order_id` (mis. ORD-2026-001) unik                                    | UNIQUE constraint → 409 DUPLICATE_ORDER_ID                 |
| BR-8 | `updated_at` di-update pada setiap mutasi                              | Trigger/`UPDATE ... SET updated_at` di repo                |
| BR-9 | Order baru selalu menulis history baris pertama (status awal)          | Transaksi di repo `createOrder`                            |

## 4. Tipe Domain (TS, mirror dari schema)

```ts
// src/lib/domain/types.ts
export type ClientStatus = 'active' | 'inactive' | 'vip';
export type OrderStatus =
	'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Client {
	id: string;
	name: string;
	email: string;
	phone: string;
	company: string;
	status: ClientStatus;
	createdAt: string;
	updatedAt: string;
}

export interface Order {
	id: string;
	orderId: string;
	title: string;
	clientId: string;
	clientName?: string; // join untuk UI
	amountCents: number;
	status: OrderStatus;
	orderDate: string; // 'YYYY-MM-DD'
	createdAt: string;
	updatedAt: string;
}

export interface OrderStatusHistoryEntry {
	id: string;
	orderId: string;
	status: OrderStatus;
	changedAt: string;
}
```

- Konversi DB ↔ domain di `src/lib/server/repos/mappers.ts` (snake_case ↔ camelCase).
- UI meminta `GET /api/orders` → respons menyertakan `clientName` (LEFT JOIN) — kolom denormalisasi untuk tampilan, tanpa menyimpan duplikat.
- Order tanpa client (seharusnya tidak mungkin karena FK) → mapper set `clientName: null`, UI tampilkan "—".

## 5. Lifecycle & Data Retention

- **Klien:** create → update (soft fields) → delete (hard, hanya jika tanpa order). Tidak ada soft delete di MVP.
- **Order:** create (history awal ditulis) → update non-status → status transition (history append) → delete (hard + cascade history).
- **Retensi:** data disimpan selama file `.db` ada; backup manual dengan menyalin file; tidak ada data PII tambahan di luar field yang diinput user.
- **Migrasi:** schema di-migrasi via `CREATE TABLE IF NOT EXISTS` saat server start (v1). Untuk perubahan schema berikutnya: folder `migrations/` dengan versi + `PRAGMA user_version` (dokumentasi, implementasi bila diperlukan).

## 6. Pilihan ID

- `id` entity: **nanoid** (string, compact, tidak perlu library besar — implementasi ~20 baris) atau `crypto.randomUUID()`. Keputusan implementasi: `crypto.randomUUID()` (standar Node, tanpa dependency).
- `order_id` (business key, tampil ke user): di-generate server saat create jika kosong: `ORD-{YYYY}-{3 digit sequential/hash}`; fallback: hash timestamp.
