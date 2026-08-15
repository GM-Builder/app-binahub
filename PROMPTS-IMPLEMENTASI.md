# Prompt Implementasi — Revisi CEO T-BOS + Modul LEP

Setiap blok siap ditempel ke coding agent (Claude Code, dsb) satu per satu. Urutan disusun supaya dependency-nya benar (WS8 duluan karena WS2 & WS3 bergantung ke `programs`/`batches`).

---

## Prompt 0 — Module Selector di atas `engagements` (WS8, kerjakan duluan)

```
Baca DATA-MODEL.md dan PRD-REVISI-CEO.md bagian WS8 di context ini.

PENTING: JANGAN buat tabel `programs` baru. Tabel `engagements` sudah ada dan sudah dipakai sebagai program container T-BOS (migrasi 0007/0008 sudah jalan) — reuse itu.

Buat migrasi Supabase baru untuk:
1. HANYA tabel `program_modules` (program_id uuid fk ke engagements(id), module_key text, enabled boolean default true, primary key (program_id, module_key)).

Cari halaman admin yang sudah ada untuk kelola engagement (kemungkinan di src/app/admin/engagements/ atau serupa — cek dulu strukturnya sebelum bikin halaman baru). Tambahkan ke halaman itu:
- Checklist modul (mulai dari 2 pilihan: "T-BOS" dan "LEP", key 'tbos' dan 'lep') saat create/edit engagement.
- Setelah submit, insert/update ke `program_modules` sesuai checklist.
- Modul yang tidak dicentang: sembunyikan menu/navigasi terkait modul itu untuk engagement tsb.

Reuse komponen dari `components/ui/` (StatCard, StatusPill, dst) — JANGAN bikin komponen card/badge baru dari nol, ikuti pola yang sudah dipakai di admin/tbos/page.tsx setelah redesign.

Ikuti brand token di globals.css (--primary #0b2c6b, --accent #d9a441). Jangan hardcode hex baru.
```

---

## Prompt 1 — Batch Fleksibel (WS2)

```
Baca PRD-REVISI-CEO.md bagian WS2.

Buat migrasi Supabase:
1. Tabel `batches` (id uuid pk, program_id uuid fk ke engagements(id), name text, sort_order int default 0, created_at timestamptz default now()).
2. Ubah `teams`: hapus kolom `batch` (text), tambah kolom `batch_id` uuid fk ke batches. Tulis migrasi data untuk memindahkan data existing (kalau ada) dari teams.batch (string "Batch 1"/"Batch 2") ke row baru di `batches` + update FK-nya.

Di halaman admin T-BOS (cek src/app/admin/tbos/), tambahkan UI kelola batch:
- Section "Kelola Batch" — list batch program aktif, tiap baris ada tombol hapus (dengan confirm dialog, pakai components/ui/confirm-dialog.tsx yang sudah ada).
- Validasi: tombol hapus di-disable (dengan tooltip alasan) kalau masih ada team yang pakai batch_id itu.
- Input "+ Tambah Batch" — text field + tombol submit, insert ke `batches`.

Update src/app/admin/tbos/_components/batch-comparison.tsx supaya render kolom/seri dinamis sejumlah batch aktual (query dari tabel `batches`), bukan hardcode 2 kolom "Batch 1"/"Batch 2".

Cari semua tempat lain di codebase yang mereferensikan teams.batch sebagai string dan update ke batch_id + join ke tabel batches untuk ambil nama.
```

---

## Prompt 2 — Penugasan Fasilitator Disederhanakan (WS3a)

```
Baca PRD-REVISI-CEO.md bagian WS3a.

Assignment fasilitator saat ini pakai tabel tbos_facilitator_teams (fasilitator terikat ke tim). JANGAN hapus tabel ini (pertahankan sebagai histori). Buat tabel baru facilitator_missions (profile_id uuid fk profiles, mission_id uuid fk missions, program_id uuid fk engagements(id)).

Cari halaman/komponen admin untuk assignment fasilitator (yang saat ini menulis ke tbos_facilitator_teams). Ubah supaya menulis ke facilitator_missions sebagai gantinya.

Pastikan form assignment HANYA minta: pilih fasilitator (dari profiles role='facilitator') + pilih mission. TIDAK ADA pemilihan tim di form ini — hapus field/step tersebut kalau ada.

Update semua query dashboard/observasi yang tadinya baca dari tbos_facilitator_teams supaya baca dari facilitator_missions.
```

