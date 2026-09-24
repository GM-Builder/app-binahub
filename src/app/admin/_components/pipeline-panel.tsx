"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  MailWarning,
  TrendingUp,
  UserRound,
  UserRoundX,
} from "lucide-react";
import type { DashboardData, PipelineLeadRecord } from "../_lib/types";
import { formatDate } from "../_lib/utils";
import { AdminDrawer, AdminInput, AdminSearch, AdminSelect, AdminTextarea, Badge, EmptyState } from "./shared";

const ACTIVE_STAGES = ["identified", "qualified", "consultation", "proposal", "negotiation"] as const;
const CLOSED_STAGES = ["won", "lost"] as const;
const STAGES = [...ACTIVE_STAGES, ...CLOSED_STAGES] as const;

type PipelineStage = typeof STAGES[number];
type PipelineView = "active" | "won" | "lost";

const STAGE_LABELS: Record<PipelineStage, string> = {
  identified: "Teridentifikasi",
  qualified: "Terkualifikasi",
  consultation: "Konsultasi",
  proposal: "Proposal",
  negotiation: "Negosiasi",
  won: "Berhasil",
  lost: "Tidak lanjut",
};

const STAGE_DESCRIPTIONS: Record<PipelineStage, string> = {
  identified: "Lead baru yang perlu ditinjau",
  qualified: "Kebutuhan dan potensi terkonfirmasi",
  consultation: "Diskusi kebutuhan sedang berjalan",
  proposal: "Penawaran sedang disiapkan atau ditinjau",
  negotiation: "Ruang lingkup dan komersial sedang disepakati",
  won: "Peluang berhasil menjadi klien",
  lost: "Peluang ditutup tanpa kesepakatan",
};

type PipelineForm = {
  stage: string;
  owner: string;
  nextAction: string;
  nextActionDueAt: string;
  opportunityValue: string;
  leadTimeZone: string;
  lostReason: string;
  outreachPaused: boolean;
  outreachPauseReason: string;
  note: string;
};

function toLocalDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formFromLead(lead: PipelineLeadRecord): PipelineForm {
  return {
    stage: lead.opportunityStage,
    owner: lead.opportunityOwner || "",
    nextAction: lead.nextAction || "",
    nextActionDueAt: toLocalDateTime(lead.nextActionDueAt),
    opportunityValue: lead.opportunityValue == null ? "" : String(lead.opportunityValue),
    leadTimeZone: lead.leadTimeZone || "Asia/Jakarta",
    lostReason: lead.lostReason || "",
    outreachPaused: lead.outreachPaused,
    outreachPauseReason: lead.outreachPauseReason || "",
    note: "",
  };
}

