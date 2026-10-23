# Rencana kerja: diagnosis sampai pengembangan berkelanjutan

Disetujui pengguna pada **19 Oktober 2026**; diperbarui pada **22 Oktober 2026**
setelah penelaahan paket CEO dan meeting 20 Oktober. Target 21 Oktober menjadi
checkpoint bagian yang lulus verifikasi, bukan janji seluruh scope baru sudah
rilis. Rencana ini belum mengaktifkan pengiriman atau pembayaran produksi.

## Acuan terbaru dan perubahan cakupan

[Ringkasan sumber dan hasil pemeriksaan](ceo-update-2026-10-20-review.md)
menjadi catatan penelaahan. Acuan baru: Dictionary V5 (34 kompetensi), Catalog
V6 (32 solusi, 173 hubungan Core/Secondary), instrumen PE V2 (37 soal), template
laporan aligned v3.1 dan IDP 90 hari. Status review/pilot pada sumber disimpan
apa adanya. Judul/metadata beberapa dokumen belum konsisten; registry versi
harus mengikat file, hash dan keputusan rilis, bukan menebak dari nama folder.

**Acuan SPIN 22 Oktober:** spesifikasi SPIN v3.2 dan Report Template V3
Catalog31 menyebut FINAL V4/31 solusi. Pengguna kemudian mengesahkan katalog
final terbaru V6 berisi 32 solusi sebagai sumber aktual, dengan allowlist SPIN
SS-01–SS-31. SS-32 tidak masuk SPIN, bukan dihapus dari katalog keseluruhan.
Tidak meminta file katalog lama lagi; versi sumber V6 tidak dilabel ulang V4.
CEO kemudian mengizinkan pencocokan dengan AI dan harga sesuai ketentuan
katalog, termasuk trainer/fasilitator dan modul. Kebutuhan di luar cakupan
dibahas saat konsultasi; pajak belum dinyatakan eksplisit. Lihat
[penelaahan sumber SPIN v3.2](SPIN-V3_2-SOURCE-REVIEW.md).

Prioritas awal adalah Personal Effectiveness. Tiga gratis tetap PE-02/04/06
(18 soal). Cakupan tiga tambahan V2 berjumlah 19 soal karena Integrity mendapat
SJ13. Paket baru belum menyediakan instrumen 34 kompetensi atau instrumen
organisasi baru. Soal baru memakai versi tersendiri; jawaban dan hasil V1 tetap
terikat sumber serta rubriknya.

ItemBank sudah lengkap untuk enam PE tersebut. Yang belum tercakup oleh
paket ini adalah soal/rubrik 28 kompetensi lainnya dan instrumen organisasi
terbaru. Alur organisasi existing tetap menggunakan instrumen lamanya.
Angka 28 bukan kelompok khusus tim: kamus 34 kompetensi adalah acuan kemampuan
orang lintas peran, sehingga dapat mendasari pengembangan individu maupun
program bagi anggota/pemimpin tim. Instrumen tim/organisasi merupakan konteks
pengukuran tersendiri, bukan tambahan 28 kompetensi. Pengembangan soal tetap
bertahap; tidak perlu menyelesaikan semua 28 untuk mulai mengaitkan kebutuhan
tim dengan kompetensi sasaran dan katalog secara jujur tanpa skor baru.
Template email individu telah diterima lewat chat pada 21 Oktober. Template
proposal dan ZIP SPIN tersedia pada shared chat, dengan konfirmasi pengguna
bahwa masalah ZIP telah teratasi; akses/penelaahan lampiran serta integrasi
masih harus diselesaikan.

Proposal SPIN sekarang dirancang untuk pengisian mandiri klien dan pengisian
dibantu konsultan saat meeting, memakai satu mesin pertanyaan/rekomendasi/harga.
Ia memiliki workspace tersendiri dan boleh memakai assessment sebagai referensi.
Proposal katalog otomatis existing tetap dilayani; proposal indikatif SPIN
memerlukan sifat estimasi dan asumsi yang jelas. Bahasa internal dan lampiran
developer tidak masuk dokumen klien.

## Urutan implementasi setelah penelaahan v3

