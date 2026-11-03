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
| R07 | Pagination/pencarian server, prioritas tugas admin | PETA, rekomendasi, diagnosis tim/org, inquiry, Kontak & Leads, pipeline dan prioritas CRM selesai kode; arsip konsultasi/kampanye dan AMS masih ditinjau | Data lama dapat ditemukan; total berasal dari server; tampilan mobile dan izin tetap benar |
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

### Batch7 - 2 November2026: standar PDF lintas produk

- API0.47.6 dan AMS root0.11.4/web0.10.4 menyelaraskan PDF diagnosis organisasi,
  proposal, rekomendasi, T-BOS, kuesioner program dan CV dengan identitas cetak
  PETA: logo asli, font lokal, margin, hierarki, pemisahan halaman dan footer.
- PDF PETA tetap hanya untuk admin. Skor, laporan sumber, izin, katalog/harga
  dan arsip lampiran yang sudah dibekukan tidak diubah. Tidak ada SQL/env baru.
- Dua contoh baru memakai fixture sintetis: T-BOS3 tim/30 anggota dan diagnosis
  organisasi49 pertanyaan. Keduanya tidak memanggil AI/email atau data produksi.

### Batch8 - 2 November2026: R07 inbox kebutuhan program

- App0.51.3/API0.47.7 menutup cacat jalur cadangan inbox rekomendasi: sebelumnya
  pencarian hanya memfilter20 record yang sudah dimuat, meski total seluruh arsip.
  Kini filter kontak dijalankan server sebelum hitung total dan pilih halaman.
  Primary inbox meeting tetap RPC existing, mencakup checklist admin.
- Karakter khusus dicari sebagai teks literal, bukan pola regex atau ekspresi
  filter. Batas150 karakter/20 record, auth/rate limit, submitted-only dan DTO
  ringkas tetap. Tidak mengirim jawaban atau laporan dalam respons daftar.
- Jumlah/rentang/halaman jelas; pencarian kembali ke halaman pertama. Request lama
  dibatalkan/diabaikan, timeout20 detik dan retry tersedia. Catatan meeting tidak
  di-remount saat retry daftar. Halaman di luar rentang pulih setelah data berubah.
- Daftar dibatasi tinggi agar pagination dan detail tetap dekat pada desktop/mobile.
  Styling admin existing dipertahankan. Error tidak menampilkan hasil lama atau
  nol sehat. API lama yang belum mendukung pencarian arsip ditolak secara jelas.
- Deploy API sebelum app. Tidak ada SQL/env baru, scheduler, pengiriman,
  perubahan instrumen/skor/izin/retensi, atau pemrosesan program PFA2026.
- R07 belum mencakup seluruh daftar diagnosis, inquiry, CRM dan AMS; jangan
  menandai audit pagination lintas sistem selesai. R03 tetap ditunda sesuai
  permintaan pemilik sampai migrasi Vercel BinaHub + Pro.
- Bukti lokal:924 tes API lulus/2 visual existing skip; suite app434 lulus,
  lalu11 regresi inbox final lulus termasuk transport yang mengabaikan abort.
  Lint/types/build kedua repo serta18 pemeriksaan Chromium desktop/390/320px
  lulus. Detector tidak menemukan masalah; batas visual diperiksa dalam dua
  putaran. Ini bukan bukti runtime produksi atau pentest Strix.

### Batch9 - 2 November2026: R07 diagnosis tim/organisasi

- App0.51.4/API0.47.8: halaman utama diagnosis tidak lagi menunggu payload
  dashboard umum. Inbox server juga dipakai dari workspace penjualan dan entry
  admin lama. Daftar20 record; detail satu klien dibaca terpisah dan baru
  memuat jawaban/narasi/rekomendasi. Normalizer existing dipakai bersama.
- SQL82 melakukan pencarian literal, filter kategori/ukuran/skor/antrean dan
  pengurutan sebelum pagination. Hitungan kartu mengikuti semua filter kecuali
  pilihan antrean; opsi kategori/ukuran berasal dari seluruh arsip. Fungsi lain
  hanya mengirim49 hitungan agregat saat bagian pola jawaban dibuka.
- SQL82 tidak menulis jawaban/skor/laporan, tidak mengirim atau memproses antrean.
  Fungsi dibatasi service_role; API memeriksa admin, rate limit, input, no-store
  dan error aman. Pemilik melaporkan SQL82 berhasil dijalankan. Tidak ada env baru.
- Query/rentang/total jelas, perubahan dan penghapusan filter kembali halaman1,
  error berbeda dari kosong, timeout20detik, abort/late-response guard dan retry
  list/detail terpisah. Filter dipertahankan saat error; CSV menyebut cakupan
  halaman aktif. Di mobile daftar/detail bergantian, bukan ditumpuk.
