# Fase 16B — Production Acceptance Runbook

Tanggal mulai: 3 September 2026

Status saat ini: **PASS**. Gate A-F, migration `0040_program_assessment_finishing.sql`, production readiness, dan smoke test `v0.19.0` telah dikonfirmasi lulus oleh operator pada 5 September 2026. Automation tetap terkunci dalam mode dry-run sampai governance pilot diselesaikan dan keputusan go/no-go manusia dicatat.

## Tujuan

Membuktikan bahwa routing, antarmuka, validasi, dan fitur operasional bekerja dengan sesi administrator serta data production yang aman. Tahap ini tidak mengaktifkan pilot, workflow n8n, outbound, Business Rules, atau template yang belum disetujui.

## Aturan keselamatan

1. Gunakan akun `admin@binahub.id` hanya untuk pengujian administrator.
2. Beri seluruh data sintetis awalan `UAT-P16-20260904` agar mudah ditemukan.
3. Gunakan domain `example.invalid` untuk data yang tidak boleh menerima email.
4. Jangan memakai data klien nyata untuk pengujian destructive action.
5. Jangan mengaktifkan master switch pilot/live, workflow n8n, delegasi, SLA, atau outbound.
6. Jangan approve template maupun wording Finance/Legal atas nama CEO.
7. Jangan mempublikasikan produk sintetis ke katalog publik. Uji publish publik hanya memakai produk nyata yang sudah disetujui owner bisnis.
8. Untuk item yang sudah memiliki data historis, gunakan archive bila tersedia; jangan menghapus evidence production.

## Gate A — Deployment dan batas akses

Precheck tanpa token pada 3 September 2026:

| URL | Hasil |
| --- | --- |
| `https://app.binahub.id/` | HTTP 200 |
| `https://app.binahub.id/api/auth/role` | HTTP 401 |
| `https://app.binahub.id/admin` | Rute tersedia |
| `https://app.binahub.id/admin/programs/tests` | Rute tersedia |

Pemeriksaan manusia:

1. Buka jendela incognito.
2. Buka `https://app.binahub.id/admin`.
3. Pastikan aplikasi mengarahkan pengguna anonim ke halaman login dan tidak menampilkan data admin.
4. Tutup incognito, lalu login sebagai `admin@binahub.id` pada browser normal.
5. Pastikan tujuan setelah login adalah `/admin/dashboard`.
6. Refresh halaman dashboard. Sesi harus bertahan dan halaman tidak kembali ke hub lama.
7. Buka `/admin/programs/tests`, refresh, lalu pastikan pemilih program tampil.

Gate A lulus apabila akses anonim tertutup, administrator masuk ke dashboard kanonis, dan refresh tidak menghilangkan sesi/konteks.

Hasil operator 4 September 2026: **PASS**. Akses anonim tertutup, login menuju `/admin/dashboard`, sesi bertahan setelah refresh, dan pemilih program Pre-test/Post-test tampil.

## Gate B — Navigasi dan shell admin

Pada desktop, buka seluruh rute berikut dari sidebar. Jangan mengetik URL satu per satu karena yang diuji adalah navigasinya.

- `/admin/dashboard`
- `/admin/acquisition`
- `/admin/pipeline`
- `/admin/assessments`
- `/admin/meetings`
- `/admin/contacts`
- `/admin/inquiries`
- `/admin/clients`
- `/admin/operations`
- `/admin/automation`
- `/admin/programs`
- `/admin/catalog`
- `/admin/programs/tests`
- `/admin/lep`
- `/admin/users`
- `/admin/rbac`
- `/admin/settings`
- `/admin/tbos`

Pada setiap halaman pastikan:

1. hanya ada satu judul utama;
2. breadcrumb sesuai dengan kelompok menu;
3. menu aktif terlihat;
4. tidak ada instruksi developer/UAT/pilot pada UI produk;
5. loading, empty state, atau error mempunyai pesan yang dapat dipahami;
6. tidak ada horizontal overflow.

Ulangi pemeriksaan inti pada viewport mobile atau perangkat sekitar 390 × 844:

1. buka drawer navigasi;
2. scroll sampai menu terakhir;
3. buka minimal Dashboard, Program, Pre-test/Post-test, LEP, dan T-BOS;
4. pastikan drawer menutup setelah memilih menu;
5. pastikan tombol dan konten tidak tertutup bottom navigation atau panel lain.

