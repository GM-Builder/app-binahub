"use client";

import { useMemo, useState } from "react";
import { Mail, Phone, Save } from "lucide-react";
import { FOLLOW_UP_LEVELS, INQUIRY_STATUS_OPTIONS, NOTE_PRESETS } from "../_lib/constants";
import type { ConfirmAction, InquiryRecord } from "../_lib/types";
import { daysSince, formatDate, uniqueOptions } from "../_lib/utils";
import { AdminNotice, AdminSearch, AdminSelect, Badge, ConfirmDialog, GuidancePanel, Panel, PresetButtons } from "./shared";

export function InquiriesPanel({
  inquiries,
  onAction,
  onRefresh,
}: {
  inquiries: InquiryRecord[];
  onAction: (url: string, init?: RequestInit) => Promise<unknown>;
  onRefresh: () => Promise<void>;
}) {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { status: string; notes: string }>>({});
  const [actionError, setActionError] = useState("");
  const [followUpSending, setFollowUpSending] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("Semua");
  const [status, setStatus] = useState("Semua");

  const filteredInquiries = useMemo(() => {
    const keyword = search.toLowerCase();
    return inquiries.filter((inquiry) =>
      [inquiry.name, inquiry.email, inquiry.whatsapp, inquiry.message, inquiry.source, inquiry.status]
        .join(" ")
        .toLowerCase()
        .includes(keyword) &&
      (source === "Semua" || inquiry.source === source) &&
      (status === "Semua" || inquiry.status === status)
    );
  }, [inquiries, search, source, status]);

  const sourceOptions = uniqueOptions(inquiries, (inquiry) => inquiry.source);
  const statusOptions = uniqueOptions(inquiries, (inquiry) => inquiry.status);

  const getDraft = (inquiry: InquiryRecord) =>
    drafts[inquiry.id] || { status: inquiry.status || "Baru", notes: inquiry.notes || "" };

  const saveInquiry = async (inquiry: InquiryRecord) => {
    setSavingId(inquiry.id);
    setActionError("");
    try {
      await onAction("/api/admin/inquiries", {
        method: "PATCH",
        body: JSON.stringify({ id: inquiry.id, ...getDraft(inquiry) }),
      });
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
      await onAction("/api/admin/follow-up", {
        method: "POST",
        body: JSON.stringify({ inquiryId: inquiry.id, level }),
      });
      await onRefresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal mengirim follow up.");
    } finally {
      setFollowUpSending(null);
    }
  };

  return (
    <Panel title="Inquiry Masuk" action={`${filteredInquiries.length}/${inquiries.length} records`}>
      {confirmAction && (
        <ConfirmDialog
          action={confirmAction}
          onClose={() => setConfirmAction(null)}
        />
      )}
      {actionError && <AdminNotice>{actionError}</AdminNotice>}
      <GuidancePanel
        title="Panduan Inquiry"
        items={[
          "Prioritaskan inquiry baru yang sudah H+2 atau memiliki kebutuhan jelas di pesannya.",
          "Follow-up manual akan meminta konfirmasi karena sistem mengirim email AI ke kontak inquiry.",
          "Simpan status dan catatan setelah menghubungi klien agar pipeline kontak tetap rapi.",
        ]}
      />
      <div className="mb-5 grid gap-3 md:grid-cols-3">
        {FOLLOW_UP_LEVELS.map((item) => (
          <div key={item.level} className="rounded-[12px] border border-black/[0.05] bg-[#FFF8EA] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9B6C17]">
              {item.label} / Setelah {item.days} hari
            </p>
            <p className="mt-2 text-xs leading-relaxed text-black/56">{item.intent}</p>
          </div>
        ))}
      </div>
      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_180px_180px]">
        <AdminSearch value={search} onChange={setSearch} placeholder="Cari nama, email, pesan..." />
        <AdminSelect value={source} onChange={setSource} options={["Semua", ...sourceOptions]} />
        <AdminSelect value={status} onChange={setStatus} options={["Semua", ...statusOptions]} />
      </div>
      <div className="grid gap-3">
        {filteredInquiries.map((inquiry) => (
          <div key={inquiry.id} className="rounded-[12px] border border-black/[0.05] bg-[#FCFCFB] p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-base font-semibold">{inquiry.name}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-black/48">
                  <span className="flex items-center gap-1"><Mail size={13} /> {inquiry.email}</span>
                  {inquiry.whatsapp && <span className="flex items-center gap-1"><Phone size={13} /> {inquiry.whatsapp}</span>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>{inquiry.source}</Badge>
                <Badge tone="gold">{getDraft(inquiry).status}</Badge>
              </div>
            </div>
            <p className="mt-4 text-sm font-light leading-relaxed text-black/58">{inquiry.message}</p>
            <div className="mt-4 grid gap-2 rounded-[12px] border border-black/[0.05] bg-white p-3 md:grid-cols-[1fr_auto] md:items-center">
              <p className="text-xs leading-relaxed text-black/50">
                Auto follow-up: H+2, H+7, H+14 dari inquiry masuk. Tombol manual di kanan akan generate dan kirim email AI, lalu status inquiry ikut berubah.
              </p>
              <div className="flex flex-wrap gap-2">
                {FOLLOW_UP_LEVELS.map((item) => {
                  const due = daysSince(inquiry.createdAt) >= item.days;
                  return (
                    <button
                      key={item.level}
                      type="button"
                      onClick={() =>
                        setConfirmAction({
                          title: `Kirim follow up inquiry level ${item.level}?`,
                          description: "Email follow-up akan dibuat dengan bantuan AI dan dikirim ke kontak inquiry ini.",
                          confirmLabel: `Kirim Follow Up ${item.level}`,
                          tone: "gold",
                          details: [`Nama: ${inquiry.name}`, `Email: ${inquiry.email}`, `Status: ${inquiry.status}`],
                          onConfirm: () => sendFollowUp(inquiry, item.level),
                        })
                      }
                      disabled={followUpSending === `${inquiry.id}:${item.level}`}
                      className={`h-9 rounded-[9px] px-3 text-[10px] font-bold uppercase tracking-[0.12em] transition disabled:opacity-50 ${
                        due
                          ? "bg-[#0B2C6B] text-white"
                          : "border border-black/10 bg-[#F5F7FA] text-[#0B2C6B]"
                      }`}
                    >
                      {followUpSending === `${inquiry.id}:${item.level}` ? "Kirim..." : item.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-[180px_1fr_auto]">
              <AdminSelect
                value={getDraft(inquiry).status}
                onChange={(value) =>
                  setDrafts((current) => ({
                    ...current,
                    [inquiry.id]: { ...getDraft(inquiry), status: value },
                  }))
                }
                options={INQUIRY_STATUS_OPTIONS}
              />
              <input
                value={getDraft(inquiry).notes}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [inquiry.id]: { ...getDraft(inquiry), notes: event.target.value },
                  }))
                }
                placeholder="Catatan tindak lanjut inquiry..."
                className="h-11 rounded-[10px] border border-black/10 bg-white px-3 text-sm outline-none focus:border-[#D9A441]"
              />
              <div className="flex gap-2">
                <a href={`mailto:${inquiry.email}`} className="grid h-11 w-11 place-items-center rounded-[10px] border border-black/10 bg-white text-[#0B2C6B]">
                  <Mail size={15} />
                </a>
                {inquiry.whatsapp && (
                  <a href={`https://wa.me/${inquiry.whatsapp.replace(/\D/g, "")}`} target="_blank" className="grid h-11 w-11 place-items-center rounded-[10px] border border-black/10 bg-white text-[#0B2C6B]">
                    <Phone size={15} />
                  </a>
                )}
                <button
                  onClick={() => saveInquiry(inquiry)}
                  disabled={savingId === inquiry.id}
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
                      [inquiry.id]: { ...getDraft(inquiry), notes: value },
                    }))
                  }
                />
              </div>
            </div>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-black/32">{formatDate(inquiry.createdAt)}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
