"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  LogOut,
  ArrowUpRight,
  LayoutDashboard,
  Trophy,
  ShieldCheck,
  Building2,
  FileCheck2,
  ClipboardList,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ServiceMegaGrid } from "@/components/service-mega-grid";

const ADMIN_EMAILS = ["admin@binahub.id"];
const FACILITATOR_EMAILS = ["facilitator@binahub.id", "fasilitator@binahub.id"];

function resolveRole(email: string, metadataRole?: string, profilesRole?: string): string {
  const lowerEmail = email.trim().toLowerCase();

  // 1. profiles table role (most authoritative)
  if (profilesRole && profilesRole !== "peserta" && profilesRole !== "client") {
    return profilesRole;
  }

  // 2. app_metadata / user_metadata
  if (metadataRole && (metadataRole === "admin" || metadataRole === "facilitator")) {
    return metadataRole;
  }

  // 3. email allowlist
  if (ADMIN_EMAILS.includes(lowerEmail)) return "admin";
  if (FACILITATOR_EMAILS.includes(lowerEmail)) return "facilitator";

  // 4. profiles table default
  if (profilesRole) return profilesRole;

  return "peserta";
}

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/");
        return;
      }

      const session = sessionData.session;
      const email = session.user?.email || "";
      const metadataRole =
        (session.user?.app_metadata?.role as string) ||
        (session.user?.user_metadata?.role as string) ||
        "";

      let profilesRole = "";
      let fullName = session.user?.user_metadata?.full_name || "";

      try {
        const res = await fetch("/api/auth/role", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        if (data.success) {
          profilesRole = data.role;
          fullName = data.fullName || fullName;
        }
      } catch {
        // Fallback to JWT role resolution
      }

      const resolvedRole = resolveRole(email, metadataRole, profilesRole);
      setRole(resolvedRole);
      setUserName(fullName || email.split("@")[0]);
    } catch {
      router.replace("/");
      return;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F4]">
        <Loader2 className="w-8 h-8 animate-spin text-[#C79A3C]" />
      </div>
    );
  }

  const roleBadgeConfig: Record<string, { label: string; bg: string; text: string }> = {
    admin: { label: "Administrator", bg: "bg-[#0B2C6B]/10", text: "text-[#0B2C6B]" },
    facilitator: { label: "Fasilitator", bg: "bg-[#C79A3C]/15", text: "text-[#9E7520]" },
    client: { label: "Client", bg: "bg-emerald-100", text: "text-emerald-800" },
    peserta: { label: "Peserta", bg: "bg-slate-100", text: "text-slate-700" },
  };

  const currentBadge = roleBadgeConfig[role] || roleBadgeConfig.peserta;

  // Curated, non-redundant workspace shortcuts per role
  const quickLinks: Record<string, { href: string; label: string; desc: string; icon: any }[]> = {
    admin: [
      {
        href: "/admin?tab=T-BOS",
        label: "T-BOS",
        desc: "Radar chart, heatmap, ranking tim & laporan eksekutif.",
        icon: Trophy,
      },
      {
        href: "/admin",
        label: "Intelligence Hub",
        desc: "Pipeline assessment, kontak klien, dan inquiry masuk.",
        icon: LayoutDashboard,
      },
      {
        href: "/fasilitator/tbos/observations",
        label: "Kelola & Kunci Observasi",
        desc: "Review, edit, dan lock observasi perilaku tim.",
        icon: ShieldCheck,
      },
      {
        href: "/admin/users",
        label: "Manajemen User & Role",
        desc: "Kelola akun pengguna, hak akses, dan role.",
        icon: Building2,
      },
    ],
    facilitator: [
      {
        href: "/fasilitator/tbos",
        label: "Form Observasi T-BOS",
        desc: "Input observasi perilaku tim selama mission berlangsung.",
        icon: ClipboardList,
      },
      {
        href: "/fasilitator/tbos/observations",
        label: "Riwayat Observasi",
        desc: "Review status observasi dan lakukan revisi.",
        icon: FileCheck2,
      },
    ],
    peserta: [
      {
        href: "/peserta/dashboard",
        label: "Dashboard Peserta",
        desc: "Lihat hasil observasi tim, 8 dimensi perilaku, dan peringkat.",
        icon: Trophy,
      },
    ],
    client: [
      {
        href: "/client/dashboard",
        label: "Dashboard Klien",
        desc: "Pantau progres program transformasi organisasi Anda.",
        icon: LayoutDashboard,
      },
    ],
  };

  const userQuickLinks = quickLinks[role] || quickLinks.peserta;

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-slate-900 font-sans selection:bg-[#C79A3C]/20 selection:text-[#0B2C6B]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 h-16 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-3 transition-opacity hover:opacity-90">
            <img
              src="/binahub_logo.webp"
              alt="BinaHub Logo"
              className="h-9 sm:h-10 w-auto object-contain"
            />
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/60">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#0B2C6B] to-[#C79A3C] flex items-center justify-center text-white text-xs font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-slate-800 max-w-[130px] sm:max-w-[200px] truncate">
                {userName}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${currentBadge.bg} ${currentBadge.text}`}
              >
                {currentBadge.label}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:border-red-200 hover:bg-red-50/50 hover:text-red-600 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 sm:p-8 shadow-sm backdrop-blur">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#C79A3C] mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Workspace Operasional</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Selamat Datang, {userName}
              </h1>
              <p className="mt-1 text-sm text-slate-500 max-w-2xl leading-relaxed">
                Kelola observasi tim, asesmen, dan program transformasi organisasi secara terpusat.
              </p>
            </div>

            {role === "admin" && (
              <div className="flex items-center gap-2">
                <Link
                  href="/admin?tab=T-BOS"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-[#0B2C6B] to-[#071B3D] text-white text-xs font-semibold shadow-md shadow-[#0B2C6B]/20 hover:brightness-110 transition-all"
                >
                  <Trophy className="w-3.5 h-3.5 text-[#D9A441]" />
                  Buka T-BOS
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Launch Cards */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Akses Cepat Workspace
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {userQuickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-[#C79A3C]/60 hover:shadow-md hover:shadow-slate-200/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="h-10 w-10 rounded-xl bg-slate-100 group-hover:bg-[#C79A3C]/10 text-[#0B2C6B] group-hover:text-[#C79A3C] flex items-center justify-center transition-colors mb-3.5">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0B2C6B] transition-colors">
                      {item.label}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0B2C6B] group-hover:text-[#C79A3C]">
                    <span>Buka modul</span>
                    <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* BinaHub Ecosystem Mega Grid */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-base font-bold text-slate-900">Ekosistem Layanan BinaHub</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Pilih platform atau modul spesifik untuk memulai proses transformasi manusia dan organisasi.
            </p>
          </div>
          <ServiceMegaGrid />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200/80 bg-white py-6">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© 2026 BinaHub Ecosystem. Human-Centered Transformation Partner.</p>
          <div className="flex items-center gap-4">
            <Link href="/help" className="hover:text-[#C79A3C] transition-colors">
              Pusat Bantuan
            </Link>
            <span>•</span>
            <Link href="/help" className="hover:text-[#C79A3C] transition-colors">
              Privasi &amp; Keamanan
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
