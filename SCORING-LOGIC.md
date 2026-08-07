# T-BOS (BinaPlay) — Scoring Logic (Detail)

Status: Draft — memperjelas logika di PRD Bagian 4.5 dengan contoh perhitungan & edge cases.

## 1. Formula Dasar

```
Level value: Reactive=1, Emerging=2, Functional=3, Effective=4, Exemplary=5

Dimension Score (per tim, per dimensi)
  = rata-rata level_value dari seluruh observation_scores
    untuk tim & dimensi tsb (lintas observasi submitted/locked)

T-BOS Score (per mission, per tim)
  = rata-rata Dimension Score dari dimensi-dimensi yang relevan
    dengan mission tsb (2-4 dimensi sesuai mapping)

Final Mission Score (per tim, per mission)
  = (Mission Performance Score × 60%) + (T-BOS Score × 40%)
  ⚠️ Mission Performance Score sumbernya belum dikonfirmasi (Open Question PRD #1)

Overall Team Score
  = rata-rata (atau akumulasi — perlu diputuskan) Final Mission Score
    dari seluruh mission yang diikuti tim
```

⚠️ **Perlu diputuskan**: "akumulasi" di PRD asli — apakah maksudnya **rata-rata** semua Final Mission Score, atau **penjumlahan**? Rata-rata lebih masuk akal secara statistik (skala tetap 1-5), tapi perlu dikonfirmasi ke pembuat spec asli.

## 2. Contoh Perhitungan

**Tim Alpha, Mission "Lost Detonator Mission"** (dimensi: Goal Alignment, Communication, Adaptability)

| Dimensi | Level dipilih fasilitator | Nilai |
|---|---|---|
| Goal Alignment | Effective | 4 |
| Communication | Exemplary | 5 |
| Adaptability | Functional | 3 |

T-BOS Score = (4 + 5 + 3) / 3 = **4.0**

Jika Mission Performance Score (dari sistem lain) = 3.5:

Final Mission Score = (3.5 × 60%) + (4.0 × 40%) = 2.1 + 1.6 = **3.7**

## 3. Edge Cases

| Kasus | Perlakuan yang diusulkan |
|---|---|
| Dimensi belum diobservasi sama sekali untuk tim tsb | Dimension Score = null, tidak masuk perhitungan T-BOS Score (bukan dianggap 0) |
| Observasi berstatus `draft` (belum submit) | Tidak dihitung sama sekali |
| Mission Performance Score belum tersedia saat T-BOS Score sudah ada | Final Mission Score = null / pending, tampilkan status "menunggu skor performance" di dashboard |
| Dua observasi untuk tim+dimensi yang sama (multi-fasilitator) | Dirata-rata (lihat STATE-MACHINE.md §3) |
| Fasilitator input observasi untuk mission yang bukan tanggung jawabnya | Ditolak di level permission/API, bukan cuma disembunyikan di UI |

## 4. Rounding & Display

⚠️ Belum diputuskan: skor ditampilkan berapa desimal (1 atau 2 angka di belakang koma)? Disarankan 1 desimal untuk keterbacaan di dashboard (radar chart, heatmap).
