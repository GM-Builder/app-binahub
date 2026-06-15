"use client";

import Image from "next/image";
import Link from "next/link";
import { AlertCircle, ArrowLeft, ArrowRight, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function FacilitatorLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    await supabase.auth.signOut();

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (signInError || !data.session?.access_token) {
      setError("Login gagal. Periksa email dan password fasilitator.");
      setLoading(false);
      return;
    }

    if (data.user?.email?.trim().toLowerCase() !== normalizedEmail) {
      await supabase.auth.signOut();
      setError("Session login tidak sesuai dengan email fasilitator.");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/facilitator/session", {
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      await supabase.auth.signOut();
      setError(result?.error || "Akun ini belum memiliki akses fasilitator.");
      setLoading(false);
      return;
    }

    const nextPath = new URLSearchParams(window.location.search).get("next") || "/facilitator/dashboard";
    router.push(nextPath.startsWith("/") ? nextPath : "/facilitator/dashboard");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F7FA] px-6 py-12 text-[#0B2C6B]">
      <section className="w-full max-w-md rounded-[18px] border border-[#0B2C6B]/10 bg-white p-7 shadow-[0_24px_80px_-58px_rgba(11,44,107,0.42)]">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0B2C6B]/70 transition hover:text-[#D9A441]">
          <ArrowLeft size={16} />
          Back
        </Link>
        <Image src="/full-logo.png" alt="BinaHub" width={150} height={42} className="h-10 w-auto object-contain" />
        <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.24em] text-[#D9A441]">
          Fasilitator
        </p>
        <h1 className="mt-2 text-3xl font-light tracking-[-0.04em]">Masuk Fasilitator</h1>

        {error && (
          <div className="mt-5 flex gap-3 rounded-[12px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-6 space-y-5">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0B2C6B]/50">
              <Mail size={13} /> Email
            </span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-[52px] w-full rounded-[12px] border border-black/10 bg-[#FAFAF8] px-4 text-sm font-medium text-[#0B2C6B] outline-none transition focus:border-[#D9A441]"
              type="email"
              autoComplete="email"
              required
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
              autoComplete="current-password"
              required
            />
          </label>

          <button
            disabled={loading}
            className="flex h-[54px] w-full items-center justify-center gap-3 rounded-[12px] bg-[#0B2C6B] text-sm font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Memeriksa..." : "Masuk"}
            <ArrowRight size={17} />
          </button>
        </form>
      </section>
    </main>
  );
}
