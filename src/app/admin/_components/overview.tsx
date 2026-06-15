"use client";

import { useState } from "react";
import { Activity, BarChart3, ChevronDown, Mail, Phone, ShieldCheck, Users } from "lucide-react";
import { ADMIN_WORKFLOW_STEPS, colors } from "../_lib/constants";
import type { DashboardData } from "../_lib/types";
import { MetricBar, Panel, StatCard, WorkflowStrip } from "./shared";

function AdminPlaybook() {
  const [open, setOpen] = useState(false);

  return (
    <section className="overflow-hidden rounded-[8px] border border-[#0B2C6B]/10 bg-[#071B3D] text-white shadow-[0_18px_60px_-42px_rgba(7,27,61,0.6)]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left md:px-6"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#D9A441]">
            <ShieldCheck size={14} /> Admin Playbook
          </p>
          <h3 className="mt-1 text-lg font-light tracking-[-0.03em] md:text-xl">
            Prioritaskan, review, catat progress.
          </h3>
        </div>
        <ChevronDown size={18} className={`shrink-0 text-[#D9A441] transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
      <div className="border-t border-white/10 px-5 pb-5 pt-1 md:px-6 md:pb-6">
        <p className="max-w-2xl text-sm font-light leading-relaxed text-white/62">
          Dashboard ini dirancang sebagai ruang kerja internal. Gunakan panduan singkat di setiap modul
          untuk memahami fungsi tombol, risiko aksi, dan urutan kerja yang disarankan.
        </p>
        <div className="grid gap-3 text-sm md:grid-cols-3 lg:max-w-3xl">
          {[
            ["1", "Cek Prioritas", "Lihat assessment/inquiry baru dan follow-up yang sudah jatuh tempo."],
            ["2", "Review Aksi", "Baca status, email tujuan, dan ringkasan sebelum mengirim result, proposal, atau invitation."],
            ["3", "Catat Progress", "Perbarui status dan catatan internal setelah kontak, follow-up, atau project bergerak."],
          ].map(([step, title, description]) => (
            <div key={step} className="rounded-[12px] border border-white/10 bg-white/[0.06] p-4">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#D9A441] text-xs font-bold text-[#071B3D]">{step}</span>
              <p className="mt-3 font-semibold text-white">{title}</p>
              <p className="mt-2 text-xs leading-relaxed text-white/58">{description}</p>
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
          <div className="space-y-3">
            {data.categoryBreakdown.map((item, index) => (
              <div key={item.category} className="flex items-center justify-between gap-4 rounded-[12px] bg-[#F5F7FA] px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                  <span className="text-sm font-medium">{item.category}</span>
                </div>
                <span className="text-sm font-bold">{item.count}</span>
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
          <div className="space-y-3">
            {data.topRecommendations.slice(0, 8).map((item) => (
              <div key={item.service} className="flex items-center justify-between border-b border-black/[0.05] pb-3 last:border-0">
                <span className="text-sm font-medium">{item.service}</span>
                <span className="rounded-full bg-[#D9A441]/12 px-3 py-1 text-xs font-bold text-[#9B6C17]">
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
