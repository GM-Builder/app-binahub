# T-BOS (BinaPlay) — Roles & Permissions

Status: Draft — detail teknis dari PRD Bagian 3, diupdate dengan alur signup/role-assignment (ADR-009).

## 1. Roles

| Role | Deskripsi | Bagaimana didapat |
|---|---|---|
| Peserta | Akun umum, default untuk semua yang signup | Otomatis saat signup |
| Fasilitator | Input observasi untuk mission yang menjadi tanggung jawabnya | Di-assign oleh Admin (bukan self-service) |
| Admin / Program Manager | Melihat seluruh dashboard & rekap lintas tim/batch, assign role fasilitator | ⚠️ Belum dijelaskan bagaimana admin pertama dibuat — biasanya lewat seed data/manual di database, perlu dikonfirmasi |

## 2. Alur Signup → Jadi Fasilitator

```
User signup (Supabase Auth) → role default "peserta"
        |
        v
Admin buka panel admin → assign role "fasilitator" ke user tsb
        |
        v
Sesi aktif user di-invalidate (force logout)
        |
        v
User login lagi → sistem baca role terbaru → auto-redirect ke dashboard fasilitator
```

## 3. Permission Matrix

| Aksi | Peserta | Fasilitator | Admin | Super Admin |
|---|---|---|---|---|
| Lihat form observasi mission miliknya | - | ✅ | ✅ | ✅ |
| Lihat form observasi mission lain | - | ❌ | ✅ (read-only) | ✅ |
| Submit observasi | - | ✅ (mission miliknya saja) | ❌ | ❌ |
| Edit observasi dalam window revisi | - | ✅ (punya sendiri) | ✅ (override, tercatat di audit log) | ✅ |
| Lock observasi | - | ❌ (otomatis/admin) | ✅ | ✅ |
| Lihat dashboard (radar, heatmap, ranking) | ❌ | ❌ (⚠️ konfirmasi — mungkin fasilitator ingin lihat tim yang dia observasi saja) | ✅ | ✅ |
| Kelola master data mission/dimensi/mapping | ❌ | ❌ (⚠️ atau ✅, perlu dikonfirmasi) | ❌ (⚠️ atau ✅, perlu dikonfirmasi) | ✅ |
| Assign fasilitator ke mission | ❌ | ❌ | ✅ | ✅ |
| Assign role fasilitator ke user | ❌ | ❌ | ✅ | ✅ |

## 4. Dashboard Peserta

⚠️ **Belum ada spesifikasi.** PRD T-BOS awal tidak menyebutkan apa yang dilihat peserta di dashboard mereka (skor tim sendiri? riwayat mission yang diikuti?). Karena role `peserta` sekarang jadi bagian resmi dari alur login, halaman dashboard peserta perlu didefinisikan — minimal placeholder "belum ada fitur" kalau memang belum prioritas di MVP.

## 5. Enforcement

- Pembatasan **wajib di level API/server**, bukan hanya UI — supaya fasilitator tidak bisa submit observasi untuk mission lain lewat manipulasi request.
- Mapping fasilitator ↔ mission (`facilitator_missions` di DATA-MODEL.md) jadi sumber kebenaran untuk validasi ini.

## 6. Open Question

- Apakah fasilitator perlu lihat progress/skor tim yang **sudah** dia observasi (read-only, sebagai feedback), atau benar-benar tidak ada akses dashboard sama sekali? PRD asli belum eksplisit soal ini.
- Bagaimana admin pertama (yang bisa assign role fasilitator) dibuat? Manual seed di database, atau ada mekanisme lain?
