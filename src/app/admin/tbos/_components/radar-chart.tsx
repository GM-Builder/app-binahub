"use client";

import { useState, useMemo } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "@/components/lazy-charts";
import type { TeamScoreSummary } from "@/modules/tbos/types";
import { getScoreColor } from "@/modules/tbos/score-color";
import { DIMENSION_LIST } from "@/modules/tbos";

interface Props {
  teams: TeamScoreSummary[];
}

type Mode = "single" | "versus";

const TEAM_A_COLOR = "#0B2C6B";
const TEAM_B_COLOR = "#D9A441";

export function TbosRadarChart({ teams }: Props) {
  const [mode, setMode] = useState<Mode>("single");
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.teamId || "");
  const [teamAId, setTeamAId] = useState<string>(teams[0]?.teamId || "");
  const [teamBId, setTeamBId] = useState<string>(teams[1]?.teamId || teams[0]?.teamId || "");
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
  const teamA = filteredTeams.find((t) => t.teamId === teamAId) || filteredTeams[0];
  const teamB = filteredTeams.find((t) => t.teamId === teamBId) || filteredTeams[1] || filteredTeams[0];

  const singleChartData = DIMENSION_LIST.map((dim) => {
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

  const versusChartData = DIMENSION_LIST.map((dim) => {
    const dimA = teamA?.dimensionAverages.find((d) => d.dimensionCode === dim.code);
    const dimB = teamB?.dimensionAverages.find((d) => d.dimensionCode === dim.code);
    const hasA = dimA?.score !== null && dimA?.score !== undefined;
    const hasB = dimB?.score !== null && dimB?.score !== undefined;
    return {
      dimension: dim.name,
      shortName: dim.name.split(" ")[0],
      teamAScore: hasA ? dimA!.score : null,
      teamBScore: hasB ? dimB!.score : null,
    };
  });

  const overallScore = selectedTeam?.overallTeamScore;
  const overallPct = overallScore !== null && overallScore !== undefined ? (overallScore / 5) * 100 : 0;
  const teamAOverall = teamA?.overallTeamScore;
  const teamBOverall = teamB?.overallTeamScore;

  return (
    <div className="space-y-4">
      {/* Mode + Batch Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 p-1 bg-[#0B2C6B]/[0.04] rounded-xl w-fit">
          <button
            onClick={() => setMode("single")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              mode === "single"
                ? "bg-white text-[#0B2C6B] shadow-sm ring-1 ring-black/[0.04]"
                : "text-[#4A4C54] hover:text-[#0B2C6B] hover:bg-white/60"
            }`}
          >
            Per Tim
          </button>
          <button
            onClick={() => setMode("versus")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              mode === "versus"
                ? "bg-white text-[#0B2C6B] shadow-sm ring-1 ring-black/[0.04]"
                : "text-[#4A4C54] hover:text-[#0B2C6B] hover:bg-white/60"
            }`}
          >
            Versus
          </button>
        </div>
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
      </div>

      {/* Team Selector */}
      {mode === "single" ? (
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
                    : "bg-white text-[#4A4C54] border border-[#0B2C6B]/10 hover:border-[#0B2C6B]/30 hover:shadow-sm"
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
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: TEAM_A_COLOR }} />
            <label htmlFor="versus-team-a" className="text-xs font-semibold text-[#0B2C6B]">Tim A</label>
            <select
              id="versus-team-a"
              value={teamAId}
              onChange={(e) => setTeamAId(e.target.value)}
              className="min-h-9 rounded-lg border border-[#0B2C6B]/10 bg-white px-2.5 text-xs font-medium text-[#0B2C6B]"
            >
              {filteredTeams.map((team) => (
                <option key={team.teamId} value={team.teamId}>
                  {team.teamName} ({team.batch})
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs font-bold text-slate-400">VS</span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: TEAM_B_COLOR }} />
            <label htmlFor="versus-team-b" className="text-xs font-semibold text-[#8A641D]">Tim B</label>
            <select
              id="versus-team-b"
              value={teamBId}
              onChange={(e) => setTeamBId(e.target.value)}
              className="min-h-9 rounded-lg border border-[#0B2C6B]/10 bg-white px-2.5 text-xs font-medium text-[#8A641D]"
            >
              {filteredTeams.map((team) => (
                <option key={team.teamId} value={team.teamId}>
                  {team.teamName} ({team.batch})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Radar Chart */}
      {selectedTeam && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(8,29,66,0.05)]">
          {/* Chart Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 px-6 py-4">
            {mode === "single" ? (
              <>
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
              </>
            ) : (
              <>
                <div>
                  <h3 className="text-base font-bold text-[#0B2C6B]">Perbandingan Radar</h3>
                  <p className="text-xs text-[#4A4C54] mt-0.5">Dua tim ditampilkan bersamaan untuk melihat keunggulan relatif.</p>
                </div>
                {/* Versus Score Summary */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: TEAM_A_COLOR }} />
                    <div>
                      <p className="text-xs font-bold text-[#0B2C6B]">{teamA.teamName}</p>
                      <p className="text-[10px] text-[#4A4C54]/60">
                        {teamAOverall !== null ? teamAOverall.toFixed(1) : "—"} / 5.0
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-400">VS</span>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: TEAM_B_COLOR }} />
                    <div>
                      <p className="text-xs font-bold text-[#8A641D]">{teamB.teamName}</p>
                      <p className="text-[10px] text-[#4A4C54]/60">
                        {teamBOverall !== null ? teamBOverall.toFixed(1) : "—"} / 5.0
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Chart Body */}
          <div className="p-6">
            <div className="w-full h-[400px]">
              {mode === "single" ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={singleChartData} outerRadius="75%">
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
                      formatter={(value: unknown, _name: unknown, props: { payload?: { hasData?: boolean; dimension?: string } }) => [
                        props.payload?.hasData ? `${String(value)} / 5` : "Belum diobservasi",
                        props.payload?.dimension || "",
                      ]}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={versusChartData} outerRadius="75%">
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
                      name={`${teamA.teamName} (A)`}
                      dataKey="teamAScore"
                      stroke={TEAM_A_COLOR}
                      fill={TEAM_A_COLOR}
                      fillOpacity={0.12}
                      strokeWidth={2.5}
                      connectNulls={false}
                    />
                    <Radar
                      name={`${teamB.teamName} (B)`}
                      dataKey="teamBScore"
                      stroke={TEAM_B_COLOR}
                      fill={TEAM_B_COLOR}
                      fillOpacity={0.16}
                      strokeWidth={2.5}
                      connectNulls={false}
                    />
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
                      formatter={(value: unknown, name: unknown) => [
                        value !== null ? `${String(value)} / 5` : "Belum diobservasi",
                        String(name),
                      ]}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Dimension Scores Grid */}
          <div className="px-6 pb-6">
            {mode === "single" ? (
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
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F7F6F2]">
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-[#0B2C6B] uppercase tracking-wide">Dimensi</th>
                      <th className="text-center py-2.5 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: TEAM_A_COLOR }}>
                        {teamA.teamName}
                      </th>
                      <th className="text-center py-2.5 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#8A641D" }}>
                        {teamB.teamName}
                      </th>
                      <th className="text-center py-2.5 px-3 text-xs font-semibold text-[#0B2C6B] uppercase tracking-wide">Unggul</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DIMENSION_LIST.map((dim, idx) => {
                      const dimA = teamA?.dimensionAverages.find((d) => d.dimensionCode === dim.code);
                      const dimB = teamB?.dimensionAverages.find((d) => d.dimensionCode === dim.code);
                      const scoreA = dimA?.score ?? null;
                      const scoreB = dimB?.score ?? null;
                      const winner: "A" | "B" | null =
                        scoreA !== null && scoreB !== null
                          ? scoreA > scoreB
                            ? "A"
                            : scoreB > scoreA
                            ? "B"
                            : null
                          : null;
                      return (
                        <tr key={dim.code} className={`border-b border-slate-100 ${idx % 2 === 1 ? "bg-[#FAFAF8]" : ""}`}>
                          <td className="py-2.5 px-3 text-xs font-medium text-[#4A4C54]">{dim.name}</td>
                          <td className="py-2.5 px-3 text-center text-sm font-bold tabular-nums" style={{ color: scoreA !== null ? TEAM_A_COLOR : "#CBD5E1" }}>
                            {scoreA !== null ? scoreA.toFixed(1) : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-center text-sm font-bold tabular-nums" style={{ color: scoreB !== null ? "#8A641D" : "#CBD5E1" }}>
                            {scoreB !== null ? scoreB.toFixed(1) : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-center text-xs font-bold">
                            {winner === "A" ? (
                              <span className="inline-flex items-center gap-1 text-[#0B2C6B]">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TEAM_A_COLOR }} />
                                {teamA.teamName}
                              </span>
                            ) : winner === "B" ? (
                              <span className="inline-flex items-center gap-1 text-[#8A641D]">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TEAM_B_COLOR }} />
                                {teamB.teamName}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
