"use client";

import { Activity, BarChart3, Mail, Phone, Users } from "lucide-react";
import { colors } from "../_lib/constants";
import type { DashboardData } from "../_lib/types";
import { MetricBar, Panel, StatCard } from "./shared";

export function Overview({ data }: { data: DashboardData }) {
  const summaryCards = [
    { label: "Total Assessment", value: data.summary.totalAssessments, icon: Activity },
    { label: "Rata-rata Skor", value: `${data.summary.avgOverall}%`, icon: BarChart3 },
    { label: "Kontak Klien", value: data.summary.totalContacts, icon: Mail },
    { label: "Inquiry Masuk", value: data.summary.totalInquiries, icon: Phone },
    { label: "Associate Terdaftar", value: data.summary.totalCoaches, icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} icon={card.icon} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Skor Rata-rata per Dimensi" action="Radar-style view">
          <div className="grid gap-3">
            {data.dimensionStats.map((item) => (
              <MetricBar key={item.dimension} label={item.dimension} value={item.average} />
            ))}
          </div>
        </Panel>

        <Panel title="Kategori Assessment" action={data.summary.mostCommonCategory}>
          <div className="space-y-2.5">
            {data.categoryBreakdown.map((item, index) => (
              <div key={item.category} className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                  <span className="text-xs font-semibold text-slate-900">{item.category}</span>
                </div>
                <span className="text-xs font-bold text-[#0B2C6B]">{item.count}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Skor berdasarkan Ukuran Perusahaan" action="Company size">
          <div className="space-y-3">
            {data.employeeStats.map((item) => (
              <MetricBar key={item.range} label={`${item.range} (${item.count})`} value={item.avgOverall} />
            ))}
          </div>
        </Panel>

        <Panel title="Layanan Paling Sering Direkomendasikan" action="Demand signal">
          <div className="space-y-2.5">
            {data.topRecommendations.slice(0, 8).map((item) => (
              <div key={item.service} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-2.5">
                <span className="text-xs font-semibold text-slate-800">{item.service}</span>
                <span className="rounded-full bg-[#D9A441]/15 px-2.5 py-0.5 text-xs font-bold text-[#9B6C17]">
                  {item.count}x
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
