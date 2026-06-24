"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Copy, Plus, UsersRound, X, Search, KeyRound } from "lucide-react";
import { useEngagements, useUsers } from "@/hooks/use-transformation-data";
import { AdminAuthGate } from "@/components/admin-auth-gate";
import { toast } from "sonner";

const ENGAGEMENT_TYPES = ["assessment", "coaching", "training", "transformation"] as const;

const STATUS_OPTIONS = [
  { value: "draft", label: "Draf" },
  { value: "active", label: "Aktif" },
  { value: "in_progress", label: "Sedang Berjalan" },
] as const;

interface DraftParticipant {
  id: string;
  name: string;
  email: string;
  role: "participant" | "leader" | "observer";
}

interface DraftFacilitator {
  id: string;
  name: string;
  email: string;
  role: "lead" | "assistant";
}

function CreateEngagementContent() {
  const router = useRouter();
  const { engagements } = useEngagements();
  const { users } = useUsers();
  const availableFacilitators = users.filter((u) => u.role === "facilitator" || u.role === "admin");

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<string>("transformation");
  const [status, setStatus] = useState<string>("draft");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [participants, setParticipants] = useState<DraftParticipant[]>([]);
  const [facilitators, setFacilitators] = useState<DraftFacilitator[]>([]);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<DraftParticipant["role"]>("participant");

  const [newFacName, setNewFacName] = useState("");
  const [newFacEmail, setNewFacEmail] = useState("");
  const [newFacRole, setNewFacRole] = useState<DraftFacilitator["role"]>("assistant");
  const [facSearch, setFacSearch] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [accessCodes, setAccessCodes] = useState<{ participantName: string; accessCode: string }[]>([]);

  const organizationId = useMemo(() => {
    const first = engagements[0];
    return first?.organization_id || "00000000-0000-0000-0000-000000000000";
  }, [engagements]);

  const canNext = useMemo(() => {
    if (step === 0) return title.trim().length >= 3;
    if (step === 1) return participants.length > 0;
    if (step === 2) return true;
    return true;
  }, [step, title, participants]);

  const addParticipant = () => {
    if (!newName.trim()) return;
    setParticipants((prev) => [...prev, { id: crypto.randomUUID(), name: newName.trim(), email: newEmail.trim(), role: newRole }]);
    setNewName(""); setNewEmail("");
  };

  const removeParticipant = (id: string) => setParticipants((prev) => prev.filter((p) => p.id !== id));

  const addFacilitator = () => {
    if (!newFacName.trim()) return;
    setFacilitators((prev) => [...prev, { id: crypto.randomUUID(), name: newFacName.trim(), email: newFacEmail.trim(), role: newFacRole }]);
    setNewFacName(""); setNewFacEmail("");
  };

  const removeFacilitator = (id: string) => setFacilitators((prev) => prev.filter((f) => f.id !== id));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const engagementRes = await fetch("/api/engagements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          title: title.trim(),
          type,
          status,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          participants: participants.map((p) => ({
            name: p.name,
            email: p.email || undefined,
            role: p.role,
          })),
        }),
      });
      const engagementJson = await engagementRes.json();
      if (!engagementRes.ok || !engagementJson.success) throw new Error(engagementJson.error || "Gagal membuat program.");

      if (engagementJson.accessCodes?.length > 0) {
        setAccessCodes(engagementJson.accessCodes);
      }

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
            {title} telah dibuat dengan {participants.length} peserta.
          </p>

          {accessCodes.length > 0 && (
            <div className="mt-8 rounded-xl border border-[#0B2C6B]/10 bg-white p-6 text-left shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <KeyRound size={18} className="text-[#D9A441]" />
                <h3 className="text-sm font-bold text-[#0B2C6B]">Kode Akses Klien</h3>
              </div>
              <p className="mb-4 text-xs text-[#4A4C54]/60">
                Berikan kode ini kepada klien untuk login ke halaman klien.
              </p>
              <div className="space-y-2">
                {accessCodes.map((ac, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg border border-[#0B2C6B]/8 bg-[#FAFAF8] px-4 py-2.5">
                    <div>
                      <p className="text-xs text-[#4A4C54]/50">{ac.participantName}</p>
                      <p className="font-mono text-sm font-bold tracking-wider text-[#0B2C6B]">{ac.accessCode}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(ac.accessCode);
                        toast.success(`Kode ${ac.accessCode} disalin`);
                      }}
                      className="rounded-md p-1.5 text-[#4A4C54]/40 hover:bg-[#0B2C6B]/5 hover:text-[#0B2C6B]"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  const all = accessCodes.map((ac) => `${ac.participantName}: ${ac.accessCode}`).join("\n");
                  navigator.clipboard.writeText(all);
                  toast.success("Semua kode disalin");
                }}
                className="mt-3 w-full rounded-lg border border-[#0B2C6B]/15 py-2 text-xs font-semibold text-[#0B2C6B] hover:bg-[#F5F7FA]"
              >
                Salin Semua Kode
              </button>
            </div>
          )}

          <div className="mt-8 flex justify-center gap-3">
            <Link href="/admin/engagements" className="rounded-lg bg-[#0B2C6B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0A255A]">
              Kembali ke Program
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <Link href="/admin/engagements" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B2C6B]/70 hover:text-[#D9A441]">
        <ArrowLeft size={16} /> Kembali ke Program
      </Link>

      <div className="mx-auto mt-6 max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D9A441]">Buat Program</p>
          <span className="text-xs font-semibold text-[#4A4C54]/50">Step {step + 1} of 3</span>
        </div>

        <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-6 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
          {step === 0 && (
            <div>
              <h2 className="text-xl font-semibold text-[#0B2C6B]">Informasi Dasar</h2>
              <p className="mt-1 text-sm text-[#4A4C54]/60">Tentukan detail program transformasi.</p>
              <label className="mt-5 block">
                <span className="text-xs font-semibold text-[#0B2C6B]/60">Judul *</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Leadership Readiness Sprint" className="mt-1.5 h-11 w-full rounded-lg border border-[#0B2C6B]/15 bg-[#FAFAF8] px-4 text-sm text-[#0B2C6B] outline-none focus:border-[#D9A441]" required />
              </label>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-semibold text-[#0B2C6B]/60">Tipe</span>
                  <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-[#0B2C6B]/15 bg-[#FAFAF8] px-3 text-sm text-[#0B2C6B] outline-none focus:border-[#D9A441]">
                    {ENGAGEMENT_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-[#0B2C6B]/60">Status Awal</span>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-[#0B2C6B]/15 bg-[#FAFAF8] px-3 text-sm text-[#0B2C6B] outline-none focus:border-[#D9A441]">
                    {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </label>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-semibold text-[#0B2C6B]/60">Tanggal Mulai</span>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-[#0B2C6B]/15 bg-[#FAFAF8] px-4 text-sm text-[#0B2C6B] outline-none focus:border-[#D9A441]" />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-[#0B2C6B]/60">Tanggal Selesai</span>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-[#0B2C6B]/15 bg-[#FAFAF8] px-4 text-sm text-[#0B2C6B] outline-none focus:border-[#D9A441]" />
                </label>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-[#0B2C6B]">Tugaskan Peserta</h2>
              <p className="mt-1 text-sm text-[#4A4C54]/60">Tambah peserta ke program ini.</p>
              <div className="mt-5 flex flex-wrap items-end gap-3">
                <label className="flex-1">
                  <span className="text-xs font-semibold text-[#0B2C6B]/60">Name</span>
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addParticipant())} placeholder="Nama peserta" className="mt-1.5 h-11 w-full rounded-lg border border-[#0B2C6B]/15 bg-[#FAFAF8] px-4 text-sm text-[#0B2C6B] outline-none focus:border-[#D9A441]" />
                </label>
                <label className="hidden sm:block">
                  <span className="text-xs font-semibold text-[#0B2C6B]/60">Email</span>
                  <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@example.com" className="mt-1.5 h-11 w-full rounded-lg border border-[#0B2C6B]/15 bg-[#FAFAF8] px-4 text-sm text-[#0B2C6B] outline-none focus:border-[#D9A441]" />
                </label>
                <label>
                  <span className="text-xs font-semibold text-[#0B2C6B]/60">Role</span>
                  <select value={newRole} onChange={(e) => setNewRole(e.target.value as DraftParticipant["role"])} className="mt-1.5 h-11 w-28 rounded-lg border border-[#0B2C6B]/15 bg-[#FAFAF8] px-3 text-sm text-[#0B2C6B] outline-none focus:border-[#D9A441]">
                    <option value="participant">Peserta</option>
                    <option value="leader">Leader</option>
                    <option value="observer">Observer</option>
                  </select>
                </label>
                <button type="button" onClick={addParticipant} className="flex h-11 items-center gap-2 rounded-lg bg-[#0B2C6B] px-4 text-sm font-semibold text-white hover:bg-[#0A255A]">
                  <Plus size={16} /> Add
                </button>
              </div>
              {participants.length > 0 && (
                <div className="mt-4 space-y-2">
                  {participants.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg border border-[#0B2C6B]/8 p-3">
                      <div className="flex items-center gap-3">
                        <UsersRound size={16} className="text-[#0B2C6B]/50" />
                        <div>
                          <p className="text-sm font-medium text-[#0B2C6B]">{p.name}</p>
                          <p className="text-xs text-[#4A4C54]/50">{p.email || "Tanpa email"} — {p.role}</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => removeParticipant(p.id)} className="text-[#4A4C54]/40 hover:text-red-500"><X size={16} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-[#0B2C6B]">Tugaskan Fasilitator</h2>
              <p className="mt-1 text-sm text-[#4A4C54]/60">Pilih dari daftar fasilitator yang tersedia atau tambahkan manual.</p>

              {availableFacilitators.length > 0 && (
                <div className="mt-5">
                  <div className="mb-3 flex items-center gap-2 rounded-lg border border-[#0B2C6B]/15 bg-[#FAFAF8] px-3">
                    <Search size={14} className="text-[#4A4C54]/40" />
                    <input
                      value={facSearch}
                      onChange={(e) => setFacSearch(e.target.value)}
                      placeholder="Cari fasilitator..."
                      className="h-10 w-full bg-transparent text-sm outline-none"
                    />
                  </div>
                  <p className="mb-2 text-xs font-semibold text-[#4A4C54]/50">Fasilitator Tersedia</p>
                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    {availableFacilitators
                      .filter((f) => {
                        const matchesSearch = !facSearch ||
                          f.name?.toLowerCase().includes(facSearch.toLowerCase()) ||
                          f.email.toLowerCase().includes(facSearch.toLowerCase());
                        return matchesSearch;
                      })
                      .map((f) => {
                        const isAssigned = facilitators.some((af) => af.id === f.id);
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => {
                              if (!isAssigned) {
                                setFacilitators((prev) => [...prev, {
                                  id: f.id,
                                  name: f.name || f.email,
                                  email: f.email,
                                  role: "assistant",
                                }]);
                              }
                            }}
                            disabled={isAssigned}
                            className="flex w-full items-center justify-between rounded-lg border border-[#0B2C6B]/8 p-3 text-left transition hover:bg-[#F5F7FA] disabled:opacity-50"
                          >
                            <div className="flex items-center gap-3">
                              <UsersRound size={16} className="text-[#0B2C6B]/50" />
                              <div>
                                <p className="text-sm font-medium text-[#0B2C6B]">{f.name || f.email}</p>
                                <p className="text-xs text-[#4A4C54]/50">{f.email} — {f.role}</p>
                              </div>
                            </div>
                            {isAssigned && <CheckCircle2 size={16} className="text-emerald-500" />}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              <div className="mt-5 border-t border-[#0B2C6B]/10 pt-5">
                <p className="mb-3 text-xs font-semibold text-[#4A4C54]/50">Atau Tambah Manual</p>
                <div className="flex flex-wrap items-end gap-3">
                  <label className="flex-1">
                    <span className="text-xs font-semibold text-[#0B2C6B]/60">Name</span>
                    <input value={newFacName} onChange={(e) => setNewFacName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFacilitator())} placeholder="Nama fasilitator" className="mt-1.5 h-11 w-full rounded-lg border border-[#0B2C6B]/15 bg-[#FAFAF8] px-4 text-sm text-[#0B2C6B] outline-none focus:border-[#D9A441]" />
                  </label>
                  <label>
                    <span className="text-xs font-semibold text-[#0B2C6B]/60">Role</span>
                    <select value={newFacRole} onChange={(e) => setNewFacRole(e.target.value as DraftFacilitator["role"])} className="mt-1.5 h-11 w-28 rounded-lg border border-[#0B2C6B]/15 bg-[#FAFAF8] px-3 text-sm text-[#0B2C6B] outline-none focus:border-[#D9A441]">
                      <option value="lead">Lead</option>
                      <option value="assistant">Assistant</option>
                    </select>
                  </label>
                  <button type="button" onClick={addFacilitator} className="flex h-11 items-center gap-2 rounded-lg bg-[#0B2C6B] px-4 text-sm font-semibold text-white hover:bg-[#0A255A]">
                    <Plus size={16} /> Tambah
                  </button>
                </div>
              </div>

              {facilitators.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-[#4A4C54]/50">Fasilitator Ditugaskan ({facilitators.length})</p>
                  {facilitators.map((f) => (
                    <div key={f.id} className="flex items-center justify-between rounded-lg border border-[#0B2C6B]/8 p-3">
                      <div className="flex items-center gap-3">
                        <UsersRound size={16} className="text-[#0B2C6B]/50" />
                        <div>
                          <p className="text-sm font-medium text-[#0B2C6B]">{f.name}</p>
                          <p className="text-xs text-[#4A4C54]/50">{f.email || "Tanpa email"} — {f.role}</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => removeFacilitator(f.id)} className="text-[#4A4C54]/40 hover:text-red-500"><X size={16} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="rounded-lg border border-[#0B2C6B]/20 px-4 py-2 text-sm font-semibold text-[#0B2C6B] hover:bg-[#F5F7FA] disabled:opacity-40">
              <ArrowLeft size={16} className="inline mr-1" /> Kembali
            </button>
            {step < 2 ? (
              <button type="button" onClick={() => setStep((s) => Math.min(2, s + 1))} disabled={!canNext} className="inline-flex items-center gap-2 rounded-lg bg-[#0B2C6B] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0A255A] disabled:opacity-40">
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={submitting || participants.length === 0} className="inline-flex items-center gap-2 rounded-lg bg-[#D9A441] px-5 py-2 text-sm font-semibold text-[#071B3D] hover:bg-[#c49235] disabled:opacity-40">
                {submitting ? "Membuat..." : "Buat Program"} <CheckCircle2 size={16} />
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function CreateEngagementPage() {
  return <AdminAuthGate><CreateEngagementContent /></AdminAuthGate>;
}
