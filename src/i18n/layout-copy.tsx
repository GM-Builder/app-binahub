import type { ReactNode } from "react"

export type NavItemKey = "home" | "about" | "services" | "perspective" | "contact"
export type NavSubItemKey =
  | "whoWeAre"
  | "fromBdn"
  | "vision"
  | "gallery"
  | "whyProgramsFail"
  | "workflow"
  | "serviceMap"
  | "chooseNeed"
  | "viewpoint"
  | "signals"
  | "approach"

export type NavItem = {
  key: NavItemKey
  label: string
  href: string
  submenu?: {
    key: NavSubItemKey
    label: string
    href: string
    desc: string
  }[]
}

export type FooterGroup = {
  title: string
  defaultHref: string
  links: { label: string; href: string }[]
}

export type CtaConfig = {
  eyebrow?: string
  title: ReactNode
  description?: string
  primary: { label: string; href: string }
  secondary?: { label: string; href: string }
  variant: "home" | "navy" | "blue"
}

export const layoutCopy = {
  id: {
    nav: {
      items: [
        {
          key: "home",
          label: "Home",
          href: "/",
        },
        {
          key: "about",
          label: "Tentang",
          href: "/about",
          submenu: [
            { key: "whoWeAre", label: "Siapa Kami", href: "/about#siapa-kami", desc: "Posisi, arah, dan peran BinaHub sebagai partner transformasi." },
            { key: "fromBdn", label: "Dari BDN ke BinaHub", href: "/from-bdn-to-binahub", desc: "Jembatan legacy 16 tahun menuju ekosistem baru." },
            { key: "vision", label: "Visi & Nilai", href: "/about#visi", desc: "Masa depan yang kami bangun dan prinsip H.U.M.A.N yang menjaganya." },
            { key: "gallery", label: "Gallery", href: "/gallery", desc: "Dokumentasi program, interaksi, dan aktivitas nyata." },
          ],
        },
        {
          key: "services",
          label: "Layanan",
          href: "/ecosystem",
          submenu: [
            { key: "whyProgramsFail", label: "Mengapa Program Gagal", href: "/ecosystem#latar-belakang", desc: "Masalah umum di balik intervensi yang tidak berdampak." },
            { key: "workflow", label: "Alur Kerja", href: "/ecosystem#alur-kerja", desc: "Proses strategis dari pemetaan hingga implementasi." },
            { key: "serviceMap", label: "Peta Layanan", href: "/ecosystem#solusi", desc: "Rangkaian layanan yang saling terhubung." },
            { key: "chooseNeed", label: "Pilih Kebutuhan", href: "/ecosystem#detail", desc: "Telusuri karakter setiap layanan dalam ekosistem." },
          ],
        },
        {
          key: "perspective",
          label: "Perspektif",
          href: "/perspektif",
          submenu: [
            { key: "viewpoint", label: "Cara Pandang", href: "/perspektif", desc: "Keyakinan kami tentang manusia, AI, dan transformasi." },
            { key: "signals", label: "Transformation Signals", href: "/perspektif/transformation-signals-2026", desc: "Sinyal perubahan dunia kerja Indonesia 2026." },
            { key: "approach", label: "Pendekatan", href: "/perspektif#pendekatan", desc: "Kerangka berpikir untuk membaca kebutuhan organisasi." },
          ],
        },
        {
          key: "contact",
          label: "Kontak",
          href: "/contact",
        },
      ] satisfies NavItem[],
      ctaLabel: "Diagnosa Performa",
      mobileTitle: "Navigasi",
      mobileSubtitle: "Pilih bagian yang ingin Anda jelajahi.",
      closeMenu: "Tutup menu",
      visitMainPage: "Kunjungi Halaman Utama",
    },
    footer: {
      tagline: "Transformasi manusia, kepemimpinan, dan kapabilitas untuk masa depan yang terus berubah.",
      navigationLabel: "Navigasi",
      contactTitle: "Kontak & Kehadiran",
      officeLabel: "Lokasi Kantor",
      emailLabel: "Email",
      phoneLabel: "Telepon",
      privacy: "Kebijakan Privasi",
      terms: "Syarat & Ketentuan",
      popularTitle: "Popular Links",
      groups: [
        {
          title: "Tentang",
          defaultHref: "/about",
          links: [
            { label: "Siapa Kami", href: "/about#siapa-kami" },
            { label: "Dari BDN ke BinaHub", href: "/from-bdn-to-binahub" },
            { label: "Visi & Nilai", href: "/about#visi" },
            { label: "Gallery", href: "/gallery" },
          ],
        },
        {
          title: "Layanan",
          defaultHref: "/ecosystem",
          links: [
            { label: "Mengapa Program Gagal", href: "/ecosystem#latar-belakang" },
            { label: "Alur Kerja", href: "/ecosystem#alur-kerja" },
            { label: "Peta Layanan", href: "/ecosystem#solusi" },
            { label: "Pilih Kebutuhan", href: "/ecosystem#detail" },
          ],
        },
        {
          title: "Perspektif",
          defaultHref: "/perspektif",
          links: [
            { label: "Cara Pandang", href: "/perspektif" },
            { label: "Transformation Signals", href: "/perspektif/transformation-signals-2026" },
            { label: "Pendekatan", href: "/perspektif#pendekatan" },
          ],
        },
      ] satisfies FooterGroup[],
      popularLinks: [
        { label: "Diagnosa Performa", href: "/insight" },
        { label: "Hubungi Kami", href: "/contact" },
        { label: "Transformation Signals", href: "/perspektif/transformation-signals-2026" },
      ],
    },
    ctaByPath: {
      "/": {
        title: (
          <>
            Mulai manusiakan
            <br />
            masa depan Anda.
          </>
        ),
        description: "Hubungi kami untuk konsultasi strategis dan mulailah perjalanan transformasi organisasi Anda.",
        primary: { label: "Diagnosa Performa", href: "/insight" },
        secondary: { label: "Pelajari Lebih Lanjut", href: "/about" },
        variant: "home",
      },
      "/about": {
        eyebrow: "LANGKAH LANJUT",
        title: "Mulai dari membaca kondisi organisasi Anda.",
        description: "Gunakan Diagnosa Performa untuk memetakan prioritas transformasi sebelum menentukan intervensi yang tepat.",
        primary: { label: "Diagnosa Performa", href: "/insight" },
        secondary: { label: "Hubungi Kami", href: "/contact" },
        variant: "navy",
      },
      "/ecosystem": {
        title: (
          <>
            Mulai Transformasi <span className="italic text-[#D9A441]">Sekarang.</span>
          </>
        ),
        description: "Partnering in your journey towards excellence.",
        primary: { label: "Konsultasi Gratis", href: "/contact" },
        variant: "blue",
      },
      "/journey": {
        eyebrow: "MULAI BERSAMA KAMI",
        title: "Siap melangkah ke babak berikutnya?",
        primary: { label: "Hubungi Kami", href: "/contact" },
        secondary: { label: "Mulai Diagnosa Performa", href: "/insight" },
        variant: "navy",
      },
      "/from-bdn-to-binahub": {
        eyebrow: "LANGKAH BERIKUTNYA",
        title: "Ingin tahu apakah BinaHub tepat untuk organisasi Anda?",
        description: "Mulai dengan sesi Organizational Readiness Diagnostic untuk memahami tantangan spesifik organisasi Anda dan mengevaluasi kecocokan pendekatan kami.",
        primary: { label: "Jadwalkan Readiness Session", href: "/insight" },
        variant: "navy",
      },
      "/perspektif/transformation-signals-2026": {
        eyebrow: "RECOMMENDED RESPONSE",
        title: "Build a people transformation operating system.",
        description: "Hubungkan diagnosis, desain intervensi, pengalaman belajar, eksekusi, dan pengukuran dampak dalam satu alur transformasi.",
        primary: { label: "Mulai Diagnosa", href: "/insight" },
        secondary: { label: "Lihat Ekosistem", href: "/ecosystem" },
        variant: "navy",
      },
    } satisfies Record<string, CtaConfig>,
  },
  en: {
    nav: {
      items: [
        {
          key: "home",
          label: "Home",
          href: "/",
        },
        {
          key: "about",
          label: "About",
          href: "/about",
          submenu: [
            { key: "whoWeAre", label: "Who We Are", href: "/about#siapa-kami", desc: "BinaHub's position, direction, and role as a transformation partner." },
            { key: "fromBdn", label: "From BDN to BinaHub", href: "/from-bdn-to-binahub", desc: "A bridge from 16 years of legacy into a new ecosystem." },
            { key: "vision", label: "Vision & Values", href: "/about#visi", desc: "The future we build and the H.U.M.A.N principles that guide it." },
            { key: "gallery", label: "Gallery", href: "/gallery", desc: "Program documentation, interactions, and real activities." },
          ],
        },
        {
          key: "services",
          label: "Services",
          href: "/ecosystem",
          submenu: [
            { key: "whyProgramsFail", label: "Why Programs Fail", href: "/ecosystem#latar-belakang", desc: "Common problems behind interventions that do not create impact." },
            { key: "workflow", label: "Workflow", href: "/ecosystem#alur-kerja", desc: "A strategic process from mapping to implementation." },
            { key: "serviceMap", label: "Service Map", href: "/ecosystem#solusi", desc: "A connected portfolio of transformation services." },
            { key: "chooseNeed", label: "Choose Your Need", href: "/ecosystem#detail", desc: "Explore the character of each service in the ecosystem." },
          ],
        },
        {
          key: "perspective",
          label: "Perspective",
          href: "/perspektif",
          submenu: [
            { key: "viewpoint", label: "Point of View", href: "/perspektif", desc: "Our beliefs about people, AI, and transformation." },
            { key: "signals", label: "Transformation Signals", href: "/perspektif/transformation-signals-2026", desc: "Signals shaping Indonesia's world of work in 2026." },
            { key: "approach", label: "Approach", href: "/perspektif#pendekatan", desc: "A thinking framework for reading organizational needs." },
          ],
        },
        {
          key: "contact",
          label: "Contact",
          href: "/contact",
        },
      ] satisfies NavItem[],
      ctaLabel: "Performance Diagnostic",
      mobileTitle: "Navigation",
      mobileSubtitle: "Choose the section you want to explore.",
      closeMenu: "Close menu",
      visitMainPage: "Visit Main Page",
    },
    footer: {
      tagline: "People, leadership, and capability transformation for a future that keeps changing.",
      navigationLabel: "Navigation",
      contactTitle: "Contact & Presence",
      officeLabel: "Office Location",
      emailLabel: "Email",
      phoneLabel: "Phone",
      privacy: "Privacy Policy",
      terms: "Terms & Conditions",
      popularTitle: "Popular Links",
      groups: [
        {
          title: "About",
          defaultHref: "/about",
          links: [
            { label: "Who We Are", href: "/about#siapa-kami" },
            { label: "From BDN to BinaHub", href: "/from-bdn-to-binahub" },
            { label: "Vision & Values", href: "/about#visi" },
            { label: "Gallery", href: "/gallery" },
          ],
        },
        {
          title: "Services",
          defaultHref: "/ecosystem",
          links: [
            { label: "Why Programs Fail", href: "/ecosystem#latar-belakang" },
            { label: "Workflow", href: "/ecosystem#alur-kerja" },
            { label: "Service Map", href: "/ecosystem#solusi" },
            { label: "Choose Your Need", href: "/ecosystem#detail" },
          ],
        },
        {
          title: "Perspective",
          defaultHref: "/perspektif",
          links: [
            { label: "Point of View", href: "/perspektif" },
            { label: "Transformation Signals", href: "/perspektif/transformation-signals-2026" },
            { label: "Approach", href: "/perspektif#pendekatan" },
          ],
        },
      ] satisfies FooterGroup[],
      popularLinks: [
        { label: "Performance Diagnostic", href: "/insight" },
        { label: "Contact Us", href: "/contact" },
        { label: "Transformation Signals", href: "/perspektif/transformation-signals-2026" },
      ],
    },
    ctaByPath: {
      "/": {
        title: (
          <>
            Start humanizing
            <br />
            your future.
          </>
        ),
        description: "Talk to us for a strategic consultation and begin your organization's transformation journey.",
        primary: { label: "Performance Diagnostic", href: "/insight" },
        secondary: { label: "Learn More", href: "/about" },
        variant: "home",
      },
      "/about": {
        eyebrow: "NEXT STEP",
        title: "Start by reading your organization's current condition.",
        description: "Use Performance Diagnostic to map transformation priorities before choosing the right intervention.",
        primary: { label: "Performance Diagnostic", href: "/insight" },
        secondary: { label: "Contact Us", href: "/contact" },
        variant: "navy",
      },
      "/ecosystem": {
        title: (
          <>
            Start Transformation <span className="italic text-[#D9A441]">Now.</span>
          </>
        ),
        description: "Partnering in your journey towards excellence.",
        primary: { label: "Free Consultation", href: "/contact" },
        variant: "blue",
      },
      "/journey": {
        eyebrow: "START WITH US",
        title: "Ready to move into the next chapter?",
        primary: { label: "Contact Us", href: "/contact" },
        secondary: { label: "Start Performance Diagnostic", href: "/insight" },
        variant: "navy",
      },
      "/from-bdn-to-binahub": {
        eyebrow: "NEXT STEP",
        title: "Want to know whether BinaHub is right for your organization?",
        description: "Start with an Organizational Readiness Diagnostic session to understand your specific challenges and evaluate fit.",
        primary: { label: "Schedule Readiness Session", href: "/insight" },
        variant: "navy",
      },
      "/perspektif/transformation-signals-2026": {
        eyebrow: "RECOMMENDED RESPONSE",
        title: "Build a people transformation operating system.",
        description: "Connect diagnosis, intervention design, learning experience, execution, and impact measurement in one transformation flow.",
        primary: { label: "Start Diagnostic", href: "/insight" },
        secondary: { label: "View Ecosystem", href: "/ecosystem" },
        variant: "navy",
      },
    } satisfies Record<string, CtaConfig>,
  },
} as const
