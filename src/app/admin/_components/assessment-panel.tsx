"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Download, Eye, FileText, LoaderCircle, PauseCircle, PlayCircle, Search, SlidersHorizontal, X } from "lucide-react";
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
import { exportCsv, formatDate, uniqueOptions } from "../_lib/utils";
import type { AssessmentDocumentType, AssessmentRecord, CatalogModule, CatalogProduct, ConfirmAction, DashboardData, EmailPreview } from "../_lib/types";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { QUESTIONS } from "@/app/insight/questions";
import { assessmentLabel, dueFollowUp, matchesQueue, needsAttention, profileLabel, proposalState, type AssessmentDetailTab, type AssessmentQueue } from "../_lib/assessment-presentation";

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

function proposalModuleSuggestions(record: AssessmentRecord, products: CatalogProduct[], modules: CatalogModule[]) {
  const serviceKeys = new Set(record.recommendations
    .map((recommendation) => String(recommendation.service || "").toLocaleLowerCase("id-ID").replace(/[^a-z0-9]+/g, ""))
    .filter(Boolean));
  return modules.filter((module) => {
    const product = products.find((item) => item.id === module.product_id);
    const productKey = String(product?.product_key || "").toLocaleLowerCase("id-ID").replace(/[^a-z0-9]+/g, "");
    const productName = String(product?.name || "").toLocaleLowerCase("id-ID").replace(/[^a-z0-9]+/g, "");
    return module.active && module.readiness_status === "ready" && !module.is_mock
      && Array.from(serviceKeys).some((service) => productKey === service || productKey === `bina${service}` || productName === service || productName === `bina${service}`);
  }).slice(0, 2);
}