Tahap persiapan sumber A dan adapter preview V2 pada C telah diimplementasikan
lokal pada 21 Oktober; registrasi database dan alur peserta V2 belum diaktifkan.
Bagian lain tetap direncanakan, kecuali status existing yang disebut eksplisit.
Rincian ada di repo API: `docs/BINAINSIGHTS-V3-PREPARATION.md`.

| Urutan | Hasil kerja | Ketergantungan | Kriteria selesai |
| --- | --- | --- | --- |
| A. Registrasi sumber | Manifest hash, versi kamus/katalog/instrumen/laporan/rules dan daftar konflik; import serta diff yang dapat ditinjau | Sumber v3 sudah diterima; penetapan identitas versi/rilis yang konsisten | 34 nama, 32 kode solusi, 173 hubungan, 37 soal cocok sumber; tidak mengubah hasil/ID lama; kunci tetap privat |
| B. Kamus dan katalog V5/V6 | Empat klaster kamus; definisi/key actions; lima solusi tambahan; objective refs, audience, level, readiness, komersial berversi | Konten tersedia; padanan ID lama dan penelaahan ketertelusuran/produk | Semua pemetaan terlacak; SS-10 tepat; SS-32 tetap belum aktif sampai keputusan produk; tidak menerbitkan 34 skor |
| C. Pengisian individu V2 | Registrasi berdampingan V1/V2; policy gratis; DTO; autosave; scoring/replay; akses admin/peserta | A dan keputusan penggunaan revisi PE V2 | Gratis 18, full 37; SR ≥3/4 dan SJT ≥2 valid; Integrity coverage 2/3 atau 3/3; input asing ditolak; retry tidak menggandakan submit |
| D. Rekomendasi dan laporan | Semua kandidat Core/Secondary, pemeriksaan konteks/readiness, ranking; grafik dua metode, ringkasan, 0–2 fokus, praktik 30 hari dan IDP opsional | B/C, konteks minimal dan aturan prioritas yang diselaraskan | Maksimal tiga solusi layak, boleh nol; alasan nyata; web/email/PDF dari snapshot sama; admin berizin melihat bukti yang sesuai |
| E. Proposal SPIN | Satu flow klien/konsultan organisasi, pertanyaan bersyarat, autosave, preview dan proposal indikatif enam bagian; hubungkan CRM/email dan follow-up existing | Sumber V6/32 dengan scope SS-01–SS-31 disahkan; CEO mengizinkan AI matching dan harga katalog termasuk trainer/modul. Fondasi snapshot/validator/quote tarif harian dibuat lokal; form/persistence, evaluasi relevansi, laporan dan delivery belum dihubungkan. Tanpa masa berlaku komersial | Isi sekali; scope/harga dari server; public/internal payload terpisah; tanpa lampiran internal/placeholder; revisi/sent snapshot immutable; idempotent; tidak menggandakan follow-up |
| F. Penerapan dan kelanjutan | Bawa scope yang disepakati ke proyek/AMS; praktik dan checkpoint; ringkasan perubahan serta kebutuhan lanjutan | Kontrak handoff/izin, penanggung jawab, indikator dan template hasil | Ada bukti aktivitas/hasil dan sumber tanggal; follow-up tidak menggandakan pesan; order baru punya bukti tersendiri |
| G. Penawaran individu dan event | Paket asesmen tambahan, checkout/hak, Public Workshop yang benar-benar tersedia | Harga/retake/akses/refund, merchant/gateway dan event aktual | Verifikasi pembayaran server, webhook/recovery idempotent; harga layanan perusahaan tidak dipakai sebagai harga tiket/asesmen |

Keandalan worker, audit akses dan regresi diperiksa pada setiap bagian terkait,
termasuk satu uji internal bahwa job selesai setelah browser ditutup. Uji atau
persetujuan sumber dilakukan sekali per revisi; operasi normal tetap otomatis.
Tidak menambahkan konfigurasi env atau tahapan persetujuan harian untuk admin.

### Hasil persiapan sumber 21 Oktober

