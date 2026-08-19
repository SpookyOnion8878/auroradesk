# ADR-0001 — Stack: Svelte 5 + SvelteKit + Tailwind v4 + shadcn-svelte + ECharts + zod

- **Status:** Accepted
- **Tanggal:** 2026-08-18
- **Konteks:** Project lama adalah React 18 + template Taskade yang (a) tidak bisa di-build (fondasi hilang), (b) 70% kode template tak terpakai, (c) owner bosan dengan React/Next. Dibutuhkan stack modern dengan DX tinggi, bundle kecil, dan ekosistem UI siap pakai.
- **Keputusan:** Rebuild total di Svelte 5 + SvelteKit (adapter-node), Tailwind CSS v4, shadcn-svelte (bits-ui), ECharts untuk chart, zod untuk validasi.
- **Konsekuensi positif:** Runes menggantikan React state/zustand; file-based routing; bundle kecil; transition built-in menggantikan framer-motion; shadcn-svelte menjaga konsistensi komponen; ECharts lebih kuat dari Recharts.
- **Konsekuensi negatif / risiko:** Ekosistem shadcn-svelte lebih muda dari shadcn/ui — mitigasi: pakai komponen dasar yang stabil, kustomisasi minimal. ECharts bundle besar — mitigasi: dynamic import halaman analytics.
- **Alternatif ditolak:** Vue/Nuxt (ekosistem matang tapi DX kurang selaras), SolidJS (ekosistem UI tipis), Astro (kurang cocok dashboard interaktif), tetap React (bosan + masalah lama tetap ada).

# ADR-0002 — SQLite (better-sqlite3) melalui Server Routes SvelteKit

- **Status:** Accepted
- **Tanggal:** 2026-08-18
- **Konteks:** Backend data lama adalah Taskade API (field storage kaku, tanpa FK, bug kalkulasi). PRD menuntut relasi klien↔order yang benar, history immutable, dan data safety. Deployment: lokal.
- **Keputusan:** SQLite file lokal, diakses HANYA dari server (routes `+server.ts`) via `better-sqlite3` dengan prepared statements; schema di-migrasi otomatis saat startup.
- **Konsekuensi positif:** Schema penuh (FK, constraint, index), transaksi ACID, backup = copy file, zero-ops.
- **Konsekuensi negatif:** Single-process (tidak untuk multi-instance/hosting serverless); data tidak tersinkron lintas perangkat. Diterima — constraint C3 (single user lokal).
- **Alternatif ditolak:** Tetap Taskade API (kaku), Postgres (overkill lokal), JSON file (tanpa FK/atomicity), node:sqlite (fallback jika better-sqlite3 gagal install di platform tertentu).

# ADR-0003 — Analitik Dihitung Client-Side dari Full Dataset

- **Status:** Accepted
- **Tanggal:** 2026-08-18
- **Konteks:** Dataset kecil (<10k baris, asumsi A1). App lama menampilkan angka hardcoded — harus dipastikan tidak terulang. Taskade API tidak bisa diandalkan untuk agregasi.
- **Keputusan:** Semua KPI/chart/timeline dihitung di client dari `clients` + `orders` yang dimuat penuh, melalui pure functions di `src/lib/domain/stats.ts` (unit-tested). Tidak ada endpoint analitik terpisah; tidak ada konstanta data.
- **Konsekuensi positif:** Satu sumber kebenaran, mudah di-test, tidak ada angka palsu, dashboard & analytics konsisten.
- **Konsekuensi negatif:** Load penuh dataset di awal — diterima sampai 10k baris (NFR-2); setelah itu pindah ke agregasi server-side (backlog #4).
