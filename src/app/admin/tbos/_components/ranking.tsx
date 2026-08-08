"use client";

import type { TeamScoreSummary } from "@/modules/tbos/types";
import { formatScore } from "@/modules/tbos/scoring";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  teams: TeamScoreSummary[];
}

function getScoreColor(score: number | null): string {
  if (score === null) return "#CBD5E1";
  if (score >= 4.5) return "#10B981";
  if (score >= 3.5) return "#84CC16";
  if (score >= 2.5) return "#F59E0B";
  if (score >= 1.5) return "#F97316";
  return "#EF4444";
}

export function TbosRanking({ teams }: Props) {
  const sorted = [...teams].sort((a, b) => {
    const aScore = a.overallTeamScore ?? -1;
    const bScore = b.overallTeamScore ?? -1;
    return bScore - aScore;
  });

  if (sorted.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-[#4A4C54]">Belum ada data tim.</p>
      </div>
    );
  }

  const medalGradients = [
    "from-[#D9A441]/20 via-[#F0D68A]/10 to-transparent border-[#D9A441]/30", // Gold
    "from-slate-300/20 via-slate-200/10 to-transparent border-slate-300/30", // Silver
    "from-orange-300/20 via-orange-200/10 to-transparent border-orange-300/30", // Bronze
  ];

  const medalColors = [
    "bg-gradient-to-br from-[#D9A441] to-[#B8872E] text-white",
    "bg-gradient-to-br from-slate-400 to-slate-500 text-white",
    "bg-gradient-to-br from-orange-400 to-orange-500 text-white",
  ];

  return (
    <div className="space-y-3">
      {sorted.map((team, idx) => {
        const rank = idx + 1;
        const isTop3 = rank <= 3;
        const scorePct = team.overallTeamScore !== null ? (team.overallTeamScore / 5) * 100 : 0;

        return (
          <div
            key={team.teamId}
            className={`bg-white rounded-2xl border p-5 flex items-center gap-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
              isTop3
                ? `bg-gradient-to-r ${medalGradients[idx]} shadow-sm`
                : "border-black/[0.04] hover:border-[#0B2C6B]/10"
            }`}
          >
            {/* Rank Badge */}
            <div className="flex items-center justify-center shrink-0">
              {isTop3 ? (
                <div className={`w-10 h-10 rounded-xl ${medalColors[idx]} flex items-center justify-center shadow-sm`}>
                  <Trophy className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#0B2C6B]/[0.06] text-[#0B2C6B] font-bold text-sm flex items-center justify-center">
                  {rank}
                </div>
              )}
            </div>

            {/* Team Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-[#0B2C6B] truncate">{team.teamName}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0B2C6B]/[0.06] text-[#0B2C6B]/60 font-semibold shrink-0">
                  {team.batch}
                </span>
              </div>

              {/* Score Progress Bar */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-2 bg-black/[0.04] rounded-full overflow-hidden max-w-[200px]">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${scorePct}%`,
                      backgroundColor: getScoreColor(team.overallTeamScore),
                    }}
                  />
                </div>
                <span className="text-[10px] text-[#4A4C54]/60 font-medium tabular-nums">
                  {formatScore(team.overallTeamScore)}/5.0
                </span>
              </div>

              {/* Strength & Weakness */}
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {team.strongestDimension && (
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span className="text-xs text-[#4A4C54]">
                      <span className="font-semibold text-[#0B2C6B]">{team.strongestDimension.dimensionName}</span>
                      <span className="text-[#4A4C54]/50 ml-1 tabular-nums">
                        ({formatScore(team.strongestDimension.score)})
                      </span>
                    </span>
                  </div>
                )}
                {team.weakestDimension && (
                  <div className="flex items-center gap-1.5">
                    <TrendingDown className="w-3 h-3 text-amber-500" />
                    <span className="text-xs text-[#4A4C54]">
                      <span className="font-semibold text-[#0B2C6B]">{team.weakestDimension.dimensionName}</span>
                      <span className="text-[#4A4C54]/50 ml-1 tabular-nums">
                        ({formatScore(team.weakestDimension.score)})
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Score */}
            <div className="text-right shrink-0">
              <p className="text-3xl font-bold text-[#0B2C6B] tabular-nums leading-none">
                {formatScore(team.overallTeamScore)}
              </p>
              <p className="text-[10px] text-[#4A4C54]/50 font-medium mt-1">Overall Score</p>
            </div>

            {/* Observations count */}
            <div className="text-center shrink-0 border-l border-black/[0.06] pl-4">
              <p className="text-lg font-bold text-[#0B2C6B]">{team.totalObservations}</p>
              <p className="text-[10px] text-[#4A4C54]/50 font-medium">Observasi</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
