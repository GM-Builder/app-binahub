"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Link2, MousePointerClick, RefreshCw, Route } from "lucide-react";
import { Panel, StatCard } from "./shared";

type AdminAction = (url: string, init?: RequestInit) => Promise<unknown>;
type Journey = {
  id: string;
  first_attribution: Record<string, unknown>;
  last_attribution: Record<string, unknown>;
  first_channel: string;
  last_channel: string;
  first_landing_path: string | null;
  last_path: string | null;
  first_seen_at: string;
  last_seen_at: string;
};
type AttributionResponse = {
  success: boolean;
  phase20Ready: boolean;
  summary: null | {
    journeyCount: number;
    linkedLeadCount: number;
    catalogInterestCount: number;
    inquiryConversionCount: number;
    assessmentConversionCount: number;
    channels: Record<string, number>;
  };
  journeys: Journey[];
};

const CHANNEL_LABEL: Record<string, string> = {
  direct: "Langsung", organic: "Pencarian organik", paid_search: "Iklan pencarian",
  paid_social: "Iklan sosial", social: "Sosial organik", referral: "Referral", email: "Email", other: "Lainnya",
};

function sourceLabel(attribution: Record<string, unknown>) {
  const source = typeof attribution.utmSource === "string" ? attribution.utmSource : "";
  const campaign = typeof attribution.utmCampaign === "string" ? attribution.utmCampaign : "";
  return [source, campaign].filter(Boolean).join(" · ") || "Tanpa UTM";
}

export function InboundAttributionPanel({ onAction }: { onAction: AdminAction }) {
  const [data, setData] = useState<AttributionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setData(await onAction("/api/admin/acquisition/attribution") as AttributionResponse); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Attribution belum dapat dimuat."); }
    finally { setLoading(false); }
  }, [onAction]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  const channelRows = useMemo(() => Object.entries(data?.summary?.channels || {}).sort(([, left], [, right]) => right - left), [data]);

  if (loading && !data) return <Panel title="Funnel & Attribution"><p className="text-sm text-slate-500">Memuat jejak perjalanan inbound…</p></Panel>;
  if (!data?.phase20Ready) return <Panel title="Funnel & Attribution"><p className="text-sm text-amber-800">Phase 20.1 belum tersedia di database. Terapkan migrasi 0049 sebelum data funnel dapat dibaca.</p></Panel>;

  return (
    <section className="space-y-4" aria-labelledby="inbound-attribution-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#D9A441]">Phase 20.1</p><h2 id="inbound-attribution-heading" className="mt-1 text-lg font-bold text-[#0B2C6B]">Funnel & Attribution Inbound</h2></div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 disabled:opacity-50"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Perbarui</button>
      </div>
      <p className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs leading-5 text-sky-900">Halaman ini hanya membaca jejak anonim, sumber awal/terakhir, dan minat katalog. Ia tidak mengirim email, mengubah lead, atau mengaktifkan outbound.</p>
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Journey tercatat" value={data.summary?.journeyCount || 0} icon={Route} />
        <StatCard label="Lead terhubung" value={data.summary?.linkedLeadCount || 0} icon={Link2} />
        <StatCard label="Minat katalog" value={data.summary?.catalogInterestCount || 0} icon={MousePointerClick} />
        <StatCard label="Konversi form" value={(data.summary?.inquiryConversionCount || 0) + (data.summary?.assessmentConversionCount || 0)} icon={Activity} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Panel title="Sumber awal" action={`${channelRows.length} kanal`}>
          <div className="space-y-2">{channelRows.length ? channelRows.map(([channel, count]) => <div key={channel} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"><span>{CHANNEL_LABEL[channel] || channel}</span><strong className="text-[#0B2C6B]">{count}</strong></div>) : <p className="text-sm text-slate-500">Belum ada journey inbound.</p>}</div>
        </Panel>
        <Panel title="Perjalanan terbaru" action={`${data.journeys.length} tercatat`}>
          <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-xs"><caption className="sr-only">Journey inbound terbaru</caption><thead><tr className="border-b text-[10px] uppercase tracking-wide text-slate-400"><th className="pb-3">Sumber pertama</th><th className="pb-3">Jalur</th><th className="pb-3">Aktivitas terakhir</th><th className="pb-3">Waktu</th></tr></thead><tbody>{data.journeys.slice(0, 12).map((journey) => <tr key={journey.id} className="border-b border-slate-100"><td className="py-3 font-semibold text-[#0B2C6B]">{CHANNEL_LABEL[journey.first_channel] || journey.first_channel}<span className="mt-1 block font-normal text-slate-500">{sourceLabel(journey.first_attribution)}</span></td><td>{journey.first_landing_path || "-"}<span className="block text-slate-500">→ {journey.last_path || "-"}</span></td><td>{CHANNEL_LABEL[journey.last_channel] || journey.last_channel}</td><td>{new Date(journey.last_seen_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</td></tr>)}</tbody></table>{!data.journeys.length && <p className="py-5 text-sm text-slate-500">Kunjungan baru akan muncul setelah tracking website aktif.</p>}</div>
        </Panel>
      </div>
    </section>
  );
}
