"use client";

import { useState, useMemo } from "react";
import type { TeamScoreSummary } from "@/modules/tbos/types";
import { DIMENSION_LIST } from "@/modules/tbos";

interface Props {
  teams: TeamScoreSummary[];
}

function getScoreBg(score: number | null): string {
  if (score === null) return "bg-gray-50 text-gray-300";
  if (score >= 4.5) return "bg-emerald-500 text-white";
  if (score >= 3.5) return "bg-lime-500 text-white";
  if (score >= 2.5) return "bg-amber-400 text-white";
  if (score >= 1.5) return "bg-orange-500 text-white";
  return "bg-red-500 text-white";
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
    <div className="bg-white rounded-xl border border-[#0B2C6B]/10 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.04] bg-gradient-to-r from-[#0B2C6B]/[0.02] to-transparent">
        <div>
          <h3 className="text-base font-bold text-[#0B2C6B]">
            Heatmap Perbandingan Tim
          </h3>
          <p className="text-xs text-[#4A4C54]/70 mt-0.5">{filteredTeams.length} tim · {DIMENSION_LIST.length} dimensi</p>
        </div>
        {batches.length > 2 && (
          <div className="flex gap-1 p-1 bg-[#0B2C6B]/[0.04] rounded-xl">
            {batches.map((batch) => (
              <button
                key={batch}
                onClick={() => setBatchFilter(batch)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  batchFilter === batch
                    ? "bg-white text-[#0B2C6B] shadow-sm ring-1 ring-black/[0.04]"
                    : "text-[#4A4C54] hover:text-[#0B2C6B] hover:bg-white/60"
                }`}
              >
                {batch === "all" ? "Semua" : batch}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Heatmap Table */}
      <div className="overflow-x-auto p-4">
        <table className="w-full border-separate" style={{ borderSpacing: "3px" }}>
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white text-left py-3 px-3 text-xs font-semibold text-[#0B2C6B] uppercase tracking-wide whitespace-nowrap rounded-lg">
                Tim
              </th>
              {DIMENSION_LIST.map((dim) => (
                <th
                  key={dim.code}
                  className="text-center py-2.5 px-1.5 text-xs font-semibold text-[#0B2C6B]/70 uppercase"
                  style={{ minWidth: 88 }}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[10px] leading-tight font-bold">{dim.name}</span>
                  </div>
                </th>
              ))}
              <th className="text-center py-2.5 px-3 text-xs font-semibold text-[#0B2C6B] uppercase tracking-wide">
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
                <tr key={team.teamId} className="group">
                  <td className="sticky left-0 z-10 bg-white py-2 px-3 rounded-lg group-hover:bg-[#0B2C6B]/[0.02] transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-[#0B2C6B] whitespace-nowrap">{team.teamName}</p>
                      <p className="text-[10px] text-[#4A4C54]/60 font-medium">{team.batch}</p>
                    </div>
                  </td>
                  {DIMENSION_LIST.map((dim) => {
                    const dimScore = team.dimensionAverages.find((d) => d.dimensionCode === dim.code);
                    const score = dimScore?.score ?? null;
                    return (
                      <td key={dim.code} className="text-center py-1 px-1">
                        <div
                          className={`w-full h-11 rounded-md flex items-center justify-center text-sm font-semibold transition-colors duration-150 cursor-default ${getScoreBg(score)}`}
                          title={score !== null ? `${dim.name}: ${score.toFixed(1)}` : "Belum diobservasi"}
                        >
                          {score !== null ? score.toFixed(1) : "—"}
                        </div>
                      </td>
                    );
                  })}
                  <td className="text-center py-2 px-3">
                    <div className="flex flex-col items-center">
                      <span className="text-base font-bold text-[#0B2C6B]">
                        {avgScore !== null ? avgScore.toFixed(1) : "-"}
                      </span>
                      <span className="text-[9px] text-[#4A4C54]/50">/5.0</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend — Gradient bar */}
      <div className="px-6 pb-5 pt-2">
        <div className="flex items-center gap-3 text-xs text-[#4A4C54]">
          <span className="font-medium text-[#0B2C6B]">Skala:</span>
          <div className="flex items-center gap-0">
            <span className="text-[10px] mr-1 font-medium">1.0</span>
            <div className="flex h-3 rounded-full overflow-hidden">
              <div className="w-10 bg-red-500" />
              <div className="w-10 bg-orange-500" />
              <div className="w-10 bg-amber-400" />
              <div className="w-10 bg-lime-500" />
              <div className="w-10 bg-emerald-500" />
            </div>
            <span className="text-[10px] ml-1 font-medium">5.0</span>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <span className="w-5 h-3 rounded bg-gray-100 border border-gray-200" />
            <span className="text-[10px] font-medium">N/A</span>
          </div>
        </div>
      </div>
    </div>
  );
}
