"use client";

import { useState } from "react";
import { ChevronDown, Download, Eye, FileText, PauseCircle, PlayCircle, Search, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  AdminNotice,
  AdminSelect,
  Badge,
  ConfirmDialog,
  EmptyState,
  MetricBar,
  Panel,
} from "./shared";
import { FOLLOW_UP_LEVELS } from "../_lib/constants";
import { daysSince, exportCsv, formatDate, uniqueOptions } from "../_lib/utils";
import type { AssessmentDocumentType, AssessmentRecord, CatalogModule, CatalogProduct, ConfirmAction, DashboardData, EmailPreview } from "../_lib/types";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { QUESTIONS } from "@/app/insight/questions";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function moduleReadinessLabel(status?: string) {
  const labels: Record<string, string> = {
    design: "Dalam perancangan",
    pending: "Menunggu kelengkapan",
    review: "Sedang ditinjau",
    ready: "Siap ditawarkan",
    approved: "Disetujui",
    blocked: "Belum dapat ditawarkan",
  };
  return labels[status || ""] || "Perlu ditinjau";
}

function pricingUnitLabel(unit?: string) {
  const labels: Record<string, string> = {
    fixed: "paket",
    package: "paket",
    participant: "peserta",
    per_participant: "peserta",
    session: "sesi",
    day: "hari",
    month: "bulan",
  };
  return labels[unit || ""] || unit?.replaceAll("_", " ") || "paket";
}

function proposalGateLabel(status?: string) {
  const labels: Record<string, string> = {
    not_evaluated: "Belum dievaluasi",
    clear: "Lolos otomatis",
    pending_approval: "Menunggu persetujuan manusia",
    approved: "Disetujui manusia",
    rejected: "Ditolak",
    revision_required: "Perlu revisi",
  };
  return labels[status || "not_evaluated"] || status || labels.not_evaluated;
}

function answerSummary(item: Record<string, number | string>) {
  const total = [1, 2, 3, 4, 5].reduce((sum, key) => sum + Number(item[String(key)] || 0), 0);
  const positive = Number(item["4"] || 0) + Number(item["5"] || 0);
  const rawQuestion = String(item.question || "-");
  return {
    label: /^q/i.test(rawQuestion) ? rawQuestion.toUpperCase() : `Q${rawQuestion}`,
    total,
    percent: total ? Math.round((positive / total) * 100) : 0,
  };
}

const proposalContextFields = [
  ["organizationName", "Nama organisasi"],
  ["problemOrNeed", "Masalah / kebutuhan"],
  ["objective", "Tujuan"],
  ["participantEstimate", "Estimasi peserta"],
  ["targetAudience", "Target peserta / pengguna"],
  ["scope", "Scope"],
  ["timeline", "Timeline"],
  ["decisionMakerOrSponsor", "Decision maker / sponsor"],
  ["budgetIndication", "Indikasi / rentang budget"],
  ["deliveryLocationOrMode", "Lokasi / mode delivery"],
  ["expectedOutcome", "Expected outcome"],
  ["nextStep", "Next step"],
] as const;

type ProposalContextKey = typeof proposalContextFields[number][0];
type ProposalContext = Record<ProposalContextKey, string>;

const emptyProposalContext = Object.fromEntries(
  proposalContextFields.map(([key]) => [key, ""]),
) as ProposalContext;

