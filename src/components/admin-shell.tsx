"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CircleHelp,
  LogOut,
  Menu,
  Search,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { HelpSidebar } from "@/components/help-sidebar";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import {
  ADMIN_NAVIGATION,
  findAdminNavigation,
} from "@/lib/admin-navigation";

function AdminNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const active = findAdminNavigation(pathname);
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set([active.group.id]));
  const [search, setSearch] = useState("");

  const filteredGroups = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("id-ID");
    if (!query) return ADMIN_NAVIGATION;
    return ADMIN_NAVIGATION.map((group) => ({
      ...group,
      items: group.items.filter((item) => `${item.label} ${item.description}`.toLocaleLowerCase("id-ID").includes(query)),
    })).filter((group) => group.items.length > 0);
  }, [search]);

  const prefetchGroup = (groupId: string) => {
    ADMIN_NAVIGATION.find((group) => group.id === groupId)?.items.forEach((item) => router.prefetch(item.href));
  };

  const toggleGroup = (groupId: string) => {
    prefetchGroup(groupId);
    setOpenGroups((current) => {
      const next = new Set(current);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  return (
    <>
      <label className="relative block px-1">
        <span className="sr-only">Cari menu admin</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari menu..."
          className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.06] pl-10 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-amber-400/60 focus:bg-white/[0.09] focus:outline-none"
        />
      </label>

      <nav className="mt-5 space-y-2" aria-label="Navigasi utama admin">
        {filteredGroups.map((group) => {
          const containsActive = group.id === active.group.id;
          const isOpen = search ? true : group.id === active.group.id || openGroups.has(group.id);
          const contentId = `admin-navigation-${group.id}`;
          return (
            <section key={group.id} className="border-b border-white/[0.07] pb-2">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                onMouseEnter={() => prefetchGroup(group.id)}
                onFocus={() => prefetchGroup(group.id)}
                aria-expanded={isOpen}
                aria-controls={contentId}
                className={`flex min-h-10 w-full items-center justify-between rounded-lg px-3 text-left text-[10px] font-bold uppercase tracking-[0.16em] transition ${containsActive ? "text-amber-400" : "text-slate-500 hover:bg-white/[0.05] hover:text-slate-300"}`}
              >
                {group.label}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
              {isOpen && (
                <div id={contentId} className="mt-1 space-y-1">
                  {group.items.map((item) => {
                    const isActive = item.href === active.item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch
                        onClick={onNavigate}
                        aria-current={isActive ? "page" : undefined}
                        className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${isActive ? "bg-white text-[#071B3D] shadow-[0_10px_30px_-18px_rgba(0,0,0,0.8)]" : "text-slate-300 hover:bg-white/[0.07] hover:text-white"}`}
                      >
                        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${isActive ? "bg-amber-400/15 text-amber-700" : "bg-white/[0.06] text-slate-400 group-hover:text-white"}`}>
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {isActive && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden="true" />}
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
        {filteredGroups.length === 0 && (
          <p className="px-3 py-5 text-center text-xs leading-5 text-slate-500">Menu tidak ditemukan.</p>
        )}
      </nav>
    </>
  );
}

export function AdminShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const current = findAdminNavigation(pathname);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [email, setEmail] = useState("admin@binahub.id");
  const drawerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const guideRef = useDialogFocus<HTMLDivElement>(() => setGuideOpen(false), false, guideOpen);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active && data.session?.user.email) setEmail(data.session.user.email);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!mobileOpen || !drawerRef.current) return;
    const drawer = drawerRef.current;
    const previousOverflow = document.body.style.overflow;
    const menuButton = menuButtonRef.current;
    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusable = () => Array.from(drawer.querySelectorAll<HTMLElement>(focusableSelector));
    document.body.style.overflow = "hidden";
    window.setTimeout(() => focusable()[0]?.focus(), 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const elements = focusable();
      if (!elements.length) return;
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
      document.body.style.overflow = previousOverflow;
      menuButton?.focus();
    };
  }, [mobileOpen]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }, [router]);

  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div className="admin-ui-v2 min-h-screen bg-[#F4F6F8] text-slate-900 selection:bg-amber-200/70">
      <a href="#admin-page-content" className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:not-sr-only focus:rounded-lg focus:bg-[#071B3D] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white">
        Langsung ke konten utama
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[18rem] flex-col border-r border-white/[0.07] bg-[#071B3D] text-white lg:flex" aria-label="Sidebar admin">
        <div className="shrink-0 px-6 pb-5 pt-6">
          <Link href="/admin/dashboard" className="inline-flex items-center" aria-label="BinaHub Admin — Dashboard">
            <span className="inline-flex rounded-lg bg-white px-3 py-2"><Image src="/full-logo.png" alt="BinaHub" width={150} height={42} preload sizes="138px" className="h-auto w-[138px] object-contain" /></span>
          </Link>
          <div className="mt-4 flex items-center gap-2">
            <span className="h-px w-5 bg-amber-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-400">Admin workspace</span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 [scrollbar-gutter:stable]">
          <AdminNavigation />
        </div>

        <div className="shrink-0 border-t border-white/[0.08] p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.05] p-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-400 text-xs font-black text-[#071B3D]">{initials}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{email}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">Administrator</p>
            </div>
            <button type="button" onClick={logout} aria-label="Keluar dari sesi" className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-red-500/10 hover:text-red-300">
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-modal="true" aria-label="Navigasi admin">
          <button type="button" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-[#071B3D]/65 backdrop-blur-sm" aria-label="Tutup menu admin" />
          <div ref={drawerRef} className="absolute inset-y-0 left-0 flex w-[min(22rem,calc(100%-2rem))] flex-col bg-[#071B3D] text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-5">
              <span className="inline-flex rounded-lg bg-white px-3 py-2"><Image src="/full-logo.png" alt="BinaHub" width={150} height={42} sizes="125px" className="h-auto w-[125px] object-contain" /></span>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Tutup navigasi" className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 text-slate-300 hover:bg-white/[0.08]">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
              <AdminNavigation onNavigate={() => setMobileOpen(false)} />
            </div>
            <button type="button" onClick={logout} className="m-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-400/20 text-sm font-semibold text-red-300 hover:bg-red-500/10">
              <LogOut className="h-4 w-4" aria-hidden="true" /> Keluar dari sesi
            </button>
          </div>
        </div>
      )}

      <div className="lg:pl-[18rem]">
        <header className="fixed inset-x-0 top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl lg:left-[18rem]">
          <div className="mx-auto flex min-h-16 max-w-[1680px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button ref={menuButtonRef} type="button" onClick={() => setMobileOpen(true)} aria-label="Buka navigasi admin" aria-expanded={mobileOpen} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden">
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                <span className="truncate">{current.group.label}</span>
                <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="truncate text-amber-700">{current.item.shortLabel}</span>
              </div>
              <p className="mt-1 truncate text-sm font-bold text-slate-950 lg:hidden">{current.item.shortLabel}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={() => setGuideOpen(true)} aria-haspopup="dialog" aria-expanded={guideOpen} aria-label="Buka cara kerja halaman" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 hover:text-blue-950">
                <CircleHelp className="h-4 w-4" aria-hidden="true" /> <span className="hidden sm:inline">Cara kerja</span>
              </button>
              <button type="button" onClick={logout} aria-label="Keluar dari sesi" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 lg:hidden">
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>

        <main id="admin-page-content" className="mx-auto max-w-[1680px] px-4 pb-12 pt-[5.5rem] sm:px-6 sm:pt-24 lg:px-8">
          <section className="mb-6 border-b border-slate-200 pb-5">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#80560F]">{eyebrow}</p>
                <h1 className="mt-2 max-w-4xl text-2xl font-semibold tracking-[-0.035em] text-[#0B2C6B] sm:text-[2rem]">{title}</h1>
                {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>}
              </div>
              {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
            </div>
          </section>
          {children}
        </main>
      </div>

      {guideOpen && (
        <div className="fixed inset-0 z-[110]" role="presentation">
          <button type="button" onClick={() => setGuideOpen(false)} className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]" aria-label="Tutup panduan halaman" />
          <aside ref={guideRef} role="dialog" aria-modal="true" aria-labelledby="admin-guide-title" className="absolute inset-y-0 right-0 flex w-[min(26rem,94vw)] flex-col border-l border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">Panduan kontekstual</p>
                <h2 id="admin-guide-title" className="mt-1 text-lg font-semibold text-blue-950">Cara kerja {current.item.label}</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">{current.item.description}</p>
              </div>
              <button type="button" data-autofocus onClick={() => setGuideOpen(false)} aria-label="Tutup panduan" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-blue-950">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <HelpSidebar currentPath={current.item.href} />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
