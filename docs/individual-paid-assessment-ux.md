# Asesmen individu berbayar — kontrak pengalaman pengguna

Status: **persiapan admin diimplementasikan, 16 Oktober 2026**; kontrak alur
pelanggan di bawah masih untuk tahap berikutnya. Gunakan bersama
[rancangan fondasi](individual-paid-assessment-plan.md).

App 0.38.0 dengan API 0.37.0/SQL 69 menyediakan draft konfigurasi terversi,
pembaca transaksi admin dan skema berakses privat. Identitas pelanggan tanpa
password, checkout, gateway, webhook, grant, pemulihan draft dan laporan berbayar,
pembayaran produksi serta pengiriman email berbayar belum diimplementasikan.
Ini bukan bukti deployment atau aktivasi penjualan.

## Tujuan dan arah desain

Peserta yang baru membaca hasil gratis dapat memahami manfaat lanjutan,
membayar, lalu melanjutkan asesmen dengan akses privat. Tidak harus membuat
password atau memahami istilah seperti entitlement, callback dan policy.

Mode: **Operate**, melanjutkan bahasa visual incumbent yang tercatat di
[individual-assessment-ux.md](individual-assessment-ux.md): navy BinaHub,
Plus Jakarta Sans, permukaan putih dan latar netral dingin. Ini perluasan alur
existing, bukan redesign merek. Pedoman Impeccable/Interaction Contracts
digunakan untuk memisahkan tindakan, konfirmasi server dan pemulihan gangguan.
Dokumen ini mencatat perluasan UI operasional; root DESIGN.md yang berisi
arsitektur tetap utuh. Tidak ada dunia visual baru, sidecar desain baru atau
aset raster yang dikirim; screenshot hanya menjadi bukti verifikasi.

- Pada hasil gratis, tawaran lanjutan berada setelah hasil dan langkah praktis,
  bukan paywall yang menghalangi laporan yang sudah menjadi hak peserta.
- Pada layar paket/pesanan, bagian teratas memuat nama layanan, cakupan,
  harga total dan satu aksi utama. Tidak perlu hero besar atau banner teknis.
- Desktop: isi utama dan ringkasan transaksi singkat. Ponsel: satu kolom,
  ringkasan total sebelum CTA; tidak ada horizontal scrolling atau modal bertumpuk.
- Nama kompetensi mengikuti instrumen CEO. Jangan mengarang manfaat, testimoni,
  waktu pengerjaan, kelulusan, sertifikasi, konsultasi/PDF yang belum termasuk.

## 1. Dari hasil gratis ke penawaran

Entry usulan: satu bagian **Lanjutkan pengembangan Anda** setelah rekomendasi
gratis, hanya bila ada penawaran aktif yang benar-benar dapat dibeli.

Tampilkan nama paket CEO, area yang dicakup, apa yang diterima, harga total
dan CTA **Lihat paket**. Teks publik tidak memakai nama SKU, status draft,
“menunggu validasi katalog”, “gateway belum disetujui”, atau alasan internal.
Jika belum siap, bagian penawaran tidak ditampilkan; hasil gratis tetap lengkap
sesuai hak existing. Tahap 1 tidak menambahkan CTA ini ke aplikasi.

## 2. Ringkasan paket

Urutan baca: nama → manfaat faktual → area/pertanyaan → bentuk hasil → total
biaya → hak pengisian/masa akses → ketentuan ringkas → CTA **Lanjutkan**.

- Harga total termasuk komponen biaya/pajak yang memang berlaku. Rincian dapat
  dibuka, tetapi biaya tidak boleh disembunyikan sampai sesudah pembayaran.
- Masa mulai, masa menyelesaikan, retake dan kebijakan refund ditulis sebagai
  bahasa pelanggan, berdasarkan ketentuan yang sudah disahkan.
- Persetujuan syarat pembelian terpisah dari izin evaluasi/marketing. Jika
  consent asesmen existing tidak mencakup layanan baru, perbarui sebelum mulai.
- Jangan menampilkan “laporan enam area” jika produk hanya menyediakan tiga
  tambahan. Jika gabungan disahkan nanti, jelaskan tanggal/konteks sumbernya.

## 3. Konfirmasi email tanpa password

- Tampilkan email tersimpan yang hanya diketahui dari sesi berizin. Boleh
  melewati pengiriman OTP baru bila bukti existing cukup untuk scope checkout.
- Bila perlu verifikasi: satu field **Email untuk menerima akses**, tombol
  **Kirim tautan akses**, lalu petunjuk membuka email. Tautan/OTP dipilih saat
  implementasi; jangan membangun dua mekanisme tanpa kebutuhan.
- Setelah request diterima, gunakan respons generik: **Jika alamat email dapat
  digunakan, petunjuk akses akan dikirim ke sana. Periksa juga folder spam.**
- Pisahkan status **Mengirim permintaan…** dari **Permintaan diterima**; jangan
  mengklaim email sudah tiba atau menampilkan apakah pelanggan terdaftar.
