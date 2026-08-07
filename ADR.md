# T-BOS (BinaPlay) — Architecture Decision Records

Format ringkas: Konteks → Keputusan → Status.

## ADR-001: Frontend Framework
- **Konteks**: Perlu pilih framework frontend untuk form observasi & dashboard.
- **Keputusan**: Next.js.
- **Status**: ✅ Dikonfirmasi (sudah in-progress, per chat dengan Ucet).

## ADR-002: T-BOS sebagai modul app.binahub.id vs aplikasi terpisah
- **Konteks**: BinaHub sudah punya `app.binahub.id` (platform modular, role facilitator sudah ada, saat ini masih tahap scaffolding awal — lihat github.com/binahubid/app-binahub).
- **Opsi**: (A) modul baru di app.binahub.id, (B) aplikasi terpisah seperti SLJ.
- **Keputusan**: ✅ **Opsi A — Modul di app.binahub.id.** (Direvisi dari keputusan sebelumnya yang sempat memilih Opsi B.) Alasan: role login fasilitator sudah tersedia di app.binahub.id, jadi tidak perlu bangun auth & user management terpisah.
- **Implikasi**: lihat ADR-009 (skema login role-based) dan ADR-010 (rombak landing page, dashboard fasilitator, dan dokumen existing di repo).
- **Status**: ✅ Final (per keputusan terbaru Ucet).

## ADR-009: Skema Login Role-Based Auto-Redirect
- **Konteks**: Perlu skema login terpadu yang otomatis mengarahkan user ke dashboard sesuai role, tanpa pilihan manual di frontend.
- **Keputusan**:
  1. **1 portal signup/signin** menggunakan Supabase Auth — semua user (calon peserta, fasilitator, admin) daftar lewat portal yang sama.
  2. **Default role saat signup = `peserta`** (akun umum). Tidak ada pilihan role saat mendaftar.
  3. **Admin yang meng-assign role `facilitator`** ke user tertentu (lewat panel admin) — bukan self-service.
  4. **Force logout on role change**: begitu admin mengubah role user, sesi aktif user tsb otomatis di-invalidate (logout paksa) via `supabase.auth.admin.signOut()`.
  5. **Auto-redirect saat login**: setelah login, sistem membaca role dari tabel `profiles` dan mengarahkan otomatis ke dashboard yang sesuai (`peserta` / `facilitator` / `admin`).
- **Implikasi teknis**:
  - App menggunakan `output: "export"` (static export) — **middleware Next.js tidak didukung**. Auto-redirect diimplementasi client-side via `RoleRedirect` component di setiap auth gate.
  - Role dibaca dari tabel `profiles` (via API endpoint `/api/auth/role`), bukan dari JWT metadata yang bisa stale.
  - Force logout via API endpoint `POST /api/admin/users/role` yang memanggil `supabase.auth.admin.signOut(userId)` setelah update role.
- **Status**: ✅ Final — diimplementasi: unified login page, role redirect component, force-logout endpoint, profiles table lookup.

## ADR-010: Rombak Landing Page, Dashboard Fasilitator, dan Dokumen Existing
- **Konteks**: Mengadopsi T-BOS sebagai modul app.binahub.id berarti landing page dan dashboard fasilitator yang sudah ada (scaffolding) perlu diselaraskan dengan kebutuhan T-BOS. Repo juga sudah punya PRD.md, ROADMAP.md, DESIGN.md, dll yang mencerminkan arah lama (termasuk arsitektur Evidence/Capability v0.3 yang secara eksplisit men-defer konsep Mission — lihat catatan di ARCHITECTURE.md).
- **Keputusan**:
  1. Landing page app.binahub.id dirombak untuk mengakomodasi T-BOS sebagai salah satu layanan yang ditampilkan/diakses.
  2. Dashboard fasilitator yang sudah ada (placeholder) dirombak untuk mengakomodasi workflow observasi T-BOS.
  3. PRD.md dan dokumen lain di repo app.binahub.id ditimpa dengan dokumen baru yang mencerminkan T-BOS + arah modular yang lebih grounded (bukan arsitektur Evidence/Capability v0.3 yang belum pernah diimplementasi di kode).
- **Risiko**: PRD v0.3 lama mendefinisikan visi arsitektur untuk seluruh platform (bukan cuma T-BOS) — menimpanya berarti keputusan platform-wide, bukan cuma soal T-BOS. Perlu dipastikan tidak ada pihak lain yang masih berpegang pada dokumen lama itu untuk modul lain.
- **Status**: 🟡 Diputuskan arahnya oleh Ucet, dokumen pengganti disiapkan menyusul.

## ADR-003: Sumber Mission Performance Score (komponen 60% skor akhir)
- **Konteks**: Final Mission Score = 60% Performance + 40% Behavioral (T-BOS). Performance Score-nya dari mana belum jelas.
- **Keputusan**: ✅ **Resolved — Tidak ada Mission Performance Score.** Spec terbaru (detail tambahan dari stakeholder) tidak menyebutkan komponen performance score sama sekali. T-BOS Score langsung menjadi skor mission. Formula 60/40 di-drop.
- **Status**: ✅ Final — implementasi saat ini sudah benar (T-BOS Score = skor mission, Overall Team Score = rata-rata T-BOS Scores).

## ADR-004: Penanganan Observasi Duplikat (Multi-Fasilitator)
- **Konteks**: Mungkin ada 2 fasilitator mengobservasi tim+mission yang sama.
- **Keputusan**: Diizinkan, dirata-rata di level Dimension Score (bukan overwrite). Lihat STATE-MACHINE.md §3.
- **Status**: 🟡 Diusulkan, perlu konfirmasi ke stakeholder.

## ADR-005: Overall Team Score — Rata-rata vs Akumulasi
- **Konteks**: PRD asli bilang "akumulasi" seluruh mission, ambigu antara sum vs average.
- **Keputusan**: ✅ **Rata-rata** — skala tetap 1-5, lebih mudah dibaca di dashboard. Dikonfirmasi oleh spec terbaru: "Nilai akhir tim merupakan agregasi seluruh mission yang diikuti."
- **Status**: ✅ Final — diimplementasi di `scoring.ts calculateOverallTeamScore`.

## ADR-006: Offline-first untuk Form Observasi
- **Konteks**: Fasilitator input di lapangan, koneksi bisa tidak stabil.
- **Keputusan**: ✅ **localStorage auto-save + submission queue.** Form state di-save ke localStorage secara otomatis (setiap perubahan). Jika submit gagal (offline/timeout), observasi masuk ke queue di localStorage dan di-retry saat online kembali. Indikator online/offline ditampilkan di UI.
- **Alasan**: Service Worker/IndexedDB terlalu kompleks untuk MVP. localStorage cukup untuk form sederhana (2-4 dimensi × 1 level per dimensi). App sudah static export (no server runtime), jadi caching di client-side adalah approach yang paling pragmatic.
- **Status**: ✅ Final.

## ADR-007: Fase MVP
- **Konteks**: Scope penuh (form + scoring + dashboard lengkap) cukup besar untuk sekali build.
- **Keputusan**: Lihat ROADMAP.md untuk pembagian fase yang diusulkan.
- **Status**: 🟡 Diusulkan.
