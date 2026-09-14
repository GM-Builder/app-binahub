# Panduan BinaHub End-to-End — Bahasa Mudah

Dokumen ini menjelaskan BinaHub seperti menjelaskan sebuah kantor kepada orang yang baru pertama kali melihat sistemnya.

## 1. Gambaran paling sederhana

Bayangkan BinaHub adalah sebuah gedung kerja:

- **Website** adalah pintu depan. Orang datang, membaca layanan, lalu mengisi formulir.
- **Inquiry Masuk** adalah meja resepsionis. Semua pertanyaan baru masuk ke sini.
- **Kontak & Lead** adalah buku alamat. Identitas dan riwayat calon klien disimpan di sini.
- **Pipeline Penjualan** adalah papan perjalanan penjualan. Kita dapat melihat siapa baru dikenal, siapa sedang konsultasi, siapa menerima proposal, dan siapa sudah menjadi klien.
- **Klien & Pelaksanaan** adalah ruang kerja setelah penjualan berhasil.
- **Program & Produk** adalah rak berisi layanan yang boleh dijual dan dijalankan.
- **Pusat Otomasi** adalah kumpulan robot kecil yang mengerjakan pekerjaan berulang.
- **Tata Kelola** adalah kunci, pagar, dan aturan. Robot tidak boleh bertindak di luar batas.
- **Monitoring dan log** adalah kamera serta buku catatan. Setiap proses penting meninggalkan bukti.

Jadi BinaHub bukan satu robot besar. BinaHub adalah banyak ruang kerja yang saling menyambung, beberapa robot kecil, dan manusia yang memegang keputusan berisiko.

## 2. Siapa melakukan apa

### Pengunjung

Pengunjung boleh membuka halaman publik, mengisi inquiry, assessment, atau booking konsultasi. Pengunjung tidak boleh membuka ruang admin.

### Admin

Admin merapikan data, menyetujui sumber, mengelola katalog, memutuskan pengecualian, mengatur pilot, dan melihat audit. Dalam kondisi saat ini `admin@binahub.id` menjadi pemilik interim untuk fungsi yang belum mempunyai orang berbeda.

### Fasilitator

Fasilitator hanya melihat program dan mission yang ditugaskan kepadanya. Ia memilih tim, mengisi observasi T-BOS, lalu mengirim hasil.

### Peserta

Peserta mengikuti program dan hanya melihat informasi atau hasil yang memang menjadi miliknya. Ia tidak boleh melihat data tim lain.

### Robot otomasi

Robot mengerjakan pekerjaan rutin, misalnya mencari tindak lanjut yang sudah jatuh tempo, memproses event, membuat pekerjaan operasional, dan memeriksa batch prospek. Robot tetap mengikuti batas jumlah, mode dry-run/pilot/live, idempotency, approval, dan kill switch.

### AI

AI membantu membaca, mengelompokkan, menyusun draf, atau memberi skor/rekomendasi. AI bukan pemilik keputusan bisnis. Hasil AI harus disimpan bersama sumber dan alasan agar manusia dapat memeriksanya.

## 3. Perjalanan calon klien dari awal sampai menjadi klien

### Langkah 1 — Orang datang

Orang dapat datang dari website, iklan, media sosial, referral, assessment, atau data prospek yang sah.

Sistem mengetahui sumber hanya jika ada tanda pengenal, misalnya:

- parameter UTM pada tautan iklan;
- referrer dari halaman sebelumnya;
- kode kampanye;
- integrasi formulir;
- sumber dan batch yang dipilih ketika impor.

Sistem tidak dapat menebak sumber secara ajaib bila tanda tersebut tidak dikirim. Bila datanya tidak ada, sumber harus ditandai `unknown` atau dibetulkan manusia; jangan mengarang sumber.

### Langkah 2 — Masuk ke Inquiry

