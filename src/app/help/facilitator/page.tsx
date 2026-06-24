"use client";

import Link from "next/link";
import { ArrowLeft, Eye, UsersRound, ShieldCheck, FileText, RadioTower, BarChart3 } from "lucide-react";

const STEPS = [
  {
    icon: <Eye size={18} />,
    title: "Observation Input",
    desc: "Buat observasi dalam 4 langkah: pilih engagement → pilih partisipan → tulis observasi → tandai kapabilitas. Observasi langsung menjadi evidence.",
    path: "/facilitator/evidence",
  },
  {
    icon: <UsersRound size={18} />,
    title: "Participants",
    desc: "Lihat daftar partisipan per engagement, detail kapabilitas, dan riwayat evidence.",
    path: "/facilitator/participants",
  },
  {
    icon: <ShieldCheck size={18} />,
    title: "Evaluation Queue",
    desc: "Review evidence partisipan, beri tanda sudah diperiksa. Pastikan semua evidence berkualitas sebelum laporan.",
    path: "/facilitator/reviews",
  },
  {
    icon: <FileText size={18} />,
    title: "Reports",
    desc: "Buat laporan engagement berdasarkan evidence yang terkumpul. Filter partisipan dan rentang tanggal.",
    path: "/facilitator/reports",
  },
  {
    icon: <RadioTower size={18} />,
    title: "Event Queue",
    desc: "Pantau antrian event sistem — lihat status, percobaan ulang, dan error.",
    path: "/facilitator/events",
  },
  {
    icon: <BarChart3 size={18} />,
    title: "Statistics",
    desc: "Statistik tim: rata-rata skor kapabilitas, distribusi evidence, tren perkembangan.",
    path: "/facilitator/statistics",
  },
];

const TIPS = [
  "Buat observasi segera setelah sesi — semakin cepat, semakin akurat ingatan Anda.",
  "Gunakan tag kapabilitas yang spesifik agar profil kapabilitas partisipan lebih presisi.",
  "Review evidence secara rutin, jangan menumpuk menjelang deadline laporan.",
  "Gunakan dashboard untuk memantau perkembangan partisipan secara keseluruhan.",
];

export default function FacilitatorGuidePage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA] px-6 py-10 text-[#0B2C6B]">
      <div className="mx-auto max-w-3xl">
        <Link href="/help" className="mb-6 inline-flex items-center gap-1 text-xs font-bold text-[#D9A441] hover:text-[#0B2C6B]">
          <ArrowLeft size={12} /> Kembali ke Help Center
        </Link>
        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#D9A441]">Panduan Peran</div>
        <h1 className="text-3xl font-light tracking-[-0.04em]">Panduan Fasilitator</h1>
        <p className="mt-2 text-sm text-[#4A4C54]/70">
          Sebagai fasilitator, Anda dapat membuat observasi, menilai partisipan, meninjau bukti, dan menghasilkan laporan.
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