function rupiah(value: number | null) {
  if (value == null) return "Belum dinilai";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function compactRupiah(value: number) {
  const absolute = Math.abs(value);
  const compact = (divisor: number, suffix: string) => {
    const amount = (value / divisor).toFixed(1).replace(/\.0$/, "").replace(".", ",");
    return `Rp${amount} ${suffix}`;
  };

  if (absolute >= 1_000_000_000_000) return compact(1_000_000_000_000, "triliun");
  if (absolute >= 1_000_000_000) return compact(1_000_000_000, "miliar");
  if (absolute >= 1_000_000) return compact(1_000_000, "jt");
  if (absolute >= 1_000) return compact(1_000, "rb");
  return `Rp${Math.round(value)}`;
}

function isActiveStage(stage: string): stage is typeof ACTIVE_STAGES[number] {
  return ACTIVE_STAGES.includes(stage as typeof ACTIVE_STAGES[number]);
}

function isOverdue(lead: PipelineLeadRecord, now = Date.now()) {
  return Boolean(lead.nextActionDueAt && new Date(lead.nextActionDueAt).getTime() < now);
}

export function isLikelyTestLead(lead: PipelineLeadRecord) {
  const marker = [lead.name, lead.email, lead.company, lead.source].filter(Boolean).join(" ");
  return /@example\.invalid$/i.test(lead.email) || /\bphase\s*1[0-9]\b/i.test(marker) || /\bphase1[0-9][-_]/i.test(marker);
}

export function leadNeedsAttention(lead: PipelineLeadRecord, now = Date.now()) {
  if (!isActiveStage(lead.opportunityStage)) return false;
  if (!lead.opportunityOwner || isOverdue(lead, now)) return true;
  if (lead.opportunityStage !== "identified" && (!lead.nextAction || !lead.nextActionDueAt)) return true;
  return false;
}

function leadPriority(lead: PipelineLeadRecord, now: number) {
  let score = 0;
  if (isOverdue(lead, now)) score += 100;
  if (!lead.opportunityOwner) score += 60;
  if (lead.opportunityStage !== "identified" && (!lead.nextAction || !lead.nextActionDueAt)) score += 45;
  if (lead.nextActionDueAt) {
    const remaining = new Date(lead.nextActionDueAt).getTime() - now;
    if (remaining >= 0 && remaining <= 86_400_000) score += 25;
  }
  if (lead.leadTemperature === "hot") score += 15;
  return score;
}

export function sortPipelineLeads(leads: PipelineLeadRecord[], now = Date.now()) {
  return [...leads].sort((left, right) => {
    const priorityDifference = leadPriority(right, now) - leadPriority(left, now);
    if (priorityDifference) return priorityDifference;
    const dueLeft = left.nextActionDueAt ? new Date(left.nextActionDueAt).getTime() : Number.POSITIVE_INFINITY;
    const dueRight = right.nextActionDueAt ? new Date(right.nextActionDueAt).getTime() : Number.POSITIVE_INFINITY;
    if (dueLeft !== dueRight) return dueLeft - dueRight;
    return (right.opportunityValue || 0) - (left.opportunityValue || 0);
  });
}

function temperatureLabel(value: string) {
  return ({ hot: "Prioritas tinggi", warm: "Potensial", cold: "Tahap awal", new: "Baru", won: "Berhasil" } as Record<string, string>)[value] || value;
}

function activityLabel(value: string) {
  const labels: Record<string, string> = {
    created: "Peluang dibuat",
    stage_changed: "Tahap diperbarui",
    owner_assigned: "Penanggung jawab ditetapkan",
    next_action_updated: "Tindakan berikutnya diperbarui",
    outreach_paused: "Tindak lanjut dijeda",
    outreach_resumed: "Tindak lanjut dilanjutkan",
    converted_to_client: "Dikonversi menjadi klien",
  };
  return labels[value] || value.replaceAll("_", " ");
}

function stageLabel(value: string | null) {
  return value && value in STAGE_LABELS ? STAGE_LABELS[value as PipelineStage] : value || "–";
}

function PipelineMetric({
  label,
  value,
  description,
  icon: Icon,
  tone = "navy",
}: {
  label: string;
  value: string | number;
  description: string;
  icon: typeof CircleDollarSign;
  tone?: "navy" | "gold" | "red" | "green";
}) {
  const tones = {
    navy: "bg-[#EAF0F8] text-[#0B2C6B]",
    gold: "bg-[#FFF8EA] text-[#80560F]",
    red: "bg-rose-50 text-rose-700",
    green: "bg-emerald-50 text-emerald-700",
  };
  return (
    <div className="flex min-w-0 items-start gap-3 border-l border-slate-200 pl-4 first:border-l-0 first:pl-0">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}><Icon size={16} aria-hidden="true" /></span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <p className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950">{value}</p>
        <p className="mt-0.5 truncate text-[10px] text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function PipelineCard({ lead, onOpen }: { lead: PipelineLeadRecord; onOpen: (lead: PipelineLeadRecord) => void }) {
  const overdue = isOverdue(lead);
  const needsAttention = leadNeedsAttention(lead);
  const borderClass = overdue ? "border-rose-200" : needsAttention ? "border-amber-200" : "border-slate-200/80";
  return (
    <article className={`group relative overflow-hidden rounded-2xl border bg-white shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${borderClass}`}>
      <span className={`absolute inset-y-0 left-0 w-1 ${overdue ? "bg-rose-500" : needsAttention ? "bg-[#D9A441]" : "bg-[#0B2C6B]"}`} aria-hidden="true" />
      <div className="p-4 pl-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="truncate text-sm font-bold text-slate-900">{lead.name}</h4>
            <p className="mt-0.5 truncate text-xs text-slate-500">{lead.company || "Perusahaan belum tercatat"}</p>
          </div>
          <p className="shrink-0 text-xs font-bold text-[#0B2C6B]">{lead.opportunityValue == null ? "–" : compactRupiah(lead.opportunityValue)}</p>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge tone={lead.leadTemperature === "hot" ? "red" : lead.leadTemperature === "warm" ? "gold" : lead.opportunityStage === "won" ? "green" : "navy"}>{temperatureLabel(lead.leadTemperature)}</Badge>
          {overdue && <Badge tone="red">Terlambat</Badge>}
          {lead.outreachPaused && <Badge tone="red">Tindak lanjut dijeda</Badge>}
        </div>

        <dl className="mt-3 space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <UserRound size={13} className={`shrink-0 ${lead.opportunityOwner ? "text-slate-400" : "text-amber-600"}`} aria-hidden="true" />
            <dt className="sr-only">Penanggung jawab</dt>
            <dd className={`min-w-0 truncate font-semibold ${lead.opportunityOwner ? "text-slate-700" : "text-amber-700"}`}>{lead.opportunityOwner || "Belum ada penanggung jawab"}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Clock3 size={13} className={`shrink-0 ${overdue ? "text-rose-600" : "text-slate-400"}`} aria-hidden="true" />
            <dt className="sr-only">Tenggat</dt>
            <dd className={`truncate font-semibold ${overdue ? "text-rose-700" : lead.nextActionDueAt ? "text-slate-600" : "text-slate-400"}`}>{lead.nextActionDueAt ? formatDate(lead.nextActionDueAt) : "Belum ada tenggat"}</dd>
          </div>
        </dl>

        <button type="button" onClick={() => onOpen(lead)} className="mt-3 flex w-full items-center gap-2 border-t border-slate-100 pt-3 text-left text-xs text-slate-600 transition hover:text-[#0B2C6B]" aria-label={`Buka detail peluang ${lead.name}`}>
          <span className="min-w-0 flex-1 truncate">{lead.nextAction || "Tentukan tindakan berikutnya"}</span>
          <ArrowRight size={14} className="shrink-0" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

export function PipelinePanel({
  data,
  onAction,
  onRefresh,
}: {
  data: DashboardData;
  onAction: (url: string, init?: RequestInit) => Promise<unknown>;
  onRefresh: () => Promise<void>;
}) {
  const leads = useMemo(() => data.pipelineLeads || [], [data.pipelineLeads]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<PipelineView>("active");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [mobileStage, setMobileStage] = useState<PipelineStage>("identified");
  const [selected, setSelected] = useState<PipelineLeadRecord | null>(null);
  const [form, setForm] = useState<PipelineForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const operationalLeads = useMemo(() => leads.filter((lead) => !isLikelyTestLead(lead)), [leads]);
  const owners = useMemo(() => Array.from(new Set(operationalLeads.map((lead) => lead.opportunityOwner).filter(Boolean) as string[])).sort(), [operationalLeads]);
  const activeLeads = useMemo(() => operationalLeads.filter((lead) => isActiveStage(lead.opportunityStage)), [operationalLeads]);
  const pipelineValue = useMemo(() => activeLeads.reduce((sum, lead) => sum + (lead.opportunityValue || 0), 0), [activeLeads]);
  const overdueCount = useMemo(() => activeLeads.filter((lead) => isOverdue(lead)).length, [activeLeads]);
  const unassignedCount = useMemo(() => activeLeads.filter((lead) => !lead.opportunityOwner).length, [activeLeads]);
  const attentionCount = useMemo(() => activeLeads.filter((lead) => leadNeedsAttention(lead)).length, [activeLeads]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("id-ID");
    return sortPipelineLeads(operationalLeads.filter((lead) => {
      const matchesSearch = !keyword || [lead.name, lead.email, lead.company, lead.industry, lead.location, lead.opportunityOwner, lead.nextAction]
        .join(" ").toLocaleLowerCase("id-ID").includes(keyword);
      const matchesOwner = ownerFilter === "all" || (ownerFilter === "unassigned" ? !lead.opportunityOwner : lead.opportunityOwner === ownerFilter);
      return matchesSearch && matchesOwner && (!attentionOnly || leadNeedsAttention(lead));
    }));
  }, [attentionOnly, operationalLeads, ownerFilter, search]);

  const displayStages: PipelineStage[] = view === "active" ? [...ACTIVE_STAGES] : [view];
  const mobileDisplayStage = view === "active" ? mobileStage : view;
  const activities = useMemo(() => (data.opportunityActivities || []).filter((item) => item.leadId === selected?.id).slice(0, 20), [data.opportunityActivities, selected?.id]);
  const activeFormStage = Boolean(form && ["qualified", "consultation", "proposal", "negotiation"].includes(form.stage));
  const formInvalid = !form
    || (form.stage !== "identified" && !form.owner.trim())
    || (activeFormStage && (!form.nextAction.trim() || !form.nextActionDueAt))
    || (form.stage === "lost" && form.lostReason.trim().length < 5);

  const openEditor = (lead: PipelineLeadRecord) => {
    setSelected(lead);
    setForm(formFromLead(lead));
    setError("");
  };
  const closeEditor = () => {
    setSelected(null);
    setForm(null);
    setError("");
  };
  const save = async () => {
    if (!selected || !form) return;
    setSaving(true);
    setError("");
    try {
      await onAction("/api/admin/pipeline", {
        method: "PATCH",
        body: JSON.stringify({
          leadId: selected.id,
          ...form,
          owner: form.owner || null,
          nextAction: form.nextAction || null,
          nextActionDueAt: form.nextActionDueAt ? new Date(form.nextActionDueAt).toISOString() : null,
          opportunityValue: form.opportunityValue === "" ? null : Number(form.opportunityValue),
          lostReason: form.lostReason || null,
          outreachPauseReason: form.outreachPauseReason || null,
          note: form.note || null,
        }),
      });
      closeEditor();
      await onRefresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Peluang gagal diperbarui.");
    } finally {
      setSaving(false);
    }
  };

  const viewCounts = {
    active: activeLeads.length,
    won: operationalLeads.filter((lead) => lead.opportunityStage === "won").length,
    lost: operationalLeads.filter((lead) => lead.opportunityStage === "lost").length,
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs" aria-labelledby="pipeline-overview-title">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#80560F]">Ringkasan komersial</p>
            <h2 id="pipeline-overview-title" className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Kondisi pipeline saat ini</h2>
            <p className="mt-1 text-sm text-slate-500">Lihat nilai aktif dan hambatan yang perlu dibereskan sebelum membuka board.</p>
          </div>
          <p className="text-xs font-semibold text-slate-400">{activeLeads.length} peluang aktif</p>
        </div>
        <div className="grid grid-cols-2 gap-5 px-5 py-5 sm:px-6 xl:grid-cols-4">
          <PipelineMetric label="Nilai pipeline aktif" value={compactRupiah(pipelineValue)} description={`${activeLeads.length} peluang dalam proses`} icon={CircleDollarSign} />
          <PipelineMetric label="Perlu tindakan" value={attentionCount} description="Tanpa owner, tindakan, atau tenggat" icon={AlertTriangle} tone={attentionCount ? "gold" : "green"} />
          <PipelineMetric label="Tenggat terlewat" value={overdueCount} description="Tindakan yang perlu segera diselesaikan" icon={CalendarClock} tone={overdueCount ? "red" : "green"} />
          <PipelineMetric label="Belum ada owner" value={unassignedCount} description="Peluang yang perlu ditugaskan" icon={UserRoundX} tone={unassignedCount ? "gold" : "green"} />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_-58px_rgba(7,27,61,0.65)]" aria-labelledby="sales-pipeline-title">
        <div className="border-b border-slate-200 px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#80560F]">Ruang kerja penjualan</p>
              <h2 id="sales-pipeline-title" className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Alur peluang</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">Tentukan penanggung jawab dan tindakan berikutnya agar setiap peluang terus bergerak.</p>
            </div>
            <div className="inline-flex w-full rounded-xl bg-slate-100 p-1 sm:w-auto" role="group" aria-label="Tampilan pipeline">
              {([[
                "active", "Aktif",
              ], ["won", "Berhasil"], ["lost", "Tidak lanjut"]] as Array<[PipelineView, string]>).map(([key, label]) => (
                <button key={key} type="button" onClick={() => setView(key)} aria-pressed={view === key} className={`min-h-10 flex-1 rounded-lg px-3.5 text-xs font-bold transition sm:flex-none ${view === key ? "bg-white text-[#0B2C6B] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                  {label} <span className="ml-1 text-[10px] opacity-60">{viewCounts[key]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(260px,1fr)_220px_auto]">
            <AdminSearch value={search} onChange={setSearch} placeholder="Cari nama, perusahaan, owner, atau tindakan…" />
            <AdminSelect ariaLabel="Filter penanggung jawab" value={ownerFilter} onChange={setOwnerFilter} options={[["all", "Semua penanggung jawab"], ["unassigned", "Belum ditugaskan"], ...owners.map((owner) => [owner, owner] as [string, string])]} />
            <button type="button" onClick={() => setAttentionOnly((current) => !current)} aria-pressed={attentionOnly} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-semibold transition ${attentionOnly ? "border-amber-300 bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
              <AlertTriangle size={15} aria-hidden="true" /> Perlu tindakan {attentionOnly && `(${attentionCount})`}
            </button>
          </div>

          {view === "active" && (
            <label className="mt-4 block lg:hidden">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Tahap yang ditampilkan</span>
              <AdminSelect ariaLabel="Pilih tahap pipeline" value={mobileStage} onChange={(value) => setMobileStage(value as PipelineStage)} options={ACTIVE_STAGES.map((stage) => [stage, `${STAGE_LABELS[stage]} (${filtered.filter((lead) => lead.opportunityStage === stage).length})`])} />
            </label>
          )}
        </div>

        {!operationalLeads.length ? (
          <EmptyState title="Belum ada peluang operasional" description="Peluang baru dari assessment, inquiry, atau konsultasi akan muncul di sini." />
        ) : view === "active" ? (
          <>
            <div className="hidden overflow-x-auto px-4 pb-5 pt-4 lg:block" tabIndex={0} aria-label="Board pipeline aktif; geser secara horizontal untuk melihat tahap berikutnya">
              <div className="grid min-w-max grid-flow-col auto-cols-[300px] gap-3 xl:auto-cols-[minmax(300px,1fr)]">
                {displayStages.map((stage) => {
                  const stageLeads = filtered.filter((lead) => lead.opportunityStage === stage);
                  const stageValue = stageLeads.reduce((sum, lead) => sum + (lead.opportunityValue || 0), 0);
                  return (
                    <section key={stage} className="flex min-h-[420px] flex-col rounded-2xl border border-slate-200 bg-slate-50/60" aria-labelledby={`pipeline-stage-${stage}`}>
                      <div className="border-b border-slate-200 px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">Tahap {ACTIVE_STAGES.indexOf(stage as typeof ACTIVE_STAGES[number]) + 1}</p><h3 id={`pipeline-stage-${stage}`} className="mt-1 text-sm font-semibold text-[#0B2C6B]">{STAGE_LABELS[stage]}</h3><p className="mt-1 text-[11px] leading-4 text-slate-500">{STAGE_DESCRIPTIONS[stage]}</p></div>
                          <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white px-2 text-xs font-bold text-slate-600 shadow-sm">{stageLeads.length}</span>
                        </div>
                        <p className="mt-3 text-xs font-bold text-slate-700">{compactRupiah(stageValue)}</p>
                      </div>
                      <div className="flex-1 space-y-3 p-3">
                        {stageLeads.length ? stageLeads.map((lead) => <PipelineCard key={lead.id} lead={lead} onOpen={openEditor} />) : <p className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-xs leading-5 text-slate-400">Belum ada peluang pada tahap ini.</p>}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 p-4 lg:hidden">
              <div className="mb-4 flex items-end justify-between gap-4"><div><h3 className="text-sm font-bold text-[#0B2C6B]">{STAGE_LABELS[mobileDisplayStage]}</h3><p className="mt-1 text-xs text-slate-500">{STAGE_DESCRIPTIONS[mobileDisplayStage]}</p></div><span className="text-xs font-bold text-slate-500">{filtered.filter((lead) => lead.opportunityStage === mobileDisplayStage).length} peluang</span></div>
              {filtered.filter((lead) => lead.opportunityStage === mobileDisplayStage).map((lead) => <PipelineCard key={lead.id} lead={lead} onOpen={openEditor} />)}
              {!filtered.some((lead) => lead.opportunityStage === mobileDisplayStage) && <p className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-xs text-slate-400">Belum ada peluang pada tahap ini.</p>}
            </div>
          </>
        ) : (
          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3 xl:p-6">
            {filtered.filter((lead) => lead.opportunityStage === view).map((lead) => <PipelineCard key={lead.id} lead={lead} onOpen={openEditor} />)}
            {!filtered.some((lead) => lead.opportunityStage === view) && <div className="sm:col-span-2 xl:col-span-3"><EmptyState title={view === "won" ? "Belum ada peluang berhasil" : "Belum ada peluang yang ditutup"} description="Hasil peluang akan muncul di sini setelah tahapnya diperbarui." /></div>}
          </div>
        )}
      </section>

      <details className="group overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-bold text-[#0B2C6B] marker:hidden">
          <span className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100"><MailWarning size={16} aria-hidden="true" /></span><span>Kesehatan pengiriman email<span className="mt-0.5 block text-xs font-normal text-slate-500">Informasi pendukung tindak lanjut</span></span></span>
          <span className="flex items-center gap-2 text-xs text-slate-500">{data.summary.deliverabilityAlerts || 0} perlu perhatian <ChevronDown size={16} className="transition group-open:rotate-180" aria-hidden="true" /></span>
        </summary>
        <div className="grid gap-px border-t border-slate-200 bg-slate-200 sm:grid-cols-3 xl:grid-cols-6">
          {[
            ["Terkirim", data.emailDeliverySummary?.delivered || 0],
            ["Balasan masuk", data.emailDeliverySummary?.received || 0],
            ["Terpental", data.emailDeliverySummary?.bounced || 0],
            ["Keluhan", data.emailDeliverySummary?.complained || 0],
            ["Gagal dikirim", data.emailDeliverySummary?.failed || 0],
            ["Perlu diproses ulang", data.emailDeliverySummary?.processingFailed || 0],
          ].map(([label, value]) => <div key={label} className="bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-xl font-bold text-slate-900">{value}</p></div>)}
        </div>
      </details>

      {selected && form && (
        <AdminDrawer title={selected.name} eyebrow="Detail peluang" onClose={closeEditor}>
          <div className="mb-6 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-3">
            <div className="bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Perusahaan</p><p className="mt-1 text-sm font-bold text-slate-900">{selected.company || "Belum tercatat"}</p></div>
            <div className="bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nilai peluang</p><p className="mt-1 text-sm font-bold text-slate-900">{rupiah(selected.opportunityValue)}</p></div>
            <div className="bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tahap saat ini</p><p className="mt-1 text-sm font-bold text-slate-900">{stageLabel(selected.opportunityStage)}</p></div>
          </div>
          <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
            <div className="space-y-4">
              {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
              <div><p className="text-sm font-semibold text-slate-950">Langkah berikutnya</p><p className="mt-1 text-xs text-slate-500">Pastikan peluang memiliki PIC, tindakan konkret, dan tenggat yang jelas.</p></div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Tahap peluang</span><AdminSelect ariaLabel="Tahap peluang" value={form.stage} onChange={(stage) => setForm({ ...form, stage })} options={STAGES.map((stage) => [stage, STAGE_LABELS[stage]])} /></label>
                <AdminInput label="Penanggung jawab" value={form.owner} onChange={(owner) => setForm({ ...form, owner })} placeholder="nama@binahub.id" />
                <div className="md:col-span-2"><AdminTextarea label="Tindakan berikutnya" value={form.nextAction} onChange={(nextAction) => setForm({ ...form, nextAction })} placeholder="Tuliskan tindakan konkret berikutnya dan siapa yang menunggu siapa." /></div>
                <AdminInput label="Tenggat tindakan" type="datetime-local" value={form.nextActionDueAt} onChange={(nextActionDueAt) => setForm({ ...form, nextActionDueAt })} />
                {form.stage === "lost" && <AdminInput label="Alasan tidak lanjut" value={form.lostReason} onChange={(lostReason) => setForm({ ...form, lostReason })} placeholder="Jelaskan alasan keputusan" />}
              </div>
              <details className="group rounded-xl border border-slate-200 bg-white">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-xs font-semibold text-slate-700 marker:hidden">Informasi tambahan <ChevronDown size={15} className="text-slate-400 transition group-open:rotate-180" /></summary>
                <div className="grid gap-4 border-t border-slate-100 p-4 md:grid-cols-2"><AdminInput label="Nilai peluang" type="number" value={form.opportunityValue} onChange={(opportunityValue) => setForm({ ...form, opportunityValue })} placeholder="0" /><AdminInput label="Zona waktu klien" value={form.leadTimeZone} onChange={(leadTimeZone) => setForm({ ...form, leadTimeZone })} /><div className="md:col-span-2"><AdminTextarea label="Catatan keputusan" value={form.note} onChange={(note) => setForm({ ...form, note })} placeholder="Tambahkan konteks agar keputusan mudah dipahami tim." /></div></div>
              </details>
              <details className="group rounded-xl border border-slate-200 bg-white">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-xs font-semibold text-slate-700 marker:hidden">Pengaturan tindak lanjut <span className="flex items-center gap-2 text-[10px] font-normal text-slate-400">{form.outreachPaused ? "Dijeda" : "Berjalan"}<ChevronDown size={15} className="transition group-open:rotate-180" /></span></summary>
                <div className="border-t border-slate-100 p-4"><label className="flex items-start gap-3 text-sm font-semibold text-slate-800"><input type="checkbox" checked={form.outreachPaused} onChange={(event) => setForm({ ...form, outreachPaused: event.target.checked })} className="mt-1" /><span>Jeda tindak lanjut otomatis<span className="mt-1 block text-xs font-normal leading-relaxed text-slate-600">Gunakan ketika klien sudah membalas, sedang berkonsultasi, atau memerlukan penanganan khusus.</span></span></label>{form.outreachPaused && <div className="mt-3"><AdminInput label="Alasan jeda" value={form.outreachPauseReason} onChange={(outreachPauseReason) => setForm({ ...form, outreachPauseReason })} /></div>}</div>
              </details>
              {formInvalid && <p role="status" className="text-xs leading-relaxed text-amber-700">Peluang yang sedang berjalan wajib memiliki penanggung jawab, tindakan berikutnya, dan tenggat. Peluang tidak lanjut wajib memiliki alasan.</p>}
              <button type="button" disabled={saving || formInvalid} onClick={() => void save()} className="w-full rounded-xl bg-[#0B2C6B] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#071B3D] disabled:cursor-not-allowed disabled:opacity-45">{saving ? "Menyimpan…" : "Simpan perubahan"}</button>
            </div>
            <aside aria-labelledby="opportunity-activity-title">
              <div className="mb-3 flex items-center gap-2"><TrendingUp size={16} className="text-[#D9A441]" aria-hidden="true" /><h3 id="opportunity-activity-title" className="text-sm font-bold text-slate-900">Riwayat peluang</h3></div>
              <div className="space-y-3">
                {activities.length ? activities.map((activity) => (
                  <article key={activity.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-bold text-[#0B2C6B]">{activityLabel(activity.eventType)}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{activity.note || `${stageLabel(activity.fromStage)} → ${stageLabel(activity.toStage)}`}</p>
                    <p className="mt-2 text-[10px] text-slate-400">{activity.actor} · {formatDate(activity.createdAt)}</p>
                  </article>
                )) : <p className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-500">Belum ada aktivitas tercatat.</p>}
              </div>
            </aside>
          </div>
        </AdminDrawer>
      )}
    </div>
  );
}