- Proposal/PDF/email/follow-up tetap memakai aksi existing dengan konfirmasi.
  Refresh server30detik hanya saat proses terlihat dan tidak sedang meninjau
  konfirmasi/menyusun draf. Tidak ada kirim otomatis akibat membuka daftar/tab.
- Bukti lokal:956 tes API lulus/2 visual existing skip; suite app450 lulus,
  termasuk15 regresi inbox final.32 pemeriksaan Chromium pada1440/1024/
  390/320px lulus (API dimock, seluruh aksi mutasi diblokir), termasuk pencarian
  arsip, filter, konfirmasi, gagal/pulih/kosong. SQL diuji pada lebih1000 record
  sintetis dengan PostgreSQL in-memory. Lint/types dan build lulus; detector0.
- Ini bukan bukti runtime/izin/deployment produksi atau pentest Strix. R07 belum
  menutup inquiry/CRM/AMS dan prioritas lintas sistem. R03 scheduler tetap ditunda
  sampai migrasi Vercel BinaHub+Pro; tidak ada aktivitas program PFA2026.

### Batch 10 - 3 November 2026: R07 inbox Inquiry

- App 0.51.5/API 0.47.9 memisahkan halaman Inquiry dari dashboard yang dibatasi
  100 data. Pencarian literal mencakup nama/email/WhatsApp/pesan/sumber/status di
  seluruh arsip, sebelum filter dan pagination 20 baris. Ringkasan mengikuti
  filter; opsi sumber/status mencakup seluruh arsip. Entry penjualan/admin lama
  juga memakai reader baru, tetapi ringkasan prioritas CRM lain belum dirombak.
- SQL83 adalah fungsi baca service_role-only dan indeks urutan waktu/ID.
  Pemilik melaporkan berhasil dijalankan. Tidak ada env baru. Daftar mengirim
  pratinjau pesan maksimal 500 karakter, bukan catatan/draf/modul lengkap.
  Detail lengkap hanya dimuat untuk satu ID yang dibuka; admin/rate limit/input
  diperiksa server. Error tidak membuka diagnostik database atau menjadi nol.
- UI membedakan loading, kosong dan gagal; timeout 20 detik, stale/late-response
  guard, retry list/detail terpisah, reset halaman saat filter berubah, dan
  pemulihan halaman di luar rentang. Draft/catatan lokal tidak di-remount saat
  refresh/retry; penutupan dengan perubahan meminta konfirmasi. Perlindungan
  ini bukan penyimpanan draft permanen atau penguncian edit lintas admin.
- Konfirmasi kirim dan review manusia tetap wajib. Fokus drawer ditangguhkan
  selama dialog konfirmasi agar keyboard tidak ditangkap dua dialog. Indikator
  due menyamai status penghentian/jeda serta aturan 2/7/14 hari existing; bukan
  bukti worker aktif atau izin melewati kebijakan pengiriman.
- Bukti lokal: 986 tes API lulus/2 visual existing skip; suite app 463 lulus,
  disusul 22 regresi terarah final termasuk trim balasan. Lint/types dan build
  app/API lulus. SQL diuji dengan lebih 1.000 record sintetis;
  40 pemeriksaan Chromium pada 1440/1024/390/320px lulus memakai API mock dan
  seluruh mutasi diblokir. Detector tidak menemukan masalah. Bukti ini bukan
  runtime produksi, provider delivery, pentest Strix atau jaminan tanpa celah.
- Deploy API sebelum app. Tidak mengubah instrumen/skor/izin/retensi/harga,
  menjalankan AI/email/cleanup/SQL produksi, atau menyentuh PFA2026. Scheduler
  tetap ditunda sampai migrasi workspace Vercel BinaHub + Pro. R07 CRM/AMS dan
  R08 meeting → draf proposal masih menjadi pekerjaan berikutnya.

### Batch 11 - 3 November 2026: R07 Kontak & Leads

- App 0.51.6/API 0.47.10: halaman Kontak & Leads tidak menunggu dashboard umum
  atau subset 100 inquiry. Reader yang sama dipakai pada entry admin lama.
  SQL84 menyusun proyeksi baca gabungan dari lead, inquiry, coach dan karyawan,
  lalu mencari/filter/menghitung sebelum pagination 20 baris. Detail satu kontak
  dibaca terpisah; daftar tidak mengirim notes/message atau row sumber penuh.
