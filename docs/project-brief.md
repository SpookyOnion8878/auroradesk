# Project Brief — AuroraDesk

> Kompas Stage 01-03: Definisi masalah, requirements awal, tujuan & success metrics.
> Status: **DRAFT — menunggu gate approval sebelum lanjut ke PRD (Stage 04-05).**

---

## 1. Problem Statement

> _Pemilik toko kecil mencatat klien dan pesanan secara manual (spreadsheet/catatan), sehingga tidak punya visibilitas terhadap pendapatan, status pesanan, dan performa klien — dan prototype aplikasi sebelumnya (React, `D:\Projects\store-manager`) tidak dapat dibangun (build system hilang), menyimpan data di struktur field Taskade yang kaku dengan bug kalkulasi (string concatenation), serta menampilkan analitik dengan angka placeholder/hardcoded yang menyesatkan._

Problem statement di atas bersifat solution-agnostic: solusinya belum disebutkan.

## 2. Target User & Stakeholder

| Peran                        | Deskripsi                                            | Kebutuhan utama                                                        |
| ---------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------- |
| **Pemilik toko (primary)**   | Single user, mengelola semua klien & pesanan sendiri | Input cepat, visibilitas pendapatan, kontrol status pesanan            |
| **Pemilik toko (secondary)** | Melihat tren & performa untuk keputusan bisnis       | Analitik akurat berbasis data nyata                                    |
| _Stakeholder teknis_         | Developer (satu orang, user yang sama)               | Kode bersih, testable, dapat di-build & dijalankan dari clean checkout |

## 3. Kondisi Saat Ini (Tanpa Produk / Workaround)

- Data klien & pesanan tersebar di spreadsheet / catatan manual.
- Tidak ada cara cepat mengetahui: total revenue, pesanan pending, klien terbaik.
- Status pesanan tidak terlacak (tidak ada alur pending → processing → shipped → delivered).
- Tidak ada relasi klien↔order; nama klien disalin manual (rentan typo/duplikat).
- Prototype React lama: tidak bisa di-build, analitik berisi angka palsu (timeline revenue Jan–Jul adalah konstanta), bug string-concatenation pada `amount`.

## 4. Tujuan Project (Goals)

1. Menyediakan satu tempat terpusat untuk mengelola **klien** (CRUD) dan **pesanan** (CRUD + alur status).
2. Menampilkan **analitik yang 100% dihitung dari data nyata** (revenue timeline, distribusi status, top clients, average order value) — tanpa angka placeholder.
3. Aplikasi dapat **di-build, dijalankan, dan diuji** dari clean checkout secara lokal.
4. Pengalaman input cepat (< 30 detik untuk klien baru, < 60 detik untuk pesanan baru).

## 5. Non-Goals (eksplisit, untuk cegah scope drift)

- ❌ Autentikasi / multi-user (diputuskan: single user, tanpa login)
- ❌ Deployment non-lokal (keputusan: lokal dulu; arsitektur tidak boleh menghalangi hosting nanti)
- ❌ Sinkronisasi Taskade / integrasi pihak ketiga
- ❌ Manajemen inventaris / stok / supplier
- ❌ Pembayaran / invoice / pajak
- ❌ Aplikasi mobile native atau PWA offline penuh
- ❌ Multi-bahasa (i18n) — UI **English**

## 6. Constraints & Asumsi

**Constraints (diputuskan, tidak bisa dinegosiasi):**

| #   | Constraint                                                                                        |
| --- | ------------------------------------------------------------------------------------------------- |
| C1  | Stack: **Svelte 5 + SvelteKit + Tailwind CSS v4 + shadcn-svelte + ECharts + zod**                 |
| C2  | Backend: **SQLite** diakses melalui server routes SvelteKit (bukan database eksternal)            |
| C3  | Tanpa autentikasi — aplikasi dijalankan lokal oleh satu user                                      |
| C4  | Bahasa antarmuka: **English**                                                                     |
| C5  | Data lama (React/Taskade) tidak wajib dimigrasi untuk MVP; import CSV disediakan untuk entry data |

**Asumsi:**

- A1. Jumlah data kecil (ratusan klien, ribuan pesanan) — tidak butuh pagination berbasis server.
- A2. Satu pengguna → tidak ada konflik concurrent write yang perlu di-handle secara khusus (SQLite + single-process sudah cukup).
- A3. Database hanya diakses oleh aplikasi ini (tidak ada proses lain).
- A4. Mesin pengembang memiliki Node.js LTS (≥ 20) dan npm.

## 7. Success Metrics Awal (terukur)

| #   | Metric                          | Cara mengukur                                                    | Target              |
| --- | ------------------------------- | ---------------------------------------------------------------- | ------------------- |
| M1  | Build & run dari clean checkout | `git clone → npm install → npm run dev` tanpa error              | ✓ lolos             |
| M2  | Typecheck & unit test hijau     | `npm run typecheck` + `npm test`                                 | ✓ lolos             |
| M3  | Analitik bebas angka hardcoded  | Audit kode: 0 konstanta data analitik; semua nilai dari query DB | 0 placeholder       |
| M4  | CRUD klien & pesanan lengkap    | Uji manual end-to-end (create/read/update/delete)                | 8/8 operasi bekerja |
| M5  | Waktu tambah klien              | Stopwatch, first-use flow                                        | < 30 detik          |
| M6  | Waktu tambah pesanan            | Stopwatch, first-use flow                                        | < 60 detik          |

**Guardrail metrics:** tidak ada NaN/Infinity yang tampil di UI (regresi), loading state tidak pernah menggantung.

## 8. Open Questions (untuk dijawab sebelum/bersamaan PRD)

- Q1. Apakah perlu _import_ data dari CSV pada MVP, atau cukup entry manual? _(Sementara: masuk backlog — lihat PRD)_
- Q2. Apakah pesanan perlu _line items_ (produk + qty + harga per item) atau cukup satu nominal? _(Asumsi MVP: satu nominal; line items masuk backlog)_
- Q3. Apakah kategori/label klien (beyond status active/inactive/vip) dibutuhkan? _(Asumsi MVP: tidak)_
- Q4. Nama direktori project: `store-manager-v2` di `D:\Projects` — apakah diterima? _(Asumsi: ya, React lama tetap utuh)_

## 9. Risk Register Awal

| Risiko                                                   | Dampak                      | Mitigasi                                                                        |
| -------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------- |
| Ekosistem shadcn-svelte kurang matang vs shadcn/ui React | UI perlu penyesuaian manual | Gunakan komponen dasar (button, dialog, table) yang stabil; kustomisasi minimal |
| ECharts bundle besar                                     | Load lambat                 | Dynamic import per halaman analitik                                             |
| SQLite di environment lokal (Windows) tanpa native deps  | Install gagal               | Gunakan `better-sqlite3` (prebuilt binary tersedia) atau fallback `node:sqlite` |
| Migrasi data lama dibutuhkan mendadak                    | Kehilangan data historis    | Sediakan export CSV dari app lama (backlog) + import CSV di app baru            |

---

## Gate 01-03

**Kondisi kelulusan (harus semua ✓):**

- [x] Problem statement eksplisit & solution-agnostic
- [x] Target user & stakeholder teridentifikasi
- [x] Goals, non-goals, constraints terdokumentasi
- [x] Success metrics terukur (M1–M6)

**Status: MENUNGGU REVIEW USER.** Setelah disetujui, lanjut ke **Stage 04-05: PRD & Scope** (`docs/prd.md`).
