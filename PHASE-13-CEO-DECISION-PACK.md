# Fase 13 — CEO Decision Pack dan Panduan Pembahasan

> Dokumen ini dipertahankan sebagai referensi lengkap. Untuk review CEO yang lebih ringkas dan sudah berisi rekomendasi awal, gunakan `PHASE-17-CEO-REVIEW-DRAFT.md` beserta lampiran `PHASE-17-EMAIL-TEMPLATE-REVIEW.md`.

Tanggal disiapkan: 1 September 2026  
Status: **menunggu keputusan bisnis; automation tetap dry-run dan inactive**

## Tujuan Dokumen

Dokumen ini mempunyai dua fungsi:

1. menjadi daftar keputusan bisnis yang masih dibutuhkan sebelum sistem boleh masuk ke tahap release dan rehearsal; dan
2. menjadi panduan bagi presenter untuk menjelaskan kepada CEO apa yang sedang diputuskan, mengapa keputusan itu diperlukan, apa alternatifnya, serta apa dampaknya.

Dokumen ini **bukan permintaan kepada CEO untuk memahami detail teknis**. Engineering sudah menyiapkan sistem, pengamanan, audit, dan pengujian. Hal yang hanya dapat diputuskan CEO adalah batas komersial, kewenangan manusia, risiko bisnis, bahasa komunikasi, dan aturan pajak/legal yang akan mewakili perusahaan.

## Addendum 1 September 2026 — Keputusan Pendekatan Configurable

Tim memutuskan **tidak menahan pembangunan sistem** sambil menunggu seluruh jawaban CEO ditulis sebagai nilai statis. Keputusan katalog, transaksi minimum, owner/backup, approver/delegasi, dan SLA kini disediakan sebagai pengaturan administrator yang tervalidasi, berversi, dan memiliki audit trail.

Perubahan pendekatan ini berarti:

- CEO tidak perlu menentukan seluruh nilai sebelum fitur dibangun;
- admin dapat memasukkan dan memperbarui keputusan yang sudah disepakati tanpa deployment baru;
- nilai yang belum disepakati tetap fail-closed: delegasi dan SLA nonaktif, item katalog tidak publik, serta wording finance/legal berstatus review;
- tindakan publish, approve, atau activate tetap merupakan keputusan manusia yang tercatat;
- delapan belas template follow-up dan wording finance/legal tetap harus direview sebelum status approved;
- dokumen ini berubah fungsi dari “form yang harus selesai sebelum pembangunan” menjadi **panduan keputusan dan materi review berkala**.

Control plane tersedia pada:

- `/admin/catalog` — produk, modul, harga, scope, dan publikasi;
- `/admin/settings` — transaksi minimum, owner/backup, approval/delegasi, SLA, serta wording proposal/invoice;
- `/admin/programs/tests?programId=...` — pre-test/post-test khusus per program.

Implementasi rilis: `app-binahub` dan `binahub-api` v0.17.0, migration `0039_configurable_business_and_program_assessments.sql`.

Rekomendasi di dalam dokumen ini adalah **posisi awal untuk diskusi**, bukan persetujuan atas nama CEO.

---

## Ringkasan Satu Menit untuk CEO

Kalimat pembuka yang dapat digunakan:

> “Secara teknis sistem sudah lulus seluruh 12 skenario UAT dan seluruh automation masih terkunci dalam mode simulasi. Sebelum kita membuat release, kami membutuhkan sembilan keputusan bisnis agar sistem tidak menjual layanan yang belum siap, memakai harga yang belum resmi, mengirim komunikasi yang belum disetujui, atau mengambil keputusan yang seharusnya dilakukan manusia.”

Hal yang sudah selesai:

- Human UAT production: **12/12 passed**.
- Monitoring policy: **4/4 enabled, non-mock**, owner operasional sistem **admin@binahub.id**.
- Runtime control: **4/4 dry-run**, technical owner **admin@binahub.id**, tanpa release binding.
- Template follow-up: **18/18 versi v1.0-review** tersedia sebagai non-mock draft, steward teknis **admin@binahub.id**.
- Snapshot terakhir **458b252a-57ee-4ce0-9fbe-027860c05aed**: healthy, tanpa outbound, tetapi masih mock karena belum ada release.
- Incident high/critical terbuka: **0**.

Yang belum boleh dilakukan:

- Business Rules belum boleh berstatus aktif.
- Template belum boleh dikirim otomatis.
- Workflow n8n belum boleh diaktifkan.
- Proposal tidak boleh memakai modul atau harga placeholder.
- Release, rehearsal, acceptance, dan go/no-go belum boleh dibuat.

Urutan logikanya:

**status produk → modul yang boleh dijual → cara menghitung harga → aturan transaksi → siapa yang bertanggung jawab → siapa yang menyetujui → batas waktu eskalasi → komunikasi yang boleh dikirim → wording keuangan/legal**

---

## Kamus Istilah agar Tidak Membingungkan

| Istilah | Arti sederhana | Contoh perannya |
|---|---|---|
| Payung solusi | Keluarga besar layanan atau positioning produk. Belum tentu merupakan sesuatu yang langsung dibeli pelanggan. | BinaInsight |
| Modul komersial | Paket/SKU konkret yang memiliki scope, output, harga, owner, dan dapat dimasukkan ke proposal. | BI-PUBLIC — BinaInsight Public Assessment |
| Status readiness | Penanda seberapa siap sebuah solusi atau modul untuk dijanjikan kepada pelanggan. | ready berarti boleh ditawarkan sesuai scope resmi |
| Business Rules | Aturan resmi yang dipakai tim dan sistem untuk mengambil tindakan secara konsisten. | transaksi di bawah Rp15 juta harus diarahkan atau meminta approval |
| Owner | Orang yang bertanggung jawab menjalankan dan menjaga suatu fungsi sehari-hari. | Sales Operations owner menjaga pipeline |
| Backup | Pengganti operasional ketika owner tidak tersedia. Backup tidak otomatis mempunyai kewenangan approval. | backup Delivery |
| Approver | Orang yang mempunyai wewenang formal untuk memberi persetujuan. | CEO atau Commercial Director |
| Business owner | Orang yang bertanggung jawab atas hasil bisnis release secara keseluruhan. | memastikan release sesuai strategi dan risiko bisnis |
| Technical owner | Penanggung jawab konfigurasi dan kesehatan teknis. | admin@binahub.id |
| Monitoring owner | Penerima dan penindak lanjut alert sistem. | admin@binahub.id |
| Template steward | Penjaga versi, format, dan implementasi template. Bukan otomatis pemilik keputusan isi. | admin@binahub.id |
| SLA | Batas waktu internal untuk merespons, mengeskalasi, dan memutuskan suatu risiko. | review awal maksimal satu hari kerja |
| Human gate | Titik di mana sistem harus berhenti dan menunggu keputusan manusia. | proposal tidak boleh dikirim sebelum disetujui |
| Dry-run | Simulasi menggunakan alur nyata tetapi tidak melakukan tindakan eksternal seperti mengirim email. | scheduler menghitung kandidat tanpa mengirim |
| Release | Paket konfigurasi bisnis dan teknis yang secara eksplisit disetujui untuk diuji menuju penggunaan nyata. | release Fase 13 |
| Rehearsal | Gladi bersih terkontrol sebelum go-live. | menjalankan skenario dengan data dan owner nyata |
| Outbound | Tindakan keluar kepada pelanggan/prospek. | email follow-up, proposal, atau notifikasi |

