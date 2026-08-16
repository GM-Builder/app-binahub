"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2, Copy, MapPin } from "lucide-react";
import { AdminAuthGate } from "@/components/admin-auth-gate";
import { toast } from "sonner";

const ENGAGEMENT_TYPES = ["assessment", "coaching", "training", "transformation"] as const;
const MODULE_OPTIONS = [
  { key: "tbos", label: "T-BOS", description: "Observasi perilaku tim berbasis misi" },
  { key: "lep", label: "LEP", description: "Evaluasi program oleh peserta" },
] as const;
type ModuleKey = typeof MODULE_OPTIONS[number]["key"];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draf" },
  { value: "active", label: "Aktif" },
  { value: "in_progress", label: "Sedang Berjalan" },
] as const;

function CreateEngagementContent() {
  const [organizationName, setOrganizationName] = useState("");
  const [location, setLocation] = useState("");
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<string>("transformation");
  const [status, setStatus] = useState<string>("draft");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [enabledModules, setEnabledModules] = useState<ModuleKey[]>(["tbos"]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => (
    organizationName.trim().length >= 2
    && title.trim().length >= 3
    && code.trim().length >= 2
    && enabledModules.length > 0
  ), [organizationName, title, code, enabledModules]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const engagementRes = await fetch("/api/engagements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationName: organizationName.trim(),
          location: location.trim() || undefined,
          code: code.trim().toUpperCase(),
          title: title.trim(),
          type,
          status,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          modules: MODULE_OPTIONS.map((module) => ({
            moduleKey: module.key,
            enabled: enabledModules.includes(module.key),
          })),
        }),
      });
      const engagementJson = await engagementRes.json();
      if (!engagementRes.ok || !engagementJson.success) throw new Error(engagementJson.error || "Gagal membuat program.");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat program.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mx-auto max-w-lg py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-[#0B2C6B]">Program Dibuat</h2>
          <p className="mt-3 text-sm text-[#4A4C54]/70">
            {title} untuk {organizationName} telah dibuat. Pengguna dapat memasukkan kode program dan mengisi namanya sendiri tanpa login.
          </p>
          <div className="mt-6 rounded-xl border border-[#D9A441]/30 bg-[#FFF9EA] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9A6817]">Kode Program</p>
            <p className="mt-2 font-mono text-xl font-bold tracking-[0.14em] text-[#0B2C6B]">{code.trim().toUpperCase()}</p>
            <button type="button" onClick={() => { void navigator.clipboard.writeText(code.trim().toUpperCase()); toast.success("Kode program disalin"); }} className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[#0B2C6B]">
              <Copy size={14} /> Salin kode
            </button>
          </div>
          <p className="mt-5 text-xs leading-5 text-[#4A4C54]/60">
            Anggota dan kapten tim T-BOS diisi oleh fasilitator ketika tim pertama kali tiba di salah satu pos.
          </p>
          <Link href="/admin/engagements" className="mt-8 inline-flex rounded-lg bg-[#0B2C6B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0A255A]">
            Kembali ke Program
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link href="/admin/engagements" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B2C6B]/70 hover:text-[#D9A441]">
        <ArrowLeft size={16} /> Kembali ke Program
      </Link>

      <div className="mx-auto mt-6 max-w-2xl">
        <div className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D9A441]">Buat Program</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#0B2C6B]">Informasi Program</h1>
          <p className="mt-1 text-sm text-[#4A4C54]/60">Tentukan perusahaan, akses, modul, dan jadwal program.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-[#0B2C6B]/70">Nama Perusahaan *</span>
              <input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} placeholder="Contoh: PT Bina Karya Indonesia" autoComplete="organization" maxLength={160} className="mt-1.5 h-11 w-full rounded-lg border border-[#0B2C6B]/15 bg-[#FAFAF8] px-4 text-sm text-[#0B2C6B] outline-none focus:border-[#D9A441]" required />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-[#0B2C6B]/70">Lokasi Program <span className="font-normal text-[#4A4C54]/50">(opsional)</span></span>
              <div className="relative mt-1.5">
                <MapPin className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-[#4A4C54]/40" aria-hidden="true" />
                <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Contoh: Jakarta atau Hotel Tentrem Yogyakarta" maxLength={200} className="h-11 w-full rounded-lg border border-[#0B2C6B]/15 bg-[#FAFAF8] pl-10 pr-4 text-sm text-[#0B2C6B] outline-none focus:border-[#D9A441]" />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-[#0B2C6B]/70">Kode Program *</span>
              <input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="TBOS-MAS-2026-01" maxLength={50} className="mt-1.5 h-11 w-full rounded-lg border border-[#0B2C6B]/15 bg-[#FAFAF8] px-4 font-mono text-sm text-[#0B2C6B] outline-none focus:border-[#D9A441]" required />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-[#0B2C6B]/70">Nama Program *</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Leadership Readiness Sprint" maxLength={200} className="mt-1.5 h-11 w-full rounded-lg border border-[#0B2C6B]/15 bg-[#FAFAF8] px-4 text-sm text-[#0B2C6B] outline-none focus:border-[#D9A441]" required />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-[#0B2C6B]/70">Tipe</span>
              <select value={type} onChange={(event) => setType(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-[#0B2C6B]/15 bg-[#FAFAF8] px-3 text-sm text-[#0B2C6B] outline-none focus:border-[#D9A441]">
                {ENGAGEMENT_TYPES.map((engagementType) => <option key={engagementType} value={engagementType}>{engagementType.charAt(0).toUpperCase() + engagementType.slice(1)}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-[#0B2C6B]/70">Status Awal</span>
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-[#0B2C6B]/15 bg-[#FAFAF8] px-3 text-sm text-[#0B2C6B] outline-none focus:border-[#D9A441]">
                {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>

          <fieldset className="mt-5">
            <legend className="text-xs font-semibold text-[#0B2C6B]/70">Modul Program *</legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {MODULE_OPTIONS.map((module) => {
                const checked = enabledModules.includes(module.key);
                return (
                  <label key={module.key} className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${checked ? "border-[#D9A441] bg-[#FFF9EA]" : "border-[#0B2C6B]/10 bg-white"}`}>
                    <input type="checkbox" checked={checked} onChange={() => setEnabledModules((current) => checked ? current.filter((key) => key !== module.key) : [...current, module.key])} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0B2C6B]" />
                    <span><strong className="block text-sm text-[#0B2C6B]">{module.label}</strong><span className="mt-1 block text-xs text-[#4A4C54]/65">{module.description}</span></span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-[#0B2C6B]/70">Tanggal Mulai</span>
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-[#0B2C6B]/15 bg-[#FAFAF8] px-4 text-sm text-[#0B2C6B] outline-none focus:border-[#D9A441]" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-[#0B2C6B]/70">Tanggal Selesai</span>
              <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} min={startDate || undefined} className="mt-1.5 h-11 w-full rounded-lg border border-[#0B2C6B]/15 bg-[#FAFAF8] px-4 text-sm text-[#0B2C6B] outline-none focus:border-[#D9A441]" />
            </label>
          </div>

          <div className="mt-5 rounded-lg border border-[#0B2C6B]/8 bg-[#F7F8FA] p-3 text-xs leading-5 text-[#4A4C54]/70">
            Peserta tidak perlu didaftarkan saat program dibuat. Mereka mengisi nama sendiri melalui kode program; anggota tim dan kapten T-BOS ditetapkan saat kunjungan pos pertama.
          </div>

          {error && <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={16} /> {error}</div>}

          <div className="mt-6 flex justify-end">
            <button type="submit" disabled={!canSubmit || submitting} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#D9A441] px-5 text-sm font-semibold text-[#071B3D] hover:bg-[#c49235] disabled:cursor-not-allowed disabled:opacity-40">
              {submitting ? "Membuat..." : "Buat Program"} <CheckCircle2 size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreateEngagementPage() {
  return <AdminAuthGate><CreateEngagementContent /></AdminAuthGate>;
}
