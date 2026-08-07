"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "@/components/lazy-charts";
import type { BatchComparison } from "@/modules/tbos/types";

interface Props {
  comparisons: BatchComparison[];
}

export function TbosBatchComparison({ comparisons }: Props) {
  const hasData = comparisons.some((c) => c.batch1Avg !== null || c.batch2Avg !== null);

  if (!hasData) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-[#4A4C54]">Belum ada data observasi untuk perbandingan batch.</p>
      </div>
    );
  }

  const chartData = comparisons.map((c) => ({
    name: c.dimensionName.length > 20
      ? c.dimensionName.split(" ")[0]
      : c.dimensionName,
    fullName: c.dimensionName,
    batch1: c.batch1Avg ?? 0,
    batch2: c.batch2Avg ?? 0,
    batch1HasData: c.batch1Avg !== null,
    batch2HasData: c.batch2Avg !== null,
  }));

  return (
    <div className="bg-white rounded-xl p-6 border border-black/[0.04]">
      <h3 className="text-sm font-semibold text-[#0B2C6B] mb-4">
        Rata-rata per Batch — Batch 1 vs Batch 2
      </h3>

      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 5]}
              tick={{ fill: "#4A4C54", fontSize: 11 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: "#4A4C54", fontSize: 11 }}
              width={90}
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
              formatter={(value: any, name: any, props: any) => {
                const hasData = name === "Batch 1" ? props.payload.batch1HasData : props.payload.batch2HasData;
                return [hasData ? value.toFixed(1) : "Belum ada data", name];
              }}
              labelFormatter={(_label: any, payload: any) => payload?.[0]?.payload?.fullName || ""}
            />
            <Bar dataKey="batch1" name="Batch 1" fill="#0B2C6B" radius={[0, 4, 4, 0]} barSize={12} />
            <Bar dataKey="batch2" name="Batch 2" fill="#D9A441" radius={[0, 4, 4, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 justify-center">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-[#0B2C6B]" />
          <span className="text-xs text-[#4A4C54]">Batch 1</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-[#D9A441]" />
          <span className="text-xs text-[#4A4C54]">Batch 2</span>
        </div>
      </div>

      {/* Table View */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/[0.06]">
              <th className="text-left py-2 px-3 text-xs font-medium text-[#4A4C54] uppercase">Dimensi</th>
              <th className="text-center py-2 px-3 text-xs font-medium text-[#0B2C6B] uppercase">Batch 1</th>
              <th className="text-center py-2 px-3 text-xs font-medium text-[#D9A441] uppercase">Batch 2</th>
              <th className="text-center py-2 px-3 text-xs font-medium text-[#4A4C54] uppercase">Selisih</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((c) => {
              const diff =
                c.batch1Avg !== null && c.batch2Avg !== null
                  ? c.batch2Avg - c.batch1Avg
                  : null;
              return (
                <tr key={c.dimensionCode} className="border-b border-black/[0.03]">
                  <td className="py-2.5 px-3 text-[#4A4C54]">{c.dimensionName}</td>
                  <td className="py-2.5 px-3 text-center font-medium text-[#0B2C6B]">
                    {c.batch1Avg !== null ? c.batch1Avg.toFixed(1) : "—"}
                  </td>
                  <td className="py-2.5 px-3 text-center font-medium text-[#D9A441]">
                    {c.batch2Avg !== null ? c.batch2Avg.toFixed(1) : "—"}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {diff !== null ? (
                      <span
                        className={`text-xs font-medium ${
                          diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-gray-400"
                        }`}
                      >
                        {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
