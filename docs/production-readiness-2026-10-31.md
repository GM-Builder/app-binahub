# Pekerjaan kesiapan operasional BinaHub

Disetujui pemilik pada 31 Oktober 2026 setelah review lintas app, API, website,
AMS dan otomasi. Ini daftar implementasi, bukan pernyataan produksi sudah siap.
Setiap bagian membedakan kode, tes sintetis, deployment dan bukti produksi.

## Batas tetap

- Tidak mengubah instrumen/rubrik CEO, izin peserta, hasil historis atau harga
  yang sudah disahkan. Bobot tampilan 50:50 tetap sementara.
- Pembayaran, produk RM publik dan LE/WBR tetap tertutup sampai keputusan
  produk/komersial tersedia. PDF PETA individu/grup internal kini disetujui dan
  tersedia khusus admin; distribusi perusahaan/anonim tetap belum diaktifkan.
- Tidak mengirim email nyata, memakai kuota AI, mengaktifkan outreach, menerapkan
  SQL atau melakukan restore/cleanup produksi tanpa koordinasi khusus.
- Program nyata PFA2026 dan seluruh relasinya tidak disentuh.
- Tidak menganggap push/build sebagai bukti deployment atau email diterima.

## Urutan kerja dan bukti penyelesaian

| ID | Pekerjaan | Status awal | Bukti selesai yang diperlukan |
| --- | --- | --- | --- |
| R01 | Patch dependensi API dan AMS | Selesai kode/regresi: API0.47.3, AMS0.11.1/web0.10.2; produksi belum diverifikasi | Audit penuh/runtime0, lockfile dan build/regresi lulus; versi deployment perlu diverifikasi terpisah |
| R02 | Satu jalur deployment website, CI yang benar | Selesai lokal; deployment belum diverifikasi | Workflow non-destruktif, quality script tersedia, build Next sesuai konfigurasi Hostinger |
| R03 | Scheduler dan pemulihan seluruh antrean | Pro + Cron disetujui; aktivasi menunggu migrasi ke workspace BinaHub | Kontrak pemanggilan terautentikasi, retry terbatas, bukti heartbeat; migrasi dan Pro aktif pada tujuan diverifikasi |
| R04 | AI SPIN gagal → retry/needs-review, bukan selesai kosong | Kode dan regresi lokal selesai di API0.46.3; produksi belum diverifikasi | Jawaban/snapshot tetap, retry tidak menggandakan email; tes outage dan pulih |
| R05 | Minimisasi data AI lintas jalur | Selesai kode/proyeksi aktif API0.47.4/AMS0.11.2; pengecualian dicatat, produksi belum diverifikasi | Kontak terstruktur/pola dibatasi; CV/impor profil bertujuan khusus tetap memiliki data identitas; bukan anonim penuh |
| R06 | Kesiapan layanan dan alarm | Monitoring laporan API/admin selesai kode; alarm eksternal, AMS DB/antrean dan aktivasi scheduler belum | Liveness/readiness terpisah;4 antrean laporan dan heartbeat tampil; cakupan/unknown jelas, kanal alarm tetap perlu keputusan |
| R07 | Pagination/pencarian server, prioritas tugas admin | PETA selesai lokal; daftar lain menyusul | Data lama dapat ditemukan; total berasal dari server; tampilan mobile dan izin tetap benar |
| R08 | Meeting → draf proposal yang ditinjau | Berikutnya | Revisi meeting terpisah dari hasil klien; isi/harga dari sumber yang disahkan; tidak otomatis mengirim |
| R09 | PDF/catatan pendamping PETA individu | PDF individu/grup internal khusus admin selesai; catatan pendamping belum | App0.51.1/API0.47.2/SQL80; izin dan retensi diperiksa server; tidak ada distribusi perusahaan/anonim |
| R10 | Integrasi AMS, handoff, evaluasi dan pesanan ulang | Direncanakan | Bukti identitas/program, revoke/retry idempoten, pesanan ulang tidak disimpulkan dari label |
| R11 | Backup/restore dan baseline migrasi | Menunggu validasi operator | Pemulihan terisolasi DB + Storage + kunci; satu pemilik migrasi; tidak replay SQL lama |
| R12 | Produk berbayar individu | Menunggu CEO/gateway | Aturan/report/entitlement dan pembayaran sandbox lolos sebelum checkout aktif |

