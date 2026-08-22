export function FilterTabs({
  tabs,
  active,
  onChange,
  className = "",
}: {
  tabs: { key: string; label: string; count?: number }[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={`inline-flex max-w-full flex-wrap gap-1 rounded-xl bg-slate-100 p-1 ${className}`} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          role="tab"
          aria-selected={active === tab.key}
          className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            active === tab.key
              ? "bg-blue-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-white hover:text-blue-900"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] ${active === tab.key ? "bg-white/20" : "bg-white"}`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