### Perbedaan yang paling penting

- **Payung solusi bukan modul.** Nama BinaLab dapat ada sebagai arah produk, tetapi belum dapat dijual sampai ada modul konkret dengan scope dan output yang jelas.
- **Owner bukan approver.** Owner menyiapkan dan menjalankan pekerjaan; approver memberi izin untuk tindakan yang berisiko atau mengikat perusahaan.
- **admin@binahub.id bukan pengganti akuntabilitas bisnis.** Alamat tersebut tepat untuk technical, monitoring, dan template stewardship, tetapi keputusan bisnis tetap harus mempunyai nama manusia.
- **Approved tidak sama dengan live.** Persetujuan template hanya menyatakan isi boleh digunakan. Aktivasi workflow tetap membutuhkan release, rehearsal, acceptance, dan keputusan go/no-go terpisah.

---

## Cara Membaca Pilihan Status

| Status | Makna bisnis | Boleh dipasarkan? | Boleh masuk proposal? |
|---|---|---:|---:|
| concept | Masih berupa gagasan dan hipotesis nilai. | Tidak | Tidak |
| design | Value proposition, scope, atau metode sedang dirancang. | Boleh disebut sebagai arah/roadmap jika konteksnya jelas, bukan sebagai janji. | Tidak |
| development | Sedang dibangun atau diuji. | Hanya sebagai pilot terbatas dengan persetujuan eksplisit. | Hanya proposal pilot yang jelas menyatakan batasannya |
| ready | Scope, deliverable, harga, owner, dan proses delivery sudah dapat dipenuhi. | Ya | Ya |
| retired | Tidak lagi menerima penjualan baru. | Tidak | Tidak |

Kriteria praktis sebelum memilih **ready**:

- siapa pelanggan dan masalah yang diselesaikan sudah jelas;
- scope masuk dan scope di luar layanan tertulis;
- output/deliverable dapat ditunjukkan;
- cara delivery dan kapasitasnya tersedia;
- harga atau mekanisme quotation resmi tersedia;
- owner dan backup tersedia;
- risiko legal, reputasi, dan klaim sudah ditinjau.

---

## Sembilan Keputusan yang Dibutuhkan

## 1. Status Resmi Tujuh Payung Solusi

### Apa yang sedang diputuskan?

CEO diminta menetapkan posisi resmi setiap keluarga solusi BinaHub. Ini bukan penilaian apakah namanya bagus, melainkan keputusan apakah perusahaan sudah boleh **menjanjikan** solusi tersebut kepada pasar.

Status data sekarang:

| Produk | Status saat ini | Keputusan CEO |
|---|---|---|
| BinaInsight | ready | setujui / ubah: ____ |
| BinaLab | design | setujui / ubah: ____ |
| BinaCoach | design | setujui / ubah: ____ |
| BinaPlay | design | setujui / ubah: ____ |
| BinaAcademy | design | setujui / ubah: ____ |
| BinaWorks | design | setujui / ubah: ____ |
| BinaImpact | design | setujui / ubah: ____ |

Nilai status yang tersedia: **concept, design, development, ready, retired**.

### Untuk apa keputusan ini?

- Menjaga agar website, sales, proposal, dan automation mengatakan hal yang sama.
- Mencegah tim menjual sesuatu yang delivery-nya belum siap.
- Memberi batas yang jelas antara roadmap perusahaan dan katalog yang sudah tersedia.
- Menentukan produk mana yang perlu diprioritaskan untuk dirancang, dibangun, atau dihentikan.

### Mengapa CEO yang harus memutuskan?

Status produk adalah janji strategis perusahaan. Engineering dapat memverifikasi fitur, tetapi hanya CEO yang dapat menyatakan apakah positioning, kapasitas delivery, risiko, dan prioritas bisnis sudah cukup untuk disebut siap.

### Alternatif dan konsekuensinya

| Alternatif | Kapan dipilih | Konsekuensi |
|---|---|---|
| Pertahankan status sekarang | BinaInsight memang sudah siap; enam payung lain masih perlu dirancang | Jalur paling aman dan konsisten dengan kondisi sistem saat ini |
| Naikkan design menjadi development | Sudah ada scope dan pekerjaan pembangunan aktif | Boleh disiapkan sebagai pilot, tetapi belum boleh dijual sebagai layanan standar |
| Naikkan menjadi ready | Seluruh kriteria kesiapan sudah terpenuhi | Produk boleh dipasarkan dan perlu segera memiliki modul, harga, owner, serta delivery capacity |
| Turunkan menjadi concept | Arah produknya belum cukup jelas | Mengurangi ekspektasi internal dan eksternal |
| Retired | Tidak lagi sesuai strategi | Tidak menerima penjualan baru dan perlu rencana penghentian |

### Rekomendasi awal untuk diskusi

Pertahankan **BinaInsight = ready** dan enam payung lainnya **design**, kecuali CEO dapat menunjukkan scope, output, kapasitas delivery, harga, serta owner yang sudah nyata. Nama produk atau konsep yang menarik belum cukup untuk status ready.

### Contoh dampak keputusan

Jika BinaCoach dinaikkan menjadi ready, sales dapat menganggap coaching sudah boleh dijanjikan. Artinya harus ada modul coaching konkret, jumlah sesi, profil coach, output, harga, jadwal, dan owner delivery. Jika hal-hal itu belum ada, status ready akan menciptakan janji yang tidak dapat dipenuhi.

### Kalimat siap-ucap kepada CEO

> “Kami membutuhkan penegasan mana yang merupakan produk siap jual dan mana yang masih roadmap. Jika statusnya ready, sistem dan tim akan memperlakukannya sebagai janji resmi perusahaan.”

### Pertanyaan yang perlu dijawab CEO

1. Apakah BinaInsight tetap ready?
2. Apakah enam payung lain tetap design, atau ada yang sudah masuk development/ready?
3. Jika ada perubahan menjadi ready, bukti kesiapan dan owner-nya siapa?

### Yang dilakukan engineering setelah keputusan

Engineering mencatat status resmi dan memastikan payung yang belum ready tidak dapat dipakai sebagai penawaran komersial otomatis.

---

## 2. Katalog Modul Komersial Resmi

### Apa yang sedang diputuskan?

