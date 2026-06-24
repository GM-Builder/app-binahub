"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, Target, AlertCircle, ArrowUpRight, Users } from "lucide-react";
import { useEngagements, useEvidence, useActions } from "@/hooks/use-transformation-data";
import { CAPABILITY_NAMES } from "@/lib/transformation-types";
import { supabase } from "@/lib/supabase";

interface ParticipantOption {
  id: string;
  name: string;
}

export function ObservationInput() {
  const { engagements } = useEngagements();
  const { evidence } = useEvidence();
  const { actions } = useActions();
  const [step, setStep] = useState(0);
  const [engagementId, setEngagementId] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [observation, setObservation] = useState("");
  const [situation, setSituation] = useState("");
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);
  const [confidence, setConfidence] = useState(0.8);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const filteredEngagements = useMemo(
    () => engagements.filter((e) => e.status === "active" || e.status === "in_progress"),
    [engagements],
  );

  const [apiParticipants, setApiParticipants] = useState<ParticipantOption[]>([]);

  useEffect(() => {
    if (!engagementId) {
      setApiParticipants([]);
      return;
    }
    let alive = true;
    async function loadParticipants() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) return;
        const res = await fetch(`/api/engagement-participants?engagement_id=${engagementId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (alive && json.success) {
          const list = (json.participants || []).map((p: Record<string, unknown>) => {
            const participant = p.participant && typeof p.participant === "object" ? p.participant as Record<string, unknown> : p;
            return {
              id: String(participant?.id || p.participant_id || ""),
              name: String(participant?.name || "Peserta"),
            };
          });
          setApiParticipants(list.filter((p: ParticipantOption) => p.id));
        }
      } catch {
        // silent
      }
    }
    void loadParticipants();
    return () => { alive = false; };
  }, [engagementId]);

  const participants = useMemo(() => {
    const map = new Map<string, ParticipantOption>();
    apiParticipants.forEach((p) => map.set(p.id, p));
    evidence.forEach((e) => {
      if (e.participant_id && !map.has(e.participant_id)) {
        map.set(e.participant_id, { id: e.participant_id, name: e.participant_id });
      }
    });
    actions.forEach((a) => {
      if (a.participant_id && !map.has(a.participant_id)) {
        map.set(a.participant_id, { id: a.participant_id, name: a.participant_id });
      }
    });
    return Array.from(map.values());
  }, [apiParticipants, evidence, actions]);

  const toggleCapability = (name: string) => {
    setSelectedCapabilities((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    );
  };

  const canNext = useMemo(() => {
    if (step === 0) return !!engagementId && !!participantId;
    if (step === 1) return !!situation.trim();
    if (step === 2) return !!observation.trim().length;
    if (step === 3) return selectedCapabilities.length > 0;
    return true;
  }, [step, engagementId, participantId, observation, situation, selectedCapabilities]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const participant = participants.find((p) => p.id === participantId);
      const response = await fetch("/api/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engagementId,
          participantId,
          type: "observation",
          source: "facilitator",
          content: {
            observation,
            situation,
            text: `Situasi: ${situation}\n\nObservasi: ${observation}`,
          },
          capabilityTags: selectedCapabilities,
          confidenceScore: confidence,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || "Gagal submit observasi.");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal submit observasi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 size={28} className="text-emerald-500" />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-[#0B2C6B]">Pengamatan Terkirim</h2>
        <p className="mt-2 text-sm text-[#4A4C54]/70 max-w-md mx-auto">
          EvidenceCreated event has been queued. Capability recalculation will follow.
        </p>
        <button
          type="button"
          onClick={() => {
            setStep(0); setEngagementId(""); setParticipantId(""); setObservation("");
            setSituation(""); setSelectedCapabilities([]); setSubmitted(false);
          }}
          className="mt-6 rounded-lg bg-[#0B2C6B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0A255A]"
        >
          Kirim Pengamatan Lain
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#0B2C6B]/70">
        <Eye size={16} />
        <span>Pengamatan Fasilitator — Langkah {step + 1} dari 4</span>
      </div>

      <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-6 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
        {step === 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D9A441]">Pilih Target</p>
            <h2 className="mt-2 text-xl font-semibold text-[#0B2C6B]">Pilih Program & Peserta</h2>
            <label className="mt-5 block">
              <span className="text-xs font-semibold text-[#0B2C6B]/60">Program</span>
              <select
                value={engagementId}
                onChange={(e) => setEngagementId(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-lg border border-[#0B2C6B]/15 bg-[#FAFAF8] px-3 text-sm font-medium text-[#0B2C6B] outline-none focus:border-[#D9A441]"
              >
                <option value="">Pilih program...</option>
                {filteredEngagements.map((e) => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            </label>
            <label className="mt-4 block">
              <span className="text-xs font-semibold text-[#0B2C6B]/60">Peserta</span>
              <select
                value={participantId}
                onChange={(e) => setParticipantId(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-lg border border-[#0B2C6B]/15 bg-[#FAFAF8] px-3 text-sm font-medium text-[#0B2C6B] outline-none focus:border-[#D9A441]"
              >
                <option value="">Pilih peserta...</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        {step === 1 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D9A441]">Situation</p>
            <h2 className="mt-2 text-xl font-semibold text-[#0B2C6B]">Jelaskan situasi yang diamati</h2>
            <p className="mt-1 text-sm text-[#4A4C54]/60">Konteks di mana observasi terjadi.</p>
            <textarea
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              rows={4}
              placeholder="Contoh: Dalam sesi coaching mingguan, saat membahas progress project Q3..."
              className="mt-4 w-full rounded-lg border border-[#0B2C6B]/15 bg-[#FAFAF8] p-4 text-sm leading-6 text-[#0B2C6B] outline-none focus:border-[#D9A441] placeholder:text-[#4A4C54]/40"
            />
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D9A441]">Pengamatan</p>
            <h2 className="mt-2 text-xl font-semibold text-[#0B2C6B]">Tulis hasil observasi</h2>
            <p className="mt-1 text-sm text-[#4A4C54]/60">Apa yang terlihat? Perilaku, keputusan, atau skill apa yang ditunjukkan?</p>
            <textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              rows={5}
              placeholder="Contoh: Andini mampu memfasilitasi diskusi tim dengan baik. Ia aktif mendengarkan pendapat anggota tim dan mampu menyimpulkan keputusan dengan jelas..."
              className="mt-4 w-full rounded-lg border border-[#0B2C6B]/15 bg-[#FAFAF8] p-4 text-sm leading-6 text-[#0B2C6B] outline-none focus:border-[#D9A441] placeholder:text-[#4A4C54]/40"
            />
            <div className="mt-3">
              <span className="text-xs font-semibold text-[#0B2C6B]/60">Keyakinan: {Math.round(confidence * 100)}%</span>
              <input
                type="range"
                min="0.5"
                max="1"
                step="0.05"
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
                className="mt-1 w-full"
              />
              <div className="flex justify-between text-[10px] text-[#4A4C54]/50">
                <span>Low (50%)</span>
                <span>High (100%)</span>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="mb-1 flex items-center gap-2 text-[#D9A441]">
              <Target size={18} />
              <p className="text-xs font-bold uppercase tracking-[0.18em]">Tag Kemampuan</p>
            </div>
            <h2 className="text-xl font-semibold text-[#0B2C6B]">Kemampuan apa yang terlihat?</h2>
            <p className="mt-2 text-sm text-[#4A4C54]/60">
              Pilih minimal satu kemampuan yang diobservasi. Setiap observasi WAJIB terhubung ke kemampuan.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {CAPABILITY_NAMES.map((name) => {
                const selected = selectedCapabilities.includes(name);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleCapability(name)}
                    className={`rounded-lg border-2 p-3 text-left text-sm font-semibold transition-colors ${
                      selected
                        ? "border-[#D9A441] bg-[#D9A441]/10 text-[#0B2C6B]"
                        : "border-[#0B2C6B]/10 bg-white text-[#0B2C6B]/70 hover:border-[#0B2C6B]/25"
                    }`}
                  >
                    {name}
                    {selected && <CheckCircle2 size={14} className="ml-2 inline text-[#D9A441]" />}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-[#4A4C54]/50">{selectedCapabilities.length} dipilih</p>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-lg border border-[#0B2C6B]/20 px-4 py-2 text-sm font-semibold text-[#0B2C6B] hover:bg-[#F5F7FA] disabled:opacity-40"
          >
            Back
          </button>
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(3, s + 1))}
              disabled={!canNext}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0B2C6B] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0A255A] disabled:opacity-40"
            >
              Next <ArrowUpRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canNext || submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-[#D9A441] px-5 py-2 text-sm font-semibold text-[#071B3D] hover:bg-[#c49235] disabled:opacity-40"
            >
              {submitting ? "Mengirim..." : "Kirim Pengamatan"} <CheckCircle2 size={16} />
            </button>
          )}
        </div>
      </section>

      <div className="mt-4 rounded-xl border border-[#0B2C6B]/10 bg-[#071B3D] p-4 text-white">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">System Behavior</p>
        <p className="mt-2 text-xs leading-5 text-white/70">
          Pengamatan membuat event <strong>EvidenceCreated</strong> → memicu <strong>CapabilityRecalculated</strong> →
          skor kemampuan peserta diperbarui. Pengamatan fasilitator memiliki bobot <strong>0.85</strong> dalam perhitungan kemampuan.
        </p>
      </div>
    </div>
  );
}
