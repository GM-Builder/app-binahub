"use client";

import Image from "next/image";
import { AlertCircle, ArrowRight, Building2, CalendarDays, CheckCircle2, ClipboardCheck, Copy, Download, Gamepad2, KeyRound, Loader2, MapPin, ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ProgramPreview {
  id: string;
  title: string;
  companyName: string;
  location: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  modules: Array<"tbos" | "lep">;
  available: boolean;
}

interface AccessResult {
  client?: { displayName?: string };
  session: { access_token: string; refresh_token: string };
  participantCode?: string;
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function ClientAccessPage() {
  const router = useRouter();
  const [programId, setProgramId] = useState("");
  const [program, setProgram] = useState<ProgramPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [code, setCode] = useState("");
  const [accessMode, setAccessMode] = useState<"register" | "participant">("register");
  const [participantCode, setParticipantCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState<AccessResult | null>(null);
  const [participantCodeSaved, setParticipantCodeSaved] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      const linkedProgramId = new URLSearchParams(window.location.search).get("program") || "";
      setProgramId(linkedProgramId);

      if (!linkedProgramId) {
        setPreviewLoading(false);
        return;
      }

      void supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user.app_metadata?.program_id === linkedProgramId) {
          router.replace("/client/program");
          return null;
        }
        return fetch(`/api/client/access?program=${encodeURIComponent(linkedProgramId)}`);
      }).then(async (response) => {
        if (!response) return;
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success) throw new Error(result.error || "Tautan program tidak valid.");
        if (active) setProgram(result.program);
      }).catch((failure) => {
        if (active) setError(failure instanceof Error ? failure.message : "Tautan program tidak valid.");
      }).finally(() => {
        if (active) setPreviewLoading(false);
      });
    });

    return () => { active = false; };
  }, [router]);

  const finishAccess = async (result: AccessResult) => {
    if (!result.session?.access_token || !result.session?.refresh_token) {
      throw new Error("Sesi program tidak berhasil dibuat.");
    }
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
    });
    if (sessionError) throw new Error("Gagal menyimpan sesi program.");
    toast.success(`Selamat datang, ${result.client?.displayName || "Peserta"}.`);
    const requestedPath = new URLSearchParams(window.location.search).get("next") || "";
    router.replace(requestedPath.startsWith("/client/") ? requestedPath : "/client/program");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (program && !program.available) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/client/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accessMode === "participant" ? {
          mode: "participant",
          participantCode: participantCode.trim().toUpperCase(),
          programId: program?.id || programId || undefined,
        } : {
          mode: "register",
          code: code.trim().toUpperCase(),
          programId: program?.id || programId || undefined,
          displayName: displayName.trim(),
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json.success) throw new Error(json.error || "Kode akses tidak valid.");

      if (json.needsProfile && json.program) {
        setProgram(json.program);
        setProgramId(json.program.id);
        return;
      }

      if (json.isNewParticipant && json.participantCode) {
        setPendingRegistration(json as AccessResult);
        setParticipantCodeSaved(false);
      } else {
        await finishAccess(json as AccessResult);
      }
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : "Gagal menghubungi server.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const schedule = program?.startDate && program?.endDate
    ? `${formatDate(program.startDate)} – ${formatDate(program.endDate)}`
    : program?.startDate ? `Mulai ${formatDate(program.startDate)}` : program?.endDate ? `Sampai ${formatDate(program.endDate)}` : null;

  const saveParticipantCodeFile = () => {
    if (!pendingRegistration?.participantCode) return;
    const blob = new Blob([
      `Kode Peserta BinaHub\n\n${pendingRegistration.participantCode}\n\nSimpan kode ini seperti kata sandi. Gunakan menu Sudah Terdaftar untuk masuk kembali.`,
    ], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "kode-peserta-binahub.txt";
    anchor.click();
    URL.revokeObjectURL(url);
    setParticipantCodeSaved(true);
  };

  const copyParticipantCode = async () => {
    if (!pendingRegistration?.participantCode) return;
    try {
      await navigator.clipboard.writeText(pendingRegistration.participantCode);
      setParticipantCodeSaved(true);
      toast.success("Kode peserta disalin.");
    } catch {
      toast.error("Kode tidak dapat disalin otomatis. Gunakan tombol Unduh kode.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-5 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-4">
          <Image src="/full-logo.png" alt="BinaHub" width={150} height={42} className="h-9 w-auto object-contain" priority />
        </div>

        {previewLoading ? (
          <div className="flex min-h-[70vh] items-center justify-center gap-3 text-sm font-semibold"><Loader2 className="h-5 w-5 animate-spin" /> Memuat program...</div>
        ) : (
          <div className="mt-6 grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="relative overflow-hidden bg-slate-900 p-6 text-white sm:p-8 lg:p-10">
              <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-900/60 blur-sm" />
              <div className="absolute -bottom-24 -left-16 h-52 w-52 rounded-full border-[30px] border-amber-500/10" />
              <div className="relative">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400">Akses Program BinaHub</p>
                <h1 className="mt-3 text-2xl font-bold leading-tight tracking-[-0.04em] sm:text-3xl">{program?.title || "Masuk ke program Anda"}</h1>
                <p className="mt-3 max-w-lg text-sm leading-6 text-white/68">{program ? "Gunakan kode yang diberikan penyelenggara dan isi nama Anda untuk membuka modul program." : "Masukkan kode program yang diberikan oleh tim BinaHub atau penyelenggara program."}</p>

                {program && (
                  <div className="mt-6 space-y-3 rounded-2xl border border-white/15 bg-blue-900/60 p-4 backdrop-blur-sm">
                    <p className="flex items-center gap-3 text-sm font-bold"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-amber-400"><Building2 className="h-4 w-4" /></span> {program.companyName}</p>
                    {program.location && <p className="flex items-center gap-3 text-xs text-white/80"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-amber-400"><MapPin className="h-4 w-4" /></span> {program.location}</p>}
                    {schedule && <p className="flex items-center gap-3 text-xs text-white/80"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-amber-400"><CalendarDays className="h-4 w-4" /></span> {schedule}</p>}
                  </div>
                )}

                {program && program.modules.length > 0 && (
                  <div className="mt-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">Modul program</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {program.modules.includes("lep") && <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold"><ClipboardCheck className="h-3.5 w-3.5 text-amber-400" /> LEP · Evaluasi Program</span>}
                      {program.modules.includes("tbos") && <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold"><Gamepad2 className="h-3.5 w-3.5 text-amber-400" /> T-BOS · Observasi Perilaku</span>}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="p-6 sm:p-8 lg:p-10">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><KeyRound className="h-5 w-5" /></div>
              <h2 className="mt-5 text-xl font-bold tracking-[-0.02em]">{accessMode === "register" ? "Akses pertama peserta" : "Masuk kembali"}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{accessMode === "register" ? "Daftarkan nama Anda satu kali menggunakan kode program." : "Gunakan kode peserta pribadi yang Anda simpan saat pendaftaran."}</p>

              <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Pilihan akses peserta">
                <button type="button" role="tab" aria-selected={accessMode === "register"} onClick={() => { setAccessMode("register"); setError(""); }} className={`min-h-10 rounded-lg px-3 text-xs font-bold transition ${accessMode === "register" ? "bg-blue-900 text-white shadow-sm" : "text-slate-600 hover:bg-white"}`}>Peserta Baru</button>
                <button type="button" role="tab" aria-selected={accessMode === "participant"} onClick={() => { setAccessMode("participant"); setError(""); }} className={`min-h-10 rounded-lg px-3 text-xs font-bold transition ${accessMode === "participant" ? "bg-blue-900 text-white shadow-sm" : "text-slate-600 hover:bg-white"}`}>Sudah Terdaftar</button>
              </div>

              {error && <div className="mt-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4.5 w-4.5 shrink-0" /> <span>{error}</span></div>}
              {program && !program.available && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Program ini belum aktif atau sudah selesai. Hubungi penyelenggara untuk memastikan jadwal akses.</div>}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {accessMode === "register" ? <><label className="block">
                  <span className="mb-1.5 text-xs font-bold text-slate-700">Kode akses</span>
                  <span className="relative block"><KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={code} onChange={(event) => { setCode(event.target.value.toUpperCase()); setError(""); }} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 font-mono text-sm font-bold uppercase tracking-[0.14em] outline-none transition focus:border-blue-900 focus:bg-white focus:ring-4 focus:ring-blue-900/10" placeholder="CONTOH-2026" maxLength={128} autoComplete="one-time-code" required /></span>
                </label>
                <label className="block">
                    <span className="mb-1.5 text-xs font-bold text-slate-700">Nama lengkap</span>
                    <span className="relative block"><UserRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={displayName} onChange={(event) => { setDisplayName(event.target.value); setError(""); }} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-semibold outline-none transition focus:border-blue-900 focus:bg-white focus:ring-4 focus:ring-blue-900/10" placeholder="Tulis nama Anda" minLength={2} maxLength={120} autoComplete="name" required /></span>
                </label></> : <label className="block">
                  <span className="mb-1.5 text-xs font-bold text-slate-700">Kode peserta</span>
                  <span className="relative block"><KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={participantCode} onChange={(event) => { setParticipantCode(event.target.value.toUpperCase()); setError(""); }} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 font-mono text-sm font-bold uppercase tracking-[0.12em] outline-none transition focus:border-blue-900 focus:bg-white focus:ring-4 focus:ring-blue-900/10" placeholder="BH-XXXX-XXXX" minLength={8} maxLength={32} autoComplete="one-time-code" required /></span>
                </label>}
                <button type="submit" disabled={loading || Boolean(program && !program.available)} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 text-sm font-bold text-white transition hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-45">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Memverifikasi...</> : <>{accessMode === "register" ? "Daftar dan Masuk" : "Masuk Kembali"} <ArrowRight className="h-4 w-4" /></>}
                </button>
              </form>

              <p className="mt-5 flex items-start gap-2 text-[11px] leading-5 text-slate-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> Akses terikat pada satu program dan identitas peserta. Jangan membagikan kode di luar peserta program.</p>
              {program && <button type="button" onClick={() => { setProgram(null); setProgramId(""); setCode(""); setDisplayName(""); setError(""); window.history.replaceState(null, "", "/client/access"); }} className="mt-4 w-full text-xs font-bold text-blue-900/60 hover:text-blue-900">Gunakan kode program lain</button>}
            </section>
          </div>
        )}

        <p className="mt-5 flex items-center justify-center gap-2 text-center text-[11px] text-[#4A4C54]/50"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Tidak perlu membuat akun atau kata sandi.</p>
      </div>

      {pendingRegistration?.participantCode && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="participant-code-title">
        <section className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-6 w-6" /></span>
          <h2 id="participant-code-title" className="mt-4 text-center text-xl font-bold text-slate-900">Pendaftaran berhasil</h2>
          <p className="mt-2 text-center text-sm leading-6 text-slate-600">Simpan kode peserta ini. Kode hanya ditampilkan sekarang dan digunakan untuk masuk kembali.</p>
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">Kode Peserta</p>
            <p className="mt-2 font-mono text-2xl font-black tracking-[0.12em] text-slate-900">{pendingRegistration.participantCode}</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => { void copyParticipantCode(); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-bold text-blue-900"><Copy className="h-4 w-4" /> Salin kode</button>
            <button type="button" onClick={saveParticipantCodeFile} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-bold text-blue-900"><Download className="h-4 w-4" /> Unduh kode</button>
          </div>
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-700"><input type="checkbox" checked={participantCodeSaved} onChange={(event) => setParticipantCodeSaved(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-900" /> Saya sudah menyimpan kode peserta ini.</label>
          <button type="button" disabled={!participantCodeSaved || loading} onClick={() => { setLoading(true); void finishAccess(pendingRegistration).catch((failure) => { const message = failure instanceof Error ? failure.message : "Gagal membuka program."; setError(message); toast.error(message); }).finally(() => setLoading(false)); }} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Masuk ke program <ArrowRight className="h-4 w-4" /></button>
        </section>
      </div>}
    </main>
  );
}
