"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Expand,
  Eye,
  EyeOff,
  Gauge,
  Maximize2,
  Medal,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Settings2,
  Square,
  Trophy,
  UsersRound,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { formatCountdown } from "./live-score-format";

type LiveTeam = {
  teamId: string;
  teamName: string;
  batch: string;
  score: number | null;
  completedMissions: number;
  strongestDimension: string | null;
  lastScoredAt: string | null;
  rank: number | null;
};

type LiveScoreResponse = {
  success: boolean;
  liveScoreReady: boolean;
  serverTime: string;
  program: { id: string; title: string };
  batches: Array<{ id: string; name: string; sort_order: number }>;
  activeBatchId: string | null;
  activeBatchName: string;
  session: {
    configured: boolean;
    id: string | null;
    title: string;
    encouragementMessage: string;
    status: "ready" | "running" | "paused" | "finished";
    durationSeconds: number;
    remainingSeconds: number;
    endsAt: string | null;
    scoresVisible: boolean;
    updatedAt: string | null;
  };
  summary: {
    teamCount: number;
    scoredTeamCount: number;
    completedMissionSlots: number;
    totalMissionSlots: number;
    completionPercent: number;
    coverageAligned: boolean;
    rankingStatus: "comparable" | "provisional";
  };
  leaderboard: LiveTeam[];
};

type SetupForm = {
  title: string;
  encouragementMessage: string;
  durationMinutes: number;
  batchId: string;
  scoresVisible: boolean;
};

const PAGE_SIZE = 8;
const emptySetup: SetupForm = {
  title: "T-BOS Live Score",
  encouragementMessage: "Tetap kompak. Setiap misi adalah kesempatan untuk naik bersama.",
  durationMinutes: 20,
  batchId: "",
  scoresVisible: true,
};

function statusLabel(status: LiveScoreResponse["session"]["status"]) {
  if (status === "running") return "Sedang berjalan";
  if (status === "paused") return "Dijeda";
  if (status === "finished") return "Waktu habis";
  return "Siap dimulai";
}

