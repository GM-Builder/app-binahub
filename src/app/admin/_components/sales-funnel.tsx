"use client";

import Link from "next/link";
import { useId, useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, HeartHandshake, Info, Search } from "lucide-react";
import type { DashboardData, PipelineLeadRecord } from "../_lib/types";
import { buildSalesFunnel, FUNNEL_LABELS, FUNNEL_STAGES, funnelAttention, funnelRupiah, funnelStatusLabel, type FunnelStage } from "../_lib/sales-funnel";
import { AdminDrawer, Badge } from "./shared";

const PAGE_SIZE = 5;
function dateLabel(value: string | null | undefined) {
  if (!value || !Number.isFinite(Date.parse(value))) return "Belum tercatat";
  return new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });
}
function sourceLabel(value: string) {
  return ({ insight_assessment: "Diagnosis website", assessment: "Self Diagnostic", website: "Website", email: "Email", manual: "Input manual", manual_upload: "Impor manual", outbound: "Outbound", inbound: "Inbound" } as Record<string, string>)[value] || value.replaceAll("_", " ");
}
function Stat({ label, value }: { label: string; value: string | number }) {
  return <div><dt className="text-[11px] text-slate-500">{label}</dt><dd className="mt-1 text-lg font-semibold tracking-tight text-slate-950">{value}</dd></div>;
}

