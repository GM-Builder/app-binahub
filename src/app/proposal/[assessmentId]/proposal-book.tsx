"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDownToLine, ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./proposal-book.module.css";

export type ProposalView = {
  company: string;
  contactName: string;
  challenge: string;
  issuedAt: string;
  locale: "id" | "en";
  proposal: {
    documentKind?: "preliminary" | "commercial";
    proposalType?: "standard" | "custom";
    opening?: string;
    proposedProgram?: string;
    scope?: string[];
    timeline?: string;
    investmentNote?: string;
    nextStep?: string;
    learningObjectives?: string[];
    selectedSolutions?: Array<{ code: string; name: string; nameEn?: string; focus: string; focusEn?: string }>;
    commercialSnapshot?: {
      items: Array<{ name: string; quantity: number; pricingUnit: string }>;
      totalBeforeTax?: number;
      currency?: string;
      validityDays?: number;
    };
  };
};

const copy = {
  id: {
    confidential: "Disiapkan khusus untuk penerima",
    preliminary: "Rekomendasi Awal",
    proposal: "Proposal Solusi",
    preparedFor: "Disusun untuk",
    issued: "Diterbitkan",
    context: "Konteks dan kebutuhan",
    summary: "Ringkasan rekomendasi",
    objectives: "Tujuan pengembangan",
    solutions: "Solusi yang direkomendasikan",
    delivery: "Rancangan pelaksanaan",
    deliveryBody: "Pengalaman belajar dapat memadukan fasilitasi, praktik, refleksi, diskusi terstruktur, dan penerapan dalam pekerjaan sehari-hari. Rincian akhir diselaraskan bersama organisasi Anda.",
    scope: "Cakupan awal",
    schedule: "Perkiraan waktu",
    investment: "Investasi",
    estimate: "Estimasi awal",
    commercial: "Total sebelum pajak",
    note: "Nilai dan ruang lingkup akhir akan dikonfirmasi setelah jumlah peserta, format, durasi, serta kebutuhan pelaksanaan disepakati.",
    validity: "Berlaku",
    days: "hari sejak diterbitkan",
    next: "Langkah berikutnya",
    nextBody: "Kami siap membahas kebutuhan yang paling relevan dan menyelaraskan rancangan ini bersama Anda. Balas email yang mengantar proposal ini untuk memulai percakapan.",
    about: "BinaHub membantu organisasi mengembangkan kapabilitas manusia, menjalankan transformasi, dan menghasilkan dampak berkelanjutan.",
    download: "Unduh PDF",
    previous: "Halaman sebelumnya",
    following: "Halaman berikutnya",
    keyboard: "Geser halaman atau gunakan tombol panah",
    pages: ["Sampul", "Konteks", "Solusi", "Pelaksanaan", "Investasi", "Langkah berikutnya"],
  },
  en: {
    confidential: "Prepared exclusively for the recipient",
    preliminary: "Preliminary Recommendation",
    proposal: "Solution Proposal",
    preparedFor: "Prepared for",
    issued: "Issued",
    context: "Context and need",
    summary: "Recommendation summary",
    objectives: "Development objectives",
    solutions: "Recommended solutions",
    delivery: "Delivery approach",
    deliveryBody: "The learning experience may combine facilitation, practice, reflection, structured discussion, and workplace application. Final details will be aligned with your organization.",
    scope: "Indicative scope",
    schedule: "Indicative timeline",
    investment: "Investment",
    estimate: "Initial estimate",
    commercial: "Total before tax",
    note: "Final scope and investment will be confirmed after participant count, format, duration, and delivery requirements are agreed.",
    validity: "Valid for",
    days: "days from issue",
    next: "Next steps",
    nextBody: "We are ready to discuss the priorities that matter most and align this approach with you. Reply to the email that brought you here to begin the conversation.",
    about: "BinaHub helps organizations build people capability, navigate transformation, and deliver sustainable impact.",
    download: "Download PDF",
    previous: "Previous page",
    following: "Next page",
    keyboard: "Swipe pages or use the arrow keys",
    pages: ["Cover", "Context", "Solutions", "Delivery", "Investment", "Next steps"],
  },
} as const;

