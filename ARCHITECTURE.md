# T-BOS (BinaPlay) — Architecture

Status: Active — mencerminkan implementasi per 15 Agustus 2026.

## 1. Ringkasan

T-BOS dan LEP adalah modul program di `app.binahub.id`. `engagements` menjadi container program; `program_modules` menentukan apakah `tbos` dan/atau `lep` aktif pada tiap program.

## 2. Stack Aktual

| Layer | Implementasi |
|---|---|
| Frontend | Next.js App Router, React, TypeScript |
| UI | Tailwind CSS dan komponen lokal |
| Auth | Supabase Auth |
| API | Next.js Route Handlers pada `binahub-api` |
| Database | Supabase PostgreSQL; query melalui `@supabase/supabase-js` |
| Grafik / laporan | Recharts dan `@react-pdf/renderer` |
| Hosting | Vercel + Supabase |

Tidak ada ORM Drizzle pada alur ini. Frontend tidak mengakses tabel bisnis secara langsung; `ApiFetchBridge` meneruskan `/api/*` ke `binahub-api` dan menyisipkan access token. Pengecualian langsung dari browser hanya Supabase Auth dan pembacaan profil sendiri yang dilindungi RLS.

## 3. Alur Utama

```text
Browser app-binahub
  -> Supabase Auth (session/JWT)
  -> ApiFetchBridge + Bearer token
  -> binahub-api
       -> validasi input, role, program, module, assignment/membership
       -> Supabase service_role
       -> PostgreSQL/RPC atomik
```

Write yang menyentuh beberapa tabel memakai RPC transaksi: pembuatan batch, penggantian assignment, submit observasi beserta tim/roster/skor/audit, mutasi status observasi, dan submit LEP beserta seluruh rating pemateri.

## 4. Scope T-BOS

- Program aktif dipilih eksplisit; semua query T-BOS membawa `programId`.
- Assignment aktif memakai `facilitator_missions`, scoped oleh `(profile_id, mission_id, program_id)`.
- Fasilitator melihat semua tim dalam batch program untuk kebutuhan round-robin, tetapi hanya dapat submit pada mission yang ditugaskan.
- Dashboard fasilitator menghitung semua observasi pada mission miliknya; dashboard admin menghitung seluruh mission dalam program.
- Observasi menyimpan snapshot `program_id`, batch, roster, kapten, fasilitator, dan skor agar laporan historis tidak berubah ketika master data diperbarui.
- `client_submission_id` membuat retry antrean offline idempotent.

## 5. Scope LEP

- Peserta hanya dapat mengakses program yang benar-benar diikutinya dan memiliki modul LEP aktif.
- Satu profil hanya dapat mengirim satu respons per program.
- Semua pemateri aktif wajib dinilai tepat satu kali; respons dan rating disimpan dalam satu transaksi.
- Penghapusan pemateri adalah soft delete agar hasil historis tetap utuh.

## 6. Security Boundary

- Semua tabel bisnis `public` mengaktifkan RLS dan mencabut privilege `anon`/`authenticated`; `profiles` hanya membuka self-select.
- Endpoint publik memakai validasi ukuran/format, rate limit persisten, token kepemilikan/expiry, escaping HTML, dan security headers.
- Rahasia hanya berasal dari environment server. `SUPABASE_SERVICE_ROLE_KEY` dan `PROPOSAL_LINK_SECRET` tidak boleh menggunakan prefix `NEXT_PUBLIC_`.
- CORS dan daftar origin production harus ditinjau saat domain berubah.

## 7. Operasional

- Draft dan antrean offline disimpan lokal; logout menghapus data tersebut dari perangkat.
- Dashboard memakai polling periodik, bukan Supabase Realtime.
- Urutan migrasi lintas repositori dijelaskan di `binahub-api/supabase/DEPLOYMENT.md`; jangan menjalankan dua folder migration secara sembarang karena prefix historisnya bertumpang tindih.
