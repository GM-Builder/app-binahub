# Changelog

Semua perubahan yang signifikan pada proyek ini akan didokumentasikan di file ini.
Format yang digunakan berdasarkan [Keep a Changelog](https://keepachangelog.com/id/1.0.0/), dan proyek ini mematuhi aturan [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.21.1] - 2026-09-06

### Added — Admin Governance Control Plane

- Mengembalikan Launch Readiness, Human UAT, Operational Assurance, Pilot Certification, serta Pilot Operations ke satu halaman administrator bernama `Kesiapan & Pilot`.
- Menambahkan navigasi bertahap yang hanya memuat panel aktif, panduan kontekstual, route kanonis `/admin/governance`, dan akses melalui kelompok Tata Kelola pada desktop maupun mobile.
- Mempertahankan seluruh activation guard backend; menampilkan control plane tidak membuka environment, menjalankan n8n, atau mengaktifkan workflow.

### Changed — Apollo Manual Baseline

- Menjadikan impor Apollo Free CSV/JSON sebagai aksi utama pada panel Lead Discovery.
- Menambahkan preset source dan campaign Apollo agar admin tidak perlu mengisi konfigurasi dasar dari nol.
- Menandai Apollo API sebagai siap saat upgrade Pro dan Hunter sebagai provider alternatif yang ditunda.

## [0.21.0] - 2026-09-06

### Changed — Multi-provider Lead Discovery

- Memperjelas tiga jalur perolehan prospek pada Kontrol Akuisisi: Hunter Free, Apollo API setelah upgrade, dan Batch Prospek manual.
- Menampilkan provider aktif, batas pengayaan Hunter, status tinjauan perusahaan, serta pintasan langsung ke impor manual.
- Menambahkan Hunter sebagai pilihan sumber data tanpa mengubah human approval, deduplikasi, suppression, atau outbound gate.
- Menambahkan impor file CSV/JSON dan template CSV pada Batch Prospek agar jalur manual tidak lagi mengharuskan admin menyusun JSON sendiri.

## [0.20.0] - 2026-09-06

### Added — Phase 18 AI Lead Discovery Workspace

- Menambahkan panel AI Lead Discovery pada Kontrol Akuisisi dengan status kesiapan, sumber, mode, batas pencarian, histori run, dan kandidat terbaru.
- Menambahkan aksi pratinjau eksplisit dengan feedback proses dan blocker yang mudah dipahami.
- Menjelaskan bahwa kandidat tetap melalui batch human review dan tidak dihubungi atau dipromosikan otomatis.

## [0.19.0] - 2026-09-05

### Added — Gate D/E Participant and Assessment Finishing

- Menambahkan unduhan kode peserta dalam format TXT dan PNG bermerek yang memuat perusahaan, program, dan kode peserta.
- Menanamkan kode program pada tautan/QR agar kolom akses terisi otomatis setelah dipindai.
- Menambahkan BinaInsight khusus program pada editor form yang sama dengan Pre-test/Post-test.
- Menambahkan nama responden, status benar/salah, ekspor PDF, dan rincian jawaban individual di dashboard respons.
- Menjadikan bar Q1–Q49 pada dashboard Assessment dapat diklik untuk membuka isi pertanyaan.

### Changed

- Editor soal kini menampung banyak perubahan secara lokal dan menyimpannya dalam satu request transaksional.
- Form satu-kali berubah menjadi halaman konfirmasi setelah respons tersimpan dan tidak menampilkan soal kembali.
- Portal peserta memakai cache sesi singkat dan revalidasi latar belakang untuk menghilangkan full-screen loading berulang.
- Layout assessment publik mobile diperbaiki agar navigator, pertanyaan, pilihan, dan tombol aksi tidak terpotong.

## [0.18.3] - 2026-09-04

### Changed — Acceptance UX and Admin Responsiveness

- Menambahkan panel `Cara kerja` kontekstual pada seluruh halaman admin yang menjelaskan tujuan halaman, arti kontrol, dan urutan kerja tanpa menampilkan prosedur developer/UAT.
- Memindahkan seluruh perubahan status manual ke pintasan pada kartu Program dengan pilihan transisi yang aman dan dialog konfirmasi; editor Kelola tidak lagi menggandakan kontrol status.
- Menjelaskan bahwa status program mengikuti tanggal dan menampilkan pintasan manual hanya untuk pengecualian operasional.
- Mendesain ulang distribusi jawaban Assessment mobile menjadi rentang tujuh soal dengan label, persentase jawaban 4–5, jumlah respons, dan bar horizontal yang terbaca.
- Menjadikan header admin fixed pada seluruh viewport agar navigasi Klien & Pelaksanaan dan halaman lain tetap tersedia saat konten digulir.

### Performance

- Mempertahankan verifikasi admin pada layout selama navigasi internal sehingga role tidak diminta ulang pada setiap perpindahan halaman.
- Menambahkan cache dashboard per-user selama 45 detik, deduplikasi request bersamaan, refresh paksa setelah mutasi, dan prefetch per kelompok menu.
- Menghindari pembacaan sesi Supabase kedua ketika request API sudah membawa bearer token.

### Documentation

- Mencatat Gate A lulus dan Gate B lulus dengan temuan pada runbook acceptance Fase 16.
- Memperjelas Gate C–F dengan perbedaan produk/modul, contoh nilai setiap field, batas aman pengaturan bisnis, data program UAT, serta urutan pengujian peserta.

## [0.18.2] - 2026-09-03

### Changed — Professional Pre-test & Post-test Builder

- Merombak editor menjadi tiga ruang kerja yang jelas: Pertanyaan, Respons, dan Pengaturan, dengan status draf/publikasi serta indikator perubahan yang belum disimpan.
- Menambahkan editor tujuh tipe jawaban dengan pilihan jawaban terstruktur, kunci jawaban visual, poin, required state, label skala, dan validasi sebelum penyimpanan.
- Menambahkan duplikasi serta pengurutan naik/turun untuk pertanyaan, sekaligus mempertahankan audit lock setelah respons pertama masuk.
- Menambahkan pratinjau peserta interaktif untuk ukuran desktop dan mobile yang menggunakan renderer form yang sama dengan halaman peserta production, termasuk progres jawaban langsung tanpa menyimpan data.
- Menambahkan checklist kesiapan publikasi, buka/tutup penerimaan respons, impor dokumen yang lebih terarah, dan ekspor respons CSV.
- Memperbaiki pemetaan statistik agar sesuai dengan kontrak backend (`overall` dan `perQuestion`), termasuk distribusi skor dan ringkasan numerik per pertanyaan.
- Menampilkan label kedua ujung skala serta error pertanyaan wajib secara konsisten pada halaman peserta.

## [0.18.1] - 2026-09-02

### Fixed — Admin Navigation & Program Context

- Menghapus header internal yang menggandakan judul shell dan menyamakan hierarki semua halaman admin: eyebrow gold, judul navy, lalu deskripsi kontekstual.
- Menambahkan pemilih program pada halaman Pre-test & Post-test; pilihan tersimpan di URL sehingga konteks tetap aman setelah refresh atau dibagikan.
- Memperbaiki pemuatan program Evaluasi Program dengan token sesi eksplisit serta state memuat, gagal, dan kosong yang dapat dibedakan.
- Memindahkan T-BOS ke `AdminShell` dan navigasi admin terpadu tanpa mengubah desain, grafik, tabel, atau alur kerja internal T-BOS.
- Menghapus bottom navigation lama yang sebelumnya dapat muncul bersamaan dengan navigasi admin pada T-BOS mobile.

## [0.18.0] - 2026-09-02

### Changed — Unified Application Journey & Admin Workspace

- Menetapkan `/admin/dashboard` sebagai satu-satunya beranda administrator dan mengubah `/admin` menjadi redirect kompatibilitas.
- Mengganti monolit tab di `/admin` dengan URL kanonis untuk dashboard, acquisition, pipeline, assessment, konsultasi, kontak, inquiry, klien, operasional, dan otomasi.
- Menyatukan seluruh halaman administrator non-T-BOS ke satu shell, satu struktur navigasi, dan satu bahasa visual production.
- Mendesain ulang sidebar desktop menjadi kelompok accordion yang dapat dicari dan digulir serta navigasi mobile menjadi drawer yang aksesibel.
- Menambahkan breadcrumb kontekstual, state loading, error, dan not-found yang konsisten tanpa menggandakan judul halaman.
- Menghapus menu evidence pengujian dan kontrol fase internal dari kontrak antarmuka pengguna; data dan prosedur operasionalnya tetap berada di backend dan dokumen developer.
- Menyederhanakan `/home` menjadi resolver role agar pengguna langsung tiba di ruang kerja yang sesuai setelah login.
- Menyatukan beranda klien ke `/client/program` dan mengarahkan rute fasilitator lama ke `/fasilitator/tbos`.
- Mendokumentasikan arsitektur informasi, peta rute, redirect kompatibilitas, dan aturan penambahan halaman admin.

### Accessibility

- Menambahkan skip link, focus indicator, focus trap drawer, penutupan melalui Escape, pengembalian fokus, serta body scroll lock pada navigasi mobile.
- Memastikan shell admin tidak menghasilkan horizontal overflow pada viewport desktop maupun mobile.

### Safety

- Visual dan alur kerja internal T-BOS tidak diubah pada fase ini.
- Redesign tidak mengubah endpoint bisnis, skema database, status dry-run, runtime control, atau keputusan persetujuan manusia.

## [0.17.0] - 2026-09-01

### Added — Configurable Commercial & Learning Operations

- Menambahkan workspace katalog produk dengan CRUD produk/modul, harga, scope, deliverables, urutan, featured state, serta publish/unpublish yang tervalidasi.
- Menambahkan katalog publik `/catalog` yang hanya menampilkan produk dan modul berstatus siap, aktif, non-mock, serta sengaja dipublikasikan.
- Menambahkan pusat Pengaturan Bisnis untuk minimum transaksi, owner/backup, approver/delegasi, SLA risiko, dan template wording proposal/invoice.
- Menambahkan builder Pre-test dan Post-test per program, impor soal DOCX/TXT/CSV/JSON, publish gate, halaman pengisian peserta, skoring, dan statistik per soal.
- Menambahkan QR akses program yang dapat dipindai dan diunduh sebagai PNG dengan nama serta kode program pada gambar dan nama file.

### Changed

- Mengubah bantuan halaman dari sidebar permanen yang menghalangi konten menjadi panel kontekstual yang dibuka melalui ikon informasi.
- Menambahkan Pre-test dan Post-test sebagai modul program yang dapat diaktifkan secara independen.
- Menambahkan tautan Katalog Produk dan Pengaturan Bisnis pada navigasi admin desktop maupun mobile.

### Safety

- Template finance/legal awal tetap berstatus `review`, SLA awal tetap nonaktif, dan delegasi awal tetap nonaktif sampai admin menyimpan keputusan manusia.
- Item katalog tidak otomatis menjadi publik; publish membutuhkan status/readiness yang sah dan data publik minimum.

## [0.16.4] - 2026-09-01

### Changed — Sales Pipeline Workspace Redesign

- Mendesain ulang Sales Pipeline sebagai ruang kerja komersial dengan nilai pipeline aktif, jumlah peluang yang memerlukan tindakan, tenggat terlewat, dan peluang tanpa penanggung jawab sebagai metrik utama.
- Memisahkan peluang aktif dari hasil `Berhasil` dan `Tidak lanjut`, sehingga board harian hanya memuat lima tahap yang masih memerlukan pekerjaan.
- Memperlebar kolom board dan meringkas kartu peluang agar nama, perusahaan, nilai, penanggung jawab, tindakan berikutnya, serta tenggat dapat dipindai dengan cepat.
- Mengurutkan peluang secara otomatis berdasarkan urgensi: tenggat terlewat, belum memiliki penanggung jawab, data tindak lanjut belum lengkap, jatuh tempo dalam 24 jam, dan prioritas lead.
- Menambahkan filter penanggung jawab dan filter `Perlu tindakan`, serta tampilan satu tahap pada perangkat seluler untuk menghindari kanban mini yang sulit digunakan.
- Memindahkan kesehatan pengiriman email ke panel pendukung yang dapat dibuka saat dibutuhkan.
- Menyembunyikan evidence pengujian internal dari board operasional tanpa menghapus data atau mengubah API.
- Menyederhanakan editor peluang dan menerjemahkan label tahap, suhu lead, aktivitas, serta kontrol tindak lanjut ke bahasa bisnis yang konsisten.

### Safety

- Redesign tidak mengubah endpoint, payload mutasi, aturan validasi tahap, data database, atau status otomasi.

## [0.16.3] - 2026-09-01

### Changed — Admin UI/UX Production Hardening

- Mendesain ulang navigasi administrator menjadi kelompok accordion yang ringkas, dapat digulir pada desktop, dan drawer terstruktur pada perangkat seluler.
- Mengganti menu pilihan panjang pada mobile dengan drawer yang menampilkan hierarki area kerja, penanda halaman aktif, serta tautan operasional yang mudah dipindai.
- Menyederhanakan bahasa antarmuka pada akuisisi, penjualan, assessment, konsultasi, klien, operasional, otomasi, katalog, program, pengguna, dan izin akses agar berorientasi tugas bisnis.
- Menghapus instruksi pengujian, rincian penyedia layanan, status teknis mentah, dan terminologi developer dari area kerja administrator yang digunakan sehari-hari.
- Mengganti kartu penugasan berbasis efek balik dengan kartu statis yang lebih mudah dibaca, dioperasikan melalui keyboard, dan digunakan pada perangkat sentuh.
- Menambahkan tampilan kartu pengguna untuk mobile, matriks izin yang dapat digulir dengan aman, serta status loading, error, dan empty state yang konsisten.
- Menambahkan skip link, fokus global yang jelas, penghormatan terhadap preferensi reduced-motion, modal dengan focus trap, dukungan Escape, pemulihan fokus, dan semantik dialog/progress yang aksesibel.
- Menambahkan halaman loading dan error khusus area admin serta tes regresi untuk dialog, accordion, dan progress bar.

### Safety

- Perubahan ini hanya menyentuh pengalaman antarmuka dan aksesibilitas; tidak mengubah API, skema database, workflow otomasi, status dry-run, atau keputusan persetujuan bisnis.

## [0.16.2] - 2026-08-31

### Fixed — Assessment Accessibility & Phase 13 Evidence

- Menambahkan runbook Fase 13 dengan baseline production, 12 skenario UAT, urutan evidence, keputusan bisnis, monitoring policy, release, rehearsal, dan acceptance.
- Mencatat evidence awal: tiga workflow healthy, Follow-up deferred di luar window, watchdog dry-run/locked, serta tidak ada outbound atau incident yang dimaterialisasi.
- Mencatat skenario `public_assessment_pdf_email` sebagai passed di production berdasarkan hasil pengguna, screenshot email/admin, dan PDF empat halaman; temuan visual dipisahkan sebagai improvement non-blocking.
- Mencatat `admin_role_boundaries` passed berdasarkan 13/13 pemeriksaan production.
- Mencatat `calcom_booking_lifecycle` passed setelah booking, reschedule, cancellation, no-show, idempotensi, lineage, dan opportunity audit diverifikasi pada production tanpa membuat booking vendor.
- Mencatat `resend_delivery_webhook` passed serta `email_suppression_stop_rules` in-progress sampai Follow-up Scheduler dapat diperiksa pada business window.
- Menghubungkan seluruh input profil assessment dengan label semantiknya dan mengubah pemilih jumlah karyawan menjadi kontrol keyboard/reader-friendly (`button` + `listbox`), sehingga form inti dapat dibaca dan dioperasikan teknologi bantu.

## [0.16.1] - 2026-08-30

### Changed — Admin Navigation & Internal Gate UI

- Mengelompokkan sidebar admin menjadi accordion yang ringkas dan menyediakan area scroll independen agar seluruh menu tetap dapat dijangkau pada layar pendek.
- Mengeluarkan Launch Control, Human UAT, Pilot Operations, Operational Assurance, dan Pilot Certification dari navigasi produk; evidence dan instruksi pengujian tetap dikelola sebagai artefak developer/backend.
- Mendesain ulang pengisian assessment per dimensi menjadi satu pertanyaan fokus dengan navigator, progres terjawab, pilihan respons yang lebih ekspresif, dan perpindahan otomatis ke pertanyaan berikutnya.
- Memperbaiki label respons kelima pada locale Inggris agar tidak lagi menggunakan fallback bahasa Indonesia.
- Memusatkan pemeriksaan role client-side dan memastikan gate admin, fasilitator, peserta, serta klien selalu meneruskan bearer token sesi ke endpoint `/api/auth/role`.
- Menambahkan tes regresi untuk token kosong, header otorisasi, cache bypass, dan penolakan role yang tidak dikenal.
- Perubahan UI ini memerlukan deployment app berikutnya, tetapi tidak mengubah API, database, n8n, atau status dry-run.

## [0.16.0] - 2026-08-30

### Added — Phase 12 Pilot Rehearsal & Acceptance

- Menambahkan tab `Pilot Certification` untuk merencanakan production dry-run rehearsal, mencatat delapan bukti eksekusi, dan mengikat hasil ke snapshot monitoring.
- Menambahkan form acceptance manusia dengan keputusan accepted, accepted with conditions, atau rejected sebelum proses go/no-go.
- Menampilkan gate UAT, policy monitoring, critical incident, status rehearsal, dan acceptance dalam satu workspace audit.

### Safety

- Dashboard tidak mengaktifkan n8n, tidak mengubah environment, dan tidak mengirim outbound.
- Rehearsal real hanya dapat lulus dengan delapan langkah passed dan snapshot real yang fresh; acceptance tetap membutuhkan deployment terpisah untuk aktivasi.

## [0.15.0] - 2026-08-30

### Added — Phase 11 Operational Assurance

- Menambahkan tab `Operational Assurance` untuk snapshot kesehatan automation, monitoring policy, incident response, dan keputusan go/no-go.
- Menampilkan execution evidence per workflow, failure rate, consecutive failure, stale run, status environment guard, serta blocker pilot.
- Menambahkan form owner/resolution incident dan human gate yang mengikat keputusan ke snapshot terbaru.
- Mempertahankan activation lock: dashboard tidak mengaktifkan n8n, tidak mengubah environment, dan tidak mengirim outbound.

## [0.14.0] - 2026-08-30

### Added — Phase 10 Controlled Pilot Operations

- Menambahkan tab `Pilot Operations` untuk menyusun release pilot, cohort, owner, jadwal, kriteria sukses, trigger rollback, dan keputusan manusia.
- Menampilkan empat gate aktivasi, requested/effective mode, environment dry-run, batas volume, versi control, dan approved release.
- Menambahkan kill switch per worker dengan alasan wajib dan audit event.
- Mempertahankan batas aman: UI tidak mengubah environment dan tidak mengaktifkan workflow n8n; server tetap menolak pilot/live ketika gate belum lengkap.

## [0.13.0] - 2026-08-30

### Added — Phase 9 Human UAT & Pilot Gate

- Menambahkan tab `UAT & Pilot Gate` untuk menjalankan 12 skenario wajib dengan owner, environment, status, bukti, hasil aktual, dan alasan blocker.
- Menampilkan progres kelulusan, skenario gagal/terblokir, kelayakan human review, serta audit trail per skenario.
- Mempertahankan batas aman: dashboard tidak menyediakan tombol aktivasi n8n, perubahan dry-run, atau pengiriman komunikasi live.
- Menambahkan runbook Fase 9 yang memisahkan kelulusan engineering, eksekusi UAT manusia, dan keputusan pilot.

### Fixed

- Menambahkan reverse proxy server `/api/*` ke `NEXT_PUBLIC_BINAHUB_API_URL`; deployment `app.binahub.id` sebelumnya mengembalikan 404 untuk request dashboard karena frontend dan API berada pada host berbeda.

## [0.12.0] - 2026-08-30

### Added — Phase 8 Launch Control

- Menambahkan tab `Launch Control` read-only untuk merangkum kesiapan teknis, mode dry-run/live, bukti run terakhir, dan blocker keputusan per workflow.
- Menampilkan Business Rules yang masih terbuka dengan istilah bisnis, jumlah modul siap/berharga, template approved, bukti webhook email, health event queue, dan lineage Cal.com.
- Tidak menambahkan tombol aktivasi. Status “layak human review” tetap membutuhkan persetujuan, perubahan environment, aktivasi n8n, dan rollback plan secara terpisah.

## [0.11.2] - 2026-08-29

### Fixed — Hostinger Security Headers

- Memindahkan security headers dari artifact `.htaccess` ke response Next.js karena deployment Hostinger berjalan sebagai Node.js Web App dan tidak membaca konfigurasi Apache di `public`.
- Mengubah build dari static export menjadi Next.js server output agar header HSTS, CSP, permissions policy, referrer policy, frame denial, dan nosniff diterapkan oleh origin.
- Mempertahankan `poweredByHeader: false` agar identitas framework tidak diekspos setelah cache deployment dibersihkan.

## [0.11.1] - 2026-08-29

### Security — Phase 7 Integrated UAT

- Menambahkan security headers pada artifact statis Hostinger: HSTS, nosniff, frame denial, referrer policy, permissions policy, dan Content Security Policy.
- Menonaktifkan header identifikasi `X-Powered-By` pada konfigurasi Next.js.
- Mempertahankan koneksi frontend hanya ke API BinaHub dan Supabase, serta memblokir object embedding dan framing lintas origin.

### Verification

- Lint, typecheck, 41 unit test, production build, dan audit dependency production lulus.

## [Unreleased] - 2026-08-15

### Fixed — Audit revisi dan production hardening

- Menutup kebocoran scope lintas program pada T-BOS/LEP serta menerapkan RBAC admin, fasilitator, client, dan peserta di endpoint API.
- Submit observasi sekarang atomik dan idempotent, termasuk pembuatan tim baru, roster, kapten, skor, snapshot anggota, dan audit trail.
- Assignment fasilitator berpindah penuh ke `facilitator_missions` per program+mission tanpa menghapus histori `tbos_facilitator_teams`.
- Pembuatan batch dan penggantian assignment menggunakan RPC race-safe; nama tim, batch, dan speaker aktif dilindungi unique index case-insensitive.
- Submit LEP menjadi satu transaksi, memverifikasi membership serta seluruh speaker aktif, memakai soft delete speaker, dan memperbaiki response rate.
- Dashboard, ranking, filter mission/dimensi, laporan per tim, radar PDF, program selector, module selector, dan antrean offline diselaraskan dengan PRD.
- Endpoint publik mendapat persistent rate limiting, token kepemilikan sesi chat, token link proposal bertanggal kedaluwarsa, escaping HTML, dan security headers.
- Dependensi diperbarui ke patch aman Next.js; `npm audit` frontend dan API tidak lagi melaporkan vulnerability.
- Dokumentasi architecture, data model, permission, state machine, dan deployment database diselaraskan dengan implementasi aktual.

### Changed — Phase 6 Release Reconciliation

- Menyelaraskan status deployment Fase 2–5 dengan kondisi production per 29 Agustus 2026.
- Menambahkan status Fase 6 yang memisahkan deployment, workflow inactive, credential belum terhubung, dan UAT yang belum selesai.
- Mencatat website pricing v0.2.18 sebagai live serta API catalog reconciliation v0.11.1 sebagai deployment berikutnya.

## [0.11.0] - 2026-08-29

### Added — Acquisition Control

- Menambahkan tab `Acquisition Control` untuk governed data source, campaign, prospect batch, dan human review.
- Menampilkan status source/campaign, valid/invalid/duplicate/suppressed prospect, serta hasil promotion.
- Menambahkan form legal source, campaign UTM/budget, staging JSON maksimal 500 record, dan approval/rejection batch.

### Safety

- UI tidak menyediakan scraping, enrichment otomatis, email blast, atau tombol aktivasi n8n.
- Source, campaign, dan batch melewati server-side human/legal gate sebelum prospect dapat menjadi consumer lead.

## [0.10.0] - 2026-08-29

### Added — Operations Control

- Menambahkan tab `Operations Control` untuk mengelola human task yang dibentuk scheduler Fase 4.
- Menampilkan task aktif, SLA overdue, critical priority, serta automation run gagal.
- Menambahkan assignment owner, due time, priority, status, dan catatan penyelesaian dengan guardrail manusia.
- Menampilkan audit run dry-run/live, jumlah kandidat, task yang dibuat, serta error workflow.

### Safety

- UI tidak menyediakan tombol untuk mengaktifkan scheduler atau menonaktifkan dry-run.
- Task tidak dapat diselesaikan/dibatalkan tanpa catatan resolusi dan task aktif tidak dapat berjalan tanpa owner.

## [0.9.0] - 2026-08-29

### Added — Client Success & Delivery Workspace

- Menambahkan tab `Client & Delivery` untuk mengubah deal menjadi client dan initial delivery project.
- Menambahkan pengelolaan owner account, status client/retain, stakeholder, delivery stage, success metric, risiko, dan milestone.
- Menambahkan account health review dengan empat dimensi, risk level, next action, serta riwayat review.
- Menambahkan retention opportunity untuk renewal, upsell, cross-sell, repeat order, dan referral dengan human gate.
- Menambahkan activity trail per client serta indikator client aktif/berisiko, delivery terbuka, milestone terlambat, dan nilai pipeline retain.

### Safety

- UI tidak menyediakan jalan pintas untuk mengonversi lead yang belum won.
- Status risiko, blocked, proposal, dan won meminta data guardrail yang sesuai sebelum request dikirim.

## [0.8.0] - 2026-08-29

### Added — Sales Operations Workspace

- Menambahkan Sales Pipeline tujuh tahap untuk menetapkan owner, next action, tenggat, nilai peluang, status won/lost, dan alasan tidak lanjut.
- Menambahkan human pause untuk menghentikan outreach otomatis beserta alasan dan jejak aktivitas per lead.
- Menampilkan indikator peluang aktif, next action terlambat, peluang tanpa owner, serta alert deliverability email.
- Menambahkan pengelolaan template follow-up berversi dengan status draft, approved, dan archived di Katalog & Rules.
- Memperluas assessment publik dengan industri, lokasi, timeline, status budget, sponsor, next-step intent, dan konsekuensi bisnis agar qualification tidak mengandalkan asumsi.

### Changed

- Dashboard memisahkan kontrol opportunity dari daftar kontak agar tindak lanjut komersial mempunyai ownership dan SLA yang jelas.
- Template mock tidak dapat di-approve; template approved membutuhkan catatan persetujuan dan hanya mendukung placeholder aman.

## [0.7.0] - 2026-08-28

### Added — Business Rules v1 pada Dashboard Admin

- Menampilkan draft Business Rules non-mock beserta activation blockers tanpa menyamarkannya sebagai rules aktif.
- Menampilkan confidence, buying signals, rule version, alasan qualification, data lead yang masih kurang, dan exclusion gate pada detail assessment.
- Menambahkan form 12 data wajib proposal agar tim dapat melengkapi konteks bisnis sebelum Human Gate dievaluasi.
- Menampilkan daftar data proposal yang belum lengkap serta SLA review pada snapshot draft.

### Changed

- Approval proposal sekarang meminta alasan audit terpisah; tombol setujui tetap nonaktif sampai alasan memadai diisi.
- Dashboard tetap menandai katalog/rules mock sebagai simulasi dan tidak membuka pengiriman proposal otomatis.

## [0.6.0] - 2026-08-28

### Added — BinaHub AI Business Process & BinaInsight Public Funnel

- Menambahkan BinaInsight publik tanpa autentikasi, penerusan attribution kampanye, dan payload assessment yang tervalidasi.
- Menambahkan tampilan lifecycle consumer → prospect → lead → client → retained, temperature hot/warm/cold, serta stage opportunity pada dashboard admin.
- Menambahkan panel Business Rules, katalog modul, proposal indikatif, human gate, approval/revision/reject, dan timeline meeting Cal.com pada dashboard admin.
- Menambahkan BinaInsight sebagai modul program dan penyelarasan UI hasil assessment serta akses admin terkait.
- Menambahkan dokumentasi implementasi proses bisnis, Business Rules mock, dan artefak presentasi untuk penggantian data mock menjadi data resmi.

### Changed

- Menyelaraskan dashboard assessment, inquiry, overview, serta navigasi admin dengan workflow prospecting, lead qualification, proposal, dan follow-up.
- Memperbarui integrasi API publik untuk mendukung katalog per modul dan proses konsultasi.

### Verification

- `npm run test:run` lulus: 41 tes.
- `npm run build` lulus pada Next.js 16.3.1.

## [0.5.0] - 2026-08-13

### Added — Modul LEP, Batch Fleksibel, Penugasan Fasilitator (Prompt 0–8)

#### Modul Program & Module Selector (Prompt 0)
- Menambahkan halaman `/admin/programs`: pengelolaan modul per program (T-BOS / LEP) yang menulis ke tabel `program_modules` via `GET/PUT /api/program-modules`.
- Modul yang tidak aktif disembunyikan dari navigasi program tersebut.

#### Batch Fleksibel (Prompt 1)
- Menambahkan UI kelola batch di `/admin/tbos` — list batch per program aktif, tombol tambah batch, dan hapus batch dengan confirm dialog.
- Tombol hapus batch di-disable (dengan alasan) jika masih ada team yang memakai `batch_id` tersebut.
- `batch-comparison.tsx` kini merender kolom/seri dinamis sejumlah batch aktual dari tabel `batches` (bukan hardcode "Batch 1"/"Batch 2").

#### Penugasan Fasilitator Sederhana (Prompt 2)
- Form assignment fasilitator diubah: hanya pilih fasilitator (role `facilitator`) + mission, tanpa pemilihan tim.
- Penulisan assignment beralih dari `tbos_facilitator_teams` ke tabel baru `facilitator_missions`.

#### Pilih Tim & Roster Progresif Saat Observasi (Prompt 3)
- Step baru "pilih tim" di `/fasilitator/tbos`: fasilitator melihat daftar tim di batch program aktif.
- Opsi "+ Tim Baru" dengan validasi nama unik per (program, batch); saat tim baru dibuat, form roster (anggota + kapten) tampil sebelum form observasi dimensi.
- Tim yang sudah ada langsung lanjut ke observasi tanpa form roster.
- Validasi unik nama tim ditangani di level database (index unik parsial).

#### Traceability Fasilitator & Scoping Dashboard (Prompt 4 & 5)
- Menampilkan nama fasilitator penilai pada detail observasi/daftar di `/admin/tbos` dan laporan per-tim.
- `/fasilitator/tbos/results` kini hanya menghitung statistik untuk mission milik fasilitator yang login (via `facilitator_missions`), namun menampilkan semua tim yang punya observasi di mission tsb.

#### Ranking + Filter Mission/Dimensi (Prompt 6)
- Perbaikan visual ranking (rounded-xl, gradient medali disederhanakan, border/shadow token standar).
- Dua filter dropdown: "Filter Mission" (default semua / Overall Team Score) dan "Filter Dimensi" (default semua / rata-rata gabungan).
- Ranking dihitung dari Final Mission Score atau Dimension Score sesuai filter, kombinasi filter didukung.

#### Laporan Per Tim (Prompt 7)
- `pdf-report.tsx` kini mendukung mode laporan per tim: nama tim & batch, kapten & anggota, radar chart 8 dimensi, tabel riwayat observasi per mission (skor + nama fasilitator), 3 kekuatan & 3 area pengembangan.
- Menambahkan tombol "Unduh Laporan Tim" di halaman detail/roster tim admin.

#### Modul LEP (Prompt 8)
- Menambahkan halaman peserta `/peserta/lep`: form single-page — 4 pertanyaan skala 1–4 (radio horizontal), rating per pemateri (dinamis dari `lep_speakers`) dengan saran opsional, dan 3 pertanyaan open text (2 wajib).
- Proteksi submit ganda via unique constraint `(program_id, profile_id)` — user yang sudah mengisi melihat pesan "Anda sudah mengisi evaluasi ini".
- Menambahkan halaman admin `/admin/lep`: setup pemateri per program (CRUD), dashboard hasil (rata-rata 4 pertanyaan umum, rata-rata skor per pemateri bar chart, daftar jawaban open text dengan filter, response rate, tombol export CSV).
- Menambahkan komponen `peserta-auth-gate.tsx` (gate role peserta+admin) dan nav "Evaluasi Program" (peserta) / "LEP" (admin) di `app-shell.tsx`.
- Skoring & types diperbarui di `src/modules/tbos/` untuk mendukung filter mission/dimensi dan batch dinamis.

#### Keamanan / Infrastruktur
- RLS hardening: seluruh tabel `public` di-enable Row Level Security, akses `anon`/`authenticated` dicabut, `service_role` (backend) dipertahankan, `profiles` hanya bisa dibaca user pemiliknya sendiri (`auth.uid() = id`). Menutup alert "rls_disabled_in_public".
- Verifikasi: `npm run typecheck`, `npm run lint`, `npm run build` lolos.

---

## [0.4.0] - 2026-08-08

### Added — PRD v0.4, Cross-Repo API Alignment, Admin Workflow & SLJ Auth Redesign

#### PRD v0.4 & Architecture Sync
- Mengadopsi **PRD v0.4** (*Modular Operational Platform*): Arsitektur generik 7-layer Evidence/Capability dari v0.3 diturunkan menjadi visi jangka panjang; platform kini berfokus pada fondasi bersama (Auth, Role, Shell Dashboard) yang menaungi modul-modul independen (BinaInsight, BinaImpact, T-BOS).
- Mengupdate **ADR.md**: 4 ADR disinkronkan dengan status implementasi aktual (ADR-005: Rata-rata skor final, ADR-006: Offline-first localStorage draft/queue, ADR-007: Fase MVP, ADR-010: Rombak Landing/PRD v0.4 — semuanya berstatus ✅ Final).
- Mengupdate **ARCHITECTURE.md**: Status diubah dari "Draft" menjadi "Active", risiko PRD v0.3 ditandai resolved, pertimbangan teknis diperbarui, dan pola `ApiFetchBridge` → `binahub-api` didokumentasikan secara resmi.

#### Cross-Repo API Alignment (`app-binahub` ↔ `binahub-api`)
- **Fix Teams Field Mismatch**: Backend `binahub-api` pada `GET /api/tbos/teams` kini mentransformasikan relasi `tbos_team_members` menjadi `members`, sehingga nama anggota tim tampil sempurna di UI fasilitator.
- **Route Baru Participant Team Info**: Menambahkan route `GET /api/tbos/participant/team-info` di `binahub-api` untuk menghitung skor tim, dimensi unggulan, dimensi perbaikan, serta peringkat batch secara server-side tanpa memerlukan hak akses admin.
- **Client Helper `createTeam()`**: Menambahkan method `createTeam()` pada `src/modules/tbos/api-client.ts` untuk mempermudah pembuatan tim via `POST /api/tbos/teams`.

#### Admin Workflow & UI/UX Enhancements
- **Modal Tambah Tim Baru**: Menambahkan dialog modal di `/admin/tbos` sehingga admin dapat mendaftarkan tim dan batch baru secara instan tanpa query manual ke database.
- **Quick Action Bar**: Header `/admin/tbos` dilengkapi bar navigasi cepat menuju *Kelola & Kunci Observasi* (`/fasilitator/tbos/observations`), *Form Observasi Fasilitator* (`/fasilitator/tbos`), *Dashboard Peserta* (`/peserta/dashboard`), serta tombol ekspor PDF & CSV.
- **Sidebar Navigasi Terpadu**: Sidebar `/admin/page.tsx` disinkronkan dengan tautan lengkap ke *T-BOS Analytics*, *Manajemen User & Role*, *Workflow Observasi*, dan *Dashboard Peserta*.

#### Modernisasi UI/UX Signin & Signup (Selaras dengan `slj-binahub`)
- **Latar Belakang & Atmosfer Visual**: Mengimplementasikan background grid halus dengan *radial gradient mask* dan *ambient glowing orbs* bernuansa Gold (`#D9A441`) & Navy (`#0B2C6B`).
- **Elevated Glassmorphic Card**: Kontainer form modern berpadu *backdrop-blur*, border halus, dan bayangan lembut.
- **Google One-Click Sign-In**: Opsi login/daftar instan dengan logo resmi Google berwarna.
- **Dual-Mode Switcher**: Tab segment Masuk / Daftar Baru yang responsif dan mulus.
- **Alur Pemulihan Password (Forgot Password)**: Mode reset password terintegrasi menggunakan `supabase.auth.resetPasswordForEmail()`.
- **Persetujuan Legal**: Checkbox persetujuan Syarat & Ketentuan serta Kebijakan Privasi pada form pendaftaran.
- **Rute URL Terpadu**: Menambahkan handler halaman untuk `/login`, `/register`, dan `/forgot-password`.

---

## [0.3.1] - 2026-08-07

### Added — ADR-009, Peserta Dashboard, Team Members, Filters

#### ADR-009: Role-Based Auto-Redirect Login
- Menambahkan halaman `/login` (unified login portal) — semua user (peserta, fasilitator, admin) login lewat portal yang sama, sistem auto-redirect ke dashboard sesuai role dari tabel `profiles`.
- Menambahkan `GET /api/auth/role` (binahub-api) — mengembalikan role dari `profiles` table + URL redirect yang sesuai.
- Menambahkan `POST /api/admin/users/role` (binahub-api) — admin mengubah role user + force-logout via `supabase.auth.admin.signOut(userId, "global")`.
- Menambahkan role `peserta` ke `roles.ts` dan `navByRole` di `app-shell.tsx`.
- Menghapus route lama `(auth)/login` yang redirect ke `/` — sekarang semua login lewat `/login`.

#### Peserta Dashboard (`/peserta/dashboard`)
- Menambahkan halaman dashboard peserta dengan welcome banner, stat cards (ranking, skor, mission selesai, nama tim), info cards (tentang T-BOS, 8 dimensi perilaku), dan logout button.
- Auto-redirect: jika role bukan `peserta`, redirect ke dashboard yang sesuai.

#### Team Members di Form Observasi
- Menambahkan tampilan anggota tim di team selection pada form observasi `/fasilitator/tbos` — nama anggota ditampilkan sebagai chips/badges di bawah nama tim.

#### Batch Filter di Dashboard
- Menambahkan batch filter (Semua / Batch 1 / Batch 2) di Radar Chart — filter tim yang ditampilkan berdasarkan batch.
- Menambahkan batch filter di Heatmap — filter baris tim berdasarkan batch.

### Changed
- Mengubah `roles.ts`: menambah `peserta` ke daftar roles, update `roleHome` mapping (facilitator → `/fasilitator/tbos`).
- Mengubah `app-shell.tsx`: menambah nav items untuk role `peserta`.
- Mengubah ADR-003: status berubah dari 🔴 Open → ✅ Final (tidak ada Mission Performance Score, T-BOS Score langsung menjadi skor mission).
- Mengubah ADR-005: status berubah dari 🔴 Open → ✅ Final (rata-rata, dikonfirmasi spec terbaru).
- Mengubah ADR-006: status berubah dari 🔴 Open → ✅ Final (localStorage auto-save + submission queue, bukan Service Worker).
- Mengubah ADR-009: status berubah dari partial → ✅ Final (force-logout + auto-redirect diimplementasi).

### Notes
- Build output: 61 static pages, 0 errors (Next.js 16.2.6, Turbopack).
- Halaman baru: `/login`, `/peserta/dashboard`.
- API endpoints baru (binahub-api): `GET /api/auth/role`, `POST /api/admin/users/role`.

## [0.3.0] - 2026-08-07

### Added — T-BOS (Team Behavioral Observation System)

Modul T-BOS untuk fasilitator mengobservasi perilaku tim selama mission simulasi. Diimplementasi dalam 4 fase (MVP → Dashboard → Executive Summary + Export → Hardening).

#### Migration & Database
- Menambahkan migration `0005_tbos_tables.sql`: 9 tabel `tbos_*` (`tbos_missions`, `tbos_behavioral_dimensions`, `tbos_mission_dimensions`, `tbos_dimension_levels`, `tbos_teams`, `tbos_team_members`, `tbos_facilitator_missions`, `tbos_observations`, `tbos_observation_scores`) dengan RLS policies.
- Menambahkan migration `0006_add_peserta_role.sql`: role `peserta` di profiles check constraint, default role saat signup berubah ke `peserta`, kolom `role_updated_at` untuk force-logout mechanism (ADR-009).
- Menambahkan migration `0007_tbos_state_machine.sql`: tabel `tbos_observation_audit_log`, kolom `locked_at`/`locked_by`/`revision_deadline` di observations, trigger auto-set revision deadline.
- Seed data: 5 missions (Lost Detonator, Goldsmith Precision, Ore Extraction, Lean Bridge, X-Case), 8 behavioral dimensions (Goal Alignment, Communication, Data-Based Decision Making, Execution Discipline, Accountability, Adaptability, Collaboration, Organizational Ownership), 40 level descriptions (5 levels × 8 dimensions), 16 mission-dimension mappings.

#### Module (`src/modules/tbos/`)
- Menambahkan `config.ts`: konfigurasi 5 missions, 8 dimensions, 40 level descriptions, mission→dimension mapping sesuai PRD §4.2.
- Menambahkan `types.ts`: TypeScript types untuk Observation, Score, TeamScoreSummary, MissionScore, BatchComparison, ExecutiveSummary, TbosDashboardData, ExecutiveNarrative.
- Menambahkan `scoring.ts`: logika perhitungan skor — Dimension Score (rata-rata level_values), T-BOS Score (rata-rata dimension scores per mission), Overall Team Score (rata-rata T-BOS Scores), Batch Comparison, Executive Summary dengan narrative text generation otomatis (Bahasa Indonesia).
- Menambahkan `README.md` dokumentasi modul.

#### API Routes (binahub-api)
- Menambahkan `GET /api/tbos/missions`: missions ditugaskan ke fasilitator + dimensions + levels.
- Menambahkan `POST /api/tbos/observations`: submit observasi baru dengan validasi facilitator↔mission dan mission↔dimension.
- Menambahkan `GET /api/tbos/observations`: list observasi (fasilitator: own only, admin: all) dengan status, revision deadline, canEdit flag.
- Menambahkan `GET /api/tbos/observations/[id]`: detail observasi + audit log timeline.
- Menambahkan `PATCH /api/tbos/observations/[id]`: aksi `lock`, `unlock` (admin only), `edit` (dalam revision window).
- Menambahkan `GET /api/tbos/dashboard`: data dashboard untuk admin (teams, observations, dimensions, mission-dimension mapping).
- Menambahkan `GET /api/tbos/teams` + `POST`: manajemen tim (admin only).
- Menambahkan `GET /api/tbos/export?format=csv`: export CSV raw observation data dengan UTF-8 BOM.

#### Observation Form UI (`/fasilitator/tbos`)
- Form observasi mobile-first, dinamis per mission (2-4 dimensi sesuai mapping).
- Step 1: pilih mission + tim.
- Step 2: isi level per dimensi (5 pilihan: Reactive→Exemplary) dengan deskripsi perilaku.
- Progress counter, notes field (opsional, max 50 karakter), validasi semua dimensi terisi.
- Step 3: submit + success page dengan branding BinaHub.

#### Observation List & Detail (`/fasilitator/tbos/observations`)
- List observasi dengan status badge (Draft/Submitted/Locked) dan canEdit indicator.
- Detail panel (modal): meta info, skor per dimensi dengan deskripsi, edit mode (ubah level + notes), lock/unlock buttons (admin), audit log timeline (create → edit → lock → unlock).
- Revision window display: menampilkan deadline edit dan status (aktif/berakhir).

#### Admin Dashboard (`/admin/tbos`)
- 6 tab: Overview, Executive Summary, Radar Chart, Heatmap, Ranking, Batch Comparison.
- Overview: 4 stat cards, 3 kekuatan utama, 3 area pengembangan, tabel ringkasan tim.
- Executive Summary: narrative text otomatis (overview, kekuatan, area pengembangan, rekomendasi strategis) dengan batch insight per dimensi.
- Radar Chart: per tim, 8 dimensi, unobserved dimensions excluded dari polygon (bukan 0), tooltip "Belum diobservasi".
- Heatmap: grid tim × 8 dimensi, warna gradasi 5-tier (merah→hijau), avg per tim, legend.
- Ranking: diurutkan by Overall Team Score (desc), medali 🥇🥈🥉, kekuatan & area dev per tim.
- Batch Comparison: horizontal bar chart Batch 1 vs 2 per dimensi + tabel dengan selisih.
- Real-time: auto-refresh 30 detik dengan live indicator + manual refresh button.
- Export: PDF (3 halaman A4 — executive summary, team ranking + score matrix, batch comparison) dan CSV (raw observation data).

#### Sidebar Navigation
- Admin: tambah menu "T-BOS" (icon Trophy).
- Fasilitator: tambah menu "T-BOS Observasi" (icon ClipboardCheck) dan "Riwayat Observasi" (icon Eye).

### Changed
- Mengubah `app-shell.tsx`: menambahkan navigasi T-BOS untuk admin dan fasilitator.
- Mengubah profiles role check constraint: menambah `peserta` sebagai role default untuk signup baru.
- Mengubah `requireFacilitator` auth: admin tidak lagi bisa submit observasi (hanya fasilitator), sesuai permission matrix ROLES-PERMISSIONS.md §3.

### Fixed
- Memperbaiki revision window trigger yang tidak pernah fire: trigger sekarang aktif pada INSERT (bukan hanya UPDATE draft→submitted), sehingga `revision_deadline` ter-set otomatis saat observasi disubmit.
- Memperbaiki typo "Exemplatory" → "Exemplary" pada CSV export level label.
- Memperbaiki radar chart: dimensi yang belum diobservasi sekarang excluded dari polygon (menggunakan `connectNulls={false}` + `null` value), bukan ditampilkan sebagai skor 0.
- Memperbaiki audit log: entri "submit" yang misleading (mencatat previous_status="draft" padahal observasi langsung insert sebagai "submitted") dihapus — hanya mencatat action "create".

### Known Limitations & Open ADRs
- **ADR-003 (Open)**: Final Mission Score (60% Performance + 40% T-BOS) belum diimplementasi — menunggu konfirmasi sumber Mission Performance Score. Overall Team Score sementara menggunakan rata-rata T-BOS Score.
- **ADR-006 (Open)**: Offline-first untuk form observasi belum diimplementasi.
- **ADR-009 (Partial)**: Role `peserta` ditambahkan ke DB, tetapi force-logout mechanism dan middleware auto-redirect belum diimplementasi. Role masih dibaca dari JWT metadata, bukan dari tabel `profiles`.
- **Peserta dashboard**: Belum ada halaman `/peserta` (placeholder belum dibuat).
- **Team members**: Belum ditampilkan di form observasi (PRD §4.1 — Nama Anggota Tim auto-populate).
- **Batch/date filters**: Radar chart dan heatmap belum memiliki filter batch atau rentang tanggal.
- **Excel export**: Hanya CSV yang tersedia (bukan .xlsx).
- **Min-data threshold**: Executive summary belum memiliki threshold minimum observasi (risiko bias small sample).
- **Super Admin role**: Documented di ROLES-PERMISSIONS.md tapi belum ada di DB constraint atau code.

### Notes
- Build output: 58 static pages, 0 errors (Next.js 16.2.6, Turbopack).
- Halaman T-BOS yang ter-generate: `/admin/tbos`, `/fasilitator/tbos`, `/fasilitator/tbos/observations`.
- Migrations perlu dijalankan berurutan: `0005` → `0006` → `0007`.
- Setelah migration, assign fasilitator ke mission: `INSERT INTO tbos_facilitator_missions (profile_id, mission_id) VALUES (...)` dan buat tim: `INSERT INTO tbos_teams (name, batch) VALUES (...)`.

## [0.2.0] - 2026-06-24

### Added
- Menambahkan autentikasi klien berbasis Supabase Auth dengan kode akses. Endpoint `/api/client/access` membuat user Supabase per kode akses dan mengembalikan `access_token`/`refresh_token`, frontend memanggil `supabase.auth.setSession()`.
- Menambahkan isolasi data server-side untuk pengguna klien: GET `/api/engagements` memfilter berdasarkan `organization_id`, GET `/api/evidence` dan `/api/actions` memfilter berdasarkan `participant_id`, GET `/api/capabilities/participant/:id` memverifikasi kepemilikan.
- Menambahkan auto-generate kode akses saat program dibuat. Backend `generateAccessCodesForEngagement()` membuat kode seperti `MASMINDO-A`, `MASMINDO-B` otomatis berdasarkan nama organisasi + suffix huruf.
- Menambahkan endpoint `GET /api/engagements/access-codes` untuk mengambil daftar kode akses per program.
- Menambahkan SQL migration `0006_access_code_links.sql` untuk menambahkan kolom `organization_id` dan `participant_id` ke tabel `app_client_access_codes`.
- Menambahkan halaman admin `/admin/engagements/access-codes` untuk melihat, menyalin, dan mengelola kode akses klien.
- Menambahkan tombol "Kode Akses" pada halaman `/admin/engagements/manage` dan card program di `/admin/engagements`.
- Menampilkan kode akses setelah pembuatan program selesai, lengkap dengan tombol salin per kode dan salin semua.
- Menambahkan `TransformationActor` yang diperkaya dengan `organizationId`, `participantId`, dan `accessCodeId` untuk filtering data di seluruh route handler.
- Menambahkan unit test dengan Vitest (16 test) untuk `capability-engine`.
- Menambahkan E2E test dengan Playwright (20 test) untuk halaman utama.
- Menambahkan analytics tracking (`src/lib/analytics.ts`) dengan hooks `usePageTracking` dan `useEngagementTracking`.
- Menambahkan error tracking terpusat (`src/lib/error-tracking.ts`) dengan `GlobalErrorHandler`.
- Menambahkan komponen `LoadingSpinner` dan `PageLoadingSpinner` untuk loading states.
- Menambahkan `optimizePackageImports` untuk lucide-react dan recharts di `next.config.ts`.
- Menambahkan lazy loading untuk komponen berat seperti recharts dan framer-motion.

### Changed
- Mengubah autentikasi klien dari cookie-based (`binahub_client_access`) menjadi Supabase Auth. Client Supabase user dibuat sebagai `client-{access_code_id}@binahub.local` dengan metadata yang berisi `access_code_id`, `organization_id`, dan `participant_id`.
- Mengubah `getClientAccess()` dan seluruh flow autentikasi klien agar menggunakan Supabase session alih-alih cookie.
- Mengubah `app-shell.tsx` untuk menggunakan `supabase.auth.signOut()` alih-alih penghapusan cookie manual.
- Mengubah halaman `/client/access` untuk menggunakan Supabase `setSession()` dengan notifikasi toast.
- Mengubah `binimpact/page.tsx` untuk membaca role dari Supabase session dengan timeout 5 detik dan spinner.
- Mengubah `client-auth-gate.tsx` untuk memeriksa `supabase.auth.getSession()` untuk role `client` atau `admin`.
- Mengubah viewport dan themeColor ke export terpisah di `layout.tsx`.
- Mengubah `use-transformation-data.ts` agar menghilangkan `setLoading(true)` dari `useEffect` body sesuai React 19 lint rules.
- Memperbarui seluruh hook data untuk menggunakan filtering berbasis peran pengguna.

### Removed
- Menghapus PWA support (service worker, manifest) yang menyebabkan error icon-192.png 404 dan chrome-extension errors.
- Menghapus dependency PWA dari `next.config.ts`.

### Fixed
- Memperbaiki viewport/themeColor yang sebelumnya menyebabkan warning di Next.js 16.
- Memperbaiki error autentikasi klien akibat `SameSite=lax` + `Secure` cookies yang tidak bekerja di `http://localhost:3000`.

### Notes
- Kode akses yang sudah ada (MASMINDO-A/B/C/D) sudah terhubung ke organization `PT Masmindo Dwi Area` dan participant masing-masing.
- Build output: 55 static pages, 0 errors (Next.js 16.2.6, Turbopack).

## [0.1.0] - 2026-06-18

### Added
- Menambahkan halaman dashboard admin, klien, dan fasilitator dengan RBAC berbasis role.
- Menambahkan modul manajemen program (engagement) lengkap dengan pembuatan, pengelolaan, dan transisi status.
- Menambahkan modul pencatatan evidence (catatan) dengan status review dan komentar.
- Menambahkan modul manajemen aksi tindak lanjut dengan assignment, status, dan bukti.
- Menambahkan modul kemampuan (capability) berbasis 4P dengan perhitungan otomatis.
- Menambahkan halaman bantuan terpisah untuk admin, klien, dan fasilitator.
- Menambahkan komponen UI bersama: StatusPill, ProgressBar, TrendIcon, EmptyState, FilterTabs, StatCard, Breadcrumb, Skeleton, ConfirmDialog, SearchInput.
- Menambahkan error boundary dan global error handler.
- Menambahkan ApiFetchBridge untuk mengarahkan semua fetch `/api/*` ke `https://api.binahub.id`.
- Menambahkan static export dengan `output: "export"` untuk deployment statis.