Inquiry adalah pesan atau minat awal. Sistem menyimpan nama, email/telepon, isi pertanyaan, waktu, dan sumber yang tersedia. Status awal biasanya `Baru`.

Robot follow-up boleh menghitung kapan H+2, H+7, dan H+14 tiba. Pada mode dry-run robot hanya menunjukkan kandidat. Pada pilot/live yang sah robot boleh mengirim hanya kepada penerima dalam cohort dan aturan yang disetujui.

### Langkah 3 — Menjadi Kontak dan Lead

Kontak adalah orangnya. Lead adalah peluang bisnisnya. Satu orang sebaiknya tidak dibuat berkali-kali hanya karena datang dari dua formulir.

Sebelum promosi menjadi lead, sistem memeriksa:

1. format data valid;
2. tidak ada duplikat;
3. alamat tidak masuk suppression atau opted-out;
4. sumber dan kampanye sah;
5. batch sudah ditinjau manusia.

Human gate pada tahap ini bukan berarti admin mengetik seluruh data satu per satu. Data boleh masuk otomatis atau melalui impor. Manusia hanya membuka pintu sumber/kampanye dan menyetujui batch yang aman.

### Langkah 4 — Bergerak di Pipeline

Tahap pipeline dibaca seperti antrean:

1. **Teridentifikasi** — kita baru mengenal calon klien.
2. **Terkualifikasi** — kebutuhan dan kecocokannya sudah cukup jelas.
3. **Konsultasi** — percakapan kebutuhan sedang berlangsung.
4. **Proposal** — penawaran sedang dibuat atau ditinjau.
5. **Negosiasi** — ruang lingkup dan harga sedang disepakati.
6. **Won/Berhasil** — setuju menjadi klien.
7. **Lost/Tidak lanjut** — peluang berhenti, dengan alasan yang dicatat.

Setiap peluang idealnya mempunyai owner, tindakan berikutnya, dan tenggat. Tujuannya sederhana: tidak ada calon klien yang terlupakan.

### Langkah 5 — Proposal dan persetujuan

Proposal standar dapat bergerak memakai aturan default. Human gate dipakai ketika risikonya lebih tinggi, misalnya diskon pengecualian, scope kustom, nilai strategis, transaksi di bawah minimum, atau isu legal/reputasi.

Ambang Rp15 juta berarti transaksi di bawah batas tersebut meminta pengecualian manusia. Transaksi di atas batas tidak otomatis bebas aturan; ia tetap mengikuti rule lain bila diskon, scope, legal, atau risikonya khusus.

### Langkah 6 — Menjadi klien

Ketika deal berhasil, data tidak berhenti di sales. Sistem membuat serah terima ke ruang Klien & Pelaksanaan. Di sana ditentukan:

- penanggung jawab komersial;
- penanggung jawab pelaksanaan;
- stakeholder/PIC;
- milestone;
- risiko dan kesehatan akun;
- review berikutnya;
- peluang lanjutan.

## 4. Katalog program dan produk

Katalog adalah daftar resmi barang/jasa yang boleh ditawarkan. Admin memasukkan nama modul, scope, hasil, satuan, harga/status harga, dan status kesiapan. Memasukkan item ke katalog belum berarti menjual atau mengirim sesuatu. Item baru dipakai oleh transaksi setelah status dan aturan yang diperlukan lengkap.

Modul yang ada dapat mempunyai alur berbeda. Contohnya BinaInsight untuk assessment, sedangkan T-BOS untuk observasi perilaku tim.

## 5. T-BOS dari awal sampai akhir

T-BOS adalah alat untuk mencatat perilaku tim saat menjalankan mission. Bukan alat untuk menilai pribadi secara sembarangan.

### 5.1 Admin membuat program

Program adalah wadah kegiatan. Admin memberi nama program, mengaktifkan modul T-BOS, lalu menentukan periodenya.

### 5.2 Admin membuat batch

