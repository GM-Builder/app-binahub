"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Mail, RefreshCw, Search, Settings2, ShieldCheck, Upload } from "lucide-react";
import { AdminModal, AdminSelect, ConfirmDialog } from "./shared";
import { OutboundSettingsDialog, type OutboundSettings } from "./outbound-settings-dialog";
import { QuickEmailCampaign } from "./quick-email-campaign";
import { importRowIssue, parseManualTargets, prospectsFromCsv, validateImportedProspects, type ImportedProspect } from "../_lib/prospect-import";

type Action = (url: string, init?: RequestInit) => Promise<unknown>;
type Campaign = { id: string; source_id: string; name: string; channel: string; status: string };
type Source = { id: string; name: string; channel: string; status: string; active: boolean; lawful_basis?: string | null };
type Batch = { id: string; campaign_id: string | null; import_key: string; status: string; total_rows?: number; valid_rows: number; invalid_rows: number; duplicate_rows: number; suppressed_rows: number };
type Target = { id: string; batch_id: string; name: string; email: string; company: string | null; blockedReason: string | null; deliveryStatus: string | null; validation_status: string };
type Delivery = { id: string; name: string; email: string; kind: string; status: string; error_message: string | null; created_at: string };
export type OutboundEmailResponse = { ready: boolean; blockers: string[]; setupBlockers?: string[]; settings?: OutboundSettings; myEmail: string; mode: string; testSent: boolean; templateVersion: string | null; preview: { subject: string; previewHtml: string } | null; prospects: Target[]; deliveries: Delivery[] };
type Tab = "targets" | "message" | "review" | "activity";
const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0B2C6B] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#071B3D] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500";
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50";
const deliveryLabels: Record<string, string> = { queued: "Dalam antrean", processing: "Sedang dikirim", sent: "Diterima penyedia email", blocked: "Tidak dikirim", uncertain: "Perlu diperiksa" };
const tabs: Array<{ id: Tab; title: string }> = [{ id: "targets", title: "Penerima" }, { id: "message", title: "Email" }, { id: "review", title: "Tinjau" }, { id: "activity", title: "Hasil" }];

export function OutboundEmailPanel({ onAction, onRefresh, sources, campaigns, batches, onSetup, onUnsavedChange }: { onAction: Action; onRefresh: () => Promise<void>; sources: Source[]; campaigns: Campaign[]; batches: Batch[]; onSetup: () => void; onUnsavedChange?: (dirty: boolean) => void }) {
  const [campaignId, setCampaignId] = useState("");
  const [locale, setLocale] = useState("id");
  const [createOpen, setCreateOpen] = useState(false);
  const [workflowBusy, setWorkflowBusy] = useState(false);
  const dirty = useRef(false);
  const reportDirty = useCallback((value: boolean) => { dirty.current = value; onUnsavedChange?.(value); }, [onUnsavedChange]);
  const maySwitch = () => !dirty.current || window.confirm('Pilihan penerima atau isian kampanye belum dikirim. Tetap tinggalkan kampanye ini?');
  const emailCampaigns = campaigns.filter((campaign) => campaign.channel === "email" && sources.some((source) => source.id === campaign.source_id && source.channel === "outbound"));
  const selectedId = campaignId || emailCampaigns[0]?.id || "";
  const campaign = emailCampaigns.find((item) => item.id === selectedId);
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs" aria-labelledby="outbound-email-title">
    <header className="border-b border-slate-100 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 id="outbound-email-title" className="text-xl font-semibold tracking-tight text-slate-950">Kampanye email</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Pilih penerima, periksa email, lalu konfirmasikan pengiriman. Anda dipandu satu langkah setiap kali.</p></div><button type="button" disabled={workflowBusy} className={secondary} onClick={() => { if (maySwitch()) setCreateOpen(true); }}>Buat kampanye</button></div>
      {emailCampaigns.length > 0 && <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_170px]"><label className="text-xs font-semibold text-slate-600">Kampanye<AdminSelect disabled={workflowBusy} ariaLabel="Kampanye email" value={selectedId} onChange={id => { if (id === selectedId || maySwitch()) setCampaignId(id); }} options={emailCampaigns.map((item) => [item.id, item.name])} /></label><label className="text-xs font-semibold text-slate-600">Bahasa email<AdminSelect disabled={workflowBusy} ariaLabel="Bahasa email" value={locale} onChange={setLocale} options={[["id", "Indonesia"], ["en", "English"]]} /></label></div>}
    </header>
    {campaign ? <OutboundCampaignWorkflow key={campaign.id} campaign={campaign} source={sources.find((item) => item.id === campaign.source_id)!} batches={batches.filter((item) => item.campaign_id === campaign.id)} locale={locale} onAction={onAction} onRefresh={onRefresh} onUnsavedChange={reportDirty} onBusyChange={setWorkflowBusy} /> : <div className="p-8 text-center"><Mail size={30} aria-hidden="true" className="mx-auto text-slate-300" /><h3 className="mt-4 font-semibold text-slate-900">Siapkan kampanye pertama Anda</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Beri nama kampanye dan pilih asal daftar penerima. Membuat kampanye belum mengirim email.</p><button type="button" className={`${primary} mt-5`} onClick={() => setCreateOpen(true)}>Siapkan kampanye <ArrowRight size={15} aria-hidden="true" /></button></div>}
    {createOpen && <QuickEmailCampaign sources={sources} onAction={onAction} onClose={() => setCreateOpen(false)} onAdvanced={onSetup} onCreated={async (id) => { await onRefresh(); setCampaignId(id); }} />}
    <details className="border-t border-slate-100 px-5 py-3 sm:px-6"><summary className="cursor-pointer text-xs font-semibold text-slate-600">Data & pengaturan lanjutan</summary><button type="button" onClick={() => { if (maySwitch()) onSetup(); }} className="mt-3 min-h-11 text-xs font-semibold text-[#0B2C6B]">Kelola sumber dan kampanye</button></details>
  </section>;
}

