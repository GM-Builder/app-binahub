# Signature Solutions Catalog and Proposal Design

Status: implementation specification based on the CEO catalog and proposal template dated 2026. This is not a price-publication authorization.

Implementation status on 2026-10-01: the 27 solution identities, bilingual names and short summaries, and internal price models are staged by API migration `0057` with `active=false` and `public_visible=false`. The public endpoint suppresses all price fields and supports `locale=id|en`; the app exposes a language switch. The 12-section proposal renderer, standard automatic preliminary guard, and manually priced custom draft are implemented. The CEO document's complete learning objectives, full overview/content, outputs, format, duration, capacity, notes, and editorial English–Indonesian parity still require transcription, translation review, and commercial approval before any staged solution is published. The migration is deliberately not an activation event.

## Decisions and boundaries

- `SS-01` through `SS-27` are the stable solution identifiers. A solution is not the same thing as an existing BinaHub service brand; one solution can involve several brands.
- Public catalog: solution name, intended audience, learning objectives, overview, outputs, format, duration, and capacity. No list price, pricing unit, package amount, raw commercial metadata, or internal cost is returned by a public API.
- Internal catalog: all public fields plus pricing model, standard rate/tier, version, commercial validity, and review status. Only authenticated commercial/admin endpoints may read these values.
- Indonesian is the default public and proposal language. English is an explicit alternative. Both languages use the same `SS` code, scope, price rules, and document structure.
- A standard proposal uses one or more published Signature Solutions without changing their learning architecture. AI may write the need-to-solution narrative, but never the price, quantity, dates, exclusions, or commercial terms. Those come from a versioned catalog/policy snapshot.
- A custom proposal uses the same document layout and base text. The internal owner edits the project-specific scope and investment before an approval and manual send. It is never sent automatically.
- A preliminary recommendation can be auto-sent after an assessment request only when answers, scores, identity, and recommendations are complete; all selected solutions have deterministic approved prices; mapping is unambiguous; the price is within the approved auto-send policy; and the PDF passes validation. Otherwise create an internal review task, not a guessed quote.
- The CEO template requires internal approval above Rp100,000,000. Treat this as a hard ceiling for automatic dispatch even if an older system rule has a higher limit. Do not auto-send an organization-level or custom-priced solution.

## Catalog mapping

| Code | English | Bahasa Indonesia | Pricing model |
| --- | --- | --- | --- |
| SS-01 | Emotional Intelligence | Kecerdasan Emosional | Standard daily rate |
| SS-02 | Professional Excellence | Keunggulan Profesional | Standard daily rate |
| SS-03 | Personal Productivity & Effectiveness | Produktivitas dan Efektivitas Personal | Standard daily rate |
| SS-04 | Communication & Presentation | Komunikasi dan Presentasi | Standard daily rate |
| SS-05 | Service Excellence | Keunggulan Layanan | Standard daily rate |
| SS-06 | Problem Solving, Decision Making, & Innovation | Pemecahan Masalah, Pengambilan Keputusan, dan Inovasi | Standard daily rate |
| SS-07 | First-Time Leader | Pemimpin Baru | Standard daily rate |
| SS-08 | Adaptive Leadership | Kepemimpinan Adaptif | Standard daily rate |
| SS-09 | AI-Powered Professional | Profesional Berdaya AI | Standard daily rate |
| SS-10 | BinaCoach: Growth, Performance & Wellbeing Coaching | BinaCoach: Coaching Pertumbuhan, Kinerja, dan Kesejahteraan | Silver, Gold, Platinum package |
| SS-11 | Team Building | Team Building | Essential, Signature, Enterprise package |
| SS-12 | Trust & Psychological Safety | Kepercayaan dan Keamanan Psikologis | Standard daily rate |
| SS-13 | Team Synergy | Sinergi Tim | Standard daily rate |
| SS-14 | Empathy Experience | Pengalaman Empati | Standard daily rate |
| SS-15 | High Performing Team | Tim Berkinerja Tinggi | Standard daily rate |
| SS-16 | Team Agility | Ketangkasan Tim | Standard daily rate |
| SS-17 | Leading the Team | Memimpin Tim | Standard daily rate |
| SS-18 | Culture Activation | Aktivasi Budaya | Custom scope |
| SS-19 | Change & Organizational Agility | Perubahan dan Ketangkasan Organisasi | Custom scope |
| SS-20 | Leadership Academy | Akademi Kepemimpinan | Custom scope |
| SS-21 | Future Leaders | Pemimpin Masa Depan | Custom scope |
| SS-22 | Internal Trainer & Facilitator Academy | Akademi Pelatih dan Fasilitator Internal | Special daily rate |
| SS-23 | Performance Acceleration | Akselerasi Kinerja | Custom scope |
| SS-24 | AI-Ready Organization | Organisasi Siap AI | Custom scope |
| SS-25 | Future-Ready Organization | Organisasi Siap Masa Depan | Custom scope |
| SS-26 | Impact Measurement & Transformation Review | Pengukuran Dampak dan Tinjauan Transformasi | Custom review |
| SS-27 | Spiritual Leadership Journey | Perjalanan Kepemimpinan Spiritual | Custom journey |

