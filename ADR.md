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
  4. **Force logout on role change**: begitu admin mengubah role user, sesi aktif user tsb otomatis di-invalidate (logout paksa).
  5. **Auto-redirect saat login berikutnya**: setelah login ulang, sistem membaca role terbaru dari database dan mengarahkan otomatis ke dashboard yang sesuai (`peserta` / `facilitator` / `admin`) — tidak ada pilihan manual.
- **Implikasi teknis**:
  - Role disimpan di tabel `profiles` (kolom `role`), bukan di JWT/session yang bisa stale — atau kalau role memang disimpan di JWT claims, perlu mekanisme refresh token dipaksa saat role berubah (ini yang mendasari kebutuhan force logout).
  - Force logout bisa via Supabase Admin API (`auth.admin.signOut` / revoke session) dipicu saat admin submit perubahan role.
  - Middleware Next.js membaca role dari `profiles` setiap request ke area dashboard, redirect ke `/peserta`, `/fasilitator`, atau `/admin` sesuai role.
- **Status**: ✅ Final — alur signup/role-assignment/redirect sudah dikonfirmasi Ucet. Detail implementasi (kolom, RLS policy) menyusul di DATA-MODEL.md.

## ADR-011: Simplifikasi Scope app.binahub.id untuk T-BOS
- **Konteks**: Repo app-binahub punya `PRD.md` (v0.3) yang mendesain seluruh platform sebagai "Evidence-Based Transformation OS" — 7 layer generik (Tenant/Org → Engagement → People → Evidence → Capability → Behavior → Outcome) + 7 modul (termasuk Evidence Engine, Action System, Intelligence Layer/AI). Ini jauh lebih kompleks dari kebutuhan T-BOS.
- **Keputusan**: T-BOS tetap dibangun di app.binahub.id (ADR-002), tapi **tidak mengikuti arsitektur generik PRD v0.3**. Bagian yang di-skip/ditunda dari scope kerja T-BOS:
  1. Layer 1 (Tenant/Organization multi-tenant) — T-BOS single-org, tidak perlu isolasi multi-klien.
  2. Layer 4-5 (Evidence Engine & Capability generik) — T-BOS pakai skema & formula scoring sendiri (lihat DATA-MODEL.md, SCORING-LOGIC.md), tidak dipaksa masuk model Evidence→Capability generik.
  3. Konsep "Mission" tetap spesifik-T-BOS, tidak diretrofit ke "Engagement" generik — PRD v0.3 sendiri sudah men-defer Mission system (lihat §9 "What We Removed" di PRD.md mereka).
  4. Layer 6 (Behavior Layer generik) — 8 dimensi perilaku T-BOS diimplementasi sebagai fitur T-BOS sendiri, bukan lewat "Behavior Layer" PRD v0.3 (yang di situ pun ditandai opsional/ditunda).
  5. Module 6 (Action System) dan Module 7 (Intelligence Layer/AI) — tidak relevan untuk T-BOS, skip total.
  6. Module 4 (Participant Workspace lengkap: Action Plan, Reflection Journal) — dashboard peserta T-BOS cukup sederhana/placeholder dulu, bukan workspace selengkap itu.
- **Yang tetap direuse**: Module 1 (Auth & Role System) dan Layer 3 (People: Participant/Facilitator/Admin) — sudah selaras dengan role `peserta`/`facilitator`/`admin` di ADR-009.
- **Alasan tambahan**: selaras dengan prinsip yang ditulis tim app-binahub sendiri di ROADMAP.md mereka — hindari abstraksi generik sebelum ada beberapa modul yang membuktikan pola yang sama.
- **Status**: ✅ Final.

