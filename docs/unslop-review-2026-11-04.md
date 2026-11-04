# Unslop: pemeriksaan dan pemasangan

4 November 2026. Sumber: https://github.com/heydamir/unslop
Ref yang diperiksa dan dipasang: `a6f121eee5f29c2f74976b75456feae8b66afb3a`.
Lokasi lokal: `C:/Users/USER/.codex/skills/unslop`.
SHA256 SKILL.md: `9e49b2ff7643fa09729e8665890a18f6bfa58a82e6fcbba330da38136ccdc393`.

Skill desain oleh Damir Sokolovsky, CC BY 4.0; kredit dalam sumber tetap utuh.
Ini instruksi untuk agen dan dua skrip opsional, bukan dependency runtime website,
plugin server, atau layanan baru. Installer resmi skill hanya menyalin folder pada
ref yang dipatok. Tidak memasang package npm, hook, MCP, atau menjalankan skripnya.

Pemeriksaan sumber meliputi SKILL.md, agents/openai.yaml, seluruh referensi teks,
snapshot.mjs dan story.mjs. Pada ref ini tidak terlihat pengambilan kredensial,
telemetri/unggahan otomatis, install hook, obfuscation atau remote-code download.
Ini bukan jaminan aman, audit dependensi Playwright/ffmpeg, atau pentest tervalidasi.
Tidak mengeksekusi kode target pihak ketiga karena kontrol sandbox eksekusi audit
yang diwajibkan tidak disiapkan. Tidak menjalankan Strix atau memakai kuota model.

## Batas pemakaian

- Gunakan instruksi desain secara selektif; permintaan dan DNA BinaHub yang sudah
  disetujui mengalahkan selera/default skill. Jangan otomatis menghapus glass,
  ilustrasi, warna, font, animasi yang secara eksplisit diminta pemilik.
- Snapshot membuka URL melalui Chromium, mengambil aset dan menyimpan HTML serta
  screenshot. Jangan jalankan pada halaman admin/hasil privat atau browser bersesi
  produksi. File hasil dapat memuat data halaman dan referensi URL eksternal.
- Story menjalankan HTML lokal di browser dan menyediakan server loopback. Guard
  root memakai prefix string, bukan pemeriksaan komponen path/symlink yang kuat;
  jangan menganggapnya sandbox file. HTML juga bisa memuat jaringan eksternal.
- Story menghapus `.story-frames` rekursif di folder HTML dan memakai ffmpeg `-y`
  untuk output. Jangan gunakan di workspace/private folder atau output berharga.
- Skrip tidak dijalankan pada pemasangan ini. Pemakaian kelak harus lewat review
  terpisah, direktori scratch terisolasi, pembatasan jaringan/proses, target path
  tervalidasi, data sintetis dan toolchain lokal yang sudah ditinjau.
- Tidak membuat video, menggunakan image-generation berbayar, memasang service,
  atau memperbarui skill otomatis. Review ulang jika commit berubah.
