"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, Wifi, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { FacilitatorAuthGate } from "@/components/facilitator-auth-gate";
import { supabase } from "@/lib/supabase";
import type { LevelValue } from "@/modules/tbos";
import {
  fetchMissions,
  fetchTeams,
  submitObservation,
  saveDraft,
  loadDraft,
  clearDraft,
  queueObservation,
  flushQueuedObservations,
  getQueuedObservations,
  TbosDbMission,
  TbosDbTeam,
} from "@/modules/tbos/api-client";

type Step = "select" | "observe" | "submitting" | "done";

export default function TbosObservationPage() {
  return (
    <FacilitatorAuthGate>
      <TbosObservationContent />
    </FacilitatorAuthGate>
  );
}

function TbosObservationContent() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("select");
  const [missions, setMissions] = useState<TbosDbMission[]>([]);
  const [teams, setTeams] = useState<TbosDbTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string>("");

  const [selectedMission, setSelectedMission] = useState<TbosDbMission | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<TbosDbTeam | null>(null);
  const [scores, setScores] = useState<Record<string, LevelValue>>({});
  const [notes, setNotes] = useState("");

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [queuedCount, setQueuedCount] = useState<number>(0);

  // Monitor Network Status & Queued Items
  useEffect(() => {
    setIsOnline(navigator.onLine);
    setQueuedCount(getQueuedObservations().length);

    const handleOnline = async () => {
      setIsOnline(true);
      const { data } = await supabase.auth.getSession();
      if (data.session?.user.id) {
        const synced = await flushQueuedObservations(data.session.user.id);
        setQueuedCount(getQueuedObservations().length);
      }
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const initData = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData.session?.user.id || "";
      setUserId(currentUserId);

      const [mList, tList] = await Promise.all([
        fetchMissions(currentUserId),
        fetchTeams(),
      ]);

      setMissions(mList);
      setTeams(tList);
    } catch {
      setError("Gagal memuat data. Menggunakan data lokal.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initData();
  }, [initData]);

  // Load draft when team and mission selected
  useEffect(() => {
    if (selectedTeam && selectedMission) {
      const draft = loadDraft(selectedTeam.id, selectedMission.id);
      if (draft) {
        setScores(draft.scores || {});
        setNotes(draft.notes || "");
      }
    }
  }, [selectedTeam, selectedMission]);

  // Auto-save draft on changes (ADR-006)
  const handleScoreSelect = (dimensionId: string, level: LevelValue) => {
    const updated = { ...scores, [dimensionId]: level };
    setScores(updated);
    if (selectedTeam && selectedMission) {
      saveDraft(selectedTeam.id, selectedMission.id, updated, notes);
    }
  };

  const handleNotesChange = (val: string) => {
    const sliced = val.slice(0, 50);
    setNotes(sliced);
    if (selectedTeam && selectedMission) {
      saveDraft(selectedTeam.id, selectedMission.id, scores, sliced);
    }
  };

  const handleSelectMission = (mission: TbosDbMission) => {
    setSelectedMission(mission);
    setScores({});
    setNotes("");
    if (selectedTeam) {
      setStep("observe");
    }
  };

  const handleSelectTeam = (team: TbosDbTeam) => {
    setSelectedTeam(team);
    if (selectedMission) {
      setStep("observe");
    }
  };

  const allDimensionsScored = selectedMission
    ? selectedMission.dimensions.every((d) => scores[d.id] !== undefined)
    : false;

  const handleSubmit = async () => {
    if (!selectedMission || !selectedTeam || !allDimensionsScored) return;

    setStep("submitting");

    const payload = {
      teamId: selectedTeam.id,
      missionId: selectedMission.id,
      profileId: userId,
      batch: selectedTeam.batch,
      notes,
      scores: selectedMission.dimensions.map((d) => ({
        dimensionId: d.id,
        levelValue: scores[d.id],
      })),
    };

    if (!navigator.onLine) {
      // Offline fallback: queue locally (ADR-006)
      queueObservation(payload);
      clearDraft(selectedTeam.id, selectedMission.id);
      setQueuedCount(getQueuedObservations().length);
      setStep("done");
      return;
    }

    const res = await submitObservation(payload);

    if (res.success) {
      setStep("done");
    } else {
      // Queue on failure
      queueObservation(payload);
      clearDraft(selectedTeam.id, selectedMission.id);
      setQueuedCount(getQueuedObservations().length);
      setStep("done");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0B2C6B]" />
          <p className="text-sm text-[#4A4C54]">Memuat data T-BOS...</p>
        </div>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-lg max-w-md w-full overflow-hidden"
        >
          <div className="bg-[#0B2C6B] p-8 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-[#D9A441]" />
            </div>
            <h1 className="text-xl font-bold text-white">Observasi Tersimpan</h1>
          </div>
          <div className="p-8 text-center">
            <p className="text-sm text-[#4A4C54] mb-6">
              Observasi untuk <strong className="text-[#0B2C6B]">{selectedTeam?.name}</strong> di mission{" "}
              <strong className="text-[#0B2C6B]">{selectedMission?.name}</strong> berhasil disimpan
              {!isOnline && " (tersimpan offline, akan di-sync saat online)"}.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setStep("select");
                  setSelectedMission(null);
                  setSelectedTeam(null);
                  setScores({});
                  setNotes("");
                }}
                className="w-full h-12 rounded-xl bg-[#0B2C6B] text-white font-medium text-sm hover:bg-[#071B3D] transition-colors"
              >
                Observasi Baru
              </button>
              <button
                onClick={() => router.push("/fasilitator/tbos/observations")}
                className="w-full h-12 rounded-xl border border-black/10 text-[#4A4C54] font-medium text-sm hover:bg-black/[0.02] transition-colors"
              >
                Lihat Riwayat Observasi
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Header */}
      <div className="bg-white border-b border-black/[0.06] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          {step === "observe" && (
            <button
              onClick={() => setStep("select")}
              className="p-2 -ml-2 rounded-lg hover:bg-black/[0.04] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#0B2C6B]" />
            </button>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-[#0B2C6B]">T-BOS Observasi</h1>
              {/* Online/Offline Status */}
              <span
                className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  isOnline ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                }`}
              >
                {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {isOnline ? "Online" : "Offline"}
                {queuedCount > 0 && ` (${queuedCount} pending)`}
              </span>
            </div>
            <p className="text-xs text-[#4A4C54]">
              {step === "select" && "Pilih mission dan tim"}
              {step === "observe" && `${selectedMission?.name} • ${selectedTeam?.name}`}
            </p>
          </div>
          {step === "observe" && selectedMission && (
            <div className="text-xs font-medium text-[#4A4C54]">
              {Object.keys(scores).length}/{selectedMission.dimensions.length} terisi
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Mission Selection */}
              <div>
                <h2 className="text-sm font-semibold text-[#0B2C6B] mb-3 uppercase tracking-wide">
                  Pilih Mission (Ditugaskan)
                </h2>
                <div className="space-y-2">
                  {missions.length === 0 && (
                    <p className="text-sm text-[#4A4C54] p-4 bg-white rounded-xl">
                      Belum ada mission ditugaskan ke Anda. Hubungi admin.
                    </p>
                  )}
                  {missions.map((mission) => (
                    <button
                      key={mission.id}
                      onClick={() => handleSelectMission(mission)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        selectedMission?.id === mission.id
                          ? "border-[#0B2C6B] bg-[#0B2C6B]/[0.03]"
                          : "border-transparent bg-white hover:border-[#0B2C6B]/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm text-[#0B2C6B]">{mission.name}</p>
                          <p className="text-xs text-[#4A4C54] mt-1">{mission.description}</p>
                          <div className="flex gap-1 mt-2">
                            {mission.dimensions.map((d) => (
                              <span
                                key={d.id}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-[#0B2C6B]/[0.06] text-[#0B2C6B]/60 font-medium"
                              >
                                {d.name}
                              </span>
                            ))}
                          </div>
                        </div>
                        {selectedMission?.id === mission.id && (
                          <Check className="w-5 h-5 text-[#0B2C6B] shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Team Selection */}
              {selectedMission && (
                <div>
                  <h2 className="text-sm font-semibold text-[#0B2C6B] mb-3 uppercase tracking-wide">
                    Pilih Tim
                  </h2>
                  <div className="space-y-2">
                    {teams.length === 0 && (
                      <p className="text-sm text-[#4A4C54] p-4 bg-white rounded-xl">
                        Belum ada tim terdaftar.
                      </p>
                    )}
                    {teams.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => handleSelectTeam(team)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          selectedTeam?.id === team.id
                            ? "border-[#0B2C6B] bg-[#0B2C6B]/[0.03]"
                            : "border-transparent bg-white hover:border-[#0B2C6B]/20"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-[#0B2C6B]">{team.name}</p>
                            <p className="text-xs text-[#4A4C54]">{team.batch}</p>
                            {team.members && team.members.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {team.members.map((m, i) => (
                                  <span
                                    key={i}
                                    className="text-[10px] px-2 py-0.5 rounded-full bg-[#0B2C6B]/[0.06] text-[#0B2C6B]/60"
                                  >
                                    {m.member_name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          {selectedTeam?.id === team.id && (
                            <Check className="w-5 h-5 text-[#0B2C6B] shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {step === "observe" && selectedMission && (
            <motion.div
              key="observe"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {selectedMission.dimensions.map((dim, idx) => (
                <div key={dim.id} className="bg-white rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-7 h-7 rounded-full bg-[#0B2C6B] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-[#0B2C6B]">{dim.name}</h3>
                      <p className="text-xs text-[#4A4C54] mt-0.5">{dim.question}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {dim.levels.map((level) => {
                      const isSelected = scores[dim.id] === level.level_value;
                      return (
                        <button
                          key={level.level_value}
                          onClick={() => handleScoreSelect(dim.id, level.level_value as LevelValue)}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            isSelected
                              ? "border-[#0B2C6B] bg-[#0B2C6B]/[0.04]"
                              : "border-black/[0.06] bg-white hover:border-[#0B2C6B]/30"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? "border-[#0B2C6B] bg-[#0B2C6B]"
                                  : "border-black/20"
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#0B2C6B]">
                                  {level.level_value}
                                </span>
                                <span className="text-sm font-medium text-[#0B2C6B]">
                                  {level.level_label}
                                </span>
                              </div>
                              <p className="text-xs text-[#4A4C54] mt-0.5">
                                {level.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Notes */}
              <div className="bg-white rounded-xl p-4">
                <label className="text-sm font-semibold text-[#0B2C6B] mb-2 block">
                  Catatan (opsional, maks. 50 karakter)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Contoh: Leader langsung membagi peran."
                  className="w-full px-3 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none focus:border-[#0B2C6B] focus:ring-1 focus:ring-[#0B2C6B]/20"
                />
                <p className="text-xs text-[#4A4C54]/60 mt-1 text-right">{notes.length}/50</p>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!allDimensionsScored}
                className="w-full h-14 rounded-xl bg-[#0B2C6B] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#071B3D] shadow-md shadow-[#0B2C6B]/20"
              >
                {allDimensionsScored ? (
                  <>
                    Submit Observasi
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  `Isi semua dimensi (${Object.keys(scores).length}/${selectedMission.dimensions.length})`
                )}
              </button>
            </motion.div>
          )}

          {step === "submitting" && (
            <motion.div
              key="submitting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <Loader2 className="w-8 h-8 animate-spin text-[#0B2C6B] mb-4" />
              <p className="text-sm text-[#4A4C54]">Menyimpan observasi...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
