"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Link2, RefreshCw, Search } from "lucide-react";
import { Panel } from "./shared";

type AdminAction = (url: string, init?: RequestInit) => Promise<unknown>;
type Journey = { id: string; first_attribution: Record<string, unknown>; last_attribution: Record<string, unknown>; first_channel: string; last_channel: string; first_landing_path: string | null; last_path: string | null; first_seen_at: string; last_seen_at: string };
type JourneyEvent = { id: string; journey_id: string; event_type: string; route_path: string | null; module_codes: string[] | null; created_at: string };
type LeadLink = { lead_id: string; journey_id: string };
type Interest = { journey_id: string; module_code: string };
type Response = { phase20Ready: boolean; journeys: Journey[]; events: JourneyEvent[]; links: LeadLink[]; interests: Interest[] };

const channels: Record<string, string> = { direct: "Langsung", organic: "Pencarian organik", paid_search: "Iklan pencarian", paid_social: "Iklan sosial", social: "Sosial organik", referral: "Rujukan", email: "Email", other: "Lainnya" };
const eventNames: Record<string, string> = { landing_view: "Membuka website", catalog_view: "Melihat katalog", catalog_module_selected: "Memilih modul", inquiry_started: "Mulai inquiry", inquiry_submitted: "Inquiry terkirim", assessment_started: "Mulai diagnosa", assessment_submitted: "Diagnosa terkirim", lead_linked: "Terhubung ke lead" };
function field(value: Record<string, unknown> | null, name: string) { const item = value?.[name]; return typeof item === "string" ? item.trim() : ""; }
function source(attribution: Record<string, unknown>, channel: string) { const direct = field(attribution, "utmSource"); if (direct) return direct; const referrer = field(attribution, "referrer"); try { if (referrer) return new URL(referrer).hostname.replace(/^www\./, ""); } catch { /* malformed referrer is not a source */ } return channels[channel] || "Tidak diketahui"; }
function date(value: string) { return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value)); }