## Keputusan yang belum tersedia

Waktu migrasi ke workspace Vercel BinaHub dan aktivasi Pro/scheduler (arah Pro + Cron
sudah disetujui; akun tujuan belum dibuat); kanal/penerima alarm; aturan SJT RM per kompetensi dan
interpretasinya; keputusan akhir bobot, masa akses/retake/refund berbayar;
instrumen LE/WBR; ketentuan pajak/biaya tambahan/custom; format proposal custom
final; kebijakan pembagian laporan PETA ke pihak luar; standar layanan dan
indikator hasil program. Katalog SPIN31 dan izin penggunaan AI tidak ditanyakan ulang.

## Catatan pelaksanaan

Tambahkan hasil aktual per batch di bawah; jangan mengubah “menunggu” menjadi
“selesai” hanya karena kode tersedia. Rencana 22 Oktober tetap riwayat sumber,
bukan daftar status runtime terkini.

### Scheduler: kondisi yang dikonfirmasi pemilik

- n8n berada di laptop/komputer lokal, bukan server yang selalu aktif.
- API masih memakai paket Vercel Hobby. Jangan menambahkan jadwal per menit pada
  konfigurasi deployment aktif: paket tersebut menolak jadwal lebih dari harian.
- Keputusan pemilik: Pro + Vercel Cron disetujui setelah migrasi dari akun pribadi
  ke akun/workspace Vercel BinaHub. Akun tujuan belum dibuat; tidak melakukan
  upgrade akun pribadi, migrasi, pembelian atau aktivasi worker baru sekarang.
  n8n lokal tetap untuk uji. Pekerjaan kode dan regresi yang tidak bergantung pada
  migrasi tetap dapat dilanjutkan.
- Alternatif jika kelak memerlukan orkestrasi visual lintas layanan: n8n pada
  server selalu aktif, dengan pemilik operasi, backup dan monitoring yang jelas.
  Scheduler eksternal tidak mengubah batas penggunaan komersial paket Hobby.
- Jadwal retensi PETA tetap bulanan. Pekerjaan pemulihan antrean perlu jadwal
  berbeda; jangan menyamaratakan seluruh worker menjadi sebulan sekali.
- Detail dan urutan aktivasi: [rencana scheduler](worker-scheduler-plan.md).

### Batch 1: dependency API dan jalur build website

- API 0.46.2: Next/config ESLint 16.4.3, Zod 4.6.7, Vitest 4.1.12,
  Vite lini 8.1.6. Jimp yang tidak digunakan beserta plugin turunannya dihapus.
  Brace expansion dipatch per lini kompatibilitas, bukan override mayor global.
- Audit npm API penuh: dari 50 menjadi 16 peringatan moderat development;
  audit runtime (`--omit=dev`) menghasilkan 0 advisori pada 31 Oktober.
  Sisa development terkait [minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249)
  dan konsumen lint-nya. Belum ditutup: perlu migrasi kompatibel, bukan audit fix
  force atau penggantian API mayor yang membuat lint gagal.
- Regresi API sintetis: 807 lulus, 2 tes visual dilewati; tes live dan sumber
  privat tidak dijalankan. TypeScript lulus; lint lulus dengan satu peringatan
  `ProposalPDF` tidak dipakai yang sudah ada, tanpa perubahan template laporan.
- Build API Webpack juga berhasil dari snapshot source dan helper skrip, tanpa
  file .env dan dengan kredensial dummy Supabase/Resend. Perintah build produksi
  kini memakai bundler yang sama dengan verifikasi ini.
