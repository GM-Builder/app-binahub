"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Bot, Check, CheckCircle2, ChevronDown, Mail, MessageSquareText, PauseCircle, Phone, PlayCircle, RotateCcw, Save, Send } from "lucide-react";
import { FOLLOW_UP_LEVELS, INQUIRY_STATUS_OPTIONS, NOTE_PRESETS } from "../_lib/constants";
import type { ConfirmAction, InquiryRecord } from "../_lib/types";
import { daysSince, formatDate, uniqueOptions } from "../_lib/utils";
import { AdminDrawer, AdminNotice, AdminSearch, AdminSelect, Badge, ConfirmDialog, EmptyState, PresetButtons } from "./shared";

function readable(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function replyStatusLabel(status?: InquiryRecord["replyStatus"]) {
  return status === "sent" ? "Terkirim" : status === "sending" ? "Sedang dikirim" : status === "reviewed" ? "Siap dikirim" : status === "draft" ? "Draf perlu ditinjau" : "Belum dibalas";
}

function nextFollowUp(inquiry: InquiryRecord) {
  return FOLLOW_UP_LEVELS.find((item) => item.level === (inquiry.followUpLevel || 0) + 1) || null;
}

function followUpDue(inquiry: InquiryRecord) {
  const next = nextFollowUp(inquiry);
  return Boolean(!inquiry.followUpPaused && next && daysSince(inquiry.createdAt) >= next.days);
}

function InquiryMetric({ label, value, note, tone = "default" }: { label: string; value: number; note: string; tone?: "default" | "warning" | "success" }) {
  const valueTone = tone === "warning" ? "text-amber-700" : tone === "success" ? "text-emerald-700" : "text-slate-950";
  return <div className="min-w-0 border-l border-slate-200 pl-4 first:border-l-0 first:pl-0"><p className="text-xs font-semibold text-slate-500">{label}</p><p className={`mt-1 text-2xl font-semibold tracking-tight ${valueTone}`}>{value}</p><p className="mt-1 truncate text-[11px] text-slate-400">{note}</p></div>;
}

export function InquiriesPanel({ inquiries, onAction, onRefresh }: {
  inquiries: InquiryRecord[];
  onAction: (url: string, init?: RequestInit) => Promise<unknown>;
  onRefresh: () => Promise<void>;
}) {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { status: string; notes: string }>>({});
  const [actionError, setActionError] = useState("");
  const [followUpSending, setFollowUpSending] = useState<string | null>(null);
  const [replyWorking, setReplyWorking] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, { subject: string; body: string }>>({});
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("Semua");
  const [status, setStatus] = useState("Semua");

  const filteredInquiries = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("id-ID");
    return inquiries.filter((inquiry) =>
      (!keyword || [inquiry.name, inquiry.email, inquiry.whatsapp, inquiry.message, inquiry.source, inquiry.status]
        .join(" ").toLocaleLowerCase("id-ID").includes(keyword)) &&
      (source === "Semua" || inquiry.source === source) &&
      (status === "Semua" || inquiry.status === status)
    );
  }, [inquiries, search, source, status]);

  const sourceOptions = uniqueOptions(inquiries, (inquiry) => inquiry.source);
  const statusOptions = uniqueOptions(inquiries, (inquiry) => inquiry.status);
  const selected = inquiries.find((inquiry) => inquiry.id === selectedId) || null;
  const newCount = inquiries.filter((inquiry) => /^(baru|new)$/i.test(inquiry.status || "")).length;
  const awaitingReplyCount = inquiries.filter((inquiry) => !inquiry.replyStatus || inquiry.replyStatus === "none" || inquiry.replyStatus === "draft").length;
  const readyToSendCount = inquiries.filter((inquiry) => inquiry.replyStatus === "reviewed").length;
  const followUpDueCount = inquiries.filter(followUpDue).length;
  const hasFilters = Boolean(search || source !== "Semua" || status !== "Semua");

  const getDraft = (inquiry: InquiryRecord) => drafts[inquiry.id] || { status: inquiry.status || "Baru", notes: inquiry.notes || "" };
  const getReplyDraft = (inquiry: InquiryRecord) => replyDrafts[inquiry.id] || { subject: inquiry.replySubject || "", body: inquiry.replyBody || "" };

  const resetFilters = () => { setSearch(""); setSource("Semua"); setStatus("Semua"); };

  const generateReplyDraft = async (inquiry: InquiryRecord) => {
    setReplyWorking(`${inquiry.id}:generate`);
    setActionError("");
    try {
      const result = await onAction("/api/admin/inquiries", { method: "POST", body: JSON.stringify({ action: "generate_reply_draft", id: inquiry.id }) }) as { draft?: { subject?: string; body?: string } };
      setReplyDrafts((current) => ({ ...current, [inquiry.id]: { subject: result.draft?.subject || "", body: result.draft?.body || "" } }));
      await onRefresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal menyiapkan draf balasan.");
    } finally {
      setReplyWorking(null);
    }
  };

  const saveReplyReview = async (inquiry: InquiryRecord) => {
    setReplyWorking(`${inquiry.id}:review`);
    setActionError("");
    try {
      await onAction("/api/admin/inquiries", { method: "POST", body: JSON.stringify({ action: "save_reply_review", id: inquiry.id, ...getReplyDraft(inquiry) }) });
      await onRefresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal menyimpan hasil review.");
    } finally {
      setReplyWorking(null);
    }
  };

  const sendReviewedReply = async (inquiry: InquiryRecord) => {
    setReplyWorking(`${inquiry.id}:send`);
    setActionError("");
    try {
      await onAction("/api/admin/inquiries", { method: "POST", body: JSON.stringify({ action: "send_reviewed_reply", id: inquiry.id, confirmation: "SEND_REVIEWED_INQUIRY_REPLY" }) });
      await onRefresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal mengirim balasan yang telah direview.");
    } finally {
      setReplyWorking(null);
    }
  };

  const saveInquiry = async (inquiry: InquiryRecord) => {
    setSavingId(inquiry.id);
    setActionError("");
    try {
      await onAction("/api/admin/inquiries", { method: "PATCH", body: JSON.stringify({ id: inquiry.id, ...getDraft(inquiry) }) });
      await onRefresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal memperbarui inquiry.");
    } finally {
      setSavingId(null);
    }
  };

  const sendFollowUp = async (inquiry: InquiryRecord, level: number) => {
    setFollowUpSending(`${inquiry.id}:${level}`);
    setActionError("");
    try {
      await onAction("/api/admin/follow-up", { method: "POST", body: JSON.stringify({ inquiryId: inquiry.id, level }) });
      await onRefresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal mengirim follow up.");
    } finally {
      setFollowUpSending(null);
    }
  };

  const toggleFollowUpPause = async (inquiry: InquiryRecord) => {
    setSavingId(inquiry.id);
    setActionError("");
    try {
      await onAction("/api/admin/inquiries", { method: "PATCH", body: JSON.stringify({ id: inquiry.id, status: getDraft(inquiry).status, notes: getDraft(inquiry).notes, followUpPaused: !inquiry.followUpPaused }) });
      await onRefresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal mengubah jeda follow up.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {confirmAction && <ConfirmDialog action={confirmAction} onClose={() => setConfirmAction(null)} />}
      {actionError && <AdminNotice>{actionError}</AdminNotice>}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs" aria-labelledby="inquiry-summary-title">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#80560F]">Kotak masuk penjualan</p><h2 id="inquiry-summary-title" className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Fokus pada inquiry yang perlu dijawab</h2><p className="mt-1 text-sm text-slate-500">Buka satu inquiry untuk membaca konteks, meninjau balasan, dan mengatur tindak lanjut.</p></div>
          <details className="group relative"><summary className="inline-flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 marker:hidden">Cara kerja follow-up <ChevronDown size={14} className="transition group-open:rotate-180" /></summary><div className="absolute right-0 z-20 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"><p className="text-xs font-semibold text-slate-900">Urutan follow-up</p><div className="mt-3 space-y-3">{FOLLOW_UP_LEVELS.map((item) => <div key={item.level} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">{item.level}</span><div><p className="text-xs font-semibold text-slate-800">{item.label} · setelah {item.days} hari</p><p className="mt-0.5 text-[11px] leading-5 text-slate-500">{item.intent}</p></div></div>)}</div></div></details>
        </div>
        <div className="grid grid-cols-2 gap-5 px-5 py-5 sm:px-6 lg:grid-cols-4">
          <InquiryMetric label="Inquiry baru" value={newCount} note="Belum diproses" />
          <InquiryMetric label="Perlu balasan" value={awaitingReplyCount} note="Belum ada balasan final" tone={awaitingReplyCount ? "warning" : "success"} />
          <InquiryMetric label="Siap dikirim" value={readyToSendCount} note="Sudah direview" tone={readyToSendCount ? "success" : "default"} />
          <InquiryMetric label="Follow-up jatuh tempo" value={followUpDueCount} note="Sesuai urutan jadwal" tone={followUpDueCount ? "warning" : "success"} />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs" aria-labelledby="inquiry-list-title">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="min-w-0 flex-1"><AdminSearch value={search} onChange={setSearch} placeholder="Cari nama, email, pesan, atau sumber…" /></div><div className="grid gap-2 sm:grid-cols-2 lg:w-[380px]"><AdminSelect ariaLabel="Filter sumber inquiry" value={source} onChange={setSource} options={[["Semua", "Semua sumber"], ...sourceOptions.map((item) => [item, readable(item)] as [string, string])]} /><AdminSelect ariaLabel="Filter status inquiry" value={status} onChange={setStatus} options={[["Semua", "Semua status"], ...statusOptions.map((item) => [item, readable(item)] as [string, string])]} /></div>{hasFilters && <button type="button" onClick={resetFilters} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900"><RotateCcw size={14} /> Reset</button>}</div>
          <div className="mt-4 flex items-center justify-between gap-3"><h2 id="inquiry-list-title" className="text-sm font-semibold text-slate-900">Daftar inquiry</h2><p className="text-xs text-slate-400">Menampilkan {filteredInquiries.length} dari {inquiries.length}</p></div>
        </div>

        {filteredInquiries.length ? <div className="divide-y divide-slate-100">{filteredInquiries.map((inquiry) => {
          const due = followUpDue(inquiry);
          const replyTone = inquiry.replyStatus === "sent" || inquiry.replyStatus === "reviewed" ? "green" : inquiry.replyStatus === "draft" ? "gold" : "navy";
          return <article key={inquiry.id} className="group px-4 py-4 transition hover:bg-slate-50/70 sm:px-5"><div className="flex items-start gap-3 sm:gap-4"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${due ? "bg-amber-50 text-amber-700" : "bg-[#EAF0F8] text-[#0B2C6B]"}`}><MessageSquareText size={18} /></span><div className="min-w-0 flex-1"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><h3 className="truncate text-sm font-semibold text-slate-950">{inquiry.name}</h3><p className="mt-1 truncate text-xs text-slate-500">{inquiry.email}</p></div><div className="flex flex-wrap gap-1.5"><Badge>{readable(inquiry.source)}</Badge><Badge tone="gold">{readable(getDraft(inquiry).status)}</Badge><Badge tone={replyTone}>{replyStatusLabel(inquiry.replyStatus)}</Badge></div></div><p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-600">{inquiry.message || "Tidak ada pesan tambahan."}</p><div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400"><span>{formatDate(inquiry.createdAt)}</span>{due && <><span aria-hidden="true">•</span><span className="font-semibold text-amber-700">Follow-up jatuh tempo</span></>}</div></div><button type="button" onClick={() => setSelectedId(inquiry.id)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition group-hover:border-[#0B2C6B]/20 group-hover:text-[#0B2C6B]" aria-label={`Buka inquiry ${inquiry.name}`}><ArrowRight size={16} /></button></div></article>;
        })}</div> : <EmptyState title="Inquiry tidak ditemukan" description={hasFilters ? "Coba ubah kata pencarian atau reset filter yang aktif." : "Inquiry baru dari website akan muncul di sini."} />}
      </section>

      {selected && <AdminDrawer title={selected.name} eyebrow="Detail inquiry" onClose={() => setSelectedId(null)}>
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold text-slate-950">Kebutuhan calon klien</p><p className="mt-1 text-xs text-slate-500">Masuk dari {selected.source || "website"} pada {formatDate(selected.createdAt)}.</p></div><div className="flex gap-1.5"><Badge tone="gold">{readable(getDraft(selected).status)}</Badge><Badge tone={selected.replyStatus === "sent" || selected.replyStatus === "reviewed" ? "green" : "navy"}>{replyStatusLabel(selected.replyStatus)}</Badge></div></div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{selected.message || "Tidak ada pesan tambahan."}</p>
            <div className="mt-4 flex flex-wrap gap-2">{selected.email && <a href={`mailto:${selected.email}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-[#0B2C6B]"><Mail size={14} /> {selected.email}</a>}{selected.whatsapp && <a href={`https://wa.me/${selected.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-[#0B2C6B]"><Phone size={14} /> WhatsApp</a>}</div>
            {(selected.moduleRequest?.modules || []).length > 0 && <div className="mt-4 border-t border-slate-200 pt-4"><p className="text-[10px] font-bold uppercase tracking-wider text-[#80560F]">Modul yang diminati</p><div className="mt-2 flex flex-wrap gap-2">{(selected.moduleRequest?.modules || []).map((module) => <span key={module.id || module.code} className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-[#0B2C6B]">{module.name || module.code}</span>)}</div></div>}
          </section>

          <section aria-labelledby="inquiry-work-title"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#EAF0F8] text-[#0B2C6B]"><Save size={16} /></span><div><h3 id="inquiry-work-title" className="text-sm font-semibold text-slate-950">Status dan catatan</h3><p className="mt-0.5 text-xs text-slate-500">Simpan konteks kerja sebelum berpindah ke inquiry lain.</p></div></div><div className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr]"><label><span className="mb-2 block text-xs font-semibold text-slate-700">Status</span><AdminSelect ariaLabel="Status inquiry" value={getDraft(selected).status} onChange={(value) => setDrafts((current) => ({ ...current, [selected.id]: { ...getDraft(selected), status: value } }))} options={Array.from(new Set([getDraft(selected).status, ...INQUIRY_STATUS_OPTIONS])).map((item) => [item, readable(item)] as [string, string])} /></label><label><span className="mb-2 block text-xs font-semibold text-slate-700">Catatan internal</span><input value={getDraft(selected).notes} onChange={(event) => setDrafts((current) => ({ ...current, [selected.id]: { ...getDraft(selected), notes: event.target.value } }))} placeholder="Tindakan berikutnya atau konteks penting…" className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0B2C6B] focus:ring-2 focus:ring-[#0B2C6B]/10" /></label></div><div className="mt-3"><PresetButtons options={NOTE_PRESETS} onPick={(value) => setDrafts((current) => ({ ...current, [selected.id]: { ...getDraft(selected), notes: value } }))} /></div><button type="button" onClick={() => void saveInquiry(selected)} disabled={savingId === selected.id} className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#0B2C6B] px-4 text-xs font-semibold text-white disabled:opacity-50"><Save size={14} /> {savingId === selected.id ? "Menyimpan…" : "Simpan status & catatan"}</button></section>

          <section className="rounded-2xl border border-[#0B2C6B]/10 bg-white p-4 shadow-xs" aria-labelledby="inquiry-reply-title">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="flex items-center gap-2 text-sm font-semibold text-[#0B2C6B]"><Bot size={16} /> Balasan berbantuan AI</p><p id="inquiry-reply-title" className="mt-1 text-xs leading-5 text-slate-500">AI menyiapkan draf. Admin tetap membaca, menyimpan review, lalu mengonfirmasi pengiriman.</p></div><Badge tone={selected.replyStatus === "sent" || selected.replyStatus === "reviewed" ? "green" : "gold"}>{replyStatusLabel(selected.replyStatus)}</Badge></div>
            <ol className="mt-4 flex items-center" aria-label="Tahapan balasan inquiry">{["Draf", "Review", "Kirim"].map((label, index) => { const progress = selected.replyStatus === "sent" ? 3 : selected.replyStatus === "reviewed" ? 2 : selected.replyStatus === "draft" ? 1 : 0; const complete = index < progress; return <li key={label} className="flex min-w-0 flex-1 items-center last:flex-none"><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-bold ${complete ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"}`}>{complete ? <Check size={13} /> : index + 1}</span>{index < 2 && <span className={`h-px flex-1 ${index < progress - 1 ? "bg-emerald-300" : "bg-slate-200"}`} />}<span className="sr-only">{label}</span></li>; })}</ol>
            <div className="mt-2 grid grid-cols-3 text-[10px] font-semibold text-slate-500"><span>Draf AI</span><span className="text-center">Review admin</span><span className="text-right">Kirim</span></div>
            <div className="mt-4 space-y-3"><input value={getReplyDraft(selected).subject} onChange={(event) => setReplyDrafts((current) => ({ ...current, [selected.id]: { ...getReplyDraft(selected), subject: event.target.value } }))} disabled={selected.replyStatus === "sent"} placeholder="Subjek balasan" aria-label="Subjek balasan" className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0B2C6B] focus:ring-2 focus:ring-[#0B2C6B]/10 disabled:bg-slate-50" /><textarea value={getReplyDraft(selected).body} onChange={(event) => setReplyDrafts((current) => ({ ...current, [selected.id]: { ...getReplyDraft(selected), body: event.target.value } }))} disabled={selected.replyStatus === "sent"} placeholder="Isi balasan yang relevan dengan kebutuhan calon klien…" aria-label="Isi balasan" className="min-h-48 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 outline-none focus:border-[#0B2C6B] focus:ring-2 focus:ring-[#0B2C6B]/10 disabled:bg-slate-50" /></div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row"><button type="button" onClick={() => void generateReplyDraft(selected)} disabled={Boolean(replyWorking) || selected.replyStatus === "sent"} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-[#0B2C6B] disabled:opacity-50"><Bot size={14} /> {replyWorking === `${selected.id}:generate` ? "Menyiapkan…" : selected.replyStatus === "draft" ? "Buat ulang draf" : "Siapkan draf"}</button><button type="button" onClick={() => void saveReplyReview(selected)} disabled={Boolean(replyWorking) || selected.replyStatus === "sent" || getReplyDraft(selected).subject.trim().length < 3 || getReplyDraft(selected).body.trim().length < 20} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#0B2C6B] px-3 text-xs font-semibold text-white disabled:opacity-50"><CheckCircle2 size={14} /> {replyWorking === `${selected.id}:review` ? "Menyimpan…" : "Simpan review"}</button><button type="button" onClick={() => setConfirmAction({ title: "Kirim balasan yang sudah direview?", description: "Email akan langsung dikirim ke calon klien. Setelah terkirim, draf dikunci dan follow-up otomatis inquiry dijeda.", confirmLabel: "Kirim balasan", tone: "gold", details: [`Nama: ${selected.name}`, `Email: ${selected.email}`, `Subjek: ${selected.replySubject || getReplyDraft(selected).subject}`], onConfirm: () => sendReviewedReply(selected) })} disabled={Boolean(replyWorking) || selected.replyStatus !== "reviewed"} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#D9A441] px-3 text-xs font-semibold text-[#071B3D] disabled:opacity-50"><Send size={14} /> {replyWorking === `${selected.id}:send` ? "Mengirim…" : "Kirim balasan"}</button></div>
            {selected.replyReviewedBy && <p className="mt-3 text-[10px] uppercase tracking-wider text-slate-400">Review terakhir: {selected.replyReviewedBy} · {formatDate(selected.replyReviewedAt || null)}</p>}
          </section>

          <details className="group rounded-2xl border border-slate-200 bg-white"><summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:hidden"><span><span className="block text-sm font-semibold text-slate-900">Follow-up terjadwal</span><span className="mt-0.5 block text-xs text-slate-500">{selected.followUpPaused ? "Sedang dijeda" : nextFollowUp(selected) ? `${nextFollowUp(selected)?.label} adalah langkah berikutnya` : "Semua follow-up selesai"}</span></span><ChevronDown size={16} className="text-slate-400 transition group-open:rotate-180" /></summary><div className="border-t border-slate-100 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-slate-500">Follow-up dikirim berurutan untuk mencegah email ganda.</p><button type="button" onClick={() => void toggleFollowUpPause(selected)} disabled={savingId === selected.id} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-[#0B2C6B] disabled:opacity-50">{selected.followUpPaused ? <PlayCircle size={14} /> : <PauseCircle size={14} />}{selected.followUpPaused ? "Lanjutkan" : "Jeda"}</button></div><div className="mt-4 grid gap-2 sm:grid-cols-3">{FOLLOW_UP_LEVELS.map((item) => { const due = daysSince(selected.createdAt) >= item.days; const currentLevel = selected.followUpLevel || 0; const sent = item.level <= currentLevel; const isNext = item.level === currentLevel + 1; return <button key={item.level} type="button" onClick={() => setConfirmAction({ title: `Kirim ${item.label}?`, description: "Email follow-up akan dibuat dengan bantuan AI dan dikirim ke kontak inquiry ini.", confirmLabel: `Kirim ${item.label}`, tone: "gold", details: [`Nama: ${selected.name}`, `Email: ${selected.email}`, `Status: ${selected.status}`], onConfirm: () => sendFollowUp(selected, item.level) })} disabled={selected.followUpPaused || sent || !isNext || followUpSending === `${selected.id}:${item.level}`} className={`min-h-14 rounded-xl border px-3 text-left text-xs font-semibold transition disabled:opacity-55 ${due && isNext && !selected.followUpPaused ? "border-[#0B2C6B] bg-[#0B2C6B] text-white" : "border-slate-200 bg-slate-50 text-slate-600"}`}><span className="block">{sent ? "Terkirim" : !isNext ? "Menunggu urutan" : item.label}</span><span className="mt-1 block text-[10px] font-normal opacity-70">Setelah {item.days} hari</span></button>; })}</div></div></details>
        </div>
      </AdminDrawer>}
    </div>
  );
}