Hasil operator 4 September 2026: **PASS WITH FINDINGS**. Desktop dan mobile lulus seluruh checklist. Temuan yang masuk perbaikan `v0.18.3`: panduan fungsi tombol, status program otomatis dan shortcut manual, cache navigasi admin, visual distribusi assessment mobile, serta header admin fixed.

### Gate B2 — Deploy dan verifikasi remediasi

Gate C baru dimulai setelah dua release berikut aktif di production:

1. deploy `binahub-api v0.18.1` terlebih dahulu; release ini menangani status program otomatis;
2. deploy `app-binahub v0.18.3`; release ini menangani navigasi, panduan, shortcut status, distribusi assessment, dan fixed header;
3. tidak ada SQL migration atau environment variable baru untuk kedua release;
4. setelah deployment, lakukan hard refresh lalu login ulang sebagai `admin@binahub.id`;
5. buka Dashboard → Assessment → Program → Klien & Pelaksanaan. Perpindahan yang sudah pernah dibuka harus memakai prefetch/cache dan tidak lagi melakukan pemeriksaan role penuh pada setiap halaman;
6. pada mobile, pastikan Distribusi jawaban dapat dipilih per rentang tujuh soal dan menampilkan label, persentase, serta jumlah respons;
7. scroll halaman Klien & Pelaksanaan dan pastikan header global tetap terlihat;
8. buka `Cara kerja` pada minimal Program, Katalog, Assessment, dan Pre-test/Post-test; isi panel harus menjelaskan tujuan serta fungsi tombol pada halaman tersebut;
9. buka daftar Program dan pastikan `Pintasan status` berada pada kartu, sementara halaman `Kelola` tidak lagi memiliki kontrol status kedua.

Jika salah satu poin masih gagal, berhenti di Gate B dan kirim screenshot beserta URL halaman. Jangan membuat data Gate C sebelum deployment keduanya terkonfirmasi.

## Gate C — Katalog dan pengaturan bisnis

### Katalog

Yang diuji adalah **satu produk dan satu modul**. Produk adalah paket/keluarga penawaran yang dapat dilihat calon pembeli. Modul adalah komponen layanan di dalam produk yang memiliki scope, deliverable, durasi, dan harga. Karena tombol `Modul baru` membutuhkan induk produk, buat produk lebih dahulu.

#### C1 — Buat produk induk

1. Buka `/admin/catalog`, lalu klik `Produk baru`.
2. Isi persis seperti berikut:

| Field | Nilai uji | Arti field |
| --- | --- | --- |
| Nama produk | `UAT-P16-20260904 Katalog Internal` | Nama paket/keluarga penawaran. |
| Product key | `uat_p16_20260904` | ID bisnis internal yang stabil; gunakan huruf kecil dan underscore. |
| Slug publik | `uat-p16-20260904-internal` | Potongan URL katalog; gunakan huruf kecil dan tanda hubung. |
| Status | `concept` | Masih data uji, belum siap ditawarkan. |
| Ringkasan publik | `Paket sintetis untuk acceptance internal.` | Ringkasan singkat pada kartu katalog. |
| Deskripsi publik | `Data uji Fase 16. Tidak untuk ditawarkan kepada klien.` | Penjelasan panjang jika suatu saat dibuka ke publik. |
| Tujuan internal | `Memvalidasi create, edit, persistence, dan visibility gate katalog.` | Catatan tujuan bagi tim internal. |
| URL cover image | Kosongkan | Tidak dibutuhkan untuk acceptance. |
| Tampil ke publik | **OFF** | Wajib off agar data sintetis tidak bocor ke katalog publik. |
| Featured | **OFF** | Data uji tidak boleh dipromosikan. |
| Urutan | `999` | Menempatkan data uji di urutan akhir. |

3. Klik `Simpan`, refresh halaman, lalu pastikan kartu produk muncul tepat satu kali.

#### C2 — Buat modul di dalam produk

1. Klik `Modul baru` dan pilih produk `UAT-P16-20260904 Katalog Internal`.
2. Isi persis seperti berikut:

