"use client";

import type { TbosDashboardData } from "@/modules/tbos/types";
import { generateExecutiveNarrative } from "@/modules/tbos/scoring";
import { CheckCircle2, AlertCircle, Lightbulb, FileText } from "lucide-react";

interface Props {
  data: TbosDashboardData;
}

export function TbosExecutiveSummary({ data }: Props) {
  const { executiveSummary: summary, batchComparisons } = data;
  const narrative = generateExecutiveNarrative(summary, batchComparisons);

  return (
    <div className="space-y-5">
      {/* Overview */}
      <div className="bg-white rounded-xl border border-[#0B2C6B]/10 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
        <div className="px-5 py-4 border-b border-black/[0.04]">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#0B2C6B]" />
            <div>
              <h3 className="text-sm font-bold text-[#0B2C6B]">Ringkasan Eksekutif Organisasi</h3>
              <p className="text-[10px] text-[#4A4C54]/60">Ikhtisar observasi perilaku secara keseluruhan</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <p className="text-sm text-[#4A4C54] leading-relaxed">
            {narrative.overview}
          </p>
        </div>
      </div>

      {/* Strengths & Development Areas Grid */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Strengths */}
        <div className="bg-white rounded-xl p-5 border border-[#0B2C6B]/10 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
          <div className="flex items-center gap-2 mb-5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-[#0B2C6B]">Kekuatan Utama Organisasi</h3>
              <p className="text-[10px] text-[#4A4C54]/60">Praktik unggulan yang sudah solid</p>
            </div>
          </div>
          <div className="space-y-3.5">
            {narrative.strengthsNarrative.map((text, i) => {
              const dim = summary.topStrengths[i];
              if (!dim) return null;
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium text-[#0B2C6B] truncate">{dim.dimensionName}</span>
                    <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold tabular-nums">
                      {dim.score?.toFixed(1)} / 5.0
                    </span>
                  </div>
                  <div className="ml-[30px]">
                    <p className="text-xs text-[#4A4C54] leading-relaxed">{text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Development Areas */}
        <div className="bg-white rounded-xl p-5 border border-[#0B2C6B]/10 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
          <div className="flex items-center gap-2 mb-5">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <div>
              <h3 className="text-sm font-bold text-[#0B2C6B]">Area Pengembangan Utama</h3>
              <p className="text-[10px] text-[#4A4C54]/60">Prioritas intervensi & pendampingan</p>
            </div>
          </div>
          <div className="space-y-3.5">
            {narrative.developmentNarrative.map((text, i) => {
              const dim = summary.developmentAreas[i];
              if (!dim) return null;
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-amber-50 text-amber-700 text-[11px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium text-[#0B2C6B] truncate">{dim.dimensionName}</span>
                    <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold tabular-nums">
                      {dim.score?.toFixed(1)} / 5.0
                    </span>
                  </div>
                  <div className="ml-[30px]">
                    <p className="text-xs text-[#4A4C54] leading-relaxed">{text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Strategic Recommendation */}
      <div className="bg-gradient-to-br from-[#0B2C6B] via-[#071B3D] to-[#040E24] rounded-xl p-5 shadow-lg text-white">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#D9A441]/20 border border-[#D9A441]/30">
            <Lightbulb className="w-5 h-5 text-[#D9A441]" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-[#D9A441] mb-1">Rekomendasi Strategis Organisasi</h3>
            <p className="text-sm text-white/90 leading-relaxed font-normal">
              {narrative.recommendation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
