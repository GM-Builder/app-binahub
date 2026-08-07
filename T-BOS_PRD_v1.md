T-BOS — Product Requirements Document 

### **PRODUCT REQUIREMENTS DOCUMENT** 

# **T-BOS** 

_Team Behavioral Observation System_ 

Aplikasi Penilaian Perilaku Tim untuk Fasilitator — BinaHub 

|**Dokumen**|PRD v1.0—T-BOS Facilitator Assessment App|
|---|---|
|**Perusahaan**|BinaHub|
|**Status**|Draft—untuk review|
|**Tanggal**|7Agustus2026|
|**Sumber**|T-BOS Functional Specification v1+detail tambahan|



BinaHub — Confidential | Halaman 1 

T-BOS — Product Requirements Document 

## **1. Latar Belakang & Tujuan** 

T-BOS (Team Behavioral Observation System) adalah sistem penilaian perilaku tim yang digunakan fasilitator untuk mengobservasi tim peserta selama menjalankan mission/game simulasi (Lost Detonator Mission, Goldsmith Precision Lab, Ore Extraction Challenge, Lean Bridge Challenge, X-Case). 

Tujuan utama produk ini: 

- Memberikan fasilitator form observasi perilaku yang cepat diisi (target di bawah 1 menit per observasi). 

- Mengukur 8 dimensi perilaku tim secara konsisten lintas mission dan lintas fasilitator. 

- Menghasilkan skor gabungan (performance + behavioral) sebagai dasar evaluasi tim. 

- Menyediakan dashboard otomatis (radar chart, heatmap, ranking, executive summary) untuk kebutuhan pelaporan program. 

## **2. Ruang Lingkup** 

### **2.1 Termasuk (In-Scope)** 

- Form input observasi perilaku per tim per mission oleh fasilitator. 

- Mapping otomatis mission → dimensi yang relevan (2-4 dimensi per mission). 

- Perhitungan skor per dimensi, skor akhir mission, dan skor akumulasi tim. 

- Dashboard hasil observasi (radar chart, heatmap, ranking, rata-rata batch, executive summary). 

### **2.2 Belum Termasuk (Out-of-Scope / Asumsi Awal)** 

- Manajemen master data peserta & tim (diasumsikan sudah ada di database peserta existing). 

- Perhitungan Mission Performance Score non-behavioral (di luar T-BOS), diasumsikan berasal dari sistem/modul lain. 

- Integrasi dengan modul lain di luar T-BOS — perlu konfirmasi lebih lanjut. 

## **3. User Roles & Akses** 

|**Role**|**Deskripsi**|**Akses**|
|---|---|---|
|Fasilitator|Mengobservasi tim selama mission<br>berlangsung|Login dengan akun sendiri<br>Hanya bisa input observasi untuk mission<br>yang menjadi tanggung jawabnya<br>Hanya melihat dimensi perilaku yang<br>relevan dengan mission tersebut<br>(menyederhanakan tampilan &<br>mempercepat input)|
|Admin / Program<br>Manager|Memantau hasil observasi seluruh tim &<br>mission|Melihat seluruh dashboard (radar chart,<br>heatmap, ranking, executive summary)<br>Melihat rekap skor semua tim lintas<br>batch|



_Catatan pengembang: pembatasan akses fasilitator per mission ini penting untuk menjaga konsistensi penilaian antar fasilitator dan mempermudah briefing sebelum program berjalan._ 

## **4. Functional Requirements** 

### **4.1 Data Umum Observasi** 

Observasi dilakukan per tim, per mission. Field yang diinput/ditampilkan ke fasilitator: 

BinaHub — Confidential | Halaman 2 

T-BOS — Product Requirements Document 

|**Field**|**Tipe Data**|**Keterangan**|
|---|---|---|
|Nama Tim|Dropdown|Contoh: Alpha, Bravo, Charlie, Delta|
|Nama Anggota Tim|Multi-select / Auto Populate|Diambil dari database peserta sesuai<br>tim|
|Mission / Game|Auto (berdasarkan akun fasilitator)|Lost Detonator Mission, Goldsmith<br>Precision Lab, Ore Extraction<br>Challenge, Lean Bridge Challenge, X-<br>Case|
|Nama Fasilitator|Auto|Login berdasarkan akun fasilitator|
|Batch|Dropdown|Batch 1 / Batch 2|
|Tanggal|Auto|Tanggalpelaksanaan|
|Waktu Input|Auto|Timestampsistem|



_Aturan bisnis: setiap fasilitator hanya dapat menginput observasi pada mission yang menjadi tanggung jawabnya (ditentukan dari akun login)._ 

### **4.2 Mapping Mission vs Behavioral Dimensions** 

