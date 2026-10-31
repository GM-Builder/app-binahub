# Rencana scheduler operasional BinaHub

Status 31 Oktober 2026: n8n lokal di laptop; API Vercel Hobby. Belum ada persetujuan
biaya/aktivasi baru. Dokumen ini bukan bukti worker produksi sudah berjalan.

## Rekomendasi

Gunakan Vercel Pro + Cron untuk API yang sudah berada di Vercel, setelah pemilik
menyetujui biaya dan mengonfirmasi paket. Tidak perlu menjalankan VPS/n8n hanya
untuk memanggil endpoint berkala. Simpan n8n lokal sebagai lingkungan uji.

Menurut [harga resmi](https://vercel.com/docs/plans/pro-plan), Pro memiliki biaya
dasar USD20/bulan termasuk satu deploying seat dan USD20 kredit pemakaian; pemakaian
tambahan, seat/add-on dan pajak dapat menambah biaya. Konfirmasi ulang saat aktivasi.
[Cron](https://vercel.com/docs/cron-jobs/usage-and-pricing) Pro mendukung per menit,
sedangkan Hobby minimal harian. [Hobby](https://vercel.com/docs/plans/hobby) dibatasi
untuk penggunaan pribadi nonkomersial. Mengganti scheduler saja tidak mengubahnya.

Jika pemilik tidak memilih Pro, tinjau penempatan API dan scheduler bersama-sama
pada hosting yang sesuai untuk bisnis. Jangan memaksa cron berfrekuensi tinggi
ke konfigurasi Hobby atau menjadikan laptop sebagai ketergantungan produksi.

## Pisahkan jenis pekerjaan

| Jenis | Tujuan | Usulan awal, belum diaktifkan |
| --- | --- | --- |
| Pemulihan laporan | Melanjutkan tugas/email hasil yang tertunda | Per menit, batch dan lease terbatas |
| AMS | Memproses event integrasi yang tertunda | Tiap 5 menit setelah deployment/otorisasi diverifikasi |
| Outreach/follow-up | Menghubungi calon klien sesuai persetujuan dan suppression | Aktivasi terpisah; bukan otomatis mengikuti worker pemulihan |
| Retensi PETA | Menghapus data yang melewati retensi satu tahun | Tetap tanggal 1 pukul 00 UTC/07 WIB, sesuai keputusan pemilik |

Angka interval adalah titik awal, bukan jaminan kapasitas. Ukur umur antrean,
durasi dan throughput sebelum menaikkan batch/konkurensi. Antrean persisten di
database tetap menjadi sumber status; scheduler hanya pemicu, bukan tempat data
peserta atau logika bisnis. Jangan memasukkan jawaban, kontak atau kunci API AI
ke URL/log/workflow scheduler.

## Urutan aktivasi

1. Selesaikan retry terbatas, idempotensi dan penanganan gagal analisis AI.
2. Siapkan autentikasi cron, heartbeat, deteksi antrean terlambat dan kanal alarm.
3. Pastikan ada satu scheduler untuk tiap pekerjaan, bukan n8n dan Cron bersamaan.
4. Setujui paket/biaya, gunakan secret di penyimpanan environment platform dan
   pasang batas/peringatan pemakaian. Jangan menyalin secret ke Git atau chat.
5. Uji satu siklus memakai data sintetis/penerima internal yang disetujui, tanpa
   memproses antrean outreach nyata secara tidak sengaja. Verifikasi hasil dan
   ulang pemanggilan tidak menggandakan email/tindakan.
6. Aktifkan recovery bertahap, pantau heartbeat dan umur antrean; outreach tetap
   memerlukan aktivasi operator terpisah. Kegagalan tidak dianggap pekerjaan selesai.

Cron sendiri bukan retry queue. [Vercel tidak otomatis mengulang panggilan cron
yang gagal](https://vercel.com/docs/cron-jobs/manage-cron-jobs); retry/backoff,
lease dan rekonsiliasi harus tetap di kode/database. Operator harus memiliki cara
melihat kegagalan dan mencoba ulang secara aman.

Dokumen ini tidak mengubah vercel.json, menjalankan SQL, memasang workflow n8n,
mengaktifkan pengiriman atau memanggil provider AI. Program PFA2026 tidak disentuh.