export function AssessmentPanel({
  data,
  records,
  query,
  setQuery,
  category,
  setCategory,
  employeeRange,
  setEmployeeRange,
  minScore,
  setMinScore,
  expandedId,
  setExpandedId,
  onAction,
  onRefresh,
}: {
  data: DashboardData;
  records: AssessmentRecord[];
  query: string;
  setQuery: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  employeeRange: string;
  setEmployeeRange: (value: string) => void;
  minScore: string;
  setMinScore: (value: string) => void;
  expandedId: string | null;
  setExpandedId: (value: string | null) => void;
  onAction: (url: string, init?: RequestInit) => Promise<unknown>;
  onRefresh: () => Promise<void>;
}) {
  const categories = uniqueOptions(data.assessments, (item) => item.category);
  const employeeRanges = uniqueOptions(data.assessments, (item) => item.employees);
  const [actionError, setActionError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [emailPreview, setEmailPreview] = useState<EmailPreview | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [builderId, setBuilderId] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<{ products: CatalogProduct[]; modules: CatalogModule[]; selectedRuleSet?: { version?: string; is_mock?: boolean } } | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [selectedModules, setSelectedModules] = useState<Record<string, number>>({});
  const [scopeType, setScopeType] = useState<"standard" | "custom">("standard");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [proposalRisk, setProposalRisk] = useState("");
  const [proposalNotes, setProposalNotes] = useState("");
  const [proposalContext, setProposalContext] = useState<ProposalContext>(emptyProposalContext);
  const [approvalNotes, setApprovalNotes] = useState<Record<string, string>>({});
  const [selectedDistributionQuestion, setSelectedDistributionQuestion] = useState<number | null>(null);

  const requestAssessmentDocument = async (record: AssessmentRecord, type: AssessmentDocumentType) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      throw new Error("Sesi admin tidak ditemukan.");
    }

    const response = await fetch(`/api/admin/assessments/documents?id=${encodeURIComponent(record.id)}&type=${type}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (type.endsWith("email")) {
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || "Dokumen email tidak tersedia.");
      }
      return json.document as Omit<EmailPreview, "recordName">;
    }

    if (!response.ok) {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await response.json();
        throw new Error(json.error || "Dokumen PDF tidak tersedia.");
      }
      throw new Error("Dokumen PDF tidak tersedia.");
    }

    return response.blob();
  };

  const previewEmail = async (record: AssessmentRecord, type: Extract<AssessmentDocumentType, "result-email" | "proposal-email">) => {
    setActionError("");
    setDocumentId(`${record.id}:${type}`);
    try {
      const document = await requestAssessmentDocument(record, type);
      if (document instanceof Blob) return;
      setEmailPreview({
        recordName: `${record.company} - ${record.name}`,
        ...document,
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal membuka preview email.");
    } finally {
      setDocumentId(null);
    }
  };

  const downloadPdf = async (record: AssessmentRecord, type: Extract<AssessmentDocumentType, "result-pdf" | "proposal-pdf">) => {
    setActionError("");
    setDocumentId(`${record.id}:${type}`);
    try {
      const payload = await requestAssessmentDocument(record, type);
      if (!(payload instanceof Blob)) return;
      const url = URL.createObjectURL(payload);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${type === "result-pdf" ? "Laporan_Diagnostik" : "Proposal_Penawaran"}_${record.company.replace(/[^\w.-]+/g, "_")}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal mengunduh PDF.");
    } finally {
      setDocumentId(null);
    }
  };

  const runAssessmentAction = async (record: AssessmentRecord, action: string) => {
    setActionError("");
    setActionId(`${record.id}:${action}`);
    try {
      await onAction("/api/admin/assessments", {
        method: "POST",
        body: JSON.stringify({ id: record.id, action }),
      });
      await onRefresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal menjalankan tindakan assessment.");
    } finally {
      setActionId(null);
    }
  };

  const openProposalBuilder = async (record: AssessmentRecord) => {
    setActionError("");
    if (builderId !== record.id) {
      setProposalContext({
        ...emptyProposalContext,
        organizationName: record.company || "",
        problemOrNeed: record.challenge || "",
        objective: record.target || "",
      });
    }
    setBuilderId((current) => current === record.id ? null : record.id);
    if (catalog) return;
    setCatalogLoading(true);
    try {
      const result = await onAction("/api/admin/business-rules") as { products?: CatalogProduct[]; modules?: CatalogModule[]; selectedRuleSet?: { version?: string; is_mock?: boolean } };
      setCatalog({ products: result.products || [], modules: result.modules || [], selectedRuleSet: result.selectedRuleSet });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal memuat katalog modul.");
    } finally {
      setCatalogLoading(false);
    }
  };

  const generateProposalDraft = async (record: AssessmentRecord) => {
    const moduleItems = Object.entries(selectedModules)
      .filter(([, quantity]) => quantity > 0)
      .map(([catalogModuleId, quantity]) => ({ catalogModuleId, quantity }));
    if (moduleItems.length === 0) {
      setActionError("Pilih minimal satu modul untuk membuat draft proposal.");
      return;
    }
    setActionError("");
    setActionId(`${record.id}:proposal-draft`);
    try {
      await onAction("/api/admin/proposals/draft", {
        method: "POST",
        body: JSON.stringify({
          assessmentId: record.id,
          moduleItems,
          scopeType,
          discountPercent: Number(discountPercent || 0),
          riskFlags: proposalRisk.trim() ? [proposalRisk.trim()] : [],
          notes: proposalNotes,
          proposalContext,
        }),
      });
      setBuilderId(null);
      await onRefresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal membuat draft proposal.");
    } finally {
      setActionId(null);
    }
  };

  const decideProposal = async (record: AssessmentRecord, decision: "approve" | "reject" | "request_revision") => {
    setActionError("");
    setActionId(`${record.id}:proposal-${decision}`);
    try {
      await onAction("/api/admin/proposals/approval", {
        method: "POST",
        body: JSON.stringify({ assessmentId: record.id, decision, note: approvalNotes[record.id] || "" }),
      });
      await onRefresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal menyimpan keputusan proposal.");
    } finally {
      setActionId(null);
    }
  };

  const downloadDraftProposal = async (record: AssessmentRecord) => {
    setActionError("");
    setDocumentId(`${record.id}:proposal-draft-pdf`);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Sesi admin tidak ditemukan.");
      const response = await fetch(`/api/admin/proposals/preview?assessmentId=${encodeURIComponent(record.id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json.error || "Preview proposal tidak tersedia.");
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `Draft_Proposal_${record.company.replace(/[^\w.-]+/g, "_")}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal mengunduh draft proposal.");
    } finally {
      setDocumentId(null);
    }
  };

  const sendAssessmentFollowUp = async (
    record: AssessmentRecord,
    channel: "result" | "proposal",
    level: number
  ) => {
    setActionError("");
    setActionId(`${record.id}:${channel}:follow_up_${level}`);
    try {
      await onAction("/api/admin/follow-up", {
        method: "POST",
        body: JSON.stringify({ assessmentId: record.id, channel, level }),
      });
      await onRefresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal mengirim follow up assessment.");
    } finally {
      setActionId(null);
    }
  };

  const saveAssessmentStatus = async (record: AssessmentRecord, assessmentStatus: string, proposalStatus: string) => {
    setActionError("");
    setActionId(`${record.id}:status`);
    try {
      await onAction("/api/admin/assessments", {
        method: "PATCH",
        body: JSON.stringify({ id: record.id, assessmentStatus, proposalStatus }),
      });
      await onRefresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal memperbarui status assessment.");
    } finally {
      setActionId(null);
    }
  };

  const toggleAssessmentFollowUp = async (record: AssessmentRecord) => {
    setActionError("");
    setActionId(`${record.id}:follow-up-pause`);
    try {
      await onAction("/api/admin/assessments", {
        method: "PATCH",
        body: JSON.stringify({
          id: record.id,
          assessmentStatus: record.assessmentStatus,
          proposalStatus: record.proposalStatus,
          followUpPaused: !record.followUpPaused,
        }),
      });
      await onRefresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal mengubah jeda follow up assessment.");
    } finally {
      setActionId(null);
    }
  };

  const resultFollowUpDue = records.filter(
    (record) => daysSince(record.resultEmailSentAt || record.createdAt) >= 2 && !/closed|deal|lost|lanjut diskusi/i.test(`${record.assessmentStatus} ${record.proposalStatus}`)
  ).length;
  const proposalFollowUpDue = records.filter(
    (record) => record.proposalSentAt && daysSince(record.proposalSentAt) >= 2 && !/closed|deal|lost|lanjut diskusi/i.test(record.proposalStatus || "")
  ).length;
  const highPotential = records.filter((record) => Number(record.overallScore || 0) >= 70).length;

  return (
    <div className="space-y-6">
      {confirmAction && (
        <ConfirmDialog
          action={confirmAction}
          onClose={() => setConfirmAction(null)}
        />
      )}
      {emailPreview && <EmailPreviewModal preview={emailPreview} onClose={() => setEmailPreview(null)} />}
      {actionError && <AdminNotice>{actionError}</AdminNotice>}
      <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_150px_auto]">
        <div className="relative max-w-md flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama, email, perusahaan, kategori..."
            className="h-12 w-full rounded-[12px] border border-black/10 bg-white pl-11 pr-4 text-sm outline-none focus:border-[#D9A441]"
          />
        </div>
        <AdminSelect value={category} onChange={setCategory} options={["Semua", ...categories]} />
        <AdminSelect value={employeeRange} onChange={setEmployeeRange} options={["Semua", ...employeeRanges]} />
        <AdminSelect
          value={minScore}
          onChange={setMinScore}
          options={[
            ["0", "Skor 0+"],
            ["50", "Skor 50+"],
            ["70", "Skor 70+"],
            ["85", "Skor 85+"],
          ]}
        />
        <button
          onClick={() =>
            exportCsv(
              "binahub-assessments.csv",
              records.map((item) => ({
                name: item.name,
                email: item.email,
                company: item.company,
                role: item.role,
                employees: item.employees,
                category: item.category,
                overallScore: item.overallScore,
                createdAt: item.createdAt,
              }))
            )
          }
          className="flex h-12 items-center justify-center gap-2 rounded-[12px] border border-black/10 bg-white px-4 text-xs font-bold uppercase tracking-[0.14em]"
        >
          <Download size={15} /> CSV
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Result perlu follow up", value: resultFollowUpDue, action: () => setQuery("Result Follow Up") },
          { label: "Proposal perlu follow up", value: proposalFollowUpDue, action: () => setQuery("Proposal Follow Up") },
          { label: "High potential", value: highPotential, action: () => setMinScore("70") },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.action}
            className="rounded-[12px] border border-black/[0.05] bg-white p-4 text-left transition hover:border-[#D9A441]/40 hover:bg-[#FFF8EA]"
          >
            <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-black/38">{item.label}</span>
            <span className="mt-2 block text-3xl font-light tracking-[-0.04em] text-[#0B2C6B]">{item.value}</span>
          </button>
        ))}
      </div>

      <Panel title="Distribusi jawaban" action="Persentase jawaban 4–5">
        {data.answerDistribution.length === 0 ? (
          <EmptyState title="Belum ada distribusi jawaban" description="Grafik akan muncul setelah assessment pertama berhasil disubmit." />
        ) : (
          <>
            <div className="overflow-x-auto pb-2" aria-label="Distribusi jawaban per pertanyaan">
              <div className="flex min-w-max items-end gap-2 px-1 pt-2">
              {data.answerDistribution.map((item) => {
                const summary = answerSummary(item);
                return (
                  <button type="button" key={String(item.question)} onClick={() => setSelectedDistributionQuestion(Number(String(item.question).replace(/\D/g, "")))} className="group flex w-5 shrink-0 flex-col items-center text-center" aria-label={`Lihat isi ${summary.label}: ${summary.percent}% menjawab 4 atau 5 dari ${summary.total} respons`}>
                    <div className="flex h-20 w-5 items-end rounded-sm bg-slate-100 px-0.5 transition group-hover:bg-blue-100 group-focus-visible:ring-2 group-focus-visible:ring-blue-700 group-focus-visible:ring-offset-2" role="img" aria-label={`${summary.label}: ${summary.percent}% menjawab 4 atau 5`}>
                      <div className="w-full rounded-[2px] bg-blue-900 transition-colors group-hover:bg-blue-700" style={{ height: `${Math.max(summary.percent, 3)}%` }} />
                    </div>
                    <span className="mt-1 text-[8px] font-bold leading-none text-slate-500">{summary.label}</span>
                    <span className="mt-1 text-[9px] font-bold leading-none tabular-nums text-blue-950">{summary.percent}%</span>
                  </button>
                );
              })}
              </div>
            </div>
            {selectedDistributionQuestion && <div className="mt-4 flex items-start gap-3 border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950" role="status"><span className="shrink-0 bg-blue-900 px-2 py-1 text-[10px] font-bold text-white">Q{selectedDistributionQuestion}</span><p className="min-w-0 flex-1 leading-6">{QUESTIONS.find((question) => question.id === selectedDistributionQuestion)?.text || "Pertanyaan tidak ditemukan."}</p><button type="button" onClick={() => setSelectedDistributionQuestion(null)} aria-label="Tutup pertanyaan" className="grid h-8 w-8 shrink-0 place-items-center text-blue-900 hover:bg-blue-100"><X className="h-4 w-4" /></button></div>}
          </>
        )}
      </Panel>

      <div className="overflow-x-auto rounded-[8px] border border-black/[0.06] bg-white">
        <div className="grid min-w-[760px] grid-cols-[1.25fr_1fr_0.75fr_0.65fr_44px] border-b border-black/[0.06] bg-[#FAFAF8] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-black/42">
          <span>Klien</span>
          <span>Perusahaan</span>
          <span>Status</span>
          <span>Skor</span>
          <span />
        </div>
        {records.map((record) => {
          const isOpen = expandedId === record.id;
          const proposalCanSend = ["approved", "clear"].includes(record.proposalGateStatus || "") && !record.proposalDraft?.isSimulation;
          return (
            <div key={record.id} className="border-b border-black/[0.05] last:border-0">
              <button
                onClick={() => setExpandedId(isOpen ? null : record.id)}
                className="grid min-w-[760px] w-full grid-cols-[1.25fr_1fr_0.75fr_0.65fr_44px] items-center gap-4 px-5 py-4 text-left transition hover:bg-[#F8FAFC]"
              >
                <span>
                  <span className="block text-sm font-semibold text-[#0B2C6B]">{record.name}</span>
                  <span className="text-xs text-black/42">{record.email}</span>
                </span>
                <span className="text-sm text-black/62">{record.company}</span>
                <span>
                  <span className="block text-sm font-medium text-[#0B2C6B]">{record.assessmentStatus}</span>
                  <span className="text-xs text-black/42">{record.proposalStatus}</span>
                </span>
                <span className="text-2xl font-light tracking-[-0.04em]">{record.overallScore}</span>
                <ChevronDown size={17} className={`transition ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="grid gap-6 bg-[#FAFAF8] px-5 py-6 lg:grid-cols-[0.8fr_1.2fr]">
                  <div className="rounded-[12px] border border-black/[0.05] bg-white p-5">
                    <h4 className="mb-4 text-sm font-semibold">Skor Dimensi</h4>
                    <div className="space-y-3">
                      {Object.entries(record.scores)
                        .filter(([key]) => key !== "overall")
                        .map(([dimension, value]) => (
                          <MetricBar key={dimension} label={dimension} value={Number(value)} />
                        ))}
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div className="rounded-[12px] border border-black/[0.05] bg-white p-5">
                      <h4 className="mb-3 text-sm font-semibold">Tindakan Assessment</h4>
                      <div className="mb-4 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.12em]">
                        <span className="rounded-full bg-[#0B2C6B]/8 px-3 py-1.5 text-[#0B2C6B]">
                          {record.lifecycleStage || "prospect"}
                        </span>
                        <span className="rounded-full bg-[#D9A441]/14 px-3 py-1.5 text-[#7A5A16]">
                          {record.leadTemperature || record.leadStatus || "belum dinilai"}
                          {typeof record.leadScore === "number" ? ` · ${record.leadScore}` : ""}
                        </span>
                        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">
                          {record.opportunityStage || "identified"}
                        </span>
                      </div>
                      <div className="mb-4 grid gap-2 rounded-[10px] border border-slate-200 bg-white p-3 text-xs text-slate-600 sm:grid-cols-2 xl:grid-cols-3">
                        <span>Industri: <strong>{record.industry || "-"}</strong></span>
                        <span>Lokasi: <strong>{record.location || "-"}</strong></span>
                        <span>Timeline: <strong>{record.timeline?.replaceAll("_", "-") || "unknown"}</strong></span>
                        <span>Budget: <strong>{record.budgetStatus?.replaceAll("_", " ") || "unknown"}</strong></span>
                        <span>Sponsor: <strong>{record.sponsorStatus?.replaceAll("_", " ") || "unknown"}</strong></span>
                        <span>Intent: <strong>{record.nextStepIntent?.replaceAll("_", " ") || "explore"}</strong></span>
                      </div>
                      {(record.leadScoreReason || record.leadScoreRuleVersion) && (
                        <div className="mb-4 rounded-[10px] border border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-600">
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            <span>Confidence: <strong>{typeof record.leadScoreConfidence === "number" ? `${Math.round(record.leadScoreConfidence * 100)}%` : "-"}</strong></span>
                            <span>Sinyal minat: <strong>{record.leadScoreEvidence?.buyingSignalCount ?? "-"}</strong></span>
                            <span>Versi aturan: <strong>{record.leadScoreRuleVersion || "-"}</strong></span>
                          </div>
                          {record.leadScoreReason && <p className="mt-1">{record.leadScoreReason}</p>}
                          {(record.leadScoreEvidence?.missingData || []).length > 0 && (
                            <p className="mt-1 text-amber-700">Data belum lengkap: {record.leadScoreEvidence?.missingData?.join(", ")}</p>
                          )}
                          {(record.leadScoreEvidence?.exclusionReasons || []).length > 0 && (
                            <p className="mt-1 font-semibold text-red-700">Kelayakan profil: {record.leadScoreEvidence?.exclusionReasons?.join(" ")}</p>
                          )}
                        </div>
                      )}
                      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                        <AdminSelect
                          value={record.assessmentStatus}
                          onChange={(value) => saveAssessmentStatus(record, value, record.proposalStatus)}
                          options={[
                            "Result Otomatis Terkirim",
                            "Result Email Terkirim",
                            "Minta Proposal",
                            "Proposal Terkirim",
                            "Follow Up",
                            "Result Follow Up 1 Terkirim",
                            "Result Follow Up 2 Terkirim",
                            "Result Follow Up 3 Terkirim",
                            "Lanjut Diskusi",
                            "Closed",
                          ]}
                        />
                        <AdminSelect
                          value={record.proposalStatus}
                          onChange={(value) => saveAssessmentStatus(record, record.assessmentStatus, value)}
                          options={[
                            "Belum Diminta",
                            "Diminta",
                            "Sedang Disusun",
                            "Draft Simulasi",
                            "Menunggu Approval",
                            "Disetujui",
                            "Terkirim",
                            "Proposal Follow Up 1 Terkirim",
                            "Proposal Follow Up 2 Terkirim",
                            "Proposal Follow Up 3 Terkirim",
                            "Revisi",
                            "Lanjut Diskusi",
                            "Deal",
                            "Lost",
                            "Closed",
                          ]}
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmAction({
                                title: "Kirim ulang result assessment?",
                                description: "Email result assessment akan dikirim ke klien ini. Pastikan data kontak dan analisis sudah benar.",
                                confirmLabel: "Kirim Result",
                                tone: "gold",
                                details: [`Klien: ${record.name}`, `Email: ${record.email}`, `Perusahaan: ${record.company}`],
                                onConfirm: () => runAssessmentAction(record, "resend_result"),
                              })
                            }
                            disabled={actionId === `${record.id}:resend_result`}
                            className="h-12 rounded-[10px] border border-black/10 bg-white px-3 text-xs font-bold uppercase tracking-[0.12em] disabled:opacity-50"
                          >
                            Kirim Result
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmAction({
                                title: "Tandai permintaan proposal?",
                                description: "Status assessment akan dipindahkan ke alur proposal agar tim bisa menyiapkan penawaran.",
                                confirmLabel: "Minta Proposal",
                                details: [`Klien: ${record.name}`, `Kategori: ${record.category}`, `Skor: ${record.overallScore}`],
                                onConfirm: () => runAssessmentAction(record, "request_proposal"),
                              })
                            }
                            disabled={actionId === `${record.id}:request_proposal`}
                            className="h-12 rounded-[10px] border border-[#D9A441]/40 bg-[#FFF8EA] px-3 text-xs font-bold uppercase tracking-[0.12em] text-[#9B6C17] disabled:opacity-50"
                          >
                            Minta Proposal
                          </button>
                          <button
                            type="button"
                            onClick={() => void openProposalBuilder(record)}
                            disabled={catalogLoading}
                            className="h-12 rounded-[10px] border border-[#0B2C6B]/20 bg-[#EAF0F7] px-3 text-xs font-bold uppercase tracking-[0.12em] text-[#0B2C6B] disabled:opacity-50"
                          >
                            {builderId === record.id ? "Tutup Draft" : "Siapkan Draft"}
                          </button>
                          <button
                            onClick={() =>
                              setConfirmAction({
                                title: "Kirim proposal ke klien?",
                                description: "Proposal dari katalog yang sudah memperoleh persetujuan manual akan dikirim ke email klien.",
                                confirmLabel: "Kirim Proposal",
                                tone: "gold",
                                details: [`Klien: ${record.name}`, `Email: ${record.email}`, `Status persetujuan: ${record.proposalGateStatus || "belum dievaluasi"}`, `Katalog: ${record.proposalCatalogVersion || "-"}`],
                                onConfirm: () => runAssessmentAction(record, "send_proposal"),
                              })
                            }
                            disabled={actionId === `${record.id}:send_proposal` || !proposalCanSend}
                            title={record.proposalDraft?.isSimulation ? "Pengiriman proposal simulasi dinonaktifkan." : !proposalCanSend ? "Selesaikan draf dan persetujuan manual terlebih dahulu." : undefined}
                            className="h-12 rounded-[10px] bg-[#0B2C6B] px-3 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50"
                          >
                            Kirim Proposal
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 rounded-[12px] border border-black/[0.07] bg-[#F8FAFC] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#D9A441]">Persetujuan Manual</p>
                            <p className="mt-1 text-sm font-semibold text-[#0B2C6B]">{proposalGateLabel(record.proposalGateStatus)}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {record.proposalDraft && (
                              <button
                                type="button"
                                onClick={() => void downloadDraftProposal(record)}
                                disabled={documentId === `${record.id}:proposal-draft-pdf`}
                                className="rounded-[9px] border border-black/10 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#0B2C6B] disabled:opacity-50"
                              >
                                Preview PDF
                              </button>
                            )}
                            {record.proposalGateStatus === "pending_approval" && (
                              <>
                                <button type="button" disabled={(approvalNotes[record.id] || "").trim().length < 5} onClick={() => void decideProposal(record, "approve")} className="rounded-[9px] bg-emerald-600 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:opacity-40">Setujui</button>
                                <button type="button" onClick={() => void decideProposal(record, "request_revision")} className="rounded-[9px] border border-amber-300 bg-amber-50 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-800">Minta Revisi</button>
                                <button type="button" onClick={() => void decideProposal(record, "reject")} className="rounded-[9px] border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-red-700">Tolak</button>
                              </>
                            )}
                          </div>
                        </div>
                        {record.proposalDraft?.isSimulation && (
                          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">SIMULASI — pengiriman eksternal dinonaktifkan sampai katalog dan aturan bisnis resmi disetujui.</p>
                        )}
                        {(record.proposalGateReasons || []).length > 0 && (
                          <ul className="mt-3 space-y-1 text-xs leading-5 text-slate-600">
                            {(record.proposalGateReasons || []).map((reason) => <li key={reason.code}>• {reason.message}</li>)}
                          </ul>
                        )}
                        {record.proposalGateStatus === "pending_approval" && (
                          <label className="mt-3 block text-xs font-semibold text-slate-600">Catatan keputusan
                            <textarea
                              value={approvalNotes[record.id] || ""}
                              onChange={(event) => setApprovalNotes((current) => ({ ...current, [record.id]: event.target.value }))}
                              rows={2}
                              placeholder="Wajib diisi sebelum menyetujui proposal."
                              className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-3 font-normal"
                            />
                          </label>
                        )}
                        {(record.proposalDraft?.requiredDataMissing || []).length > 0 && (
                          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                            Data wajib belum lengkap: {record.proposalDraft?.requiredDataMissing?.join(", ")}.
                          </p>
                        )}
                        {record.proposalDraft?.commercials && (
                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
                            <span>Versi: <strong>{record.proposalDraft.rulesVersion || record.proposalCatalogVersion}</strong></span>
                            <span>Subtotal: <strong>{formatCurrency(record.proposalDraft.commercials.subtotal || 0)}</strong></span>
                            <span>Total sebelum pajak: <strong>{formatCurrency(record.proposalDraft.commercials.totalBeforeTax || 0)}</strong></span>
                            <span>Target peninjauan: <strong>{record.proposalDraft.reviewSlaBusinessDays || 1} hari kerja</strong></span>
                          </div>
                        )}
                      </div>
                      {builderId === record.id && (
                        <div className="mt-4 rounded-[12px] border border-[#0B2C6B]/15 bg-white p-4">
                          <div className="mb-3">
                            <h5 className="text-sm font-semibold text-[#0B2C6B]">Konfigurasi Modul Proposal</h5>
                            <p className="mt-1 text-xs leading-5 text-slate-500">Harga dihitung dari modul. Modul yang belum siap selalu memerlukan persetujuan manual.</p>
                          </div>
                          {catalogLoading ? <p className="text-xs text-slate-500">Memuat katalog...</p> : (
                            <div className="space-y-2">
                              {(catalog?.modules || []).filter((module) => module.active).map((module) => {
                                const product = catalog?.products.find((item) => item.id === module.product_id);
                                const selected = (selectedModules[module.id] || 0) > 0;
                                return (
                                  <label key={module.id} className="grid gap-2 rounded-[10px] border border-black/[0.07] p-3 md:grid-cols-[24px_1fr_110px] md:items-center">
                                    <input
                                      type="checkbox"
                                      checked={selected}
                                      onChange={(event) => setSelectedModules((current) => ({ ...current, [module.id]: event.target.checked ? 1 : 0 }))}
                                    />
                                    <span>
                                      <span className="block text-xs font-semibold text-[#0B2C6B]">{product?.name || "Produk"} · {module.name}</span>
                                      <span className="mt-0.5 block text-[11px] text-slate-500">{formatCurrency(Number(module.base_price || 0))} / {pricingUnitLabel(module.pricing_unit)} · {module.is_mock ? "Belum dapat ditawarkan" : moduleReadinessLabel(module.readiness_status)}</span>
                                    </span>
                                    <input
                                      type="number"
                                      min={1}
                                      max={1000}
                                      disabled={!selected}
                                      value={selected ? selectedModules[module.id] : 1}
                                      onChange={(event) => setSelectedModules((current) => ({ ...current, [module.id]: Math.max(1, Number(event.target.value || 1)) }))}
                                      className="h-9 rounded-lg border border-slate-200 px-3 text-xs disabled:bg-slate-100"
                                      aria-label={`Jumlah ${module.name}`}
                                    />
                                  </label>
                                );
                              })}
                            </div>
                          )}
                          <div className="mt-4 grid gap-3 md:grid-cols-3">
                            <label className="text-xs font-semibold text-slate-600">Jenis cakupan
                              <select value={scopeType} onChange={(event) => setScopeType(event.target.value as "standard" | "custom")} className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-normal">
                                <option value="standard">Standar</option><option value="custom">Custom</option>
                              </select>
                            </label>
                            <label className="text-xs font-semibold text-slate-600">Diskon (%)
                              <input type="number" min={0} max={100} value={discountPercent} onChange={(event) => setDiscountPercent(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-normal" />
                            </label>
                            <label className="text-xs font-semibold text-slate-600">Catatan risiko (opsional)
                              <input value={proposalRisk} onChange={(event) => setProposalRisk(event.target.value)} placeholder="Legal, reputasi, komersial..." className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-normal" />
                            </label>
                          </div>
                          <div className="mt-4">
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                              <h6 className="text-xs font-bold uppercase tracking-[0.12em] text-[#0B2C6B]">Data wajib proposal</h6>
                              <span className="text-[11px] text-slate-500">Tidak boleh dikosongkan pada proposal final</span>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              {proposalContextFields.map(([key, label]) => (
                                <label key={key} className="text-xs font-semibold text-slate-600">{label}
                                  <textarea
                                    value={proposalContext[key]}
                                    onChange={(event) => setProposalContext((current) => ({ ...current, [key]: event.target.value }))}
                                    rows={2}
                                    className="mt-1 w-full rounded-lg border border-slate-200 p-3 font-normal"
                                  />
                                </label>
                              ))}
                            </div>
                          </div>
                          <label className="mt-3 block text-xs font-semibold text-slate-600">Catatan peninjau
                            <textarea value={proposalNotes} onChange={(event) => setProposalNotes(event.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-slate-200 p-3 font-normal" />
                          </label>
                          <div className="mt-3 flex justify-end">
                          <button type="button" onClick={() => void generateProposalDraft(record)} disabled={actionId === `${record.id}:proposal-draft`} className="rounded-[9px] bg-[#0B2C6B] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50">Buat Draf & Periksa Persetujuan</button>
                          </div>
                        </div>
                      )}
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => void toggleAssessmentFollowUp(record)}
                          disabled={actionId === `${record.id}:follow-up-pause`}
                          className="inline-flex min-h-9 items-center gap-2 rounded-[9px] border border-black/10 bg-white px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#0B2C6B] disabled:opacity-50"
                        >
                          {record.followUpPaused ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
                          {record.followUpPaused ? "Lanjutkan semua follow up" : "Jeda semua follow up"}
                        </button>
                      </div>
                      <div className="mt-3 grid gap-3 xl:grid-cols-2">
                        <AssessmentFollowUpBox
                          title="Follow Up Result"
                          description="H+2 memastikan result masuk dan terbaca, H+7 soft push diskusi, H+14 hard push keputusan."
                          record={record}
                          channel="result"
                          actionId={actionId}
                          disabled={record.followUpPaused || (!record.resultEmailSentAt && record.assessmentStatus !== "Result Otomatis Terkirim")}
                          onSend={(target, channel, level) =>
                            setConfirmAction({
                              title: `Kirim follow up result level ${level}?`,
                              description: "Email follow-up akan dibuat dengan bantuan AI dan dikirim ke klien assessment ini.",
                              confirmLabel: `Kirim Follow Up ${level}`,
                              tone: "gold",
                              details: [`Klien: ${target.name}`, `Email: ${target.email}`, `Terakhir level: ${target.resultFollowUpLevel || 0}`],
                              onConfirm: () => sendAssessmentFollowUp(target, channel, level),
                            })
                          }
                        />
                        <AssessmentFollowUpBox
                          title="Follow Up Proposal"
                          description="H+2 memastikan proposal diterima, H+7 dorong jadwal diskusi, H+14 final push keputusan lanjut atau tidak."
                          record={record}
                          channel="proposal"
                          actionId={actionId}
                          disabled={record.followUpPaused || !record.proposalSentAt}
                          onSend={(target, channel, level) =>
                            setConfirmAction({
                              title: `Kirim follow up proposal level ${level}?`,
                              description: "Email follow-up proposal akan dibuat dengan bantuan AI dan dikirim ke klien.",
                              confirmLabel: `Kirim Follow Up ${level}`,
                              tone: "gold",
                              details: [`Klien: ${target.name}`, `Email: ${target.email}`, `Terakhir level: ${target.proposalFollowUpLevel || 0}`],
                              onConfirm: () => sendAssessmentFollowUp(target, channel, level),
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="rounded-[12px] border border-black/[0.05] bg-white p-5">
                      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h4 className="text-sm font-semibold">Dokumen & Email</h4>
                          <p className="mt-1 text-xs leading-relaxed text-black/45">
                            Lihat salinan email dan unduh dokumen yang telah disiapkan untuk klien.
                          </p>
                        </div>
                        <span className="rounded-full bg-[#F5F7FA] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-black/42">
                          Arsip komunikasi
                        </span>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <DocumentActionButton
                          icon={Eye}
                          label="Lihat Email Result"
                          disabled={documentId === `${record.id}:result-email`}
                          onClick={() => previewEmail(record, "result-email")}
                        />
                        <DocumentActionButton
                          icon={Download}
                          label="PDF Result"
                          disabled={documentId === `${record.id}:result-pdf`}
                          onClick={() => downloadPdf(record, "result-pdf")}
                        />
                        <DocumentActionButton
                          icon={Eye}
                          label="Lihat Email Proposal"
                          disabled={documentId === `${record.id}:proposal-email`}
                          onClick={() => previewEmail(record, "proposal-email")}
                        />
                        <DocumentActionButton
                          icon={FileText}
                          label="PDF Proposal"
                          disabled={documentId === `${record.id}:proposal-pdf`}
                          onClick={() => downloadPdf(record, "proposal-pdf")}
                        />
                      </div>
                      {!record.proposalSentAt && (
                        <p className="mt-3 text-xs leading-relaxed text-black/42">
                          Proposal akan tersedia setelah proposal dibuat atau dikirim dari tombol tindakan.
                        </p>
                      )}
                      {(!record.resultEmailId || (record.proposalSentAt && !record.proposalEmailId)) && (
                        <p className="mt-3 text-xs leading-relaxed text-black/42">
                          Sebagian arsip lama belum memiliki salinan email. Kirim ulang hasil satu kali bila salinan perlu ditampilkan di sini.
                        </p>
                      )}
                    </div>
                    <div>
                      <h4 className="mb-2 text-sm font-semibold">Analisis AI</h4>
                      <p className="text-sm font-light leading-relaxed text-black/58">
                        {record.aiAnalysis || "Belum ada analisis AI."}
                      </p>
                    </div>
                    <div>
                      <h4 className="mb-3 text-sm font-semibold">Rekomendasi</h4>
                      <div className="grid gap-3 md:grid-cols-2">
                        {record.recommendations.map((rec, index) => (
                          <div key={`${record.id}-${index}`} className="rounded-[12px] border border-black/[0.05] bg-white p-4">
                            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D9A441]">
                              {rec.service || "Service"}
                            </span>
                            <p className="mt-2 text-sm font-semibold">{rec.title}</p>
                            <p className="mt-2 text-xs leading-relaxed text-black/52">{rec.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {records.length === 0 && (
          <div className="p-5">
            <EmptyState
              title="Tidak ada assessment yang cocok dengan filter."
              description="Ubah kata kunci, kategori, ukuran perusahaan, atau batas skor untuk melihat data assessment lain."
              action={{
                label: "Reset Filter",
                onClick: () => {
                  setQuery("");
                  setCategory("Semua");
                  setEmployeeRange("Semua");
                  setMinScore("0");
                },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentActionButton({
  icon: Icon,
  label,
  disabled,
  onClick,
}: {
  icon: typeof Eye;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-12 items-center justify-center gap-2 rounded-[10px] border border-black/10 bg-[#FCFCFB] px-3 text-xs font-bold uppercase tracking-[0.12em] text-[#0B2C6B] transition hover:border-[#D9A441]/50 hover:bg-[#FFF8EA] disabled:cursor-wait disabled:opacity-50"
    >
      <Icon size={15} />
      {disabled ? "Memuat..." : label}
    </button>
  );
}

function AssessmentFollowUpBox({
  title,
  description,
  record,
  channel,
  actionId,
  disabled,
  onSend,
}: {
  title: string;
  description: string;
  record: AssessmentRecord;
  channel: "result" | "proposal";
  actionId: string | null;
  disabled: boolean;
  onSend: (record: AssessmentRecord, channel: "result" | "proposal", level: number) => void;
}) {
  return (
    <div className="rounded-[12px] border border-black/[0.05] bg-[#FAFAF8] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0B2C6B]">{title}</p>
          <p className="mt-2 text-xs leading-relaxed text-black/50">{description}</p>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-black/34">
            Terakhir: level {channel === "result" ? record.resultFollowUpLevel || 0 : record.proposalFollowUpLevel || 0}
          </p>
        </div>
        <Badge tone={disabled ? "navy" : "gold"}>{disabled ? "Belum siap" : "Ready"}</Badge>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(channel === "proposal" ? FOLLOW_UP_LEVELS.slice(0, 1) : FOLLOW_UP_LEVELS).map((item) => {
          const id = `${record.id}:${channel}:follow_up_${item.level}`;
          const currentLevel = channel === "result" ? record.resultFollowUpLevel || 0 : record.proposalFollowUpLevel || 0;
          const sent = item.level <= currentLevel;
          const isNext = item.level === currentLevel + 1;
          return (
            <button
              key={item.level}
              type="button"
              onClick={() => onSend(record, channel, item.level)}
              disabled={disabled || sent || !isNext || actionId === id}
              className="h-9 rounded-[9px] border border-black/10 bg-white px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#0B2C6B] transition hover:border-[#D9A441]/45 hover:bg-[#FFF8EA] disabled:opacity-50"
            >
              {actionId === id ? "Kirim..." : sent ? "Terkirim" : !isNext ? "Terkunci" : item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EmailPreviewModal({
  preview,
  onClose,
}: {
  preview: EmailPreview;
  onClose: () => void;
}) {
  const dialogRef = useDialogFocus<HTMLDivElement>(onClose);
  return (
    <div className="fixed inset-0 z-50 bg-[#071B3D]/55 px-4 py-6 backdrop-blur-sm">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="email-preview-title" className="mx-auto flex h-full max-w-5xl flex-col overflow-hidden rounded-[16px] bg-white shadow-[0_40px_100px_-40px_rgba(7,27,61,0.55)]">
        <div className="flex flex-col gap-4 border-b border-black/[0.06] bg-[#FAFAF8] px-5 py-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D9A441]">Pratinjau Email</p>
            <h2 id="email-preview-title" className="mt-1 text-lg font-semibold text-[#0B2C6B]">{preview.subject}</h2>
            <p className="mt-1 text-xs text-black/45">{preview.recordName}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-black/45">
              {preview.lastEvent && <span className="rounded-full bg-white px-2 py-1">Status: {preview.lastEvent}</span>}
              {preview.createdAt && <span className="rounded-full bg-white px-2 py-1">Dikirim: {formatDate(preview.createdAt)}</span>}
            </div>
          </div>
          <button
            type="button"
            data-autofocus
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-[10px] border border-black/10 bg-white text-[#0B2C6B]"
            aria-label="Tutup preview email"
          >
            <X size={17} />
          </button>
        </div>
        <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[240px_1fr]">
          <aside className="border-b border-black/[0.06] bg-white p-5 lg:border-b-0 lg:border-r">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/40">Lampiran</p>
            <div className="mt-3 space-y-2">
              {(preview.from || preview.to?.length) && (
                <div className="rounded-[10px] border border-black/[0.06] bg-white p-3">
                  {preview.from && <p className="break-all text-[11px] leading-relaxed text-black/50">From: {preview.from}</p>}
                  {preview.to?.length ? <p className="mt-1 break-all text-[11px] leading-relaxed text-black/50">To: {preview.to.join(", ")}</p> : null}
                </div>
              )}
              {preview.attachments.map((attachment) => (
                <div key={attachment.id || attachment.filename} className="rounded-[10px] border border-black/[0.06] bg-[#F5F7FA] p-3">
                  <p className="text-xs font-semibold text-[#0B2C6B]">{attachment.label}</p>
                  <p className="mt-1 break-all text-[11px] leading-relaxed text-black/45">{attachment.filename}</p>
                  {attachment.size ? (
                    <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-black/35">
                      {Math.round(attachment.size / 1024)} KB
                    </p>
                  ) : null}
                </div>
              ))}
              {!preview.attachments.length && (
                <p className="rounded-[10px] border border-black/[0.06] bg-[#F5F7FA] p-3 text-xs leading-relaxed text-black/45">
                  Tidak ada lampiran pada email ini.
                </p>
              )}
            </div>
          </aside>
          <div className="min-h-0 bg-[#E2E8F0] p-3">
            <iframe
              title="Preview isi email"
              srcDoc={preview.html}
              sandbox=""
              className="h-full min-h-[520px] w-full rounded-[10px] border border-black/10 bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
