"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardCheck, ClipboardPenLine, Home, Trophy, UsersRound } from "lucide-react";

const items = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/programs", label: "Program", icon: ClipboardCheck },
  { href: "/admin/tbos", label: "T-BOS", icon: Trophy },
  { href: "/admin/lep", label: "LEP", icon: ClipboardPenLine },
  { href: "/admin/users", label: "User", icon: UsersRound },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === href;
  if (href === "/admin/programs") {
    return pathname.startsWith("/admin/programs") || pathname.startsWith("/admin/engagements");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminMobileNav() {
  const pathname = usePathname();
  if (pathname === "/admin/login") return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#0B2C6B]/10 bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(11,44,107,0.08)] backdrop-blur lg:hidden" aria-label="Navigasi admin">
      <div className="mx-auto flex max-w-lg items-stretch">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-0.5 text-[10px] font-semibold ${active ? "text-[#0B2C6B]" : "text-[#4A4C54]/65"}`}>
              <span className={`flex h-7 min-w-9 items-center justify-center rounded-full ${active ? "bg-[#0B2C6B]/10" : ""}`}>
                <Icon size={20} aria-hidden="true" />
              </span>
              <span className="max-w-full truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
