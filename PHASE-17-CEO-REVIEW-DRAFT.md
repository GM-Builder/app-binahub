# Fase 17 — Draft Review CEO

> **Perubahan tata kelola 5 September 2026:** rekomendasi default dalam dokumen ini telah diterima oleh `admin@binahub.id` sebagai decision actor interim end-to-end. CEO kini menjadi post-implementation reviewer dan dapat meminta revisi setelah implementasi. Rekaman keputusan aktif tersedia di `PHASE-17-INTERIM-GOVERNANCE-DECISION.md`.

Tanggal disiapkan: 5 September 2026  
Status: **bahan post-implementation review CEO; keputusan interim aktif dicatat terpisah dan bukan izin go-live**

## Tujuan

Dokumen ini mengubah keputusan governance yang sebelumnya panjang menjadi lembar review praktis. CEO tidak diminta menyusun kebijakan dari nol. Pada setiap bagian sudah tersedia rekomendasi awal dan CEO cukup memilih:

- **SETUJUI** — rekomendasi dapat dipakai;
- **REVISI** — arah diterima, tetapi ada bagian yang harus diperbaiki;
- **TUNDA** — belum cukup informasi untuk memutuskan.

Persetujuan dokumen ini tidak mengaktifkan workflow, email, proposal, atau pilot. Engineering tetap menjaga seluruh automation dalam dry-run sampai release, rehearsal, monitoring, kill switch, dan go/no-go selesai.

## Ringkasan rekomendasi

| Area | Rekomendasi awal | Keputusan CEO |
| --- | --- | --- |
| Katalog | Admin boleh membuat dan mengelola produk; publikasi pertama dan perubahan material memerlukan approval bisnis | SETUJUI / REVISI / TUNDA |
| Transaksi | Minimum Rp15.000.000; transaksi di bawahnya masuk approval; proposal berlaku 14 hari; admin tidak dapat override | SETUJUI / REVISI / TUNDA |
| Owner | `admin@binahub.id` tetap technical owner, monitoring owner, dan template steward; owner bisnis ditunjuk per fungsi | SETUJUI / REVISI / TUNDA |
| Approval | Selama pilot, CEO menjadi approver pengecualian; delegasi tetap nonaktif | SETUJUI / REVISI / TUNDA |
| SLA risiko | Gunakan empat tingkat SLA yang sudah disiapkan, tetapi aktifkan hanya setelah owner dan backup berbeda ditetapkan | SETUJUI / REVISI / TUNDA |
| 18 email | Review per journey; rekomendasi engineering adalah setujui substansi v1.0 setelah koreksi brand dari CEO | SETUJUI / REVISI / TUNDA |
| Finance/legal | Gunakan draf bersyarat; status entitas dan penerapan pajak wajib divalidasi Finance/Legal atau konsultan pajak | SETUJUI ARAH / REVISI / TUNDA |
| Pilot | Mulai dari satu workflow internal tanpa outbound, ceiling 1 item, satu change window, dan rekonsiliasi sebelum perluasan | SETUJUI / REVISI / TUNDA |

## 1. Kebijakan katalog

### Rekomendasi

1. Admin dapat membuat, mengedit, mengarsipkan, dan mengatur urutan produk atau modul.
2. Produk baru selalu mulai sebagai draft dan tidak tampil ke publik.
3. Produk hanya tampil ke publik jika statusnya ready, aktif, dan public visible.
4. Publikasi pertama, perubahan harga, scope, deliverable, klaim, atau readiness merupakan perubahan material dan memerlukan approval bisnis.
5. Pengarsipan dapat dilakukan admin jika produk tidak lagi dijual; data historis tetap dipertahankan.
6. Modul mock atau belum ready tidak boleh masuk proposal.

### Alasan

Aturan ini membuat katalog tetap fleksibel tanpa membiarkan data yang belum siap menjadi janji kepada pelanggan.

### Keputusan CEO

- [ ] SETUJUI rekomendasi
- [ ] REVISI — catatan: ________________________________________________
- [ ] TUNDA — informasi yang dibutuhkan: ________________________________

Approver publikasi katalog, nama/email: _________________________________

## 2. Kebijakan transaksi minimum

### Rekomendasi konfigurasi awal

| Pengaturan | Nilai rekomendasi |
| --- | --- |
| Minimum transaksi | Aktif |
| Nominal | Rp15.000.000 |
| Jika di bawah minimum | Wajib approval manusia |
| Masa berlaku proposal | 14 hari |
| Admin dapat override | Tidak |
| Catatan pada pengecualian | Wajib |

### Alasan

