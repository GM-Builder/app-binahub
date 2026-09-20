# T-BOS Module

Team Behavioral Observation System — modul untuk fasilitator mengobservasi kompetensi perilaku tim selama aktivitas program.

## Model Operasional Default

- Admin memilih 1–8 kompetensi pada level program.
- Pilihan kompetensi terkunci otomatis setelah observasi pertama tersimpan.
- Fasilitator memilih program dan tim, lalu langsung menilai kompetensi program tanpa memilih misi.
- `program_observation` dipakai sebagai identitas teknis internal agar data dan API lama tetap kompatibel.
- Dashboard, Live Score, dan laporan hanya mengolah kompetensi yang dipilih untuk program tersebut.

## Struktur

```
src/modules/tbos/
├── config.ts    — Konfigurasi konteks observasi dan 8 kompetensi (40 level)
├── types.ts     — TypeScript types untuk observations, scores, dashboard data
├── scoring.ts   — Logika skor kompetensi, skor tim, dan ringkasan eksekutif
└── README.md    — This file
```

## Scoring Formula

```
Level value: Reactive=1, Emerging=2, Functional=3, Effective=4, Exemplary=5

Competency Score (per team, per competency)
  = average level_value from all submitted/locked observations

T-BOS Score (per observation context, per team)
  = average of selected Competency Scores

Final Observation Score
  = T-BOS Score for that observation context (scale 1-5)

Overall Team Score
  = average of Final Observation Scores across all completed observations
```

## Peta Historis

| Konteks lama | Kompetensi |
|---------|-----------|
| Lost Detonator Mission | Goal Alignment, Communication, Adaptability |
| Goldsmith Precision Lab | Communication, Execution Discipline, Accountability |
| Ore Extraction Challenge | Communication, Collaboration, Organizational Ownership |
| Lean Bridge Challenge | Goal Alignment, Data-Based Decision Making, Execution Discipline |
| X-Case | Communication, Data-Based Decision Making, Accountability, Organizational Ownership |

## Keputusan Aktif

- ADR-003: T-BOS Score langsung menjadi skor akhir observasi; formula 60/40 tidak digunakan.
- ADR-004: Satu observasi kanonik per program + tim + konteks internal; retry dilindungi idempotency.
- ADR-005: Overall Team Score memakai rata-rata, bukan penjumlahan.
- Offline-first sudah tersedia melalui draft lokal dan antrean sinkronisasi.
