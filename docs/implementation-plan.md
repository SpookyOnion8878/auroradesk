# Implementation Plan — AuroraDesk

> Kompas Stage 14-16: Milestones, dependency map, vertical slices, task breakdown (tasks/backlog.md).

---

## 1. Strategi: Vertical Slices

Urutan membangun per **fitur yang bisa diamati** (bukan per layer), dimulai dari slice paling berisiko (DB+domain) lalu merambat ke UI:

```
Slice A  Domain + DB + API (clients)     → bisa: curl /api/clients
Slice B  Domain + DB + API (orders+status)→ bisa: curl /api/orders, transisi status
Slice C  App shell + Clients page (CRUD)  → bisa: tambah/edit/hapus klien via UI
Slice D  Orders page (CRUD + advance)     → bisa: alur status penuh via UI
Slice E  Dashboard + Analytics (nyata)    → bisa: KPI/chart dari data
Slice F  Polish (empty/skeleton/responsive/toast/export CSV/drawer)
Slice G  Test, build, smoke, release lokal
```

## 2. Milestones & Acceptance

| Milestone | Isi                            | Definition of done                                                          |
| --------- | ------------------------------ | --------------------------------------------------------------------------- |
| M0        | Scaffold (Stage 17)            | `npm run dev` jalan; typecheck hijau; Tailwind v4 + shadcn-svelte terpasang |
| M1        | Slice A+B: domain, DB, API     | Semua endpoint api-spec berfungsi (diuji via curl); unit test domain hijau  |
| M2        | Slice C+D: Clients & Orders UI | US-02..US-10 lolos checklist                                                |
| M3        | Slice E: Dashboard & Analytics | US-01, US-11 lolos; 0 angka hardcoded                                       |
| M4        | Slice F+G: polish + rilis      | US-12..US-14; `npm run build` + smoke test; checklist Stage 20              |

## 3. Dependency Map

```
M0 (scaffold)
 └─ M1: domain/schemas ← domain/status-machine ← db schema → repos → api routes
      └─ M2: api client ← stores ← components (dialogs/tables) ← pages
           └─ M3: stats.ts (domain) ← charts (echarts) ← dashboard/analytics pages
                └─ M4: export CSV, drawer, responsive, QA, release
```

Risiko urutan: DB layer adalah risiko teknis tertinggi (better-sqlite3 native) → di-slice paling awal (M1) agar failure cepat terdeteksi.

## 4. Risk Register (update dari brief)

| Risiko                                        | Prob   | Dampak      | Mitigasi                                                                   |
| --------------------------------------------- | ------ | ----------- | -------------------------------------------------------------------------- |
| better-sqlite3 gagal install (Windows/native) | Sedang | Block M1    | Fallback `node:sqlite` (Node ≥22); ADR-0002 sudah mencatatnya              |
| shadcn-svelte + Tailwind v4 konflik versi     | Sedang | Block M0    | Pin versi; dokumentasi di README; fallback komponen manual (button/dialog) |
| ECharts bundle besar                          | Rendah | Lazy load   | dynamic import halaman analytics                                           |
| Scope creep (AI chat, import CSV)             | Sedang | Delay rilis | Backlog eksplisit; gate M3/M4                                              |

## 5. Estimasi (kasar, per task di backlog)

| Task                                    | Estimasi relatif | Dependensi |
| --------------------------------------- | ---------------- | ---------- |
| T-01 scaffold + deps                    | S                | —          |
| T-02 domain types/schemas/money         | S                | T-01       |
| T-03 status machine                     | S                | T-02       |
| T-04 db init + migrasi                  | M                | T-01       |
| T-05 repos clients/orders + mappers     | M                | T-03, T-04 |
| T-06 api routes clients                 | M                | T-05       |
| T-07 api routes orders + status/history | M                | T-05       |
| T-08 api client + stores                | M                | T-06/07    |
| T-09 app shell (layout, nav)            | M                | T-01       |
| T-10 clients page (tabel/filter/dialog) | L                | T-08, T-09 |
| T-11 orders page (tabel/advance)        | L                | T-08, T-09 |
| T-12 stats + dashboard                  | M                | T-08       |
| T-13 analytics + charts                 | L                | T-12       |
| T-14 export CSV + drawer + polish       | M                | T-10/11    |
| T-15 tests + QA + release               | M                | semua      |

## 6. Rilis & Checkpoint

- Checkpoint 1 (akhir M1): demo API via curl — gate sebelum UI dibangun.
- Checkpoint 2 (akhir M2): demo CRUD + status flow — gate sebelum dashboard.
- Rilis v1.0 (akhir M4): `npm run build`, `npm run preview`, checklist UAT (Stage 20).
- Setelah rilis: iterasi berikutnya dari backlog (PRD §5) + observability (Stage 22).
