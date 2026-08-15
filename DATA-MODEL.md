# T-BOS dan LEP — Data Model

Status: Final — ringkasan schema runtime setelah hardening revisi CEO.

## 1. Fondasi Program dan Akses

| Entitas | Kolom/relasi penting | Fungsi |
|---|---|---|
| `profiles` | `id = auth.users.id`, `full_name`, `role`, `organization_id` | Identitas dan role aplikasi |
| `engagements` | `organization_id`, `code`, `title`, `status`, tanggal | Container program |
| `participants` | `profile_id`, `organization_id`, identitas peserta | Master peserta |
| `engagement_participants` | `engagement_id`, `participant_id` | Membership peserta ke program |
| `program_modules` | `program_id`, `module_key`, `enabled` | Mengaktifkan `tbos`/`lep` per program |

Semua `program_id` pada modul secara teknis mereferensikan `engagements(id)`.

## 2. T-BOS

| Entitas | Kolom/relasi penting |
|---|---|
| `tbos_missions` | `id`, `code`, `name`, `description` |
| `tbos_behavioral_dimensions` | `id`, `code`, `name`, `question`, `order_index` |
| `tbos_mission_dimensions` | mapping `mission_id` ↔ `dimension_id` |
| `tbos_dimension_levels` | `dimension_id`, `level_value` 1–5, label, deskripsi |
| `batches` | `program_id`, `name`, `sort_order`; nama unik case-insensitive per program |
| `tbos_teams` | `engagement_id`, `batch_id`, snapshot `batch`, `name`, `organization_id` |
| `tbos_team_members` | `id`, `team_id`, `profile_id` opsional, `member_name`, `is_captain` |
| `facilitator_missions` | PK `(profile_id, mission_id, program_id)`; assignment aktif |
| `tbos_facilitator_teams` | histori assignment lama; tidak dipakai flow baru |
| `tbos_observations` | tim, program, mission, fasilitator, batch, status, deadline, `client_submission_id` |
| `tbos_observation_scores` | observasi, dimensi, level 1–5 |
| `tbos_observation_members` | snapshot nama, kehadiran, dan kapten per observasi |
| `tbos_observation_audit_log` | actor, role, action, status lama/baru, perubahan, waktu |

Relasi utama:

```text
engagements 1--N batches 1--N tbos_teams 1--N tbos_observations
tbos_missions N--N tbos_behavioral_dimensions
facilitator_missions N--1 engagements / missions / profiles
tbos_observations 1--N scores / observation_members / audit_log
```

`program_id`, batch, roster, kapten, dan fasilitator pada observasi merupakan snapshot pelaporan. Perubahan master roster atau nama batch sesudah submit tidak mengubah rekam observasi yang sudah ada.

## 3. LEP

| Entitas | Kolom/relasi penting |
|---|---|
| `lep_speakers` | `program_id`, `name`, `sort_order`, `deleted_at` |
| `lep_responses` | `program_id`, `profile_id`, empat skor 1–4, tiga jawaban teks, waktu submit |
| `lep_speaker_ratings` | `(response_id, speaker_id)`, skor 1–4, komentar |

Constraint `(program_id, profile_id)` menjamin satu respons per peserta per program. Speaker menggunakan soft delete; foreign key rating memakai `ON DELETE RESTRICT` untuk menjaga histori.

## 4. Konsistensi Transaksi

- `create_program_batch`: urutan dan nama batch race-safe.
- `replace_facilitator_missions`: penggantian assignment atomik.
- `tbos_submit_observation_v2`: tim baru, roster, observasi, skor, snapshot, dan audit log atomik serta idempotent.
- `tbos_mutate_observation`: edit/lock/unlock beserta audit log atomik.
- `submit_lep_response`: respons dan seluruh rating speaker atomik.
- `consume_api_rate_limit`: counter rate limit endpoint publik yang persisten lintas instance serverless.

## 5. Skor Turunan

- Dimension Score = rata-rata nilai dimensi dari observasi `submitted`/`locked` yang sesuai.
- Mission Score = rata-rata dimensi yang dipetakan pada mission tersebut.
- Overall Team Score = rata-rata Mission Score; agregasi tidak mencampur data lintas program.