| Field | Nilai uji | Arti field |
| --- | --- | --- |
| Nama modul | `Modul Uji Internal` | Nama komponen layanan yang dapat dimasukkan ke proposal/program. |
| Kode modul | `UAT-P16-MOD-01` | Kode operasional unik. |
| Slug publik | `uat-p16-mod-01` | ID URL modul. |
| Deskripsi | `Modul sintetis untuk acceptance katalog.` | Ringkasan fungsi modul. |
| Scope standar | `Satu sesi simulasi internal tanpa peserta eksternal.` | Pekerjaan yang termasuk harga standar. |
| Deliverables | `Satu catatan hasil acceptance internal.` | Hasil yang wajib diberikan. |
| Di luar scope | `Pelaksanaan klien, perjalanan, dan sertifikasi.` | Batas agar penawaran tidak ambigu. |
| Harga dasar | `1000000` | Nilai uji Rp1.000.000 sebelum diskon/kuantitas. |
| Unit harga | `per program` | Dasar pengali harga. |
| Minimum qty | `1` | Jumlah minimum pembelian. |
| Durasi | `1 hari` | Estimasi durasi layanan. |
| Versi katalog | `v0.0-uat` | Versi definisi modul. |
| Kesiapan | `testing` | Belum boleh ditawarkan sebagai modul siap. |
| Aktif | **ON** | Memastikan modul tersedia untuk penggunaan internal. |
| Tampil publik | **OFF** | Wajib off untuk data sintetis. |
| Featured | **OFF** | Tidak dipromosikan. |

3. Simpan, refresh, lalu pastikan modul muncul tepat satu kali di bawah produk yang benar.
4. Edit modul: ubah harga menjadi `1250000` dan tambahkan kalimat `Perubahan acceptance tersimpan.` pada deskripsi.
5. Simpan dan refresh. Harga harus menjadi Rp1.250.000 dan deskripsi baru tetap tersimpan.
6. Buka `/catalog` pada tab incognito. Cari nama/kode UAT; produk dan modul ini **tidak boleh muncul**.
7. Cleanup aman: edit modul menjadi `retired`, matikan `Aktif`, pastikan `Tampil publik` serta `Featured` tetap off, lalu simpan. Edit produk menjadi `retired` dengan kedua switch publik tetap off.

Publish/unpublish publik ditunda sampai tersedia produk nyata yang memang disetujui untuk tampil ke publik.

### Pengaturan bisnis

Pengujian ini hanya menguji validasi; **jangan mengisi keputusan bisnis baru**.

1. Buka `/admin/settings` dan ambil screenshot tiap tab sebelum mengubah apa pun: Transaksi, Owner & backup, Approval & delegasi, SLA risiko, Proposal & invoice.
2. Pada `Owner & backup`, pilih satu kartu fungsi yang masih nonaktif atau memang memakai `admin@binahub.id` untuk kebutuhan teknis.
3. Pilih `admin@binahub.id` pada field `Owner` dan `Backup` di kartu yang sama, lalu klik `Simpan perubahan`.
4. Hasil yang benar: sistem menolak karena owner dan backup tidak boleh sama. Tidak boleh muncul toast sukses.
5. Refresh halaman dan pastikan nilai sebelum pengujian tidak berubah.
6. Pada `Approval & delegasi`, hanya periksa bahwa item yang menunggu CEO tetap nonaktif; jangan memilih approver atau delegasi baru.
7. Pada `SLA risiko`, hanya periksa bahwa kebijakan tanpa keputusan bisnis tetap nonaktif; jangan mengubah target menit.
8. Pada `Proposal & invoice`, buka dan baca template tetapi jangan mengubah status menjadi `approved`.
9. Jangan mengaktifkan Business Rules, master pilot/live, workflow, atau outbound dari halaman mana pun.

Hasil operator 4 September 2026: **PASS**. Pembuatan serta perubahan produk/modul, persistence, batas publikasi, dan seluruh pemeriksaan Pengaturan Bisnis berjalan lancar. Validasi owner dan backup menggunakan akun yang sama ditolak sesuai aturan. Screenshot Pengaturan Bisnis disimpan sebagai evidence operator; konfigurasi yang menunggu keputusan CEO tetap tidak diaktifkan.

## Gate D — Program, QR Code, dan bantuan

Gunakan program UAT yang sudah ada. Jika belum tersedia, klik `Buat Program` dan isi:

| Field | Nilai uji |
| --- | --- |
| Nama perusahaan | `BinaHub UAT Internal` |
| Lokasi | `Online` |
| Kode program | `UATP16-20260904` |
| Nama program | `UAT-P16-20260904 Learning Program` |
| Tipe | `Training` |
| Status awal | `Aktif` |
| Modul | Aktifkan `LEP` dan satu modul lain yang tersedia |
| Tanggal mulai | Tanggal hari pengujian |
| Tanggal selesai | Tanggal setelah seluruh acceptance diperkirakan selesai |
| Kapasitas | `10` |

