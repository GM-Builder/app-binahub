"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight, Eye, FileText, UsersRound, CheckCircle2, AlertTriangle } from "lucide-react";
import { FacilitatorAuthGate } from "@/components/facilitator-auth-gate";
import { AppShell } from "@/components/app-shell";
import { useEngagements, useEvidence } from "@/hooks/use-transformation-data";
import { StatCard, StatCardSkeleton, EmptyState } from "@/components/ui";
import { ErrorBoundary } from "@/components/error-boundary";

export default function FacilitatorDashboardPage() {
  const { engagements, loading: engLoading } = useEngagements();
  const { evidence, loading: evLoading } = useEvidence();
  const loading = engLoading || evLoading;

  const activeEngagements = useMemo(() => engagements.filter((e) => e.status === "active" || e.status === "in_progress"), [engagements]);
  const observations = useMemo(() => evidence.filter((e) => e.type === "observation"), [evidence]);
  const recentObservations = useMemo(() => observations.slice(0, 5), [observations]);

  if (loading) {
    return (
      <FacilitatorAuthGate>
        <AppShell role="facilitator" eyebrow="Ruang Fasilitator" title="Dashboard">
          <div className="grid gap-4 md:grid-cols-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
              <div className="h-3 w-24 animate-pulse rounded bg-[#E6EAF0]" />
              <div className="mt-3 h-5 w-48 animate-pulse rounded bg-[#E6EAF0]" />
            </div>
            <div className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
              <div className="h-3 w-24 animate-pulse rounded bg-[#E6EAF0]" />
              <div className="mt-3 h-5 w-32 animate-pulse rounded bg-[#E6EAF0]" />
            </div>
          </div>
        </AppShell>
      </FacilitatorAuthGate>
    );
  }

  return (
    <FacilitatorAuthGate>
      <AppShell role="facilitator" eyebrow="Ruang Fasilitator" title="Dashboard">
        <ErrorBoundary>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard label="Program Aktif" value={String(activeEngagements.length)} detail="Program yang sedang berjalan" icon={<UsersRound size={16} />} />
            <StatCard label="Pengamatan" value={String(observations.length)} detail="Catatan yang sudah dibuat" icon={<Eye size={16} />} />
            <StatCard label="Total Catatan" value={String(evidence.length)} detail="Semua catatan dalam sistem" icon={<FileText size={16} />} />
            <StatCard label="Perlu Ditinjau" value={String(activeEngagements.length)} detail="Menunggu penilaian fasilitator" icon={<AlertTriangle size={16} />} />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
            <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Program Aktif</p>
                  <h2 className="mt-1 text-lg font-semibold text-[#0B2C6B]">Program Anda</h2>
                </div>
                <Link href="/facilitator/engagements" className="text-xs font-semibold text-[#0B2C6B] hover:text-[#D9A441]">Lihat semua</Link>
              </div>
              {activeEngagements.length === 0 ? (
                <EmptyState title="Tidak ada program aktif." />
              ) : (
                <div className="space-y-3">
                  {activeEngagements.map((e) => (
                    <Link key={e.id} href={`/facilitator/participants?engagement=${e.id}`} className="block rounded-lg border border-[#0B2C6B]/8 p-4 transition hover:border-[#D9A441]/30">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#0B2C6B]">{e.title}</p>
                          <p className="mt-0.5 text-xs text-[#4A4C54]/60">{e.type} — {e.participants ?? 0} peserta</p>
                        </div>
                        <ArrowUpRight size={16} className="text-[#0B2C6B]/30" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Tindakan Cepat</p>
                <h2 className="mt-1 text-lg font-semibold text-[#0B2C6B]">Mulai dari sini</h2>
              </div>
              <div className="space-y-3">
                <Link href="/facilitator/evidence" className="flex items-center gap-3 rounded-lg border border-[#0B2C6B]/8 p-3 transition hover:border-[#D9A441]/30">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B2C6B]/10"><Eye size={18} className="text-[#0B2C6B]" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#0B2C6B]">Pengamatan Baru</p>
                    <p className="text-xs text-[#4A4C54]/60">Input catatan terstruktur</p>
                  </div>
                </Link>
                <Link href="/facilitator/reviews" className="flex items-center gap-3 rounded-lg border border-[#0B2C6B]/8 p-3 transition hover:border-[#D9A441]/30">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B2C6B]/10"><CheckCircle2 size={18} className="text-[#0B2C6B]" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#0B2C6B]">Antrian Penilaian</p>
                    <p className="text-xs text-[#4A4C54]/60">Tinjau kemajuan peserta</p>
                  </div>
                </Link>
                <Link href="/facilitator/participants" className="flex items-center gap-3 rounded-lg border border-[#0B2C6B]/8 p-3 transition hover:border-[#D9A441]/30">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B2C6B]/10"><UsersRound size={18} className="text-[#0B2C6B]" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#0B2C6B]">Semua Peserta</p>
                    <p className="text-xs text-[#4A4C54]/60">Lihat kemajuan peserta</p>
                  </div>
                </Link>
              </div>
            </section>
          </div>

          {recentObservations.length > 0 && (
            <section className="mt-6 rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Pengamatan Terbaru</p>
                  <h2 className="mt-1 text-lg font-semibold text-[#0B2C6B]">Catatan terbaru yang Anda kirim</h2>
                </div>
                <Link href="/facilitator/evidence" className="text-xs font-semibold text-[#0B2C6B] hover:text-[#D9A441]">Lihat semua</Link>
              </div>
              <div className="space-y-2">
                {recentObservations.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg border border-[#0B2C6B]/8 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#0B2C6B] truncate">
                        {(item.content as Record<string, unknown>)?.observation
                          ? String((item.content as Record<string, unknown>).observation).slice(0, 80)
                          : "Pengamatan tercatat"}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.capability_tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-[#F5F7FA] px-2 py-0.5 text-[10px] font-semibold text-[#0B2C6B]">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-[#4A4C54]/50">{new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </ErrorBoundary>
      </AppShell>
    </FacilitatorAuthGate>
  );
}
