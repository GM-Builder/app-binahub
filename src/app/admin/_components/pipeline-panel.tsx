"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Check,
  ChevronDown,
  CircleDollarSign,
  Columns3,
  List,
  MailWarning,
  Pause,
  SlidersHorizontal,
  UserRoundX,
  X,
} from "lucide-react";
import type { DashboardData, PipelineLeadRecord } from "../_lib/types";
import {
  ACTIVE_STAGES,
  STAGES,
  STAGE_LABELS,
  compactRupiah,
  isActiveStage,
  isLikelyTestLead,
  isOverdue,
  leadNeedsAttention,
  matchesPriority,
  sortPipelineLeads,
  sourceLabel,
  type PipelineView,
  type PriorityFilter,
} from "../_lib/pipeline-model";
import { AdminSearch, AdminSelect, EmptyState } from "./shared";
import { PipelineColumn, PipelineList } from "./pipeline-views";
import { PipelineDrawer } from "./pipeline-drawer";

export {
  isLikelyTestLead,
  leadNeedsAttention,
  sortPipelineLeads,
} from "../_lib/pipeline-model";
const PRIORITIES: [PriorityFilter, string][] = [
  ["all", "Semua peluang"],
  ["attention", "Perlu perhatian"],
  ["overdue", "Lewat tenggat"],
  ["unassigned", "Belum ada PIC"],
  ["paused", "Tindak lanjut dijeda"],
];

