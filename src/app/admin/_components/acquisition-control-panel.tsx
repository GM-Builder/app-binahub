"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, BarChart3, CheckCircle2, FileCheck2, Inbox, MoreHorizontal, Plus, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { AdminInput, AdminModal, AdminSelect, AdminTextarea, FieldLabel } from "./shared";
import { LeadAgentPanel } from "./lead-agent-panel";
import { InboundAttributionPanel } from "./inbound-attribution-panel";
import { ControlledOutboundPanel } from "./controlled-outbound-panel";

type AdminAction = (url: string, init?: RequestInit) => Promise<unknown>;
type Source = { id: string; source_key: string; name: string; provider_type: string; channel: string; acquisition_method: string; lawful_basis: string | null; privacy_notice_url: string | null; retention_days: number | null; data_owner: string | null; legal_owner: string | null; status: string; active: boolean; config: Record<string, unknown>; approval_note: string | null };
type Campaign = { id: string; source_id: string; campaign_code: string; name: string; objective: string; channel: string; status: string; owner: string; budget_amount: number | null; currency: string; starts_on: string | null; ends_on: string | null; utm_config: Record<string, unknown>; target_definition: Record<string, unknown>; approval_note: string | null };
type Batch = { id: string; source_id: string; campaign_id: string | null; import_key: string; file_name: string | null; status: string; total_rows: number; valid_rows: number; invalid_rows: number; duplicate_rows: number; suppressed_rows: number; promoted_rows: number; created_at: string };
type Prospect = { id: string; batch_id: string; name: string; email: string; company: string | null; validation_status: string; validation_reasons: string[] };
type AcquisitionResponse = { success: boolean; phase5Ready: boolean; sources: Source[]; campaigns: Campaign[]; batches: Batch[]; prospects: Prospect[] };
type WorkspaceView = "overview" | "inbound" | "outbound" | "governance";

const buttonClass = "inline-flex items-center gap-2 rounded-xl bg-[#0B2C6B] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50";
const secondaryButton = "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700";

const emptySource = { id: "", sourceKey: "", name: "", providerType: "manual_upload", channel: "inbound", acquisitionMethod: "", lawfulBasis: "", privacyNoticeUrl: "", retentionDays: "", dataOwner: "", legalOwner: "", status: "draft", active: false, humanApproved: false, approvalNote: "", config: {} as Record<string, unknown> };
const emptyCampaign = { id: "", sourceId: "", campaignCode: "", name: "", objective: "awareness", channel: "organic", status: "draft", owner: "", budgetAmount: "", currency: "IDR", startsOn: "", endsOn: "", humanApproved: false, approvalNote: "", utmSource: "", utmMedium: "", utmCampaign: "", targetDefinition: {} as Record<string, unknown> };
const emptyBatch = { sourceId: "", campaignId: "", importKey: "", fileName: "", fileChecksum: "", prospectsJson: "[\n  {\n    \"name\": \"\",\n    \"email\": \"\",\n    \"company\": \"\",\n    \"consentStatus\": \"unknown\"\n  }\n]" };

const STATUS_LABEL: Record<string, string> = {
  draft: "Draf",
  approved: "Disetujui",
  active: "Aktif",
  paused: "Dijeda",
  rejected: "Ditolak",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  staged: "Menunggu tinjauan",
};

const statusLabel = (status: string) => STATUS_LABEL[status] || status.replaceAll("_", " ");

const WORKSPACE_VIEWS: Array<{ id: WorkspaceView; label: string; description: string }> = [
  { id: "overview", label: "Ringkasan", description: "Prioritas dan antrean" },
  { id: "inbound", label: "Inbound", description: "Website, sosial, dan iklan" },
  { id: "outbound", label: "Outbound", description: "Prospek terkontrol" },
  { id: "governance", label: "Data & kampanye", description: "Sumber, kampanye, dan batch" },
];

function AcquisitionMetric({ label, value, note, tone = "navy" }: { label: string; value: number; note: string; tone?: "navy" | "green" | "gold" }) {
  const colors = tone === "green" ? "text-emerald-700" : tone === "gold" ? "text-amber-700" : "text-[#0B2C6B]";
  return <div className="min-w-0 border-l border-slate-200 pl-4 first:border-l-0 first:pl-0">
    <p className="text-[11px] font-semibold text-slate-500">{label}</p>
    <p className={`mt-1 text-2xl font-semibold tracking-tight ${colors}`}>{value}</p>
    <p className="mt-1 truncate text-[11px] text-slate-400">{note}</p>
  </div>;
}

