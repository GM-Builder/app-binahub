# Deployment app.binahub.id

Frontend memakai Next.js server output agar reverse proxy `/api/*` dan security headers berjalan di origin production.

## Urutan deployment

1. Ikuti runbook `../binahub-api/supabase/DEPLOYMENT.md` dan terapkan seluruh migration API secara berurutan sampai migration terbaru (saat dokumen ini diperbarui: `0048_tbos_flexible_batch_constraints.sql`), lalu jalankan `supabase/production_readiness.sql`. Semua flag `*_ready` harus `true` dan seluruh counter integritas `*_issues` harus nol.
2. Pastikan environment production menggunakan:
   - `NEXT_PUBLIC_APP_URL=https://app.binahub.id`
   - `NEXT_PUBLIC_BINAHUB_API_URL=https://api.binahub.id`
   - `NEXT_PUBLIC_COMPANY_WEBSITE_URL=https://binahub.id`
   - pada `website-prod`: `NEXT_PUBLIC_BINAHUB_APP_URL=https://app.binahub.id`, `NEXT_PUBLIC_BINAHUB_API_URL=https://api.binahub.id`, dan `NEXT_PUBLIC_CALCOM_BOOKING_URL=https://cal.com/binahub/konsultasi`
   - pada API: secret unik untuk Follow-up, Transformation Worker, Operations, Acquisition, Pilot Monitor, Cal.com, Resend, proposal link, dan unsubscribe
   - pada API selama UAT: `FOLLOW_UP_DRY_RUN=true`, `TRANSFORMATION_WORKER_DRY_RUN=true`, `OPERATIONS_DRY_RUN=true`, `ACQUISITION_DRY_RUN=true`, dan `PILOT_MONITOR_DRY_RUN=true`
3. Jalankan `npm ci`.
4. Jalankan `npm run typecheck`, `npm run lint`, dan `npm run test:run`.
5. Jalankan `npm run build`.
6. Deploy `binahub-api` lebih dahulu.
7. Deploy hasil build sebagai aplikasi Node.js Next.js dan jalankan `npm run start`; jangan mengunggahnya sebagai static export karena rewrite `/api/*` tidak akan berjalan.
8. Hapus file lama yang tidak lagi direferensikan dan bersihkan cache hosting/CDN.
9. Jalankan smoke test akses peserta dan T-BOS di bawah.
10. Uji `https://app.binahub.id/api/auth/role` tanpa token; hasil yang benar adalah `401`, bukan `404`. Ini membuktikan rewrite `/api/*` menuju `https://api.binahub.id` aktif.

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

Target deployment Fase 12 per 30 Agustus 2026: website v0.2.20, app/API v0.16.0, migration sampai `0037`, dan automation v0.2.0. Lima workflow n8n tetap inactive dan seluruh environment dry-run tetap `true`; baca `PHASE-12-IMPLEMENTATION-STATUS.md` untuk rehearsal dan acceptance.
