# Catatan implementasi meeting 28 Oktober 2026

## Arah produk

Halaman /diagnose mengutamakan rekomendasi program organisasi. Self Diagnostic
menjadi jalur pendukung untuk mengenali kebutuhan dan menuju program terkait.
Tidak menambahkan harga paket organisasi karena belum ada keputusan harga.
Pilihan individu menuju daftar paket, lalu pengisian gratis tanpa akun.

Paket berbayar dikunci Coming soon: Personal Effectiveness Rp59.000,
Relationship Management Rp89.000, Leadership Effectiveness Rp69.000,
Work & Business Results Rp119.000, paket lengkap Rp299.000. Checkout belum aktif.

## Skor dan bahasa

Bobot tampilan gabungan per kompetensi sementara 50:50, disetujui pemilik melalui
chat sambil menunggu keputusan CEO. Kedua metode tetap dihitung dengan aturan
instrumen asli, tanpa mengubah kredit, urutan prioritas, atau mengklaim validasi.
Jika salah satu metode tidak memiliki bukti cukup, skor gabungan tidak ditampilkan.
Nama kompetensi tetap Inggris; nomor pertanyaan tidak menunjukkan kompetensinya.
Seluruh pertanyaan wajib direspons; NA adalah respons sah, bukan jawaban kosong.

Panduan jujur ditempatkan sebelum soal, panduan Kembali di bawah navigasi.
Tinjauan menampilkan enam soal dan jawaban terpilih; berikutnya dibuka bertahap.
Bagian refleksi satu bulan adalah saran latihan, bukan jadwal meeting, notifikasi,
atau kewajiban mengisi ulang. Hasil gratis 48 jam tidak tersedia lagi satu bulan
kemudian; pengguna perlu memulai pengisian baru bila ingin melihat perkembangan.

## Privasi key action dan AI

Key action mentah dan kuncinya tidak dikirim ke browser. AI menerima kode kompetensi
dan acuan perilaku yang dipilih di server, tanpa identitas, konteks bebas peserta,
jawaban, skor, atau rationale studi kasus. Teks keluaran divalidasi untuk mencegah
kutipan acuan atau kode internal. Kegagalan AI memakai saran publik cadangan.
Ini minimisasi data, bukan jaminan DPA, kerahasiaan kontraktual provider, atau
sertifikasi keamanan. Snapshot lama tidak ditulis ulang; proyeksi tampilan
menyamarkan saran lama yang mungkin mengutip acuan, tanpa mengubah skor.

## SQL dan urutan rilis

1. Jalankan SQL 74 dari repo API: supabase/migrations/0074_personal_free_access_48h.sql.
2. Rilis API 0.42.0, lalu app 0.45.0. Tidak ada env baru.
3. Pastikan worker diagnosis yang sudah ada tetap dipanggil untuk pemulihan laporan,
   pengiriman, dan penghapusan fisik berkala. Penolakan akses tidak menunggu worker.

Aturan baru berlaku pada pengiriman hasil gratis setelah SQL diterapkan: 48 jam
dari submitted_at. Tautan dapat dibuka ulang sampai 30 menit sejak akses pertama;
pembukaan ulang tidak memperpanjang jendela tersebut. Setelah itu minta tautan baru
sebelum 48 jam berakhir. Setelah 48 jam, pemulihan akses ditolak. Penghapusan fisik
berjalan bertahap melalui worker yang sudah ada, bukan janji penghapusan tepat detik
ke-48 jam. Hasil yang sudah terkirim sebelumnya, paid preparation, SPIN, dan program
nyata tidak dipersingkat. Jika SQL belum diterapkan, API mempertahankan kebijakan
lama dan tidak menjanjikan 48 jam pada formulir baru.

Normalisasi kampanye dilakukan pada preview/pengiriman sebelum personalisasi,
tanpa mengubah URL dan variabel. Antrean lama dengan hash template terdahulu dapat
ditahan oleh pemeriksaan template berubah; tinjau ulang sebelum mengirim.

## Verifikasi

Tes menggunakan data sintetis dan database lokal; tidak mengirim email klien,
tidak menerapkan SQL produksi, dan tidak menguji pembayaran. UI individu dan
kelima tahap SPIN diuji pada desktop/mobile, termasuk penyimpanan yang ditahan,
Kembali, dan pencegahan submit ganda. Build app/API berhasil. Bukan audit penetrasi.
Codebase Memory tidak tersedia pada sesi ini; pembacaan sumber dipakai sebagai
fallback, tanpa klaim pemeriksaan graph.
