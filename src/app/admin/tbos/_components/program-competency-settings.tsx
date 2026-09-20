"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, LockKeyhole, Settings2 } from "lucide-react";
import { toast } from "sonner";
import {
  fetchProgramCompetencies,
  updateProgramCompetencies,
  type TbosProgramCompetency,
} from "@/modules/tbos/api-client";

export function TbosProgramCompetencySettings({ programId, onSaved }: { programId: string; onSaved?: () => void }) {
  const [dimensions, setDimensions] = useState<TbosProgramCompetency[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [observationCount, setObservationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!programId) return;
    setLoading(true);
    setError("");
    try {
      const config = await fetchProgramCompetencies(programId);
      setDimensions(config.dimensions);
      setSelected(config.selectedDimensionIds);
      setLocked(config.locked);
      setObservationCount(config.observationCount);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Kompetensi program tidak dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const toggle = (dimensionId: string) => {
    if (locked) return;
    setSelected((current) => current.includes(dimensionId)
      ? current.filter((id) => id !== dimensionId)
      : [...current, dimensionId]);
  };

  const save = async () => {
    if (selected.length < 1) {
      setError("Pilih minimal satu kompetensi.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const ordered = dimensions.filter((dimension) => selected.includes(dimension.id)).map((dimension) => dimension.id);
      await updateProgramCompetencies(programId, ordered);
      toast.success(`${ordered.length} kompetensi program disimpan.`);
      await load();
      onSaved?.();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Kompetensi program tidak dapat disimpan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(8,29,66,0.05)] sm:p-5" aria-labelledby="program-competencies-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B2C6B]/[0.06] text-[#0B2C6B]">
            {locked ? <LockKeyhole className="h-5 w-5" /> : <Settings2 className="h-5 w-5" />}
          </span>
          <div>
            <h2 id="program-competencies-title" className="text-sm font-bold text-[#0B2C6B]">Kompetensi yang diukur</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
              Pilih 1–8 kompetensi. Fasilitator hanya akan melihat kompetensi ini; dashboard dan PDF mengikuti pilihan yang sama.
            </p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${locked ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
          {locked ? `Terkunci · ${observationCount} observasi` : `${selected.length} dipilih · dapat diubah`}
        </span>
      </div>

      {loading ? (
        <div className="mt-4 flex min-h-20 items-center justify-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Memuat kompetensi...</div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {dimensions.map((dimension) => {
            const active = selected.includes(dimension.id);
            return (
              <button
                key={dimension.id}
                type="button"
                disabled={locked}
                onClick={() => toggle(dimension.id)}
                aria-pressed={active}
                title={dimension.question}
                className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 text-left text-xs font-semibold transition-colors ${active ? "border-[#0B2C6B] bg-[#0B2C6B] text-white" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-[#0B2C6B]/30"} disabled:cursor-not-allowed disabled:opacity-75`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-md ${active ? "bg-white/15" : "bg-white"}`}>{active && <Check className="h-3.5 w-3.5" />}</span>
                {dimension.name}
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">{error}</p>}
      {!locked && !loading && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-500">Pilihan otomatis terkunci setelah observasi pertama tersimpan.</p>
          <button type="button" onClick={() => void save()} disabled={saving || selected.length < 1} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0B2C6B] px-4 text-xs font-bold text-white disabled:opacity-40">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Simpan kompetensi
          </button>
        </div>
      )}
    </section>
  );
}
