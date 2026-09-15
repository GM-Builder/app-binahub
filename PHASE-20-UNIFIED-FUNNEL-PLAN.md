# Phase 20 — Funnel Akuisisi Terpadu

Status: Part 1 dan Part 2 sudah diimplementasikan secara lokal dan menunggu deploy gabungan serta smoke test. Dokumen ini tidak mengaktifkan outbound atau memanggil API Apollo.

## Keputusan yang sudah dikunci

1. BinaHub memakai **satu landing page umum**, bukan landing page per ICP atau per kampanye.
2. Pengunjung dari sosial media, iklan, pencarian, referral, atau kunjungan langsung dapat memilih tiga jalur: **BinaInsight Assessment**, **Inquiry**, atau **Katalog Produk**.
3. Katalog saat ini adalah pintu minat dan permintaan produk; bukan checkout/pembayaran otomatis.
4. Apollo dipakai **manual** dahulu: pencarian dan ekspor dilakukan di Apollo, lalu data masuk lewat sumber, kampanye, dan batch yang disetujui di BinaHub.
5. Integrasi Apollo Pro hanya disiapkan sebagai arsitektur masa depan. Provider call, enrichment email, discovery otomatis, dan outbound otomatis tetap nonaktif sampai ada keputusan baru.
6. BinaInsight sudah bagian dari automation bisnis. Phase 20 tidak membangun ulang assessment, PDF, email hasil, atau follow-up-nya; Phase 20 menyambungkan konteks asal trafiknya ke funnel yang sama.

## Target akhir Phase 20

Setiap calon klien dapat dijelaskan dengan kalimat sederhana berikut:

> Ia pertama kali datang dari mana, halaman apa yang ia buka, memilih jalur apa, produk apa yang ia minati, lalu akhirnya menjadi inquiry, assessment, lead, peluang, atau klien.

```text
Sosial / iklan / pencarian / Apollo manual / langsung
                         |
                         v
              Landing page umum BinaHub
            /             |              \
           v              v               v
      Assessment       Inquiry          Katalog
           \              |               /
            \             |              /
             v            v             v
     Riwayat perjalanan + lead + minat produk
                         |
                         v
       Human gate, pipeline, follow-up, delivery
```

Tidak semua kunjungan menjadi lead. Sistem hanya menghubungkan data ketika ada tindakan yang berarti (misalnya submit inquiry atau assessment) dan tetap menerapkan validasi, deduplikasi, suppression, consent, serta human gate yang sudah ada.

---

# Part 1 — Jalur Masuk & Attribution Terpadu

Nama kerja: **Phase 20.1 — Unified Inbound Journey**

## Tujuan

Membuat satu jejak perjalanan yang konsisten untuk trafik inbound. Ketika seseorang datang dari Instagram, Google Ads, website partner, atau kunjungan langsung, lalu berpindah halaman dan mengisi assessment/inquiry/katalog, sumber awalnya tidak hilang.

## Masalah yang diselesaikan

Saat ini masing-masing jalur sudah bisa membuat atau memperbarui lead, tetapi attribution terutama berasal dari URL/form yang sedang dibuka. Data “pertama kali datang dari mana” belum menjadi catatan perjalanan yang sama dan tahan perpindahan halaman/domain.

Contoh target setelah Part 1:

```text
Instagram Ad -> landing BinaHub -> melihat katalog -> memilih modul
-> mengirim inquiry -> lead tercatat

Sumber pertama: instagram / paid_social / campaign-september
Sumber terakhir: katalog
Minat produk: modul yang dipilih
Konversi: inquiry
```

## Cakupan pembangunan

