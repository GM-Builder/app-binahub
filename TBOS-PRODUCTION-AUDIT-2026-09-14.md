# Audit Production T-BOS — 14 September 2026

## Kesimpulan

T-BOS **lulus untuk penggunaan production terkontrol**. Migration `0048_tbos_flexible_batch_constraints.sql` sudah diterapkan dan dibuktikan melalui mutation smoke pada API production. Production E2E dashboard admin juga lulus pada desktop dan mobile.

## Temuan dan perbaikan

### 1. Blocker — pembuatan tim gagal untuk nama batch fleksibel

**Gejala:** `new row for relation "tbos_teams" violates check constraint "tbos_teams_batch_check"`.

**Penyebab:** UI/API menggunakan tabel batch fleksibel, tetapi constraint database lama hanya menerima teks `Batch 1` atau `Batch 2` pada snapshot `tbos_teams.batch` dan `tbos_observations.batch`.

**Perbaikan:** migration API `0048_tbos_flexible_batch_constraints.sql` menghapus constraint lama dan menggantinya dengan validasi teks tidak kosong, maksimal 50 karakter. Migration juga memeriksa data lama sebelum mengubah constraint.

### 2. High — beberapa aksi UI tidak konsisten memakai jalur autentikasi bersama

**Risiko:** token, cookie, dan request ID dapat berbeda antaraksi; kegagalan sesi menjadi sulit dilacak.

**Perbaikan:** aksi anggota tim, edit/hapus tim, pemuatan user, ekspor, dan PDF dialihkan ke `apiFetch`, helper autentikasi bersama.

### 3. High — perubahan captain dan bulk insert sebelumnya bukan satu transaksi

**Risiko:** bila reset captain berhasil tetapi insert anggota gagal, roster bisa tersimpan setengah jalan.

**Perbaikan:** RPC `tbos_add_team_members` melakukan lock, validasi, reset captain, dan insert anggota sebagai satu transaksi database. Semua berhasil atau semuanya dibatalkan.

### 4. Medium — error database mentah dapat muncul ke pengguna

**Risiko:** pesan teknis membingungkan pengguna dan dapat membocorkan detail implementasi.

**Perbaikan:** kode error PostgreSQL yang dikenal dipetakan menjadi pesan aman dan mudah dimengerti; detail mentah hanya masuk log server.

### 5. Medium — keputusan scoring di dokumentasi bertentangan

**Risiko:** operator dan developer dapat memakai formula atau aturan duplikasi lama.

**Perbaikan:** ADR, README modul, dan dokumen scoring diselaraskan dengan perilaku aktif: T-BOS Score adalah skor akhir mission, Overall Team Score adalah rata-rata, dan satu observasi kanonik disimpan per program+tim+mission.

## Cakupan keamanan yang diperiksa

- endpoint admin T-BOS memerlukan admin;
- endpoint facilitator memerlukan facilitator dan assignment yang benar;
- endpoint participant memerlukan sesi serta membatasi hasil ke tim sendiri;
- mutation penting divalidasi kembali di API/database;
- retry dilindungi idempotency;
- ekspor CSV menetralkan formula injection;
- error database tak dikenal tidak dikirim mentah ke UI;
- audit trail dipertahankan untuk perubahan penting.

## Bukti pengujian lokal

### API

- TypeScript typecheck: lulus.
- ESLint: lulus.
- Unit/integration tests: 164 lulus, 2 dilewati.
- Build production: lulus.
- Smoke read-only production: autentikasi, penolakan anonim, dan pembacaan program lulus.

### App

- TypeScript typecheck: lulus.
- ESLint: lulus.
- Unit/component tests: 95 lulus.
- Production E2E T-BOS: desktop Chromium lulus.
- Production E2E T-BOS: mobile Chromium lulus.

### Mutation smoke production setelah migration 0048

- Sepuluh endpoint baca menolak akses anonim: lulus 10/10.
- Admin memperoleh sesi dan membaca program T-BOS aktif: lulus.
- Batch dengan nama fleksibel dapat dibuat: lulus.
- Tim dapat dibuat pada batch tersebut: lulus.
- Nama tim dapat diubah: lulus.
- Hubungan program–batch–tim dapat dibaca kembali: lulus.
- Dua anggota disimpan atomik dengan tepat satu captain: lulus.
- Tim dan batch UAT dibersihkan kembali: lulus.

## Gate deployment dan hasilnya

1. Migration API `0048_tbos_flexible_batch_constraints.sql`: **lulus**.
2. API commit `5f1e90a` terdeploy dan dilaporkan health endpoint production: **lulus**.
3. Mutation smoke dengan `TBOS_MUTATION_TEST=true`: **lulus**.
4. Production E2E T-BOS desktop dan mobile: **lulus 2/2**.
5. Build, typecheck, lint, unit, dan component test: **lulus**.

`supabase/production_readiness.sql` tetap menjadi checklist audit menyeluruh untuk seluruh platform. Pengguna memutuskan menerima/skip gate platform lain; keputusan tersebut tidak mengubah hasil teknis T-BOS yang diuji di dokumen ini.

## Keputusan readiness

**READY untuk production terkontrol.** Tidak ada blocker T-BOS high/critical yang masih terbuka dari cakupan audit ini. Monitoring dan audit log tetap harus dipantau pada penggunaan nyata pertama.
