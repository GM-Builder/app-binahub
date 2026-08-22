import { Lightbulb } from "lucide-react";

export function TipsCard({ title = "Tips", children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return <aside className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Lightbulb className="h-4 w-4" /></span><h3 className="font-bold text-slate-900">{title}</h3></div><div className="mt-3 text-sm leading-6 text-slate-600">{children}</div></aside>;
}
