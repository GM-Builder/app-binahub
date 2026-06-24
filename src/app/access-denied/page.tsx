"use client";

import Link from "next/link";
import { ShieldX, ArrowLeft } from "lucide-react";

export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F7FA] p-6 text-[#0B2C6B]">
      <section className="w-full max-w-md text-center">
        <ShieldX size={56} className="mx-auto text-red-400" />
        <h1 className="mt-6 text-3xl font-light tracking-[-0.04em]">Akses Ditolak</h1>
        <p className="mt-3 text-sm text-[#4A4C54]/70">
          Anda tidak memiliki izin untuk mengakses halaman ini. Silakan hubungi admin jika ini adalah kesalahan.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/" className="inline-flex items-center gap-2 rounded-lg bg-[#0B2C6B] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#0A255A]">
            <ArrowLeft size={14} /> Kembali ke Beranda
          </Link>
          <Link href="/login" className="inline-flex items-center gap-2 rounded-lg border border-[#0B2C6B]/10 px-5 py-2.5 text-xs font-bold text-[#0B2C6B] hover:bg-[#F5F7FA]">
            Ganti Akun
          </Link>
        </div>
      </section>
    </main>
  );
}
