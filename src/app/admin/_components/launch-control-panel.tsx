"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, GitMerge, LockKeyhole, RefreshCw, ShieldCheck } from "lucide-react";
import { Panel, StatCard } from "./shared";

type AdminAction = (url: string, init?: RequestInit) => Promise<unknown>;

type ReadinessCheck = {
  key: string;
  label: string;
  passed: boolean;
  category: "configuration" | "business" | "evidence" | "safety";
  detail: string;
};

type RunEvidence = {
  status: string;
  dryRun: boolean;
  candidateCount: number;
  processedCount: number;
  failureCount: number;
  startedAt: string;
  finishedAt: string | null;
  errorMessage: string | null;
};

type WorkflowReadiness = {
  key: string;
  label: string;
  purpose: string;
  mode: "dry_run" | "live";
  technicalStatus: "configuration_required" | "dry_run_pending" | "dry_run_validated" | "failed" | "live_guard_required";
  activationStatus: "locked" | "eligible_for_human_review" | "live_guard_required";
  checks: ReadinessCheck[];
  blockers: ReadinessCheck[];
  lastRun: RunEvidence | null;
};

type LaunchResponse = {
  success: boolean;
  phase8Ready: boolean;
  readOnly: boolean;
  generatedAt: string;
  overall: {
    state: string;
    activationLocked: boolean;
    humanApprovalRequired: boolean;
    liveWorkflowCount: number;
    validatedWorkflowCount: number;
    workflowCount: number;
    blockerCount: number;
  };
  businessRules: {
    version: string | null;
    status: string | null;
    outboundAutomationEnabled: boolean;
    activationBlockers: string[];
  };
  catalog: { readyNonMockModules: number; pricedReadyModules: number };
  templates: { required: number; approvedNonMock: number };
  acquisition: { approvedActiveSources: number; approvedOrActiveCampaigns: number; approvedBatches: number };
  evidence: { emailDeliveryEventCount: number; eventQueueFailedCount: number; calendarBookingCount: number; calendarLineageIssueCount: number };
  workflows: WorkflowReadiness[];
};

const BUSINESS_BLOCKER_LABELS: Record<string, string> = {
  official_product_statuses: "Status resmi setiap produk",
  official_module_catalog: "Katalog modul resmi",
  module_scope_output_unit_price_and_status: "Scope, output, satuan, harga, dan status modul",
  minimum_transaction_below_threshold_policy: "Kebijakan transaksi di bawah minimum",
  individual_owner_and_backup_assignments: "Owner dan backup owner per fungsi",
  individual_approver_assignments: "Approver proposal per individu",
  legal_reputation_review_sla: "SLA review risiko legal dan reputasi",
  follow_up_template_owner_and_final_approval: "Owner dan persetujuan final template follow-up",
  finance_legal_tax_wording: "Wording pajak dari Finance/Legal",
  commercial_policy_not_aligned: "Kebijakan komersial belum sesuai keputusan default",
  governance_owner_assignments_incomplete: "Tujuh fungsi governance belum seluruhnya memiliki owner aktif",
  approval_assignments_incomplete: "Enam human gate belum seluruhnya memiliki approver aktif",
  risk_sla_policies_incomplete: "Empat SLA risiko belum seluruhnya aktif dan memiliki owner",
  finance_legal_wording_incomplete: "Wording proposal dan invoice belum seluruhnya disetujui",
  outreach_templates_incomplete: "Delapan belas template follow-up belum seluruhnya approved dan memiliki owner",
};

const TECHNICAL_STATUS: Record<WorkflowReadiness["technicalStatus"], { label: string; className: string }> = {
  configuration_required: { label: "Konfigurasi belum lengkap", className: "bg-amber-100 text-amber-800" },
  dry_run_pending: { label: "Menunggu bukti dry-run", className: "bg-blue-100 text-blue-800" },
  dry_run_validated: { label: "Dry-run terverifikasi", className: "bg-emerald-100 text-emerald-800" },
  failed: { label: "Run terakhir gagal", className: "bg-red-100 text-red-700" },
  live_guard_required: { label: "Mode live perlu review", className: "bg-red-100 text-red-700" },
};

