"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, KeyRound, Plus, UsersRound, X, MessageSquare, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useEngagements, useEvidence } from "@/hooks/use-transformation-data";
import { AdminAuthGate } from "@/components/admin-auth-gate";
import { StatusPill, Breadcrumb, ConfirmDialog } from "@/components/ui";
import { ErrorBoundary } from "@/components/error-boundary";
import { supabase } from "@/lib/supabase";

const STATUS_ORDER = ["draft", "active", "in_progress", "review", "completed", "archived"] as const;
const STATUS_FLOW: Record<string, string[]> = {
  draft: ["active"],
  active: ["in_progress"],
  in_progress: ["review", "active"],
  review: ["completed", "in_progress"],
  completed: ["archived"],
  archived: [],
};

interface DraftParticipant {
  id: string;
  name: string;
  email: string;
  role: "participant" | "leader" | "observer";
}

function ManageEngagementContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  const { engagements } = useEngagements();
  const { evidence } = useEvidence(id ? { engagement_id: id } : {});

  const engagement = useMemo(() => engagements.find((e) => e.id === id) || null, [engagements, id]);
  const [transitioning, setTransitioning] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState("");
  const [addingParticipant, setAddingParticipant] = useState(false);
  const [participants, setParticipants] = useState<DraftParticipant[]>([]);
  const [confirmStatus, setConfirmStatus] = useState<string | null>(null);
  const [notes, setNotes] = useState<Array<{ id: string; content: string; author_id: string; created_at: string; author?: { email: string } }>>([]);
  const [newNote, setNewNote] = useState("");
  const [sendingNote, setSendingNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const currentIndex = engagement ? STATUS_ORDER.indexOf(engagement.status as typeof STATUS_ORDER[number]) : -1;
  const nextStates = engagement ? STATUS_FLOW[engagement.status] || [] : [];

  const fetchNotes = async () => {
    if (!id) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;

      const response = await fetch(`/api/engagement-notes?engagement_id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json();
      if (json.success) {
        setNotes(json.notes || []);
      }
    } catch {
      // Silent fail for notes
    }
  };

  useEffect(() => {
    void fetchNotes();
  }, [id]);

  const handleSendNote = async () => {
    if (!newNote.trim() || !id) return;
    setSendingNote(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast.error("Sesi tidak valid.");
        setSendingNote(false);
        return;
      }

      const response = await fetch("/api/engagement-notes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ engagement_id: id, content: newNote.trim() }),
      });

      const json = await response.json();
      if (json.success) {
        toast.success("Catatan berhasil ditambahkan.");
        setNewNote("");
        void fetchNotes();
      } else {
        toast.error(json.error || "Gagal menambahkan catatan.");
      }
    } catch {
      toast.error("Gagal menambahkan catatan.");
    }
    setSendingNote(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;

      const response = await fetch(`/api/engagement-notes?id=${noteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await response.json();
      if (json.success) {
        toast.success("Catatan dihapus.");
        void fetchNotes();
      } else {
        toast.error(json.error || "Gagal menghapus catatan.");
      }
    } catch {
      toast.error("Gagal menghapus catatan.");
    }
    setDeletingNoteId(null);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!engagement) return;
    setTransitioning(true);
    try {
      await fetch(`/api/engagements/${engagement.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success("Status program diperbarui");
      window.location.reload();
    } catch {
      toast.error("Gagal memperbarui status");
      setTransitioning(false);
    }
  };

  const handleAddParticipant = async () => {
    if (!engagement || !newParticipantName.trim()) return;
    setAddingParticipant(true);
    try {
      await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: engagement.organization_id,
          engagementId: engagement.id,
          name: newParticipantName.trim(),
          engagementRole: "participant",
        }),
      });
      setParticipants((prev) => [...prev, {
        id: crypto.randomUUID(),
        name: newParticipantName.trim(),
        email: "",
        role: "participant",
      }]);
      setNewParticipantName("");
      toast.success("Peserta ditambahkan");
    } catch {
      toast.error("Gagal menambahkan peserta");
    } finally {
      setAddingParticipant(false);
    }
  };

  if (!engagement) {
    return (
      <div className="p-6 lg:p-8">
        <Breadcrumb items={[
          { label: "Program", href: "/admin/engagements" },
          { label: "Tidak Ditemukan" },
        ]} />
        <div className="py-20 text-center text-sm text-[#4A4C54]/60">Program tidak ditemukan.</div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <Breadcrumb items={[
        { label: "Program", href: "/admin/engagements" },
        { label: engagement.title },
      ]} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-6">
          <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#D9A441]">{engagement.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</p>
                <h2 className="mt-1 text-xl font-semibold text-[#0B2C6B]">{engagement.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/engagements/access-codes?engagement_id=${engagement.id}&title=${encodeURIComponent(engagement.title)}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#D9A441]/30 bg-[#D9A441]/10 px-3 py-1.5 text-xs font-semibold text-[#D9A441] hover:bg-[#D9A441]/20"
                >
                  <KeyRound size={14} /> Kode Akses
                </Link>
                <StatusPill status={engagement.status} />
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div><dt className="text-[#4A4C54]/50">Peserta</dt><dd className="font-semibold text-[#0B2C6B]">{engagement.participants ?? participants.length}</dd></div>
              <div><dt className="text-[#4A4C54]/50">Catatan</dt><dd className="font-semibold text-[#0B2C6B]">{evidence.length}</dd></div>
              <div><dt className="text-[#4A4C54]/50">Dibuat</dt><dd className="font-semibold text-[#0B2C6B]">{new Date(engagement.created_at).toLocaleDateString("id-ID")}</dd></div>
            </dl>

            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#D9A441]">Transisi Status</p>
              <div className="flex items-center gap-2">
                {STATUS_ORDER.map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${
                      i < currentIndex ? "bg-emerald-500 text-white" :
                      i === currentIndex ? "bg-[#0B2C6B] text-white" :
                      "bg-[#E6EAF0] text-[#4A4C54]/50"
                    }`}>
                      {i < currentIndex ? <CheckCircle2 size={14} /> : i + 1}
                    </div>
                    {i < STATUS_ORDER.length - 1 && <div className={`h-0.5 w-6 ${i < currentIndex ? "bg-emerald-500" : "bg-[#E6EAF0]"}`} />}
                  </div>
                ))}
              </div>
              <div className="mt-1 flex justify-between text-[10px] font-semibold text-[#4A4C54]/50">
                {STATUS_ORDER.map((s) => <span key={s}>{s.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}</span>)}
              </div>
            </div>

            {nextStates.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {nextStates.map((ns) => (
                  <button key={ns} type="button"
                    onClick={() => ns === "archived" ? setConfirmStatus(ns) : handleStatusChange(ns)}
                    disabled={transitioning}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2C6B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0A255A] disabled:opacity-50">
                    Pindah ke {ns.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} <ArrowRight size={16} />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Peserta</p>
                <h3 className="mt-1 text-lg font-semibold text-[#0B2C6B]">{participants.length} ditugaskan</h3>
              </div>
              <button type="button" onClick={handleAddParticipant} disabled={!newParticipantName.trim() || addingParticipant}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2C6B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0A255A] disabled:opacity-50">
                <Plus size={12} /> Tambah
              </button>
            </div>
            <div className="flex gap-2">
              <input value={newParticipantName} onChange={(e) => setNewParticipantName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddParticipant()}
                placeholder="Nama peserta..." className="flex-1 h-9 rounded-lg border border-[#0B2C6B]/15 bg-[#FAFAF8] px-3 text-sm outline-none focus:border-[#D9A441]" />
            </div>
            {participants.length === 0 ? (
              <p className="mt-4 text-sm text-[#4A4C54]/50">Belum ada peserta ditugaskan.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-[#0B2C6B]/8 p-3">
                    <div className="flex items-center gap-2">
                      <UsersRound size={16} className="text-[#0B2C6B]/50" />
                      <span className="text-sm font-medium text-[#0B2C6B]">{p.name}</span>
                      <span className="text-xs text-[#4A4C54]/50">({p.role})</span>
                    </div>
                    <button type="button" className="text-[#4A4C54]/40 hover:text-red-500"><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Catatan</p>
            <h3 className="mt-1 text-lg font-semibold text-[#0B2C6B]">{evidence.length} items</h3>
            <div className="mt-4 space-y-2">
              {evidence.slice(0, 5).map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-lg border border-[#0B2C6B]/8 p-2">
                  <span className="text-xs text-[#0B2C6B]">{e.type.replace(/_/g, " ")}</span>
                  <span className="text-[10px] text-[#4A4C54]/50">{new Date(e.created_at).toLocaleDateString("id-ID")}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare size={16} className="text-[#D9A441]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Catatan Internal</p>
            </div>
            <div className="flex gap-2">
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendNote()}
                placeholder="Tulis catatan..."
                className="flex-1 h-9 rounded-lg border border-[#0B2C6B]/15 bg-[#FAFAF8] px-3 text-sm outline-none focus:border-[#D9A441]"
              />
              <button
                onClick={() => void handleSendNote()}
                disabled={!newNote.trim() || sendingNote}
                className="inline-flex items-center justify-center rounded-lg bg-[#0B2C6B] p-2 text-white hover:bg-[#0A255A] disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </div>
            {notes.length === 0 ? (
              <p className="mt-4 text-sm text-[#4A4C54]/50">Belum ada catatan internal.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {notes.map((note) => (
                  <div key={note.id} className="group rounded-lg border border-[#0B2C6B]/8 p-3">
                    <p className="text-sm text-[#0B2C6B]">{note.content}</p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-[#4A4C54]/50">
                      <span>{note.author?.email || "Admin"} &bull; {new Date(note.created_at).toLocaleDateString("id-ID")}</span>
                      <button
                        onClick={() => setDeletingNoteId(note.id)}
                        className="opacity-0 transition group-hover:opacity-100 text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="space-y-3">
            <Link href={`/client/engagements/detail?id=${id}`} className="flex items-center justify-center gap-2 rounded-xl bg-[#0B2C6B] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0A255A]">
              <Eye size={16} /> Lihat sebagai Peserta
            </Link>
            <Link href={`/facilitator/evidence`} className="flex items-center justify-center gap-2 rounded-xl border border-[#0B2C6B]/20 px-4 py-3 text-sm font-semibold text-[#0B2C6B] hover:bg-[#F5F7FA]">
              <Eye size={16} /> Tambah Pengamatan
            </Link>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmStatus}
        onClose={() => setConfirmStatus(null)}
        onConfirm={() => { if (confirmStatus) handleStatusChange(confirmStatus); }}
        title="Arsipkan Program?"
        description="Program yang diarsipkan tidak akan muncul di daftar aktif. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, Arsipkan"
        variant="danger"
      />

      <ConfirmDialog
        open={!!deletingNoteId}
        onClose={() => setDeletingNoteId(null)}
        onConfirm={() => deletingNoteId && void handleDeleteNote(deletingNoteId)}
        title="Hapus Catatan?"
        description="Catatan internal akan dihapus secara permanen."
        confirmLabel="Hapus"
        variant="danger"
      />
    </div>
  );
}

export default function ManageEngagementPage() {
  return (
    <AdminAuthGate>
      <ErrorBoundary>
        <Suspense fallback={<div className="p-6 lg:p-8 py-20 text-center text-sm text-[#4A4C54]/60">Memuat...</div>}>
          <ManageEngagementContent />
        </Suspense>
      </ErrorBoundary>
    </AdminAuthGate>
  );
}