export function PipelinePanel({
  data,
  onAction,
  onRefresh,
}: {
  data: DashboardData;
  onAction: (url: string, init?: RequestInit) => Promise<unknown>;
  onRefresh: () => Promise<void>;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<PipelineView>("active");
  const [layout, setLayout] = useState<"board" | "list">("board");
  const [priority, setPriority] = useState<PriorityFilter>("all");
  const [owner, setOwner] = useState("all");
  const [source, setSource] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [sort, setSort] = useState("priority");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [selected, setSelected] = useState<PipelineLeadRecord | null>(null);
  const [notice, setNotice] = useState("");
  const allLeads = useMemo(
    () => data.pipelineLeads || [],
    [data.pipelineLeads],
  );
  const leads = useMemo(
    () => allLeads.filter((lead) => showTests || !isLikelyTestLead(lead)),
    [allLeads, showTests],
  );
  const owners = useMemo(
    () =>
      [
        ...new Set(
          leads
            .map((lead) => lead.opportunityOwner)
            .filter((value): value is string => Boolean(value)),
        ),
      ].sort(),
    [leads],
  );
  const sources = useMemo(
    () => [...new Set(leads.map((lead) => lead.source || ""))].sort(),
    [leads],
  );
  const active = leads.filter((lead) => isActiveStage(lead.opportunityStage));
  const counts = {
    all: active.length,
    attention: active.filter((lead) => leadNeedsAttention(lead, now)).length,
    overdue: active.filter((lead) => isOverdue(lead, now)).length,
    unassigned: active.filter((lead) => !lead.opportunityOwner?.trim()).length,
    paused: active.filter((lead) => lead.outreachPaused).length,
  };
  const views = {
    active: active.length,
    won: leads.filter((lead) => lead.opportunityStage === "won").length,
    lost: leads.filter((lead) => lead.opportunityStage === "lost").length,
    review: leads.filter(
      (lead) =>
        !STAGES.includes(lead.opportunityStage as (typeof STAGES)[number]),
    ).length,
  };
  const pipelineValue = active.reduce(
    (sum, lead) => sum + (lead.opportunityValue || 0),
    0,
  );
  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("id-ID");
    const result = leads.filter((lead) => {
      const inView =
        view === "active"
          ? isActiveStage(lead.opportunityStage)
          : view === "review"
            ? !STAGES.includes(lead.opportunityStage as (typeof STAGES)[number])
            : lead.opportunityStage === view;
      return (
        inView &&
        (!keyword ||
          [
            lead.name,
            lead.email,
            lead.company,
            lead.opportunityOwner,
            lead.nextAction,
            sourceLabel(lead.source),
            lead.industry,
            lead.location,
          ]
            .join(" ")
            .toLocaleLowerCase("id-ID")
            .includes(keyword)) &&
        (owner === "all" ||
          (owner === "unassigned"
            ? !lead.opportunityOwner?.trim()
            : lead.opportunityOwner === owner)) &&
        (source === "all" || (lead.source || "") === source) &&
        (stageFilter === "all" ||
          view !== "active" ||
          lead.opportunityStage === stageFilter) &&
        matchesPriority(lead, priority, now)
      );
    });
    if (sort === "value")
      return result.sort(
        (a, b) => (b.opportunityValue || 0) - (a.opportunityValue || 0),
      );
    if (sort === "newest")
      return result.sort(
        (a, b) =>
          (Date.parse(b.createdAt || "") || 0) -
          (Date.parse(a.createdAt || "") || 0),
      );
    return sortPipelineLeads(result, now);
  }, [leads, now, owner, priority, search, sort, source, stageFilter, view]);
  const filterCount =
    Number(owner !== "all") +
    Number(source !== "all") +
    Number(stageFilter !== "all") +
    Number(showTests);
  const hasFilters = Boolean(search || filterCount || priority !== "all");
  const clearFilters = () => {
    setSearch("");
    setOwner("all");
    setSource("all");
    setStageFilter("all");
    setPriority("all");
    setShowTests(false);
  };
  const chooseView = (next: PipelineView) => {
    setView(next);
    setPriority("all");
    setStageFilter("all");
  };
  const choosePriority = (next: PriorityFilter) => {
    clearFilters();
    setView("active");
    setPriority(next);
  };
  const resetKey = `${view}|${search}|${owner}|${source}|${priority}|${stageFilter}|${sort}|${showTests}`;
  const coverage = data.salesFunnelCoverage;
  const unavailable =
    coverage?.loadError || coverage?.stageDataAvailable === false;
  const partial =
    coverage && coverage.total != null && coverage.total > coverage.loaded;

  return (
    <div className="min-w-0 space-y-5">
      {notice && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          <Check size={17} className="mt-0.5 shrink-0" />
          <p className="flex-1">{notice}</p>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Tutup pemberitahuan"
            className="p-1"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {unavailable ? (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          Data pipeline belum dapat dimuat secara lengkap. Perbarui halaman
          untuk mencoba kembali; angka di bawah bukan total penjualan.
        </div>
      ) : partial ? (
        <p
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"
        >
          Menampilkan {coverage.loaded} dari {coverage.total} peluang. Ringkasan
          dan filter hanya mencakup data yang dimuat.
        </p>
      ) : null}
      <section
        aria-label="Ringkasan pipeline"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {[
          {
            label: "Nilai peluang aktif",
            value: compactRupiah(pipelineValue),
            description: `${active.length} peluang · ${active.filter((lead) => lead.opportunityValue != null).length} memiliki nilai`,
            icon: CircleDollarSign,
            filter: "all",
            tone: "text-[#0B2C6B] bg-[#EDF2FB]",
          },
          {
            label: "Perlu perhatian",
            value: counts.attention,
            description: "PIC, tindakan, atau tenggat",
            icon: AlertTriangle,
            filter: "attention",
            tone: "text-amber-700 bg-amber-50",
          },
          {
            label: "Lewat tenggat",
            value: counts.overdue,
            description: "Prioritaskan tindak lanjut",
            icon: CalendarClock,
            filter: "overdue",
            tone: "text-rose-700 bg-rose-50",
          },
          {
            label: "Belum ada PIC",
            value: counts.unassigned,
            description: "Tentukan penanggung jawab",
            icon: UserRoundX,
            filter: "unassigned",
            tone: "text-violet-700 bg-violet-50",
          },
        ].map(({ label, value, description, icon: Icon, filter, tone }) => (
          <button
            type="button"
            key={label}
            onClick={() => choosePriority(filter as PriorityFilter)}
            aria-label={`${label}: ${unavailable ? "belum tersedia" : value}. Tampilkan peluang`}
            disabled={Boolean(unavailable)}
            className="group rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-xs transition hover:border-[#0B2C6B]/30 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2C6B] sm:p-5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-600">
                {label}
              </span>
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${tone}`}
              >
                <Icon size={16} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              {unavailable ? "—" : value}
            </p>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              {description}
            </p>
          </button>
        ))}
      </section>
      <section
        aria-labelledby="sales-pipeline-title"
        className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 pb-4 pt-5 sm:px-5">
          <div className="min-w-0 flex-1">
            <h2
              id="sales-pipeline-title"
              className="text-base font-semibold tracking-tight text-slate-950"
            >
              Peluang penjualan
            </h2>
            <p className="mt-1 hidden text-xs text-slate-500 sm:block">
              Dari percakapan pertama hingga kesepakatan.
            </p>
          </div>
          <Link
            href="/admin/acquisition"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <span className="hidden sm:inline">Buka akuisisi</span>
            <span className="sm:hidden">Akuisisi</span>{" "}
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 sm:gap-3 sm:px-5">
          <div
            role="group"
            aria-label="Status peluang"
            className="flex min-w-0 flex-wrap gap-2 sm:gap-6"
          >
            {(
              [
                ["active", "Aktif"],
                ["won", "Berhasil"],
                ["lost", "Tidak lanjut"],
                ...(views.review ? [["review", "Perlu ditinjau"]] : []),
              ] as [PipelineView, string][]
            ).map(([key, label]) => (
              <button
                type="button"
                key={key}
                aria-pressed={view === key}
                onClick={() => chooseView(key)}
                className={`flex min-h-12 items-center gap-2 border-b-2 text-xs font-semibold transition ${view === key ? "border-[#0B2C6B] text-[#0B2C6B]" : "border-transparent text-slate-500 hover:text-slate-900"}`}
              >
                {label}{" "}
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] ${view === key ? "bg-[#EDF2FB]" : "bg-slate-100"}`}
                >
                  {unavailable ? "—" : views[key]}
                </span>
              </button>
            ))}
          </div>
          <div
            role="group"
            aria-label="Tampilan pipeline"
            className="mb-2 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 sm:mb-0"
          >
            <button
              type="button"
              onClick={() => setLayout("board")}
              aria-pressed={layout === "board"}
              aria-label="Tampilan papan"
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-xs font-medium ${layout === "board" ? "bg-white text-[#0B2C6B] shadow-xs" : "text-slate-500"}`}
            >
              <Columns3 size={14} />
              <span className="hidden sm:inline">Papan</span>
            </button>
            <button
              type="button"
              onClick={() => setLayout("list")}
              aria-pressed={layout === "list"}
              aria-label="Tampilan daftar"
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-xs font-medium ${layout === "list" ? "bg-white text-[#0B2C6B] shadow-xs" : "text-slate-500"}`}
            >
              <List size={14} />
              <span className="hidden sm:inline">Daftar</span>
            </button>
          </div>
        </div>
        <div className="space-y-3 px-4 py-4 sm:px-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:flex">
            <div className="min-w-0 flex-1">
              <AdminSearch
                value={search}
                onChange={setSearch}
                placeholder="Cari nama, perusahaan, atau email…"
              />
            </div>
            <button
              type="button"
              aria-expanded={filtersOpen}
              aria-controls="pipeline-filters"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold ${filtersOpen || filterCount ? "border-[#0B2C6B]/25 bg-[#EDF2FB] text-[#0B2C6B]" : "border-slate-200 text-slate-600"}`}
            >
              <SlidersHorizontal size={14} />
              Filter{" "}
              {filterCount ? (
                <span className="rounded bg-white px-1.5">{filterCount}</span>
              ) : null}
            </button>
            <div className="hidden sm:block sm:w-44">
              <AdminSelect
                ariaLabel="Urutan peluang"
                value={sort}
                onChange={setSort}
                options={[
                  ["priority", "Prioritas tindakan"],
                  ["value", "Nilai tertinggi"],
                  ["newest", "Peluang terbaru"],
                ]}
              />
            </div>
          </div>
          {filtersOpen && (
            <div
              id="pipeline-filters"
              className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3"
            >
              <label className="space-y-1.5 text-xs font-medium text-slate-600">
                <span>Penanggung jawab</span>
                <AdminSelect
                  ariaLabel="Filter penanggung jawab"
                  value={owner}
                  onChange={setOwner}
                  options={[
                    ["all", "Semua PIC"],
                    ["unassigned", "Belum ada PIC"],
                    ...owners.map(
                      (value) => [value, value] as [string, string],
                    ),
                  ]}
                />
              </label>
              <label className="space-y-1.5 text-xs font-medium text-slate-600">
                <span>Sumber peluang</span>
                <AdminSelect
                  ariaLabel="Filter sumber peluang"
                  value={source}
                  onChange={setSource}
                  options={[
                    ["all", "Semua sumber"],
                    ...sources.map(
                      (value) =>
                        [value, sourceLabel(value)] as [string, string],
                    ),
                  ]}
                />
              </label>
              <label className="space-y-1.5 text-xs font-medium text-slate-600">
                <span>Tahap penjualan</span>
                <AdminSelect
                  disabled={view !== "active"}
                  ariaLabel="Filter tahap peluang"
                  value={stageFilter}
                  onChange={setStageFilter}
                  options={[
                    ["all", "Semua tahap aktif"],
                    ...ACTIVE_STAGES.map(
                      (value) =>
                        [value, STAGE_LABELS[value]] as [string, string],
                    ),
                  ]}
                />
              </label>
              <label className="flex min-h-9 items-center gap-2 text-xs text-slate-600 sm:col-span-3">
                <input
                  type="checkbox"
                  checked={showTests}
                  onChange={(event) => setShowTests(event.target.checked)}
                  className="h-4 w-4 accent-[#0B2C6B]"
                />
                Sertakan data uji internal yang dikenali
              </label>
              <label className="space-y-1.5 text-xs font-medium text-slate-600 sm:hidden">
                <span>Urutan peluang</span>
                <AdminSelect
                  ariaLabel="Urutan peluang di ponsel"
                  value={sort}
                  onChange={setSort}
                  options={[
                    ["priority", "Prioritas tindakan"],
                    ["value", "Nilai tertinggi"],
                    ["newest", "Peluang terbaru"],
                  ]}
                />
              </label>
            </div>
          )}
          <div
            className="flex items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible"
            role="group"
            aria-label="Prioritas peluang"
          >
            {view === "active" &&
              PRIORITIES.map(([key, label]) => (
                <button
                  type="button"
                  key={key}
                  aria-pressed={priority === key}
                  onClick={() => setPriority(key)}
                  className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-[11px] font-medium transition ${priority === key ? "border-[#0B2C6B] bg-[#0B2C6B] text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                >
                  {key === "paused" ? <Pause size={11} /> : null}
                  {label}
                  <span className="opacity-70">
                    {unavailable ? "—" : counts[key]}
                  </span>
                </button>
              ))}
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex min-h-10 shrink-0 items-center gap-1 whitespace-nowrap px-2 text-xs font-medium text-slate-500 hover:text-[#0B2C6B]"
              >
                <X size={12} />
                Reset filter
              </button>
            )}
          </div>
          {layout === "board" && view === "active" && (
            <label className="block space-y-1.5 text-xs font-medium text-slate-600 sm:hidden">
              <span>Lompat ke tahap</span>
              <AdminSelect
                ariaLabel="Pilih tahap papan"
                value={stageFilter}
                onChange={setStageFilter}
                options={[
                  ["all", "Semua tahap · geser papan"],
                  ...ACTIVE_STAGES.map(
                    (stage) =>
                      [
                        stage,
                        `${STAGE_LABELS[stage]} (${active.filter((lead) => lead.opportunityStage === stage).length})`,
                      ] as [string, string],
                  ),
                ]}
              />
            </label>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-y border-slate-100 bg-slate-50/70 px-4 py-2.5 text-[11px] text-slate-500 sm:px-5">
          <p role="status" aria-live="polite">
            {unavailable
              ? "Data belum tersedia"
              : `${filtered.length} peluang ditampilkan`}
            <span className="mx-2 text-slate-300">·</span>
            {unavailable
              ? "—"
              : compactRupiah(
                  filtered.reduce(
                    (sum, lead) => sum + (lead.opportunityValue || 0),
                    0,
                  ),
                )}{" "}
            nilai tercatat
          </p>
          <p className="hidden sm:block">
            Klik peluang untuk detail dan langkah berikutnya
          </p>
        </div>
        {unavailable ? (
          <EmptyState
            title="Pipeline belum tersedia"
            description="Gunakan tombol Perbarui pada halaman untuk memuat ulang data."
          />
        ) : !filtered.length ? (
          <div className="py-8">
            <EmptyState
              title={
                hasFilters
                  ? "Tidak ada peluang yang cocok"
                  : "Belum ada peluang pada bagian ini"
              }
              description={
                hasFilters
                  ? "Coba kata kunci lain atau reset filter untuk melihat peluang lainnya."
                  : "Peluang dari Self Diagnostic dan akuisisi akan tampil di sini. Pilih status lain untuk melihat hasil penjualan."
              }
            />
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mx-auto mt-2 block rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-[#0B2C6B]"
              >
                Tampilkan semua peluang
              </button>
            )}
          </div>
        ) : layout === "board" && view === "active" ? (
          <div
            className="overflow-x-auto overscroll-x-contain bg-[#F8FAFD] p-3 sm:p-4"
            tabIndex={0}
            aria-label="Papan peluang; geser untuk melihat semua tahap"
          >
            <div
              className="grid grid-flow-col auto-cols-[minmax(250px,1fr)] gap-3"
              style={{ minWidth: stageFilter === "all" ? 1300 : 0 }}
            >
              {ACTIVE_STAGES.filter(
                (stage) => stageFilter === "all" || stage === stageFilter,
              ).map((stage) => (
                <PipelineColumn
                  key={`${resetKey}|${stage}`}
                  stage={stage}
                  leads={filtered.filter(
                    (lead) => lead.opportunityStage === stage,
                  )}
                  now={now}
                  onOpen={setSelected}
                />
              ))}
            </div>
          </div>
        ) : (
          <PipelineList
            key={resetKey}
            leads={filtered}
            now={now}
            onOpen={setSelected}
            cardsOnly={layout === "board"}
          />
        )}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-3 text-[11px] text-slate-500 sm:px-5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Posisi peluang saat ini, bukan tingkat konversi
          {!showTests && (
            <span className="sm:ml-auto">
              Data uji internal yang dikenali disembunyikan
            </span>
          )}
        </div>
      </section>
      <details className="group rounded-2xl border border-slate-200/80 bg-white">
        <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-xs font-semibold text-slate-700 marker:hidden sm:px-5">
          <span className="flex items-center gap-2">
            <MailWarning size={16} className="text-slate-400" />
            Kesehatan pengiriman email
          </span>
          <span className="flex items-center gap-2 text-[11px] font-normal text-slate-500">
            {data.summary.deliverabilityAlerts || 0} perlu ditinjau
            <ChevronDown
              size={14}
              className="transition group-open:rotate-180"
            />
          </span>
        </summary>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-b-2xl border-t border-slate-100 bg-slate-100 sm:grid-cols-3 xl:grid-cols-6">
          {[
            ["Terkirim", data.emailDeliverySummary?.delivered],
            ["Balasan", data.emailDeliverySummary?.received],
            ["Terpental", data.emailDeliverySummary?.bounced],
            ["Keluhan", data.emailDeliverySummary?.complained],
            ["Gagal", data.emailDeliverySummary?.failed],
            ["Proses ulang", data.emailDeliverySummary?.processingFailed],
          ].map(([label, value]) => (
            <div key={label} className="bg-white p-4">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-1 text-xl font-semibold">{value || 0}</p>
            </div>
          ))}
        </div>
      </details>
      {selected && (
        <PipelineDrawer
          key={selected.id}
          lead={selected}
          data={data}
          onAction={onAction}
          onRefresh={onRefresh}
          onClose={() => setSelected(null)}
          onSaved={setNotice}
        />
      )}
    </div>
  );
}