Internal price references from the supplied catalog: ordinary standard programs Rp25,000,000 per day for up to 30 participants; SS-22 Rp30,000,000 per day; SS-10 Silver Rp5,000,000, Gold Rp10,000,000, Platinum Rp16,500,000; SS-11 Essential Rp25,000,000 (up to 30), Signature Rp50,000,000 (31–80), Enterprise Rp75,000,000 (81–150), and >150 requires custom calculation/review. These figures belong only in authenticated commercial data and client-specific proposals, never in public catalog payloads.

## User experience

### Public catalog

Use four quiet category sections: Self, Team, Organization, Specialized. Each card has the code, bilingual name according to selected locale, one-sentence outcome, audience, standard duration, and a `Lihat solusi` action. A detail drawer/page shows learning objectives, core content, deliverables, format, capacity, and a `Diskusikan kebutuhan` action. No pricing column, empty price placeholder, or `Mulai dari` badge. Locale switch preserves the selected solution.

### Internal catalog

The list separates **content readiness** from **commercial readiness**. Admin can review the imported source version, bilingual text, fixed-price rules or custom-scoped status, and publication. Saving a price does not publish it. A preview panel shows exactly the public allowlist, making leakage visible before publication.

### Proposal workspace

One workspace, two creation routes: `Standar` and `Custom`. Standard route shows assessment evidence, matched solution codes, why each fits, catalog version, quantity/capacity, deterministic estimate, and PDF preview. Custom route starts from the same structure but lets an authorized owner edit project-specific scope, deliverables, timeline, and investment; it requires a decision and manual send. Keep the primary action singular (`Buat draf`, then `Pratinjau`, then `Kirim`), with secondary operations behind a menu.

## Proposal visual system

Use a restrained corporate report language inspired by international strategy reports, not a clone of another company's identity: A4 portrait, white pages, BinaHub navy `#0B2C6B`, near-black body, muted gold `#D9A441` only for small accents, one professional sans-serif family, generous margins, left-aligned text, short section titles, running page number and confidentiality footer. Avoid gradients, glow, card mosaics, stock illustrations, and oversized cover decoration. Tables are for comparable facts only. Every recommendation must cite an actual assessment finding in its prose; no unsupported claim or invented measurable impact.

Page sequence: (1) cover and decision summary; (2) client context and assessment evidence; (3) why these solutions and learning objectives; (4) selected solutions and delivery approach; (5) outputs, scope, and quality assurance; (6) investment, exclusions, and commercial terms; (7) next steps and BinaHub profile. Split pages only when content requires it; do not force blank sections or placeholder rows. The preliminary version clearly labels the investment as indicative. The custom version uses the same typography and section order.

## Bahasa Indonesia proposal master copy

