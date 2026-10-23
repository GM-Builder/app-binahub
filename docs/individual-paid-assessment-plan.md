# Asesmen individu berbayar — fondasi tahap 1

Tanggal: **16 Oktober 2026**. Status: **rancangan, belum implementasi runtime**.

**Pembaruan penelaahan 21 Oktober:** paket CEO 20 Oktober menyediakan instrumen
PE V2 dengan 37 soal. Tiga gratis PE-02/04/06 tetap 18 soal; tiga tambahan
memuat 19 soal karena Integrity mendapat SJT ketiga. Saat implementasi lanjutan,
jumlah/item diturunkan dari manifest dan entitlement berversi, bukan konstanta
18 untuk paket tambahan. Definisi 26 kompetensi pada catatan lama telah
dilengkapi kamus 34, tetapi instrumen yang tersedia tetap enam PE. Harga,
gateway, merchant, retake dan masa akses belum ditetapkan oleh paket tersebut.
Laporan individu, template IDP dan email hasil individu dari chat 21 Oktober
kini tersedia. Template proposal indikatif tercantum pada shared chat; akses
lampiran dan penyelarasan jalur assessment individu masih perlu diselesaikan.
Urutan kerja aktif berada di
[rencana pengembangan](development-journey-work-plan.md).

Pembaruan: app **0.38.0** / API **0.37.0** / SQL **69** mengimplementasikan
persiapan internal: draft paket terversi, struktur data privat, dan daftar
transaksi admin. Bagian checkout, identitas pelanggan ber-scope, grant,
rekonsiliasi, refund, pengisian/laporan berbayar di bawah masih merupakan kontrak
untuk tahap berikutnya, bukan fitur yang sudah berjalan. Runbook terdapat di API
`docs/INDIVIDUAL-COMMERCE-FOUNDATION.md`. Pembayaran tetap tertutup.

Tahap ini menetapkan batas produk, pesanan, hak akses, keamanan, pengalaman
pengguna, dan kriteria penerimaan. Tidak memasang SDK gateway, membuat checkout
tiruan, menjalankan SQL, menagih uang, mengirim email, atau mengubah alur gratis.
Kontrak di bawah adalah usulan untuk tahap implementasi, bukan endpoint/tabel
yang sudah tersedia. Tidak ada nomor migrasi atau versi aplikasi baru.

## 1. Keputusan dan batas cakupan

Pengguna menyetujui menyiapkan fondasi terlebih dahulu. Jangan menafsirkan
persetujuan ini sebagai pengesahan harga atau kontrak merchant.

| Bagian | Rancangan tahap 1 | Status sebelum penjualan |
| --- | --- | --- |
| Gratis | Pertahankan PE-02/04/06, 18 pertanyaan, tanpa login/password | Existing, tidak diubah |
| Paket awal | Satu paket untuk tiga area PE tambahan, bukan per-area atau langganan | Usulan; cakupan final disahkan CEO |
| Identitas | Email terverifikasi, tautan privat/OTP, tanpa password | Perlu implementasi; sesi hasil existing bukan akun pelanggan |
| Pembeli | Satu orang membeli untuk dirinya sendiri | Usulan; hadiah, tim, kursi massal di luar rilis awal |
| Hak pengisian | Usulan satu pengisian final; resume draft tidak dihitung pengisian baru | Jumlah kesempatan/retake disahkan CEO |
| Harga | Belum ditentukan; jangan isi nol atau harga contoh sebagai harga jual | CEO: harga, pajak/biaya, total yang dibayar |
| Masa akses | Batas mulai, batas menyelesaikan, akses laporan, dan retensi adalah hal berbeda | CEO menetapkan kebijakan; jangan asumsikan unlimited |
| Laporan | Hanya area yang benar-benar diisi dan berhak diakses | Format/narasi komersial final menunggu CEO |
| Gateway | Satu gateway aktif pada rilis awal, hosted checkout | Keputusan CEO dan akun merchant belum ada |
| Pengembalian dana | Proses terlacak, bukan penghapusan transaksi | Kebijakan sebelum/sesudah penggunaan perlu keputusan |

