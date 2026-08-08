# PRD v0.4

# BinaHub App — Modular Operational Platform (Practical Architecture Version)

Status: Ready for System Design & Engineering Breakdown
Supersedes: PRD v0.3 ("Evidence-Based Transformation Operating System")
Perubahan utama dari v0.3: arsitektur generik 7-layer (Tenant → Engagement → Evidence → Capability → Behavior → Outcome) diturunkan jadi visi jangka panjang, bukan fondasi wajib. MVP sekarang modular per layanan.

---

# 1. Product Vision

BinaHub App (`app.binahub.id`) adalah **hub operasional** yang menyatukan workflow terautentikasi dari berbagai layanan BinaHub — BinaInsight, BinaImpact, T-BOS (BinaPlay), dan layanan berikutnya — di satu platform dengan satu sistem login.

Setiap layanan punya kebutuhan data dan alur kerja sendiri. Platform ini menyediakan **fondasi bersama** (autentikasi, role, shell dashboard), bukan memaksa semua layanan mengikuti satu model data generik.

---

## North Star

Bukan jumlah assessment/training/report yang dihasilkan satu modul, tapi:

```
Jumlah layanan BinaHub yang berjalan penuh di app.binahub.id
dengan pengalaman login & navigasi yang konsisten
```

Metrik dampak per layanan (peningkatan capability, skor tim, dsb) tetap penting, tapi diukur **per modul**, belum digeneralisasi lintas modul — lihat Bagian 9 soal Evidence/Capability sebagai visi jangka panjang, bukan syarat MVP.

---

# 2. Core Principle

## 1. Modular-first, bukan Engine-first

Setiap modul (BinaInsight, BinaImpact, T-BOS, dst) punya skema data sendiri (tabel prefixed, misal `impact_*`, `tbos_*`). **Jangan bangun abstraksi generik lintas modul sebelum ada ≥2-3 modul yang terbukti butuh pola yang sama persis.** Ini prinsip yang sudah dipegang di `ROADMAP.md` platform ini — PRD v0.4 menegaskannya sebagai aturan wajib, bukan sekadar rekomendasi.

## 2. Reuse fondasi, bukan reuse abstraksi bisnis

Yang di-reuse antar modul: Supabase Auth, tabel `profiles` + role, layout shell dashboard per role. Yang **tidak** di-reuse secara paksa: model data spesifik-domain satu modul ke modul lain.

## 3. Work-first, not AI-first

Sistem harus berjalan tanpa AI. AI (Bima AI) tetap sebagai lapisan interpretasi opsional di masa depan (Bagian 9), bukan prasyarat.

## 4. Everything must map to a real workflow

Tidak ada konsep yang tidak punya action nyata di UI — prinsip ini dipertahankan dari v0.3.

---

# 3. Core System Architecture (MVP — Modular)

## LAYER 1 — Auth & Role (Single-Org)

```
auth.users (Supabase Auth)
└── profiles (role: peserta | facilitator | admin | client*)
```

* Multi-tenant/multi-organization (isolasi banyak klien, billing) **ditunda** — lihat Bagian 9. Saat ini platform melayani satu organisasi (BinaHub sendiri) dan program-programnya.
* `*` Role `client` sudah dipakai BinaInsight/BinaImpact untuk konsumen assessment eksternal. Role `peserta` baru diperkenalkan lewat T-BOS untuk anggota tim internal program. **Perlu dikonfirmasi**: apakah `client` dan `peserta` digabung jadi satu role, atau tetap dua role terpisah dengan konteks beda (lihat Bagian 8, Open Item).

## LAYER 2 — Role-Based Access (Auto-Redirect)

* Signup lewat satu portal, default role = `peserta`/`client` (akun umum).
* Admin meng-assign role lain (`facilitator`, dst) lewat panel admin — bukan self-service.
* Perubahan role memicu force-logout; login berikutnya otomatis diarahkan ke dashboard sesuai role terbaru (tidak ada pilihan manual di frontend).

## LAYER 3 — Product Modules

Setiap modul berdiri di atas Layer 1 & 2, dengan skema data dan halaman sendiri. Lihat Bagian 4.

---

# 4. Product Modules (Current Scope)

## MODULE 1 — Authentication & Role System (fondasi bersama)

Login, signup, role assignment, auto-redirect. Dipakai semua modul di bawah.

## MODULE 2 — BinaInsight (existing placeholder)

Assessment form untuk klien eksternal. Tidak diubah oleh PRD ini — skema/tabel existing tetap dipertahankan (lihat `README.md`: "Do not rename or delete existing BinaInsight tables").

## MODULE 3 — BinaImpact MVP (existing placeholder)

Assessment 4 model × 2 level × 3 section untuk kebutuhan client pitch. Tidak diubah oleh PRD ini.