function OutboundCampaignWorkflow({ campaign, source, batches, locale, onAction, onRefresh, onUnsavedChange, onBusyChange }: { campaign: Campaign; source: Source; batches: Batch[]; locale: string; onAction: Action; onRefresh: () => Promise<void>; onUnsavedChange: (dirty: boolean) => void; onBusyChange: (busy: boolean) => void }) {
  const [step, setStep] = useState<Tab>('targets');
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const stepNav = useRef<HTMLElement>(null);
  const goTo = (next: Tab) => { setStep(next); requestAnimationFrame(() => {
    stepHeading.current?.focus({ preventScroll: true });
    if ((stepNav.current?.getBoundingClientRect().top ?? 0) < 0) stepNav.current?.scrollIntoView?.({ block: 'start', behavior: 'auto' });
  }); };
  const [data, setData] = useState<OutboundEmailResponse | null>(null);
  const [dataUrl, setDataUrl] = useState('');
  const [readError, setReadError] = useState('');
  const [importApproved, setImportApproved] = useState(false);
  const [recipientConsentConfirmed, setRecipientConsentConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<string[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importRows, setImportRows] = useState<ImportedProspect[]>([]);
  const [fileName, setFileName] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ kind: "test" | "send" | "approve"; requestKey: string; ids: string[]; batchId?: string } | null>(null);
  const mutationLock = useRef(false);
  const loadSequence = useRef(0);
  const mounted = useRef(true);
  const importKey = useRef<string | null>(null);
  const uploadSequence = useRef(0);
  const loadAbort = useRef<AbortController | null>(null);
  const loadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = Boolean(selected.length || importOpen && (importText.trim() || importRows.length) || busy || settingsOpen);
  useEffect(() => { onBusyChange(busy); return () => onBusyChange(false); }, [busy, onBusyChange]);
  useEffect(() => { onUnsavedChange(dirty); return () => onUnsavedChange(false); }, [dirty, onUnsavedChange]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const url = `/api/admin/acquisition/email?campaignId=${encodeURIComponent(campaign.id)}&locale=${locale}`;
  const load = useCallback(async () => {
    const sequence = ++loadSequence.current;
    loadAbort.current?.abort();
    if (loadTimer.current) clearTimeout(loadTimer.current);
    const controller = new AbortController(); loadAbort.current = controller;
    setLoading(true);
    const timer = setTimeout(() => {
      if (mounted.current && sequence === loadSequence.current) {
        loadSequence.current += 1; controller.abort(); setLoading(false);
        setReadError('Memuat kampanye terlalu lama. Periksa koneksi, lalu coba lagi.');
      }
    }, 20000); loadTimer.current = timer;
    try {
      const response = await onAction(url, { signal: controller.signal, cache: 'no-store' }) as OutboundEmailResponse;
      if (!Array.isArray(response.prospects) || !Array.isArray(response.deliveries)) throw new Error('Data kampanye belum lengkap. Perbarui untuk mencoba lagi.');
      if (mounted.current && sequence === loadSequence.current) { setData(response); setDataUrl(url); setReadError(''); setSelected((ids) => ids.filter((id) => response.prospects.some((target) => target.id === id && !target.blockedReason))); }
    } catch (cause) { if (mounted.current && sequence === loadSequence.current) setReadError(cause instanceof Error ? cause.message : "Data kampanye belum dapat dimuat."); }
    finally { clearTimeout(timer); if (mounted.current && sequence === loadSequence.current) setLoading(false); }
  }, [onAction, url]);
  useEffect(() => { mounted.current = true; void Promise.resolve().then(load); return () => { mounted.current = false; loadSequence.current += 1; uploadSequence.current += 1; loadAbort.current?.abort(); if (loadTimer.current) clearTimeout(loadTimer.current); }; }, [load]);
  const pending = data?.deliveries.some((item) => ["queued", "processing"].includes(item.status));
  useEffect(() => { if (!pending) return; const timer = setInterval(() => { void load(); }, 5000); return () => clearInterval(timer); }, [load, pending]);

  const mutate = async (action: () => Promise<void>) => {
    if (mutationLock.current) return;
    mutationLock.current = true; setBusy(true); setError(""); setNotice("");
    try { await action(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Tindakan belum berhasil."); throw cause; }
    finally { mutationLock.current = false; if (mounted.current) setBusy(false); }
  };
  const targets = (data?.prospects || []).filter((target) => `${target.name} ${target.email} ${target.company || ""}`.toLowerCase().includes(query.toLowerCase()) && (filter === "all" || (filter === "ready" ? !target.blockedReason : Boolean(target.blockedReason))));
  const selectedTargets = (data?.prospects || []).filter((target) => selected.includes(target.id));
  const readyTargets = targets.filter((target) => !target.blockedReason);
  const stagedBatches = batches.filter((batch) => batch.status === "staged");
  const queueCount = data?.deliveries.filter((item) => item.status === "queued").length || 0;
  const reviewedBatch = confirm?.kind === "approve" ? batches.find((item) => item.id === confirm.batchId) : undefined;
  const reviewTargets = data?.prospects.filter((target) => target.batch_id === reviewedBatch?.id) || [];
  const reviewExpected = reviewedBatch ? reviewedBatch.total_rows ?? (reviewedBatch.valid_rows + reviewedBatch.invalid_rows + reviewedBatch.duplicate_rows + reviewedBatch.suppressed_rows) : 0;
  const reviewComplete = reviewExpected > 0 && reviewTargets.length === reviewExpected;

  const previewImport = () => {
    try { setImportRows(parseManualTargets(importText)); setError(""); importKey.current = null; }
    catch (cause) { setImportRows([]); setError(cause instanceof Error ? cause.message : "Daftar belum dapat dibaca."); }
  };
  const refreshAfterSave = async () => {
    try { await onRefresh(); }
    catch { setError("Data sudah tersimpan, tetapi daftar belum dapat diperbarui. Tekan Perbarui; jangan ulangi penyimpanan."); }
    await load();
  };
  const importTargets = () => mutate(async () => {
    if (!importApproved) throw new Error("Konfirmasikan bahwa daftar ini boleh digunakan.");
    importKey.current ||= `outbound-${crypto.randomUUID()}`;
    const prospects = importRows.map((row) => ({ ...row, consentStatus: recipientConsentConfirmed && row.consentStatus === "unknown" ? "opted_in" : row.consentStatus }));
    await onAction("/api/admin/acquisition", { method: "POST", body: JSON.stringify({ action: "reviewed_batch", payload: { confirmation: "USE_REVIEWED_TARGET_LIST", sourceId: source.id, campaignId: campaign.id, importKey: importKey.current, fileName: fileName || "Daftar manual", prospects } }) });
    setImportOpen(false); setImportRows([]); setImportText(""); importKey.current = null;
    setNotice("Daftar tersimpan dan diperiksa. Pilih target valid, periksa email, lalu kirim.");
    await refreshAfterSave();
  });
  const confirmAction = async () => {
    if (!confirm) return;
    await mutate(async () => {
      if (confirm.kind === "approve") {
        await onAction("/api/admin/acquisition", { method: "PATCH", body: JSON.stringify({ batchId: confirm.batchId, decision: "approved", note: reviewNote.trim() }) });
        setNotice("Daftar target disetujui. Belum ada email yang dikirim.");
        await refreshAfterSave();
      } else {
        const result = await onAction("/api/admin/acquisition/email", { method: "POST", body: JSON.stringify({ action: confirm.kind, campaignId: campaign.id, locale, requestKey: confirm.requestKey, prospectIds: confirm.ids, settingsVersion: data?.settings?.version, activateForSelection: !data?.settings?.enabled, confirmation: confirm.kind === "test" ? "SEND_TEST_TO_MY_EMAIL" : "SEND_SELECTED_RECIPIENTS" }) }) as { message: string };
        setNotice(result.message); if (confirm.kind === "send") setSelected([]); goTo("activity"); await load();
      }
    });
  };

  const fresh = dataUrl === url && !readError;
  const canSend = Boolean(fresh && !loading && data?.settings && data.preview && !data.setupBlockers?.length && (data.ready || !data.settings.enabled && (data.settings.version === 0 || data.settings.recipientMode === "approved_list" || data.settings.allowedEmails.length)));
  return <div aria-busy={busy}>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3 text-xs text-slate-500 sm:px-6"><span>Sumber: <strong className="font-medium text-slate-700">{source.name}</strong> · {campaign.status === "active" ? "Kampanye aktif" : campaign.status === "approved" ? "Kampanye disetujui" : "Kampanye belum disetujui"}</span><button className="inline-flex min-h-8 items-center gap-2 font-medium text-[#0B2C6B] disabled:opacity-50" disabled={loading || busy} onClick={() => { setError(""); void load(); }}><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Perbarui</button></div>
    <div className="px-5 pt-5 sm:px-6">
      {error && !importOpen && !confirm && !settingsOpen && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      {data?.settings && <details className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"><summary className="cursor-pointer text-xs font-semibold text-slate-600">Pengaturan lanjutan · {data.settings.enabled ? "Aktif" : "Belum aktif / dijeda"}</summary><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="max-w-xl text-xs leading-5 text-slate-500">Saat Anda mengonfirmasi kirim, kampanye yang belum aktif akan diaktifkan untuk penerima terpilih. Tidak ada email yang dikirim hanya karena membuka halaman. Follow-up terpisah.</p><button className={secondary} disabled={busy || loading} onClick={() => { setError(""); setSettingsOpen(true); }}><Settings2 size={15} /> Atur pengiriman</button></div></details>}
      {Boolean(data?.setupBlockers?.length) && <div role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-950">Kampanye belum siap dikirim</p><ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-amber-900">{data?.setupBlockers?.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul></div>}
      {data && !data.settings && !data.ready && <p className="mb-5 rounded-xl bg-amber-50 p-4 text-xs leading-5 text-amber-900">Versi API perlu diperbarui untuk pengaturan pengiriman dari aplikasi. Hubungi tim teknis; jangan aktifkan Pilot lama hanya untuk menjalankan outbound.</p>}
      {readError && <div role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p>{readError}</p><p className="mt-2 text-xs leading-5">Pengiriman ditahan sampai data berhasil diperbarui. Pilihan dan isian Anda tetap tersimpan di halaman ini.</p><button type="button" disabled={loading} className={`${secondary} mt-3`} onClick={() => void load()}>Coba muat kampanye lagi</button></div>}
      <nav ref={stepNav} aria-label="Langkah kampanye email" className="grid scroll-mt-24 grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1">{tabs.map((item, index) => <button key={item.id} type="button" aria-current={step === item.id ? 'step' : undefined} disabled={busy || item.id === 'review' && !selected.length} onClick={() => goTo(item.id)} className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 text-xs font-semibold sm:flex-row sm:gap-2 ${step === item.id ? 'bg-white text-[#0B2C6B] shadow-sm' : 'text-slate-600 hover:bg-white/60'} disabled:cursor-not-allowed disabled:opacity-50`}><span aria-hidden="true" className="text-xs">{index + 1}.</span>{item.title}</button>)}</nav>
      <p className="mt-3 text-xs text-slate-600">{selected.length} penerima dipilih. Maksimal 50 per pengiriman. Belum ada email dikirim hanya karena berpindah langkah.</p>
      <h3 ref={stepHeading} tabIndex={-1} className="sr-only">{tabs.find(item => item.id === step)?.title}</h3>
    </div>
    {loading && dataUrl !== url && <div role="status" className="flex items-center gap-3 p-8 text-sm text-slate-600"><RefreshCw size={18} aria-hidden="true" className="animate-spin" /> Memuat kampanye…</div>}
    <div hidden={!fresh}>
    <section hidden={step !== 'targets'} id="outbound-targets" aria-label="Daftar penerima" className="min-w-0 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-base font-semibold text-slate-900">Siapa yang ingin Anda hubungi?</h3><p className="mt-1 text-xs leading-5 text-slate-500">Impor CSV atau tempel email. Validasi akhir tetap dilakukan sistem.</p></div><button className={primary} disabled={busy || source.status !== "approved" || !source.active || !["approved", "active"].includes(campaign.status)} onClick={() => { setError(""); setImportText(""); setImportRows([]); setFileName(""); setImportApproved(false); setRecipientConsentConfirmed(false); importKey.current = null; setImportOpen(true); }}><Upload size={15} /> Tambah target</button></div>
      {stagedBatches.map((batch) => <div key={batch.id} className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"><div><p className="text-sm font-semibold text-amber-950">Daftar menunggu persetujuan</p><p className="mt-1 text-xs text-amber-800">{batch.valid_rows} lolos validasi · {batch.invalid_rows} tidak valid · {batch.duplicate_rows} ganda · {batch.suppressed_rows} diblokir</p><p className="mt-1 text-[10px] text-amber-700">{batch.import_key}</p></div><button className={secondary} disabled={busy || !batch.valid_rows} onClick={() => { setError(""); setReviewNote(""); setConfirm({ kind: "approve", batchId: batch.id, ids: [], requestKey: crypto.randomUUID() }); }}>Tinjau & setujui</button></div>)}
      <div className="mt-5 flex flex-wrap gap-3"><label className="relative min-w-48 flex-1"><Search size={15} className="absolute left-3 top-3 text-slate-400" /><input aria-label="Cari target" type="search" placeholder="Cari nama, email, perusahaan" value={query} onChange={(event) => { setQuery(event.target.value); setPageSize(20); }} className="h-11 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs" /></label><div className="w-full sm:w-52"><AdminSelect ariaLabel="Status target" value={filter} onChange={(value) => { setFilter(value); setPageSize(20); }} options={[["all", "Semua target"], ["ready", "Siap dipilih"], ["blocked", "Belum dapat dikirim"]]} /></div></div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs"><span className="text-slate-600">{targets.length} target ditampilkan · <strong className="text-[#0B2C6B]">{selected.length} dipilih</strong></span><div className="flex flex-wrap gap-4"><button type="button" className="min-h-11 font-semibold text-[#0B2C6B] disabled:text-slate-500" disabled={!readyTargets.length || busy || loading} onClick={() => setSelected(readyTargets.slice(0, 50).map((target) => target.id))}>Pilih hingga 50 target siap</button>{selected.length > 0 && <button type="button" className="min-h-11 font-semibold text-slate-600" disabled={busy} onClick={() => setSelected([])}>Batalkan pilihan</button>}</div></div>
      <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200">{targets.slice(0, pageSize).map((target) => <label key={target.id} className={`flex items-start gap-3 p-4 ${selected.includes(target.id) ? "bg-blue-50/60" : ""}`}><input type="checkbox" className="mt-1 h-4 w-4 accent-[#0B2C6B]" aria-label={`Pilih ${target.email}`} checked={selected.includes(target.id)} disabled={Boolean(target.blockedReason) || busy || (selected.length >= 50 && !selected.includes(target.id))} onChange={(event) => setSelected((ids) => event.target.checked ? [...ids, target.id] : ids.filter((id) => id !== target.id))} /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-800">{target.name}</span><span className="mt-1 block break-all text-xs text-slate-500">{target.email}{target.company ? ` · ${target.company}` : ""}</span><span className={`mt-2 block text-[11px] ${target.blockedReason ? "text-amber-800" : "text-emerald-700"}`}>{target.deliveryStatus ? deliveryLabels[target.deliveryStatus] || target.deliveryStatus : target.blockedReason || "Siap dipilih"}</span></span>{!target.blockedReason && <CheckCircle2 size={15} className="mt-1 shrink-0 text-emerald-600" />}</label>)}{!targets.length && <div className="p-10 text-center text-sm text-slate-500">{query || filter !== "all" ? "Tidak ada target yang cocok dengan filter." : "Belum ada target. Tambahkan daftar Anda untuk mulai."}</div>}</div>
      {targets.length > pageSize && <button className={`${secondary} mt-3 w-full`} onClick={() => setPageSize((value) => value + 20)}>Tampilkan 20 target berikutnya</button>}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><p className="text-xs leading-5 text-slate-600">{selected.length ? `${selected.length} penerima siap Anda tinjau.` : 'Pilih minimal satu penerima untuk melanjutkan.'} Daftar memuat hingga 500 target terbaru.</p><button type="button" className={primary} disabled={!selected.length || busy || loading} onClick={() => goTo("message")}>Lanjut ke email <ArrowRight size={15} aria-hidden="true" /></button></div>
    </section>
    <section hidden={step !== 'message'} id="outbound-message" aria-label="Email dan pengiriman" className="min-w-0 space-y-5 p-5 sm:p-6">
      <div className="min-w-0"><h3 className="text-base font-semibold text-slate-900">Periksa email sebelum dikirim</h3><p className="mt-2 text-xs leading-5 text-slate-500">Nama dan perusahaan akan disesuaikan per penerima. Tombol diagnosis memakai tautan tracking unik.</p>{data?.preview ? <><div className="mt-4 rounded-t-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">Subjek: <strong className="font-semibold text-slate-900">{data.preview.subject}</strong></div><iframe title="Preview email kampanye" sandbox="" srcDoc={data.preview.previewHtml} className="h-[520px] w-full rounded-b-xl border border-t-0 border-slate-200 bg-white" /></> : <p className="mt-5 rounded-xl bg-slate-50 p-6 text-sm text-slate-500">Template yang disetujui belum tersedia untuk bahasa ini.</p>}</div>
      <details className="border-t border-slate-200 py-4"><summary className="cursor-pointer text-sm font-semibold text-[#0B2C6B]">Kirim email uji ke saya · opsional</summary><p className="mt-3 break-all text-sm text-slate-700">{data?.myEmail || 'Email admin belum tersedia'}</p><p className="mt-2 text-xs leading-5 text-slate-600">Periksa tampilannya di inbox Anda sebelum menghubungi penerima. Uji tidak memilih atau mengirim ke daftar target.</p><button type="button" className={`${secondary} mt-3`} disabled={!canSend || busy || Boolean(pending)} onClick={() => { setError(''); setConfirm({ kind: 'test', requestKey: crypto.randomUUID(), ids: [] }); }}><Mail size={14} aria-hidden="true" /> Kirim email uji</button>{data?.testSent && <p className="mt-3 text-xs text-emerald-800">Email uji diterima penyedia email. Silakan cek inbox.</p>}</details>
      <div className="flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-4"><button type="button" className={secondary} disabled={busy} onClick={() => goTo('targets')}><ArrowLeft size={14} aria-hidden="true" /> Kembali ke penerima</button><button type="button" className={primary} disabled={!canSend || !selected.length || busy} onClick={() => goTo('review')}>Lanjut ke tinjauan <ArrowRight size={14} aria-hidden="true" /></button></div>
    </section>
    <section hidden={step !== 'review'} aria-label="Tinjauan pengiriman" className="space-y-5 p-5 sm:p-6">
      <div><h3 className="text-base font-semibold text-slate-900">Periksa pengiriman Anda</h3><p className="mt-2 text-sm leading-6 text-slate-600">Hanya penerima di bawah yang akan diproses setelah konfirmasi. Kembali jika ada yang perlu diubah.</p></div>
      <dl className="grid gap-4 border-y border-slate-200 py-5 text-sm sm:grid-cols-2"><div><dt className="text-xs text-slate-600">Kampanye</dt><dd className="mt-1 break-words font-semibold">{campaign.name}</dd></div><div><dt className="text-xs text-slate-600">Bahasa</dt><dd className="mt-1 font-semibold">{locale === 'en' ? 'English' : 'Indonesia'}</dd></div><div><dt className="text-xs text-slate-600">Subjek email</dt><dd className="mt-1 break-words font-semibold">{data?.preview?.subject || 'Belum tersedia'}</dd></div><div><dt className="text-xs text-slate-600">Waktu pemrosesan</dt><dd className="mt-1 font-semibold">{data?.settings?.businessHoursOnly ? 'Senin–Jumat, 08.00–17.00 WIB' : 'Setelah konfirmasi'}</dd></div></dl>
      <div className="flex flex-wrap items-center justify-between gap-3"><h4 className="text-sm font-semibold">{selected.length} penerima dipilih</h4><button type="button" className={secondary} disabled={busy} onClick={() => goTo('targets')}>Ubah penerima</button></div>
      <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">{selectedTargets.map(target => <li key={target.id} className="p-3 text-sm"><p className="font-semibold">{target.name}</p><p className="mt-1 break-all text-xs text-slate-600">{target.email}</p></li>)}</ul>
      {!selected.length && <p role="status" className="text-sm text-amber-900">Belum ada penerima yang dapat dikirim. Kembali ke langkah Penerima.</p>}
      <p className="max-w-2xl text-xs leading-5 text-slate-600">Sistem memeriksa ulang izin penerima, email ganda, dan daftar jangan dihubungi. Email uji tidak wajib. Tindak lanjut tidak diaktifkan dari langkah ini.</p>
      <div className="flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-4"><button type="button" className={secondary} disabled={busy} onClick={() => goTo('message')}><ArrowLeft size={14} aria-hidden="true" /> Kembali ke email</button><button type="button" className={primary} disabled={!canSend || !selected.length || busy} onClick={() => { setError(''); setConfirm({ kind: 'send', requestKey: crypto.randomUUID(), ids: [...selected] }); }}>Tinjau & kirim <ArrowRight size={14} aria-hidden="true" /></button></div>
    </section>
    <section hidden={step !== 'activity'} id="outbound-activity" aria-label="Aktivitas pengiriman" className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-base font-semibold text-slate-900">Status pengiriman</h3><p className="mt-2 text-xs leading-5 text-slate-500">Status diperbarui setiap 5 detik selama proses berjalan. Anda boleh berpindah halaman; antrean tetap tersimpan.</p></div>{queueCount > 0 && <button className={secondary} disabled={busy || !data?.ready} onClick={() => void mutate(async () => { const result = await onAction("/api/admin/acquisition/email", { method: "POST", body: JSON.stringify({ action: "process", campaignId: campaign.id, locale, requestKey: crypto.randomUUID(), prospectIds: [], settingsVersion: data?.settings?.version, confirmation: "PROCESS_APPROVED_QUEUE" }) }) as { message: string }; setNotice(result.message); await load(); }).catch(() => {})}><RefreshCw size={14} className={busy ? "animate-spin" : ""} /> Proses antrean berikutnya</button>}</div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Antrean", ["queued", "processing"]], ["Diterima penyedia", ["sent"]], ["Tidak dikirim", ["blocked"]], ["Perlu diperiksa", ["uncertain"]]].map(([label, statuses]) => <div key={String(label)} className="rounded-xl bg-slate-50 p-4"><p className="text-[11px] text-slate-500">{String(label)}</p><p className="mt-2 text-2xl font-semibold text-[#0B2C6B]">{data?.deliveries.filter((delivery) => (statuses as string[]).includes(delivery.status)).length || 0}</p></div>)}</div>
      <div className="mt-5 divide-y divide-slate-100">{data?.deliveries.map((delivery) => <article key={delivery.id} className="flex flex-wrap items-start justify-between gap-3 py-4"><div className="min-w-0 flex-1"><p className="break-all text-sm font-semibold text-slate-800">{delivery.email}</p><p className="mt-1 text-xs text-slate-500">{delivery.kind === "test" ? "Email uji internal" : "Email pertama"} · {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(delivery.created_at))}</p>{delivery.error_message && <p className="mt-2 text-xs leading-5 text-amber-800">{delivery.error_message}</p>}</div><span className={`rounded-full px-3 py-1.5 text-[11px] font-medium ${delivery.status === "sent" ? "bg-emerald-50 text-emerald-700" : delivery.status === "uncertain" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}>{deliveryLabels[delivery.status] || delivery.status}</span></article>)}{!data?.deliveries.length && <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">Belum ada pengiriman untuk kampanye ini.</p>}</div>
      <p className="mt-4 text-[11px] leading-5 text-slate-500">Sampel terbaru: 500 pengiriman, termasuk uji internal. Diterima penyedia bukan jaminan masuk inbox atau dibaca. Status “Perlu diperiksa” tidak dikirim ulang otomatis. Jika jam kerja dipilih, target di luar jam tersebut menunggu pemrosesan berikutnya.</p>
      {selected.length > 0 && <button type="button" className={`${primary} mt-4`} onClick={() => goTo('review')}>Lanjut tinjau {selected.length} penerima <ArrowRight size={14} aria-hidden="true" /></button>}
    </section>
    </div>
    {settingsOpen && data?.settings && <OutboundSettingsDialog settings={data.settings} myEmail={data.myEmail} campaignName={campaign.name} setupBlockers={data.setupBlockers || []} onClose={() => { if (!busy) setSettingsOpen(false); }} onSave={(settings) => mutate(async () => {
      const result = await onAction("/api/admin/acquisition/email", { method: "PATCH", body: JSON.stringify({ campaignId: campaign.id, enabled: settings.enabled, recipientMode: settings.recipientMode, allowedEmails: settings.allowedEmails, businessHoursOnly: settings.businessHoursOnly, expectedVersion: settings.version, confirmation: "SAVE_OUTBOUND_SETTINGS" }) }) as { message: string };
      setNotice(result.message); setSelected([]); await load();
    })} />}
    {importOpen && <AdminModal title="Tambahkan daftar target" eyebrow={campaign.name} maxWidth="max-w-3xl" onClose={() => { if (!busy) { uploadSequence.current += 1; setImportOpen(false); } }}>
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!importRows.length ? <><div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5"><label className="text-sm font-semibold text-slate-800">Unggah CSV atau JSON<input aria-label="Unggah daftar target" type="file" accept=".csv,.json" className="mt-3 block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-3 file:font-semibold" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const sequence = ++uploadSequence.current; if (file.size > 2_000_000) { setError("Ukuran file maksimal 2 MB."); return; } void file.text().then((content) => { if (sequence !== uploadSequence.current) return; const rows = file.name.toLowerCase().endsWith(".json") ? validateImportedProspects(JSON.parse(content)) : prospectsFromCsv(content); setImportRows(rows); setFileName(file.name); setError(""); }).catch((cause) => { if (sequence === uploadSequence.current) setError(cause instanceof Error ? cause.message : "File belum dapat dibaca."); }); }} /></label><a download="template-target-binahub.csv" href="data:text/csv;charset=utf-8,name,email,company,consent_status%0A" className="mt-4 inline-block text-xs font-semibold text-[#0B2C6B]">Unduh template CSV</a></div><label className="mt-5 block text-sm font-semibold text-slate-800">Atau tempel daftar email<textarea aria-label="Daftar email manual" className="mt-2 min-h-40 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal" placeholder={"nama@example.com\nhr@example.com"} value={importText} onChange={(event) => setImportText(event.target.value)} /><span className="mt-2 block text-xs font-normal leading-5 text-slate-500">Satu email per baris. Untuk nama dan perusahaan yang personal, gunakan CSV. Izin penerima tidak diasumsikan otomatis.</span></label><button className={`${primary} mt-5`} disabled={!importText.trim()} onClick={previewImport}>Periksa daftar <ArrowRight size={15} /></button></> : <><h3 className="font-semibold text-slate-900">Periksa {importRows.length} target sebelum disimpan</h3><p className="mt-2 text-xs leading-5 text-slate-500">Pemeriksaan ini bersifat awal. Sistem akan memeriksa ulang email ganda, data tidak valid, dan daftar jangan dihubungi.</p><div className="mt-4 max-h-80 overflow-auto rounded-xl border border-slate-200"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-slate-50 text-slate-500"><tr><th className="p-3">Nama & email</th><th className="p-3">Perusahaan</th><th className="p-3">Pemeriksaan awal</th></tr></thead><tbody>{importRows.map((row, index) => <tr key={`${row.email}-${index}`} className="border-t border-slate-100"><td className="break-all p-3"><strong className="block font-medium">{row.name}</strong>{row.email}</td><td className="p-3">{row.company || "—"}</td><td className="p-3">{importRowIssue(row, importRows.slice(0, index)) || "Siap diperiksa sistem"}</td></tr>)}</tbody></table></div>{source.lawful_basis === "consent" && <label className="mt-4 flex items-start gap-3 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-slate-700"><input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-[#0B2C6B]" checked={recipientConsentConfirmed} onChange={(event) => setRecipientConsentConfirmed(event.target.checked)} /> Penerima yang status izinnya belum tercatat dalam daftar ini sudah menyetujui kontak lewat email. Centang hanya jika izin tersebut benar-benar ada. Penerima yang menolak tetap tidak dihubungi.</label>}<label className="mt-4 flex items-start gap-3 text-xs leading-5 text-slate-600"><input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-[#0B2C6B]" checked={importApproved} onChange={(event) => setImportApproved(event.target.checked)} /> Saya telah memeriksa daftar ini dan berwenang menggunakannya untuk menghubungi target sesuai sumber data kampanye. Sistem tetap menyaring data yang tidak boleh dihubungi.</label><div className="mt-5 flex flex-wrap justify-between gap-3"><button className={secondary} disabled={busy} onClick={() => { setImportRows([]); setError(""); }}>Ubah daftar</button><button className={primary} disabled={busy || !importApproved} onClick={() => void importTargets().catch(() => {})}>{busy ? <RefreshCw size={15} className="animate-spin" /> : <ShieldCheck size={15} />}{busy ? "Menyimpan…" : "Tambahkan target"}</button></div><p className="mt-3 text-xs text-slate-500">Menyimpan daftar tidak mengirim email.</p></>}
    </AdminModal>}
    {confirm?.kind === "approve" ? <AdminModal title="Setujui daftar target" maxWidth="max-w-2xl" onClose={() => { if (!busy) setConfirm(null); }}>
      <p className="text-sm leading-6 text-slate-600">Periksa daftar target dan asal datanya. Hanya data valid yang boleh digunakan; persetujuan ini belum mengirim email.</p><div className="mt-4 max-h-52 divide-y divide-slate-100 overflow-auto rounded-xl border border-slate-200">{reviewTargets.map((target) => <p key={target.id} className="break-all p-3 text-xs text-slate-600">{target.email} · {target.validation_status === "valid" ? "Lolos validasi data" : "Tidak dapat digunakan"}</p>)}</div>{!reviewComplete && <p role="alert" className="mt-3 text-xs text-amber-800">Hanya {reviewTargets.length} dari {reviewExpected} target tampil. Daftar belum dapat disetujui dari sampel ini; perbarui data atau minta tim teknis membuka seluruh daftar.</p>}<label className="mt-4 block text-xs font-semibold text-slate-700">Catatan pemeriksaan<textarea className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal" value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Jelaskan hasil pemeriksaan sumber dan izin penggunaan data." /></label>{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}<button className={`${primary} mt-4`} disabled={busy || !reviewComplete || reviewNote.trim().length < 5} onClick={() => void confirmAction().then(() => setConfirm(null)).catch(() => {})}>{busy ? "Menyimpan…" : "Setujui daftar"}</button>
    </AdminModal> : confirm && <ConfirmDialog errorText={error} onClose={() => { if (!busy) setConfirm(null); }} action={{ title: confirm.kind === "test" ? "Kirim email uji?" : `Kirim email ke ${confirm.ids.length} target?`, description: confirm.kind === "test" ? "Satu email uji akan dikirim ke akun admin Anda, bukan ke daftar target. Kampanye yang dijeda akan diaktifkan kembali tanpa mengirim antrean lama." : "Email pertama akan dikirim ke penerima nyata menggunakan template yang telah disetujui. Pastikan daftar dan isi email sudah benar. Konfirmasi ini juga mengaktifkan kampanye yang dijeda; antrean lama tidak dikirim ulang.", confirmLabel: confirm.kind === "test" ? "Kirim uji" : "Konfirmasi pengiriman", details: [campaign.name, ...(confirm.kind === "test" ? [data?.myEmail || ""] : selectedTargets.filter((target) => confirm.ids.includes(target.id)).map((target) => target.email))], onConfirm: confirmAction }} />}
  </div>;
}