Batch adalah kelompok peserta di dalam program, seperti “PFA September 2026” atau “Kelas Pagi”. Nama batch boleh fleksibel, tidak hanya “Batch 1” dan “Batch 2”. Nama wajib berisi teks dan maksimal 50 karakter.

### 5.3 Admin membuat tim

Tim berada di dalam satu program dan satu batch. Admin mengisi nama tim lalu memilih batch. Database menyimpan `program_id`, `batch_id`, dan salinan nama batch untuk pelacakan.

Bug lama terjadi karena layar dan API menerima nama batch fleksibel, tetapi pagar database lama hanya menerima “Batch 1” atau “Batch 2”. Migration 0048 menghapus pagar lama dan menggantinya dengan aturan baru yang sesuai layar.

### 5.4 Admin menugaskan fasilitator

Admin memasangkan fasilitator dengan program dan mission tertentu. Fasilitator tidak otomatis boleh mengobservasi semua program.

### 5.5 Admin/fasilitator menyiapkan anggota

Anggota tim dimasukkan bersama perannya. Tepat satu orang menjadi captain. Penambahan banyak anggota dilakukan sebagai satu transaksi: semuanya berhasil, atau semuanya batal. Ini mencegah roster setengah tersimpan.

Sesudah observasi pertama ada, roster dikunci agar identitas peserta yang dinilai tidak berubah diam-diam.

### 5.6 Fasilitator memilih tim dan mission

Sistem hanya menampilkan pilihan yang memang ditugaskan. Ini mencegah fasilitator memasukkan nilai ke kegiatan yang bukan tanggung jawabnya.

### 5.7 Fasilitator memberi nilai

Setiap dimensi diberi level 1–5:

- 1 Reactive;
- 2 Emerging;
- 3 Functional;
- 4 Effective;
- 5 Exemplary.

Dimensi yang muncul mengikuti mission. Catatan fasilitator menjadi konteks mengapa level tersebut dipilih.

### 5.8 Draft dan kondisi internet

Form dapat menyimpan draft di perangkat. Jika jaringan putus, pengiriman masuk antrean lokal dan dicoba lagi. Setiap pengiriman mempunyai idempotency key—seperti nomor resi—agar menekan tombol dua kali tidak membuat dua observasi.

### 5.9 API dan database memeriksa kiriman

Sebelum menerima nilai, sistem memeriksa sesi login, role fasilitator, assignment, program, tim, mission, level 1–5, dan duplikasi. Satu kombinasi program + tim + mission mempunyai satu observasi kanonik.

### 5.10 Sistem menghitung skor

Bahasa paling mudahnya:

1. nilai setiap dimensi dikumpulkan;
2. nilai dimensi yang relevan dirata-ratakan menjadi **T-BOS Score mission**;
3. T-BOS Score itu langsung menjadi **skor akhir mission** pada skala 1–5;
4. skor akhir seluruh mission dirata-ratakan menjadi **Overall Team Score**.

Formula lama 60% performance + 40% T-BOS sudah tidak dipakai.

Contoh: sebuah mission memakai nilai 4, 5, dan 3. Skornya `(4 + 5 + 3) / 3 = 4,0`.

### 5.11 Hasil ditampilkan

Admin dapat melihat ranking, heatmap, radar, ringkasan eksekutif, perbandingan batch, dan laporan tim. Fasilitator melihat area yang menjadi tugasnya. Peserta hanya melihat agregat miliknya, bukan data tim lain.

### 5.12 Koreksi dan penguncian

Observasi yang masih boleh diedit mengikuti state machine. Koreksi tidak membuat catatan lama hilang tanpa jejak; perubahan penting masuk audit trail. Setelah dikunci, perubahan harus mengikuti jalur yang berwenang.

### 5.13 Ekspor

Laporan dapat diekspor ke CSV/PDF. CSV menetralkan awalan formula berbahaya. PDF dan endpoint ekspor memerlukan otorisasi yang sesuai.

## 6. Empat robot utama

