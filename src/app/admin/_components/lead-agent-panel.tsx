"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bot, Building2, ChevronDown, Play, RefreshCw, ShieldCheck, Sparkles, Upload, UserSearch } from "lucide-react";

type AdminAction = (url: string, init?: RequestInit) => Promise<unknown>;
type LeadAgentRun = {
  id: string;
  status: string;
  dry_run: boolean;
  discovered_count: number;
  eligible_count: number;
  staged_count: number;
  company_review_count?: number;
  started_at: string;
  finished_at: string | null;
};
type LeadCandidate = {
  id: string;
  discovery_run_id: string;
  full_name: string;
  candidate_kind?: "company" | "person";
  role_title: string | null;
  company: string | null;
  industry: string | null;
  location: string | null;
  employee_range?: string | null;
  fit_score: number;
  status: string;
  match_reasons: string[];
};
type LeadAgentResponse = {
  success: boolean;
  phase18Ready: boolean;
  config: {
    provider: string;
    availableProviders?: Array<{ key: string; mode: string; plan: string; executable: boolean }>;
    enabled: boolean;
    providerCallsEnabled?: boolean;
    dryRun: boolean;
    stagingEnabled: boolean;
    aiScoringEnabled: boolean;
    enrichWorkEmails?: boolean;
    maximumHunterEnrichmentsPerRun?: number;
    maximumCandidatesPerRun: number;
    maximumCandidatesPerDay: number;
    minimumFitScore: number;
  };
  readiness: {
    ready: boolean;
    blockers: string[];
    source?: { name: string; status: string; active: boolean } | null;
    campaign?: { name: string; status: string } | null;
  };
  runs: LeadAgentRun[];
  candidates: LeadCandidate[];
};

const statusCopy: Record<string, string> = {
  eligible: "Sesuai ICP",
  excluded: "Tidak sesuai",
  duplicate: "Duplikat",
  suppressed: "Diblokir",
  no_work_email: "Email kerja belum ada",
  company_review: "Tinjau perusahaan",
  staged: "Menunggu tinjauan",
};

function formatTime(value: string | null | undefined) {
  if (!value) return "Belum pernah dijalankan";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value));
}

