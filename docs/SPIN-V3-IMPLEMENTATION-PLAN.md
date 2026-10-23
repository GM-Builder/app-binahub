# SPIN organisasi — implementasi dan rilis

Update 23 Oktober 2026. **Kode terintegrasi; proses rilis dan verifikasi produksi.**
Pengguna mengonfirmasi SQL 71 telah dijalankan; hal ini bukan bukti deployment
atau keberhasilan email. Target rilis app 0.41.0/API 0.39.0.
Dokumen CEO asli tidak diubah atau dimasukkan ke Git. Riwayat penelaahan sumber:
[SPIN v3.2](SPIN-V3_2-SOURCE-REVIEW.md).

## Keputusan yang dipakai

- Khusus tim/organisasi, bukan tes kompetensi atau asesmen psikometrik.
- Spesifikasi CEO v3.2 dan template laporan V3 menentukan pertanyaan serta enam
  bagian laporan. Katalog aktual V6/32 solusi; SPIN hanya SS-01–SS-31.
  SS-32 tetap di katalog utama. SS-27 memerlukan opt-in spiritual eksplisit.
- CEO mengizinkan AI mencocokkan program. Harga, nama, tujuan belajar, komponen
  dan output berasal dari sumber; model tidak membuat penawaran bebas.
- Harga mengikuti katalog, termasuk trainer/fasilitator dan modul. Pajak,
  tambahan kebutuhan dan scope yang belum jelas tidak ditebak.
- Tidak ada masa berlaku komersial proposal. Ini bukan jaminan harga permanen.
- Data SPIN tidak dihapus otomatis berdasarkan umur, sesuai keputusan pengguna.
  Akses draft, tautan dan sesi tetap mempunyai batas keamanan. Retensi PE tidak
  berubah. Permintaan hak data melalui admin@binahub.id.
- Tampilan mengikuti BinaHub existing, tanpa login klien, persetujuan admin
  berulang untuk kasus rutin, SDK/provider baru atau toggle env harian baru.

## Alur yang sudah dibuat

1. Klien membuka `/discovery`, membaca penggunaan data dan memberi persetujuan.
2. Lima tahap: Konteks, Tantangan, Dampak, Hasil yang Diharapkan, Rekomendasi.
   Q01–Q28 dan QS01 menjadi 51 field dalam 21 kelompok layar, hanya field
   relevan tampil. Tidak berarti 51 pertanyaan wajib.
3. Pilihan berubah langsung, autosave di latar belakang. Kembali/lanjut, retry
   dan kontrol revisi mempertahankan jawaban. Capability berada di sessionStorage
   tab ini, bukan janji dapat melanjutkan di perangkat lain. Perubahan yang
   belum tersimpan diperingatkan sebelum meninggalkan halaman.
4. Q16 menampilkan empat bagian brief untuk dikonfirmasi/dikoreksi/ditambah.
   Perubahan sumber membatalkan konfirmasi; jawaban asli tetap dipertahankan.
5. Kontak di akhir. Persetujuan pemrosesan wajib, pemasaran opsional dan tidak
   tercentang awal. Honeypot, verifikasi singkat dan rate limit membatasi abuse.
   Field kontak tidak masuk model; teks bebas tetap bukan data anonim terjamin.
6. Submit menyimpan pengisian dan satu relasi lead/inquiry atomik. Respons 202
   tidak menunggu AI/PDF/email, sehingga browser boleh ditutup setelah diterima.
   Idempotensi dan penguncian mencegah klik ganda membuat kiriman ganda.
7. Worker mencocokkan 0–3 program dengan bukti jawaban–tujuan belajar, menghitung
   investasi yang memenuhi scope dan membekukan snapshot. Kebutuhan tidak jelas,
   strategis/sistem atau perlu tinjauan menghasilkan konsultasi, bukan harga
   atau produk yang dipaksakan. Tidak mengubah jawaban menjadi skor kompetensi.
8. Email berisi PDF serta tautan privat. Tautan 48 jam/sekali pakai ditukar lewat
   tombol eksplisit menjadi sesi 30 menit. Kunci di fragment URL lalu dibersihkan.
   Pemulihan email tidak mengungkap kecocokan alamat kepada peminta.
