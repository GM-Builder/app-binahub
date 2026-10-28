"use client";

import { useRef, useState } from "react";
import { AdminModal, AdminSelect } from "./shared";

export function QuickEmailCampaign({ sources, onAction, onCreated, onClose, onAdvanced }: {
  sources: Array<{ id: string; name: string; channel: string; status: string; active: boolean }>;
  onAction: (url: string, init?: RequestInit) => Promise<unknown>;
  onCreated: (id: string) => Promise<void>; onClose: () => void; onAdvanced: () => void;
}) {
  const readySources = sources.filter((source) => source.channel === "outbound" && source.status === "approved" && source.active);
  const [name, setName] = useState("");
  const [sourceId, setSourceId] = useState(readySources[0]?.id || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const code = useRef(`EMAIL-${crypto.randomUUID().toUpperCase()}`);
  const lock = useRef(false);
  const save = async () => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try {
      const result = await onAction("/api/admin/acquisition", { method: "POST", body: JSON.stringify({ action: "quick_email_campaign", payload: { sourceId, name: name.trim(), campaignCode: code.current, confirmation: "CREATE_EMAIL_CAMPAIGN" } }) }) as { campaign: { id: string } };
      await onCreated(result.campaign.id);
      onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Kampanye belum tersimpan. Perbarui sebelum mencoba lagi."); }
    finally { lock.current = false; setBusy(false); }
  };
  return <AdminModal title="Buat kampanye email" maxWidth="max-w-xl" onClose={() => { if (!busy) onClose(); }}>
    {readySources.length ? <div className="space-y-4"><p className="text-sm leading-6 text-slate-500">Cukup beri nama dan pilih asal daftar target. Kode kampanye, penanggung jawab, dan tracking disiapkan otomatis. Membuat kampanye belum mengirim email.</p><label className="block text-xs font-semibold text-slate-700">Nama kampanye<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Diagnosis tim · Oktober" maxLength={200} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal" /></label><label className="block text-xs font-semibold text-slate-700">Asal daftar target<AdminSelect ariaLabel="Asal daftar target" value={sourceId} onChange={setSourceId} options={readySources.map((s) => [s.id, s.name])} /></label><p className="text-xs leading-5 text-slate-500">Dengan membuat kampanye, Anda menyetujui penggunaannya dengan sumber data ini. Daftar target dan email diperiksa sebelum dikirim.</p>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<button type="button" disabled={busy || name.trim().length < 3 || !sourceId} onClick={() => void save()} className="min-h-11 w-full rounded-xl bg-[#0B2C6B] px-4 text-sm font-semibold text-white disabled:opacity-40">{busy ? "Menyiapkan…" : "Buat kampanye"}</button></div> : <><p className="text-sm leading-6 text-slate-500">Belum ada sumber daftar target yang siap digunakan. Asal data dan izin penggunaannya perlu dicatat sekali; sistem tidak dapat menganggap semua email boleh dihubungi.</p><button type="button" onClick={() => { onClose(); onAdvanced(); }} className="mt-4 min-h-11 rounded-xl bg-[#0B2C6B] px-4 text-xs font-semibold text-white">Siapkan sumber data</button></>}
  </AdminModal>;
}
