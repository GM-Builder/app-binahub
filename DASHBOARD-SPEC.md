# T-BOS (BinaPlay) — Dashboard Spec (Detail)

Status: Draft — memperjelas PRD Bagian 5 dengan detail komponen yang dibutuhkan dev.

## 1. Radar Chart per Tim

- **Axes**: 8 dimensi perilaku (Goal Alignment, Communication, Data-Based Decision Making, Execution Discipline, Accountability, Adaptability, Collaboration, Organizational Ownership)
- **Value**: Dimension Score (1-5) per tim
- **Filter**: pilih tim, pilih batch
- ⚠️ Dimensi yang belum pernah diobservasi untuk tim tsb — tampilkan sebagai 0/kosong atau exclude dari chart? Disarankan: tampilkan dengan indikator visual berbeda (misal garis putus-putus / abu-abu) supaya tidak disalahartikan sebagai skor rendah.

## 2. Heatmap Perbandingan Tim

- **Rows**: seluruh tim
- **Columns**: 8 dimensi
- **Cell value**: Dimension Score, warna gradasi (misal merah=rendah, hijau=tinggi)
- **Filter**: batch, rentang tanggal (opsional)

## 3. Ranking Tim

- Diurutkan berdasarkan Overall Team Score (desc)
- Tampilkan juga: kekuatan utama (dimensi tertinggi) & area pengembangan (dimensi terendah) per tim
- ⚠️ Perlu diputuskan: ranking dihitung per batch terpisah, atau gabungan semua batch?

## 4. Rata-rata per Batch

- Bar chart atau tabel: rata-rata Dimension Score tiap dimensi, dibandingkan antar Batch 1 vs Batch 2

## 5. Executive Summary

- **3 kekuatan utama organisasi** = 3 dimensi dengan rata-rata skor tertinggi lintas seluruh tim
- **3 area pengembangan** = 3 dimensi dengan rata-rata skor terendah lintas seluruh tim
- ⚠️ Perlu threshold minimum data (misal minimal N observasi) supaya summary tidak bias dari sample kecil di awal program
- Format output: teks otomatis (template) atau angka + chart saja? Disarankan kombinasi keduanya untuk kebutuhan laporan ke manajemen

## 6. Non-Functional untuk Dashboard

- Update kapan: real-time setelah submit, atau refresh berkala? (lihat ARCHITECTURE.md §5)
- Export ke PDF/Excel untuk laporan program? ⚠️ Belum disebut di PRD asli, layak ditanyakan ke stakeholder karena umum dibutuhkan untuk laporan ke klien/manajemen.
