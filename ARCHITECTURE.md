# T-BOS (BinaPlay) — Architecture

Status: Draft — sebagian keputusan masih asumsi, perlu dikonfirmasi (ditandai ⚠️)

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
- **Timpa**: PRD.md dan dokumen lain di repo app-binahub yang mencerminkan arah lama (ADR-010) — lihat §3.1 soal risiko ini.

### 3.1 Catatan Risiko: Menimpa PRD.md Existing

Repo app-binahub punya `PRD.md` (v0.3) yang mengusulkan arsitektur generik "Evidence-Based Transformation OS" (Tenant → Engagement → Evidence → Capability → Behavior → Outcome) untuk **seluruh platform**, bukan cuma T-BOS. PRD itu juga secara eksplisit men-defer/membuang konsep "Mission system".

Karena PRD tsb belum diimplementasi di kode (kode aktual masih scaffolding sesuai README & ROADMAP.md), menimpanya risikonya rendah secara teknis — tapi ini tetap keputusan **arsitektur platform-wide**, bukan cuma keputusan T-BOS. Kalau ada pihak lain di tim yang menulis atau merujuk PRD v0.3 itu untuk modul lain di luar T-BOS, perlu dikoordinasikan dulu sebelum ditimpa.

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

- **Offline-first**: fasilitator input di lapangan, koneksi bisa tidak stabil. Perlu strategi cache lokal (misal localStorage/IndexedDB) + sync saat online kembali. Belum diputuskan implementasinya.
- **Role-based access**: fasilitator hanya lihat mission miliknya. Perlu mapping fasilitator ↔ mission di level auth/permission, bukan cuma UI filter.
- **Real-time dashboard**: apakah dashboard perlu update real-time (Supabase Realtime) atau cukup refresh manual — belum diputuskan.
