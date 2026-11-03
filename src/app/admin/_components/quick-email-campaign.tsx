"use client";

import { useEffect, useRef, useState } from "react";
import { AdminModal, AdminSelect } from "./shared";
import { CampaignSourceSetup, type CampaignSource } from './campaign-source-setup';

export function QuickEmailCampaign({ sources, onAction, onCreated, onClose, onAdvanced }: {
  sources: Array<{ id: string; name: string; channel: string; status: string; active: boolean }>;
  onAction: (url: string, init?: RequestInit) => Promise<unknown>;
  onCreated: (id: string) => Promise<void>; onClose: () => void; onAdvanced: () => void;
}) {
  const [localSource, setLocalSource] = useState<CampaignSource | null>(null);
  const readySources = [...sources, ...(localSource && !sources.some(source => source.id === localSource.id) ? [localSource] : [])].filter((source) => source.channel === "outbound" && source.status === "approved" && source.active);
  const [name, setName] = useState("");
  const [sourceId, setSourceId] = useState(readySources[0]?.id || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sourceSetup, setSourceSetup] = useState(false);
  const [saved, setSaved] = useState(false);
  const sourceDirty = useRef(false);
  const created = useRef<string | null>(null);
  const code = useRef(`EMAIL-${crypto.randomUUID().toUpperCase()}`);
  const lock = useRef(false);
  useEffect(() => {
    if (!name.trim() && !sourceSetup && !busy) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [name, sourceSetup, busy]);
  const save = async () => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try {
      if (!created.current) {
        const result = await onAction("/api/admin/acquisition", { method: "POST", body: JSON.stringify({ action: "quick_email_campaign", payload: { sourceId, name: name.trim(), campaignCode: code.current, confirmation: "CREATE_EMAIL_CAMPAIGN" } }) }) as { campaign?: { id: string } };
        if (!result.campaign?.id) throw new Error('Respons belum lengkap. Coba lagi untuk memeriksa kampanye yang sama.');
        created.current = result.campaign.id;
        setSaved(true);
      }
      await onCreated(created.current);
      onClose();
    } catch (cause) { setError(created.current ? 'Kampanye sudah tersimpan, tetapi belum dapat dibuka. Coba buka kembali; jangan membuat kampanye baru.' : cause instanceof Error ? cause.message : "Kampanye belum tersimpan. Perbarui sebelum mencoba lagi."); }
    finally { lock.current = false; setBusy(false); }
  };
  const close = () => { if (!busy && (!(name.trim() || sourceDirty.current) || window.confirm('Ada isian yang belum selesai. Tetap tutup pembuatan kampanye?'))) onClose(); };
  return <AdminModal title={sourceSetup ? 'Siapkan asal daftar · sekali saja' : 'Buat kampanye email'} maxWidth="max-w-xl" onClose={close}>
    {sourceSetup ? <CampaignSourceSetup onAction={onAction} onBusy={setBusy} onDirty={() => { sourceDirty.current = true; }} onReady={source => { setLocalSource(source); setSourceId(source.id); setSourceSetup(false); sourceDirty.current = false; }} /> : readySources.length ? <div className="space-y-4"><p className="text-sm leading-6 text-slate-600">Beri nama dan pilih asal daftar penerima. Kode kampanye dan pelacakan disiapkan otomatis; belum ada email yang dikirim.</p><label className="block text-sm font-semibold text-slate-700">Nama kampanye<input disabled={busy || saved} value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Pengembangan tim · November" maxLength={200} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-base font-normal sm:text-sm" /></label><label className="block text-sm font-semibold text-slate-700">Asal daftar target<AdminSelect disabled={busy || saved} ariaLabel="Asal daftar target" value={sourceId} onChange={setSourceId} options={readySources.map((s) => [s.id, s.name])} /></label><button type="button" disabled={busy || saved} onClick={() => setSourceSetup(true)} className="min-h-11 text-xs font-semibold text-[#0B2C6B]">Gunakan asal daftar baru</button><p className="text-xs leading-5 text-slate-600">Dengan membuat kampanye, Anda menyetujui penggunaannya dengan sumber ini. Penerima dan email tetap ditinjau sebelum dikirim.</p>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<button type="button" disabled={busy || name.trim().length < 3 || !sourceId} onClick={() => void save()} className="min-h-11 w-full rounded-xl bg-[#0B2C6B] px-4 text-sm font-semibold text-white disabled:opacity-40">{busy ? "Menyiapkan…" : saved ? 'Coba buka kampanye' : "Buat kampanye"}</button></div> : <><p className="text-sm leading-6 text-slate-600">Belum ada asal daftar yang disetujui. Siapkan sekali di sini, lalu gunakan kembali untuk kampanye berikutnya. Izin penerima tidak diasumsikan otomatis.</p><button type="button" onClick={() => setSourceSetup(true)} className="mt-4 min-h-11 rounded-xl bg-[#0B2C6B] px-4 text-sm font-semibold text-white">Siapkan sumber data</button><details className="mt-5 border-t border-slate-200 pt-4"><summary className="cursor-pointer text-xs font-semibold text-slate-600">Pengaturan sumber lainnya</summary><button type="button" onClick={() => { onClose(); onAdvanced(); }} className="mt-3 min-h-11 text-xs font-semibold text-[#0B2C6B]">Buka pengaturan lengkap</button></details></>}
  </AdminModal>;
}
