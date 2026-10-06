"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Mail, RefreshCw, Search, ShieldCheck, Upload } from "lucide-react";
import { AdminModal, AdminSelect, ConfirmDialog } from "./shared";
import { importRowIssue, parseManualTargets, prospectsFromCsv, validateImportedProspects, type ImportedProspect } from "../_lib/prospect-import";

type Action = (url: string, init?: RequestInit) => Promise<unknown>;
type Campaign = { id: string; source_id: string; name: string; channel: string; status: string };
type Source = { id: string; name: string; channel: string; status: string; active: boolean };
type Batch = { id: string; campaign_id: string | null; import_key: string; status: string; total_rows?: number; valid_rows: number; invalid_rows: number; duplicate_rows: number; suppressed_rows: number };
type Target = { id: string; batch_id: string; name: string; email: string; company: string | null; blockedReason: string | null; deliveryStatus: string | null; validation_status: string };
type Delivery = { id: string; name: string; email: string; kind: string; status: string; error_message: string | null; created_at: string };
export type OutboundEmailResponse = { ready: boolean; blockers: string[]; myEmail: string; mode: string; testSent: boolean; templateVersion: string | null; preview: { subject: string; previewHtml: string } | null; prospects: Target[]; deliveries: Delivery[] };
type Tab = "targets" | "message" | "activity";
const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0B2C6B] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#071B3D] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500";
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50";
const deliveryLabels: Record<string, string> = { queued: "Dalam antrean", processing: "Sedang dikirim", sent: "Diterima penyedia email", blocked: "Tidak dikirim", uncertain: "Perlu diperiksa" };
const tabs: Array<{ id: Tab; title: string; note: string }> = [{ id: "targets", title: "Daftar target", note: "Impor & periksa" }, { id: "message", title: "Email & pengiriman", note: "Preview, uji, kirim" }, { id: "activity", title: "Aktivitas", note: "Pantau hasil" }];

export function OutboundEmailPanel({ onAction, onRefresh, sources, campaigns, batches, onSetup }: { onAction: Action; onRefresh: () => Promise<void>; sources: Source[]; campaigns: Campaign[]; batches: Batch[]; onSetup: () => void }) {
  const [campaignId, setCampaignId] = useState("");
  const [locale, setLocale] = useState("id");
  const emailCampaigns = campaigns.filter((campaign) => campaign.channel === "email" && sources.some((source) => source.id === campaign.source_id && source.channel === "outbound"));
  const selectedId = campaignId || emailCampaigns[0]?.id || "";
  const campaign = emailCampaigns.find((item) => item.id === selectedId);
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs" aria-labelledby="outbound-email-title">
    <header className="border-b border-slate-100 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[11px] font-semibold uppercase tracking-wider text-[#B17E29]">Kampanye email</p><h2 id="outbound-email-title" className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Mulai percakapan dengan calon klien</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Siapkan target, periksa email, lalu kirim dari satu tempat. Tidak perlu mencari prospek ulang jika Anda sudah punya daftarnya.</p></div><button className={secondary} onClick={onSetup}>Pengaturan kampanye</button></div>
      {emailCampaigns.length > 0 && <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_170px]"><label className="text-xs font-semibold text-slate-600">Kampanye<AdminSelect ariaLabel="Kampanye email" value={selectedId} onChange={setCampaignId} options={emailCampaigns.map((item) => [item.id, item.name])} /></label><label className="text-xs font-semibold text-slate-600">Bahasa email<AdminSelect ariaLabel="Bahasa email" value={locale} onChange={setLocale} options={[["id", "Indonesia"], ["en", "English"]]} /></label></div>}
    </header>
    {campaign ? <OutboundCampaignWorkflow key={`${campaign.id}:${locale}`} campaign={campaign} source={sources.find((item) => item.id === campaign.source_id)!} batches={batches.filter((item) => item.campaign_id === campaign.id)} locale={locale} onAction={onAction} onRefresh={onRefresh} /> : <div className="p-8 text-center"><Mail size={30} className="mx-auto text-slate-300" /><h3 className="mt-4 font-semibold text-slate-900">Siapkan kampanye pertama Anda</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Tambahkan sumber data outbound, lalu kampanye dengan kanal Email. Pengaturan ini cukup dilakukan sekali per kampanye.</p><button className={`${primary} mt-5`} onClick={onSetup}>Siapkan kampanye <ArrowRight size={15} /></button></div>}
  </section>;
}