Enam kompetensi dalam developer pack adalah **tiga gratis + tiga tambahan**,
bukan enam tambahan atau seluruh 26 kompetensi. Kode area tambahan diambil dari
manifest versi yang disahkan, bukan ditebak atau ditentukan AI. Judul paket
publik mengikuti nama yang disahkan CEO, terpisah dari SKU internal.

### Titik masuk dan hubungan dengan hasil gratis

- Titik masuk awal yang diusulkan: setelah peserta membuka hasil gratis.
- Paket membuka pengisian baru untuk area tambahan; hasil gratis tidak ditimpa.
- Usulan awal menghasilkan laporan area tambahan tersendiri. Jangan menjanjikan
  profil enam area seolah semuanya diukur pada waktu yang sama.
- Menggabungkan hasil gratis dan berbayar membutuhkan aturan versi, usia hasil,
  perubahan konteks, dan format laporan yang disahkan CEO. Hasil gabungan baru
  harus menyebut pengisian/tanggal sumber, bukan mengubah laporan lama.
- Pembelian langsung sebelum mengisi gratis dan pengisian lengkap 36 pertanyaan
  belum termasuk rilis awal usulan ini. Tetapkan varian paket/alur tersebut dulu
  jika CEO ingin mendukungnya; jangan menagih paket tiga area dengan janji enam.

### Batas aktivasi

Status penawaran tetap `draft` dengan harga belum ada. Publik tidak menerima
penawaran beli sampai cakupan, harga total, ketentuan, laporan, instrumen,
identitas, gateway, dan verifikasi akhir benar-benar siap. Tidak ada CTA bayar
disabled permanen, harga Rp0, placeholder, atau catatan persetujuan internal.
Selama tahap 1, halaman publik existing tidak berubah.

## 2. Temuan existing yang memengaruhi implementasi

| Bukti source | Dampak |
| --- | --- |
| API `src/lib/individual-assessment/delivery-contracts.ts` | Skema mematok tiga kode gratis, 18 jawaban, konteks tiga area dan hasil tiga area; jangan sekadar mengganti angka 18 menjadi 36 |
| API `src/lib/individual-assessment/delivery.ts` | Proyeksi definisi hanya mengirim soal gratis; paid projection harus memeriksa entitlement di server |
| API `supabase/migrations/0065_personal_effectiveness_delivery.sql` | Policy dan RPC menolak soal di luar hak gratis; perlu policy/RPC baru atau perluasan terversi yang menjaga kompatibilitas |
| API `0067_personal_effectiveness_guest_reports.sql` dan route hasil guest | Pemilik guest per pengisian, tautan sekali pakai, sesi hasil 30 menit dengan scope pengisian; bukan riwayat pelanggan |
| App `src/components/pe-email-result.tsx` | Token ditukar hanya setelah klik eksplisit; pola ini harus dipertahankan untuk tautan pembelian/akses |
| App `src/lib/pe-guest-sync.ts` dan storage | Resume existing adalah draft terenkripsi di perangkat, bukan pemulihan draft berbayar lintas perangkat |
| App `next.config.ts` | API rewrite same-origin sudah ada; CSP menolak script/frame pihak ketiga. Redirect hosted checkout lebih cocok sebagai arah awal daripada menambah iframe/SDK tanpa pemeriksaan |

Ketentuan existing berada dalam API
`docs/PERSONAL-EFFECTIVENESS-GUEST-REPORTS.md`; desain laporan existing di
[individual-assessment-ux.md](individual-assessment-ux.md). Jangan membuka
historical attempt dengan pencocokan email/nama atau mengubah instrumen immutable.

## 3. Kepemilikan dan identitas

`customer_id` stabil berbeda dari `owner_id` guest, UUID pesanan, dan ID transaksi
gateway. Gateway/billing bukan penyedia autentikasi hasil asesmen.

1. Pembelian baru memerlukan bukti penguasaan email yang tercatat server.
   Entry langsung menggunakan tautan privat/OTP. Respons permintaan tautan
   generik, dibatasi laju, dan tidak membocorkan keberadaan pelanggan/pesanan.
2. Sesi hasil yang valid boleh menjadi awal checkout untuk pengisian tersebut,
   melalui pertukaran scope eksplisit di backend. Ambil email tersimpan dari
   server, bukan email yang dikirim browser. Catat asal/batas waktu bukti akses.
