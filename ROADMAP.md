# T-BOS (BinaPlay) — Roadmap / Fase Pengembangan

Status: Diusulkan — belum dikonfirmasi ke Pak Bilal/stakeholder. Tujuannya juga membantu komunikasi timeline yang realistis (bukan "beres 1 hari").

## Fase 1 — MVP Inti (Form + Scoring Dasar)
- Auth fasilitator + mapping fasilitator↔mission
- Form observasi dinamis per mission (2-4 dimensi sesuai mapping)
- Simpan observasi (status submitted, belum perlu locking kompleks di fase ini)
- Hitung Dimension Score & T-BOS Score
- ⚠️ Final Mission Score baru bisa jalan penuh setelah ADR-003 (sumber Performance Score) selesai dikonfirmasi

## Fase 2 — Dashboard Dasar
- Radar chart per tim
- Heatmap perbandingan tim
- Ranking tim sederhana

## Fase 3 — Dashboard Lanjutan & Reporting
- Rata-rata per batch
- Executive summary otomatis
- Export PDF/Excel (jika dikonfirmasi dibutuhkan)

## Fase 4 — Pengerasan (Hardening)
- State machine lengkap (window revisi, locking, audit log)
- Offline-first (jika diputuskan dibutuhkan — ADR-006)
- Real-time dashboard update (jika dibutuhkan)

## Catatan Komunikasi Timeline

Tiap fase di atas sendiri butuh minimal beberapa hari kerja (bukan jam), karena mencakup desain skema data, logic scoring dengan banyak edge case (lihat SCORING-LOGIC.md), dan komponen visual dashboard yang custom (radar chart, heatmap). Fase 1 saja — form + scoring dasar — realistis membutuhkan beberapa hari setelah frontend/UI selesai, bukan hitungan jam.