Setiap mission hanya mengukur 2-4 dimensi utama dari total 8 dimensi, agar observasi dapat diselesaikan dalam waktu kurang dari 1 menit. 

|**Mission**|**Dimensi yang Diukur**|
|---|---|
|Lost Detonator Mission|Goal Alignment, Communication, Adaptability|
|Goldsmith Precision Lab|Communication, Execution Discipline, Accountability|
|Ore Extraction Challenge|Communication, Collaboration, Organizational Ownership|
|Lean Bridge Challenge|Goal Alignment, Data-Based Decision Making, Execution Discipline|
|X-Case|Communication, Data-Based Decision Making, Accountability,<br>Organizational Ownership|



### **4.3 Behavioral Observation Form — 8 Dimensi** 

Untuk tiap dimensi yang relevan dengan mission-nya, fasilitator memilih satu dari 5 level berikut berdasarkan pengamatan langsung terhadap tim: 

#### **A. Goal Alignment** 

_Pertanyaan: Bagaimana tim memulai mission?_ 

|**Level**|**Deskripsi Perilaku**|
|---|---|
|Reactive(1)|Langsungbekerja tanpa diskusi.|
|Emerging (2)|Diskusi singkat tetapi belum menghasilkan arahyang jelas.|
|Functional(3)|Menentukan tujuan bersama sebelum mulai bekerja.|
|Effective(4)|Menentukan tujuan dan strategipelaksanaan.|
|Exemplary (5)|Menentukan tujuan, strategi,pembagianperan, serta contingency plan.|



#### **B. Communication** 

_Pertanyaan: Bagaimana komunikasi berlangsung selama mission?_ 

|**Level**|**Deskripsi Perilaku**|
|---|---|
|Reactive(1)|Banyak miskomunikasi dan informasi tidak tersampaikan.|
|Emerging (2)|Informasi hanya berputarpada beberapa anggota.|
|Functional(3)|Informasi mengalir tetapi belum konsisten.|
|Effective(4)|Komunikasijelas, dua arah, dan salingmemperbarui.|
|Exemplary (5)|Seluruh anggota aktif berbagi informasi secara real-time.|



#### **C. Data-Based Decision Making** 

BinaHub — Confidential | Halaman 3 

T-BOS — Product Requirements Document 

_Pertanyaan: Bagaimana keputusan diambil oleh tim?_ 

|**Level**|**Deskripsi Perilaku**|
|---|---|
|Reactive(1)|Keputusan berdasarkan tebakan.|
|Emerging (2)|Keputusan berdasarkan asumsi.|
|Functional(3)|Sebagian keputusan menggunakan datayangtersedia.|
|Effective(4)|Mayoritas keputusan menggunakan data dan informasi.|
|Exemplary (5)|Semua keputusan dibuat berdasarkan fakta, data, dan evaluasi alternatif.|



#### **D. Execution Discipline** 

_Pertanyaan: Bagaimana tim menuntaskan pekerjaannya?_ 

|**Level**|**Deskripsi Perilaku**|
|---|---|
|Reactive(1)|Banyakpekerjaan tidak selesai.|
|Emerging (2)|Target selesai tetapi terburu-buru.|
|Functional(3)|Target selesai sesuai ketentuan.|
|Effective(4)|Target selesai dan dilakukanpengecekan.|
|Exemplary (5)|Target selesai, diverifikasi, dan siapdigunakan oleh tim/proses berikutnya.|



#### **E. Accountability** 

_Pertanyaan: Bagaimana tim merespons ketika muncul masalah?_ 

|**Level**|**Deskripsi Perilaku**|
|---|---|
|Reactive(1)|Salingmenyalahkan.|
|Emerging (2)|Menunggu arahan fasilitator.|
|Functional(3)|Bertanggung jawab terhadaptugas masing-masing.|
|Effective(4)|Bertanggung jawab terhadaphasil tim.|
|Exemplary (5)|Proaktif mengambil kepemilikan dan segera menyelesaikan masalah.|



#### **F. Adaptability** 

_Pertanyaan: Bagaimana tim merespons perubahan (twist)?_ 

|**Level**|**Deskripsi Perilaku**|
|---|---|
|Reactive(1)|Bingungdan kehilangan arah.|
|Emerging (2)|Terlambat menyesuaikan.|
|Functional(3)|Menyesuaikan sebagian strategi.|
|Effective(4)|Cepat menyusun strategi baru.|
|Exemplary (5)|Langsungberadaptasi tanpa kehilangan momentum kerja.|



#### **G. Collaboration** 

_Pertanyaan: Bagaimana anggota tim bekerja sama?_ 