export function SalesFunnel({ data }: { data: DashboardData }) {
  const [selected, setSelected] = useState<FunnelStage>("awareness");
  const [includeTest, setIncludeTest] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showUnlinked, setShowUnlinked] = useState(false);
  const [initialNow] = useState(() => Date.now());
  const detailRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const titleId = useId();
  const generatedTimestamp = Date.parse(data.generatedAt);
  const now = Number.isFinite(generatedTimestamp) ? generatedTimestamp : initialNow;
  const funnel = useMemo(() => buildSalesFunnel(data, includeTest, now), [data, includeTest, now]);
  const coverage = data.salesFunnelCoverage;
  const unavailable = coverage?.loadError || coverage?.stageDataAvailable === false || !data.pipelineLeads;
  const selectedLead = detailId ? funnel.leads.find(lead => lead.id === detailId) : null;
  const choose = (stage: FunnelStage) => {
    setSelected(stage);
    if (window.matchMedia?.("(max-width: 1023px)").matches) {
      detailRef.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
  };

  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs" aria-labelledby={titleId}>
    <header className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 xl:flex-row xl:items-center xl:justify-between">
      <div><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#80560F]">Calon klien → Klien → Loyal</p>
        <h2 id={titleId} className="mt-1.5 text-xl font-semibold tracking-tight text-slate-950">Sales funnel</h2>
        <p className="mt-1 text-sm text-slate-500">Klik tahap untuk melihat siapa yang ada di sana dan apa yang perlu ditindaklanjuti.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {funnel.testCount > 0 && <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={includeTest} onChange={event => setIncludeTest(event.target.checked)} className="h-4 w-4 accent-blue-900" /> Sertakan data uji ({funnel.testCount})</label>}
        <Link href="/admin/pipeline" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-blue-950 hover:bg-slate-50">Kelola pipeline <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
      </div>
    </header>
    {unavailable ? <div role="alert" className="p-6 text-sm leading-6 text-amber-900"><p className="font-semibold">Data tahap penjualan belum tersedia</p><p>Funnel tidak menampilkan angka nol sebagai pengganti data yang gagal dimuat. Perbarui dashboard atau periksa API pipeline.</p></div> : <>
      {coverage?.total != null && coverage.total > coverage.loaded && <p role="status" className="border-b border-amber-100 bg-amber-50 px-6 py-3 text-xs leading-5 text-amber-950">Data belum lengkap: {coverage.loaded} dari {coverage.total} peluang dimuat. Angka funnel di bawah hanya mencakup data tersebut.</p>}
      <div className="grid lg:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.3fr)]">
        <div className="min-w-0 border-b border-slate-100 bg-slate-50/50 p-5 sm:p-6 lg:border-b-0 lg:border-r">
          <dl className="mb-5 grid grid-cols-3 gap-3">
            <Stat label="Peluang terpetakan" value={funnel.leads.length - funnel.buckets.unknown.length} />
            <Stat label="Masih berproses" value={funnel.activeCount} />
            <Stat label="Nilai peluang aktif" value={funnelRupiah(funnel.activeValue, true)} />
          </dl>
          <div className="mx-auto max-w-[430px] space-y-1.5" role="group" aria-label="Pilih tahap sales funnel">
            {FUNNEL_STAGES.map((stage, index) => {
              const width = 100 - index * 14;
              const inset = 7 / width * 100;
              const active = selected === stage.id;
              const polygon = `polygon(0 0, 100% 0, ${100 - inset}% 100%, ${inset}% 100%)`;
              return <div key={stage.id} className="relative mx-auto rounded-md p-0.5 focus-within:ring-2 focus-within:ring-blue-950 focus-within:ring-offset-2" style={{ width: `${width}%` }}>
                {active && <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[#D9A441]" style={{ clipPath: polygon }} />}
                <button type="button" onClick={() => choose(stage.id)} aria-pressed={active} aria-controls={panelId}
                  aria-label={`${stage.label}: ${funnel.buckets[stage.id].length} peluang. Lihat detail`}
                  className="relative flex min-h-[67px] w-full flex-col items-center justify-center text-white outline-offset-4 transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-blue-950"
                  style={{ backgroundColor: stage.color, clipPath: polygon }}>
                  <span className="text-sm font-semibold">{stage.label} <span className="ml-1.5 text-lg tabular-nums">{funnel.buckets[stage.id].length}</span></span>
                  <span className="mt-0.5 text-[10px] text-white/85">{stage.shortLabel}</span>
                </button>
              </div>;
            })}
            <div className="flex justify-center pt-1" aria-hidden="true"><span className="h-4 w-px bg-emerald-200" /></div>
            <button type="button" onClick={() => choose("loyal")} aria-pressed={selected === "loyal"} aria-controls={panelId} aria-label={`Loyal: ${funnel.buckets.loyal.length} peluang. Lihat detail`}
              className={`mx-auto flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition ${selected === "loyal" ? "border-emerald-600 bg-emerald-100 text-emerald-950 ring-2 ring-emerald-600/15" : "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"}`}>
              <HeartHandshake className="h-4 w-4" aria-hidden="true" /> Loyal <span className="tabular-nums">{funnel.buckets.loyal.length}</span>
            </button>
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => choose("lost")} aria-pressed={selected === "lost"} aria-controls={panelId} className={`min-h-10 rounded-xl border px-3 text-xs font-medium ${selected === "lost" ? "border-rose-300 bg-rose-50 text-rose-900" : "border-slate-200 bg-white text-slate-600"}`}>Tidak lanjut · {funnel.buckets.lost.length}</button>
            {funnel.buckets.unknown.length > 0 && <button type="button" onClick={() => choose("unknown")} aria-pressed={selected === "unknown"} aria-controls={panelId} className="min-h-10 rounded-xl border border-amber-200 bg-amber-50 px-3 text-xs font-medium text-amber-900">Tahap belum dikenali · {funnel.buckets.unknown.length}</button>}
          </div>
        </div>
        <div ref={detailRef} id={panelId} className="min-w-0 scroll-mt-6 p-5 sm:p-6">
          <FunnelStageDetail key={`${selected}-${includeTest}`} stage={selected} leads={funnel.buckets[selected]} onOpen={setDetailId} now={now} />
        </div>
      </div>
      <footer className="space-y-2 border-t border-slate-100 px-5 py-4 text-[11px] leading-5 text-slate-500 sm:px-6">
        <p className="flex items-start gap-2"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span>Posisi saat ini, bukan conversion rate. Satu peluang hanya dihitung pada satu tahap; satu perusahaan dapat memiliki beberapa peluang. Bentuk funnel menunjukkan tahapan, bukan skala jumlah.</span></p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p>Diperbarui {dateLabel(data.generatedAt)} WIB · {coverage?.total != null && coverage.total === coverage.loaded ? "Seluruh peluang berhasil dimuat" : "Berdasarkan data yang dimuat dashboard"}{!includeTest && funnel.testCount > 0 ? ` · ${funnel.testCount} data uji tidak dihitung` : ""}</p>
          {funnel.unlinkedAccounts.length > 0 && <button type="button" onClick={() => setShowUnlinked(true)} className="min-h-8 font-medium text-blue-900 underline underline-offset-4">{funnel.unlinkedAccounts.length} akun klien belum terhubung ke peluang yang dimuat</button>}
        </div>
      </footer>
    </>}
    {selectedLead && <FunnelLeadDetail lead={selectedLead} data={data} stage={selected} accounts={funnel.accountsByLead.get(selectedLead.id) || []} onClose={() => setDetailId(null)} now={now} />}
    {showUnlinked && <AdminDrawer title="Akun klien yang belum terpetakan" eyebrow="Kelengkapan data" onClose={() => setShowUnlinked(false)}>
      <p className="mb-5 text-sm leading-6 text-slate-500">Akun ini belum memiliki lead sumber, atau lead sumbernya tidak ada pada data yang dimuat. Tidak dimasukkan ke tahap Decision/Loyal tanpa hubungan yang dapat diverifikasi.</p>
      <div className="space-y-3">{funnel.unlinkedAccounts.map(account => <article key={account.id} className="rounded-xl border border-slate-200 p-4"><h3 className="font-semibold text-slate-900">{account.organizationName}</h3><p className="mt-1 text-sm text-slate-600">{funnelStatusLabel(account.status)} · {funnelStatusLabel(account.retainStatus)}</p><p className="mt-1 text-xs text-slate-500">PIC komersial: {account.commercialOwner || "Belum ditetapkan"}</p></article>)}</div>
      <Link href="/admin/clients" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-900">Buka pengelolaan klien <ArrowRight className="h-4 w-4" /></Link>
    </AdminDrawer>}
  </section>;
}

function FunnelStageDetail({ stage, leads, onOpen, now }: { stage: FunnelStage; leads: PipelineLeadRecord[]; onOpen: (id: string) => void; now: number }) {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("all");
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [page, setPage] = useState(0);
  const description = FUNNEL_STAGES.find(item => item.id === stage)?.description || ({
    loyal: "Peluang berhasil dengan akun yang masih aktif, berkembang atau memiliki repeat/perpanjangan/peningkatan layanan yang berhasil tercatat. Ini indikator operasional, bukan penilaian kepuasan klien.",
    lost: "Peluang ditutup tanpa kesepakatan. Buka detail untuk melihat alasan tidak lanjut.",
    unknown: "Status ini belum sesuai dengan tahap pipeline yang dikenali. Tinjau datanya sebelum mengubah tahap.",
  } as Record<string, string>)[stage];
  const sources = [...new Set(leads.map(lead => lead.source))].sort();
  const hasAttention = (lead: PipelineLeadRecord) => Object.values(funnelAttention(lead, now)).some(Boolean);
  const filtered = leads.filter(lead => [lead.name, lead.company, lead.email, lead.opportunityOwner, sourceLabel(lead.source), funnelStatusLabel(lead.opportunityStage)]
    .join(" ").toLocaleLowerCase("id-ID").includes(query.trim().toLocaleLowerCase("id-ID")) &&
    (source === "all" || lead.source === source) && (!attentionOnly || hasAttention(lead)));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages - 1);
  const visible = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const value = leads.reduce((sum, lead) => sum + (Number.isFinite(Number(lead.opportunityValue)) ? Number(lead.opportunityValue) : 0), 0);
  const valueMissing = leads.filter(lead => lead.opportunityValue == null).length;
  const states = [...new Set(leads.map(lead => lead.opportunityStage))];

  return <>
    <div className="flex items-center justify-between gap-3"><h3 className="text-lg font-semibold text-slate-950">{FUNNEL_LABELS[stage]}</h3><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{leads.length} peluang</span></div>
    <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
    <dl className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-4">
      <Stat label="Nilai tercatat" value={leads.length > 0 && valueMissing === leads.length ? "Belum dinilai" : funnelRupiah(value, true)} />
      <Stat label="Perlu perhatian" value={leads.filter(hasAttention).length} />
      <Stat label="Lewat tenggat" value={leads.filter(lead => funnelAttention(lead, now).overdue).length} />
    </dl>
    {valueMissing > 0 && <p className="mt-1.5 text-[10px] text-slate-500">{valueMissing} peluang belum memiliki nilai. Total bukan omzet atau pembayaran.</p>}
    {states.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{states.map(state => <span key={state} className="rounded-md border border-slate-200 px-2 py-1 text-[10px] text-slate-600">{funnelStatusLabel(state)} · {leads.filter(lead => lead.opportunityStage === state).length}</span>)}</div>}
    <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_150px]">
      <label className="relative"><span className="sr-only">Cari peluang pada tahap {FUNNEL_LABELS[stage]}</span><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
        <input type="search" value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} placeholder="Cari nama, perusahaan, email, PIC…" className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-100" />
      </label>
      <label><span className="sr-only">Sumber peluang</span><select value={source} onChange={event => { setSource(event.target.value); setPage(0); }} className="h-10 w-full rounded-xl border border-slate-200 px-2 text-xs"><option value="all">Semua sumber</option>{sources.map(item => <option key={item} value={item}>{sourceLabel(item)}</option>)}</select></label>
    </div>
    <label className="mt-3 flex min-h-7 items-center gap-2 text-[11px] text-slate-600"><input type="checkbox" checked={attentionOnly} onChange={event => { setAttentionOnly(event.target.checked); setPage(0); }} className="h-3.5 w-3.5 accent-blue-900" /> Hanya yang perlu perhatian</label>
    <p role="status" className="mt-2 text-[11px] text-slate-400">Menampilkan {filtered.length} dari {leads.length} peluang pada tahap ini</p>
    <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200">
      {visible.length === 0 ? <div className="p-7 text-center text-xs leading-5 text-slate-500">{leads.length === 0 ? "Belum ada peluang pada tahap ini." : "Tidak ada peluang yang cocok dengan pencarian atau filter."}</div> : visible.map(lead => {
        const flags = funnelAttention(lead, now);
        return <button key={lead.id} type="button" onClick={() => onOpen(lead.id)} aria-label={`Lihat detail ${lead.name} dari ${lead.company}`} className="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-slate-50 focus-visible:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-700 sm:px-4">
          <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-slate-900">{lead.name} <span className="font-normal text-slate-500">· {lead.company}</span></span>
            <span className="mt-1 block truncate text-[10px] text-slate-500">{sourceLabel(lead.source)} · PIC: {lead.opportunityOwner || "Belum ditetapkan"}</span>
            <span className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[10px]"><span className="text-blue-900">{funnelStatusLabel(lead.opportunityStage)} · {funnelStatusLabel(lead.leadTemperature)}</span>{flags.overdue && <span className="text-rose-700">Lewat tenggat</span>}{lead.outreachPaused && <span className="text-amber-800">Follow-up dijeda</span>}</span>
          </span>
          <span className="shrink-0 text-[11px] font-medium text-slate-700">{lead.opportunityValue == null ? "—" : funnelRupiah(lead.opportunityValue, true)}</span><ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        </button>;
      })}
    </div>
    {pages > 1 && <nav aria-label="Halaman daftar peluang funnel" className="mt-3 flex items-center justify-between text-xs text-slate-500"><span>Halaman {currentPage + 1} dari {pages}</span><div className="flex gap-2"><button type="button" aria-label="Halaman sebelumnya" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 disabled:opacity-35"><ChevronLeft className="h-4 w-4" /></button><button type="button" aria-label="Halaman berikutnya" disabled={currentPage >= pages - 1} onClick={() => setPage(currentPage + 1)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 disabled:opacity-35"><ChevronRight className="h-4 w-4" /></button></div></nav>}
  </>;
}

