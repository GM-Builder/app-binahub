"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Loader2, RefreshCw, Save } from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";

type ProviderId = "lapakvip" | "codecraft" | "openrouter";
type Policy = { primaryProvider: ProviderId; enabledProviders: ProviderId[] };
type Snapshot = {
  policy: Policy; version: number; updatedAt: string | null; setupRequired: boolean;
  providers: { id: ProviderId; configured: boolean; model: string | null }[];
};
const names: Record<ProviderId, string> = { lapakvip: "LapakVIP", codecraft: "Codecraft", openrouter: "OpenRouter" };
const focus = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-800";

export function AIProviderSettings() {
  const [saved, setSaved] = useState<Snapshot | null>(null);
  const [draft, setDraft] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [conflict, setConflict] = useState(false);
  const pending = useRef(false);
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await apiFetch("/api/admin/ai-settings", { cache: "no-store", signal });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || "Pengaturan AI belum dapat dimuat.");
      if (signal?.aborted) return;
      setSaved(body); setDraft(body.policy); setConflict(false);
    } catch (failure) {
      if (!signal?.aborted) setError(failure instanceof Error ? failure.message : "Koneksi terputus. Silakan coba lagi.");
    } finally { if (!signal?.aborted) setLoading(false); }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => { if (!controller.signal.aborted) return load(controller.signal); });
    return () => controller.abort();
  }, [load]);

  const save = async () => {
    if (!draft || !saved || pending.current) return;
    pending.current = true; setSaving(true); setError(""); setNotice("");
    try {
      const response = await apiFetch("/api/admin/ai-settings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policy: draft, version: saved.version }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) {
        setConflict(response.status === 409);
        throw new Error(body.error || "Perubahan belum tersimpan. Silakan coba lagi.");
      }
      setSaved(body); setDraft(body.policy);
      setNotice("Pengaturan tersimpan. Permintaan AI berikutnya memakai pilihan ini.");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Koneksi terputus. Pilihan Anda tetap ada; coba simpan lagi.");
    } finally { pending.current = false; setSaving(false); }
  };
  const dirty = !!draft && !!saved && (draft.primaryProvider !== saved.policy.primaryProvider
    || [...draft.enabledProviders].sort().join() !== [...saved.policy.enabledProviders].sort().join());
  const valid = !!draft && draft.enabledProviders.includes(draft.primaryProvider);

  return <section aria-labelledby="ai-provider-heading" aria-busy={loading || saving} className="mb-8 rounded-xl border border-slate-200 bg-white">
    <div className="border-b border-slate-200 p-5 sm:p-6">
      <h2 id="ai-provider-heading" className="text-lg font-semibold text-slate-950">Provider AI</h2>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Pilih layanan utama untuk BinaHub. Cadangan yang aktif dipakai jika layanan utama gagal.</p>
      {saved && <p className="mt-3 text-sm text-slate-700">Utama saat ini: <strong>{saved.policy.enabledProviders.includes(saved.policy.primaryProvider) ? names[saved.policy.primaryProvider] : "Belum tersedia"}</strong></p>}
    </div>
    {loading ? <p role="status" className="flex items-center gap-2 p-6 text-sm text-slate-600"><Loader2 aria-hidden="true" className="h-4 w-4 motion-safe:animate-spin" />Memuat pilihan provider…</p>
      : draft && saved && <>
        {saved.setupRequired && <p className="mx-5 mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Pengaturan belum bisa disimpan. Tim teknis perlu menjalankan SQL 68 satu kali. Layanan AI tetap memakai pengaturan sebelumnya.</p>}
        <fieldset disabled={saving || saved.setupRequired} aria-describedby="ai-routing-help" className="min-w-0 p-5 sm:p-6">
          <legend className="sr-only">Provider utama dan cadangan</legend>
          <div className="grid gap-0 divide-y divide-slate-200 md:grid-cols-3 md:divide-x md:divide-y-0">
            {saved.providers.map((provider) => {
              const primary = draft.primaryProvider === provider.id;
              const enabled = draft.enabledProviders.includes(provider.id);
              return <div key={provider.id} className="min-w-0 py-5 first:pt-0 last:pb-0 md:px-5 md:py-0 md:first:pl-0 md:last:pr-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-slate-950">{names[provider.id]}</h3>
                  <span className={`text-xs font-medium ${provider.configured ? "text-emerald-800" : "text-amber-800"}`}>{provider.configured ? "API key tersedia" : "Belum dikonfigurasi"}</span>
                </div>
                <p className="mt-2 break-words text-sm text-slate-600">{provider.model || "Model belum tersedia"}</p>
                <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium text-slate-800 has-disabled:cursor-not-allowed has-disabled:text-slate-500">
                  <input type="radio" name="ai-primary-provider" value={provider.id} checked={primary && enabled} disabled={!provider.configured}
                    onChange={() => { setDraft({ ...draft, primaryProvider: provider.id, enabledProviders: Array.from(new Set([...draft.enabledProviders, provider.id])) }); setNotice(""); }}
                    className={`h-4 w-4 accent-blue-900 ${focus}`} />
                  {primary && enabled ? "Provider utama" : `Jadikan ${names[provider.id]} utama`}
                </label>
                <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-sm text-slate-700 has-disabled:cursor-not-allowed">
                  <span>{primary && enabled ? "Selalu aktif sebagai utama" : "Aktifkan sebagai cadangan"}</span>
                  <input type="checkbox" role="switch" aria-label={`Aktifkan ${names[provider.id]}`} checked={enabled} disabled={primary || !provider.configured}
                    onChange={(event) => { setDraft({ ...draft, enabledProviders: event.target.checked ? [...draft.enabledProviders, provider.id] : draft.enabledProviders.filter((id) => id !== provider.id) }); setNotice(""); }}
                    className={`h-5 w-9 shrink-0 appearance-none rounded-full bg-slate-300 p-0.5 before:block before:h-4 before:w-4 before:rounded-full before:bg-white checked:bg-blue-900 checked:before:translate-x-4 disabled:opacity-60 ${focus}`} />
                </label>
              </div>;
            })}
          </div>
          <p id="ai-routing-help" className="mt-5 text-sm leading-6 text-slate-600">Hanya satu provider utama. Untuk mematikannya, pilih provider utama lain terlebih dahulu. API key tetap aman di server; status tersedia bukan jaminan saldo atau koneksi provider.</p>
        </fieldset>
        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-slate-600">{dirty ? "Ada perubahan yang belum disimpan." : "Berlaku untuk permintaan baru, bukan proses yang sedang berjalan."}</p>
          <button type="button" disabled={!dirty || !valid || saving || saved.setupRequired || conflict} onClick={() => void save()}
            className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-900 px-4 text-sm font-semibold text-white hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-50 ${focus}`}>
            {saving ? <Loader2 aria-hidden="true" className="h-4 w-4 motion-safe:animate-spin" /> : <Save aria-hidden="true" className="h-4 w-4" />}
            {saving ? "Menyimpan…" : "Simpan pilihan"}
          </button>
        </div>
      </>}
    {error && <div role="alert" className="mx-5 mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-900"><p>{error}</p>{(!saved || conflict) && <button type="button" onClick={() => { setLoading(true); setError(""); setNotice(""); void load(); }} className={`mt-2 inline-flex min-h-11 items-center gap-2 font-semibold underline underline-offset-4 ${focus}`}><RefreshCw aria-hidden="true" className="h-4 w-4" />Muat ulang pengaturan</button>}</div>}
    <div role="status" aria-live="polite">{notice && <p className="mx-5 mb-5 flex items-start gap-2 text-sm text-emerald-800"><Check aria-hidden="true" className="h-4 w-4 shrink-0" />{notice}</p>}</div>
  </section>;
}
