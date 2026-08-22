# Deployment app.binahub.id

Frontend memakai `output: "export"`, sehingga hasil production berupa situs statis di folder `out/`.

## Urutan deployment

1. Pastikan environment production menggunakan:
   - `NEXT_PUBLIC_APP_URL=https://app.binahub.id`
   - `NEXT_PUBLIC_BINAHUB_API_URL=https://api.binahub.id`
2. Jalankan `npm ci`.
3. Jalankan `npm run typecheck`, `npm run lint`, dan `npm run test:run`.
4. Jalankan `npm run build`.
5. Publikasikan **seluruh isi** folder `out/` ke document root `app.binahub.id`. Jangan hanya mengunggah `admin/tbos.html`, karena nama chunk pada `out/_next/static/` berubah setiap build.
6. Hapus file lama yang tidak lagi direferensikan dan bersihkan cache hosting/CDN.
7. Jalankan smoke test akses peserta dan T-BOS di bawah.

## Smoke test akses peserta

- Deploy `binahub-api` lebih dahulu, lalu frontend. Endpoint akses baru harus tersedia sebelum tautan dibagikan.
- Dari `/admin/programs`, klik **Bagikan** dan pastikan tautan berbentuk `/client/access?program=<uuid>`; kode akses tampil terpisah.
- Buka tautan di jendela privat. Pastikan judul, perusahaan, lokasi (bila ada), dan hanya modul yang dipilih admin yang terlihat.
- Masukkan kode dan nama peserta uji. Pastikan portal tidak menampilkan sidebar client lama.
- Jika LEP aktif, buka LEP dan pastikan peserta tidak diminta memilih program lagi.
- Ubah program menjadi Draf atau Selesai dan pastikan peserta baru tidak dapat masuk.

## Smoke test T-BOS

- Pilih program yang mempunyai modul T-BOS dan minimal satu tim.
- Buka **Laporan per Tim** dan berpindah di antara dua tim.
- Pastikan nama batch, anggota, kapten, skor rata-rata, dan delapan batang dimensi tampil.
- Unduh PDF tim terpilih.
- Unduh PDF grup dan pastikan laporan per tim ikut berada di dalam dokumen.

API tetap dideploy terpisah dari repository `../binahub-api` ke `https://api.binahub.id`.
