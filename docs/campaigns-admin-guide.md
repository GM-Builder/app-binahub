# Kampanye untuk admin

## Pilih sesuai pekerjaan

- **Outbound:** mengirim email pertama ke daftar calon klien yang sudah diperiksa.
- **Inbound:** membuat tautan kampanye untuk dibagikan di kanal lain, lalu membaca
  respons masuk. Membuat tautan tidak mengirim email atau memasang iklan.
- **Tindak lanjut:** meneruskan percakapan dengan kontak yang sudah masuk. Aturan
  dan persetujuannya terpisah dari email pertama. Penyederhanaan ini tidak
  menambahkan newsletter atau promosi massal ke kontak lama.

## Mengirim kampanye outbound

1. Buka **Akuisisi & penjualan → Outbound → Buat kampanye**. Isi nama dan pilih
   asal daftar yang telah disetujui. Kode dan pelacakan dibuat otomatis.
2. Jika belum ada asal daftar yang sesuai, pilih **Siapkan sumber data** atau
   **Gunakan asal daftar baru**. Isi asal, dasar penggunaan yang ditetapkan,
   pemberitahuan privasi, masa simpan, pemilik data, penanggung jawab legal, dan
   catatan pemeriksaan. Persetujuan harus diberikan oleh admin yang berwenang.
   Sumber ini dapat dipilih kembali pada kampanye berikutnya.
3. Pada **Penerima**, unggah CSV/JSON atau tempel email. Periksa daftar dan
   konfirmasikan kewenangan penggunaan. Penerima yang menolak, tidak valid,
   ganda, atau diblokir tetap disaring. Maksimal 50 dipilih per pengiriman.
4. Pada **Email**, baca pratinjau template yang sudah disetujui. Email uji ke
   akun admin tersedia sebagai pilihan, bukan syarat wajib.
5. Pada **Tinjau**, periksa kampanye, bahasa, subjek, waktu, dan penerima.
   Pilih **Tinjau & kirim**, lalu konfirmasi dialog terakhir. Kembali dan ubah
   penerima jika ada yang salah. Berpindah langkah tidak mengirim email.
6. Pada **Hasil**, pantau antrean dan status. **Diterima penyedia email** bukan
   jaminan masuk inbox atau dibaca. **Perlu diperiksa** tidak dikirim ulang
   otomatis. Tombol pemrosesan antrean yang sudah ada tetap membutuhkan tindakan
   admin; scheduler produksi belum diaktifkan.

Pilihan penerima dipertahankan selama kampanye tetap terbuka, termasuk ketika
mengubah bahasa. Saat pindah kampanye atau tab workspace, admin diperingatkan
jika ada pekerjaan belum selesai. Ini bukan draf permanen, penyimpanan lintas
perangkat, atau kunci edit antar-admin. Untuk berpindah secara sengaja, kirim
lebih dahulu atau batalkan pilihan yang tidak ingin dilanjutkan.

## Membagikan kampanye inbound

1. Buka **Inbound → Buat kampanye**. Pilih sumber inbound yang sudah disetujui,
   kanal pembagian, halaman tujuan, nama dan penanggung jawab.
2. Setelah memeriksa dan menyetujui penggunaan kampanye, pilih
   **Buat tautan kampanye**. Tautan berisi parameter pelacakan otomatis.
3. Pilih **Salin tautan**, lalu tempel pada kanal yang Anda kelola. Jika clipboard
   tidak tersedia, salin langsung dari kolom tautan. Form ini tidak mengirim email.
4. Pilih **Lihat respons** pada kampanye atau **Respons masuk** untuk semua sampel.
   Gunakan pencarian dan sumber untuk mempersempit kunjungan; rincian aktivitas
   dapat dibuka bila diperlukan. Tidak ada respons pada sampel bukan bukti bahwa
   kampanye tidak menghasilkan respons.

Kampanye lama tanpa tujuan yang dikenali tetap tersedia, tetapi tautannya tidak
ditebak. Sumber, periode, anggaran dan statusnya tetap dapat dikelola melalui
**Pengaturan sumber dan kampanye → Buka pengaturan lengkap**.

## Jika ada kendala

- **Sumber belum siap:** jangan menganggap semua email boleh dihubungi. Lengkapi
  tinjauan sumber sekali, atau gunakan sumber yang memang sudah disetujui.
- **Data gagal dimuat:** coba muat kembali. Error bukan daftar kosong; pengiriman
  ditahan sampai data berhasil diperbarui. Isian pada halaman tetap dipertahankan.
- **Kampanye sudah tersimpan tetapi belum terbuka:** gunakan **Coba buka kampanye**.
  Jangan membuat kampanye baru hanya karena daftar gagal diperbarui.
- **Antrean belum berjalan:** periksa status dan jam pengiriman, lalu gunakan
  kontrol antrean yang tersedia. Jangan menganggap scheduler aktif karena suatu
  kampanye terlihat aktif. Tidak ada aktivasi otomatis pada rilis ini.

## Cakupan data

UI ini memakai layanan yang sudah ada. Daftar target dan pengiriman masing-masing
masih memuat hingga 500 data terbaru. Analitik inbound masih memuat hingga 100
kunjungan, 500 aktivitas, dan 300 hubungan kontak terbaru. Ringkasan analitik
mencakup sampel yang dimuat, tidak mengikuti pencarian, bukan jumlah orang unik,
dan bukan total sepanjang waktu. Pagination arsip server tetap pekerjaan terpisah.
