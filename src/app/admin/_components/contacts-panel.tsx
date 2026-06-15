"use client";

import { useMemo, useState } from "react";
import { Mail, Phone, Save } from "lucide-react";
import { CONTACT_STATUS_OPTIONS, NOTE_PRESETS } from "../_lib/constants";
import type { ContactRecord } from "../_lib/types";
import { formatDate, getSmartContactStatus, uniqueOptions } from "../_lib/utils";
import { AdminNotice, AdminSearch, AdminSelect, Badge, GuidancePanel, Panel, PresetButtons } from "./shared";

export function ContactsPanel({
  contacts,
  onAction,
  onRefresh,
}: {
  contacts: ContactRecord[];
  onAction: (url: string, init?: RequestInit) => Promise<unknown>;
  onRefresh: () => Promise<void>;
}) {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { status: string; notes: string }>>({});
  const [actionError, setActionError] = useState("");
  const [search, setSearch] = useState("");
  const [sourceType, setSourceType] = useState("Semua");
  const [category, setCategory] = useState("Semua");
  const [status, setStatus] = useState("Semua");

  const filteredContacts = useMemo(() => {
    const keyword = search.toLowerCase();
    return contacts.filter((contact) =>
      [contact.name, contact.email, contact.whatsapp, contact.category, contact.status, getSmartContactStatus(contact), contact.source]
        .join(" ")
        .toLowerCase()
        .includes(keyword) &&
      (sourceType === "Semua" || contact.sourceType === sourceType) &&
      (category === "Semua" || contact.category === category) &&
      (status === "Semua" || contact.status === status || getSmartContactStatus(contact) === status)
    );
  }, [category, contacts, search, sourceType, status]);

  const sourceOptions = uniqueOptions(contacts, (contact) => contact.sourceType);
  const categoryOptions = uniqueOptions(contacts, (contact) => contact.category);
  const statusOptions = Array.from(
    new Set([...uniqueOptions(contacts, (contact) => contact.status), ...contacts.map(getSmartContactStatus)])
  ).sort((a, b) => a.localeCompare(b));

  const getDraft = (contact: ContactRecord) =>
    drafts[contact.id] || { status: contact.status || getSmartContactStatus(contact), notes: contact.notes || "" };

  const saveContact = async (contact: ContactRecord) => {
    if (contact.sourceType !== "lead") return;
    setSavingId(contact.id);
    setActionError("");
    try {
      await onAction("/api/admin/contacts", {
        method: "PATCH",
        body: JSON.stringify({ id: contact.recordId, ...getDraft(contact) }),
      });
      await onRefresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal memperbarui kontak.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Panel title="Master Database Kontak" action={`${filteredContacts.length}/${contacts.length} records`}>
      {actionError && <AdminNotice>{actionError}</AdminNotice>}
      <GuidancePanel
        title="Panduan Kontak & Leads"
        items={[
          "Gunakan filter source dan status untuk memisahkan lead assessment, inquiry, associate, dan kontak internal.",
          "Status AI adalah rekomendasi prioritas; status manual tetap menjadi sumber keputusan admin.",
          "Catatan internal sebaiknya menjawab: sudah dihubungi lewat apa, respon terakhir, dan next step.",
        ]}
      />
      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_160px_180px_160px]">
        <AdminSearch value={search} onChange={setSearch} placeholder="Cari nama, email, telepon, kategori..." />
        <AdminSelect value={sourceType} onChange={setSourceType} options={["Semua", ...sourceOptions]} />
        <AdminSelect value={category} onChange={setCategory} options={["Semua", ...categoryOptions]} />
        <AdminSelect value={status} onChange={setStatus} options={["Semua", ...statusOptions]} />
      </div>
      <div className="grid gap-3">
        {filteredContacts.map((contact) => (
          <div key={`${contact.source}-${contact.id}`} className="rounded-[12px] border border-black/[0.05] bg-[#FCFCFB] p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-base font-semibold">{contact.name}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-black/48">
                  <span className="flex items-center gap-1"><Mail size={13} /> {contact.email}</span>
                  {contact.whatsapp && <span className="flex items-center gap-1"><Phone size={13} /> {contact.whatsapp}</span>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>{contact.category}</Badge>
                <Badge>{contact.sourceType}</Badge>
                <Badge>AI: {getSmartContactStatus(contact)}</Badge>
                <Badge tone="gold">{getDraft(contact).status}</Badge>
              </div>
            </div>
            {contact.message && <p className="mt-4 text-sm font-light leading-relaxed text-black/58">{contact.message}</p>}
            {contact.sourceType === "lead" && (
              <div className="mt-5 grid gap-3 lg:grid-cols-[180px_1fr_auto]">
                <AdminSelect
                  value={getDraft(contact).status}
                  onChange={(value) =>
                    setDrafts((current) => ({
                      ...current,
                      [contact.id]: { ...getDraft(contact), status: value },
                    }))
                  }
                  options={Array.from(new Set([getSmartContactStatus(contact), ...CONTACT_STATUS_OPTIONS]))}
                />
                <input
                  value={getDraft(contact).notes}
                  onChange={(event) =>
                    setDrafts((current) => ({
                      ...current,
                      [contact.id]: { ...getDraft(contact), notes: event.target.value },
                    }))
                  }
                  placeholder="Catatan internal kontak..."
                  className="h-11 rounded-[10px] border border-black/10 bg-white px-3 text-sm outline-none focus:border-[#D9A441]"
                />
                <div className="flex gap-2">
                  <a href={`mailto:${contact.email}`} className="grid h-11 w-11 place-items-center rounded-[10px] border border-black/10 bg-white text-[#0B2C6B]">
                    <Mail size={15} />
                  </a>
                  {contact.whatsapp && (
                    <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`} target="_blank" className="grid h-11 w-11 place-items-center rounded-[10px] border border-black/10 bg-white text-[#0B2C6B]">
                      <Phone size={15} />
                    </a>
                  )}
                  <button
                    onClick={() => saveContact(contact)}
                    disabled={savingId === contact.id}
                    className="grid h-11 w-11 place-items-center rounded-[10px] bg-[#0B2C6B] text-white disabled:opacity-50"
                  >
                    <Save size={15} />
                  </button>
                </div>
                <div className="lg:col-span-3">
                  <PresetButtons
                    options={NOTE_PRESETS}
                    onPick={(value) =>
                      setDrafts((current) => ({
                        ...current,
                        [contact.id]: { ...getDraft(contact), notes: value },
                      }))
                    }
                  />
                </div>
              </div>
            )}
            {contact.sourceType !== "lead" && (
              <div className="mt-5 flex gap-2">
                <a href={`mailto:${contact.email}`} className="grid h-11 w-11 place-items-center rounded-[10px] border border-black/10 bg-white text-[#0B2C6B]">
                  <Mail size={15} />
                </a>
                {contact.whatsapp && (
                  <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`} target="_blank" className="grid h-11 w-11 place-items-center rounded-[10px] border border-black/10 bg-white text-[#0B2C6B]">
                    <Phone size={15} />
                  </a>
                )}
              </div>
            )}
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-black/32">
              {contact.source} / {formatDate(contact.createdAt)}
            </p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
