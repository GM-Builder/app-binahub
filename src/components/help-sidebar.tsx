import { HelpCircle, Lightbulb } from "lucide-react";

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
  "/facilitator/evidence": [
    "Gunakan form 4 langkah untuk observasi yang terstruktur.",
    "Pastikan memilih partisipan dan engagement yang tepat.",
    "Observasi langsung menjadi catatan peserta.",
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
  "/admin/rbac": [
    "Matriks izin menunjukkan akses per role.",
    "Role ditentukan oleh Supabase Auth metadata.",
    "Izin bersifat derived, tidak bisa diubah manual.",
  ],
};

export function HelpSidebar({ currentPath }: { currentPath: string }) {
  const tips = HELP_TIPS[currentPath] || [
    "Butuh bantuan? Kunjungi Help Center untuk panduan lengkap.",
    "Setiap halaman memiliki fungsi spesifik sesuai peran Anda.",
    "Jika mengalami masalah, hubungi tim support.",
  ];

  return (
    <aside className="rounded-xl border border-[#0B2C6B]/10 bg-white p-4 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
      <div className="flex items-center gap-2">
        <Lightbulb size={14} className="text-[#D9A441]" />
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D9A441]">Tips</p>
      </div>
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
    </aside>
  );
}
