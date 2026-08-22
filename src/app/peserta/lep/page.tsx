"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  MessageSquareText,
  Mic,
  Send,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PesertaAuthGate } from "@/components/peserta-auth-gate";
import { TbosProgramSelector } from "@/components/tbos-program-selector";
import { supabase } from "@/lib/supabase";
import { EmptyState, LikertScaleRow, NoticeBanner } from "@/components/ui";

const QUESTIONS = [
  {
    key: "qMenyenangkan",
    label: "Program ini merupakan pengalaman yang menyenangkan & menambah wawasan",
  },
  {
    key: "qBermanfaat",
    label: "Program ini bermanfaat & sesuai dengan kebutuhan saya maupun organisasi saya",
  },
  {
    key: "qRekomendasi",
    label: "Saya merasa program ini layak untuk direkomendasikan",
  },
  {
    key: "qPraktik",
    label: "Saya sudah dan akan terus mempraktekkan apa yang telah saya pelajari",
  },
] as const;

type QuestionKey = (typeof QUESTIONS)[number]["key"];

interface LepSpeaker {
  id: string;
  program_id: string;
  name: string;
  sort_order: number;
}

const DEFAULT_QUESTIONS: Record<QuestionKey, number | null> = {
  qMenyenangkan: null,
  qBermanfaat: null,
  qRekomendasi: null,
  qPraktik: null,
};

export default function PesertaLepPage() {
  return (
    <PesertaAuthGate>
      <AppShell role="peserta" title="Evaluasi Program" eyebrow="Lembar Evaluasi Program">
        <PesertaLepContent />
      </AppShell>
    </PesertaAuthGate>
  );
}

