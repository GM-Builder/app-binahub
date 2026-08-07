"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, LogIn } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function UnifiedLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if already logged in
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
        setError("Gagal menentukan role. Hubungi admin.");
      }
    } catch {
      setRedirecting(false);
      setError("Gagal terhubung ke server.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
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
    } catch {
      setError("Gagal masuk. Periksa email dan password.");
      setLoading(false);
    }
  };

  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0B2C6B]" />
          <p className="text-sm text-[#4A4C54]">Mengarahkan ke dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#0B2C6B]">
            Bina<span className="text-[#D9A441]">Hub</span>
          </h1>
          <p className="text-xs text-[#4A4C54] mt-2 tracking-wide uppercase">
            Human-Centered Transformation Partner
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-lg font-bold text-[#0B2C6B] mb-1">Masuk</h2>
          <p className="text-xs text-[#4A4C54] mb-6">
            Sistem akan otomatis mengarahkan Anda ke dashboard yang sesuai.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[#0B2C6B] mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4C54]/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-black/10 text-sm focus:outline-none focus:border-[#0B2C6B] focus:ring-1 focus:ring-[#0B2C6B]/20"
                  placeholder="nama@email.com"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#0B2C6B] mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4C54]/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-black/10 text-sm focus:outline-none focus:border-[#0B2C6B] focus:ring-1 focus:ring-[#0B2C6B]/20"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-[#0B2C6B] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#071B3D] transition-colors disabled:opacity-40 shadow-md shadow-[#0B2C6B]/20"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Masuk
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#4A4C54]/60 mt-6">
          Belum punya akun? Hubungi admin BinaHub untuk pendaftaran.
        </p>
      </div>
    </div>
  );
}