export function LeadAgentPanel({ onAction, onOpenBatch }: { onAction: AdminAction; onOpenBatch?: () => void }) {
  const [data, setData] = useState<LeadAgentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await onAction("/api/admin/lead-agent") as LeadAgentResponse);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "AI Lead Agent belum dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }, [onAction]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const latestRun = data?.runs[0] || null;
  const selectedProvider = data?.config.provider || "apollo";
  const manualApolloMode = selectedProvider === "apollo" && (!data?.config.enabled || !data?.config.providerCallsEnabled);
  const latestCandidates = useMemo(() => latestRun
    ? (data?.candidates || []).filter((candidate) => candidate.discovery_run_id === latestRun.id).slice(0, 8)
    : [], [data, latestRun]);

  const runPreview = async () => {
    setRunning(true);
    setError("");
    try {
      await onAction("/api/admin/lead-agent", {
        method: "POST",
        body: JSON.stringify({ action: "run_preview", confirmation: "DISCOVERY_PREVIEW_ONLY" }),
      });
      await load();
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Pratinjau discovery gagal dijalankan.");
    } finally {
      setRunning(false);
    }
  };

  if (loading && !data) {
    return <div role="status" className="border border-slate-200 bg-white p-6 text-sm text-slate-500">Menyiapkan AI Lead Agent…</div>;
  }

  return (
    <section aria-labelledby="lead-agent-title" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div className="flex flex-col gap-5 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-3xl gap-3.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0B2C6B] text-[#E6BC66]"><Bot size={19} aria-hidden="true" /></div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="lead-agent-title" className="text-base font-semibold text-slate-950">Pencarian prospek</h2>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${manualApolloMode || data?.readiness.ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {manualApolloMode ? "Impor manual siap" : data?.readiness.ready ? "Pratinjau siap" : "Perlu disiapkan"}
              </span>
            </div>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">Temukan perusahaan dan pengambil keputusan yang sesuai sasaran. Semua hasil tetap masuk antrean tinjauan sebelum dipakai.</p>
          </div>
        </div>
        {manualApolloMode ? (
          <button type="button" onClick={onOpenBatch} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0B2C6B] px-4 text-xs font-semibold text-white transition hover:bg-[#071B3D]"><Upload size={15} /> Buka impor prospek</button>
        ) : (
          <button type="button" onClick={() => void runPreview()} disabled={!data?.readiness.ready || running} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0B2C6B] px-4 text-xs font-semibold text-white transition hover:bg-[#071B3D] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">
            {running ? <RefreshCw className="animate-spin" size={15} /> : <Play size={15} fill="currentColor" />}
            {running ? "Mencari kandidat…" : selectedProvider === "hunter" ? "Cari perusahaan" : "Jalankan pratinjau"}
          </button>
        )}
      </div>

      {error && <div role="alert" className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">{error}</div>}

      {!data?.phase18Ready ? (
        <div className="p-6 text-sm text-amber-800">Fondasi AI Lead Agent belum tersedia di environment ini.</div>
      ) : (
        <>
          {!data.readiness.ready && !manualApolloMode && (
            <div className="border-b border-amber-100 bg-amber-50/70 p-5">
              <p className="text-sm font-semibold text-amber-950">Pencarian belum dapat dijalankan</p>
              <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-800">{data.readiness.blockers.map((blocker) => <li key={blocker}>• {blocker}</li>)}</ul>
            </div>
          )}

          <div className="grid xl:grid-cols-[260px_1fr]">
            <div className="border-b border-slate-100 bg-slate-50/70 p-5 sm:p-6 xl:border-r xl:border-b-0">
              <p className="text-xs font-semibold text-slate-500">Hasil terakhir</p>
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm text-slate-600"><UserSearch size={15} /> Ditemukan</span><strong className="text-slate-950">{latestRun?.discovered_count || 0}</strong></div>
                <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm text-slate-600"><Building2 size={15} /> Tinjau perusahaan</span><strong className="text-slate-950">{latestRun?.company_review_count || 0}</strong></div>
                <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm text-slate-600"><Sparkles size={15} /> Sesuai ICP</span><strong className="text-slate-950">{latestRun?.eligible_count || 0}</strong></div>
                <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm text-slate-600"><ShieldCheck size={15} /> Di-stage</span><strong className="text-slate-950">{latestRun?.staged_count || 0}</strong></div>
              </div>
              <p className="mt-6 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">Hasil belum menjadi lead sampai admin menyetujuinya.</p>
            </div>
            <div className="min-w-0 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4"><h3 className="text-sm font-semibold text-slate-900">Kandidat terbaru</h3><span className="text-xs text-slate-400">{latestCandidates.length} ditampilkan</span></div>
              {latestCandidates.length ? (
                <div className="mt-4 divide-y divide-slate-100">
                  {latestCandidates.map((candidate) => (
                    <article key={candidate.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">{candidate.fit_score}</span>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{candidate.candidate_kind === "company" ? candidate.company : candidate.full_name}</p><p className="mt-1 truncate text-xs text-slate-500">{candidate.candidate_kind === "company" ? `Perusahaan · ${candidate.employee_range || "ukuran belum tersedia"}` : `${candidate.role_title || "Jabatan belum tersedia"} · ${candidate.company || "Perusahaan belum tersedia"}`}</p></div>
                      <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 sm:inline">{statusCopy[candidate.status] || candidate.status}</span>
                    </article>
                  ))}
                </div>
              ) : <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center text-sm text-slate-500">{manualApolloMode ? "Belum ada kandidat. Impor daftar prospek untuk memulai tinjauan." : "Belum ada kandidat. Jalankan pratinjau pertama setelah konfigurasi siap."}</div>}
            </div>
          </div>

          <details className="group border-t border-slate-100 px-5 py-4 sm:px-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-semibold text-slate-600 [&::-webkit-details-marker]:hidden">Lihat konfigurasi dan batas <ChevronDown size={15} className="transition group-open:rotate-180" /></summary>
            <div className="mt-4 grid gap-4 text-xs text-slate-500 sm:grid-cols-2 xl:grid-cols-4">
              <div><p className="font-semibold text-slate-700">Jalur aktif</p><p className="mt-1">{manualApolloMode ? "Apollo manual" : `${selectedProvider} API`} · {data.readiness.source?.name || "sumber belum dipilih"}</p></div>
              <div><p className="font-semibold text-slate-700">Mode</p><p className="mt-1">{data.config.dryRun || !data.config.stagingEnabled ? "Pratinjau aman" : "Masuk antrean tinjauan"}</p></div>
              <div><p className="font-semibold text-slate-700">Batas pencarian</p><p className="mt-1">{data.config.maximumCandidatesPerRun}/proses · {data.config.maximumCandidatesPerDay}/hari · skor ≥ {data.config.minimumFitScore}</p></div>
              <div><p className="font-semibold text-slate-700">Terakhir dijalankan</p><p className="mt-1">{formatTime(latestRun?.finished_at || latestRun?.started_at)}</p></div>
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">Apollo API tetap standby sampai paket Pro tersedia. Adapter alternatif tidak dijalankan dan tidak memerlukan konfigurasi saat ini.</p>
          </details>
        </>
      )}
    </section>
  );
}