export function InboundAttributionPanel({ onAction }: { onAction: AdminAction }) {
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null);

  const load = useCallback(async () => { setLoading(true); setError(""); try { setData(await onAction("/api/admin/acquisition/attribution") as Response); } catch (cause) { setError(cause instanceof Error ? cause.message : "Attribution belum dapat dimuat."); } finally { setLoading(false); } }, [onAction]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const rows = useMemo(() => (data?.journeys || []).map((journey) => {
    const events = (data?.events || []).filter((item) => item.journey_id === journey.id);
    const links = (data?.links || []).filter((item) => item.journey_id === journey.id);
    const interests = (data?.interests || []).filter((item) => item.journey_id === journey.id);
    const origin = source(journey.first_attribution, journey.first_channel);
    const campaign = field(journey.first_attribution, "utmCampaign") || "Tanpa kampanye";
    const key = `${journey.first_channel}|${origin}|${campaign}`;
    return { journey, events, links, interests, origin, campaign, key, converted: events.some((item) => ["inquiry_submitted", "assessment_submitted"].includes(item.event_type)) };
  }), [data]);
  const grouped = useMemo(() => {
    const values = new Map<string, { key: string; origin: string; campaign: string; channel: string; visits: number; forms: number; leads: number }>();
    for (const row of rows) { const entry = values.get(row.key) || { key: row.key, origin: row.origin, campaign: row.campaign, channel: row.journey.first_channel, visits: 0, forms: 0, leads: 0 }; entry.visits++; entry.forms += Number(row.converted); entry.leads += Number(row.links.length > 0); values.set(row.key, entry); }
    return [...values.values()].sort((a, b) => b.visits - a.visits);
  }, [rows]);
  const filtered = useMemo(() => rows.filter((row) => (!selectedGroup || row.key === selectedGroup) && `${row.origin} ${row.campaign} ${row.journey.first_landing_path || ""} ${row.journey.last_path || ""}`.toLocaleLowerCase("id-ID").includes(query.toLocaleLowerCase("id-ID"))), [rows, selectedGroup, query]);
  const selected = filtered.find((row) => row.journey.id === selectedJourneyId) || filtered[0];

  if (loading && !data) return <Panel title="Peta inbound"><p className="text-sm text-slate-500">Memuat sumber dan perjalanan…</p></Panel>;
  if (!data?.phase20Ready) return <Panel title="Peta inbound"><p className="text-sm text-amber-800">Pelacakan perjalanan belum tersedia di database.</p></Panel>;

  return <section className="space-y-5" aria-labelledby="inbound-heading">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#B17E29]">Inbound</p><h2 id="inbound-heading" className="mt-1 text-xl font-semibold text-[#0B2C6B]">Dari mana calon klien datang?</h2><p className="mt-1 text-sm text-slate-500">Pilih sumber dan kampanye untuk melihat jalur hingga form dan lead.</p></div><button type="button" onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 disabled:opacity-50"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Perbarui</button></div>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="grid gap-3 sm:grid-cols-3">{[["Perjalanan", rows.length], ["Form terkirim", rows.filter((row) => row.converted).length], ["Tertaut ke lead", rows.filter((row) => row.links.length > 0).length]].map(([label, number]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold text-[#0B2C6B]">{number}</p></div>)}</div>
    <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]"><Panel title="Sumber & kampanye" action={`${grouped.length} kombinasi`}><div className="max-h-[520px] space-y-2 overflow-y-auto pr-1"><button type="button" onClick={() => setSelectedGroup("")} className={`w-full rounded-xl border p-3 text-left text-xs font-semibold ${!selectedGroup ? "border-[#0B2C6B] bg-blue-50 text-[#0B2C6B]" : "border-slate-200 text-slate-600"}`}>Semua sumber · {rows.length} perjalanan</button>{grouped.map((group) => <button type="button" key={group.key} onClick={() => setSelectedGroup(group.key)} className={`w-full rounded-xl border p-3 text-left hover:border-[#D9A441] ${selectedGroup === group.key ? "border-[#0B2C6B] bg-blue-50" : "border-slate-200"}`}><div className="flex justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#0B2C6B]">{group.origin}</p><p className="mt-1 truncate text-xs text-slate-500">{group.campaign} · {channels[group.channel] || group.channel}</p></div><strong className="text-lg text-[#0B2C6B]">{group.visits}</strong></div><p className="mt-2 text-[11px] text-slate-500">{group.forms} form · {group.leads} tertaut lead</p></button>)}{!grouped.length && <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">Belum ada perjalanan inbound.</p>}</div></Panel>
    <Panel title="Perjalanan" action={`${filtered.length} ditampilkan`}><label className="relative mb-3 block"><Search size={14} className="absolute left-3 top-3 text-slate-400" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari sumber, kampanye, atau halaman" aria-label="Cari perjalanan" className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-[#0B2C6B]" /></label><div className="max-h-[470px] space-y-2 overflow-y-auto pr-1">{filtered.map((row) => <button type="button" key={row.journey.id} onClick={() => setSelectedJourneyId(row.journey.id)} className={`w-full rounded-xl border p-3 text-left hover:border-[#D9A441] ${selected?.journey.id === row.journey.id ? "border-[#0B2C6B] bg-[#F5F8FC]" : "border-slate-200"}`}><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#0B2C6B]">{row.origin} <span className="font-normal text-slate-400">/ {row.campaign}</span></p><p className="mt-1 truncate text-xs text-slate-500">{row.journey.first_landing_path || "/"} <ArrowRight size={11} className="inline" /> {row.journey.last_path || "/"}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${row.converted ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{row.converted ? "Form terkirim" : "Menjelajah"}</span></div><p className="mt-2 text-[11px] text-slate-400">{date(row.journey.first_seen_at)}</p></button>)}{!filtered.length && <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">Tidak ada perjalanan untuk filter ini.</p>}</div></Panel></div>
    {selected && <Panel title="Detail perjalanan" action={`ID ${selected.journey.id.slice(0, 8)}`}><div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]"><div className="space-y-3 text-xs"><div><p className="font-semibold text-slate-500">Sumber pertama</p><p className="mt-1 text-sm font-semibold text-[#0B2C6B]">{selected.origin} · {channels[selected.journey.first_channel] || selected.journey.first_channel}</p><p className="text-slate-500">{selected.campaign}</p></div><div><p className="font-semibold text-slate-500">Sumber terakhir</p><p className="mt-1 text-slate-700">{source(selected.journey.last_attribution, selected.journey.last_channel)} · {field(selected.journey.last_attribution, "utmCampaign") || "Tanpa kampanye"}</p></div><div><p className="font-semibold text-slate-500">Aktivitas terakhir</p><p className="mt-1 text-slate-700">{selected.journey.last_path || "/"} · {date(selected.journey.last_seen_at)}</p></div><div><p className="font-semibold text-slate-500">Modul diminati</p><p className="mt-1 text-slate-700">{[...new Set(selected.interests.map((item) => item.module_code))].join(", ") || "Belum ada"}</p></div><div className="rounded-xl bg-slate-50 p-3 text-slate-600"><Link2 size={14} className="mr-1 inline" /> {selected.links.length ? "Terhubung ke lead; lanjutkan di Pipeline." : "Belum terhubung ke lead. Kunjungan saja tidak membuat lead."}</div></div><div><p className="mb-3 text-xs font-semibold text-[#0B2C6B]">Urutan aktivitas</p><ol className="space-y-2">{[...selected.events].reverse().map((event) => <li key={event.id} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 text-xs"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#D9A441]" /><div><p className="font-semibold text-slate-800">{eventNames[event.event_type] || event.event_type.replaceAll("_", " ")}</p><p className="mt-1 text-slate-500">{date(event.created_at)} · {event.route_path || "/"}{event.module_codes?.length ? ` · ${event.module_codes.join(", ")}` : ""}</p></div></li>)}{!selected.events.length && <li className="text-xs text-slate-500">Belum ada event pada sampel terbaru.</li>}</ol></div></div></Panel>}
    <p className="text-xs leading-5 text-slate-500">Menampilkan maksimal 100 perjalanan, 500 event, dan 300 tautan lead terbaru—bukan total sepanjang waktu. First touch tidak ditimpa oleh kunjungan berikutnya; identitas tetap anonim sebelum form dikirim.</p>
  </section>;
}
