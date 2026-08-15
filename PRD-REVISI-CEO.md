# PRD — Revisi T-BOS Hasil Meeting CEO

Status: Ready for engineering breakdown
Supersedes bagian terkait di: `T-BOS_PRD_v1.docx`, `DATA-MODEL.md`, `ROLES-PERMISSIONS.md`, `ADR.md`, `ROADMAP.md` (T-BOS)
Tanggal revisi: 11 Agustus 2026

Dokumen ini adalah **delta/perubahan**, bukan pengganti penuh dokumen T-BOS sebelumnya — hal yang tidak disebut di sini berarti tidak berubah.

> **Update 12 Agustus 2026**: WS8 dikoreksi — program container pakai `engagements` yang sudah ada (migrasi 0007/0008), bukan tabel `programs` baru. Semua referensi "program_id" di dokumen ini secara teknis adalah FK ke `engagements(id)`, kecuali disebutkan lain.

---

## WS1 — Copy Fixes (Poin 1 & 2)

| # | Sebelum | Sesudah |
|---|---|---|
| 1 | Label "Workspace Operasional" (sisi fasilitator) | "BinaHub Workspace" |
| 2 | Sapaan pakai email lengkap fasilitator | Sapaan pakai **nama** fasilitator ("Selamat datang, {nama}") — ambil dari `profiles.name`, bukan `auth.users.email` |

**Implikasi**: pastikan setiap fasilitator punya `profiles.name` terisi (bukan null) — kalau alur signup belum mewajibkan isi nama, tambahkan field nama wajib saat signup atau saat admin assign role fasilitator.

---

## WS2 — Batch Fleksibel (Poin 3 & 4)

**Sebelum**: batch di-hardcode 2 pilihan ("Batch 1" / "Batch 2") sebagai dropdown/string bebas.

**Sesudah**: batch jadi entitas nyata yang bisa ditambah/dihapus admin secara dinamis.

### Perubahan Data Model
Tabel baru `batches`:
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| program_id | uuid | FK → `programs` (lihat WS7) |
| name | text | diketik bebas oleh admin, misal "Batch 1", "Gelombang Agustus", dst |
| sort_order | int | urutan tampil |
| created_at | timestamp | |

`teams.batch` (kolom teks lama) → diganti `teams.batch_id` (FK → `batches`).

### UI Admin
- Tombol "+ Tambah Batch" → input nama batch, submit.
- Tiap batch di daftar punya tombol hapus (dengan konfirmasi — dan validasi: **tidak bisa dihapus kalau masih ada tim yang terdaftar di batch itu**, supaya tidak ada data yatim).

### Dampak ke Perbandingan Batch (Poin 4)
`batch-comparison.tsx` saat ini kemungkinan mengasumsikan tepat 2 kolom (Batch 1 vs Batch 2). Perlu diubah jadi **render dinamis N kolom/N seri** sesuai jumlah batch aktual di program tsb — baik di bar chart maupun tabel rincian.

---

## WS3 — Penugasan Fasilitator & Alur Observasi (Poin 5, 6, 9)

Ini perubahan mekanisme paling besar. Konteks nyata di lapangan: setiap **mission = satu pos fisik**. Fasilitator ditempatkan di satu pos (satu mission). Semua tim bergiliran keliling melewati semua pos secara bergantian (round-robin), bukan satu fasilitator mengikuti satu tim.

### 3a. Penugasan (Assignment) — Disederhanakan

**Sebelum (existing)**: assignment pakai tabel `tbos_facilitator_teams` (fasilitator terikat ke tim tertentu).
**Sesudah**: assignment admin **cukup fasilitator + mission**, lewat tabel baru `facilitator_missions` (`profile_id` + `mission_id` + `program_id`, dengan `program_id` FK ke `engagements(id)`). Tidak ada pemilihan tim di tahap assignment — karena satu fasilitator (di posnya) akan menilai *semua* tim yang lewat pos itu, bergantian.

`tbos_facilitator_teams` **tidak dihapus** (dipertahankan sebagai histori/audit data lama), tapi alur assignment baru dan semua query filter dashboard/observasi pindah ke `facilitator_missions`.

### 3b. Saat Observasi — Fasilitator Pilih Tim

Karena satu fasilitator menilai tim yang berganti-ganti di posnya, **layar observasi fasilitator wajib ada langkah pilih tim** sebelum mengisi form (ini kemungkinan sudah ada di `page.tsx` fasilitator berdasarkan `selectedTeam`/`selectedMission` — perlu dipastikan pilihan tim scope-nya benar: hanya tim yang **belum** dinilai fasilitator ini di sesi/pos saat ini yang ditampilkan sebagai opsi utama, tim yang sudah dinilai tetap bisa diakses untuk lihat/edit dalam window revisi).