| Area | Yang dibangun | Hasil untuk admin |
| --- | --- | --- |
| Klasifikasi sumber | Kamus source, medium, campaign, referrer, dan kategori kanal | “Instagram Ads”, “Google Organic”, “Direct”, bukan data URL yang membingungkan |
| Identitas perjalanan | `journey_id` acak dan opaque untuk pengunjung anonim | Riwayat tidak memakai email di URL dan dapat berlanjut antarhalaman |
| First touch dan last touch | First touch tidak ditimpa; last touch diperbarui secara terkendali | Admin bisa membedakan asal awal dan interaksi terakhir |
| Event funnel | Event landing, lihat katalog, pilih produk, mulai/submit assessment, mulai/submit inquiry | Funnel dapat dihitung dari kunjungan sampai konversi |
| Penggabungan lead | Tautkan journey ke lead saat email/form tervalidasi | Satu lead dapat mempunyai beberapa journey tanpa duplikasi lead |
| Minat katalog | Simpan kode produk yang dilihat/dipilih/diminta | Sales tahu konteks kebutuhan sebelum menghubungi calon klien |
| Tampilan admin | Ringkasan sumber, jalur masuk, konversi, dan detail perjalanan | Bukan hanya daftar lead, tetapi alasan lead itu ada |

## Desain data minimum

Nama tabel dapat disesuaikan dengan konvensi database yang sudah ada, tetapi perilakunya harus seperti ini:

| Entitas | Isi utama | Aturan penting |
| --- | --- | --- |
| `acquisition_journeys` | ID journey, waktu first/last seen, first touch, last touch, status consent | Tidak menyimpan email di token atau URL; first touch immutable |
| `acquisition_events` | Journey, waktu, jenis event, route, attribution normalisasi, metadata aman | Append-only; tidak boleh menghapus bukti konversi |
| `lead_journey_links` | Lead, journey, cara penggabungan, confidence, waktu | Banyak journey boleh ke satu lead; satu journey tidak membuat lead baru sendiri |
| `catalog_interests` | Journey/lead, kode modul, aksi lihat/pilih/kirim, waktu | Tidak mengubah harga atau transaksi |

Attribution tersimpan dalam bentuk terstruktur, minimal: `source`, `medium`, `campaign`, `content`, `term`, `referrer_host`, `landing_path`, dan `classified_channel`.

## Cara kerja pengunjung

1. Pengunjung pertama kali membuka landing page umum BinaHub.
2. Website membaca parameter UTM/referrer bila tersedia, mengubahnya menjadi kategori yang mudah dibaca, lalu meminta/menyimpan `journey_id` yang aman.
3. Saat pengunjung membuka assessment, inquiry, atau katalog, `journey_id` ikut terbawa tanpa memaparkan email atau data sensitif.
4. Saat ia memilih produk, sistem mencatat minat produk pada journey tersebut.
5. Saat form valid dikirim, API mencari lead berdasarkan aturan deduplikasi yang sudah ada. Jika belum ada, lead dibuat; jika sudah ada, lead yang sama diperbarui secara aman.
6. Journey ditautkan ke lead. First touch tetap menunjukkan asal awal, sedangkan last touch menunjukkan interaksi terakhir.
7. Human gate dan suppression tetap berlaku persis seperti sekarang. Pencatatan attribution tidak boleh mengirim email atau mempromosikan lead.

## Komponen per repositori

| Repositori | Tanggung jawab Part 1 |
| --- | --- |
| `website-prod` | Tangkap attribution saat masuk, simpan journey, teruskan konteks ketika ke assessment/inquiry/katalog |
| `binahub-api` | Schema/migrasi, endpoint journey-event, normalisasi attribution, validasi, link journey-ke-lead, RLS, audit log |
| `app-binahub` | Halaman admin “Funnel & Attribution”, filter sumber/kampanye/jalur dan detail perjalanan lead |
| `binahub-automation` | Tidak ada workflow baru yang wajib aktif; hanya konsumsi konteks yang sudah ada bila relevan |

## Urutan implementasi Part 1

1. Tetapkan kamus attribution dan aturan klasifikasinya, termasuk perlakuan `direct`, UTM tidak lengkap, serta referral.
2. Buat migrasi, indeks, RLS, dan audit trail untuk empat entitas di atas.
3. Buat API idempotent untuk membuat journey dan mencatat event; rate limit dan validasi panjang parameter wajib ada.
4. Tambahkan penyimpanan first-party di website serta cara meneruskan token antar `binahub.id` dan `app.binahub.id` secara signed/opaque.
5. Hubungkan submit assessment, inquiry, dan pilihan katalog ke endpoint tersebut.
6. Bangun tampilan admin terlebih dahulu dalam mode baca; tidak ada tombol untuk mengirim pesan.
7. Jalankan unit test, API/RLS smoke, dan E2E pada tiga jalur masuk.

