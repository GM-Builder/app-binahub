# BinaHub App

Frontend authenticated untuk `app.binahub.id`. Backend berada di repositori sejajar `../binahub-api` dan ditargetkan ke `api.binahub.id`.

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
