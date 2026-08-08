"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, ClipboardCheck, Eye, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

const items = [
  { href: "/fasilitator/tbos", label: "Form", icon: ClipboardCheck },
  { href: "/fasilitator/tbos/observations", label: "Riwayat", icon: Eye },
  { href: "/fasilitator/tbos/results", label: "Hasil", icon: BarChart3 },
];

export function TbosFacilitatorNav() {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(11,44,107,0.08)] backdrop-blur" aria-label="Navigasi T-BOS">
      <div className="mx-auto flex max-w-2xl items-stretch justify-around">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} aria-current={isActive ? "page" : undefined} className={`flex min-h-16 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-semibold sm:flex-row sm:gap-2 sm:text-xs ${isActive ? "text-[#0B2C6B]" : "text-slate-500 hover:text-[#0B2C6B]"}`}>
              <span className={`flex h-7 min-w-10 items-center justify-center rounded-full ${isActive ? "bg-[#0B2C6B]/10" : ""}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
              {item.label}
            </Link>
          );
        })}
        <button type="button" onClick={logout} className="flex min-h-16 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 sm:flex-row sm:gap-2 sm:text-xs" aria-label="Keluar dari sesi fasilitator">
          <span className="flex h-7 min-w-10 items-center justify-center rounded-full"><LogOut className="h-5 w-5" aria-hidden="true" /></span>
          Keluar
        </button>
      </div>
    </nav>
  );
}