function Folio({ label, number, total }: { label: string; number: number; total: number }) {
  return <div className="mt-auto flex items-center justify-between border-t border-[#DDDAD2] pt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#78818A]">
    <span>BinaHub · {label}</span><span>{String(number).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
  </div>;
}

function PageHeading({ number, title }: { number: string; title: string }) {
  return <div className="mb-8"><span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#A37637]">{number}</span><h2 className="mt-3 max-w-[30rem] font-serif text-[clamp(1.8rem,4vw,2.65rem)] leading-[1.17] text-[#172941]">{title}</h2><div className="mt-6 h-px w-12 bg-[#B78B4D]" /></div>;
}

function BulletList({ items }: { items: string[] }) {
  return <ul className="space-y-4">{items.filter(Boolean).map((item, index) => <li key={`${index}-${item}`} className="flex gap-4 border-b border-[#EAE7DF] pb-4 text-[14px] leading-6 text-[#334357]"><span className="mt-1 shrink-0 font-serif text-[#A37637]">{String(index + 1).padStart(2, "0")}</span><span>{item}</span></li>)}</ul>;
}

export function ProposalBook({ view, downloadUrl }: { view: ProposalView; downloadUrl: string }) {
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(1);
  const reducedMotion = useReducedMotion();
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const t = copy[view.locale];
  const proposal = view.proposal;
  const pages = t.pages;
  const title = proposal.documentKind === "preliminary" ? t.preliminary : t.proposal;
  const date = new Date(view.issuedAt).toLocaleDateString(view.locale === "en" ? "en-US" : "id-ID", { day: "numeric", month: "long", year: "numeric" });
  const solutions = proposal.selectedSolutions || [];

  const changePage = useCallback((next: number) => {
    if (next < 0 || next >= 6 || next === page) return;
    setDirection(next > page ? 1 : -1);
    setPage(next);
  }, [page]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key === "ArrowRight") { event.preventDefault(); changePage(page + 1); }
      if (event.key === "ArrowLeft") { event.preventDefault(); changePage(page - 1); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [changePage, page]);

  const content = [
    <div key="cover" className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4"><p className="font-semibold tracking-[-0.04em] text-[#173560]">Bina<span className="text-[#B78742]">Hub</span></p><span className="text-right text-[10px] font-semibold uppercase tracking-[0.16em] text-[#87909A]">Signature Solutions</span></div>
      <div className="my-auto py-12"><p className="text-[10px] font-bold uppercase tracking-[0.27em] text-[#A37637]">{t.confidential}</p><h1 className="mt-8 max-w-[32rem] font-serif text-[clamp(2.6rem,7vw,4.3rem)] leading-[1.08] tracking-[-0.04em] text-[#172941]">{title}</h1><div className="mt-8 h-0.5 w-16 bg-[#B78742]" /><p className="mt-9 max-w-[30rem] text-lg leading-8 text-[#556477]">{proposal.proposedProgram || "BinaHub Signature Solutions"}</p></div>
      <div className="space-y-3 border-t border-[#DDDAD2] pt-6 text-sm"><div className="flex justify-between gap-5"><span className="text-[#7B8794]">{t.preparedFor}</span><strong className="text-right font-medium text-[#172941]">{view.company}</strong></div><div className="flex justify-between gap-5"><span className="text-[#7B8794]">{t.issued}</span><span className="text-right text-[#172941]">{date}</span></div></div>
    </div>,
    <div key="context" className="flex min-h-full flex-col"><PageHeading number="01 / 05" title={t.summary} /><p className="max-w-[37rem] font-serif text-[clamp(1.1rem,2vw,1.45rem)] leading-[1.6] text-[#27384A]">{proposal.opening || t.about}</p>{view.challenge && <div className="mt-10 border-l-2 border-[#B78742] bg-[#F7F5F0] px-5 py-5"><p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#8E6B3C]">{t.context}</p><p className="mt-3 text-sm leading-7 text-[#4A5869]">{view.challenge}</p></div>}<Folio label={pages[1]} number={2} total={6} /></div>,
    <div key="solutions" className="flex min-h-full flex-col"><PageHeading number="02 / 05" title={t.solutions} />{solutions.length > 0 ? <div className="space-y-6">{solutions.map((solution, index) => <div key={`${solution.code}-${index}`} className="border-t border-[#DCD9D1] pt-5"><div className="flex items-baseline gap-4"><span className="font-serif text-xl text-[#A37637]">{solution.code || String(index + 1).padStart(2, "0")}</span><h3 className="font-serif text-xl text-[#172941]">{view.locale === "en" ? solution.nameEn || solution.name : solution.name}</h3></div><p className="mt-2 pl-11 text-sm leading-6 text-[#667185]">{view.locale === "en" ? solution.focusEn || solution.focus : solution.focus}</p></div>)}</div> : <p className="text-sm leading-7 text-[#556477]">{proposal.proposedProgram}</p>}{(proposal.learningObjectives || []).length > 0 && <div className="mt-9"><p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#A37637]">{t.objectives}</p><BulletList items={proposal.learningObjectives || []} /></div>}<Folio label={pages[2]} number={3} total={6} /></div>,
    <div key="delivery" className="flex min-h-full flex-col"><PageHeading number="03 / 05" title={t.delivery} /><p className="text-sm leading-7 text-[#556477]">{t.deliveryBody}</p><h3 className="mb-5 mt-10 text-[10px] font-bold uppercase tracking-[0.18em] text-[#A37637]">{t.scope}</h3><BulletList items={proposal.scope || []} />{proposal.timeline && <p className="mt-8 border-t border-[#DCD9D1] pt-5 text-sm text-[#556477]"><strong className="mr-3 text-[#172941]">{t.schedule}</strong>{proposal.timeline}</p>}<Folio label={pages[3]} number={4} total={6} /></div>,
    <div key="investment" className="flex min-h-full flex-col"><PageHeading number="04 / 05" title={t.investment} /><div className="border-y border-[#DCD9D1] py-6"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A37637]">{proposal.documentKind === "preliminary" ? t.estimate : t.commercial}</p><p className="mt-5 font-serif text-[clamp(1.5rem,3.5vw,2.2rem)] leading-snug text-[#172941]">{proposal.investmentNote || (proposal.commercialSnapshot?.totalBeforeTax != null ? new Intl.NumberFormat(view.locale === "en" ? "en-US" : "id-ID", { style: "currency", currency: proposal.commercialSnapshot.currency || "IDR", maximumFractionDigits: 0 }).format(proposal.commercialSnapshot.totalBeforeTax) : t.note)}</p></div>{(proposal.commercialSnapshot?.items || []).length > 0 && <div className="mt-8 space-y-3">{proposal.commercialSnapshot?.items.map((item, index) => <div key={`${item.name}-${index}`} className="flex justify-between gap-4 border-b border-[#EEEAE3] pb-3 text-sm"><span className="text-[#334357]">{item.name}</span><span className="shrink-0 text-[#78818A]">× {item.quantity}</span></div>)}</div>}<p className="mt-8 text-xs leading-6 text-[#78818A]">{t.note}</p>{proposal.commercialSnapshot?.validityDays && <p className="mt-3 text-xs text-[#78818A]">{t.validity} {proposal.commercialSnapshot.validityDays} {t.days}.</p>}<Folio label={pages[4]} number={5} total={6} /></div>,
    <div key="next" className="flex min-h-full flex-col"><PageHeading number="05 / 05" title={t.next} /><p className="max-w-[35rem] font-serif text-[clamp(1.15rem,2.5vw,1.65rem)] leading-[1.55] text-[#27384A]">{proposal.nextStep || t.nextBody}</p><div className="mt-12 border-t border-[#DCD9D1] pt-7"><p className="text-sm leading-7 text-[#556477]">{t.about}</p><p className="mt-9 text-sm font-semibold text-[#173560]">Bina<span className="text-[#B78742]">Hub</span></p><p className="mt-1 text-xs text-[#78818A]">People. Learning. Elevated.<br />PT Binahub Solusi Transformasi</p></div><Folio label={pages[5]} number={6} total={6} /></div>,
  ];

  return <main className={`${styles.stage} min-h-screen px-4 pb-7 pt-5 text-[#172941] sm:px-8 sm:pt-7`}>
    <div className="mx-auto max-w-[1040px]">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-[#D7D6D0] pb-4"><div><p className="text-lg font-semibold tracking-[-0.04em]">Bina<span className="text-[#A37637]">Hub</span></p><p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.15em] text-[#78818A]">{t.confidential}</p></div><a href={downloadUrl} download referrerPolicy="no-referrer" className="inline-flex min-h-10 items-center gap-2 border border-[#AEB6BF] bg-white px-4 text-xs font-semibold text-[#173560] transition-colors hover:bg-[#E8ECF0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173560]"><ArrowDownToLine size={15} />{t.download}</a></header>
      <div className="mb-3 flex items-center justify-between gap-4 text-[11px] font-medium text-[#6B7683]"><span>{pages[page]} · {page + 1} / {pages.length}</span><span className="hidden sm:inline">{t.keyboard}</span></div>
      <div className={`${styles.book} relative mx-auto h-[min(76vh,850px)] min-h-[550px] max-w-[760px] sm:min-h-[610px]`} onTouchStart={(event) => { touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }} onTouchEnd={(event) => { const start = touchStart.current; touchStart.current = null; if (!start) return; const dx = event.changedTouches[0].clientX - start.x; const dy = event.changedTouches[0].clientY - start.y; if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.3) changePage(page + (dx < 0 ? 1 : -1)); }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.article key={page} className={`${styles.sheet} absolute inset-0 overflow-y-auto px-7 py-8 sm:px-12 sm:py-11`} initial={reducedMotion ? false : { rotateY: direction > 0 ? 20 : -20, opacity: 0.3 }} animate={{ rotateY: 0, opacity: 1 }} exit={reducedMotion ? { opacity: 0 } : { rotateY: direction > 0 ? -75 : 75, opacity: 0.2 }} transition={{ duration: reducedMotion ? 0 : 0.46, ease: [0.22, 1, 0.36, 1] }} aria-label={`${pages[page]}, ${page + 1} / ${pages.length}`}>
            {content[page]}
          </motion.article>
        </AnimatePresence>
      </div>
      <nav className="mx-auto mt-5 flex max-w-[760px] items-center justify-between gap-4" aria-label="Navigasi halaman proposal"><button type="button" onClick={() => changePage(page - 1)} disabled={page === 0} aria-label={t.previous} className="inline-flex min-h-11 items-center gap-2 px-3 text-sm font-medium text-[#173560] disabled:cursor-not-allowed disabled:opacity-35"><ArrowLeft size={17} /><span className="hidden sm:inline">{t.previous}</span></button><div className="flex items-center gap-2">{pages.map((label, index) => <button key={label} type="button" onClick={() => changePage(index)} aria-label={`${label}, ${index + 1} / ${pages.length}`} aria-current={index === page ? "page" : undefined} className={`h-2 rounded-full transition-all ${index === page ? "w-6 bg-[#173560]" : "w-2 bg-[#BFC4C9] hover:bg-[#758292]"}`} />)}</div><button type="button" onClick={() => changePage(page + 1)} disabled={page === pages.length - 1} aria-label={t.following} className="inline-flex min-h-11 items-center gap-2 px-3 text-sm font-medium text-[#173560] disabled:cursor-not-allowed disabled:opacity-35"><span className="hidden sm:inline">{t.following}</span><ArrowRight size={17} /></button></nav>
    </div>
  </main>;
}