## Kriteria lulus Part 1

- UTM dari iklan sosial tetap terlihat setelah pengunjung membuka katalog lalu mengirim inquiry.
- Kunjungan direct diklasifikasikan sebagai `direct`, bukan dikarang sebagai sosial/iklan.
- Assessment dari journey yang sama menyimpan sumber awal, sumber terakhir, dan event submit.
- Satu email yang melakukan assessment lalu inquiry tetap satu lead, tetapi memiliki riwayat perjalanan lengkap.
- Memilih modul katalog memberi konteks minat produk pada inquiry/lead terkait.
- URL, audit, dan dashboard tidak mengekspos email, token sesi, atau secret.
- Pengunjung anonim tidak bisa membaca data lead/journey orang lain; admin berwenang dapat membaca sesuai RLS.
- Tidak ada email, outbound, atau promosi lead yang dipicu hanya oleh event tracking.

## Di luar Part 1

- Landing page spesifik per ICP/kampanye.
- Pembayaran/checkout katalog.
- Apollo API, enrichment otomatis, dan AI prospecting otomatis.
- Personalisasi konten berdasarkan profil individu.

---

# Part 2 — Outbound Manual Apollo & Konversi Kembali ke Funnel

Nama kerja: **Phase 20.2 — Controlled Manual Outbound**

## Tujuan

Memastikan data yang dicari manual dari Apollo dapat mengikuti jalur yang sama dengan trafik website: sumber jelas, kampanye jelas, minat dan klik tercatat, lalu konversi masuk ke assessment/inquiry/katalog umum tanpa membuat lead ganda.

Ini bukan mesin “spam otomatis”. Pengiriman tetap melalui rule, template approved, suppression, limit, consent/lawful-basis, dan human approval yang sudah disiapkan pada governance.

## Alur yang dirancang

```text
Cari manual di Apollo
        |
        v
Ekspor CSV -> source Apollo manual -> campaign -> batch review
        |
        v
Validasi + dedupe + suppression + human approval
        |
        v
Template approved dengan tautan ke landing umum BinaHub
        |
        v
Klik tautan -> journey baru/lanjutan -> assessment/inquiry/katalog
        |
        v
Journey ditautkan ke lead dan kampanye asal
```

## Cakupan pembangunan

| Area | Yang dibangun | Batas aman |
| --- | --- | --- |
| Source Apollo manual | Jenis source eksplisit `apollo_manual` dan metadata impor | Tidak memanggil API Apollo |
| Kampanye outbound | CTA selalu menuju landing umum BinaHub | Tidak membuat landing page ICP baru |
| Tautan terukur | Token klik opaque/signed yang menunjuk campaign/lead secara terbatas | Email, nama, dan ID mentah tidak ada di URL |
| Konversi | Klik, assessment, inquiry, dan katalog dapat dihubungkan ke campaign asal | Tidak menyimpulkan konversi hanya dari email terkirim |
| Kontrol pengiriman | Preview, approval, audience count, hard cap, suppression check, audit | Default tetap dry-run/disabled hingga release disetujui |
| Dashboard | Conversion by source/campaign dan daftar kandidat yang terblokir | Tidak menampilkan data sensitif ke role biasa |
| Apollo Pro readiness | Kontrak adapter/provider, flags, capability status, dan audit | Flags default `false`; tidak ada provider call pada Phase 20 |

## Arsitektur Apollo untuk masa depan

Part 2 menyiapkan batas yang bersih antara “impor manual” dan “Apollo Pro nanti”. Keduanya memakai model kandidat yang sama sehingga data tidak perlu didesain ulang saat upgrade.

