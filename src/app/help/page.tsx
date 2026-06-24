"use client";

import Link from "next/link";
import { BookOpen, HelpCircle, LifeBuoy, MessageSquare, User, Users, UserCog, ArrowRight } from "lucide-react";

const GUIDES = [
  {
    role: "client",
    title: "Panduan Peserta",
    description: "Refleksi, aksi, bukti perkembangan, dan dashboard personal.",
    icon: <User size={20} />,
    href: "/help/client",
    color: "border-l-emerald-500",
  },
  {
    role: "facilitator",
    title: "Panduan Fasilitator",
    description: "Observasi, penilaian, laporan, dan manajemen partisipan.",
    icon: <Users size={20} />,
    href: "/help/facilitator",
    color: "border-l-amber-500",
  },
  {
    role: "admin",
    title: "Panduan Admin",
    description: "Kelola engagement, izin akses, dan pengaturan sistem.",
    icon: <UserCog size={20} />,
    href: "/help/admin",
    color: "border-l-indigo-500",
  },
];

const FAQS = [
  { q: "Apa itu Catatan?", a: "Catatan adalah rekaman aktivitas — refleksi, observasi, tindakan — yang menjadi bukti perkembangan kemampuan." },
  { q: "Bagaimana cara memulai refleksi?", a: "Buka menu Refleksi, pilih prompt, jawab 4 langkah (Situasi, Pembelajaran, Tindakan, Tag), lalu kirim." },
  { q: "Apa perbedaan status Tindakan?", a: "Akan Dilakukan → Sedang Berjalan → Selesai → Terverifikasi. Tindakan yang lewat deadline akan ditandai TERLAMBAT." },
  { q: "Siapa yang bisa melihat data saya?", a: "Anda dan fasilitator yang ditugaskan ke program Anda. Admin melihat data agregat." },
  { q: "Bagaimana cara fasilitator memberi pengamatan?", a: "Buka Pengamatan, pilih program dan peserta, tulis pengamatan, tandai kemampuan, lalu kirim." },
  { q: "Apa itu Skor Kualitas?", a: "Skor kualitas catatan dihitung dari keyakinan × bobot_tipe × keandalan_sumber. Menentukan keandalan bukti." },
];

export default function HelpCenterPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA] px-6 py-10 text-[#0B2C6B]">
      <div className="mx-auto max-w-4xl">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#D9A441]">Pusat Bantuan</div>
        <h1 className="text-3xl font-light tracking-[-0.04em]">Pusat Bantuan</h1>
        <p className="mt-2 text-sm text-[#4A4C54]/70">
          Panduan peran, FAQ, dan dukungan untuk Transformation OS.
        </p>

        <section className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen size={16} className="text-[#D9A441]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D9A441]">Panduan Peran</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {GUIDES.map((guide) => (
              <Link key={guide.role} href={guide.href}
                className={`rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] border-l-4 ${guide.color} hover:shadow-md transition-shadow`}>
                <div className="text-[#D9A441]">{guide.icon}</div>
                <h3 className="mt-3 text-base font-semibold">{guide.title}</h3>
                <p className="mt-1 text-xs text-[#4A4C54]/70">{guide.description}</p>
                <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-[#D9A441]">
                  Baca Panduan <ArrowRight size={12} />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-center gap-2">
            <HelpCircle size={16} className="text-[#D9A441]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D9A441]">FAQ</p>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <details key={i} className="group rounded-xl border border-[#0B2C6B]/10 bg-white shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold text-[#0B2C6B]">
                  {faq.q}
                  <span className="text-[#D9A441] transition group-open:rotate-180">▼</span>
                </summary>
                <div className="border-t border-[#0B2C6B]/10 px-5 py-4 text-sm text-[#4A4C54]/80">{faq.a}</div>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-center gap-2">
            <LifeBuoy size={16} className="text-[#D9A441]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D9A441]">Butuh Bantuan?</p>
          </div>
          <Link href="/help/support"
            className="flex items-center justify-between rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <MessageSquare size={20} className="text-[#D9A441]" />
              <div>
                <p className="text-sm font-semibold text-[#0B2C6B]">Hubungi Tim Support</p>
                <p className="text-xs text-[#4A4C54]/70">Kami siap membantu Anda dalam 1×24 jam.</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-[#D9A441]" />
          </Link>
        </section>
      </div>
    </main>
  );
}
