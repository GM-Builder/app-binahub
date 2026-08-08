# T-BOS (BinaPlay) — Roles & Permissions

Status: ✅ Final — diselaraskan dengan ADR-009, RLS migration `0010`, dan `roles.ts`.

## 1. Roles

| Role | Deskripsi | Bagaimana didapat |
|---|---|---|
| Peserta | Akun umum peserta, default untuk semua user baru | Otomatis saat signup |
| Client | Perwakilan klien / manajemen | Di-assign oleh Admin |
| Fasilitator | Input observasi untuk mission yang menjadi tanggung jawabnya | Di-assign oleh Admin |
| Admin / Program Manager | Melihat seluruh dashboard, rekap, export, lock/unlock observasi, assign roles | Seed data / DB admin setup |

## 2. Alur Signup → Jadi Fasilitator

```
User signup (Supabase Auth) → role default "peserta"
        |
        v
Admin buka panel admin → assign role "facilitator" ke user tsb
        |
        v
Sesi aktif user di-invalidate (force logout via API / Supabase Admin)
        |
        v
User login lagi → sistem baca role terbaru dari profiles → auto-redirect ke /fasilitator/tbos
```

## 3. Permission Matrix

| Aksi | Peserta | Client | Fasilitator | Admin |
|---|---|---|---|---|
| Lihat form observasi mission miliknya | ❌ | ❌ | ✅ | ✅ |
| Lihat form observasi mission lain | ❌ | ❌ | ❌ | ✅ |
| Submit observasi | ❌ | ❌ | ✅ (mission miliknya saja) | ❌ |
| Edit observasi dalam revision window | ❌ | ❌ | ✅ (punya sendiri) | ✅ (override, tercatat di audit log) |
| Lock / Unlock observasi | ❌ | ❌ | ❌ | ✅ |
| Lihat dashboard admin (radar, heatmap, ranking) | ❌ | ❌ | ❌ | ✅ |
| Lihat dashboard peserta (skor tim sendiri) | ✅ | ❌ | ❌ | ❌ |
| Assign fasilitator ke mission (`tbos_facilitator_missions`) | ❌ | ❌ | ❌ | ✅ |
| Assign role fasilitator ke user | ❌ | ❌ | ❌ | ✅ |

## 4. Dashboard Peserta

Diakses via `/peserta/dashboard`. Peserta yang terdaftar di `tbos_team_members` dapat melihat:
- Ranking tim di batch
- Skor tim (overall team score)
- Jumlah mission selesai
- Rincian 8 dimensi perilaku

## 5. Enforcement

- Enforced di **level Database RLS** (migration `0010_fix_tbos_rls_and_roles.sql`).
- Mapping fasilitator ↔ mission (`tbos_facilitator_missions`) di-query langsung saat memuat daftar mission.