- Identitas email dinormalisasi trim/case; telepon digit dipakai hanya jika
  email tidak tersedia, lalu fallback jenis+ID. Ini mempertahankan arah merge
  existing, bukan identity resolution transitive atau jaminan orang unik:
  shared mailbox tetap dapat tampil bersama. Tidak ada penggabungan permanen
  atau penghapusan sumber. Lead diutamakan; urutan/representatif timestamp+ID
  deterministik. UUID sama pada jenis berbeda tidak membuka atau menulis salah
  sumber. Konteks inquiry didahulukan untuk lead yang tergabung; notes lead
  tetap milik lead, tidak diisi dari notes sumber sekunder.
- Status ditampilkan dari data tersimpan, bukan kata 'proposal/client' dalam
  notes atau umur kontak. Penyimpanan notes tanpa perubahan status menghilangkan
  field status dari PATCH; nilai status eksplisit tetap divalidasi enum server.
  UI mencatat pilihan status eksplisit dan mereset penandanya sesudah sukses,
  sehingga refresh/perubahan status eksternal tidak otomatis dipulihkan ke nilai
  lama. Ini bukan concurrency lock untuk notes atau transisi pipeline baru.
- Loading, gagal dan kosong terpisah; timeout 20 detik, cancellation/late-response
  guard, retry list/detail, filter tetap dan halaman di luar rentang pulih.
  Notes lokal bertahan saat refresh gagal; tutup/reload memperingatkan perubahan
  belum tersimpan. Kontak referensi tetap baca-saja; hanya lead dapat diedit.
- Pemilik mengonfirmasi SQL84 berhasil. Fungsi baca service_role-only dan API
  admin/rate limit/validasi/no-store dipertahankan; tidak ada env baru. Tidak
  menjalankan AI/email/outreach, scheduler, cleanup atau mutasi program PFA2026;
  skor, instrumen, izin peserta dan retensi tidak berubah.
- Bukti lokal: 1.021 tes API lulus/2 visual existing skip; 479 tes app lulus,
  termasuk 17 tes kontak terarah. SQL in-memory diuji dengan lebih 1.000 data
  sintetis. 44 pemeriksaan Chromium 1440/1024/390/320px lulus dengan API mock,
  semua writes/jaringan eksternal diblokir; detector 0. Ini bukan bukti produksi,
  provider delivery, pentest Strix, atau pernyataan seluruh R07 selesai.
- Lint, pemeriksaan tipe dan build produksi app/API lulus. Putaran konfirmasi
  browser terakhir juga lulus; tidak ada pengiriman atau pengujian produksi.
- Deploy API dahulu, lalu app. Pipeline/prioritas CRM dan AMS masih berikutnya;
  scheduler tetap ditunda sampai migrasi workspace Vercel BinaHub + Pro.

### Batch 12 - 3 November 2026: R07 Pipeline penjualan

- App 0.51.7/API 0.47.11: entry utama pipeline terpisah dari dashboard umum;
  embedded dan entry admin lama memakai reader yang sama. SQL85 mencari/filter
  seluruh arsip sebelum pagination 20 baris, nilai/total per tahap dan sorting
  deterministik. Ringkasan atas mencakup semua peluang aktif setelah opsi data
  uji; total tahap mengikuti filter, bukan banyak kartu pada halaman ini.
- Aturan perhatian/overdue/owner kosong, hot, tenggat satu hari dan data uji
  existing dipertahankan. Tahap kosong legacy menjadi identified; tahap tak
  dikenal tetap pada Perlu ditinjau. Angka bukan konversi atau peringkat AI.
- Detail dibaca terpisah untuk satu UUID sebelum edit; riwayat perubahan peluang
  dipaginasi 20 aktivitas. Jumlah diagnosis/konsultasi/akun dihitung dengan ID
  relasi, bukan shared email. Riwayat tidak menyatakan seluruh perjalanan klien
  termuat; menu sumber tetap menjadi tempat membaca konteks lengkap.
- Filter dipertahankan saat gagal; loading/kosong/unavailable berbeda. Read punya
  timeout 20 detik dan cancellation/late-response guard, retry serta page clamp.
  Form edit tidak ditimpa saat paging riwayat atau refresh list. Tutup/reload dan
  navigasi workspace memperingatkan perubahan belum disimpan. Ini bukan draft
  permanen atau concurrency lock lintas admin. PATCH peluang tidak diubah.
- Fokus drawer tetap berada di dalamnya saat kontrol async dinonaktifkan dan
  kembali ke pemicu setelah tutup. Timer autofocus dibatalkan saat unmount.
  Prioritas CRM kini membuka peluang yang dipilih, tetapi perhitungan prioritas
  lintas inquiry/proposal masih memakai cakupan dashboard; belum selesai batch ini.