Program ini tidak memakai peserta atau email klien nyata.

1. Setelah program tersimpan, kembali ke `/admin/programs` dan cari `UATP16-20260904`.
2. Refresh. Jika tanggal mulai adalah hari ini, status harus otomatis menjadi `Berjalan`; jika tanggal mulai masih di masa depan, status tetap `Aktif`.
3. Uji dropdown `Pintasan status` pada kartu, pilih transisi yang tersedia, batalkan dialog pertama, lalu ulangi dan konfirmasi hanya jika perubahan tersebut memang aman untuk program UAT.
4. Klik `Kelola`; pastikan tidak ada kontrol perubahan status kedua di halaman ini.
5. Buka `Cara kerja`; panel harus menjelaskan fungsi tombol tanpa menutupi halaman setelah ditutup.
6. Pastikan modul dapat diubah dan link `Susun soal & lihat statistik pre/post-test` mempertahankan program yang sama.
7. Klik `Bagikan`, salin link, dan pastikan program/kode pada URL benar.
8. Generate dan download QR Code. Nama file harus memuat nama atau kode program.
9. Scan QR menggunakan ponsel; hasil harus mengarah ke program UAT yang sama.

Hasil operator 5 September 2026: pembuatan program lulus setelah perbaikan kontrak modul `binahub-api v0.18.2`. Temuan lanjutan Gate D masuk release `v0.19.0`: QR harus mengisi kode program otomatis, dan kode peserta harus dapat diunduh sebagai TXT maupun kartu PNG bermerek. Setelah deployment, ulangi langkah 7–9 dan tambahkan pemeriksaan berikut:

10. Pastikan URL undangan memuat parameter `program` dan `code`, lalu buka/scan URL tersebut. Kolom Kode akses harus langsung terisi tanpa diketik, tetapi server tetap memverifikasinya.
11. Daftarkan peserta sintetis. Pada dialog kode peserta, unduh TXT dan PNG.
12. Buka PNG dan pastikan logo BinaHub, nama perusahaan, nama program, dan kode peserta terbaca serta nama file mengenali program.
13. Centang konfirmasi penyimpanan kode, lalu masuk ke beranda program.

## Gate E — Pre-test dan Post-test end-to-end

### Menyiapkan Pre-test

1. Dari program UAT, klik `Susun soal & lihat statistik pre/post-test`. Pemilih program harus otomatis menunjukkan `UAT-P16-20260904 Learning Program`.
2. Pilih `Pre-test` dan buka tab Pengaturan.
3. Gunakan judul `UAT-P16 Pre-test Kepemimpinan`.
4. Isi deskripsi `Pre-test sintetis untuk memvalidasi editor dan pengalaman peserta.` dan petunjuk `Jawab seluruh pertanyaan wajib. Data ini hanya untuk acceptance internal.`.
5. Atur skor lulus `70`, retake nonaktif, dan shuffle nonaktif.
6. Simpan sebagai draft.

Tambahkan tujuh pertanyaan berikut untuk menguji setiap jenis kontrol:

| Urutan | Jenis | Pertanyaan dan pilihan | Pengaturan |
| --- | --- | --- | --- |
| 1 | Pilihan ganda | `Umpan balik yang baik seharusnya?` Pilihan: `Spesifik dan dapat ditindaklanjuti`, `Umum agar tidak menyinggung`, `Ditunda tanpa tenggat` | Kunci pilihan pertama, 10 poin, wajib |
| 2 | Kotak centang | `Pilih unsur komunikasi efektif.` Pilihan: `Tujuan yang jelas`, `Konfirmasi pemahaman`, `Asumsi tanpa klarifikasi` | Kunci pilihan pertama dan kedua, 10 poin, wajib |
| 3 | Ya/Tidak | `Tujuan perlu dijelaskan sebelum tugas dimulai?` | Kunci `Ya`, 5 poin, wajib |
| 4 | Skala linear | `Seberapa yakin Anda menerapkan materi?` | Skala 1–5; label kiri `Belum yakin`; label kanan `Sangat yakin`; wajib; tidak perlu kunci |
| 5 | Jawaban singkat | `Tuliskan satu prioritas perbaikan.` | Tanpa kunci, wajib |
| 6 | Paragraf | `Jelaskan rencana penerapan Anda.` | Tanpa kunci, opsional |
| 7 | Angka | `Berapa jumlah sesi tindak lanjut?` | Kunci `2`, 5 poin, wajib |

