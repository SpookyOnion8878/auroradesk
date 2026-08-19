# API Spec — AuroraDesk

> Kompas Stage 12: Interface contracts antara client (SvelteKit pages) dan server (routes `/api/**`).
> Semua endpoint same-origin, JSON, no auth (C3). Base URL: `/api`.

---

## 1. Konvensi Umum

### 1.1 Format respons

```jsonc
// Sukses
{ "data": ... }

// Error (selalu)
{ "error": { "code": "VALIDATION_ERROR", "message": "Amount must be a positive number", "details": { "amount": "..." } } }
```

### 1.2 Status codes

| Kode | Pemakaian                                                                          |
| ---- | ---------------------------------------------------------------------------------- |
| 200  | GET/PATCH sukses                                                                   |
| 201  | POST create sukses                                                                 |
| 204  | DELETE sukses                                                                      |
| 400  | Body/query tidak valid secara sintaksis JSON atau format (bukan validation schema) |
| 404  | Resource tidak ditemukan                                                           |
| 409  | Konflik bisnis: transisi status ilegal, duplicate order_id, delete klien ber-order |
| 422  | Validasi schema zod gagal (`details` berisi error per field)                       |
| 500  | Error tak terduga (dilog di server; client dapat pesan generik)                    |

### 1.3 Error codes (nilai `code`)

`VALIDATION_ERROR`, `NOT_FOUND`, `ILLEGAL_STATUS_TRANSITION`, `DUPLICATE_ORDER_ID`, `CLIENT_HAS_ORDERS`, `INTERNAL`.

### 1.4 Prinsip

- Idempotent untuk GET/DELETE; POST create tidak idempotent (client wajib mencegah double-submit).
- Semua input divalidasi zod **di server** (otoritas) — validasi client hanya untuk UX.
- Transaksi DB: create order (+ history), status transition (+ history) — atomic.

## 2. Endpoints

### 2.1 `GET /api/clients`

Query params (opsional): `none` — client melakukan filter/sort lokal (ADR-0003).

Respons 200:

```jsonc
{
	"data": [
		{
			"id": "uuid",
			"name": "John Doe",
			"email": "john@x.com",
			"phone": "+1-555-0123",
			"company": "Acme Corp",
			"status": "active",
			"createdAt": "2026-08-18T10:00:00.000Z",
			"updatedAt": "..."
		}
	]
}
```

### 2.2 `POST /api/clients`

Body:

```jsonc
{
	"name": "John Doe",
	"email": "john@x.com",
	"phone": "+1-555-0123",
	"company": "Acme Corp",
	"status": "active"
}
```

- 201 → `{ "data": { ...client } }` | 422 field error | 400 JSON/format salah.

### 2.3 `PATCH /api/clients/[id]`

Body: partial dari 2.2 (semua opsional, minimal satu field).

- 200 → `{ "data": { ...client } }` | 404 | 422.

### 2.4 `DELETE /api/clients/[id]`

- 204 (kosong) | 404 | **409** `CLIENT_HAS_ORDERS` (message menyertakan jumlah order).

### 2.5 `GET /api/orders`

Respons 200 (order + join nama klien, sortir `orderDate DESC`):

```jsonc
{
	"data": [
		{
			"id": "uuid",
			"orderId": "ORD-2026-001",
			"title": "Premium License",
			"clientId": "uuid",
			"clientName": "John Doe",
			"amountCents": 100000,
			"amount": 1000, // amount = dollars (nyaman untuk form)
			"status": "pending",
			"orderDate": "2026-08-18",
			"createdAt": "...",
			"updatedAt": "..."
		}
	]
}
```

> Catatan: `amountCents` adalah canonical; `amount` (number, dollars, max 2 desimal) disediakan untuk kemudahan tampilan/form. Client tidak boleh mengirim `amountCents` langsung — hanya `amount`.

### 2.6 `POST /api/orders`

Body:

```jsonc
{
	"orderId": "ORD-2026-001", // opsional; kosong → server generate
	"title": "Premium License",
	"clientId": "uuid",
	"amount": 1000, // number > 0, maks 2 desimal
	"status": "pending", // opsional, default 'pending'
	"orderDate": "2026-08-18"
} // opsional, default hari ini (server)
```

- 201 → `{ "data": { ...order } }` | 404 `clientId` tidak ada | 409 duplicate order_id | 422.

### 2.7 `PATCH /api/orders/[id]`

Body: partial dari 2.6 **tanpa** `status` (ubah status via 2.9) — `orderDate`, `amount`, `title`, `orderId`, `clientId`.

- 200 → `{ "data": { ...order } }` | 404 | 409 | 422.
- Mengubah `clientId` diperbolehkan (reassign) — FK validasi.

### 2.8 `DELETE /api/orders/[id]`

- 204 | 404. (Cascade menghapus history.)

### 2.9 `POST /api/orders/[id]/status`

Body: `{ "status": "shipped" }`

- Server memvalidasi transisi dari status saat ini via state machine (BR-2).
- Menulis baris history baru + update `orders.status` dalam satu transaksi.
- 200 → `{ "data": { ...order, history: [...] } }` | 404 | **409** `ILLEGAL_STATUS_TRANSITION` | 422.

### 2.10 `GET /api/orders/[id]/history` (untuk drawer/detail)

- 200 → `{ "data": [ { "id", "orderId", "status", "changedAt" } ] }` (ASC by changedAt) | 404.

## 3. Validasi (zod — referensi skema di domain)

```ts
// src/lib/domain/schemas.ts
const clientSchema = { name: z.string().trim().min(1).max(200),
                       email: z.string().trim().email().max(254),
                       phone: z.string().trim().max(50).default(''),
                       company: z.string().trim().max(200).default(''),
                       status: z.enum(['active','inactive','vip']).default('active') };
const orderInputSchema = { orderId: z.string().trim().min(1).max(60).optional(),
                           title: z.string().trim().min(1).max(300),
                           clientId: z.string().min(1),
                           amount: z.number().positive().max(1e9).refine(v => Number.isFinite(v)),
                           status: z.enum([...]).default('pending'),
                           orderDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() };
const statusTransitionSchema = z.object({ status: z.enum([...]) });
```

## 4. Contoh call dari client (`$lib/api.ts`)

```ts
export class ApiError extends Error {
	constructor(
		public code: string,
		msg: string,
		public status: number,
		public details?: unknown
	) {
		super(msg);
	}
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
	const res = await fetch(`/api${path}`, {
		method,
		headers: { 'Content-Type': 'application/json' },
		body: body === undefined ? undefined : JSON.stringify(body)
	});
	const json = await res.json().catch(() => null);
	if (!res.ok)
		throw new ApiError(
			json?.error?.code ?? 'INTERNAL',
			json?.error?.message ?? `Request failed (${res.status})`,
			res.status,
			json?.error?.details
		);
	return json.data as T;
}
```

## 5. Evolusi Kontrak

- Tidak ada versioning di MVP (single client, same-origin).
- Perubahan breaking pada `{ error }` format → dokumentasikan + bump changelog; client memetakan kode error, bukan teks.
- Backward compat: menambah field ke respons = non-breaking; menambah endpoint = non-breaking; mengubah shape field = breaking → koordinasikan dengan client.
