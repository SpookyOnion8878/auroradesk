# User Flows — AuroraDesk

> Kompas Stage 06: Critical workflows — happy path, alternative/error path, state transitions.
> Mengacu: PRD US-01..US-14. Label UI dalam English (keputusan C4).

---

## 1. Sitemap & Navigation (IA — Stage 07)

```
App Shell (sidebar atas, sticky)
├── Dashboard      (/dashboard)     — KPI + charts + recent lists
├── Analytics      (/analytics)     — timeline revenue + funnel + growth metrics
├── Clients        (/clients)       — tabel CRUD + search/filter
└── Orders         (/orders)        — tabel CRUD + search/filter + advance status

Global (di header):
├── [Add Client]  → modal ClientFormDialog (create)
├── [Add Order]   → modal OrderFormDialog (create)
└── [Refresh]     → reload data
```

Navigasi: tab di header (desktop & mobile horizontal scroll). Tidak ada nesting.

## 2. US-02 — Add Client (happy path)

```
1. User klik [Add Client]              → modal terbuka (form kosong, focus ke Name)
2. User isi Name, Email, Phone, Company, pilih Status
3. User klik [Add Client] (submit)
   ├─ validasi client (zod) ✗          → error inline per field; fokus field pertama error; form tetap
   └─ validasi ✓ → POST /api/clients
       ├─ 201 ✓ → toast "Client added" → modal tutup → reload list & KPI
       └─ 4xx/5xx → toast error (pesan server) → modal tetap, input utuh
```

**Error paths:**

- Server down / network: toast "Network error — please retry"; tombol submit aktif kembali.
- Double click: tombol disabled (`submitting` state).
- Duplicate email: server `422 EMAIL_EXISTS` (jika diimplementasikan) → toast + field email ditandai.

## 3. US-06 — Add Order

```
1. Klik [Add Order] → modal; Order ID auto-fill "ORD-<year>-<random 3 digit>" (editable)
2. Pilih Client dari dropdown (value = client.id, label = client.name)
3. Isi Product/Service, Amount (number > 0), Status (default pending), Date (default today)
4. Submit → validasi → POST /api/orders
   ✓ → toast "Order added" → modal tutup → reload
   ✗ client tidak ada (deleted) → dropdown kosong → disabled submit + hint "Add a client first"
```

## 4. US-09 — Advance Order Status (state machine)

```
Transisi legal (ORDER_STATUS_FLOW di domain):

pending ──► confirmed ──► processing ──► shipped ──► delivered
   │            │             │            │
   └────┬───────┴───────┬─────┴─────┬──────┘
        ▼               ▼           ▼
     cancelled (dari pending/confirmed/processing/shipped)
     delivered & cancelled = terminal (tidak ada tombol Advance)

Flow:
1. Row Orders → klik "Advance" (icon/chevron) pada order berstatus non-terminal
2. Dropdown/list status legal → pilih satu
3. PATCH /api/orders/[id]/status { status }
   → server validasi transisi (state machine di server juga!)
   → insert history {order_id, status, changed_at}
   → 200 → toast "Order moved to Shipped" → list & KPI ter-refresh
4. Kalau transisi ilegal (data stale) → 409 CONFLICT → toast error + reload list
```

**Aturan:** server adalah otoritas state machine. UI hanya menyembunyikan transisi ilegal; server menolak transisi ilegal (defense in depth).

## 5. US-03/US-04 — Edit & Delete Client

```
Edit:
1. Row → ⋮ → Edit → modal terisi (GET data dari state lokal)
2. Ubah → PATCH /api/clients/[id] → 200 → toast → reload

Delete:
1. Row → ⋮ → Delete → AlertDialog konfirmasi ("Delete this client? This cannot be undone.")
2. Konfirmasi → DELETE /api/clients/[id]
   ├─ 204 ✓ → toast "Client deleted" → reload
   ├─ 409 HAS_ORDERS → toast "Cannot delete: N order(s) still reference this client" (blokir)
   └─ 404 → toast "Client not found" → reload
```

## 6. US-05/US-10 — Search, Filter, Sort

```
State lokal per halaman: searchText, statusFilter, sortKey, sortDir
1. Ketik search (case-insensitive, name/email/company atau orderId/title/clientName)
2. Klik filter chip status (tunggal, bisa dikombinasi dengan search)
3. Klik header kolom → toggle sort ASC/DESC; ikon panah menampilkan arah
4. "Showing X of Y" + tombol Clear saat filter aktif
5. Hasil kosong → Empty state (ikon + pesan + tombol reset filter)
```

## 7. US-14 — Client Detail Drawer

```
1. Row → ⋮ → View (atau klik nama) → drawer (Sheet) dari kanan
2. Konten: nama, status badge, email (mailto), phone (tel), company,
   statistik (total orders, total spend), tabel order milik klien (filter lokal)
3. [Edit] di drawer membuka form edit; [Close] menutup drawer
```

## 8. US-01/US-11 — Dashboard & Analytics (read-only)

```
1. Buka /dashboard → store global sudah memuat clients + orders (load di root layout)
2. Semua KPI & chart dihitung dari data via domain/stats (pure function)
3. Tidak ada data → Empty state dengan CTA "Add your first client / order"
4. Analytics: pilih periode (30d/90d/12m/All) → timeline revenue dihitung ulang
5. Refresh: klik [Refresh] atau auto 60s (Could) → refetch GET /api/clients + /api/orders
```

## 9. Edge Cases (inventaris, wajib ditangani)

| Edge case                              | Penanganan                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------------------- |
| Dataset kosong (first run)             | Empty state + CTA di setiap view                                                            |
| clients.length = 0 saat buka Add Order | Dropdown kosong; tombol submit disabled; hint "Add a client first"                          |
| Order tanpa client valid (data lama)   | Tampilkan "—" + tombol "Fix: assign client" (opsional, MVP: tampilkan saja)                 |
| Delete klien ber-order                 | Blokir server (409) + pesan jumlah order                                                    |
| Amount 0 / negatif / "abc"             | Validasi zod: number, > 0; error inline                                                     |
| Tanggal invalid                        | Server clamp ke hari ini / 400 VALIDATION; UI input type="date"                             |
| Transisi status stale (2 tab)          | 409 → reload + toast                                                                        |
| Server tidak hidup                     | Fetch wrapper → error terpusat → toast + state "load failed" dengan tombol Retry            |
| Nama klien duplikat                    | Diizinkan (tidak ada unique constraint) — dropdown menampilkan nama + email sebagai pembeda |

## 10. Flow Diagram (ringkas)

```
[App boots] → root layout load() → GET /api/clients & /api/orders
   → stores.$state terisi → semua view render dari store (satu sumber data)
   → mutasi apa pun → POST/PATCH/DELETE → success → refetch (GET) → store update
```

Semua mutasi mengikuti pola: **optimistic = tidak dipakai**; **pessimistic (wait server) → refetch penuh** — karena dataset kecil, refetch penuh lebih sederhana & konsisten daripada patch lokal.
