"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users, Trophy, Target, Eye } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AppShell } from "@/components/app-shell";
import { fetchParticipantTeamInfo } from "@/modules/tbos/api-client";

export default function PesertaDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [error, setError] = useState("");
  const [teamInfo, setTeamInfo] = useState<{
    teamName: string;
    batch: string;
    missionsCompleted: number;
    overallScore: number | null;
    strongestDimension: string | null;
    weakestDimension: string | null;
    rank: number | null;
  } | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) {
        router.push("/login");
        return;
      }

      const userId = session.user.id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", userId)
        .maybeSingle();

      const name = profile?.full_name || session.user.user_metadata?.full_name || session.user.email || "Peserta";
      if (profile?.role !== "peserta" && profile?.role !== "admin") {
        router.replace("/home");
        return;
      }
      setUserName(name);

      const info = await fetchParticipantTeamInfo(userId);
      setTeamInfo(info);
    } catch (err) {
      console.error("[Peserta Dashboard] Error loading session or team info:", err);
      setError(err instanceof Error ? err.message : "Gagal memuat dashboard peserta.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void Promise.resolve().then(checkAuth);
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <Loader2 className="w-6 h-6 animate-spin text-[#0B2C6B]" />
      </div>
    );
  }

  return (
    <AppShell role="peserta" title="Dashboard Peserta" eyebrow={`Selamat datang, ${userName}`}>
      <div className="space-y-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
            <p>{error}</p>
            <button onClick={checkAuth} className="mt-3 min-h-11 rounded-lg bg-red-700 px-4 font-semibold text-white">
              Coba lagi
            </button>
          </div>
        )}
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[#0B2C6B] to-[#071B3D] rounded-2xl p-6 text-white">
          <h2 className="text-xl font-bold mb-2">Halo, {userName}!</h2>
          <p className="text-sm text-white/70">
            Selamat datang di dashboard peserta BinaHub. Di sini Anda dapat melihat hasil observasi
            perilaku tim Anda selama menjalankan mission.
          </p>
        </div>

        {/* Team Score Overview */}
        {!error && teamInfo ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              icon={<Trophy className="w-4 h-4 text-[#D9A441]" />}
              label="Ranking Tim"
              value={teamInfo.rank ? `#${teamInfo.rank}` : "-"}
            />
            <StatCard
              icon={<Target className="w-4 h-4 text-[#0B2C6B]" />}
              label="Skor Tim"
              value={teamInfo.overallScore !== null ? teamInfo.overallScore.toFixed(1) : "-"}
            />
            <StatCard
              icon={<Eye className="w-4 h-4 text-[#0B2C6B]" />}
              label="Mission Selesai"
              value={String(teamInfo.missionsCompleted)}
            />
            <StatCard
              icon={<Users className="w-4 h-4 text-[#0B2C6B]" />}
              label="Tim"
              value={teamInfo.teamName || "-"}
            />
          </div>
        ) : !error ? (
          <div className="bg-white rounded-xl p-6 border border-black/[0.04] text-center">
            <p className="text-sm text-[#4A4C54]">
              Anda belum ditambahkan ke tim manapun. Hubungi fasilitator atau admin untuk
              informasi lebih lanjut.
            </p>
          </div>
        ) : null}

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-5 border border-black/[0.04]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#0B2C6B]/[0.06] flex items-center justify-center">
                <Target className="w-4 h-4 text-[#0B2C6B]" />
              </div>
              <h3 className="text-sm font-semibold text-[#0B2C6B]">Tentang T-BOS</h3>
            </div>
            <p className="text-xs text-[#4A4C54] leading-relaxed">
              Team Behavioral Observation System (T-BOS) adalah sistem penilaian perilaku tim
              yang digunakan fasilitator untuk mengobservasi tim selama mission simulasi.
              Skor diukur dari 8 dimensi perilaku dengan skala 1-5.
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-black/[0.04]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#D9A441]/[0.1] flex items-center justify-center">
                <Trophy className="w-4 h-4 text-[#D9A441]" />
              </div>
              <h3 className="text-sm font-semibold text-[#0B2C6B]">8 Dimensi Perilaku</h3>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs text-[#4A4C54]">
              <p>• Goal Alignment</p>
              <p>• Communication</p>
              <p>• Data-Based Decision</p>
              <p>• Execution Discipline</p>
              <p>• Accountability</p>
              <p>• Adaptability</p>
              <p>• Collaboration</p>
              <p>• Org. Ownership</p>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-black/[0.04]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[#4A4C54]">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold text-[#0B2C6B]">{value}</p>
    </div>
  );
}
