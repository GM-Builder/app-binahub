import type { Metadata } from "next";
import { ProposalBook, type ProposalView } from "./proposal-book";

export const metadata: Metadata = {
  title: "Proposal khusus Anda | BinaHub",
  robots: { index: false, follow: false, nocache: true },
};

export default async function ProposalPage({
  params,
  searchParams,
}: {
  params: Promise<{ assessmentId: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const [{ assessmentId }, query] = await Promise.all([params, searchParams]);
  const token = typeof query.token === "string" ? query.token : "";
  let view: ProposalView | null = null;
  let downloadUrl = "";

  if (/^[0-9a-f-]{36}$/i.test(assessmentId) && token) {
    const origin = (process.env.NEXT_PUBLIC_BINAHUB_API_URL || "https://api.binahub.id").replace(/\/+$/, "");
    const url = new URL(`${origin}/api/proposal/view`);
    url.searchParams.set("assessmentId", assessmentId);
    url.searchParams.set("token", token);
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok) {
        view = await response.json() as ProposalView;
        url.searchParams.set("format", "pdf");
        downloadUrl = url.toString();
      }
    } catch {
      // Show the same non-disclosing state for an unavailable API or invalid link.
    }
  }

  if (!view) {
    return <main className="flex min-h-screen items-center justify-center bg-[#F3F2EE] px-5 py-16 text-[#172941]">
      <div className="max-w-md border border-[#D9D8D1] bg-white px-8 py-10 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#A2742B]">BinaHub · Proposal</p>
        <h1 className="mt-5 font-serif text-3xl">Proposal belum tersedia</h1>
        <p className="mt-4 text-sm leading-7 text-[#667185]">Tautan mungkin sudah kedaluwarsa atau proposal belum selesai disiapkan. Silakan balas email BinaHub untuk meminta bantuan atau tautan baru.</p>
      </div>
    </main>;
  }

  return <ProposalBook view={view} downloadUrl={downloadUrl} />;
}