---

## Prompt 3 — Pilih Tim & Roster Progresif Saat Observasi (WS3b, WS3c)

```
Baca PRD-REVISI-CEO.md bagian WS3b dan WS3c. Ini perubahan paling kompleks, kerjakan hati-hati dan tambahkan test.

Di src/app/fasilitator/tbos/page.tsx, sebelum step "observe", tambahkan/pastikan ada step "pilih tim":
1. Fasilitator (yang sudah di-assign ke satu mission via facilitator_missions) melihat daftar tim yang sudah ada di batch program aktif (query dari tabel teams where batch_id in (batches milik program aktif)).
2. Ada opsi "+ Tim Baru" — input nama tim.
   - Saat submit nama tim baru: cek unique constraint (program_id + batch_id + name) di tabel teams. Kalau bentrok, tampilkan error "Nama tim sudah dipakai, gunakan nama lain atau pilih dari daftar" tanpa insert.
   - Kalau berhasil dibuat: WAJIB tampilkan form input roster (nama anggota + pilih siapa kapten) SEBELUM lanjut ke form observasi dimensi. Simpan ke team_members dengan is_captain yang sesuai.
3. Kalau pilih tim yang SUDAH ada (roster sudah terisi dari fasilitator pos lain sebelumnya): langsung lanjut ke form observasi dimensi, TANPA form roster.
4. Tambahkan unique constraint di database level (bukan cuma validasi frontend) untuk (program_id, batch_id, name) di tabel teams, supaya race condition dua fasilitator input nama tim sama di waktu bersamaan tetap tertangani dengan benar (salah satu akan dapat error dari database, tangani errornya di frontend dengan pesan yang sama seperti di atas).

Tulis test untuk skenario race condition ini kalau ada test infra e2e (cek folder e2e/).
```

---

## Prompt 4 — Traceability Fasilitator per Observasi (WS3d)

```
Baca PRD-REVISI-CEO.md bagian WS3d.

Di admin/tbos (detail tim / detail observasi) dan di laporan per-tim (Prompt 6), tampilkan nama fasilitator (join observations.profile_id -> profiles.name) untuk setiap baris observasi/skor mission yang ditampilkan. Ini murni tambahan display, data profile_id sudah ada di skema observations.
```

---

## Prompt 5 — Scope Dashboard Fasilitator (WS4)

```
Baca PRD-REVISI-CEO.md bagian WS4.

Update src/app/fasilitator/tbos/results/page.tsx: query hasil/statistik HANYA untuk mission yang ada di facilitator_missions milik fasilitator yang login (join profile_id = current user). Tampilkan semua tim yang punya observation di mission tsb (bukan cuma tim yang dinilai fasilitator ini sendiri).

Update ROLES-PERMISSIONS.md: ubah baris "Lihat dashboard (radar, heatmap, ranking)" untuk Fasilitator dari ❌ jadi ✅ (terbatas per mission miliknya) — dan hapus tanda open question yang lama soal ini.
```

---

## Prompt 6 — Ranking + Filter Mission/Dimensi (WS6)

