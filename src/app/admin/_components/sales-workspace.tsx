"use client";

import { lazy, Suspense, useCallback, useMemo, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Search, Send } from "lucide-react";
import { salesTasks, type SalesTask, type SalesView } from "../_lib/sales-workspace";
import type { AssessmentDetailTab } from "../_lib/assessment-presentation";
import type { DashboardData } from "../_lib/types";
import { AcquisitionControlPanel } from "./acquisition-control-panel";
import { AssessmentPanel } from "./assessment-panel";
import { InquiriesPanel } from "./inquiries-panel";
import { PipelinePanel } from "./pipeline-panel";
import { MeetingsPanel } from "./meetings-panel";
import { SalesFollowUpControl } from "./sales-follow-up-control";
const SpinPanel = lazy(() => import('./spin-panel').then(module => ({ default: module.SpinPanel })));

type Action = (url: string, init?: RequestInit) => Promise<unknown>;
const sections: [SalesView, string][] = [["priorities", "Prioritas"], ["inbound", "Inbound"], ["outbound", "Outbound"], ["clients", "Klien & proposal"], ["followup", "Tindak lanjut"], ["pipeline", "Peluang"], ["meetings", "Konsultasi"]];
const labels = { inquiry: "Inquiry", assessment: "Assessment", proposal: "Proposal", followup: "Tindak lanjut", pipeline: "Peluang" };