3. Sesi hasil tidak otomatis memberikan akses seluruh riwayat pembelian dengan
   email sama. Akses riwayat pelanggan atau bukti yang tidak cukup baru memakai
   verifikasi khusus. Jangan memperluas scope cookie hasil existing diam-diam.
4. Menghubungkan pengisian gratis lama memerlukan bukti akses tiap pengisian
   yang diklaim. Penambahan `customer_id` tidak melakukan bulk backfill by email.
5. Tautan baru berbasis token acak, hash tersimpan, TTL terbatas, sekali pakai,
   dan tidak dikonsumsi GET/pemindai email. Scope checkout, recovery draft,
   riwayat, dan hasil dibedakan. TTL baru ditetapkan dalam review keamanan.
6. Session memakai Secure/HttpOnly/SameSite, scope route terbatas, pemeriksaan
   origin/CSRF untuk mutasi dan respons `private, no-store`. Token tidak masuk
   query analytics, referrer, log, localStorage plaintext atau metadata gateway.
7. Perubahan email pembeli harus diverifikasi dan diaudit; tidak mengalihkan
   akses hanya dengan mengganti alamat tagihan atau menerima webhook.

## 4. Model data konseptual

Nama berikut adalah usulan internal API/Supabase, bukan migrasi siap dijalankan.
Finalisasi field spesifik provider setelah gateway dipilih. Gunakan FK ke versi
instrumen/policy; jangan menyalin bank soal ke tabel transaksi.

| Entitas | Data minimum dan invariant |
| --- | --- |
| Pelanggan dan bukti identitas | ID stabil, email terverifikasi, waktu/metode verifikasi, sesi ber-scope; bukan akun/role admin otomatis |
| Revisi penawaran | SKU, nama publik, instrumen/policy/area, status draft/aktif/diarsipkan, harga IDR, aturan biaya/pajak, kesempatan, masa akses, versi ketentuan/laporan dan persetujuan |
| Pesanan | Pemilik, revisi penawaran, snapshot barang/harga/ketentuan, total, mata uang, kunci idempotensi dan hash permintaan, waktu pembuatan; tidak berisi jawaban/skor |
| Upaya pembayaran | Pesanan, provider + sandbox/production + merchant, reference unik, idempotency/request reference, status asli dan terpetakan, batas kedaluwarsa, waktu pemeriksaan |
| Event pembayaran | Identitas event/dedup, referensi upaya, bukti verifikasi, transisi, waktu penerimaan/pemrosesan; payload diminimalkan dan retensinya ditetapkan |
| Hak asesmen | Pemilik, order line, area/versi/policy, jumlah kesempatan, batas mulai/selesai, status dan relasi pengisian; grant unik per order line |
| Relasi pengisian | Hak asesmen ke pengisian baru, asal gratis opsional yang terbukti milik peserta, versi instrumen/laporan, waktu reservasi/submission; tidak memutasi hasil gratis |
| Antrean pekerjaan | Job kirim akses/bukti pembayaran/pemulihan, dedup key, status retry, waktu/lease; disimpan bersama perubahan bisnis, tidak hanya dalam memori request |
| Refund dan audit | Referensi transaksi asli, nominal kumulatif, alasan, aktor, status provider, efek hak akses dan catatan keputusan; jejak keuangan tidak dihapus |

Harga disimpan dalam bilangan bulat Rupiah untuk IDR, tidak memakai floating
point. API menghitung subtotal, biaya, pajak dan total dari aturan yang berlaku.
Jangan membulatkan atau menambah biaya tersembunyi sesudah checkout. Revisi
penawaran berubah dengan membuat versi baru; snapshot pesanan lama tetap utuh.
Satu order dapat memiliki beberapa upaya yang tercatat, tetapi tidak boleh
menghasilkan hak ganda bila lebih dari satu upaya terlanjur dibayar.

Tabel/RPC sensitif bukan akses publik Supabase. Kredensial server hanya di API
Vercel, tidak di Hostinger/browser. Admin penagihan tidak otomatis boleh membaca
jawaban; izin konsultasi/evaluasi existing tetap terpisah dari pembelian.

## 5. Siklus status dan konsistensi

Status adalah bahasa internal, bukan teks mentah yang ditampilkan ke peserta.

