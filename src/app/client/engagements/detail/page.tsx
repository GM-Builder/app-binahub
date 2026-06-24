"use client";

import { useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, FileClock, ListChecks, Target, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ClientAuthGate } from "@/components/client-auth-gate";
import { AppShell } from "@/components/app-shell";
import { useEngagements, useEvidence, useActions, useCapabilities } from "@/hooks/use-transformation-data";
import type { Engagement, Evidence, Action, ParticipantCapability } from "@/lib/transformation-types";
import { StatusPill, ProgressBar, TrendIcon, Breadcrumb } from "@/components/ui";
import { ErrorBoundary } from "@/components/error-boundary";

function EngagementDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  const { engagements, loading: engagementsLoading } = useEngagements();
  const { evidence, loading: evidenceLoading } = useEvidence({ engagement_id: id });
  const { actions, loading: actionsLoading } = useActions({ engagement_id: id });
  const { capabilities, loading: capsLoading } = useCapabilities(id);

  const engagement = useMemo(() => engagements.find((e) => e.id === id) || null, [engagements, id]);
  const loading = engagementsLoading || evidenceLoading || actionsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-[#4A4C54]/60">Memuat program...</div>
    );
  }

  if (!engagement) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-[#4A4C54]/60">Program tidak ditemukan.</p>
        <Link href="/client/engagements" className="mt-4 inline-block text-sm font-semibold text-[#0B2C6B] hover:text-[#D9A441]">
          Kembali ke Program
        </Link>
      </div>
    );
  }

  const timeline = evidence
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  return (
    <>
      <Breadcrumb items={[
        { label: "Program", href: "/client/engagements" },
        { label: engagement.title },
      ]} />

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#D9A441]">{engagement.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#0B2C6B]">{engagement.title}</h2>
              </div>
              <StatusPill status={engagement.status} />
            </div>
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-xs font-semibold text-[#0B2C6B]/70">
                <span>Progress</span>
                <span>{engagement.progress ?? 0}%</span>
              </div>
              <ProgressBar value={engagement.progress ?? 0} />
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-[#4A4C54]/58">Peserta</dt>
                <dd className="font-semibold text-[#0B2C6B]">{engagement.participants ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[#4A4C54]/58">Tanggal Mulai</dt>
                <dd className="font-semibold text-[#0B2C6B]">
                  {engagement.start_date ? new Date(engagement.start_date).toLocaleDateString("id-ID") : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[#4A4C54]/58">Tanggal Selesai</dt>
                <dd className="font-semibold text-[#0B2C6B]">
                  {engagement.end_date ? new Date(engagement.end_date).toLocaleDateString("id-ID") : "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Linimasa Catatan</p>
                <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[#0B2C6B]">Riwayat Aktivitas</h3>
              </div>
              <FileClock size={18} className="text-[#0B2C6B]/50" />
            </div>
            {timeline.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#4A4C54]/50">Belum ada catatan untuk program ini.</p>
            ) : (
              <div className="relative space-y-0">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[#0B2C6B]/10" />
                {timeline.map((item) => (
                  <article key={item.id} className="relative flex gap-4 py-3">
                    <div className="relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-[#0B2C6B] bg-white" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-[#D9A441]">
                            {item.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                          </p>
                          <p className="mt-0.5 text-sm font-medium text-[#0B2C6B]">
                            {(() => {
                              const text = (item.content as Record<string, unknown>)?.text;
                              return text ? String(text).slice(0, 120) : "Catatan ditambahkan";
                            })()}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-[#4A4C54]/50">
                          {new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {item.capability_tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {item.capability_tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-[#F5F7FA] px-2 py-0.5 text-[10px] font-semibold text-[#0B2C6B]">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Kemajuan Kemampuan</p>
                <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[#0B2C6B]">Sinyal Perkembangan</h3>
              </div>
              <Target size={18} className="text-[#0B2C6B]/50" />
            </div>
            {capsLoading ? (
              <p className="py-8 text-center text-sm text-[#4A4C54]/50">Memuat...</p>
            ) : capabilities.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#4A4C54]/50">Belum ada data kemampuan.</p>
            ) : (
              <div className="space-y-3">
                {capabilities.map((cap) => (
                  <div key={cap.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-[#0B2C6B]">{cap.capability?.name || "Unknown"}</span>
                      <div className="flex items-center gap-1.5">
                        <TrendIcon trend={cap.trend} />
                        <span className="text-xs font-semibold text-[#4A4C54]/70">{cap.score}</span>
                      </div>
                    </div>
                    <ProgressBar value={cap.score} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Tindakan</p>
                <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[#0B2C6B]">Item Pekerjaan</h3>
              </div>
              <ListChecks size={18} className="text-[#0B2C6B]/50" />
            </div>
            {actions.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#4A4C54]/50">Belum ada tindakan.</p>
            ) : (
              <div className="space-y-3">
                {actions.map((action) => (
                  <article key={action.id} className="rounded-lg border border-[#0B2C6B]/8 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#0B2C6B] truncate">{action.title}</p>
                        <p className="mt-0.5 text-xs text-[#4A4C54]/60">
                          {action.due_date ? `Jatuh tempo ${new Date(action.due_date).toLocaleDateString("id-ID")}` : "Tanpa tenggat"}
                        </p>
                      </div>
                      <StatusPill status={action.status} />
                    </div>
                    <div className="mt-2">
                      <ProgressBar value={action.progress} />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <Link
            href={`/client/reflection?engagement=${id}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B2C6B] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0A255A]"
          >
            Kirim Refleksi
          </Link>
        </div>
      </div>
    </>
  );
}

export default function EngagementDetailPage() {
  return (
    <ClientAuthGate>
      <AppShell role="client" eyebrow="Detail Program" title="Program">
        <ErrorBoundary>
          <Suspense fallback={<div className="flex items-center justify-center py-20 text-sm text-[#4A4C54]/60">Memuat...</div>}>
            <EngagementDetailContent />
          </Suspense>
        </ErrorBoundary>
      </AppShell>
    </ClientAuthGate>
  );
}
