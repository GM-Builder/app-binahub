"use client";

import Link from "next/link";
import { ArrowLeft, Blocks, Building2, ClipboardList, Plus, Send } from "lucide-react";

const STEPS = [
  {
    icon: Plus,
    title: "Buat program",
    description: "Isi perusahaan, nama dan kode program, lokasi bila diperlukan, jadwal, serta modul yang disepakati dengan klien.",
    path: "/admin/engagements/new",
  },
  {
    icon: Blocks,
    title: "Atur modul dan status",
    description: "Hanya modul yang diaktifkan admin yang muncul di portal peserta. Aktifkan program sebelum peserta mulai masuk.",
    path: "/admin/programs",
  },
  {
    icon: Send,
    title: "Bagikan akses peserta",
    description: "Klik Bagikan pada kartu program. Kirim tautan khusus program dan kode akses; peserta mengisi namanya sendiri tanpa akun atau kata sandi.",
    path: "/admin/programs",
  },
  {
    icon: Building2,
    title: "Kelola organisasi",
    description: "Periksa organisasi klien beserta program yang terhubung dengannya.",
    path: "/admin/organizations",
  },
  {
    icon: ClipboardList,
    title: "Pantau pelaksanaan",
    description: "Gunakan dashboard T-BOS dan LEP untuk memantau pelaksanaan serta hasil program sesuai modul yang dipilih.",
    path: "/admin/programs",
  },
];

const TIPS = [
  "Gunakan kode yang unik dan tidak mudah ditebak; kode minimal enam karakter.",
  "Tautan tidak memuat kode akses. Bagikan tautan dan kode hanya kepada peserta program.",
  "Peserta tidak perlu ditambahkan ketika program dibuat; nama tercatat saat peserta pertama kali masuk.",
  "Anggota dan kapten tim T-BOS tetap dikelola dari alur T-BOS, bukan dari daftar peserta portal.",
  "Program Draf, Selesai, atau Diarsipkan tidak dapat menerima peserta baru.",
];

export default function AdminGuidePage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA] px-4 py-8 text-[#0B2C6B] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/help" className="mb-6 inline-flex min-h-10 items-center gap-2 text-xs font-bold text-[#D9A441] hover:text-[#0B2C6B]">
          <ArrowLeft size={14} /> Kembali ke Pusat Bantuan
        </Link>
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D9A441]">Panduan Peran</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">Panduan Admin</h1>
        <p className="mt-2 text-sm leading-6 text-[#4A4C54]/70">Alur ringkas untuk menyiapkan program dan membuka akses peserta dengan aman.</p>

        <section className="mt-8 space-y-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <article key={step.title} className="rounded-2xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5F7FA] text-[#D9A441]"><Icon size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0B2C6B] text-[10px] font-bold text-white">{index + 1}</span><h2 className="font-bold">{step.title}</h2></div>
                    <p className="mt-2 text-sm leading-6 text-[#4A4C54]/75">{step.description}</p>
                    <Link href={step.path} className="mt-3 inline-flex min-h-9 items-center text-xs font-bold text-[#D9A441] hover:text-[#0B2C6B]">Buka halaman →</Link>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-8 rounded-2xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D9A441]">Hal penting</h2>
          <ul className="mt-3 space-y-3">
            {TIPS.map((tip) => <li key={tip} className="flex items-start gap-3 text-sm leading-6 text-[#4A4C54]/75"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D9A441]" />{tip}</li>)}
          </ul>
        </section>
      </div>
    </main>
  );
}
