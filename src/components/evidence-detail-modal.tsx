import { X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import type { Evidence } from "@/lib/transformation-types";
import { calculateQualityScore, getQualityGrade, QualityBadge, WeightIndicator } from "./evidence-quality";

const TYPE_LABELS: Record<string, string> = {
  assessment: "Penilaian",
  reflection: "Refleksi",
  observation: "Pengamatan",
  feedback: "Umpan Balik",
  coaching_note: "Pembinaan",
  action_completion: "Tindakan",
  survey: "Survei",
};

const SOURCE_LABELS: Record<string, string> = {
  participant: "Peserta",
  facilitator: "Fasilitator",
  manager: "Manajer",
  system: "Sistem",
};

const AVAILABLE_TAGS = [
  "Adaptability",
  "Collaboration",
  "Communication",
  "Critical Thinking",
  "Emotional Intelligence",
  "Growth Mindset",
  "Leadership",
  "Problem Solving",
  "Resilience",
  "Strategic Thinking",
  "Teamwork",
  "Time Management",
];

export function EvidenceDetailModal({
  item,
  onClose,
  onUpdateTags,
}: {
  item: Evidence;
  onClose: () => void;
  onUpdateTags?: (tags: string[]) => void;
}) {
  const content = item.content as Record<string, unknown>;
  const qualityScore = calculateQualityScore(item.confidence_score, item.type, item.source);
  const grade = getQualityGrade(qualityScore);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Detail Catatan"
    >
      <section onClick={(e) => e.stopPropagation()} className="mx-4 w-full max-w-2xl rounded-2xl border border-[#0B2C6B]/10 bg-white p-6 shadow-2xl">
        <header className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#0B2C6B]">Detail Catatan</h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-lg p-1.5 text-[#4A4C54]/50 hover:bg-[#F5F7FA] hover:text-[#0B2C6B]">
            <X size={18} />
          </button>
        </header>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <InfoRow label="Tipe" value={TYPE_LABELS[item.type] || item.type} />
          <InfoRow label="Sumber" value={SOURCE_LABELS[item.source] || item.source} />
          <InfoRow label="Keyakinan" value={`${Math.round(item.confidence_score * 100)}%`} />
          <InfoRow label="Skor Kualitas" value={<QualityBadge score={qualityScore} />} />
          <InfoRow label="Bobot" value={`${((item as any).weight || 0.5).toFixed(2)}`} />
          <InfoRow label="Dibuat" value={new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} />
        </div>

        <div className="mt-4">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#D9A441]">Konten</h3>
          <div className="rounded-lg bg-[#F5F7FA] p-3">
            <p className="text-sm leading-6 text-[#0B2C6B]">
              {String(content?.text || content?.answer || content?.note || content?.summary || "Catatan ditambahkan.")}
            </p>
          </div>
        </div>

        {typeof content?.prompt === "string" && content.prompt && (
          <div className="mt-3">
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#D9A441]">Prompt</h3>
            <div className="rounded-lg bg-[#F5F7FA] p-3">
              <p className="text-sm text-[#4A4C54]">{String(content.prompt)}</p>
            </div>
          </div>
        )}

        <EvidenceTagManager tags={item.capability_tags} onUpdate={onUpdateTags} />
      </section>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#4A4C54]/50">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#0B2C6B]">{value}</p>
    </div>
  );
}

function EvidenceTagManager({ tags, onUpdate }: { tags: string[]; onUpdate?: (tags: string[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [localTags, setLocalTags] = useState<string[]>(tags);

  const handleAdd = (tag: string) => {
    if (localTags.includes(tag)) return;
    const next = [...localTags, tag];
    setLocalTags(next);
    onUpdate?.(next);
    setAdding(false);
  };

  const handleRemove = (tag: string) => {
    const next = localTags.filter((t) => t !== tag);
    setLocalTags(next);
    onUpdate?.(next);
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D9A441]">Tag Kemampuan</h3>
        <button type="button" onClick={() => setAdding(!adding)} className="text-[10px] font-bold text-[#D9A441] hover:text-[#0B2C6B]">
          + Tambah Tag
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {localTags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-[#F5F7FA] px-2.5 py-1 text-xs font-semibold text-[#0B2C6B]">
            {tag}
            <button type="button" onClick={() => handleRemove(tag)} className="text-[#4A4C54]/40 hover:text-red-500">&times;</button>
          </span>
        ))}
      </div>
      {adding && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {AVAILABLE_TAGS.filter((t) => !localTags.includes(t)).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleAdd(tag)}
              className="rounded-full border border-dashed border-[#0B2C6B]/20 px-2.5 py-1 text-xs font-semibold text-[#4A4C54]/70 hover:border-[#D9A441] hover:text-[#D9A441]"
            >
              + {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
