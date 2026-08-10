"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ClipboardCheck,
  Loader2,
  Medal,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Target,
  UsersRound,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { FacilitatorAuthGate } from "@/components/facilitator-auth-gate";
import { TbosProgramSelector } from "@/components/tbos-program-selector";
import { StatCard } from "@/components/ui";
import { fetchDashboardRawData } from "@/modules/tbos/api-client";
import { formatScore, generateDashboardData } from "@/modules/tbos/scoring";
import type { DimensionScore, TbosDashboardData, TeamScoreSummary } from "@/modules/tbos/types";

export default function TbosResultsPage() {
  return (
    <FacilitatorAuthGate>
      <AppShell
        role="facilitator"
        navigation="tbos"
        title="Hasil & Statistik T-BOS"
        eyebrow="Team Behavioral Observation System"
      >
        <TbosResultsContent />
      </AppShell>
    </FacilitatorAuthGate>
  );
}

function TbosResultsContent() {
  const [data, setData] = useState<TbosDashboardData | null>(null);
  const [ownObservationCount, setOwnObservationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState("");

  const loadResults = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchDashboardRawData(selectedProgramId);
      setOwnObservationCount(result.viewerStats?.ownObservationCount ?? 0);
      setData(generateDashboardData(result.teams, result.observations));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat hasil T-BOS.");
    } finally {
      setLoading(false);
    }
  }, [selectedProgramId]);

  useEffect(() => {
    void Promise.resolve().then(loadResults);
  }, [loadResults]);

  if (loading) return <ResultsLoading />;

  if (error) {
    return (
      <section className="mx-auto max-w-xl rounded-md border border-red-200 bg-white p-6 text-center shadow-[0_20px_50px_-32px_rgba(127,29,29,0.45)]" aria-labelledby="results-error-title">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-700">
          <AlertCircle aria-hidden="true" />
        </span>
        <h2 id="results-error-title" className="mt-4 text-lg font-bold text-[#0B2C6B]">Hasil belum dapat dimuat</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600" role="alert">{error}</p>
        <button type="button" onClick={() => void loadResults()} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0B2C6B] px-5 text-sm font-semibold text-white transition hover:bg-[#071B3D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2C6B]">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Coba lagi
        </button>
      </section>
    );
  }

  if (!data || data.teams.length === 0) {
    return (
      <section className="relative overflow-hidden rounded-md border border-[#0B2C6B]/10 bg-white p-7 text-center shadow-[0_24px_70px_-42px_rgba(11,44,107,0.5)] sm:p-10" aria-labelledby="empty-results-title">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0B2C6B] via-[#D9A441] to-[#0B2C6B]" />
        <UsersRound className="mx-auto h-12 w-12 text-[#0B2C6B]/35" aria-hidden="true" />
        <h2 id="empty-results-title" className="mt-4 text-xl font-bold text-[#0B2C6B]">Belum ada hasil dalam cakupan Anda</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Ringkasan akan tersedia setelah tim dalam penugasan Anda memiliki observasi T-BOS yang dikirim.</p>
      </section>
    );
  }

  const rankedTeams = [...data.teams].sort((a, b) => (b.overallTeamScore ?? -1) - (a.overallTeamScore ?? -1));
  const scoredTeams = data.teams.filter((team) => team.overallTeamScore !== null);
  const averageScore = scoredTeams.length
    ? scoredTeams.reduce((total, team) => total + (team.overallTeamScore ?? 0), 0) / scoredTeams.length
    : null;

  return (
    <div className="space-y-5 sm:space-y-6">
      <TbosProgramSelector value={selectedProgramId} onChange={setSelectedProgramId} />
      <section className="relative isolate overflow-hidden rounded-[1.75rem] bg-[#071B3D] px-5 py-6 text-white shadow-[0_28px_70px_-35px_rgba(7,27,61,0.9)] sm:px-8 sm:py-8" aria-labelledby="results-overview-title">
        <div className="absolute -right-16 -top-20 -z-10 h-64 w-64 rounded-full bg-[#D9A441]/15 blur-3xl" />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#F3CE7A]">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Cakupan fasilitator
            </div>
            <h2 id="results-overview-title" className="mt-4 text-2xl font-bold tracking-[-0.03em] sm:text-3xl">Potret perilaku tim Anda</h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-blue-100/75">Hasil teragregasi dari observasi yang berada dalam penugasan Anda. Halaman ini hanya-baca dan tidak mengubah data observasi.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-100/60">Rata-rata tim</p>
            <p className="mt-1 text-3xl font-bold text-[#F3CE7A]">{formatScore(averageScore)}<span className="ml-1 text-sm font-medium text-white/50">/ 5</span></p>
          </div>
        </div>
      </section>

      <section aria-labelledby="key-metrics-title">
        <h2 id="key-metrics-title" className="sr-only">Metrik utama</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Observasi saya" value={ownObservationCount} detail="Dalam cakupan akun" icon={<ClipboardCheck />} />
          <StatCard label="Total tim" value={data.teams.length} detail="Tim dalam cakupan" icon={<UsersRound />} />
          <StatCard label="Tim berskor" value={scoredTeams.length} detail={`Dari ${data.teams.length} tim`} icon={<BarChart3 />} />
          <StatCard label="Skor rata-rata" value={formatScore(averageScore)} detail="Skala maksimal 5" icon={<Target />} />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]">
        <TeamRanking teams={rankedTeams} />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
          <DimensionPanel title="Kekuatan utama" description="Dimensi dengan skor agregat tertinggi." dimensions={data.executiveSummary.topStrengths} icon={<TrendingUp />} tone="strength" />
          <DimensionPanel title="Area pengembangan" description="Dimensi yang perlu menjadi fokus berikutnya." dimensions={data.executiveSummary.developmentAreas} icon={<Target />} tone="development" />
        </div>
      </div>

      <TeamComparison teams={rankedTeams} />
    </div>
  );
}

