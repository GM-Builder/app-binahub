"use client";

import type { TbosDashboardData } from "@/modules/tbos/types";
import { generateExecutiveNarrative } from "@/modules/tbos/scoring";
import { Check, AlertCircle, Lightbulb, FileText } from "lucide-react";

interface Props {
  data: TbosDashboardData;
}

export function TbosExecutiveSummary({ data }: Props) {
  const { executiveSummary: summary, batchComparisons } = data;
  const narrative = generateExecutiveNarrative(summary, batchComparisons);

  return (
    <div className="space-y-4">
      {/* Overview */}
      <div className="bg-white rounded-xl p-6 border border-black/[0.04]">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[#0B2C6B]/[0.06] flex items-center justify-center">
            <FileText className="w-4 h-4 text-[#0B2C6B]" />
          </div>
          <h3 className="text-sm font-semibold text-[#0B2C6B]">Overview</h3>
        </div>
        <p className="text-sm text-[#4A4C54] leading-relaxed">{narrative.overview}</p>
      </div>

      {/* Strengths */}
      <div className="bg-white rounded-xl p-6 border border-black/[0.04]">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
            <Check className="w-4 h-4 text-green-600" />
          </div>
          <h3 className="text-sm font-semibold text-[#0B2C6B]">Kekuatan Utama Organisasi</h3>
        </div>
        <div className="space-y-3">
          {narrative.strengthsNarrative.map((text, i) => {
            const dim = summary.topStrengths[i];
            if (!dim) return null;
            return (
              <div key={i} className="flex gap-3">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-green-700">{i + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-[#0B2C6B]">{dim.dimensionName}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                      {dim.score?.toFixed(1)}/5
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
      <div className="bg-white rounded-xl p-6 border border-black/[0.04]">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <h3 className="text-sm font-semibold text-[#0B2C6B]">Area Pengembangan</h3>
        </div>
        <div className="space-y-3">
          {narrative.developmentNarrative.map((text, i) => {
            const dim = summary.developmentAreas[i];
            if (!dim) return null;
            return (
              <div key={i} className="flex gap-3">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-amber-700">{i + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-[#0B2C6B]">{dim.dimensionName}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                      {dim.score?.toFixed(1)}/5
                    </span>
                  </div>
                  <p className="text-xs text-[#4A4C54] leading-relaxed">{text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendation */}
      <div className="bg-[#0B2C6B] rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-[#D9A441]" />
          </div>
          <h3 className="text-sm font-semibold text-white">Rekomendasi Strategis</h3>
        </div>
        <p className="text-sm text-white/80 leading-relaxed">{narrative.recommendation}</p>
      </div>
    </div>
  );
}