CEO diminta menetapkan **paket konkret apa yang benar-benar dapat dibeli**. Payung solusi menjawab “kita bergerak di bidang apa”, sedangkan modul menjawab “pelanggan membeli apa, menerima apa, berapa batasnya, dan siapa yang mengerjakan”.

Saat ini hanya **BI-PUBLIC — BinaInsight Public Assessment** yang real dan ready. Tujuh modul lain masih placeholder mock dan tidak boleh masuk proposal atau automation.

### Untuk apa keputusan ini?

- Membuat sales tidak perlu menebak isi layanan.
- Membuat proposal konsisten.
- Memungkinkan harga dihitung dengan benar.
- Menghindari scope creep karena batas pekerjaan tertulis.
- Memungkinkan delivery mengetahui kewajiban yang harus dipenuhi.
- Menjadi sumber data resmi bagi website, admin, proposal, dan automation.

### Mengapa tidak cukup hanya menggunakan nama payung solusi?

Satu payung dapat mempunyai banyak modul. Contohnya, BinaInsight dapat memiliki assessment publik, assessment organisasi, workshop interpretasi, atau paket diagnostik lanjutan. Tanpa definisi modul, pelanggan dan tim dapat mempunyai persepsi berbeda tentang apa yang dibeli.

### Informasi minimum setiap modul

| Field | Pertanyaan bisnis yang dijawab |
|---|---|
| Payung solusi | Modul ini bagian dari keluarga produk apa? |
| Kode dan nama | Bagaimana modul diidentifikasi tanpa tertukar? |
| Target pelanggan | Siapa yang paling cocok membeli? |
| Masalah yang diselesaikan | Mengapa pelanggan membutuhkan modul ini? |
| Deskripsi/tujuan | Hasil bisnis apa yang dituju? |
| Scope standar | Pekerjaan apa yang termasuk? |
| Batas/out-of-scope | Apa yang tidak termasuk dan memerlukan biaya/quotation lain? |
| Input pelanggan | Data, waktu, atau akses apa yang harus disediakan pelanggan? |
| Deliverable | Dokumen, sesi, dashboard, rekomendasi, atau output apa yang diterima? |
| Durasi | Berapa lama delivery normal? |
| Kapasitas | Minimum/maksimum peserta, unit, atau engagement? |
| Metode delivery | Online, onsite, hybrid, otomatis, atau fasilitator? |
| Dependency | Modul atau persetujuan apa yang diperlukan? |
| Readiness | concept/design/development/ready/retired |
| Owner dan versi | Siapa menjaga kebenaran definisinya dan versi berapa yang berlaku? |

### Template yang dapat diisi

| Field | Keputusan |
|---|---|
| Kode modul | ____ |
| Nama modul | ____ |
| Payung solusi | ____ |
| Target pelanggan | ____ |
| Tujuan | ____ |
| Scope termasuk | ____ |
| Scope tidak termasuk | ____ |
| Deliverable | ____ |
| Durasi dan kapasitas | ____ |
| Metode delivery | ____ |
| Dependency | ____ |
| Status readiness | ____ |
| Owner | ____ |
| Versi dan tanggal berlaku | ____ |

### Alternatif dan konsekuensinya

| Alternatif | Kelebihan | Risiko/konsekuensi |
|---|---|---|
| Setujui hanya BI-PUBLIC saat ini | Cepat, aman, sesuai bukti kesiapan | Katalog awal masih kecil |
| Setujui beberapa modul prioritas | Memberi pilihan komersial lebih luas | Setiap modul harus benar-benar dilengkapi scope, delivery, harga, dan owner |
| Tetapkan modul lain sebagai bespoke/custom | Sales masih dapat membuka diskusi | Tidak boleh otomatis; setiap proposal perlu human approval dan estimasi khusus |
| Setujui seluruh placeholder | Terlihat cepat | Risiko sangat tinggi karena sistem menganggap data mock sebagai janji nyata |
| Tunda seluruh katalog | Tidak ada risiko salah jual | Tidak ada produk yang dapat diproses sebagai penawaran resmi |

### Rekomendasi awal untuk diskusi

Gunakan peluncuran bertahap:

1. konfirmasi **BI-PUBLIC** sebagai modul resmi;
2. pilih sedikit modul prioritas berikutnya untuk dilengkapi;
3. beri label **design** atau **custom by approval** untuk kebutuhan lain;
4. hapus status mock hanya setelah scope, deliverable, harga, owner, dan readiness disetujui.

Keputusan “modul belum tersedia” adalah keputusan yang valid dan lebih aman daripada memaksakan katalog lengkap.

### Kalimat siap-ucap kepada CEO

> “Payung solusi adalah kategori besar, sedangkan modul adalah barang yang benar-benar kita jual. Kami perlu daftar modul resmi agar sales, proposal, delivery, dan sistem tidak membuat definisi masing-masing.”

### Pertanyaan yang perlu dijawab CEO

1. Apakah BI-PUBLIC disetujui sebagai modul resmi?
2. Modul lain apa yang sudah benar-benar dapat dijual sekarang?
3. Untuk kebutuhan di luar modul resmi, apakah diperlakukan sebagai custom dengan approval?
4. Siapa owner definisi tiap modul?

### Keputusan

**Daftar modul disetujui / perlu revisi / hanya BI-PUBLIC disetujui / belum tersedia**

Catatan: ____

---

## 3. Unit Harga dan Harga Dasar Modul

### Apa yang sedang diputuskan?

CEO diminta menetapkan **cara harga dihitung** dan **nilai dasar** untuk setiap modul resmi. Harga dasar bukan selalu harga final; harga final dapat berubah karena jumlah, lokasi, customization, diskon, pajak, atau biaya tambahan yang diizinkan.

Harga pada modul berlabel **MOCK** tidak boleh dianggap harga resmi.

### Istilah penting

| Istilah | Arti |
|---|---|
| Pricing unit | Satuan yang menjadi dasar perhitungan harga |
| Base price | Harga awal untuk scope standar |
| Minimum quantity | Jumlah minimal agar transaksi layak dilayani |
| Out-of-scope cost | Biaya untuk kebutuhan di luar scope standar |
| Ready-to-sell | Harga, scope, owner, dan aturan approval sudah lengkap |
| Discount floor/limit | Batas diskon yang boleh diberikan tanpa atau dengan approval |

### Pilihan pricing unit

| Unit | Cocok untuk | Kelebihan | Risiko |
|---|---|---|---|
| Per paket | Scope dan output relatif tetap | Mudah dijelaskan dan diprediksi | Harus tegas membatasi scope |
| Per peserta | Biaya meningkat seiring jumlah orang | Adil terhadap volume | Dapat menjadi rumit jika ada minimum peserta |
| Per sesi | Coaching, konsultasi, atau fasilitasi | Transparan | Pelanggan dapat fokus pada jam, bukan hasil |
| Per hari fasilitasi | Workshop/onsite | Mudah untuk kapasitas harian | Belum mencakup persiapan dan pascaprogram bila tidak ditulis |
| Per cohort/batch | Program kelompok | Sesuai delivery program | Perlu batas peserta dan periode |
| Per bulan/retainer | Pendampingan berkelanjutan | Pendapatan berulang | Harus jelas response time dan kapasitas |
| Custom quotation | Scope sangat bervariasi | Fleksibel | Lambat, sulit diotomasi, margin mudah tidak konsisten |

