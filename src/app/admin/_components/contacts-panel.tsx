"use client";

import { useCallback,useEffect,useMemo,useState } from "react";
import { ArrowRight, ContactRound, Mail, Phone, RotateCcw, Save, Search, UserRoundCheck } from "lucide-react";
import { CONTACT_STATUS_OPTIONS, NOTE_PRESETS } from "../_lib/constants";
import type { ContactRecord } from "../_lib/types";
import { formatDate, uniqueOptions } from "../_lib/utils";
import { AdminDrawer, AdminNotice, AdminSelect, Badge, EmptyState, PresetButtons } from "./shared";
import { useContactInbox } from '../_lib/use-contact-inbox';

function readable(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ContactMetric({ label, value, note }: { label: string; value: number|null; note: string }) {
  return (
    <div className="min-w-0 border-l border-slate-200 pl-4 first:border-l-0 first:pl-0">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-slate-950">{value?.toLocaleString('id-ID')??'—'}</p>
      <p className="mt-1 text-[11px] leading-4 text-slate-500">{note}</p>
    </div>
  );
}

export function ContactsPanel({ contacts, onAction, onRefresh, serverMode=false, refreshToken=0 }: {
  contacts: ContactRecord[];
  onAction: (url: string, init?: RequestInit) => Promise<unknown>;
  onRefresh: () => Promise<void>;
  serverMode?:boolean;
  refreshToken?:number;
}) {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { status: string; notes: string; statusChanged?:boolean }>>({});
  const [actionError, setActionError] = useState("");
  const [search, setSearch] = useState("");
  const [sourceType, setSourceType] = useState("Semua");
  const [category, setCategory] = useState("Semua");
  const [status, setStatus] = useState("Semua");
  const inbox=useContactInbox({enabled:serverMode,search,type:sourceType,category,status,selectedId:selectedKey,refreshToken});
  const contactKey=(contact:Pick<ContactRecord,'id'|'source'>)=>serverMode?contact.id:`${contact.source}:${contact.id}`;

  const filteredContacts = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("id-ID");
    return contacts.filter((contact) =>
      (!keyword || [contact.name, contact.email, contact.whatsapp, contact.category, contact.status, contact.source]
        .join(" ").toLocaleLowerCase("id-ID").includes(keyword)) &&
      (sourceType === "Semua" || contact.sourceType === sourceType) &&
      (category === "Semua" || contact.category === category) &&
      (status === "Semua" || contact.status === status)
    );
  }, [category, contacts, search, sourceType, status]);

  const options=(values:string[]|undefined,selected:string)=>Array.from(new Set([...(values||[]),...(selected==='Semua'?[]:[selected])]));
  const sourceOptions = serverMode?options(inbox.facets?.types,sourceType):uniqueOptions(contacts, (contact) => contact.sourceType);
  const categoryOptions = serverMode?options(inbox.facets?.categories,category):uniqueOptions(contacts, (contact) => contact.category);
  const statusOptions = serverMode?options(inbox.facets?.statuses,status):uniqueOptions(contacts, (contact) => contact.status);
  const visibleContacts=serverMode?inbox.data?.records||[]:filteredContacts;
  const selected = serverMode?inbox.record:contacts.find((contact) => `${contact.source}:${contact.id}` === selectedKey) || null;
  const leadCount = serverMode?inbox.data?.counts.leads??null:contacts.filter((contact) => contact.sourceType === "lead").length;
  const reachableCount = serverMode?inbox.data?.counts.reachable??null:contacts.filter((contact) => contact.email&&contact.email!=='-' || contact.whatsapp).length;
  const sourceCount = serverMode?inbox.data?.counts.sources??null:new Set(contacts.map((contact) => contact.source).filter(Boolean)).size;
  const hasFilters = Boolean(search || sourceType !== "Semua" || category !== "Semua" || status !== "Semua");

  const getDraft = (contact: ContactRecord) => {
    const draft=drafts[contactKey(contact)];
    return {status:draft?.statusChanged?draft.status:contact.status||'Lead Baru',notes:draft?.notes??contact.notes??'',statusChanged:draft?.statusChanged===true};
  };
  const working=selected||(serverMode?inbox.baseline:null);
  const dirty=Boolean(working&&working.sourceType==='lead'&&(getDraft(working).status!==working.status||getDraft(working).notes!==working.notes));
  useEffect(()=>{if(!dirty)return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
  const closeDetail=useCallback(()=>{if(savingId)return;if(!dirty||window.confirm('Ada perubahan kontak yang belum tersimpan. Tetap tutup detail?'))setSelectedKey(null);},[dirty,savingId]);

  const resetFilters = () => {
    setSearch("");
    setSourceType("Semua");
    setCategory("Semua");
    setStatus("Semua");
  };

  const saveContact = async (contact: ContactRecord) => {
    if (contact.sourceType !== "lead") return;
    setSavingId(contact.id);
    setActionError("");
    try {
      const draft=getDraft(contact);
      await onAction("/api/admin/contacts", { method: "PATCH", body: JSON.stringify({ id: contact.recordId, notes:draft.notes,...(draft.statusChanged&&draft.status!==contact.status?{status:draft.status}:{}) }) });
      setDrafts(current=>({...current,[contactKey(contact)]:{...draft,statusChanged:false}}));
      if(serverMode)inbox.refresh();else await onRefresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal memperbarui kontak.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {actionError && !selectedKey && <AdminNotice>{actionError}</AdminNotice>}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs" aria-labelledby="contact-summary-title">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#80560F]">Database relasi</p>
            <h2 id="contact-summary-title" className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Semua kontak dalam satu pandangan</h2>
            <p className="mt-1 text-sm text-slate-500">Cari orangnya, lihat konteksnya, lalu lanjutkan tindakan dari panel detail.</p>
          </div>
          <p role="status" className="text-xs font-semibold text-slate-500">{serverMode?inbox.loading?"Memuat kontak…":inbox.error?"Data belum tersedia":`${inbox.data?.total.toLocaleString("id-ID")} kontak ditemukan`:`${contacts.length} kontak tersimpan`}</p>
        </div>
        <div className="grid grid-cols-2 gap-5 px-5 py-5 sm:px-6 lg:grid-cols-4">
          <ContactMetric label="Total kontak" value={serverMode?inbox.data?.total??null:contacts.length} note="Semua sumber" />
          <ContactMetric label="Lead yang dapat dikelola" value={leadCount} note="Status dan catatan dapat diubah" />
          <ContactMetric label="Dapat dihubungi" value={reachableCount} note="Memiliki email atau WhatsApp" />
          <ContactMetric label="Sumber tercatat" value={sourceCount} note="Asal data yang tercatat" />
        </div>
        {serverMode&&<p className="px-5 pb-5 text-xs leading-5 text-slate-500 sm:px-6">Ringkasan mengikuti pencarian dan filter pada seluruh arsip. Kontak dengan email yang sama, atau nomor yang sama saat email tidak tersedia, ditampilkan bersama. Status mengikuti data tersimpan, bukan kesimpulan dari catatan.</p>}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs" aria-labelledby="contact-list-title">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="min-w-0 flex-1"><label className="relative block"><Search size={15} aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"/><input type="search" maxLength={150} aria-label="Cari kontak" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Cari nama, email, telepon, kategori, atau sumber…" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-base text-slate-900 placeholder:text-slate-500 outline-none focus:border-[#0B2C6B] focus:ring-2 focus:ring-[#0B2C6B]/10 sm:text-sm"/></label></div>
            <div className="grid gap-2 sm:grid-cols-3 xl:w-[560px]">
              <AdminSelect ariaLabel="Filter jenis kontak" value={sourceType} onChange={setSourceType} options={[["Semua", "Semua jenis"], ...sourceOptions.map((item) => [item, readable(item)] as [string, string])]} />
              <AdminSelect ariaLabel="Filter kategori kontak" value={category} onChange={setCategory} options={[["Semua", "Semua kategori"], ...categoryOptions.map((item) => [item, readable(item)] as [string, string])]} />
              <AdminSelect ariaLabel="Filter status kontak" value={status} onChange={setStatus} options={[["Semua", "Semua status"], ...statusOptions.map((item) => [item, readable(item)] as [string, string])]} />
            </div>
            {hasFilters && <button type="button" onClick={resetFilters} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><RotateCcw size={14} /> Reset</button>}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <h2 id="contact-list-title" className="text-sm font-semibold text-slate-900">Daftar kontak</h2>
            <p role="status" className="text-xs tabular-nums text-slate-500">{serverMode?inbox.loading?"Memuat…":inbox.error?"Data belum tersedia":`${inbox.data?.total.toLocaleString("id-ID")} kontak ditemukan`:`Menampilkan ${filteredContacts.length} dari ${contacts.length}`}</p>
          </div>
        </div>

        {serverMode&&inbox.loading?<p role="status" className="p-5 text-sm text-slate-600">Memuat kontak dari seluruh arsip…</p>:serverMode&&inbox.error?<div className="p-5"><p role="alert" className="text-sm leading-6 text-red-700">{inbox.error}</p><button type="button" onClick={inbox.retryList} className="mt-2 min-h-11 text-sm font-semibold text-[#0B2C6B] underline">Coba muat daftar lagi</button></div>:visibleContacts.length ? <div className="max-h-[min(65svh,800px)] divide-y divide-slate-100 overflow-y-auto">
          {visibleContacts.map((contact) => {
            const lead = contact.sourceType === "lead";
            return (
              <article key={`${contact.source}-${contact.id}`} className="group px-4 py-4 transition hover:bg-slate-50/70 sm:px-5">
                <div className="flex items-start gap-3 sm:gap-4">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${lead ? "bg-[#0B2C6B] text-white" : "bg-slate-100 text-slate-500"}`}><ContactRound size={18} aria-hidden="true" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0"><h3 className="truncate text-sm font-semibold text-slate-950">{contact.name}</h3><p className="mt-1 truncate text-xs text-slate-500">{contact.email || contact.whatsapp || "Belum ada kontak langsung"}</p></div>
                      <div className="flex flex-wrap gap-1.5"><Badge tone={lead ? "navy" : "green"}>{lead ? "Lead" : readable(contact.sourceType)}</Badge><Badge tone="gold">{readable(contact.status)}</Badge></div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400"><span>{readable(contact.category || "Belum dikategorikan")}</span><span aria-hidden="true">•</span><span className="min-w-0 [overflow-wrap:anywhere]">{contact.source || "Sumber tidak tercatat"}</span><span aria-hidden="true">•</span><span>{formatDate(contact.createdAt)}</span></div>
                  </div>
                  <button type="button" onClick={() => setSelectedKey(contactKey(contact))} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition group-hover:border-[#0B2C6B]/20 group-hover:text-[#0B2C6B]" aria-label={`Buka detail ${contact.name}`}><ArrowRight size={16} /></button>
                </div>
              </article>
            );
          })}
        </div> : <EmptyState title="Kontak tidak ditemukan" description={hasFilters ? "Coba ubah kata pencarian atau reset filter yang aktif." : "Kontak dari inquiry, Self Diagnostic, dan sumber lain akan muncul di sini."} />}
        {serverMode&&<nav aria-label="Halaman kontak" className="border-t border-slate-100 p-4 text-sm text-slate-600"><p className="text-center tabular-nums">{inbox.loading||inbox.error?'—':`${inbox.data?.total?inbox.page*20+1:0}–${Math.min((inbox.page+1)*20,inbox.data?.total||0)} dari ${inbox.data?.total.toLocaleString('id-ID')}`}</p><div className="mx-auto mt-1 flex max-w-sm items-center justify-between gap-2"><button type="button" disabled={!inbox.page||inbox.loading||Boolean(inbox.error)} onClick={()=>inbox.setPage(inbox.page-1)} className="min-h-11 rounded-lg px-1 font-semibold text-[#0B2C6B] disabled:opacity-40">Sebelumnya</button><span className="tabular-nums">{inbox.loading||inbox.error?'…':`${inbox.page+1} / ${Math.max(1,Math.ceil((inbox.data?.total||0)/20))}`}</span><button type="button" disabled={(inbox.page+1)*20>=(inbox.data?.total||0)||inbox.loading||Boolean(inbox.error)} onClick={()=>inbox.setPage(inbox.page+1)} className="min-h-11 rounded-lg px-1 font-semibold text-[#0B2C6B] disabled:opacity-40">Berikutnya</button></div></nav>}
      </section>

      {(selected||serverMode&&selectedKey) && <AdminDrawer title={selected?.name||"Kontak"} eyebrow="Detail kontak" onClose={closeDetail} closeDisabled={Boolean(savingId)} maxWidth="max-w-2xl">
        {actionError&&<p role="alert" className="mb-4 text-sm leading-6 text-red-700">{actionError}</p>}
        {serverMode&&(inbox.detailLoading||inbox.detailError)?<div>{inbox.detailError?<><p role="alert" className="text-sm leading-6 text-red-700">{inbox.detailError}</p><button type="button" onClick={inbox.retryDetail} className="mt-3 min-h-11 text-sm font-semibold text-[#0B2C6B] underline">Coba muat detail lagi</button></>:<p role="status" className="text-sm text-slate-600">Memuat detail kontak…</p>}</div>:selected&&<>
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-slate-950">Informasi kontak</p><p className="mt-1 text-xs text-slate-500">Berasal dari {selected.source || "sumber yang belum tercatat"} pada {formatDate(selected.createdAt)}.</p></div><Badge tone={selected.sourceType === "lead" ? "navy" : "green"}>{selected.sourceType === "lead" ? "Lead" : readable(selected.sourceType)}</Badge></div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</dt><dd className="mt-1 break-all text-sm font-medium text-slate-800">{selected.email || "Belum tersedia"}</dd></div>
              <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">WhatsApp</dt><dd className="mt-1 break-all text-sm font-medium text-slate-800">{selected.whatsapp || "Belum tersedia"}</dd></div>
              <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kategori</dt><dd className="mt-1 break-words text-sm font-medium text-slate-800">{readable(selected.category || "Belum dikategorikan")}</dd></div>
              <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status tercatat</dt><dd className="mt-1 text-sm font-medium text-slate-800">{readable(selected.status)}</dd></div>
            </dl>
            {selected.message && <div className="mt-4 border-t border-slate-200 pt-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Konteks awal</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{selected.message}</p></div>}
            <div className="mt-4 flex gap-2">
              {selected.email && <a href={`mailto:${selected.email}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-[#0B2C6B]"><Mail size={14} /> Email</a>}
              {selected.whatsapp && <a href={`https://wa.me/${selected.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-[#0B2C6B]"><Phone size={14} /> WhatsApp</a>}
            </div>
          </section>

          {selected.sourceType === "lead" ? <section aria-labelledby="contact-management-title">
            <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#EAF0F8] text-[#0B2C6B]"><UserRoundCheck size={17} /></span><div><h3 id="contact-management-title" className="text-sm font-semibold text-slate-950">Kelola hubungan</h3><p className="mt-0.5 text-xs text-slate-500">Perbarui status dan simpan konteks penting untuk tim.</p></div></div>
            <fieldset disabled={Boolean(savingId)} className="mt-4 space-y-4">
              <label className="block"><span className="mb-2 block text-xs font-semibold text-slate-700">Status kontak</span><AdminSelect ariaLabel="Status kontak" value={getDraft(selected).status} onChange={(value) => setDrafts((current) => ({ ...current, [contactKey(selected)]: { ...getDraft(selected), status: value, statusChanged:true } }))} options={Array.from(new Set([getDraft(selected).status, ...CONTACT_STATUS_OPTIONS])).map((item) => [item, readable(item)] as [string, string])} /></label>
              <label className="block"><span className="mb-2 block text-xs font-semibold text-slate-700">Catatan internal</span><textarea maxLength={4000} value={getDraft(selected).notes} onChange={(event) => setDrafts((current) => ({ ...current, [contactKey(selected)]: { ...getDraft(selected), notes: event.target.value } }))} placeholder="Tuliskan konteks, kebutuhan, atau tindakan berikutnya…" className="min-h-32 w-full rounded-xl border border-slate-200 bg-white p-3 text-base leading-6 sm:text-sm text-slate-900 outline-none transition focus:border-[#0B2C6B] focus:ring-2 focus:ring-[#0B2C6B]/10" /></label>
              <PresetButtons options={NOTE_PRESETS} onPick={(value) => setDrafts((current) => ({ ...current, [contactKey(selected)]: { ...getDraft(selected), notes: value } }))} />
              <button type="button" onClick={() => void saveContact(selected)} disabled={savingId === selected.id} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0B2C6B] px-4 text-sm font-semibold text-white transition hover:bg-[#071B3D] disabled:opacity-50"><Save size={15} /> {savingId === selected.id ? "Menyimpan…" : "Simpan perubahan"}</button>
            </fieldset>
          </section> : <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">Kontak ini berasal dari sumber referensi dan bersifat baca-saja. Gunakan Email atau WhatsApp untuk melanjutkan komunikasi.</div>}
        </div>
        </>}
      </AdminDrawer>}
    </div>
  );
}
