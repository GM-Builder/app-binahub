# Perbaikan perjalanan penjualan — 18 Oktober 2026

**Koreksi cleanup:** program `d1ea232f-2038-4cfd-8c26-59caf4eaf760` adalah
proyek nyata. Cleanup massal diganti file **v2 selektif** dengan mode awal
pratinjau, perlindungan relasi program dan rollback jika data terlindungi berubah.
Jangan menjalankan versi lama. SQL 70 sudah dijalankan pengguna dan tidak perlu
diulang untuk cleanup. Tidak ada penghapusan produksi yang dilakukan agen.

Rilis app 0.39.0, API 0.38.0, website 0.2.30. CEO tetap mengendalikan
instrumen, format komersial dan peluncuran asesmen berbayar.

## Yang berubah untuk admin/peserta

- Assessment, proposal dan booking baru tidak menurunkan tahap negosiasi,
  peluang berhasil/tidak berhasil, maupun lifecycle klien/retained.
- Proposal yang tertahan terlihat dalam prioritas, termasuk kasus tanpa draf.
  Worker recovery menandai proses terputus untuk rekonsiliasi, bukan mengirim
  ulang email yang statusnya belum pasti.
- Seleksi antrean follow-up dilakukan sebelum pembatasan jumlah. Record lama
  yang ditutup, dijeda, telah booking, mencapai batas pesan atau disuppress
  tidak menyembunyikan pekerjaan baru. Penguncian per-pesan tetap berlaku.
- Individu dapat meminta konsultasi dari hasil pribadinya. Satu pengisian
  menghasilkan maksimal satu inquiry. Ini permintaan kontak, bukan opt-in
  marketing; hanya hasil dengan izin tinjau aktif yang dapat dibuka admin.
- Admin membuka hasil individu dari inquiry. Metadata hanya berisi ID
  pengisian, bukan salinan jawaban/skor. Izin dan masa akses diperiksa lagi.
- Tautan solusi pada laporan baru membuka detail program yang tepat. Laporan
  lama tetap snapshot, tidak ditulis ulang.
- Peluang berhasil menyediakan pintasan serah terima; tidak membuat proyek
  atau transaksi otomatis saat tautan dibuka.
- “Diizinkan” berarti izin pengiriman tersimpan. Waktu pemanggilan scheduler
  ditampilkan terpisah dan bukan bukti pesan masuk inbox.

## Urutan penerapan

1. Jalankan SQL 70 API: `supabase/migrations/0070_sales_journey_hardening.sql`.
2. Deploy API 0.38.0, app 0.39.0, website 0.2.30.
3. Uji satu diagnosis dan konsultasi internal dengan izin peserta.
4. Periksa pemanggilan worker existing dan aktivitas provider. Rilis ini tidak
   memasang cron, menjalankan n8n, mengubah secret atau mengaktifkan pengiriman.

SQL 70 bukan script penghapusan. Script cleanup berada terpisah di repo API:
`supabase/operations/cleanup_operational_test_data.sql`. Baca runbook API
`docs/SALES-JOURNEY-HARDENING.md` sebelum menjalankannya.

## Belum boleh dianggap selesai

- Scheduler produksi belum diverifikasi aktif. Uji lokal tidak membuktikan
  recovery/email berjalan ketika proses server mati.
- Nurturing penerima email blast yang belum merespons belum otomatis. Jangan
  menganggap template yang tersedia berarti workflow sudah terpasang.
- Dashboard masih memuat beberapa daftar besar dengan batas hasil. App 0.40
  menambahkan timeline lintas-modul dari payload yang dimuat, bukan riwayat
  detail lengkap. Pagination server dan endpoint detail tetap pekerjaan berikutnya.
- Gateway/checkout, instrumen organisasi terbaru, proposal individu/tim final
  dan penyusun proposal custom tetap menunggu dokumen/keputusan CEO.
- “Loyal” pada funnel adalah sinyal tahap retensi, bukan bukti order berbayar
  kedua. Tidak mengubah data demo menjadi bukti pendapatan nyata.

## Batas pengujian

Unit/SQL menggunakan fixture sintetis dan role terisolasi. Tes browser memakai
respons API tiruan lokal; tidak mem-bypass otorisasi produksi atau mengirim
email. Pengujian build tidak sama dengan deployment. Pengguna telah menjalankan
cleanup selektif: laporan eksekusi cocok dengan preview (1.068 baris dihapus,
274 baris dilindungi). Agen tidak menjalankan penghapusan. Program nyata tetap
ada pada pemeriksaan baca-saja sesudahnya. Pengguna tidak menjeda worker saat
cleanup; kondisi antrean kosong setelahnya bukan bukti tidak ada proses yang
berjalan selama penghapusan. Jangan menjalankan cleanup ulang.

Arahan lanjutan yang disetujui 19 Oktober tersedia di
[rencana kerja pengembangan berkelanjutan](development-journey-work-plan.md).
