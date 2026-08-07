# T-BOS (BinaPlay) — Observation State Machine

Status: Draft — jawab Open Question PRD #2 (multi-observasi) secara desain, perlu dikonfirmasi ke stakeholder.

## 1. Kenapa perlu state machine

PRD awal tidak mendefinisikan apa yang terjadi setelah fasilitator submit observasi: apakah bisa diedit, apakah bisa ada lebih dari satu observasi untuk kombinasi tim+mission yang sama, dan siapa yang berwenang mengubahnya.

## 2. States

```
   [draft] --submit--> [submitted] --lock (admin/otomatis)--> [locked]
      |                     |
   (auto-save,          (fasilitator masih bisa
    belum final)          edit dalam window tertentu)
```

| State | Deskripsi | Siapa bisa edit |
|---|---|---|
| `draft` | Form sedang diisi, belum disubmit (opsional — jika ada auto-save) | Fasilitator pemilik |
| `submitted` | Observasi sudah masuk, terhitung di skor | Fasilitator pemilik (dalam window revisi, mis. sampai akhir hari batch) |
| `locked` | Tidak bisa diubah lagi, final untuk agregasi | Tidak ada (kecuali admin override + audit log) |

⚠️ Durasi window revisi belum diputuskan — usul: terkunci otomatis di akhir hari/batch, atau dikunci manual oleh admin setelah program selesai.

## 3. Kasus: Observasi Duplikat (tim yang sama, mission yang sama)

Dari Open Question PRD: apakah satu tim bisa diobservasi lebih dari sekali dalam mission yang sama (misal 2 fasilitator berbeda)?

**Rekomendasi desain** (perlu konfirmasi):
- Diizinkan lebih dari satu observasi per kombinasi tim+mission, **selama dari fasilitator yang berbeda** — karena tiap fasilitator hanya bertanggung jawab atas mission miliknya, kemungkinan dua fasilitator menilai mission yang sama kecil, tapi tidak nol (misal shift/sesi berbeda).
- Jika terjadi duplikat, **Dimension Score dihitung sebagai rata-rata dari seluruh observasi yang submitted/locked** untuk kombinasi tim+dimensi tersebut — bukan overwrite satu sama lain.
- Alternatif lebih ketat: satu observasi per tim per mission per **sesi** (bukan per hari), dengan field `session_id` tambahan jika dibutuhkan.

## 4. Audit Trail

Setiap perubahan status (`submitted` → `locked`, atau edit dalam window revisi) sebaiknya dicatat di tabel `observation_audit_log` (siapa, kapan, perubahan apa) — terutama untuk kasus admin override. Belum ada di PRD awal, diusulkan sebagai requirement tambahan.
