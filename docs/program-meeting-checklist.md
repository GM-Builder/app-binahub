# Checklist kebutuhan program saat konsultasi

## Alur admin

1. Buka **Akuisisi & Penjualan → Klien & proposal → Discovery organisasi**.
   Workspace sekarang berjudul **Kebutuhan program**.
2. Cari klien/perusahaan pada seluruh daftar. Pilih pengisian untuk membuka
   **Checklist meeting**. Jawaban awal ditandai **Diisi klien**.
3. Aktifkan **Hanya yang belum diisi**. Isi bagian yang kosong; kolom tidak
   menghilang saat diketik. Kelompok pertanyaan mengikuti instrumen CEO yang
   sama, termasuk percabangan dan batas pilihan.
4. Jika perlu, pilih **Klarifikasi jawaban**. Nilai awal klien tetap terlihat,
   dan klarifikasi disimpan terpisah. **Gunakan jawaban klien** membatalkan
   klarifikasi pada bagian itu, bukan menghapus pengisian awal.
5. Catat kesepakatan dan tindak lanjut. Simpan otomatis berjalan setelah jeda
   mengetik; **Simpan sesi** tersedia untuk simpan langsung. Input tetap dapat
   digunakan selama penyimpanan. Tunggu indikator **Tersimpan** sebelum keluar.
6. **Tandai selesai** memeriksa bagian wajib. Perubahan berikutnya membuka
   kembali sesi sebagai sedang dilengkapi; tidak mengubah status laporan klien.

Klien belum mengisi? Gunakan **Mulai checklist**, lengkapi kontak dan konfirmasi
pemberitahuan penggunaan data, lalu mulai sesi. Ini catatan internal, bukan
pengisian yang dikonfirmasi sendiri oleh klien, bukan izin pemasaran, dan tidak
membuat/mengirim laporan atau email. Checklist tampil di daftar yang sama.

Dari **Konsultasi**, detail booking memiliki tombol **Buka checklist kebutuhan**.
Tombol mencari berdasarkan email peserta, tidak otomatis menyatukan atau memilih
pengisian jika ada beberapa rekaman. Email tidak dimasukkan ke URL browser.

## Penyimpanan dan batas

- SQL **72**, setelah SQL 71, diperlukan pada database API. File canonical:
  `binahub-api/supabase/migrations/0072_spin_meeting_checklists.sql`.
- Deploy API sebelum app. Tidak ada env, n8n, worker atau kontrol pengiriman baru.
  Jika API/SQL belum siap, pengisian/laporan lama tetap dapat dilihat, sedangkan
  aksi checklist belum diaktifkan. Belum ada penerapan SQL/deployment produksi
  oleh agen pada perubahan ini.
- Pengisian asli, konfirmasi klien, laporan dan antrean email tidak ditulis oleh
  operasi meeting. Jawaban admin, pembuat/pengubah, revisi dan peristiwa simpan
  dicatat terpisah. Data tidak dihapus otomatis karena umur.
- Draft publik yang belum dikirim tetap privat dan tidak muncul di inbox admin.
- Semua akses memakai autentikasi admin yang sudah ada. Tabel baru tidak dapat
  diakses langsung oleh peran anonim/pengguna biasa. RPC hanya untuk service role.
- Konflik revisi tidak ditimpa otomatis. Draft lokal tetap terlihat; muat versi
  terbaru hanya setelah konfirmasi. Gangguan jaringan mempertahankan input dan
  menyediakan coba lagi. Retry identik tidak membuat revisi/peristiwa ganda.
- Checklist bukan generator proposal custom. Harga, katalog, skor instrumen,
  AI, follow-up dan email existing tidak diubah.

## Verifikasi

Pemeriksaan memakai fixture sintetis, browser loopback dengan semua API dimock,
dan PostgreSQL lokal PGlite; tidak mengirim email atau menulis database produksi.
Hasil final 26 Oktober 2026:

- Aplikasi: 340 tes pada 67 file; TypeScript, ESLint pada file yang berubah,
  serta build produksi 90/90 halaman dengan dua worker lulus.
- API: 120 tes modul SPIN pada sembilan file; TypeScript, ESLint pada route/helper
  baru, serta build produksi 124/124 halaman lulus.
- Browser: empat tes desktop/ponsel lulus. Selain simpan/gagal/coba lagi/buka ulang,
  diuji perpindahan tab SalesWorkspace sebelum debounce autosave dan sesudah
  kegagalan simpan; membatalkan perpindahan mempertahankan input.
- Detector desain tidak menemukan pola mekanis pada lima komponen yang berubah.
  Enam capture valid diperiksa. Review independen menemukan satu celah guard
  navigasi; setelah diperbaiki, reviewer menilai temuan itu **resolved** dengan
  disposition **ship** pada lingkup daftar perbaikan, bukan sertifikasi aplikasi.
- Audit dependensi app saat pemeriksaan melaporkan nol advisory. Ini bukan
  pentest dan bukan jaminan seluruh platform bebas kerentanan.

Build/test lokal tidak menjadi bukti SQL 72 atau deployment Hostinger/Vercel
sudah aktif. Tidak ada database produksi, email nyata, atau kuota AI yang dipakai.
