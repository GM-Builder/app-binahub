"use client";

import { useCallback, useEffect, useState } from "react";
import { Pause, Play, RefreshCw } from "lucide-react";
import { ConfirmDialog } from "./shared";

type Action = (url: string, init?: RequestInit) => Promise<unknown>;
type Response = { ready: boolean; settings: { enabled: boolean; version: number; activated_at: string | null } | null; blockers: string[];worker?:{state:'recent'|'stale'|'unknown';lastRunAt:string|null} };
export function SalesFollowUpControl({ onAction }: { onAction: Action }) {
  const [data, setData] = useState<Response | null>(null);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await onAction("/api/admin/sales-settings") as Response); setError(""); }
    catch { setError("Status otomatisasi belum dapat dibaca. Perbarui sebelum mengubahnya."); }
    finally { setLoading(false); }
  }, [onAction]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  const enabled = Boolean(data?.settings?.enabled);
  return <div className="rounded-xl border border-slate-200 bg-white p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h3 className="text-sm font-semibold text-slate-900">Tindak lanjut otomatis · {loading ? "Memuat…" : data?.ready ? enabled ? "Diizinkan" : "Dijeda" : "Belum tersedia"}</h3><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">Untuk percakapan baru setelah aktivasi, pada jam kerja. Berhenti saat konsultasi dijadwalkan, peluang sudah ditangani, batas pesan tercapai, atau klien berhenti berlangganan. Kasus lama ditinjau dari daftar di bawah.</p>
      {enabled&&<p role="status" className="mt-2 text-xs leading-5 text-slate-600">{data?.worker?.state==='recent'?'Pemanggilan terjadwal terbaru tercatat. Periksa aktivitas untuk hasil pengiriman.':'Pemrosesan terjadwal belum terkonfirmasi. Hubungi penanggung jawab; mengizinkan pengiriman tidak menjalankan scheduler.'}{data?.worker?.lastRunAt?` Terakhir dipanggil: ${new Date(data.worker.lastRunAt).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})} WIB.`:''}</p>}</div>
      <div className="flex gap-2"><button type="button" aria-label="Perbarui status tindak lanjut otomatis" disabled={loading} onClick={() => void load()} className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 text-slate-500"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /></button><button type="button" disabled={loading || !data?.ready || !enabled && Boolean(data.blockers.length)} onClick={() => { setError(""); setConfirm(true); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0B2C6B] px-4 text-xs font-semibold text-white disabled:bg-slate-200 disabled:text-slate-500">{enabled ? <Pause size={15} /> : <Play size={15} />}{enabled ? "Jeda" : "Aktifkan"}</button></div>
    </div>
    {!loading && data && !data.ready && <p className="mt-3 text-xs text-amber-800">Pembaruan API dan database diperlukan sekali oleh tim teknis.</p>}
    {data?.blockers?.length ? <p role="status" className="mt-3 text-xs text-amber-800">{data.blockers.join(" ")}</p> : null}
    {error && !confirm && <p role="alert" className="mt-3 text-xs text-red-700">{error}</p>}
    {confirm && data?.settings && <ConfirmDialog errorText={error} onClose={() => setConfirm(false)} action={{ title: enabled ? "Jeda tindak lanjut otomatis?" : "Aktifkan tindak lanjut otomatis?", description: enabled ? "Pengiriman berikutnya dihentikan. Email yang sudah diproses penyedia tidak dapat ditarik kembali." : "Otomatisasi berlaku untuk Self Diagnostic dan inquiry baru setelah aktivasi ini, menggunakan template yang telah diperiksa. Tidak ada antrean lama yang dikirim sekaligus. Ini belum menggunakan AI agent.", confirmLabel: enabled ? "Jeda otomatisasi" : "Aktifkan otomatisasi", onConfirm: async () => {
      try { await onAction("/api/admin/sales-settings", { method: "PATCH", body: JSON.stringify({ enabled: !enabled, expectedVersion: data.settings!.version, confirmation: "SAVE_SALES_FOLLOW_UP" }) }); await load(); }
      catch (cause) { setError(cause instanceof Error ? cause.message : "Perubahan belum tersimpan."); throw cause; }
    } }} />}
  </div>;
}
