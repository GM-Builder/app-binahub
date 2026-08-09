"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "@/components/lazy-charts";
import type { BatchComparison } from "@/modules/tbos/types";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface Props {
  comparisons: BatchComparison[];
}

export function TbosBatchComparison({ comparisons }: Props) {
  const hasData = comparisons.some((c) => c.batch1Avg !== null || c.batch2Avg !== null);

  if (!hasData) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-[#0B2C6B]/10 p-8">
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
    <div className="bg-white rounded-xl border border-[#0B2C6B]/10 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.04] bg-gradient-to-r from-[#0B2C6B]/[0.02] to-transparent">
        <div>
          <h3 className="text-base font-bold text-[#0B2C6B]">
            Perbandingan Batch — Batch 1 vs Batch 2
          </h3>
          <p className="text-xs text-[#4A4C54]/70 mt-0.5">Analisis rata-rata skor per dimensi perilaku antar angkatan</p>
        </div>

        {/* Legend in Header */}
        <div className="flex items-center gap-4 bg-white/80 px-3 py-1.5 rounded-xl border border-[#0B2C6B]/10">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#0B2C6B]" />
            <span className="text-xs font-semibold text-[#0B2C6B]">Batch 1</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#D9A441]" />
            <span className="text-xs font-semibold text-[#8A641D]">Batch 2</span>
          </div>
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
                formatter={(value: any, name: any, props: any) => {
                  const hasData = name === "Batch 1" ? props.payload.batch1HasData : props.payload.batch2HasData;
                  return [hasData ? `${value.toFixed(1)} / 5.0` : "Belum ada data", name];
                }}
                labelFormatter={(_label: any, payload: any) => payload?.[0]?.payload?.fullName || ""}
              />
              <Bar dataKey="batch1" name="Batch 1" fill="#0B2C6B" radius={[0, 6, 6, 0]} barSize={14} />
              <Bar dataKey="batch2" name="Batch 2" fill="#D9A441" radius={[0, 6, 6, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table View */}
      <div className="border-t border-black/[0.04]">
        <div className="px-6 py-3 bg-[#0B2C6B]/[0.02]">
          <h4 className="text-xs font-bold uppercase text-[#0B2C6B] tracking-wider">Tabel Rincian Skor per Batch</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0B2C6B]/[0.03]">
                <th className="text-left py-3 px-6 text-xs font-semibold text-[#0B2C6B] uppercase tracking-wide">Dimensi Perilaku</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-[#0B2C6B] uppercase tracking-wide">Batch 1</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-[#8A641D] uppercase tracking-wide">Batch 2</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-[#0B2C6B] uppercase tracking-wide">Selisih</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((c, idx) => {
                const diff =
                  c.batch1Avg !== null && c.batch2Avg !== null
                    ? c.batch2Avg - c.batch1Avg
                    : null;
                return (
                  <tr key={c.dimensionCode} className={`border-b border-black/[0.03] hover:bg-[#0B2C6B]/[0.02] transition-colors ${idx % 2 === 1 ? "bg-[#F8F9FC]" : ""}`}>
                    <td className="py-3 px-6 font-medium text-[#0B2C6B]">{c.dimensionName}</td>
                    <td className="py-3 px-4 text-center font-bold text-[#0B2C6B] tabular-nums">
                      {c.batch1Avg !== null ? c.batch1Avg.toFixed(1) : "—"}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-[#8A641D] tabular-nums">
                      {c.batch2Avg !== null ? c.batch2Avg.toFixed(1) : "—"}
                    </td>
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
