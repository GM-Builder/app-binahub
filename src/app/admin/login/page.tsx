"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Lock, Mail, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = "admin@binahub.id";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (email.toLowerCase() !== ADMIN_EMAIL) {
      setError("Akun ini belum terdaftar sebagai admin BinaHub.");
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Login gagal. Pastikan akun Supabase Auth admin sudah dibuat dan password benar.");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  return (
    <>
      <style>{`#global-navbar, footer { display: none !important; }`}</style>
      <main className="min-h-screen bg-[#F5F7FA] px-6 py-8 text-[#0B2C6B]">
        <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl items-center gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <section className="hidden lg:block">
            <div className="mb-10 h-12 w-44 relative">
              <Image src="/full-logo.png" alt="BinaHub" fill className="object-contain object-left" />
            </div>
            <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#D9A441]">
              Admin Intelligence Hub
            </p>
            <h1 className="max-w-xl text-5xl font-light leading-[1.03] tracking-[-0.05em]">
              Ruang kendali data assessment, klien, dan coach.
            </h1>
            <p className="mt-7 max-w-lg text-base font-light leading-[1.8] text-black/58">
              Dashboard ini menjadi fondasi internal BinaHub untuk membaca hasil diagnosa,
              mengelola inquiry klien, dan nantinya menghubungkan coach berdasarkan bidang.
            </p>
          </section>

          <section className="mx-auto w-full max-w-md rounded-[16px] border border-black/[0.05] bg-white p-7 shadow-[0_24px_80px_-58px_rgba(11,44,107,0.42)] md:p-9">
            <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0B2C6B]/70 transition hover:text-[#D9A441]">
              <ArrowLeft size={16} />
              Back
            </Link>
            <div className="mb-8 lg:hidden">
              <div className="relative h-10 w-36">
                <Image src="/full-logo.png" alt="BinaHub" fill className="object-contain object-left" />
              </div>
            </div>

            <div className="mb-8">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#D9A441]">
                Secure Login
              </p>
              <h2 className="text-3xl font-light tracking-[-0.04em] text-[#0B2C6B]">
                Masuk Admin
              </h2>
              <p className="mt-3 text-sm font-light leading-relaxed text-black/48">
                Gunakan akun Supabase Auth admin untuk membuka dashboard internal.
              </p>
            </div>

            {error && (
              <div className="mb-5 flex gap-3 rounded-[12px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0B2C6B]/50">
                  <Mail size={13} /> Email Admin
                </span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-[52px] w-full rounded-[12px] border border-black/10 bg-[#FAFAF8] px-4 text-sm font-medium text-[#0B2C6B] outline-none transition focus:border-[#D9A441]"
                  type="email"
                  autoComplete="email"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0B2C6B]/50">
                  <Lock size={13} /> Password
                </span>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-[52px] w-full rounded-[12px] border border-black/10 bg-[#FAFAF8] px-4 text-sm font-medium text-[#0B2C6B] outline-none transition focus:border-[#D9A441]"
                  type="password"
                  placeholder="1234567890"
                  autoComplete="current-password"
                />
              </label>

              <button
                disabled={loading}
                className="group flex h-14 w-full items-center justify-center gap-3 rounded-[12px] bg-[#0B2C6B] text-[11px] font-bold uppercase tracking-[0.18em] text-[#D9A441] transition hover:bg-[#08245A] disabled:opacity-60"
              >
                {loading ? "Memeriksa Akses..." : "Masuk Dashboard"}
                <ArrowRight size={16} className="transition group-hover:translate-x-1" />
              </button>
            </form>

            <p className="mt-6 text-xs leading-relaxed text-black/38">
              Catatan: akun <strong>admin@binahub.id</strong> perlu dibuat di Supabase Auth
              dengan password sementara yang Anda tentukan.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
