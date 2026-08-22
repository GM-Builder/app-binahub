import { AlertTriangle, Info } from "lucide-react";

export function NoticeBanner({ children, tone = "info", className = "" }: { children: React.ReactNode; tone?: "info" | "warning"; className?: string }) {
  const warning = tone === "warning";
  const Icon = warning ? AlertTriangle : Info;
  return <div className={`flex items-start gap-3 rounded-xl border p-4 text-sm leading-6 ${warning ? "border-amber-200 bg-amber-50 text-amber-900" : "border-blue-200 bg-blue-50 text-blue-900"} ${className}`}><Icon className="mt-0.5 h-4 w-4 shrink-0" /> <div>{children}</div></div>;
}
