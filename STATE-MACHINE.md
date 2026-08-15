# T-BOS (BinaPlay) — Observation State Machine

Status: Final — diimplementasikan melalui RPC `tbos_submit_observation_v2` dan `tbos_mutate_observation`.

## 1. States dan Transisi

```text
draft lokal --submit atomik--> submitted --lock oleh admin--> locked
                                  ^                         |
                                  +----unlock oleh admin----+
```

`draft` adalah state lokal/autosave dan tidak ikut agregasi. Submit production langsung membuat observasi `submitted`, skor, snapshot roster, dan audit log dalam satu transaksi.

| State | Dampak | Hak edit |
|---|---|---|
| `draft` | Belum tersimpan sebagai hasil final; tidak dihitung | Fasilitator pada perangkatnya |
| `submitted` | Masuk agregasi skor | Pemilik sampai `revision_deadline`; admin dapat override |
| `locked` | Final dan tetap masuk agregasi | Hanya dapat dibuka kembali oleh admin |

## 2. Revision Window

Database menetapkan `revision_deadline` pada akhir hari berikutnya berdasarkan `observed_at` dalam zona waktu Asia/Jakarta. API dan RPC sama-sama menolak edit fasilitator setelah deadline. Admin dapat edit kapan pun dan seluruh edit/lock/unlock tercatat pada `tbos_observation_audit_log`.

## 3. Retry dan Duplikasi

- Setiap submit membawa `client_submission_id` unik per fasilitator.
- Retry dengan ID yang sama mengembalikan observasi yang sudah dibuat dan tidak menggandakan tim, roster, skor, atau audit log.
- Beberapa fasilitator boleh mengobservasi tim+mission yang sama pada sesi berbeda. Semua observasi `submitted`/`locked` yang sah dirata-ratakan; tidak saling overwrite.

## 4. Locking dan Audit

- Hanya admin dapat melakukan `lock` dan `unlock`.
- Mutasi mengambil row lock database, mengubah observasi/skor, dan menulis audit log secara atomik.
- Observasi locked tidak dapat diedit sampai admin melakukan unlock.
