"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { usePageTracking } from "@/hooks/use-analytics";
import {
  ArrowUpRight,
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  Eye,
  FileClock,
  FileText,
  HelpCircle,
  Home,
  Lightbulb,
  LogOut,
  Menu,
  RadioTower,
  ShieldCheck,
  Target,
  UsersRound,
  X,
} from "lucide-react";

import type { Role } from "@/lib/roles";
import { supabase } from "@/lib/supabase";
import { HelpSidebar } from "@/components/help-sidebar";

const navByRole: Record<Role, { href: string; label: string; icon: React.ReactNode }[]> = {
  client: [
    { href: "/client/dashboard", label: "Dashboard", icon: <Home size={16} /> },
    { href: "/client/engagements", label: "Program", icon: <ClipboardCheck size={16} /> },
    { href: "/client/reflection", label: "Refleksi", icon: <Lightbulb size={16} /> },
    { href: "/client/evidence", label: "Catatan", icon: <FileClock size={16} /> },
    { href: "/client/actions", label: "Tindakan", icon: <ClipboardList size={16} /> },
    { href: "/client/capability", label: "Kemampuan", icon: <Target size={16} /> },
    { href: "/help", label: "Bantuan", icon: <HelpCircle size={16} /> },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Dashboard", icon: <Home size={16} /> },
    { href: "/admin/organizations", label: "Organisasi", icon: <UsersRound size={16} /> },
    { href: "/admin/assessments", label: "Assessment", icon: <ClipboardList size={16} /> },
    { href: "/help", label: "Bantuan", icon: <HelpCircle size={16} /> },
  ],
  facilitator: [
    { href: "/facilitator/dashboard", label: "Dashboard", icon: <Home size={16} /> },
    { href: "/facilitator/engagements", label: "Program Saya", icon: <ArrowUpRight size={16} /> },
    { href: "/facilitator/participants", label: "Peserta", icon: <UsersRound size={16} /> },
    { href: "/facilitator/evidence", label: "Pengamatan", icon: <Eye size={16} /> },
    { href: "/facilitator/reviews", label: "Antrian Penilaian", icon: <ShieldCheck size={16} /> },
    { href: "/facilitator/reports", label: "Laporan", icon: <FileText size={16} /> },
    { href: "/facilitator/events", label: "Antrian Kejadian", icon: <RadioTower size={16} /> },
    { href: "/facilitator/statistics", label: "Statistik", icon: <BarChart3 size={16} /> },
    { href: "/help", label: "Bantuan", icon: <HelpCircle size={16} /> },
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
  const pathname = usePathname();
  usePageTracking();
  const showLogout = role === "client" || role === "facilitator";
  const [showTips, setShowTips] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }, [router]);

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

  useEffect(() => {
    setShowMobileNav(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#4A4C54]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-[#0B2C6B] focus:text-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold">
        Langsung ke konten utama
      </a>
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-[#0B2C6B]/10 lg:bg-white" role="complementary" aria-label="Navigasi sisi">
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
          <nav className="flex flex-col gap-2" aria-label="Navigasi utama">
            {navByRole[role].map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#0B2C6B] text-white"
                      : "text-[#0B2C6B]/76 hover:bg-[#F5F7FA] hover:text-[#0B2C6B]"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
          {showLogout && (
            <button
              type="button"
              onClick={logout}
              aria-label="Keluar dari sesi"
              className="mt-4 inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 lg:mt-auto"
            >
              <LogOut size={16} />
              Logout
            </button>
          )}
        </div>
      </aside>

      <div className="lg:hidden">
        {showMobileNav && (
          <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Navigasi mobile">
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowMobileNav(false)} />
            <aside className="absolute left-0 top-0 h-full w-72 overflow-y-auto bg-white p-5 shadow-xl">
              <div className="mb-6 flex items-center justify-between">
                <Link href="/" className="block">
                  <Image src="/full-logo.png" alt="BinaHub" width={120} height={34} className="h-8 w-auto object-contain object-left" priority />
                </Link>
                <button type="button" onClick={() => setShowMobileNav(false)} aria-label="Tutup navigasi" className="text-[#4A4C54]/50 hover:text-[#0B2C6B]">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex flex-col gap-2" aria-label="Navigasi mobile">
                {navByRole[role].map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                        isActive
                          ? "bg-[#0B2C6B] text-white"
                          : "text-[#0B2C6B]/76 hover:bg-[#F5F7FA] hover:text-[#0B2C6B]"
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              {showLogout && (
                <button
                  type="button"
                  onClick={logout}
                  aria-label="Keluar dari sesi"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              )}
            </aside>
          </div>
        )}
      </div>

      <main id="main-content" className="lg:pl-72" role="main">
        <header className="border-b border-[#0B2C6B]/10 bg-white px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D9A441]">{eyebrow}</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#0B2C6B] sm:text-3xl">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTips(!showTips)}
                aria-expanded={showTips}
                aria-label="Tampilkan tips"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#0B2C6B]/10 px-3 py-1.5 text-xs font-semibold text-[#0B2C6B]/70 hover:bg-[#F5F7FA]"
              >
                <Lightbulb size={12} />
                <span className="hidden sm:inline">Tips</span>
              </button>
              <button
                type="button"
                onClick={() => setShowMobileNav(true)}
                aria-label="Buka navigasi mobile"
                className="inline-flex items-center justify-center rounded-lg border border-[#0B2C6B]/10 p-2 text-[#0B2C6B]/70 hover:bg-[#F5F7FA] lg:hidden"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </header>
        <div className="flex gap-6 px-4 py-6 sm:px-6 lg:px-6">
          <div className="min-w-0 flex-1">{children}</div>
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-6">
              <HelpSidebar currentPath={pathname} />
            </div>
          </aside>
        </div>
      </main>

      {showTips && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowTips(false)} />
          <div className="absolute right-0 top-0 h-full w-80 overflow-y-auto bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-[#0B2C6B]">Tips</p>
              <button type="button" onClick={() => setShowTips(false)} aria-label="Tutup tips" className="text-[#4A4C54]/50 hover:text-[#0B2C6B]">
                <X size={16} />
              </button>
            </div>
            <HelpSidebar currentPath={pathname} />
          </div>
        </div>
      )}
    </div>
  );
}
