import { useState } from "react";
import {
  ArrowUpRight,
  CalendarClock,
  ChevronRight,
  Pause,
  UserRound,
} from "lucide-react";
import type { PipelineLeadRecord } from "../_lib/types";
import {
  STAGE_COLORS,
  STAGE_DESCRIPTIONS,
  STAGE_LABELS,
  compactRupiah,
  isActiveStage,
  isOverdue,
  leadNeedsAttention,
  sourceLabel,
  stageLabel,
  temperatureLabel,
  type PipelineStage,
} from "../_lib/pipeline-model";
import { formatDate } from "../_lib/utils";

export function PipelineCard({
  lead,
  now,
  onOpen,
}: {
  lead: PipelineLeadRecord;
  now: number;
  onOpen: (lead: PipelineLeadRecord) => void;
}) {
  const overdue = isOverdue(lead, now);
  const attention = leadNeedsAttention(lead, now);
  const active = isActiveStage(lead.opportunityStage);
  return (
    <button
      type="button"
      onClick={() => onOpen(lead)}
      aria-label={`Buka detail peluang ${lead.name}`}
      className="group block w-full rounded-xl border border-slate-200/90 bg-white p-4 text-left shadow-xs transition hover:border-[#0B2C6B]/35 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2C6B]"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="truncate text-[10px] font-medium text-slate-500">
          {sourceLabel(lead.source)}
        </span>
        <ArrowUpRight
          size={14}
          className="shrink-0 text-slate-300 transition group-hover:text-[#0B2C6B]"
          aria-hidden="true"
        />
      </span>
      <span className="mt-2 block truncate text-sm font-semibold text-slate-950">
        {lead.company || lead.name}
      </span>
      <span className="mt-1 block truncate text-xs text-slate-500">
        {lead.company ? lead.name : lead.email}
      </span>
      <span className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold tracking-tight text-slate-900">
          {lead.opportunityValue == null
            ? "Belum dinilai"
            : compactRupiah(lead.opportunityValue)}
        </span>
        <span
          className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${lead.leadTemperature === "hot" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}`}
        >
          {temperatureLabel(lead.leadTemperature)}
        </span>
      </span>
      <span className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
        <UserRound size={12} aria-hidden="true" />
        <span
          className={`truncate ${lead.opportunityOwner ? "" : "text-amber-700"}`}
        >
          {lead.opportunityOwner || "Belum ada PIC"}
        </span>
        {lead.outreachPaused && (
          <Pause
            size={12}
            className="ml-auto shrink-0"
            aria-label="Tindak lanjut dijeda"
          />
        )}
      </span>
      <span
        className={`mt-3 block rounded-lg px-2.5 py-2 text-[11px] leading-5 ${overdue ? "bg-rose-50 text-rose-800" : attention ? "bg-amber-50/80 text-amber-900" : "bg-slate-50 text-slate-600"}`}
      >
        <span className="block truncate font-medium">
          {active
            ? lead.nextAction || "Tentukan tindakan berikutnya"
            : lead.opportunityStage === "lost"
              ? lead.lostReason || "Peluang ditutup"
              : lead.opportunityStage === "won"
                ? "Kesepakatan berhasil dicapai"
                : "Tahap peluang perlu ditinjau"}
        </span>
        {active && (
          <span className="mt-0.5 flex items-center gap-1.5">
            <CalendarClock size={11} aria-hidden="true" />
            <span>
              {overdue ? "Lewat tenggat · " : ""}
              {lead.nextActionDueAt
                ? formatDate(lead.nextActionDueAt)
                : "Belum ada tenggat"}
            </span>
          </span>
        )}
      </span>
    </button>
  );
}

export function PipelineColumn({
  stage,
  leads,
  now,
  onOpen,
}: {
  stage: PipelineStage;
  leads: PipelineLeadRecord[];
  now: number;
  onOpen: (lead: PipelineLeadRecord) => void;
}) {
  const [limit, setLimit] = useState(12);
  return (
    <section aria-label={`Tahap ${STAGE_LABELS[stage]}`} className="min-w-0">
      <div className="px-1 pb-4 pt-1">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${STAGE_COLORS[stage]}`} />
          <h3 className="text-xs font-semibold text-slate-800">
            {STAGE_LABELS[stage]}
          </h3>
          <span className="rounded-md bg-slate-200/60 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
            {leads.length}
          </span>
          <span className="ml-auto text-[11px] font-medium text-slate-500">
            {leads.length > 0 &&
            leads.every((lead) => lead.opportunityValue == null)
              ? "Belum dinilai"
              : compactRupiah(
                  leads.reduce(
                    (sum, lead) => sum + (lead.opportunityValue || 0),
                    0,
                  ),
                )}
          </span>
        </div>
        <p className="mt-1.5 text-[10px] text-slate-500">
          {STAGE_DESCRIPTIONS[stage]}
        </p>
      </div>
      <div className="min-h-72 space-y-3 lg:max-h-[600px] lg:overflow-y-auto lg:overscroll-y-contain lg:pr-1">
        {leads.length ? (
          leads
            .slice(0, limit)
            .map((lead) => (
              <PipelineCard
                key={lead.id}
                lead={lead}
                now={now}
                onOpen={onOpen}
              />
            ))
        ) : (
          <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-slate-200 px-4 text-center text-xs leading-5 text-slate-500">
            Belum ada peluang
            <br />
            di tahap ini.
          </div>
        )}
      </div>
      {leads.length > limit && (
        <button
          type="button"
          onClick={() => setLimit((current) => current + 12)}
          className="mt-3 min-h-10 w-full rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600"
        >
          Lihat {Math.min(12, leads.length - limit)} peluang lainnya di{" "}
          {STAGE_LABELS[stage]}
        </button>
      )}
    </section>
  );
}

