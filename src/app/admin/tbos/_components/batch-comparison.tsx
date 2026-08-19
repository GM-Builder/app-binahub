"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "@/components/lazy-charts";
import type { BatchComparison } from "@/modules/tbos/types";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface Props {
  comparisons: BatchComparison[];
}

const BATCH_COLORS = ["#0B2C6B", "#D9A441", "#2563EB", "#DC2626", "#059669", "#7C3AED", "#EA580C", "#0891B2"];

export function TbosBatchComparison({ comparisons }: Props) {
  const hasData = comparisons.some((c) => c.batchAverages.some((ba) => ba.avg !== null));

  if (!hasData) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
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
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(8,29,66,0.05)]">
      {/* Card Header */}
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-[#0B2C6B]">
            Perbandingan Batch
          </h3>
          <p className="text-xs text-[#4A4C54]/70 mt-0.5">Analisis rata-rata skor per dimensi perilaku antar angkatan</p>
        </div>

        <div className="flex items-center gap-3 bg-white/80 px-3 py-1.5 rounded-xl border border-[#0B2C6B]/10">
          {batchNames.map((name, i) => (
            <div key={name} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: BATCH_COLORS[i % BATCH_COLORS.length] }} />
              <span className="text-xs font-semibold" style={{ color: BATCH_COLORS[i % BATCH_COLORS.length] }}>{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Section */}
      <div className="p-6">
        <div className="w-full h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 110, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 5]}
                tick={{ fill: "#4A4C54", fontSize: 11, fontWeight: 500 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "#4A4C54", fontSize: 11, fontWeight: 500 }}
                width={100}
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
                formatter={(value: unknown, name: unknown, props: { payload?: Record<string, unknown> }) => {
                  const seriesName = String(name);
                  const hasData = props.payload?.[`${seriesName}_hasData`] === true;
                  const score = typeof value === "number" ? `${value.toFixed(1)} / 5.0` : "-";
                  return [hasData ? score : "Belum ada data", seriesName];
                }}
                labelFormatter={(_label: unknown, payload: readonly { payload?: { fullName?: string } }[]) => payload?.[0]?.payload?.fullName || ""}
              />
              {batchNames.map((name, i) => (
                <Bar key={name} dataKey={name} name={name} fill={BATCH_COLORS[i % BATCH_COLORS.length]} radius={[0, 6, 6, 0]} barSize={14} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table View */}
      <div className="border-t border-black/[0.04]">
        <div className="border-t border-slate-100 px-6 py-3 bg-[#F7F6F2]">
          <h4 className="text-xs font-bold uppercase text-[#0B2C6B] tracking-wider">Tabel Rincian Skor per Batch</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F7F6F2]">
                <th className="text-left py-3 px-6 text-xs font-semibold text-[#0B2C6B] uppercase tracking-wide">Dimensi Perilaku</th>
                {batchNames.map((name, i) => (
                  <th key={name} className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wide" style={{ color: BATCH_COLORS[i % BATCH_COLORS.length] }}>{name}</th>
                ))}
                {batchNames.length >= 2 && (
                  <th className="text-center py-3 px-4 text-xs font-semibold text-[#0B2C6B] uppercase tracking-wide">Selisih</th>
                )}
              </tr>
            </thead>
            <tbody>
              {comparisons.map((c, idx) => {
                const batchAvgs = c.batchAverages.filter((ba) => ba.avg !== null);
                const diff = batchAvgs.length >= 2
                  ? batchAvgs[batchAvgs.length - 1].avg! - batchAvgs[0].avg!
                  : null;
                return (
                  <tr key={c.dimensionCode} className={`border-b border-slate-100 hover:bg-[#0B2C6B]/[0.03] transition-colors ${idx % 2 === 1 ? "bg-[#FAFAF8]" : ""}`}>
                    <td className="py-3 px-6 font-medium text-[#0B2C6B]">{c.dimensionName}</td>
                    {c.batchAverages.map((ba, i) => (
                      <td key={ba.batchName} className="py-3 px-4 text-center font-bold tabular-nums" style={{ color: BATCH_COLORS[i % BATCH_COLORS.length] }}>
                        {ba.avg !== null ? ba.avg.toFixed(1) : "—"}
                      </td>
                    ))}
                    {batchNames.length >= 2 && (
                      <td className="py-3 px-4 text-center">
                        {diff !== null ? (
                          <span
                            className={`inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-xs font-bold tabular-nums ${
                              diff > 0
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                : diff < 0
                                ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {diff > 0 ? (
                              <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                            ) : diff < 0 ? (
                              <ArrowDownRight className="w-3 h-3 text-rose-600" />
                            ) : (
                              <Minus className="w-3 h-3 text-gray-400" />
                            )}
                            {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