function TeamRanking({ teams }: { teams: TeamScoreSummary[] }) {
  return (
    <section className="overflow-hidden rounded-md border border-[#0B2C6B]/10 bg-white shadow-[0_22px_60px_-42px_rgba(11,44,107,0.7)]" aria-labelledby="team-ranking-title">
      <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B2C6B] text-[#F3CE7A]"><Medal className="h-5 w-5" aria-hidden="true" /></span>
          <div>
            <h2 id="team-ranking-title" className="text-base font-bold text-[#0B2C6B] sm:text-lg">Ringkasan & peringkat tim</h2>
            <p className="mt-0.5 text-xs text-slate-500">Urutan berdasarkan skor keseluruhan.</p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <caption className="sr-only">Peringkat, skor, kekuatan, area pengembangan, dan jumlah observasi setiap tim</caption>
          <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th scope="col" className="px-5 py-3 text-center">Peringkat</th>
              <th scope="col" className="px-3 py-3">Tim</th>
              <th scope="col" className="px-3 py-3 text-center">Skor</th>
              <th scope="col" className="px-3 py-3">Kekuatan</th>
              <th scope="col" className="px-3 py-3">Area pengembangan</th>
              <th scope="col" className="px-5 py-3 text-center">Observasi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {teams.map((team, index) => (
              <tr key={team.teamId} className="transition-colors hover:bg-[#0B2C6B]/[0.02]">
                <td className="px-5 py-4 text-center"><span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${index === 0 ? "bg-[#D9A441] text-[#071B3D]" : "bg-slate-100 text-[#0B2C6B]"}`}>{index + 1}</span></td>
                <th scope="row" className="px-3 py-4"><span className="block font-bold text-[#0B2C6B]">{team.teamName}</span><span className="mt-1 block text-[11px] font-medium text-slate-500">{team.batch}</span></th>
                <td className="px-3 py-4 text-center font-bold text-[#0B2C6B]">{formatScore(team.overallTeamScore)}</td>
                <td className="max-w-40 px-3 py-4 text-xs text-slate-600">{team.strongestDimension?.dimensionName ?? "Belum tersedia"}</td>
                <td className="max-w-40 px-3 py-4 text-xs text-slate-600">{team.weakestDimension?.dimensionName ?? "Belum tersedia"}</td>
                <td className="px-5 py-4 text-center font-semibold text-slate-600">{team.totalObservations}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DimensionPanel({ title, description, dimensions, icon, tone }: { title: string; description: string; dimensions: DimensionScore[]; icon: React.ReactNode; tone: "strength" | "development" }) {
  const strength = tone === "strength";
  return (
    <section className="rounded-md border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_22px_60px_-45px_rgba(11,44,107,0.7)]" aria-labelledby={`${tone}-title`}>
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl [&>svg]:h-5 [&>svg]:w-5 ${strength ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`} aria-hidden="true">{icon}</span>
        <div><h2 id={`${tone}-title`} className="text-base font-bold text-[#0B2C6B]">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div>
      </div>
      <ol className="mt-5 space-y-3">
        {dimensions.length === 0 && <li className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Belum cukup data.</li>}
        {dimensions.map((dimension, index) => (
          <li key={dimension.dimensionCode} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${strength ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{index + 1}</span>
            <span className="min-w-0 flex-1 text-xs font-semibold leading-5 text-slate-700">{dimension.dimensionName}</span>
            <span className="font-bold text-[#0B2C6B]">{formatScore(dimension.score)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function TeamComparison({ teams }: { teams: TeamScoreSummary[] }) {
  const scoredTeams = teams.filter((team) => team.overallTeamScore !== null);
  return (
    <section className="rounded-md border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_22px_60px_-45px_rgba(11,44,107,0.7)] sm:p-6" aria-labelledby="comparison-title">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-dark"><BarChart3 className="h-5 w-5" aria-hidden="true" /></span>
        <div><h2 id="comparison-title" className="text-base font-bold text-[#0B2C6B] sm:text-lg">Perbandingan ringkas tim</h2><p className="mt-1 text-xs leading-5 text-slate-500">Skor keseluruhan pada skala 1 sampai 5.</p></div>
      </div>
      {scoredTeams.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Belum ada skor tim yang dapat dibandingkan.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {scoredTeams.map((team, index) => {
            const score = team.overallTeamScore ?? 0;
            const previousScore = scoredTeams[index - 1]?.overallTeamScore;
            const difference = previousScore === null || previousScore === undefined ? null : score - previousScore;
            return (
              <div key={team.teamId}>
                <div className="mb-2 flex items-end justify-between gap-3 text-xs">
                  <div className="min-w-0"><span className="block truncate font-bold text-[#0B2C6B]">{team.teamName}</span><span className="text-[10px] text-slate-500">{team.batch}</span></div>
                  <div className="flex shrink-0 items-center gap-2">
                    {difference !== null && <span className="inline-flex items-center text-[10px] font-semibold text-slate-500">{difference >= 0 ? <ArrowUpRight className="h-3 w-3" aria-hidden="true" /> : <ArrowDownRight className="h-3 w-3" aria-hidden="true" />}{difference > 0 ? "+" : ""}{difference.toFixed(1)}</span>}
                    <span className="font-bold text-[#0B2C6B]">{score.toFixed(1)}</span>
                  </div>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${team.teamName}: ${score.toFixed(1)} dari 5`}>
                  <div className="h-full rounded-full bg-gradient-to-r from-[#0B2C6B] to-[#D9A441]" style={{ width: `${Math.max(0, Math.min(100, (score / 5) * 100))}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ResultsLoading() {
  return (
    <div className="space-y-5" role="status" aria-live="polite">
      <div className="flex min-h-44 items-center justify-center rounded-[1.75rem] bg-[#071B3D] text-blue-100 shadow-lg">
        <Loader2 className="mr-3 h-5 w-5 animate-spin text-[#F3CE7A]" aria-hidden="true" />
        <span className="text-sm font-semibold">Memuat hasil T-BOS...</span>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-hidden="true">
        {[0, 1, 2, 3].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl border border-slate-100 bg-white" />)}
      </div>
      <span className="sr-only">Data hasil sedang dimuat.</span>
    </div>
  );
}
