"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowLeft, Lock, Unlock, Edit3, Save, X, History, Clock, Check } from "lucide-react";
import { FacilitatorAuthGate } from "@/components/facilitator-auth-gate";
import type { LevelValue } from "@/modules/tbos";
import { LEVEL_LABELS } from "@/modules/tbos";

interface ObservationScore {
  dimensionId: string;
  dimensionCode: string;
  dimensionName: string;
  levelValue: number;
}

interface Observation {
  id: string;
  teamId: string;
  teamName: string;
  missionId: string;
  missionCode: string;
  missionName: string;
  profileId: string;
  facilitatorName: string;
  batch: string;
  observedAt: string;
  submittedAt: string;
  status: "draft" | "submitted" | "locked";
  notes: string | null;
  lockedAt: string | null;
  lockedBy: string | null;
  revisionDeadline: string | null;
  canEdit: boolean;
  scores: ObservationScore[];
}

interface AuditEntry {
  id: string;
  actorId: string;
  actorRole: string;
  actorName: string;
  action: string;
  previousStatus: string | null;
  newStatus: string | null;
  changes: any;
  createdAt: string;
}

interface ObservationDetail extends Observation {
  auditLog: AuditEntry[];
  dimensions: {
    id: string;
    code: string;
    name: string;
    levels: { level_value: number; level_label: string; description: string }[];
  }[];
}

export default function TbosObservationsListPage() {
  return (
    <FacilitatorAuthGate>
      <TbosObservationsContent />
    </FacilitatorAuthGate>
  );
}