export function TbosLiveScoreScreen({ programId, initialBatchId }: { programId: string; initialBatchId: string }) {
  const [data, setData] = useState<LiveScoreResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [setup, setSetup] = useState<SetupForm>(emptySetup);
  const [setupInitialized, setSetupInitialized] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [rankMovement, setRankMovement] = useState<Record<string, number>>({});
  const loadingRef = useRef(false);
  const previousRanksRef = useRef<Record<string, number>>({});

  const load = useCallback(async (quiet = false) => {
    if (!programId || loadingRef.current) return;
    loadingRef.current = true;
    if (!quiet) setLoading(true);
    try {
      const params = new URLSearchParams({ programId });
      if (initialBatchId) params.set("batchId", initialBatchId);
      const response = await apiFetch(`/api/tbos/live-score?${params}`, { cache: "no-store" });
      const result = await response.json().catch(() => ({})) as Partial<LiveScoreResponse> & { error?: string };
      if (!response.ok || !result.success) throw new Error(result.error || "Live score belum dapat dimuat.");
      if (!result.liveScoreReady) throw new Error("Terapkan migrasi 0051 agar Live Score dapat digunakan.");
      const next = result as LiveScoreResponse;
      const movements: Record<string, number> = {};
      for (const team of next.leaderboard) {
        const before = previousRanksRef.current[team.teamId];
        if (before && team.rank) movements[team.teamId] = before - team.rank;
      }
      previousRanksRef.current = Object.fromEntries(next.leaderboard.filter((team) => team.rank).map((team) => [team.teamId, team.rank as number]));
      setRankMovement(movements);
      setData(next);
      setServerOffsetMs(Date.parse(next.serverTime) - Date.now());
      setRemainingSeconds(next.session.remainingSeconds);
      setError("");
      if (!setupInitialized) {
        setSetup({
          title: next.session.title,
          encouragementMessage: next.session.encouragementMessage,
          durationMinutes: Math.max(1, Math.round(next.session.durationSeconds / 60)),
          batchId: next.activeBatchId || initialBatchId,
          scoresVisible: next.session.scoresVisible,
        });
        setControlsOpen(!next.session.configured);
        setSetupInitialized(true);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Live score belum dapat dimuat.");
    } finally {
      loadingRef.current = false;
      if (!quiet) setLoading(false);
    }
  }, [initialBatchId, programId, setupInitialized]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => { void load(); });
    return () => window.cancelAnimationFrame(frame);
  }, [load]);
  useEffect(() => {
    const refresh = window.setInterval(() => { void load(true); }, 5_000);
    return () => window.clearInterval(refresh);
  }, [load]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (data?.session.status === "running" && data.session.endsAt) {
        setRemainingSeconds(Math.max(0, Math.ceil((Date.parse(data.session.endsAt) - (Date.now() + serverOffsetMs)) / 1000)));
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [data?.session.endsAt, data?.session.status, serverOffsetMs]);

  const displayedTeams = useMemo(() => {
    if (!data) return [];
    return data.session.scoresVisible ? data.leaderboard : [...data.leaderboard].sort((left, right) => left.teamName.localeCompare(right.teamName, "id"));
  }, [data]);
  const pageCount = Math.max(1, Math.ceil(displayedTeams.length / PAGE_SIZE));
  const visiblePageIndex = Math.min(pageIndex, pageCount - 1);
  const pageTeams = displayedTeams.slice(visiblePageIndex * PAGE_SIZE, (visiblePageIndex + 1) * PAGE_SIZE);
  useEffect(() => {
    if (pageCount <= 1) return;
    const rotation = window.setInterval(() => setPageIndex((current) => (current + 1) % pageCount), 10_000);
    return () => window.clearInterval(rotation);
  }, [pageCount]);

  const sendAction = useCallback(async (payload: Record<string, unknown>) => {
    setSaving(true);
    try {
      const response = await apiFetch("/api/tbos/live-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, programId }),
      });
      const result = await response.json().catch(() => ({})) as { success?: boolean; error?: string };
      if (!response.ok || !result.success) throw new Error(result.error || "Kontrol live score gagal disimpan.");
      if (payload.action === "set_scores_visible" && typeof payload.scoresVisible === "boolean") {
        setSetup((current) => ({ ...current, scoresVisible: payload.scoresVisible as boolean }));
      }
      await load(true);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Kontrol live score gagal disimpan.");
    } finally { setSaving(false); }
  }, [load, programId]);

  const saveSetup = async () => {
    await sendAction({
      action: "configure",
      batchId: setup.batchId || null,
      title: setup.title,
      encouragementMessage: setup.encouragementMessage,
      durationMinutes: Number(setup.durationMinutes),
      scoresVisible: setup.scoresVisible,
    });
  };

  const enterFullscreen = async () => {
    try { await document.documentElement.requestFullscreen(); setControlsOpen(false); }
    catch { setError("Browser menolak mode layar penuh. Gunakan tombol full-screen pada browser."); }
  };

  if (!programId) return <FatalState message="Program belum dipilih. Buka Live Score dari Dashboard T-BOS." />;
  if (loading && !data) return <LoadingState />;
  if (!data) return <FatalState message={error || "Live score belum dapat dimuat."} />;

  const urgent = data.session.status === "running" && remainingSeconds <= 60;
  const finished = remainingSeconds === 0 && ["running", "finished"].includes(data.session.status);
  const leadingTeam = data.leaderboard.find((team) => team.score !== null);

  return (
    <main className="relative h-[100dvh] min-h-[640px] overflow-hidden bg-[#06152F] text-white selection:bg-[#F3CE7A]/40">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -right-[12rem] -top-[16rem] h-[38rem] w-[38rem] rounded-full bg-[#1D4F9D]/30 blur-[100px]" />
        <div className="absolute -bottom-[16rem] -left-[10rem] h-[34rem] w-[34rem] rounded-full bg-[#D9A441]/15 blur-[110px]" />
        <div className="absolute inset-0 opacity-[0.045]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)", backgroundSize: "64px 64px" }} />
      </div>

      <div className="relative z-10 flex h-full flex-col px-[clamp(1.25rem,2.5vw,3.5rem)] py-[clamp(1rem,2vw,2.25rem)]">
        <header className="flex shrink-0 items-center justify-between gap-5 border-b border-white/10 pb-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-xl font-black text-[#0B2C6B] shadow-lg shadow-black/20">b</div>
            <div className="min-w-0">
              <div className="flex items-center gap-2"><span className="text-xl font-black tracking-tight">BinaHub</span><span className="hidden h-1 w-1 rounded-full bg-[#F3CE7A] sm:block" /><span className="hidden text-xs font-bold uppercase tracking-[0.22em] text-[#F3CE7A] sm:block">Team Behavior OS</span></div>
              <p className="truncate text-sm text-blue-100/60">{data.program.title} · {data.activeBatchName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`hidden items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] md:inline-flex ${data.session.status === "running" ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-white/[0.06] text-blue-100/70"}`}><span className={`h-2 w-2 rounded-full ${data.session.status === "running" ? "animate-pulse bg-emerald-300" : "bg-white/30"}`} />{statusLabel(data.session.status)}</span>
            <button type="button" onClick={() => void load()} aria-label="Perbarui sekarang" className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-blue-100/80 transition hover:bg-white/10"><RefreshCw className="h-4 w-4" /></button>
            <button type="button" onClick={() => void enterFullscreen()} aria-label="Layar penuh" className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-blue-100/80 transition hover:bg-white/10"><Maximize2 className="h-4 w-4" /></button>
            <button type="button" onClick={() => setControlsOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#F3CE7A] px-4 text-xs font-black text-[#071B3D] shadow-lg shadow-black/20 transition hover:bg-[#FFD989]"><Settings2 className="h-4 w-4" /> Kontrol</button>
          </div>
        </header>

        <section className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-5 py-[clamp(.8rem,1.8vh,1.5rem)]" aria-labelledby="live-score-heading">
          <div className="min-w-0">
            <div className="flex items-center gap-3"><Trophy className="h-5 w-5 text-[#F3CE7A]" /><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F3CE7A]">Peringkat langsung</p></div>
            <h1 id="live-score-heading" className="mt-1 truncate text-[clamp(1.65rem,3.2vw,3.5rem)] font-black leading-tight tracking-[-0.045em]">{data.session.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-blue-100/65">
              <span>{data.summary.scoredTeamCount}/{data.summary.teamCount} tim sudah berskor</span>
              <span>{data.summary.completionPercent}% observasi misi selesai</span>
              <span className={data.summary.coverageAligned ? "text-emerald-300" : "text-amber-200"}>{data.summary.coverageAligned ? "Cakupan penilaian seimbang" : "Peringkat masih sementara"}</span>
            </div>
          </div>
          <div className={`min-w-[clamp(12rem,22vw,24rem)] rounded-[2rem] border px-[clamp(1.2rem,2vw,2.25rem)] py-3 text-center shadow-2xl transition ${urgent || finished ? "border-rose-300/30 bg-rose-400/10 shadow-rose-950/30" : "border-white/10 bg-white/[0.07] shadow-black/20"}`}>
            <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-blue-100/55"><Clock3 className="h-3.5 w-3.5" /> {finished ? "Waktu habis" : "Sisa waktu"}</div>
            <div className={`mt-1 font-mono text-[clamp(2.6rem,6vw,6.2rem)] font-black leading-none tabular-nums tracking-[-0.06em] ${urgent || finished ? "text-rose-200" : "text-white"}`}>{formatCountdown(remainingSeconds)}</div>
          </div>
        </section>

        <section className="min-h-0 flex-1" aria-label="Peringkat tim">
          {pageTeams.length ? (
            <div className="grid h-full auto-rows-fr grid-cols-1 gap-[clamp(.45rem,1vh,.85rem)] md:grid-cols-2">
              {pageTeams.map((team, localIndex) => {
                const movement = rankMovement[team.teamId] || 0;
                const globalIndex = visiblePageIndex * PAGE_SIZE + localIndex;
                const isLastScored = data.session.scoresVisible && team.score !== null && globalIndex === data.leaderboard.filter((item) => item.score !== null).length - 1;
                return (
                  <article key={team.teamId} className={`group grid min-h-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[clamp(.75rem,1.25vw,1.25rem)] overflow-hidden rounded-[clamp(1rem,1.5vw,1.5rem)] border px-[clamp(.9rem,1.4vw,1.5rem)] py-2 shadow-lg transition-all duration-500 ${team.rank === 1 && data.session.scoresVisible ? "border-[#F3CE7A]/45 bg-gradient-to-r from-[#D9A441]/20 to-white/[0.06]" : isLastScored ? "border-sky-300/20 bg-sky-300/[0.06]" : "border-white/10 bg-white/[0.055]"}`}>
                    <div className={`grid h-[clamp(2.6rem,4vw,4.25rem)] w-[clamp(2.6rem,4vw,4.25rem)] place-items-center rounded-2xl text-[clamp(1rem,1.6vw,1.5rem)] font-black ${team.rank === 1 && data.session.scoresVisible ? "bg-[#F3CE7A] text-[#071B3D]" : team.rank && team.rank <= 3 && data.session.scoresVisible ? "bg-white/15 text-white" : "bg-white/[0.07] text-blue-100/70"}`}>
                      {data.session.scoresVisible ? team.rank || "–" : <UsersRound className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2"><h2 className="truncate text-[clamp(1rem,1.65vw,1.55rem)] font-black tracking-[-0.025em]">{team.teamName}</h2>{movement !== 0 && data.session.scoresVisible && <span className={`inline-flex shrink-0 items-center text-xs font-bold ${movement > 0 ? "text-emerald-300" : "text-rose-200"}`}>{movement > 0 ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}{Math.abs(movement)}</span>}</div>
                      <div className="mt-1 flex items-center gap-3 text-[clamp(.65rem,.8vw,.8rem)] text-blue-100/55"><span className="truncate">{team.batch}</span><span>{team.completedMissions} misi dinilai</span>{team.strongestDimension && data.session.scoresVisible && <span className="hidden truncate xl:block">Kuat: {team.strongestDimension}</span>}</div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-gradient-to-r from-[#D9A441] to-[#F3CE7A] transition-all duration-700" style={{ width: `${data.session.scoresVisible && team.score !== null ? Math.max(3, (team.score / 5) * 100) : 0}%` }} /></div>
                    </div>
                    <div className="min-w-[5rem] text-right">
                      <p className="text-[clamp(1.6rem,3vw,3.25rem)] font-black leading-none tabular-nums tracking-[-0.055em] text-[#F3CE7A]">{data.session.scoresVisible && team.score !== null ? team.score.toFixed(1) : "—"}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-100/35">{data.session.scoresVisible ? "dari 5" : "disembunyikan"}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : <div className="grid h-full place-items-center rounded-[2rem] border border-dashed border-white/15 bg-white/[0.03] text-center"><div><UsersRound className="mx-auto h-12 w-12 text-blue-100/25" /><p className="mt-3 text-lg font-bold">Belum ada tim dalam layar ini</p><p className="mt-1 text-sm text-blue-100/50">Pilih batch lain atau tambahkan tim dari Dashboard T-BOS.</p></div></div>}
        </section>

        <footer className="flex shrink-0 items-center justify-between gap-4 pt-3 text-xs text-blue-100/55">
          <p className="truncate"><span className="font-bold text-[#F3CE7A]">Semangat bersama:</span> {data.session.encouragementMessage}</p>
          <div className="flex shrink-0 items-center gap-3">
            {leadingTeam && data.session.scoresVisible && <span className="hidden lg:inline">Pemimpin: <strong className="text-white">{leadingTeam.teamName}</strong></span>}
            {pageCount > 1 && <div className="flex items-center gap-1"><button type="button" onClick={() => setPageIndex((visiblePageIndex - 1 + pageCount) % pageCount)} className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.07]" aria-label="Halaman tim sebelumnya"><ChevronLeft className="h-4 w-4" /></button><span className="px-2 tabular-nums">{visiblePageIndex + 1}/{pageCount}</span><button type="button" onClick={() => setPageIndex((visiblePageIndex + 1) % pageCount)} className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.07]" aria-label="Halaman tim berikutnya"><ChevronRight className="h-4 w-4" /></button></div>}
            <span className="hidden items-center gap-1.5 md:inline-flex"><Gauge className="h-3.5 w-3.5" /> Auto-refresh 5 detik</span>
          </div>
        </footer>
      </div>

      {error && <div role="alert" className="fixed bottom-5 left-1/2 z-50 flex max-w-xl -translate-x-1/2 items-center gap-3 rounded-2xl border border-rose-200/30 bg-[#2A1322]/95 px-5 py-3 text-sm text-rose-100 shadow-2xl backdrop-blur-xl"><span className="flex-1">{error}</span><button type="button" onClick={() => setError("")} aria-label="Tutup pesan"><X className="h-4 w-4" /></button></div>}

      {controlsOpen && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/35 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) setControlsOpen(false); }}>
          <aside role="dialog" aria-modal="true" aria-labelledby="live-control-title" className="h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#F7F8FA] p-6 text-slate-900 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">Khusus admin</p><h2 id="live-control-title" className="mt-1 text-2xl font-black tracking-tight text-[#0B2C6B]">Kontrol layar</h2><p className="mt-1 text-xs leading-5 text-slate-500">Pengaturan tersimpan di server dan tetap sama setelah refresh.</p></div><button type="button" onClick={() => setControlsOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white" aria-label="Tutup kontrol"><X className="h-4 w-4" /></button></div>

            <div className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <label className="block text-xs font-bold text-slate-600">Judul layar<input value={setup.title} maxLength={80} onChange={(event) => setSetup((current) => ({ ...current, title: event.target.value }))} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-amber-500" /></label>
              <label className="block text-xs font-bold text-slate-600">Batch<select value={setup.batchId} onChange={(event) => setSetup((current) => ({ ...current, batchId: event.target.value }))} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-amber-500"><option value="">Semua batch</option>{data.batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</select></label>
              <label className="block text-xs font-bold text-slate-600">Durasi (menit)<input type="number" min={1} max={240} value={setup.durationMinutes} onChange={(event) => setSetup((current) => ({ ...current, durationMinutes: Number(event.target.value) }))} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-amber-500" /></label>
              <label className="block text-xs font-bold text-slate-600">Pesan penyemangat<textarea value={setup.encouragementMessage} maxLength={180} rows={3} onChange={(event) => setSetup((current) => ({ ...current, encouragementMessage: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-5 outline-none focus:border-amber-500" /></label>
              <label className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-3 py-3 text-sm font-semibold text-[#0B2C6B]"><span>Tampilkan skor saat dimulai</span><input type="checkbox" checked={setup.scoresVisible} onChange={(event) => setSetup((current) => ({ ...current, scoresVisible: event.target.checked }))} className="h-5 w-5 accent-[#0B2C6B]" /></label>
              <button type="button" disabled={saving || data.session.status === "running" || setup.title.trim().length < 3 || setup.encouragementMessage.trim().length < 3 || setup.durationMinutes < 1 || setup.durationMinutes > 240} onClick={() => void saveSetup()} className="min-h-11 w-full rounded-xl bg-[#0B2C6B] px-4 text-sm font-bold text-white disabled:opacity-40">Simpan konfigurasi</button>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Countdown</p><p className="mt-1 text-3xl font-black tabular-nums text-[#0B2C6B]">{formatCountdown(remainingSeconds)}</p></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">{statusLabel(data.session.status)}</span></div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" disabled={saving || !data.session.configured || data.session.status === "running"} onClick={() => void sendAction({ action: "start" })} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white disabled:opacity-40"><Play className="h-4 w-4" /> Mulai/Lanjut</button>
                <button type="button" disabled={saving || data.session.status !== "running"} onClick={() => void sendAction({ action: "pause" })} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-[#0B2C6B] disabled:opacity-40"><Pause className="h-4 w-4" /> Jeda</button>
                <button type="button" disabled={saving || !data.session.configured} onClick={() => void sendAction({ action: "reset" })} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-[#0B2C6B] disabled:opacity-40"><RotateCcw className="h-4 w-4" /> Reset</button>
                <button type="button" disabled={saving || !data.session.configured} onClick={() => void sendAction({ action: "finish" })} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 text-sm font-bold text-rose-700 disabled:opacity-40"><Square className="h-4 w-4" /> Akhiri</button>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              <button type="button" disabled={saving || !data.session.configured} onClick={() => void sendAction({ action: "set_scores_visible", scoresVisible: !data.session.scoresVisible })} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-[#0B2C6B] disabled:opacity-40">{data.session.scoresVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{data.session.scoresVisible ? "Sembunyikan skor" : "Tampilkan skor"}</button>
              <button type="button" onClick={() => void enterFullscreen()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-[#0B2C6B]"><Expand className="h-4 w-4" /> Masuk layar penuh</button>
              <a href="/admin/tbos" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold text-slate-500"><ArrowLeft className="h-4 w-4" /> Kembali ke Dashboard T-BOS</a>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}

function LoadingState() {
  return <main className="grid h-[100dvh] place-items-center bg-[#06152F] text-white"><div className="text-center"><RefreshCw className="mx-auto h-8 w-8 animate-spin text-[#F3CE7A]" /><p className="mt-4 text-sm text-blue-100/70">Menyiapkan layar Live Score…</p></div></main>;
}

function FatalState({ message }: { message: string }) {
  return <main className="grid h-[100dvh] place-items-center bg-[#06152F] p-6 text-white"><div className="max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-8 text-center"><Medal className="mx-auto h-10 w-10 text-[#F3CE7A]" /><h1 className="mt-4 text-2xl font-black">Live Score belum siap</h1><p className="mt-2 text-sm leading-6 text-blue-100/65">{message}</p><a href="/admin/tbos" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#F3CE7A] px-5 text-sm font-black text-[#071B3D]"><ArrowLeft className="h-4 w-4" /> Kembali</a></div></main>;
}
