"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Loader2, RefreshCw, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Competency = {
  code: string;
  name: string;
  definition: string | null;
  behavioral_indicators: string[];
  kpi_source_version: string | null;
  content_status: "awaiting_ceo" | "draft" | "approved";
};
type Mapping = {
  module_id: string;
  competency_code: string;
  role: "core" | "secondary";
  display_order: number;
  source_solution_title: string;
  catalog_modules: { module_code: string; active: boolean } | null;
};
type Dictionary = {
  framework: { id: string; source_file: string; source_sha256: string; measurement_status: string };
  competencies: Competency[];
  mappings: Mapping[];
  individualIntegration?:{available:boolean;freeAreas:string[]};
};
const contentLabels = { awaiting_ceo: "Menunggu definisi CEO", draft: "Draf definisi", approved: "Definisi tersedia" };

export function CompetencyDictionary() {
  const [data, setData] = useState<Dictionary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    const timeout = setTimeout(() => controller.abort(), 20_000);
    async function load() {
      setLoading(true);
      setError("");
      try {
        const { data: session } = await supabase.auth.getSession();
        if (disposed) return;
        if (!session.session?.access_token) throw new Error("Sesi Anda berakhir. Silakan masuk kembali.");
        const response = await fetch("/api/admin/competencies", {
          headers: { Authorization: `Bearer ${session.session.access_token}` },
          cache: "no-store", signal: controller.signal,
        });
        const body = await response.json();
        if (!response.ok || !body.success) throw new Error(body.error || "Kamus kompetensi belum dapat dimuat.");
        if (!body.framework || !Array.isArray(body.competencies) || !Array.isArray(body.mappings)) {
          throw new Error("Data kamus belum lengkap. Silakan coba lagi.");
        }
        if (!disposed) setData(body);
      } catch (failure) {
        if (!disposed) setError(controller.signal.aborted ? "Waktu memuat habis. Periksa koneksi lalu coba lagi." :
          failure instanceof Error ? failure.message : "Kamus kompetensi belum dapat dimuat.");
      } finally {
        clearTimeout(timeout);
        if (!disposed) setLoading(false);
      }
    }
    void load();
    return () => { disposed = true; clearTimeout(timeout); controller.abort(); };
  }, [revision]);

  return <div className="mx-auto max-w-6xl space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Link href="/admin/catalog" className="inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-medium text-blue-900 focus-visible:outline-2 focus-visible:outline-offset-4">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Produk & modul
      </Link>
      <Link href="/insight/individual" className="inline-flex min-h-11 items-center rounded-xl border border-blue-200 bg-white px-4 text-sm font-medium text-blue-900 hover:bg-blue-50">Buka diagnosis individu</Link>
      <button type="button" onClick={() => setRevision(value => value + 1)} disabled={loading}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
        <RefreshCw className="h-4 w-4" aria-hidden="true" /> Muat ulang
      </button>
    </div>
    {loading ? <div role="status" className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-600">
      <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Memuat kamus kompetensi…
    </div> : error ? <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm leading-6 text-amber-950">
      <h2 className="font-semibold">Kamus belum dapat ditampilkan</h2><p className="mt-1">{error}</p>
      <p className="mt-3">Katalog dan diagnosis yang sudah berjalan tetap menggunakan pengaturan sebelumnya.</p>
    </div> : data ? <CompetencyDictionaryView data={data} /> : null}
  </div>;
}