9. Admin: Akuisisi & Penjualan → Klien & proposal → Discovery. Daftar paginasi,
   konteks, jawaban berlabel, laporan, status email dan retry berada di satu tempat.
   Analisis internal tidak masuk laporan web/PDF/email klien.
10. Inquiry follow-up mulai setelah penyedia email menerima kiriman. Percakapan
    aktif diperiksa agar tidak ganda. Setting, scheduler dan antrean lama tidak
    diaktifkan sebagai efek samping. `sent` bukan jaminan email masuk inbox.

## Batas komersial dan laporan

Enam bagian publik: Ringkasan eksekutif, Snapshot kebutuhan, Rekomendasi solusi,
Opsi dan investasi indikatif, Asumsi dan hal yang perlu dikonfirmasi, Langkah
berikutnya. Disclaimer sumber dipertahankan.

Harga otomatis konservatif: satu program/batch, jumlah pasti maksimal 30 peserta,
workshop perusahaan, durasi katalog, lokasi/kebutuhan pelaksanaan jelas. Tarif
khusus SS-22 mengikuti sumber. Paket SS-11, format/kapasitas/durasi lain,
multi-batch, tambahan dan hambatan penerapan dibahas saat konsultasi; bukan
berarti harga tersebut tidak ada. Tidak ada tambahan atau total akhir buatan.
Proposal custom meeting dan pembayaran individu tidak termasuk pekerjaan SPIN.

## Konflik sumber dan baseline rekayasa

Versi `spin-rules-conservative-v1`, bukan klaim pengesahan baru CEO/hasil empiris:

- Empat sinyal minat independen mengikuti tabel 7.4, bukan salah hitung contoh.
- Edited/supplemented memakai confidence low sampai konteks ditinjau.
- Fit C menghitung B1/B2/B4/B5/B7; B3+B2 bukan dua hambatan sistem.
- Precedence konservatif E > D > C > B > A. Ketidakjelasan, konflik dan scope
  sistem/strategis menahan penawaran otomatis.
- Venue hanya untuk tatap muka/gabungan yang relevan.
- Gejala terkalibrasi C0/lain belum diberikan: fallback netral, tanpa klaim
  sebagai enam gejala paling sering.
- Pencocokan SPIN bukan crosswalk/skor kompetensi individu atau tim existing.

## Verifikasi dan pekerjaan sebelum go-live

- App 331 tes lulus. API 699 tes lulus, tiga dilewati pada suite penuh dua worker,
  termasuk cleanup. Default file cleanup dikembalikan ke preview untuk publikasi,
  tanpa menjalankan ulang operasi tersebut pada database produksi.
- Kontrak input/percabangan/konfirmasi, harga/scope, spiritual opt-in, publik/
  internal, ownership, revisi, lease/recovery, idempotensi, akses sekali pakai
  dan follow-up diuji sintetis. Agen menguji SQL 71 di PGlite lokal; pengguna
  mengonfirmasi telah menjalankannya di target sebelum meminta deployment.
- Browser memakai API mock loopback; desktop/ponsel dan overflow 320/768 px,
  bukan UAT server produksi. PDF diperiksa lewat render.
- Strix CLI/Docker tersedia, konfigurasi model/API key Strix tidak tersedia.
  Tidak ada pentest atau upload repo cloud. Tes akses bukan sertifikasi keamanan.
- Masih perlu: deploy API lalu app, verifikasi
  pemanggilan scheduler existing, relevansi model nyata dan satu uji email.
  User mengizinkan admin@binahub.id dengan data sintetis setelah migrasi/deploy
  siap. Belum dikirim. Notice belum merupakan hasil tinjauan legal formal.
- Pilot lima HR/pimpinan dan target 8–10 menit masih rencana validasi, bukan
  hasil pengalaman pengguna yang sudah diukur.

Runbook repo API: `docs/SPIN-RELEASE-RUNBOOK.md`.
SQL baru: `supabase/migrations/0071_spin_discovery.sql`.
Jangan menjalankan kembali file operasi cleanup sebagai bagian rilis SPIN.
