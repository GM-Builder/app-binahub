import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Layers3 } from "lucide-react";
import { publicApiUrl } from "@/lib/public-api";

type CatalogModule = {
  id: string;
  code: string;
  slug: string;
  name: string;
  description: string | null;
  standardScope: string | null;
  deliverables: string | null;
  durationLabel: string | null;
  featured: boolean;
};

type CatalogProduct = {
  key: string;
  slug: string;
  name: string;
  objective: string | null;
  shortDescription: string | null;
  description: string | null;
  featured: boolean;
  modules: CatalogModule[];
};

async function catalog(locale: "id" | "en"): Promise<CatalogProduct[]> {
  try {
    const response = await fetch(publicApiUrl(`/api/catalog/modules?locale=${locale}`), { next: { revalidate: 60 } });
    if (!response.ok) return [];
    const body = await response.json();
    return body.success && Array.isArray(body.products) ? body.products : [];
  } catch {
    return [];
  }
}

export default async function PublicCatalogPage({ searchParams }: { searchParams: Promise<{ locale?: string }> }) {
  const locale = (await searchParams).locale === "en" ? "en" : "id";
  const english = locale === "en";
  const products = await catalog(locale);

  return (
    <main className="min-h-screen bg-[#F7F8FA] text-slate-900">
      <header className="border-b border-slate-200 bg-[#071B3D] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-6 sm:px-8">
          <Link href="/" className="text-xl font-bold tracking-tight">BinaHub</Link>
          <div className="flex items-center gap-4">
            <nav aria-label="Language" className="flex gap-2 text-xs"><Link href="/catalog?locale=id" aria-current={!english ? "page" : undefined} className={!english ? "font-bold underline underline-offset-4" : "text-white/70"}>ID</Link><span className="text-white/40">/</span><Link href="/catalog?locale=en" aria-current={english ? "page" : undefined} className={english ? "font-bold underline underline-offset-4" : "text-white/70"}>EN</Link></nav>
            <Link href={english ? "/en/insight" : "/insight"} className="inline-flex min-h-10 items-center bg-white px-4 text-xs font-bold text-[#071B3D]">{english ? "Start Diagnostic" : "Mulai Diagnosa"}</Link>
          </div>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#80560F]">{english ? "BinaHub solutions catalog" : "Katalog solusi BinaHub"}</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-[-0.04em] text-slate-950 sm:text-6xl">{english ? "Solutions shaped by your needs." : "Solusi yang berangkat dari kebutuhan Anda."}</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600">{english ? "Explore the purpose, scope, outcomes, and duration of each solution. Recommendations and investment follow a conversation about your organization's context." : "Kenali tujuan, ruang lingkup, keluaran, dan durasi setiap solusi. Rekomendasi serta investasi disusun setelah kami memahami konteks organisasi Anda."}</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-12 px-5 py-12 sm:px-8">
        {products.length === 0 ? (
          <section className="border border-slate-200 bg-white p-10 text-center">
            <Layers3 className="mx-auto h-8 w-8 text-slate-300" />
            <h2 className="mt-4 font-bold">{english ? "Catalog in preparation" : "Katalog sedang dipersiapkan"}</h2>
            <p className="mt-2 text-sm text-slate-500">{english ? "Solutions will appear after BinaHub reviews and publishes them." : "Solusi akan muncul setelah disetujui dan dipublikasikan oleh tim BinaHub."}</p>
          </section>
        ) : products.map((product) => (
          <section key={product.key} aria-labelledby={`product-${product.key}`}>
            <div className="grid gap-6 border-b border-slate-300 pb-6 lg:grid-cols-[0.7fr_1.3fr]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#80560F]">{product.key}</p>
                <h2 id={`product-${product.key}`} className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{product.name}</h2>
              </div>
              <p className="max-w-3xl text-sm leading-7 text-slate-600">{product.description || product.shortDescription || product.objective}</p>
            </div>
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {product.modules.map((module) => (
                <article key={module.id} className="border border-slate-200 bg-white p-6 shadow-[0_16px_45px_-36px_rgba(15,23,42,0.35)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{module.code}</p>
                      <h3 className="mt-2 text-xl font-bold text-slate-950">{module.name}</h3>
                    </div>
                    {module.featured && <span className="bg-amber-100 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-amber-800">Unggulan</span>}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{module.description}</p>
                  {module.durationLabel && <p className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-600"><Clock3 className="h-4 w-4 text-[#0B2C6B]" /> {english ? "Duration" : "Durasi"}: {module.durationLabel}</p>}
                  {module.deliverables && <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-600"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{module.deliverables}</p>}
                  <Link href={english ? "/en/insight" : "/insight"} className="mt-6 inline-flex min-h-11 items-center gap-2 bg-[#0B2C6B] px-5 text-xs font-bold text-white">{english ? "Discuss your needs" : "Diskusikan kebutuhan"} <ArrowRight className="h-4 w-4" /></Link>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
