export function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[8px] border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D9A441]">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#0B2C6B]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[#4A4C54]/70">{detail}</p>
    </div>
  );
}
