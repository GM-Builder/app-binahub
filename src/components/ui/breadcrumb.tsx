import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-xs text-[#4A4C54]/60">
      <Link href="/" className="inline-flex items-center gap-1 text-[#0B2C6B]/60 hover:text-[#D9A441] transition-colors">
        <Home size={12} />
      </Link>
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          <ChevronRight size={12} className="text-[#4A4C54]/30" />
          {item.href ? (
            <Link href={item.href} className="font-semibold text-[#0B2C6B]/70 hover:text-[#D9A441] transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-[#0B2C6B]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
