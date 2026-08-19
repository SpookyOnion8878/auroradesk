# PRD — AuroraDesk

> Kompas Stage 04-05: Requirements, scope, user stories, acceptance criteria.
> Status: v1.0 — hasil dari gate approval project-brief (Stage 01-03).

---

## 1. Ringkasan Produk

Aplikasi web lokal untuk pemilik toko (single user) mengelola klien dan pesanan:
CRUD penuh, alur status pesanan, dan analitik akurat yang dihitung dari data nyata.
UI English, dark glassmorphism, stack Svelte 5 + SvelteKit + SQLite.

## 2. User Stories & Acceptance Criteria

> Format: `US-x` — Story → Acceptance criteria (Gherkin ringkas). "MUST" = blocker MVP.

### US-01 — Melihat ringkasan bisnis (Dashboard) — MUST

Sebagai pemilik toko, saya ingin melihat KPI utama (revenue total, jumlah order, jumlah klien, klien VIP) dan distribusi status order dalam satu layar.

- [ ] Diberi data klien & order, dashboard menampilkan 4 KPI card yang dihitung dari data (bukan konstanta).
- [ ] Donut chart distribusi status order memakai data nyata; jika tidak ada order → empty state "No orders yet".
- [ ] Bar chart top 5 klien (jumlah order) memakai data nyata.
- [ ] Daftar 5 order terbaru & 5 klien teratas dengan status badge.
- [ ] Semua nilai uang memakai format `Intl.NumberFormat` (USD).

### US-02 — Menambah klien — MUST

- [ ] Form modal "Add Client" dengan field: Name*, Email*, Phone*, Company*, Status (active/inactive/vip).
- [ ] Validasi: email format valid, semua required terisi → tombol disabled + error inline.
- [ ] Submit sukses → toast success, modal tertutup, list ter-refresh, data tersimpan di SQLite.
- [ ] Submit gagal (server) → toast error dengan pesan dari server; modal tetap terbuka, input tidak hilang.
- [ ] Double-submit dicegah (button disabled selama request).

### US-03 — Mengedit klien — MUST

- [ ] Row action "Edit" membuka form yang sudah terisi data klien.
- [ ] Simpan → data ter-update di DB + list + KPI dashboard.

### US-04 — Menghapus klien — MUST

- [ ] Row action "Delete" → dialog konfirmasi.
- [ ] Jika klien memiliki order → operasi ditolak server, toast menampilkan jumlah order terkait (FK RESTRICT).
- [ ] Jika tidak punya order → terhapus, list ter-refresh.

### US-05 — Mencari & memfilter klien — MUST

- [ ] Search field: filter by name/email/company (case-insensitive).
- [ ] Filter chip status: All / Active / Inactive / VIP.
- [ ] Kombinasi search+filter bekerja; ada tombol "Clear".
- [ ] Tabel kosong → empty state "No clients found".

### US-06 — Menambah order — MUST

- [ ] Form modal "Add Order": Order ID* (auto-generate `ORD-YYYY-NNN` saat dibuka, bisa diedit), Product/Service*, Client* (dropdown dari data klien — pakai client id), Amount* (number > 0), Status* (6 status), Date (default hari ini).
- [ ] Client dropdown menampilkan nama klien; value yang disimpan adalah `client_id`.
- [ ] Validasi & perilaku submit sama dengan US-02.

### US-07 — Mengedit order — MUST

- [ ] Edit semua field kecuali riwayat status; riwayat status tidak berubah saat edit non-status.
- [ ] Perubahan status mencatat entri baru ke history (bukan menimpa).

### US-08 — Menghapus order — MUST

- [ ] Konfirmasi dialog; hapus order + history-nya (cascade), toast success.

### US-09 — Alur status order — MUST

- [ ] Row action "Advance" hanya menampilkan status legal berikutnya (pending→confirmed→processing→shipped→delivered; cancelled dari pending/confirmed/processing/shipped).
- [ ] Klik Advance → status berubah + history tercatat (timestamp).
- [ ] Status `delivered` dan `cancelled` tidak punya status lanjutan (tombol hilang).
- [ ] Status badge memakai warna konsisten dari satu sumber (domain).

### US-10 — Mencari & memfilter order — MUST

- [ ] Search by Order ID / product / client name.
- [ ] Filter chips 6 status + All.
- [ ] Kolom bisa di-sort (Order ID, Amount, Date, Status) dengan indikator arah.
- [ ] Tabel kosong → empty state.

### US-11 — Analitik — MUST

- [ ] Revenue timeline dihitung dari `order_date` order nyata (bukan konstanta), grup per bulan, periode: 30d / 90d / 12m / All.
- [ ] KPI: Total Revenue, Avg Order Value, Active Clients, VIP Clients — dari data.
- [ ] Donut distribusi status + bar chart top 8 klien.
- [ ] Growth metrics: VIP conversion %, Completion rate %, Avg revenue/client — semua guard division-by-zero (0 saat tidak ada data).
- [ ] Jika dataset kosong → empty state, tidak ada NaN/Infinity di UI.