- Kesalahan format email ditampilkan di field. Gangguan jaringan mempertahankan
  input; retry tidak meminta pengguna mengulang semuanya.
- Tautan dibuka dengan satu tindakan eksplisit. GET tidak melakukan pembayaran,
  mengonsumsi token atau menghubungkan seluruh riwayat pengguna.

## 4. Checkout dan pemeriksaan pembayaran

Setelah backend menyimpan order, tampilkan ringkasan dan CTA **Lanjutkan ke
pembayaran**. Klik mendapat feedback segera: **Menyiapkan pembayaran…** dengan
indikator dan penguncian klik ganda. Jangan memaksakan timer lima detik atau
menyatakan selesai sebelum respons benar-benar diterima.

Gateway membuka hosted checkout. Jika pengguna kembali tanpa membayar, pesanan
tetap dapat dilanjutkan selama valid. Menutup halaman bukan pembatalan transaksi
yang mungkin sudah terjadi di bank/gateway. Status tetap milik backend.

| Kondisi server | Judul dan penjelasan publik | Aksi utama |
| --- | --- | --- |
| Menunggu pembayaran | **Selesaikan pembayaran Anda.** Ringkasan dan batas waktu dari transaksi asli | **Lanjutkan pembayaran** |
| Status belum pasti | **Pembayaran sedang diperiksa.** Jika Anda sudah membayar, tidak perlu membayar kembali | **Periksa pembayaran** |
| Pembayaran terverifikasi, akses belum tersedia | **Pembayaran diterima. Akses Anda sedang disiapkan.** Anda dapat kembali melalui email | **Periksa akses** |
| Akses siap | **Asesmen Anda siap dimulai.** Tampilkan layanan dan email penerima yang berizin | **Mulai asesmen** |
| Draft sudah ada | **Lanjutkan asesmen Anda.** Tampilkan progres nyata, bukan estimasi palsu | **Lanjutkan asesmen** |
| Sudah selesai | **Hasil asesmen Anda tersedia.** Tampilkan tanggal pengisian | **Lihat hasil** |
| Kedaluwarsa/batal terkonfirmasi dan belum dibayar | **Pembayaran belum diselesaikan.** Pesanan ini tidak lagi dapat digunakan untuk membayar | **Lihat paket** |
| Gagal terkonfirmasi | **Pembayaran belum berhasil.** Tidak menyimpulkan saldo rekening pengguna tanpa bukti | **Coba pembayaran lagi**, hanya jika backend memastikan aman |
| Pemeriksaan tidak terhubung | **Status belum dapat diperiksa.** Jangan membayar ulang jika pembayaran sudah dilakukan | **Coba periksa lagi** |
| Refund diproses | **Pengembalian dana sedang diproses.** Jangan menjanjikan durasi yang tidak ditetapkan provider | **Lihat status** |

**Coba pembayaran lagi** tidak otomatis membuat order baru; backend menentukan
upaya aman pada pesanan yang sama. Status ambiguous tidak boleh menawarkan
charge baru. Dukungan tersedia sebagai tautan sekunder di semua keadaan.

Pemeriksaan otomatis hanya ketika halaman terlihat, dengan backoff dan batas
percobaan; setelah itu berikan pemeriksaan manual dan email pemulihan. Jangan
melakukan polling tak terbatas atau membuat tab tetap terbuka sebagai syarat.
Detail seperti kode error/ref gateway hanya di admin/support berizin.

## 5. Pengisian, laporan dan pemulihan

- Pertahankan autosave non-blocking, draft terenkripsi, indikator status, dan
  submit akhir idempotent. Jangan mengunci Lanjut untuk setiap network save.
- Untuk berbayar, recovery dari email harus memulihkan **draft server** yang
  dimiliki peserta. Draft lokal mempercepat penggunaan, bukan satu-satunya
  salinan akses setelah uang diterima. Konflik dua perangkat harus ditinjau.
- Status pertanyaan/jumlah area berasal dari definisi berhak akses di server;
  tidak mengirim soal terkunci untuk kemudian disembunyikan CSS.
- Laporan tetap mengutamakan grafik dua metode, konteks, fokus dan langkah
  praktis. Tidak membuat overall, level lulus atau klaim penguasaan.
- Pembayaran berhasil memicu antrean bukti pembayaran dan akses. Submit asesmen
  memicu antrean hasil; keduanya bukan email yang sama atau status yang sama.
- Email akses berisi layanan, ringkasan pembayaran yang sesuai, dan tautan
  privat; bukan jawaban/skor. Tidak CC hasil pribadi ke pihak lain.
- **Privasi & data** tetap satu entry dengan tujuan terpisah. Penghapusan hasil
  tidak menjanjikan penghapusan bukti transaksi dan tidak menghasilkan retake.

## 6. Dashboard admin: implementasi persiapan dan kontrak lanjutan

Halaman `/admin/assessments/individual/commerce` dibuka melalui tautan
**Transaksi & paket** dari dashboard asesmen individu. Komponen
`PECommerceAdmin` memakai shell admin existing dan dua tampilan: **Transaksi**
dan **Paket asesmen**.

