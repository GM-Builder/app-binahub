"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, Wifi, WifiOff, ChevronRight } from "lucide-react";
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

// Level color mapping for visual feedback
const LEVEL_COLORS: Record<number, { bg: string; border: string; text: string }> = {
  1: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700" },
  2: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
  3: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700" },
  4: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
  5: { bg: "bg-green-50", border: "border-green-300", text: "text-green-800" },
};

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

  // Monitor Network Status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    setQueuedCount(getQueuedObservations().length);

    const handleOnline = async () => {
      setIsOnline(true);
      const { data } = await supabase.auth.getSession();
      if (data.session?.user.id) {
        await flushQueuedObservations(data.session.user.id);
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
      setError("Gagal memuat data.");
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
      queueObservation(payload);
      clearDraft(selectedTeam.id, selectedMission.id);
      setQueuedCount(getQueuedObservations().length);
      setStep("done");
    }
  };

  const resetForm = () => {
    setStep("select");
    setSelectedMission(null);
    setSelectedTeam(null);
    setScores({});
    setNotes("");
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-3 border-[#0B2C6B]/20 border-t-[#0B2C6B] animate-spin" />
          <p className="text-sm text-slate-500">Memuat...</p>
        </div>
      </div>
    );
  }

  // Success state
  if (step === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl max-w-sm w-full overflow-hidden"
        >
          <div className="bg-gradient-to-br from-[#0B2C6B] to-[#1a3a7a] p-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Berhasil!</h1>
            <p className="text-white/70 text-sm mt-1">Observasi tersimpan</p>
          </div>
          <div className="p-6">
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-[#0B2C6B]">{selectedTeam?.name}</span>
                {" • "}
                <span className="text-slate-500">{selectedMission?.name}</span>
              </p>
              {!isOnline && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <WifiOff className="w-3 h-3" /> Akan di-sync saat online
                </p>
              )}
            </div>
            <div className="space-y-3">
              <button
                onClick={resetForm}
                className="w-full h-12 rounded-xl bg-[#0B2C6B] text-white font-semibold text-sm hover:bg-[#071B3D] transition-colors"
              >
                Observasi Baru
              </button>
              <button
                onClick={() => router.push("/fasilitator/tbos/observations")}
                className="w-full h-12 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors"
              >
                Lihat Riwayat
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const canProceed = selectedMission && selectedTeam;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Compact Header */}
      <header className="bg-white sticky top-0 z-20 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {step === "observe" && (
                <button
                  onClick={() => setStep("select")}
                  className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-600" />
                </button>
              )}
              <div>
                <h1 className="text-base font-bold text-[#0B2C6B]">T-BOS</h1>
                <p className="text-xs text-slate-500">
                  {step === "select" ? "Pilih tim & mission" : selectedMission?.name}
                </p>
              </div>
            </div>
            {/* Status Badge */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              isOnline ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
            }`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {queuedCount > 0 && <span>{queuedCount}</span>}
            </div>
          </div>
        </div>

        {/* Progress Bar for observe step */}
        {step === "observe" && selectedMission && (
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span>{selectedTeam?.name}</span>
              <span className="font-medium text-[#0B2C6B]">
                {Object.keys(scores).length}/{selectedMission.dimensions.length}
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0B2C6B] rounded-full transition-all duration-300"
                style={{ width: `${(Object.keys(scores).length / selectedMission.dimensions.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </header>

      <main className="p-4 pb-24">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Selection */}
          {step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Team Selection - Card Style */}
              <section>
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 px-1">
                  Pilih Tim
                </h2>
                <div className="space-y-2">
                  {teams.length === 0 && (
                    <div className="bg-white rounded-2xl p-6 text-center">
                      <p className="text-sm text-slate-500">Belum ada tim ditugaskan</p>
                      <p className="text-xs text-slate-400 mt-1">Hubungi admin untuk assignment</p>
                    </div>
                  )}
                  {teams.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => setSelectedTeam(team)}
                      className={`w-full text-left p-4 rounded-2xl transition-all ${
                        selectedTeam?.id === team.id
                          ? "bg-[#0B2C6B] text-white shadow-lg shadow-[#0B2C6B]/25"
                          : "bg-white shadow-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-semibold ${selectedTeam?.id === team.id ? "text-white" : "text-slate-800"}`}>
                            {team.name}
                          </p>
                          <p className={`text-xs mt-0.5 ${selectedTeam?.id === team.id ? "text-white/70" : "text-slate-500"}`}>
                            {team.batch}
                          </p>
                        </div>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          selectedTeam?.id === team.id ? "bg-white/20" : "bg-slate-100"
                        }`}>
                          {selectedTeam?.id === team.id ? (
                            <Check className="w-4 h-4 text-white" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Mission Selection */}
              {selectedTeam && (
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 px-1">
                    Pilih Mission
                  </h2>
                  <div className="space-y-2">
                    {missions.map((mission) => (
                      <button
                        key={mission.id}
                        onClick={() => setSelectedMission(mission)}
                        className={`w-full text-left p-4 rounded-2xl transition-all ${
                          selectedMission?.id === mission.id
                            ? "bg-[#0B2C6B] text-white shadow-lg shadow-[#0B2C6B]/25"
                            : "bg-white shadow-sm"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold ${selectedMission?.id === mission.id ? "text-white" : "text-slate-800"}`}>
                              {mission.name}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {mission.dimensions.slice(0, 3).map((d) => (
                                <span
                                  key={d.id}
                                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                                    selectedMission?.id === mission.id
                                      ? "bg-white/20 text-white/80"
                                      : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  {d.name}
                                </span>
                              ))}
                              {mission.dimensions.length > 3 && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                  selectedMission?.id === mission.id
                                    ? "bg-white/20 text-white/80"
                                    : "bg-slate-100 text-slate-500"
                                }`}>
                                  +{mission.dimensions.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ml-3 ${
                            selectedMission?.id === mission.id ? "bg-white/20" : "bg-slate-100"
                          }`}>
                            {selectedMission?.id === mission.id ? (
                              <Check className="w-4 h-4 text-white" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.section>
              )}

              {/* Start Button */}
              {canProceed && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent"
                >
                  <button
                    onClick={() => setStep("observe")}
                    className="w-full h-14 rounded-2xl bg-[#0B2C6B] text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#0B2C6B]/25"
                  >
                    Mulai Observasi
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 2: Observation */}
          {step === "observe" && selectedMission && selectedTeam && (
            <motion.div
              key="observe"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Team Members - Compact */}
              {selectedTeam.members && selectedTeam.members.length > 0 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <p className="text-xs text-slate-500 mb-2">Anggota tim:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTeam.members.map((m, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600"
                      >
                        {m.member_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Dimension Cards */}
              {selectedMission.dimensions.map((dim, idx) => {
                const selectedLevel = scores[dim.id];
                return (
                  <div key={dim.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    {/* Dimension Header */}
                    <div className="p-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0B2C6B]/10 text-[#0B2C6B] text-sm font-bold flex items-center justify-center">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-800">{dim.name}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{dim.question}</p>
                        </div>
                        {selectedLevel && (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${LEVEL_COLORS[selectedLevel].bg}`}>
                            <span className={`text-sm font-bold ${LEVEL_COLORS[selectedLevel].text}`}>
                              {selectedLevel}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Level Options - Horizontal Scroll on Mobile */}
                    <div className="p-3">
                      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                        {dim.levels.map((level) => {
                          const isSelected = scores[dim.id] === level.level_value;
                          const colors = LEVEL_COLORS[level.level_value];
                          return (
                            <button
                              key={level.level_value}
                              onClick={() => handleScoreSelect(dim.id, level.level_value as LevelValue)}
                              className={`flex-shrink-0 w-[72px] p-3 rounded-xl border-2 transition-all ${
                                isSelected
                                  ? `${colors.bg} ${colors.border} border-current`
                                  : "border-slate-100 bg-white"
                              }`}
                            >
                              <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-bold mb-1 ${
                                isSelected ? colors.text : "bg-slate-100 text-slate-500"
                              }`}>
                                {level.level_value}
                              </div>
                              <p className={`text-[10px] font-medium text-center leading-tight ${
                                isSelected ? colors.text : "text-slate-500"
                              }`}>
                                {level.level_label}
                              </p>
                            </button>
                          );
                        })}
                      </div>

                      {/* Selected Level Description */}
                      {selectedLevel && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-3 pt-3 border-t border-slate-100"
                        >
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {dim.levels.find(l => l.level_value === selectedLevel)?.description}
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Notes - Simple */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Catatan singkat (opsional)..."
                  maxLength={50}
                  className="w-full text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              {/* Submit Button - Fixed at Bottom */}
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent">
                <button
                  onClick={handleSubmit}
                  disabled={!allDimensionsScored}
                  className={`w-full h-14 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all ${
                    allDimensionsScored
                      ? "bg-[#0B2C6B] text-white shadow-lg shadow-[#0B2C6B]/25"
                      : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {allDimensionsScored ? (
                    <>
                      Simpan Observasi
                      <Check className="w-5 h-5" />
                    </>
                  ) : (
                    `${Object.keys(scores).length}/${selectedMission.dimensions.length} dimensi`
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Submitting */}
          {step === "submitting" && (
            <motion.div
              key="submitting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="w-12 h-12 rounded-full border-3 border-[#0B2C6B]/20 border-t-[#0B2C6B] animate-spin mb-4" />
              <p className="text-sm text-slate-500">Menyimpan...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
