"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ClientAuthGate } from "@/components/client-auth-gate";
import { AppShell } from "@/components/app-shell";
import { useEngagements } from "@/hooks/use-transformation-data";
import { StatusPill, ProgressBar, EmptyState, ListSkeleton } from "@/components/ui";
import { ErrorBoundary } from "@/components/error-boundary";

export default function ClientEngagementsPage() {
  const { engagements, loading } = useEngagements();

  return (
    <ClientAuthGate>
      <AppShell role="client" eyebrow="Layanan" title="Program">
        <ErrorBoundary>
          {loading ? (
            <ListSkeleton count={3} />
          ) : engagements.length === 0 ? (
            <EmptyState title="Tidak ada program ditemukan." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {engagements.map((engagement) => (
                <Link
                  key={engagement.id}
                  href={`/client/engagements/detail?id=${engagement.id}`}
                  className="group rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] transition hover:shadow-[0_18px_52px_-32px_rgba(11,44,107,0.5)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#D9A441]">
                        {engagement.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </p>
                      <h3 className="mt-1 truncate text-base font-semibold tracking-[-0.02em] text-[#0B2C6B] group-hover:text-[#D9A441] transition-colors">
                        {engagement.title}
                      </h3>
                    </div>
                    <StatusPill status={engagement.status} />
                  </div>
                  <div className="mt-4">
                    <div className="mb-2 flex justify-between text-xs font-semibold text-[#0B2C6B]/70">
                      <span>Progress</span>
                      <span>{engagement.progress ?? 0}%</span>
                    </div>
                    <ProgressBar value={engagement.progress ?? 0} />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-[#4A4C54]/60">
                      {engagement.participants ?? 0} peserta
                    </span>
                    <ArrowUpRight size={16} className="text-[#0B2C6B]/40 group-hover:text-[#D9A441] transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ErrorBoundary>
      </AppShell>
    </ClientAuthGate>
  );
}