- Registry fingerprint 15 sumber dan alat audit/ekspor privat tersedia di API.
  Paket asli cocok; output berkunci jawaban dibuat lokal di luar semua Git.
- Validator, DTO berizin dan perhitungan preview V2 mendukung 18/19/37 soal serta
  Integrity 2/3–3/3. Diff hanya mengembalikan ID item, bukan teks/kunci, dan tidak
  memindahkan jawaban. V1 dan SQL yang sudah dijalankan tidak diubah.
- Tes terkait V1/V2/paket sumber: 76 lulus. Regresi di luar cleanup: 578 lulus,
  tiga dilewati. TypeScript, lint target dan build API 121 halaman lulus.
  Suite penuh masih mempunyai satu kegagalan cleanup existing: file operasi
  tersimpan dengan eksekusi true sementara tes mengharapkan preview. SQL itu
  tidak dijalankan dan setelannya tidak diubah pada pekerjaan ini.
- Ini fondasi kode, belum perubahan halaman publik/admin atau integrasi V2
  end-to-end. Source policy, persistence/RPC, laporan, kamus/katalog runtime,
  email dan aktivasi peserta masih langkah selanjutnya. Tidak ada SQL/env baru
  yang harus dijalankan pengguna sekarang. Pada 22 Oktober fondasi backend
  SPIN ditambahkan terpisah, belum menjadi alur pengisian/pengiriman aktif.

### Rancangan pengisian dan laporan

- Sesi/attempt menyimpan instrument, policy, item, scoring, dictionary,
  catalog/mapping dan report versions yang berlaku. Resume V1 tidak diam-diam
  dipindah ke item V2 walaupun ID soal sama. SQL baru menggunakan migrasi maju;
  SQL 64–69 yang sudah dijalankan tidak diedit untuk mengganti sejarah.
- Jumlah soal diturunkan dari manifest dan hak akses; hindari batas 36/12/18
  global. Aturan form lengkap dipisahkan dari kecukupan bukti skor. UAT mencakup
  draft parsial, NA, submission final, Integrity 2/3 dan hak tiga gratis.
- Alur gratis tetap tanpa password; hasil dikirim melalui tautan pribadi email.
  Autosave tidak menahan navigasi. Feedback submit cepat dan jujur, pekerjaan
  lanjutan memiliki antrean/status tersimpan serta pemulihan backend.
- Pertanyaan konteks tambahan hanya saat diperlukan: relevansi tugas, kesempatan
  menunjukkan perilaku dan tujuan. Gunakan jawaban yang sah dan sudah tersedia.
  Status anggaran/dukungan pengambil keputusan yang dulu dihapus tidak
  dikembalikan ke assessment. Usulan anggaran opsional SPIN dibahas pada flow
  SPIN tersendiri, bukan syarat membuka hasil.
- Laporan mendahulukan ringkasan dan langkah praktik, lalu grafik batang SR/SJT
  berdampingan dengan label metode/coverage. Tidak memakai label persen
  penguasaan, skor gabungan atau ranking presisi antar-SJT. Area yang tidak
  diukur tidak diberi nol. Detail metodologi dibuka bila dibutuhkan.
- Template terbaru merencanakan 0–2 fokus kontekstual; jumlah solusi final 0–3.
  Selaraskan dengan workbook yang masih menyebut 2–3 fokus sebelum rilis.
  IDP 90 hari merupakan lampiran/rencana opsional dengan checkpoint 30/60/90,
  bukan tugas yang diwajibkan untuk menerima laporan gratis.
- Rekomendasi mencatat semua kandidat dan reason codes secara internal.
  Unknown menjadi konfirmasi terarah; penolakan persyaratan wajib menjadi
  tidak sesuai. UI peserta memakai bahasa yang baik tanpa memperlihatkan
  kode, rubrik, skor ranking atau draf internal.
- Persetujuan konsultasi, evaluasi, pemasaran dan akses HR tetap sesuai scope.
  Integrasi AMS memakai konteks yang diotorisasi. Keputusan provider AI existing
  tidak diubah; perhitungan skor/harga tetap deterministik, narasi hanya dari
  payload dan klaim yang diizinkan.

### Kebutuhan tim tetap dihubungkan dengan kompetensi

