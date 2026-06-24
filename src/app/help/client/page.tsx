"use client";

import Link from "next/link";
import { ArrowLeft, Home, Lightbulb, FileClock, ClipboardList, Target } from "lucide-react";

const STEPS = [
  {
    icon: <Home size={18} />,
    title: "Dashboard",
    desc: "Lihat ringkasan engagement, evidence terbaru, skor kapabilitas, dan action items.",
    path: "/client/dashboard",
  },
  {
    icon: <Lightbulb size={18} />,
    title: "Refleksi",
    desc: "Ikuti 4 langkah: pilih prompt → tulis situasi → catat pembelajaran → rencanakan aksi. Setiap refleksi menjadi evidence.",
    path: "/client/reflection",
  },
  {
    icon: <FileClock size={18} />,
    title: "Evidence Timeline",
    desc: "Semua bukti aktivitas Anda dalam timeline. Filter berdasarkan tipe, lihat skor kualitas, kelola tag kapabilitas.",
    path: "/client/evidence",
  },
  {
    icon: <ClipboardList size={18} />,
    title: "Actions",
    desc: "Kelola action items: update status, atur prioritas, tetapkan tenggat. Action yang lewat deadline akan ditandai OVERDUE.",
    path: "/client/actions",
  },
  {
    icon: <Target size={18} />,
    title: "Capability",
    desc: "Lihat skor kapabilitas Anda dalam radar chart dan bar chart. Skor diperbarui otomatis berdasarkan evidence.",
    path: "/client/capability",
  },
];

const TIPS = [
  "Refleksi rutin (minimal 1× per minggu) untuk menjaga skor kapabilitas tetap akurat.",
  "Gunakan tag kapabilitas yang relevan agar sistem dapat melacak perkembangan dengan tepat.",
  "Update progress action secara berkala — jangan menunggu sampai deadline.",
  "Semakin banyak evidence, semakin akurat profil kapabilitas Anda.",
];

export default function ClientGuidePage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA] px-6 py-10 text-[#0B2C6B]">
      <div className="mx-auto max-w-3xl">
        <Link href="/help" className="mb-6 inline-flex items-center gap-1 text-xs font-bold text-[#D9A441] hover:text-[#0B2C6B]">
          <ArrowLeft size={12} /> Kembali ke Help Center
        </Link>
        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#D9A441]">Panduan Peran</div>
        <h1 className="text-3xl font-light tracking-[-0.04em]">Panduan Peserta</h1>
        <p className="mt-2 text-sm text-[#4A4C54]/70">
          Sebagai peserta, Anda dapat merekam refleksi, melacak aksi, memantau bukti perkembangan, dan melihat skor kapabilitas.
        </p>

        <section className="mt-8 space-y-4">
          {STEPS.map((step, i) => (
            <div key={i} className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F5F7FA] text-[#D9A441]">
                  {step.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0B2C6B] text-[10px] font-bold text-white">{i + 1}</span>
                    <h3 className="text-base font-semibold text-[#0B2C6B]">{step.title}</h3>
                  </div>
                  <p className="mt-1 text-sm text-[#4A4C54]/80">{step.desc}</p>
                  <a href={step.path} className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-[#D9A441] hover:text-[#0B2C6B]">
                    Buka {step.title} →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D9A441]">Tips</p>
          <ul className="mt-3 space-y-2">
            {TIPS.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#4A4C54]/80">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D9A441]" />
                {tip}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