- Website 0.2.46: hapus dua workflow lama dan ganti satu quality workflow
  Node22/read-only. Tidak ada lagi upload out/ atau pembersihan direktori FTP.
  Integrasi Git Hostinger tetap jalur deployment; tidak mengubah izin akun.
- Website: quality (lint/types), handoff program, dua kontrak CI dan build
  berhasil; audit runtime 0 advisori. Tool development masih perlu batch lanjutan.
- CI API baru memakai tes sintetis dan dummy credential untuk build, bukan
  secret produksi. Kedua CI membangkitkan tipe Next sebelum pemeriksaan pada
  checkout baru. Branch protection/status check live belum diverifikasi.
- Ini pemeriksaan dependency dan regresi lokal, bukan hasil pentest Strix atau
  bukti tidak ada celah lain. AMS, retry SPIN dan worker belum dinyatakan selesai.

### Batch 2: retry SPIN, riwayat PETA dan status program

- API0.46.3: kegagalan provider/schema SPIN menunggu retry, bukan langsung menjadi
  laporan konsultasi generik yang dikirim seolah analisis berhasil. Tetap memakai
  backoff/limit percobaan SQL71 dan pemulihan admin SQL73; tidak mengaktifkan
  scheduler. Respons AI valid yang memang hanya mendukung konsultasi tetap sah.
- Regresi SPIN menguji outage, pemulihan, batas percobaan, respons tidak valid,
  dan satu pengiriman idempoten setelah pulih; bukan pengiriman email nyata.
- App0.50.1 + SQL78: daftar PETA aktif hanya modul/status relevan; program selesai
  pindah ke Riwayat program tanpa penghapusan atau perubahan izin/retensi.
  Pagination20 baris, pencarian/filter dan total server mengganti batas100 global.
- Regresi SQL memakai125 pengisian sintetis, menguji pencarian data lama,
  kepemilikan, grant backend-only serta hasil final identik sebelum/sesudah
  program selesai. Penghapusan program dengan workspace PETA ditolak sebelum
  tim kosong dihapus. Tidak menyentuh program nyata PFA2026.
- Status manual kini dipertahankan; aturan tanggal tetap berjalan pada program
  otomatis. Perbaiki label badge PETA/pre-test/post-test yang sebelumnya jatuh
  ke fallback T-BOS. Instruksi PETA menegaskan dua pernyataan yang berbeda.
- Pemilik melaporkan SQL78 berhasil dijalankan. Tidak ada env baru; build/push,
  verifikasi produksi dan status worker tetap dicatat terpisah.
- Uji app:394 unit/komponen lulus;14 skenario browser desktop/mobile lulus.
  Tinjauan visual mempertahankan tata letak operasional BinaHub; detector0 temuan.
  Lint mengabaikan artefak build lokal, bukan source. API:827 tes lulus/2 visual
  skip, dengan dua worker seperti CI dan mengecualikan tes live/private. Putaran
  paralel tanpa batas sempat kehabisan memori lokal; pengulangan terbatas lulus.
  Build produksi app/API dan pemeriksaan tipe lulus; lint API menyisakan satu
  warning ProposalPDF lama. Pemeriksaan ini bukan pentest Strix atau jaminan
  bebas kerentanan; deployment produksi belum diverifikasi.
- AMS yang sudah disiapkan, minimisasi prompt lintas fitur, alarm, PDF PETA dan
  pekerjaan lain tetap dilanjutkan per urutan, tidak dinyatakan selesai di batch ini.

### Batch 3: advisori minimatch pada app dan website

- App0.50.2 dan website0.2.47: seluruh jalur minimatch memakai paket registry
  resmi11.0.1 untuk CVE-2026-118764 / GHSA-g3hv-75wg-m249. Jalur yang ditemukan
  adalah tool lint development; dependency runtime aplikasi tidak berubah.
- Kompatibilitas callable plugin lama dijaga hanya pada proses lint, melalui
  facade atas matcher11. Tidak ada compiler regex lama, patch file node_modules,
  hook instalasi/build, penonaktifan rule atau penekanan advisori.
