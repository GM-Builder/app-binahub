# BinaHub App

Frontend authenticated untuk `app.binahub.id`. Backend berada di repositori sejajar `../binahub-api` dan ditargetkan ke `api.binahub.id`.

Panduan build dan publikasi frontend tersedia di [DEPLOYMENT.md](./DEPLOYMENT.md).

## Stack

- Next.js App Router, React, TypeScript, Tailwind CSS
- Supabase Auth
- Recharts dan `@react-pdf/renderer`
- Vitest dan Playwright

## Development

```bash
npm install
npm run dev
```

Salin `.env.example` menjadi `.env.local`, lalu isi URL/key Supabase dan URL API. Service-role key hanya boleh berada pada environment backend, bukan frontend.

## Validasi

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

Untuk E2E pertama kali:

```bash
npx playwright install chromium
npm run test:e2e
```

## Arsitektur Data

Frontend memakai Supabase secara langsung hanya untuk autentikasi dan pembacaan profil sendiri. Semua data bisnis melalui `binahub-api`, yang memvalidasi role/scope dan menjalankan query atau RPC dengan kredensial server.

Migration fondasi historis berada di `supabase/migrations`. Migration backend dan hardening terbaru berada di `../binahub-api/supabase/migrations`. Ikuti `../binahub-api/supabase/DEPLOYMENT.md`; nomor historis kedua folder bertumpang tindih dan tidak boleh digabung tanpa runbook tersebut.

Dokumen implementasi utama:

- `ARCHITECTURE.md`
- `DATA-MODEL.md`
- `ROLES-PERMISSIONS.md`
- `STATE-MACHINE.md`
- `SCORING-LOGIC.md`

## Alur Program Peserta

1. Admin membuat program dari `/admin/engagements/new`, mengisi perusahaan, kode, detail program, dan memilih minimal satu modul.
2. Admin membagikan tautan khusus program dan kode akses dari `/admin/programs` atau halaman kelola program. Kode tidak disisipkan ke URL.
3. Peserta membuka tautan, memasukkan kode serta nama, lalu memperoleh sesi program tanpa signup atau kata sandi.
4. `/client/program` hanya menampilkan modul yang diaktifkan admin. LEP dapat dibuka peserta; T-BOS tampil sebagai aktivitas terpandu tanpa formulir peserta.
5. LEP otomatis terkunci ke program pada sesi tersebut dan hanya dapat dikirim satu kali.

Nama peserta portal tidak disamakan otomatis dengan anggota tim T-BOS. Keduanya memiliki konteks berbeda dan pencocokan berbasis nama berisiko menggabungkan orang yang salah.
