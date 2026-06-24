"use client";

import { Eye, FileText } from "lucide-react";
import { FacilitatorAuthGate } from "@/components/facilitator-auth-gate";
import { AppShell } from "@/components/app-shell";
import { ObservationInput } from "@/components/facilitator-observation";
import { useState } from "react";
import { useEvidence } from "@/hooks/use-transformation-data";
import { QualityBadge, calcEvidenceStats, EvidenceQualityDashboard } from "@/components/evidence-quality";
import { EmptyState } from "@/components/ui";
import { ErrorBoundary } from "@/components/error-boundary";

function EvidenceViewer() {
  const { evidence } = useEvidence({});
  const observations = evidence.filter((e) => e.type === "observation");
  const stats = calcEvidenceStats(observations);
  return (
    <>
      {observations.length > 0 && (
        <div className="mb-6">
          <EvidenceQualityDashboard stats={stats} />
        </div>
      )}
      <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Pengamatan yang Dikirim</p>
          <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[#0B2C6B]">{observations.length} pengamatan tercatat</h2>
        </div>
        {observations.length === 0 ? (
          <EmptyState icon={Eye} title="Belum ada pengamatan yang dikirim." />
        ) : (
          <div className="space-y-3">
            {observations.map((item) => {
              const content = item.content as Record<string, unknown>;
              return (
                <article key={item.id} className="rounded-lg border border-[#0B2C6B]/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#D9A441]">Pengamatan</p>
                      <p className="mt-0.5 text-sm font-medium text-[#0B2C6B] line-clamp-2">
                        {String(content?.observation || content?.text || "")}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-[#4A4C54]/50">
                      {new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {item.capability_tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.capability_tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-[#F5F7FA] px-2 py-0.5 text-[10px] font-semibold text-[#0B2C6B]">{tag}</span>
                      ))}
                      <QualityBadge score={Math.round(item.confidence_score * 100)} />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

export default function FacilitatorEvidencePage() {
  const [tab, setTab] = useState<"input" | "history">("input");

  return (
    <FacilitatorAuthGate>
      <AppShell role="facilitator" eyebrow="Sistem Catatan" title="Input Pengamatan">
        <ErrorBoundary>
          <div className="mb-5 flex gap-2">
            <button
              type="button"
              onClick={() => setTab("input")}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                tab === "input" ? "bg-[#0B2C6B] text-white" : "border border-[#0B2C6B]/10 text-[#0B2C6B]/70 hover:bg-[#F5F7FA]"
              }`}
            >
              <Eye size={16} /> Pengamatan Baru
            </button>
            <button
              type="button"
              onClick={() => setTab("history")}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                tab === "history" ? "bg-[#0B2C6B] text-white" : "border border-[#0B2C6B]/10 text-[#0B2C6B]/70 hover:bg-[#F5F7FA]"
              }`}
            >
              <FileText size={16} /> Riwayat Pengamatan
            </button>
          </div>
          {tab === "input" ? <ObservationInput /> : <EvidenceViewer />}
        </ErrorBoundary>
      </AppShell>
    </FacilitatorAuthGate>
  );
}
