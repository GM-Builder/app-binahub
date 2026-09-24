"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Inbox,
  UserRoundX,
} from "lucide-react";
import { colors } from "../_lib/constants";
import type { DashboardData } from "../_lib/types";
import { MetricBar, Panel } from "./shared";

const ACTIVE_PIPELINE_STAGES = new Set(["identified", "qualified", "consultation", "proposal", "negotiation"]);

function compactRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function OverviewMetric({ label, value, note }: { label: string; value: string | number; note: string }) {
  return <div className="min-w-0 border-l border-slate-200 pl-4 first:border-l-0 first:pl-0"><p className="text-[11px] font-semibold text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{value}</p><p className="mt-1 truncate text-[11px] text-slate-400">{note}</p></div>;
}

export function Overview({ data }: { data: DashboardData }) {
  const now = new Date();
  const sevenDaysAgo = now.getTime() - 7 * 86_400_000;
  const operationalLeads = (data.pipelineLeads || []).filter((lead) => !/@example\.invalid$/i.test(lead.email));
  const activeLeads = operationalLeads.filter((lead) => ACTIVE_PIPELINE_STAGES.has(lead.opportunityStage));
  const pipelineValue = activeLeads.reduce((sum, lead) => sum + (lead.opportunityValue || 0), 0);
  const wonThisMonth = operationalLeads.filter((lead) => {
    if (lead.opportunityStage !== "won" || !lead.wonAt) return false;
    const wonAt = new Date(lead.wonAt);
    return wonAt.getFullYear() === now.getFullYear() && wonAt.getMonth() === now.getMonth();
  });
  const newInquiries = (data.inquiries || []).filter((item) => item.createdAt && new Date(item.createdAt).getTime() >= sevenDaysAgo).length;
  const pendingProposals = (data.assessments || []).filter((item) => item.proposalGateStatus === "pending_approval").length;

  const priorities = [
    { label: "Tindakan pipeline melewati tenggat", count: data.summary.overdueNextActions || 0, detail: "Selesaikan atau jadwalkan ulang tindakan berikutnya.", href: "/admin/pipeline", icon: CalendarClock, tone: "rose" },
    { label: "Peluang belum memiliki penanggung jawab", count: data.summary.unassignedOpportunities || 0, detail: "Tetapkan PIC agar peluang tidak berhenti.", href: "/admin/pipeline", icon: UserRoundX, tone: "amber" },
    { label: "Proposal menunggu keputusan", count: pendingProposals, detail: "Tinjau isi dan risiko sebelum proposal dikirim.", href: "/admin/assessments", icon: ClipboardCheck, tone: "amber" },
    { label: "Klien memerlukan perhatian", count: data.summary.atRiskClients || 0, detail: "Periksa kesehatan akun dan tindakan pemulihan.", href: "/admin/clients", icon: AlertTriangle, tone: "rose" },
    { label: "Milestone melewati tenggat", count: data.summary.overdueMilestones || 0, detail: "Konfirmasi hambatan dan pemilik penyelesaian.", href: "/admin/clients", icon: Activity, tone: "amber" },
  ].filter((item) => item.count > 0);

  return <div className="space-y-6">
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs" aria-labelledby="today-priority-title">
      <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-[11px] font-semibold text-[#80560F]">PRIORITAS HARI INI</p><h2 id="today-priority-title" className="mt-1.5 text-xl font-semibold tracking-tight text-slate-950">Hal yang membutuhkan keputusan Anda</h2><p className="mt-1 text-sm text-slate-500">Daftar ini hanya menampilkan pekerjaan yang tertahan atau berisiko.</p></div>
        <p className="text-xs text-slate-400">Diperbarui {new Date(data.generatedAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</p>
      </div>
      {priorities.length ? <div className="divide-y divide-slate-100 px-5 sm:px-6">{priorities.map((item) => {
        const Icon = item.icon;
        const iconTone = item.tone === "rose" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700";
        return <Link key={item.label} href={item.href} className="group flex items-center gap-4 py-4"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${iconTone}`}><Icon size={18} aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-900">{item.label}</span><span className="mt-0.5 block text-xs text-slate-500">{item.detail}</span></span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{item.count}</span><ArrowRight size={16} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#0B2C6B]" aria-hidden="true" /></Link>;
      })}</div> : <div className="flex items-center gap-4 px-5 py-6 sm:px-6"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><CheckCircle2 size={19} aria-hidden="true" /></span><div><p className="text-sm font-semibold text-slate-900">Tidak ada pekerjaan mendesak</p><p className="mt-1 text-xs text-slate-500">Pipeline, proposal, klien, dan milestone berada dalam batas yang aman.</p></div></div>}
    </section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs" aria-labelledby="business-summary-title">
      <div className="px-5 pt-5 sm:px-6"><h2 id="business-summary-title" className="text-base font-semibold text-slate-900">Ringkasan bisnis</h2></div>
      <div className="mt-4 grid grid-cols-2 gap-5 border-t border-slate-100 px-5 py-5 sm:px-6 lg:grid-cols-4">
        <OverviewMetric label="Nilai pipeline aktif" value={compactRupiah(pipelineValue)} note={`${activeLeads.length} peluang berjalan`} />
        <OverviewMetric label="Deal bulan ini" value={wonThisMonth.length} note={compactRupiah(wonThisMonth.reduce((sum, lead) => sum + (lead.opportunityValue || 0), 0))} />
        <OverviewMetric label="Inquiry baru" value={newInquiries} note="Dalam 7 hari terakhir" />
        <OverviewMetric label="Klien aktif" value={data.summary.activeClients || 0} note={`${data.summary.openDeliveryProjects || 0} proyek berjalan`} />
      </div>
      <div className="grid gap-px border-t border-slate-100 bg-slate-100 sm:grid-cols-3">
        <Link href="/admin/pipeline" className="group flex items-center gap-3 bg-white px-5 py-4 text-sm font-semibold text-slate-700 hover:text-[#0B2C6B]"><CircleDollarSign size={17} className="text-slate-400" /> Buka pipeline <ArrowRight size={14} className="ml-auto text-slate-300 group-hover:text-[#0B2C6B]" /></Link>
        <Link href="/admin/inquiries" className="group flex items-center gap-3 bg-white px-5 py-4 text-sm font-semibold text-slate-700 hover:text-[#0B2C6B]"><Inbox size={17} className="text-slate-400" /> Buka inquiry <ArrowRight size={14} className="ml-auto text-slate-300 group-hover:text-[#0B2C6B]" /></Link>
        <Link href="/admin/clients" className="group flex items-center gap-3 bg-white px-5 py-4 text-sm font-semibold text-slate-700 hover:text-[#0B2C6B]"><Building2 size={17} className="text-slate-400" /> Buka klien <ArrowRight size={14} className="ml-auto text-slate-300 group-hover:text-[#0B2C6B]" /></Link>
      </div>
    </section>

    <section aria-labelledby="diagnostic-insight-title">
      <div className="mb-4"><p className="text-[11px] font-semibold text-[#80560F]">ANALITIK DIAGNOSTIK</p><h2 id="diagnostic-insight-title" className="mt-1 text-lg font-semibold text-slate-900">Insight BinaInsight</h2></div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Skor rata-rata per kompetensi" action={`${data.summary.totalAssessments} assessment`}><div className="grid gap-3">{data.dimensionStats.map((item) => <MetricBar key={item.dimension} label={item.dimension} value={item.average} />)}</div></Panel>
        <Panel title="Kategori assessment" action={data.summary.mostCommonCategory}><div className="space-y-2">{data.categoryBreakdown.map((item, index) => <div key={item.category} className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-2.5"><div className="flex items-center gap-2.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} /><span className="text-xs font-semibold text-slate-800">{item.category}</span></div><span className="text-xs font-bold text-[#0B2C6B]">{item.count}</span></div>)}</div></Panel>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Skor berdasarkan ukuran perusahaan" action="Segmentasi perusahaan"><div className="space-y-3">{data.employeeStats.map((item) => <MetricBar key={item.range} label={`${item.range} (${item.count})`} value={item.avgOverall} />)}</div></Panel>
        <Panel title="Layanan yang sering direkomendasikan" action="Tren kebutuhan"><div className="space-y-2">{data.topRecommendations.slice(0, 8).map((item) => <div key={item.service} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-2.5"><span className="text-xs font-semibold text-slate-700">{item.service}</span><span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-[#664408]">{item.count}x</span></div>)}</div></Panel>
      </div>
    </section>
  </div>;
}