## ADR-010: Rombak Landing Page, Dashboard Fasilitator, dan Dokumen Existing
- **Konteks**: Mengadopsi T-BOS sebagai modul app.binahub.id berarti landing page dan dashboard fasilitator yang sudah ada (scaffolding) perlu diselaraskan dengan kebutuhan T-BOS. Repo juga sudah punya PRD.md, ROADMAP.md, DESIGN.md, dll yang mencerminkan arah lama (termasuk arsitektur Evidence/Capability v0.3 yang secara eksplisit men-defer konsep Mission — lihat catatan di ARCHITECTURE.md).
- **Keputusan**:
  1. Landing page app.binahub.id dirombak untuk mengakomodasi T-BOS sebagai salah satu layanan yang ditampilkan/diakses.
  2. Dashboard fasilitator yang sudah ada (placeholder) dirombak untuk mengakomodasi workflow observasi T-BOS.
  3. PRD.md di-update ke v0.4 yang mencerminkan arah modular — arsitektur generik v0.3 diturunkan jadi visi jangka panjang (Bagian 9 PRD v0.4), bukan dihapus.
- **Risiko**: ✅ Resolved — PRD v0.4 sudah menggantikan v0.3. Arsitektur generik dipertahankan sebagai visi jangka panjang.
- **Status**: ✅ Final — PRD v0.4 sudah di-commit, landing page dan dashboard sudah dirombak.

## ADR-003: Sumber Mission Performance Score (komponen 60% skor akhir)
- **Konteks**: Final Mission Score = 60% Performance + 40% Behavioral (T-BOS). Performance Score-nya dari mana belum jelas.
- **Keputusan**: ⚠️ **Belum diputuskan** — perlu dikonfirmasi apakah dari sistem terpisah, input manual admin, atau modul lain yang belum dibangun.
- **Status**: 🔴 Open — **blocking** untuk fitur perhitungan skor akhir, meski form observasi & T-BOS Score sendiri bisa jalan tanpa ini.

## ADR-004: Penanganan Observasi Duplikat (Multi-Fasilitator)
- **Konteks**: Mungkin ada 2 fasilitator mengobservasi tim+mission yang sama.
- **Keputusan**: Diizinkan, dirata-rata di level Dimension Score (bukan overwrite). Lihat STATE-MACHINE.md §3.
- **Status**: 🟡 Diusulkan, perlu konfirmasi ke stakeholder.

## ADR-005: Overall Team Score — Rata-rata vs Akumulasi
- **Konteks**: PRD asli bilang "akumulasi" seluruh mission, ambigu antara sum vs average.
- **Keputusan**: ✅ **Rata-rata** — skala tetap 1-5, lebih mudah dibaca di dashboard. Implementasi: `scoring.ts` → `calculateOverallTeamScore()` menghitung rata-rata dari semua T-BOS Score per mission.
- **Status**: ✅ Final — sudah diimplementasi.

## ADR-006: Offline-first untuk Form Observasi
- **Konteks**: Fasilitator input di lapangan, koneksi bisa tidak stabil.
- **Keputusan**: ✅ **localStorage-based offline support** — `api-client.ts` mengimplementasi:
  1. `saveDraft()` / `loadDraft()` — auto-save draft skor ke localStorage saat fasilitator mengisi form.
  2. `queueObservation()` / `getQueuedObservations()` — jika submit gagal atau offline, observasi disimpan ke antrian lokal.
  3. `flushQueuedObservations()` — saat koneksi pulih, antrian dikirim ulang ke backend secara otomatis.
- **Implikasi**: Bukan full Service Worker/PWA (tidak ada cache API response), tapi cukup untuk skenario utama: fasilitator tetap bisa mengisi form dan submit meski koneksi tidak stabil.
- **Status**: ✅ Final — sudah diimplementasi.

## ADR-007: Fase MVP
- **Konteks**: Scope penuh (form + scoring + dashboard lengkap) cukup besar untuk sekali build.
- **Keputusan**: Lihat ROADMAP.md untuk pembagian fase. Fase 1 (form observasi + dashboard admin + scoring) sudah berjalan.
- **Status**: ✅ Final — fase 1 sudah diimplementasi, fase selanjutnya mengikuti ROADMAP.md.