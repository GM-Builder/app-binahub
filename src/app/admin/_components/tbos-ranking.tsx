"use client";

import type { TeamScoreSummary } from "@/modules/tbos/types";
import { formatScore } from "@/modules/tbos/scoring";

interface Props {
  teams: TeamScoreSummary[];
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

  const medalLabels = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-3">
      {sorted.map((team, idx) => {
        const rank = idx + 1;
        const isTop3 = rank <= 3;

        return (
          <div
            key={team.teamId}
            className="bg-white rounded-xl p-4 border border-black/[0.04] flex items-center gap-4"
          >
            {/* Rank */}
            <div className="flex items-center justify-center shrink-0">
              {isTop3 ? (
                <span className="text-2xl">{medalLabels[idx]}</span>
              ) : (
                <span className="w-8 h-8 rounded-full bg-[#0B2C6B]/[0.06] text-[#0B2C6B] font-bold text-sm flex items-center justify-center">
                  {rank}
                </span>
              )}
            </div>

            {/* Team Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#0B2C6B] truncate">{team.teamName}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0B2C6B]/[0.06] text-[#0B2C6B]/60 font-medium">
                  {team.batch}
                </span>
              </div>

              {/* Strength & Weakness */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                {team.strongestDimension && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-xs text-[#4A4C54]">
                      Kekuatan: <span className="font-medium text-[#0B2C6B]">{team.strongestDimension.dimensionName}</span>
                      <span className="text-[#4A4C54]/60 ml-1">
                        ({formatScore(team.strongestDimension.score)})
                      </span>
                    </span>
                  </div>
                )}
                {team.weakestDimension && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="text-xs text-[#4A4C54]">
                      Area dev: <span className="font-medium text-[#0B2C6B]">{team.weakestDimension.dimensionName}</span>
                      <span className="text-[#4A4C54]/60 ml-1">
                        ({formatScore(team.weakestDimension.score)})
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Score */}
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-[#0B2C6B]">
                {formatScore(team.overallTeamScore)}
              </p>
              <p className="text-[10px] text-[#4A4C54]">Overall Score</p>
            </div>

            {/* Observations count */}
            <div className="text-center shrink-0 border-l border-black/[0.04] pl-4">
              <p className="text-sm font-medium text-[#0B2C6B]">{team.totalObservations}</p>
              <p className="text-[10px] text-[#4A4C54]">Observasi</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