### Follow-up Scheduler

Mencari inquiry/assessment yang sudah waktunya ditindaklanjuti. Ia mengecek template, suppression, urutan pesan, cohort, limit, dan mode. Ia tidak boleh mengirim ganda.

### Transformation Event Worker

Mengambil event yang menunggu, mengubahnya menjadi perubahan data berikutnya, memakai retry/lease/idempotency, lalu menandai berhasil atau gagal.

### Client Operations

Memindai klien, milestone, risiko, dan review; lalu menyiapkan tugas manusia. Robot membantu membuat antrean, bukan mengambil keputusan relasi klien.

### Acquisition Processor

Memeriksa batch prospek yang sudah disetujui: validasi, deduplikasi, suppression, batas jumlah, dan promosi lead. Ia tidak sama dengan pengirim email.

## 7. Apa yang manual dan apa yang otomatis

| Pekerjaan | Sistem | Manusia |
|---|---|---|
| Menyimpan inquiry dari formulir | Otomatis | Tidak perlu |
| Membaca UTM/referrer/kode kampanye | Otomatis bila datanya ada | Membetulkan bila sumber hilang |
| Validasi, deduplikasi, suppression | Otomatis | Meninjau pengecualian |
| Membuka sumber/kampanye baru | Menegakkan aturan | Menyetujui sekali |
| Follow-up rutin | Otomatis saat pilot/live sah | Menangani balasan/pengecualian |
| Proposal standar | Dibantu sistem | Menyetujui kasus berisiko |
| Skor T-BOS | Dihitung otomatis | Fasilitator memberi observasi |
| Monitoring | Otomatis menyimpan log/snapshot | Owner merespons incident |
| Kill switch | Sistem menghentikan proses | Owner memutuskan kapan dipakai |

Target akhirnya bukan “semua manual”. Targetnya adalah pekerjaan rutin otomatis dan keputusan berisiko tetap punya manusia.

## 8. Pagar keselamatan

- **Dry-run**: robot berlatih dan menunjukkan apa yang akan dilakukan, tanpa efek nyata.
- **Pilot**: robot boleh bekerja sungguhan, tetapi hanya dalam waktu, jumlah, dan penerima yang disetujui.
- **Live**: robot bekerja normal setelah semua gate produksi lulus.
- **Human gate**: persetujuan manusia untuk keputusan berisiko.
- **Idempotency**: nomor resi yang mencegah pekerjaan ganda.
- **Suppression**: daftar “jangan dihubungi”.
- **SLA**: batas waktu untuk menangani pekerjaan/risiko.
- **Kill switch**: tombol berhenti darurat.
- **Audit log**: buku sejarah siapa melakukan apa dan kapan.

## 9. Ketika terjadi masalah

1. Monitoring menemukan kegagalan atau manusia melaporkan masalah.
2. Sistem mencatat incident dan tingkat keparahan.
3. Owner ditentukan; SLA mulai dihitung.
4. Jika risikonya besar, aktifkan kill switch.
5. Hentikan proses terkait dan amankan bukti.
6. Perbaiki penyebabnya.
7. Recovery mengembalikan sistem ke keadaan aman.
8. Rekonsiliasi membandingkan data sebelum dan sesudah supaya tidak ada data hilang/ganda.
9. Tutup incident hanya setelah bukti deployment dan verifikasi tersimpan.

## 10. Penjelasan singkat untuk CEO

“BinaHub menghubungkan perjalanan dari calon klien, penjualan, pelaksanaan, sampai pengukuran program dalam satu sistem. Pekerjaan rutin dijalankan otomatis, sedangkan keputusan yang berisiko tetap meminta persetujuan manusia. Setiap proses mempunyai batas, pencegah duplikasi, tombol berhenti, monitoring, dan audit. T-BOS sendiri mengatur program, batch, tim, fasilitator, observasi, perhitungan skor, dashboard, dan laporan secara terkontrol.”