Susun ketujuh pertanyaan terlebih dahulu. Setiap tombol pada dialog hanya menambahkan perubahan ke draf lokal dan tidak melakukan request server. Setelah semuanya benar:

1. edit kembali satu pertanyaan dan pastikan nilai masih benar;
2. duplikasi satu pertanyaan lalu hapus salinannya;
3. pindahkan minimal satu pertanyaan naik dan turun;
4. klik `Simpan semua soal` satu kali;
5. refresh dan pastikan seluruh soal serta urutannya bertahan;
6. pastikan satu batch save tidak membutuhkan tujuh loading server terpisah.

### Preview

1. Klik `Pratinjau peserta`.
2. Coba kontrol desktop dan mobile.
3. Isi beberapa jawaban dan pastikan indikator progres berubah.
4. Pastikan tombol kirim dinonaktifkan dalam preview.
5. Tutup preview dengan tombol tutup dan tombol Escape.
6. Pastikan fokus kembali ke kontrol yang masuk akal.

### Publish dan respons

1. Publikasikan Pre-test.
2. Buka link program pada incognito. Daftarkan peserta sintetis bernama `Peserta UAT P16`; gunakan `peserta.uat.p16@example.invalid` hanya jika email diminta. Simpan kode peserta yang ditampilkan karena domain tersebut tidak menerima email.
3. Isi seluruh pertanyaan wajib lalu submit satu kali. Untuk hasil yang mudah diverifikasi, pilih dua jawaban berkunci pada pertanyaan 1–3, masukkan `2` pada pertanyaan angka, dan isi teks sintetis pada pertanyaan terbuka.
4. Pastikan halaman terima kasih muncul. Karena retake nonaktif, soal tidak boleh muncul kembali setelah refresh; tombol kembali harus menuju beranda program.
5. Kembali ke admin, buka tab Respons.
6. Pastikan jumlah respons bertambah tepat satu.
7. Periksa rata-rata, skor tertinggi/terendah, distribusi, dan statistik per pertanyaan.
8. Buka `Jawaban per peserta`; nama `Peserta UAT P16`, jawaban, serta label Benar/Salah/Tidak dinilai harus terlihat.
9. Unduh CSV dan PDF. Keduanya harus memuat nama peserta, pertanyaan, jawaban, dan hasil penilaian; PDF harus rapi saat dibuka.
10. Coba edit/hapus/reorder pertanyaan setelah respons masuk. Sistem harus menolak atau mengunci kontrol.
11. Tutup penerimaan respons dan pastikan peserta tidak dapat membuat respons baru.

### Post-test dan retake

1. Pilih `Post-test` pada program yang sama dan isi judul `UAT-P16 Post-test Kepemimpinan`.
2. Isi deskripsi `Post-test sintetis untuk memvalidasi retake dan statistik.` dan petunjuk `Selesaikan tes lalu ulangi satu kali.`.
3. Atur skor lulus `70`, aktifkan retake, nonaktifkan shuffle, lalu simpan sebagai draft.
4. Tambahkan tiga pertanyaan berikut:
   - Pilihan ganda `Umpan balik yang efektif bersifat?` dengan pilihan `Spesifik`, `Samar`, `Tanpa tindak lanjut`; kunci `Spesifik`, 10 poin, wajib.
   - Ya/Tidak `Tindak lanjut perlu memiliki tenggat?`; kunci `Ya`, 5 poin, wajib.
   - Jawaban singkat `Apa tindakan pertama Anda setelah program?`; tanpa kunci, wajib.
5. Buka pratinjau, pastikan ketiga kontrol tampil, lalu tutup pratinjau.
6. Publikasikan Post-test dan buka link program memakai peserta UAT yang sama.
7. Kirim attempt pertama dengan jawaban berkunci, lalu mulai ulang dan kirim attempt kedua dengan satu jawaban berbeda.
8. Kembali ke tab Respons. Pastikan tercatat dua attempt yang berbeda untuk peserta yang sama, bukan satu baris yang tertimpa atau duplikasi satu submission.
9. Pastikan statistik jumlah attempt, nilai, dan distribusi jawaban berubah sesuai dua respons tersebut.

### BinaInsight khusus program

