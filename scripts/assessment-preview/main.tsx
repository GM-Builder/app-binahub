import { useState } from "react";
import { createRoot } from "react-dom/client";
import { OutboundPreview } from "./outbound-preview";
import { FunnelPreview } from "./funnel-preview";
import { PipelinePreview } from "./pipeline-preview";
import { ClientJourneyPreview } from "./client-journey-preview";
import { SpinPreview } from "./spin-preview";
import { RMPreparation } from "@/components/rm-preparation";
import {PetaJourney} from '@/components/peta-journey';
import {PetaAdmin} from '@/components/peta-admin';
import { AssessmentPanel } from "@/app/admin/_components/assessment-panel";
import { assessmentDashboard, assessmentPreviewRecords } from "@/test/fixtures/assessment-admin";
import "@/app/globals.css";
import { ProposalBook, type ProposalView } from "@/app/proposal/[assessmentId]/proposal-book";

const previewView: ProposalView = {
  company: "PT Aurora Nusantara", contactName: "Nadia Putri", challenge: "Kolaborasi antartim perlu diperkuat.", issuedAt: "2026-10-05T03:00:00Z", locale: "id",
  proposal: { documentKind: "commercial", proposalType: "standard", proposedProgram: "Program Pengembangan Tim", opening: "Proposal Standar ini menjawab prioritas pengembangan tim Anda.",
    scope: ["Komunikasi lintas fungsi", "Kesepakatan kerja bersama"], deliverables: ["Rencana tindak lanjut tim"], timeline: "Durasi katalog: 1 hari.",
    investmentNote: "Harga dasar katalog: Rp 25.000.000 untuk Komunikasi Tim (1 hari pelaksanaan). Pajak dikonfirmasi terpisah.",
    commercialSnapshot: { items: [{ name: "Komunikasi Tim", quantity: 1, pricingUnit: "day" }], totalBeforeTax: 25_000_000, validityDays: 14 },
    selectedSolutions: [{ code: "SS-12", name: "Komunikasi dan Kolaborasi Tim", focus: "Membangun kebiasaan kerja yang lebih terbuka." }],
  },
};

function Preview() {
  const [records, setRecords] = useState(assessmentPreviewRecords);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const [employeeRange, setEmployeeRange] = useState("Semua");
  const [minScore, setMinScore] = useState("0");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const data = assessmentDashboard(records);
  return <div className="min-h-screen bg-[#F5F7FB] text-slate-900">
    <div className="border-b border-slate-200 bg-white px-5 py-3 text-xs text-slate-500">Preview lokal · Data contoh · Tidak terhubung ke API atau email</div>
    <main className="mx-auto max-w-[1440px] p-5 sm:p-8">
      <header className="mb-7"><p className="text-xs font-medium text-slate-500">Hubungan klien</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Assessment klien</h1><p className="mt-3 text-sm text-slate-500">Pahami kebutuhan klien, pantau proposal, dan kelola tindak lanjut dalam satu tempat.</p></header>
      <AssessmentPanel data={data} records={records.filter((record) => (!query || `${record.name} ${record.company} ${record.email}`.toLowerCase().includes(query.toLowerCase())) && (category === "Semua" || record.category === category) && (employeeRange === "Semua" || record.employees === employeeRange) && record.overallScore >= Number(minScore))}
        query={query} setQuery={setQuery} category={category} setCategory={setCategory} employeeRange={employeeRange} setEmployeeRange={setEmployeeRange} minScore={minScore} setMinScore={setMinScore} expandedId={expandedId} setExpandedId={setExpandedId}
        onRefresh={async () => {}} onAction={async (_url, init) => {
          if (init?.body) {
            const body = JSON.parse(String(init.body));
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setRecords((current) => current.map((record) => record.id === (body.id || body.assessmentId) ? { ...record,
              ...(body.action === "request_proposal" ? { proposalStatus: "Sedang Disusun" } : {}),
              ...(typeof body.followUpPaused === "boolean" ? { followUpPaused: body.followUpPaused } : {}),
            } : record));
          }
          return { success: true, products: [], modules: [] };
        }} />
    </main>
  </div>;
}

const mode = new URLSearchParams(window.location.search);
createRoot(document.getElementById("root")!).render(mode.has("phone")
  ? <div className="min-h-screen bg-slate-100 p-5"><iframe title="Preview ponsel" src={mode.has("funnel") ? "/?funnel&screen=phone" : mode.has("outbound") ? "/?outbound&screen=phone" : "/?screen=phone"} style={{ width: 390, height: 844, border: "1px solid #cbd5e1", borderRadius: 16, background: "white" }} /></div>
  : mode.has('peta-admin')?<main className="mx-auto max-w-6xl p-5 sm:p-8"><h1 className="mb-5 text-2xl font-semibold">PETA · Pengelolaan sintetis</h1><PetaAdmin/></main>:mode.has('peta-program')?<PetaJourney programMode/>:mode.has('peta')?<PetaJourney/>:mode.has("rm-review") ? <main className="mx-auto max-w-6xl p-5 sm:p-8"><h1 className="mb-5 text-2xl font-semibold">Review RM · Data sintetis</h1><RMPreparation/></main> : mode.has("spin") ? <SpinPreview /> : mode.has("journey") ? <ClientJourneyPreview /> : mode.has("pipeline") ? <PipelinePreview /> : mode.has("funnel") ? <FunnelPreview /> : mode.has("outbound") || mode.has("sales") ? <OutboundPreview /> : mode.has("proposal") ? <ProposalBook view={previewView} downloadUrl="#preview-only" /> : <Preview />);
