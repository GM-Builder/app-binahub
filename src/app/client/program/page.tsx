"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
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
  const [loading, setLoading] = useState(true);

  const loadProgram = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Sesi program tidak tersedia.");
      const response = await fetch("/api/client/program", { headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.error || "Gagal memuat program.");
      setData(result);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Gagal memuat program.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProgram();
  }, [loadProgram]);

  return (
    <ClientAuthGate>
      {loading && !data && <main className="flex min-h-screen items-center justify-center gap-3 bg-[#F4F6F9] text-sm font-semibold text-[#0B2C6B]" role="status"><Loader2 className="h-5 w-5 animate-spin" /> Memuat program...</main>}
      {error && !data && (
        <main className="flex min-h-screen items-center justify-center bg-[#F4F6F9] p-5">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
            <h1 className="mt-4 font-bold text-[#0B2C6B]">Program tidak dapat dimuat</h1>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <button type="button" onClick={() => void loadProgram()} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0B2C6B] px-4 text-xs font-bold text-white"><RefreshCw className="h-4 w-4" /> Coba lagi</button>
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