Arahan pengguna 21 Oktober: rekomendasi program tim juga perlu memakai acuan
kompetensi. Pekerjaan ini masuk tahap B/D, bukan menunggu seluruh instrumen
28 kompetensi selesai. Bagian ini masih rencana, belum pemetaan aktif baru.

1. Gunakan konteks, tujuan dan contoh perilaku dari assessment organisasi yang
   tersedia atau discovery SPIN. Simpan sumber, responden, tanggal serta versi.
   Jangan menafsirkan jawaban satu orang sebagai hasil ukur semua anggota tim.
2. Susun hubungan temuan/perilaku dengan kompetensi sasaran memakai definisi
   dan key actions kamus, untuk ditelaah CEO. Hubungan ini berbeda dari
   crosswalk kompetensi–program yang sudah tersedia pada Catalog V6.
3. Pilih kandidat program dari hubungan Core/Secondary resmi, kemudian periksa
   tujuan belajar, sasaran peserta, konteks dan kesiapan pelaksanaannya.
   Komunikasi/kolaborasi bermasalah tidak otomatis berarti perlu team building.
4. Tampilkan alasan singkat, misalnya kebutuhan koordinasi → Collaboration dan
   Communication → kandidat relevan. Labelnya kebutuhan/kompetensi sasaran,
   bukan skor kelemahan tim. Masalah proses, alat atau kewenangan dapat
   menghasilkan saran klarifikasi/perbaikan kerja, bukan penjualan pelatihan.

Kriteria selesai: alasan rekomendasi terlacak dari bukti ke kompetensi dan
program; tidak membuat 34 skor dari tujuh Area lama; pemetaan yang belum
disahkan tidak diterbitkan sebagai penilaian pasti. Pengukuran kompetensi tim
yang baru tetap mengikuti soal/rubrik dan format CEO saat tersedia.

### Rancangan SPIN dan komersial

**Update 22 Oktober:** spesifikasi SPIN v3.2 dan Report Template V3 Catalog31
menggantikan acuan v3.0. [Penelaahan sumber](SPIN-V3_2-SOURCE-REVIEW.md) mencatat
delta dan [rencana implementasi SPIN](SPIN-V3-IMPLEMENTATION-PLAN.md) mengikuti
kontrak enam bagian, pemisahan public/internal payload dan gerbang publikasi.
Q01–Q28 ditambah QS01 tetap; bukan 27 pertanyaan wajib. Acuan katalog SPIN kini
eksplisit SS-01–SS-31. Pengguna sudah mengesahkan sumber aktual katalog final
V6/32 solusi dengan scope SPIN 31 solusi, menggantikan rujukan V4 pada dokumen.
Tidak meminta file V4 lagi. CEO mengizinkan pencocokan dengan AI serta harga
sesuai katalog termasuk trainer/fasilitator dan modul; kebutuhan tambahan
dibahas saat konsultasi. Matriks manual besar tidak diminta lagi sebagai
syarat memulai. V6 SS32 untuk jalur lain tidak ditimpa. Pengguna menetapkan
SPIN khusus tim/organisasi, tanpa masa berlaku
proposal; follow-up mengikuti fitur penjualan existing. Placeholder masa
berlaku yang masih ada di template tidak diterbitkan, sementara pajak tetap.
Tidak mengubah retensi data, masa akses privat atau otomatis mengaktifkan
pengiriman. Fondasi lokal berupa snapshot 31 solusi, validasi bukti, adapter
AI dan perhitungan investasi tarif harian telah dibuat di repo API (87 tes
sintetis lulus). Belum ada formulir, endpoint, tabel, laporan lengkap/PDF,
antrean atau pengiriman SPIN aktif. Pajak tidak ditebak; total akhir tidak
dihitung. Berikutnya kontrak pertanyaan, persistence dan workspace, evaluasi
kecocokan, lalu integrasi laporan/delivery. Uraian draf di bawah
dipertahankan sebagai riwayat, bukan acuan pertanyaan aktif.