- Audit penuh dan runtime-only kedua repo menghasilkan0 advisori. npm ci,
  kontrak dependency, lint, build/TypeScript dan394 tes app lulus; kontrak
  handoff/workflow website juga lulus. CI kini memeriksa dependency development.
- Status16 peringatan development pada Batch1 adalah bukti historis API,
  bukan hasil audit terbaru app/website. Repo API/AMS tidak diubah pada batch ini.
- Tidak ada SQL/env, perubahan UI/skor, aktivasi scheduler atau data produksi.
  Verifikasi deployment Hostinger dan rescan tetap terpisah dari keberhasilan
  lokal/push. Detail: [patch minimatch](minimatch-security-patch-2026-10-31.md).

### Batch 4 - 2 November2026: tuntaskan R01 API/AMS

- API0.47.3 menutup16 peringatan development minimatch. Audit npm penuh dan
  runtime sama-sama0;859 regresi sintetis serta3 kontrak matcher lulus,2 tes
  visual existing dilewati. Lint/type/build lulus dengan satu warning lama
  ProposalPDF. Tidak mengubah logika runtime, hasil atau izin.
- AMS0.11.1/web0.10.2 menyelesaikan patch31Oktober yang masih belum dicommit,
  termasuk validasi Zod4 yang menjaga default CV dan record metadata file.
  Dependensi tooling tambahan ditambal; audit penuh/runtime9 menjadi0 advisori.
- 16 kontrak dependency/validasi/API, self-test fallback LapakVIP→OpenRouter,
  signed managed routing tanpa bypass, lint, tipe API dan build web/API lulus.
  Semua memakai data sintetis/mock, tidak memakai kuota AI atau data produksi.
- Versi pnpm proyek9.15.0 dipakai lewat Corepack; tidak mengganti pnpm global.
  Frozen lockfile lulus. CI baru mengaktifkan versi tepat, memeriksa advisori
  development dan menjalankan regresi/build tanpa secret produksi.
- Patch matcher memakai engine resmi, bukan menonaktifkan rule atau menekan
  advisori. FlatCompat Next15 memakai entry CommonJS yang didukung. Kontrak
  tooling Node dipisahkan dari penemuan tes Vitest API.
- Ini menutup pekerjaan kode R01, bukan bukti deployment. Tidak ada SQL/env,
  migrasi, email nyata, aktivasi scheduler atau perubahan program PFA2026.
  Tidak ada pentest Strix baru terhadap produksi; audit0 bukan klaim bebas celah.
- PDF PETA yang dikerjakan1November dicatat pada R09: individu dan grup internal
  khusus admin, hasil peserta tetap di layar. Catatan pendamping masih terpisah.
- Pekerjaan berikutnya R05: minimisasi data AI lintas jalur. R03 tetap menunggu
  migrasi Vercel BinaHub + Pro; R06 masih memerlukan keputusan kanal alarm.

### Batch 5 - 2 November2026: R05 batas data AI

- API0.47.4 memakai referensi identitas/kontak sementara per panggilan dan
  personalisasi lokal untuk diagnosis tim, proposal, korespondensi, lead,
  project/undangan dan chat. URL privat/pola kredensial dihapus, query/hash
  konteks chat tidak dikirim. Referensi rusak ditolak sebelum hasil diteruskan.
- Matching project dan AMS0.11.2 hanya memakai kualifikasi/ref sementara;
  nama/email/ID asli dipasang dari server. Evidence lead tidak menserialisasi
  record nested tak dikenal. Harga, skor deterministik dan alur kirim tetap.
- SPIN tetap proyeksi kebutuhan terkonfirmasi; wording PE tetap hanya anchor,
  tanpa identitas/konteks/jawaban/skor peserta. PETA tidak diubah.
- Pengecualian tercatat: parsing CV dan impor profil profesional masih dapat
  memerlukan identitas. Pola redaksi bukan DLP/anonymization: nama/alamat di teks
  bebas, format tersamarkan dan data dalam gambar tidak dijamin terhapus.
  Helper vision tidak ditemukan dipanggil pada source yang ditinjau; penggunaan
  baru perlu kontrak data sendiri. Kebijakan retensi provider belum diverifikasi.