| Objek | Siklus yang dirancang |
| --- | --- |
| Penawaran | `draft` → `active` → `archived`; tidak mengubah kontrak order existing |
| Upaya pembayaran | `creating` → `pending` → `succeeded` / `failed` / `expired` / `cancelled`; timeout memakai status pemeriksaan `unknown`, bukan langsung dianggap gagal |
| Pesanan | Menunggu → dibayar → refund sebagian/penuh jika relevan; status pesanan berasal dari transaksi terverifikasi, bukan redirect |
| Hak asesmen | `available` → `in_progress` → `completed`; dapat `expired` / `suspended` / `revoked` hanya dengan alasan/kebijakan tercatat |
| Pengisian | `draft` → `submitted`; reload/resume tidak membuat attempt baru; submission final idempotent |
| Job email | Menunggu → diproses → diterima provider / perlu pemeriksaan / gagal; diterima provider bukan jaminan masuk inbox |

- Reservasi hak dan pembuatan pengisian harus satu transaksi. Mulai bersamaan
  dari dua tab mengembalikan pengisian yang sama, bukan menghabiskan dua hak.
- Submission membekukan snapshot dan menyelesaikan penggunaan hak secara atomik.
  Ketidakcukupan bukti/NA mengikuti CEO; pembayaran bukan jaminan skor tertentu.
- Callback sukses yang sah, validasi jumlah/mata uang/order/merchant/environment,
  pembaruan pembayaran, grant hak unik dan pembuatan job diselesaikan secara
  atomik atau melalui event durable dengan retry idempotent. Webhook diakui
  setelah penerimaan tersimpan; pekerjaan lambat tidak menahan respons callback.
- Notifikasi lama `pending` tidak boleh menurunkan `succeeded`. Cocokkan status
  tak berurutan terhadap API provider; refund/dispute adalah event terpisah.
- Timeout membuat checkout: periksa upaya existing dengan referensi yang sama.
  Jangan membuat charge/order baru atau pindah gateway otomatis untuk menebak
  apakah upaya lama berhasil. Klik ulang menggunakan idempotency key yang sama;
  key sama dengan payload berbeda ditolak sebagai konflik.
- Pembayaran terlambat setelah expiry tetap dicatat. Jangan membuang uang masuk;
  penuhi kontrak yang masih dapat dipenuhi atau masuk pengecualian refund.
- Dua pembayaran berhasil untuk satu pesanan: hak tetap satu; tandai kelebihan
  bayar untuk penanganan terkontrol, bukan menambah hak/charge otomatis.
- Refund baru final setelah dikonfirmasi provider; nominal kumulatif tidak
  melebihi pembayaran. Perlakuan akses setelah mulai/selesai menunggu kebijakan
  CEO. Tidak otomatis menghapus hasil atau jejak audit.
- Rekonsiliasi backend memeriksa transaksi pending/unknown dan memperbaiki
  grant/job yang tertinggal. Harus ada scheduler yang benar-benar terpasang,
  bukan menganggap endpoint worker atau n8n lokal pasti berjalan.
- Perubahan gateway berlaku untuk pesanan baru. Callback, pemeriksaan, dan
  refund pesanan lama tetap memakai provider dan merchant asal.

Status `succeeded` untuk fulfillment tidak sama dengan dana sudah cair ke rekening
BinaHub. Payout/settlement operasional ditampilkan terpisah bila diperlukan.

## 6. Kontrak API yang akan dibangun

Prefix usulan: `/api/assessment/individual/commerce`. Semua **belum tersedia**.
Respons publik tidak membawa kunci scoring, soal terkunci, token gateway rahasia,
payload webhook, email lengkap milik pihak lain, atau catatan operasional internal.