Konfigurasi ini tidak otomatis menolak peluang kecil. Sistem hanya menghentikan proses dan meminta keputusan manusia agar margin, kapasitas, dan nilai strategis dapat dipertimbangkan.

### Keputusan CEO

- [ ] SETUJUI rekomendasi
- [ ] REVISI nominal/aturan menjadi: ____________________________________
- [ ] TUNDA

## 3. Owner dan backup

### Yang sudah ditetapkan

| Fungsi | Owner | Status |
| --- | --- | --- |
| Technical & Monitoring | `admin@binahub.id` | Ditetapkan |
| Template & Content stewardship | `admin@binahub.id` | Ditetapkan |

`admin@binahub.id` menjaga sistem, versi, dan implementasi. Akun tersebut tidak menggantikan keputusan bisnis CEO.

### Yang perlu dinominasikan CEO

| Fungsi | Owner utama | Backup berbeda | Kanal eskalasi |
| --- | --- | --- | --- |
| Sales Operations | __________ | __________ | __________ |
| Proposal & Commercial | __________ | __________ | __________ |
| Delivery | __________ | __________ | __________ |
| Deliverability & Email | __________ | __________ | __________ |
| Product Catalog | __________ | __________ | __________ |

Owner dan backup tidak boleh memakai akun yang sama. Jika tim belum memiliki kandidat backup, fungsi tetap boleh disiapkan tetapi assignment/automation yang bergantung padanya tidak diaktifkan.

### Keputusan CEO

- [ ] SETUJUI struktur owner di atas dan lengkapi nama
- [ ] REVISI struktur: _________________________________________________
- [ ] TUNDA fungsi berikut: ____________________________________________

## 4. Approver dan delegasi

### Rekomendasi pilot awal

| Kondisi | Approver awal | Delegasi |
| --- | --- | --- |
| Proposal standar | CEO selama tiga transaksi/pilot pertama | Nonaktif |
| Diskon di luar batas | CEO | Nonaktif |
| Transaksi di bawah minimum | CEO | Nonaktif |
| Scope kustom | CEO | Nonaktif |
| Risiko legal/reputasi/etik/conflict | CEO | Nonaktif |
| Deal strategis atau bernilai tinggi | CEO | Nonaktif |

Setelah tiga kasus berjalan baik dan audit lengkap, proposal standar dapat didelegasikan kepada peran komersial dengan batas nilai dan masa berlaku yang jelas. Pengecualian strategis tetap pada CEO.

### Keputusan CEO

- [ ] SETUJUI untuk masa pilot awal
- [ ] REVISI approver/batas: ___________________________________________
- [ ] TUNDA

Nama/email CEO atau decision actor: ____________________________________

## 5. SLA risiko

### Rekomendasi

SLA memakai jam kerja Asia/Jakarta dan baru diaktifkan setelah owner serta backup berbeda tersedia.

| Severity | Acknowledgment | Review awal | Eskalasi backup | Keputusan akhir |
| --- | ---: | ---: | ---: | ---: |
| Critical | 15 menit | 60 menit | 120 menit | 240 menit |
| High | 60 menit | 240 menit | 480 menit | 960 menit |
| Medium | 240 menit | 480 menit | 960 menit | 1.440 menit |
| Low | 480 menit | 960 menit | 1.440 menit | 2.400 menit |

Angka tersebut adalah batas respons internal, bukan janji penyelesaian mutlak. Jika kapasitas tim tidak mendukung, CEO sebaiknya merevisi sebelum SLA diaktifkan.

### Keputusan CEO

- [ ] SETUJUI nilai SLA dan aktifkan setelah owner/backup lengkap
- [ ] REVISI nilai: ____________________________________________________
- [ ] TUNDA

Owner SLA: ____________________  Backup SLA: ____________________

## 6. Review 18 template follow-up

Teks lengkap tersedia pada [Lampiran Draft 18 Template](./PHASE-17-EMAIL-TEMPLATE-REVIEW.md).

### Rekomendasi

- Review dilakukan per journey, bukan per email secara acak.
- Level 1 membantu; level 2 memberi konteks; level 3 menutup antrean secara sopan.
- Seluruh CTA tetap menuju jadwal konsultasi resmi.
- Tidak ada instruksi untuk membalas alamat no-reply.
- Klaim hasil tetap moderat dan tidak menjanjikan outcome tertentu.
- Unsubscribe tetap ditambahkan oleh sistem pengiriman.

### Keputusan per kelompok

