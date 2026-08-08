"use client";

import { useState } from "react";
import { Activity, BarChart3, ChevronDown, Mail, Phone, ShieldCheck, Users } from "lucide-react";
import { ADMIN_WORKFLOW_STEPS, colors } from "../_lib/constants";
import type { DashboardData } from "../_lib/types";
import { MetricBar, Panel, StatCard, WorkflowStrip } from "./shared";

function AdminPlaybook() {
  const [open, setOpen] = useState(false);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#C79A3C]">
            <ShieldCheck size={14} /> Admin Playbook
          </p>
          <h2 className="mt-1 text-base sm:text-lg font-bold tracking-tight text-slate-900">
            Panduan Operasional: Prioritaskan, Review, Catat Progress
          </h2>
        </div>
        <ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="max-w-2xl text-xs sm:text-sm text-slate-500 leading-relaxed mb-4">
            Dashboard ini dirancang sebagai ruang kerja internal. Gunakan panduan singkat di setiap modul
            untuk memahami fungsi tombol, risiko aksi, dan urutan kerja yang disarankan.
          </p>
          <div className="grid gap-3 text-xs sm:text-sm md:grid-cols-3">
            {[
              ["1", "Cek Prioritas", "Lihat assessment/inquiry baru dan follow-up yang sudah jatuh tempo."],
              ["2", "Review Aksi", "Baca status, email tujuan, dan ringkasan sebelum mengirim result, proposal, atau invitation."],
              ["3", "Catat Progress", "Perbarui status dan catatan internal setelah kontak, follow-up, atau project bergerak."],
            ].map(([step, title, description]) => (
              <div key={step} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#0B2C6B] text-xs font-bold text-white mb-2.5">
                  {step}
                </span>
                <p className="font-bold text-slate-900">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

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
      <AdminPlaybook />

      <WorkflowStrip steps={[...ADMIN_WORKFLOW_STEPS]} />

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
