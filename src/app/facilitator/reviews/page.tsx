"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock, Eye, FileText, XCircle, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { FacilitatorAuthGate } from "@/components/facilitator-auth-gate";
import { AppShell } from "@/components/app-shell";
import { useEngagements, useEvidence, useActions } from "@/hooks/use-transformation-data";
import { StatusPill, ProgressBar, FilterTabs, EmptyState, ListSkeleton, SearchInput } from "@/components/ui";
import { ErrorBoundary } from "@/components/error-boundary";
import Link from "next/link";

interface QueueParticipant {
  id: string;
  name: string;
  evidenceCount: number;
  actionProgress: number;
  pendingActions: number;
  status: "pending" | "reviewed" | "needs_attention";
}

const STATUS_CONFIG = {
  pending: { label: "Menunggu Ditinjau", icon: <Clock size={14} />, tone: "bg-amber-50 text-amber-700" },
  reviewed: { label: "Ditinjau", icon: <CheckCircle2 size={14} />, tone: "bg-emerald-50 text-emerald-700" },
  needs_attention: { label: "Perlu Perhatian", icon: <XCircle size={14} />, tone: "bg-red-50 text-red-700" },
};

export default function FacilitatorReviewsPage() {
  const { engagements, loading: engLoading } = useEngagements();
  const { evidence, loading: evLoading } = useEvidence();
  const { actions, loading: actLoading } = useActions();
  const [filter, setFilter] = useState<"all" | "pending" | "reviewed">("all");
  const [search, setSearch] = useState("");
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  const loading = engLoading || evLoading || actLoading;

  const participants = useMemo(() => {
    const map = new Map<string, QueueParticipant>();

    evidence.forEach((e) => {
      const pid = e.participant_id || "unknown";
      if (!map.has(pid)) {
        map.set(pid, {
          id: pid,
          name: pid === "unknown" ? "Peserta Tidak Dikenal" : pid,
          evidenceCount: 0,
          actionProgress: 0,
          pendingActions: 0,
          status: "pending",
        });
      }
      const p = map.get(pid)!;
      p.evidenceCount++;
    });

    actions.forEach((a) => {
      const pid = a.participant_id || "unknown";
      if (!map.has(pid)) {
        map.set(pid, {
          id: pid,
          name: pid === "unknown" ? "Peserta Tidak Dikenal" : pid,
          evidenceCount: 0,
          actionProgress: 0,
          pendingActions: 0,
          status: "pending",
        });
      }
      const p = map.get(pid)!;
      if (a.status === "done" || a.status === "verified") {
        p.actionProgress += a.progress;
      }
      if (a.status !== "done" && a.status !== "verified" && a.status !== "cancelled") {
        p.pendingActions++;
      }
    });

    const list = Array.from(map.values());
    list.forEach((p) => {
      if (p.pendingActions > 2) p.status = "needs_attention";
      if (reviewedIds.has(p.id)) p.status = "reviewed";
    });

    return list;
  }, [evidence, actions, reviewedIds]);

  const filtered = useMemo(() => {
    let list = filter === "all" ? participants : participants.filter((p) => p.status === filter || (filter === "pending" && p.status === "needs_attention"));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [participants, filter, search]);

  const markReviewed = (id: string) => {
    setReviewedIds((prev) => new Set(prev).add(id));
    toast.success("Peserta ditandai sudah ditinjau");
  };

  const pendingCount = participants.filter((p) => p.status !== "reviewed").length;

  return (
    <FacilitatorAuthGate>
      <AppShell role="facilitator" eyebrow="Ruang Fasilitator" title="Antrian Penilaian">
        <ErrorBoundary>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Cari peserta..." className="w-64" />
            <div className="flex gap-2">
              {(["all", "pending", "reviewed"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    filter === tab ? "bg-[#0B2C6B] text-white" : "border border-[#0B2C6B]/10 text-[#0B2C6B]/70 hover:bg-[#F5F7FA]"
                  }`}
                >
                  {tab === "all" ? "Semua" : tab === "pending" ? `Tertunda (${pendingCount})` : "Ditinjau"}
                </button>
              ))}
            </div>
          </div>

        {loading ? (
          <ListSkeleton count={3} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="Belum ada peserta untuk ditinjau."
            description="Peserta akan muncul setelah ada catatan atau tindakan yang tercatat."
          />
        ) : (
          <div className="space-y-4">
            {filtered.map((p) => {
              const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
              return (
                <section key={p.id} className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-[#0B2C6B]">{p.name}</h3>
                      <p className="text-sm text-[#4A4C54]/60">ID: {p.id}</p>
                    </div>
                    <StatusPill status={p.status} icon={cfg.icon} />
                  </div>
                  <dl className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div><dt className="text-[#4A4C54]/50">Catatan</dt><dd className="font-semibold text-[#0B2C6B]">{p.evidenceCount}</dd></div>
                    <div><dt className="text-[#4A4C54]/50">Kemajuan</dt><dd className="font-semibold text-[#0B2C6B]">{p.actionProgress}%</dd><ProgressBar value={p.actionProgress} /></div>
                    <div><dt className="text-[#4A4C54]/50">Tindakan Tertunda</dt><dd className="font-semibold text-[#0B2C6B]">{p.pendingActions}</dd></div>
                  </dl>
                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/facilitator/evidence`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2C6B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0A255A]"
                    >
                      <Eye size={12} /> Tambah Pengamatan
                    </Link>
                    {p.status !== "reviewed" && (
                      <button
                        type="button"
                        onClick={() => markReviewed(p.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50"
                      >
                        <CheckCircle2 size={12} /> Tandai Ditinjau
                      </button>
                    )}
                    <Link
                      href={`/facilitator/reports?participant=${p.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#0B2C6B]/15 px-3 py-1.5 text-xs font-semibold text-[#0B2C6B] hover:bg-[#F5F7FA]"
                    >
                      <FileText size={12} /> Laporan
                    </Link>
                  </div>
                </section>
              );
            })}
          </div>
        )}
        </ErrorBoundary>
      </AppShell>
    </FacilitatorAuthGate>
  );
}