export function PesertaLepContent({
  accessPath = "/login",
  lockedProgramId,
}: {
  accessPath?: string;
  lockedProgramId?: string;
} = {}) {
  const router = useRouter();
  const [programId, setProgramId] = useState(lockedProgramId || "");
  const [speakers, setSpeakers] = useState<LepSpeaker[]>([]);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submittedDate, setSubmittedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [questions, setQuestions] = useState<Record<QuestionKey, number | null>>(DEFAULT_QUESTIONS);
  const [speakerScores, setSpeakerScores] = useState<Record<string, number | null>>({});
  const [speakerComments, setSpeakerComments] = useState<Record<string, string>>({});
  const [halTerpenting, setHalTerpenting] = useState("");
  const [halMenarik, setHalMenarik] = useState("");
  const [saranProgram, setSaranProgram] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const loadEvaluation = useCallback(async () => {
    if (!programId) return;
    setLoading(true);
    setError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        router.replace(accessPath);
        return;
      }

      const [speakerRes, responseRes] = await Promise.all([
        fetch(`/api/lep/speakers?programId=${encodeURIComponent(programId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/lep/responses?programId=${encodeURIComponent(programId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const speakerJson = await speakerRes.json().catch(() => ({}));
      if (!speakerRes.ok || !speakerJson.success) throw new Error(speakerJson.error || "Gagal memuat pemateri.");
      setSpeakers(speakerJson.speakers || []);

      const responseJson = await responseRes.json().catch(() => ({}));
      if (!responseRes.ok || !responseJson.success) throw new Error(responseJson.error || "Gagal memeriksa evaluasi.");

      if (responseJson.response) {
        setAlreadySubmitted(true);
        setSubmittedDate(responseJson.response.submitted_at || null);
      } else {
        setAlreadySubmitted(false);
        const initial = { ...DEFAULT_QUESTIONS };
        setQuestions(initial);
        setSpeakerScores(Object.fromEntries((speakerJson.speakers || []).map((s: LepSpeaker) => [s.id, null])));
        setSpeakerComments({});
        setHalTerpenting("");
        setHalMenarik("");
        setSaranProgram("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat evaluasi program.");
    } finally {
      setLoading(false);
    }
  }, [accessPath, programId, router]);

  useEffect(() => {
    if (!programId) return;
    void Promise.resolve().then(loadEvaluation);
  }, [programId, loadEvaluation]);

  const handleQuestionChange = (key: QuestionKey, value: number) => {
    setQuestions((prev) => ({ ...prev, [key]: value }));
  };

  const handleSpeakerScore = (speakerId: string, value: number) => {
    setSpeakerScores((prev) => ({ ...prev, [speakerId]: value }));
  };

  const isFormComplete =
    QUESTIONS.every((q) => questions[q.key] !== null) &&
    speakers.every((s) => speakerScores[s.id] !== null) &&
    halTerpenting.trim().length > 0 &&
    halMenarik.trim().length > 0;
  const commonComplete = QUESTIONS.every((q) => questions[q.key] !== null);
  const speakersComplete = speakers.every((s) => speakerScores[s.id] !== null);
  const currentSection = !commonComplete ? 1 : !speakersComplete ? 2 : 3;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isFormComplete) {
      setSubmitError("Semua pertanyaan bertanda wajib harus diisi sebelum mengirim evaluasi.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        router.replace(accessPath);
        return;
      }

      const response = await fetch("/api/lep/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          programId,
          qMenyenangkan: questions.qMenyenangkan,
          qBermanfaat: questions.qBermanfaat,
          qRekomendasi: questions.qRekomendasi,
          qPraktik: questions.qPraktik,
          halTerpenting: halTerpenting.trim(),
          halMenarik: halMenarik.trim(),
          saranProgram: saranProgram.trim() || undefined,
          speakerRatings: speakers.map((speaker) => ({
            speakerId: speaker.id,
            score: speakerScores[speaker.id]!,
            comment: speakerComments[speaker.id]?.trim() || undefined,
          })),
        }),
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json.success) {
        if (response.status === 409) {
          setAlreadySubmitted(true);
        }
        throw new Error(json.error || "Gagal mengirim evaluasi.");
      }

      setAlreadySubmitted(true);
      setSubmittedDate(new Date().toISOString());
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Gagal mengirim evaluasi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {lockedProgramId ? (
        <NoticeBanner>
          Evaluasi ini otomatis terhubung ke program Anda dan hanya dapat dikirim satu kali.
        </NoticeBanner>
      ) : (
        <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-4 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
          <TbosProgramSelector value={programId} onChange={setProgramId} moduleKey="lep" />
          <p className="mt-2 text-xs leading-5 text-[#4A4C54]/60">
            Pilih program pelatihan yang ingin Anda evaluasi. Evaluasi hanya dapat diisi satu kali per program.
          </p>
        </section>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">{error}</p>
            <button type="button" onClick={() => void loadEvaluation()} className="mt-2 text-xs font-semibold underline">
              Coba lagi
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center rounded-xl border border-[#0B2C6B]/10 bg-white py-20 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]" role="status" aria-live="polite">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-[#0B2C6B]" aria-hidden="true" />
          <span className="text-sm font-semibold text-[#0B2C6B]">Memuat evaluasi...</span>
        </div>
      )}

      {!loading && !error && !programId && (
        <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-7 text-center shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
          <ClipboardCheck className="mx-auto h-10 w-10 text-[#0B2C6B]/25" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-[#0B2C6B]">Pilih program untuk mulai mengisi evaluasi</p>
          <p className="mt-1 text-xs text-[#4A4C54]/60">Anda dapat mengevaluasi program yang sudah berjalan.</p>
        </section>
      )}

      {/* Already submitted */}
      {!loading && !error && programId && alreadySubmitted && (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-7 text-center shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-[#0B2C6B]">Terima kasih atas evaluasi Anda!</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#4A4C54]">
            Anda sudah mengisi evaluasi untuk program ini. Tanggapan Anda sangat berharga untuk
            peningkatan kualitas program di masa mendatang.
          </p>
          {submittedDate && (
            <p className="mt-3 text-xs font-medium text-[#4A4C54]/60">
              Dikirim pada {new Date(submittedDate).toLocaleString("id-ID")}
            </p>
          )}
        </section>
      )}

      {/* Evaluation form */}
      {!loading && !error && programId && !alreadySubmitted && (
        <form onSubmit={handleSubmit} className="space-y-5 pb-28">
          {submitError && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>{submitError}</p>
            </div>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="Progres evaluasi">
            <div className="flex items-center justify-between gap-3 text-xs"><span className="font-bold text-slate-900">Bagian {currentSection} dari 3</span><span className="text-slate-500">{["Penilaian Umum", "Penilaian Pemateri", "Tanggapan Terbuka"][currentSection - 1]}</span></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${(currentSection / 3) * 100}%` }} /></div>
          </section>

          {/* Common questions */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-[#0B2C6B]/10 bg-[#F8F9FC] px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B2C6B] text-[#F3CE7A]">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-[#0B2C6B]">Penilaian Umum</h2>
                <p className="text-xs text-[#4A4C54]/60">Skala 1 (Sangat Tidak Setuju) sampai 4 (Sangat Setuju)</p>
              </div>
            </div>
            <div className="divide-y divide-[#0B2C6B]/[0.06]">
              {QUESTIONS.map((question, index) => (
                <div key={question.key} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#0B2C6B]/[0.06] text-xs font-bold text-[#0B2C6B]">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-5 text-[#0B2C6B]">
                        {question.label}
                        <span className="ml-1 text-red-500">*</span>
                      </p>
                      <LikertScaleRow
                        name={question.label}
                        value={questions[question.key]}
                        onChange={(value) => handleQuestionChange(question.key, value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Speaker ratings */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-[#0B2C6B]/10 bg-[#F8F9FC] px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B2C6B] text-[#F3CE7A]">
                <Mic className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-[#0B2C6B]">Penilaian Pemateri</h2>
                <p className="text-xs text-[#4A4C54]/60">Seberapa baik pemateri membawakan topik dengan efektif & menarik</p>
              </div>
            </div>
            {speakers.length === 0 ? (
              <EmptyState icon={Mic} title="Belum ada pemateri untuk program ini" description="Anda tetap dapat mengirim evaluasi umum." />
            ) : (
              <div className="divide-y divide-[#0B2C6B]/[0.06]">
                {speakers.map((speaker) => (
                  <div key={speaker.id} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D9A441]/[0.12] text-xs font-bold text-[#9A6817]">
                        {String(speaker.sort_order + 1)}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium leading-5 text-[#0B2C6B]">
                          {speaker.name}
                          <span className="ml-1 text-red-500">*</span>
                        </p>
                        <LikertScaleRow
                          name={`Penilaian ${speaker.name}`}
                          value={speakerScores[speaker.id] ?? null}
                          onChange={(value) => handleSpeakerScore(speaker.id, value)}
                        />
                        <div className="mt-3">
                          <label htmlFor={`speaker-comment-${speaker.id}`} className="mb-1 block text-xs font-semibold text-[#4A4C54]">
                            Saran / masukan untuk pemateri (opsional)
                          </label>
                          <textarea
                            id={`speaker-comment-${speaker.id}`}
                            value={speakerComments[speaker.id] || ""}
                            onChange={(event) =>
                              setSpeakerComments((prev) => ({ ...prev, [speaker.id]: event.target.value }))
                            }
                            rows={2}
                            maxLength={500}
                            placeholder="Tuliskan saran atau masukan..."
                            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-900 focus:ring-4 focus:ring-blue-900/10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Open text */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-[#0B2C6B]/10 bg-[#F8F9FC] px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B2C6B] text-[#F3CE7A]">
                <MessageSquareText className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-[#0B2C6B]">Tanggapan Terbuka</h2>
                <p className="text-xs text-[#4A4C54]/60">Bagikan pengalaman Anda selama program berlangsung</p>
              </div>
            </div>
            <div className="space-y-4 px-5 py-5">
              <OpenTextField
                id="hal-terpenting"
                label="Hal terpenting yang Anda dapatkan dari program ini"
                required
                value={halTerpenting}
                onChange={setHalTerpenting}
                placeholder="Tuliskan hal paling berkesan dan bermakna bagi Anda..."
              />
              <OpenTextField
                id="hal-menarik"
                label="Hal yang paling menarik dalam program ini"
                required
                value={halMenarik}
                onChange={setHalMenarik}
                placeholder="Tuliskan bagian program yang paling menarik..."
              />
              <OpenTextField
                id="saran-program"
                label="Saran untuk program ini"
                value={saranProgram}
                onChange={setSaranProgram}
                placeholder="Saran perbaikan untuk program (opsional)..."
              />
            </div>
          </section>

          {/* Legend */}
          <div className={`fixed inset-x-0 bottom-0 z-30 flex flex-col gap-3 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-12px_32px_rgba(15,23,42,0.10)] backdrop-blur sm:flex-row sm:items-center sm:justify-between ${lockedProgramId ? "lg:left-0" : "lg:left-72"}`}>
            <div className="flex items-start gap-3">
              <UsersRound className="mt-0.5 h-4 w-4 shrink-0 text-[#F3CE7A]" aria-hidden="true" />
              <p className="text-xs leading-5 text-slate-600">
                Evaluasi bersifat anonim dari sisi pengolahan agregat dan hanya dikirim satu kali.
                Anda tidak dapat mengubah jawaban setelah dikirim.
              </p>
            </div>
            <button
              type="submit"
              disabled={submitting || !isFormComplete}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 text-sm font-bold text-slate-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
              {submitting ? "Mengirim..." : "Kirim Evaluasi"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function OpenTextField({
  id,
  label,
  required = false,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-[#0B2C6B]">
        {label}
        {required && <span className="text-red-500">*</span>}
        {!required && <span className="text-[10px] font-medium text-[#4A4C54]/50">(opsional)</span>}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        maxLength={1000}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-900 focus:ring-4 focus:ring-blue-900/10"
      />
    </div>
  );
}