## MODULE 4 — T-BOS / BinaPlay (NEW)

Team Behavioral Observation System — fasilitator menilai perilaku tim peserta selama mission/game simulasi, dengan dashboard agregat untuk admin.

* Role yang dipakai: `peserta` (default), `facilitator` (di-assign admin), `admin`.
* Skema data, logika skor, dan spesifikasi UI **tidak** mengikuti Evidence/Capability Layer generik v0.3 — T-BOS punya dokumen sendiri:
  * `T-BOS_PRD_v1.docx` — requirement lengkap
  * `ARCHITECTURE.md`, `DATA-MODEL.md`, `SCORING-LOGIC.md`, `STATE-MACHINE.md`, `ROLES-PERMISSIONS.md`, `DASHBOARD-SPEC.md`, `ADR.md`, `ROADMAP.md` — detail teknis & keputusan arsitektur (lihat ADR-002, ADR-009, ADR-011)
* Landing page dan dashboard fasilitator app.binahub.id dirombak untuk mengakomodasi modul ini (ADR-010).

## MODULE 5+ — Layanan Berikutnya

Pola yang sama: fondasi Layer 1-2 di-reuse, skema data & halaman modul baru dibuat sendiri, tidak dipaksa masuk abstraksi generik sampai ada bukti pola berulang.

---

# 5. Data Flow Principle (per Modul)

Setiap modul mengelola data flow-nya sendiri. Prinsip lintas modul yang tetap berlaku:

## Rule 1

Setiap modul bertanggung jawab atas skema datanya sendiri — tidak menulis ke tabel modul lain.

## Rule 2

Modul baru **tidak wajib** memodelkan datanya sebagai "Evidence" generik. Kalau suatu saat 2-3 modul terbukti punya bentuk data yang identik, generalisasi baru dipertimbangkan — bukan didesain di muka.

## Rule 3

Perubahan role/akses selalu lewat Layer 1-2 (fondasi bersama), tidak diimplementasikan ulang per modul.

---

# 6. AI Strategy — Ditunda

Bima AI (Evidence Interpreter + Insight Generator dari v0.3) **tidak masuk scope saat ini**. Dicatat sebagai arah jangka panjang di Bagian 9, bukan dependency modul manapun yang sedang dikerjakan (termasuk T-BOS).

---

# 7. MVP Scope (Realistis, per Modul)

Roadmap detail ada di `ROADMAP.md` masing-masing (platform-level di `ROADMAP.md` repo ini, T-BOS-specific di `ROADMAP.md` T-BOS). Ringkasan tahapan platform:

1. **Fondasi**: Auth, role, auto-redirect (Layer 1-2) — prasyarat semua modul.
2. **Modul berjalan satu-satu**: BinaInsight & BinaImpact (existing), T-BOS (baru) — dikerjakan sebagai unit terpisah, tidak saling blocking.
3. **Generalisasi (jika terbukti perlu)**: baru dipertimbangkan setelah ≥2-3 modul stabil dan pola datanya benar-benar tumpang tindih.

---

# 8. Open Items

* Role `client` vs `peserta` — digabung atau tetap terpisah? (Bagian 3, Layer 1)
* Siapa admin pertama yang berwenang assign role — dibuat manual/seed, atau ada alur lain?
* Apakah landing page app.binahub.id perlu redesign penuh atau cukup ditambah entry point untuk T-BOS? (lihat ADR-010, T-BOS ADR.md)

---

# 9. Visi Jangka Panjang (Bukan Syarat MVP)

Arsitektur generik dari PRD v0.3 — Evidence Engine, Capability Layer (derived), Behavior Layer, Outcome Layer, Action System, Intelligence Layer (Bima AI), Tenant/Organization multi-tenant, Mission system generik lintas modul, Knowledge hub, Complex graph visualization — **tidak dihapus sebagai ide**, tapi diturunkan statusnya jadi visi jangka panjang yang belum jadi prasyarat teknis.

Alasan: platform seperti ini biasanya tidak gagal karena idenya salah, tapi karena mencoba jadi terlalu pintar dan generik sebelum modul-modul dasarnya benar-benar dipakai dan terbukti punya pola yang sama. PRD v0.4 ini sengaja menunda generalisasi sampai ada bukti nyata dari ≥2-3 modul yang berjalan.

Kalau suatu saat BinaInsight, BinaImpact, T-BOS, dan modul berikutnya sama-sama butuh: (a) tempat menyimpan "bukti" yang seragam, (b) skor kapabilitas yang dihitung otomatis, dan (c) insight lintas modul — barulah Evidence/Capability Layer generik ini layak dibangun ulang, dengan 2-3 modul nyata sebagai referensi, bukan spekulasi di atas kertas.