- Pemilik mengonfirmasi SQL85 berhasil. Fungsi read service_role-only, autentikasi,
  rate limit, parameter validation/no-store serta error aman diuji; tidak ada env
  baru. Tidak menjalankan SQL/AI/email/outreach/cleanup produksi, mengubah skor,
  instrumen/izin/retensi, atau menyentuh program PFA2026. Scheduler tetap pending.
- Bukti lokal: 1.055 tes API lulus/2 visual existing skip; suite app 494 lulus,
  disusul lima tes integrasi workspace penjualan lulus termasuk pemilihan ID dan
  perlindungan edit peluang yang belum tersimpan.
  SQL diuji pada >1.000 peluang sintetis; 48 pemeriksaan Chromium pada
  1440/1024/390/320px lulus dengan API mock dan semua writes/jaringan luar diblokir.
  Ini bukan bukti runtime produksi, provider delivery, pentest Strix atau seluruh
  R07 selesai. Build produksi, lint dan tipe app/API lulus; detector UI 0 temuan.
- Deploy API sebelum app. Batch berikutnya: prioritas CRM lintas sumber,
  kemudian sisa pagination/integrasi AMS sesuai daftar kesiapan.

### Batch 13 - 3 November 2026: R07 prioritas CRM lintas sumber

- App 0.51.8/API 0.47.12: entry utama Akuisisi & penjualan tidak menunggu
  dashboard umum. SQL86 memproyeksikan tugas dari seluruh inquiry, diagnosis
  tim/org/proposal dan peluang lewat tenggat sebelum search/filter/pagination
  20 tugas. Ringkasan seluruh arsip terpisah dari filter daftar; bukan jumlah
  orang unik, performa kampanye atau seluruh pekerjaan admin/discovery.
- Urutan proposal review/rekonsiliasi, balasan awal, hasil belum tercatat,
  peluang lewat tenggat lalu reminder dipertahankan. Satu tindakan utama per
  diagnosis; source-qualified ID dan tujuan detail mencegah tab/jenis ID salah.
  Pengiriman hasil yang belum tercatat tetap tugas periksa hasil, bukan reminder.
  Balasan berstatus sent tanpa timestamp diarahkan untuk diperiksa, bukan
  disimpulkan belum dikirim. Tidak ada perubahan status saat membaca.
- Reminder memakai 2/7/14 hari dari delivery awal (proposal satu reminder), jeda,
  closed/handled status, booking requested/confirmed/rescheduled, completed
  legacy, event/claim cap tiga pesan, klaim next channel/level dan suppression.
  Pencocokan ID relasi ditambah penghentian email nonkosong trim/case existing
  yang konservatif; shared mailbox dapat membuat task tidak ditawarkan. Ini
  tidak menggabungkan identitas atau mengubah policy sending. API tetap mengecek
  settings/jam kerja/template/approval/claim sebelum aksi nyata. Antrean bukan
  izin kirim, bukti worker aktif atau kepastian semua kegiatan telah selesai.
- Detail tetap reader inquiry/diagnosis/pipeline yang ada; draf inquiry dan
  form peluang/checklist meeting tetap dilindungi saat keluar. Tab konsultasi
  entry utama mengarahkan ke halaman sumber existing; arsip konsultasi di sana
  masih memakai cap dashboard dan perlu batch tersendiri. Entry legacy dengan
  payload booking tetap dapat menampilkannya inline. Tidak memuat semua data
  dashboard hanya untuk mengisi ringkasan prioritas.
- Loading/error/missing migration/empty dibedakan, tanpa stale action atau nol
  palsu; timeout 20 detik, cancellation/late-response guard, page reset/clamp,
  serta retry. SQL86/endpoint read-only service_role/admin/rate-limit/no-store.
  DTO tidak memuat form/answers/report narrative, reply body atau proposal draft.
- Bukti lokal: 1.083 tes API lulus/2 visual existing skip, 511 tes app lulus;
  SQL terisolasi dengan >1.000 data sintetis; 44 pemeriksaan Chromium pada
  1440/1024/390/320px lulus dengan API mock serta writes/jaringan luar diblokir.
  Detector UI 0 temuan; build produksi, lint dan tipe app/API lulus. Pemilik
  mengonfirmasi SQL86 berhasil dijalankan pada 3 November 2026.
  Ini bukan runtime produksi, delivery provider atau pentest Strix.
- Tidak menjalankan SQL produksi, AI/email/outreach/scheduler/cleanup, mengubah
  instrumen/skor/izin/retensi/harga, atau menyentuh PFA2026. Scheduler tetap
  ditunda sampai migrasi workspace Vercel BinaHub + Pro. Deploy API sebelum app
  setelah operator mengonfirmasi SQL86; tidak ada env baru.