export function PipelineList({
  leads,
  now,
  onOpen,
  cardsOnly = false,
}: {
  leads: PipelineLeadRecord[];
  now: number;
  onOpen: (lead: PipelineLeadRecord) => void;
  cardsOnly?: boolean;
}) {
  const [limit, setLimit] = useState(25);
  const visible = leads.slice(0, limit);
  return (
    <>
      <div
        className={`grid gap-3 bg-slate-50/50 p-3 sm:grid-cols-2 ${cardsOnly ? "xl:grid-cols-3" : "lg:hidden"}`}
      >
        {visible.map((lead) => (
          <div key={lead.id}>
            <p className="mb-2 px-1 text-[10px] font-semibold text-slate-500">
              {stageLabel(lead.opportunityStage)}
            </p>
            <PipelineCard lead={lead} now={now} onOpen={onOpen} />
          </div>
        ))}
      </div>
      {!cardsOnly && (
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">Daftar peluang penjualan</caption>
            <thead className="border-b border-slate-100 text-[10px] font-medium uppercase tracking-wider text-slate-500">
              <tr>
                {[
                  "Peluang",
                  "Tahap / sumber",
                  "Nilai",
                  "Penanggung jawab",
                  "Tindakan berikutnya",
                  "",
                ].map((label) => (
                  <th key={label} scope="col" className="px-5 py-3 font-medium">
                    {label || <span className="sr-only">Detail</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((lead) => (
                <tr key={lead.id} className="group hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => onOpen(lead)}
                      aria-label={`Buka detail peluang ${lead.name}`}
                      className="block max-w-56 rounded text-left focus-visible:outline-2 focus-visible:outline-[#0B2C6B]"
                    >
                      <span className="block truncate font-semibold text-slate-900 group-hover:text-[#0B2C6B]">
                        {lead.company || lead.name}
                      </span>
                      <span className="mt-1 block truncate text-[11px] text-slate-500">
                        {lead.company ? lead.name : lead.email}
                      </span>
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <span className="block whitespace-nowrap font-medium text-slate-700">
                      {stageLabel(lead.opportunityStage)}
                    </span>
                    <span className="mt-1 block text-[10px] text-slate-500">
                      {sourceLabel(lead.source)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-700">
                    {lead.opportunityValue == null
                      ? "Belum dinilai"
                      : compactRupiah(lead.opportunityValue)}
                  </td>
                  <td
                    className="max-w-44 truncate px-5 py-4 text-slate-500"
                    title={lead.opportunityOwner || "Belum ada PIC"}
                  >
                    {lead.opportunityOwner || "Belum ada PIC"}
                  </td>
                  <td className="max-w-64 px-5 py-4">
                    <span className="block truncate text-slate-600">
                      {isActiveStage(lead.opportunityStage)
                        ? lead.nextAction || "Belum ditentukan"
                        : lead.opportunityStage === "lost"
                          ? lead.lostReason
                          : "Kesepakatan tercapai"}
                    </span>
                    {isActiveStage(lead.opportunityStage) && (
                      <span
                        className={`mt-1 block whitespace-nowrap text-[10px] ${isOverdue(lead, now) ? "text-rose-700" : "text-slate-500"}`}
                      >
                        {isOverdue(lead, now) ? "Lewat tenggat · " : ""}
                        {lead.nextActionDueAt
                          ? formatDate(lead.nextActionDueAt)
                          : "Belum ada tenggat"}
                        {lead.outreachPaused ? " · Dijeda" : ""}
                      </span>
                    )}
                  </td>
                  <td className="py-4 pr-4">
                    <button
                      type="button"
                      onClick={() => onOpen(lead)}
                      aria-label={`Lihat ${lead.name}`}
                      className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-white hover:text-[#0B2C6B]"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {leads.length > limit && (
        <div className="border-t border-slate-100 p-4 text-center">
          <button
            type="button"
            onClick={() => setLimit((current) => current + 25)}
            className="min-h-10 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-700"
          >
            Tampilkan {Math.min(25, leads.length - limit)} peluang lainnya
          </button>
          <p className="mt-2 text-[11px] text-slate-500">
            {limit} dari {leads.length} peluang
          </p>
        </div>
      )}
    </>
  );
}