| Operasi usulan | Syarat dan janji |
| --- | --- |
| `GET /offers` | Hanya penawaran aktif/siap dengan nama publik, cakupan dan total/ketentuan yang jujur; draft tidak dipublikasikan |
| `POST /access/request` dan `/access/exchange` | Respons request generik; token dikonsumsi melalui tindakan eksplisit; scope/TTL, rate limit dan origin diperiksa |
| Bootstrap dari sesi hasil gratis | Endpoint di scope guest existing membaca sesi hasil dan email tersimpan; menghasilkan akses checkout terbatas, tidak membuka riwayat pelanggan |
| `POST /orders` | Identitas terverifikasi + revisi penawaran + sumber gratis berizin jika dibutuhkan + versi ketentuan; harga dihitung server, idempotent |
| `POST /orders/{id}/checkout` | Pemilik sah, belum dibayar dan penawaran snapshot masih dapat dipenuhi; gunakan real adapter terpilih, bukan fallback mock |
| `GET /orders/{id}` | Pemilik ber-scope; status pembayaran dan akses dipisah, tanpa efek samping menagih/grant dari query browser |
| `POST /orders/{id}/reconcile` | Pemeriksaan ulang server terautentikasi dan rate-limited; tidak menerima instruksi `markPaid` dari pengguna/admin UI |
| `POST /entitlements/{id}/attempt` | Pemilik sah, hak berlaku, consent asesmen sesuai versi, reservasi atomik; hanya soal yang diizinkan yang dikirim |
| Route simpan/submit/report berbayar | Otorisasi hak di server pada setiap operasi; revision conflict, kelengkapan, NA, immutability dan hak lintas perangkat diperiksa |
| Webhook khusus provider | Autentikasi/signature mengikuti dokumentasi provider yang dipilih, bukan cookie pelanggan; verifikasi referensi/jumlah/status, dedup durable dan rekonsiliasi |

Paid delivery memakai policy/version baru dengan skema konteks/result yang sesuai
area yang diizinkan. Jangan melebarkan `PE_FREE_CODES` global, membocorkan full
manifest, atau menghapus penolakan `PE_ENTITLEMENT_REQUIRED` pada jalur gratis.
Tidak memasang dependency/SDK atau membuat adapter pura-pura pada tahap ini.

## 7. UX, admin dan data

Kontrak layar, teks, gangguan dan pemulihan berada di
[individual-paid-assessment-ux.md](individual-paid-assessment-ux.md).

- Peserta: lihat paket → konfirmasi email bila perlu → checkout → akses otomatis.
  Kelanjutan tidak bergantung pada tab tetap terbuka atau admin menekan setuju.
- Admin: satu halaman transaksi dengan filter/action kontekstual, bukan urutan
  pengaturan harian. Kesiapan produk disiapkan sekali; penjualan normal otomatis.
- Kontak, consent peninjauan, consent evaluasi dan consent marketing berbeda.
  Membayar tidak otomatis memberi izin ekspor evaluasi atau pemasaran.
- Penghapusan asesmen dan retensi rekam keuangan dipisahkan. Jangan menjanjikan
  penghapusan seluruh bukti transaksi dengan tombol hapus pengisian. Masa
  retensi finansial, minimisasi identitas, serta prosedur penghapusan ditetapkan
  dengan penanggung jawab data sebelum produksi; dokumen ini bukan nasihat hukum.
- Gateway hanya menerima nomor order/produk dan data penagihan minimum yang
  diwajibkan, tidak menerima skor, jawaban, CV, atau konteks asesmen.

## 8. Urutan implementasi setelah tahap rancangan

1. CEO menetapkan cakupan/harga/ketentuan/laporan dan memilih satu gateway.
   Periksa merchant, metode, biaya, payout/refund, dukungan dan ketentuan datanya.
2. Siapkan sandbox resmi. Baca dokumentasi gateway terpilih sebelum menetapkan
   adapter, field vendor, SDK, notifikasi, status sukses dan kontrak refund.
3. API: identitas/scope → revisi penawaran → order/payment/event → hak/pengisian
   → outbox/rekonsiliasi; migrasi disediakan untuk dijalankan pengguna seperti
   kebiasaan sebelumnya. Baca panduan Next yang terpasang sebelum menulis kode.
4. App: terapkan kontrak UX dengan API nyata; website cukup entry point. AMS
   tidak membutuhkan jawaban/pembayaran individu secara otomatis.
5. Jalankan tes sandbox lintas lapisan dan regresi gratis; periksa scheduler,
   email, cookie/rewrite, webhook dan pemulihan, bukan UI mock saja.
6. Uji pembayaran nyata kecil hanya setelah otorisasi eksplisit, lalu aktivasi
   satu penawaran dari admin. Operasi harian tanpa toggle env Vercel.

## 9. Matriks penerimaan sebelum uang nyata

Daftar berikut **rencana tes, belum dieksekusi** karena implementasi/gateway belum
ada. Tes unit atau fixture saja bukan bukti integrasi pembayaran produksi.

