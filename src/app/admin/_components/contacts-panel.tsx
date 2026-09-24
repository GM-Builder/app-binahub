"use client";

import { useMemo, useState } from "react";
import { ArrowRight, ContactRound, Mail, Phone, RotateCcw, Save, UserRoundCheck } from "lucide-react";
import { CONTACT_STATUS_OPTIONS, NOTE_PRESETS } from "../_lib/constants";
import type { ContactRecord } from "../_lib/types";
import { formatDate, getSmartContactStatus, uniqueOptions } from "../_lib/utils";
import { AdminDrawer, AdminNotice, AdminSearch, AdminSelect, Badge, EmptyState, PresetButtons } from "./shared";

function readable(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ContactMetric({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div className="min-w-0 border-l border-slate-200 pl-4 first:border-l-0 first:pl-0">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 truncate text-[11px] text-slate-400">{note}</p>
    </div>
  );
}

export function ContactsPanel({ contacts, onAction, onRefresh }: {
  contacts: ContactRecord[];
  onAction: (url: string, init?: RequestInit) => Promise<unknown>;
  onRefresh: () => Promise<void>;
}) {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { status: string; notes: string }>>({});
  const [actionError, setActionError] = useState("");
  const [search, setSearch] = useState("");
  const [sourceType, setSourceType] = useState("Semua");
  const [category, setCategory] = useState("Semua");
  const [status, setStatus] = useState("Semua");

  const filteredContacts = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("id-ID");
    return contacts.filter((contact) =>
      (!keyword || [contact.name, contact.email, contact.whatsapp, contact.category, contact.status, getSmartContactStatus(contact), contact.source]
        .join(" ").toLocaleLowerCase("id-ID").includes(keyword)) &&
      (sourceType === "Semua" || contact.sourceType === sourceType) &&
      (category === "Semua" || contact.category === category) &&
      (status === "Semua" || contact.status === status || getSmartContactStatus(contact) === status)
    );
  }, [category, contacts, search, sourceType, status]);

  const sourceOptions = uniqueOptions(contacts, (contact) => contact.sourceType);
  const categoryOptions = uniqueOptions(contacts, (contact) => contact.category);
  const statusOptions = Array.from(new Set([...uniqueOptions(contacts, (contact) => contact.status), ...contacts.map(getSmartContactStatus)])).sort((a, b) => a.localeCompare(b));
  const selected = contacts.find((contact) => `${contact.source}:${contact.id}` === selectedKey) || null;
  const leadCount = contacts.filter((contact) => contact.sourceType === "lead").length;
  const reachableCount = contacts.filter((contact) => contact.email || contact.whatsapp).length;
  const sourceCount = new Set(contacts.map((contact) => contact.source).filter(Boolean)).size;
  const hasFilters = Boolean(search || sourceType !== "Semua" || category !== "Semua" || status !== "Semua");

  const getDraft = (contact: ContactRecord) => drafts[contact.id] || { status: contact.status || getSmartContactStatus(contact), notes: contact.notes || "" };

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
      await onAction("/api/admin/contacts", { method: "PATCH", body: JSON.stringify({ id: contact.recordId, ...getDraft(contact) }) });
      await onRefresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal memperbarui kontak.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {actionError && <AdminNotice>{actionError}</AdminNotice>}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs" aria-labelledby="contact-summary-title">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#80560F]">Database relasi</p>
            <h2 id="contact-summary-title" className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Semua kontak dalam satu pandangan</h2>
            <p className="mt-1 text-sm text-slate-500">Cari orangnya, lihat konteksnya, lalu lanjutkan tindakan dari panel detail.</p>
          </div>
          <p className="text-xs font-semibold text-slate-400">{contacts.length} kontak tersimpan</p>
        </div>
        <div className="grid grid-cols-2 gap-5 px-5 py-5 sm:px-6 lg:grid-cols-4">
          <ContactMetric label="Total kontak" value={contacts.length} note="Semua sumber" />
          <ContactMetric label="Lead yang dapat dikelola" value={leadCount} note="Status dan catatan dapat diubah" />
          <ContactMetric label="Dapat dihubungi" value={reachableCount} note="Memiliki email atau WhatsApp" />
          <ContactMetric label="Sumber aktif" value={sourceCount} note="Asal data yang tercatat" />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs" aria-labelledby="contact-list-title">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="min-w-0 flex-1"><AdminSearch value={search} onChange={setSearch} placeholder="Cari nama, email, telepon, kategori, atau sumber…" /></div>
            <div className="grid gap-2 sm:grid-cols-3 xl:w-[560px]">
              <AdminSelect ariaLabel="Filter jenis kontak" value={sourceType} onChange={setSourceType} options={[["Semua", "Semua jenis"], ...sourceOptions.map((item) => [item, readable(item)] as [string, string])]} />
              <AdminSelect ariaLabel="Filter kategori kontak" value={category} onChange={setCategory} options={[["Semua", "Semua kategori"], ...categoryOptions.map((item) => [item, readable(item)] as [string, string])]} />
              <AdminSelect ariaLabel="Filter status kontak" value={status} onChange={setStatus} options={[["Semua", "Semua status"], ...statusOptions.map((item) => [item, readable(item)] as [string, string])]} />
            </div>
            {hasFilters && <button type="button" onClick={resetFilters} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><RotateCcw size={14} /> Reset</button>}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <h2 id="contact-list-title" className="text-sm font-semibold text-slate-900">Daftar kontak</h2>
            <p className="text-xs text-slate-400">Menampilkan {filteredContacts.length} dari {contacts.length}</p>
          </div>
        </div>

        {filteredContacts.length ? <div className="divide-y divide-slate-100">
          {filteredContacts.map((contact) => {
            const lead = contact.sourceType === "lead";
            return (
              <article key={`${contact.source}-${contact.id}`} className="group px-4 py-4 transition hover:bg-slate-50/70 sm:px-5">
                <div className="flex items-start gap-3 sm:gap-4">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${lead ? "bg-[#0B2C6B] text-white" : "bg-slate-100 text-slate-500"}`}><ContactRound size={18} aria-hidden="true" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0"><h3 className="truncate text-sm font-semibold text-slate-950">{contact.name}</h3><p className="mt-1 truncate text-xs text-slate-500">{contact.email || contact.whatsapp || "Belum ada kontak langsung"}</p></div>
                      <div className="flex flex-wrap gap-1.5"><Badge tone={lead ? "navy" : "green"}>{lead ? "Lead" : readable(contact.sourceType)}</Badge><Badge tone="gold">{readable(getDraft(contact).status)}</Badge></div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400"><span>{readable(contact.category || "Belum dikategorikan")}</span><span aria-hidden="true">•</span><span>{contact.source || "Sumber tidak tercatat"}</span><span aria-hidden="true">•</span><span>{formatDate(contact.createdAt)}</span></div>
                  </div>
                  <button type="button" onClick={() => setSelectedKey(`${contact.source}:${contact.id}`)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition group-hover:border-[#0B2C6B]/20 group-hover:text-[#0B2C6B]" aria-label={`Buka detail ${contact.name}`}><ArrowRight size={16} /></button>
                </div>
              </article>
            );
          })}
        </div> : <EmptyState title="Kontak tidak ditemukan" description={hasFilters ? "Coba ubah kata pencarian atau reset filter yang aktif." : "Kontak dari inquiry, assessment, dan sumber lain akan muncul di sini."} />}
      </section>

      {selected && <AdminDrawer title={selected.name} eyebrow="Detail kontak" onClose={() => setSelectedKey(null)} maxWidth="max-w-2xl">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-slate-950">Informasi kontak</p><p className="mt-1 text-xs text-slate-500">Berasal dari {selected.source || "sumber yang belum tercatat"} pada {formatDate(selected.createdAt)}.</p></div><Badge tone={selected.sourceType === "lead" ? "navy" : "green"}>{selected.sourceType === "lead" ? "Lead" : readable(selected.sourceType)}</Badge></div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</dt><dd className="mt-1 break-all text-sm font-medium text-slate-800">{selected.email || "Belum tersedia"}</dd></div>
              <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">WhatsApp</dt><dd className="mt-1 text-sm font-medium text-slate-800">{selected.whatsapp || "Belum tersedia"}</dd></div>
              <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kategori</dt><dd className="mt-1 text-sm font-medium text-slate-800">{readable(selected.category || "Belum dikategorikan")}</dd></div>
              <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status sistem</dt><dd className="mt-1 text-sm font-medium text-slate-800">{readable(getSmartContactStatus(selected))}</dd></div>
            </dl>
            {selected.message && <div className="mt-4 border-t border-slate-200 pt-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Konteks awal</p><p className="mt-2 text-sm leading-6 text-slate-600">{selected.message}</p></div>}
            <div className="mt-4 flex gap-2">
              {selected.email && <a href={`mailto:${selected.email}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-[#0B2C6B]"><Mail size={14} /> Email</a>}
              {selected.whatsapp && <a href={`https://wa.me/${selected.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-[#0B2C6B]"><Phone size={14} /> WhatsApp</a>}
            </div>
          </section>

          {selected.sourceType === "lead" ? <section aria-labelledby="contact-management-title">
            <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#EAF0F8] text-[#0B2C6B]"><UserRoundCheck size={17} /></span><div><h3 id="contact-management-title" className="text-sm font-semibold text-slate-950">Kelola hubungan</h3><p className="mt-0.5 text-xs text-slate-500">Perbarui status dan simpan konteks penting untuk tim.</p></div></div>
            <div className="mt-4 space-y-4">
              <label className="block"><span className="mb-2 block text-xs font-semibold text-slate-700">Status kontak</span><AdminSelect ariaLabel="Status kontak" value={getDraft(selected).status} onChange={(value) => setDrafts((current) => ({ ...current, [selected.id]: { ...getDraft(selected), status: value } }))} options={Array.from(new Set([getSmartContactStatus(selected), ...CONTACT_STATUS_OPTIONS])).map((item) => [item, readable(item)] as [string, string])} /></label>
              <label className="block"><span className="mb-2 block text-xs font-semibold text-slate-700">Catatan internal</span><textarea value={getDraft(selected).notes} onChange={(event) => setDrafts((current) => ({ ...current, [selected.id]: { ...getDraft(selected), notes: event.target.value } }))} placeholder="Tuliskan konteks, kebutuhan, atau tindakan berikutnya…" className="min-h-32 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-[#0B2C6B] focus:ring-2 focus:ring-[#0B2C6B]/10" /></label>
              <PresetButtons options={NOTE_PRESETS} onPick={(value) => setDrafts((current) => ({ ...current, [selected.id]: { ...getDraft(selected), notes: value } }))} />
              <button type="button" onClick={() => void saveContact(selected)} disabled={savingId === selected.id} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0B2C6B] px-4 text-sm font-semibold text-white transition hover:bg-[#071B3D] disabled:opacity-50"><Save size={15} /> {savingId === selected.id ? "Menyimpan…" : "Simpan perubahan"}</button>
            </div>
          </section> : <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">Kontak ini berasal dari sumber referensi dan bersifat baca-saja. Gunakan Email atau WhatsApp untuk melanjutkan komunikasi.</div>}
        </div>
      </AdminDrawer>}
    </div>
  );
}