function proposalGateLabel(status?: string) {
  const labels: Record<string, string> = {
    not_evaluated: "Belum dievaluasi",
    clear: "Siap dikirim",
    pending_approval: "Menunggu keputusan penanggung jawab",
    approved: "Draf disetujui",
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
  ["scope", "Ruang lingkup"],
  ["timeline", "Jadwal pelaksanaan"],
  ["decisionMakerOrSponsor", "Penanggung jawab"],
  ["budgetIndication", "Perkiraan anggaran"],
  ["deliveryLocationOrMode", "Lokasi / cara pelaksanaan"],
  ["expectedOutcome", "Hasil yang diharapkan"],
  ["nextStep", "Langkah berikutnya"],
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
  const [discountPercent, setDiscountPercent] = useState("0");
  const [proposalRisk, setProposalRisk] = useState("");
  const [proposalNotes, setProposalNotes] = useState("");
  const [proposalContext, setProposalContext] = useState<ProposalContext>(emptyProposalContext);
  const [approvalNotes, setApprovalNotes] = useState<Record<string, string>>({});
  const tabId = useId();
  const detailHeadingRef = useRef<HTMLHeadingElement>(null);
  const clientListRef = useRef<HTMLElement>(null);
  const [detailTab, setDetailTab] = useState<AssessmentDetailTab>("summary");
  const [queue, setQueue] = useState<AssessmentQueue>("all");
  const [sort, setSort] = useState("latest");
  const [actionSuccess, setActionSuccess] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(20);
  const [selectedDistributionQuestion, setSelectedDistributionQuestion] = useState<number | null>(null);

  const hasProcessingProposal = records.some((record) => !record.proposalSentAt && ["Diminta", "Sedang Disusun"].includes(record.proposalStatus));
  useEffect(() => {
    if (!hasProcessingProposal) return;
    let refreshing = false;
    const interval = window.setInterval(() => {
      if (refreshing || document.visibilityState !== "visible") return;
      refreshing = true;
      void onRefresh().catch(() => undefined).finally(() => { refreshing = false; });
    }, 10_000);
    return () => window.clearInterval(interval);
  }, [hasProcessingProposal, onRefresh]);

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
    setActionSuccess("");
    setActionId(`${record.id}:${action}`);
    try {
      await onAction("/api/admin/assessments", {
        method: "POST",
        body: JSON.stringify({ id: record.id, action }),
      });
      await onRefresh();
      setActionSuccess("Perubahan tersimpan. Status klien sudah diperbarui.");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Tindakan belum berhasil. Silakan coba lagi.");
      throw error;
    } finally {
      setActionId(null);
    }
  };

  const openProposalBuilder = async (record: AssessmentRecord) => {
    setActionError("");
    if (builderId !== record.id) {
      setSelectedModules({});
      setDiscountPercent("0");
      setProposalRisk("");
      setProposalNotes("");
      setProposalContext({
        ...emptyProposalContext,
        organizationName: record.company || "",
        problemOrNeed: record.challenge || "",
        objective: record.target || "",
      });
    }
    setBuilderId((current) => current === record.id ? null : record.id);
    if (catalog) {
      const suggestions = proposalModuleSuggestions(record, catalog.products, catalog.modules);
      setSelectedModules(Object.fromEntries(suggestions.map((module) => [module.id, 1])));
      return;
    }
    setCatalogLoading(true);
    try {
      const result = await onAction("/api/admin/business-rules") as { products?: CatalogProduct[]; modules?: CatalogModule[]; selectedRuleSet?: { version?: string; is_mock?: boolean } };
      const nextCatalog = { products: result.products || [], modules: result.modules || [], selectedRuleSet: result.selectedRuleSet };
      setCatalog(nextCatalog);
      const suggestions = proposalModuleSuggestions(record, nextCatalog.products, nextCatalog.modules);
      setSelectedModules(Object.fromEntries(suggestions.map((module) => [module.id, 1])));
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
    setActionSuccess("");
    setActionId(`${record.id}:proposal-draft`);
    try {
      await onAction("/api/admin/proposals/draft", {
        method: "POST",
        body: JSON.stringify({
          assessmentId: record.id,
          moduleItems,
          scopeType: "standard",
          discountPercent: Number(discountPercent || 0),
          riskFlags: proposalRisk.trim() ? [proposalRisk.trim()] : [],
          notes: proposalNotes,
          proposalContext,
        }),
      });
      setBuilderId(null);
      await onRefresh();
      setActionSuccess("Perubahan tersimpan. Status klien sudah diperbarui.");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal membuat draft proposal.");
    } finally {
      setActionId(null);
    }
  };

  const decideProposal = async (record: AssessmentRecord, decision: "approve" | "reject" | "request_revision") => {
    setActionError("");
    setActionSuccess("");
    setActionId(`${record.id}:proposal-${decision}`);
    try {
      await onAction("/api/admin/proposals/approval", {
        method: "POST",
        body: JSON.stringify({ assessmentId: record.id, decision, note: approvalNotes[record.id] || "" }),
      });
      await onRefresh();
      setActionSuccess("Perubahan tersimpan. Status klien sudah diperbarui.");
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
    setActionSuccess("");
    setActionId(`${record.id}:${channel}:follow_up_${level}`);
    try {
      await onAction("/api/admin/follow-up", {
        method: "POST",
        body: JSON.stringify({ assessmentId: record.id, channel, level }),
      });
      await onRefresh();
      setActionSuccess("Perubahan tersimpan. Status klien sudah diperbarui.");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Pengingat belum berhasil dikirim.");
      throw error;
    } finally {
      setActionId(null);
    }
  };

  const saveAssessmentStatus = async (record: AssessmentRecord, assessmentStatus: string, proposalStatus: string) => {
    setActionError("");
    setActionSuccess("");
    setActionId(`${record.id}:status`);
    try {
      await onAction("/api/admin/assessments", {
        method: "PATCH",
        body: JSON.stringify({ id: record.id, assessmentStatus, proposalStatus }),
      });
      await onRefresh();
      setActionSuccess("Perubahan tersimpan. Status klien sudah diperbarui.");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal memperbarui status assessment.");
    } finally {
      setActionId(null);
    }
  };

  const toggleAssessmentFollowUp = async (record: AssessmentRecord) => {
    setActionError("");
    setActionSuccess("");
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
      setActionSuccess("Perubahan tersimpan. Status klien sudah diperbarui.");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal mengubah jeda follow up assessment.");
    } finally {
      setActionId(null);
    }
  };


  const filtered = records.filter((record) => matchesQueue(record, queue)).sort((a, b) => {
    if (sort === "attention") {
      const priority = Number(needsAttention(b)) - Number(needsAttention(a));
      if (priority) return priority;
    }
    return (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
  });
  const selected = filtered.find((record) => record.id === expandedId) || filtered[0];
  const record = selected;
  const state = record ? proposalState(record) : { manual: false, processing: false, reconcile: false, failed: false, sent: false, review: false, label: "" };
  const hasManualDraft = state.manual;
  const proposalProcessing = state.processing;
  const deliveryProtected = state.processing || state.reconcile || state.failed;
  const showManualApproval = hasManualDraft && record?.proposalGateStatus === "pending_approval";
  const proposalCanSend = !state.sent && !deliveryProtected && hasManualDraft && ["approved", "clear"].includes(record?.proposalGateStatus || "") && !record?.proposalDraft?.isSimulation;
  const busy = Boolean(actionId);
  const showingDetail = Boolean(expandedId && filtered.some((record) => record.id === expandedId));
  const resetFilters = () => {
    setQuery(""); setCategory("Semua"); setEmployeeRange("Semua"); setMinScore("0");
    setQueue("all"); setVisibleLimit(20); setExpandedId(null);
  };
  const selectClient = (id: string) => {
    setExpandedId(id); setDetailTab("summary"); setActionError(""); setActionSuccess("");
    window.requestAnimationFrame(() => {
      detailHeadingRef.current?.focus({ preventScroll: true });
      detailHeadingRef.current?.scrollIntoView({ block: "start" });
    });
  };
  const returnToClientList = (id: string) => {
    setExpandedId(null);
    window.requestAnimationFrame(() => {
      clientListRef.current?.scrollIntoView({ block: "start" });
      document.getElementById(`${tabId}-client-${id}`)?.focus({ preventScroll: true });
    });
  };
  const tabs: { id: AssessmentDetailTab; label: string }[] = [
    { id: "summary", label: "Ringkasan" }, { id: "proposal", label: "Proposal" },
    { id: "documents", label: "Dokumen" }, { id: "followup", label: "Tindak lanjut" },
  ];

  return (
    <div className="space-y-5">
      {confirmAction && <ConfirmDialog action={confirmAction} errorText={actionError} onClose={() => setConfirmAction(null)} />}
      {emailPreview && <EmailPreviewModal preview={emailPreview} onClose={() => setEmailPreview(null)} />}
      {actionError && !confirmAction && <AdminNotice>{actionError}</AdminNotice>}
      {actionSuccess && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{actionSuccess}</p>}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Antrean assessment">
        {([
          { id: "all", label: "Semua assessment", hint: "Dalam hasil filter", icon: FileText },
          { id: "attention", label: "Perlu perhatian", hint: "Permintaan, kendala, atau pengingat", icon: Eye },
          { id: "processing", label: "Sedang diproses", hint: "Proposal standar otomatis", icon: LoaderCircle },
          { id: "sent", label: "Proposal terkirim", hint: "Pengiriman berhasil tercatat", icon: Check },
        ] as const).map(({ id, label, hint, icon: Icon }) => (
          <button key={id} type="button" aria-pressed={queue === id} onClick={() => { setQueue(id); setExpandedId(null); setVisibleLimit(20); }}
            className={`rounded-2xl border p-4 text-left transition sm:p-5 ${queue === id ? "border-[#0B2C6B] bg-[#0B2C6B] text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"}`}>
            <div className="flex items-center justify-between gap-2"><span className="text-xs font-medium sm:text-sm">{label}</span><Icon size={16} className="shrink-0 opacity-60" aria-hidden="true" /></div>
            <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{records.filter((record) => matchesQueue(record, id)).length}</p>
            <p className="mt-2 text-[11px] leading-4 opacity-70">{hint}</p>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input type="search" aria-label="Cari assessment" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama, perusahaan, atau email…"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-3 text-sm outline-none focus:border-[#0B2C6B] focus:ring-2 focus:ring-[#0B2C6B]/10" />
          </div>
          <button type="button" onClick={() => exportCsv("binahub-assessments.csv", filtered.map((item) => ({ name: item.name, email: item.email, company: item.company, role: item.role, employees: item.employees, category: item.category, overallScore: item.overallScore, assessmentStatus: item.assessmentStatus, proposalStatus: item.proposalStatus, createdAt: item.createdAt })))}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"><Download size={16} aria-hidden="true" /> Ekspor CSV</button>
        </div>
        <details className="mt-3">
          <summary className="w-fit cursor-pointer list-none text-xs font-medium text-slate-600"><span className="flex items-center gap-2"><SlidersHorizontal size={14} aria-hidden="true" /> Filter lanjutan{category !== "Semua" || employeeRange !== "Semua" || minScore !== "0" ? " · Aktif" : ""}</span></summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="text-xs text-slate-500">Kategori<div className="mt-1"><AdminSelect ariaLabel="Kategori assessment" value={category} onChange={setCategory} options={[["Semua", "Semua kategori"], ...categories.map((item) => [item, item] as [string, string])]} /></div></label>
            <label className="text-xs text-slate-500">Ukuran perusahaan<div className="mt-1"><AdminSelect ariaLabel="Ukuran perusahaan" value={employeeRange} onChange={setEmployeeRange} options={[["Semua", "Semua ukuran"], ...employeeRanges.map((item) => [item, item] as [string, string])]} /></div></label>
            <label className="text-xs text-slate-500">Skor diagnosis minimum<div className="mt-1"><AdminSelect ariaLabel="Skor diagnosis minimum" value={minScore} onChange={setMinScore} options={[["0", "Semua skor"], ["50", "50 atau lebih"], ["70", "70 atau lebih"], ["85", "85 atau lebih"]]} /></div></label>
          </div>
        </details>
        {(query || category !== "Semua" || employeeRange !== "Semua" || minScore !== "0" || queue !== "all") && <button type="button" onClick={resetFilters} className="mt-3 text-xs font-medium text-[#0B2C6B] underline underline-offset-4">Hapus semua filter</button>}
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <section ref={clientListRef} aria-label="Daftar klien assessment" className={`min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white ${showingDetail ? "hidden xl:block" : ""}`}>
          <div className="border-b border-slate-100 p-4">
            <div className="mb-3 flex items-center justify-between gap-2"><h2 className="text-sm font-semibold text-slate-900">Daftar klien</h2><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs tabular-nums text-slate-600">{filtered.length}</span></div>
            <AdminSelect ariaLabel="Urutkan assessment" value={sort} onChange={setSort} options={[["latest", "Terbaru dahulu"], ["attention", "Perlu perhatian dahulu"]]} />
          </div>
          <div className="max-h-[760px] overflow-y-auto">
            {filtered.slice(0, visibleLimit).map((record) => {
              const state = proposalState(record);
              const active = selected?.id === record.id;
              return <button type="button" key={record.id} id={`${tabId}-client-${record.id}`} aria-pressed={active} aria-label={`Buka assessment ${record.name}, ${record.company}`} onClick={() => selectClient(record.id)}
                className={`block w-full border-b border-slate-100 border-l-[3px] p-4 text-left transition last:border-b-0 ${active ? "border-l-[#0B2C6B] bg-[#F1F5FB]" : "border-l-transparent hover:bg-slate-50"}`}>
                <div className="flex items-start gap-3">
                  <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-xs font-semibold text-[#0B2C6B] ring-1 ring-slate-200">{record.name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "K"}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-900">{record.name}</span><span className="mt-1 block truncate text-xs text-slate-500">{record.company}</span></span>
                </div>
                <span className={`mt-3 inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${state.failed || state.reconcile || state.review ? "bg-amber-50 text-amber-800" : state.sent ? "bg-emerald-50 text-emerald-700" : "bg-white text-slate-600"}`}>{state.label}</span>
                <span className="mt-2 flex flex-wrap justify-between gap-1 text-[10px] text-slate-500"><span>{formatDate(record.createdAt)}</span><span>Skor diagnosis {record.overallScore}</span></span>
              </button>;
            })}
            {!filtered.length && <div className="p-5"><EmptyState title="Tidak ada assessment yang cocok" description="Coba kata kunci atau filter lain." action={{ label: "Hapus filter", onClick: resetFilters }} /></div>}
          </div>
          {filtered.length > visibleLimit && <button type="button" onClick={() => setVisibleLimit((value) => value + 20)} className="w-full border-t border-slate-100 p-4 text-xs font-semibold text-[#0B2C6B]">Tampilkan lebih banyak</button>}
          <p className="border-t border-slate-100 p-4 text-[11px] leading-5 text-slate-500">Menampilkan data assessment yang dimuat, bukan total historis.</p>
        </section>

        <section aria-label="Detail assessment" className={`min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${!showingDetail ? "hidden xl:block" : ""}`}>
          {!record ? <div className="p-8"><EmptyState title="Belum ada klien untuk ditampilkan" description="Hapus filter untuk melihat assessment yang tersedia." /></div> : <>
              <header className="p-5 sm:p-6">
                <button type="button" onClick={() => returnToClientList(record.id)} className="mb-4 flex min-h-10 items-center gap-2 text-xs font-medium text-slate-600 xl:hidden"><ArrowLeft size={16} /> Kembali ke daftar klien</button>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0"><p className="text-xs font-medium text-slate-500">{record.company}</p><h2 ref={detailHeadingRef} tabIndex={-1} className="mt-1 scroll-mt-24 break-words text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{record.name}</h2><p className="mt-1 text-xs text-slate-500">{record.role || "Peran belum diisi"} · {record.employees ? `${record.employees} karyawan` : "Ukuran perusahaan belum diisi"}</p></div>
                  <span className={`rounded-full px-3 py-1.5 text-xs font-medium ${state.failed || state.reconcile || state.review ? "bg-amber-50 text-amber-800" : state.sent ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-[#0B2C6B]"}`}>{state.label}</span>
                </div>
                <p className="mt-3 break-all text-sm text-slate-600">{record.email}</p>
                {record.whatsapp && <p className="mt-1 text-xs text-slate-500">WhatsApp: {record.whatsapp}</p>}
                <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3">
                  {[["Assessment", record.createdAt], ["Hasil dikirim", record.resultEmailSentAt], ["Proposal dikirim", record.proposalSentAt]].map(([label, date]) => <div key={label} className="min-w-0"><p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${date ? "bg-emerald-500" : "bg-slate-300"}`} />{label}</p><p className="mt-1.5 text-[10px] leading-4 text-slate-500">{date ? formatDate(date) : "Belum tercatat"}</p></div>)}
                </div>
              </header>
              <div role="tablist" aria-label="Bagian assessment" className="grid grid-cols-4 gap-1 border-y border-slate-100 px-2 sm:flex sm:overflow-x-auto sm:px-4">
                {tabs.map((tab, index) => <button type="button" role="tab" key={tab.id} id={`${tabId}-${tab.id}`} aria-controls={`${tabId}-panel`} aria-selected={detailTab === tab.id} tabIndex={detailTab === tab.id ? 0 : -1}
                  onClick={() => setDetailTab(tab.id)} onKeyDown={(event) => {
                    const next = event.key === "ArrowRight" ? (index + 1) % tabs.length : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1;
                    if (next >= 0) { event.preventDefault(); setDetailTab(tabs[next].id); document.getElementById(`${tabId}-${tabs[next].id}`)?.focus(); }
                  }} className={`min-h-12 min-w-0 border-b-2 px-1 text-[11px] font-semibold transition sm:shrink-0 sm:px-3 sm:text-sm ${detailTab === tab.id ? "border-[#0B2C6B] text-[#0B2C6B]" : "border-transparent text-slate-500 hover:text-slate-900"}`}>{tab.label}</button>)}
              </div>
              <div role="tabpanel" id={`${tabId}-panel`} aria-labelledby={`${tabId}-${detailTab}`} tabIndex={0} className="space-y-5 p-5 sm:p-6">
                {busy && <p role="status" className="flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-xs text-[#0B2C6B]"><LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" />Memproses tindakan. Mohon tunggu…</p>}
                {detailTab === "summary" && <>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="navy">{profileLabel(record.lifecycleStage || "prospect")}</Badge>
                    <Badge tone="gold">{profileLabel(record.leadTemperature || record.leadStatus)}</Badge>
                    <Badge tone="green">{profileLabel(record.opportunityStage || "identified")}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs"><div><p className="text-slate-500">Industri</p><p className="mt-1 font-medium text-slate-800">{record.industry || "Belum diisi"}</p></div><div><p className="text-slate-500">Lokasi</p><p className="mt-1 font-medium text-slate-800">{record.location || "Belum diisi"}</p></div><div><p className="text-slate-500">Rencana mulai</p><p className="mt-1 font-medium text-slate-800">{profileLabel(record.timeline)}</p></div><div><p className="text-slate-500">Langkah yang diminati</p><p className="mt-1 font-medium text-slate-800">{profileLabel(record.nextStepIntent || "explore")}</p></div></div>
                  <div className="space-y-4 rounded-xl bg-slate-50 p-4 text-sm leading-6">
                    <h3 className="text-sm font-semibold text-slate-900">Brief assessment</h3>
                    <div><p className="text-xs font-medium text-slate-500">Tantangan utama</p><p className="mt-1 whitespace-pre-wrap text-slate-800">{record.challenge || "Belum diisi"}</p></div>
                    <div><p className="text-xs font-medium text-slate-500">Target 3–6 bulan</p><p className="mt-1 whitespace-pre-wrap text-slate-800">{record.target || "Belum diisi"}</p></div>
                    {record.businessConsequence && <div><p className="text-xs font-medium text-slate-500">Dampak bagi bisnis</p><p className="mt-1 whitespace-pre-wrap text-slate-800">{record.businessConsequence}</p></div>}
                  </div>
                                      <div>
                      <h4 className="mb-2 text-sm font-semibold">Ringkasan hasil</h4>
                      <p className="text-sm whitespace-pre-wrap leading-7 text-slate-600">
                        {record.aiAnalysis || "Ringkasan hasil belum tersedia."}
                      </p>
                    </div>
                    <div>
                      <h4 className="mb-3 text-sm font-semibold">Rekomendasi</h4>
                      <div className="grid gap-3 md:grid-cols-2">
                        {record.recommendations.map((rec, index) => (
                          <div key={`${record.id}-${index}`} className="rounded-[12px] border border-black/[0.05] bg-white p-4">
                            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D9A441]">
                              {rec.service || "Solusi"}
                            </span>
                            <p className="mt-2 text-sm font-semibold">{rec.title}</p>
                            <p className="mt-2 text-xs leading-relaxed text-black/52">{rec.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                  <div className="rounded-xl border border-slate-200 p-4"><div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-slate-900">Skor per dimensi</h3><span className="text-xs text-slate-500">Diagnosis: {record.overallScore}/100</span></div><div className="space-y-3">{Object.entries(record.scores).filter(([key]) => key !== "overall").map(([dimension, value]) => <MetricBar key={dimension} label={dimension} value={Math.max(0, Math.min(100, Number(value) || 0))} />)}</div><p className="mt-4 text-[11px] leading-5 text-slate-500">Skor diagnosis menggambarkan kondisi organisasi, bukan kesiapan membeli.</p></div>
                  <details className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer text-sm font-medium text-slate-800">Jawaban diagnosis ({Object.keys(record.answers || {}).length})</summary><ol className="mt-4 space-y-3">{QUESTIONS.filter((question) => record.answers?.[question.id] != null).map((question) => <li key={question.id} className="flex justify-between gap-4 border-b border-slate-100 pb-3 text-xs leading-5 text-slate-600"><span>{question.id}. {question.text}</span><strong className="shrink-0 text-[#0B2C6B]">{record.answers[question.id]}/5</strong></li>)}</ol></details>
                  <details className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer text-xs font-medium text-slate-600">Rincian penilaian minat</summary><div className="mt-3 space-y-2 text-xs leading-5 text-slate-600"><p>Skor minat: {record.leadScore ?? "Belum dinilai"} · Sinyal minat: {record.leadScoreEvidence?.buyingSignalCount ?? "Belum dinilai"}</p><p>Tingkat keyakinan: {typeof record.leadScoreConfidence === "number" ? `${Math.round(record.leadScoreConfidence * 100)}%` : "Belum dinilai"}</p>{record.leadScoreReason && <p>{record.leadScoreReason}</p>}{Boolean(record.leadScoreEvidence?.missingData?.length) && <p className="text-amber-800">Perlu dilengkapi: {record.leadScoreEvidence?.missingData?.map(profileLabel).join(", ")}</p>}{record.leadScoreEvidence?.exclusionReasons?.map((reason, index) => <p key={index}>{reason}</p>)}<p>Versi aturan: {record.leadScoreRuleVersion || "Belum tersedia"}</p></div></details>
                  <button type="button" onClick={() => setDetailTab("proposal")} className="flex min-h-11 w-full items-center justify-between rounded-xl bg-[#0B2C6B] px-4 text-sm font-medium text-white">Lihat status proposal <ArrowRight size={17} /></button>
                </>}
                {detailTab === "proposal" && <>
                  <div><h3 className="text-base font-semibold text-slate-900">Proposal</h3><p className="mt-2 text-sm leading-6 text-slate-500">Disusun berdasarkan hasil assessment dan solusi BinaHub. Pengiriman otomatis dapat dipantau di sini.</p></div>
                                        <div className="mt-4 rounded-[12px] border border-black/[0.07] bg-[#F8FAFC] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-medium text-slate-500">{hasManualDraft ? "Persetujuan Draf Admin" : "Status Proposal Standar"}</p>
                            <p className="mt-1 text-sm font-semibold text-[#0B2C6B]">{hasManualDraft ? proposalGateLabel(record.proposalGateStatus) : record.proposalSentAt ? "Proposal terkirim" : record.proposalStatus === "Gagal Otomatis" ? "Penyusunan belum berhasil. Coba ulang permintaan proposal." : record.proposalStatus === "Perlu Rekonsiliasi" ? "Periksa penerimaan email sebelum mengirim ulang" : proposalProcessing ? "Sedang disusun dan dikirim otomatis" : record.proposalStatus === "Diminta" ? "Permintaan tercatat — siap diproses" : "Belum terkirim"}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {record.proposalDraft?.proposal && (
                              <button
                                type="button"
                                onClick={() => void downloadDraftProposal(record)}
                                disabled={documentId === `${record.id}:proposal-draft-pdf`}
                                className="rounded-[9px] border border-black/10 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#0B2C6B] disabled:opacity-50"
                              >
                                Unduh draf PDF
                              </button>
                            )}
                            {showManualApproval && (
                              <>
                                <button type="button" disabled={Boolean(actionId) || (approvalNotes[record.id] || "").trim().length < 5} onClick={() => void decideProposal(record, "approve")} className="rounded-[9px] bg-emerald-600 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:opacity-40">Setujui</button>
                                <button type="button" disabled={Boolean(actionId)} onClick={() => void decideProposal(record, "request_revision")} className="rounded-[9px] border border-amber-300 bg-amber-50 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-800">Minta Revisi</button>
                                <button type="button" disabled={Boolean(actionId)} onClick={() => void decideProposal(record, "reject")} className="rounded-[9px] border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-red-700">Tolak</button>
                              </>
                            )}
                          </div>
                        </div>
                        {record.proposalDraft?.isSimulation && (
                          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">Draf uji coba. Draf ini tidak dapat dikirim kepada klien.</p>
                        )}
                        {(record.proposalGateReasons || []).length > 0 && (
                          <ul className="mt-3 space-y-1 text-xs leading-5 text-slate-600">
                            {(record.proposalGateReasons || []).map((reason) => <li key={reason.code}>• {reason.message}</li>)}
                          </ul>
                        )}
                        {showManualApproval && (
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
                            Informasi yang perlu dilengkapi: {record.proposalDraft?.requiredDataMissing?.map(profileLabel).join(", ")}.
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

                  {proposalProcessing && <p role="status" className="flex items-center gap-2 rounded-xl bg-blue-50 p-4 text-sm text-[#0B2C6B]"><LoaderCircle size={17} className="animate-spin motion-reduce:animate-none" />Proposal sedang disusun dan dikirim. Status diperbarui otomatis.</p>}
                  {state.reconcile && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">Status pengiriman belum dapat dipastikan. Periksa arsip pengiriman sebelum mencoba lagi agar klien tidak menerima proposal ganda.</p>}
                  {record.proposalEligibility?.eligible === false && !state.sent && <p className="rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">{record.proposalEligibility.summary}</p>}
                  {!state.sent && !hasManualDraft && <button type="button" disabled={busy || proposalProcessing || state.reconcile || record.proposalEligibility?.eligible === false}
                    onClick={() => setConfirmAction({ title: state.failed ? "Coba ulang proposal standar?" : "Buat dan kirim proposal standar?", description: "Proposal berdasarkan hasil assessment dan katalog akan disusun, lalu dikirim ke email klien.", confirmLabel: state.failed ? "Coba lagi" : "Buat & kirim", details: [`Klien: ${record.name}`, `Email: ${record.email}`, `Perusahaan: ${record.company}`], onConfirm: () => runAssessmentAction(record, "request_proposal") })}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0B2C6B] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">{proposalProcessing ? <><LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" />Sedang diproses</> : state.failed ? "Coba ulang proposal" : "Buat & kirim proposal standar"}</button>}
                  {hasManualDraft && !state.sent && <button type="button" disabled={busy || !proposalCanSend} onClick={() => setConfirmAction({ title: "Kirim draf proposal yang disetujui?", description: "Draf ini akan dikirim langsung ke email klien.", confirmLabel: "Kirim proposal", details: [`Email: ${record.email}`, `Persetujuan: ${proposalGateLabel(record.proposalGateStatus)}`], onConfirm: () => runAssessmentAction(record, "send_proposal") })} className="min-h-11 w-full rounded-xl bg-[#0B2C6B] px-4 py-3 text-sm font-semibold text-white disabled:opacity-40">Kirim draf yang disetujui</button>}
                  {!state.sent && <details className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer text-xs font-medium text-slate-600">Draf standar yang perlu peninjauan</summary><p className="mt-3 text-xs leading-5 text-slate-500">Gunakan bila proposal standar perlu disiapkan dan ditinjau terlebih dahulu.</p><button type="button" onClick={() => void openProposalBuilder(record)} disabled={busy || catalogLoading || deliveryProtected || record.proposalEligibility?.eligible === false} className="mt-3 min-h-10 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-[#0B2C6B] disabled:opacity-40">{builderId === record.id ? "Tutup penyusun draf" : "Siapkan draf untuk ditinjau"}</button>                      {builderId === record.id && (
                        <div className="mt-4 rounded-[12px] border border-[#0B2C6B]/15 bg-white p-4">
                          <div className="mb-3">
                            <h5 className="text-sm font-semibold text-[#0B2C6B]">Konfigurasi Proposal Standar</h5>
                            <p className="mt-1 text-xs leading-5 text-slate-500">Gunakan untuk proposal standar yang memerlukan peninjauan. Tidak ada email yang dikirim saat menyusun draf.</p>
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
                          <div className="mt-4 grid gap-3 md:grid-cols-2">
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
                          <button type="button" onClick={() => void generateProposalDraft(record)} disabled={Boolean(actionId) || record.proposalEligibility?.eligible === false} className="rounded-[9px] bg-[#0B2C6B] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50">Susun draf untuk ditinjau</button>
                          </div>
                        </div>
                      )}
</details>}
                  <p className="rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-600">Butuh proposal khusus? CEO menyiapkannya secara manual setelah diskusi dengan klien. Gunakan hasil assessment dan arsip di tab Dokumen sebagai acuan.</p>
                </>}
                {detailTab === "documents" && <>
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
                          label="Salinan email hasil"
                          loading={documentId === `${record.id}:result-email`}
                          disabled={Boolean(documentId) || !record.resultEmailId}
                          onClick={() => previewEmail(record, "result-email")}
                        />
                        <DocumentActionButton
                          icon={Download}
                          label="Unduh laporan hasil"
                          loading={documentId === `${record.id}:result-pdf`}
                          disabled={Boolean(documentId)}
                          onClick={() => downloadPdf(record, "result-pdf")}
                        />
                        <DocumentActionButton
                          icon={Eye}
                          label="Salinan email proposal"
                          loading={documentId === `${record.id}:proposal-email`}
                          disabled={Boolean(documentId) || !record.proposalEmailId}
                          onClick={() => previewEmail(record, "proposal-email")}
                        />
                        <DocumentActionButton
                          icon={FileText}
                          label="Unduh proposal terkirim"
                          loading={documentId === `${record.id}:proposal-pdf`}
                          disabled={Boolean(documentId) || !record.proposalSentAt}
                          onClick={() => downloadPdf(record, "proposal-pdf")}
                        />
                      </div>
                      {!record.proposalSentAt && (
                        <p className="mt-3 text-xs leading-relaxed text-black/42">
                          PDF proposal terkirim akan tersedia setelah pengiriman berhasil. Draf dapat diunduh di tab Proposal.
                        </p>
                      )}
                      {(!record.resultEmailId || (record.proposalSentAt && !record.proposalEmailId)) && (
                        <p className="mt-3 text-xs leading-relaxed text-black/42">
                          Salinan email belum tersedia untuk sebagian arsip. Laporan hasil tetap dapat diunduh; Anda tidak perlu mengirim email ulang untuk membacanya.
                        </p>
                      )}
                    </div>

                  <details className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer text-xs font-medium text-slate-600">Kirim ulang hasil assessment</summary><p className="mt-3 text-xs leading-5 text-slate-500">Gunakan jika klien meminta hasil dikirim kembali. Tindakan ini mengirim email baru, bukan sekadar membuka arsip.</p><button type="button" disabled={busy} onClick={() => setConfirmAction({ title: "Kirim ulang hasil assessment?", description: "Salinan hasil akan dikirim kembali ke email klien.", confirmLabel: "Kirim ulang hasil", details: [`Klien: ${record.name}`, `Email: ${record.email}`], onConfirm: () => runAssessmentAction(record, "resend_result") })} className="mt-3 min-h-10 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-[#0B2C6B] disabled:opacity-40">Kirim ulang hasil</button></details>
                </>}
                {detailTab === "followup" && <>
                  <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-base font-semibold text-slate-900">Tindak lanjut klien</h3><p className="mt-1 text-xs leading-5 text-slate-500">Kirim pengingat sesuai jadwal, atau jeda saat percakapan sedang berlangsung.</p></div><button type="button" disabled={busy} onClick={() => void toggleAssessmentFollowUp(record)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-[#0B2C6B] disabled:opacity-40">{record.followUpPaused ? <PlayCircle size={15} /> : <PauseCircle size={15} />}{record.followUpPaused ? "Lanjutkan pengingat" : "Jeda pengingat"}</button></div>
                  {record.followUpPaused && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Pengingat untuk klien ini sedang dijeda.</p>}
                  <AssessmentFollowUpBox title="Pengingat hasil assessment" description="Hari ke-2, ke-7, dan ke-14 setelah hasil dikirim. Pengingat hasil berhenti ketika klien meminta proposal atau melanjutkan diskusi." record={record} channel="result" actionId={actionId} disabled={Boolean(record.followUpPaused)} onSend={(target, channel, level) => setConfirmAction({ title: `Kirim pengingat hasil ke-${level}?`, description: "Email pengingat akan dikirim kepada klien.", confirmLabel: "Kirim pengingat", details: [`Klien: ${target.name}`, `Email: ${target.email}`], onConfirm: () => sendAssessmentFollowUp(target, channel, level) })} />
                  <AssessmentFollowUpBox title="Pengingat proposal" description="Satu pengingat pada hari ke-2 setelah proposal dikirim. Tidak dikirim jika klien sudah melanjutkan diskusi atau peluang ditutup." record={record} channel="proposal" actionId={actionId} disabled={Boolean(record.followUpPaused) || !record.proposalSentAt} onSend={(target, channel, level) => setConfirmAction({ title: "Kirim pengingat proposal?", description: "Email pengingat proposal akan dikirim kepada klien.", confirmLabel: "Kirim pengingat", details: [`Klien: ${target.name}`, `Email: ${target.email}`], onConfirm: () => sendAssessmentFollowUp(target, channel, level) })} />
                  <details className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer text-xs font-medium text-slate-600">Perbarui status secara manual</summary><p className="mt-3 text-xs leading-5 text-slate-500">Perubahan status tidak membuat proposal atau mengirim email. Status pengiriman diperbarui oleh proses otomatis.</p><div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs text-slate-500">Assessment<div className="mt-1"><AdminSelect ariaLabel="Status assessment" disabled={busy || deliveryProtected} value={record.assessmentStatus} onChange={(value) => void saveAssessmentStatus(record, value, record.proposalStatus)} options={Array.from(new Set([record.assessmentStatus, "Follow Up", "Lanjut Diskusi", "Closed"])).map((value) => [value, assessmentLabel(value)] as [string, string])} /></div></label>
                    <label className="text-xs text-slate-500">Proposal<div className="mt-1"><AdminSelect ariaLabel="Status proposal" disabled={busy || deliveryProtected} value={record.proposalStatus} onChange={(value) => void saveAssessmentStatus(record, record.assessmentStatus, value)} options={Array.from(new Set([record.proposalStatus, "Revisi", "Lanjut Diskusi", "Deal", "Lost", "Closed"])).map((value) => [value, assessmentLabel(value)] as [string, string])} /></div></label>
                  </div></details>
                </>}
              </div>
            </>}
        </section>
      </div>
      <details className="rounded-2xl border border-slate-200 bg-white p-5"><summary className="cursor-pointer text-sm font-semibold text-slate-800">Pola jawaban seluruh assessment</summary><p className="mt-2 text-xs leading-5 text-slate-500">Ringkasan data yang dimuat. Grafik ini tidak mengikuti filter daftar klien.</p><div className="mt-4">      <Panel title="Distribusi jawaban" action="Persentase jawaban 4–5">
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

</div></details>
    </div>
  );
}

function DocumentActionButton({
  icon: Icon,
  label,
  disabled,
  loading = false,
  onClick,
}: {
  icon: typeof Eye;
  loading?: boolean;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-12 items-center justify-center gap-2 rounded-[10px] border border-black/10 bg-[#FCFCFB] px-3 text-xs font-bold uppercase tracking-[0.12em] text-[#0B2C6B] transition hover:border-[#D9A441]/50 hover:bg-[#FFF8EA] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {loading ? <LoaderCircle size={15} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Icon size={15} aria-hidden="true" />}
      {loading ? "Memuat…" : label}
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
  const due = dueFollowUp(record, channel);
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0B2C6B]">{title}</p>
          <p className="mt-2 text-xs leading-relaxed text-black/50">{description}</p>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-black/34">
            Pengingat terkirim: {channel === "result" ? record.resultFollowUpLevel || 0 : record.proposalFollowUpLevel || 0}
          </p>
        </div>
        <Badge tone={due === null ? "navy" : "gold"}>{record.followUpPaused ? "Dijeda" : due === null ? "Tidak ada yang jatuh tempo" : "Jatuh tempo"}</Badge>
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
              disabled={disabled || sent || !isNext || due !== item.level || Boolean(actionId)}
              className="h-9 rounded-[9px] border border-black/10 bg-white px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#0B2C6B] transition hover:border-[#D9A441]/45 hover:bg-[#FFF8EA] disabled:opacity-50"
            >
              {actionId === id ? "Mengirim…" : sent ? `Pengingat ${item.level} terkirim` : `Hari ke-${item.days}`}
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
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D9A441]">Salinan email terkirim</p>
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
            aria-label="Tutup salinan email"
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
                  {preview.from && <p className="break-all text-[11px] leading-relaxed text-black/50">Pengirim: {preview.from}</p>}
                  {preview.to?.length ? <p className="mt-1 break-all text-[11px] leading-relaxed text-black/50">Penerima: {preview.to.join(", ")}</p> : null}
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
              title="Isi email yang dikirim"
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
