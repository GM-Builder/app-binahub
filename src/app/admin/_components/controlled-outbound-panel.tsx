"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, ExternalLink, RefreshCw, Search } from "lucide-react";
import { AdminSelect, Panel } from "./shared";

type AdminAction = (url: string, init?: RequestInit) => Promise<unknown>;
type Campaign = { id: string; campaign_code: string; name: string; status: string; channel: string };
type Prospect = { id: string; campaign_id: string | null; name: string; company: string | null };
type Link = { id: string; campaign_id: string; prospect_id: string | null; status: string; is_test: boolean; expires_at: string; issued_at: string };
type Outcome = { linkId: string; visitors: number; assessments: number; inquiries: number; linkedLeads: number };
type Response = {
  phase20Part2Ready: boolean; signingReady: boolean;
  links: Link[]; clicks: { link_id: string; journey_id: string }[];
  campaigns: Campaign[]; prospects: Prospect[]; outcomes?: Outcome[];
  apolloPro?: { message: string };
};

function date(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value));
}

export function ControlledOutboundPanel({ onAction }: { onAction: AdminAction }) {
  const [data, setData] = useState<Response | null>(null);
  const [campaignId, setCampaignId] = useState("");
  const [prospectId, setProspectId] = useState("");
  const [query, setQuery] = useState("");
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
  const visibleLinks = useMemo(() => (data?.links || []).filter((link) => {
    if (campaignId && link.campaign_id !== campaignId) return false;
    const campaign = data?.campaigns.find((item) => item.id === link.campaign_id);
    const prospect = data?.prospects.find((item) => item.id === link.prospect_id);
    return `${campaign?.name || ""} ${campaign?.campaign_code || ""} ${prospect?.name || ""} ${prospect?.company || ""}`.toLocaleLowerCase("id-ID").includes(query.toLocaleLowerCase("id-ID"));
  }), [data, campaignId, query]);
  const visibleLinkIds = new Set(visibleLinks.map((link) => link.id));
  const allSelectedLinks = (data?.links || []).filter((link) => !campaignId || link.campaign_id === campaignId);
  const allSelectedIds = new Set(allSelectedLinks.map((link) => link.id));
  const selectedVisitors = new Set((data?.clicks || []).filter((click) => allSelectedIds.has(click.link_id)).map((click) => click.journey_id)).size;
  const formTouches = (data?.outcomes || []).filter((item) => allSelectedIds.has(item.linkId)).reduce((sum, item) => sum + item.assessments + item.inquiries, 0);

  async function issueTestLink() {
    if (!campaignId || !prospectId) { setMessage("Pilih kampanye dan prospek valid terlebih dahulu."); return; }
    setIssuing(true); setMessage(""); setIssuedUrl("");
    try {
      const result = await onAction("/api/admin/acquisition/outbound-link", {
        method: "POST",
        body: JSON.stringify({ action: "issue_test_link", campaignId, prospectId, expiresInDays: 14, confirmation: "ISSUE_TEST_LINK_ONLY" }),
      }) as { link?: { url?: string }; message?: string };
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

  if (loading && !data) return <Panel title="Peta outbound"><p className="text-sm text-slate-500">Memuat kampanye dan tautan…</p></Panel>;
  if (!data?.phase20Part2Ready) return <Panel title="Peta outbound"><p className="text-sm text-amber-800">Fitur tautan kampanye belum tersedia di database.</p></Panel>;

  return <section className="space-y-5" aria-labelledby="controlled-outbound-heading">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#B17E29]">Outbound</p><h2 id="controlled-outbound-heading" className="mt-1 text-xl font-semibold text-[#0B2C6B]">Kampanye → prospek → respons</h2><p className="mt-1 text-sm text-slate-500">Pilih kampanye untuk melihat prospek, tautan, dan aktivitas sesudah tautan dibuka.</p></div>
      <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold disabled:opacity-50"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Perbarui</button>
    </div>
    <p className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950"><strong>Mode uji internal.</strong> Membuat tautan tidak mengirim email atau menghubungi prospek. Pengiriman nyata memerlukan persetujuan penanggung jawab.</p>
    {!data.signingReady && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">Tambahkan <code>ACQUISITION_LINK_SECRET</code> minimal 32 karakter pada environment API sebelum membuat tautan UAT.</p>}
    <div className="grid gap-3 sm:grid-cols-4">
      {[["Prospek valid", campaignId ? prospects.length : data.prospects.length], ["Tautan uji", allSelectedLinks.length], ["Pengunjung unik", selectedVisitors], ["Interaksi form", formTouches]].map(([label, count]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold text-[#0B2C6B]">{count}</p></div>)}
    </div>
    <Panel title="Pilih kampanye" action={`${data.campaigns.length} kampanye outbound`}>
      <div className="grid gap-3 lg:grid-cols-3">
        <button type="button" onClick={() => { setCampaignId(""); setProspectId(""); }} className={`rounded-xl border p-4 text-left ${!campaignId ? "border-[#0B2C6B] bg-blue-50" : "border-slate-200"}`}><p className="text-sm font-semibold text-[#0B2C6B]">Semua kampanye</p><p className="mt-2 text-xs text-slate-500">{data.links.length} tautan dibuat</p></button>
        {data.campaigns.map((campaign) => {
          const links = data.links.filter((link) => link.campaign_id === campaign.id);
          const ids = new Set(links.map((link) => link.id));
          const visitors = new Set(data.clicks.filter((click) => ids.has(click.link_id)).map((click) => click.journey_id)).size;
          const forms = (data.outcomes || []).filter((item) => ids.has(item.linkId)).reduce((sum, item) => sum + item.assessments + item.inquiries, 0);
          return <button type="button" key={campaign.id} onClick={() => { setCampaignId(campaign.id); setProspectId(""); }} className={`rounded-xl border p-4 text-left hover:border-[#D9A441] ${campaignId === campaign.id ? "border-[#0B2C6B] bg-blue-50" : "border-slate-200"}`}><div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold text-[#0B2C6B]">{campaign.name}</p><span className="rounded-full bg-white px-2 py-1 text-[10px] text-slate-500">{campaign.status}</span></div><p className="mt-1 text-[11px] text-slate-500">{campaign.campaign_code} · {campaign.channel}</p><p className="mt-3 text-xs text-slate-600">{data.prospects.filter((item) => item.campaign_id === campaign.id).length} prospek · {links.length} tautan · {visitors} membuka · {forms} interaksi form</p></button>;
        })}
      </div>
    </Panel>
    <Panel title="Buat tautan uji" action="Tidak mengirim email">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <label className="text-xs font-semibold text-slate-600">Kampanye<AdminSelect value={campaignId} onChange={(value) => { setCampaignId(value); setProspectId(""); }} options={[[ "", "Pilih kampanye" ], ...data.campaigns.map((item) => [item.id, `${item.name} · ${item.status}`] as [string, string])]} /></label>
        <label className="text-xs font-semibold text-slate-600">Prospek valid<AdminSelect value={prospectId} onChange={setProspectId} options={[[ "", campaignId ? "Pilih prospek" : "Pilih kampanye dahulu" ], ...prospects.map((item) => [item.id, `${item.name} · ${item.company || "tanpa perusahaan"}`] as [string, string])]} /></label>
        <button type="button" disabled={!data.signingReady || !prospectId || !["approved", "active"].includes(data.campaigns.find((item) => item.id === campaignId)?.status || "") || issuing} onClick={() => void issueTestLink()} className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-[#0B2C6B] px-4 text-xs font-bold text-white disabled:opacity-50">{issuing ? "Membuat…" : "Buat tautan UAT"}</button>
      </div>
      {issuedUrl && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3"><p className="text-xs font-semibold text-emerald-900">Tautan hanya untuk pengujian akun internal</p><code className="mt-2 block break-all text-[11px] text-emerald-900">{issuedUrl}</code><div className="mt-3 flex gap-2"><button type="button" onClick={() => void copyIssuedUrl()} className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold"><Copy size={13} /> Salin</button><a href={issuedUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold"><ExternalLink size={13} /> Buka</a></div></div>}
      {message && <p role="status" className="mt-3 text-xs leading-5 text-slate-700">{message}</p>}
    </Panel>
    <Panel title="Aktivitas tautan" action={`${visibleLinks.length} ditampilkan`}>
      <label className="relative mb-3 block"><Search size={14} className="absolute left-3 top-3 text-slate-400" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari kampanye, prospek, atau perusahaan" aria-label="Cari tautan outbound" className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-[#0B2C6B]" /></label>
      <div className="space-y-2">{visibleLinks.map((link) => {
        const campaign = data.campaigns.find((item) => item.id === link.campaign_id);
        const prospect = data.prospects.find((item) => item.id === link.prospect_id);
        const outcome = data.outcomes?.find((item) => item.linkId === link.id);
        return <div key={link.id} className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[1.4fr_1fr_auto]"><div><p className="text-sm font-semibold text-[#0B2C6B]">{prospect?.name || "Prospek tidak tersedia"}</p><p className="mt-1 text-xs text-slate-500">{prospect?.company || "Tanpa perusahaan"} · {campaign?.name || "Kampanye"}</p><p className="mt-1 text-[11px] text-slate-400">Dibuat {date(link.issued_at)} · berakhir {date(link.expires_at)}</p></div><div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600"><span>{outcome?.visitors || 0} membuka</span><span>{outcome?.assessments || 0} diagnosa</span><span>{outcome?.inquiries || 0} inquiry</span><span>{outcome?.linkedLeads || 0} tertaut lead</span></div><span className="h-fit rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{link.is_test ? "Uji internal" : "Aktif"} · {link.status}</span></div>;
      })}{!visibleLinkIds.size && <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">Belum ada tautan untuk filter ini.</p>}</div>
      <p className="mt-4 text-xs leading-5 text-slate-500">Sampel terbaru: maksimal 100 tautan, 300 klik unik, dan 300 prospek; bukan total historis. Interaksi form adalah aktivitas setelah tautan dibuka, bukan bukti bahwa kampanye menjadi satu-satunya penyebab konversi. {data.apolloPro?.message}</p>
    </Panel>
  </section>;
}
