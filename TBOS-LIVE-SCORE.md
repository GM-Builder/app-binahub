# T-BOS Live Score

## Tujuan

Live Score adalah layar pendamping sesi T-BOS yang dibuka admin lalu dibagikan ke proyektor. Layar membantu setiap tim melihat kemajuan bersama tanpa menampilkan identitas atau nilai individu.

## Alur operator

1. Admin membuka **Dashboard T-BOS**, memilih program dan bila perlu memilih batch.
2. Admin menekan **Buka Live Score**. Layar terbuka di tab baru sehingga dashboard utama tetap aman digunakan.
3. Pada panel kontrol, admin memilih semua batch atau satu batch, mengisi judul, pesan penyemangat, dan durasi 1–240 menit.
4. Admin dapat menyembunyikan skor saat briefing. Dalam keadaan ini, daftar tim diurutkan alfabetis agar posisi ranking tidak bocor.
5. Admin menekan **Mulai**. Batas akhir disimpan oleh server; refresh browser atau layar kedua tidak mereset countdown.
6. Observasi baru yang sudah `submitted` atau `locked` masuk ke peringkat pada refresh berikutnya, paling lambat sekitar lima detik. Observasi draf tidak dihitung.
7. Jika jumlah misi yang selesai belum setara antartim, layar memberi label **Peringkat sementara**. Nilai tetap terlihat, tetapi belum dianggap perbandingan final.
8. Admin dapat menjeda, melanjutkan, mereset, menyelesaikan sesi, atau menyembunyikan nilai. Semua perubahan kontrol dicatat dalam audit database.

## Aturan penilaian dan privasi

- Rumus nilai memakai mesin scoring T-BOS yang sama dengan dashboard dan laporan.
- Peringkat yang nilainya sama memperoleh nomor peringkat yang sama.
- Tim yang belum mempunyai nilai ditempatkan setelah tim yang sudah dinilai.
- Hanya nama tim, batch, nilai agregat, jumlah misi selesai, dimensi terkuat, dan waktu pembaruan terakhir yang dikirim ke layar.
- Nama anggota, email, profil peserta, nilai per individu, dan catatan fasilitator tidak dikirim oleh endpoint Live Score.
- Versi pertama bersifat admin-only. “Share” berarti membagikan layar/tab ke proyektor, bukan membagikan URL publik.

## Desain layar

- Informasi paling penting berada pada satu layar: judul sesi, countdown besar, status ranking, dan kartu tim.
- Maksimal delapan tim tampil per halaman. Jika lebih, layar berpindah halaman otomatis setiap sepuluh detik dan tetap menyediakan tombol manual.
- Tiga tim teratas mendapat aksen podium. Tim di posisi bawah tidak diberi label negatif atau mempermalukan anggota; pesan layar diarahkan pada kekompakan dan kesempatan mengejar progres.
- Tombol **Layar penuh** menghilangkan gangguan browser saat diproyeksikan.

## Operasional dan kegagalan aman

- Data dibaca ulang setiap lima detik. Polling dipilih untuk versi awal agar tetap sederhana, dapat diaudit, dan tidak membuka koneksi realtime langsung ke database.
- Jika jaringan terputus, nilai terakhir tetap terlihat bersama pesan gangguan. Kontrol tidak mengubah skor sumber.
- Countdown bersumber dari `ends_at` server sehingga waktu perangkat admin bukan sumber kebenaran.
- Tabel sesi dan audit menggunakan RLS dan hanya dapat diakses service role melalui API admin.
- Sebelum deployment, jalankan migration `0051_tbos_live_score.sql`, readiness SQL, unit test, build, lalu `npm run test:tbos` terhadap API production.
