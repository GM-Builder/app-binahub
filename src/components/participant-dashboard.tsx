"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ClipboardCheck,
  FileClock,
  Gauge,
  ListChecks,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { useEngagements, useEvidence, useActions, useCapabilities } from "@/hooks/use-transformation-data";
import type { Engagement, Evidence, Action, ParticipantCapability } from "@/lib/transformation-types";
import { StatusPill, ProgressBar, TrendIcon, StatCardSkeleton } from "@/components/ui";

export function ParticipantDashboard() {
  const { engagements, loading: engagementsLoading } = useEngagements();
  const { evidence, loading: evidenceLoading } = useEvidence();
  const { actions, loading: actionsLoading } = useActions();
  const [selectedEngagementId, setSelectedEngagementId] = useState<string | null>(null);
  const { capabilities, loading: capsLoading } = useCapabilities(selectedEngagementId);

  const loading = engagementsLoading || evidenceLoading || actionsLoading;

  const activeEngagement = useMemo(() => {
    return engagements.find((e) => e.status === "active" || e.status === "in_progress") || engagements[0] || null;
  }, [engagements]);

  useEffect(() => {
    if (activeEngagement && !selectedEngagementId) {
      setSelectedEngagementId(activeEngagement.id);
    }
  }, [activeEngagement, selectedEngagementId]);

  const recentEvidence = useMemo(() => evidence.slice(0, 5), [evidence]);
  const pendingActions = useMemo(() => actions.filter((a) => a.status !== "done"), [actions]);
  const completedActions = useMemo(() => actions.filter((a) => a.status === "done"), [actions]);
  const averageCapability = useMemo(() => {
    if (!capabilities.length) return 0;
    return Math.round(capabilities.reduce((sum, c) => sum + c.score, 0) / capabilities.length);
  }, [capabilities]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
            <div className="h-3 w-24 animate-pulse rounded bg-[#E6EAF0]" />
            <div className="mt-3 h-5 w-48 animate-pulse rounded bg-[#E6EAF0]" />
            <div className="mt-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-[#E6EAF0]" />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
            <div className="h-3 w-24 animate-pulse rounded bg-[#E6EAF0]" />
            <div className="mt-3 h-5 w-32 animate-pulse rounded bg-[#E6EAF0]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D9A441]">Skor Transformasi</p>
            <Gauge size={16} className="text-[#0B2C6B]/50" />
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#0B2C6B]">{averageCapability || "—"}</p>
          <p className="mt-1 text-xs text-[#4A4C54]/60">Berasal dari semua catatan</p>
        </section>

        <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D9A441]">Program Aktif</p>
            <ClipboardCheck size={16} className="text-[#0B2C6B]/50" />
          </div>
          <p className="mt-3 text-lg font-semibold tracking-[-0.02em] text-[#0B2C6B]">
            {activeEngagement ? activeEngagement.title : "Tidak ada program aktif"}
          </p>
          {activeEngagement && (
            <div className="mt-2">
              <div className="mb-1 flex justify-between text-xs text-[#4A4C54]/60">
                <span>Progress</span>
                <span>{activeEngagement.progress ?? 0}%</span>
              </div>
              <ProgressBar value={activeEngagement.progress ?? 0} />
            </div>
          )}
        </section>

        <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D9A441]">Tindakan Terbuka</p>
            <ListChecks size={16} className="text-[#0B2C6B]/50" />
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#0B2C6B]">{pendingActions.length}</p>
          <p className="mt-1 text-xs text-[#4A4C54]/60">{completedActions.length} selesai</p>
        </section>

        <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D9A441]">Catatan Ditambahkan</p>
            <FileClock size={16} className="text-[#0B2C6B]/50" />
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#0B2C6B]">{evidence.length}</p>
          <p className="mt-1 text-xs text-[#4A4C54]/60">Refleksi, pengamatan, penilaian</p>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Catatan Terbaru</p>
              <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[#0B2C6B]">Aktivitas terbaru</h2>
            </div>
            <Link href="/client/evidence" className="text-xs font-semibold text-[#0B2C6B] hover:text-[#D9A441] transition-colors">
              Lihat semua
            </Link>
          </div>
          {recentEvidence.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#4A4C54]/50">Belum ada catatan. Mulai dengan mengirim refleksi.</p>
          ) : (
            <div className="space-y-3">
              {recentEvidence.map((item) => (
                <article key={item.id} className="rounded-lg border border-[#0B2C6B]/8 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-[#D9A441]">
                        {item.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-[#0B2C6B]">
                        {(item.content as Record<string, unknown>)?.text
                          ? String((item.content as Record<string, unknown>).text).slice(0, 80)
                          : "Catatan ditambahkan"}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-[#4A4C54]/50">
                      {new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
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
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Ringkasan Kemampuan</p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[#0B2C6B]">Perkembangan Anda</h2>
          </div>
          {capsLoading ? (
            <p className="py-8 text-center text-sm text-[#4A4C54]/50">Memuat kemampuan...</p>
          ) : capabilities.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#4A4C54]/50">Belum ada data kemampuan.</p>
          ) : (
            <div className="space-y-3">
              {capabilities.slice(0, 5).map((cap) => (
                <div key={cap.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-[#0B2C6B]">
                      {cap.capability?.name || "Unknown"}
                    </span>
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
          <Link href="/client/capability" className="mt-4 block text-center text-xs font-semibold text-[#0B2C6B] hover:text-[#D9A441] transition-colors">
            Lihat kemampuan lengkap
          </Link>
        </section>
      </div>

      {pendingActions.length > 0 && (
        <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Tindakan Tertunda</p>
              <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[#0B2C6B]">Item yang perlu perhatian</h2>
            </div>
            <Link href="/client/actions" className="text-xs font-semibold text-[#0B2C6B] hover:text-[#D9A441] transition-colors">
              Lihat semua
            </Link>
          </div>
          <div className="space-y-3">
            {pendingActions.slice(0, 3).map((action) => (
              <article key={action.id} className="flex items-center justify-between rounded-lg border border-[#0B2C6B]/8 p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#0B2C6B] truncate">{action.title}</p>
                  <p className="mt-0.5 text-xs text-[#4A4C54]/60">
                    {action.due_date ? `Jatuh tempo ${new Date(action.due_date).toLocaleDateString("id-ID")}` : "Tanpa tenggat"}
                  </p>
                </div>
                <StatusPill status={action.status} />
              </article>
            ))}
          </div>
        </section>
      )}

      {activeEngagement && (
        <section className="rounded-xl border border-[#0B2C6B]/10 bg-[#071B3D] p-5 text-white shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Quick Action</p>
              <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em]">Kirim Refleksi</h2>
            </div>
            <Link
              href={`/client/reflection?engagement=${activeEngagement.id}`}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#D9A441] px-4 py-2 text-sm font-semibold text-[#071B3D] transition hover:bg-[#c49235]"
            >
              Refleksi <ArrowUpRight size={16} />
            </Link>
          </div>
          <p className="mt-3 text-sm leading-6 text-white/70">
            Bagikan apa yang Anda pelajari, apa yang berubah, dan apa yang akan Anda lakukan selanjutnya. Setiap refleksi membuat catatan untuk pertumbuhan kemampuan Anda.
          </p>
        </section>
      )}
    </div>
  );
}
