import { BarChart3, CheckCircle2, FileText, ShieldCheck } from "lucide-react";

const EVIDENCE_WEIGHTS: Record<string, number> = {
  assessment: 1,
  reflection: 0.55,
  observation: 0.85,
  feedback: 0.8,
  coaching_note: 0.7,
  action_completion: 0.75,
  survey: 0.65,
};

const SOURCE_RELIABILITY: Record<string, number> = {
  system: 0.95,
  facilitator: 0.9,
  manager: 0.85,
  participant: 0.7,
};

export function calculateQualityScore(confidence: number, type: string, source: string): number {
  const weight = EVIDENCE_WEIGHTS[type] || 0.5;
  const reliability = SOURCE_RELIABILITY[source] || 0.7;
  return Math.round(confidence * weight * reliability * 100);
}

export function getQualityGrade(score: number): { label: string; tone: string } {
  if (score >= 80) return { label: "Tinggi", tone: "bg-emerald-50 text-emerald-700" };
  if (score >= 60) return { label: "Sedang", tone: "bg-amber-50 text-amber-700" };
  if (score >= 40) return { label: "Rendah", tone: "bg-orange-50 text-orange-700" };
  return { label: "Tidak Andal", tone: "bg-red-50 text-red-700" };
}

export function getTypeWeight(type: string): number {
  return EVIDENCE_WEIGHTS[type] || 0.5;
}

export function getSourceReliability(source: string): number {
  return SOURCE_RELIABILITY[source] || 0.7;
}

export function QualityBadge({ score }: { score: number }) {
  const grade = getQualityGrade(score);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${grade.tone}`}>
      <ShieldCheck size={10} />
      {grade.label} ({score})
    </span>
  );
}

export function WeightIndicator({ type, source }: { type: string; source: string }) {
  const weight = getTypeWeight(type);
  const reliability = getSourceReliability(source);
  return (
    <div className="flex items-center gap-2 text-[10px] text-[#4A4C54]/60">
      <span>w:{weight.toFixed(2)}</span>
      <span>s:{reliability.toFixed(2)}</span>
    </div>
  );
}

interface EvidenceStats {
  total: number;
  byType: Record<string, number>;
  bySource: Record<string, number>;
  byQuality: { high: number; medium: number; low: number };
  averageQuality: number;
}

export function calcEvidenceStats(evidence: { type: string; source: string; confidence_score: number }[]): EvidenceStats {
  const stats: EvidenceStats = { total: evidence.length, byType: {}, bySource: {}, byQuality: { high: 0, medium: 0, low: 0 }, averageQuality: 0 };
  let totalQuality = 0;
  evidence.forEach((e) => {
    stats.byType[e.type] = (stats.byType[e.type] || 0) + 1;
    stats.bySource[e.source] = (stats.bySource[e.source] || 0) + 1;
    const q = calculateQualityScore(e.confidence_score, e.type, e.source);
    totalQuality += q;
    if (q >= 80) stats.byQuality.high++;
    else if (q >= 60) stats.byQuality.medium++;
    else stats.byQuality.low++;
  });
  stats.averageQuality = evidence.length ? Math.round(totalQuality / evidence.length) : 0;
  return stats;
}

export function EvidenceQualityDashboard({ stats }: { stats: EvidenceStats }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-4 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
        <div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D9A441]">Total Catatan</p><FileText size={14} className="text-[#0B2C6B]/40" /></div>
        <p className="mt-2 text-2xl font-semibold text-[#0B2C6B]">{stats.total}</p>
      </section>
      <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-4 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
        <div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D9A441]">Rata-rata Kualitas</p><BarChart3 size={14} className="text-[#0B2C6B]/40" /></div>
        <p className="mt-2 text-2xl font-semibold text-[#0B2C6B]">{stats.averageQuality}</p>
      </section>
      <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-4 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
        <div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D9A441]">Kualitas Tinggi</p><CheckCircle2 size={14} className="text-[#0B2C6B]/40" /></div>
        <p className="mt-2 text-2xl font-semibold text-emerald-600">{stats.byQuality.high}</p>
      </section>
      <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-4 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
        <div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D9A441]">Perlu Ditinjau</p><ShieldCheck size={14} className="text-[#0B2C6B]/40" /></div>
        <p className="mt-2 text-2xl font-semibold text-amber-600">{stats.byQuality.low + stats.byQuality.medium}</p>
      </section>
    </div>
  );
}
