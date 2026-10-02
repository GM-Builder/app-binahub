# Tracker demo realtime — akuisisi sampai order pertama

Panduan langkah: [DEMO-END-TO-END-RUNBOOK.md](./DEMO-END-TO-END-RUNBOOK.md). Perbarui hanya berdasarkan bukti nyata. Jangan simpan password, token, nomor telepon, email lengkap, atau dokumen komersial di file ini.

## Keputusan awal

- Lingkungan: diasumsikan production dengan akun internal terkontrol untuk rehearsal; konfirmasi sebelum menulis data. Calon klien nyata hanya setelah gerbang siap.
- Durasi: beberapa hari, mengikuti keputusan klien sebenarnya.
- Target lulus: order pertama yang dibuktikan secara komersial, `pipeline = won`, akun klien dan proyek awal terbentuk.
- Repeat order: tidak wajib untuk uji ini.
- Budget iklan, tanggal tayang, owner: **belum ditetapkan**. Tidak ada iklan diaktifkan oleh persiapan ini.

## Status teknis

| Gerbang | Status | Bukti/catatan |
| --- | --- | --- |
| API health dan versi | Lulus baca-saja | HTTP 200, `0.27.7`, revision `386d1b03a8cc` pada 3 Okt 2026 |
| Homepage publik | Lulus baca-saja | HTTP 200 pada 3 Okt 2026 |
| Katalog publik | Lulus baca-saja | HTTP 200; isi dan alur mobile belum diuji manual |
| Halaman assessment website/app | Lulus baca-saja | HTTP 200; submit AI belum diuji |
| Login admin dan izin role | Belum diuji | Butuh operator berwenang |
| Journey/UTM production | Belum diuji | Periksa `phase20Ready` dan record first-touch |
| LapakVIP runtime + submit assessment | Belum diuji | Health tidak menunjukkan provider; periksa env/log tanpa membocorkan key |
| Email hasil, inquiry, dan proposal gate | Belum diuji | Gunakan inbox internal yang aktif |
| Handoff pipeline → client/project | Belum diuji | Hanya setelah bukti order nyata |
| Integrasi AMS signed/assignment | Di luar minimum; belum diuji | Smoke sebelumnya hanya membuktikan health/boundary akses |

## Checklist jalur inbound

- [ ] Budget owner menyetujui batas biaya, tanggal berhenti, akun iklan, dan materi.
- [ ] URL Instagram/TikTok dengan UTM diuji pada ponsel; redirect tidak menghapus attribution.
- [ ] Klik internal tertag muncul sebagai journey; tandai sebagai uji link, bukan traffic iklan.
- [ ] Iklan nyata diterbitkan hanya setelah seluruh gerbang kritis lulus.
- [ ] Form inquiry/assessment terkirim; ID dicatat secara terbatas.
- [ ] Journey tertaut ke lead; source/campaign sesuai dan first-touch tetap utuh.

## Checklist jalur outbound

- [ ] Source dan campaign disetujui dengan dasar pemrosesan dan owner.
- [ ] Batch internal valid, tidak duplikat/suppressed, disetujui manusia.
- [ ] Tautan UAT dibuat; penerima internal membuka link.
- [ ] Form terkirim dan journey/campaign tertaut ke lead yang sama.
- [ ] Kontak eksternal belum dihubungi sampai legal/template/suppression/human gate lulus.

## Checklist order pertama

- [ ] Sales owner dan tindakan/tenggat tercatat di pipeline.
- [ ] Konsultasi berlangsung dan kebutuhan disetujui klien.
- [ ] Proposal lolos review manusia dan benar-benar dikirim.
- [ ] Bukti acceptance/PO/kontrak/pembayaran tersedia di arsip internal (catat jenis + tanggal saja di sini).
- [ ] Pipeline dipindahkan ke `Berhasil` **setelah** bukti order.
- [ ] `Serahkan` membuat satu akun klien dan satu proyek awal; ID tercatat di tempat aman.
- [ ] Presenter merekonsiliasi source → journey → form → lead → proposal → order → account/project.

## Log harian tanpa PII

| Tanggal | Tahap | Bukti tersamarkan/ID pendek | Masalah | Owner/aksi berikutnya |
| --- | --- | --- | --- | --- |
| 2026-10-03 | Persiapan | API & halaman publik HTTP 200 | AI/admin/UTM belum diuji | Tentukan operator, inbox internal, dan budget owner |

## Langkah berikutnya

1. Operator menunjuk inbox internal untuk satu assessment rehearsal dan menentukan admin yang bisa membuka `https://app.binahub.id/admin/acquisition`.
2. Admin memastikan `LAPAKVIP_API_KEY` aktif di deployment API dan melakukan satu submit assessment internal, sambil memeriksa log provider dan email hasil.
3. Setelah itu uji UTM internal dari ponsel, lalu baru putuskan tanggal/budget iklan.