export function SalesWorkspace({ data, onAction, onRefresh }: { data: DashboardData; onAction: Action; onRefresh: () => Promise<void> }) {
  const [view, setView] = useState<SalesView>("priorities");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [limit, setLimit] = useState(12);
  const [clientType, setClientType] = useState<"assessment" | "inquiry" | "discovery">("assessment");
  const [discoverySearch, setDiscoverySearch] = useState("");
  const pendingMeeting = useRef(false);
  const onMeetingDirty = useCallback((dirty: boolean) => { pendingMeeting.current = dirty; }, []);
  const mayLeaveMeeting = () => !pendingMeeting.current || window.confirm("Ada perubahan checklist yang belum tersimpan. Tetap tinggalkan sesi ini?");
  const changeView = (next: SalesView) => { if (next === view || mayLeaveMeeting()) { setView(next); setFilter("all"); setLimit(12); } };
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [inquiryId, setInquiryId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<AssessmentDetailTab>("summary");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const [employees, setEmployees] = useState("Semua");
  const [minScore, setMinScore] = useState("0");
  const tasks = useMemo(() => salesTasks(data), [data]);
  const visible = tasks.filter((task) => (view !== "followup" || task.kind === "followup") && (filter === "all" || task.kind === filter)
    && `${task.name} ${task.company} ${task.email} ${task.source}`.toLowerCase().includes(search.toLowerCase()));
  const records = data.assessments.filter((record) => `${record.name} ${record.email} ${record.company}`.toLowerCase().includes(query.toLowerCase())
    && (category === "Semua" || record.category === category) && (employees === "Semua" || record.employees === employees) && record.overallScore >= Number(minScore));
  const open = (task: SalesTask) => {
    if (!mayLeaveMeeting()) return;
    setView(task.view);
    if (task.kind === "inquiry" || task.kind === "followup" && !task.detail) { setClientType("inquiry"); setInquiryId(task.recordId); }
    else if (task.view === "clients") { setClientType("assessment"); setAssessmentId(task.recordId); setDetailTab(task.detail || "summary"); setQuery(""); setCategory("Semua"); setEmployees("Semua"); setMinScore("0"); }
  };
  return <div className="space-y-5">
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Workspace penjualan</p><h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Dari percakapan pertama hingga kesepakatan</h2><p className="mt-2 text-sm leading-6 text-slate-500">Lihat prioritas, buka konteks klien, lalu ambil langkah berikutnya dari sini.</p></div>
        <button type="button" onClick={() => changeView("outbound")} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0B2C6B] px-4 text-sm font-semibold text-white"><Send size={16} /> Mulai kampanye email</button>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Perlu ditangani", tasks.length], ["Proposal", tasks.filter((t) => t.kind === "proposal").length], ["Tindak lanjut", tasks.filter((t) => t.kind === "followup").length], ["Kesepakatan", (data.pipelineLeads || []).filter((lead) => lead.opportunityStage === "won").length]].map(([label, count]) => <div key={label} className="rounded-xl bg-slate-50 p-3.5"><p className="text-[11px] font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">{count}</p></div>)}</div>
    </section>
    <nav aria-label="Workspace Akuisisi dan Penjualan" className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-100/70 p-1">{sections.map(([id, label]) => <button type="button" key={id} aria-current={view === id ? "page" : undefined} onClick={() => changeView(id)} className={`min-h-11 shrink-0 rounded-lg px-4 text-xs font-semibold transition ${view === id ? "bg-white text-[#0B2C6B] shadow-sm" : "text-slate-500 hover:bg-white/60"}`}>{label}</button>)}</nav>
    {view === "followup" && <SalesFollowUpControl onAction={onAction} />}
    {(view === "priorities" || view === "followup") && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-semibold text-slate-950">{view === "followup" ? "Percakapan yang perlu dilanjutkan" : "Langkah berikutnya"}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{view === "followup" ? "Tinjau konteks sebelum mengirim. Klien yang dijeda atau sudah ditangani tidak ditawarkan pengingat." : "Diurutkan berdasarkan status dan tenggat yang tercatat, bukan keputusan AI."}</p></div><label className="relative w-full sm:w-64"><Search size={15} className="absolute left-3 top-3.5 text-slate-400" /><input aria-label="Cari prioritas penjualan" type="search" value={search} onChange={(e) => { setSearch(e.target.value); setLimit(12); }} placeholder="Nama, perusahaan, atau sumber" className="h-11 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs" /></label></div>
      {view === "priorities" && <div className="mt-4 flex flex-wrap gap-2">{[["all", "Semua"], ["inquiry", "Inquiry"], ["proposal", "Proposal"], ["assessment", "Assessment"], ["followup", "Tindak lanjut"], ["pipeline", "Peluang"]].map(([id, label]) => <button type="button" key={id} aria-pressed={filter === id} onClick={() => { setFilter(id); setLimit(12); }} className={`min-h-9 rounded-full px-3 text-xs font-semibold ${filter === id ? "bg-blue-50 text-[#0B2C6B]" : "text-slate-500 hover:bg-slate-50"}`}>{label}</button>)}</div>}
      <div className="mt-4 divide-y divide-slate-100">{visible.slice(0, limit).map((task) => <article key={task.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="text-sm font-semibold text-slate-900">{task.name}</h4><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${task.kind === "proposal" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"}`}>{labels[task.kind]}</span></div><p className="mt-1 truncate text-xs text-slate-500">{task.company} · {task.source}</p><p className="mt-2 text-xs text-slate-700">{task.note}</p></div><button type="button" onClick={() => open(task)} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-[#0B2C6B] hover:bg-blue-50">{task.action} <ArrowRight size={14} /></button></article>)}</div>
      {!visible.length && <div className="py-12 text-center"><CheckCircle2 size={28} className="mx-auto text-emerald-500" /><p className="mt-3 text-sm font-semibold text-slate-900">{search || filter !== "all" ? "Tidak ada yang cocok dengan pencarian" : "Tidak ada prioritas yang menunggu di daftar ini"}</p><p className="mt-2 text-xs text-slate-500">Data ini mengikuti rekaman yang dimuat. Daftar klien dan kampanye tetap dapat dibuka.</p></div>}
      {visible.length > limit && <button type="button" onClick={() => setLimit((value) => value + 12)} className="mt-3 min-h-11 w-full rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">Tampilkan berikutnya ({visible.length - limit})</button>}
    </section>}
    {(view === "inbound" || view === "outbound") && <AcquisitionControlPanel key={view} initialView={view} embedded onAction={onAction} />}
    {view === "clients" && <>
      <div className="flex flex-wrap gap-2">{(["assessment", "inquiry", "discovery"] as const).map((type) => <button type="button" key={type} aria-pressed={clientType === type} onClick={() => { if (type === clientType || mayLeaveMeeting()) setClientType(type); }} className={`min-h-11 rounded-xl px-4 text-xs font-semibold ${clientType === type ? "bg-[#0B2C6B] text-white" : "bg-white text-slate-600"}`}>{type === "assessment" ? "Assessment & proposal" : type === "discovery" ? "Discovery organisasi" : "Inquiry masuk"}</button>)}</div>
      {clientType === "discovery" && <Suspense fallback={<p role="status" className="p-6 text-sm text-slate-600">Memuat kebutuhan program…</p>}><SpinPanel initialSearch={discoverySearch} onUnsavedChange={onMeetingDirty} /></Suspense>}
      {clientType === "assessment" ? <AssessmentPanel initialDetailTab={detailTab} data={data} records={records} query={query} setQuery={setQuery} category={category} setCategory={setCategory} employeeRange={employees} setEmployeeRange={setEmployees} minScore={minScore} setMinScore={setMinScore} expandedId={assessmentId} setExpandedId={setAssessmentId} onAction={onAction} onRefresh={onRefresh} /> : clientType === "inquiry" ? <InquiriesPanel key={inquiryId} initialSelectedId={inquiryId} inquiries={data.inquiries} onAction={onAction} onRefresh={onRefresh} /> : null}
    </>}
    {view === "pipeline" && <PipelinePanel data={data} onAction={onAction} onRefresh={onRefresh} />}
    {view === "meetings" && <MeetingsPanel bookings={data.calendarBookings || []} onOpenChecklist={booking => { setDiscoverySearch(booking.attendeeEmail); setClientType("discovery"); setView("clients"); }} />}
  </div>;
}
