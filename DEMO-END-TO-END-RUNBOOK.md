# Runbook demo realtime: akuisisi sampai order pertama

Tanggal persiapan: 3 Oktober 2026. Dokumen ini untuk uji operasional beberapa hari dengan akun internal yang dikuasai tim atau calon klien nyata yang datanya boleh diproses sesuai kebijakan perusahaan. Alur di bawah mengasumsikan deployment publik/production; konfirmasi pilihan lingkungan sebelum tindakan yang menulis data. Jangan mengubah status menjadi deal `Berhasil` hanya untuk membuat demo tampak selesai.

## Definisi sukses dan batas produk

**Target demo yang disepakati:** minimal satu perjalanan inbound **atau** outbound tercatat, orang tersebut mengirim inquiry/assessment, tim melakukan tindak lanjut, klien menyetujui pesanan pertama, peluang di pipeline ditandai `Berhasil`, dan deal diserahkan ke `Klien & Pelaksanaan` sebagai akun serta proyek awal. Jalankan kedua jalur akuisisi bila ingin membandingkan sumber; satu klien yang sama tidak perlu dipaksa melewati keduanya.

**Bukti order:** persetujuan tertulis atas proposal/ruang lingkup, PO/kontrak, atau pembayaran sesuai proses BinaHub. Nomor dan dokumen komersial dapat dicatat di sistem perusahaan yang berwenang; jangan menampilkan detail sensitif saat screen sharing. `won` adalah pencatatan keputusan sales, **bukan** checkout, invoice, atau pembayaran otomatis. Katalog publik adalah pintu minat, bukan keranjang pembayaran.

**Repeat order** tidak menjadi syarat lulus demo ini. Setelah proyek pertama berjalan, menu `Peluang Lanjutan → Pesanan ulang` dapat diperlihatkan sebagai fase berikutnya, tetapi jangan mengaku sudah terjadi order kedua. Status `Pesanan ulang → Berhasil` saat ini tidak otomatis membuat proyek/order kedua.

## Peran dan data yang disiapkan

| Peran | Orang yang ditunjuk | Tanggung jawab |
| --- | --- | --- |
| Presenter/operator | Isi sebelum mulai | Membuka website, mencatat bukti dan ID, mengatur alur layar |
| Prospek internal/klien | Isi sebelum mulai | Menggunakan inbox dan nomor yang benar-benar dikuasai; menjawab form secara jujur |
| Sales owner | Isi sebelum mulai | Meninjau lead, konsultasi, proposal, persetujuan komersial |
| Admin acquisition/legal | Isi sebelum mulai | Menyetujui source, campaign, batch, dasar pemrosesan data dan outreach |
| Delivery owner | Isi sebelum mulai | Menerima handoff dan proyek awal |
| Iklan/budget owner | Isi sebelum mulai | Menyetujui materi, audiens, batas biaya, jadwal, dan aktivasi iklan |

Gunakan dua identitas yang **berbeda** bila menguji dua jalur: `Prospek Inbound` dan `Prospek Outbound`. Pakai email internal aktif yang berbeda dan browser/profile terpisah agar first-touch tidak tercampur. Jika menggunakan klien nyata, gunakan hanya data yang memang boleh diproses; jangan mencampur data prospek internal dengan data klien nyata. Catat nama organisasi, email tersamarkan, owner, waktu, ID journey, ID lead/assessment/inquiry, ID proposal, ID akun, dan ID proyek dalam lembar bukti yang dibatasi aksesnya. Jangan pernah menaruh email atau nomor telepon di parameter URL/UTM.

## Gerbang sebelum hari pertama

