# Integrasi AMS–APP BinaHub

Dokumen ini menjelaskan jalur produksi untuk identitas associate, penawaran assignment, akses program, dan notifikasi antara BinaHub AMS dan APP.

## Prinsip utama

- AMS adalah sumber utama identitas associate dan status assignment.
- APP adalah sumber utama program, modul, roster program, dan akses operasional T-BOS/LEP.
- Role global tidak memberikan akses ke semua program. Akses diberikan per program melalui assignment.
- Browser tidak pernah memegang shared integration secret atau Supabase service-role key.
- Semua komunikasi AMS–APP dilakukan server-to-server dengan HMAC, timestamp maksimum lima menit, validasi schema, dan ledger idempoten.
- Associate tidak membuat password APP kedua. AMS meminta tiket sekali pakai, lalu APP menukar tiket melalui API tepercaya menjadi sesi Supabase APP.

## Alur penugasan

1. Admin membuka T-BOS atau LEP di APP.
2. APP API mencari associate aktif melalui endpoint AMS bertanda tangan.
3. Admin memilih associate dan mengirim penawaran assignment.
4. AMS membuat assignment berstatus `invited`, notifikasi dalam aplikasi, dan email.
5. Associate membuka AMS lalu menerima dan memulai assignment.
6. Worker AMS menyinkronkan perubahan status ke APP.
7. APP membuat atau memperbarui identitas berdasarkan email dan mengaktifkan akses program saat status `accepted` atau `in_progress`.
8. Associate menekan **Buka workspace program** di AMS. AMS membuat tiket lima menit yang hanya dapat dipakai sekali.
9. APP menukar tiket melalui API, membuat sesi, lalu membuka workspace program.
10. Status ditolak, ditarik, atau dibatalkan mencabut akses program terkait tanpa menghapus histori assignment.

Untuk T-BOS, sinkronisasi menggunakan prosedur assignment yang sudah ada agar kompetensi default dan guardrail program tetap dijalankan. Untuk LEP, associate aktif dipetakan menjadi pembicara program. Pembicara eksternal tetap dapat ditambahkan secara manual.

## Migrasi database wajib

Jalankan satu kali sebelum deployment aplikasi:

1. Pada database Supabase APP/API: `binahub-api/supabase/migrations/0056_ams_assignment_integration.sql`.
2. Pada database Supabase AMS: `binahub-platform/packages/database/migrations/011_app_assignment_integration.sql`.

Kedua migrasi idempoten untuk object utama, tetapi tetap simpan bukti hasil eksekusinya.

## Environment produksi

Gunakan satu random secret panjang yang sama untuk `AMS_INTEGRATION_SECRET` dan `APP_INTEGRATION_SECRET`. Jangan mengirim nilainya melalui chat atau menyimpannya di frontend.

### binahub-api

```env
APP_PUBLIC_URL=https://app.binahub.id
AMS_API_URL=https://<domain-api-ams>
AMS_INTEGRATION_SECRET=<shared-secret>
```

### binahub-platform API

```env
APP_INTEGRATION_API_URL=https://api.binahub.id
APP_INTEGRATION_SECRET=<shared-secret-yang-sama>
RESEND_API_KEY=<resend-key>
NOTIFICATION_EMAIL_FROM=BinaHub <notifications@domain-terverifikasi>
AMS_WORKER_SECRET=<worker-secret-terpisah>
```

`CRON_SECRET` dapat dipakai sebagai alternatif `AMS_WORKER_SECRET` bila worker dijalankan oleh Vercel Cron.

### app-binahub

Tidak ada secret baru. Pastikan nilai publik berikut benar:

```env
NEXT_PUBLIC_BINAHUB_API_URL=https://api.binahub.id
NEXT_PUBLIC_APP_URL=https://app.binahub.id
```

Jangan menambahkan `SUPABASE_SERVICE_ROLE_KEY` ke deployment frontend.

## Worker dan retry

Email penting dicoba langsung saat event dibuat. Worker tetap wajib untuk:

- retry email yang gagal;
- retry sinkronisasi AMS–APP;
- pengingat profil belum lengkap setelah 72 jam;
- pemulihan event ketika layanan tujuan sempat tidak tersedia.

Jadwalkan request berikut setiap lima menit:

```text
GET https://<domain-api-ams>/api/workers/cron
Authorization: Bearer <AMS_WORKER_SECRET atau CRON_SECRET>
```

Endpoint membatasi satu batch hingga 100 event per pemanggilan dan menolak request tanpa secret.

## Urutan deployment

1. Jalankan kedua migrasi database.
2. Isi environment API APP dan API AMS.
3. Deploy `binahub-api` versi 0.27.0.
4. Deploy API dan web `binahub-platform` versi 0.9.0.
5. Deploy `app-binahub` versi 0.26.0.
6. Aktifkan scheduler worker lima menit.
7. Jalankan smoke test read-only dari folder `binahub-api`:

```powershell
$env:AMS_INTEGRATION_AMS_API_URL = "https://<domain-api-ams>"
$secret = Read-Host "Masukkan shared integration secret" -AsSecureString
$env:AMS_INTEGRATION_SMOKE_SECRET = [System.Net.NetworkCredential]::new("", $secret).Password
npm run test:ams-integration
$env:AMS_INTEGRATION_SMOKE_SECRET = $null
$secret = $null
```

8. Lakukan satu UAT mutation terkontrol: tawarkan assignment kepada satu akun internal, terima, mulai, buka APP, pastikan hanya program tersebut yang terlihat, lalu batalkan dan pastikan akses dicabut.

## Kriteria lulus produksi

- Request tanpa HMAC ditolak `401` oleh kedua API.
- Endpoint admin ditolak `401` untuk pengguna anonim.
- Associate menerima notifikasi aplikasi dan email tepat satu kali.
- Assignment `invited` belum memberi akses operasional.
- Assignment `accepted`/`in_progress` memberi akses hanya ke program terkait.
- Tombol workspace menghasilkan sesi APP tanpa login kedua.
- Tiket kedua kali atau lewat lima menit ditolak.
- Pembatalan/penolakan mencabut akses program.
- Event gagal kembali ke antrean dan tidak macet pada `processing`.
- Tidak ada service-role key atau shared secret di bundle/browser APP.

## Rollback aman

- Nonaktifkan pembuatan assignment baru dari UI jika ada insiden.
- Cabut atau rotasi shared integration secret untuk memutus komunikasi server-to-server.
- Batalkan assignment terkait di AMS untuk mencabut akses program APP.
- Jangan menghapus ledger, identity link, atau histori assignment karena data tersebut diperlukan untuk audit dan rekonsiliasi.