function displayDate(value: string | null | undefined) {
  if (!value) return "Belum ada run tercatat";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(date);
}

export function LaunchControlPanel({ onAction }: { onAction: AdminAction }) {
  const [payload, setPayload] = useState<LaunchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await onAction("/api/admin/launch-readiness") as LaunchResponse;
      setPayload(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat Launch Control.");
    } finally {
      setLoading(false);
    }
  }, [onAction]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const reconcileBusinessRules = async () => {
    const confirmed = window.confirm(
      "Selaraskan snapshot Business Rules lama dengan konfigurasi Phase 17 yang saat ini tersimpan? Aksi ini tidak mengubah runtime, environment, release, n8n, atau master switch pilot/live.",
    );
    if (!confirmed) return;
    setReconciling(true);
    setError("");
    setNotice("");
    try {
      const result = await onAction("/api/admin/business-rules/reconcile", {
        method: "POST",
        body: JSON.stringify({
          action: "reconcile_phase17_defaults",
          confirmation: "ALIGN_PHASE17_DEFAULTS",
        }),
      }) as { aligned?: boolean; message?: string; blockers?: Array<{ label: string }> };
      if (!result.aligned) {
        const blockerText = (result.blockers || []).map((item) => item.label).join(" ");
        throw new Error(`${result.message || "Business Rules belum dapat diselaraskan."}${blockerText ? ` ${blockerText}` : ""}`);
      }
      setNotice(result.message || "Keputusan Phase 17 berhasil diselaraskan.");
      await load();
    } catch (reconcileError) {
      setError(reconcileError instanceof Error ? reconcileError.message : "Gagal menyelaraskan Business Rules.");
    } finally {
      setReconciling(false);
    }
  };

  const humanReviewCandidates = useMemo(
    () => payload?.workflows.filter((workflow) => workflow.activationStatus === "eligible_for_human_review").length || 0,
    [payload],
  );

  if (loading && !payload) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Memuat Launch Control…</div>;
  }
  if (payload && !payload.phase8Ready) {
    return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Fondasi Launch Control belum lengkap. Pastikan migration sampai Fase 7 tersedia.</div>;
  }

  return (
    <div className="space-y-6">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</div>}

      <div className={`rounded-2xl border p-5 ${payload?.overall.liveWorkflowCount ? "border-red-300 bg-red-50 text-red-900" : "border-blue-200 bg-blue-50 text-blue-900"}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-3">
            <LockKeyhole className="mt-0.5 shrink-0" size={20} />
            <div>
              <p className="font-bold">Launch Control bersifat read-only</p>
              <p className="mt-1 max-w-4xl text-sm leading-relaxed">
                Dashboard ini menggabungkan konfigurasi, keputusan bisnis, dan bukti eksekusi. Status “layak direview” bukan izin aktivasi. Perubahan dry-run ke live tetap dilakukan terpisah setelah persetujuan manusia dan rollback plan tersedia.
              </p>
            </div>
          </div>
          <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-current/20 bg-white/70 px-3.5 py-2 text-xs font-bold disabled:opacity-50">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Perbarui bukti
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Dry-run terverifikasi" value={`${payload?.overall.validatedWorkflowCount || 0}/${payload?.overall.workflowCount || 4}`} icon={ShieldCheck} />
        <StatCard label="Layak human review" value={humanReviewCandidates} icon={CheckCircle2} />
        <StatCard label="Blocker unik" value={payload?.overall.blockerCount || 0} icon={AlertTriangle} />
        <StatCard label="Workflow live" value={payload?.overall.liveWorkflowCount || 0} icon={LockKeyhole} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Keputusan Bisnis yang Masih Terbuka" action={payload?.businessRules.version || "Belum ada versi"}>
          {payload?.businessRules.version !== "v1.1-default-governance" || payload.businessRules.activationBlockers.length > 0 ? (
            <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-bold">Snapshot lama perlu diselaraskan</p>
                  <p className="mt-1 max-w-2xl text-xs leading-relaxed text-blue-900/75">
                    Sistem akan memvalidasi kebijakan transaksi, tujuh owner, enam approver, empat SLA, dua wording finance/legal, dan 18 template yang tersimpan. Katalog tetap dikelola admin dan kesiapan setiap modul diperiksa saat modul digunakan.
                  </p>
                  <p className="mt-2 text-xs font-semibold text-blue-900">Penyelarasan tidak mengaktifkan workflow, n8n, release, atau master switch.</p>
                </div>
                <button
                  type="button"
                  onClick={reconcileBusinessRules}
                  disabled={reconciling}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0B2C6B] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  <GitMerge size={14} className={reconciling ? "animate-pulse" : ""} />
                  {reconciling ? "Menyelaraskan…" : "Selaraskan keputusan"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
                <div><p className="font-bold">Keputusan Phase 17 sudah menjadi aturan aktif</p><p className="mt-1 text-xs leading-relaxed text-emerald-800/80">Izin policy tercatat, tetapi eksekusi tetap tunduk pada release, change window, runtime control, environment dry-run, dan master switch.</p></div>
              </div>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {(payload?.businessRules.activationBlockers || []).map((blocker) => (
              <div key={blocker} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <div className="flex items-start gap-2"><Clock3 size={15} className="mt-0.5 shrink-0" /><span>{BUSINESS_BLOCKER_LABELS[blocker] || blocker.replaceAll("_", " ")}</span></div>
              </div>
            ))}
            {!payload?.businessRules.activationBlockers.length && <p className="text-sm text-emerald-700">Tidak ada blocker keputusan pada rules aktif.</p>}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Modul siap</p><p className="mt-1 text-lg font-bold text-[#0B2C6B]">{payload?.catalog.readyNonMockModules || 0}</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Modul siap berharga</p><p className="mt-1 text-lg font-bold text-[#0B2C6B]">{payload?.catalog.pricedReadyModules || 0}</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Template approved</p><p className="mt-1 text-lg font-bold text-[#0B2C6B]">{payload?.templates.approvedNonMock || 0}/{payload?.templates.required || 18}</p></div>
          </div>
        </Panel>

        <Panel title="Bukti Integrasi Production" action={displayDate(payload?.generatedAt)}>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span>Webhook email tersimpan</span><strong>{payload?.evidence.emailDeliveryEventCount || 0}</strong></div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span>Booking Cal.com</span><strong>{payload?.evidence.calendarBookingCount || 0}</strong></div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span>Issue lineage kalender</span><strong className={payload?.evidence.calendarLineageIssueCount ? "text-red-600" : "text-emerald-700"}>{payload?.evidence.calendarLineageIssueCount || 0}</strong></div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span>Event gagal permanen</span><strong className={payload?.evidence.eventQueueFailedCount ? "text-red-600" : "text-emerald-700"}>{payload?.evidence.eventQueueFailedCount || 0}</strong></div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {(payload?.workflows || []).map((workflow) => {
          const status = TECHNICAL_STATUS[workflow.technicalStatus];
          return (
            <section key={workflow.key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h3 className="font-bold text-[#0B2C6B]">{workflow.label}</h3><p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-500">{workflow.purpose}</p></div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${status.className}`}>{status.label}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${workflow.mode === "dry_run" ? "bg-slate-100 text-slate-600" : "bg-red-100 text-red-700"}`}>{workflow.mode === "dry_run" ? "Dry-run" : "Live"}</span>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">Run terakhir: {displayDate(workflow.lastRun?.startedAt)}</p>
                {workflow.lastRun && <p className="mt-1">Status {workflow.lastRun.status} · kandidat {workflow.lastRun.candidateCount} · diproses {workflow.lastRun.processedCount} · gagal {workflow.lastRun.failureCount}</p>}
              </div>

              <div className="mt-4 space-y-2">
                {workflow.checks.map((item) => (
                  <div key={item.key} className="flex items-start gap-2 text-xs">
                    {item.passed ? <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" /> : <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" />}
                    <div><p className="font-semibold text-slate-700">{item.label}</p><p className="mt-0.5 text-slate-500">{item.detail}</p></div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