Yang sudah diimplementasikan:

- Ringkasan **Menunggu pembayaran**, **Dibayar**, dan **Perlu perhatian** dari
  seluruh transaksi; pencarian nomor pesanan/email dan filter status untuk
  maksimum 50 hasil terbaru. Dibayar tidak disebut sebagai payout.
- Daftar menampilkan email berizin, total dan status pembayaran; disclosure
  membuka nomor/tanggal pesanan dan status akses. Tidak ada tombol tandai lunas,
  grant manual, pengiriman email atau aktivasi penjualan.
- Draft nama/deskripsi, harga total, kesempatan, batas mulai/selesai, retensi,
  ketentuan pembelian/refund dan referensi laporan. Keputusan yang belum ada
  tetap kosong/null; menyimpan memakai revisi, tidak memublikasikan paket.
- Feedback simpan, loading, error/retry, perlindungan sesi dan isian yang tetap
  tersedia saat simpan gagal. Daftar kesiapan mengikuti revisi tersimpan.
- Pencarian memakai grid responsif dan membentang satu baris pada ponsel;
  lebarnya telah diperiksa lebih dari 220 px pada viewport 390 dan 320 px.

Tindakan kontekstual berikut masih kontrak lanjutan, belum tombol yang tersedia:

| Kondisi | Tindakan yang relevan |
| --- | --- |
| Pending/unknown | **Periksa pembayaran**; tidak ada tombol bebas **Tandai lunas** |
| Dibayar, akses belum tersedia | **Periksa akses** / pemulihan idempotent melalui backend |
| Akses aktif, email bermasalah | **Kirim ulang akses** ke alamat terverifikasi, dengan status/dedup aman |
| Kelebihan bayar/refund/dispute | **Tinjau transaksi**; perlihatkan alasan, batas kewenangan dan audit |
| Ada pengisian | **Lihat asesmen** hanya jika role dan izin peninjauan memang membolehkan |

Target setelah integrasi: pengaturan produk dilakukan sekali untuk
harga/cakupan/ketentuan, gateway dan kesiapan teknis. Setelah benar-benar siap,
satu tindakan aktivasi penawaran. Jangan
menampilkan wizard persetujuan atau meminta perubahan env untuk tiap penjualan.
Jeda penjualan hanya menghentikan pesanan baru, tidak memutus akses yang dibayar.

## 7. Kontrak aksesibilitas dan verifikasi

- Label field selalu terlihat; error terkait field dengan `aria-describedby`.
- Satu aksi utama per keadaan; label menjelaskan tindakan, bukan “Proses”.
- Loading/status memakai pengumuman yang tepat, tidak spinner saja. Pergantian
  halaman/status penting memindahkan fokus ke judul atau ringkasan yang relevan.
- Nominal, progres dan status tidak bergantung pada warna/ikon saja.
- Tombol nyaman disentuh, fokus keyboard terlihat, urutan tab logis. Disclosure
  ketentuan tidak menjebak keyboard; konten tetap dapat dibaca pada 320 px/zoom.
- Hormati reduced motion; animasi tidak menunda tombol atau menyembunyikan hasil.

Sebelum implementasi dianggap selesai: buktikan satu alur sandbox dari email
terverifikasi → order → pembayaran → webhook → grant → email → draft lintas
perangkat → submit → laporan. Uji pula jaringan lambat, reload, token kedaluwarsa,
klik ganda, dua tab, webhook berulang, refund dan regresi gratis. Screenshot
desktop/ponsel membuktikan tata letak, bukan kebenaran pembayaran atau email.

Verifikasi persiapan internal: dua tes browser komponen sintetis desktop/ponsel
lulus melalui `npm run test:commerce-ui` (`scripts/test-commerce-ui.mjs` dan
`e2e/fixtures/commerce-preview`). Tes memeriksa draft harga kosong, simpan dan
feedback, lebar pencarian, 320 px tanpa overflow dan tidak adanya aksi bayar/
aktivasi. Preview loopback ini tidak melewati autentikasi admin produksi.

Screenshot `commerce-orders-*.png` dan `commerce-package-*.png` di `.codex_tmp`
telah dibuka dan diperiksa. Detector UI permukaan ini menghasilkan `[]`.
Review ulang finish memberikan **Ship** untuk satu temuan P2 lebar pencarian
ponsel yang telah diperbaiki; cakupan itu bukan review seluruh alur paid.
Suite app lulus 303 tes dan API 524 tes dengan 3 skip existing. Build final app
(88/88 halaman) setelah perbaikan grid serta build API (121/121) lulus;
ESLint/typecheck terarah bersih.

Bukti ini belum menguji database/auth produksi, pembayaran/email nyata atau
sandbox end-to-end. Halaman checkout, pengisian/laporan berbayar dan alur
pembayaran pada bagian 1–5 tetap memerlukan implementasi dan UAT di atas.