### Untuk apa keputusan ini?

- Mencegah harga berbeda tanpa alasan yang dapat diaudit.
- Menjaga margin dan kapasitas delivery.
- Membantu proposal dibuat lebih cepat.
- Memisahkan scope standar dari customization.
- Menentukan kapan diskon atau harga khusus harus masuk human gate.

### Alternatif strategi harga

| Strategi | Konsekuensi |
|---|---|
| Harga paket standar | Paling mudah dijual dan diotomasi, tetapi scope harus disiplin |
| Harga per volume | Fleksibel untuk berbagai ukuran pelanggan, tetapi perlu formula dan minimum |
| Harga custom seluruhnya | Cocok saat produk belum matang, tetapi semua proposal memerlukan review manual |
| Harga mulai dari | Baik untuk komunikasi awal, tetapi harus jelas bahwa harga final mengikuti scope |
| Harga tidak dipublikasikan | Memberi ruang konsultasi, tetapi tim internal tetap membutuhkan price book resmi |

### Rekomendasi awal untuk diskusi

- Gunakan **per paket** untuk modul dengan scope standar.
- Gunakan **per peserta/cohort/sesi** hanya jika biaya dan kapasitas memang berubah mengikuti unit tersebut.
- Gunakan **custom quotation dengan human approval** untuk kebutuhan di luar scope.
- Jangan mengaktifkan ready-to-sell sebelum base price, minimum, biaya tambahan, dan batas diskon tersedia.

### Contoh sederhana

Jika satu paket assessment mencakup sampai 50 peserta, laporan standar, dan satu sesi interpretasi, maka ketiganya harus tertulis dalam base price. Peserta tambahan, sesi tambahan, onsite, perjalanan, atau kustomisasi laporan harus ditetapkan sebagai out-of-scope agar tidak menjadi beban tersembunyi.

### Kalimat siap-ucap kepada CEO

> “Kami tidak hanya membutuhkan angka harga, tetapi juga satuannya dan batas scope. Tanpa itu, sistem dapat menghasilkan proposal yang terlihat konsisten padahal biaya delivery-nya berbeda.”

### Pertanyaan yang perlu dijawab CEO untuk setiap modul

1. Satuan harganya apa?
2. Berapa base price dan apa yang termasuk?
3. Berapa jumlah minimum/maksimum?
4. Apa yang ditagih terpisah?
5. Apakah ada batas diskon? Siapa yang menyetujui jika melewati batas?
6. Apakah modul sudah ready-to-sell?

### Keputusan per modul

| Modul | Pricing unit | Base price | Minimum | Out-of-scope | Batas diskon | Ready-to-sell |
|---|---|---:|---:|---|---|---|
| ____ | ____ | Rp ____ | ____ | ____ | ____ | ya / tidak |

---

## 4. Kebijakan Transaksi di Bawah Rp15.000.000

### Apa yang sedang diputuskan?

Minimum transaksi yang sudah terkonfirmasi adalah **Rp15.000.000**, tetapi perusahaan belum menentukan apa yang harus dilakukan ketika nilai kebutuhan pelanggan berada di bawah angka tersebut.

Keputusan ini bukan sekadar “menerima atau menolak”. Perusahaan perlu menentukan jalur layanan yang konsisten agar sales tidak membuat pengecualian sendiri-sendiri.

### Untuk apa keputusan ini?

- Melindungi margin dari biaya sales, administrasi, delivery, dan support.
- Memberi jawaban konsisten kepada prospek kecil.
- Menentukan apakah ada produk entry-level atau self-service.
- Menjaga agar pengecualian tetap dilakukan manusia dan dapat diaudit.
- Mencegah deal kecil menyita kapasitas yang seharusnya digunakan untuk engagement strategis.

### Alternatif dan konsekuensinya

| Alternatif | Kelebihan | Risiko/konsekuensi |
|---|---|---|
| Ditolak | Sederhana dan menjaga fokus | Kehilangan calon pelanggan serta jalur nurturing |
| Diarahkan ke modul khusus/entry-level | Tetap melayani pasar kecil dengan biaya terkendali | Modul tersebut harus benar-benar tersedia dan menguntungkan |
| Self-service/digital only | Biaya delivery rendah | Membutuhkan produk digital yang stabil dan support yang jelas |
| Diproses hanya dengan approval | Fleksibel untuk prospek strategis | Memerlukan kriteria agar CEO/Commercial tidak dibanjiri permintaan |
| Digabung dengan cohort/open enrollment | Ekonomi delivery lebih baik | Membutuhkan jadwal, minimum peserta, dan mekanisme penggabungan |
| Minimum diubah | Dapat sesuai kondisi pasar terbaru | Perlu dasar margin dan kapasitas, bukan sekadar angka |

### Rekomendasi awal untuk diskusi

Jangan gunakan penolakan mutlak jika ada jalur standar berbiaya rendah. Kebijakan yang lebih seimbang:

1. arahkan ke modul entry-level/self-service yang resmi jika tersedia;
2. jika tidak ada modul yang sesuai, transaksi di bawah minimum hanya dapat diproses sebagai pengecualian dengan alasan strategis dan approval Commercial Director/CEO;
3. catat alasan seperti strategic account, pilot terukur, referral penting, atau peluang expansion;
4. tidak ada diskon atau customization otomatis hanya untuk mengejar nilai minimum.

Jika produk entry-level belum ada, nyatakan itu secara eksplisit dan gunakan jalur approval sampai produk tersebut siap.

### Contoh kebijakan untuk direview

> “Nilai transaksi standar minimum adalah Rp15.000.000. Kebutuhan di bawah nilai tersebut diarahkan ke modul entry-level yang tersedia. Jika tidak ada modul yang sesuai, transaksi hanya dapat dilanjutkan sebagai pengecualian setelah persetujuan Commercial Director atau CEO dengan alasan dan dampak margin yang tercatat.”

Kalimat ini **belum menjadi aturan resmi** sampai CEO memilih approver dan kriteria pengecualiannya.

### Kalimat siap-ucap kepada CEO

> “Angka minimum sudah ada, tetapi sistem belum tahu apakah prospek di bawah angka itu harus ditolak, dialihkan, atau dimintakan pengecualian. Kami membutuhkan satu kebijakan agar respons sales konsisten.”

### Pertanyaan yang perlu dijawab CEO

1. Apakah minimum Rp15 juta tetap berlaku?
2. Apakah ada modul khusus di bawah minimum?
3. Jika boleh pengecualian, alasan apa yang dianggap sah?
4. Siapa approver dan apakah ada batas nilai atau diskon?

### Keputusan final