### 3c. Roster Tim — Diisi Progresif oleh Fasilitator Pos Pertama (Poin 6)

Analogi dari CEO: 5 pos, Tim 1 masuk Pos 1 dulu → fasilitator Pos 1 input nama anggota + tentukan kapten Tim 1 (karena ini kali pertama Tim 1 "muncul" di sistem). Saat Tim 1 pindah ke Pos 2, fasilitator Pos 2 **tidak perlu input ulang** roster — tinggal pilih Tim 1 dari daftar dan langsung isi observasi. Sementara itu, di Pos 2 boleh saja saat itu juga kedatangan Tim 2 yang baru pertama kali muncul di sistem → fasilitator Pos 2 yang mengisi roster Tim 2.

**Aturan desain**:
- Tim **tidak** perlu di-pre-provision oleh admin sebelum program mulai (walau admin tetap bisa provision manual kalau mau, sebagai opsional).
- Saat fasilitator memilih "tambah tim baru" di layar pilih-tim, sistem cek: kalau nama tim belum ada di batch itu → fasilitator **wajib** isi roster anggota + kapten saat itu juga, baru bisa lanjut ke form observasi.
- Kalau tim sudah ada (dibuat fasilitator lain di pos sebelumnya) → fasilitator tinggal pilih dari daftar, roster sudah terisi, langsung ke form observasi.
- **Race condition perlu diantisipasi**: kalau dua fasilitator di pos berbeda kebetulan input nama tim yang sama persis di waktu hampir bersamaan (dua tim berbeda kebetulan ditulis dengan nama sama, atau technical race saat create), perlu unique constraint per (`program_id`, `batch_id`, `name`) + penanganan error yang jelas di UI ("Nama tim sudah dipakai, gunakan nama lain atau pilih dari daftar").

### 3d. Traceability Fasilitator per Observasi (Poin 9)

`observations.profile_id` sudah menyimpan siapa yang menilai (sudah ada di desain). Yang perlu ditambah: **tampilkan ini di UI**, bukan cuma tersimpan di database:
- Di admin: tabel/detail observasi per tim menunjukkan nama fasilitator penilai untuk tiap mission.
- Berguna juga untuk kasus multi-fasilitator per mission (lihat `STATE-MACHINE.md` §3) — kalau ada 2 observasi untuk kombinasi tim+mission yang sama, harus jelas dari fasilitator siapa masing-masing berasal.

---

## WS4 — Scope Dashboard Fasilitator (Poin 7)

Menjawab open question lama di `ROLES-PERMISSIONS.md` §6: **ya, fasilitator boleh akses dashboard/statistik T-BOS**, tapi **dibatasi hanya untuk mission yang dia pegang** (sesuai `facilitator_missions`). Dalam scope mission itu, fasilitator bisa lihat **semua tim** yang sudah lewat pos tersebut (bukan cuma tim yang dia nilai sendiri, karena kalau ada multi-fasilitator per pos di sesi berbeda, tetap satu pos = satu mission).

**Update `ROLES-PERMISSIONS.md`**: baris "Lihat dashboard (radar, heatmap, ranking)" untuk role Fasilitator berubah dari ❌ jadi ✅ (terbatas per mission miliknya).

---

## WS5 — Verifikasi Form Observasi (Poin 8)

Poin 8 dari CEO adalah re-paste spesifikasi mapping mission↔dimensi dan pertanyaan per dimensi yang **sudah sama persis** dengan yang tercatat di `T-BOS_PRD_v1.docx` dan `SCORING-LOGIC.md`. **Tidak ada perubahan konten** — ini kemungkinan konfirmasi ulang dari CEO, bukan revisi baru.

**Actionable**: lakukan QA checklist manual membandingkan form observasi yang sudah di-build (`fasilitator/tbos/page.tsx`) dengan tabel mapping & 5 level per dimensi di `T-BOS_PRD_v1.docx` Bagian 3 — pastikan tidak ada drift teks antara yang di-build vs spesifikasi resmi.

---

## WS6 — Redesign Leaderboard/Ranking + Filter (Poin 10)

Selain perbaikan visual yang sudah direkomendasikan di `REKOMENDASI-DESAIN-4-FILE.md` (`ranking.tsx`), tambahkan **fungsi filter**:
- **Filter by Mission**: ranking dihitung ulang hanya dari skor tim di mission tsb (bukan Overall Team Score lintas semua mission).
- **Filter by Dimension**: ranking tim berdasarkan satu dimensi spesifik saja (misal ranking khusus "Communication"), berguna untuk analisis per-kompetensi.
- Filter ini bisa dikombinasikan (misal: ranking dimensi Communication khusus di mission X-Case).
- Default (tanpa filter) tetap Overall Team Score seperti sekarang.

