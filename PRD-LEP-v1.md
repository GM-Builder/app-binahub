# PRD — Modul LEP (Lembar Evaluasi Program)

Status: Draft v1
Bagian dari: `app.binahub.id`, modul kedua setelah T-BOS (lihat `PRD-REVISI-CEO.md` WS8 — Program & Module Selector)

---

## 1. Ringkasan

LEP adalah survey evaluasi program pelatihan yang diisi peserta setelah program selesai — versi digital dari form yang sebelumnya dibuat manual (contoh acuan: form "Lembar Evaluasi Program - BinaHub" yang dilampirkan CEO). Tujuannya mengukur kepuasan, manfaat, dan kualitas pemateri dari sudut pandang peserta.

## 2. Ruang Lingkup

- Peserta mengisi survey (self-service, tidak perlu fasilitator).
- Admin melihat hasil agregat: rata-rata skor per pertanyaan, rata-rata skor per pemateri, kumpulan jawaban open text.
- LEP di-scope per `program_id` (lihat WS8) — satu program bisa punya satu LEP aktif dengan daftar pemateri sendiri.

## 3. Roles

| Role | Akses |
|---|---|
| Peserta | Isi survey (satu kali per program — lihat §6 duplikasi) |
| Admin | Setup pemateri untuk program, lihat hasil agregat & mentah, export |

## 4. Data Model

### `lep_speakers` (pemateri per program)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| program_id | uuid | FK → programs |
| name | text | misal "Bpk. Bilal" |
| sort_order | int | urutan tampil di form |

Admin input daftar pemateri saat setup program (jumlahnya fleksibel — dari contoh ada 2, tapi bisa beda-beda tiap program, sama seperti fleksibilitas batch di T-BOS).

### `lep_responses`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| program_id | uuid | FK → programs |
| profile_id | uuid | FK → profiles (peserta yang login & isi) |
| q_menyenangkan | int (1-4) | "Program ini merupakan pengalaman yang menyenangkan & menambah wawasan" |
| q_bermanfaat | int (1-4) | "Program ini bermanfaat & sesuai dengan kebutuhan saya maupun organisasi saya" |
| q_rekomendasi | int (1-4) | "Saya merasa program ini layak untuk direkomendasikan" |
| q_praktik | int (1-4) | "Saya sudah dan akan terus mempraktekkan apa yang telah saya pelajari" |
| hal_terpenting | text | wajib diisi |
| hal_menarik | text | wajib diisi |
| saran_program | text | opsional |
| submitted_at | timestamp | |

### `lep_speaker_ratings`
| Kolom | Tipe | Keterangan |
|---|---|---|
| response_id | uuid | FK → lep_responses |
| speaker_id | uuid | FK → lep_speakers |
| score | int (1-4) | "dapat membawakan topik dengan baik, efektif, & menarik" |
| comment | text | opsional, "saran/masukan terhadap pemateri X" |

## 5. Skala Penilaian

1 = Sangat Tidak Setuju, 4 = Sangat Setuju (skala 1-4, **bukan** 1-5 seperti T-BOS — ini beda dengan sengaja mengikuti bentuk asli form CEO, jangan disamakan dengan skala T-BOS).

## 6. Aturan Bisnis

- **Satu peserta = satu response per program.** Perlu unique constraint (`program_id`, `profile_id`) di `lep_responses`. Kalau peserta submit ulang: tolak dengan pesan jelas ("Anda sudah mengisi evaluasi untuk program ini"), atau — ⚠️ **perlu dikonfirmasi ke stakeholder** — izinkan edit selama window tertentu (mengikuti pola window revisi T-BOS)?
- Pertanyaan rating (4 pertanyaan umum + rating tiap pemateri) **wajib**. `hal_terpenting` dan `hal_menarik` **wajib**. `saran_program` dan saran per pemateri **opsional** — sesuai tanda `*` di form asli.
- Form asli pakai identitas Google account peserta ("Ganti akun") — di app.binahub.id, ini otomatis dari sesi login (`profiles`), tidak perlu field email manual.

## 7. Dashboard Admin

- Rata-rata skor 4 pertanyaan umum (angka + visual sederhana, misal bar horizontal).
- Rata-rata skor per pemateri, dibandingkan berdampingan kalau lebih dari satu.
- Daftar jawaban open text (bisa di-filter per pertanyaan), dengan opsi export ke Excel/CSV untuk dibaca lebih lanjut (jawaban open text sebaiknya **tidak** diringkas otomatis dengan AI di MVP — tampilkan mentah, sesuai prinsip "Work-first, not AI-first" yang sudah disepakati di `PRD-app-binahub-v0.4.md`).
- Jumlah responden vs total peserta terdaftar di program tsb (response rate).

## 8. Non-Functional

- Form harus singkat & mobile-friendly — peserta biasanya isi dari HP setelah acara selesai.
- Tidak perlu offline-first seperti T-BOS (LEP diisi setelah acara, bukan real-time di lapangan).

## 9. Yang Tidak Termasuk MVP

- Reminder otomatis (email/notifikasi) ke peserta yang belum isi — bisa jadi fase 2.
- Perbandingan hasil LEP antar program/batch — bisa jadi fase 2 setelah ada beberapa program yang terkumpul datanya.
