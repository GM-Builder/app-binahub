import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`py-20 text-center ${className}`} role="status">
      {Icon && <Icon size={40} className="mx-auto text-[#0B2C6B]/20" aria-hidden="true" />}
      <p className="mt-4 text-sm text-[#4A4C54]/60">{title}</p>
      {description && <p className="mt-1 text-xs text-[#4A4C54]/40">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
