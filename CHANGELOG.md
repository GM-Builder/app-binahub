# Changelog

Semua perubahan yang signifikan pada proyek ini akan didokumentasikan di file ini.
Format yang digunakan berdasarkan [Keep a Changelog](https://keepachangelog.com/id/1.0.0/), dan proyek ini mematuhi aturan [Semantic Versioning](https://semver.org/).

## [0.3.1] - 2026-08-07

### Added — ADR-009, Peserta Dashboard, Team Members, Filters

#### ADR-009: Role-Based Auto-Redirect Login
- Menambahkan halaman `/login` (unified login portal) — semua user (peserta, fasilitator, admin) login lewat portal yang sama, sistem auto-redirect ke dashboard sesuai role dari tabel `profiles`.
- Menambahkan `GET /api/auth/role` (binahub-api) — mengembalikan role dari `profiles` table + URL redirect yang sesuai.
- Menambahkan `POST /api/admin/users/role` (binahub-api) — admin mengubah role user + force-logout via `supabase.auth.admin.signOut(userId, "global")`.
- Menambahkan role `peserta` ke `roles.ts` dan `navByRole` di `app-shell.tsx`.
- Menghapus route lama `(auth)/login` yang redirect ke `/` — sekarang semua login lewat `/login`.

#### Peserta Dashboard (`/peserta/dashboard`)
- Menambahkan halaman dashboard peserta dengan welcome banner, stat cards (ranking, skor, mission selesai, nama tim), info cards (tentang T-BOS, 8 dimensi perilaku), dan logout button.
- Auto-redirect: jika role bukan `peserta`, redirect ke dashboard yang sesuai.

#### Team Members di Form Observasi
- Menambahkan tampilan anggota tim di team selection pada form observasi `/fasilitator/tbos` — nama anggota ditampilkan sebagai chips/badges di bawah nama tim.

#### Batch Filter di Dashboard
- Menambahkan batch filter (Semua / Batch 1 / Batch 2) di Radar Chart — filter tim yang ditampilkan berdasarkan batch.
- Menambahkan batch filter di Heatmap — filter baris tim berdasarkan batch.

### Changed
- Mengubah `roles.ts`: menambah `peserta` ke daftar roles, update `roleHome` mapping (facilitator → `/fasilitator/tbos`).
- Mengubah `app-shell.tsx`: menambah nav items untuk role `peserta`.
- Mengubah ADR-003: status berubah dari 🔴 Open → ✅ Final (tidak ada Mission Performance Score, T-BOS Score langsung menjadi skor mission).
- Mengubah ADR-005: status berubah dari 🔴 Open → ✅ Final (rata-rata, dikonfirmasi spec terbaru).
- Mengubah ADR-006: status berubah dari 🔴 Open → ✅ Final (localStorage auto-save + submission queue, bukan Service Worker).
- Mengubah ADR-009: status berubah dari partial → ✅ Final (force-logout + auto-redirect diimplementasi).

### Notes
- Build output: 61 static pages, 0 errors (Next.js 16.2.6, Turbopack).
- Halaman baru: `/login`, `/peserta/dashboard`.
- API endpoints baru (binahub-api): `GET /api/auth/role`, `POST /api/admin/users/role`.

## [0.3.0] - 2026-08-07

### Added — T-BOS (Team Behavioral Observation System)

Modul T-BOS untuk fasilitator mengobservasi perilaku tim selama mission simulasi. Diimplementasi dalam 4 fase (MVP → Dashboard → Executive Summary + Export → Hardening).

#### Migration & Database
- Menambahkan migration `0005_tbos_tables.sql`: 9 tabel `tbos_*` (`tbos_missions`, `tbos_behavioral_dimensions`, `tbos_mission_dimensions`, `tbos_dimension_levels`, `tbos_teams`, `tbos_team_members`, `tbos_facilitator_missions`, `tbos_observations`, `tbos_observation_scores`) dengan RLS policies.
- Menambahkan migration `0006_add_peserta_role.sql`: role `peserta` di profiles check constraint, default role saat signup berubah ke `peserta`, kolom `role_updated_at` untuk force-logout mechanism (ADR-009).
- Menambahkan migration `0007_tbos_state_machine.sql`: tabel `tbos_observation_audit_log`, kolom `locked_at`/`locked_by`/`revision_deadline` di observations, trigger auto-set revision deadline.
- Seed data: 5 missions (Lost Detonator, Goldsmith Precision, Ore Extraction, Lean Bridge, X-Case), 8 behavioral dimensions (Goal Alignment, Communication, Data-Based Decision Making, Execution Discipline, Accountability, Adaptability, Collaboration, Organizational Ownership), 40 level descriptions (5 levels × 8 dimensions), 16 mission-dimension mappings.

#### Module (`src/modules/tbos/`)
- Menambahkan `config.ts`: konfigurasi 5 missions, 8 dimensions, 40 level descriptions, mission→dimension mapping sesuai PRD §4.2.
- Menambahkan `types.ts`: TypeScript types untuk Observation, Score, TeamScoreSummary, MissionScore, BatchComparison, ExecutiveSummary, TbosDashboardData, ExecutiveNarrative.
- Menambahkan `scoring.ts`: logika perhitungan skor — Dimension Score (rata-rata level_values), T-BOS Score (rata-rata dimension scores per mission), Overall Team Score (rata-rata T-BOS Scores), Batch Comparison, Executive Summary dengan narrative text generation otomatis (Bahasa Indonesia).
- Menambahkan `README.md` dokumentasi modul.

#### API Routes (binahub-api)
- Menambahkan `GET /api/tbos/missions`: missions ditugaskan ke fasilitator + dimensions + levels.
- Menambahkan `POST /api/tbos/observations`: submit observasi baru dengan validasi facilitator↔mission dan mission↔dimension.
- Menambahkan `GET /api/tbos/observations`: list observasi (fasilitator: own only, admin: all) dengan status, revision deadline, canEdit flag.
- Menambahkan `GET /api/tbos/observations/[id]`: detail observasi + audit log timeline.
- Menambahkan `PATCH /api/tbos/observations/[id]`: aksi `lock`, `unlock` (admin only), `edit` (dalam revision window).
- Menambahkan `GET /api/tbos/dashboard`: data dashboard untuk admin (teams, observations, dimensions, mission-dimension mapping).
- Menambahkan `GET /api/tbos/teams` + `POST`: manajemen tim (admin only).
- Menambahkan `GET /api/tbos/export?format=csv`: export CSV raw observation data dengan UTF-8 BOM.

#### Observation Form UI (`/fasilitator/tbos`)
- Form observasi mobile-first, dinamis per mission (2-4 dimensi sesuai mapping).
- Step 1: pilih mission + tim.
- Step 2: isi level per dimensi (5 pilihan: Reactive→Exemplary) dengan deskripsi perilaku.
- Progress counter, notes field (opsional, max 50 karakter), validasi semua dimensi terisi.
- Step 3: submit + success page dengan branding BinaHub.

#### Observation List & Detail (`/fasilitator/tbos/observations`)
- List observasi dengan status badge (Draft/Submitted/Locked) dan canEdit indicator.
- Detail panel (modal): meta info, skor per dimensi dengan deskripsi, edit mode (ubah level + notes), lock/unlock buttons (admin), audit log timeline (create → edit → lock → unlock).
- Revision window display: menampilkan deadline edit dan status (aktif/berakhir).

#### Admin Dashboard (`/admin/tbos`)
- 6 tab: Overview, Executive Summary, Radar Chart, Heatmap, Ranking, Batch Comparison.
- Overview: 4 stat cards, 3 kekuatan utama, 3 area pengembangan, tabel ringkasan tim.
- Executive Summary: narrative text otomatis (overview, kekuatan, area pengembangan, rekomendasi strategis) dengan batch insight per dimensi.
- Radar Chart: per tim, 8 dimensi, unobserved dimensions excluded dari polygon (bukan 0), tooltip "Belum diobservasi".
- Heatmap: grid tim × 8 dimensi, warna gradasi 5-tier (merah→hijau), avg per tim, legend.
- Ranking: diurutkan by Overall Team Score (desc), medali 🥇🥈🥉, kekuatan & area dev per tim.
- Batch Comparison: horizontal bar chart Batch 1 vs 2 per dimensi + tabel dengan selisih.
- Real-time: auto-refresh 30 detik dengan live indicator + manual refresh button.
- Export: PDF (3 halaman A4 — executive summary, team ranking + score matrix, batch comparison) dan CSV (raw observation data).

#### Sidebar Navigation
- Admin: tambah menu "T-BOS" (icon Trophy).
- Fasilitator: tambah menu "T-BOS Observasi" (icon ClipboardCheck) dan "Riwayat Observasi" (icon Eye).

### Changed
- Mengubah `app-shell.tsx`: menambahkan navigasi T-BOS untuk admin dan fasilitator.
- Mengubah profiles role check constraint: menambah `peserta` sebagai role default untuk signup baru.
- Mengubah `requireFacilitator` auth: admin tidak lagi bisa submit observasi (hanya fasilitator), sesuai permission matrix ROLES-PERMISSIONS.md §3.

### Fixed
- Memperbaiki revision window trigger yang tidak pernah fire: trigger sekarang aktif pada INSERT (bukan hanya UPDATE draft→submitted), sehingga `revision_deadline` ter-set otomatis saat observasi disubmit.
- Memperbaiki typo "Exemplatory" → "Exemplary" pada CSV export level label.
- Memperbaiki radar chart: dimensi yang belum diobservasi sekarang excluded dari polygon (menggunakan `connectNulls={false}` + `null` value), bukan ditampilkan sebagai skor 0.
- Memperbaiki audit log: entri "submit" yang misleading (mencatat previous_status="draft" padahal observasi langsung insert sebagai "submitted") dihapus — hanya mencatat action "create".

### Known Limitations & Open ADRs
- **ADR-003 (Open)**: Final Mission Score (60% Performance + 40% T-BOS) belum diimplementasi — menunggu konfirmasi sumber Mission Performance Score. Overall Team Score sementara menggunakan rata-rata T-BOS Score.
- **ADR-006 (Open)**: Offline-first untuk form observasi belum diimplementasi.
- **ADR-009 (Partial)**: Role `peserta` ditambahkan ke DB, tetapi force-logout mechanism dan middleware auto-redirect belum diimplementasi. Role masih dibaca dari JWT metadata, bukan dari tabel `profiles`.
- **Peserta dashboard**: Belum ada halaman `/peserta` (placeholder belum dibuat).
- **Team members**: Belum ditampilkan di form observasi (PRD §4.1 — Nama Anggota Tim auto-populate).
- **Batch/date filters**: Radar chart dan heatmap belum memiliki filter batch atau rentang tanggal.
- **Excel export**: Hanya CSV yang tersedia (bukan .xlsx).
- **Min-data threshold**: Executive summary belum memiliki threshold minimum observasi (risiko bias small sample).
- **Super Admin role**: Documented di ROLES-PERMISSIONS.md tapi belum ada di DB constraint atau code.

### Notes
- Build output: 58 static pages, 0 errors (Next.js 16.2.6, Turbopack).
- Halaman T-BOS yang ter-generate: `/admin/tbos`, `/fasilitator/tbos`, `/fasilitator/tbos/observations`.
- Migrations perlu dijalankan berurutan: `0005` → `0006` → `0007`.
- Setelah migration, assign fasilitator ke mission: `INSERT INTO tbos_facilitator_missions (profile_id, mission_id) VALUES (...)` dan buat tim: `INSERT INTO tbos_teams (name, batch) VALUES (...)`.

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
