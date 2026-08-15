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
  useEffect(() => {
    let active = true;
    void fetchTbosPrograms(moduleKey)
      .then((items) => {
        if (!active) return;
        setPrograms(items);
        if (!value && items[0]) onChange(items[0].id);
      })
      .catch(() => {
        if (active) setPrograms([]);
      });
    return () => { active = false; };
  }, [moduleKey, onChange, value]);
  return (
    <label className="flex items-center gap-2 text-xs font-semibold text-[#0B2C6B]">
      Program
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-10 min-w-56 rounded-lg border border-[#0B2C6B]/15 bg-white px-3 text-sm font-semibold outline-none focus:border-[#D9A441]">
        {programs.length === 0 && <option value="">Tidak ada program aktif</option>}
        {programs.map((program) => <option key={program.id} value={program.id}>{program.code ? `${program.code} · ` : ""}{program.title}</option>)}
      </select>
    </label>
  );
}
