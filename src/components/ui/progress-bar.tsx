export function ProgressBar({
  value,
  color = "#0B2C6B",
  height = "h-2",
  className = "",
}: {
  value: number;
  color?: string;
  height?: string;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, value));
  const barColor = pct === 100 ? "#10b981" : color;

  return (
    <div className={`${height} rounded-full bg-[#E6EAF0] ${className}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Kemajuan ${pct}%`}>
      <div
        className={`${height} rounded-full transition-all duration-500`}
        style={{ width: `${pct}%`, backgroundColor: barColor }}
      />
    </div>
  );
}
