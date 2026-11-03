"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Pause, RefreshCw } from "lucide-react";
import { AdminModal } from "./shared";

export type OutboundSettings = {
  enabled: boolean; recipientMode: "restricted" | "approved_list"; allowedEmails: string[];
  businessHoursOnly: boolean; version: number;
};

export function OutboundSettingsDialog({ settings, myEmail, campaignName, setupBlockers, onClose, onSave }: {
  settings: OutboundSettings; myEmail: string; campaignName: string; setupBlockers: string[];
  onClose: () => void; onSave: (settings: OutboundSettings) => Promise<void>;
}) {
  const [form, setForm] = useState(settings);
  const [emails, setEmails] = useState(settings.allowedEmails.length ? settings.allowedEmails.join("\n") : myEmail);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const saveLock = useRef(false);
  const save = async () => {
    if (saveLock.current) return;
    const allowedEmails = form.recipientMode === "restricted" ? [...new Set(emails.split(/[\s,;]+/).map((email) => email.trim().toLowerCase()).filter(Boolean))] : [];
    if (allowedEmails.length > 50 || allowedEmails.some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) || (form.enabled && form.recipientMode === "restricted" && !allowedEmails.length)) {
      setError("Isi 1–50 alamat email yang valid untuk uji terbatas."); return;
    }
    saveLock.current = true; setBusy(true); setError("");
    try { await onSave({ ...form, allowedEmails }); onClose(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Pengaturan belum tersimpan."); }
    finally { saveLock.current = false; setBusy(false); }
  };
  return <AdminModal title="Pengaturan pengiriman" maxWidth="max-w-xl" onClose={() => { if (!busy) onClose(); }}>
    <p className="text-sm leading-6 text-slate-500">Untuk <strong className="text-slate-800">{campaignName}</strong>. Berlaku hanya untuk email pertama kampanye ini, tidak mengaktifkan follow-up.</p>
    <div className="mt-5 grid grid-cols-2 gap-2" role="group" aria-label="Status pengiriman">
      {[[false, "Dijeda", Pause], [true, "Diaktifkan", CheckCircle2]].map(([enabled, label, Icon]) => {
        const StatusIcon = Icon as typeof Pause;
        return <button key={String(label)} type="button" aria-pressed={form.enabled === enabled} disabled={busy} onClick={() => { setForm({ ...form, enabled: enabled as boolean }); setAcknowledged(false); }} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border text-sm font-semibold ${form.enabled === enabled ? "border-[#0B2C6B] bg-blue-50 text-[#0B2C6B]" : "border-slate-200 text-slate-500"}`}><StatusIcon size={16} />{String(label)}</button>;
      })}
    </div>
    <fieldset className="mt-6 space-y-3"><legend className="mb-3 text-sm font-semibold text-slate-900">Siapa yang boleh menerima?</legend>
      <label className={`flex gap-3 rounded-xl border p-4 ${form.recipientMode === "restricted" ? "border-blue-200 bg-blue-50/50" : "border-slate-200"}`}><input type="radio" name="outbound-mode" value="restricted" checked={form.recipientMode === "restricted"} disabled={busy} onChange={() => { setForm({ ...form, recipientMode: "restricted" }); setAcknowledged(false); }} className="mt-1 accent-[#0B2C6B]" /><span><strong className="block text-sm text-slate-800">Uji terbatas</strong><span className="mt-1 block text-xs leading-5 text-slate-500">Hanya alamat yang Anda isi di bawah. Cocok untuk demo dengan akun internal.</span></span></label>
      {form.recipientMode === "restricted" && <label className="block pl-1 text-xs font-semibold text-slate-600">Alamat uji<textarea value={emails} disabled={busy} onChange={(event) => { setEmails(event.target.value); setAcknowledged(false); }} rows={3} placeholder="Satu email per baris" className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal" /><span className="mt-1 block font-normal leading-5 text-slate-500">Email uji selalu dikirim hanya ke akun admin Anda. Alamat target di sini tetap harus lolos validasi dan persetujuan daftar.</span></label>}
      <label className={`flex gap-3 rounded-xl border p-4 ${form.recipientMode === "approved_list" ? "border-blue-200 bg-blue-50/50" : "border-slate-200"}`}><input type="radio" name="outbound-mode" value="approved_list" checked={form.recipientMode === "approved_list"} disabled={busy} onChange={() => { setForm({ ...form, recipientMode: "approved_list" }); setAcknowledged(false); }} className="mt-1 accent-[#0B2C6B]" /><span><strong className="block text-sm text-slate-800">Target disetujui</strong><span className="mt-1 block text-xs leading-5 text-slate-500">Tidak perlu menyalin alamat lagi. Hanya target valid dari daftar yang disetujui, dipilih, dan dikonfirmasi yang dikirim.</span></span></label>
    </fieldset>
    <label className="mt-5 flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-600"><input type="checkbox" checked={form.businessHoursOnly} disabled={busy} onChange={(event) => setForm({ ...form, businessHoursOnly: event.target.checked })} className="mt-1 accent-[#0B2C6B]" /><span><strong className="block text-slate-800">Kirim target hanya pada jam kerja</strong>Senin–Jumat, 08.00–17.00 WIB. Jika tidak dipilih, target diproses setelah konfirmasi. Email uji admin selalu diproses segera.</span></label>
    {setupBlockers.length > 0 && <div className="mt-4 rounded-xl bg-amber-50 p-4 text-xs leading-5 text-amber-900"><p className="font-semibold">Masih perlu diselesaikan</p><ul className="mt-2 list-disc space-y-1 pl-4">{setupBlockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul><p className="mt-2">Pengaturan dapat disimpan, tetapi pengiriman tetap ditahan sampai hal di atas siap.</p></div>}
    <p className="mt-4 text-xs leading-5 text-slate-500">Mengubah pengaturan membatalkan antrean yang belum diproses; antrean lama tidak dilanjutkan otomatis. Email yang sudah diterima penyedia tidak dapat ditarik kembali.</p>
    {form.enabled && <label className="mt-4 flex items-start gap-3 text-xs leading-5 text-slate-700"><input type="checkbox" checked={acknowledged} disabled={busy} onChange={(event) => setAcknowledged(event.target.checked)} className="mt-1 accent-[#0B2C6B]" /><span>Saya menyetujui batas penerima ini. Mengaktifkan pengiriman tidak mengirim email; saya tetap harus meninjau dan mengonfirmasi penerimanya.</span></label>}
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4"><button type="button" disabled={busy} onClick={onClose} className="min-h-11 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600">Batal</button><button type="button" disabled={busy || (form.enabled && !acknowledged)} onClick={() => void save()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0B2C6B] px-4 text-xs font-semibold text-white disabled:opacity-40">{busy && <RefreshCw size={15} className="animate-spin" />}{busy ? "Menyimpan…" : "Simpan pengaturan"}</button></div>
  </AdminModal>;
}