| Kelompok | Rekomendasi | Keputusan CEO | Catatan revisi |
| --- | --- | --- | --- |
| Inquiry — ID & EN, level 1–3 | Setujui substansi | SETUJUI / REVISI / TUNDA | __________ |
| Assessment result — ID & EN, level 1–3 | Setujui substansi | SETUJUI / REVISI / TUNDA | __________ |
| Assessment proposal — ID & EN, level 1–3 | Setujui substansi | SETUJUI / REVISI / TUNDA | __________ |

Approval tidak membuat email langsung terkirim. Template hanya berubah menjadi approved setelah revisi final dicatat dan tetap menunggu release/pilot.

## 7. Wording finance/legal

### Draf proposal untuk review

> BinaHub saat ini belum dikukuhkan sebagai Pengusaha Kena Pajak (PKP), sehingga harga tidak mencantumkan pungutan PPN oleh BinaHub. Apabila pembayaran atas transaksi ini termasuk objek pemotongan PPh Pasal 23 dan pihak pelanggan berkewajiban melakukan pemotongan, pemotongan dilakukan sesuai ketentuan yang berlaku dan pelanggan wajib menyerahkan bukti potong yang sah kepada BinaHub.

### Draf invoice untuk review

> BinaHub saat ini belum dikukuhkan sebagai Pengusaha Kena Pajak (PKP), sehingga tagihan tidak mencantumkan pungutan PPN oleh BinaHub. Jika transaksi memenuhi ketentuan pemotongan PPh Pasal 23, mohon kirimkan bukti potong yang sah melalui kanal resmi BinaHub.

### Catatan wajib

Ini adalah draf komunikasi, bukan nasihat pajak. DJP menjelaskan bahwa kewajiban pemungutan PPN dan Faktur Pajak berkaitan dengan status PKP, sedangkan pemotongan PPh Pasal 23 untuk jasa bergantung pada jenis jasa dan pihak yang wajib memotong. Finance/Legal atau konsultan pajak perlu memverifikasi status entitas, klasifikasi jasa, perlakuan PPh 23, serta kanal bukti potong sebelum status template menjadi approved.

Rujukan resmi:

- https://www.pajak.go.id/id/peraturan/faktur-pajak
- https://www.pajak.go.id/index.php/id/pemotongan-pajak-penghasilan-pasal-23
- https://www.pajak.go.id/id/pph-pasal-2326

### Keputusan CEO

- [ ] SETUJUI arah wording dan tugaskan review Finance/Legal
- [ ] REVISI arah wording: _____________________________________________
- [ ] TUNDA

Finance/Legal reviewer, nama/email: ____________________________________

Kanal bukti potong yang akan dicantumkan: ______________________________

## 8. Rekomendasi controlled pilot

### Scope awal

| Item | Rekomendasi |
| --- | --- |
| Cohort | Data internal/UAT yang disetujui, tanpa pelanggan eksternal |
| Workflow pertama | `client_operations_daily` karena hanya membentuk tugas internal dan tidak mengirim outbound |
| Ceiling | Maksimum 1 item pada run pertama |
| Mode | Pilot; live tetap tertutup |
| Change window | 60 menit dengan seluruh owner siap |
| Success | Satu run sukses, tepat satu perubahan yang diharapkan, tidak ada duplikasi, audit lengkap |
| Rollback | Kill switch jika muncul error 5xx, duplikasi, perubahan di luar scope, atau audit tidak lengkap |
| Ekspansi | Hanya setelah rekonsiliasi manual dan persetujuan manusia |

### Keputusan CEO

- [ ] SETUJUI scope pilot awal
- [ ] REVISI workflow/cohort/ceiling: ___________________________________
- [ ] TUNDA

Business owner pilot: ____________________

Tanggal dan jam change window: ____________________ WIB

## Keputusan keseluruhan

- [ ] **APPROVED** — semua keputusan dapat dipindahkan ke control plane
- [ ] **APPROVED WITH REVISIONS** — engineering menyelesaikan catatan berikut sebelum release
- [ ] **PENDING** — dry-run dan seluruh lock dipertahankan

Catatan/revisi keseluruhan:

________________________________________________________________________

________________________________________________________________________

Nama decision actor: ____________________

Tanggal review: ____________________

## Setelah CEO mengembalikan dokumen

1. Engineering memasukkan hanya keputusan yang berstatus disetujui.
2. Revisi template menghasilkan versi baru; versi review lama tidak ditimpa.
3. Wording finance/legal baru menjadi approved setelah reviewer yang berwenang dicatat.
4. Release non-mock dibuat dengan business owner, cohort, success criteria, rollback trigger, dan change window.
5. Rehearsal tetap dilakukan dalam dry-run.
6. Kill switch diuji sebelum pilot.
7. Pilot pertama hanya menjalankan satu workflow dengan ceiling minimum.