function MoreActions({ label, children }: { label: string; children: React.ReactNode }) {
  return <details className="group relative">
    <summary aria-label={label} className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-[#0B2C6B] [&::-webkit-details-marker]:hidden">
      <MoreHorizontal size={18} />
    </summary>
    <div className="absolute right-0 top-12 z-20 min-w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
      {children}
    </div>
  </details>;
}

const menuActionClass = "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-[#0B2C6B] disabled:cursor-not-allowed disabled:opacity-40";

export function parseCsvRows(value: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character === '"' && quoted && value[index + 1] === '"') { field += '"'; index += 1; continue; }
    if (character === '"') { quoted = !quoted; continue; }
    if (character === "," && !quoted) { row.push(field.trim()); field = ""; continue; }
    if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && value[index + 1] === "\n") index += 1;
      row.push(field.trim()); field = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
      continue;
    }
    field += character;
  }
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export function prospectsFromCsv(value: string) {
  const rows = parseCsvRows(value.replace(/^\uFEFF/, ""));
  if (rows.length < 2) throw new Error("CSV harus memiliki header dan minimal satu baris prospek.");
  const headers = rows[0].map((header) => header.trim().toLowerCase().replaceAll(/[\s-]+/g, "_"));
  const get = (values: string[], ...names: string[]) => {
    const index = names.map((name) => headers.indexOf(name)).find((item) => item >= 0) ?? -1;
    return index >= 0 ? values[index]?.trim() || null : null;
  };
  return rows.slice(1).map((values, index) => {
    const firstName = get(values, "first_name", "firstname");
    const lastName = get(values, "last_name", "lastname");
    const name = get(values, "name", "full_name", "contact_name") || [firstName, lastName].filter(Boolean).join(" ");
    const email = get(values, "email", "work_email", "email_address");
    if (!name || !email) throw new Error(`Baris ${index + 2} harus memiliki nama dan email.`);
    return {
      externalId: get(values, "external_id", "id"),
      name,
      email,
      company: get(values, "company", "organization", "company_name"),
      roleTitle: get(values, "role_title", "title", "position", "job_title"),
      industry: get(values, "industry"),
      location: get(values, "location", "city"),
      employeeRange: get(values, "employee_range", "headcount", "employee_count"),
      websiteUrl: get(values, "website_url", "website", "domain"),
      linkedinUrl: get(values, "linkedin_url", "linkedin"),
      sourceUrl: get(values, "source_url"),
      consentStatus: get(values, "consent_status") || "unknown",
    };
  }).slice(0, 500);
}