- ditolak;
- diarahkan ke produk/modul khusus: ____;
- boleh diproses hanya dengan persetujuan: ____;
- kebijakan lain: ____.

Keputusan final dan tanggal berlaku: ____

---

## 5. Owner Individual dan Backup

### Apa yang sedang diputuskan?

CEO diminta menunjuk **orang nyata**, bukan hanya departemen atau alamat sistem, yang bertanggung jawab atas setiap fungsi. Owner memastikan pekerjaan berjalan; backup menjaga kontinuitas ketika owner berhalangan.

Technical, monitoring, dan template stewardship sudah memakai **admin@binahub.id**. Alamat ini tepat sebagai identitas operasional sistem, tetapi tidak menjawab siapa manusia yang bertanggung jawab atas keputusan atau keterlambatan bisnis.

### Untuk apa keputusan ini?

- Setiap alert, lead, proposal, delivery risk, dan perubahan konten mempunyai tujuan eskalasi.
- Tidak ada pekerjaan yang berhenti karena “saya kira orang lain yang mengerjakan”.
- Sistem dapat mengirim tugas ke orang yang benar.
- Audit dapat menunjukkan siapa yang bertanggung jawab pada saat kejadian.
- Ketidakhadiran owner tidak menghentikan proses.

### Perbedaan peran

| Peran | Tanggung jawab | Bukan kewenangannya secara otomatis |
|---|---|---|
| Owner | Menjalankan fungsi, menjaga data, dan menyelesaikan tugas | Menyetujui seluruh pengecualian |
| Backup | Menggantikan aktivitas owner saat berhalangan | Menjadi approver tanpa delegasi |
| Approver | Mengizinkan tindakan yang mengikat atau berisiko | Menjalankan semua pekerjaan operasional |
| Technical owner | Menjaga aplikasi, konfigurasi, dan integrasi | Menentukan harga/produk |
| Business owner | Bertanggung jawab atas outcome bisnis release | Menjadi operator setiap proses |

### Fungsi yang perlu mempunyai owner

| Fungsi | Tanggung jawab inti | Owner | Backup |
|---|---|---|---|
| Sales Operations | kualitas pipeline, owner lead, next action, SLA follow-up | ____ | ____ |
| Proposal/Commercial | scope, price book, diskon, human gate proposal | ____ | ____ |
| Delivery | handoff won-to-client, kapasitas, project risk | ____ | ____ |
| Deliverability/Email | bounce, complaint, suppression, reputasi pengiriman | ____ | ____ |
| Template/Content | kebenaran isi, tone, klaim, versi, terjemahan | steward teknis: admin@binahub.id; business owner: ____ | ____ |
| Product Catalog | status produk, modul, scope, deliverable, versi | ____ | ____ |

### Alternatif struktur

| Alternatif | Kelebihan | Risiko |
|---|---|---|
| Semua owner adalah CEO | Cepat ditentukan | CEO menjadi bottleneck dan tidak realistis untuk operasi harian |
| Owner per fungsi | Akuntabilitas jelas dan scalable | Membutuhkan disiplin lintas fungsi |
| Satu operations owner untuk beberapa fungsi | Cocok untuk tim kecil | Perlu batas kapan isu harus naik ke CEO/Commercial |
| Rotasi mingguan | Menyebar beban | Akuntabilitas historis dan konsistensi dapat membingungkan |

### Rekomendasi awal untuk diskusi

Gunakan **owner per fungsi**, tetapi satu orang boleh memegang beberapa fungsi selama kapasitasnya realistis. Tetap tetapkan backup yang berbeda. Gunakan **admin@binahub.id** sebagai technical/monitoring/template system identity, lalu catat nama manusia sebagai accountable owner.

### Kriteria owner yang baik

- mempunyai kewenangan untuk menindaklanjuti pekerjaan;
- memahami metrik dan risiko fungsi;
- rutin memeriksa antrean/tugas;
- dapat dihubungi melalui kanal resmi;
- bersedia namanya tercatat dalam audit;
- mengetahui kapan harus mengeskalasi.

### Kalimat siap-ucap kepada CEO

> “Sistem bisa mendeteksi masalah, tetapi tetap membutuhkan orang yang wajib menindaklanjuti. Kami meminta satu owner dan satu backup per fungsi agar tidak ada alert atau pelanggan yang kehilangan penanggung jawab.”

### Pertanyaan yang perlu dijawab CEO

1. Siapa nama dan email owner untuk setiap fungsi?
2. Siapa backup ketika owner tidak tersedia?
3. Apakah backup hanya operasional atau juga mempunyai delegasi approval?
4. Apakah ada fungsi yang sementara dirangkap? Sampai kapan?

---

## 6. Approver Individual dan Delegasi Wewenang

### Apa yang sedang diputuskan?

Peran approver sudah diarahkan ke **CEO dan Commercial Director**, tetapi sistem masih membutuhkan identitas orangnya, batas kewenangannya, dan aturan pengganti ketika salah satu tidak tersedia.

### Untuk apa keputusan ini?

- Menentukan siapa yang boleh menyetujui proposal, diskon, pengecualian, klaim, atau risiko.
- Memisahkan orang yang menyiapkan proposal dari orang yang menyetujuinya.
- Mencegah approval menggunakan akun bersama tanpa jejak individu.
- Menjaga proses tetap berjalan saat approver berhalangan.
- Membuat audit menjawab siapa menyetujui apa, kapan, dan dengan alasan apa.

### Owner vs approver

Contoh: Proposal/Commercial owner menyiapkan scope dan harga. Commercial Director atau CEO menyetujui proposal sesuai matriks kewenangan. Orang yang menyiapkan dokumen tidak otomatis boleh menyetujui pengecualiannya sendiri.

### Alternatif model approval

| Model | Kelebihan | Risiko |
|---|---|---|
| CEO menyetujui semuanya | Kontrol sangat tinggi | Lambat dan menciptakan bottleneck |
| Commercial Director untuk standar, CEO untuk pengecualian | Cepat untuk pekerjaan normal, CEO fokus pada risiko strategis | Memerlukan definisi jelas tentang “standar” dan “pengecualian” |
| Dual approval untuk semua proposal | Kontrol kuat | Terlalu berat untuk transaksi rutin |
| Approval berdasarkan nilai/risiko | Proporsional | Perlu matriks threshold yang dipelihara |

### Rekomendasi awal untuk diskusi

Gunakan matriks berbasis risiko:

- **Commercial Director** dapat menyetujui proposal yang seluruhnya mengikuti modul, harga, diskon, wording, dan scope standar.
- **CEO** menyetujui pengecualian strategis, harga di bawah floor, klaim nonstandar, risiko legal/reputasi tinggi, atau nilai/komitmen di atas threshold yang ditentukan.
- Backup hanya dapat menyetujui jika ada delegasi tertulis dengan periode dan batas kewenangan.

Threshold angka dan kategori risiko tetap harus diputuskan CEO.

