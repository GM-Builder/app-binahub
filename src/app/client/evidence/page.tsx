"use client";

import { useMemo, useState } from "react";
import { FileClock, Filter } from "lucide-react";
import { ClientAuthGate } from "@/components/client-auth-gate";
import { AppShell } from "@/components/app-shell";
import { useEvidence } from "@/hooks/use-transformation-data";
import type { Evidence, EvidenceType } from "@/lib/transformation-types";
import { QualityBadge, WeightIndicator, calcEvidenceStats, EvidenceQualityDashboard } from "@/components/evidence-quality";
import { EvidenceDetailModal } from "@/components/evidence-detail-modal";
import { updateEvidenceTags } from "@/hooks/use-transformation-data";
import { SearchInput } from "@/components/ui";
import { ErrorBoundary } from "@/components/error-boundary";

const TYPE_LABELS: Record<string, string> = {
  assessment: "Penilaian",
  reflection: "Refleksi",
  observation: "Pengamatan",
  feedback: "Umpan Balik",
  coaching_note: "Pembinaan",
  action_completion: "Tindakan",
  survey: "Survei",
};

const TYPE_COLORS: Record<string, string> = {
  assessment: "bg-indigo-50 text-indigo-700",
  reflection: "bg-blue-50 text-blue-700",
  observation: "bg-amber-50 text-amber-700",
  feedback: "bg-emerald-50 text-emerald-700",
  coaching_note: "bg-purple-50 text-purple-700",
  action_completion: "bg-teal-50 text-teal-700",
  survey: "bg-orange-50 text-orange-700",
};

const SOURCE_LABELS: Record<string, string> = {
  participant: "Anda",
  facilitator: "Fasilitator",
  manager: "Manajer",
  system: "Sistem",
};

function EvidenceCard({ item, onDetail }: { item: Evidence; onDetail: () => void }) {
  const content = item.content as Record<string, unknown>;
  const preview = String(content?.text || content?.answer || content?.note || content?.summary || "Catatan direkam.");

  return (
    <article className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TYPE_COLORS[item.type] || "bg-slate-100 text-slate-700"}`}>
            {TYPE_LABELS[item.type] || item.type}
          </span>
          <span className="text-xs text-[#4A4C54]/50">
            melalui {SOURCE_LABELS[item.source] || item.source}
          </span>
        </div>
        <span className="text-xs font-semibold text-[#4A4C54]/50">
          {new Date(item.created_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-[#0B2C6B] line-clamp-3">{preview}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {item.capability_tags.map((tag) => (
          <span key={tag} className="rounded-full bg-[#F5F7FA] px-2.5 py-1 text-xs font-semibold text-[#0B2C6B]">
            {tag}
          </span>
        ))}
        <QualityBadge score={item.confidence_score * 100} />
        <WeightIndicator type={item.type} source={item.source} />
      </div>

      <div className="mt-3 flex justify-end">
        <button type="button" onClick={onDetail} className="text-xs font-bold text-[#D9A441] hover:text-[#0B2C6B]">
          Detail
        </button>
      </div>
    </article>
  );
}

export default function ClientEvidencePage() {
  const [refetchKey, setRefetchKey] = useState(0);
  const { evidence, loading } = useEvidence({ key: refetchKey });
  const [typeFilter, setTypeFilter] = useState<EvidenceType | "all">("all");
  const [search, setSearch] = useState("");
  const [detailItem, setDetailItem] = useState<Evidence | null>(null);

  const handleUpdateTags = async (evidenceId: string, tags: string[]) => {
    await updateEvidenceTags(evidenceId, tags);
    setRefetchKey((k) => k + 1);
  };

  const filtered = useMemo(() => {
    let list = typeFilter === "all" ? evidence : evidence.filter((e) => e.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) => {
        const content = e.content as Record<string, unknown>;
        const text = String(content?.text || content?.answer || content?.note || content?.summary || "");
        return text.toLowerCase().includes(q) || e.capability_tags.some((t) => t.toLowerCase().includes(q));
      });
    }
    return list;
  }, [evidence, typeFilter, search]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [filtered],
  );

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: evidence.length };
    evidence.forEach((e) => {
      counts[e.type] = (counts[e.type] || 0) + 1;
    });
    return counts;
  }, [evidence]);

  const availableTypes = useMemo(
    () => Object.keys(typeCounts).filter((k) => k !== "all" && typeCounts[k] > 0),
    [typeCounts],
  );

  const stats = useMemo(() => calcEvidenceStats(evidence), [evidence]);

  return (
    <ClientAuthGate>
      <AppShell role="client" eyebrow="Sistem Catatan" title="Linimasa Catatan">
        <ErrorBoundary>
          {evidence.length > 0 && (
            <div className="mb-6">
              <EvidenceQualityDashboard stats={stats} />
            </div>
          )}

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Cari catatan..." className="w-64" />
          <Filter size={16} className="text-[#0B2C6B]/50" />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTypeFilter("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                typeFilter === "all"
                  ? "bg-[#0B2C6B] text-white"
                  : "bg-white border border-[#0B2C6B]/10 text-[#0B2C6B]/70 hover:bg-[#F5F7FA]"
              }`}
            >
              Semua ({typeCounts.all || 0})
            </button>
            {availableTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTypeFilter(type as EvidenceType)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  typeFilter === type
                    ? "bg-[#0B2C6B] text-white"
                    : "bg-white border border-[#0B2C6B]/10 text-[#0B2C6B]/70 hover:bg-[#F5F7FA]"
                }`}
              >
                {TYPE_LABELS[type] || type} ({typeCounts[type] || 0})
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-[#4A4C54]/60">Memuat catatan...</div>
        ) : sorted.length === 0 ? (
          <div className="py-20 text-center">
            <FileClock size={40} className="mx-auto text-[#0B2C6B]/20" />
            <p className="mt-4 text-sm text-[#4A4C54]/60">
              {typeFilter === "all" ? "Belum ada catatan." : `Tidak ada ${(TYPE_LABELS[typeFilter] || typeFilter).toLowerCase()}.`}
            </p>
          </div>
        ) : (
          <div className="relative space-y-0">
            <div className="absolute left-[23px] top-4 bottom-4 w-px bg-[#0B2C6B]/10" />
            {sorted.map((item) => (
              <div key={item.id} className="relative flex gap-4 py-2">
                <div className="relative z-10 mt-5 h-3 w-3 shrink-0 rounded-full border-2 border-[#0B2C6B] bg-white" />
                <div className="min-w-0 flex-1">
                  <EvidenceCard item={item} onDetail={() => setDetailItem(item)} />
                </div>
              </div>
            ))}
          </div>
        )}

        {detailItem && (
          <EvidenceDetailModal
            item={detailItem}
            onClose={() => setDetailItem(null)}
            onUpdateTags={(tags) => handleUpdateTags(detailItem.id, tags)}
          />
        )}
        </ErrorBoundary>
      </AppShell>
    </ClientAuthGate>
  );
}