export function AcquisitionControlPanel({ onAction }: { onAction: AdminAction }) {
  const [data, setData] = useState<AcquisitionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<"source" | "campaign" | "batch" | "review" | null>(null);
  const [sourceForm, setSourceForm] = useState(emptySource);
  const [campaignForm, setCampaignForm] = useState(emptyCampaign);
  const [batchForm, setBatchForm] = useState(emptyBatch);
  const [reviewBatch, setReviewBatch] = useState<Batch | null>(null);
  const [reviewForm, setReviewForm] = useState({ decision: "approved", note: "" });
  const [view, setView] = useState<WorkspaceView>("overview");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await onAction("/api/admin/acquisition") as AcquisitionResponse); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Gagal memuat kontrol akuisisi."); }
    finally { setLoading(false); }
  }, [onAction]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const sources = useMemo(() => data?.sources || [], [data]);
  const campaigns = useMemo(() => data?.campaigns || [], [data]);
  const batches = useMemo(() => data?.batches || [], [data]);
  const prospects = useMemo(() => data?.prospects || [], [data]);
  const activeSources = sources.filter((source) => source.status === "approved" && source.active);

  const execute = async (action: () => Promise<void>) => {
    setSaving(true); setError("");
    try { await action(); setModal(null); await load(); }
    catch (actionError) { setError(actionError instanceof Error ? actionError.message : "Tindakan akuisisi gagal disimpan."); }
    finally { setSaving(false); }
  };

  const editSource = (source?: Source) => {
    setSourceForm(source ? { id: source.id, sourceKey: source.source_key, name: source.name, providerType: source.provider_type, channel: source.channel, acquisitionMethod: source.acquisition_method, lawfulBasis: source.lawful_basis || "", privacyNoticeUrl: source.privacy_notice_url || "", retentionDays: source.retention_days?.toString() || "", dataOwner: source.data_owner || "", legalOwner: source.legal_owner || "", status: source.status, active: source.active, humanApproved: source.status === "approved", approvalNote: source.approval_note || "", config: source.config || {} } : emptySource);
    setModal("source");
  };
  const prepareApolloSource = () => {
    const existing = sources.find((item) => item.source_key === "ai_lead_discovery_apollo");
    if (existing) { editSource(existing); return; }
    setSourceForm({
      ...emptySource,
      sourceKey: "ai_lead_discovery_apollo",
      name: "AI Lead Discovery — Apollo",
      providerType: "apollo",
      channel: "outbound",
      acquisitionMethod: "Ekspor prospek secara manual dari Apollo Free dan impor CSV/JSON ke Batch Prospek. API tetap dinonaktifkan sampai paket Apollo Pro tersedia; seluruh data melalui validasi, deduplikasi, daftar jangan dihubungi, dan tinjauan manusia.",
      dataOwner: "admin@binahub.id",
      legalOwner: "admin@binahub.id",
      config: { mode: "manual_export", apiCallsEnabled: false },
    });
    setModal("source");
  };
  const editCampaign = (campaign?: Campaign) => {
    setCampaignForm(campaign ? { id: campaign.id, sourceId: campaign.source_id, campaignCode: campaign.campaign_code, name: campaign.name, objective: campaign.objective, channel: campaign.channel, status: campaign.status, owner: campaign.owner, budgetAmount: campaign.budget_amount?.toString() || "", currency: campaign.currency, startsOn: campaign.starts_on || "", endsOn: campaign.ends_on || "", humanApproved: ["approved", "active"].includes(campaign.status), approvalNote: campaign.approval_note || "", utmSource: String(campaign.utm_config?.source || ""), utmMedium: String(campaign.utm_config?.medium || ""), utmCampaign: String(campaign.utm_config?.campaign || campaign.campaign_code.toLowerCase()), targetDefinition: campaign.target_definition || {} } : { ...emptyCampaign, sourceId: activeSources[0]?.id || "" });
    setModal("campaign");
  };
  const prepareApolloCampaign = () => {
    const existing = campaigns.find((item) => item.campaign_code === "AI_LEAD_DISCOVERY_APOLLO");
    if (existing) { editCampaign(existing); return; }
    const source = activeSources.find((item) => item.source_key === "ai_lead_discovery_apollo");
    setCampaignForm({
      ...emptyCampaign,
      sourceId: source?.id || "",
      campaignCode: "AI_LEAD_DISCOVERY_APOLLO",
      name: "AI Lead Discovery — Apollo Manual",
      objective: "lead_generation",
      channel: "other",
      owner: "admin@binahub.id",
      utmSource: "apollo",
      utmMedium: "manual_export",
      utmCampaign: "ai_lead_discovery_apollo",
      targetDefinition: { mode: "manual_export", provider: "apollo" },
    });
    setModal("campaign");
  };
  const review = (batch: Batch) => { setReviewBatch(batch); setReviewForm({ decision: "approved", note: "" }); setModal("review"); };

  if (loading && !data) return <div role="status" aria-live="polite" className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Memuat kontrol akuisisi…</div>;
  if (data && !data.phase5Ready) return <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Kontrol akuisisi belum tersedia. Hubungi tim teknis bila status ini tetap muncul.</div>;

  const stagedBatches = batches.filter((item) => item.status === "staged");
  const activeCampaigns = campaigns.filter((item) => item.status === "active");
  const excludedProspects = prospects.filter((item) => ["invalid", "duplicate", "suppressed", "excluded"].includes(item.validation_status));

  return <div className="space-y-5">
    {error && <div role="alert" aria-live="assertive" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div className="flex flex-col gap-5 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-700"><CheckCircle2 size={14} /> Guardrail aktif</div>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Status akuisisi</h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-500">Pantau asal prospek, jalankan kampanye, dan tinjau data dari satu alur. Tidak ada prospek yang langsung dihubungi tanpa validasi dan keputusan manusia.</p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Perbarui data
        </button>
      </div>
      <div className="grid grid-cols-2 gap-5 border-t border-slate-100 px-5 py-4 sm:px-6 lg:grid-cols-4">
        <AcquisitionMetric label="Sumber aktif" value={activeSources.length} note="Sudah disetujui" tone="green" />
        <AcquisitionMetric label="Kampanye aktif" value={activeCampaigns.length} note="Sedang berjalan" />
        <AcquisitionMetric label="Perlu ditinjau" value={stagedBatches.length} note="Batch menunggu keputusan" tone={stagedBatches.length ? "gold" : "green"} />
        <AcquisitionMetric label="Tersaring" value={excludedProspects.length} note="Tidak valid, ganda, atau diblokir" />
      </div>
    </section>

    <nav aria-label="Bagian kontrol akuisisi" className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100/70 p-1">
      {WORKSPACE_VIEWS.map((item) => <button key={item.id} type="button" onClick={() => setView(item.id)} aria-current={view === item.id ? "page" : undefined} className={`min-w-36 flex-1 rounded-xl px-4 py-3 text-left transition sm:min-w-0 ${view === item.id ? "bg-white text-[#0B2C6B] shadow-sm" : "text-slate-500 hover:bg-white/60 hover:text-slate-800"}`}>
        <span className="block text-xs font-semibold">{item.label}</span>
        <span className="mt-0.5 hidden text-[10px] text-slate-400 lg:block">{item.description}</span>
      </button>)}
    </nav>

    {view === "overview" && <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <p className="text-[11px] font-semibold text-slate-400">PRIORITAS HARI INI</p>
        <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">Selesaikan yang membutuhkan keputusan</h3>
        <div className="mt-5 divide-y divide-slate-100">
          <button type="button" onClick={() => setView("governance")} className="group flex w-full items-center gap-4 py-4 text-left first:pt-0">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700"><FileCheck2 size={18} /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-900">{stagedBatches.length} batch menunggu tinjauan</span><span className="mt-0.5 block text-xs text-slate-500">Validasi data sebelum masuk ke antrean lead.</span></span>
            <ArrowRight size={16} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#0B2C6B]" />
          </button>
          <button type="button" onClick={() => setView("inbound")} className="group flex w-full items-center gap-4 py-4 text-left">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#0B2C6B]"><BarChart3 size={18} /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-900">Periksa perjalanan inbound</span><span className="mt-0.5 block text-xs text-slate-500">Lihat website, sosial media, iklan, dan titik konversi.</span></span>
            <ArrowRight size={16} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#0B2C6B]" />
          </button>
          <button type="button" onClick={() => setView("outbound")} className="group flex w-full items-center gap-4 py-4 text-left last:pb-0">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Sparkles size={18} /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-900">Kelola outbound terkontrol</span><span className="mt-0.5 block text-xs text-slate-500">Riset prospek dan outreach tetap melalui human gate.</span></span>
            <ArrowRight size={16} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#0B2C6B]" />
          </button>
        </div>
      </section>
      <aside className="rounded-2xl bg-[#071B3D] p-5 text-white shadow-xs sm:p-6">
        <ShieldCheck size={22} className="text-[#E6BC66]" />
        <h3 className="mt-5 text-lg font-semibold">Alur yang aman</h3>
        <ol className="mt-4 space-y-4 text-sm text-white/68">
          <li className="flex gap-3"><span className="font-semibold text-[#E6BC66]">01</span><span>Data masuk dan sumbernya dicatat.</span></li>
          <li className="flex gap-3"><span className="font-semibold text-[#E6BC66]">02</span><span>Duplikasi, daftar jangan dihubungi, dan kelengkapan diperiksa.</span></li>
          <li className="flex gap-3"><span className="font-semibold text-[#E6BC66]">03</span><span>Manusia memutuskan sebelum data dipromosikan.</span></li>
        </ol>
      </aside>
    </div>}

    {view === "inbound" && <InboundAttributionPanel onAction={onAction} />}
    {view === "outbound" && <div className="space-y-5"><LeadAgentPanel onAction={onAction} onOpenBatch={() => setView("governance")} /><ControlledOutboundPanel onAction={onAction} /></div>}

    {view === "governance" && <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-900">Sumber data</p><p className="mt-1 text-xs text-slate-500">Asal data dan dasar pemrosesannya.</p></div><div className="flex gap-2"><button type="button" className={secondaryButton} onClick={() => editSource()}><Plus size={13} /> Tambah</button><MoreActions label="Aksi sumber lainnya"><button type="button" className={menuActionClass} onClick={prepareApolloSource}><Sparkles size={14} /> Siapkan Apollo manual</button></MoreActions></div></div>
          <div className="mt-5 divide-y divide-slate-100">{sources.map((source) => <button type="button" key={source.id} onClick={() => editSource(source)} className="group flex w-full items-center gap-3 py-3.5 text-left"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${source.status === "approved" && source.active ? "bg-emerald-500" : "bg-slate-300"}`} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-800">{source.name}</span><span className="mt-0.5 block truncate text-xs text-slate-400">{source.provider_type.replaceAll("_", " ")} · {source.channel}</span></span><span className="text-[10px] font-semibold text-slate-400">{statusLabel(source.status)}</span><ArrowRight size={14} className="text-slate-300 group-hover:text-[#0B2C6B]" /></button>)}{!sources.length && <p className="py-8 text-center text-sm text-slate-400">Belum ada sumber data.</p>}</div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-900">Kampanye</p><p className="mt-1 text-xs text-slate-500">Tujuan, kanal, dan periode aktivitas.</p></div><div className="flex gap-2"><button type="button" className={secondaryButton} onClick={() => editCampaign()} disabled={!activeSources.length}><Plus size={13} /> Tambah</button><MoreActions label="Aksi kampanye lainnya"><button type="button" className={menuActionClass} onClick={prepareApolloCampaign} disabled={!activeSources.some((source) => source.source_key === "ai_lead_discovery_apollo")}><Sparkles size={14} /> Siapkan kampanye Apollo</button></MoreActions></div></div>
          {!activeSources.length && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Aktifkan minimal satu sumber sebelum membuat kampanye.</p>}
          <div className="mt-5 divide-y divide-slate-100">{campaigns.map((campaign) => <button type="button" key={campaign.id} onClick={() => editCampaign(campaign)} className="group flex w-full items-center gap-3 py-3.5 text-left"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${campaign.status === "active" ? "bg-emerald-500" : "bg-slate-300"}`} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-800">{campaign.name}</span><span className="mt-0.5 block truncate text-xs text-slate-400">{campaign.campaign_code} · {campaign.objective.replaceAll("_", " ")}</span></span><span className="text-[10px] font-semibold text-slate-400">{statusLabel(campaign.status)}</span><ArrowRight size={14} className="text-slate-300 group-hover:text-[#0B2C6B]" /></button>)}{!campaigns.length && <p className="py-8 text-center text-sm text-slate-400">Belum ada kampanye.</p>}</div>
        </section>
      </div>

      <section id="batch-prospek" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold text-slate-900">Batch prospek</p><p className="mt-1 text-xs text-slate-500">Impor, validasi, lalu putuskan data yang boleh diproses.</p></div><button type="button" className={secondaryButton} disabled={!activeSources.length} onClick={() => { setBatchForm({ ...emptyBatch, sourceId: activeSources[0]?.id || "" }); setModal("batch"); }}><Plus size={13} /> Tambah batch</button></div>
        <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><caption className="sr-only">Daftar batch prospek dan hasil pemeriksaannya</caption><thead><tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400"><th className="pb-3">Batch</th><th className="pb-3">Status</th><th className="pb-3 text-center">Total</th><th className="pb-3 text-center">Valid</th><th className="pb-3 text-center">Tersaring</th><th className="pb-3 text-center">Lead</th><th className="pb-3 text-right">Tindakan</th></tr></thead><tbody>{batches.map((batch) => <tr key={batch.id} className="border-b border-slate-100 last:border-0"><td className="py-4"><span className="block font-semibold text-slate-800">{batch.import_key}</span><span className="mt-0.5 block text-[10px] text-slate-400">{batch.file_name || "Impor manual"}</span></td><td><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${batch.status === "staged" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{statusLabel(batch.status)}</span></td><td className="text-center">{batch.total_rows}</td><td className="text-center text-emerald-700">{batch.valid_rows}</td><td className="text-center text-slate-500">{batch.invalid_rows + batch.duplicate_rows + batch.suppressed_rows}</td><td className="text-center font-semibold text-[#0B2C6B]">{batch.promoted_rows}</td><td className="text-right">{batch.status === "staged" ? <button type="button" className="rounded-lg bg-[#0B2C6B] px-3 py-2 text-[11px] font-semibold text-white" onClick={() => review(batch)}>Tinjau</button> : <span className="text-slate-300">Selesai</span>}</td></tr>)}</tbody></table>{!batches.length && <div className="py-12 text-center"><Inbox size={24} className="mx-auto text-slate-300" /><p className="mt-3 text-sm text-slate-500">Belum ada batch prospek.</p><p className="mt-1 text-xs text-slate-400">Aktifkan sumber data, lalu tambahkan batch pertama.</p></div>}</div>
      </section>
    </div>}

    {modal && <AdminModal title={{ source: sourceForm.id ? "Perbarui Sumber Data" : "Tambah Sumber Data", campaign: campaignForm.id ? "Perbarui Kampanye" : "Tambah Kampanye", batch: "Tambahkan Batch Prospek", review: "Tinjau Batch Prospek" }[modal]} eyebrow="Tata kelola akuisisi" onClose={() => setModal(null)} maxWidth="max-w-3xl">
      {error && <div role="alert" aria-live="assertive" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {modal === "source" && <div className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><AdminInput label="Kunci sumber" value={sourceForm.sourceKey} onChange={(value) => setSourceForm((form) => ({ ...form, sourceKey: value.toLowerCase() }))} /><AdminInput label="Nama sumber" value={sourceForm.name} onChange={(value) => setSourceForm((form) => ({ ...form, name: value }))} /><label><FieldLabel label="Penyedia" /><AdminSelect value={sourceForm.providerType} onChange={(value) => setSourceForm((form) => ({ ...form, providerType: value }))} options={["manual_upload","website","google_ads","meta_ads","microsoft_ads","apollo","hunter","linkedin","google_maps","referral","partner","other"]} /></label><label><FieldLabel label="Kanal" /><AdminSelect value={sourceForm.channel} onChange={(value) => setSourceForm((form) => ({ ...form, channel: value }))} options={["inbound","outbound","partner","offline"]} /></label><label><FieldLabel label="Dasar pemrosesan" /><AdminSelect value={sourceForm.lawfulBasis} onChange={(value) => setSourceForm((form) => ({ ...form, lawfulBasis: value }))} options={[["","Belum ditentukan"],["consent","Persetujuan"],["legitimate_interest","Kepentingan sah"],["contract","Kontrak"],["legal_obligation","Kewajiban hukum"],["public_task","Tugas publik"],["not_applicable","Tidak berlaku"]]} /></label><AdminInput label="Masa simpan (hari)" type="number" value={sourceForm.retentionDays} onChange={(value) => setSourceForm((form) => ({ ...form, retentionDays: value }))} /><AdminInput label="Pemilik data" type="email" value={sourceForm.dataOwner} onChange={(value) => setSourceForm((form) => ({ ...form, dataOwner: value }))} /><AdminInput label="Penanggung jawab legal" type="email" value={sourceForm.legalOwner} onChange={(value) => setSourceForm((form) => ({ ...form, legalOwner: value }))} /><label><FieldLabel label="Status" /><AdminSelect value={sourceForm.status} onChange={(value) => setSourceForm((form) => ({ ...form, status: value, active: value === "approved" ? form.active : false }))} options={[["draft","Draf"],["approved","Disetujui"],["paused","Dijeda"],["rejected","Ditolak"]]} /></label><AdminInput label="URL kebijakan privasi" value={sourceForm.privacyNoticeUrl} onChange={(value) => setSourceForm((form) => ({ ...form, privacyNoticeUrl: value }))} /></div><AdminTextarea label="Metode akuisisi" value={sourceForm.acquisitionMethod} onChange={(value) => setSourceForm((form) => ({ ...form, acquisitionMethod: value }))} /><div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={sourceForm.active} onChange={(event) => setSourceForm((form) => ({ ...form, active: event.target.checked }))} /> Sumber aktif</label><label className="mt-3 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={sourceForm.humanApproved} onChange={(event) => setSourceForm((form) => ({ ...form, humanApproved: event.target.checked }))} /> Disetujui penanggung jawab</label><div className="mt-3"><AdminTextarea label="Catatan persetujuan" value={sourceForm.approvalNote} onChange={(value) => setSourceForm((form) => ({ ...form, approvalNote: value }))} /></div></div><button type="button" className={buttonClass} disabled={saving} onClick={() => execute(async () => { await onAction("/api/admin/acquisition", { method: "POST", body: JSON.stringify({ action: "source", payload: { ...sourceForm, id: sourceForm.id || null, lawfulBasis: sourceForm.lawfulBasis || null, privacyNoticeUrl: sourceForm.privacyNoticeUrl || null, retentionDays: sourceForm.retentionDays ? Number(sourceForm.retentionDays) : null, dataOwner: sourceForm.dataOwner || null, legalOwner: sourceForm.legalOwner || null, config: sourceForm.config, approvalNote: sourceForm.approvalNote || null } }) }); })}>{saving && <RefreshCw size={14} className="animate-spin" />} Simpan sumber</button></div>}
      {modal === "campaign" && <div className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><label><FieldLabel label="Sumber data" /><AdminSelect value={campaignForm.sourceId} onChange={(value) => setCampaignForm((form) => ({ ...form, sourceId: value }))} options={activeSources.map((source) => [source.id, source.name])} /></label><AdminInput label="Kode kampanye" value={campaignForm.campaignCode} onChange={(value) => setCampaignForm((form) => ({ ...form, campaignCode: value.toUpperCase() }))} /><AdminInput label="Nama kampanye" value={campaignForm.name} onChange={(value) => setCampaignForm((form) => ({ ...form, name: value }))} /><AdminInput label="Penanggung jawab" type="email" value={campaignForm.owner} onChange={(value) => setCampaignForm((form) => ({ ...form, owner: value }))} /><label><FieldLabel label="Tujuan" /><AdminSelect value={campaignForm.objective} onChange={(value) => setCampaignForm((form) => ({ ...form, objective: value }))} options={[["awareness","Kesadaran merek"],["traffic","Kunjungan"],["assessment","Assessment"],["consultation","Konsultasi"],["lead_generation","Perolehan lead"]]} /></label><label><FieldLabel label="Kanal" /><AdminSelect value={campaignForm.channel} onChange={(value) => setCampaignForm((form) => ({ ...form, channel: value }))} options={["email","google_ads","meta_ads","microsoft_ads","linkedin","referral","organic","other"]} /></label><label><FieldLabel label="Status" /><AdminSelect value={campaignForm.status} onChange={(value) => setCampaignForm((form) => ({ ...form, status: value }))} options={[["draft","Draf"],["approved","Disetujui"],["active","Aktif"],["paused","Dijeda"],["completed","Selesai"],["cancelled","Dibatalkan"]]} /></label><AdminInput label="Anggaran" type="number" value={campaignForm.budgetAmount} onChange={(value) => setCampaignForm((form) => ({ ...form, budgetAmount: value }))} /><AdminInput label="Tanggal mulai" type="date" value={campaignForm.startsOn} onChange={(value) => setCampaignForm((form) => ({ ...form, startsOn: value }))} /><AdminInput label="Tanggal selesai" type="date" value={campaignForm.endsOn} onChange={(value) => setCampaignForm((form) => ({ ...form, endsOn: value }))} /><AdminInput label="Sumber UTM" value={campaignForm.utmSource} onChange={(value) => setCampaignForm((form) => ({ ...form, utmSource: value }))} /><AdminInput label="Media UTM" value={campaignForm.utmMedium} onChange={(value) => setCampaignForm((form) => ({ ...form, utmMedium: value }))} /></div><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={campaignForm.humanApproved} onChange={(event) => setCampaignForm((form) => ({ ...form, humanApproved: event.target.checked }))} /> Disetujui penanggung jawab</label><AdminTextarea label="Catatan persetujuan" value={campaignForm.approvalNote} onChange={(value) => setCampaignForm((form) => ({ ...form, approvalNote: value }))} /><button type="button" className={buttonClass} disabled={saving} onClick={() => execute(async () => { await onAction("/api/admin/acquisition", { method: "POST", body: JSON.stringify({ action: "campaign", payload: { id: campaignForm.id || null, sourceId: campaignForm.sourceId, campaignCode: campaignForm.campaignCode, name: campaignForm.name, objective: campaignForm.objective, channel: campaignForm.channel, status: campaignForm.status, owner: campaignForm.owner, budgetAmount: campaignForm.budgetAmount ? Number(campaignForm.budgetAmount) : null, currency: campaignForm.currency, startsOn: campaignForm.startsOn || null, endsOn: campaignForm.endsOn || null, utmConfig: { source: campaignForm.utmSource, medium: campaignForm.utmMedium, campaign: campaignForm.utmCampaign || campaignForm.campaignCode.toLowerCase() }, targetDefinition: campaignForm.targetDefinition, humanApproved: campaignForm.humanApproved, approvalNote: campaignForm.approvalNote || null } }) }); })}>Simpan kampanye</button></div>}
      {modal === "batch" && <div className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><label><FieldLabel label="Sumber data aktif" /><AdminSelect value={batchForm.sourceId} onChange={(value) => setBatchForm((form) => ({ ...form, sourceId: value, campaignId: "" }))} options={activeSources.map((source) => [source.id, source.name])} /></label><label><FieldLabel label="Kampanye (opsional)" /><AdminSelect value={batchForm.campaignId} onChange={(value) => setBatchForm((form) => ({ ...form, campaignId: value }))} options={[["","Tanpa kampanye"], ...campaigns.filter((item) => item.source_id === batchForm.sourceId && ["approved","active"].includes(item.status)).map((item) => [item.id,item.name] as [string,string])]} /></label><AdminInput label="Kunci impor unik" value={batchForm.importKey} onChange={(value) => setBatchForm((form) => ({ ...form, importKey: value }))} /><AdminInput label="Nama file / referensi" value={batchForm.fileName} onChange={(value) => setBatchForm((form) => ({ ...form, fileName: value }))} /></div><div className="border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><FieldLabel label="Unggah hasil riset manual" /><p className="mt-1 text-xs text-slate-500">Terima CSV atau JSON, maksimal 500 prospek. File hanya diproses di browser lalu ditampilkan untuk diperiksa.</p></div><a className={secondaryButton} download="template-prospek-binahub.csv" href={'data:text/csv;charset=utf-8,name,email,company,role_title,industry,location,employee_range,website_url,linkedin_url,source_url,consent_status%0A'}>Unduh template CSV</a></div><input type="file" accept=".csv,.json,text/csv,application/json" className="mt-3 block w-full text-xs text-slate-600 file:mr-3 file:border-0 file:bg-[#0B2C6B] file:px-3 file:py-2 file:font-semibold file:text-white" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; void file.text().then((content) => { const parsed = file.name.toLowerCase().endsWith(".json") ? JSON.parse(content) : prospectsFromCsv(content); if (!Array.isArray(parsed)) throw new Error("File harus berisi daftar prospek."); setBatchForm((form) => ({ ...form, fileName: file.name, prospectsJson: JSON.stringify(parsed.slice(0, 500), null, 2) })); setError(""); }).catch((fileError: unknown) => setError(fileError instanceof Error ? fileError.message : "File tidak dapat dibaca.")); }} /></div><AdminTextarea label="Data prospek" help="Periksa hasil impor atau tempel JSON berisi 1–500 data. Prospek tidak akan langsung dihubungi." minHeight="min-h-72" value={batchForm.prospectsJson} onChange={(value) => setBatchForm((form) => ({ ...form, prospectsJson: value }))} /><button type="button" className={buttonClass} disabled={saving} onClick={() => execute(async () => { const parsed = JSON.parse(batchForm.prospectsJson) as unknown; await onAction("/api/admin/acquisition", { method: "POST", body: JSON.stringify({ action: "batch", payload: { sourceId: batchForm.sourceId, campaignId: batchForm.campaignId || null, importKey: batchForm.importKey, fileName: batchForm.fileName || null, fileChecksum: batchForm.fileChecksum || null, prospects: parsed } }) }); })}>Tambah batch</button></div>}
      {modal === "review" && reviewBatch && <div className="space-y-4"><div className="rounded-xl bg-slate-50 p-4 text-sm"><strong>{reviewBatch.import_key}</strong><p className="mt-2 text-slate-600">Valid {reviewBatch.valid_rows}, tidak valid {reviewBatch.invalid_rows}, ganda {reviewBatch.duplicate_rows}, diblokir {reviewBatch.suppressed_rows}. Persetujuan hanya memasukkan batch ke antrean pemrosesan dan tidak mengirim email.</p></div><label><FieldLabel label="Keputusan" /><AdminSelect value={reviewForm.decision} onChange={(value) => setReviewForm((form) => ({ ...form, decision: value }))} options={[["approved","Setujui"],["rejected","Tolak"]]} /></label><AdminTextarea label="Catatan tinjauan" value={reviewForm.note} onChange={(value) => setReviewForm((form) => ({ ...form, note: value }))} /><button type="button" className={buttonClass} disabled={saving || reviewForm.note.length < 5} onClick={() => execute(async () => { await onAction("/api/admin/acquisition", { method: "PATCH", body: JSON.stringify({ batchId: reviewBatch.id, decision: reviewForm.decision, note: reviewForm.note }) }); })}><ShieldCheck size={14} /> Simpan keputusan</button></div>}
    </AdminModal>}
  </div>;
}