- API:877 tes sintetis lulus/2 visual existing skip; AMS:4 tes privasi baru,
  16 kontrak dan self-test managed/fallback lulus. Tes memakai mock/loopback,
  bukan kuota AI, database produksi atau email nyata. Lint/types/build API dan
  build API/web AMS lulus; warning ProposalPDF lama tidak terkait patch ini.
- CI mencakup regresi baru. Tidak ada SQL/env baru, pembayaran aktif, perubahan
  izin/retensi atau aktivasi worker. R03 tetap menunggu migrasi Vercel + Pro.
- Scope teknis dan langkah verifikasi deployment ada pada dokumen
  `binahub-api/docs/ai-data-boundaries-2026-11-02.md` dan
  `binahub-platform/docs/AI-DATA-BOUNDARIES-2026-11-02.md`. Tidak ada pentest
  Strix baru; source/test/push bukan bukti deployment produksi telah memakai patch.
- Berikutnya R06: pisahkan bukti liveness/readiness dan visibilitas antrean;
  pengiriman alarm tetap menunggu kanal/penerima yang disetujui.

### Batch 6 - 2 November2026: monitoring laporan R06

- API0.47.5 / app0.51.2: liveness publik tidak mengklaim dependensi siap.
  Overview/readiness probe admin-only membaca4 antrean utama dan heartbeat terbaru,
  tanpa kontak, jawaban, ID peserta, hasil/PDF, pemanggilan AI atau pengiriman.
- SQL81 menambah ringkasan read-only dan satu baris aktivitas recovery terbaru;
  UUID run mencegah penyelesaian lama menimpa run baru. Pemilik melaporkan SQL81
  berhasil dijalankan. Belum ada inspeksi langsung data/runtime produksi.
- Catat pemanggilan endpoint recovery dan kegagalan parsial. Telemetry gagal
  tidak menghentikan recovery existing; overview tidak pernah memanggil worker.
  Proses gagal/uncertain tetap perlu rekonsiliasi, bukan otomatis dikirim ulang.
- Panel Operations existing mempertahankan identitas visual admin. Tabel desktop
  menjadi ringkasan per antrean di mobile; warning global dapat ditutup, dan
  perubahan bukti memunculkannya kembali. Bukti unavailable/stale tidak menjadi
  nol/hijau. Timeout, abort dan hasil terlambat diuji.
- AMS root0.11.3/web0.10.3 memperbaiki pembanding versi API0.10.1 yang usang dan
  mengoreksi klaim status publik menjadi pemeriksaan dasar. API AMS tetap0.11.2;
  database, antrean dan keberhasilan AI/email tidak dibuktikan halaman publik.
- Tidak ada env baru, aktivasi scheduler, outreach, email/WhatsApp alarm, perubahan
  instrumen/izin/retensi atau pemrosesan program PFA2026. Jadwal retensi PETA bulanan
  tetap terpisah; pemulihan rutin menunggu migrasi Vercel + Pro.
- Cakupan, semantik HEAD/GET, ambang dan langkah validasi deployment:
  `binahub-api/docs/service-health-2026-11-02.md`. Ini bukan pentest Strix.
- Bukti lokal:895 tes API lulus/2 visual existing skip,424 tes app lulus,
  3 kontrak status AMS dan10 pemeriksaan Chromium desktop/mobile lulus.
  Lint/types dan build API/app/web AMS lulus; satu warning ProposalPDF API lama
  tetap ada. Tidak ada tes provider berbayar atau login/pengisian produksi.
  Pemeriksaan visual mengikuti tampilan admin existing; detector0 temuan.
- R06 belum menutup monitoring resource hosting, DB/antrean AMS, workflow/event
  lain atau alarm eksternal. Infrastruktur/channel yang tertunda tidak menghalangi
  pekerjaan read-only/pagination R07 dan penyiapan proposal-review R08 berikutnya.