export function CompetencyDictionaryView({ data }: { data: Dictionary }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const linksByCode = useMemo(() => {
    const index = new Map<string, Mapping[]>();
    for (const mapping of data.mappings) {
      const links = index.get(mapping.competency_code) || [];
      links.push(mapping);
      index.set(mapping.competency_code, links);
    }
    return index;
  }, [data.mappings]);
  const query = search.trim().toLocaleLowerCase("id-ID");
  const visible = data.competencies.filter(competency => {
    const links = linksByCode.get(competency.code) || [];
    const searchable = [competency.name, competency.code, ...links.map(link =>
      `${link.catalog_modules?.module_code || ""} ${link.source_solution_title}`)].join(" ").toLocaleLowerCase("id-ID");
    return searchable.includes(query) && (status === "all" || competency.content_status === status);
  });
  const solutionCount = new Set(data.mappings.map(mapping => mapping.module_id)).size;

  return <>
    <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <span className="rounded-xl bg-blue-50 p-3 text-blue-900"><BookOpen className="h-6 w-6" aria-hidden="true" /></span>
        <div><h2 className="text-xl font-semibold tracking-tight text-slate-950">Kompetensi dan solusi yang mengembangkannya</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Pemetaan dari katalog CEO sebagai landasan penghubung diagnosis dengan rekomendasi program. Halaman ini untuk peninjauan internal.</p>
        </div>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-5 border-t border-slate-100 pt-6 sm:grid-cols-3">
        <div><dt className="text-xs text-slate-500">Kompetensi</dt><dd className="mt-1 text-2xl font-semibold text-slate-950">{data.competencies.length}</dd></div>
        <div><dt className="text-xs text-slate-500">Solusi terhubung</dt><dd className="mt-1 text-2xl font-semibold text-slate-950">{solutionCount}</dd></div>
        <div className="col-span-2 sm:col-span-1"><dt className="text-xs text-slate-500">Penggunaan pada diagnosis</dt><dd className="mt-2 text-sm font-semibold text-amber-800">{data.individualIntegration?.available?'Individu: 3 Area tersedia':'Belum diaktifkan'}</dd></div>
      </dl>
      <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">Nama dan hubungan program sudah tersedia. Definisi, indikator perilaku, soal, serta cara penilaian menunggu dokumen CEO. Core berarti kompetensi utama yang ditargetkan; Secondary berarti kompetensi pendukung. Keduanya bukan bobot skor.</p>
      {data.individualIntegration?.available&&<p className="mt-3 text-sm leading-6 text-blue-900">Personal Effectiveness sudah memakai instrumen individu CEO untuk {data.individualIntegration.freeAreas.join(', ')}. Ini tidak berarti seluruh 26 kompetensi atau diagnosis organisasi sudah diperbarui. <Link href="/admin/assessments/individual" className="font-semibold underline">Buka hasil & evaluasi individu</Link></p>}
    </section>

    <section aria-label="Daftar kompetensi" className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_240px]">
        <label className="relative"><span className="sr-only">Cari kompetensi atau solusi</span>
          <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
          <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Cari kompetensi, nama solusi, atau kode SS…"
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100" />
        </label>
        <label><span className="sr-only">Kesiapan definisi</span><select value={status} onChange={event => setStatus(event.target.value)}
          className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-2 focus:outline-blue-700">
          <option value="all">Semua kompetensi</option><option value="awaiting_ceo">Menunggu definisi CEO</option>
          <option value="draft">Draf definisi</option><option value="approved">Definisi tersedia</option>
        </select></label>
      </div>
      <p role="status" className="text-xs text-slate-500">{visible.length} dari {data.competencies.length} kompetensi</p>
      {visible.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600">Tidak ada kompetensi yang cocok. Coba kata kunci atau filter lain.</p> :
        <div className="grid items-start gap-4 lg:grid-cols-2">{visible.map(competency => {
          const links = linksByCode.get(competency.code) || [];
          return <article key={competency.code} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><span className="font-mono text-slate-400">{competency.code}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">{contentLabels[competency.content_status]}</span>
            </div>
            <h3 className="mt-3 text-base font-semibold text-slate-950">{competency.name}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{competency.definition || "Definisi resmi dan indikator perilaku belum diberikan."}</p>
            {competency.behavioral_indicators.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">
              {competency.behavioral_indicators.map((indicator, index) => <li key={`${competency.code}-${index}`}>{indicator}</li>)}
            </ul>}
            {competency.kpi_source_version && <p className="mt-2 text-xs text-slate-500">Referensi KPI: {competency.kpi_source_version}</p>}
            <details className="mt-4 border-t border-slate-100 pt-4">
              <summary className="cursor-pointer rounded text-sm font-medium text-blue-900 focus-visible:outline-2 focus-visible:outline-offset-4">Lihat {links.length} solusi terkait {competency.name}</summary>
              <div className="mt-4 space-y-4">{(["core", "secondary"] as const).map(role => {
                const group = links.filter(link => link.role === role).sort((a, b) =>
                  (a.catalog_modules?.module_code || "").localeCompare(b.catalog_modules?.module_code || ""));
                return <section key={role}><h4 className="text-xs font-semibold text-slate-500">{role === "core" ? "Core · kompetensi utama" : "Secondary · kompetensi pendukung"}</h4>
                  {group.length ? <ul className="mt-2 space-y-2">{group.map(link => <li key={`${link.module_id}-${role}`} className="text-sm leading-6 text-slate-700">
                    <span className="mr-2 font-mono text-xs text-slate-400">{link.catalog_modules?.module_code || "—"}</span>{link.source_solution_title}
                    {link.catalog_modules?.active === false && <span className="ml-2 text-xs text-slate-400">Diarsipkan</span>}
                  </li>)}</ul> : <p className="mt-2 text-xs text-slate-500">Tidak ada pemetaan {role}.</p>}
                </section>;
              })}</div>
            </details>
          </article>;
        })}</div>}
    </section>
    <details className="rounded-xl border border-slate-200 bg-white p-4 text-xs leading-6 text-slate-500">
      <summary className="cursor-pointer font-medium text-slate-700">Sumber dan versi kamus</summary>
      <dl className="mt-3 space-y-2 break-all"><div><dt>Dokumen</dt><dd>{data.framework.source_file}</dd></div>
        <div><dt>Versi kamus</dt><dd>{data.framework.id}</dd></div><div><dt>SHA-256 sumber</dt><dd className="font-mono">{data.framework.source_sha256}</dd></div></dl>
      <p className="mt-3">Kode COMP merupakan identitas teknis internal. Nama kompetensi dan judul solusi mengikuti dokumen sumber. Pemetaan ini tidak mengubah harga atau isi katalog yang sudah dipublikasikan.</p>
    </details>
  </>;
}
