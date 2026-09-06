import {
  BarChart3,
  BookOpenCheck,
  Boxes,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ClipboardCheck,
  ContactRound,
  FileQuestion,
  Gauge,
  Inbox,
  PackageSearch,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserCog,
  UsersRound,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export type AdminNavigationItem = {
  href: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  aliases?: string[];
};

export type AdminNavigationGroup = {
  id: string;
  label: string;
  items: AdminNavigationItem[];
};

export const ADMIN_NAVIGATION: AdminNavigationGroup[] = [
  {
    id: "overview",
    label: "Ringkasan",
    items: [
      {
        href: "/admin/dashboard",
        label: "Dashboard",
        shortLabel: "Dashboard",
        description: "Prioritas, antrean, dan kondisi bisnis hari ini.",
        icon: Gauge,
        aliases: ["/admin"],
      },
    ],
  },
  {
    id: "growth",
    label: "Akuisisi & Penjualan",
    items: [
      { href: "/admin/acquisition", label: "Kontrol Akuisisi", shortLabel: "Akuisisi", description: "Sumber, kampanye, dan prospek.", icon: Sparkles },
      { href: "/admin/pipeline", label: "Pipeline Penjualan", shortLabel: "Pipeline", description: "Peluang, owner, dan next action.", icon: BarChart3 },
      { href: "/admin/assessments", label: "Assessment", shortLabel: "Assessment", description: "Hasil diagnostik dan tindak lanjut.", icon: ClipboardCheck },
      { href: "/admin/meetings", label: "Konsultasi", shortLabel: "Konsultasi", description: "Booking dan perubahan jadwal.", icon: CalendarDays },
      { href: "/admin/contacts", label: "Kontak & Lead", shortLabel: "Kontak", description: "Data kontak dan status hubungan.", icon: ContactRound },
      { href: "/admin/inquiries", label: "Inquiry Masuk", shortLabel: "Inquiry", description: "Pertanyaan baru dan tindak lanjut.", icon: Inbox },
    ],
  },
  {
    id: "delivery",
    label: "Klien & Delivery",
    items: [
      { href: "/admin/clients", label: "Klien & Pelaksanaan", shortLabel: "Klien", description: "Handoff, project, dan account health.", icon: Building2, aliases: ["/admin/clients/detail"] },
      { href: "/admin/operations", label: "Kontrol Operasional", shortLabel: "Operasional", description: "Tugas, tenggat, dan eskalasi.", icon: BriefcaseBusiness },
      { href: "/admin/automation", label: "Pusat Otomasi", shortLabel: "Otomasi", description: "Proyek, penugasan, dan antrean otomatis.", icon: Workflow },
    ],
  },
  {
    id: "products",
    label: "Program & Produk",
    items: [
      { href: "/admin/programs", label: "Program", shortLabel: "Program", description: "Program aktif dan akses peserta.", icon: Boxes, aliases: ["/admin/engagements"] },
      { href: "/admin/catalog", label: "Katalog Produk", shortLabel: "Katalog", description: "Produk, modul, harga, dan publikasi.", icon: PackageSearch },
      { href: "/admin/programs/tests", label: "Form Program", shortLabel: "Form", description: "Pre-test, Post-test, BinaInsight, dan statistik respons.", icon: FileQuestion },
      { href: "/admin/lep", label: "Evaluasi Program", shortLabel: "LEP", description: "Form evaluasi dan hasil program.", icon: BookOpenCheck },
      { href: "/admin/tbos", label: "T-BOS", shortLabel: "T-BOS", description: "Observasi perilaku tim.", icon: Trophy },
    ],
  },
  {
    id: "governance",
    label: "Tata Kelola",
    items: [
      { href: "/admin/users", label: "Pengguna & Peran", shortLabel: "Pengguna", description: "Akun, role, dan status akses.", icon: UsersRound },
      { href: "/admin/rbac", label: "Izin Akses", shortLabel: "Izin", description: "Matriks kewenangan per peran.", icon: ShieldCheck },
      { href: "/admin/settings", label: "Pengaturan Bisnis", shortLabel: "Pengaturan", description: "Kebijakan, owner, approval, dan SLA.", icon: Settings2 },
      { href: "/admin/governance", label: "Kesiapan & Pilot", shortLabel: "Pilot", description: "UAT, assurance, release, runtime control, dan kill switch.", icon: ShieldAlert },
    ],
  },
];

export const ADMIN_NAV_ITEMS = ADMIN_NAVIGATION.flatMap((group) => group.items);

export function adminRouteIsActive(pathname: string, item: AdminNavigationItem) {
  const candidates = [item.href, ...(item.aliases || [])];
  return candidates.some((href) => {
    if (href === "/admin") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  });
}

export function findAdminNavigation(pathname: string) {
  const matches = ADMIN_NAVIGATION.flatMap((group) => group.items.flatMap((item) => {
    const candidate = [item.href, ...(item.aliases || [])]
      .filter((href) => href === pathname || pathname.startsWith(`${href}/`))
      .sort((left, right) => right.length - left.length)[0];
    return candidate ? [{ group, item, matchLength: candidate.length }] : [];
  })).sort((left, right) => right.matchLength - left.matchLength);
  if (matches[0]) return { group: matches[0].group, item: matches[0].item };
  return { group: ADMIN_NAVIGATION[0], item: ADMIN_NAVIGATION[0].items[0] };
}

export const ADMIN_QUICK_LINKS = [
  { href: "/admin/programs", label: "Program", icon: Boxes },
  { href: "/admin/pipeline", label: "Pipeline", icon: BarChart3 },
  { href: "/admin/clients", label: "Klien", icon: Building2 },
  { href: "/admin/settings", label: "Pengaturan", icon: UserCog },
];