function TbosObservationsContent() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchObservations = useCallback(async () => {
    try {
      const res = await fetch("/api/tbos/observations");
      const data = await res.json();
      if (data.success) {
        setObservations(data.observations);
      } else {
        setError(data.error || "Gagal memuat observasi.");
      }
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchObservations();
  }, [fetchObservations]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#0B2C6B]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (observations.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-[#4A4C54]">Belum ada observasi.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#0B2C6B]">Riwayat Observasi</h2>
        <span className="text-xs text-[#4A4C54]">{observations.length} observasi</span>
      </div>

      <div className="space-y-2">
        {observations.map((obs) => (
          <button
            key={obs.id}
            onClick={() => setSelectedId(obs.id)}
            className="w-full text-left bg-white rounded-xl p-4 border border-black/[0.04] hover:border-[#0B2C6B]/20 transition-colors"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#0B2C6B] truncate">{obs.teamName}</h3>
                  <StatusBadge status={obs.status} />
                </div>
                <p className="text-xs text-[#4A4C54] mt-1">
                  {obs.missionName} • {obs.batch}
                </p>
                <p className="text-[10px] text-[#4A4C54]/60 mt-1">
                  {new Date(obs.submittedAt).toLocaleString("id-ID", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-[#4A4C54]">{obs.scores.length} dimensi</p>
                {obs.canEdit && (
                  <span className="text-[10px] text-green-600 font-medium">Bisa edit</span>
                )}
                {obs.status === "locked" && (
                  <span className="text-[10px] text-red-600 font-medium flex items-center gap-0.5 justify-end">
                    <Lock className="w-3 h-3" /> Terkunci
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {selectedId && (
          <ObservationDetailPanel
            observationId={selectedId}
            onClose={() => setSelectedId(null)}
            onUpdated={fetchObservations}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    draft: { label: "Draft", color: "bg-gray-100 text-gray-600" },
    submitted: { label: "Submitted", color: "bg-blue-100 text-blue-700" },
    locked: { label: "Locked", color: "bg-red-100 text-red-700" },
  };
  const c = config[status] || config.submitted;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${c.color}`}>
      {c.label}
    </span>
  );
}

function ObservationDetailPanel({
  observationId,
  onClose,
  onUpdated,
}: {
  observationId: string;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [detail, setDetail] = useState<ObservationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedScores, setEditedScores] = useState<Record<string, number>>({});
  const [editedNotes, setEditedNotes] = useState("");
  const [actionError, setActionError] = useState("");

  const fetchDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/tbos/observations/${observationId}`);
      const data = await res.json();
      if (data.success) {
        const obs = data.observation;
        setDetail(obs);
        setEditedNotes(obs.notes || "");
        const scoreMap: Record<string, number> = {};
        for (const s of obs.scores || []) {
          scoreMap[s.dimensionId] = s.levelValue;
        }
        setEditedScores(scoreMap);
      }
    } catch {
      setActionError("Gagal memuat detail.");
    } finally {
      setLoading(false);
    }
  }, [observationId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleSave = async () => {
    setSaving(true);
    setActionError("");
    try {
      const scores = Object.entries(editedScores).map(([dimensionId, levelValue]) => ({
        dimensionId,
        levelValue,
      }));
      const res = await fetch(`/api/tbos/observations/${observationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "edit",
          notes: editedNotes,
          scores,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditing(false);
        fetchDetail();
        onUpdated();
      } else {
        setActionError(data.error || "Gagal menyimpan.");
      }
    } catch {
      setActionError("Gagal terhubung ke server.");
    } finally {
      setSaving(false);
    }
  };

  const handleLockUnlock = async (action: "lock" | "unlock") => {
    setActionError("");
    try {
      const res = await fetch(`/api/tbos/observations/${observationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        fetchDetail();
        onUpdated();
      } else {
        setActionError(data.error || "Gagal.");
      }
    } catch {
      setActionError("Gagal terhubung ke server.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-black/[0.06] px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-1 -ml-1 rounded hover:bg-black/[0.04]">
              <X className="w-5 h-5 text-[#4A4C54]" />
            </button>
            <div>
              <h2 className="text-sm font-bold text-[#0B2C6B]">Detail Observasi</h2>
              {detail && (
                <p className="text-xs text-[#4A4C54]">
                  {detail.teamName} • {detail.missionName}
                </p>
              )}
            </div>
          </div>
          {detail && (
            <div className="flex items-center gap-2">
              <StatusBadge status={detail.status} />
              {detail.status === "locked" ? (
                <button
                  onClick={() => handleLockUnlock("unlock")}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100"
                >
                  <Unlock className="w-3.5 h-3.5" /> Unlock
                </button>
              ) : (
                <button
                  onClick={() => handleLockUnlock("lock")}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100"
                >
                  <Lock className="w-3.5 h-3.5" /> Lock
                </button>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#0B2C6B]" />
            </div>
          )}

          {actionError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {actionError}
            </div>
          )}

          {detail && !loading && (
            <div className="space-y-5">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[#4A4C54]">Fasilitator</p>
                  <p className="font-medium text-[#0B2C6B]">{detail.facilitatorName}</p>
                </div>
                <div>
                  <p className="text-[#4A4C54]">Batch</p>
                  <p className="font-medium text-[#0B2C6B]">{detail.batch}</p>
                </div>
                <div>
                  <p className="text-[#4A4C54]">Tanggal Observasi</p>
                  <p className="font-medium text-[#0B2C6B]">
                    {new Date(detail.observedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-[#4A4C54]">Waktu Submit</p>
                  <p className="font-medium text-[#0B2C6B]">
                    {new Date(detail.submittedAt).toLocaleString("id-ID", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {detail.revisionDeadline && detail.status === "submitted" && (
                  <div className="col-span-2">
                    <p className="text-[#4A4C54] flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Revision Window
                    </p>
                    <p className={`font-medium ${detail.canEdit ? "text-green-600" : "text-red-600"}`}>
                      {detail.canEdit ? "Aktif hingga" : "Berakhir"}:{" "}
                      {new Date(detail.revisionDeadline).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Scores */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#0B2C6B]">Skor Observasi</h3>
                  {detail.canEdit && !editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-black/[0.08] text-[#4A4C54] text-xs font-medium hover:border-[#0B2C6B]/30"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}
                  {editing && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditing(false)}
                        className="px-3 py-1.5 rounded-lg text-xs text-[#4A4C54] hover:bg-black/[0.04]"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0B2C6B] text-white text-xs font-medium hover:bg-[#071B3D] disabled:opacity-40"
                      >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Simpan
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {detail.scores.map((score) => {
                    const dim = detail.dimensions?.find((d) => d.id === score.dimensionId);
                    const currentLevel = editing
                      ? editedScores[score.dimensionId] || score.levelValue
                      : score.levelValue;
                    return (
                      <div key={score.dimensionId} className="p-3 rounded-lg bg-[#F5F7FA]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-[#0B2C6B]">
                            {score.dimensionName}
                          </span>
                          <span className="text-xs font-bold text-[#0B2C6B]">
                            {currentLevel}/5 — {LEVEL_LABELS[currentLevel as LevelValue] || ""}
                          </span>
                        </div>
                        {editing && dim ? (
                          <div className="flex gap-1">
                            {dim.levels.map((level) => (
                              <button
                                key={level.level_value}
                                onClick={() =>
                                  setEditedScores((prev) => ({
                                    ...prev,
                                    [score.dimensionId]: level.level_value,
                                  }))
                                }
                                className={`flex-1 py-2 rounded text-xs font-medium transition-colors ${
                                  currentLevel === level.level_value
                                    ? "bg-[#0B2C6B] text-white"
                                    : "bg-white text-[#4A4C54] border border-black/[0.06] hover:border-[#0B2C6B]/30"
                                }`}
                                title={level.description}
                              >
                                {level.level_value}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[#4A4C54]">
                            {dim?.levels.find((l) => l.level_value === currentLevel)?.description || ""}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-sm font-semibold text-[#0B2C6B] mb-2">Catatan</h3>
                {editing ? (
                  <input
                    type="text"
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value.slice(0, 50))}
                    maxLength={50}
                    className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:border-[#0B2C6B]"
                    placeholder="Catatan opsional (maks 50 karakter)"
                  />
                ) : (
                  <p className="text-sm text-[#4A4C54] p-3 rounded-lg bg-[#F5F7FA]">
                    {detail.notes || "Tidak ada catatan."}
                  </p>
                )}
              </div>

              {/* Audit Log */}
              {detail.auditLog && detail.auditLog.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[#0B2C6B] mb-3 flex items-center gap-2">
                    <History className="w-4 h-4" /> Audit Log
                  </h3>
                  <div className="space-y-2">
                    {detail.auditLog.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-start gap-3 p-2 rounded-lg border border-black/[0.04]"
                      >
                        <div className="w-6 h-6 rounded-full bg-[#0B2C6B]/[0.06] flex items-center justify-center shrink-0 mt-0.5">
                          <ActionIcon action={entry.action} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-[#0B2C6B] font-medium">
                            {actionLabel(entry.action)}
                            {entry.previousStatus && entry.newStatus
                              ? `: ${entry.previousStatus} → ${entry.newStatus}`
                              : ""}
                          </p>
                          <p className="text-[10px] text-[#4A4C54]">
                            {entry.actorName || "System"} •{" "}
                            {entry.actorRole} •{" "}
                            {new Date(entry.createdAt).toLocaleString("id-ID", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ActionIcon({ action }: { action: string }) {
  const icons: Record<string, React.ReactNode> = {
    create: <Check className="w-3 h-3 text-green-600" />,
    submit: <Check className="w-3 h-3 text-blue-600" />,
    edit: <Edit3 className="w-3 h-3 text-amber-600" />,
    lock: <Lock className="w-3 h-3 text-red-600" />,
    unlock: <Unlock className="w-3 h-3 text-green-600" />,
    delete: <X className="w-3 h-3 text-red-600" />,
  };
  return <>{icons[action] || <History className="w-3 h-3 text-gray-400" />}</>;
}

function actionLabel(action: string): string {
  const labels: Record<string, string> = {
    create: "Dibuat",
    submit: "Disubmit",
    edit: "Diedit",
    lock: "Dikunci",
    unlock: "Dibuka kunci",
    delete: "Dihapus",
  };
  return labels[action] || action;
}
