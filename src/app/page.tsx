"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LandingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        redirectToRole(data.session.access_token);
      }
    });
  }, []);

  const redirectToRole = async (token: string) => {
    setRedirecting(true);
    try {
      const res = await fetch("/api/auth/role", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.redirectTo) {
        router.push(data.redirectTo);
      } else {
        setRedirecting(false);
      }
    } catch {
      setRedirecting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });

        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }

        if (data.user && !data.session) {
          setInfo("Akun berhasil dibuat. Silakan cek email untuk verifikasi, lalu masuk.");
          setMode("signin");
          setLoading(false);
          return;
        }

        if (data.session) {
          await redirectToRole(data.session.access_token);
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message);
          setLoading(false);
          return;
        }

        if (data.session) {
          await redirectToRole(data.session.access_token);
        }
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setLoading(false);
    }
  };

  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B2C6B]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#D9A441]" />
          <p className="text-sm text-white/70">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0B2C6B] via-[#0B2C6B] to-[#071B3D]">
      {/* Decorative grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Logo + Tagline */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Bina<span className="text-[#D9A441]">Hub</span>
          </h1>
          <p className="text-xs text-white/50 mt-2 tracking-[0.2em] uppercase">
            Human-Centered Transformation Partner
          </p>
        </div>

        {/* Auth Card */}
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-black/[0.06]">
              <button
                onClick={() => { setMode("signin"); setError(""); setInfo(""); }}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                  mode === "signin"
                    ? "text-[#0B2C6B] border-b-2 border-[#0B2C6B]"
                    : "text-[#4A4C54] hover:text-[#0B2C6B]"
                }`}
              >
                Masuk
              </button>
              <button
                onClick={() => { setMode("signup"); setError(""); setInfo(""); }}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                  mode === "signup"
                    ? "text-[#0B2C6B] border-b-2 border-[#0B2C6B]"
                    : "text-[#4A4C54] hover:text-[#0B2C6B]"
                }`}
              >
                Daftar
              </button>
            </div>

            {/* Form */}
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div>
                    <label className="text-xs font-medium text-[#0B2C6B] mb-1.5 block">Nama Lengkap</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4C54]/40" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="w-full h-11 pl-10 pr-4 rounded-xl border border-black/10 text-sm focus:outline-none focus:border-[#0B2C6B] focus:ring-1 focus:ring-[#0B2C6B]/20"
                        placeholder="Nama Anda"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-[#0B2C6B] mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4C54]/40" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-black/10 text-sm focus:outline-none focus:border-[#0B2C6B] focus:ring-1 focus:ring-[#0B2C6B]/20"
                      placeholder="nama@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#0B2C6B] mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4C54]/40" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full h-11 pl-10 pr-10 rounded-xl border border-black/10 text-sm focus:outline-none focus:border-[#0B2C6B] focus:ring-1 focus:ring-[#0B2C6B]/20"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A4C54]/40 hover:text-[#4A4C54]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                    {error}
                  </div>
                )}

                {info && (
                  <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700">
                    {info}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-[#0B2C6B] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#071B3D] transition-colors disabled:opacity-40 shadow-lg shadow-[#0B2C6B]/20"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {mode === "signin" ? "Masuk" : "Daftar"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {mode === "signup" && (
                <p className="text-center text-[11px] text-[#4A4C54]/60 mt-4">
                  Dengan mendaftar, Anda membuat akun peserta. Role dapat diubah oleh admin sesuai kebutuhan.
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-white/40 mt-6">
            © 2026 BinaHub. People Transformation & Future Capability Partner.
          </p>
        </div>
      </div>
    </div>
  );
}