1. Pastikan login admin ke `https://app.binahub.id/admin/acquisition`, `/admin/assessments`, `/admin/inquiries`, `/admin/pipeline`, dan `/admin/clients` berhasil untuk role yang tepat. Jangan membagikan password saat demo.
2. Buka `https://binahub.id/`, katalog publik `https://binahub.id/id/pricing/`, dan `https://binahub.id/insight`. Verifikasi dari ponsel sungguhan: CTA, katalog tanpa harga publik, perpindahan ke `app.binahub.id/insight`, serta form inquiry. Jangan mengandalkan `localhost:3001` sebagai bukti deployment.
3. Periksa `https://api.binahub.id/api/health` dan versi deploy. Health 200 hanya membuktikan API hidup, bukan bahwa AI, database, email, atau integrasi iklan siap. Minta admin deployment memastikan `LAPAKVIP_API_KEY` terpasang **pada project API** dan lihat log/observability untuk membuktikan permintaan assessment memakai LapakVIP; kode hanya memprioritaskannya ketika key tersedia, sementara provider lama masih ada sebagai fallback. Jangan tampilkan nilai key. Lakukan **satu** assessment internal lengkap sebelum mengajak klien nyata; pastikan hasil sukses, email hasil diterima, dan record muncul di admin. Jika muncul 502, hentikan langkah assessment dan kumpulkan waktu/request ID/log; jangan berulang kali submit.
4. Di `Kontrol Akuisisi → Inbound`, pastikan `Perjalanan calon klien` tersedia, bukan pesan bahwa tracking database belum siap. Lakukan satu klik URL UTM internal untuk memeriksa first-touch dan jumlah journey bertambah. Jangan menyimpulkan konversi sebelum form benar-benar dikirim.
5. Di `Kontrol Akuisisi → Data & kampanye`, pastikan sumber dan kampanye yang akan dipakai sudah ada dan disetujui. Jika memakai data outbound nyata, dasar pemrosesan, kebijakan privasi, masa simpan, suppression, batas kirim, dan persetujuan manusia harus lengkap.
6. Tentukan satu produk/modul yang benar-benar `ready`, aktif, dan cocok dengan kebutuhan calon klien. Harga tetap internal. Verifikasi aturan bisnis dan proposal gate; draft proposal berbantuan AI perlu diuji dengan akun internal lebih dahulu, lalu ditinjau manusia sebelum dikirim.
7. Siapkan template proposal, pemilik komersial, bukti penerimaan order, dan pemilik delivery. Jika tidak ada mekanisme PO/kontrak/pembayaran yang dapat ditunjukkan, demo berhenti pada `proposal/negosiasi`, bukan `won`.
8. Bila menampilkan AMS, verifikasi hak akses dan integrasi HMAC secara terpisah. Smoke baca-saja yang pernah dijalankan hanya membuktikan health/penolakan akses anonim; belum membuktikan assignment sungguhan. AMS tidak perlu dipaksakan masuk ke jalur akuisisi sampai order pertama.

**Hasil pemeriksaan baca-saja pada saat persiapan:** endpoint health API merespons 200 dengan versi `0.27.7`/revision `386d1b03a8cc`; homepage, katalog publik, halaman assessment website dan app merespons 200. AMS juga pernah merespons 200 pada pemeriksaan awal. Belum ada submit assessment, pembuktian email, login admin, transaksi, atau iklan yang dijalankan untuk runbook ini. Status tersebut harus dicek ulang menjelang demo.

## Penandaan kampanye dan link

Satu landing publik umum dipakai untuk semua kampanye. Siapkan **dua** URL berbeda agar sumber tidak tertukar:

```text
Instagram: https://binahub.id/?utm_source=instagram&utm_medium=paid_social&utm_campaign=demo_e2e_202610&utm_content=ig_creative_a
TikTok:   https://binahub.id/?utm_source=tiktok&utm_medium=paid_social&utm_campaign=demo_e2e_202610&utm_content=tt_creative_a
```

Nama kampanye final boleh berubah, tetapi samakan dengan catatan admin dan jangan pakai spasi/PII. Kode `instagram` dan `tiktok` dengan `paid_social` dikenali classifier inbound API sebagai iklan sosial. Di form source governance, penyedia `meta_ads` tersedia; TikTok saat ini belum memiliki pilihan provider khusus sehingga gunakan `other` secara jujur bila source administratif diperlukan. UTM tetap membawa identitas TikTok pada journey.

