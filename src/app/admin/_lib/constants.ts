export const tabs = ["Overview", "Automation Center", "Assessment", "Kontak & Leads", "Inquiry Masuk", "Associate Network", "Project Assignment"] as const;

export const TAB_META: Record<(typeof tabs)[number], { eyebrow: string; title: string; description: string }> = {
  Overview: {
    eyebrow: "Executive snapshot",
    title: "Prioritas operasional hari ini",
    description: "Pantau volume, kualitas lead, kebutuhan follow-up, dan antrean automation sebelum masuk ke modul detail.",
  },
  "Automation Center": {
    eyebrow: "Project autopilot",
    title: "Buat, review, dan jalankan assignment AI",
    description: "Kelola project pipeline, smart action, draft matching associate, dan invitation dengan review sebelum kirim.",
  },
  Assessment: {
    eyebrow: "Client intelligence",
    title: "Review assessment dan follow-up komersial",
    description: "Buka detail klien, cek readiness score, kirim result/proposal, dan pastikan follow-up tidak terlewat.",
  },
  "Kontak & Leads": {
    eyebrow: "Lead nurturing",
    title: "Rapikan kontak masuk dan status nurturing",
    description: "Cari kontak, klasifikasikan status, dan simpan catatan agar pipeline komersial tetap mudah dibaca.",
  },
  "Inquiry Masuk": {
    eyebrow: "Inbound response",
    title: "Tindak lanjuti inquiry dengan konteks jelas",
    description: "Prioritaskan inquiry baru, kirim follow-up bertahap, dan ubah status saat percakapan bergerak.",
  },
  "Associate Network": {
    eyebrow: "Talent pool",
    title: "Kelola data associate yang siap dimatching",
    description: "Lengkapi profil, kategori, availability, CV, LinkedIn, dan status agar matching project lebih akurat.",
  },
  "Project Assignment": {
    eyebrow: "Delivery operations",
    title: "Pantau assignment, sesi, availability, dan dokumen",
    description: "Kelola hubungan associate dengan program aktif sampai sesi, evaluasi, dan dokumen kerja sama rapi.",
  },
};

export const ADMIN_WORKFLOW_STEPS = [
  { title: "Prioritaskan", description: "Mulai dari badge baru, smart action pending, dan follow-up jatuh tempo." },
  { title: "Review", description: "Buka detail sebelum aksi kirim email, invitation, proposal, atau penghapusan data." },
  { title: "Catat", description: "Perbarui status dan catatan internal setelah ada progres agar tim berikutnya paham konteks." },
  { title: "Verifikasi", description: "Refresh dashboard dan pastikan perubahan masuk ke modul yang tepat." },
] as const;

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