1. **Gambaran solusi.** `{{solution_package_name}}` adalah paket BinaHub Signature Solutions yang memadukan satu atau beberapa solusi terpilih untuk menjawab kebutuhan pengembangan dan kapabilitas organisasi `{{company_name}}`. Setiap solusi mempertahankan tujuan pembelajaran dan rancangan intinya. Jika beberapa solusi digabung, BinaHub menyusunnya sebagai satu pengalaman yang padu tanpa mengaburkan hasil yang dituju oleh masing-masing solusi.
2. **Mengapa paket ini.** Paket ini memberikan pengalaman belajar yang fokus dan terstruktur; menghubungkan solusi yang relevan tanpa harus memulai desain dari nol; memadukan eksplorasi, pengalaman, refleksi, latihan, dan penerapan; serta menjelaskan cakupan dan investasi agar keputusan dapat diambil dengan lebih cepat.
3. **Tujuan pembelajaran.** Setelah mengikuti solusi terpilih, peserta diharapkan mampu `{{learning_objectives}}`. Daftar ini diambil dari tujuan resmi setiap solusi, bukan dikarang dari hasil AI.
4. **Solusi terpilih.** Tampilkan hanya solusi yang benar-benar dipilih, dengan kode, nama, fokus pembelajaran, durasi, dan jumlah peserta. Jangan menampilkan baris template yang kosong.
5. **Pengalaman belajar dan pelaksanaan.** Sesuai rancangan solusi, kegiatan dapat meliputi pembelajaran terfasilitasi, aktivitas atau simulasi, refleksi individu dan kelompok, diskusi terstruktur, serta penerapan di tempat kerja.
6. **Yang disediakan BinaHub.** Fasilitasi solusi terpilih, materi pembelajaran standar yang relevan, fasilitator sesuai kebutuhan, pengalaman peserta yang tercakup dalam solusi, dan koordinasi persiapan dengan PIC klien.
7. **Investasi.** Investasi mencerminkan solusi dan cakupan pelaksanaan dalam proposal ini. Nilai belum termasuk tempat kegiatan, perangkat elektronik yang diperlukan (termasuk proyektor, layar, dan tata suara), konsumsi peserta, transportasi dan akomodasi tim BinaHub untuk pelaksanaan di luar Jakarta, serta pajak yang berlaku, kecuali bila dinyatakan lain secara tertulis.
8. **Cakupan dan jaminan mutu.** Proposal mencakup Signature Solutions sesuai katalog resmi BinaHub. Penyesuaian koordinasi pelaksanaan yang kecil tidak mengubah rancangan solusi. Perubahan besar pada tujuan bisnis, kerangka kompetensi, peserta, durasi, metode, asesmen, coaching, pengukuran, atau keluaran khusus dapat memerlukan proposal Custom Solution.
9. **Solusi standar atau custom.** Jika kebutuhan melampaui cakupan solusi terpilih, BinaHub akan mengusulkan konsultasi singkat sebelum menyusun pendekatan custom.
10. **Ketentuan komersial.** Berlaku hingga `{{proposal_valid_until}}`; jadwal dan ketersediaan fasilitator menunggu konfirmasi; pelaksanaan dimulai setelah kesepakatan komersial dan administrasi (termasuk PO/SPK bila relevan); perubahan peserta, tanggal, lokasi, format, cakupan, atau persyaratan setelah konfirmasi dapat mengubah investasi; ketentuan pengecualian dan pajak mengikuti bagian investasi; termin pembayaran `{{payment_terms}}`; transaksi di atas Rp100.000.000 memerlukan persetujuan internal BinaHub sebelum komitmen final.
11. **Langkah berikutnya.** Bila paket ini sesuai dengan kebutuhan `{{company_name}}`, mohon konfirmasikan minat kepada tim BinaHub. Kita kemudian menyelaraskan jadwal, PIC, dan dokumen administratif. Jika kebutuhan lebih spesifik atau strategis, konsultasi singkat akan membantu menentukan pendekatan yang tepat.
12. **Tentang BinaHub.** BinaHub membantu organisasi mengembangkan kapabilitas manusia, menjalankan transformasi, dan menghasilkan dampak yang berkelanjutan. People. Learning. Elevated.

The English document retains the CEO's wording as the approved English master. The Indonesian copy above is the parallel master; client-specific facts and official solution objectives are inserted as data, not free-form placeholders.

## Backend controls and rollout

1. Import all 27 solutions as a versioned, initially unpublished catalog snapshot. Preserve existing catalog records and proposal history. Content review and price approval are separate gates.
2. Public catalog queries an explicit column allowlist. Test recursively that no key matching price, fee, rate, cost, investment, or commercial appears in anonymous responses. Authenticated admin APIs may read commercial fields.
3. Use deterministic solution matching from assessment dimensions/recommendations and structured tags. AI explains *why* a matched solution is appropriate, but cannot choose a different solution or invent a fee. Ambiguous matches enter a human queue.
4. Snapshot selected codes, localized text, catalog version, price rule, quantity, exclusions, and approval policy when a proposal is generated. PDF and email use this snapshot, so later catalog edits do not silently alter a sent offer.
5. Before auto-send: validate input completeness, fixed-price eligibility, capacity, amount threshold, PDF generation, recipient, locale, and idempotency key. For custom scope, missing price, >Rp100m, or failed checks, create a review item and do not send.
6. Add integration tests for Indonesian/English catalog, anonymous price non-disclosure, standard auto-send, manual custom approval, PDF content, duplicate clicks, and inquiry edits. Deploy API first, apply migration, verify public endpoint, then deploy app; enable new catalog publication and auto-send only after internal review.
