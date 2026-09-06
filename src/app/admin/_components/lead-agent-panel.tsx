"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bot, Building2, CheckCircle2, Cloud, Play, RefreshCw, ShieldCheck, Sparkles, Upload, UserSearch } from "lucide-react";

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

export function LeadAgentPanel({ onAction }: { onAction: AdminAction }) {
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
    <section aria-labelledby="lead-agent-title" className="overflow-hidden border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-6 border-b border-slate-200 bg-[#071F4A] p-6 text-white lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-amber-400 text-[#071F4A]"><Bot size={23} aria-hidden="true" /></div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">Lead Discovery</p>
              <span className={`px-2 py-1 text-[10px] font-bold uppercase ${manualApolloMode || data?.readiness.ready ? "bg-emerald-400/20 text-emerald-200" : "bg-white/10 text-slate-200"}`}>
                {manualApolloMode ? "Apollo manual aktif" : data?.readiness.ready ? "Otomasi siap" : "Perlu konfigurasi"}
              </span>
            </div>
            <h2 id="lead-agent-title" className="mt-2 text-xl font-semibold">Temukan perusahaan dan pengambil keputusan yang sesuai ICP</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">Gunakan ekspor Apollo Free dan unggah CSV sekarang. Saat Apollo API Pro tersedia, otomasi dapat diaktifkan tanpa mengganti alur validasi, suppression, dan tinjauan manusia.</p>
          </div>
        </div>
        {manualApolloMode ? (
          <a href="#batch-prospek" className="inline-flex h-11 items-center justify-center gap-2 bg-amber-400 px-5 text-sm font-bold text-[#071F4A] transition hover:bg-amber-300"><Upload size={16} /> Impor Apollo CSV</a>
        ) : (
          <button type="button" onClick={() => void runPreview()} disabled={!data?.readiness.ready || running} className="inline-flex h-11 items-center justify-center gap-2 bg-amber-400 px-5 text-sm font-bold text-[#071F4A] transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300">
            {running ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} fill="currentColor" />}
            {running ? "Mencari kandidat…" : selectedProvider === "hunter" ? "Cari perusahaan" : "Jalankan pratinjau"}
          </button>
        )}
      </div>

      {error && <div role="alert" className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">{error}</div>}

      {!data?.phase18Ready ? (
        <div className="p-6 text-sm text-amber-800">Fondasi AI Lead Agent belum tersedia di environment ini.</div>
      ) : (
        <>
          <div className="grid border-b border-slate-200 lg:grid-cols-3">
            <div className="border-b border-slate-200 bg-emerald-50 p-5 lg:border-r lg:border-b-0">
              <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-sm font-bold text-slate-950"><Upload size={16} className="text-emerald-700" /> Apollo Manual</span><span className="bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase text-emerald-800">Digunakan sekarang</span></div>
              <p className="mt-3 text-xs leading-5 text-slate-600">Ekspor prospek dari Apollo Free, lalu unggah CSV/JSON ke Batch Prospek. Tidak memerlukan API key dan tidak menjalankan outbound.</p>
              <a href="#batch-prospek" className="mt-3 inline-flex text-xs font-bold text-[#0B2C6B] underline-offset-4 hover:underline">Buka Batch Prospek</a>
            </div>
            <div className={`p-5 ${selectedProvider === "apollo" ? "bg-blue-50" : "bg-white"} border-b border-slate-200 lg:border-r lg:border-b-0`}>
              <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-sm font-bold text-slate-950"><Sparkles size={16} className="text-[#0B2C6B]" /> Apollo API</span><span className="bg-blue-100 px-2 py-1 text-[10px] font-bold uppercase text-[#0B2C6B]">Siap saat Pro</span></div>
              <p className="mt-3 text-xs leading-5 text-slate-600">People Search dan enrichment sudah disiapkan. Nanti cukup pasang API key dan membuka switch yang saat ini tetap terkunci.</p>
              <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">{manualApolloMode ? "API dinonaktifkan" : selectedProvider === "apollo" ? "Provider aktif" : "Standby"}</p>
            </div>
            <div className="bg-white p-5">
              <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-sm font-bold text-slate-950"><Cloud size={16} className="text-slate-500" /> Hunter</span><span className="bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-600">Ditunda</span></div>
              <p className="mt-3 text-xs leading-5 text-slate-600">Adapter tetap tersedia sebagai alternatif, tetapi tidak perlu akun, API key, source, campaign, atau konfigurasi Hunter sekarang.</p>
              <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Tidak digunakan</p>
            </div>
          </div>
          <div className="grid border-b border-slate-200 sm:grid-cols-2 xl:grid-cols-4">
            <div className="border-b border-slate-200 p-5 sm:border-r xl:border-b-0"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Jalur aktif</p><p className="mt-2 text-sm font-semibold text-slate-900">{manualApolloMode ? "Apollo Manual" : `${selectedProvider} API`} · {data.readiness.source?.name || "sumber belum dipilih"}</p></div>
            <div className="border-b border-slate-200 p-5 xl:border-b-0 xl:border-r"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Mode</p><p className="mt-2 text-sm font-semibold text-slate-900">{data.config.dryRun || !data.config.stagingEnabled ? "Pratinjau aman" : "Stage ke tinjauan"}</p></div>
            <div className="border-b border-slate-200 p-5 sm:border-r sm:border-b-0"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Batas pencarian</p><p className="mt-2 text-sm font-semibold text-slate-900">{data.config.maximumCandidatesPerRun}/run · {data.config.maximumCandidatesPerDay}/hari · skor ≥ {data.config.minimumFitScore}</p></div>
            <div className="p-5"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Run terakhir</p><p className="mt-2 text-sm font-semibold text-slate-900">{formatTime(latestRun?.finished_at || latestRun?.started_at)}</p></div>
          </div>

          {!data.readiness.ready && !manualApolloMode && (
            <div className="border-b border-amber-200 bg-amber-50 p-5">
              <p className="text-sm font-semibold text-amber-950">Konfigurasi belum lengkap</p>
              <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-800">{data.readiness.blockers.map((blocker) => <li key={blocker}>• {blocker}</li>)}</ul>
            </div>
          )}

          <div className="grid gap-0 xl:grid-cols-[280px_1fr]">
            <div className="border-b border-slate-200 bg-slate-50 p-6 xl:border-r xl:border-b-0">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Ringkasan terakhir</p>
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm text-slate-600"><UserSearch size={15} /> Ditemukan</span><strong className="text-slate-950">{latestRun?.discovered_count || 0}</strong></div>
                <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm text-slate-600"><Building2 size={15} /> Tinjau perusahaan</span><strong className="text-slate-950">{latestRun?.company_review_count || 0}</strong></div>
                <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm text-slate-600"><Sparkles size={15} /> Sesuai ICP</span><strong className="text-slate-950">{latestRun?.eligible_count || 0}</strong></div>
                <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm text-slate-600"><ShieldCheck size={15} /> Di-stage</span><strong className="text-slate-950">{latestRun?.staged_count || 0}</strong></div>
              </div>
              <p className="mt-6 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500"><CheckCircle2 className="mr-1 inline h-3.5 w-3.5 text-emerald-600" /> Batch yang di-stage tetap harus ditinjau dan disetujui manusia sebelum diproses.</p>
            </div>
            <div className="min-w-0 p-6">
              <div className="flex items-center justify-between gap-4"><h3 className="text-sm font-bold text-[#0B2C6B]">Kandidat terbaru</h3><span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{latestCandidates.length} ditampilkan</span></div>
              {latestCandidates.length ? (
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {latestCandidates.map((candidate) => (
                    <article key={candidate.id} className="border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-950">{candidate.candidate_kind === "company" ? candidate.company : candidate.full_name}</p><p className="mt-1 truncate text-xs text-slate-500">{candidate.candidate_kind === "company" ? `Perusahaan · ${candidate.employee_range || "ukuran belum tersedia"}` : candidate.role_title || "Jabatan belum tersedia"}</p></div><span className="bg-blue-50 px-2 py-1 text-xs font-bold text-[#0B2C6B]">{candidate.fit_score}</span></div>
                      <p className="mt-3 flex items-center gap-2 truncate text-xs font-medium text-slate-700"><Building2 size={13} className="shrink-0 text-slate-400" /> {candidate.company || "Perusahaan belum tersedia"}</p>
                      <div className="mt-3 flex flex-wrap gap-2"><span className="bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-600">{statusCopy[candidate.status] || candidate.status}</span>{candidate.location && <span className="bg-slate-50 px-2 py-1 text-[10px] text-slate-500">{candidate.location}</span>}</div>
                    </article>
                  ))}
                </div>
              ) : <div className="mt-4 border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">{manualApolloMode ? "Mode Apollo Manual aktif. Kandidat yang diunggah akan muncul di Batch Prospek untuk ditinjau." : "Belum ada kandidat. Lengkapi konfigurasi lalu jalankan pratinjau pertama."}</div>}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