| Mode | Status setelah Phase 20 | Cara data masuk |
| --- | --- | --- |
| `apollo_manual` | Aktif sebagai proses manual yang direview | CSV impor dari hasil pencarian admin |
| `apollo_api_discovery` | Ada kontrak/adapter, **disabled** | Hanya aktif setelah plan/API access benar-benar tersedia dan keputusan baru dibuat |
| `apollo_enrichment` | Ada capability flag, **disabled** | Tidak mencari/menebak work email saat ini |

Syarat untuk mengaktifkan Apollo Pro di masa depan: akses endpoint resmi pada plan, API key yang tervalidasi, data policy/lawful basis, rate limit dan daily cap, test sandbox/dry-run, source dan campaign approved, serta human approval pertama. Itu menjadi fase aktivasi tersendiri, bukan efek samping dari Part 2.

## Urutan implementasi Part 2

1. Tambahkan metadata source/campaign yang membedakan `apollo_manual` dari provider API masa depan.
2. Definisikan format CSV manual yang ketat: field wajib, consent/lawful basis, source URL bila ada, dan alasan impor.
3. Buat generator tautan landing umum dengan token signed, expiry, revocation, serta click audit.
4. Hubungkan landing/Part 1 agar klik kampanye membentuk/menautkan journey tanpa mengekspos identitas penerima.
5. Tambahkan panel preview audience, blocker suppression/duplicate, template approved, dan hard cap pengiriman.
6. Tambahkan dashboard campaign-to-conversion dan audit klik/konversi.
7. Tambahkan adapter interface Apollo Pro + config validator yang hanya melaporkan readiness, bukan melakukan request provider.
8. Uji dengan lima akun internal yang sudah dikuasai engineering, lalu rollback/rekonsiliasi sebelum menyentuh kontak eksternal.

## Kriteria lulus Part 2

- CSV Apollo manual tidak dapat dipromosikan tanpa source, campaign, batch, validasi, dan human approval.
- Duplikasi, alamat invalid, dan contact suppression ditolak atau ditandai tanpa membuat lead ganda.
- Tautan kampanye hanya mengarah ke landing BinaHub umum dan tidak menyimpan email/ID mentah di URL.
- Klik kemudian inquiry/assessment dikaitkan ke kampanye dan lead asal secara auditable.
- Template, audience, batas kirim, dan preview harus lolos sebelum pengiriman apa pun.
- Dry-run menghasilkan audit lengkap namun `sent = 0`.
- Test internal berhasil, lalu kill switch, recovery, dan rekonsiliasi dibuktikan ulang.
- Semua flag Apollo Pro tetap off dan log membuktikan tidak ada panggilan provider.

## Di luar Part 2

- Mengaktifkan Apollo Pro atau membeli plan Apollo.
- Pencarian prospek otomatis oleh AI.
- Enrichment work email otomatis.
- Pengiriman massal tanpa human approval.
- Landing page khusus ICP.

---

# Urutan rilis dan keputusan

| Tahap | Boleh dirilis setelah | Dampak produksi |
| --- | --- | --- |
| 20.1 | Migrasi/RLS, API test, E2E tiga jalur, admin review | Observability funnel saja; tidak mengirim pesan |
| 20.2 dry-run | 20.1 stabil, preview campaign, test akun internal, rollback proof | Mencatat simulasi outreach dan klik test; tanpa outbound nyata |
| 20.2 controlled pilot | Human approval, template/source/campaign approved, cohort kecil, monitoring dan rollback siap | Hanya cohort yang disetujui; tetap memakai landing umum |
| Apollo Pro activation (fase berikutnya) | Keputusan bisnis/privasi, plan API, test provider, limit, approval terpisah | Tidak termasuk dalam Phase 20 |

## Definition of done keseluruhan

Phase 20 selesai bila admin dapat membuka satu dashboard dan menjawab, untuk setiap lead atau campaign: **asal trafiknya, jalur pilihannya, minat produknya, status human gate-nya, dan hasil konversinya**; sambil membuktikan bahwa data anonim aman, deduplikasi/suppression tetap bekerja, dan tidak ada otomatisasi Apollo atau outbound yang aktif tanpa keputusan eksplisit.
