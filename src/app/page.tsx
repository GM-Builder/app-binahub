"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <Loader2 className="w-8 h-8 animate-spin text-[#0B2C6B]" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Check URL params for registered/confirmed/mode states
  useEffect(() => {
    const paramMode = searchParams.get("mode");
    if (paramMode === "signup" || paramMode === "register") {
      setMode("signup");
    }
    const registered = searchParams.get("registered");
    const confirmed = searchParams.get("confirmed");
    if (registered) setSuccess("Akun berhasil dibuat. Silakan masuk.");
    if (confirmed) setSuccess("Email berhasil diverifikasi. Silakan masuk.");
  }, [searchParams]);

  // Check existing session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setRedirecting(true);
        router.replace("/home");
      }
    });
  }, [router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError("Email dan password wajib diisi.");
      setLoading(false);
      return;
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (signInError) {
        if (signInError.message.toLowerCase().includes("email not confirmed")) {
          setError("Email belum diverifikasi. Silakan periksa kotak masuk/spam Anda.");
        } else if (signInError.message.toLowerCase().includes("invalid login credentials")) {
          setError("Email atau password tidak sesuai.");
        } else {
          setError(signInError.message);
        }
        setLoading(false);
        return;
      }

      if (data.session) {
        setRedirecting(true);
        router.replace("/home");
      }
    } catch {
      setError("Terjadi kendala jaringan. Silakan coba beberapa saat lagi.");
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Masukkan email yang valid.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      setLoading(false);
      return;
    }

    if (!agreeTerms) {
      setError("Anda harus menyetujui Syarat & Ketentuan serta Kebijakan Privasi.");
      setLoading(false);
      return;
    }

    try {
      const defaultName = fullName.trim() || normalizedEmail.split("@")[0];
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/home` : undefined;

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            full_name: defaultName,
            role: "peserta",
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes("already registered")) {
          setError("Email ini sudah terdaftar. Silakan masuk dengan password Anda.");
        } else {
          setError(signUpError.message || "Pendaftaran gagal. Silakan coba lagi.");
        }
        setLoading(false);
        return;
      }

      if (authData.user) {
        if (authData.user.identities && authData.user.identities.length === 0) {
          setError("Email ini sudah terdaftar. Silakan masuk menggunakan akun Anda.");
          setLoading(false);
          return;
        }

        if (!authData.session) {
          setSuccess("Akun berhasil didaftarkan! Silakan periksa email Anda untuk verifikasi.");
          setMode("signin");
          setLoading(false);
          return;
        }

        // Active session -> redirect
        setRedirecting(true);
        router.replace("/home");
      }
    } catch {
      setError("Terjadi kendala saat mendaftar. Silakan coba lagi.");
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Masukkan email Anda untuk reset password.");
      setLoading(false);
      return;
    }

    try {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/home` : undefined;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccess("Tautan reset password telah dikirim ke email Anda.");
      }
    } catch {
      setError("Gagal mengirim email reset password.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    setError("");

    try {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/home` : undefined;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (oauthError) {
        setError(oauthError.message);
        setGoogleLoading(false);
      }
    } catch {
      setError("Gagal menghubungkan ke Google.");
      setGoogleLoading(false);
    }
  };

  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B2C6B] via-[#0B2C6B] to-[#071B3D]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#D9A441]" />
          <p className="text-sm font-medium text-white/80">Mengarahkan ke dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#FAFCFF] px-4 py-12 font-sans selection:bg-[#D9A441]/30 selection:text-[#0B2C6B]">
      {/* Background Soft Grid Pattern (SLJ Aesthetic) */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#0B2C6B08_1px,transparent_1px),linear-gradient(to_bottom,#0B2C6B08_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Ambient Luxury Glow Spheres */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-gradient-to-br from-[#D9A441]/15 to-[#0B2C6B]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-10 h-[360px] w-[360px] rounded-full bg-[#0B2C6B]/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-20 h-[300px] w-[300px] rounded-full bg-[#D9A441]/10 blur-3xl" />

      <div className="relative w-full max-w-[430px]">
        {/* Brand Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white shadow-md shadow-[#0B2C6B]/5 border border-slate-200/60 mb-3.5">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tight text-[#0B2C6B]">
                Bina<span className="text-[#D9A441]">Hub</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0B2C6B]/[0.06] text-[#0B2C6B]">
                App
              </span>
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">
            Human-Centered Transformation Partner
          </p>
        </div>

        {/* Elevated Glassmorphic Auth Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 sm:p-8 shadow-xl shadow-slate-300/40 backdrop-blur-md transition-all">
          {/* Mode Tabs (Masuk / Daftar) */}
          {mode !== "forgot" && (
            <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100/90 mb-6 border border-slate-200/50">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError("");
                  setSuccess("");
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  mode === "signin"
                    ? "bg-white text-[#0B2C6B] shadow-sm shadow-black/5"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError("");
                  setSuccess("");
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  mode === "signup"
                    ? "bg-white text-[#0B2C6B] shadow-sm shadow-black/5"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Daftar Baru
              </button>
            </div>
          )}

          {/* Card Title & Subtitle */}
          <div className="mb-6">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {mode === "signin" && "Selamat Datang Kembali"}
              {mode === "signup" && "Buat Akun BinaHub"}
              {mode === "forgot" && "Reset Password"}
            </h1>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              {mode === "signin" && "Masuk untuk mengakses workspace dan modul operasional Anda."}
              {mode === "signup" && "Satu akun terpadu untuk BinaInsight, BinaImpact, dan T-BOS."}
              {mode === "forgot" && "Masukkan email terdaftar Anda untuk menerima tautan pemulihan."}
            </p>
          </div>

          {/* Success Banner */}
          {success && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs text-emerald-800 animate-in fade-in slide-in-from-top-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">{success}</p>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/90 p-3.5 text-xs text-red-800 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">{error}</p>
            </div>
          )}

          {/* Google Sign In (for signin & signup) */}
          {mode !== "forgot" && (
            <>
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={googleLoading}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50/80 hover:border-slate-300 disabled:opacity-60 shadow-xs"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                ) : (
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                <span>
                  {googleLoading
                    ? "Menghubungkan..."
                    : mode === "signin"
                    ? "Lanjutkan dengan Google"
                    : "Daftar dengan Google"}
                </span>
              </button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    atau dengan email
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Form */}
          <form
            onSubmit={
              mode === "signin"
                ? handleSignIn
                : mode === "signup"
                ? handleSignUp
                : handleForgotPassword
            }
            className="space-y-4"
          >
            {mode === "signup" && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nama Lengkap Anda"
                    className="block w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-[#0B2C6B] focus:outline-none focus:ring-2 focus:ring-[#0B2C6B]/10"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@perusahaan.com"
                  autoComplete="email"
                  className="block w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-[#0B2C6B] focus:outline-none focus:ring-2 focus:ring-[#0B2C6B]/10"
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setError("");
                        setSuccess("");
                      }}
                      className="text-[11px] font-medium text-[#0B2C6B] hover:text-[#D9A441] transition-colors"
                    >
                      Lupa password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    className="block w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-[#0B2C6B] focus:outline-none focus:ring-2 focus:ring-[#0B2C6B]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === "signup" && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    autoComplete="new-password"
                    className="block w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-[#0B2C6B] focus:outline-none focus:ring-2 focus:ring-[#0B2C6B]/10"
                  />
                </div>
              </div>
            )}

            {mode === "signup" && (
              <label className="flex items-start gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0B2C6B] focus:ring-[#0B2C6B]"
                />
                <span className="text-[11px] text-slate-500 leading-tight">
                  Saya menyetujui{" "}
                  <Link href="/help" className="text-[#0B2C6B] font-medium hover:underline">
                    Syarat & Ketentuan
                  </Link>{" "}
                  serta{" "}
                  <Link href="/help" className="text-[#0B2C6B] font-medium hover:underline">
                    Kebijakan Privasi
                  </Link>{" "}
                  BinaHub.
                </span>
              </label>
            )}

            {/* Primary Action Button (Navy + Gold Luxury Palette) */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B2C6B] via-[#0D3685] to-[#071B3D] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0B2C6B]/20 transition-all hover:shadow-xl hover:shadow-[#0B2C6B]/30 hover:brightness-105 active:scale-[0.99] disabled:opacity-50 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>
                    {mode === "signin" && "Masuk ke Akun"}
                    {mode === "signup" && "Daftar Akun Baru"}
                    {mode === "forgot" && "Kirim Tautan Reset"}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#D9A441]" />
                </>
              )}
            </button>
          </form>

          {/* Back button for Forgot Password mode */}
          {mode === "forgot" && (
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError("");
                setSuccess("");
              }}
              className="w-full mt-4 text-center text-xs font-semibold text-slate-500 hover:text-[#0B2C6B] transition-colors"
            >
              ← Kembali ke Halaman Masuk
            </button>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-7 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Koneksi aman terenkripsi & kepatuhan data ISO/IEC 27001 ready</span>
          </div>
          <p className="text-[11px] text-slate-400">
            © 2026 BinaHub Ecosystem. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