### Contoh matriks yang perlu dilengkapi

| Kondisi | Approver utama | Backup/delegasi |
|---|---|---|
| Proposal standar dalam price book | ____ | ____ |
| Diskon sampai ____% | ____ | ____ |
| Diskon di atas ____% | ____ | ____ |
| Transaksi di bawah Rp15 juta | ____ | ____ |
| Custom scope | ____ | ____ |
| Klaim, legal, etik, atau reputasi tinggi | ____ | ____ |
| Nilai transaksi di atas Rp ____ | ____ | ____ |

### Kalimat siap-ucap kepada CEO

> “Kami perlu membedakan siapa yang mengerjakan dan siapa yang memberi izin. Tujuannya bukan menambah birokrasi, tetapi agar proposal standar bergerak cepat sementara pengecualian tetap terlindungi.”

### Keputusan identitas

- CEO approver — nama/email: ____
- Commercial Director approver — nama/email: ____
- Kewenangan masing-masing: ____
- Pengganti jika tidak tersedia: ____
- Masa berlaku delegasi: ____
- Hal yang tetap tidak dapat didelegasikan: ____

---

## 7. SLA Legal, Reputasi, Etik, dan Conflict Risk

### Apa yang sedang diputuskan?

CEO diminta menentukan **berapa lama sebuah risiko boleh menunggu**, kapan harus naik ke backup, dan kapan harus mencapai keputusan akhir. SLA bukan janji bahwa semua masalah selesai dalam waktu tersebut; SLA adalah batas agar masalah tidak mengendap tanpa owner.

### Risiko yang dicakup

- wording kontrak/proposal yang berpotensi menimbulkan kewajiban hukum;
- klaim hasil yang berlebihan atau tidak dapat dibuktikan;
- penggunaan data, nama, logo, atau testimoni tanpa izin;
- isu etik dalam assessment, coaching, fasilitasi, atau keputusan berbasis data;
- konflik kepentingan;
- komunikasi yang berpotensi merusak reputasi;
- permintaan pelanggan yang bertentangan dengan kebijakan perusahaan.

### Untuk apa keputusan ini?

- Menghindari proposal atau komunikasi tertahan tanpa kepastian.
- Menjaga isu berisiko tidak dilanjutkan otomatis.
- Menentukan ekspektasi antara sales, delivery, CEO, dan reviewer.
- Memberikan dasar kapan sistem membuat reminder atau eskalasi.
- Membedakan isu biasa dari blocker yang harus menghentikan proses.

### Hal yang harus ditentukan

1. **Jam kerja resmi** dan zona waktu.
2. **Waktu acknowledgment**: kapan owner harus mengakui tiket diterima.
3. **Review awal**: kapan klasifikasi risiko dan rekomendasi awal tersedia.
4. **Eskalasi ke backup**: kapan backup mengambil alih.
5. **Keputusan akhir**: batas keputusan atau alasan penundaan.
6. **Kanal resmi**: email, task dashboard, WhatsApp darurat, atau kombinasi.
7. **Severity**: low, medium, high, critical dan siapa yang menangani.

### Alternatif model SLA

| Model | Kelebihan | Risiko |
|---|---|---|
| Satu SLA untuk semua isu | Sederhana | Isu kritis terlalu lambat atau isu ringan terlalu membebani |
| SLA berdasarkan severity | Respons proporsional | Perlu definisi severity |
| SLA berdasarkan nilai transaksi | Mudah untuk commercial | Tidak semua risiko besar mempunyai nilai transaksi besar |
| Best effort tanpa SLA | Fleksibel | Tidak dapat dipantau dan mudah terabaikan |

### Rekomendasi awal untuk diskusi

Gunakan SLA berbasis severity dan hari kerja. Contoh **bahan diskusi**, bukan keputusan final:

| Severity | Contoh | Review awal | Eskalasi | Final decision |
|---|---|---:|---:|---:|
| Low | koreksi redaksi kecil | 2 hari kerja | 3 hari kerja | 5 hari kerja |
| Medium | scope atau klaim yang perlu validasi | 1 hari kerja | 2 hari kerja | 3 hari kerja |
| High | potensi pelanggaran kontrak/reputasi | 4 jam kerja | 1 hari kerja | 2 hari kerja |
| Critical | potensi pelanggaran serius atau insiden publik aktif | 1 jam kerja | segera | secepatnya oleh CEO |

Angka di atas harus disesuaikan dengan kapasitas tim dan akses reviewer. Jangan menyetujui SLA yang tidak mungkin dipenuhi.

### Definisi severity yang disarankan

- **Low:** tidak mengubah kewajiban atau klaim utama.
- **Medium:** dapat memengaruhi scope, harga, atau interpretasi pelanggan.
- **High:** dapat menimbulkan kerugian, pelanggaran, atau dampak reputasi signifikan.
- **Critical:** membutuhkan penghentian segera dan keputusan pimpinan.

### Kalimat siap-ucap kepada CEO

> “Human gate akan menghentikan proses saat ada risiko, tetapi tanpa SLA proses bisa berhenti selamanya. Kami membutuhkan batas waktu dan jalur eskalasi yang realistis.”

### Keputusan yang perlu diisi

- Jam kerja dan zona waktu: ____
- SLA acknowledgment: ____
- SLA review awal per severity: ____
- SLA eskalasi ke backup: ____
- SLA keputusan akhir CEO: ____
- Kanal utama: ____
- Kanal darurat: ____
- Siapa yang boleh mengubah severity: ____

---

## 8. Final Approval 18 Template Follow-up

### Apa yang sedang diputuskan?

CEO diminta menyetujui **isi komunikasi** yang akan mewakili BinaHub. Engineering sudah menyiapkan struktur dan kontrol pengiriman, tetapi tidak boleh menentukan sendiri tone, klaim, urgensi, dan ajakan yang digunakan kepada prospek.

Versi **v1.0-review** tersedia dalam Bahasa Indonesia dan Inggris untuk:

- inquiry follow-up level 1–3;
- assessment result follow-up level 1–3;
- assessment proposal follow-up level 1–3.

Perhitungannya: **3 perjalanan × 3 level × 2 bahasa = 18 template**.

### Apa arti level 1–3?

Level adalah tahapan follow-up, bukan tingkat “memaksa”:

- **Level 1:** pengingat awal yang ringan dan membantu penerima memahami langkah berikutnya.
- **Level 2:** follow-up lanjutan dengan konteks/manfaat lebih jelas.
- **Level 3:** penutupan siklus atau ajakan keputusan terakhir secara sopan.

CEO perlu memastikan kenaikan level tetap sesuai karakter merek dan tidak terasa agresif.

### Kondisi teknis seluruh template

- menggunakan satu CTA ke **https://cal.com/binahub/konsultasi**;
- tidak menyuruh penerima membalas alamat no-reply;
- memiliki footer unsubscribe otomatis pada saat pengiriman;
- belum dapat digunakan live sebelum approval;
- approval template tidak mengaktifkan workflow secara otomatis.