```
Baca REKOMENDASI-DESAIN-4-FILE.md bagian ranking.tsx DAN PRD-REVISI-CEO.md bagian WS6 — kerjakan dua-duanya sekaligus (visual + fungsional) supaya tidak bolak-balik file yang sama.

Di src/app/admin/tbos/_components/ranking.tsx:
1. Terapkan perbaikan visual dari REKOMENDASI-DESAIN-4-FILE.md (rounded-xl, gradient medali disederhanakan, border/shadow token standar, cek apakah row clickable untuk putuskan soal hover lift).
2. Tambah dua filter dropdown di atas list: "Filter Mission" (default: semua mission / Overall Team Score) dan "Filter Dimensi" (default: semua dimensi / rata-rata gabungan).
3. Saat filter mission dipilih: ranking dihitung dari Final Mission Score tim tsb di mission itu saja, bukan Overall Team Score.
4. Saat filter dimensi dipilih: ranking dihitung dari Dimension Score tim tsb untuk dimensi itu saja (lintas mission yang mengukur dimensi tsb).
5. Filter bisa dikombinasikan (mission + dimensi sekaligus).

Cek src/modules/tbos/scoring.ts (atau lokasi setara) untuk fungsi hitung skor yang sudah ada — reuse logic yang ada, jangan duplikasi rumus scoring.
```

---

## Prompt 7 — Laporan Per Tim (WS7)

```
Baca PRD-REVISI-CEO.md bagian WS7.

Baca src/app/admin/tbos/_components/pdf-report.tsx yang sudah ada — cek apakah sudah mendukung laporan per-tim atau cuma laporan agregat program.

Kalau belum ada mode per-tim: tambahkan generate laporan PDF per tim berisi — nama tim & batch, kapten & anggota, radar chart skor 8 dimensi tim itu, tabel riwayat observasi per mission (skor + nama fasilitator penilai, lihat Prompt 4), 3 kekuatan & 3 area pengembangan spesifik tim itu.

Tambahkan tombol "Unduh Laporan Tim" di halaman detail/roster tim admin.
```

---

## Prompt 8 — Modul LEP (Baru, kerjakan setelah Prompt 0)

```
Baca PRD-LEP-v1.md secara penuh di context ini.

Buat migrasi Supabase untuk tabel lep_speakers, lep_responses, lep_speaker_ratings sesuai skema di PRD-LEP-v1.md bagian 4. Tambahkan unique constraint (program_id, profile_id) di lep_responses.

Buat halaman peserta src/app/peserta/lep/page.tsx:
- Form single-page (bukan multi-step, ini survey singkat): 4 pertanyaan skala 1-4 (radio button horizontal 1-2-3-4 dengan label ujung "Sangat Tidak Setuju"/"Sangat Setuju"), rating per pemateri (dinamis sejumlah lep_speakers program ini, masing-masing skala 1-4 + textarea saran opsional), dan 3 pertanyaan open text (2 wajib: hal_terpenting, hal_menarik; 1 opsional: saran_program).
- Cek dulu apakah user sudah pernah submit untuk program ini (unique constraint) — kalau sudah, tampilkan pesan "Anda sudah mengisi evaluasi ini" alih-alih form.
- Mobile-first, styling ikuti design token resmi (globals.css), reuse components/ui yang relevan.

Buat halaman admin src/app/admin/lep/page.tsx:
- Setup pemateri per program (CRUD sederhana ke lep_speakers).
- Dashboard hasil: rata-rata 4 pertanyaan umum, rata-rata skor per pemateri (bar chart pakai Recharts, contoh polanya lihat radar-chart.tsx atau batch-comparison.tsx di admin/tbos), daftar jawaban open text dengan filter per pertanyaan, response rate (jumlah responden vs total peserta program), tombol export CSV.

JANGAN bikin StatCard/StatusPill/komponen kartu baru — reuse dari components/ui/ seperti sudah diarahkan di redesign T-BOS sebelumnya.
```

---

## Catatan Urutan Kerja

1. **Prompt 0** dulu (Program & Module) — semua yang lain bergantung ke `programs`/`program_id`.
2. **Prompt 1** (Batch) — dibutuhkan Prompt 3 (roster butuh batch_id yang valid).
3. **Prompt 2 & 3** bisa paralel setelah Prompt 1 selesai.
4. **Prompt 4, 5, 6, 7** independen satu sama lain, bisa dikerjakan paralel/kapan saja setelah Prompt 3.
5. **Prompt 8 (LEP)** independen dari Prompt 1-7 (cuma butuh Prompt 0), bisa dikerjakan kapan saja secara paralel oleh developer/agent berbeda.