| Skenario | Hasil yang wajib dibuktikan |
| --- | --- |
| Penawaran draft/harga/ketentuan kosong | Tidak tampil sebagai barang siap dibeli; order ditolak server |
| Email salah/tautan kedaluwarsa | Dapat memperbaiki/meminta tautan; tidak ada kebocoran keberadaan pelanggan |
| Email/UUID pesanan orang lain | Tidak membuka pesanan, jawaban, hasil atau hak |
| Sesi hasil pengisian A | Tidak otomatis membuka pengisian B/riwayat pelanggan dengan email yang sama |
| Pemindai email membuka GET | Tidak menghabiskan token, membuat pesanan, atau menagih |
| Klik beli berulang / dua tab | Order/upaya existing dipakai ulang sesuai idempotency; tidak ada charge ganda |
| Harga diubah di browser | Total tetap berasal dari snapshot server atau permintaan ditolak |
| Harga diperbarui admin | Pesanan existing mempertahankan harga/ketentuan semula |
| Redirect sukses palsu | Akses tetap terkunci sampai pembayaran terverifikasi |
| Signature/merchant/environment/jumlah salah | Tidak grant hak; dicatat aman dan dapat diinvestigasi |
| Webhook berulang/tidak berurutan | Satu grant/job, tidak turun dari sukses menjadi pending |
| Backend timeout setelah membuat transaksi | Periksa referensi existing; jangan otomatis membuat charge lain |
| Browser ditutup / webhook terlambat | Backend tetap mencatat pembayaran, grant, antrean akses dan recovery |
| Bayar ketika order dianggap kedaluwarsa | Pembayaran tetap dicatat; pemenuhan/refund dapat ditelusuri |
| Dua upaya sama-sama dibayar | Satu hak, kelebihan bayar masuk pengecualian terkontrol |
| Gagal di tengah grant/job | Retry memulihkan konsistensi tanpa hak/email ganda |
| Email gagal/uncertain | Hak tidak hilang; tampilkan akses dan kirim ulang melalui dedup/status yang aman |
| Mulai/resume di dua perangkat | Satu pengisian/reservasi; konflik jawaban ditangani tanpa overwrite diam-diam |
| Submit berulang / respons hilang | Satu snapshot final dan penggunaan hak, key yang sama dapat dicoba ulang |
| Jawaban NA / bukti kurang / skor nol | NA bukan nol, SR/SJT terpisah, tidak menjanjikan kelulusan |
| Refund / dispute / akses sudah dipakai | Status dan keputusan terlacak; tidak menghapus bukti pembayaran |
| Penghapusan asesmen / retensi | Jawaban dihapus sesuai scope; hak terpakai tidak otomatis menjadi retake dan audit finansial tetap sesuai kebijakan |
| Gateway berganti | Transaksi/refund lama tetap ke provider asal; tidak otomatis menagih ulang |
| Regresi gratis/admin existing | 18 soal, autosave non-blocking, tautan privat, izin, dan laporan gratis tetap benar |
| Ponsel/keyboard/pembaca layar | Satu aksi utama, nominal/status terbaca, tanpa overflow, feedback dan recovery dapat diakses |

## 10. Bukti tahap 1 dan referensi

Tahap 1 selesai sebagai spesifikasi: batas produk, keputusan pending, model
konseptual, kepemilikan, siklus status, kontrak API/UX, peta perubahan source dan
matriks penerimaan tersedia. Bukan klaim pembayaran/hak berbayar sudah berjalan.
Tidak ada SQL, secret, versi runtime, environment, akun merchant, atau data nyata
yang diubah. Pemeriksaan tahap ini hanya konsistensi dokumen dan referensi lokal.

Referensi resmi pola integrasi, bukan pengesahan vendor atau harga:

- [Midtrans Snap: backend → hosted checkout → notifikasi](https://docs.midtrans.com/docs/snap-snap-integration-guide).
- [Midtrans: verifikasi, idempotensi dan pemeriksaan status](https://docs.midtrans.com/docs/https-notification-webhooks).
- [Xendit: sesi dari server, hosted checkout dan hasil melalui webhook](https://docs.xendit.co/apidocs/create-session).
- [OWASP: token pemulihan dan pencegahan kebocoran akun](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).