Untuk iklan berbayar, pemilik budget menyiapkan akun, akses, materi, batas biaya dan tanggal berhenti. Buat draft iklan dengan tujuan mengarahkan ke **website** BinaHub, cek URL final/preview di ponsel, lalu publikasikan hanya setelah owner menyetujui biaya. Jangan memakai instant lead form platform bila yang ingin diuji adalah konversi form BinaHub. TikTok menjelaskan setup campaign dan penambahan UTM pada [panduan campaign](https://ads.tiktok.com/help/article/campaign-set-up) dan [panduan parameter URL](https://ads.tiktok.com/resources/help/article/how-to-add-url-parameters-to-your-website-url-in-tiktok-ads-manager?lang=id); Meta menjelaskan penempatan Instagram Reels via [Meta Ads Manager](https://www.facebook.com/business/ads/facebook-instagram-reels-ads). UI platform dapat berubah, jadi cocokkan preview final sebelum tayang. **Tidak ada belanja iklan atau publikasi dilakukan selama persiapan ini.**

## Jalur A — inbound (iklan atau kunjungan organik)

1. **Akuisisi:** calon klien membuka link Instagram/TikTok di ponsel. Untuk uji internal, buka URL bertag di browser bersih; tandai di bukti bahwa itu *simulasi klik beratribusi*, bukan impresi/klik iklan berbayar. Untuk kampanye nyata, simpan screenshot campaign/ad aktif dan klik yang benar-benar datang dari platform.
2. **Eksplorasi:** dari homepage buka katalog dan pilih produk yang relevan, atau langsung mulai diagnosa gratis. Tunjukkan bahwa pengalaman mobile dapat dipahami tanpa harga publik. Jangan menjanjikan harga final dari harga dasar internal.
3. **Konversi:** calon klien mengirim **satu** inquiry atau assessment memakai email yang sah. Assessment perlu waktu untuk semua pertanyaan dan AI; inquiry adalah jalur cadangan bila assessment bermasalah. Tunggu halaman sukses dan email hasil bila assessment dipakai.
4. **Bukti di admin:** `Akuisisi → Inbound` menunjukkan kanal `Iklan sosial`, UTM dan journey. `Inquiry Masuk` atau `Assessment` menunjukkan record form yang sama. Catat ID dan waktu. Jika journey belum tertaut ke lead, hentikan klaim “end to end” dan investigasi.

## Jalur B — outbound terkontrol

1. `Akuisisi → Data & kampanye`: buat/cek source `AI Lead Discovery — Apollo` dan campaign manual. Untuk uji awal, gunakan **akun internal**; untuk calon klien nyata, pastikan dasar pemrosesan dan izin outreach sah. Apollo Free/manual hanyalah riset dan impor, bukan mesin kirim otomatis.
2. Siapkan file CSV dengan kolom `name,email,company,role_title,industry,location,employee_range,website_url,linkedin_url,source_url,consent_status`. Jangan menebak alamat email. Isi `import_key` unik, unggah sebagai `Batch Prospek`, periksa valid/duplikat/suppressed, lalu `Tinjau`. Approval batch belum mengirim pesan.
3. `Akuisisi → Outbound`: pilih kampanye dan prospek valid; klik `Buat tautan UAT`. Tautan ini hanya membuat link terukur, **tidak** mengirim email. Bila tombol tidak siap, verifikasi konfigurasi signing/approval dengan admin; jangan mengganti dengan URL yang memuat email atau ID mentah.
4. Untuk akun internal, kirim link melalui kanal internal yang disetujui. Untuk prospek nyata, lakukan review template, daftar jangan dihubungi, batas kirim, persetujuan manusia, lalu kirim melalui proses yang berwenang. Jangan mengirim outreach massal untuk mengejar demo.
5. Penerima membuka link, masuk ke landing umum, lalu mengirim inquiry/assessment. Di admin, cocokkan campaign, klik/journey, record form, dan lead yang sama. Link terkirim atau dibuka saja **bukan** konversi.

## Alur bersama — dari lead ke order

1. **Triage** — Sales owner buka `https://app.binahub.id/admin/inquiries` atau `/admin/assessments`. Periksa kebutuhan, organisasi, kontak, minat katalog, dan hasil assessment bila ada. Cocokkan sumber/journey di `Akuisisi`. Jika ada AI draft, baca dan koreksi; jangan langsung kirim respons yang belum direview.
2. **Kualifikasi** — Di `/admin/pipeline`, buka lead yang sama. Pindah `Teridentifikasi → Terkualifikasi`; isi owner, tindakan berikutnya, dan tenggat. Catat hasil diskusi nyata, bukan status fiktif.
3. **Konsultasi** — Jadwalkan dan lakukan discovery. Konfirmasi masalah, hasil yang diinginkan, scope, pemilik keputusan, waktu, dan siapa yang akan menerima proposal. Simpan notulen minimum yang aman. Tahap `Konsultasi` tidak berarti order.
4. **Proposal** — Pilih modul katalog yang sudah siap; buat draft proposal hanya bila assessment/gate memenuhi syarat. Tinjau teks, deliverable, pengecualian, harga internal, pajak, durasi, dan risiko. Minta persetujuan manusia sesuai gate; kirim ke alamat yang benar hanya setelah semua pihak menyetujui. Bila AI gagal, gunakan proses proposal manual perusahaan; jangan mengaku proposal dari aplikasi sukses bila tidak demikian.
5. **Negosiasi dan keputusan** — Rekam revisi scope/harga yang disetujui. Masuk `Negosiasi`. Tunggu bukti order nyata: acceptance tertulis, PO/kontrak, atau pembayaran sesuai kebijakan. Jangan mengubah ke `Berhasil` hanya karena calon klien berkata “tertarik”.
6. **Won dan handoff** — Setelah bukti order ada, tandai peluang `Berhasil` di pipeline. Di `/admin/clients`, cari `Deal Menunggu Serah Terima`, klik `Serahkan`, isi commercial owner, delivery owner, judul proyek awal dan jadwal kickoff. Verifikasi akun klien dan proyek awal muncul. Inilah titik akhir minimum demo.
7. **Opsional sesudah order** — Tunjukkan milestone pertama dan status proyek yang benar-benar dikerjakan. `Peluang Lanjutan → Pesanan ulang` hanya dikenalkan sebagai roadmap retensi, tidak dihitung sebagai order kedua.

## Rencana pelaksanaan beberapa hari

| Waktu | Kegiatan | Bukti untuk lanjut |
| --- | --- | --- |
| H-2/H-1 | Preflight teknis, satu assessment internal lengkap, uji inbox, cek katalog/gate/proposal, siapkan dua identitas | Semua gerbang kritis hijau; masalah tercatat |
| Hari 1 | Jalankan link UTM internal dan outbound internal; setelah lulus, aktifkan iklan dengan izin budget owner | Journey dan form nyata tertaut ke lead; ad preview/URL benar |
| Hari 2–n | Pantau inbound nyata, tindak lanjuti lead, konsultasi, proposal, negosiasi | Setiap tahap punya owner, waktu, dan tindakan berikutnya |
| Hari order | Terima bukti acceptance/PO/kontrak/pembayaran, tandai `Berhasil`, handoff | Satu lead → satu deal won → satu akun klien + proyek awal |
| Setelahnya | Rekonsiliasi hasil, biaya iklan, kegagalan dan catatan produk | Laporan tanpa PII/secrets di layar publik |

Tidak ada jaminan iklan menghasilkan order dalam jangka tertentu. Jika klien belum order, presentasikan tahapan yang benar-benar tercapai dan lanjutkan monitoring; jangan mengisi status kemenangan palsu.

## Lembar bukti yang diisi operator

```text
Tanggal/waktu + zona waktu:
Jalur: inbound Instagram / inbound TikTok / outbound internal / outbound nyata
Nama organisasi (boleh disamarkan untuk presentasi):
UTM / source / campaign / import_key:
ID journey + first touch + last touch:
ID inquiry atau assessment + status hasil/email:
ID lead + tahap pipeline + sales owner:
ID proposal + status approval + tanggal kirim:
Bukti order (jenis, tanggal, lokasi arsip internal; TANPA menyalin dokumen sensitif):
ID account + ID project awal + delivery owner:
Masalah, workaround, dan tindak lanjut:
```

## Stop condition dan fallback

- **502/AI gagal:** simpan waktu dan request ID/log, hentikan submit berulang; gunakan inquiry untuk mempertahankan jalur konversi, tetapi laporkan assessment sebagai belum lulus.
- **Attribution tidak muncul:** jangan lanjut mengklaim sumber iklan; cek URL final, redirect antar domain, consent/tracking, dan `phase20Ready` di panel admin.
- **Email tidak diterima:** cek alamat, status kirim, spam, dan provider; jangan menandai proposal/result terkirim tanpa bukti.
- **Proposal gate menolak:** lengkapi data/katalog/approval; jangan bypass dengan status palsu.
- **Belum ada acceptance/PO/kontrak/pembayaran:** berhenti di `Proposal` atau `Negosiasi`. Ini bukan demo gagal teknis, melainkan proses komersial belum selesai.
- **Iklan menghabiskan budget tanpa konversi:** pause sesuai batas yang ditetapkan budget owner. Jangan menaikkan biaya otomatis.
- **Data pribadi muncul saat screen share:** berhenti, tutup tampilan, gunakan bukti tersamarkan.

## Kalimat presenter yang aman

> “Ini perjalanan pelanggan yang benar-benar terjadi: dari sumber awal, kunjungan website, minat produk atau diagnosa, form masuk, tindak lanjut sales, proposal yang disetujui manusia, sampai bukti order dan serah terima. Dashboard memperlihatkan status operasionalnya; bukti komersial tetap di arsip perusahaan. Bila ada tahap yang belum terjadi, kami tampilkan apa adanya.”

Catatan perubahan: file ini hanya panduan. Ia tidak mengaktifkan iklan, mengimpor data, mengirim outreach, membuat order, atau mengubah database produksi.
