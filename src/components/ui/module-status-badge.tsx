import { CheckCircle2, Users } from "lucide-react";

export function ModuleStatusBadge({ tone, label }: { tone: "available" | "guided"; label?: string }) {
  const guided = tone === "guided";
  const Icon = guided ? Users : CheckCircle2;
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${guided ? "bg-blue-50 text-blue-800" : "bg-emerald-50 text-emerald-700"}`}><Icon className="h-3.5 w-3.5" />{label || (guided ? "Terpandu" : "Tersedia")}</span>;
}
