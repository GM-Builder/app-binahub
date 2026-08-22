"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Building2, MapPin } from "lucide-react";
import { toast } from "sonner";
import type { Engagement, EngagementType, EngagementStatus } from "@/lib/transformation-types";

const TYPE_OPTIONS: EngagementType[] = ["assessment", "coaching", "training", "transformation"];
const STATUS_OPTIONS: EngagementStatus[] = ["draft", "active", "in_progress", "review", "completed", "archived"];

const TYPE_LABELS: Record<EngagementType, string> = {
  assessment: "Assessment",
  coaching: "Coaching",
  training: "Training",
  transformation: "Transformation",
};

const STATUS_LABELS: Record<EngagementStatus, string> = {
  draft: "Draft",
  active: "Aktif",
  in_progress: "Berjalan",
  review: "Review",
  completed: "Selesai",
  archived: "Diarsipkan",
};

export function EngagementEditModal({
  engagement,
  onClose,
  onSaved,
}: {
  engagement: Engagement;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [code, setCode] = useState(engagement.code || "");
  const [title, setTitle] = useState(engagement.title);
  const [type, setType] = useState<EngagementType>(engagement.type);
  const [status, setStatus] = useState<EngagementStatus>(engagement.status);
  const [startDate, setStartDate] = useState(engagement.start_date ? engagement.start_date.slice(0, 10) : "");
  const [endDate, setEndDate] = useState(engagement.end_date ? engagement.end_date.slice(0, 10) : "");
  const [location, setLocation] = useState(engagement.location || "");
  const [participantLimit, setParticipantLimit] = useState(engagement.participant_limit || 100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) {
      setError("Kode dan nama program wajib diisi.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/engagements/${engagement.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          title: title.trim(),
          type,
          status,
          startDate: startDate || null,
          endDate: endDate || null,
          location: location.trim() || null,
          participantLimit,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.error || "Gagal memperbarui program.");
      toast.success("Program diperbarui");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui program.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="edit-engagement-title">
      <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/[0.06] bg-white px-6 py-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#0B2C6B]" />
            <h3 id="edit-engagement-title" className="text-base font-bold text-[#0B2C6B]">Kelola Program</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/[0.04] text-[#4A4C54]" aria-label="Tutup">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase text-[#0B2C6B]">Perusahaan</label>
            <div className="flex min-h-11 items-center gap-2 rounded-xl bg-[#F5F7FA] px-3.5 text-sm font-semibold text-[#0B2C6B]/75"><Building2 className="h-4 w-4 text-[#D9A441]" /> {engagement.organization?.name || "Perusahaan program"}</div>
            <p className="mt-1 text-[10px] text-[#4A4C54]/50">Perusahaan ditetapkan saat program dibuat.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0B2C6B] uppercase mb-1.5">
              Kode Program
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Contoh: TBOS-MAS-2026-01"
              maxLength={50}
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 font-mono text-sm focus:outline-none focus:border-[#0B2C6B] focus:ring-1 focus:ring-[#0B2C6B]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0B2C6B] uppercase mb-1.5">
              Nama Program
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:border-[#0B2C6B] focus:ring-1 focus:ring-[#0B2C6B]/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0B2C6B] uppercase mb-1.5">
                Tipe
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as EngagementType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 text-sm bg-white focus:outline-none focus:border-[#0B2C6B]"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0B2C6B] uppercase mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EngagementStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 text-sm bg-white focus:outline-none focus:border-[#0B2C6B]"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase text-blue-900">Kapasitas Peserta</label>
            <input type="number" value={participantLimit} onChange={(event) => setParticipantLimit(Number(event.target.value))} min={1} max={5000} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-900/10" required />
            <p className="mt-1 text-[10px] text-slate-500">Tidak dapat diisi lebih rendah daripada jumlah peserta yang sudah terdaftar.</p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase text-[#0B2C6B]">Lokasi Program</label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-[#4A4C54]/40" />
              <input type="text" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Opsional" maxLength={200} className="w-full rounded-xl border border-black/10 py-2.5 pl-10 pr-3.5 text-sm focus:border-[#0B2C6B] focus:outline-none focus:ring-1 focus:ring-[#0B2C6B]/20" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0B2C6B] uppercase mb-1.5">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:border-[#0B2C6B]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0B2C6B] uppercase mb-1.5">
                Tanggal Selesai
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:border-[#0B2C6B]"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-black/10 text-sm font-semibold text-[#4A4C54] hover:bg-black/[0.02] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-[#0B2C6B] text-white text-sm font-semibold hover:bg-[#071B3D] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
