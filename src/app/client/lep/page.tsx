"use client";

import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ClientAuthGate } from "@/components/client-auth-gate";
import { ClientProgramShell, type ClientProgramSummary } from "@/components/client-program-shell";
import { PesertaLepContent } from "@/app/peserta/lep/_components/peserta-lep-content";
import { supabase } from "@/lib/supabase";
import { programAccessPath } from "@/lib/program-access-link";

interface ProgramData {
  program: ClientProgramSummary;
  participant: { id: string; name: string };
  modules: Array<{ key: "lep" | "tbos" | "binainsight" | "pre_test" | "post_test"; enabled: boolean }>;
}

export default function ClientLepPage() {
  const [data, setData] = useState<ProgramData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      try {
        const cached = JSON.parse(sessionStorage.getItem("binahub:client-program") || "null") as ProgramData | null;
        if (cached?.modules.some((module) => module.key === "lep" && module.enabled)) setData(cached);
      } catch { /* cache opsional */ }
      return supabase.auth.getSession();
    }).then(async ({ data: sessionData }) => {
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Sesi program tidak tersedia.");
      const response = await fetch("/api/client/program", { headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.error || "Gagal memuat program.");
      if (!result.modules?.some((module: { key: string; enabled: boolean }) => module.key === "lep" && module.enabled)) {
        throw new Error("Modul LEP tidak aktif untuk program ini.");
      }
      if (active) {
        setData(result);
        sessionStorage.setItem("binahub:client-program", JSON.stringify(result));
      }
    }).catch((failure) => {
      if (active) setError(failure instanceof Error ? failure.message : "Gagal memuat program.");
    });
    return () => { active = false; };
  }, []);

  return (
    <ClientAuthGate>
      {!data && !error && <main className="flex min-h-screen items-center justify-center gap-3 bg-[#F4F6F9] text-sm font-semibold text-[#0B2C6B]"><Loader2 className="h-5 w-5 animate-spin" /> Memuat evaluasi...</main>}
      {error && <main className="flex min-h-screen items-center justify-center bg-[#F4F6F9] p-5"><div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center text-sm text-red-700">{error}<Link href="/client/program" className="mt-5 flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#0B2C6B] px-4 text-xs font-bold text-white"><ArrowLeft className="h-4 w-4" /> Kembali ke program</Link></div></main>}
      {data && (
        <ClientProgramShell program={data.program} participantName={data.participant.name} variant="task" taskTitle="Evaluasi Program">
          <PesertaLepContent accessPath={programAccessPath(data.program.id)} lockedProgramId={data.program.id} />
        </ClientProgramShell>
      )}
    </ClientAuthGate>
  );
}
