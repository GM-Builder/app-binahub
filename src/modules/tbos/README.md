# T-BOS Module

Team Behavioral Observation System — modul untuk fasilitator mengobservasi perilaku tim selama mission simulasi.

## Struktur

```
src/modules/tbos/
├── config.ts    — Mission & dimension configuration (5 missions, 8 dimensions, 40 levels)
├── types.ts     — TypeScript types untuk observations, scores, dashboard data
├── scoring.ts   — Scoring logic (Dimension Score, T-BOS Score, Overall Team Score, Executive Summary)
└── README.md    — This file
```

## Scoring Formula

```
Level value: Reactive=1, Emerging=2, Functional=3, Effective=4, Exemplary=5

Dimension Score (per team, per dimension)
  = average level_value from all submitted/locked observations

T-BOS Score (per mission, per team)
  = average of Dimension Scores for dimensions relevant to that mission

Final Mission Score
  = T-BOS Score for that mission (scale 1-5)

Overall Team Score
  = average of Final Mission Scores across all missions participated
```

## Mission → Dimension Mapping

| Mission | Dimensions |
|---------|-----------|
| Lost Detonator Mission | Goal Alignment, Communication, Adaptability |
| Goldsmith Precision Lab | Communication, Execution Discipline, Accountability |
| Ore Extraction Challenge | Communication, Collaboration, Organizational Ownership |
| Lean Bridge Challenge | Goal Alignment, Data-Based Decision Making, Execution Discipline |
| X-Case | Communication, Data-Based Decision Making, Accountability, Organizational Ownership |

## Keputusan Aktif

- ADR-003: T-BOS Score langsung menjadi skor akhir mission; formula 60/40 tidak digunakan.
- ADR-004: Satu observasi kanonik per program + tim + mission; retry dilindungi idempotency.
- ADR-005: Overall Team Score memakai rata-rata, bukan penjumlahan.
- Offline-first sudah tersedia melalui draft lokal dan antrean sinkronisasi.
