"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Expand,
  Eye,
  EyeOff,
  Maximize2,
  Medal,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Settings2,
  Square,
  UsersRound,
  X,
} from "lucide-react";
import Image from "next/image";
import styles from "./live-score-screen.module.css";
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

const PAGE_SIZE = 5;
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
  const missionsPerTeam = Math.max(1, Math.ceil(data.summary.totalMissionSlots / Math.max(data.summary.teamCount, 1)));

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo}><Image src="/full-logo.png" alt="BinaHub" width={150} height={42} preload /></span>
          <div className={styles.program}><strong>{data.program.title}</strong><span>{data.activeBatchName}</span></div>
        </div>
        <div className={styles.tools}>
          <span className={styles.status}><i className={data.session.status === "running" && !finished ? styles.running : ""} />{finished ? "Waktu habis" : statusLabel(data.session.status)}</span>
          <button onClick={() => void load()} aria-label="Perbarui sekarang"><RefreshCw size={18} /></button>
          <button onClick={() => void enterFullscreen()} aria-label="Layar penuh"><Maximize2 size={18} /></button>
          <button onClick={() => setControlsOpen(true)} aria-label="Buka kontrol layar"><Settings2 size={18} /><span>Kontrol</span></button>
        </div>
      </header>

      <section className={styles.heading} aria-labelledby="live-score-heading">
        <div className={styles.title}>
          <p>KLASEMEN TIM</p>
          <h1 id="live-score-heading">{data.session.title}</h1>
          <span>{data.session.scoresVisible ? "Setiap misi, satu langkah maju bersama." : "Skor disembunyikan oleh fasilitator."}</span>
        </div>
        <div className={styles.timer} data-urgent={urgent || finished}>
          <span>{finished ? "Waktu habis" : "Sisa waktu sesi"}</span>
          <strong>{formatCountdown(remainingSeconds)}</strong>
          <span>{finished ? "Terima kasih atas kerja sama tim." : statusLabel(data.session.status)}</span>
        </div>
      </section>

      <section className={styles.leaderboard} aria-label="Peringkat tim">
        <div className={styles.columns} aria-hidden="true">
          <span className={styles.rank}>#</span><span className={styles.team}>Tim</span><span className={styles.progress}>Misi dinilai</span><span className={styles.score}>Skor / 5</span>
        </div>
        <ol className={styles.rows}>
          {pageTeams.map((team) => {
            const movement = rankMovement[team.teamId] || 0;
            const leader = data.session.scoresVisible && team.rank === 1;
            return (
              <li key={team.teamId} className={styles.row} data-leader={leader}>
                <span className={styles.rank}>{data.session.scoresVisible ? team.rank || "—" : <UsersRound size={22} />}</span>
                <div className={styles.team}>
                  <h2>{team.teamName}</h2>
                  <p>{team.batch}{team.strongestDimension && data.session.scoresVisible ? ` · ${team.strongestDimension}` : ""}</p>
                </div>
                <div className={styles.progress}>
                  <span><strong>{team.completedMissions}</strong> / {missionsPerTeam}</span>
                  <div className={styles.track} role="img" aria-label={`${team.completedMissions} dari ${missionsPerTeam} misi dinilai`}><i style={{ width: `${Math.min(100, team.completedMissions / missionsPerTeam * 100)}%` }} /></div>
                </div>
                <div className={styles.score}>
                  <strong>{data.session.scoresVisible && team.score !== null ? team.score.toFixed(1) : "—"}</strong>
                  {movement !== 0 && data.session.scoresVisible ? <span className={styles.movement} data-up={movement > 0} aria-label={`${movement > 0 ? "Naik" : "Turun"} ${Math.abs(movement)} peringkat`}>{movement > 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}{Math.abs(movement)}</span> : <span>{data.session.scoresVisible ? team.score === null ? "Belum dinilai" : "poin" : "Tersembunyi"}</span>}
                </div>
              </li>
            );
          })}
        </ol>
        {!pageTeams.length && <div className={styles.empty}><UsersRound size={32} /><h2>Belum ada tim</h2><p>Pilih batch melalui kontrol layar.</p></div>}
      </section>

      <footer className={styles.footer}>
        <div><strong>{data.summary.scoredTeamCount}/{data.summary.teamCount} tim berskor</strong><span>{data.summary.coverageAligned ? "Cakupan penilaian seimbang" : "Peringkat sementara · cakupan misi belum setara"}</span></div>
        <p>{data.session.encouragementMessage}</p>
        {pageCount > 1 && <div className={styles.pagination}><button onClick={() => setPageIndex((visiblePageIndex - 1 + pageCount) % pageCount)} aria-label="Halaman tim sebelumnya"><ChevronLeft size={18} /></button><span>{visiblePageIndex + 1} / {pageCount}</span><button onClick={() => setPageIndex((visiblePageIndex + 1) % pageCount)} aria-label="Halaman tim berikutnya"><ChevronRight size={18} /></button></div>}
      </footer>

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
