# AuroraDesk

Aplikasi manajemen toko (klien & pesanan) — Svelte 5 + SvelteKit, SQLite (better-sqlite3), Tailwind v4 + shadcn-svelte, ECharts, zod. Dokumentasi lengkap di folder `docs/` (PRD, arsitektur, data model, API spec).

## Fitur

- Klien: CRUD, cari, filter status, sort, hapus (diblokir bila punya pesanan)
- Pesanan: CRUD, nomor order otomatis `ORD-YYYY-NNN`, state machine status (pending → confirmed → processing → shipped → delivered / cancelled), riwayat status append-only
- Dashboard: KPI, distribusi status, top klien
- Analytics: revenue timeline (30d/90d/12m/All), pertumbuhan, retensi
- Export CSV ter-filter, tema gelap/terang, responsif

## Menjalankan

```sh
npm install
npm run dev        # http://localhost:5173
```

## Verifikasi

```sh
npm run check      # svelte-check (0 error)
npm run lint       # eslint + prettier
npm test           # vitest (unit + repo, 61 test)
npm run build      # build produksi (adapter-node → build/)
```

## Produksi & data

```sh
npm run build
node build         # PORT default 5173 (set PORT/ORIGIN bila perlu)
```

- Database SQLite tersimpan di `auroradesk.db` (root project) — otomatis dibuat saat pertama dijalankan; cadangkan file ini.
- Override lokasi DB: `DB_PATH=/path/ke/db.sqlite node build`
- Test memakai database in-memory (lihat `vitest.setup.ts`).

## Seed data demo

`GET /api/dev/seed` — idempotent (lewati bila sudah ada data). Hanya aktif di `npm run dev`; pada build produksi perlu `ALLOW_SEED=1 node build`.
