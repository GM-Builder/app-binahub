# T-BOS (BinaPlay) — Data Model

Status: ✅ Final — diselaraskan dengan Supabase migration `0005_tbos_tables.sql`, `0007_tbos_state_machine.sql`, dan `0010_fix_tbos_rls_and_roles.sql`.

## 1. Entities

### `profiles` (extend Supabase Auth `auth.users`)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK, = `auth.users.id` |
| full_name | text | Nama lengkap user |
| role | text | `peserta` (default saat signup) / `client` / `facilitator` / `admin` |
| role_updated_at | timestamp | Dipakai untuk trigger force-logout saat role berubah |

### `tbos_missions`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| code | text | unique code (`lost_detonator`, `goldsmith_precision`, `ore_extraction`, `lean_bridge`, `x_case`) |
| name | text | Nama mission |
| description | text | Deskripsi mission |

### `tbos_behavioral_dimensions` (8 total)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| code | text | unique code (`goal_alignment`, `communication`, dst) |
| name | text | Nama dimensi |
| question | text | Pertanyaan kunci observasi |
| order_index | int | Urutan |

### `tbos_mission_dimensions` (mapping many-to-many)
| Kolom | Tipe | Keterangan |
|---|---|---|
| mission_id | uuid | FK → tbos_missions |
| dimension_id | uuid | FK → tbos_behavioral_dimensions |

### `tbos_dimension_levels` (40 baris seed data)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| dimension_id | uuid | FK → tbos_behavioral_dimensions |
| level_value | int | 1-5 |
| level_label | text | Reactive/Emerging/Functional/Effective/Exemplary |
| description | text | Deskripsi perilaku spesifik per level |

### `tbos_teams`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| name | text | Nama tim (Alpha, Bravo, dst) |
| batch | text | Batch 1 / Batch 2 |

### `tbos_team_members`
| Kolom | Tipe | Keterangan |
|---|---|---|
| team_id | uuid | FK → tbos_teams |
| profile_id | uuid | FK → profiles (role `peserta`) |
| member_name | text | Nama anggota |

### `tbos_facilitator_missions`
| Kolom | Tipe | Keterangan |
|---|---|---|
| profile_id | uuid | FK → profiles (role `facilitator`) |
| mission_id | uuid | FK → tbos_missions |

### `tbos_observations`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| team_id | uuid | FK → tbos_teams |
| mission_id | uuid | FK → tbos_missions |
| profile_id | uuid | FK → profiles (role `facilitator`), pengisi observasi |
| batch | text | Denormalized untuk query cepat |
| observed_at | date | Tanggal pelaksanaan |
| submitted_at | timestamp | Waktu input (auto) |
| status | text | `draft` / `submitted` / `locked` |
| notes | text | max 50 karakter, opsional |
| locked_at | timestamp | Waktu dikunci (admin) |
| locked_by | uuid | FK → profiles (admin yang mengunci) |
| revision_deadline | timestamp | Batas waktu revisi fasilitator |

### `tbos_observation_scores`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| observation_id | uuid | FK → tbos_observations |
| dimension_id | uuid | FK → tbos_behavioral_dimensions |
| level_value | int | 1-5, nilai yang dipilih fasilitator |

### `tbos_observation_audit_log`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| observation_id | uuid | FK → tbos_observations |
| actor_id | uuid | FK → profiles |
| actor_role | text | `facilitator` / `admin` / `system` |
| action | text | `create` / `submit` / `edit` / `lock` / `unlock` / `delete` |
| previous_status | text | Status sebelum aksi |
| new_status | text | Status sesudah aksi |
| changes | jsonb | Detail perubahan |
| created_at | timestamp | Waktu aksi |

## 2. Relasi Kunci

```
tbos_teams 1---N tbos_observations N---1 tbos_missions
tbos_observations 1---N tbos_observation_scores N---1 tbos_behavioral_dimensions
tbos_missions N---N tbos_behavioral_dimensions (via tbos_mission_dimensions)
profiles(facilitator) N---N tbos_missions (via tbos_facilitator_missions)
tbos_teams N---N profiles(peserta) (via tbos_team_members)
tbos_observations 1---N tbos_observation_audit_log
```

## 3. Turunan Skor

Dihitung secara dinamis oleh `src/modules/tbos/scoring.ts`:
- **Dimension Score** per tim = rata-rata `level_value` dari seluruh `observation_scores` untuk dimensi & tim tsb.
- **T-BOS Score** per mission = rata-rata Dimension Score yang relevan dengan mission tsb.
- **Overall Team Score** = rata-rata T-BOS Score seluruh mission yang diikuti tim (ADR-005).
