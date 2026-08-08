"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  FileCheck2,
  Trophy,
  ShieldCheck,
  UsersRound,
  FileText,
  BarChart3,
  ArrowUpRight,
  LogOut,
  Sparkles,
  Wifi,
  WifiOff,
} from "lucide-react";
import { FacilitatorAuthGate } from "@/components/facilitator-auth-gate";
import { supabase } from "@/lib/supabase";
import { getQueuedObservations } from "@/modules/tbos/api-client";

export default function FacilitatorLandingPage() {
  return (
    <FacilitatorAuthGate>
      <FacilitatorHubContent />
    </FacilitatorAuthGate>
  );
}

function FacilitatorHubContent() {
  const router = useRouter();
  const [userName, setUserName] = useState("Fasilitator");
  const [isOnline, setIsOnline] = useState(true);
  const [queuedCount, setQueuedCount] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        const name =
          data.session.user.user_metadata?.full_name ||
          data.session.user.email?.split("@")[0] ||
          "Fasilitator";
        setUserName(name);
      }
    });

    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      setQueuedCount(getQueuedObservations().length);

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  const primaryModules = [
    {
      href: "/fasilitator/tbos",
      label: "Form Observasi T-BOS",
      badge: "Utama",
      badgeColor: "bg-[#0B2C6B] text-white",
      desc: "Input observasi 8 dimensi perilaku tim secara real-time selama mission berlangsung.",
      icon: ClipboardList,
      accent: "hover:border-[#0B2C6B]",
    },
    {
      href: "/fasilitator/tbos/observations",
      label: "Riwayat & Kunci Observasi",
      badge: "Live Status",
      badgeColor: "bg-[#D9A441]/20 text-[#9B6C17]",
      desc: "Review catatan observasi yang sudah dikirim, lakukan revisi sebelum deadline, dan kunci evaluasi.",
      icon: FileCheck2,
      accent: "hover:border-[#D9A441]",
    },
    {
      href: "/facilitator/binaimpact",
      label: "BinaImpact Evaluator",
      badge: "Level 1-2",
      badgeColor: "bg-emerald-100 text-emerald-800",
      desc: "Pengukuran dampak perubahan, efektivitas workshop, dan penilaian reaksi peserta.",
      icon: Trophy,
      accent: "hover:border-emerald-500",
    },
    {
      href: "/facilitator/engagements",
      label: "Program & Engagements",
      badge: "Sesi Aktif",
      badgeColor: "bg-blue-100 text-blue-800",
      desc: "Kelola batch peserta, jadwal sesi transformasi, dan kode akses evaluasi klien.",
      icon: UsersRound,
      accent: "hover:border-blue-500",
    },
    {
      href: "/facilitator/evidence",
      label: "Evidence & Dokumen Sesi",
      badge: "Dokumentasi",
      badgeColor: "bg-slate-100 text-slate-700",
      desc: "Unggah dan tinjau bukti kerja sama, lembar observasi lapangan, dan artifacts.",
      icon: FileText,
      accent: "hover:border-slate-400",
    },
    {
      href: "/facilitator/scoring",
      label: "Scoring & Statistik",
      badge: "Analitik",
      badgeColor: "bg-purple-100 text-purple-800",
      desc: "Pantau ringkasan statistik nilai peserta dan agregat performa program.",
      icon: BarChart3,
      accent: "hover:border-purple-500",
    },
  ];

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
            {/* Network Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-slate-200 bg-slate-50">
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-amber-700">Offline ({queuedCount} queue)</span>
                </>
              )}
            </div>

            {/* Profile Pill */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/60">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#0B2C6B] to-[#C79A3C] flex items-center justify-center text-white text-xs font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-slate-800 max-w-[120px] sm:max-w-[180px] truncate">
                {userName}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#C79A3C]/15 text-[#9E7520]">
                Fasilitator
              </span>
            </div>

            {/* Logout */}
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
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#C79A3C] mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ruang Kerja Fasilitator</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Selamat Bertugas, {userName}
              </h1>
              <p className="mt-1 text-sm text-slate-500 max-w-2xl leading-relaxed">
                Kelola observasi perilaku tim T-BOS, evaluasi dampak BinaImpact, dan pencatatan hasil program di lapangan.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/fasilitator/tbos"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-[#0B2C6B] to-[#071B3D] text-white text-xs font-semibold shadow-sm hover:brightness-110 transition-all"
              >
                <ClipboardList className="w-4 h-4 text-[#D9A441]" />
                Mulai Input T-BOS
              </Link>
              <Link
                href="/fasilitator/tbos/observations"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-[#D9A441]" />
                Riwayat Observasi
              </Link>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Modul Operasional Fasilitator
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {primaryModules.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs ${item.accent} hover:shadow-md hover:shadow-slate-200/50 transition-all flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-11 w-11 rounded-xl bg-slate-100 group-hover:bg-[#0B2C6B]/10 text-[#0B2C6B] flex items-center justify-center transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0B2C6B] transition-colors">
                      {item.label}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0B2C6B]">
                    <span>Buka workspace</span>
                    <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200/80 bg-white py-6">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© 2026 BinaHub Facilitator Portal. Human-Centered Transformation Partner.</p>
          <div className="flex items-center gap-4">
            <Link href="/help" className="hover:text-[#C79A3C] transition-colors">
              Pusat Bantuan
            </Link>
            <span>•</span>
            <Link href="/help" className="hover:text-[#C79A3C] transition-colors">
              Panduan Rubrik T-BOS
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
