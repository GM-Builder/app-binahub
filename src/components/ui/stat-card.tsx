import React from "react";

export function StatCard({
  label,
  value,
  detail,
  icon,
  className = "",
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] ${className}`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D9A441]">{label}</p>
        {icon && <span className="text-[#0B2C6B]/50">{icon}</span>}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#0B2C6B]">{value}</p>
      {detail && <p className="mt-1 text-xs text-[#4A4C54]/60">{detail}</p>}
    </section>
  );
}
