"use client";

import { useState, useMemo } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "@/components/lazy-charts";
import type { TeamScoreSummary } from "@/modules/tbos/types";
import { DIMENSION_LIST } from "@/modules/tbos";

interface Props {
  teams: TeamScoreSummary[];
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

  return (
    <div className="space-y-4">
      {/* Batch Filter */}
      {batches.length > 2 && (
        <div className="flex gap-2">
          {batches.map((batch) => (
            <button
              key={batch}
              onClick={() => setBatchFilter(batch)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                batchFilter === batch
                  ? "bg-[#0B2C6B] text-white"
                  : "bg-white text-[#4A4C54] border border-black/[0.06] hover:border-[#0B2C6B]/30"
              }`}
            >
              {batch === "all" ? "Semua Batch" : batch}
            </button>
          ))}
        </div>
      )}

      {/* Team Selector */}
      <div className="flex flex-wrap gap-2">
        {filteredTeams.map((team) => (
          <button
            key={team.teamId}
            onClick={() => setSelectedTeamId(team.teamId)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedTeam?.teamId === team.teamId
                ? "bg-[#0B2C6B] text-white"
                : "bg-white text-[#4A4C54] border border-black/[0.06] hover:border-[#0B2C6B]/30"
            }`}
          >
            {team.teamName}
            <span className="ml-2 text-xs opacity-60">{team.batch}</span>
          </button>
        ))}
      </div>

      {/* Radar Chart */}
      {selectedTeam && (
        <div className="bg-white rounded-xl p-6 border border-black/[0.04]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#0B2C6B]">{selectedTeam.teamName}</h3>
              <p className="text-xs text-[#4A4C54]">
                Overall Score:{" "}
                <span className="font-bold text-[#0B2C6B]">
                  {selectedTeam.overallTeamScore?.toFixed(1) ?? "-"}
                </span>
              </p>
            </div>
            <div className="text-xs text-[#4A4C54]">
              {selectedTeam.totalObservations} observasi
            </div>
          </div>

          <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData} outerRadius="75%">
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis
                  dataKey="shortName"
                  tick={{ fill: "#4A4C54", fontSize: 11 }}
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
                  fill="#0B2C6B"
                  fillOpacity={0.15}
                  strokeWidth={2}
                  connectNulls={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0B2C6B",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "12px",
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

          {/* Dimension Scores List */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
            {selectedTeam.dimensionAverages.map((dim) => (
              <div
                key={dim.dimensionCode}
                className={`p-2 rounded-lg border ${
                  dim.score === null
                    ? "bg-gray-50 border-gray-100"
                    : "bg-[#0B2C6B]/[0.03] border-[#0B2C6B]/10"
                }`}
              >
                <p className="text-[10px] text-[#4A4C54] truncate">{dim.dimensionName}</p>
                <p className={`text-sm font-bold ${dim.score === null ? "text-gray-400" : "text-[#0B2C6B]"}`}>
                  {dim.score !== null ? dim.score.toFixed(1) : "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
