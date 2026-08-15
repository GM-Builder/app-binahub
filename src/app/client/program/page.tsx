"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, Gamepad2, Loader2 } from "lucide-react";
import { ClientAuthGate } from "@/components/client-auth-gate";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/lib/supabase";

interface ProgramData {
  program: {
    id: string;
    code: string;
    title: string;
    status: string;
    start_date: string | null;
    end_date: string | null;
  };
  participant: { id: string; name: string };
  modules: Array<{ key: "lep" | "tbos"; enabled: boolean; clientAvailable: boolean }>;
}

export default function ClientProgramPage() {
  const [data, setData] = useState<ProgramData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(async ({ data: sessionData }) => {
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Sesi program tidak tersedia.");
      const response = await fetch("/api/client/program", { headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.error || "Gagal memuat program.");
      if (active) setData(result);
    }).catch((failure) => {
      if (active) setError(failure instanceof Error ? failure.message : "Gagal memuat program.");
    });
    return () => { active = false; };
  }, []);

  return (
    <ClientAuthGate>
      <AppShell role="client" title="Program Saya" eyebrow="Akses Peserta">
        {!data && !error && (
          <div className="flex min-h-[55vh] items-center justify-center gap-3 text-sm font-semibold text-[#0B2C6B]" role="status">
            <Loader2 className="h-5 w-5 animate-spin" /> Memuat program...
          </div>
        )}
        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {data && (
          <div className="mx-auto max-w-3xl space-y-5">
            <section className="overflow-hidden rounded-2xl bg-[#0B2C6B] p-6 text-white shadow-xl shadow-[#0B2C6B]/15 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F3CE7A]">{data.program.code}</p>
              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{data.program.title}</h1>
              <p className="mt-3 text-sm text-white/70">Halo, {data.participant.name}. Pilih modul yang tersedia di bawah.</p>
            </section>

            <section aria-labelledby="module-title">
              <h2 id="module-title" className="text-lg font-bold text-[#0B2C6B]">Modul program</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {data.modules.map((module) => module.key === "lep" ? (
                  <Link key={module.key} href="/client/lep" className="group rounded-2xl border border-[#0B2C6B]/10 bg-white p-5 shadow-sm transition hover:border-[#D9A441] hover:shadow-md">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0B2C6B] text-[#F3CE7A]"><ClipboardCheck className="h-5 w-5" /></div>
                    <h3 className="mt-4 font-bold text-[#0B2C6B]">LEP</h3>
                    <p className="mt-1 text-sm leading-6 text-[#4A4C54]/70">Isi Lembar Evaluasi Program satu kali untuk program ini.</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#0B2C6B]">Buka evaluasi <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
                  </Link>
                ) : (
                  <article key={module.key} className="rounded-2xl border border-[#0B2C6B]/10 bg-white p-5 opacity-80 shadow-sm">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F3E7CA] text-[#0B2C6B]"><Gamepad2 className="h-5 w-5" /></div>
                    <h3 className="mt-4 font-bold text-[#0B2C6B]">Game T-BOS</h3>
                    <p className="mt-1 text-sm leading-6 text-[#4A4C54]/70">Penilaian T-BOS dikelola fasilitator di setiap pos. Halaman peserta belum diperlukan.</p>
                    <span className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">Fasilitator saja</span>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
      </AppShell>
    </ClientAuthGate>
  );
}
