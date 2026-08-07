# T-BOS (BinaPlay) — Data Model

Status: Draft — nama tabel/kolom indikatif, sesuaikan dengan konvensi Supabase schema yang dipakai.

## 1. Entities

### `profiles` (extend/reuse Supabase Auth `auth.users`)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK, = `auth.users.id` |
| role | text | `peserta` (default saat signup) / `facilitator` / `admin` / `super_admin` |
| role_updated_at | timestamp | Dipakai untuk trigger force-logout saat role berubah |
| name | text | |

> Alur: signup baru → `role = 'peserta'`. Admin ubah `role` jadi `facilitator` lewat panel admin → trigger invalidate session user tsb (Supabase Admin API) → user login ulang → middleware baca `role` terbaru → redirect ke dashboard sesuai (lihat ADR-009, ROLES-PERMISSIONS.md §2).

### `missions`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| name | text | Lost Detonator Mission, Goldsmith Precision Lab, dst |
| performance_score_source | text | ⚠️ belum jelas — lihat Open Question PRD #1 |

### `behavioral_dimensions`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| name | text | Goal Alignment, Communication, dst (8 baris, seed data) |

### `mission_dimensions` (mapping many-to-many)
| Kolom | Tipe | Keterangan |
|---|---|---|
| mission_id | uuid | FK → missions |
| dimension_id | uuid | FK → behavioral_dimensions |

### `dimension_levels` (seed data — 5 level x 8 dimensi = 40 baris)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| dimension_id | uuid | FK → behavioral_dimensions |
| level_value | int | 1-5 |
| level_label | text | Reactive/Emerging/Functional/Effective/Exemplary |
| description | text | Deskripsi perilaku spesifik per level |

### `teams`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| name | text | Alpha, Bravo, dst |
| batch | text | Batch 1 / Batch 2 |

### `team_members`
| Kolom | Tipe | Keterangan |
|---|---|---|
| team_id | uuid | FK → teams |
| profile_id | uuid | FK → profiles (role `peserta`) — ⚠️ sebelumnya diasumsikan dari "database peserta" terpisah; sekarang peserta = akun `profiles` biasa, perlu dikonfirmasi apakah ini menggantikan sumber data peserta yang lama |

### `facilitator_missions` (fasilitator hanya bertanggung jawab atas mission tertentu)
| Kolom | Tipe | Keterangan |
|---|---|---|
| profile_id | uuid | FK → profiles (role `facilitator`) |
| mission_id | uuid | FK → missions |

### `observations`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| team_id | uuid | FK → teams |
| mission_id | uuid | FK → missions |
| profile_id | uuid | FK → profiles (role `facilitator`), pengisi observasi |
| batch | text | denormalized untuk query cepat |
| observed_at | timestamp | tanggal pelaksanaan |
| submitted_at | timestamp | waktu input (auto) |
| status | text | draft / submitted / locked (lihat STATE-MACHINE.md) |
| notes | text | max 50 karakter, opsional |

### `observation_scores`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| observation_id | uuid | FK → observations |
| dimension_id | uuid | FK → behavioral_dimensions |
| level_value | int | 1-5, nilai yang dipilih fasilitator |

## 2. Relasi Kunci

```
teams 1---N observations N---1 missions
observations 1---N observation_scores N---1 behavioral_dimensions
missions N---N behavioral_dimensions (via mission_dimensions)
profiles(facilitator) N---N missions (via facilitator_missions)
teams N---N profiles(peserta) (via team_members)
```

## 3. Turunan Skor (dihitung, bukan disimpan mentah — atau disimpan sebagai cache)

- **Dimension Score** per tim = rata-rata `level_value` dari seluruh `observation_scores` untuk dimensi & tim itu.
- **T-BOS Score** per mission = rata-rata seluruh dimension score yang relevan dengan mission tsb.
- **Final Mission Score** = (Mission Performance Score × 60%) + (T-BOS Score × 40%).
- **Overall Team Score** = akumulasi Final Mission Score seluruh mission yang diikuti tim.

⚠️ Perlu diputuskan: skor turunan ini dihitung on-the-fly (query) atau di-cache di tabel terpisah (misal `team_mission_scores`) untuk performa dashboard.

## 4. Open Questions Terkait Data

- ✅ Terjawab: sumber "peserta" sekarang adalah akun `profiles` dengan role `peserta` (bukan tabel database peserta terpisah seperti asumsi awal) — tapi perlu dikonfirmasi apakah ini menggantikan atau melengkapi data peserta yang mungkin sudah ada di tempat lain.
- Apakah `observations` perlu unique constraint (team_id + mission_id + profile_id) atau memang boleh multiple observations per kombinasi (lihat STATE-MACHINE.md untuk kasus multi-fasilitator)?
- Bagaimana peserta ditambahkan ke `teams` — self-join, atau di-assign oleh admin/fasilitator?
