"use client";

import Link from "next/link";
import { ArrowLeft, BarChart3, ClipboardCheck, Eye } from "lucide-react";

const STEPS = [
  {
    icon: <ClipboardCheck size={18} />,
    title: "Form Observasi T-BOS",
    description: "Pilih program, misi, dan tim; lalu isi dimensi perilaku yang muncul untuk misi tersebut.",
    href: "/fasilitator/tbos",
  },
  {
    icon: <Eye size={18} />,
    title: "Kelola Observasi",
    description: "Tinjau observasi yang pernah dikirim dan kunci hasil yang sudah final.",
    href: "/fasilitator/tbos/observations",
  },
  {
    icon: <BarChart3 size={18} />,
    title: "Hasil & Statistik",
    description: "Lihat ringkasan skor dan perkembangan seluruh tim pada program yang ditugaskan.",
    href: "/fasilitator/tbos/results",
  },
];

const TIPS = [
  "Pilih misi yang sedang dilalui tim sebelum mulai menilai.",
  "Pastikan semua dimensi wajib terisi sebelum mengirim observasi.",
  "Kunci observasi hanya setelah hasilnya benar-benar final.",
];

export default function FacilitatorGuidePage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA] px-4 py-8 text-[#0B2C6B] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/help" className="mb-6 inline-flex min-h-11 items-center gap-1 text-xs font-bold text-[#D9A441] hover:text-[#0B2C6B]">
          <ArrowLeft size={12} /> Kembali ke Help Center
        </Link>
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D9A441]">Panduan Peran</p>
        <h1 className="mt-2 text-3xl font-light tracking-[-0.04em]">Panduan Fasilitator T-BOS</h1>
        <p className="mt-2 text-sm text-[#4A4C54]/70">Area fasilitator difokuskan pada alur observasi T-BOS agar tugas lapangan tetap jelas.</p>

        <section className="mt-8 space-y-4">
          {STEPS.map((step, index) => (
            <article key={step.href} className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F5F7FA] text-[#D9A441]">{step.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0B2C6B] text-[10px] font-bold text-white">{index + 1}</span>
                    <h2 className="text-base font-semibold">{step.title}</h2>
                  </div>
                  <p className="mt-1 text-sm text-[#4A4C54]/80">{step.description}</p>
                  <Link href={step.href} className="mt-2 inline-flex min-h-11 items-center text-xs font-bold text-[#D9A441] hover:text-[#0B2C6B]">Buka {step.title} →</Link>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D9A441]">Tips</p>
          <ul className="mt-3 space-y-2">
            {TIPS.map((tip) => <li key={tip} className="flex items-start gap-2 text-sm text-[#4A4C54]/80"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D9A441]" />{tip}</li>)}
          </ul>
        </section>
      </div>
    </main>
  );
}