[Draf 10 pertanyaan awal untuk review CEO](spin-questionnaire-ceo-review.md) disiapkan
pada 21 Oktober. Konsep/template sudah tersedia dari chat; fitur SPIN belum
diterapkan. CEO meninjau redaksi, pilihan, percabangan dan pemetaan kebutuhan
sebelum pengembangan form. Ini review versi rancangan, bukan tahapan persetujuan
berulang pada operasi penjualan. Draf bukan soal final dari lampiran ZIP.

Revisi setelah review: dokumen pertanyaan hanya berisi isian untuk diteruskan
ke CEO, tanpa pengantar/catatan developer. Sepuluh pertanyaan awal dilengkapi
17 pertanyaan bersyarat, bukan 27 isian wajib. Konteks yang sudah tersedia
dikonfirmasi, bukan diminta ulang; kontak hanya diminta ketika belum tersedia.
Cabang dipilih berdasarkan kebutuhan: riwayat/hambatan bila perlu, profil dan
owner untuk tim/organisasi, logistik sesuai format kegiatan. Permintaan
spiritual eksplisit membuka pertanyaan khusus; jawaban ingin tahu belum
merupakan persetujuan program. Workshop publik memakai acara, harga dan
kapasitas aktual. Jumlah perkiraan bukan jumlah pasti untuk harga final.
Pilihan belum tahu/tidak ada tidak digabung dengan jawaban substantif pada
multi-select. Isian bebas opsional ditampilkan hanya saat relevan. Durasi
program tidak otomatis ditentukan dari preferensi waktu yang tersedia.

Situation, Problem, Implication dan Need-Payoff dipetakan ke pertanyaan singkat
yang relevan. Pilihan belum tahu tersedia; informasi yang tidak relevan dilewati.
Tujuannya proposal indikatif dalam satu sesi. Target durasi diuji, karena sumber
menyebut 5–8 dan 8–10 menit. Klien tidak harus mengetahui nama training terlebih
dahulu, dan masalah proses/alat dapat menghasilkan saran discovery/konsultasi.

Form mandiri dan form konsultan menyimpan jawaban, provenance serta revisi yang
sama. Konsultan dapat melanjutkan draft klien berizin. Pengisian SPIN tidak
menambah skor kompetensi. Hasil dapat diarahkan ke CTA konsultasi/proposal yang
sesuai; mode klien memproses permintaan yang eksplisit secara otomatis, sedangkan
mode konsultan mengonfirmasi penerima/isi sebelum kirim. Email scanner GET tidak
menjadi pemicu pengiriman baru.

Harga berasal dari snapshot katalog dan aturan komersial server. SS-22 memiliki
tarif khusus; layanan coaching berbeda dari SS-10; venue, perjalanan, pajak,
diskon, durasi dan jumlah batch memerlukan aturan yang nyata. Katalog V6
menyebut tambahan peserta Team Building di atas 150, sementara prototipe chat
menahan kasus itu untuk review; kebijakan otomatis yang disahkan harus eksplisit.
Angka yang belum diketahui tidak diperlakukan sebagai nol.

Aturan produk/template disiapkan sekali. Admin menangani kebutuhan konfirmasi
yang relevan di satu workspace dengan aksi berikutnya yang jelas. Tahap penjualan
tidak otomatis maju menjadi deal/order/invoice hanya karena proposal dibuat.

### Pemeriksaan sebelum rilis v3

1. Validasi checksum, ID/versi, kesetaraan workbook–private JSON–DTO, dictionary
   dan crosswalk. Sumber private/workbook/transkrip tidak dimasukkan ke GitHub.
2. Uji kedua versi dan draft lama, replay hasil, total yang berbeda per hak,
   formula/coverage, unknown/invalid input, no-composite dan tidak ada skor palsu.
3. Uji semua Core/Secondary, learning objective refs, readiness, peran/tujuan,
   sponsor tim/organisasi, SS-27 unknown/yes/no, SS-32 pending dan nol rekomendasi.
4. Uji API/RBAC peserta/admin, akses hasil orang lain, retensi/hapus, izin sharing
   serta payload tanpa kunci. Strix lokal dapat melengkapi verifikasi setelah
   target/model/Docker siap, dengan scope yang sesuai; bukan pengganti tes.