### Untuk apa approval ini?

- Melindungi reputasi dan tone BinaHub.
- Memastikan tidak ada klaim yang melebihi kemampuan produk.
- Memastikan CTA, frekuensi, dan bahasa selaras dengan journey pelanggan.
- Memberi jejak audit bahwa isi telah diperiksa manusia.
- Mencegah engineering dianggap sebagai pihak yang menyetujui komunikasi bisnis.

### Checklist CEO saat membaca template

1. Apakah subjek email jelas dan tidak menyesatkan?
2. Apakah pembuka sesuai tone BinaHub?
3. Apakah manfaat yang disebut dapat dibuktikan?
4. Apakah ada janji hasil, urgensi palsu, atau tekanan berlebihan?
5. Apakah CTA hanya mengarahkan ke langkah yang memang tersedia?
6. Apakah Bahasa Indonesia dan Inggris mempunyai makna setara?
7. Apakah level 2 dan 3 masih sopan?
8. Apakah penerima mengerti cara berhenti menerima email?
9. Apakah email cocok berasal dari alamat no-reply?
10. Apakah terdapat konteks yang seharusnya dipersonalisasi?

### Alternatif approval

| Alternatif | Konsekuensi |
|---|---|
| Setujui seluruh 18 | Semua template dapat berstatus approved, tetapi tetap belum live sampai release |
| Setujui dengan revisi spesifik | Engineering memperbarui versi lalu meminta verifikasi atas perubahan |
| Setujui per journey/bahasa | Sebagian dapat approved; Fase 13 tetap belum complete sampai keputusan seluruh 18 jelas |
| Belum disetujui | Sistem tetap aman dalam draft/dry-run |
| Hapus journey tertentu | Perlu keputusan eksplisit bahwa journey tersebut tidak akan digunakan |

### Rekomendasi awal untuk diskusi

Jangan melakukan approval hanya berdasarkan jumlah “18”. Review dalam tiga kelompok journey agar konteksnya mudah:

1. inquiry;
2. assessment result;
3. assessment proposal.

Dalam tiap kelompok, bandingkan level 1–3 dan pasangan ID/EN. Jika ada revisi, tulis perubahan yang dapat dieksekusi, misalnya “hapus klaim X”, “ubah CTA”, atau “lunakkan level 3”, bukan hanya “buat lebih baik”.

### Contoh approval note yang baik

> “Disetujui untuk versi v1.0 setelah frasa ‘menjamin peningkatan’ diganti menjadi ‘mendukung peningkatan’, CTA tetap ke halaman konsultasi, dan tidak ada tambahan kanal reply.”

### Kalimat siap-ucap kepada CEO

> “Yang diminta bukan persetujuan mengirim email sekarang. Yang diminta adalah persetujuan bahwa 18 isi email ini layak mewakili BinaHub; aktivasi pengiriman tetap memiliki gate terpisah.”

### Keputusan CEO

- setujui seluruh 18 template;
- setujui dengan revisi berikut: ____;
- hapus/nonaktifkan template berikut: ____;
- belum disetujui.

Approval actor nama/email: ____

Versi yang disetujui: ____

Approval note: ____

Tanggal berlaku: ____

---

## 9. Wording Finance/Legal pada Proposal dan Invoice

### Apa yang sedang diputuskan?

CEO bersama Finance/Legal diminta menyetujui kalimat resmi tentang:

- status BinaHub yang saat ini dicatat **not_pkp**;
- bagaimana harga ditampilkan terkait PPN;
- bagaimana potensi pemotongan PPh Pasal 23 dijelaskan;
- dokumen apa yang harus diberikan pelanggan ketika melakukan pemotongan;
- siapa yang berwenang mengubah wording ketika status pajak berubah.

### Mengapa keputusan ini penting?

- Pelanggan harus memahami jumlah tagihan dan jumlah yang dibayarkan.
- Sales tidak boleh membuat penjelasan pajak sendiri.
- Proposal dan invoice harus memakai bahasa yang konsisten.
- Perubahan status PKP di masa depan harus mengubah wording secara terkendali.
- Potensi selisih pembayaran karena withholding harus dapat direkonsiliasi.

### Konteks yang perlu dipahami

Menurut materi Direktorat Jenderal Pajak, kewajiban memungut PPN dan membuat Faktur Pajak melekat pada Pengusaha Kena Pajak (PKP). Untuk PPh Pasal 23, imbalan jasa tertentu kepada wajib pajak badan dapat dipotong 2% dari jumlah bruto oleh pihak yang wajib memotong dan disertai bukti potong.

Namun, penerapan pada transaksi BinaHub bergantung pada:

- bentuk badan dan identitas pajak BinaHub;
- jenis jasa yang dijual;
- status dan kewajiban pemotongan pihak pelanggan;
- dokumen serta peraturan yang berlaku pada tanggal transaksi.

Karena itu dokumen ini **tidak menetapkan nasihat pajak atau hukum**. Finance/Legal atau konsultan pajak yang berwenang harus mengonfirmasi wording final.

Rujukan resmi untuk validasi:

