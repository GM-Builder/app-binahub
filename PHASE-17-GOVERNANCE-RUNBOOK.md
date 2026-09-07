# Phase 17 Governance Runbook

Status governance dasar: **PASS — 5 September 2026**. Penyelarasan snapshot Business Rules `v1.1-default-governance`: **siap deploy — 7 September 2026**. Runtime tetap dry-run/disabled dan master switch pilot/live tetap tertutup.

## Outcome

Runner ini menerapkan keputusan single-owner interim ke production melalui API admin:

- kebijakan minimum transaksi Rp15.000.000;
- tujuh fungsi governance dimiliki `admin@binahub.id`;
- enam approval rule memakai `admin@binahub.id` sebagai primary approver;
- delegasi dan backup dikosongkan;
- empat SLA default diaktifkan;
- delapan belas template outreach `v1.0-review` disetujui;
- wording proposal dan invoice disetujui secara interim.

Runner mencatat izin policy pada Business Rules setelah seluruh konfigurasi di atas tervalidasi. Runner tidak mengubah runtime, environment dry-run, release, n8n, atau master switch pilot/live; karena itu tidak ada workflow maupun outbound yang berjalan hanya karena penyelarasan ini.

## 1. Deploy API

Deploy `binahub-api` versi `0.22.1` menggunakan environment production yang sama dengan versi sebelumnya, lalu jalankan migration `0043_reconcile_phase17_business_rules.sql`.

Migration hanya memasang fungsi penyelarasan yang fail-closed. Perubahan rule set baru terjadi setelah administrator menekan `Selaraskan keputusan` atau menjalankan runner pada langkah berikutnya.

## 2. Terapkan default governance

Jalankan PowerShell berikut dari komputer lokal. Tulis URL sebagai teks biasa tanpa format Markdown.

```powershell
Set-Location "C:\Users\USER\OneDrive\Documents\Dokumen Binahub\binahub-api"

$adminSecret = Read-Host "Masukkan password admin" -AsSecureString
$env:PHASE17_ADMIN_PASSWORD = [System.Net.NetworkCredential]::new("", $adminSecret).Password
$env:PHASE17_ADMIN_EMAIL = "admin@binahub.id"
$env:PHASE17_DECISION_ACTOR = "admin@binahub.id"
$env:PHASE17_API_URL = "https://api.binahub.id"
$env:PHASE17_CONFIRM_DEFAULT_GOVERNANCE = "true"

npm run phase17:apply-defaults
```

`NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` harus tersedia di `.env.local` repository API. Jangan mencetak password atau access token ke terminal.

## 3. Jalankan smoke gate

Gunakan environment yang masih aktif dari langkah sebelumnya:

```powershell
npm run test:phase17
```

Gate dinyatakan lulus ketika seluruh pemeriksaan berstatus `[PASS]`, termasuk:

- 7 assignment ber-owner;
- 6 approval rule aktif tanpa delegate;
- 4 SLA aktif;
- 18 template outreach approved;
- 2 wording finance/legal approved interim;
- Business Rules aktif menggunakan versi `v1.1-default-governance` tanpa blocker;
- 4 runtime tetap `dry_run` atau `disabled`;
- master switch pilot dan live tetap tertutup.

## 4. Bersihkan secret terminal

```powershell
Remove-Item Env:PHASE17_ADMIN_PASSWORD
Remove-Item Env:PHASE17_ADMIN_EMAIL
Remove-Item Env:PHASE17_DECISION_ACTOR
Remove-Item Env:PHASE17_API_URL
Remove-Item Env:PHASE17_CONFIRM_DEFAULT_GOVERNANCE
$adminSecret = $null
```

## 5. Verifikasi SQL

Jalankan `supabase/production_readiness.sql` setelah smoke gate. Nilai target governance:

| Pemeriksaan | Target |
|---|---:|
| `governance_assignment_total` | 7 |
| `governance_owner_pending` | 0 |
| `governance_backup_conflict_issues` | 0 |
| `approval_rule_total` | 6 |
| `approval_rule_active_total` | 6 |
| `approval_rule_owner_issues` | 0 |
| `risk_sla_total` | 4 |
| `risk_sla_enabled_total` | 4 |
| `risk_sla_owner_issues` | 0 |
| `finance_legal_template_total` | 2 |
| `finance_legal_template_approved_total` | 2 |
| `finance_legal_template_approval_issues` | 0 |

## Risiko interim yang diterima

Karena hanya ada satu decision actor, backup escalation belum berpindah ke orang kedua. SLA tetap mencatat pelanggaran dan notifikasi kembali kepada `admin@binahub.id`. Kondisi ini harus direvisi ketika anggota tim berikutnya tersedia; sistem sengaja tidak membuat backup atau delegasi fiktif.
