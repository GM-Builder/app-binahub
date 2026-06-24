"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, FileText, Target, TrendingUp, TrendingDown, Minus, UsersRound } from "lucide-react";
import { FacilitatorAuthGate } from "@/components/facilitator-auth-gate";
import { AppShell } from "@/components/app-shell";
import { useEngagements, useEvidence, useActions } from "@/hooks/use-transformation-data";
import { ProgressBar, TrendIcon, Breadcrumb, EmptyState, ListSkeleton } from "@/components/ui";
import { ErrorBoundary } from "@/components/error-boundary";

interface Participant {
  id: string;
  name: string;
  evidenceCount: number;
  actionProgress: number;
  pendingActions: number;
}

function ParticipantListContent() {
  const searchParams = useSearchParams();
  const engagementId = searchParams.get("engagement") || "";
  const { engagements } = useEngagements();
  const { evidence, loading: evLoading } = useEvidence(engagementId ? { engagement_id: engagementId } : {});
  const { actions, loading: actLoading } = useActions(engagementId ? { engagement_id: engagementId } : {});

  const engagement = useMemo(() => engagements.find((e) => e.id === engagementId) || null, [engagements, engagementId]);

  const participants = useMemo(() => {
    const map = new Map<string, Participant>();

    evidence.forEach((e) => {
      const pid = e.participant_id || "unknown";
      if (!map.has(pid)) {
        map.set(pid, { id: pid, name: pid === "unknown" ? "Peserta Tidak Dikenal" : pid, evidenceCount: 0, actionProgress: 0, pendingActions: 0 });
      }
      map.get(pid)!.evidenceCount++;
    });

    actions.forEach((a) => {
      const pid = a.participant_id || "unknown";
      if (!map.has(pid)) {
        map.set(pid, { id: pid, name: pid === "unknown" ? "Peserta Tidak Dikenal" : pid, evidenceCount: 0, actionProgress: 0, pendingActions: 0 });
      }
      const p = map.get(pid)!;
      p.actionProgress += a.progress;
      if (a.status !== "done" && a.status !== "verified" && a.status !== "cancelled") {
        p.pendingActions++;
      }
    });

    return Array.from(map.values());
  }, [evidence, actions]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => participants.find((p) => p.id === selectedId) || null, [participants, selectedId]);

  return (
    <>
      {engagement && (
        <Breadcrumb items={[
          { label: "Program Saya", href: "/facilitator/engagements" },
          { label: engagement.title },
        ]} />
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Peserta</p>
          <h2 className="mt-1 text-lg font-semibold text-[#0B2C6B]">{participants.length} peserta</h2>
          {evLoading || actLoading ? (
            <ListSkeleton count={2} />
          ) : participants.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#4A4C54]/50">
              <UsersRound size={24} className="mx-auto mb-2 text-[#0B2C6B]/20" />
              Belum ada peserta terdaftar.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {participants.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full rounded-lg border p-4 text-left transition-colors ${
                    selectedId === p.id ? "border-[#D9A441] bg-[#D9A441]/5" : "border-[#0B2C6B]/8 hover:border-[#0B2C6B]/20"
                  }`}
                >
                  <p className="text-sm font-semibold text-[#0B2C6B]">{p.name}</p>
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div><dt className="text-[#4A4C54]/50">Catatan</dt><dd className="font-semibold text-[#0B2C6B]">{p.evidenceCount}</dd></div>
                    <div><dt className="text-[#4A4C54]/50">Kemajuan</dt><dd className="font-semibold text-[#0B2C6B]">{p.actionProgress}%</dd></div>
                    <div><dt className="text-[#4A4C54]/50">Tertunda</dt><dd className="font-semibold text-[#0B2C6B]">{p.pendingActions}</dd></div>
                  </dl>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
          {selected ? (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Detail Peserta</p>
                  <h2 className="mt-1 text-lg font-semibold text-[#0B2C6B]">{selected.name}</h2>
                </div>
                <Link
                  href={`/facilitator/evidence`}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#0B2C6B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0A255A]"
                >
                  <Eye size={12} /> Amati
                </Link>
              </div>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm"><span className="font-medium text-[#0B2C6B]">Catatan</span><span className="text-xs font-semibold text-[#0B2C6B]">{selected.evidenceCount} item</span></div>
                  <ProgressBar value={Math.min(100, selected.evidenceCount * 10)} color="#D9A441" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm"><span className="font-medium text-[#0B2C6B]">Kemajuan Tindakan</span><span className="text-xs font-semibold text-[#0B2C6B]">{selected.actionProgress}%</span></div>
                  <ProgressBar value={selected.actionProgress} color="#0B2C6B" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center py-16 text-center">
              <div><Target size={32} className="mx-auto text-[#0B2C6B]/20" /><p className="mt-3 text-sm text-[#4A4C54]/50">Pilih peserta untuk melihat detail</p></div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export default function FacilitatorParticipantsPage() {
  return (
    <FacilitatorAuthGate>
      <AppShell role="facilitator" eyebrow="Data Peserta" title="Peserta">
        <ErrorBoundary>
          <Suspense fallback={<div className="py-20 text-center text-sm text-[#4A4C54]/60">Memuat...</div>}>
            <ParticipantListContent />
          </Suspense>
        </ErrorBoundary>
      </AppShell>
    </FacilitatorAuthGate>
  );
}
