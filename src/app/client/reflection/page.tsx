"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Lightbulb, Target, Zap } from "lucide-react";
import { toast } from "sonner";
import { ClientAuthGate } from "@/components/client-auth-gate";
import { AppShell } from "@/components/app-shell";
import { useEngagements, submitReflection } from "@/hooks/use-transformation-data";
import { CAPABILITY_NAMES } from "@/lib/transformation-types";
import { ErrorBoundary } from "@/components/error-boundary";

const REFLECTION_PROMPTS = [
  "Apa situasi menarik yang kamu alami minggu ini?",
  "Apa tantangan terbesar yang kamu hadapi dan bagaimana kamu mengatasinya?",
  "Apa yang kamu pelajari dari pengalaman kerja terbaru?",
  "Bagaimana kamu menerapkan skill baru dalam pekerjaan?",
  "Apa momen di mana kamu merasa berkembang?",
];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
              i < current
                ? "bg-emerald-500 text-white"
                : i === current
                  ? "bg-[#0B2C6B] text-white"
                  : "bg-[#E6EAF0] text-[#4A4C54]/50"
            }`}
          >
            {i < current ? <CheckCircle2 size={14} /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`h-0.5 w-8 transition-colors ${i < current ? "bg-emerald-500" : "bg-[#E6EAF0]"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function ReflectionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const engagementId = searchParams.get("engagement") || "";
  const { engagements } = useEngagements();

  const engagement = useMemo(
    () => engagements.find((e) => e.id === engagementId) || engagements[0] || null,
    [engagements, engagementId],
  );

  const [step, setStep] = useState(0);
  const [situation, setSituation] = useState("");
  const [learning, setLearning] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [currentPrompt] = useState(() => REFLECTION_PROMPTS[Math.floor(Math.random() * REFLECTION_PROMPTS.length)]);

  const toggleCapability = useCallback((name: string) => {
    setSelectedCapabilities((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    );
  }, []);

  const canNext = useMemo(() => {
    if (step === 0) return situation.trim().length >= 10;
    if (step === 1) return learning.trim().length >= 10;
    if (step === 2) return nextAction.trim().length >= 5;
    if (step === 3) return selectedCapabilities.length > 0;
    return true;
  }, [step, situation, learning, nextAction, selectedCapabilities]);

  const handleSubmit = async () => {
    if (!engagement) {
      setError("Tidak ada program aktif ditemukan.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await submitReflection({
        engagementId: engagement.id,
        participantId: "current",
        prompt: currentPrompt,
        situation,
        learning,
        nextAction,
        capabilityTags: selectedCapabilities,
        confidenceScore: 0.65,
      });
      setSubmitted(true);
      toast.success("Refleksi berhasil dikirim!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim refleksi.");
      toast.error("Gagal mengirim refleksi");
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 size={32} className="text-emerald-500" />
        </div>
        <h2 className="mt-6 text-2xl font-semibold text-[#0B2C6B]">Refleksi Terkirim</h2>
        <p className="mt-3 text-sm leading-6 text-[#4A4C54]/70 max-w-md mx-auto">
          Refleksi Anda telah dicatat sebagai catatan. Ini akan berkontribusi pada perhitungan pertumbuhan kemampuan Anda.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/client/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-[#0B2C6B] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0A255A]"
          >
            Kembali ke Dashboard
          </Link>
          <button
            type="button"
            onClick={() => {
              setStep(0);
              setSituation("");
              setLearning("");
              setNextAction("");
              setSelectedCapabilities([]);
              setSubmitted(false);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-[#0B2C6B]/20 px-5 py-2.5 text-sm font-semibold text-[#0B2C6B] transition hover:bg-[#F5F7FA]"
          >
            Kirim Lagi
          </button>
        </div>
      </div>
    );
  }

  if (!engagement) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-[#4A4C54]/60">Tidak ada program aktif ditemukan. Ikuti program terlebih dahulu.</p>
        <Link href="/client/engagements" className="mt-4 inline-block text-sm font-semibold text-[#0B2C6B] hover:text-[#D9A441]">
          Lihat Program
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <StepIndicator current={step} total={4} />
        <span className="text-xs font-semibold text-[#4A4C54]/50">Step {step + 1} of 4</span>
      </div>

      <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-6 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
        {step === 0 && (
          <div>
            <div className="mb-1 flex items-center gap-2 text-[#D9A441]">
              <Lightbulb size={18} />
              <p className="text-xs font-bold uppercase tracking-[0.18em]">Situasi</p>
            </div>
            <h2 className="text-xl font-semibold text-[#0B2C6B]">{currentPrompt}</h2>
            <p className="mt-2 text-sm text-[#4A4C54]/60">
              Ceritakan konteks situasi yang kamu alami. Semakin detail, semakin baik evidence yang terbuat.
            </p>
            <textarea
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              rows={5}
              placeholder="Contoh: Minggu ini saya memimpin rapat tim untuk pertama kalinya. Saya harus memfasilitasi diskusi tentang prioritas proyek Q3..."
              className="mt-4 w-full rounded-lg border border-[#0B2C6B]/15 bg-[#FAFAF8] p-4 text-sm leading-6 text-[#0B2C6B] outline-none transition focus:border-[#D9A441] placeholder:text-[#4A4C54]/40"
            />
            <p className="mt-2 text-xs text-[#4A4C54]/50">{situation.length} / 10 karakter minimum</p>
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="mb-1 flex items-center gap-2 text-[#D9A441]">
              <Zap size={18} />
              <p className="text-xs font-bold uppercase tracking-[0.18em]">Pembelajaran</p>
            </div>
            <h2 className="text-xl font-semibold text-[#0B2C6B]">Apa yang kamu pelajari?</h2>
            <p className="mt-2 text-sm text-[#4A4C54]/60">
              Refleksikan insight atau pembelajaran baru yang kamu dapatkan dari situasi tersebut.
            </p>
            <textarea
              value={learning}
              onChange={(e) => setLearning(e.target.value)}
              rows={5}
              placeholder="Contoh: Saya belajar bahwa mempersiapkan agenda sebelum rapat sangat krusial. Juga, saya perlu lebih aktif meminta pendapat anggota tim yang pendiam..."
              className="mt-4 w-full rounded-lg border border-[#0B2C6B]/15 bg-[#FAFAF8] p-4 text-sm leading-6 text-[#0B2C6B] outline-none transition focus:border-[#D9A441] placeholder:text-[#4A4C54]/40"
            />
            <p className="mt-2 text-xs text-[#4A4C54]/50">{learning.length} / 10 karakter minimum</p>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="mb-1 flex items-center gap-2 text-[#D9A441]">
              <ArrowRight size={18} />
              <p className="text-xs font-bold uppercase tracking-[0.18em]">Tindakan Selanjutnya</p>
            </div>
            <h2 className="text-xl font-semibold text-[#0B2C6B]">Apa yang akan kamu lakukan selanjutnya?</h2>
            <p className="mt-2 text-sm text-[#4A4C54]/60">
              Tentukan satu aksi konkret yang akan kamu ambil berdasarkan pembelajaran ini.
            </p>
            <textarea
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              rows={4}
              placeholder="Contoh: Rapat berikutnya saya akan membuat draft agenda 2 hari sebelumnya dan membagikannya ke tim untuk input..."
              className="mt-4 w-full rounded-lg border border-[#0B2C6B]/15 bg-[#FAFAF8] p-4 text-sm leading-6 text-[#0B2C6B] outline-none transition focus:border-[#D9A441] placeholder:text-[#4A4C54]/40"
            />
            <p className="mt-2 text-xs text-[#4A4C54]/50">{nextAction.length} / 5 karakter minimum</p>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="mb-1 flex items-center gap-2 text-[#D9A441]">
              <Target size={18} />
              <p className="text-xs font-bold uppercase tracking-[0.18em]">Tag Kemampuan</p>
            </div>
            <h2 className="text-xl font-semibold text-[#0B2C6B]">Kemampuan mana yang berkembang?</h2>
            <p className="mt-2 text-sm text-[#4A4C54]/60">
              Pilih minimal satu kemampuan yang paling terkait dengan refleksi kamu. Ini membantu sistem menghitung pertumbuhan kemampuan.
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
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-[#0B2C6B]/20 px-4 py-2 text-sm font-semibold text-[#0B2C6B] transition hover:bg-[#F5F7FA] disabled:opacity-40"
          >
            <ArrowLeft size={16} /> Back
          </button>
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(3, s + 1))}
              disabled={!canNext}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0B2C6B] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#0A255A] disabled:opacity-40"
            >
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canNext || submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-[#D9A441] px-5 py-2 text-sm font-semibold text-[#071B3D] transition hover:bg-[#c49235] disabled:opacity-40"
            >
              {submitting ? "Mengirim..." : "Kirim Refleksi"} <CheckCircle2 size={16} />
            </button>
          )}
        </div>
      </section>

      <div className="mt-4 rounded-xl border border-[#0B2C6B]/10 bg-[#071B3D] p-4 text-white">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Cara Kerja</p>
        <p className="mt-2 text-xs leading-5 text-white/70">
Setiap refleksi membuat <strong>Catatan</strong> yang menjadi masukan untuk perhitungan <strong>Kemampuan</strong> Anda.
           Sistem menggunakan pembobotan: catatan refleksi memiliki bobot 0,55, dikombinasikan dengan tipe catatan lainnya
           (observasi, penilaian, tindakan) untuk menghasilkan skor kemampuan Anda.
        </p>
      </div>
    </div>
  );
}

export default function ReflectionPage() {
  return (
    <ClientAuthGate>
      <AppShell role="client" eyebrow="Sistem Catatan" title="Refleksi">
        <ErrorBoundary>
          <Suspense fallback={<div className="flex items-center justify-center py-20 text-sm text-[#4A4C54]/60">Memuat...</div>}>
            <ReflectionForm />
          </Suspense>
        </ErrorBoundary>
      </AppShell>
    </ClientAuthGate>
  );
}
