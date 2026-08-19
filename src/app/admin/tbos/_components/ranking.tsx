"use client";

import { useMemo, useState } from "react";
import type { TeamScoreSummary } from "@/modules/tbos/types";
import { MISSIONS, DIMENSIONS } from "@/modules/tbos/config";
import { formatScore } from "@/modules/tbos/scoring";
import { getScoreColor } from "@/modules/tbos/score-color";
import { Trophy, TrendingUp, TrendingDown, Filter, RotateCcw } from "lucide-react";

interface Props {
  teams: TeamScoreSummary[];
}

type MissionFilter = keyof typeof MISSIONS | "";
type DimensionFilter = keyof typeof DIMENSIONS | "";

export function TbosRanking({ teams }: Props) {
  const [missionFilter, setMissionFilter] = useState<MissionFilter>("");
  const [dimensionFilter, setDimensionFilter] = useState<DimensionFilter>("");

  const availableMissions = useMemo(() => {
    const seen = new Set<string>();
    for (const team of teams) {
      for (const mission of team.missionScores) {
        if (mission.tbosScore !== null) seen.add(mission.missionCode);
      }
    }
    return [...seen];
  }, [teams]);

  const availableDimensions = useMemo(() => {
    const seen = new Set<string>();
    for (const team of teams) {
      for (const dim of team.dimensionAverages) {
        if (dim.score !== null) seen.add(dim.dimensionCode);
      }
    }
    return [...seen];
  }, [teams]);

  const resolutionLabel = useMemo(() => {
    if (missionFilter && dimensionFilter) {
      return `${MISSIONS[missionFilter]?.name || missionFilter} • ${DIMENSIONS[dimensionFilter]?.name || dimensionFilter}`;
    }
    if (missionFilter) return `Skor Misi ${MISSIONS[missionFilter]?.name || missionFilter}`;
    if (dimensionFilter) return `Skor Dimensi ${DIMENSIONS[dimensionFilter]?.name || dimensionFilter}`;
    return "Skor Keseluruhan Tim";
  }, [missionFilter, dimensionFilter]);

  const sorted = useMemo(() => {
    const resolve = (team: TeamScoreSummary): number | null => {
      if (missionFilter && dimensionFilter) {
        const mission = team.missionScores.find((m) => m.missionCode === missionFilter);
        const dim = mission?.dimensionScores.find((d) => d.dimensionCode === dimensionFilter);
        return dim?.score ?? null;
      }
      if (missionFilter) {
        return team.missionScores.find((m) => m.missionCode === missionFilter)?.tbosScore ?? null;
      }
      if (dimensionFilter) {
        return team.dimensionAverages.find((d) => d.dimensionCode === dimensionFilter)?.score ?? null;
      }
      return team.overallTeamScore;
    };
    return [...teams]
      .map((team) => ({ team, score: resolve(team) }))
      .sort((a, b) => {
        const aScore = a.score ?? -1;
        const bScore = b.score ?? -1;
        return bScore - aScore;
      });
  }, [teams, missionFilter, dimensionFilter]);

  const hasAnyScore = sorted.some((entry) => entry.score !== null);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(8,29,66,0.05)]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#9A7B2F]">
            <Filter className="h-3.5 w-3.5" />
            Filter Ranking
          </span>

          <label className="flex items-center gap-2 text-xs text-[#4A4C54]">
            <span className="font-semibold">Misi</span>
            <select
              value={missionFilter}
              onChange={(event) => setMissionFilter(event.target.value as MissionFilter)}
              className="min-h-10 rounded-xl border border-slate-200 bg-[#F7F6F2] px-2.5 text-xs font-medium text-[#0B2C6B] outline-none transition-colors focus:border-[#D9A441] focus:bg-white"
            >
              <option value="">Semua Misi (Keseluruhan)</option>
              {availableMissions.map((code) => (
                <option key={code} value={code}>
                  {MISSIONS[code as keyof typeof MISSIONS]?.name || code}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-xs text-[#4A4C54]">
            <span className="font-semibold">Dimensi</span>
            <select
              value={dimensionFilter}
              onChange={(event) => setDimensionFilter(event.target.value as DimensionFilter)}
              className="min-h-10 rounded-xl border border-slate-200 bg-[#F7F6F2] px-2.5 text-xs font-medium text-[#0B2C6B] outline-none transition-colors focus:border-[#D9A441] focus:bg-white"
            >
              <option value="">Semua Dimensi (Gabungan)</option>
              {availableDimensions.map((code) => (
                <option key={code} value={code}>
                  {DIMENSIONS[code as keyof typeof DIMENSIONS]?.name || code}
                </option>
              ))}
            </select>
          </label>

          {(missionFilter !== "" || dimensionFilter !== "") && (
            <button
              type="button"
              onClick={() => {
                setMissionFilter("");
                setDimensionFilter("");
              }}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-[#4A4C54] transition-colors hover:border-[#0B2C6B]/30 hover:text-[#0B2C6B]"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}

          <span className="ml-auto inline-flex items-center rounded-full bg-[#0B2C6B]/[0.05] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#0B2C6B]/70">
            Diurutkan: {resolutionLabel}
          </span>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-[#4A4C54]">Belum ada data tim.</p>
        </div>
      ) : !hasAnyScore ? (
        <div className="text-center py-12">
          <p className="text-sm text-[#4A4C54]">Tidak ada tim dengan skor untuk filter yang dipilih.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(({ team, score }, idx) => {
            const rank = idx + 1;
            const isTop3 = rank <= 3 && score !== null;
            const scorePct = score !== null ? (score / 5) * 100 : 0;

            const medalTile = [
              "bg-gradient-to-br from-[#D9A441] to-[#B8872E] text-white",
              "bg-gradient-to-br from-slate-400 to-slate-500 text-white",
              "bg-gradient-to-br from-orange-400 to-orange-500 text-white",
            ];

            return (
              <div
                key={team.teamId}
                className={`rounded-2xl border bg-white p-5 transition-colors duration-200 ${
                  isTop3 ? "border-[#D9A441]/40 shadow-[0_8px_28px_-18px_rgba(217,164,65,0.45)]" : "border-slate-200 shadow-[0_8px_24px_rgba(8,29,66,0.05)] hover:border-[#0B2C6B]/25"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Rank Badge */}
                  <div className="flex items-center justify-center shrink-0">
                    {isTop3 ? (
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${medalTile[idx]} shadow-sm`}>
                        <Trophy className="h-5 w-5" />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B2C6B]/[0.06] text-sm font-bold text-[#0B2C6B]">
                        {rank}
                      </div>
                    )}
                  </div>

                  {/* Team Info */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="truncate text-sm font-bold text-[#0B2C6B]">{team.teamName}</h3>
                      <span className="shrink-0 rounded-full bg-[#0B2C6B]/[0.06] px-2 py-0.5 text-[10px] font-semibold text-[#0B2C6B]/60">
                        {team.batch}
                      </span>
                    </div>

                    {/* Score Progress Bar */}
                    <div className="mb-2 flex items-center gap-2">
                      <div className="h-2 max-w-[200px] flex-1 overflow-hidden rounded-full bg-black/[0.04]">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${scorePct}%`, backgroundColor: getScoreColor(score) }}
                        />
                      </div>
                      <span className="text-[10px] font-medium tabular-nums text-[#4A4C54]/60">
                        {formatScore(score)}/5.0
                      </span>
                    </div>

                    {/* Strength & Weakness */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {team.strongestDimension && (
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="h-3 w-3 text-emerald-500" />
                          <span className="text-xs text-[#4A4C54]">
                            <span className="font-semibold text-[#0B2C6B]">{team.strongestDimension.dimensionName}</span>
                            <span className="ml-1 text-[#4A4C54]/50 tabular-nums">({formatScore(team.strongestDimension.score)})</span>
                          </span>
                        </div>
                      )}
                      {team.weakestDimension && (
                        <div className="flex items-center gap-1.5">
                          <TrendingDown className="h-3 w-3 text-amber-500" />
                          <span className="text-xs text-[#4A4C54]">
                            <span className="font-semibold text-[#0B2C6B]">{team.weakestDimension.dimensionName}</span>
                            <span className="ml-1 text-[#4A4C54]/50 tabular-nums">({formatScore(team.weakestDimension.score)})</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="shrink-0 text-right">
                    <p className="text-3xl font-bold leading-none tabular-nums text-[#0B2C6B]">{formatScore(score)}</p>
                    <p className="mt-1 text-[10px] font-medium text-[#4A4C54]/50">{resolutionLabel}</p>
                  </div>

                  {/* Observations count */}
                  <div className="shrink-0 border-l border-black/[0.06] pl-4 text-center">
                    <p className="text-lg font-bold text-[#0B2C6B]">{team.totalObservations}</p>
                    <p className="text-[10px] font-medium text-[#4A4C54]/50">Observasi</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
