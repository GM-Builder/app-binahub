"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
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
  Trophy,
  UsersRound,
  X,
} from "lucide-react";

import type { Role } from "@/lib/roles";
import { supabase } from "@/lib/supabase";
import { HelpSidebar } from "@/components/help-sidebar";

const navByRole: Record<Role, { href: string; label: string; icon: React.ReactNode }[]> = {
  peserta: [
    { href: "/peserta/dashboard", label: "Dashboard", icon: <Home size={16} /> },
    { href: "/help", label: "Bantuan", icon: <HelpCircle size={16} /> },
  ],
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
    { href: "/admin/tbos", label: "T-BOS", icon: <Trophy size={16} /> },
    { href: "/help", label: "Bantuan", icon: <HelpCircle size={16} /> },
  ],
  facilitator: [
    { href: "/facilitator/dashboard", label: "Dashboard", icon: <Home size={16} /> },
    { href: "/fasilitator/tbos", label: "T-BOS Observasi", icon: <ClipboardCheck size={16} /> },
    { href: "/fasilitator/tbos/observations", label: "Riwayat Observasi", icon: <Eye size={16} /> },
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

const mobileNavByRole: Partial<Record<Role, { href: string; label: string; icon: React.ReactNode }[]>> = {
  peserta: [
    { href: "/peserta/dashboard", label: "Dashboard", icon: <Home size={20} /> },
    { href: "/help", label: "Bantuan", icon: <HelpCircle size={20} /> },
  ],
  facilitator: [
    { href: "/home", label: "Beranda", icon: <Home size={20} /> },
    { href: "/fasilitator/tbos", label: "Observasi", icon: <ClipboardCheck size={20} /> },
    { href: "/fasilitator/tbos/observations", label: "Riwayat", icon: <Eye size={20} /> },
  ],
  admin: [
    { href: "/admin", label: "Dashboard", icon: <Home size={20} /> },
    { href: "/admin/tbos", label: "T-BOS", icon: <Trophy size={20} /> },
    { href: "/admin/assessments", label: "Assessment", icon: <ClipboardList size={20} /> },
  ],
};

function routeIsActive(pathname: string, href: string) {
  if (href === "/admin" || href === "/home" || href === "/help") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

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
  const showLogout = true;
  const [showTips, setShowTips] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const tipsPanelRef = useRef<HTMLDivElement>(null);
  const mobileItems = mobileNavByRole[role] || [];
  const roleHomeHref = role === "facilitator" ? "/home" : role === "admin" ? "/admin" : `/${role}/dashboard`;
  const showBackLink = pathname !== roleHomeHref && pathname !== "/facilitator/dashboard";

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }, [router]);

  useEffect(() => {
    const openPanel = showMobileNav ? drawerRef.current : showTips ? tipsPanelRef.current : null;
    if (!openPanel) return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusable = () => Array.from(openPanel.querySelectorAll<HTMLElement>(focusableSelector));
    focusable()[0]?.focus();
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setShowMobileNav(false);
        setShowTips(false);
        return;
      }
      if (event.key !== "Tab") return;
      const elements = focusable();
      if (elements.length === 0) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previousFocus?.focus();
    };
  }, [showMobileNav, showTips]);

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
              const isActive = routeIsActive(pathname, item.href);
              return (
                <Link
                     key={item.href}
                     href={item.href}
                     aria-current={isActive ? "page" : undefined}
                   className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
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
              className="mt-4 inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 lg:mt-auto"
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
             <aside ref={drawerRef} className="absolute left-0 top-0 h-full w-72 overflow-y-auto bg-white p-5 shadow-xl" aria-label="Menu navigasi">
              <div className="mb-6 flex items-center justify-between">
                <Link href="/" className="block">
                  <Image src="/full-logo.png" alt="BinaHub" width={120} height={34} className="h-8 w-auto object-contain object-left" priority />
                </Link>
                 <button type="button" onClick={() => setShowMobileNav(false)} aria-label="Tutup navigasi" className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-[#4A4C54]/50 hover:bg-[#F5F7FA] hover:text-[#0B2C6B]">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex flex-col gap-2" aria-label="Navigasi mobile">
                {navByRole[role].map((item) => {
                   const isActive = routeIsActive(pathname, item.href);
                  return (
                    <Link
                       key={item.href}
                       href={item.href}
                       onClick={() => setShowMobileNav(false)}
                       aria-current={isActive ? "page" : undefined}
                       className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
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
                   className="mt-4 inline-flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              )}
            </aside>
          </div>
        )}
      </div>

      <main id="main-content" className={mobileItems.length ? "pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-72" : "lg:pl-72"} role="main">
        <header className="border-b border-[#0B2C6B]/10 bg-white px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex items-start justify-between gap-3">
             <div className="min-w-0 flex-1">
               {showBackLink && (
                 <Link href={roleHomeHref} className="mb-2 inline-flex min-h-11 items-center gap-2 rounded-lg pr-3 text-sm font-semibold text-[#0B2C6B]/70 hover:text-[#0B2C6B]">
                   <ArrowUpRight size={16} className="rotate-[-135deg]" aria-hidden="true" />
                   Kembali ke beranda
                 </Link>
               )}
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D9A441]">{eyebrow}</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#0B2C6B] sm:text-3xl">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
               <button
                 type="button"
                onClick={() => setShowTips(!showTips)}
                aria-expanded={showTips}
                aria-label="Tampilkan tips"
                 className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[#0B2C6B]/10 px-3 py-1.5 text-xs font-semibold text-[#0B2C6B]/70 hover:bg-[#F5F7FA] lg:hidden"
              >
                <Lightbulb size={12} />
                <span className="hidden sm:inline">Tips</span>
              </button>
               <button
                 type="button"
                onClick={() => setShowMobileNav(true)}
                 aria-label="Buka navigasi mobile"
                 aria-expanded={showMobileNav}
                 aria-haspopup="dialog"
                 className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#0B2C6B]/10 text-[#0B2C6B]/70 hover:bg-[#F5F7FA] lg:hidden"
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

      {mobileItems.length > 0 && (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#0B2C6B]/10 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(11,44,107,0.08)] backdrop-blur lg:hidden" aria-label="Navigasi cepat">
          <div className="mx-auto flex max-w-lg items-stretch justify-around">
            {mobileItems.map((item) => {
              const isActive = routeIsActive(pathname, item.href);
              return (
                <Link key={item.href} href={item.href} aria-current={isActive ? "page" : undefined} className={`flex min-h-16 min-w-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-semibold ${isActive ? "text-[#0B2C6B]" : "text-[#4A4C54]/65"}`}>
                  <span className={`flex h-7 min-w-10 items-center justify-center rounded-full ${isActive ? "bg-[#0B2C6B]/10" : ""}`}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
            <button type="button" onClick={() => setShowMobileNav(true)} aria-label="Buka menu lainnya" aria-expanded={showMobileNav} aria-haspopup="dialog" className="flex min-h-16 min-w-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-semibold text-[#4A4C54]/65">
              <span className="flex h-7 min-w-10 items-center justify-center rounded-full"><Menu size={20} /></span>
              Menu
            </button>
          </div>
        </nav>
      )}

      {showTips && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowTips(false)} />
           <div ref={tipsPanelRef} role="dialog" aria-modal="true" aria-label="Tips halaman" className="absolute right-0 top-0 h-full w-80 overflow-y-auto bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-[#0B2C6B]">Tips</p>
               <button type="button" onClick={() => setShowTips(false)} aria-label="Tutup tips" className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-[#4A4C54]/50 hover:bg-[#F5F7FA] hover:text-[#0B2C6B]">
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
