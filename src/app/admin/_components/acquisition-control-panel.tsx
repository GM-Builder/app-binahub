"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DatabaseZap, FileCheck2, Megaphone, Plus, RefreshCw, ShieldCheck } from "lucide-react";
import { AdminInput, AdminModal, AdminSelect, AdminTextarea, FieldLabel, Panel, StatCard } from "./shared";
import { LeadAgentPanel } from "./lead-agent-panel";
import { InboundAttributionPanel } from "./inbound-attribution-panel";
import { ControlledOutboundPanel } from "./controlled-outbound-panel";

type AdminAction = (url: string, init?: RequestInit) => Promise<unknown>;
type Source = { id: string; source_key: string; name: string; provider_type: string; channel: string; acquisition_method: string; lawful_basis: string | null; privacy_notice_url: string | null; retention_days: number | null; data_owner: string | null; legal_owner: string | null; status: string; active: boolean; config: Record<string, unknown>; approval_note: string | null };
type Campaign = { id: string; source_id: string; campaign_code: string; name: string; objective: string; channel: string; status: string; owner: string; budget_amount: number | null; currency: string; starts_on: string | null; ends_on: string | null; utm_config: Record<string, unknown>; target_definition: Record<string, unknown>; approval_note: string | null };
type Batch = { id: string; source_id: string; campaign_id: string | null; import_key: string; file_name: string | null; status: string; total_rows: number; valid_rows: number; invalid_rows: number; duplicate_rows: number; suppressed_rows: number; promoted_rows: number; created_at: string };
type Prospect = { id: string; batch_id: string; name: string; email: string; company: string | null; validation_status: string; validation_reasons: string[] };
type AcquisitionResponse = { success: boolean; phase5Ready: boolean; sources: Source[]; campaigns: Campaign[]; batches: Batch[]; prospects: Prospect[] };

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
      acquisitionMethod: "Ekspor prospek secara manual dari Apollo Free dan impor CSV/JSON ke Batch Prospek. API tetap dinonaktifkan sampai paket Apollo Pro tersedia; seluruh data melalui validasi, deduplikasi, suppression, dan tinjauan manusia.",
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

  return <div className="space-y-6">
    {error && <div role="alert" aria-live="assertive" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">Data baru selalu masuk ke area peninjauan. Sumber, kampanye, dan batch harus disetujui terlebih dahulu; alamat yang diblokir dan data ganda diperiksa sebelum prospek dijadikan lead.</div>
    <LeadAgentPanel onAction={onAction} />
    <InboundAttributionPanel onAction={onAction} />
    <ControlledOutboundPanel onAction={onAction} />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Sumber data aktif" value={activeSources.length} icon={ShieldCheck} />
      <StatCard label="Kampanye aktif" value={campaigns.filter((item) => item.status === "active").length} icon={Megaphone} />
      <StatCard label="Batch menunggu tinjauan" value={batches.filter((item) => item.status === "staged").length} icon={FileCheck2} />
      <StatCard label="Data ditolak atau ganda" value={prospects.filter((item) => ["invalid", "duplicate", "suppressed", "excluded"].includes(item.validation_status)).length} icon={DatabaseZap} />
    </div>

    <div className="grid gap-6 xl:grid-cols-2">
      <Panel title="Sumber Data" action={`${sources.length} sumber`}>
        <div className="flex flex-wrap gap-2"><button type="button" className={secondaryButton} onClick={prepareApolloSource}><Plus size={13} /> Siapkan Apollo Manual</button><button type="button" className={secondaryButton} onClick={() => editSource()}><Plus size={13} /> Sumber lainnya</button></div>
        <div className="mt-4 space-y-3">{sources.map((source) => <button type="button" key={source.id} onClick={() => editSource(source)} className="w-full rounded-xl border border-slate-200 p-4 text-left transition-colors hover:border-[#D9A441]"><div className="flex justify-between gap-3"><div><p className="text-sm font-bold text-[#0B2C6B]">{source.name}</p><p className="mt-1 text-xs text-slate-500">{source.provider_type.replaceAll("_", " ")} · {source.channel} · {source.lawful_basis?.replaceAll("_", " ") || "dasar pemrosesan belum ditentukan"}</p></div><span className={`h-fit rounded-full px-2 py-1 text-[10px] font-bold uppercase ${source.status === "approved" && source.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{statusLabel(source.status)}{source.active ? " · aktif" : ""}</span></div></button>)}</div>
      </Panel>
      <Panel title="Kampanye" action={`${campaigns.length} kampanye`}>
        <div className="flex flex-wrap gap-2"><button type="button" className={secondaryButton} onClick={prepareApolloCampaign} disabled={!activeSources.some((source) => source.source_key === "ai_lead_discovery_apollo")}><Plus size={13} /> Siapkan kampanye Apollo</button><button type="button" className={secondaryButton} onClick={() => editCampaign()} disabled={!activeSources.length}><Plus size={13} /> Kampanye lainnya</button></div>
        {!activeSources.length && <p className="mt-3 text-xs text-amber-700">Setujui dan aktifkan minimal satu sumber data sebelum membuat kampanye.</p>}
        <div className="mt-4 space-y-3">{campaigns.map((campaign) => <button type="button" key={campaign.id} onClick={() => editCampaign(campaign)} className="w-full rounded-xl border border-slate-200 p-4 text-left transition-colors hover:border-[#D9A441]"><div className="flex justify-between gap-3"><div><p className="text-sm font-bold text-[#0B2C6B]">{campaign.name}</p><p className="mt-1 text-xs text-slate-500">{campaign.campaign_code} · {campaign.objective.replaceAll("_", " ")} · {campaign.owner}</p></div><span className="h-fit rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-600">{statusLabel(campaign.status)}</span></div></button>)}</div>
      </Panel>
    </div>

    <div id="batch-prospek" className="scroll-mt-24"><Panel title="Batch Prospek" action={`${batches.length} batch`}>
      <button type="button" className={secondaryButton} disabled={!activeSources.length} onClick={() => { setBatchForm({ ...emptyBatch, sourceId: activeSources[0]?.id || "" }); setModal("batch"); }}><Plus size={13} /> Tambah batch</button>
      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[850px] text-left text-xs"><caption className="sr-only">Daftar batch prospek dan hasil pemeriksaannya</caption><thead><tr className="border-b text-[10px] uppercase tracking-wide text-slate-400"><th className="pb-3">Kunci impor</th><th className="pb-3">Status</th><th className="pb-3">Total</th><th className="pb-3">Valid</th><th className="pb-3">Tidak valid</th><th className="pb-3">Ganda</th><th className="pb-3">Diblokir</th><th className="pb-3">Dijadikan lead</th><th className="pb-3">Aksi</th></tr></thead><tbody>{batches.map((batch) => <tr key={batch.id} className="border-b border-slate-100"><td className="py-3 font-semibold text-[#0B2C6B]">{batch.import_key}</td><td>{statusLabel(batch.status)}</td><td>{batch.total_rows}</td><td>{batch.valid_rows}</td><td>{batch.invalid_rows}</td><td>{batch.duplicate_rows}</td><td>{batch.suppressed_rows}</td><td>{batch.promoted_rows}</td><td>{batch.status === "staged" ? <button type="button" className={secondaryButton} onClick={() => review(batch)}>Tinjau</button> : "—"}</td></tr>)}</tbody></table>{!batches.length && <p className="py-5 text-sm text-slate-500">Belum ada batch. Aktifkan sumber data terlebih dahulu sebelum mengunggah prospek.</p>}</div>
    </Panel></div>

    {modal && <AdminModal title={{ source: sourceForm.id ? "Perbarui Sumber Data" : "Tambah Sumber Data", campaign: campaignForm.id ? "Perbarui Kampanye" : "Tambah Kampanye", batch: "Tambahkan Batch Prospek", review: "Tinjau Batch Prospek" }[modal]} eyebrow="Tata kelola akuisisi" onClose={() => setModal(null)} maxWidth="max-w-3xl">
      {error && <div role="alert" aria-live="assertive" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {modal === "source" && <div className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><AdminInput label="Kunci sumber" value={sourceForm.sourceKey} onChange={(value) => setSourceForm((form) => ({ ...form, sourceKey: value.toLowerCase() }))} /><AdminInput label="Nama sumber" value={sourceForm.name} onChange={(value) => setSourceForm((form) => ({ ...form, name: value }))} /><label><FieldLabel label="Penyedia" /><AdminSelect value={sourceForm.providerType} onChange={(value) => setSourceForm((form) => ({ ...form, providerType: value }))} options={["manual_upload","website","google_ads","meta_ads","microsoft_ads","apollo","hunter","linkedin","google_maps","referral","partner","other"]} /></label><label><FieldLabel label="Kanal" /><AdminSelect value={sourceForm.channel} onChange={(value) => setSourceForm((form) => ({ ...form, channel: value }))} options={["inbound","outbound","partner","offline"]} /></label><label><FieldLabel label="Dasar pemrosesan" /><AdminSelect value={sourceForm.lawfulBasis} onChange={(value) => setSourceForm((form) => ({ ...form, lawfulBasis: value }))} options={[["","Belum ditentukan"],["consent","Persetujuan"],["legitimate_interest","Kepentingan sah"],["contract","Kontrak"],["legal_obligation","Kewajiban hukum"],["public_task","Tugas publik"],["not_applicable","Tidak berlaku"]]} /></label><AdminInput label="Masa simpan (hari)" type="number" value={sourceForm.retentionDays} onChange={(value) => setSourceForm((form) => ({ ...form, retentionDays: value }))} /><AdminInput label="Pemilik data" type="email" value={sourceForm.dataOwner} onChange={(value) => setSourceForm((form) => ({ ...form, dataOwner: value }))} /><AdminInput label="Penanggung jawab legal" type="email" value={sourceForm.legalOwner} onChange={(value) => setSourceForm((form) => ({ ...form, legalOwner: value }))} /><label><FieldLabel label="Status" /><AdminSelect value={sourceForm.status} onChange={(value) => setSourceForm((form) => ({ ...form, status: value, active: value === "approved" ? form.active : false }))} options={[["draft","Draf"],["approved","Disetujui"],["paused","Dijeda"],["rejected","Ditolak"]]} /></label><AdminInput label="URL kebijakan privasi" value={sourceForm.privacyNoticeUrl} onChange={(value) => setSourceForm((form) => ({ ...form, privacyNoticeUrl: value }))} /></div><AdminTextarea label="Metode akuisisi" value={sourceForm.acquisitionMethod} onChange={(value) => setSourceForm((form) => ({ ...form, acquisitionMethod: value }))} /><div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={sourceForm.active} onChange={(event) => setSourceForm((form) => ({ ...form, active: event.target.checked }))} /> Sumber aktif</label><label className="mt-3 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={sourceForm.humanApproved} onChange={(event) => setSourceForm((form) => ({ ...form, humanApproved: event.target.checked }))} /> Disetujui penanggung jawab</label><div className="mt-3"><AdminTextarea label="Catatan persetujuan" value={sourceForm.approvalNote} onChange={(value) => setSourceForm((form) => ({ ...form, approvalNote: value }))} /></div></div><button type="button" className={buttonClass} disabled={saving} onClick={() => execute(async () => { await onAction("/api/admin/acquisition", { method: "POST", body: JSON.stringify({ action: "source", payload: { ...sourceForm, id: sourceForm.id || null, lawfulBasis: sourceForm.lawfulBasis || null, privacyNoticeUrl: sourceForm.privacyNoticeUrl || null, retentionDays: sourceForm.retentionDays ? Number(sourceForm.retentionDays) : null, dataOwner: sourceForm.dataOwner || null, legalOwner: sourceForm.legalOwner || null, config: sourceForm.config, approvalNote: sourceForm.approvalNote || null } }) }); })}>{saving && <RefreshCw size={14} className="animate-spin" />} Simpan sumber</button></div>}
      {modal === "campaign" && <div className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><label><FieldLabel label="Sumber data" /><AdminSelect value={campaignForm.sourceId} onChange={(value) => setCampaignForm((form) => ({ ...form, sourceId: value }))} options={activeSources.map((source) => [source.id, source.name])} /></label><AdminInput label="Kode kampanye" value={campaignForm.campaignCode} onChange={(value) => setCampaignForm((form) => ({ ...form, campaignCode: value.toUpperCase() }))} /><AdminInput label="Nama kampanye" value={campaignForm.name} onChange={(value) => setCampaignForm((form) => ({ ...form, name: value }))} /><AdminInput label="Penanggung jawab" type="email" value={campaignForm.owner} onChange={(value) => setCampaignForm((form) => ({ ...form, owner: value }))} /><label><FieldLabel label="Tujuan" /><AdminSelect value={campaignForm.objective} onChange={(value) => setCampaignForm((form) => ({ ...form, objective: value }))} options={[["awareness","Kesadaran merek"],["traffic","Kunjungan"],["assessment","Assessment"],["consultation","Konsultasi"],["lead_generation","Perolehan lead"]]} /></label><label><FieldLabel label="Kanal" /><AdminSelect value={campaignForm.channel} onChange={(value) => setCampaignForm((form) => ({ ...form, channel: value }))} options={["email","google_ads","meta_ads","microsoft_ads","linkedin","referral","organic","other"]} /></label><label><FieldLabel label="Status" /><AdminSelect value={campaignForm.status} onChange={(value) => setCampaignForm((form) => ({ ...form, status: value }))} options={[["draft","Draf"],["approved","Disetujui"],["active","Aktif"],["paused","Dijeda"],["completed","Selesai"],["cancelled","Dibatalkan"]]} /></label><AdminInput label="Anggaran" type="number" value={campaignForm.budgetAmount} onChange={(value) => setCampaignForm((form) => ({ ...form, budgetAmount: value }))} /><AdminInput label="Tanggal mulai" type="date" value={campaignForm.startsOn} onChange={(value) => setCampaignForm((form) => ({ ...form, startsOn: value }))} /><AdminInput label="Tanggal selesai" type="date" value={campaignForm.endsOn} onChange={(value) => setCampaignForm((form) => ({ ...form, endsOn: value }))} /><AdminInput label="Sumber UTM" value={campaignForm.utmSource} onChange={(value) => setCampaignForm((form) => ({ ...form, utmSource: value }))} /><AdminInput label="Media UTM" value={campaignForm.utmMedium} onChange={(value) => setCampaignForm((form) => ({ ...form, utmMedium: value }))} /></div><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={campaignForm.humanApproved} onChange={(event) => setCampaignForm((form) => ({ ...form, humanApproved: event.target.checked }))} /> Disetujui penanggung jawab</label><AdminTextarea label="Catatan persetujuan" value={campaignForm.approvalNote} onChange={(value) => setCampaignForm((form) => ({ ...form, approvalNote: value }))} /><button type="button" className={buttonClass} disabled={saving} onClick={() => execute(async () => { await onAction("/api/admin/acquisition", { method: "POST", body: JSON.stringify({ action: "campaign", payload: { id: campaignForm.id || null, sourceId: campaignForm.sourceId, campaignCode: campaignForm.campaignCode, name: campaignForm.name, objective: campaignForm.objective, channel: campaignForm.channel, status: campaignForm.status, owner: campaignForm.owner, budgetAmount: campaignForm.budgetAmount ? Number(campaignForm.budgetAmount) : null, currency: campaignForm.currency, startsOn: campaignForm.startsOn || null, endsOn: campaignForm.endsOn || null, utmConfig: { source: campaignForm.utmSource, medium: campaignForm.utmMedium, campaign: campaignForm.utmCampaign || campaignForm.campaignCode.toLowerCase() }, targetDefinition: campaignForm.targetDefinition, humanApproved: campaignForm.humanApproved, approvalNote: campaignForm.approvalNote || null } }) }); })}>Simpan kampanye</button></div>}
      {modal === "batch" && <div className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><label><FieldLabel label="Sumber data aktif" /><AdminSelect value={batchForm.sourceId} onChange={(value) => setBatchForm((form) => ({ ...form, sourceId: value, campaignId: "" }))} options={activeSources.map((source) => [source.id, source.name])} /></label><label><FieldLabel label="Kampanye (opsional)" /><AdminSelect value={batchForm.campaignId} onChange={(value) => setBatchForm((form) => ({ ...form, campaignId: value }))} options={[["","Tanpa kampanye"], ...campaigns.filter((item) => item.source_id === batchForm.sourceId && ["approved","active"].includes(item.status)).map((item) => [item.id,item.name] as [string,string])]} /></label><AdminInput label="Kunci impor unik" value={batchForm.importKey} onChange={(value) => setBatchForm((form) => ({ ...form, importKey: value }))} /><AdminInput label="Nama file / referensi" value={batchForm.fileName} onChange={(value) => setBatchForm((form) => ({ ...form, fileName: value }))} /></div><div className="border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><FieldLabel label="Unggah hasil riset manual" /><p className="mt-1 text-xs text-slate-500">Terima CSV atau JSON, maksimal 500 prospek. File hanya diproses di browser lalu ditampilkan untuk diperiksa.</p></div><a className={secondaryButton} download="template-prospek-binahub.csv" href={'data:text/csv;charset=utf-8,name,email,company,role_title,industry,location,employee_range,website_url,linkedin_url,source_url,consent_status%0A'}>Unduh template CSV</a></div><input type="file" accept=".csv,.json,text/csv,application/json" className="mt-3 block w-full text-xs text-slate-600 file:mr-3 file:border-0 file:bg-[#0B2C6B] file:px-3 file:py-2 file:font-semibold file:text-white" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; void file.text().then((content) => { const parsed = file.name.toLowerCase().endsWith(".json") ? JSON.parse(content) : prospectsFromCsv(content); if (!Array.isArray(parsed)) throw new Error("File harus berisi daftar prospek."); setBatchForm((form) => ({ ...form, fileName: file.name, prospectsJson: JSON.stringify(parsed.slice(0, 500), null, 2) })); setError(""); }).catch((fileError: unknown) => setError(fileError instanceof Error ? fileError.message : "File tidak dapat dibaca.")); }} /></div><AdminTextarea label="Data prospek" help="Periksa hasil impor atau tempel JSON berisi 1–500 data. Prospek tidak akan langsung dihubungi." minHeight="min-h-72" value={batchForm.prospectsJson} onChange={(value) => setBatchForm((form) => ({ ...form, prospectsJson: value }))} /><button type="button" className={buttonClass} disabled={saving} onClick={() => execute(async () => { const parsed = JSON.parse(batchForm.prospectsJson) as unknown; await onAction("/api/admin/acquisition", { method: "POST", body: JSON.stringify({ action: "batch", payload: { sourceId: batchForm.sourceId, campaignId: batchForm.campaignId || null, importKey: batchForm.importKey, fileName: batchForm.fileName || null, fileChecksum: batchForm.fileChecksum || null, prospects: parsed } }) }); })}>Tambah batch</button></div>}
      {modal === "review" && reviewBatch && <div className="space-y-4"><div className="rounded-xl bg-slate-50 p-4 text-sm"><strong>{reviewBatch.import_key}</strong><p className="mt-2 text-slate-600">Valid {reviewBatch.valid_rows}, tidak valid {reviewBatch.invalid_rows}, ganda {reviewBatch.duplicate_rows}, diblokir {reviewBatch.suppressed_rows}. Persetujuan hanya memasukkan batch ke antrean pemrosesan dan tidak mengirim email.</p></div><label><FieldLabel label="Keputusan" /><AdminSelect value={reviewForm.decision} onChange={(value) => setReviewForm((form) => ({ ...form, decision: value }))} options={[["approved","Setujui"],["rejected","Tolak"]]} /></label><AdminTextarea label="Catatan tinjauan" value={reviewForm.note} onChange={(value) => setReviewForm((form) => ({ ...form, note: value }))} /><button type="button" className={buttonClass} disabled={saving || reviewForm.note.length < 5} onClick={() => execute(async () => { await onAction("/api/admin/acquisition", { method: "PATCH", body: JSON.stringify({ batchId: reviewBatch.id, decision: reviewForm.decision, note: reviewForm.note }) }); })}><ShieldCheck size={14} /> Simpan keputusan</button></div>}
    </AdminModal>}
  </div>;
}