1. Pilih tab `BinaInsight Program` pada editor program yang sama.
2. Buat form berjudul `UAT-P16 BinaInsight Program`, tambahkan minimal satu skala dan satu pertanyaan terbuka, lalu simpan semua dan publikasikan.
3. Masuk sebagai peserta UAT dan buka kartu BinaInsight dari beranda program. URL harus tetap berada di `/client/program/test?kind=binainsight`, bukan assessment gratis `/insight`.
4. Submit satu kali dan pastikan halaman terima kasih kembali ke beranda program.
5. Pastikan respons muncul hanya pada tab BinaInsight Program dan tidak masuk dashboard assessment publik gratis.

### Pemeriksaan performa peserta

Berpindahlah berurutan dari Beranda Program → Pre-test → Beranda → LEP → Beranda → Post-test. Data cache boleh tampil langsung, lalu direvalidasi di belakang layar. Tidak boleh ada layar kosong atau full-screen loading 5–10 detik pada rute yang sudah pernah dibuka; hasil mutasi harus tetap diperbarui setelah revalidasi.

## Gate F — LEP dan T-BOS regression

### LEP

1. Buka `/admin/lep`.
2. Pastikan daftar program muncul.
3. Pilih `UAT-P16-20260904 Learning Program` dan refresh halaman.
4. Pastikan pilihan program serta statistik tidak hilang.
5. Jika belum ada respons, empty state harus menjelaskan tindakan berikutnya.

### T-BOS

1. Buka `/admin/tbos` dari sidebar global.
2. Pastikan tidak muncul sidebar T-BOS kedua.
3. Pilih program dan batch yang **sudah memiliki data uji lama**. Jangan membuat observasi T-BOS baru hanya untuk gate ini.
4. Uji tab Ringkasan, Grafik Radar, Heatmap, Peringkat, dan Perbandingan Batch.
5. Pastikan tabel, filter, PDF, dan CSV tetap bekerja seperti sebelum penyatuan shell.
6. Jangan mengubah desain internal T-BOS pada acceptance ini; hanya catat regresi fungsional atau layout.

## Gate G — Penutupan acceptance

Hasil operator 5 September 2026: **PASS**. Gate D QR/kode peserta, Gate E form program dan respons, serta Gate F regresi LEP/T-BOS telah dikonfirmasi lulus. Tidak ada blocker tambahan yang dilaporkan. Dengan hasil Gate A-C sebelumnya, production acceptance produk Fase 16B dinyatakan selesai.

Gate fitur lulus jika:

- seluruh rute dapat dibuka sesuai role;
- tidak ditemukan kebocoran akses atau error 5xx;
- create/edit/validation/archive berjalan pada data UAT;
- Pre-test/Post-test berhasil dari builder sampai statistik;
- QR mengarah ke program yang benar;
- LEP mempunyai konteks program;
- T-BOS tidak mengalami regresi;
- desktop dan mobile tidak mengalami overflow atau kontrol tertutup.

Klasifikasikan temuan:

- `BLOCKER`: akses bocor, data rusak/hilang, error 5xx, atau alur utama tidak dapat selesai;
- `HIGH`: hasil salah, duplikasi data, atau validasi penting dapat dilewati;
- `MEDIUM`: UX membingungkan tetapi alur masih dapat diselesaikan;
- `LOW`: kosmetik, alignment, copy, atau polish non-blocking.

## Format laporan operator

Kirim hasil dengan format berikut, tanpa menyalin token, password, atau data pribadi:

```text
Fase 16B Production Acceptance
Tanggal/jam:
Browser/perangkat:

Gate A — Access & deployment: PASS/FAIL
Catatan:

Gate B — Navigation & shell: PASS/FAIL
Desktop:
Mobile:
Catatan:

Gate C — Catalog & settings: PASS/FAIL/PENDING
Catatan:

Gate D — Program & QR: PASS/FAIL/PENDING
Catatan:

Gate E — Pre/Post-test: PASS/FAIL/PENDING
Builder:
Preview:
Submission:
Statistics/CSV:
Audit lock:
Catatan:

Gate F — LEP & T-BOS: PASS/FAIL/PENDING
Catatan:

Daftar temuan:
1. [SEVERITY] halaman — kondisi — hasil aktual — hasil yang diharapkan

Kesimpulan sementara: PASS / PASS WITH FINDINGS / BLOCKED
```

## Setelah seluruh gate lulus

Jangan langsung mengaktifkan automation. Tahap berikutnya adalah menyelesaikan approval template dan Business Rules, menetapkan owner/cohort/change window, membuat release non-mock, menjalankan rehearsal production dry-run, mengambil snapshot monitoring real, menguji kill switch, kemudian mencatat acceptance dan keputusan go/no-go manusia.
