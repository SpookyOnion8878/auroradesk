# Architecture — AuroraDesk

> Kompas Stage 09-10: Boundaries, components, deployment assumptions. ADR terkait: decisions/ADR-0001..0003.

---

## 1. Architecture Drivers

| Driver                                             | Konsekuensi                                              |
| -------------------------------------------------- | -------------------------------------------------------- |
| D1: Single user, lokal, dataset kecil (<10k baris) | Tidak butuh scaling; satu proses server Node sudah cukup |
| D2: Semua logika bisnis harus testable             | Domain logic = pure functions tanpa I/O                  |
| D3: Data safety (FK, history immutable)            | SQLite dengan FK ON, constraint, transaksi               |
| D4: UI konsisten & cepat dikembangkan              | shadcn-svelte + Tailwind v4 + satu design token          |
| D5: Build & run dari clean checkout                | Config minimal, dependensi stabil, script npm lengkap    |

## 2. Context Diagram

```
┌────────────────────────────────────────────────┐
│  Browser (single user, localhost)              │
│  ┌──────────────────────────────────────────┐  │
│  │ SvelteKit SPA-ish (rendered pages)       │  │
│  │  Pages: /dashboard /analytics            │  │
│  │         /clients /orders                 │  │
│  │  Components: ui/* (shadcn-svelte)        │  │
│  │             + domain components          │  │
│  │  Stores (Svelte 5 runes)                 │  │
│  │  $lib/api (fetch wrapper)                │  │
│  └───────────────┬──────────────────────────┘  │
│                  │ HTTP (same-origin)          │
└──────────────────┼─────────────────────────────┘
                   ▼
        ┌───────────────────────┐
        │ SvelteKit Server      │  (satu proses, adapter-node)
        │  +server.ts API routes│
        │  repos (SQL, prepared)│
        │  zod validation       │
        │  state machine guard  │
        └───────────┬───────────┘
                    ▼
        ┌───────────────────────┐
        │ SQLite (better-sqlite3)│  auroradesk.db (file lokal)
        └───────────────────────┘
```

Tidak ada dependensi eksternal (cloud, API pihak ketiga). AI chat & Taskade sengaja dikecualikan dari MVP (lihat PRD §5).

## 3. Komponen & Tanggung Jawab

| Layer         | Lokasi                                   | Tanggung jawab                                                      | Ketergantungan        |
| ------------- | ---------------------------------------- | ------------------------------------------------------------------- | --------------------- |
| Domain        | `src/lib/domain/*.ts`                    | Types, zod schemas, status machine, stats, money — **pure, no I/O** | zod                   |
| Server DB     | `src/lib/server/db.ts`                   | Open SQLite, migrasi schema saat startup, prepared statements       | better-sqlite3        |
| Repos         | `src/lib/server/repos/*.ts`              | Akses data per entity + validasi domain                             | db, domain            |
| API routes    | `src/routes/api/**/ +server.ts`          | HTTP contract, validasi input (zod), error mapping, transaksi       | repos, domain         |
| API client    | `src/lib/api.ts`                         | fetch wrapper: JSON, error normalisasi (ApiError), timeout          | —                     |
| Stores        | `src/lib/stores/data.svelte.ts`          | `$state` clients/orders/loading/error + action mutasi               | api, domain           |
| UI components | `src/lib/components/`                    | KPI card, StatusBadge, dialogs, drawer, charts, tables              | ui/*, domain, echarts |
| UI primitives | `src/lib/components/ui/*`                | shadcn-svelte (button, dialog, select, table, badge, …)             | —                     |
| Pages         | `src/routes/*/+page.svelte`              | Komposisi, state view lokal (filter/sort)                           | components, stores    |
| Charts        | `src/lib/components/charts/Chart.svelte` | Wrapper ECharts (bind:this, ResizeObserver, dispose)                | echarts               |

## 4. Alur Data (mutasi)

```
Page action → store.action (api call) → server route:
   zod parse body → repo query (transaksi bila perlu) → domain guard (state machine)
   → response JSON {data} | {error:{code,message}}
Client: ApiError → toast; sukses → refetch GET (full) → store update → UI re-render otomatis (runes)
```

Keputusan: **pessimistic + refetch penuh** (dataset kecil) — lihat ADR-0003 & user-flows §10.

## 5. Error Handling & Observability

- Semua route mengembalikan format error standar: `{ error: { code, message, details? } }` (lihat api-spec).
- Client: `ApiError` normalized; komponen `ErrorBoundary` Svelte (bukan per-page crash).
- Server: log via `console.error` + middleware sederhana; `npm run dev` menampilkan semua.
- (Fase lanjut/Stage 22 bila non-lokal: structured logging + metrics — dokumentasi di security/plan.)

## 6. Deployment (asumsi)

- **Sekarang:** lokal — `npm run dev` (dev) / `npm run build && node build` (produksi lokal) dengan `adapter-node`.
- Server bind `127.0.0.1:5173` (dev) / PORT env (build) — lihat security.md.
- Database file: `auroradesk.db` di root project (gitignored); backup = copy file (hot-standby tidak diperlukan single user).
- Node.js ≥ 20 (better-sqlite3 v12 prebuilt).

## 7. Struktur Repo (final)

```
auroradesk/
├── docs/                  # semua artifact Kompas (ini)
├── tasks/                 # backlog executable (Stage 14-16)
├── src/
│   ├── lib/
│   │   ├── domain/        # pure logic (wajib di-test)
│   │   ├── server/        # db + repos (tidak pernah diimport client)
│   │   ├── api.ts         # fetch wrapper client
│   │   ├── stores/        # runes state
│   │   └── components/    # ui/* (shadcn) + domain components + charts/
│   └── routes/
│       ├── +layout.svelte # app shell
│       ├── dashboard/ analytics/ clients/ orders/
│       └── api/**         # +server.ts
├── scripts/               # seed-db, dll.
└── package.json           # scripts: dev/build/preview/test/typecheck/db:seed
```

## 8. ADR Index

| ADR      | Keputusan                                                                                 |
| -------- | ----------------------------------------------------------------------------------------- |
| ADR-0001 | Stack: Svelte 5 + SvelteKit + Tailwind v4 + shadcn-svelte + ECharts + zod (ganti React)   |
| ADR-0002 | SQLite via better-sqlite3, diakses hanya lewat server routes (single process)             |
| ADR-0003 | Analitik dihitung client-side dari full dataset (pure functions), bukan endpoint terpisah |

## 9. Non-Decisions (ditunda)

- ORM (tanpa — SQL langsung via prepared statements, schema kecil).
- Auth (tanpa — PRD Won't; boundary server-client sudah siap jika nanti ditambah).
- Logging framework (console di MVP).
