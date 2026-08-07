"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, LogOut, ArrowUpRight, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ServiceMegaGrid } from "@/components/service-mega-grid";

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
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        router.replace("/");
        return;
      }

      const res = await fetch("/api/auth/role", {
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });
      const data = await res.json();

      if (data.success) {
        setUserName(data.fullName || "Pengguna");
        setRole(data.role || "peserta");
      } else {
        router.replace("/");
        return;
      }
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
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <Loader2 className="w-6 h-6 animate-spin text-[#0B2C6B]" />
      </div>
    );
  }

  const roleLabel: Record<string, string> = {
    peserta: "Peserta",
    facilitator: "Fasilitator",
    admin: "Admin",
    client: "Client",
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 bg-white border-b border-black/[0.06]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-[#0B2C6B]">
              Bina<span className="text-[#D9A441]">Hub</span>
            </h1>
            <span className="hidden sm:inline text-xs px-2.5 py-1 rounded-full bg-[#0B2C6B]/[0.06] text-[#0B2C6B]/60 font-medium">
              {roleLabel[role] || "Peserta"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-[#0B2C6B]">{userName}</p>
              <p className="text-[10px] text-[#4A4C54]/60">{roleLabel[role] || "Peserta"}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-black/[0.08] text-[#4A4C54] text-xs font-medium hover:border-red-300 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[#0B2C6B] to-[#071B3D] rounded-2xl p-6 mb-6 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441] mb-2">
                Selamat datang
              </p>
              <h2 className="text-2xl font-bold text-white mb-1">Halo, {userName}!</h2>
              <p className="text-sm text-white/60 max-w-md">
                Pilih layanan BinaHub di bawah ini untuk mulai eksplorasi.
              </p>
            </div>
            <Sparkles className="w-8 h-8 text-[#D9A441]/40 shrink-0 hidden sm:block" />
          </div>
        </div>

        {/* Service Grid */}
        <div className="bg-white rounded-2xl border border-black/[0.04] p-6 sm:p-8">
          <div className="mb-6">
            <h3 className="text-base font-bold text-[#0B2C6B]">Layanan BinaHub</h3>
            <p className="text-xs text-[#4A4C54] mt-1">
              Klik layanan aktif untuk mulai menggunakan.
            </p>
          </div>
          <ServiceMegaGrid />
        </div>

        {/* Dashboard Access */}
        <div className="mt-6 bg-white rounded-2xl border border-black/[0.04] p-6">
          <h3 className="text-base font-bold text-[#0B2C6B] mb-4">Dashboard Saya</h3>
          <DashboardCard role={role} />
        </div>
      </main>
    </div>
  );
}

function DashboardCard({ role }: { role: string }) {
  const dashboards: Record<string, { href: string; label: string; desc: string }> = {
    peserta: {
      href: "/peserta/dashboard",
      label: "Dashboard Peserta",
      desc: "Lihat hasil observasi tim dan skor T-BOS Anda.",
    },
    facilitator: {
      href: "/fasilitator/tbos",
      label: "Dashboard Fasilitator",
      desc: "Input observasi perilaku tim dan lihat riwayat.",
    },
    admin: {
      href: "/admin/tbos",
      label: "Dashboard Admin",
      desc: "Pantau seluruh tim, radar chart, heatmap, dan ranking.",
    },
    client: {
      href: "/client/dashboard",
      label: "Dashboard Client",
      desc: "Program transformasi dan kemampuan tim Anda.",
    },
  };

  const dash = dashboards[role] || dashboards.peserta;

  return (
    <a
      href={dash.href}
      className="flex items-center justify-between p-4 rounded-xl bg-[#0B2C6B]/[0.03] border border-[#0B2C6B]/10 hover:border-[#D9A441]/50 hover:bg-[#0B2C6B]/[0.05] transition-all group"
    >
      <div>
        <p className="text-sm font-semibold text-[#0B2C6B]">{dash.label}</p>
        <p className="text-xs text-[#4A4C54] mt-0.5">{dash.desc}</p>
      </div>
      <ArrowUpRight className="w-5 h-5 text-[#0B2C6B]/40 group-hover:text-[#D9A441] transition-colors" />
    </a>
  );
}