5. Uji web/mobile/email/PDF, keyboard, grafik dan copy. Tutup browser setelah
   submit, simulasikan timeout dan retry; periksa satu hasil/pengiriman.
6. Rilis bertahap sesuai keputusan penggunaan versi baru dan bukti UAT.
   Reviewer isi CEO tetap dihormati; hasil pilot empiris tidak diklaim ada bila
   belum diserahkan. Catat status dan rollback per versi.

SQL 70 cleanup yang sudah selesai tidak dijalankan ulang. Program nyata TBOS
`d1ea232f-2038-4cfd-8c26-59caf4eaf760` serta data terkait dipertahankan.

## Hasil yang ingin dicapai

Admin memahami kebutuhan dan langkah berikutnya tanpa berpindah-pindah mencari
konteks. Klien menerima rekomendasi yang relevan, proposal yang jelas, serta
tindak lanjut berdasarkan hasil program—bukan sekadar promosi berikutnya.

Alur: kebutuhan → assessment → rekomendasi → konsultasi/proposal → pelaksanaan
→ penerapan di pekerjaan → tinjauan hasil → kebutuhan lanjutan/order baru.
Assessment bukan prasyarat wajib konsultasi atau proposal meeting.

## Urutan kerja dan status

| Tahap | Pekerjaan | Status / ketergantungan | Selesai ketika |
| --- | --- | --- | --- |
| 1. Alur yang dapat diandalkan | Verifikasi worker/scheduler, retry dan rekonsiliasi pengiriman; status penerimaan, pemrosesan dan pengiriman tidak tercampur | Perbaikan source ada pada rilis app 0.39/API 0.38; pemanggilan produksi belum terverifikasi. Tidak mengaktifkan antrean lama sebagai efek samping | Satu uji internal menunjukkan job tersimpan, diproses setelah browser ditutup, serta tidak mengirim ganda setelah timeout/retry |
| 2. Konteks klien | Satukan riwayat yang sudah tersedia dan tampilkan brief saat melihat peluang, akun, dan serah terima | Implementasi awal app 0.40: proyeksi baca-saja data dashboard existing | Relasi memakai ID tersimpan, tidak menggabungkan berdasarkan email/nama; tanggal, sumber dan batas kelengkapan terlihat; membuka halaman tidak membuat proyek/email |
| 3. Alasan rekomendasi | Individu: bukti ukur → kompetensi yang diukur. Tim: konteks dan perilaku → kompetensi sasaran yang ditelaah → kandidat program beserta alasan | Sumber individu V2 dan crosswalk V6 tersedia; adapter versi, eligibility dan telaah pemetaan kebutuhan tim diperlukan. Instrumen organisasi baru terpisah | Setiap alasan terlacak; tujuh Area lama tidak menjadi 34 skor; indikasi kebutuhan tim tidak diklaim sebagai pengukuran seluruh tim |
| 4. Proposal SPIN | Workspace terpisah klien/konsultan organisasi: konteks, checklist bersyarat, autosave, harga sesuai aturan, preview dan kirim | CEO menyetujui AI matching dan harga katalog. Fondasi backend lokal untuk 31 solusi V6, bukti dan quote tarif harian tersedia; evaluasi relevansi dan integrasi form/admin/laporan/delivery belum selesai | Laporan enam bagian; public/internal terpisah; proposal indikatif sesuai jawaban, harga nyata, revisi terversi dan pengiriman idempotent; tanpa masa berlaku komersial pada tahap awal |
| 5. Serah terima & penerapan | Bawa referensi kesepakatan ke proyek/assignment AMS; catat tujuan, tindakan penerapan, PIC dan waktu tinjauan | Brief baca-saja tersedia lebih dulu. Snapshot kesepakatan lintas proposal/proyek/AMS dan rencana penerapan belum dibangun | Fasilitator mendapat konteks yang berhak diakses, tidak perlu input ulang; perubahan baru tidak menimpa kesepakatan yang sudah dikirim |
| 6. Ringkasan hasil | Tujuan awal, hasil yang teramati, sumber/tanggal bukti, hambatan, batas klaim dan langkah berikutnya | Manfaatkan observasi TBOS/rekam proyek existing, bukan membuat mesin penilaian tandingan. Format dan ukuran keberhasilan disahkan CEO/klien | Kehadiran, kepuasan, perubahan perilaku dan dampak dibedakan; tidak mengarang ROI atau menyimpulkan sebab-akibat dari perubahan skor |
| 7. Kebutuhan lanjutan | Buat tindak lanjut sesuai kebutuhan nyata dan kaitkan peluang dengan proyek/order berikutnya | Riwayat/order lanjutan dan definisi bukti transaksi masih perlu implementasi | Program selesai, peluang lanjutan, kesepakatan dan order/transaksi nyata memiliki bukti berbeda; label Loyal bukan bukti pembayaran kedua |

