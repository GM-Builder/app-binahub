"use client";

import Link from "next/link";
import { ArrowLeft, Settings, UsersRound, ClipboardList, Shield, Plus } from "lucide-react";

const STEPS = [
  {
    icon: <Plus size={18} />,
    title: "Buat Engagement",
    desc: "Buat engagement baru dengan 3 langkah: isi info dasar → tambah partisipan → tambah fasilitator. Engagement bisa diatur statusnya dari Draft hingga Archived.",
    path: "/admin/engagements/new",
  },
  {
    icon: <Settings size={18} />,
    title: "Kelola Engagement",
    desc: "Ubah status engagement (Draft → Active → In Progress → Review → Completed → Archived). Tambah/hapus partisipan dan fasilitator, lihat jumlah evidence.",
    path: "/admin/engagements",
  },
  {
    icon: <UsersRound size={18} />,
    title: "Organizations",
    desc: "Kelola organisasi klien — lihat daftar organisasi dan engagement milik mereka.",
    path: "/admin/organizations",
  },
  {
    icon: <ClipboardList size={18} />,
    title: "Assessments",
    desc: "Pantau assessment dan inquiry yang masuk, kelola pipeline penjualan dan pengiriman assessment.",
    path: "/admin/assessments",
  },
  {
    icon: <Shield size={18} />,
    title: "RBAC Matrix",
    desc: "Lihat matriks izin peran — siapa yang bisa mengakses fitur apa. Izin bersifat derived dari role, tidak bisa diubah manual.",
    path: "/admin/rbac",
  },
];

const TIPS = [
  "Pastikan engagement memiliki status yang tepat — gunakan status Draft sebelum siap diakses peserta.",
  "Tambahkan fasilitator yang relevan agar peserta mendapatkan observasi yang akurat.",
  "Gunakan RBAC Matrix sebagai referensi untuk memahami batasan akses setiap peran.",
  "Pantau engagement secara berkala untuk memastikan perkembangan berjalan sesuai rencana.",
];

export default function AdminGuidePage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA] px-6 py-10 text-[#0B2C6B]">
      <div className="mx-auto max-w-3xl">
        <Link href="/help" className="mb-6 inline-flex items-center gap-1 text-xs font-bold text-[#D9A441] hover:text-[#0B2C6B]">
          <ArrowLeft size={12} /> Kembali ke Help Center
        </Link>
        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#D9A441]">Panduan Peran</div>
        <h1 className="text-3xl font-light tracking-[-0.04em]">Panduan Admin</h1>
        <p className="mt-2 text-sm text-[#4A4C54]/70">
          Sebagai admin, Anda dapat mengelola engagement, organisasi, assessment, dan memantau seluruh sistem.
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
