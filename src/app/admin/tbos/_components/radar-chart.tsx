"use client";

import { useState, useMemo } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "@/components/lazy-charts";
import type { TeamScoreSummary } from "@/modules/tbos/types";
import { DIMENSION_LIST } from "@/modules/tbos";

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

export function TbosRadarChart({ teams }: Props) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.teamId || "");
  const [batchFilter, setBatchFilter] = useState<string>("all");

  const batches = useMemo(() => {
    const set = new Set(teams.map((t) => t.batch));
    return ["all", ...Array.from(set).sort()];
  }, [teams]);

  const filteredTeams = useMemo(() => {
    if (batchFilter === "all") return teams;
    return teams.filter((t) => t.batch === batchFilter);
  }, [teams, batchFilter]);

  const selectedTeam = filteredTeams.find((t) => t.teamId === selectedTeamId) || filteredTeams[0];

  const chartData = DIMENSION_LIST.map((dim) => {
    const dimScore = selectedTeam?.dimensionAverages.find(
      (d) => d.dimensionCode === dim.code
    );
    const hasData = dimScore?.score !== null && dimScore?.score !== undefined;
    return {
      dimension: dim.name,
      shortName: dim.name.split(" ")[0],
      score: hasData ? dimScore!.score : 0,
      hasData,
      // For unobserved dimensions, use null so Recharts doesn't draw the polygon point
      displayScore: hasData ? dimScore!.score : null,
    };
  });

  const overallScore = selectedTeam?.overallTeamScore;
  const overallPct = overallScore !== null && overallScore !== undefined ? (overallScore / 5) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Batch Filter */}
      {batches.length > 2 && (
        <div className="flex gap-1.5 p-1 bg-[#0B2C6B]/[0.04] rounded-xl w-fit">
          {batches.map((batch) => (
            <button
              key={batch}
              onClick={() => setBatchFilter(batch)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                batchFilter === batch
                  ? "bg-white text-[#0B2C6B] shadow-sm ring-1 ring-black/[0.04]"
                  : "text-[#4A4C54] hover:text-[#0B2C6B] hover:bg-white/60"
              }`}
            >
              {batch === "all" ? "Semua Batch" : batch}
            </button>
          ))}
        </div>
      )}

      {/* Team Selector — Chip style with avatar initials */}
      <div className="flex flex-wrap gap-2">
        {filteredTeams.map((team) => {
          const initials = team.teamName
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          const isSelected = selectedTeam?.teamId === team.teamId;
          return (
            <button
              key={team.teamId}
              onClick={() => setSelectedTeamId(team.teamId)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                isSelected
                  ? "bg-[#0B2C6B] text-white shadow-md ring-2 ring-[#0B2C6B]/20"
                  : "bg-white text-[#4A4C54] border border-black/[0.06] hover:border-[#0B2C6B]/30 hover:shadow-sm"
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                  isSelected ? "bg-white/20 text-white" : "bg-[#0B2C6B]/[0.06] text-[#0B2C6B]"
                }`}
              >
                {initials}
              </span>
              <span>{team.teamName}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                isSelected ? "bg-white/15 text-white/80" : "bg-black/[0.04] text-[#4A4C54]/60"
              }`}>
                {team.batch}
              </span>
            </button>
          );
        })}
      </div>

      {/* Radar Chart */}
      {selectedTeam && (
        <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_2px_16px_rgba(8,29,66,0.04)] overflow-hidden">
          {/* Chart Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.04] bg-gradient-to-r from-[#0B2C6B]/[0.02] to-transparent">
            <div>
              <h3 className="text-base font-bold text-[#0B2C6B]">{selectedTeam.teamName}</h3>
              <p className="text-xs text-[#4A4C54] mt-0.5">
                {selectedTeam.totalObservations} observasi · {selectedTeam.batch}
              </p>
            </div>
            {/* Circular Score Ring */}
            <div className="relative flex items-center justify-center w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke={getScoreColor(overallScore ?? null)}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${overallPct * 1.76} 176`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-[#0B2C6B] leading-none">
                  {overallScore?.toFixed(1) ?? "—"}
                </span>
                <span className="text-[8px] text-[#4A4C54]/60 font-medium">/5.0</span>
              </div>
            </div>
          </div>

          {/* Chart Body */}
          <div className="p-6">
            <div className="w-full h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={chartData} outerRadius="75%">
                  <PolarGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                  <PolarAngleAxis
                    dataKey="shortName"
                    tick={{ fill: "#4A4C54", fontSize: 11, fontWeight: 500 }}
                  />
                  <PolarRadiusAxis
                    domain={[0, 5]}
                    tickCount={6}
                    tick={{ fill: "#94A3B8", fontSize: 10 }}
                  />
                  <Radar
                    name={selectedTeam.teamName}
                    dataKey="displayScore"
                    stroke="#0B2C6B"
                    fill="url(#radarGradient)"
                    fillOpacity={0.2}
                    strokeWidth={2.5}
                    connectNulls={false}
                  />
                  <defs>
                    <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0B2C6B" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#0B2C6B" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0B2C6B",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "12px",
                      padding: "10px 14px",
                      boxShadow: "0 8px 24px rgba(11,44,107,0.3)",
                    }}
                    labelStyle={{ color: "#D9A441", fontWeight: 600 }}
                    itemStyle={{ color: "#FFFFFF" }}
                    formatter={(value: any, _name: any, props: any) => [
                      props.payload.hasData ? `${value} / 5` : "Belum diobservasi",
                      props.payload.dimension,
                    ]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Dimension Scores Grid */}
          <div className="px-6 pb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {selectedTeam.dimensionAverages.map((dim) => {
                const pct = dim.score !== null ? (dim.score / 5) * 100 : 0;
                return (
                  <div
                    key={dim.dimensionCode}
                    className={`p-3 rounded-xl border transition-all duration-200 hover:shadow-sm ${
                      dim.score === null
                        ? "bg-gray-50/50 border-gray-100"
                        : "bg-gradient-to-br from-white to-[#0B2C6B]/[0.02] border-[#0B2C6B]/[0.06]"
                    }`}
                  >
                    <p className="text-[10px] font-medium text-[#4A4C54]/70 truncate mb-1.5">{dim.dimensionName}</p>
                    <div className="flex items-center gap-2">
                      <p className={`text-base font-bold tabular-nums ${dim.score === null ? "text-gray-300" : "text-[#0B2C6B]"}`}>
                        {dim.score !== null ? dim.score.toFixed(1) : "—"}
                      </p>
                      {dim.score !== null && (
                        <div className="flex-1 h-1.5 bg-black/[0.04] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: getScoreColor(dim.score) }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
