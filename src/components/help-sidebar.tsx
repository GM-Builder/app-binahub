import { HelpCircle } from "lucide-react";
import { TipsCard } from "@/components/ui/tips-card";

const HELP_TIPS: Record<string, string[]> = {
  "/client/dashboard": [
    "Dashboard menampilkan ringkasan perkembangan Anda.",
    "Grafik kapabilitas diperbarui otomatis berdasarkan evidence terbaru.",
    "Klik card evidence untuk melihat detail lengkap.",
  ],
  "/client/reflection": [
    "Ikuti 4 langkah refleksi untuk hasil terbaik.",
    "Pilih prompt yang relevan dengan pengalaman Anda.",
    "Tag kapabilitas membantu sistem melacak perkembangan.",
  ],
  "/client/evidence": [
    "Catatan adalah semua bukti aktivitas Anda.",
    "Skor kualitas menunjukkan keandalan setiap catatan.",
    "Klik Detail untuk melihat informasi lengkap dan kelola tag.",
  ],
  "/client/actions": [
    "Action items membantu Anda melacak tugas.",
    "Action yang lewat deadline akan ditandai OVERDUE.",
    "Gunakan tombol Detail untuk update progress dan prioritas.",
  ],
  "/client/actions/detail": [
    "Lihat detail tindakan termasuk status, prioritas, dan deadline.",
    "Gunakan tombol transisi untuk mengubah status tindakan.",
    "Centang selesai untuk menandakan tindakan sudah dikerjakan.",
  ],
  "/client/capability": [
    "Radar chart menunjukkan profil kapabilitas Anda.",
    "Skor dihitung berdasarkan bobot catatan.",
    "Semakin banyak catatan, semakin akurat skornya.",
  ],
  "/client/engagements": [
    "Daftar semua program yang Anda ikuti.",
    "Klik program untuk melihat detail dan kemajuan.",
    "Progress bar menunjukkan persentase penyelesaian.",
  ],
  "/client/engagements/detail": [
    "Detail program termasuk jadwal, partisipan, dan catatan.",
    "Kirim refleksi dari halaman ini untuk program tertentu.",
    "Lihat riwayat evidence yang terkait dengan program.",
  ],
  "/facilitator/dashboard": [
    "Dashboard menampilkan ringkasan aktivitas fasilitator.",
    "Lihat program aktif dan pengamatan terbaru.",
    "Gunakan akses cepat untuk navigasi ke fitur utama.",
  ],
  "/facilitator/participants": [
    "Lihat daftar partisipan per engagement.",
    "Klik partisipan untuk melihat detail kapabilitas.",
    "Jumlah catatan menunjukkan aktivitas peserta.",
  ],
  "/facilitator/reports": [
    "Buat laporan berdasarkan data catatan dan kemampuan.",
    "Filter berdasarkan jenis catatan atau kemampuan.",
    "Export laporan untuk dibagikan ke stakeholder.",
  ],
  "/facilitator/reviews": [
    "Review evidence partisipan sebelum laporan.",
    "Tandai sebagai reviewed setelah diperiksa.",
    "Pastikan semua evidence berkualitas baik.",
  ],
  "/facilitator/statistics": [
    "Statistik tim menunjukkan performa keseluruhan.",
    "Filter berdasarkan tim atau individu.",
    "Gunakan data ini untuk pengambilan keputusan.",
  ],
  "/facilitator/events": [
    "Antrian kejadian menampilkan event yang perlu ditindaklanjuti.",
    "Prioritaskan berdasarkan urgensi dan dampak.",
    "Tandai sudah ditangani setelah melakukan tindakan.",
  ],
  "/admin/engagements": [
    "Kelola semua program di satu tempat.",
    "Buat program baru atau edit yang sudah ada.",
    "Arsipkan program yang sudah selesai.",
  ],
  "/admin/programs": [
    "Gunakan Buat Program untuk menyiapkan identitas, periode, kapasitas, dan modul. Program draf belum dapat diakses peserta.",
    "Status Aktif berubah otomatis menjadi Berjalan pada tanggal mulai, lalu menjadi Ditinjau setelah tanggal selesai.",
    "Pintasan status pada kartu dipakai hanya untuk pengecualian; Kelola membuka detail, Bagikan menampilkan tautan dan QR, dan ikon hapus menghapus data yang belum memiliki histori.",
  ],
  "/admin/engagements/manage": [
    "Pastikan modul yang disepakati sudah aktif sebelum program dimulai.",
    "Kelola mengubah identitas, jadwal, lokasi, dan kapasitas; perubahan status tersedia sebagai pintasan pada daftar Program.",
    "Gunakan halaman tes, kode peserta, dan tautan masuk sesuai kebutuhan program.",
  ],
  "/admin/rbac": [
    "Matriks izin menunjukkan akses per role.",
    "Role ditentukan oleh Supabase Auth metadata.",
    "Izin bersifat derived, tidak bisa diubah manual.",
  ],
  "/admin/dashboard": [
    "Mulai dari kartu prioritas untuk melihat pekerjaan yang paling membutuhkan perhatian hari ini.",
    "Klik kartu atau tautan rincian untuk berpindah ke area kerja terkait; tombol Perbarui mengambil data terbaru.",
    "Angka pada dashboard adalah ringkasan, bukan tombol perubahan data.",
  ],
  "/admin/acquisition": [
    "AI Lead Discovery mencari kandidat sesuai ICP; Jalankan pratinjau menampilkan hasil tanpa mengubah kandidat menjadi lead atau mengirim pesan.",
    "Source membuktikan asal dan izin pemrosesan, campaign memberi konteks aktivitas, sedangkan batch adalah antrean kandidat untuk ditinjau manusia.",
    "Kandidat baru menjadi lead setelah batch di-stage, diperiksa, disetujui, lalu diproses melalui gate acquisition terpisah.",
  ],
  "/admin/pipeline": [
    "Setiap kartu adalah satu peluang. Owner adalah penanggung jawab dan Next action adalah langkah konkret berikutnya.",
    "Gunakan Edit untuk melengkapi owner, nilai, tenggat, dan tindakan; pindahkan tahap hanya setelah syarat tahap terpenuhi.",
    "Label outreach dijeda berarti pesan otomatis tidak boleh dikirim sampai kondisi penghentian diselesaikan.",
  ],
  "/admin/assessments": [
    "Ringkasan menunjukkan hasil diagnostik; klik baris klien untuk membuka skor dimensi, analisis, dokumen, dan tindak lanjut.",
    "Kirim result mengirim ulang hasil, Minta proposal mencatat minat, Siapkan draft menyusun proposal, dan Kirim proposal tetap memerlukan human gate.",
    "Filter dan kartu metrik mempersempit daftar; CSV mengunduh hasil yang sedang tampil.",
  ],
  "/admin/meetings": [
    "Halaman ini membaca siklus booking Cal.com: dibuat, dijadwal ulang, dibatalkan, selesai, atau no-show.",
    "Gunakan pencarian dan filter untuk menemukan booking; perubahan jadwal tetap dilakukan melalui Cal.com.",
  ],
  "/admin/contacts": [
    "Kontak menggabungkan identitas orang dengan status hubungannya terhadap BinaHub.",
    "Gunakan Edit untuk memperbaiki data dan status; jangan membuat kontak kedua untuk email yang sama.",
  ],
  "/admin/inquiries": [
    "Inquiry adalah pertanyaan masuk yang belum tentu menjadi peluang penjualan.",
    "Tetapkan owner dan tindakan berikutnya sebelum mengubah status agar inquiry tidak kehilangan tindak lanjut.",
  ],
  "/admin/clients": [
    "Pilih klien di daftar, lalu kelola stakeholder, proyek, milestone, kesehatan akun, dan peluang lanjutan pada panel kanan.",
    "Serahkan mengubah deal won menjadi akun klien dan proyek awal; Tinjau menyimpan health review; Tambah membuat item baru pada bagian terkait.",
    "Status berisiko wajib memiliki alasan, owner, tindakan berikutnya, dan tenggat.",
  ],
  "/admin/operations": [
    "Tugas operasional menampung pekerjaan manusia yang lahir dari risiko, keterlambatan, atau pengecualian sistem.",
    "Assign menetapkan owner, Mulai mengubah ke dikerjakan, dan Selesaikan wajib disertai catatan resolusi.",
  ],
  "/admin/automation": [
    "Halaman ini memantau antrean dan hasil otomasi; bukan tempat mengaktifkan production live secara langsung.",
    "Retry hanya untuk run gagal yang aman diulang. Pause menghentikan proses baru tanpa menghapus audit sebelumnya.",
  ],
  "/admin/catalog": [
    "Produk adalah paket komersial yang dilihat calon pembeli; modul adalah komponen layanan beserta scope, deliverable, dan harga.",
    "Buat produk lebih dahulu, lalu tambahkan satu atau beberapa modul ke produk tersebut.",
    "Tampil ke publik hanya diaktifkan untuk item siap, non-mock, dan sudah disetujui owner bisnis.",
  ],
  "/admin/programs/tests": [
    "Pilih program dan jenis tes dahulu. Pertanyaan adalah editor soal, Respons berisi hasil peserta, dan Pengaturan mengatur publikasi serta aturan pengerjaan.",
    "Pratinjau peserta tidak menyimpan jawaban. Publikasikan membuka tes, sedangkan Tutup respons menghentikan submission baru.",
    "Setelah respons pertama masuk, struktur soal dikunci untuk menjaga integritas hasil.",
  ],
  "/admin/lep": [
    "Pilih program untuk mengelola pemateri dan membaca evaluasi peserta pada konteks program yang benar.",
    "Tambah pemateri dilakukan sebelum form dibagikan; CSV digunakan untuk analisis lanjutan.",
    "Jika belum ada respons, bagikan tautan LEP kepada peserta setelah program selesai.",
  ],
  "/admin/users": [
    "Daftar ini mengelola siapa yang dapat masuk dan peran utama mereka.",
    "Mengubah role berdampak pada akses menu dan data; nonaktifkan akun untuk mencabut akses tanpa menghapus histori.",
  ],
  "/admin/settings": [
    "Pengaturan Bisnis menyimpan batas transaksi, owner/backup, approver/delegasi, serta SLA risiko tanpa perubahan kode.",
    "Simpan hanya bagian yang telah disetujui. Owner dan backup harus berbeda agar eskalasi tetap berfungsi.",
    "Switch pilot/live dan aturan yang belum disetujui harus tetap nonaktif.",
  ],
  "/admin/governance": [
    "Mulai dari Kesiapan untuk membaca blocker, lalu selesaikan UAT, Assurance, dan Rehearsal secara berurutan sebelum membuat jadwal release.",
    "Release & Runtime adalah satu-satunya area untuk menetapkan change window, batas per run, mode workflow, serta kill switch; requested mode belum tentu menjadi effective mode.",
    "Jangan membuka environment guard atau menjalankan worker sebelum release scheduled, window aktif, seluruh blocker kosong, dan rollback sudah siap.",
  ],
  "/admin/tbos": [
    "Pilih program dan batch sebelum membaca ringkasan observasi tim.",
    "Tab mengubah sudut analisis, sedangkan PDF Grup dan Data CSV mengunduh hasil pada konteks yang sedang dipilih.",
    "Tambah Tim dan Tugaskan Fasilitator menyiapkan struktur pelaksanaan sebelum observasi dimulai.",
  ],
};

export function HelpSidebar({ currentPath }: { currentPath: string }) {
  const tips = HELP_TIPS[currentPath] || [
    "Butuh bantuan? Kunjungi Help Center untuk panduan lengkap.",
    "Setiap halaman memiliki fungsi spesifik sesuai peran Anda.",
    "Jika mengalami masalah, hubungi tim support.",
  ];

  return (
    <TipsCard>
      <ul className="mt-3 space-y-2">
        {tips.map((tip, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-[#4A4C54]/70">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#D9A441]" />
            {tip}
          </li>
        ))}
      </ul>
      <a href="/help"
        className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-[#D9A441] hover:text-[#0B2C6B]">
        <HelpCircle size={10} /> Buka Help Center
      </a>
    </TipsCard>
  );
}
