"use client";

import { useState, useMemo } from "react";
import type { TeamScoreSummary } from "@/modules/tbos/types";
import { DIMENSION_LIST } from "@/modules/tbos";

interface Props {
  teams: TeamScoreSummary[];
}

function getScoreBg(score: number | null): string {
  if (score === null) return "bg-gray-50 text-gray-400";
  if (score >= 4.5) return "bg-green-100 text-green-800";
  if (score >= 3.5) return "bg-lime-100 text-lime-800";
  if (score >= 2.5) return "bg-yellow-100 text-yellow-800";
  if (score >= 1.5) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
}

export function TbosHeatmap({ teams }: Props) {
  const [batchFilter, setBatchFilter] = useState<string>("all");

  const batches = useMemo(() => {
    const set = new Set(teams.map((t) => t.batch));
    return ["all", ...Array.from(set).sort()];
  }, [teams]);

  const filteredTeams = useMemo(() => {
    if (batchFilter === "all") return teams;
    return teams.filter((t) => t.batch === batchFilter);
  }, [teams, batchFilter]);

  if (teams.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-[#4A4C54]">Belum ada data tim.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-black/[0.04]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#0B2C6B]">
          Heatmap Perbandingan Tim
        </h3>
        {batches.length > 2 && (
          <div className="flex gap-1">
            {batches.map((batch) => (
              <button
                key={batch}
                onClick={() => setBatchFilter(batch)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  batchFilter === batch
                    ? "bg-[#0B2C6B] text-white"
                    : "bg-[#0B2C6B]/[0.06] text-[#0B2C6B]/60 hover:bg-[#0B2C6B]/[0.1]"
                }`}
              >
                {batch === "all" ? "Semua" : batch}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white text-left py-2 px-3 text-xs font-medium text-[#4A4C54] uppercase whitespace-nowrap">
                Tim
              </th>
              {DIMENSION_LIST.map((dim) => (
                <th
                  key={dim.code}
                  className="text-center py-2 px-2 text-xs font-medium text-[#4A4C54] uppercase"
                  style={{ minWidth: 80 }}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] leading-tight">{dim.name}</span>
                  </div>
                </th>
              ))}
              <th className="text-center py-2 px-3 text-xs font-medium text-[#4A4C54] uppercase">
                Avg
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTeams.map((team) => {
              const validScores = team.dimensionAverages.filter((d) => d.score !== null);
              const avgScore =
                validScores.length > 0
                  ? validScores.reduce((sum, d) => sum + (d.score || 0), 0) / validScores.length
                  : null;

              return (
                <tr key={team.teamId} className="border-t border-black/[0.04]">
                  <td className="sticky left-0 bg-white py-2.5 px-3">
                    <div>
                      <p className="text-sm font-medium text-[#0B2C6B] whitespace-nowrap">{team.teamName}</p>
                      <p className="text-[10px] text-[#4A4C54]">{team.batch}</p>
                    </div>
                  </td>
                  {DIMENSION_LIST.map((dim) => {
                    const dimScore = team.dimensionAverages.find((d) => d.dimensionCode === dim.code);
                    const score = dimScore?.score ?? null;
                    return (
                      <td key={dim.code} className="text-center py-2 px-1">
                        <div
                          className={`w-full h-10 rounded-md flex items-center justify-center text-xs font-bold ${getScoreBg(score)}`}
                          title={score !== null ? `${dim.name}: ${score.toFixed(1)}` : "Belum diobservasi"}
                        >
                          {score !== null ? score.toFixed(1) : "—"}
                        </div>
                      </td>
                    );
                  })}
                  <td className="text-center py-2.5 px-3">
                    <span className="text-sm font-bold text-[#0B2C6B]">
                      {avgScore !== null ? avgScore.toFixed(1) : "-"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-[#4A4C54]">
        <span>Skala warna:</span>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-red-100" /> 1-1.4
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-orange-100" /> 1.5-2.4
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-yellow-100" /> 2.5-3.4
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-lime-100" /> 3.5-4.4
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-green-100" /> 4.5-5
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-gray-50 border border-gray-200" /> N/A
        </div>
      </div>
    </div>
  );
}