|**Level**|**Deskripsi Perilaku**|
|---|---|
|Reactive(1)|Bekerja sendiri-sendiri.|
|Emerging (2)|Kerja sama masih terbatas.|
|Functional(3)|Bekerja sama ketika diperlukan.|
|Effective(4)|Aktif salingmembantu selama mission.|
|Exemplary (5)|Kolaborasi sangat solid dan salingmelengkapi.|



#### **H. Organizational Ownership** 

BinaHub — Confidential | Halaman 4 

T-BOS — Product Requirements Document 

_Pertanyaan: Bagaimana kepedulian tim terhadap target organisasi?_ 

|**Level**|**Deskripsi Perilaku**|
|---|---|
|Reactive(1)|Menunggu mission selesai setelah target tim tercapai.|
|Emerging (2)|Fokuspada kemenangan tim sendiri.|
|Functional(3)|Membantu tim lainjika diminta.|
|Effective(4)|Secara aktif menawarkan bantuan kepada tim lain.|
|Exemplary (5)|Berinisiatif memastikan seluruh tim berhasil mencapai target organisasi.|



### **4.4 Catatan Observasi (Opsional)** 

- Field teks bebas, maksimal 50 karakter. 

- Contoh isi: "Leader langsung membagi peran." 

- Contoh isi: "Tim mengubah strategi setelah twist." 

- Contoh isi: "Membantu Tim Bravo tanpa diminta." 

- Contoh isi: "Menggunakan dashboard sebelum memutuskan." 

### **4.5 Logika Perhitungan Skor** 

Nilai per level: 

- Reactive = 1 

- Emerging = 2 

- Functional = 3 

- Effective = 4 

- Exemplary = 5 

Aturan agregasi: 

- Nilai hanya dihitung untuk dimensi yang diobservasi pada mission tersebut (dimensi yang tidak relevan tidak ikut mempengaruhi skor). 

- Nilai akhir tim merupakan agregasi seluruh mission yang diikuti tim tersebut. 

- Final Mission Score = (Mission Performance Score × 60%) + (T-BOS Score × 40%). 

- Overall Team Score = akumulasi Final Mission Score dari seluruh mission yang diikuti. 

_Catatan: Mission Performance Score (komponen 60%) berasal dari luar T-BOS (skor teknis/gameplay mission) — perlu dikonfirmasi sumber datanya ke tim terkait._ 

## **5. Dashboard & Reporting** 

Sistem menghasilkan output dashboard otomatis berikut: 

|**Output**|**Deskripsi**|
|---|---|
|Radar Chartper Tim|Visualisasi skor 8 dimensi behavioral untuk satu tim|
|HeatmapPerbandingan Tim|Perbandingan skor antar seluruh timper dimensi|
|RankingTim|Rankingkekuatan dan areapengembangan tiaptim|
|Rata-rataper Batch|Rata-rata skor tiapdimensiper batch(Batch 1 vs Batch 2)|
|Executive Summary|3 kekuatan utama & 3 areapengembangan organisasi berdasarkan data observasi|



## **6. Non-Functional Requirements (Rekomendasi)** 

_Belum ditetapkan formal di spesifikasi awal — berikut usulan berdasarkan kebutuhan fungsional di atas, untuk didiskusikan:_ 

BinaHub — Confidential | Halaman 5 

T-BOS — Product Requirements Document 

- Form observasi harus bisa diisi dalam < 1 menit di perangkat mobile/tablet (fasilitator biasanya mengamati sambil berdiri di lapangan). 

- Dropdown & auto-populate harus responsif walau koneksi lapangan terbatas (pertimbangkan offline-first / caching). 

- Role-based access control ketat: fasilitator tidak bisa melihat/mengubah observasi mission lain. 

- Dashboard dapat diakses admin secara real-time setelah observasi disubmit. 

## **7. Asumsi & Pertanyaan Terbuka** 

- Dari mana sumber Mission Performance Score (komponen 60%)? Apakah dari sistem terpisah atau perlu diinput manual? 

- Apakah satu tim bisa diobservasi lebih dari satu kali dalam mission yang sama (misal oleh 2 fasilitator berbeda)? Jika ya, bagaimana agregasinya? 

- Apakah database peserta/tim sudah tersedia sebagai sumber data untuk auto-populate anggota tim? 

- Apakah executive summary dihitung otomatis oleh sistem (rule-based) atau perlu logic/threshold tertentu untuk menentukan top 3 kekuatan & area pengembangan? 

## **8. Next Steps** 

- Review & validasi PRD ini dengan stakeholder terkait (Pak Bilal / Bu Ranis / tim program). 

- Konfirmasi jawaban atas open questions di Bagian 7. 

- Breakdown PRD ini menjadi user stories / task teknis untuk tim development. 

- Desain wireframe form observasi (mobile-first) dan dashboard. 

BinaHub — Confidential | Halaman 6 

