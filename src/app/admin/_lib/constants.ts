export const tabs = ["Overview", "Acquisition Control", "Sales Pipeline", "Client & Delivery", "Operations Control", "Automation Center", "Assessment", "Meeting", "Kontak & Leads", "Inquiry Masuk"] as const;

export const TAB_META: Record<(typeof tabs)[number], { eyebrow: string; title: string; description: string }> = {
  Overview: {
    eyebrow: "Ringkasan eksekutif",
    title: "Prioritas operasional hari ini",
    description: "Pantau volume, kualitas lead, kebutuhan tindak lanjut, dan antrean kerja sebelum masuk ke area detail.",
  },
  "Automation Center": {
    eyebrow: "Pusat otomasi",
    title: "Kelola proyek dan penugasan tim",
    description: "Siapkan proyek, tinjau rekomendasi penugasan, dan pastikan undangan diperiksa sebelum dikirim.",
  },
  Assessment: {
    eyebrow: "Hubungan klien",
    title: "Assessment klien",
    description: "Pahami kebutuhan klien, pantau proposal, dan kelola tindak lanjut dalam satu tempat.",
  },
  "Acquisition Control": {
    eyebrow: "Tata kelola pertumbuhan",
    title: "Kelola sumber data, kampanye, dan prospek",
    description: "Pastikan dasar pemrosesan, persetujuan, masa simpan, pemeriksaan duplikasi, dan persetujuan penanggung jawab tersedia sebelum prospek menjadi lead.",
  },
  "Sales Pipeline": {
    eyebrow: "Operasional penjualan",
    title: "Kendalikan setiap peluang dan tindak lanjut",
    description: "Tetapkan penanggung jawab, tindakan berikutnya, tenggat, nilai peluang, dan persetujuan yang diperlukan.",
  },
  "Client & Delivery": {
    eyebrow: "Keberhasilan klien",
    title: "Kelola serah terima, pelaksanaan, dan hubungan klien",
    description: "Ubah deal menjadi klien, tetapkan penanggung jawab, milestone, risiko, stakeholder, kesehatan akun, dan peluang lanjutan.",
  },
  "Operations Control": {
    eyebrow: "Kontrol operasional",
    title: "Kendalikan tugas, tenggat, dan proses otomatis",
    description: "Pantau tugas yang perlu ditangani, tetapkan penanggung jawab, selesaikan eskalasi, dan periksa riwayat proses.",
  },
  Meeting: {
    eyebrow: "Jadwal konsultasi",
    title: "Pantau booking dan perubahan jadwal",
    description: "Lihat konsultasi, perubahan atau pembatalan jadwal, peserta, waktu, dan tautan pertemuan dalam satu tempat.",
  },
  "Kontak & Leads": {
    eyebrow: "Pengelolaan lead",
    title: "Rapikan kontak masuk dan status tindak lanjut",
    description: "Cari kontak, klasifikasikan status, dan simpan catatan agar proses penjualan tetap mudah dibaca.",
  },
  "Inquiry Masuk": {
    eyebrow: "Pertanyaan masuk",
    title: "Tindak lanjuti pertanyaan dengan konteks yang jelas",
    description: "Prioritaskan pertanyaan baru, kirim tindak lanjut bertahap, dan perbarui status seiring perkembangan percakapan.",
  },
};

export const ASSOCIATE_CATEGORIES = [
  "Assessor (Insight)",
  "Facilitator (Play)",
  "Trainer (Lab)",
  "Project Manager (Works, Impact)",
  "Coach (Coach)",
  "Tour Guide (Journey)",
  "Travel Agency (Journey)",
  "Event Organizer",
  "Consultant AI",
  "Consultant Change Management",
  "Consultant SDM",
];

export const FOLLOW_UP_LEVELS = [
  {
    level: 1,
    days: 2,
    label: "Follow Up 1",
    status: "Follow Up 1 Terkirim",
    intent: "Memastikan email sebelumnya masuk dan sudah dibaca, sekaligus membuka eksplorasi kemungkinan baru.",
  },
  {
    level: 2,
    days: 7,
    label: "Follow Up 2",
    status: "Follow Up 2 Terkirim",
    intent: "Soft push agar diskusi bergerak ke keputusan atau jadwal lanjutan tanpa terasa menekan.",
  },
  {
    level: 3,
    days: 14,
    label: "Follow Up 3",
    status: "Follow Up 3 Terkirim",
    intent: "Hard push dengan posisi nothing to lose: lanjut atau tidak lanjut sama-sama jelas.",
  },
] as const;

export const ADMIN_SERVICE_OPTIONS = [
  "BinaInsight",
  "BinaLab",
  "BinaPlay",
  "BinaCoach",
  "BinaWorks",
  "BinaImpact",
  "BinaJourney",
  "AI Enablement",
  "Change Management",
  "SDM & Organization",
  "Transformation Architecture",
];

export const PROJECT_TYPE_OPTIONS = ["Transformation", "Assessment", "Workshop", "Coaching", "AI Enablement", "Journey", "Project Delivery"];
export const BUDGET_NOTE_OPTIONS = ["Belum dibahas", "< Rp50 juta", "Rp50-100 juta", "Rp100-250 juta", "Rp250-500 juta", "> Rp500 juta"];
export const ASSOCIATE_FIELD_OPTIONS = ["People Development", "Assessment", "Facilitation", "Training", "Project Management", "AI", "Change Management", "SDM", "Travel/Journey", "Event"];
export const AVAILABILITY_OPTIONS = ["Weekday", "Weekend", "Online only", "Offline only", "Hybrid", "By appointment"];
export const TIME_WINDOW_OPTIONS = ["09:00-12:00", "13:00-16:00", "16:00-18:00", "19:00-21:00", "Full day", "By appointment"];
export const DURATION_OPTIONS = ["45", "60", "90", "120", "180", "240"];
export const CONTACT_STATUS_OPTIONS = ["Lead Baru", "Follow Up", "Qualified", "Client", "Lanjut Diskusi", "Selesai", "Archived"];

export const INQUIRY_STATUS_OPTIONS = [
  "Baru",
  "Dibalas",
  "Perlu Follow Up",
  "Follow Up 1 Terkirim",
  "Follow Up 2 Terkirim",
  "Follow Up 3 Terkirim",
  "Lanjut Diskusi",
  "Qualified",
  "Client",
  "Selesai",
  "Diarsipkan",
];

export const NOTE_PRESETS = [
  "Perlu dijadwalkan diskusi lanjutan.",
  "Menunggu respon dari PIC.",
  "Sudah dihubungi via email.",
  "Prioritas tinggi, potensi project aktif.",
  "Belum siap lanjut, simpan untuk nurturing.",
];

export const PROJECT_SCOPE_PRESETS = [
  "Assessment awal, alignment sponsor, workshop prioritas, dan rekomendasi roadmap 90 hari.",
  "Program capability building untuk leader dan tim inti dengan sesi praktik dan evaluasi dampak.",
  "Pendampingan implementasi project perubahan sampai adoption, measurement, dan handover internal.",
];

export const colors = ["#0B2C6B", "#D9A441", "#8FA3C7", "#C86B2B", "#6EA27B", "#B9471D"];
