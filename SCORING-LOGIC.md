# T-BOS (BinaPlay) — Scoring Logic (Detail)

Status: ✅ Final — diselaraskan dengan keputusan ADR-003, ADR-005, dan implementasi di `src/modules/tbos/scoring.ts`.

## 1. Formula Dasar

```
Level value: Reactive=1, Emerging=2, Functional=3, Effective=4, Exemplary=5

Dimension Score (per tim, per dimensi)
  = rata-rata level_value dari seluruh observation_scores
    untuk tim & dimensi tsb (lintas observasi submitted/locked)

T-BOS Score (per mission, per tim)
  = rata-rata Dimension Score dari dimensi-dimensi yang relevan
    dengan mission tsb (2-4 dimensi sesuai mapping)
  Note: per ADR-003, T-BOS Score langsung menjadi skor akhir mission. Formula 60/40 di-drop.

Overall Team Score
  = rata-rata T-BOS Score dari seluruh mission yang diikuti tim
    (per ADR-005: rata-rata menjaga skala tetap 1-5)
```

## 2. Contoh Perhitungan

**Tim Alpha, Mission "Lost Detonator Mission"** (dimensi: Goal Alignment, Communication, Adaptability)

| Dimensi | Level dipilih fasilitator | Nilai |
|---|---|---|
| Goal Alignment | Effective | 4 |
| Communication | Exemplary | 5 |
| Adaptability | Functional | 3 |

T-BOS Score = (4 + 5 + 3) / 3 = **4.0**

Skor akhir mission = **4.0** (skala 1-5).

## 3. Edge Cases

| Kasus | Perlakuan |
|---|---|
| Dimensi belum diobservasi sama sekali untuk tim tsb | Dimension Score = `null`, tidak masuk perhitungan T-BOS Score (bukan dianggap 0) |
| Observasi berstatus `draft` (belum submit) | Tidak dihitung |
| Dua observasi untuk tim+dimensi yang sama (multi-fasilitator) | Dirata-rata (lihat STATE-MACHINE.md §3) |
| Fasilitator input observasi untuk mission yang bukan tanggung jawabnya | Ditolak di level query/permission (`tbos_facilitator_missions`) |

## 4. Rounding & Display

Skor dibulatkan ke **1 desimal** (`round1()`) untuk konsistensi tampilan di radar chart, heatmap, dan ranking.
