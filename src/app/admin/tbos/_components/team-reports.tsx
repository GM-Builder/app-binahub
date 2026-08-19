"use client";

import { useMemo, useState } from "react";
import { BarChart3, Crown, Download, Loader2, Search, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { downloadBlob } from "@/lib/download";
import type { TbosDbTeam } from "@/modules/tbos/api-client";
import type { TeamScoreSummary } from "@/modules/tbos/types";

const DIMENSION_COLORS: Record<string, { bar: string; dot: string }> = {
  goal_alignment: { bar: "bg-blue-600", dot: "bg-blue-600" },
  communication: { bar: "bg-cyan-500", dot: "bg-cyan-500" },
  data_based_decision: { bar: "bg-violet-500", dot: "bg-violet-500" },
  execution_discipline: { bar: "bg-amber-500", dot: "bg-amber-500" },
  accountability: { bar: "bg-rose-500", dot: "bg-rose-500" },
  adaptability: { bar: "bg-emerald-500", dot: "bg-emerald-500" },
  collaboration: { bar: "bg-teal-500", dot: "bg-teal-500" },
  org_ownership: { bar: "bg-indigo-500", dot: "bg-indigo-500" },
};

export function TbosTeamReports({ teams, roster }: { teams: TeamScoreSummary[]; roster: TbosDbTeam[] }) {
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.teamId || "");
  const [query, setQuery] = useState("");
  const [downloading, setDownloading] = useState(false);

  const filteredTeams = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("id-ID");
    if (!keyword) return teams;
    return teams.filter((team) => `${team.teamName} ${team.batch}`.toLocaleLowerCase("id-ID").includes(keyword));
  }, [query, teams]);

  const effectiveTeamId = teams.some((item) => item.teamId === selectedTeamId)
    ? selectedTeamId
    : teams[0]?.teamId;
  const team = teams.find((item) => item.teamId === effectiveTeamId) || teams[0];
  const rosterTeam = roster.find((item) => item.id === team?.teamId);
  const members = rosterTeam?.members || [];
  const captain = members.find((member) => member.is_captain);

  const downloadReport = async () => {
    if (!team) return;
    setDownloading(true);
    try {
      const response = await fetch(`/api/tbos/export?format=pdf&teamId=${encodeURIComponent(team.teamId)}`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Gagal membuat laporan tim.");
      }
      const blob = await response.blob();
      const safeName = team.teamName.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_") || "Tim";
      downloadBlob(blob, `T-BOS_Laporan_${safeName}_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success(`Laporan ${team.teamName} berhasil diunduh.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengunduh laporan tim.");
    } finally {
      setDownloading(false);
    }
  };

  if (!team) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <UsersRound className="mx-auto h-10 w-10 text-slate-300" />
        <h2 className="mt-3 font-bold text-[#0B2C6B]">Belum ada tim</h2>
        <p className="mt-1 text-sm text-slate-500">Tambahkan tim untuk mulai menyusun laporan.</p>
      </section>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(8,29,66,0.05)]">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9A7B2F]">Pilih tim</p>
          <h2 className="mt-1 text-lg font-bold text-[#0B2C6B]">Laporan per Tim</h2>
        </div>
        <label className="relative mt-4 block">
          <span className="sr-only">Cari tim atau batch</span>
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari tim atau batch" className="min-h-10 w-full rounded-xl border border-slate-200 bg-[#F7F6F2] pl-9 pr-3 text-sm outline-none transition-colors focus:border-[#0B2C6B] focus:bg-white" />
        </label>
        <div className="mt-3 max-h-[32rem] space-y-1.5 overflow-y-auto pr-1">
          {filteredTeams.map((item) => {
            const selected = item.teamId === team.teamId;
            return (
              <button key={item.teamId} type="button" onClick={() => setSelectedTeamId(item.teamId)} aria-pressed={selected} className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${selected ? "border-[#0B2C6B] bg-[#0B2C6B] text-white shadow-sm shadow-[#0B2C6B]/20" : "border-slate-200 bg-white text-[#0B2C6B] hover:border-[#0B2C6B]/30 hover:bg-[#0B2C6B]/[0.03]"}`}>
                <span className="block truncate text-sm font-bold">{item.teamName}</span>
                <span className={`mt-0.5 block text-xs ${selected ? "text-white/65" : "text-slate-500"}`}>{item.batch} · {item.totalObservations} observasi</span>
              </button>
            );
          })}
          {filteredTeams.length === 0 && <p className="p-4 text-center text-xs text-slate-500">Tim tidak ditemukan.</p>}
        </div>
      </aside>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(8,29,66,0.05)]" aria-labelledby="team-report-title">
        <div className="border-b border-[#D9A441]/40 bg-[#FFF9EA] px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9A6A12]">Laporan T-BOS</p>
              <h2 id="team-report-title" className="mt-2 text-2xl font-bold tracking-tight text-[#0B2C6B]">{team.teamName}</h2>
              <p className="mt-1 text-sm text-slate-500">{team.batch} · {team.totalObservations} observasi selesai</p>
            </div>
            <button type="button" onClick={() => void downloadReport()} disabled={downloading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0B2C6B] px-4 text-sm font-bold text-white shadow-sm shadow-[#0B2C6B]/20 transition-colors hover:bg-[#071B3D] disabled:opacity-50">
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Unduh PDF Tim
            </button>
          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-7">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <ReportStat label="Nama tim" value={team.teamName} />
            <ReportStat label="Batch" value={team.batch} />
            <ReportStat label="Jumlah anggota" value={`${members.length} orang`} />
            <ReportStat label="Skor rata-rata" value={team.overallTeamScore !== null ? `${team.overallTeamScore.toFixed(1)} / 5` : "Belum tersedia"} accent />
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.2fr)]">
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4" aria-labelledby="team-members-title">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 id="team-members-title" className="text-sm font-bold text-[#0B2C6B]">Anggota tim</h3>
                  <p className="mt-0.5 text-xs text-slate-500">Kapten ditandai dengan ikon mahkota.</p>
                </div>
                <UsersRound className="h-5 w-5 text-[#D9A441]" />
              </div>
              {members.length === 0 ? (
                <p className="mt-4 rounded-xl bg-white p-3 text-sm text-slate-500">Daftar anggota belum diisi.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {members.map((member) => (
                    <li key={member.id} className="flex min-h-10 items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200/70">
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${member.is_captain ? "bg-amber-100 text-amber-700" : "bg-[#0B2C6B]/[0.06] text-[#0B2C6B]"}`}>{member.is_captain ? <Crown className="h-3.5 w-3.5" /> : member.member_name.charAt(0).toUpperCase()}</span>
                      <span className="min-w-0 flex-1 truncate font-medium">{member.member_name}</span>
                      {member.is_captain && <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Kapten</span>}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Kapten tim</p>
                <p className="mt-1 text-sm font-bold text-amber-900">{captain?.member_name || "Belum ditentukan"}</p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 p-4 sm:p-5" aria-labelledby="dimension-bars-title">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#D9A441]" />
                <div>
                  <h3 id="dimension-bars-title" className="text-sm font-bold text-[#0B2C6B]">Delapan dimensi perilaku</h3>
                  <p className="mt-0.5 text-xs text-slate-500">Skor rata-rata setiap dimensi pada skala 1-5.</p>
                </div>
              </div>
              <div className="mt-5 space-y-4">
                {team.dimensionAverages.map((dimension) => {
                  const colors = DIMENSION_COLORS[dimension.dimensionCode] || { bar: "bg-slate-500", dot: "bg-slate-500" };
                  const width = dimension.score === null ? 0 : Math.max(0, Math.min(100, (dimension.score / 5) * 100));
                  return (
                    <div key={dimension.dimensionCode}>
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-700"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${colors.dot}`} /> <span className="truncate">{dimension.dimensionName}</span></span>
                        <span className="shrink-0 text-xs font-extrabold tabular-nums text-[#0B2C6B]">{dimension.score !== null ? dimension.score.toFixed(1) : "-"}</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${dimension.dimensionName}: ${dimension.score !== null ? `${dimension.score.toFixed(1)} dari 5` : "belum dinilai"}`}>
                        <div className={`h-full rounded-full ${colors.bar} transition-[width] duration-500`} style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}

function ReportStat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-3.5 ${accent ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"}`}>
      <p className={`text-[10px] font-bold uppercase tracking-wide ${accent ? "text-amber-700" : "text-slate-500"}`}>{label}</p>
      <p className={`mt-1 truncate text-sm font-extrabold ${accent ? "text-amber-900" : "text-[#0B2C6B]"}`} title={value}>{value}</p>
    </div>
  );
}
