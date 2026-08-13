"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ChartColumn,
  Check,
  ClipboardCheck,
  FileSpreadsheet,
  Loader2,
  MessageSquareText,
  Mic,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { AdminAuthGate } from "@/components/admin-auth-gate";
import { AppShell } from "@/components/app-shell";
import { StatCard, EmptyState, FilterTabs, ConfirmDialog } from "@/components/ui";
import { TbosProgramSelector } from "@/components/tbos-program-selector";
import { supabase } from "@/lib/supabase";
import { BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Bar, Cell } from "@/components/lazy-charts";

interface LepSpeaker {
  id: string;
  program_id: string;
  name: string;
  sort_order: number;
}

interface LepResults {
  speakers: Array<{ id: string; name: string; sort_order: number }>;
  questionAverages: {
    qMenyenangkan: number | null;
    qBermanfaat: number | null;
    qRekomendasi: number | null;
    qPraktik: number | null;
  };
  speakerAverages: Array<{
    speakerId: string;
    speakerName: string;
    averageScore: number | null;
    ratingCount: number;
    comments: string[];
  }>;
  openText: {
    halTerpenting: Array<{ id: number; text: string }>;
    halMenarik: Array<{ id: number; text: string }>;
    saranProgram: Array<{ id: number; text: string }>;
  };
  responseRate: {
    respondents: number;
    totalParticipants: number;
    percentage: number;
  };
  totalResponses: number;
}

type OpenTextTab = "halTerpenting" | "halMenarik" | "saranProgram";

const OPEN_TEXT_TABS: { key: OpenTextTab; label: string }[] = [
  { key: "halTerpenting", label: "Hal Terpenting" },
  { key: "halMenarik", label: "Hal Menarik" },
  { key: "saranProgram", label: "Saran Program" },
];

export default function AdminLepPage() {
  return (
    <AdminAuthGate>
      <AppShell role="admin" title="LEP — Evaluasi Program" eyebrow="Lembar Evaluasi Program">
        <AdminLepContent />
      </AppShell>
    </AdminAuthGate>
  );
}