## Batas implementasi awal app 0.40

- Timeline menggabungkan aktivitas peluang, assessment, catatan pengiriman
  hasil/proposal, booking, akun, proyek dan aktivitas klien **yang dimuat**.
  Ini belum endpoint detail lengkap/pagination server. Tidak mengklaim seluruh
  riwayat kosong ketika sebuah modul tidak termuat.
- Brief menampilkan satu assessment dengan nama responden dan tanggal sumber.
  Tantangan, tujuan dan dampak yang disampaikan bukan diagnosis sebab atau
  outcome program. Tidak menyatukan jawaban responden berbeda.
- Brief pada serah terima adalah referensi dinamis, bukan snapshot persetujuan
  scope/harga. Tujuan dan indikator proyek existing tetap diisi sesuai kesepakatan.
- Tidak mengambil jawaban individu dari email, inquiry, atau kemiripan identitas.
  Akses hasil individu tetap melalui endpoint yang memeriksa izin peserta dan
  masa akses. Tidak memberi perusahaan/associate akses baru.
- Tampilan riwayat tidak mengirim pesan, mengubah tahap, membuat proyek,
  mengaktifkan worker, atau mengakses provider AI.
- Tujuan/indikator proyek existing ditampilkan terpisah dari brief responden,
  dengan pintasan formulir yang sudah ada. Panel riwayat klien lama yang
  redundan digantikan timeline; tidak menambah persetujuan atau formulir baru.

## Verifikasi implementasi awal

- Suite aplikasi: 327 tes lulus. Pemeriksaan TypeScript dan lint target berubah
  lulus; build produksi berhasil. Ini bukti lokal, bukan deployment.
- `npm run test:client-journey`: dua tes browser Chromium (desktop dan emulasi
  ponsel) memeriksa konteks, buka riwayat, serah terima, formulir indikator,
  Escape, dan lebar 320/768 px. Tidak ada request API atau email produksi.
- Tampilan riwayat bertahap, sumber/tanggal invalid, ID kosong/tidak dikenal,
  kemiripan email/nama, konten teks berbahaya dan responden berbeda diuji.
- Safari, perangkat fisik, pemanggilan scheduler dan pengiriman produksi tidak
  diklaim terverifikasi. Tidak mengubah database/program nyata.

## Prinsip pengalaman pengguna

- Satu konteks klien; detail yang jarang dibutuhkan dibuka bila perlu. Tidak
  menambah 40 menu/fitur hanya karena referensi berisi 40 skills.
- Kegiatan rutin memakai template dan aturan yang disahkan sekali; tidak
  meminta persetujuan berulang untuk setiap langkah. Pengecualian harga,
  scope, penerima atau klaim substantif perlu tinjauan yang relevan.
- AI agent operasional tetap tahap berikutnya. AI boleh mencocokkan kebutuhan
  SPIN ke program dan membantu narasi dari sumber yang disahkan, bukan
  mengubah skor CEO, menentukan harga, membuat bukti, atau
  menjanjikan manfaat. Pemeriksaan sumber bukan klaim model selalu benar.
- Rekomendasi boleh menyarankan konsultasi/perbaikan proses bila bukti tidak
  mendukung pelatihan tertentu. Jangan menambah pertanyaan publik atau aturan
  diagnosis tanpa sumber CEO.
