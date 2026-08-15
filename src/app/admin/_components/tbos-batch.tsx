"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "@/components/lazy-charts";
import type { BatchComparison } from "@/modules/tbos/types";

const BATCH_COLORS = ["#0B2C6B", "#D9A441", "#2563EB", "#DC2626", "#059669", "#7C3AED", "#EA580C", "#0891B2"];

interface Props {
  comparisons: BatchComparison[];
}

export function TbosBatchComparison({ comparisons }: Props) {
  const hasData = comparisons.some((c) => c.batchAverages.some((ba) => ba.avg !== null));

  if (!hasData) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-[#4A4C54]">Belum ada data observasi untuk perbandingan batch.</p>
      </div>
    );
  }

  const allBatchNames = new Set<string>();
  for (const c of comparisons) {
    for (const ba of c.batchAverages) {
      allBatchNames.add(ba.batchName);
    }
  }
  const batchNames = [...allBatchNames].sort();

  const chartData = comparisons.map((c) => {
    const row: Record<string, string | number | boolean> = {
      name: c.dimensionName.length > 20 ? c.dimensionName.split(" ")[0] : c.dimensionName,
      fullName: c.dimensionName,
    };
    for (const ba of c.batchAverages) {
      row[ba.batchName] = ba.avg ?? 0;
      row[`${ba.batchName}_hasData`] = ba.avg !== null;
    }
    return row;
  });

  return (
    <div className="bg-white rounded-xl p-6 border border-black/[0.04]">
      <h3 className="text-sm font-semibold text-[#0B2C6B] mb-4">
        Rata-rata per Batch
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
              formatter={(value: unknown, name: unknown, props: { payload?: Record<string, unknown> }) => {
                const seriesName = String(name);
                const hasData = props.payload?.[`${seriesName}_hasData`] === true;
                const score = typeof value === "number" ? value.toFixed(1) : "-";
                return [hasData ? score : "Belum ada data", seriesName];
              }}
              labelFormatter={(_label: unknown, payload: readonly { payload?: { fullName?: string } }[]) => payload?.[0]?.payload?.fullName || ""}
            />
            {batchNames.map((name, i) => (
              <Bar key={name} dataKey={name} name={name} fill={BATCH_COLORS[i % BATCH_COLORS.length]} radius={[0, 4, 4, 0]} barSize={12} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 justify-center">
        {batchNames.map((name, i) => (
          <div key={name} className="flex items-center gap-2">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: BATCH_COLORS[i % BATCH_COLORS.length] }} />
            <span className="text-xs text-[#4A4C54]">{name}</span>
          </div>
        ))}
      </div>

      {/* Table View */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/[0.06]">
              <th className="text-left py-2 px-3 text-xs font-medium text-[#4A4C54] uppercase">Dimensi</th>
              {batchNames.map((name, i) => (
                <th key={name} className="text-center py-2 px-3 text-xs font-medium uppercase" style={{ color: BATCH_COLORS[i % BATCH_COLORS.length] }}>{name}</th>
              ))}
              {batchNames.length >= 2 && (
                <th className="text-center py-2 px-3 text-xs font-medium text-[#4A4C54] uppercase">Selisih</th>
              )}
            </tr>
          </thead>
          <tbody>
            {comparisons.map((c) => {
              const batchAvgs = c.batchAverages.filter((ba) => ba.avg !== null);
              const diff = batchAvgs.length >= 2
                ? batchAvgs[batchAvgs.length - 1].avg! - batchAvgs[0].avg!
                : null;
              return (
                <tr key={c.dimensionCode} className="border-b border-black/[0.03]">
                  <td className="py-2.5 px-3 text-[#4A4C54]">{c.dimensionName}</td>
                  {c.batchAverages.map((ba, i) => (
                    <td key={ba.batchName} className="py-2.5 px-3 text-center font-medium" style={{ color: BATCH_COLORS[i % BATCH_COLORS.length] }}>
                      {ba.avg !== null ? ba.avg.toFixed(1) : "—"}
                    </td>
                  ))}
                  {batchNames.length >= 2 && (
                    <td className="py-2.5 px-3 text-center">
                      {diff !== null ? (
                        <span className={`text-xs font-medium ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-gray-400"}`}>
                          {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                        </span>
                      ) : "—"}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
