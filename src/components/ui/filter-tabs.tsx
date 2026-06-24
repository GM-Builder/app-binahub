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
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            active === tab.key
              ? "bg-[#0B2C6B] text-white"
              : "bg-white border border-[#0B2C6B]/10 text-[#0B2C6B]/70 hover:bg-[#F5F7FA]"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] ${active === tab.key ? "bg-white/20" : "bg-[#F5F7FA]"}`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
