import { SalesFunnel } from "@/app/admin/_components/sales-funnel";
import { Overview } from "@/app/admin/_components/overview";
import { funnelPreviewData } from "@/test/fixtures/sales-funnel";

const data = funnelPreviewData();
export function FunnelPreview() {
  return <div className="min-h-screen bg-[#F5F7FB] text-slate-900">
    <div className="border-b border-slate-200 bg-white px-5 py-3 text-xs text-slate-500">Preview lokal · Data contoh · Tidak terhubung ke API atau email</div>
    <main className="mx-auto max-w-[1440px] space-y-6 p-5 sm:p-8">
      <header><p className="text-xs text-slate-500">Ringkasan eksekutif</p><h1 className="mt-2 text-2xl font-semibold tracking-tight">Dashboard bisnis</h1><p className="mt-2 text-sm text-slate-500">Pantau perjalanan calon klien, perkembangan penjualan, dan prioritas operasional dalam satu tampilan.</p></header>
      <SalesFunnel data={data} /><Overview data={data} />
    </main>
  </div>;
}
