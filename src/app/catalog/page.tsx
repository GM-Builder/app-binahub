import Link from "next/link";
import { ArrowRight, BookOpen, ChevronDown, Layers3 } from "lucide-react";
import { publicApiUrl } from "@/lib/public-api";

type CatalogModule = {
  id: string;
  code: string;
  slug: string;
  name: string;
  description: string | null;
  tagline?: string | null;
  learningObjectives?: string[];
  contentOutline?: string[];
  outputs?: string[];
  bestFor?: string | null;
  engagementFormat?: string | null;
  duration?: string | null;
  capacity?: string | null;
  serviceBrand?: string | null;
  notes?: string | null;
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

function DetailList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return <section>
    <h4 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#80560F]">{title}</h4>
    <ul className="space-y-2.5 text-sm leading-6 text-slate-600">
      {items.map((item, index) => <li key={`${index}-${item}`} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D9A441]" />{item}</li>)}
    </ul>
  </section>;
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
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#80560F]">BinaHub Signature Solutions</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-[-0.04em] text-slate-950 sm:text-6xl">{english ? "Solutions shaped around your organization." : "Solusi yang mengikuti kebutuhan organisasi Anda."}</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600">{english ? "Explore each solution's objectives, content, outcomes, format, and audience. The final approach is configured to your context." : "Jelajahi tujuan, konten, hasil, format, dan sasaran peserta setiap solusi. Rancangan akhir disesuaikan dengan konteks organisasi Anda."}</p>
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
              {product.modules.map((module) => {
                const objectives = module.learningObjectives?.length ? module.learningObjectives : module.standardScope?.split("\n") || [];
                const outputs = module.outputs?.length ? module.outputs : module.deliverables?.split("\n") || [];
                const facts = [
                  ["Format", module.engagementFormat],
                  [english ? "Duration" : "Durasi", module.duration || module.durationLabel],
                  [english ? "Capacity" : "Kapasitas", module.capacity],
                  [english ? "Service brand" : "Layanan terkait", module.serviceBrand],
                ] as const;
                return <article key={module.id} className="flex flex-col border border-slate-200 bg-white p-6 shadow-[0_16px_45px_-36px_rgba(15,23,42,0.35)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{module.code}</p>
                      <h3 className="mt-2 text-xl font-bold text-slate-950">{module.name}</h3>
                    </div>
                    <BookOpen size={18} className="shrink-0 text-[#0B2C6B]/25" />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{module.tagline || module.description}</p>
                  {(module.engagementFormat || module.duration) && <div className="mt-5 flex flex-wrap gap-2 text-[11px] text-[#0B2C6B]/70">{module.engagementFormat && <span className="rounded-full bg-[#F5F7FA] px-3 py-2">{module.engagementFormat}</span>}{module.duration && <span className="rounded-full bg-[#F5F7FA] px-3 py-2">{module.duration}</span>}</div>}
                  {module.bestFor && <p className="mt-5 border-l-2 border-[#D9A441] pl-4 text-sm leading-6 text-slate-600"><strong className="block text-[10px] uppercase tracking-[0.14em] text-slate-400">{english ? "Best for" : "Cocok untuk"}</strong>{module.bestFor}</p>}
                  <details className="group mt-6 border-t border-slate-200 pt-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[#0B2C6B] marker:hidden [&::-webkit-details-marker]:hidden">{english ? "View solution details" : "Lihat rincian solusi"}<ChevronDown size={18} className="transition-transform group-open:rotate-180" /></summary>
                    <div className="mt-6 space-y-7 border-t border-slate-100 pt-6">
                      <DetailList title={english ? "Learning objectives" : "Tujuan pembelajaran"} items={objectives} />
                      <DetailList title={english ? "Content overview" : "Cakupan konten"} items={module.contentOutline || []} />
                      <DetailList title={english ? "Outputs and deliverables" : "Hasil yang diperoleh"} items={outputs} />
                      <div className="grid gap-4 border-t border-slate-100 pt-5 text-sm sm:grid-cols-2">{facts.filter(([, value]) => value).map(([label, value]) => <p key={label}><span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</span><span className="mt-1 block text-slate-600">{value}</span></p>)}</div>
                      {module.notes && <p className="border-t border-slate-100 pt-5 text-xs leading-6 text-slate-500"><strong>{english ? "Notes" : "Catatan"}: </strong>{module.notes}</p>}
                    </div>
                  </details>
                  <Link href={english ? "/en/insight" : "/insight"} className="mt-6 inline-flex min-h-11 items-center gap-2 self-start bg-[#0B2C6B] px-5 py-3 text-xs font-bold text-white">{english ? "Discuss your needs" : "Diskusikan kebutuhan"} <ArrowRight className="h-4 w-4" /></Link>
                </article>;
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
