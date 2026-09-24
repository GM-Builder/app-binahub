"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, LogIn, RefreshCw } from "lucide-react";
import { ClientAuthGate } from "@/components/client-auth-gate";
import { ClientProgramModules, type ClientProgramModule } from "@/components/client-program-modules";
import { ClientProgramShell, type ClientProgramSummary } from "@/components/client-program-shell";
import { supabase } from "@/lib/supabase";

interface ProgramData {
  program: ClientProgramSummary & { status: string; type: string; organizationId: string };
  participant: { id: string; name: string };
  modules: ClientProgramModule[];
}

export default function ClientProgramPage() {
  const [data, setData] = useState<ProgramData | null>(null);
  const [error, setError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProgram = useCallback(async () => {
    setLoading(true);
    setError("");
    setSessionExpired(false);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setSessionExpired(true);
        throw new Error("Sesi Anda telah berakhir demi keamanan. Silakan masuk kembali untuk melanjutkan program.");
      }
      const response = await fetch("/api/client/program", { headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        setSessionExpired(true);
        throw new Error("Sesi Anda telah berakhir demi keamanan. Silakan masuk kembali untuk melanjutkan program.");
      }
      if (!response.ok || !result.success) throw new Error(result.error || "Program belum dapat dimuat. Silakan coba beberapa saat lagi.");
      setData(result);
      sessionStorage.setItem("binahub:client-program", JSON.stringify(result));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Gagal memuat program.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => {
      try {
        const cached = JSON.parse(sessionStorage.getItem("binahub:client-program") || "null") as ProgramData | null;
        if (cached) { setData(cached); setLoading(false); }
      } catch { /* cache opsional */ }
      return loadProgram();
    });
  }, [loadProgram]);

  return (
    <ClientAuthGate>
      {loading && !data && <main className="min-h-screen bg-[#F4F6F9] p-5 sm:p-8" role="status" aria-label="Memuat program"><span className="sr-only">Memuat program...</span><div className="mx-auto max-w-6xl animate-pulse"><div className="h-16 rounded-2xl bg-white" /><div className="mt-6 h-52 rounded-2xl bg-slate-200" /><div className="mt-6 h-28 rounded-2xl bg-white" /><div className="mt-4 grid gap-4 md:grid-cols-2"><div className="h-64 rounded-2xl bg-white" /><div className="h-64 rounded-2xl bg-white" /></div></div></main>}
      {error && !data && (
        <main className="flex min-h-screen items-center justify-center bg-[#F4F6F9] p-5">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
            <h1 className="mt-4 font-bold text-[#0B2C6B]">{sessionExpired ? "Silakan masuk kembali" : "Program belum dapat dimuat"}</h1>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            {sessionExpired ? <Link href="/client/access" className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0B2C6B] px-4 text-xs font-bold text-white"><LogIn className="h-4 w-4" /> Masuk kembali</Link> : <button type="button" onClick={() => void loadProgram()} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0B2C6B] px-4 text-xs font-bold text-white"><RefreshCw className="h-4 w-4" /> Coba lagi</button>}
          </div>
        </main>
      )}
      {data && (
        <ClientProgramShell program={data.program} participantName={data.participant.name}>
          {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <ClientProgramModules modules={data.modules} />
        </ClientProgramShell>
      )}
    </ClientAuthGate>
  );
}
