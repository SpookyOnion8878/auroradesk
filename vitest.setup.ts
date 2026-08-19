// Setup vitest (proyek 'server'): jalankan SEBELUM test file diimpor.
// Penting: assignment env di baris atas file test TIDAK cukup — ES imports
// di-hoist dan dieksekusi lebih dulu, jadi db.ts bisa ter-load dengan DB_PATH
// belum diset dan membuka file auroradesk.db yang sama untuk semua test
// (menyebabkan state saling menumpuk antar file). Setup ini menjamin semua
// test memakai database in-memory yang terisolasi per worker.
process.env.DB_PATH = ':memory:';
