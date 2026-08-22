export function LikertScaleRow({ value, onChange, name }: { value: number | null; onChange: (value: number) => void; name: string }) {
  return <div className="mt-3">
    <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:hidden">Sangat tidak setuju</div>
    <div className="flex items-center gap-3">
      <span className="hidden w-20 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:block">Sangat tidak setuju</span>
      <div className="grid flex-1 grid-cols-4 gap-2" role="radiogroup" aria-label={name}>{[1,2,3,4].map((score) => <button key={score} type="button" role="radio" aria-checked={value === score} onClick={() => onChange(score)} className={`h-11 rounded-xl border text-sm font-bold transition ${value === score ? "border-blue-900 bg-blue-900 text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-blue-900/40 hover:bg-blue-50"}`}>{score}</button>)}</div>
      <span className="hidden w-20 shrink-0 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:block">Sangat setuju</span>
    </div>
    <div className="mt-2 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:hidden">Sangat setuju</div>
  </div>;
}
