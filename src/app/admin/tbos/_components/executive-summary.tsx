"use client";

import type { TbosDashboardData } from "@/modules/tbos/types";
import { generateExecutiveNarrative } from "@/modules/tbos/scoring";
import { CheckCircle2, AlertCircle, Lightbulb, FileText, Sparkles } from "lucide-react";

interface Props {
  data: TbosDashboardData;
}

export function TbosExecutiveSummary({ data }: Props) {
  const { executiveSummary: summary, batchComparisons } = data;
  const narrative = generateExecutiveNarrative(summary, batchComparisons);

  return (
    <div className="space-y-5">
      {/* Overview */}
      <div className="relative overflow-hidden bg-white rounded-2xl p-6 border border-black/[0.04] shadow-[0_2px_16px_rgba(8,29,66,0.04)]">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#0B2C6B] to-[#1D4ED8] rounded-l-2xl" />
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0B2C6B]/[0.06] flex items-center justify-center ring-1 ring-[#0B2C6B]/10">
              <FileText className="w-4.5 h-4.5 text-[#0B2C6B]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0B2C6B]">Ringkasan Eksekutif Organisasi</h3>
              <p className="text-xs text-[#4A4C54]/60">Ikhtisar observasi perilaku secara keseluruhan</p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#0B2C6B]/[0.06] text-[#0B2C6B]">
            <Sparkles className="w-3.5 h-3.5 text-[#D9A441]" />
            Auto-Generated AI Insight
          </span>
        </div>
        <p className="text-sm text-[#4A4C54] leading-relaxed bg-[#F8F9FC] p-4 rounded-xl border border-black/[0.03]">
          {narrative.overview}
        </p>
      </div>

      {/* Strengths & Development Areas Grid */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Strengths */}
        <div className="relative overflow-hidden bg-white rounded-2xl p-6 border border-black/[0.04] shadow-[0_2px_16px_rgba(8,29,66,0.04)]">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-l-2xl" />
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center ring-1 ring-emerald-100">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0B2C6B]">3 Kekuatan Utama Organisasi</h3>
              <p className="text-xs text-[#4A4C54]/60">Praktik unggulan yang sudah solid</p>
            </div>
          </div>
          <div className="space-y-4">
            {narrative.strengthsNarrative.map((text, i) => {
              const dim = summary.topStrengths[i];
              if (!dim) return null;
              return (
                <div key={i} className="flex gap-3.5 p-3.5 rounded-xl bg-gradient-to-br from-emerald-50/40 to-transparent border border-emerald-100/60 transition-shadow hover:shadow-sm">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-emerald-500 text-white text-sm font-bold flex items-center justify-center shadow-xs">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-bold text-[#0B2C6B] truncate">{dim.dimensionName}</span>
                      <span className="shrink-0 text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold tabular-nums">
                        {dim.score?.toFixed(1)} / 5.0
                      </span>
                    </div>
                    <p className="text-xs text-[#4A4C54] leading-relaxed">{text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Development Areas */}
        <div className="relative overflow-hidden bg-white rounded-2xl p-6 border border-black/[0.04] shadow-[0_2px_16px_rgba(8,29,66,0.04)]">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600 rounded-l-2xl" />
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center ring-1 ring-amber-100">
              <AlertCircle className="w-4.5 h-4.5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0B2C6B]">3 Area Pengembangan Utama</h3>
              <p className="text-xs text-[#4A4C54]/60">Prioritas intervensi & pendampingan</p>
            </div>
          </div>
          <div className="space-y-4">
            {narrative.developmentNarrative.map((text, i) => {
              const dim = summary.developmentAreas[i];
              if (!dim) return null;
              return (
                <div key={i} className="flex gap-3.5 p-3.5 rounded-xl bg-gradient-to-br from-amber-50/40 to-transparent border border-amber-100/60 transition-shadow hover:shadow-sm">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-amber-500 text-white text-sm font-bold flex items-center justify-center shadow-xs">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-bold text-[#0B2C6B] truncate">{dim.dimensionName}</span>
                      <span className="shrink-0 text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold tabular-nums">
                        {dim.score?.toFixed(1)} / 5.0
                      </span>
                    </div>
                    <p className="text-xs text-[#4A4C54] leading-relaxed">{text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Strategic Recommendation */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0B2C6B] via-[#071B3D] to-[#040E24] rounded-2xl p-6 shadow-lg text-white">
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-[#D9A441]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#D9A441]/20 border border-[#D9A441]/30 flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5 text-[#D9A441]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#D9A441] mb-1">Rekomendasi Strategis Organisasi</h3>
            <p className="text-sm text-white/90 leading-relaxed font-normal">
              {narrative.recommendation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