function OutboundCampaignWorkflow({ campaign, source, batches, locale, onAction, onRefresh }: { campaign: Campaign; source: Source; batches: Batch[]; locale: string; onAction: Action; onRefresh: () => Promise<void> }) {
  const [data, setData] = useState<OutboundEmailResponse | null>(null);
  const [tab, setTab] = useState<Tab>("targets");
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
  const [confirm, setConfirm] = useState<{ kind: "test" | "send" | "approve"; requestKey: string; ids: string[]; batchId?: string } | null>(null);
  const mutationLock = useRef(false);
  const loadSequence = useRef(0);
  const mounted = useRef(true);
  const importKey = useRef<string | null>(null);
  const uploadSequence = useRef(0);
  const url = `/api/admin/acquisition/email?campaignId=${encodeURIComponent(campaign.id)}&locale=${locale}`;
  const load = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setLoading(true);
    try {
      const response = await onAction(url) as OutboundEmailResponse;
      if (mounted.current && sequence === loadSequence.current) { setData(response); setSelected((ids) => ids.filter((id) => response.prospects.some((target) => target.id === id && !target.blockedReason))); }
    } catch (cause) { if (mounted.current && sequence === loadSequence.current) setError(cause instanceof Error ? cause.message : "Data kampanye belum dapat dimuat."); }
    finally { if (mounted.current && sequence === loadSequence.current) setLoading(false); }
  }, [onAction, url]);
  useEffect(() => { mounted.current = true; void Promise.resolve().then(load); return () => { mounted.current = false; loadSequence.current += 1; uploadSequence.current += 1; }; }, [load]);
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
    importKey.current ||= `outbound-${crypto.randomUUID()}`;
    await onAction("/api/admin/acquisition", { method: "POST", body: JSON.stringify({ action: "batch", payload: { sourceId: source.id, campaignId: campaign.id, importKey: importKey.current, fileName: fileName || "Daftar manual", prospects: importRows } }) });
    setImportOpen(false); setImportRows([]); setImportText(""); importKey.current = null;
    setNotice("Daftar tersimpan. Tinjau hasil pemeriksaan dan setujui sebelum mengirim email.");
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
        const result = await onAction("/api/admin/acquisition/email", { method: "POST", body: JSON.stringify({ action: confirm.kind, campaignId: campaign.id, locale, requestKey: confirm.requestKey, prospectIds: confirm.ids, confirmation: confirm.kind === "test" ? "SEND_TEST_TO_MY_EMAIL" : "SEND_SELECTED_RECIPIENTS" }) }) as { message: string };
        setNotice(result.message); if (confirm.kind === "send") setSelected([]); setTab("activity"); await load();
      }
    });
  };

  return <div aria-busy={busy}>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3 text-xs text-slate-500 sm:px-6"><span>Sumber: <strong className="font-medium text-slate-700">{source.name}</strong> · {campaign.status === "active" ? "Kampanye aktif" : campaign.status === "approved" ? "Kampanye disetujui" : "Kampanye belum disetujui"}</span><button className="inline-flex min-h-8 items-center gap-2 font-medium text-[#0B2C6B] disabled:opacity-50" disabled={loading || busy} onClick={() => { setError(""); void load(); }}><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Perbarui</button></div>
    <div className="px-5 pt-5 sm:px-6">
      {error && !importOpen && !confirm && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      {data && !data.ready && <details className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4"><summary className="cursor-pointer text-xs font-semibold text-amber-900">Pengiriman belum aktif · lihat yang perlu disiapkan</summary><ul className="mt-3 list-disc space-y-2 pl-4 text-xs leading-5 text-amber-900">{data.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul><p className="mt-3 text-xs text-amber-800">Anda tetap dapat mengimpor dan meninjau target. Aktivasi dilakukan sekali oleh penanggung jawab, bukan dilewati saat mengirim.</p></details>}
      <nav role="tablist" aria-label="Langkah kampanye email" className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">{tabs.map((item, index) => <button key={item.id} role="tab" aria-selected={tab === item.id} aria-controls={`outbound-${item.id}`} id={`outbound-tab-${item.id}`} onClick={() => { setTab(item.id); setError(""); }} className={`rounded-lg px-2 py-3 text-left text-xs font-semibold transition sm:px-4 ${tab === item.id ? "bg-white text-[#0B2C6B] shadow-sm" : "text-slate-500 hover:bg-white/50"}`}><span className="mr-1 text-slate-400">{index + 1}.</span>{item.title}<span className="mt-1 hidden text-[10px] font-normal text-slate-400 sm:block">{item.note}</span></button>)}</nav>
    </div>
    {loading && !data && <div role="status" className="flex items-center gap-3 p-8 text-sm text-slate-500"><RefreshCw size={18} className="animate-spin" /> Memuat kampanye…</div>}
    {tab === "targets" && <div role="tabpanel" id="outbound-targets" aria-labelledby="outbound-tab-targets" className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-base font-semibold text-slate-900">Siapa yang ingin Anda hubungi?</h3><p className="mt-1 text-xs leading-5 text-slate-500">Impor CSV atau tempel email. Validasi akhir tetap dilakukan sistem.</p></div><button className={primary} disabled={busy || source.status !== "approved" || !source.active || !["approved", "active"].includes(campaign.status)} onClick={() => { setError(""); setImportText(""); setImportRows([]); setFileName(""); importKey.current = null; setImportOpen(true); }}><Upload size={15} /> Tambah target</button></div>
      {stagedBatches.map((batch) => <div key={batch.id} className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"><div><p className="text-sm font-semibold text-amber-950">Daftar menunggu persetujuan</p><p className="mt-1 text-xs text-amber-800">{batch.valid_rows} lolos validasi · {batch.invalid_rows} tidak valid · {batch.duplicate_rows} ganda · {batch.suppressed_rows} diblokir</p><p className="mt-1 text-[10px] text-amber-700">{batch.import_key}</p></div><button className={secondary} disabled={busy || !batch.valid_rows} onClick={() => { setError(""); setReviewNote(""); setConfirm({ kind: "approve", batchId: batch.id, ids: [], requestKey: crypto.randomUUID() }); }}>Tinjau & setujui</button></div>)}
      <div className="mt-5 flex flex-wrap gap-3"><label className="relative min-w-48 flex-1"><Search size={15} className="absolute left-3 top-3 text-slate-400" /><input aria-label="Cari target" type="search" placeholder="Cari nama, email, perusahaan" value={query} onChange={(event) => { setQuery(event.target.value); setPageSize(20); }} className="h-11 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs" /></label><div className="w-full sm:w-52"><AdminSelect ariaLabel="Status target" value={filter} onChange={(value) => { setFilter(value); setPageSize(20); }} options={[["all", "Semua target"], ["ready", "Siap dipilih"], ["blocked", "Belum dapat dikirim"]]} /></div></div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs"><span className="text-slate-500">{targets.length} target ditampilkan · <strong className="text-[#0B2C6B]">{selected.length} dipilih</strong></span><button className="min-h-9 font-semibold text-[#0B2C6B] disabled:text-slate-300" disabled={!readyTargets.length || busy} onClick={() => setSelected(readyTargets.slice(0, 50).map((target) => target.id))}>Pilih hingga 50 target siap</button></div>
      <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200">{targets.slice(0, pageSize).map((target) => <label key={target.id} className={`flex items-start gap-3 p-4 ${selected.includes(target.id) ? "bg-blue-50/60" : ""}`}><input type="checkbox" className="mt-1 h-4 w-4 accent-[#0B2C6B]" aria-label={`Pilih ${target.email}`} checked={selected.includes(target.id)} disabled={Boolean(target.blockedReason) || busy || (selected.length >= 50 && !selected.includes(target.id))} onChange={(event) => setSelected((ids) => event.target.checked ? [...ids, target.id] : ids.filter((id) => id !== target.id))} /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-800">{target.name}</span><span className="mt-1 block break-all text-xs text-slate-500">{target.email}{target.company ? ` · ${target.company}` : ""}</span><span className={`mt-2 block text-[11px] ${target.blockedReason ? "text-amber-800" : "text-emerald-700"}`}>{target.deliveryStatus ? deliveryLabels[target.deliveryStatus] || target.deliveryStatus : target.blockedReason || "Siap dipilih"}</span></span>{!target.blockedReason && <CheckCircle2 size={15} className="mt-1 shrink-0 text-emerald-600" />}</label>)}{!targets.length && <div className="p-10 text-center text-sm text-slate-500">{query || filter !== "all" ? "Tidak ada target yang cocok dengan filter." : "Belum ada target. Tambahkan daftar Anda untuk mulai."}</div>}</div>
      {targets.length > pageSize && <button className={`${secondary} mt-3 w-full`} onClick={() => setPageSize((value) => value + 20)}>Tampilkan 20 target berikutnya</button>}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><p className="text-xs text-slate-500">Maksimal 50 target per pengiriman. Sampel terbaru: 500 target per kampanye.</p><button className={primary} onClick={() => setTab("message")}>Lanjut ke email <ArrowRight size={15} /></button></div>
    </div>}
    {tab === "message" && <div role="tabpanel" id="outbound-message" aria-labelledby="outbound-tab-message" className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_290px]">
      <div className="min-w-0"><h3 className="text-base font-semibold text-slate-900">Periksa email sebelum dikirim</h3><p className="mt-2 text-xs leading-5 text-slate-500">Nama dan perusahaan akan disesuaikan per penerima. Tombol diagnosa memakai tautan tracking unik.</p>{data?.preview ? <><div className="mt-4 rounded-t-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">Subjek: <strong className="font-semibold text-slate-900">{data.preview.subject}</strong></div><iframe title="Preview email kampanye" sandbox="" srcDoc={data.preview.previewHtml} className="h-[520px] w-full rounded-b-xl border border-t-0 border-slate-200 bg-white" /></> : <p className="mt-5 rounded-xl bg-slate-50 p-6 text-sm text-slate-500">Template yang disetujui belum tersedia untuk bahasa ini.</p>}</div>
      <aside className="space-y-4"><div className="rounded-xl border border-slate-200 p-4"><ShieldCheck size={20} className="text-[#0B2C6B]" /><h4 className="mt-3 text-sm font-semibold">1. Kirim uji ke email Anda</h4><p className="mt-2 break-all text-xs text-slate-500">{data?.myEmail || "Memuat email admin…"}</p><p className="mt-2 text-xs leading-5 text-slate-500">Periksa tampilan dan tautan di inbox. Email uji tidak dikirim ke target dan berlaku 24 jam untuk template ini.</p><button className={`${secondary} mt-4 w-full`} disabled={!data?.ready || busy || Boolean(pending)} onClick={() => { setError(""); setConfirm({ kind: "test", requestKey: crypto.randomUUID(), ids: [] }); }}><Mail size={14} /> Kirim email uji</button>{data?.testSent && <p className="mt-3 text-xs font-medium text-emerald-700">Email uji diterima penyedia email. Silakan cek inbox.</p>}</div><div className="rounded-xl border border-slate-200 p-4"><h4 className="text-sm font-semibold">2. Kirim ke target terpilih</h4><p className="mt-2 text-3xl font-semibold text-[#0B2C6B]">{selected.length}<span className="ml-2 text-xs font-normal text-slate-500">penerima</span></p><div className="mt-3 max-h-36 space-y-2 overflow-auto text-[11px] text-slate-500">{selectedTargets.map((target) => <p key={target.id} className="break-all">{target.email}</p>)}</div><button className={`${primary} mt-4 w-full`} disabled={!data?.ready || !data.testSent || !selected.length || busy} onClick={() => { setError(""); setConfirm({ kind: "send", requestKey: crypto.randomUUID(), ids: [...selected] }); }}>Tinjau & kirim <ArrowRight size={14} /></button>{!data?.testSent && <p className="mt-3 text-xs text-amber-800">Kirim email uji terlebih dahulu.</p>}{!selected.length && <button className="mt-3 min-h-9 text-xs font-semibold text-[#0B2C6B]" onClick={() => setTab("targets")}>Pilih target</button>}</div><p className="text-[11px] leading-5 text-slate-500">Mengirim berarti menghubungi penerima nyata. Sistem tetap memeriksa izin penerima, persetujuan daftar, dan daftar jangan dihubungi.</p></aside>
    </div>}
    {tab === "activity" && <div role="tabpanel" id="outbound-activity" aria-labelledby="outbound-tab-activity" className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-base font-semibold text-slate-900">Status pengiriman</h3><p className="mt-2 text-xs leading-5 text-slate-500">Status diperbarui setiap 5 detik selama proses berjalan. Anda boleh berpindah halaman; antrean tetap tersimpan.</p></div>{queueCount > 0 && <button className={secondary} disabled={busy || !data?.ready} onClick={() => void mutate(async () => { const result = await onAction("/api/admin/acquisition/email", { method: "POST", body: JSON.stringify({ action: "process", campaignId: campaign.id, locale, requestKey: crypto.randomUUID(), prospectIds: [], confirmation: "PROCESS_APPROVED_QUEUE" }) }) as { message: string }; setNotice(result.message); await load(); }).catch(() => {})}><RefreshCw size={14} className={busy ? "animate-spin" : ""} /> Proses antrean berikutnya</button>}</div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Antrean", ["queued", "processing"]], ["Diterima penyedia", ["sent"]], ["Tidak dikirim", ["blocked"]], ["Perlu diperiksa", ["uncertain"]]].map(([label, statuses]) => <div key={String(label)} className="rounded-xl bg-slate-50 p-4"><p className="text-[11px] text-slate-500">{String(label)}</p><p className="mt-2 text-2xl font-semibold text-[#0B2C6B]">{data?.deliveries.filter((delivery) => (statuses as string[]).includes(delivery.status)).length || 0}</p></div>)}</div>
      <div className="mt-5 divide-y divide-slate-100">{data?.deliveries.map((delivery) => <article key={delivery.id} className="flex flex-wrap items-start justify-between gap-3 py-4"><div className="min-w-0 flex-1"><p className="break-all text-sm font-semibold text-slate-800">{delivery.email}</p><p className="mt-1 text-xs text-slate-500">{delivery.kind === "test" ? "Email uji internal" : "Email pertama"} · {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(delivery.created_at))}</p>{delivery.error_message && <p className="mt-2 text-xs leading-5 text-amber-800">{delivery.error_message}</p>}</div><span className={`rounded-full px-3 py-1.5 text-[11px] font-medium ${delivery.status === "sent" ? "bg-emerald-50 text-emerald-700" : delivery.status === "uncertain" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}>{deliveryLabels[delivery.status] || delivery.status}</span></article>)}{!data?.deliveries.length && <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">Belum ada pengiriman untuk kampanye ini.</p>}</div>
      <p className="mt-4 text-[11px] leading-5 text-slate-500">Sampel terbaru: 500 pengiriman, termasuk uji internal. Diterima penyedia bukan jaminan masuk inbox atau dibaca. Status “Perlu diperiksa” tidak dikirim ulang otomatis. Di luar jam pengiriman, antrean menunggu jadwal berikutnya.</p>
      {data?.testSent && selected.length > 0 && <button className={`${primary} mt-4`} onClick={() => setTab("message")}>Lanjut kirim ke {selected.length} target <ArrowRight size={14} /></button>}
    </div>}
    {importOpen && <AdminModal title="Tambahkan daftar target" eyebrow={campaign.name} maxWidth="max-w-3xl" onClose={() => { if (!busy) { uploadSequence.current += 1; setImportOpen(false); } }}>
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!importRows.length ? <><div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5"><label className="text-sm font-semibold text-slate-800">Unggah CSV atau JSON<input aria-label="Unggah daftar target" type="file" accept=".csv,.json" className="mt-3 block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-3 file:font-semibold" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const sequence = ++uploadSequence.current; if (file.size > 2_000_000) { setError("Ukuran file maksimal 2 MB."); return; } void file.text().then((content) => { if (sequence !== uploadSequence.current) return; const rows = file.name.toLowerCase().endsWith(".json") ? validateImportedProspects(JSON.parse(content)) : prospectsFromCsv(content); setImportRows(rows); setFileName(file.name); setError(""); }).catch((cause) => { if (sequence === uploadSequence.current) setError(cause instanceof Error ? cause.message : "File belum dapat dibaca."); }); }} /></label><a download="template-target-binahub.csv" href="data:text/csv;charset=utf-8,name,email,company,consent_status%0A" className="mt-4 inline-block text-xs font-semibold text-[#0B2C6B]">Unduh template CSV</a></div><label className="mt-5 block text-sm font-semibold text-slate-800">Atau tempel daftar email<textarea aria-label="Daftar email manual" className="mt-2 min-h-40 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal" placeholder={"nama@example.com\nhr@example.com"} value={importText} onChange={(event) => setImportText(event.target.value)} /><span className="mt-2 block text-xs font-normal leading-5 text-slate-500">Satu email per baris. Untuk nama dan perusahaan yang personal, gunakan CSV. Izin penerima tidak diasumsikan otomatis.</span></label><button className={`${primary} mt-5`} disabled={!importText.trim()} onClick={previewImport}>Periksa daftar <ArrowRight size={15} /></button></> : <><h3 className="font-semibold text-slate-900">Periksa {importRows.length} target sebelum disimpan</h3><p className="mt-2 text-xs leading-5 text-slate-500">Pemeriksaan ini bersifat awal. Sistem akan memeriksa ulang email ganda, data tidak valid, dan daftar jangan dihubungi.</p><div className="mt-4 max-h-80 overflow-auto rounded-xl border border-slate-200"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-slate-50 text-slate-500"><tr><th className="p-3">Nama & email</th><th className="p-3">Perusahaan</th><th className="p-3">Pemeriksaan awal</th></tr></thead><tbody>{importRows.map((row, index) => <tr key={`${row.email}-${index}`} className="border-t border-slate-100"><td className="break-all p-3"><strong className="block font-medium">{row.name}</strong>{row.email}</td><td className="p-3">{row.company || "—"}</td><td className="p-3">{importRowIssue(row, importRows.slice(0, index)) || "Siap diperiksa sistem"}</td></tr>)}</tbody></table></div><div className="mt-5 flex flex-wrap justify-between gap-3"><button className={secondary} disabled={busy} onClick={() => { setImportRows([]); setError(""); }}>Ubah daftar</button><button className={primary} disabled={busy} onClick={() => void importTargets().catch(() => {})}>{busy ? <RefreshCw size={15} className="animate-spin" /> : <ShieldCheck size={15} />}{busy ? "Menyimpan…" : "Simpan & validasi target"}</button></div><p className="mt-3 text-xs text-slate-500">Menyimpan daftar tidak mengirim email.</p></>}
    </AdminModal>}
    {confirm?.kind === "approve" ? <AdminModal title="Setujui daftar target" maxWidth="max-w-2xl" onClose={() => { if (!busy) setConfirm(null); }}>
      <p className="text-sm leading-6 text-slate-600">Periksa daftar target dan asal datanya. Hanya data valid yang boleh digunakan; persetujuan ini belum mengirim email.</p><div className="mt-4 max-h-52 divide-y divide-slate-100 overflow-auto rounded-xl border border-slate-200">{reviewTargets.map((target) => <p key={target.id} className="break-all p-3 text-xs text-slate-600">{target.email} · {target.validation_status === "valid" ? "Lolos validasi data" : "Tidak dapat digunakan"}</p>)}</div>{!reviewComplete && <p role="alert" className="mt-3 text-xs text-amber-800">Hanya {reviewTargets.length} dari {reviewExpected} target tampil. Daftar belum dapat disetujui dari sampel ini; perbarui data atau minta tim teknis membuka seluruh daftar.</p>}<label className="mt-4 block text-xs font-semibold text-slate-700">Catatan pemeriksaan<textarea className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal" value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Jelaskan hasil pemeriksaan sumber dan izin penggunaan data." /></label>{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}<button className={`${primary} mt-4`} disabled={busy || !reviewComplete || reviewNote.trim().length < 5} onClick={() => void confirmAction().then(() => setConfirm(null)).catch(() => {})}>{busy ? "Menyimpan…" : "Setujui daftar"}</button>
    </AdminModal> : confirm && <ConfirmDialog errorText={error} onClose={() => { if (!busy) setConfirm(null); }} action={{ title: confirm.kind === "test" ? "Kirim email uji?" : `Kirim email ke ${confirm.ids.length} target?`, description: confirm.kind === "test" ? "Satu email uji akan dikirim ke akun admin Anda, bukan ke daftar target." : "Email pertama akan dikirim ke penerima nyata menggunakan template yang telah disetujui. Pastikan daftar dan isi email sudah benar.", confirmLabel: confirm.kind === "test" ? "Kirim uji" : "Konfirmasi pengiriman", details: [campaign.name, ...(confirm.kind === "test" ? [data?.myEmail || ""] : selectedTargets.filter((target) => confirm.ids.includes(target.id)).map((target) => target.email))], onConfirm: confirmAction }} />}
  </div>;
}
