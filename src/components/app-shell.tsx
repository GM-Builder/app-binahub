"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Home,
  LogOut,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import type { Role } from "@/lib/roles";
import { supabase } from "@/lib/supabase";

const navByRole: Record<Role, { href: string; label: string; icon: React.ReactNode }[]> = {
  client: [
    { href: "/client/dashboard", label: "Dashboard", icon: <Home size={16} /> },
    { href: "/client/binaimpact", label: "Evaluasi Program", icon: <ClipboardCheck size={16} /> },
    { href: "/client/binaimpact/pre-test", label: "Pre-Test", icon: <FileText size={16} /> },
    { href: "/client/binaimpact/post-test", label: "Post-Test", icon: <ArrowUpRight size={16} /> },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Dashboard", icon: <Home size={16} /> },
    { href: "/admin/organizations", label: "Organizations", icon: <UsersRound size={16} /> },
    { href: "/admin/assessments", label: "Assessments", icon: <ClipboardList size={16} /> },
  ],
  facilitator: [
    { href: "/facilitator/dashboard", label: "Dashboard", icon: <Home size={16} /> },
    { href: "/facilitator/binaimpact", label: "BinaImpact", icon: <ArrowUpRight size={16} /> },
    { href: "/facilitator/scoring", label: "Scoring", icon: <ClipboardList size={16} /> },
    { href: "/facilitator/statistics", label: "Statistics", icon: <BarChart3 size={16} /> },
    { href: "/facilitator/reviews", label: "Reviews", icon: <ShieldCheck size={16} /> },
  ],
};

export function AppShell({
  role,
  title,
  eyebrow,
  children,
}: {
  role: Role;
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const showLogout = role === "client" || role === "facilitator";

  const logout = useCallback(async () => {
    if (role === "client") {
      await fetch("/api/client/logout", { method: "POST" });
    }

    if (role === "facilitator") {
      await supabase.auth.signOut();
    }

    router.replace("/");
    router.refresh();
  }, [role, router]);

  useEffect(() => {
    if (!showLogout) return;

    window.history.pushState({ binahubGuard: true }, "", window.location.href);

    const handleBack = () => {
      const shouldLogout = window.confirm("Keluar dari sesi ini?");
      if (shouldLogout) {
        void logout();
        return;
      }

      window.history.pushState({ binahubGuard: true }, "", window.location.href);
    };

    window.addEventListener("popstate", handleBack);
    return () => window.removeEventListener("popstate", handleBack);
  }, [logout, showLogout]);

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#4A4C54]">
      <aside className="border-b border-[#0B2C6B]/10 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col px-5 py-5">
          <Link href="/" className="mb-8 block">
            <Image
              src="/full-logo.png"
              alt="BinaHub"
              width={150}
              height={42}
              className="h-10 w-auto object-contain object-left"
              priority
            />
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#D9A441]">
              Operating Platform
            </p>
          </Link>
          <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {navByRole[role].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#0B2C6B]/76 transition hover:bg-[#F5F7FA] hover:text-[#0B2C6B]"
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
          {showLogout && (
            <button
              type="button"
              onClick={logout}
              className="mt-4 inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 lg:mt-auto"
            >
              <LogOut size={16} />
              Logout
            </button>
          )}
        </div>
      </aside>
      <main className="lg:pl-72">
        <header className="border-b border-[#0B2C6B]/10 bg-white px-6 py-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D9A441]">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#0B2C6B]">{title}</h1>
        </header>
        <div className="px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
