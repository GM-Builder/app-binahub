import React from "react";

const STATUS_CONFIG: Record<string, { label: string; icon?: React.ReactNode; tone: string }> = {
  draft: { label: "Draf", tone: "bg-slate-100 text-slate-600" },
  active: { label: "Aktif", tone: "bg-emerald-50 text-emerald-700" },
  in_progress: { label: "Sedang Berjalan", tone: "bg-blue-50 text-blue-700" },
  review: { label: "Ditinjau", tone: "bg-amber-50 text-amber-700" },
  completed: { label: "Selesai", tone: "bg-emerald-50 text-emerald-700" },
  archived: { label: "Diarsipkan", tone: "bg-slate-100 text-slate-600" },
  todo: { label: "Akan Dilakukan", tone: "bg-slate-100 text-slate-700" },
  blocked: { label: "Terhambat", tone: "bg-red-50 text-red-700" },
  done: { label: "Selesai", tone: "bg-emerald-50 text-emerald-700" },
  verified: { label: "Terverifikasi", tone: "bg-indigo-50 text-indigo-700" },
  cancelled: { label: "Dibatalkan", tone: "bg-gray-100 text-gray-500" },
  pending: { label: "Menunggu Ditinjau", tone: "bg-amber-50 text-amber-700" },
  reviewed: { label: "Ditinjau", tone: "bg-emerald-50 text-emerald-700" },
  needs_attention: { label: "Perlu Perhatian", tone: "bg-red-50 text-red-700" },
};

export function StatusPill({
  status,
  icon,
  className = "",
}: {
  status: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  const config = STATUS_CONFIG[status] || {
    label: status.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    tone: "bg-slate-100 text-slate-600",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${config.tone} ${className}`} role="status" aria-label={`Status: ${config.label}`}>
      {icon || config.icon}
      {config.label}
    </span>
  );
}
