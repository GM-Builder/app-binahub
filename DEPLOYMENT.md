# Deployment app.binahub.id

Frontend memakai `output: "export"`, sehingga hasil production berupa situs statis di folder `out/`.

## Urutan deployment

1. Terapkan migration API `supabase/migrations/0020_participant_reentry_codes.sql`, lalu jalankan `supabase/production_readiness.sql`. Jangan deploy UI login baru sebelum kedua flag kode peserta dan RPC registrasi bernilai `true`.
2. Pastikan environment production menggunakan:
   - `NEXT_PUBLIC_APP_URL=https://app.binahub.id`
   - `NEXT_PUBLIC_BINAHUB_API_URL=https://api.binahub.id`
3. Jalankan `npm ci`.
4. Jalankan `npm run typecheck`, `npm run lint`, dan `npm run test:run`.
5. Jalankan `npm run build`.
6. Deploy `binahub-api` lebih dahulu.
7. Publikasikan **seluruh isi** folder `out/` ke document root `app.binahub.id`. Jangan hanya mengunggah `admin/tbos.html`, karena nama chunk pada `out/_next/static/` berubah setiap build.
8. Hapus file lama yang tidak lagi direferensikan dan bersihkan cache hosting/CDN.
9. Jalankan smoke test akses peserta dan T-BOS di bawah.

## Smoke test akses peserta

- Dari `/admin/programs`, klik **Bagikan** dan pastikan tautan berbentuk `/client/access?program=<uuid>`; kode akses tampil terpisah.
- Buka tautan di jendela privat. Pastikan judul, perusahaan, lokasi (bila ada), dan hanya modul yang dipilih admin yang terlihat.
- Pada **Peserta Baru**, masukkan kode program dan nama peserta uji. Simpan kode peserta yang hanya tampil satu kali.
- Keluar, pilih **Sudah Terdaftar**, lalu masuk kembali hanya dengan kode peserta. Pastikan data peserta lama dipakai kembali dan jumlah peserta tidak bertambah.
- Dari Kelola Program buka **Kelola Kode Peserta**; buat ulang kode dan pastikan kode serta sesi lama ditolak. Uji juga nonaktifkan akses.
- Jika LEP aktif, buka LEP dan pastikan peserta tidak diminta memilih program lagi.
- Ubah program menjadi Draf atau Selesai dan pastikan peserta baru tidak dapat masuk.

## Smoke test T-BOS

- Pilih program yang mempunyai modul T-BOS dan minimal satu tim.
- Buka **Laporan per Tim** dan berpindah di antara dua tim.
- Pastikan nama batch, anggota, kapten, skor rata-rata, dan delapan batang dimensi tampil.
- Unduh PDF tim terpilih.
- Unduh PDF grup dan pastikan laporan per tim ikut berada di dalam dokumen.

API tetap dideploy terpisah dari repository `../binahub-api` ke `https://api.binahub.id`.