- Evaluasi program agregat berbeda dari refleksi individu berizin. Materi
  pelatihan dan feedback bukan dasar otomatis seleksi/promosi; skor individu
  tidak dibuka ke perusahaan karena membeli program.

## Kelengkapan sumber dan keputusan berikutnya

Sudah diterima: definisi/key actions 34 kompetensi, katalog V6/crosswalk,
ItemBank enam PE V2, template laporan individu, template IDP,
[template email individu](individual-assessment-email-template.md) dari chat
21 Oktober, rancangan/template proposal SPIN pada shared chat, serta spesifikasi
SPIN v3.2 dan Report Template V3 Catalog31 pada 22 Oktober. Dua DOCX terbaru
sudah dibaca lengkap dan dibandingkan dengan v3.0. Keterbatasan akses lampiran
shared chat sebelumnya tidak diartikan bahwa CEO belum membuatnya.

| Yang perlu dilengkapi | Keputusan/berkas yang diperlukan |
| --- | --- |
| Penyelarasan paket v3 | Versi rules/report yang berlaku, 0–2 fokus, keputusan penggunaan revisi V2 dan keputusan SS-32; identitas reviewer/owner tercatat sekali |
| Instrumen di luar PE | Soal/rubrik 28 kompetensi dapat disiapkan bertahap; kamusnya untuk pengembangan individu maupun tim. Instrumen tim/organisasi baru terpisah; telaah pemetaan kebutuhan tim tidak harus menunggu semua soal selesai |
| Email | Email hasil individu sudah diterima; implementasikan teaser dari snapshot dan selaraskan penyebutan SR/SJT. Email blast serta hasil tim/organisasi diperiksa tersendiri |
| Proposal SPIN | Pertanyaan v3.2, report V3, V6/32 scope SS-01–SS-31, AI matching dan penggunaan harga katalog disetujui. Uji relevansi dengan kasus, selesaikan konflik aturan, hubungkan form/admin/laporan/delivery. Tidak meminta matriks manual besar, katalog V4 atau masa berlaku lagi |
| Proposal lainnya | Gunakan template indikatif pada chat sebagai sumber; petakan jalur assessment individu dan tim, scope/harga pasti versus indikatif, serta proses menuju penawaran final |
| Harga dan kapasitas | Untuk SPIN gunakan tarif/kapasitas/durasi katalog termasuk trainer/modul sesuai persetujuan CEO. Kebutuhan di luar cakupan dibahas saat konsultasi, pajak belum dikonfirmasi; jangan membuat diskon, biaya tambahan atau total akhir. Kontrak event/individu terpisah |
| Asesmen berbayar dan workshop | Harga tiga tambahan, retake/akses/refund, satu gateway/merchant; Public Workshop mengikuti event/tanggal/tiket aktual |
| Penerapan dan tinjauan | Contoh indikator hasil, template tinjauan, peran konsultan/AMS serta batas berbagi; baseline/target disepakati per klien |

Penetapan ini tidak menghalangi penyiapan registry, import/diff, kontrak versi,
validator, DTO dan matriks tes. Publikasi menggunakan versi/aturan yang jelas;
admin operasional tidak diminta mengesahkan ulang setiap pengiriman rutin.

## Referensi dan batas penggunaan

Inspirasi: [Polar Bear — Complete Guide for L&D](https://meet-polar-bear.com/skills/complete-guide-ld-pack),
khususnya diagnosis kesenjangan, perencanaan evaluasi, pemeriksaan draf AI dan
pelaporan perubahan. Ini adaptasi konsep untuk kebutuhan BinaHub, bukan salinan
prompt/template atau implementasi metode yang diklaim sudah lengkap.
[README sumber](https://github.com/polar-bear-org/claude-skills/tree/main/packs/complete-guide-ld-pack)
menyebut penggunaan internal dan bukan untuk dijual kembali. Jangan memasang,
menyalin atau mengemas ulang paket dalam layanan komersial tanpa kejelasan izin.

Rencana ini tidak menggantikan
[hardening perjalanan penjualan](sales-journey-hardening.md) atau
[rancangan asesmen berbayar](individual-paid-assessment-plan.md).
