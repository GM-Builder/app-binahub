"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, ExternalLink, Link2, MousePointerClick, RefreshCw, ShieldCheck } from "lucide-react";
import { AdminSelect, Panel, StatCard } from "./shared";

type AdminAction = (url: string, init?: RequestInit) => Promise<unknown>;
type Campaign = { id: string; campaign_code: string; name: string; status: string; channel: string };
type Prospect = { id: string; campaign_id: string | null; name: string; company: string | null; validation_status: string; consent_status: string };
type Link = { id: string; campaign_id: string; prospect_id: string | null; status: string; is_test: boolean; expires_at: string; issued_at: string };
type Response = {
  success: boolean; phase20Part2Ready: boolean; signingReady: boolean; links: Link[]; clicks: { link_id: string; journey_id: string; clicked_at: string }[];
  campaigns: Campaign[]; prospects: Prospect[]; apolloPro?: { message: string };
};

export function ControlledOutboundPanel({ onAction }: { onAction: AdminAction }) {
  const [data, setData] = useState<Response | null>(null);
  const [campaignId, setCampaignId] = useState("");
  const [prospectId, setProspectId] = useState("");
  const [issuedUrl, setIssuedUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await onAction("/api/admin/acquisition/outbound-link") as Response); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Kontrol outbound belum dapat dimuat."); }
    finally { setLoading(false); }
  }, [onAction]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const prospects = useMemo(() => (data?.prospects || []).filter((item) => item.campaign_id === campaignId), [data, campaignId]);
  const clicksByLink = useMemo(() => (data?.clicks || []).reduce<Record<string, number>>((result, click) => ({ ...result, [click.link_id]: (result[click.link_id] || 0) + 1 }), {}), [data]);

  async function issueTestLink() {
    if (!campaignId || !prospectId) { setMessage("Pilih kampanye dan prospek valid terlebih dahulu."); return; }
    setIssuing(true); setMessage(""); setIssuedUrl("");
    try {
      const result = await onAction("/api/admin/acquisition/outbound-link", { method: "POST", body: JSON.stringify({ action: "issue_test_link", campaignId, prospectId, expiresInDays: 14, confirmation: "ISSUE_TEST_LINK_ONLY" }) }) as { link?: { url?: string }; message?: string };
      setIssuedUrl(result.link?.url || "");
      setMessage(result.message || "Tautan UAT telah dibuat.");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Tautan UAT gagal dibuat."); }
    finally { setIssuing(false); }
  }
  async function copyIssuedUrl() {
    if (!issuedUrl) return;
    try { await navigator.clipboard.writeText(issuedUrl); setMessage("Tautan UAT disalin. Kirim manual hanya ke akun internal yang Anda kuasai."); }
    catch { setMessage("Browser menolak menyalin otomatis. Salin tautan secara manual."); }
  }

  if (loading && !data) return <Panel title="Tautan kampanye"><p className="text-sm text-slate-500">Memuat tautan kampanye…</p></Panel>;
  if (!data?.phase20Part2Ready) return <Panel title="Tautan kampanye"><p className="text-sm text-amber-800">Fitur tautan kampanye belum tersedia di database.</p></Panel>;

  return <section className="space-y-4" aria-labelledby="controlled-outbound-heading">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="controlled-outbound-heading" className="text-lg font-semibold text-slate-900">Tautan kampanye</h2><p className="mt-1 text-xs text-slate-500">Buat dan pantau tautan uji untuk prospek yang sudah lolos pemeriksaan.</p></div><button type="button" onClick={() => void load()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Perbarui</button></div>
    <p className="rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-xs leading-5 text-amber-950"><strong>Mode uji internal.</strong> Membuat tautan di sini tidak mengirim email dan tidak menghubungi prospek. Pengiriman tetap dilakukan terpisah setelah persetujuan manusia.</p>
    {!data.signingReady && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">Tambahkan <code>ACQUISITION_LINK_SECRET</code> minimal 32 karakter pada environment API sebelum membuat tautan UAT.</p>}
    <div className="grid gap-4 md:grid-cols-3"><StatCard label="Tautan UAT" value={data.links.length} icon={Link2} /><StatCard label="Klik tercatat" value={data.clicks.length} icon={MousePointerClick} /><StatCard label="Apollo Pro" value="Terkunci" icon={ShieldCheck} /></div>
    <Panel title="Buat tautan uji" action="Tidak mengirim email">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"><label className="text-xs font-semibold text-slate-600">Kampanye<AdminSelect value={campaignId} onChange={(value) => { setCampaignId(value); setProspectId(""); }} options={[["", "Pilih kampanye"], ...(data.campaigns || []).map((item) => [item.id, `${item.name} · ${item.status}`] as [string, string])]} /></label><label className="text-xs font-semibold text-slate-600">Prospek valid<AdminSelect value={prospectId} onChange={setProspectId} options={[["", campaignId ? "Pilih prospek" : "Pilih kampanye dahulu"], ...prospects.map((item) => [item.id, `${item.name} · ${item.company || "tanpa perusahaan"}`] as [string, string])]} /></label><button type="button" disabled={!data.signingReady || issuing} onClick={() => void issueTestLink()} className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-[#0B2C6B] px-4 text-xs font-bold text-white disabled:opacity-50">{issuing ? "Membuat…" : "Buat tautan UAT"}</button></div>
      {issuedUrl && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3"><p className="text-xs font-semibold text-emerald-900">Tautan hanya untuk pengujian akun internal</p><code className="mt-2 block break-all text-[11px] text-emerald-900">{issuedUrl}</code><div className="mt-3 flex gap-2"><button type="button" onClick={() => void copyIssuedUrl()} className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold"><Copy size={13} /> Salin</button><a href={issuedUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold"><ExternalLink size={13} /> Buka</a></div></div>}
      {message && <p role="status" className="mt-3 text-xs leading-5 text-slate-700">{message}</p>}
    </Panel>
    <Panel title="Riwayat tautan" action={`${data.links.length} tautan`}><div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-xs"><thead><tr className="border-b text-[10px] uppercase tracking-wide text-slate-400"><th className="pb-3">Kampanye</th><th className="pb-3">Mode</th><th className="pb-3">Klik</th><th className="pb-3">Berlaku sampai</th></tr></thead><tbody>{data.links.slice(0, 12).map((link) => { const campaign = data.campaigns.find((item) => item.id === link.campaign_id); return <tr key={link.id} className="border-b border-slate-100"><td className="py-3 font-semibold text-[#0B2C6B]">{campaign?.name || "Kampanye"}</td><td>Uji internal · {link.status}</td><td>{clicksByLink[link.id] || 0}</td><td>{new Date(link.expires_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</td></tr>; })}</tbody></table>{!data.links.length && <p className="py-5 text-sm text-slate-500">Belum ada tautan uji.</p>}</div><p className="mt-4 text-xs text-slate-500">{data.apolloPro?.message}</p></Panel>
  </section>;
}
