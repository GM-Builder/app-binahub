"use client";

import { useEffect, useState } from "react";
import { fetchTbosPrograms, type TbosProgram } from "@/modules/tbos/api-client";

export function TbosProgramSelector({
  value,
  onChange,
  moduleKey = "tbos",
}: {
  value: string;
  onChange: (value: string) => void;
  moduleKey?: "tbos" | "lep";
}) {
  const [programs, setPrograms] = useState<TbosProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const storageKey = `binahub:${moduleKey}:selected-program`;
  useEffect(() => {
    let active = true;
    void fetchTbosPrograms(moduleKey)
      .then((items) => {
        if (!active) return;
        setPrograms(items);
        setLoading(false);
      })
      .catch((failure) => {
        if (active) {
          setPrograms([]);
          setError(failure instanceof Error ? failure.message : "Daftar program tidak dapat dimuat.");
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, [moduleKey]);

  useEffect(() => {
    if (value || !programs[0]) return;
    const storedProgramId = window.sessionStorage.getItem(storageKey);
    const nextProgramId = programs.some((program) => program.id === storedProgramId)
      ? storedProgramId as string
      : programs[0].id;
    window.sessionStorage.setItem(storageKey, nextProgramId);
    onChange(nextProgramId);
  }, [onChange, programs, storageKey, value]);

  const handleChange = (nextValue: string) => {
    window.sessionStorage.setItem(storageKey, nextValue);
    onChange(nextValue);
  };
  const statusId = `program-selector-${moduleKey}-status`;
  return (
    <div className="min-w-0">
      <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#0B2C6B] sm:flex-row sm:items-center sm:gap-2">
        Program
        <select value={value} onChange={(event) => handleChange(event.target.value)} disabled={loading || Boolean(error) || programs.length === 0} aria-describedby={error || programs.length === 0 ? statusId : undefined} className="min-h-11 w-full min-w-0 rounded-xl border border-[#0B2C6B]/15 bg-white px-3 text-sm font-semibold outline-none focus:border-[#D9A441] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:w-auto sm:min-w-64">
          {loading && <option value="">Memuat program...</option>}
          {!loading && error && <option value="">Program gagal dimuat</option>}
          {!loading && !error && programs.length === 0 && <option value="">Belum ada program {moduleKey === "lep" ? "LEP" : "T-BOS"} aktif</option>}
          {programs.map((program) => <option key={program.id} value={program.id}>{program.code ? `${program.code} · ` : ""}{program.title}</option>)}
        </select>
      </label>
      {!loading && (error || programs.length === 0) && <p id={statusId} role={error ? "alert" : "status"} className={`mt-1 text-[11px] ${error ? "text-red-700" : "text-slate-500"}`}>{error || `Aktifkan modul ${moduleKey === "lep" ? "LEP" : "T-BOS"} pada salah satu program aktif.`}</p>}
    </div>
  );
}