---

## WS7 — Laporan Per-Tim (Poin 11)

Repo sudah punya `pdf-report.tsx` di `admin/tbos/_components/` — perlu dicek apakah ini sudah mengakomodasi laporan **per-tim** (bukan cuma laporan keseluruhan program). Kalau belum:
- Tambah entry point "Unduh Laporan" di detail/roster tiap tim (bukan cuma laporan agregat program).
- Isi laporan per tim: profil tim (nama, batch, kapten, anggota), skor per dimensi (radar individual tim itu), riwayat observasi per mission dengan nama fasilitator penilai (poin 9), kekuatan & area pengembangan tim tsb secara spesifik.

---

## WS8 — Module Selector di atas `engagements` (Poin 12)

Ini pertanyaan arsitektur yang CEO minta dipikirkan logikanya. Jawabannya terhubung ke keputusan `ADR-011` sebelumnya (jangan generalisasi sebelum ≥2-3 modul terbukti butuh pola sama) — dan sekarang, dengan T-BOS + LEP (poin 13) sama-sama akan jadi modul dalam satu program, kondisi itu **tercapai**.

⚠️ **Koreksi dari draft sebelumnya**: dokumen ini semula mengusulkan tabel `programs` baru. **Itu keliru** — tabel `engagements` **sudah ada dan sudah dipakai sebagai program container T-BOS** (migrasi 0007/0008 sudah berjalan). Jangan bikin `programs` baru — itu justru duplikasi konsep yang persis dilarang di `ADR-011`. `engagements` **direuse** sebagai program container.

### Entitas Baru: `program_modules` (satu-satunya tabel baru di WS8 ini)
| Kolom | Tipe | Keterangan |
|---|---|---|
| program_id | uuid | FK → **`engagements(id)`** (bukan tabel programs baru) |
| module_key | text | `'tbos'`, `'lep'`, dst — daftar modul yang tersedia di platform |
| enabled | boolean | |

### Logika Penerapan
1. Admin bikin/buka **engagement** (pakai alur/halaman yang sudah ada, bukan halaman "Buat Program" baru) → **centang modul yang dipakai** (checklist: T-BOS, LEP, dst — daftar ini akan bertambah seiring modul baru dibuat).
2. Modul yang **tidak** dicentang: menu/navigasi terkait modul itu **tidak muncul** untuk engagement tsb (baik di sisi admin maupun fasilitator/peserta yang terhubung ke engagement itu).
3. Data T-BOS (batches, teams, missions-assignment, observations) dan data LEP (responses) sama-sama **di-scope ke `program_id`** (yang secara teknis adalah `engagements.id`) — supaya satu engagement bisa punya T-BOS + LEP berjalan bersamaan tanpa data campur aduk dengan engagement lain.
4. **Tidak** membangun engine generik ala Evidence/Capability (PRD v0.3 lama) — `module_key` di sini murni **on/off switch per engagement**, bukan abstraksi data lintas modul. Tiap modul (T-BOS, LEP) tetap simpan datanya sendiri-sendiri dengan skema masing-masing (prinsip modular-first dari `PRD-app-binahub-v0.4.md` tetap berlaku).

### Dampak ke Skema T-BOS yang Sudah Dirancang
- `batches.program_id` (sudah ditulis di WS2)
- `teams` scoped lewat `batch_id` → otomatis ter-scope ke program lewat batch
- `facilitator_missions` perlu tambahan `program_id` — karena fasilitator yang sama bisa ditugaskan di mission yang sama tapi program (angkatan) yang berbeda
- `observations.program_id` — untuk query/laporan cepat tanpa join berlapis

---

## Ringkasan File Terdampak (untuk breakdown teknis)

| Area | File |
|---|---|
| Copy fixes | `fasilitator` layout/nav, halaman welcome/greeting |
| Batch CRUD | Admin — halaman kelola batch (baru), `DATA-MODEL.md` |
| Batch comparison dinamis | `admin/tbos/_components/batch-comparison.tsx` |
| Assignment fasilitator | Admin — form penugasan fasilitator (existing, disederhanakan) |
| Pilih tim + roster progresif | `fasilitator/tbos/page.tsx` |
| Traceability fasilitator | `admin/tbos/_components/*`, detail observasi |
| Scope dashboard fasilitator | `fasilitator/tbos/results/page.tsx`, `ROLES-PERMISSIONS.md` |
| Ranking + filter | `admin/tbos/_components/ranking.tsx` |
| Laporan per tim | `admin/tbos/_components/pdf-report.tsx` |
| Program & module selector | Baru — halaman admin "Kelola Program" |

Lihat `PROMPTS-IMPLEMENTASI.md` untuk breakdown jadi task siap-kerjakan per item.