### US-12 — Responsive & empty states — MUST

- [ ] Tabel berubah menjadi kartu pada layar < 768px.
- [ ] Semua view memiliki skeleton loading saat data diambil.
- [ ] Semua view memiliki empty state dengan CTA.

### US-13 — Export CSV — SHOULD

- [ ] Tombol export di halaman Clients & Orders → file CSV (papaparse/serupa) ber-timestamp.
- [ ] Export memakai data yang sedang ter-filter (yang terlihat).

### US-14 — Detail klien (drawer) — SHOULD

- [ ] Row action "View" membuka drawer: info kontak + daftar order klien tersebut + total spend + LTV.

### US-15 — Command palette — COULD

- [ ] `Ctrl+K`: navigasi view, cari klien/order, aksi cepat "Add Client"/"Add Order".

### US-16 — Import CSV — COULD (backlog)

- [ ] Upload → map kolom → preview → simpan batch.

## 3. Non-Functional Requirements

| #     | Kategori        | Requirement                                                                                      |
| ----- | --------------- | ------------------------------------------------------------------------------------------------ |
| NFR-1 | Reliability     | Semua query DB menggunakan prepared statements; migrasi schema otomatis saat startup             |
| NFR-2 | Performance     | Data < 10k baris dimuat penuh saat startup; render tabel tanpa virtualisasi dulu (batas 10k)     |
| NFR-3 | Testability     | Domain logic (status machine, stats, money) = pure functions, wajib unit-test                    |
| NFR-4 | Type safety     | Typecheck `tsc --noEmit` hijau; zod schema sebagai single source of validation (server + client) |
| NFR-5 | Accessibility   | Keyboard navigable, focus states jelas, kontras AA, `prefers-reduced-motion` dihormati           |
| NFR-6 | Maintainability | Komponen UI hanya lewat `$lib/components/ui/*` (shadcn-svelte) + `$lib/components/*` (domain UI) |
| NFR-7 | Data safety     | Hard delete klien diblokir jika punya order; order history immutable                             |
| NFR-8 | Build           | `npm run build` + `npm run preview` bekerja dari clean checkout                                  |

## 4. Scope MVP (MoSCoW)

| Prioritas       | Fitur                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Must**        | US-01 s/d US-12: Dashboard, CRUD klien & order, alur status + history, search/filter/sort, analitik nyata, empty/loading states, responsive |
| **Should**      | US-13 Export CSV, US-14 Detail drawer klien                                                                                                 |
| **Could**       | US-15 Command palette, US-16 Import CSV, toggle tema (dark default), auto-refresh 60s                                                       |
| **Won't (now)** | Auth, multi-user, AI chat (backlog: butuh keputusan provider LLM), Taskade sync, inventory, payments, i18n, PWA                             |

## 5. Backlog (ditunda secara eksplisit)

1. **AI chat assistant** — butuh keputusan provider LLM + key management (tidak masuk MVP).
2. **Import CSV** (US-16).
3. **Command palette** (US-15).
4. **Pagination server-side** — baru perlu bila > 10k baris.
5. **Migrasi data dari app React/Taskade** — export CSV dari app lama sebagai jembatan.
6. **Line items per order** (produk + qty + harga per item).
7. **Deployment non-lokal** (adapter-node siap; tinggal hosting).

## 6. Out of Scope (eksplisit, tidak akan dikerjakan)

Semua item pada **Won't (now)** di atas; deployment ke Vercel/Netlify (SQLite file tidak cocok — butuh hosting dengan persistent disk).

## 7. Open Questions (status: resolved/assumed)

| Q                                    | Keputusan                                    |
| ------------------------------------ | -------------------------------------------- |
| Import CSV di MVP?                   | **Tidak** (backlog, US-16)                   |
| Line items?                          | **Tidak** — satu nominal per order (backlog) |
| Label/kategori klien di luar status? | **Tidak** untuk MVP                          |
| Direktori project                    | `D:\Projects\auroradesk` (disetujui)         |
| AI chat                              | **Tidak** untuk MVP (backlog #1)             |

## 8. Definition of Done (produk)

- [ ] Semua US MUST + SHOULD lolos acceptance criteria-nya (verifikasi manual checklist).
- [ ] `npm run typecheck` hijau, `npm test` hijau.
- [ ] `npm run build` sukses; `npm run preview` menampilkan semua view dengan data nyata.
- [ ] Tidak ada NaN/Infinity, tidak ada loading yang menggantung, tidak ada angka hardcoded untuk data.
- [ ] Checklist Stage 20 (QA/UAT) terisi dan lolos.
