# Task Backlog — AuroraDesk

> Kompas Stage 16: Executable work items. Setiap task: kondisi done eksplisit, dependency, lingkup teriz
> Urutan eksekusi = urutan T-xx. Review diff per task (kontrak AI-assisted development).
> Status: T-01..T-14 SELESAI; T-15 SELESAI (Stage 17-21 selesai, rilis lokal v1.0).

## M0 — Scaffold

### T-01 Scaffold SvelteKit + deps

- **Lingkup:** Project SvelteKit (TS, adapter-node), Tailwind v4 via `@tailwindcss/vite`, shadcn-svelte init, deps: echarts, zod, better-sqlite3, svelte-sonner; npm scripts `dev/build/preview/test/typecheck/db:seed`; git init + .gitignore; README.md.
- **Done:** `npm run typecheck` hijau; `npm run dev` menampilkan halaman index; `npm run build` sukses.

## M1 — Domain + DB + API

### T-02 Domain types, zod schemas, money

- **Lingkup:** `src/lib/domain/types.ts`, `schemas.ts`, `money.ts` (cents ↔ dollars), `errors.ts` (error codes + helper).
- **Done:** `npm test` hijau untuk money (konversi, pembulatan, reject >2 desimal).

### T-03 State machine status order

- **Lingkup:** `src/lib/domain/order-status.ts`: `ORDER_STATUS_FLOW`, `canTransition(from,to)`, `nextStatuses(from)`, label + warna badge.
- **Done:** Unit test: semua transisi legal/ilegal, terminal state tanpa next.

### T-04 Database init + migrasi

- **Lingkup:** `src/lib/server/db.ts` (schema dari data-model.md, PRAGMA FK+WAL, migrasi idempotent), `scripts/seed.ts` (opsional demo data, idempotent).
- **Done:** Seed jalan; schema terverifikasi via `sqlite3` query sederhana; re-run tidak error.

### T-05 Repos + mappers

- **Lingkup:** `repos/clients.ts`, `repos/orders.ts` (create order + history atomic; status transition atomic), `mappers.ts` snake↔camel, update `updated_at`.
- **Done:** Unit test (vitest, DB in-memory `:memory:`): CRUD, RESTRICT delete, cascade history, duplicate order_id error.

### T-06 API routes clients

- **Lingkup:** `GET/POST /api/clients`, `PATCH/DELETE /api/clients/[id]` per api-spec; error mapping.
- **Done:** End-to-end test via route handler test (vitest + SvelteKit `fetch`/`app.test`): 200/201/204/404/409/422.

### T-07 API routes orders + status/history

- **Lingkup:** endpoints api-spec 2.5-2.10; validasi transisi di server.
- **Done:** Test: create (auto order_id), PATCH, DELETE cascade, POST status legal/ilegal (409), history GET.

## M2 — UI Clients & Orders

### T-08 API client + stores

- **Lingkup:** `src/lib/api.ts` (ApiError, request helper), `src/lib/stores/data.svelte.ts` (runes: clients, orders, loading, error, actions CRUD + advance, refresh).
- **Done:** Typecheck; store action memanggil API dan men-update state.

### T-09 App shell

- **Lingkup:** `+layout.svelte` (header: logo, nav 4 tab, Add buttons, refresh), `+layout.ts`/load, Toaster (svelte-sonner), ErrorBoundary, global CSS tokens + tema dark (Tailwind v4 `@theme`).
- **Done:** Navigasi bekerja; loading skeleton di awal; toast terlihat.

### T-10 Clients page

- **Lingkup:** Tabel (sort, search, filter status, empty state), ClientFormDialog (create/edit, RHF-style manual + zod), delete confirm, responsive (kartu di mobile).
- **Done:** US-02..05, US-12 lolos checklist manual.

### T-11 Orders page

- **Lingkup:** Tabel (sort/search/filter/advance menu), OrderFormDialog (auto order_id, dropdown client by id), delete confirm, responsive.
- **Done:** US-06..10 lolos checklist manual.

## M3 — Dashboard & Analytics

### T-12 Stats + Dashboard

- **Lingkup:** `src/lib/domain/stats.ts` (KPI, distribusi status, top clients, recent), halaman /dashboard (KPI cards, donut ECharts, bar chart, daftar recent), empty states.
- **Done:** US-01 lolos; unit test stats (termasuk dataset kosong, division by zero).

### T-13 Analytics + charts

- **Lingkup:** `stats.ts` tambah revenue timeline (periode 30d/90d/12m/All, grup bulan), growth metrics; halaman /analytics dengan ECharts wrapper component (dynamic import).
- **Done:** US-11 lolos; 0 konstanta data; test timeline (bulan kosong = 0, bukan hilang).

## M4 — Polish & Release

### T-14 Export CSV + client drawer + polish

- **Lingkup:** Export ter-filter (clients & orders) via papaparse/simple CSV builder; ClientDrawer (info + order list + totals); polish responsive/a11y (focus, aria, reduced-motion).
- **Done:** US-13, US-14 lolos.

### T-15 QA, build, smoke, release v1.0

- **Lingkup:** Checklist Stage 20 (unit+API test, UAT manual, rollback = git revert), `npm run build` + `npm run preview` + smoke test endpoints & halaman, README update (cara jalan/backup), catatan observability.
- **Done:** Checklist lengkap; build produksi jalan; smoke test lolos.
- **VERIFIED:** `npm test` 61/61 (3x stabil — akar masalah DB file: env `DB_PATH` diset di setup file karena import ES di-hoist); `npm run check` 0 error; `npm run lint` clean; build sukses; smoke test produksi: CRUD, cents, transisi status legal/ilegal 409, delete ber-order 409, dup orderId 409, seed idempoten, redirect `/`→/dashboard, semua halaman 200.

## Backlog (diluar MVP — PRD §5)

- B-01 AI chat assistant (perlu keputusan provider LLM)
- B-02 Import CSV (US-16)
- B-03 Command palette Ctrl+K (US-15)
- B-04 Pagination server-side (>10k baris)
- B-05 Migrasi data dari app React/Taskade (via CSV)
- B-06 Line items per order
- B-07 Hosting non-lokal (auth + HTTPS + backup)
