# Security — AuroraDesk

> Kompas Stage 13: Auth, authorization, secrets, input validation, audit. MVP: single user lokal (C3).

---

## 1. Model Auth & Trust Boundary

- **Tidak ada autentikasi** (keputusan PRD Won't) — aplikasi dijalankan oleh satu user di mesinnya sendiri.
- Trust boundary: **localhost**. Server produksi (adapter-node) **wajib bind ke `127.0.0.1`** saja, kecuali hosting non-lokal diizinkan (backlog).
- Implikasi: seluruh data toko (email, telepon, nilai order) terekspos ke siapa pun yang bisa mengakses mesin/port tersebut. Dokumentasikan ke user: jangan expose port ke jaringan.

## 2. Kontrol Keamanan (checklist)

| #   | Kontrol                               | Implementasi                                                                                                          |
| --- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| S-1 | Input validation semua endpoint       | zod schema (server = otoritas) → 422 + details                                                                        |
| S-2 | SQL injection                         | 100% prepared statements (better-sqlite3), tanpa string concatenation SQL                                             |
| S-3 | Path/ID injection                     | ID divalidasi `z.string().uuid()`; tidak ada path traversal (tidak ada akses file via API)                            |
| S-4 | Secret management                     | Tidak ada secret di MVP (tidak ada API key/DB remote). Bila AI chat ditambah nanti → env var + `$env/dynamic/private` |
| S-5 | Body size limit                       | `limit: 1mb` (SvelteKit default request handling) — cukup untuk payload JSON                                          |
| S-6 | CORS                                  | Default same-origin (tidak mengaktifkan cors); tidak perlu header tambahan                                            |
| S-7 | Rate limiting                         | Tidak relevan single-user lokal; bila di-host → reverse proxy (lihat S-9)                                             |
| S-8 | Audit trail                           | `order_status_history` (immutable, append-only, timestamp); `updated_at` pada entity                                  |
| S-9 | Hardening hosting (backlog non-lokal) | Reverse proxy + HTTPS, bind non-0.0.0.0, backup rutin file .db                                                        |

## 3. Data Sensitif & Privacy

| Data                       | Sensitivitas | Penanganan                                                                                                 |
| -------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------- |
| Nama, email, telepon klien | PII          | Hanya disimpan di file lokal `auroradesk.db`; tidak dikirim ke pihak ketiga mana pun (tidak ada integrasi) |
| Nilai order                | Data bisnis  | Sama seperti di atas                                                                                       |
| Log                        | —            | `console.error` di dev; tidak pernah mencatat body request yang mengandung PII                             |

## 4. Threat Notes (model ancaman MVP)

| Threat                                       | Risiko | Mitigasi                                                                       |
| -------------------------------------------- | ------ | ------------------------------------------------------------------------------ |
| Aplikasi diakses dari jaringan lain          | Tinggi | Bind 127.0.0.1; dokumentasi di README                                          |
| Malware lokal membaca file DB                | Sedang | Di luar lingkup MVP (sistem operasi melindungi user profile) — catat di README |
| Request berbahaya (injection, payload besar) | Rendah | S-1, S-2, S-5                                                                  |
| Data korup/tidak sengaja terhapus            | Sedang | Backup manual copy `.db`; README menjelaskan; delete selalu konfirmasi         |
| XSS (konten user di-render)                  | Rendah | Svelte escape otomatis; tidak memakai `{@html}` untuk input user               |

## 5. Permissions Matrix

| Operasi                      | Client (browser)  | Server                   |
| ---------------------------- | ----------------- | ------------------------ |
| Baca semua data              | ✓                 | ✓                        |
| Tulis (create/update/delete) | ✓ (hanya via API) | ✓ (validasi + guard)     |
| Hapus klien ber-order        | diblokir (409)    | ✓ diblokir (FK RESTRICT) |
| Mutasi history               | ✗ (tidak ada API) | ✗ (tidak ada API)        |

## 6. Acceptance (untuk Stage 20 QA)

- [ ] Tidak ada SQL string concatenation di seluruh `src/lib/server`.
- [ ] Semua endpoint memvalidasi body via zod; test kasus: body kosong, field salah tipe, ID non-uuid → 400/422.
- [ ] DELETE client ber-order → 409; PATCH status ilegal → 409.
- [ ] Server produksi bind 127.0.0.1 (verifikasi saat build/preview).
- [ ] Tidak ada log yang mencetak email/telepon utuh pada error path.
