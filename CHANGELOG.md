# Changelog

Semua perubahan yang signifikan pada proyek ini akan didokumentasikan di file ini.
Format yang digunakan berdasarkan [Keep a Changelog](https://keepachangelog.com/id/1.0.0/), dan proyek ini mematuhi aturan [Semantic Versioning](https://semver.org/).

## [0.2.0] - 2026-06-24

### Added
- Menambahkan autentikasi klien berbasis Supabase Auth dengan kode akses. Endpoint `/api/client/access` membuat user Supabase per kode akses dan mengembalikan `access_token`/`refresh_token`, frontend memanggil `supabase.auth.setSession()`.
- Menambahkan isolasi data server-side untuk pengguna klien: GET `/api/engagements` memfilter berdasarkan `organization_id`, GET `/api/evidence` dan `/api/actions` memfilter berdasarkan `participant_id`, GET `/api/capabilities/participant/:id` memverifikasi kepemilikan.
- Menambahkan auto-generate kode akses saat program dibuat. Backend `generateAccessCodesForEngagement()` membuat kode seperti `MASMINDO-A`, `MASMINDO-B` otomatis berdasarkan nama organisasi + suffix huruf.
- Menambahkan endpoint `GET /api/engagements/access-codes` untuk mengambil daftar kode akses per program.
- Menambahkan SQL migration `0006_access_code_links.sql` untuk menambahkan kolom `organization_id` dan `participant_id` ke tabel `app_client_access_codes`.
- Menambahkan halaman admin `/admin/engagements/access-codes` untuk melihat, menyalin, dan mengelola kode akses klien.
- Menambahkan tombol "Kode Akses" pada halaman `/admin/engagements/manage` dan card program di `/admin/engagements`.
- Menampilkan kode akses setelah pembuatan program selesai, lengkap dengan tombol salin per kode dan salin semua.
- Menambahkan `TransformationActor` yang diperkaya dengan `organizationId`, `participantId`, dan `accessCodeId` untuk filtering data di seluruh route handler.
- Menambahkan unit test dengan Vitest (16 test) untuk `capability-engine`.
- Menambahkan E2E test dengan Playwright (20 test) untuk halaman utama.
- Menambahkan analytics tracking (`src/lib/analytics.ts`) dengan hooks `usePageTracking` dan `useEngagementTracking`.
- Menambahkan error tracking terpusat (`src/lib/error-tracking.ts`) dengan `GlobalErrorHandler`.
- Menambahkan komponen `LoadingSpinner` dan `PageLoadingSpinner` untuk loading states.
- Menambahkan `optimizePackageImports` untuk lucide-react dan recharts di `next.config.ts`.
- Menambahkan lazy loading untuk komponen berat seperti recharts dan framer-motion.

### Changed
- Mengubah autentikasi klien dari cookie-based (`binahub_client_access`) menjadi Supabase Auth. Client Supabase user dibuat sebagai `client-{access_code_id}@binahub.local` dengan metadata yang berisi `access_code_id`, `organization_id`, dan `participant_id`.
- Mengubah `getClientAccess()` dan seluruh flow autentikasi klien agar menggunakan Supabase session alih-alih cookie.
- Mengubah `app-shell.tsx` untuk menggunakan `supabase.auth.signOut()` alih-alih penghapusan cookie manual.
- Mengubah halaman `/client/access` untuk menggunakan Supabase `setSession()` dengan notifikasi toast.
- Mengubah `binimpact/page.tsx` untuk membaca role dari Supabase session dengan timeout 5 detik dan spinner.
- Mengubah `client-auth-gate.tsx` untuk memeriksa `supabase.auth.getSession()` untuk role `client` atau `admin`.
- Mengubah viewport dan themeColor ke export terpisah di `layout.tsx`.
- Mengubah `use-transformation-data.ts` agar menghilangkan `setLoading(true)` dari `useEffect` body sesuai React 19 lint rules.
- Memperbarui seluruh hook data untuk menggunakan filtering berbasis peran pengguna.

### Removed
- Menghapus PWA support (service worker, manifest) yang menyebabkan error icon-192.png 404 dan chrome-extension errors.
- Menghapus dependency PWA dari `next.config.ts`.

### Fixed
- Memperbaiki viewport/themeColor yang sebelumnya menyebabkan warning di Next.js 16.
- Memperbaiki error autentikasi klien akibat `SameSite=lax` + `Secure` cookies yang tidak bekerja di `http://localhost:3000`.

### Notes
- Kode akses yang sudah ada (MASMINDO-A/B/C/D) sudah terhubung ke organization `PT Masmindo Dwi Area` dan participant masing-masing.
- Build output: 55 static pages, 0 errors (Next.js 16.2.6, Turbopack).

## [0.1.0] - 2026-06-18

### Added
- Menambahkan halaman dashboard admin, klien, dan fasilitator dengan RBAC berbasis role.
- Menambahkan modul manajemen program (engagement) lengkap dengan pembuatan, pengelolaan, dan transisi status.
- Menambahkan modul pencatatan evidence (catatan) dengan status review dan komentar.
- Menambahkan modul manajemen aksi tindak lanjut dengan assignment, status, dan bukti.
- Menambahkan modul kemampuan (capability) berbasis 4P dengan perhitungan otomatis.
- Menambahkan halaman bantuan terpisah untuk admin, klien, dan fasilitator.
- Menambahkan komponen UI bersama: StatusPill, ProgressBar, TrendIcon, EmptyState, FilterTabs, StatCard, Breadcrumb, Skeleton, ConfirmDialog, SearchInput.
- Menambahkan error boundary dan global error handler.
- Menambahkan ApiFetchBridge untuk mengarahkan semua fetch `/api/*` ke `https://api.binahub.id`.
- Menambahkan static export dengan `output: "export"` untuk deployment statis.
