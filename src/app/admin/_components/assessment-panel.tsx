"use client";

import { useState } from "react";
import { ChevronDown, Download, Eye, FileText, Search, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  AdminNotice,
  AdminSelect,
  Badge,
  ConfirmDialog,
  EmptyState,
  GuidancePanel,
  MetricBar,
  Panel,
} from "./shared";
import { FOLLOW_UP_LEVELS } from "../_lib/constants";
import { daysSince, exportCsv, formatDate, uniqueOptions } from "../_lib/utils";
import type { AssessmentDocumentType, AssessmentRecord, ConfirmAction, DashboardData, EmailPreview } from "../_lib/types";

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
      <GuidancePanel
        title="Panduan Assessment"
        items={[
          "Buka detail klien untuk melihat skor, status, email, dan rekomendasi AI dalam satu tempat.",
          "Kirim Result, Proposal, dan Follow Up akan meminta konfirmasi dulu karena dapat mengirim email ke klien.",
          "Gunakan filter follow-up dan high potential untuk menentukan prioritas harian admin.",
        ]}
      />
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

      <Panel title="Distribusi Jawaban Q1-Q49" action="Likert 1-5">
        <div className="grid grid-cols-7 gap-1 md:grid-cols-[repeat(14,minmax(0,1fr))] xl:grid-cols-[repeat(49,minmax(0,1fr))]">
          {data.answerDistribution.map((item) => {
            const total = [1, 2, 3, 4, 5].reduce((sum, key) => sum + Number(item[String(key)] || 0), 0);
            const positive = Number(item["4"] || 0) + Number(item["5"] || 0);
            const percent = total ? Math.round((positive / total) * 100) : 0;
            return (
              <div key={String(item.question)} className="h-20 rounded-[6px] bg-[#EDF1F6] p-1">
                <div className="flex h-full items-end">
                  <div
                    className="w-full rounded-[4px] bg-[#0B2C6B]"
                    style={{ height: `${Math.max(percent, 4)}%` }}
                    title={`${item.question}: ${percent}% setuju/sangat setuju`}
                  />
                </div>
              </div>
            );
          })}
        </div>
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
                            onClick={() =>
                              setConfirmAction({
                                title: "Kirim proposal ke klien?",
                                description: "Proposal akan dibuat/dikirim ke email klien. Review kembali nama perusahaan, email, dan status proposal.",
                                confirmLabel: "Kirim Proposal",
                                tone: "gold",
                                details: [`Klien: ${record.name}`, `Email: ${record.email}`, `Status proposal: ${record.proposalStatus}`],
                                onConfirm: () => runAssessmentAction(record, "send_proposal"),
                              })
                            }
                            disabled={actionId === `${record.id}:send_proposal`}
                            className="h-12 rounded-[10px] bg-[#0B2C6B] px-3 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50"
                          >
                            Kirim Proposal
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 xl:grid-cols-2">
                        <AssessmentFollowUpBox
                          title="Follow Up Result"
                          description="H+2 memastikan result masuk dan terbaca, H+7 soft push diskusi, H+14 hard push keputusan."
                          record={record}
                          channel="result"
                          actionId={actionId}
                          disabled={!record.resultEmailSentAt && record.assessmentStatus !== "Result Otomatis Terkirim"}
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
                          disabled={!record.proposalSentAt}
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
                            Akses email dan attachment asli yang tersimpan di Resend.
                          </p>
                        </div>
                        <span className="rounded-full bg-[#F5F7FA] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-black/42">
                          Resend copy
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
                          Data lama yang belum menyimpan Email ID perlu dikirim ulang sekali agar salinan Resend bisa dibuka langsung di sini.
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
        {FOLLOW_UP_LEVELS.map((item) => {
          const id = `${record.id}:${channel}:follow_up_${item.level}`;
          return (
            <button
              key={item.level}
              type="button"
              onClick={() => onSend(record, channel, item.level)}
              disabled={disabled || actionId === id}
              className="h-9 rounded-[9px] border border-black/10 bg-white px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#0B2C6B] transition hover:border-[#D9A441]/45 hover:bg-[#FFF8EA] disabled:opacity-50"
            >
              {actionId === id ? "Kirim..." : item.label}
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
  return (
    <div className="fixed inset-0 z-50 bg-[#071B3D]/55 px-4 py-6 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-5xl flex-col overflow-hidden rounded-[16px] bg-white shadow-[0_40px_100px_-40px_rgba(7,27,61,0.55)]">
        <div className="flex flex-col gap-4 border-b border-black/[0.06] bg-[#FAFAF8] px-5 py-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D9A441]">Email Preview</p>
            <h3 className="mt-1 text-lg font-semibold text-[#0B2C6B]">{preview.subject}</h3>
            <p className="mt-1 text-xs text-black/45">{preview.recordName}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-black/45">
              {preview.lastEvent && <span className="rounded-full bg-white px-2 py-1">Status: {preview.lastEvent}</span>}
              {preview.createdAt && <span className="rounded-full bg-white px-2 py-1">Dikirim: {formatDate(preview.createdAt)}</span>}
              {preview.emailId && <span className="rounded-full bg-white px-2 py-1">Resend ID: {preview.emailId}</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-[10px] border border-black/10 bg-white text-[#0B2C6B]"
            aria-label="Tutup preview email"
          >
            <X size={17} />
          </button>
        </div>
        <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[240px_1fr]">
          <aside className="border-b border-black/[0.06] bg-white p-5 lg:border-b-0 lg:border-r">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/40">Attachment</p>
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
                  Tidak ada attachment yang tercatat di email ini.
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
