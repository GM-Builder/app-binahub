# Fase 16 — Production Finishing & Human Acceptance

Fase 16 menutup seluruh pekerjaan yang sengaja tidak menghalangi pembangunan safety layer Fase 15.

## Status implementasi routing dan UI — 2026-09-02

Selesai pada aplikasi:

- Menetapkan satu beranda administrator di `/admin/dashboard`; `/admin` sekarang hanya redirect kompatibilitas.
- Memecah workspace tab lama menjadi URL kanonis untuk dashboard, acquisition, pipeline, assessment, meeting, kontak, inquiry, klien, operasional, dan otomasi.
- Menyatukan seluruh halaman administrator ke `AdminShell` dan satu sumber konfigurasi navigasi.
- Mengganti sidebar desktop dengan kelompok accordion yang dapat dicari dan digulir.
- Mengganti navigasi mobile menjadi drawer aksesibel dengan focus trap, Escape, body scroll lock, dan focus return.
- Menambahkan breadcrumb, state loading, error, dan not-found yang konsisten.
- Merombak editor Pre-test/Post-test menjadi builder terstruktur dengan preview peserta, pengurutan, duplikasi, validasi, analitik, dan ekspor respons.
- Pada perombakan awal, Launch Control, UAT/Pilot Gate, Pilot Operations, Operational Assurance, dan Pilot Certification dilepas dari kontrak navigasi produk. Keputusan ini dikoreksi pada `v0.21.1`: seluruhnya kembali tersedia bagi administrator melalui halaman kanonis `/admin/governance` karena release, runtime control, dan kill switch merupakan kebutuhan operasional production.
- Menjadikan `/home` resolver role tanpa menampilkan hub tambahan; admin, klien, fasilitator, dan peserta langsung menuju beranda role.
- Mengarahkan rute klien dan fasilitator lama ke URL kanonis serta menyatukan shell T-BOS tanpa mengubah desain internal modulnya.
- Menguji desktop dan mobile tanpa horizontal overflow serta menguji keyboard, focus indicator, drawer, Escape, dan focus return.

Deployment `app-binahub v0.18.2` dikonfirmasi selesai oleh operator pada 3 September 2026. Pekerjaan berlanjut ke Fase 16B — Production Acceptance menggunakan `PHASE-16-PRODUCTION-ACCEPTANCE-RUNBOOK.md`.

Gate A lulus dan Gate B lulus dengan temuan pada 4 September 2026. Remediasi temuan disiapkan pada `app-binahub v0.18.3` dan `binahub-api v0.18.1`: panduan kontekstual, status program terjadwal, pintasan status, percepatan navigasi, distribusi assessment mobile, dan header admin fixed. Deployment serta verifikasi ulang masih diperlukan sebelum Gate C.

Gate C dikonfirmasi lulus oleh operator pada 4 September 2026, termasuk validasi owner dan backup tidak boleh sama. Mismatch kontrak modul Gate D sudah lulus setelah `binahub-api v0.18.2`. Temuan pengalaman peserta dan assessment dari 5 September ditangani pada `app-binahub v0.19.0`, `binahub-api v0.19.0`, dan migration `0040_program_assessment_finishing.sql`; Gate D langkah akses/QR dan Gate E perlu diverifikasi ulang setelah deployment.

Peta rute dan aturan pengembangan selanjutnya dicatat di `ADMIN-INFORMATION-ARCHITECTURE.md`.

## Acceptance fitur Fase 14

- CRUD katalog: draft tidak publik, item ready/public tampil tepat satu kali, archive menghilangkan item dari publik.
- Validasi owner dan backup tidak boleh akun yang sama.
- Delegasi dan SLA nonaktif tidak memengaruhi workflow.
- Questionnaire tanpa soal tidak dapat dipublikasikan.
- Pre-test/Post-test dapat diisi oleh peserta program yang sah dan statistik admin akurat.
- Questionnaire yang sudah memiliki respons tidak dapat diganti massal atau dihapus.
- QR program dapat dipindai, mengarah ke program yang benar, dan hasil unduhan memiliki nama/kode program.
- Panel bantuan ikon `i` tidak menutupi konten pada desktop maupun mobile.

## UI/UX production finishing

- [x] Audit dan satukan shell seluruh halaman dashboard admin, termasuk T-BOS, pada desktop dan mobile.
- [x] Pastikan navigasi operasional tidak menampilkan instruksi developer, status fase, atau prosedur pengujian internal.
- [x] Tutup masalah hierarchy global, overflow, focus, keyboard navigation, loading, error, not-found, dan responsive shell.
- [x] Kurasi editor Pre-test/Post-test dan gunakan renderer yang sama untuk preview admin serta halaman peserta.
- [x] Deploy migration `0040`, API `v0.19.0`, dan app `v0.19.0`; production readiness serta smoke test dinyatakan lulus pada 5 September 2026.
- [x] Verifikasi dua format unduhan kode peserta, QR autofill, batch-save soal, completion satu-kali, nama/benar-salah respons, ekspor CSV/PDF, BinaInsight program terpisah, serta regresi LEP/T-BOS.
- [ ] Jalankan acceptance isi, empty state, confirmation, dan destructive action dengan data production pada setiap modul bisnis.
- Selesaikan penyempurnaan visual assessment publik, laporan PDF, katalog publik, dan halaman program berdasarkan hasil penggunaan nyata.

Catatan: redesign visual internal T-BOS tetap berada di luar cakupan; yang disatukan adalah routing, sidebar, header, dan perilaku responsif global.

## Keputusan governance setelah Fase 17

Pada 5 September 2026, `admin@binahub.id` ditetapkan sebagai decision actor interim end-to-end dan CEO menjadi post-implementation reviewer. Default transaksi, seluruh owner, seluruh approver, empat SLA, 18 template follow-up, serta dua wording proposal/invoice telah diterapkan dan lulus smoke production. Backup dan delegasi sengaja tetap kosong agar tidak membuat identitas fiktif.

Yang masih harus ditentukan untuk eksekusi pilot adalah cohort konkret dan tanggal/jam change window. Business owner, technical owner, serta monitoring owner pilot menggunakan `admin@binahub.id`; success criteria, rollback trigger, dan ceiling awal mengikuti rekomendasi controlled pilot.

## Pilot finishing

- Buat release non-mock untuk cohort internal/UAT dengan `admin@binahub.id` sebagai business, technical, dan monitoring owner.
- Jalankan rehearsal production dry-run delapan langkah dengan evidence.
- Ikat snapshot monitoring real dan selesaikan incident blocker.
- Catat acceptance manusia dan keputusan go/no-go.
- Uji kill switch sebelum membuka master pilot switch.
- Aktivasi pertama hanya untuk satu workflow berisiko terendah dengan ceiling minimum, lalu rekonsiliasi satu run sebelum ekspansi.

Fase 16 selesai hanya setelah acceptance fitur, acceptance manusia, dan controlled pilot evidence lulus. Pekerjaan yang menunggu CEO tetap dicatat sebagai pending dan tidak akan disetujui atas nama CEO.
