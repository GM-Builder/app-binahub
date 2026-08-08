'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);

  useEffect(() => {
    const paramMode = searchParams.get('mode');
    if (paramMode === 'signup' || paramMode === 'register') {
      setMode('signup');
      setShowEmailForm(true);
    }
    const registered = searchParams.get('registered');
    const confirmed = searchParams.get('confirmed');
    if (registered) setSuccess('Akun berhasil dibuat. Silakan masuk.');
    if (confirmed) setSuccess('Email terverifikasi. Silakan masuk.');
  }, [searchParams]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace('/home');
      }
    });
  }, [router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError('Isi email dan password.');
      setLoading(false);
      return;
    }

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (signInError) {
        setError(
          signInError.message.includes('Email not confirmed')
            ? 'Email belum diverifikasi. Cek inbox Anda.'
            : signInError.message.includes('Invalid login credentials')
            ? 'Email atau password tidak valid.'
            : signInError.message
        );
        setLoading(false);
        return;
      }

      if (signInData.user) {
        router.replace('/home');
        router.refresh();
      }
    } catch {
      setError('Terjadi kendala jaringan. Silakan coba lagi.');
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!agreeTerms || !agreePrivacy) {
      setError('Setujui Syarat & Ketentuan serta Kebijakan Privasi sebelum mendaftar.');
      setLoading(false);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Masukkan email yang valid.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      setLoading(false);
      return;
    }

    try {
      const defaultName = fullName.trim() || normalizedEmail.split('@')[0] || 'Peserta BinaHub';
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/home` : undefined;

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            full_name: defaultName,
            role: 'peserta',
          },
        },
      });

      if (signUpError) {
        if (signUpError.message?.includes('already registered')) {
          setError('Email ini sudah terdaftar. Silakan masuk menggunakan akun Anda.');
        } else {
          setError(signUpError.message || 'Registrasi gagal. Silakan coba lagi.');
        }
        setLoading(false);
        return;
      }

      if (authData.user) {
        if (authData.user.identities && authData.user.identities.length === 0) {
          setError('Email ini sudah terdaftar. Silakan masuk menggunakan akun Anda.');
          setLoading(false);
          return;
        }

        if (!authData.session) {
          setSuccess('Registrasi berhasil! Silakan periksa email Anda untuk verifikasi.');
          setMode('signin');
          setLoading(false);
          return;
        }

        router.replace('/home');
        router.refresh();
      }
    } catch {
      setError('Gagal menghubungi server. Silakan coba beberapa saat lagi.');
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Masukkan alamat email Anda.');
      setLoading(false);
      return;
    }

    try {
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/home` : undefined;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccess('Tautan reset password telah dikirim ke email Anda.');
      }
    } catch {
      setError('Gagal mengirim tautan reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    setError('');

    try {
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/home` : undefined;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });

      if (oauthError) {
        setError(oauthError.message);
        setGoogleLoading(false);
      }
    } catch {
      setError('Gagal menghubungkan ke Google.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-5 py-10 font-sans selection:bg-[#C79A3C]/20 selection:text-[#0B2C6B]">
      {/* Soft background accents matching slj-binahub with Gold theme */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#0B2C6B08_1px,transparent_1px),linear-gradient(to_bottom,#0B2C6B08_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#C79A3C]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[320px] w-[320px] rounded-full bg-[#C79A3C]/15 blur-3xl" />

      <div className="relative w-full max-w-[400px]">
        {/* Genuine BinaHub Logo */}
        <div className="mb-8 flex items-center justify-center">
          <Link href="/" className="transition-transform hover:scale-[1.02]">
            <img
              src="/binahub_logo.webp"
              alt="BinaHub Logo"
              className="h-10 sm:h-12 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Card matching slj-binahub */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xl shadow-slate-300/30 backdrop-blur sm:p-7">
          {/* Header */}
          <div className="mb-7">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {mode === 'signin' && 'Masuk ke akun Anda'}
              {mode === 'signup' && 'Buat akun Anda'}
              {mode === 'forgot' && 'Reset Password Anda'}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {mode === 'signin' && 'Selamat datang kembali di ekosistem BinaHub.'}
              {mode === 'signup' && 'Gratis. Satu profil untuk seluruh layanan BinaHub.'}
              {mode === 'forgot' && 'Masukkan email terdaftar untuk menerima tautan pemulihan.'}
            </p>
          </div>

          {/* Success Notification */}
          {success && (
            <div
              id="auth-success"
              role="status"
              aria-live="polite"
              className="mb-5 flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3"
            >
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs leading-relaxed text-emerald-700">{success}</p>
            </div>
          )}

          {/* Error Notification */}
          {error && (
            <div
              id="auth-error"
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3"
            >
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs leading-relaxed text-red-700">{error}</p>
            </div>
          )}

          {/* Google Button (for signin and signup) */}
          {mode !== 'forgot' && (
            <>
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={googleLoading}
                className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50"
              >
                {googleLoading ? (
                  <svg className="h-4 w-4 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                <span className="text-sm">
                  {googleLoading
                    ? 'Mengalihkan...'
                    : mode === 'signin'
                    ? 'Lanjutkan dengan Google'
                    : 'Daftar dengan Google'}
                </span>
              </button>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white/80 px-3 text-xs text-slate-400">atau</span>
                </div>
              </div>

              {/* Email Login Toggle Button (if collapsed in signin mode) */}
              {mode === 'signin' && !showEmailForm && (
                <button
                  type="button"
                  onClick={() => setShowEmailForm(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300"
                >
                  <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Masuk dengan Email</span>
                </button>
              )}
            </>
          )}

          {/* Form */}
          <div className={`${mode === 'signin' && !showEmailForm ? 'hidden' : 'block'}`}>
            <form
              className="space-y-4"
              aria-describedby={error ? 'auth-error' : undefined}
              onSubmit={
                mode === 'signin'
                  ? handleSignIn
                  : mode === 'signup'
                  ? handleSignUp
                  : handleForgotPassword
              }
            >
              {mode === 'signup' && (
                <div>
                  <label htmlFor="auth-full-name" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Nama Lengkap
                  </label>
                  <input
                    id="auth-full-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? 'auth-error' : undefined}
                    className="block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-[#C79A3C] focus:outline-none focus:ring-2 focus:ring-[#C79A3C]/10"
                    placeholder="Nama Lengkap Anda"
                    autoComplete="name"
                  />
                </div>
              )}

              <div>
                <label htmlFor="auth-email" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? 'auth-error' : undefined}
                  className="block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-[#C79A3C] focus:outline-none focus:ring-2 focus:ring-[#C79A3C]/10"
                  placeholder="nama@email.com"
                  autoComplete="email"
                />
              </div>

              {mode !== 'forgot' && (
                <div>
                  <label htmlFor="auth-password" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? 'auth-error' : undefined}
                      className="block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 pr-11 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-[#C79A3C] focus:outline-none focus:ring-2 focus:ring-[#C79A3C]/10"
                      placeholder="••••••••"
                      minLength={6}
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-slate-400 hover:text-slate-600"
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      {showPassword ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L3.42 3.42m6.46 6.46l6.46 6.46M21 21l-3.42-3.42m0 0a9.953 9.953 0 003.42-3.42M3.42 3.42L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'signup' && (
                <div>
                  <label htmlFor="auth-confirm-password" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Konfirmasi Password
                  </label>
                  <div className="relative">
                    <input
                      id="auth-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? 'auth-error' : undefined}
                      className="block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-[#C79A3C] focus:outline-none focus:ring-2 focus:ring-[#C79A3C]/10"
                      placeholder="••••••••"
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              )}

              {/* Forgot password link on signin */}
              {mode === 'signin' && (
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError('');
                      setSuccess('');
                    }}
                    className="text-xs font-medium text-slate-500 transition-colors hover:text-[#C79A3C]"
                  >
                    Lupa password?
                  </button>
                </div>
              )}

              {/* Checkboxes on signup */}
              {mode === 'signup' && (
                <div className="space-y-2.5 pt-1">
                  <label htmlFor="auth-agree-terms" className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      id="auth-agree-terms"
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? 'auth-error' : undefined}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#C79A3C] focus:ring-[#C79A3C]"
                    />
                    <span className="text-xs text-slate-500 leading-tight">
                      Saya menyetujui{' '}
                      <Link href="/help" className="font-semibold text-[#C79A3C] hover:underline">
                        Syarat &amp; Ketentuan
                      </Link>{' '}
                      BinaHub.
                    </span>
                  </label>

                  <label htmlFor="auth-agree-privacy" className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      id="auth-agree-privacy"
                      type="checkbox"
                      checked={agreePrivacy}
                      onChange={(e) => setAgreePrivacy(e.target.checked)}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? 'auth-error' : undefined}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#C79A3C] focus:ring-[#C79A3C]"
                    />
                    <span className="text-xs text-slate-500 leading-tight">
                      Saya memahami dan menyetujui{' '}
                      <Link href="/help" className="font-semibold text-[#C79A3C] hover:underline">
                        Kebijakan Privasi
                      </Link>{' '}
                      penggunaan data.
                    </span>
                  </label>
                </div>
              )}

              {/* Gold Gradient Primary Button */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-[#C79A3C] to-[#A87E2A] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#C79A3C]/20 transition-all hover:from-[#B58A32] hover:to-[#966E22] hover:shadow-xl hover:shadow-[#C79A3C]/30 disabled:opacity-50 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>
                    {mode === 'signin' && 'Masuk'}
                    {mode === 'signup' && 'Daftar Akun'}
                    {mode === 'forgot' && 'Kirim Tautan Reset'}
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Back to signin for forgot mode */}
          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError('');
                setSuccess('');
              }}
              className="mt-4 flex w-full items-center justify-center text-xs font-semibold text-slate-500 hover:text-[#C79A3C] transition-colors"
            >
              ← Kembali ke Masuk
            </button>
          )}
        </div>

        {/* Switch Signin / Signup with Gold hover */}
        {mode !== 'forgot' && (
          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === 'signin' ? (
              <>
                Belum punya akun?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setShowEmailForm(true);
                    setError('');
                    setSuccess('');
                  }}
                  className="font-semibold text-[#C79A3C] transition-colors hover:text-[#A87E2A]"
                >
                  Daftar gratis
                </button>
              </>
            ) : (
              <>
                Sudah punya akun?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError('');
                    setSuccess('');
                  }}
                  className="font-semibold text-[#C79A3C] transition-colors hover:text-[#A87E2A]"
                >
                  Masuk di sini
                </button>
              </>
            )}
          </p>
        )}

        {/* Legal links matching slj-binahub */}
        <p className="mt-4 flex items-center justify-center gap-3 text-[11px] text-slate-400">
          <Link href="/help" className="transition-colors hover:text-[#C79A3C]">
            Syarat &amp; Ketentuan
          </Link>
          <span className="text-slate-300">•</span>
          <Link href="/help" className="transition-colors hover:text-[#C79A3C]">
            Kebijakan Privasi
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C79A3C] border-t-transparent" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
