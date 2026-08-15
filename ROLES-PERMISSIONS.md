# T-BOS (BinaPlay) — Roles & Permissions

Status: Final — diselaraskan dengan revisi CEO dan implementasi API per 15 Agustus 2026.

## 1. Roles

| Role | Tanggung jawab | Pemberian role |
|---|---|---|
| Peserta | Mengikuti program, melihat hasil tim sendiri, dan mengisi LEP | Default saat signup; harus terdaftar pada program |
| Client | Melihat data organisasi/program yang menjadi cakupannya | Admin |
| Fasilitator | Mengobservasi semua tim yang datang ke mission/pos miliknya | Admin |
| Admin / Program Manager | Mengelola program, modul, user, assignment, data, dashboard, dan laporan | Setup admin |

Perubahan role dilakukan lewat API admin. Sesi user yang rolenya berubah di-invalidasi agar token lama tidak mempertahankan hak akses sebelumnya. Admin tidak boleh menurunkan role atau menghapus akunnya sendiri lewat endpoint manajemen user.

## 2. Permission Matrix

| Aksi | Peserta | Client | Fasilitator | Admin |
|---|---:|---:|---:|---:|
| Lihat form observasi mission miliknya | ❌ | ❌ | ✅ | ✅ |
| Lihat/input observasi mission lain | ❌ | ❌ | ❌ | ✅ untuk melihat; submit operasional dilakukan fasilitator |
| Pilih semua tim dalam program/batch pada pos miliknya | ❌ | ❌ | ✅ | ✅ |
| Buat tim + roster saat tim pertama kali muncul | ❌ | ❌ | ✅ | ✅ |
| Edit observasi sendiri dalam revision window | ❌ | ❌ | ✅ | ✅ override, tercatat di audit log |
| Lock / unlock observasi | ❌ | ❌ | ❌ | ✅ |
| Lihat dashboard (radar, heatmap, ranking) | Tim sendiri | Scope organisasi | ✅ hanya mission miliknya | ✅ seluruh program |
| Kelola program, modul, batch, speaker LEP, dan assignment | ❌ | ❌ | ❌ | ✅ |
| Isi LEP | ✅ satu respons per program yang diikuti | ❌ | ❌ | ❌ |
| Lihat hasil dan export LEP | ❌ | Sesuai endpoint laporan organisasi | ❌ | ✅ |
| Ubah role/user | ❌ | ❌ | ❌ | ✅ |

## 3. Assignment Fasilitator

Assignment aktif memakai `facilitator_missions(profile_id, mission_id, program_id)`. Satu mission adalah satu pos fisik; fasilitator memilih tim yang datang bergiliran ke pos tersebut. Perubahan assignment mengganti daftar mission untuk kombinasi fasilitator+program secara atomik melalui RPC `replace_facilitator_missions`.

`tbos_facilitator_teams` tetap dipertahankan hanya sebagai histori lama. Alur baru tidak membaca atau menulis tabel tersebut.

## 4. Enforcement

- Browser memakai Supabase Auth untuk sesi dan hanya boleh membaca baris `profiles` miliknya sendiri.
- Data aplikasi diakses lewat `binahub-api`; tabel `public` lain menolak akses langsung role `anon` dan `authenticated`.
- API memverifikasi JWT, role, membership program, module enablement, dan scope mission pada setiap endpoint sensitif.
- RPC transaksi hanya dapat dieksekusi oleh `service_role`; API tidak pernah mengirim service-role key ke browser.
- Dashboard fasilitator memfilter agregasi berdasarkan mission yang ditugaskan pada program yang dipilih, bukan berdasarkan siapa yang membuat observasi.