function AdminLepContent() {
  const [programId, setProgramId] = useState("");
  const [speakers, setSpeakers] = useState<LepSpeaker[]>([]);
  const [results, setResults] = useState<LepResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Speaker CRUD state
  const [showSpeakerModal, setShowSpeakerModal] = useState(false);
  const [newSpeakerName, setNewSpeakerName] = useState("");
  const [editingSpeaker, setEditingSpeaker] = useState<LepSpeaker | null>(null);
  const [deletingSpeaker, setDeletingSpeaker] = useState<LepSpeaker | null>(null);
  const [mutationError, setMutationError] = useState("");
  const [mutating, setMutating] = useState(false);

  // Open text filter
  const [openTextTab, setOpenTextTab] = useState<OpenTextTab>("halTerpenting");

  const getToken = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error("Sesi tidak valid. Silakan login ulang.");
    return token;
  }, []);

  const loadData = useCallback(async () => {
    if (!programId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    const token = await getToken();
    try {
      const [speakerRes, resultRes] = await Promise.all([
        fetch(`/api/lep/speakers?programId=${encodeURIComponent(programId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/lep/results?programId=${encodeURIComponent(programId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const speakerJson = await speakerRes.json().catch(() => ({}));
      const resultJson = await resultRes.json().catch(() => ({}));

      if (!speakerRes.ok || !speakerJson.success) throw new Error(speakerJson.error || "Gagal memuat pemateri.");
      if (!resultRes.ok || !resultJson.success) throw new Error(resultJson.error || "Gagal memuat hasil evaluasi.");

      setSpeakers(speakerJson.speakers || []);
      setResults(resultJson);
    } finally {
      setLoading(false);
    }
  }, [programId, getToken]);

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, [loadData]);

  const questionChartData = useMemo(() => {
    const mapping: Array<{ key: keyof LepResults["questionAverages"]; label: string }> = [
      { key: "qMenyenangkan", label: "Menyenangkan" },
      { key: "qBermanfaat", label: "Bermanfaat" },
      { key: "qRekomendasi", label: "Rekomendasi" },
      { key: "qPraktik", label: "Praktik" },
    ];
    return mapping.map((item) => ({
      name: item.label,
      score: results?.questionAverages[item.key] ?? 0,
    }));
  }, [results]);

  const speakerChartData = useMemo(() => {
    return (results?.speakerAverages || []).map((s) => ({ name: s.speakerName, score: s.averageScore ?? 0 }));
  }, [results]);

  const overallAverage = useMemo(() => {
    const values = [
      results?.questionAverages.qMenyenangkan,
      results?.questionAverages.qBermanfaat,
      results?.questionAverages.qRekomendasi,
      results?.questionAverages.qPraktik,
    ].filter((v): v is number => v !== null && v !== undefined);
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  }, [results]);

  const handleAddSpeaker = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newSpeakerName.trim()) {
      setMutationError("Nama pemateri wajib diisi.");
      return;
    }
    setMutating(true);
    setMutationError("");
    const token = await getToken();
    try {
      const response = await fetch("/api/lep/speakers", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ programId, name: newSpeakerName.trim() }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json.success) throw new Error(json.error || "Gagal menambah pemateri.");
      setNewSpeakerName("");
      setShowSpeakerModal(false);
      await loadData();
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "Gagal menambah pemateri.");
    } finally {
      setMutating(false);
    }
  };

  const handleDeleteSpeaker = async () => {
    if (!deletingSpeaker) return;
    setMutating(true);
    setMutationError("");
    const token = await getToken();
    try {
      const response = await fetch(`/api/lep/speakers/${deletingSpeaker.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json.success) throw new Error(json.error || "Gagal menghapus pemateri.");
      setDeletingSpeaker(null);
      await loadData();
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "Gagal menghapus pemateri.");
    } finally {
      setMutating(false);
    }
  };

  const handleEditSpeaker = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingSpeaker) return;
    if (!newSpeakerName.trim()) {
      setMutationError("Nama pemateri wajib diisi.");
      return;
    }
    setMutating(true);
    setMutationError("");
    const token = await getToken();
    try {
      const response = await fetch(`/api/lep/speakers/${editingSpeaker.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newSpeakerName.trim() }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json.success) throw new Error(json.error || "Gagal mengubah nama pemateri.");
      setEditingSpeaker(null);
      await loadData();
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "Gagal mengubah nama pemateri.");
    } finally {
      setMutating(false);
    }
  };

  const handleExportCsv = async () => {
    if (!results) return;
    const rows: string[][] = [];
    rows.push(["LEP RESULTS - Export", "", ""]);
    rows.push(["Responden", String(results.responseRate.respondents), ""]);
    rows.push(["Total Peserta", String(results.responseRate.totalParticipants), ""]);
    rows.push(["", "", ""]);
    rows.push(["PERTANYAAN UMUM", "RATA-RATA", "SKALA"]);
    rows.push(["Program menyenangkan & menambah wawasan", String(results.questionAverages.qMenyenangkan ?? ""), "1-4"]);
    rows.push(["Program bermanfaat sesuai kebutuhan", String(results.questionAverages.qBermanfaat ?? ""), "1-4"]);
    rows.push(["Program layak direkomendasikan", String(results.questionAverages.qRekomendasi ?? ""), "1-4"]);
    rows.push(["Akan terus mempraktekkan pembelajaran", String(results.questionAverages.qPraktik ?? ""), "1-4"]);
    rows.push(["", "", ""]);
    rows.push(["PEMATERI", "RATA-RATA", "JUMLAH RESPONDEN"]);
    for (const s of results.speakerAverages) {
      rows.push([s.speakerName, s.averageScore?.toFixed(2) ?? "", String(s.ratingCount)]);
    }
    rows.push(["", "", ""]);
    rows.push(["HAL TERPENTING"]);
    for (const item of results.openText.halTerpenting) rows.push([`"${item.text.replace(/"/g, '""')}"`]);
    rows.push(["", "", ""]);
    rows.push(["HAL MENARIK"]);
    for (const item of results.openText.halMenarik) rows.push([`"${item.text.replace(/"/g, '""')}"`]);
    rows.push(["", "", ""]);
    rows.push(["SARAN PROGRAM"]);
    for (const item of results.openText.saranProgram) rows.push([`"${item.text.replace(/"/g, '""')}"`]);

    const csvContent = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `LEP_Results_${new Date().toISOString().split("T")[0]}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-[#0B2C6B]" aria-hidden="true" />
        <span className="sr-only">Memuat data LEP...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 rounded-xl border border-[#0B2C6B]/10 bg-white p-4 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B2C6B] text-[#F3CE7A]">
            <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Pilih Program</p>
            <p className="mt-0.5 text-xs text-[#4A4C54]/70">Kelola pemateri dan lihat hasil evaluasi per program.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TbosProgramSelector value={programId} onChange={setProgramId} />
          <button
            type="button"
            onClick={() => void loadData()}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#0B2C6B]/15 px-3 py-2 text-xs font-semibold text-[#0B2C6B] transition hover:bg-[#F5F7FA]"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Refresh
          </button>
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">{error}</p>
            <button type="button" onClick={() => void loadData()} className="mt-2 text-xs font-semibold underline">
              Coba lagi
            </button>
          </div>
        </div>
      )}

      {!programId ? (
        <section className="rounded-xl border border-[#0B2C6B]/10 bg-white">
          <EmptyState
            icon={ClipboardCheck}
            title="Pilih program terlebih dahulu"
            description="Data pemateri dan hasil evaluasi LEP ditampilkan per program."
          />
        </section>
      ) : (
        <>
          {/* Speakers management */}
          <section className="rounded-xl border border-[#0B2C6B]/10 bg-white shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
            <div className="flex items-center justify-between border-b border-[#0B2C6B]/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B2C6B]/[0.06] text-[#0B2C6B]">
                  <Mic className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-[#0B2C6B]">Daftar Pemateri</h2>
                  <p className="text-xs text-[#4A4C54]/60">Jumlah pemateri fleksibel sesuai kebutuhan program.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingSpeaker(null);
                  setNewSpeakerName("");
                  setMutationError("");
                  setShowSpeakerModal(true);
                }}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#0B2C6B] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#071B3D]"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Tambah Pemateri
              </button>
            </div>
            <div className="px-5 py-4">
              {speakers.length === 0 ? (
                <p className="text-xs text-[#4A4C54]/60 italic">Belum ada pemateri untuk program ini.</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {speakers.map((speaker) => (
                    <li key={speaker.id} className="inline-flex items-center gap-2 rounded-lg border border-[#0B2C6B]/10 bg-[#0B2C6B]/[0.03] px-3 py-2 text-sm">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D9A441]/[0.12] text-[11px] font-bold text-[#9A6817]">
                        {speaker.sort_order + 1}
                      </span>
                      <span className="font-semibold text-[#0B2C6B]">{speaker.name}</span>
                      <span className="inline-flex items-center rounded-full bg-[#0B2C6B]/[0.06] px-2.5 py-1 text-[10px] font-semibold text-[#0B2C6B]/70">
                        {results?.responseRate.respondents ?? 0} dievaluasi
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSpeaker(speaker);
                          setNewSpeakerName(speaker.name);
                          setMutationError("");
                          setShowSpeakerModal(true);
                        }}
                        title={`Ubah ${speaker.name}`}
                        aria-label={`Ubah pemateri ${speaker.name}`}
                        className="text-[#0B2C6B]/50 transition hover:text-[#0B2C6B]"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingSpeaker(speaker)}
                        title={`Hapus ${speaker.name}`}
                        aria-label={`Hapus pemateri ${speaker.name}`}
                        className="text-red-400 transition hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Response rate stats */}
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Responden" value={results?.responseRate.respondents ?? 0} detail="Jumlah jawaban masuk" icon={<UsersRound size={16} />} />
            <StatCard label="Total Peserta" value={results?.responseRate.totalParticipants ?? 0} detail="Peserta terdaftar tim" icon={<UsersRound size={16} />} />
            <StatCard label="Response Rate" value={`${results?.responseRate.percentage ?? 0}%`} detail="Responden / total peserta" icon={<ClipboardCheck size={16} />} />
            <StatCard label="Rata-rata Umum" value={overallAverage !== null ? overallAverage.toFixed(2) : "-"} detail="Skala 1 sampai 4" icon={<ChartColumn size={16} />} />
          </section>

          {/* Question averages chart */}
          <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#0B2C6B]">Rata-rata Pertanyaan Umum</h2>
                <p className="text-xs text-[#4A4C54]/60">Skala 1 (Sangat Tidak Setuju) sampai 4 (Sangat Setuju).</p>
              </div>
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#0B2C6B]/15 px-3.5 py-2 text-xs font-semibold text-[#0B2C6B] transition hover:bg-[#F5F7FA]"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
                Export CSV
              </button>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={questionChartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(11,44,107,0.08)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#4A4C54" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 4]} tick={{ fontSize: 11, fill: "#4A4C54" }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "rgba(11,44,107,0.04)" }} />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                    {questionChartData.map((item, index) => (
                      <Cell key={index} fill={index === questionChartData.length - 1 ? "#D9A441" : "#0B2C6B"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Speaker averages */}
          <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
            <h2 className="text-sm font-bold text-[#0B2C6B]">Rata-rata Skor per Pemateri</h2>
            <p className="mb-4 mt-0.5 text-xs text-[#4A4C54]/60">Perbandingan penilaian antar pemateri beserta saran yang masuk.</p>
            {speakerChartData.length === 0 ? (
              <EmptyState icon={Mic} title="Belum ada pemateri untuk ditampilkan." />
            ) : (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={speakerChartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(11,44,107,0.08)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#4A4C54" }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 4]} tick={{ fontSize: 11, fill: "#4A4C54" }} axisLine={false} tickLine={false} />
<Tooltip cursor={{ fill: "rgba(11,44,107,0.04)" }} />
                      <Bar dataKey="score" radius={[6, 6, 0, 0]} fill="#0B2C6B" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {(results?.speakerAverages || []).map((speaker) => (
                    <div key={speaker.speakerId} className="rounded-xl border border-[#0B2C6B]/10 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[#0B2C6B]">{speaker.speakerName}</p>
                        <span className="rounded-lg bg-[#0B2C6B]/[0.06] px-2 py-1 text-sm font-bold text-[#0B2C6B]">
                          {speaker.averageScore !== null ? speaker.averageScore.toFixed(2) : "-"}
                        </span>
                      </div>
                      {speaker.comments.length > 0 ? (
                        <ul className="mt-2 space-y-1.5">
                          {speaker.comments.map((comment, index) => (
                            <li key={index} className="flex items-start gap-1.5 text-xs leading-5 text-[#4A4C54]">
                              <MessageSquareText className="mt-0.5 h-3 w-3 shrink-0 text-[#D9A441]" aria-hidden="true" />
                              <span>{comment}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-xs text-[#4A4C54]/50 italic">Belum ada saran untuk pemateri ini.</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Open text answers */}
          <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
            <h2 className="text-sm font-bold text-[#0B2C6B]">Jawaban Terbuka</h2>
            <p className="mt-0.5 text-xs text-[#4A4C54]/60">
              Jawaban mentah peserta — kartu referensi berikutnya tidak menggunakan ringkasan otomatis.
            </p>
            <div className="mt-4">
              <FilterTabs tabs={OPEN_TEXT_TABS} active={openTextTab} onChange={(key) => setOpenTextTab(key as OpenTextTab)} />
            </div>
            <div className="mt-4 space-y-3">
              {(results?.openText[openTextTab] || []).length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-center text-xs text-[#4A4C54]/50">
                  Belum ada jawaban untuk kategori ini.
                </p>
              ) : (
                (results?.openText[openTextTab] || []).map((item) => (
                  <blockquote key={item.id} className="rounded-xl border border-[#0B2C6B]/10 bg-[#F8F9FC] p-4">
                    <p className="text-sm leading-6 text-[#4A4C54]">“{item.text}”</p>
                  </blockquote>
                ))
              )}
            </div>
          </section>
        </>
      )}

      {/* Add / edit speaker modal */}
      {showSpeakerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="add-speaker-title">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
              <h2 id="add-speaker-title" className="font-bold text-[#0B2C6B]">
                {editingSpeaker ? "Ubah Pemateri" : "Tambah Pemateri"}
              </h2>
              <button type="button" onClick={() => setShowSpeakerModal(false)} aria-label="Tutup" className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-slate-100">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={editingSpeaker ? handleEditSpeaker : handleAddSpeaker} className="space-y-4 p-5">
              {mutationError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{mutationError}</p>}
              <div>
                <label htmlFor="lep-speaker-name" className="mb-1.5 block text-xs font-semibold text-[#0B2C6B]">
                  Nama Pemateri
                </label>
                <input
                  id="lep-speaker-name"
                  type="text"
                  value={newSpeakerName}
                  onChange={(event) => setNewSpeakerName(event.target.value)}
                  placeholder="Contoh: Bpk. Bilal"
                  maxLength={100}
                  autoFocus
                  className="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#0B2C6B]"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowSpeakerModal(false)} className="min-h-11 flex-1 rounded-xl border border-slate-200 text-sm font-semibold">
                  Batal
                </button>
                <button type="submit" disabled={mutating || !newSpeakerName.trim()} className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0B2C6B] text-sm font-semibold text-white disabled:opacity-50">
                  {mutating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
                  {editingSpeaker ? "Simpan Perubahan" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deletingSpeaker !== null}
        onClose={() => setDeletingSpeaker(null)}
        onConfirm={handleDeleteSpeaker}
        title="Hapus pemateri?"
        description={deletingSpeaker ? `Pemateri "${deletingSpeaker.name}" beserta seluruh rating yang masuk akan dihapus.` : undefined}
        confirmLabel={mutating ? "Menghapus..." : "Hapus"}
        cancelLabel="Batal"
        variant="danger"
      />
    </div>
  );
}