- [Direktorat Jenderal Pajak — Pemotongan PPh Pasal 23](https://www.pajak.go.id/index.php/id/pemotongan-pajak-penghasilan-pasal-23)
- [Direktorat Jenderal Pajak — PPh Pasal 23/26](https://www.pajak.go.id/id/pph-pasal-2326)
- [Direktorat Jenderal Pajak — Pemungutan PPN](https://pajak.go.id/id/pemungutan-pajak-pertambahan-nilai)

### Pilihan wording dan trade-off

| Pendekatan | Contoh konsep | Kelebihan | Risiko |
|---|---|---|---|
| Sangat umum | “Harga mengikuti ketentuan pajak yang berlaku.” | Fleksibel | Terlalu ambigu untuk pelanggan |
| Eksplisit status saat ini | Menyatakan bukan PKP dan tidak memungut PPN | Jelas | Harus segera diperbarui jika status berubah |
| Eksplisit PPh 23 | Menyatakan pemotongan dilakukan jika transaksi memenuhi ketentuan dan bukti potong wajib diberikan | Membantu rekonsiliasi | Harus diverifikasi terhadap jenis jasa dan pihak transaksi |
| Wording berbeda per jenis transaksi | Klausul dipilih berdasarkan modul/pelanggan | Lebih akurat | Lebih kompleks dan membutuhkan kontrol template |

### Rekomendasi awal untuk direview Finance/Legal

Gunakan wording eksplisit tetapi bersyarat, bukan pernyataan absolut yang diterapkan ke semua transaksi. Contoh **draf review, bukan wording resmi**:

> “BinaHub saat ini belum dikukuhkan sebagai Pengusaha Kena Pajak (PKP), sehingga harga tidak mencantumkan pungutan PPN oleh BinaHub. Apabila pembayaran atas transaksi ini termasuk objek pemotongan PPh Pasal 23 dan pihak pelanggan berkewajiban melakukan pemotongan, pemotongan dilakukan sesuai ketentuan yang berlaku dan pelanggan wajib menyerahkan bukti potong yang sah kepada BinaHub.”

Finance/Legal perlu mengonfirmasi:

- apakah istilah “belum dikukuhkan sebagai PKP” tepat untuk entitas BinaHub;
- apakah jenis jasa BinaHub merupakan objek PPh 23;
- dasar pengenaan yang benar;
- apakah harga harus ditulis “sebelum pemotongan” atau dengan istilah lain;
- alamat/kanal penerimaan bukti potong;
- kapan wording harus berubah.

### Hal yang sebaiknya dihindari

- Menulis “harga ditambah PPh 23 2%” tanpa verifikasi. PPh 23 pada umumnya merupakan pemotongan oleh pihak yang berkewajiban, bukan otomatis biaya tambahan kepada pelanggan.
- Menganggap seluruh pelanggan wajib memotong.
- Menggunakan status not_pkp sebagai teks pelanggan tanpa menerjemahkannya ke bahasa yang mudah dipahami.
- Membiarkan sales mengubah klausul pajak tanpa versioning dan approval.

### Kalimat siap-ucap kepada CEO

> “Kami tidak meminta CEO menghitung pajak. Kami meminta persetujuan siapa yang memvalidasi bahasa resmi agar proposal dan invoice tidak menimbulkan interpretasi berbeda. Draf akhir tetap harus dikonfirmasi Finance/Legal.”

### Keputusan yang perlu diisi

- Status PKP entitas telah diverifikasi oleh: ____
- Wording final proposal: ____
- Wording final invoice: ____
- Perlakuan PPh 23 dan bukti potong: ____
- Kanal pengiriman bukti potong: ____
- Finance/Legal approver nama/email: ____
- Versi dan tanggal berlaku: ____
- Trigger review ulang, misalnya perubahan status pajak: ____

---

## Keputusan Penutup: Business Owner dan Keputusan Keseluruhan

Bagian ini bukan keputusan kesepuluh yang terpisah. Ini adalah identitas orang yang bertanggung jawab atas keseluruhan paket keputusan dan status akhirnya.

### Mengapa diperlukan?

Sembilan keputusan dapat mempunyai banyak owner dan approver. Release tetap membutuhkan satu business owner yang menyatakan bahwa kumpulan keputusan tersebut konsisten dengan strategi perusahaan dan siap dibawa ke rehearsal.

### Yang perlu diisi

- Business owner nama/email: ____
- CEO/decision actor nama/email: ____
- Tanggal review: ____
- Keputusan keseluruhan: **approved / approved with revisions / pending**
- Daftar revisi atau keputusan yang masih pending: ____
- Catatan keputusan: ____

### Arti status keseluruhan

| Status | Arti | Dampak |
|---|---|---|
| approved | Sembilan keputusan lengkap dan dapat diimplementasikan | Engineering dapat menyiapkan release tanpa langsung go-live |
| approved with revisions | Arah disetujui, tetapi ada perubahan konkret yang harus diselesaikan | Release menunggu revisi diverifikasi |
| pending | Masih ada keputusan yang belum dapat diambil | Dry-run dan lock tetap dipertahankan |

---

## Lembar Jawaban Cepat untuk Rapat

Bagian ini dapat dipakai sebagai notulen ringkas. Penjelasan detail tetap merujuk ke bagian sebelumnya.

| No. | Keputusan | Jawaban CEO | Actor | Tanggal | Catatan/revisi |
|---:|---|---|---|---|---|
| 1 | Status tujuh payung solusi | ____ | ____ | ____ | ____ |
| 2 | Modul komersial resmi | ____ | ____ | ____ | ____ |
| 3 | Unit dan harga dasar | ____ | ____ | ____ | ____ |
| 4 | Transaksi di bawah Rp15 juta | ____ | ____ | ____ | ____ |
| 5 | Owner dan backup | ____ | ____ | ____ | ____ |
| 6 | Approver dan delegasi | ____ | ____ | ____ | ____ |
| 7 | SLA legal/reputasi | ____ | ____ | ____ | ____ |
| 8 | Approval 18 template | ____ | ____ | ____ | ____ |
| 9 | Wording Finance/Legal | ____ | ____ | ____ | ____ |

---

## Alur Rapat yang Disarankan

Durasi realistis: **60–90 menit**, atau dibagi menjadi dua sesi jika katalog dan pricing membutuhkan diskusi lebih panjang.

### Sesi A — Strategi dan komersial

1. Konfirmasi status payung solusi.
2. Tetapkan modul yang resmi.
3. Tetapkan model harga dan data yang masih harus dilengkapi.
4. Putuskan transaksi di bawah Rp15 juta.

### Sesi B — Tata kelola dan risiko

5. Tetapkan owner dan backup.
6. Tetapkan approver dan delegasi.
7. Tetapkan SLA legal/reputasi.
8. Review template per journey.
9. Tugaskan validasi wording ke Finance/Legal.
10. Tetapkan business owner dan status keseluruhan.

Jika sebuah keputusan belum dapat dibuat, catat:

- data apa yang kurang;
- siapa yang harus menyiapkannya;
- siapa decision actor-nya;
- batas waktu keputusan;
- apakah item tersebut memblokir release.

Jangan mengisi jawaban sementara seolah-olah final hanya agar seluruh kolom terlihat lengkap.

---

## Langkah Setelah CEO Memberi Keputusan

1. Engineering memasukkan keputusan ke Business Rules tanpa mengaktifkan outbound.
2. Status solusi, katalog modul, pricing, owner, approver, SLA, dan wording di-versioning agar perubahan dapat diaudit.
3. Template yang disetujui diubah dari draft menjadi approved dengan actor, versi, tanggal, dan approval note CEO.
4. Business Rules diaktifkan hanya jika sembilan blocker benar-benar selesai dan tidak ada data mock yang dianggap resmi.
5. Release plan non-mock dibuat dengan business owner yang ditunjuk, technical owner **admin@binahub.id**, dan monitoring owner **admin@binahub.id**.
6. Runtime tetap dry-run; watchdog menghasilkan snapshot fresh non-mock yang terikat release.
7. Delapan langkah rehearsal dijalankan dengan bukti, owner, dan hasil yang dapat diaudit.
8. Acceptance dan go/no-go dilakukan setelah rehearsal, bukan otomatis karena decision pack sudah approved.

### Hal yang tidak otomatis terjadi setelah approval

- n8n tidak langsung aktif;
- email tidak langsung terkirim;
- proposal tidak langsung dikirim;
- dry-run tidak langsung dimatikan;
- pelanggan tidak langsung menerima komunikasi;
- Phase 14 tidak otomatis dianggap selesai.

Approval decision pack hanya membuka jalan ke **release terkontrol dan rehearsal**, bukan go-live otomatis.
