import { Loader2 } from "lucide-react";

export function LoadingSpinner({
  size = 20,
  label = "Memuat...",
  className = "",
}: {
  size?: number;
  label?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center gap-2 text-sm text-[#4A4C54]/60 ${className}`} role="status">
      <Loader2 size={size} className="animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function PageLoadingSpinner() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <LoadingSpinner size={32} label="Memuat halaman..." />
    </div>
  );
}