function DetailField({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-[11px] font-medium text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm leading-6 text-slate-800">{value || "Belum tercatat"}</dd></div>;
}

function FunnelLeadDetail({ lead, data, stage, accounts, onClose, now }: { lead: PipelineLeadRecord; data: DashboardData; stage: FunnelStage; accounts: ReturnType<typeof buildSalesFunnel>["unlinkedAccounts"]; onClose: () => void; now: number }) {
  // Join by explicit IDs, never by shared contact email/company name.
  const assessments = data.assessments.filter(item => item.leadId === lead.id).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const meetings = (data.calendarBookings || []).filter(item => item.leadId === lead.id || (item.assessmentId && assessments.some(assessment => assessment.id === item.assessmentId))).sort((a, b) => (Date.parse(b.startTime || "") || 0) - (Date.parse(a.startTime || "") || 0));
  const activities = (data.opportunityActivities || []).filter(item => item.leadId === lead.id).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const accountIds = new Set(accounts.map(account => account.id));
  const projects = (data.deliveryProjects || []).filter(project => project.sourceLeadId === lead.id || accountIds.has(project.clientAccountId));
  const repeats = (data.retentionOpportunities || []).filter(item => accountIds.has(item.clientAccountId));
  const flags = funnelAttention(lead, now);
  const latest = assessments[0];

  return <AdminDrawer title={lead.name} eyebrow={`${FUNNEL_LABELS[stage]} · ${funnelStatusLabel(lead.opportunityStage)}`} onClose={onClose}>
    <div className="space-y-6">
      <div><h3 className="text-lg font-semibold text-slate-900">{lead.company}</h3><p className="mt-1 text-sm text-slate-500">{lead.email} {lead.phone && `· ${lead.phone}`}</p>
        <div className="mt-3 flex flex-wrap gap-2"><Badge>{funnelStatusLabel(lead.leadTemperature)}</Badge>{flags.overdue && <Badge tone="red">Lewat tenggat</Badge>}{flags.unassigned && <Badge tone="gold">Belum ada PIC</Badge>}{lead.outreachPaused && <Badge tone="gold">Follow-up dijeda</Badge>}</div>
      </div>
      <dl className="grid gap-4 rounded-2xl border border-slate-200 p-4 sm:grid-cols-2">
        <DetailField label="Tahap pipeline" value={funnelStatusLabel(lead.opportunityStage)} /><DetailField label="Status hubungan" value={funnelStatusLabel(lead.lifecycleStage)} />
        <DetailField label="Sumber" value={sourceLabel(lead.source)} /><DetailField label="PIC peluang" value={lead.opportunityOwner || "Belum ditetapkan"} />
        <DetailField label="Nilai peluang" value={funnelRupiah(lead.opportunityValue)} /><DetailField label="Industri / lokasi" value={[lead.industry, lead.location].filter(Boolean).join(" · ")} />
        <DetailField label="Tercatat sejak" value={dateLabel(lead.createdAt)} /><DetailField label="Terakhir diperbarui" value={dateLabel(lead.pipelineUpdatedAt)} />
      </dl>
      <section><h3 className="text-sm font-semibold text-slate-900">Tindakan berikutnya</h3><p className="mt-2 text-sm leading-6 text-slate-600">{lead.nextAction || "Tindakan berikutnya belum ditetapkan."}</p><p className="mt-1 text-xs text-slate-500">Tenggat: {dateLabel(lead.nextActionDueAt)} · WIB</p>
        {lead.outreachPaused && <p className="mt-2 text-xs text-amber-800">Follow-up dijeda: {lead.outreachPauseReason || "Alasan belum dicatat"}</p>}
        {lead.lostReason && <p className="mt-2 text-sm text-rose-800">Alasan tidak lanjut: {lead.lostReason}</p>}
        {lead.wonAt && <p className="mt-2 text-xs text-emerald-800">Deal berhasil pada {dateLabel(lead.wonAt)} WIB</p>}
      </section>
      <section className="border-t border-slate-100 pt-5"><h3 className="text-sm font-semibold text-slate-900">Self Diagnostic & proposal</h3>
        {latest ? <><p className="mt-2 text-xs text-slate-500">Self Diagnostic terbaru dari {assessments.length} Self Diagnostic terhubung · {dateLabel(latest.createdAt)} WIB</p>
          <dl className="mt-3 grid gap-4 sm:grid-cols-2"><DetailField label="Status Self Diagnostic" value={latest.assessmentStatus} /><DetailField label="Status proposal" value={latest.proposalStatus} /><DetailField label="Email hasil terkirim" value={dateLabel(latest.resultEmailSentAt)} /><DetailField label="Proposal terkirim" value={dateLabel(latest.proposalSentAt)} /></dl>
          {latest.challenge && <p className="mt-3 text-sm leading-6 text-slate-600"><span className="font-medium text-slate-900">Tantangan: </span>{latest.challenge}</p>}{latest.target && <p className="mt-2 text-sm leading-6 text-slate-600"><span className="font-medium text-slate-900">Tujuan: </span>{latest.target}</p>}
          {latest.proposalGateReasons?.length ? <ul className="mt-3 list-disc space-y-1 pl-4 text-xs leading-5 text-amber-800">{latest.proposalGateReasons.map(reason => <li key={reason.code}>{reason.message}</li>)}</ul> : null}
        </> : <p className="mt-2 text-sm text-slate-500">Belum ada Self Diagnostic yang terhubung pada data dashboard.</p>}
      </section>
      <section className="border-t border-slate-100 pt-5"><h3 className="text-sm font-semibold text-slate-900">Meeting · {meetings.length}</h3><div className="mt-3 space-y-3">{meetings.length ? meetings.map(meeting => <div key={meeting.id} className="rounded-xl bg-slate-50 p-3"><p className="text-sm font-medium text-slate-900">{meeting.title}</p><p className="mt-1 text-xs text-slate-600">{funnelStatusLabel(meeting.status)} · {dateLabel(meeting.startTime)} WIB</p>{meeting.cancellationReason && <p className="mt-1 text-xs text-rose-700">{meeting.cancellationReason}</p>}</div>) : <p className="text-sm text-slate-500">Belum ada jadwal terhubung pada data dashboard.</p>}</div></section>
      <section className="border-t border-slate-100 pt-5"><h3 className="text-sm font-semibold text-slate-900">Akun klien & pelaksanaan</h3>{accounts.length ? accounts.map(account => <article key={account.id} className="mt-3 rounded-xl border border-slate-200 p-4"><h4 className="text-sm font-semibold text-slate-900">{account.organizationName}</h4><dl className="mt-3 grid gap-3 sm:grid-cols-2"><DetailField label="Status akun" value={funnelStatusLabel(account.status)} /><DetailField label="Kesehatan akun" value={funnelStatusLabel(account.healthStatus)} /><DetailField label="Hubungan lanjutan" value={funnelStatusLabel(account.retainStatus)} /><DetailField label="PIC komersial / delivery" value={`${account.commercialOwner || "—"} / ${account.deliveryOwner || "—"}`} /></dl></article>) : <p className="mt-2 text-sm text-slate-500">Belum ada akun klien yang terhubung pada data dashboard.</p>}
        {projects.map(project => <p key={project.id} className="mt-3 text-sm text-slate-600">{project.programName} · {funnelStatusLabel(project.deliveryStage)}</p>)}
        {repeats.map(repeat => <p key={repeat.id} className="mt-3 text-sm text-slate-600">Peluang lanjutan: {({ repeat: "Pesanan ulang", renewal: "Perpanjangan", upsell: "Peningkatan layanan", cross_sell: "Layanan tambahan", referral: "Rujukan" } as Record<string, string>)[repeat.opportunityType] || repeat.opportunityType} · {funnelStatusLabel(repeat.status)} · {funnelRupiah(repeat.estimatedValue)}</p>)}
      </section>
      <section className="border-t border-slate-100 pt-5"><h3 className="text-sm font-semibold text-slate-900">Aktivitas pipeline terbaru</h3><p className="mt-1 text-xs text-slate-500">Menampilkan hingga 10 aktivitas yang dimuat dashboard.</p><ol className="mt-3 space-y-3">{activities.slice(0, 10).map(activity => <li key={activity.id} className="border-l-2 border-blue-100 pl-3"><p className="text-xs font-medium text-slate-700">{activity.toStage ? `${funnelStatusLabel(activity.fromStage)} → ${funnelStatusLabel(activity.toStage)}` : activity.eventType.replaceAll("_", " ")}</p>{activity.note && <p className="mt-1 text-xs leading-5 text-slate-600">{activity.note}</p>}<p className="mt-1 text-[10px] text-slate-400">{activity.actor} · {dateLabel(activity.createdAt)} WIB</p></li>)}</ol>{activities.length === 0 && <p className="mt-2 text-sm text-slate-500">Belum ada aktivitas terhubung pada data dashboard.</p>}</section>
      <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4"><Link href="/admin/pipeline" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-950 px-4 text-xs font-semibold text-white">Kelola peluang <ArrowRight className="h-3.5 w-3.5" /></Link><Link href="/admin/assessments" className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 px-4 text-xs font-semibold text-blue-900">Buka Self Diagnostic</Link>{accounts.length > 0 && <Link href="/admin/clients" className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 px-4 text-xs font-semibold text-blue-900">Kelola klien</Link>}</div>
    </div>
  </AdminDrawer>;
}
