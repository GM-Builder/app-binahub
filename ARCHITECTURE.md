# T-BOS (BinaPlay) — Architecture

Status: Active — keputusan arsitektur utama sudah dikonfirmasi dan diimplementasi. Lihat ADR.md untuk daftar lengkap.

## 1. Ringkasan

T-BOS adalah aplikasi web untuk fasilitator mengisi observasi perilaku tim selama mission, dengan dashboard agregat untuk admin/program manager.

## 2. Tech Stack

| Layer | Pilihan | Status |
|---|---|---|
| Frontend | Next.js | Dikonfirmasi (sudah in-progress) |
| UI | Shadcn UI + Tailwind | ⚠️ Asumsi, mengikuti pola SLJ/AMS — konfirmasi ke Ucet |
| Auth | Supabase Auth | ⚠️ Asumsi |
| Database | Supabase PostgreSQL | ⚠️ Asumsi |
| ORM | Drizzle ORM | ⚠️ Asumsi, mengikuti pola SLJ |
| Charting (dashboard) | Recharts / Chart.js | ⚠️ Belum diputuskan — perlu dukung radar chart & heatmap |
| Hosting | Vercel + Supabase | ⚠️ Asumsi |
| Analytics | PostHog | ⚠️ Opsional, mengikuti pola SLJ jika dibutuhkan |

## 3. T-BOS sebagai modul di app.binahub.id

✅ **Keputusan final (ADR-002, direvisi).** T-BOS dibangun sebagai modul baru di `app.binahub.id`, reuse fondasi yang sudah ada (auth, role, Supabase project).

**Alasan**: role login fasilitator sudah tersedia di app.binahub.id, jadi tidak perlu bangun auth & user management terpisah dari nol.

**Implikasi teknis**:
- **Reuse** auth Supabase, tabel `profiles`/`organizations` yang sudah ada di app-binahub.
- **Reuse** role `facilitator` dan `admin` yang sudah ada; role `peserta` masih open question (ADR-009) — apakah role baru atau relabel dari `client`.
- **Tambah baru**: skema login diubah jadi role-based auto-redirect (ADR-009) — saat ini kemungkinan user masih pilih dashboard manual di frontend, perlu diganti jadi otomatis berdasarkan role tersimpan di database.
- **Tambah baru**: tabel-tabel T-BOS sendiri (lihat DATA-MODEL.md) dengan prefix `tbos_`, mengikuti pola BinaImpact yang pakai prefix `impact_`.
- **Rombak**: landing page app.binahub.id dan dashboard fasilitator existing (ADR-010) untuk mengakomodasi T-BOS.

### 3.1 Catatan: PRD v0.4 Menggantikan v0.3

✅ **Resolved.** PRD.md sudah di-update ke v0.4 — arsitektur generik 7-layer Evidence/Capability dari v0.3 diturunkan jadi visi jangka panjang (Bagian 9 PRD v0.4), bukan fondasi wajib. Platform sekarang modular per layanan, selaras dengan prinsip yang sudah ada di ROADMAP.md.

## 4. High-Level Component

```
[Fasilitator - Mobile/Tablet Web]
        |
        v
  Observation Form (Next.js)
        |
        v
  API / Server Action  ---->  Scoring Engine (hitung skor per dimensi & mission)
        |
        v
     Database  ---->  Dashboard (Admin) - Radar Chart, Heatmap, Ranking, Executive Summary
```

## 5. Pertimbangan Teknis Kunci

- **Offline-first**: ✅ Diimplementasi via localStorage (ADR-006). Auto-save draft, antrian offline, dan flush otomatis saat online kembali. Bukan full PWA/Service Worker.
- **Role-based access**: Fasilitator hanya melihat tim yang di-assign via `tbos_facilitator_teams`; semua misi aktif dipilih ketika observasi. Backend memvalidasi JWT dan assignment tim pada setiap operasi.
- **API Architecture**: Frontend (`app-binahub`) tidak mengakses Supabase langsung — semua operasi data dikirim ke `binahub-api` via HTTP fetch. `ApiFetchBridge` di root layout otomatis meng-intercept `/api/*` calls, mengarahkan ke backend, dan menyisipkan auth token.
- **Real-time dashboard**: Auto-refresh setiap 30 detik via `setInterval` di client (bukan Supabase Realtime). Cukup untuk kebutuhan saat ini.
