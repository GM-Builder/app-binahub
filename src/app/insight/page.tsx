"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, AlertTriangle, X } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { FormData } from "./_types";
import { DIMENSIONS, QUESTIONS } from "./questions";
import { LandingStep } from "./_steps/landing-step";
import { LeadCaptureStep } from "./_steps/lead-capture-step";
import { InstructionStep } from "./_steps/instruction-step";
import { QuestionsStep } from "./_steps/questions-step";
import { OpenQuestionsStep } from "./_steps/open-questions-step";
import { ContactStep } from "./_steps/contact-step";
import { SuccessStep } from "./_steps/success-step";
import { PixelIcon, type IconType } from "@/components/pixel-icon";
import { localizePath } from "@/i18n/config";
import { useLocale } from "@/i18n/use-locale";

const TOTAL_STEPS = 11;
const SPEED_LINES = [
  { width: 46, duration: 0.48 },
  { width: 72, duration: 0.66 },
  { width: 58, duration: 0.54 },
];
const STEP_CONTEXT = [
  { eyebrow: "Profil Organisasi", title: "Personalisasi laporan diagnostik" },
  { eyebrow: "Instruksi", title: "Kalibrasi cara menjawab" },
  ...DIMENSIONS.map((dimension) => ({
    eyebrow: `Dimensi ${dimension}`,
    title: `Menganalisis ${dimension}`,
  })),
  { eyebrow: "Konteks Strategis", title: "Menangkap prioritas 3-6 bulan" },
  { eyebrow: "Kontak Laporan", title: "Mengonfirmasi email dan WhatsApp" },
];

const STEP_CONTEXT_EN = [
  { eyebrow: "Organization Profile", title: "Personalize the diagnostic report" },
  { eyebrow: "Instructions", title: "Calibrate how to answer" },
  ...DIMENSIONS.map((dimension) => ({
    eyebrow: `${dimension} Dimension`,
    title: `Analyzing ${dimension}`,
  })),
  { eyebrow: "Strategic Context", title: "Capture the next 3-6 month priorities" },
  { eyebrow: "Report Contact", title: "Confirm email and WhatsApp" },
];

export default function InsightPage() {
  const locale = useLocale();
  const [step, setStep] = useState(-1);
  const [formData, setFormData] = useState<FormData>({
    email: "", company: "", employees: "", name: "",
    role: "", whatsapp: "", challenge: "", target: "",
  });
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // ── Safety Measures ────────────────────────────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (step > 0 && step < 11) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [step]);

  useEffect(() => {
    if (step > 0 && step < 10) {
      window.history.pushState({ trap: true }, "", window.location.href);
    }
    const handlePopState = () => {
      if (step > 0 && step < 11) {
        setShowExitConfirm(true);
        window.history.pushState({ trap: true }, "", window.location.href);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [step]);

  // ── Scroll to top on step change ──────────────────────────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [step]);

  // ── Navigation ──────────────────────────────────────────────────────────────
  const nextStep = () => {
    setStep((s) => s + 1);
  };
  const prevStep = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setStep((s) => Math.max(-1, s - 1));
  };

  const confirmBack = () => {
    setShowExitConfirm(false);
    window.location.href = localizePath("/", locale);
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleFormChange = (data: Partial<FormData>) =>
    setFormData((prev) => ({ ...prev, ...data }));

  const handleAnswer = (qId: number, val: number) =>
    setAnswers((prev) => ({ ...prev, [qId]: val }));

  const handleSubmitLead = (e: React.FormEvent) => {
    e.preventDefault();
    nextStep();
  };

  const handleSubmitFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          answers: answers,
          locale,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setIsSubmitting(false);
        nextStep();
      } else {
        const fullError = data.details ? `${data.error} (${data.details})` : data.error;
        alert(copy.submitError + (fullError || copy.genericError));
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert(copy.connectionError);
      setIsSubmitting(false);
    }
  };

  // ── Validation ──────────────────────────────────────────────────────────────
  const isQuestionPageValid = () => {
    if (step < 2 || step > 8) return true;
    const start = (step - 2) * 7;
    for (let i = start; i < start + 7; i++) {
      if (!answers[QUESTIONS[i].id]) return false;
    }
    return true;
  };

  const progressPercent = step >= 0 ? Math.min(100, (step / TOTAL_STEPS) * 100) : 0;
  const currentContext = step >= 0 && step < 11 ? (locale === "en" ? STEP_CONTEXT_EN : STEP_CONTEXT)[step] : null;
  const copy = locale === "en"
    ? {
        submitError: "Failed to submit assessment: ",
        genericError: "An error occurred",
        connectionError: "A connection error occurred while submitting data.",
        cancelTitle: "Cancel Assessment?",
        cancelBody: "You will lose all data you have entered.",
        cancelConfirm: "Are you sure you want to stop this process?",
        continue: "CONTINUE ASSESSMENT",
        exit: "EXIT & CANCEL",
        done: "DONE",
        step: "STEP",
        of: "OF",
        back: "BACK",
        nextClosing: "CONTINUE TO CLOSING",
        nextPage: "NEXT PAGE",
      }
    : {
        submitError: "Gagal mengirim asesmen: ",
        genericError: "Terjadi kesalahan",
        connectionError: "Terjadi kesalahan koneksi saat mengirim data.",
        cancelTitle: "Batalkan Asesmen?",
        cancelBody: "Anda akan kehilangan semua data yang telah diisi.",
        cancelConfirm: "Apakah Anda yakin ingin menghentikan proses ini?",
        continue: "LANJUTKAN ASESMEN",
        exit: "KELUAR & BATALKAN",
        done: "SELESAI",
        step: "TAHAP",
        of: "DARI",
        back: "KEMBALI",
        nextClosing: "LANJUT KE PENUTUP",
        nextPage: "HALAMAN BERIKUTNYA",
      };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#4A4C54] font-sans flex flex-col selection:bg-[#0B2C6B] selection:text-white relative overflow-x-hidden">

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExitConfirm(false)}
              className="absolute inset-0 bg-[#0B2C6B]/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-[16px] border border-white/20 bg-white p-10 text-center shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)]"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-[#D9A441] to-red-500" />
              <div className="absolute -right-24 -top-24 h-40 w-64 bg-[#D9A441]/8 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 h-40 w-64 bg-red-500/4 blur-3xl" />
              <button onClick={() => setShowExitConfirm(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 transition-colors text-black/20 hover:text-black">
                <X size={20} />
              </button>
              <div className="relative z-10">
                <div className="mx-auto mb-8 flex h-20 w-20 rotate-3 items-center justify-center rounded-[8px] border border-red-100 bg-red-50 text-red-500 shadow-xl shadow-red-500/10">
                  <AlertTriangle size={36} strokeWidth={2} />
                </div>
                <h3 className="text-2xl font-bold text-[#0B2C6B] mb-3 tracking-tight">{copy.cancelTitle}</h3>
                <p className="text-black/40 text-base mb-10 leading-relaxed font-light">
                  {copy.cancelBody} <br /> {copy.cancelConfirm}
                </p>
                <div className="grid grid-cols-1 gap-3">
                  <button onClick={() => setShowExitConfirm(false)} className="group relative h-16 w-full overflow-hidden rounded-[12px] bg-[#0B2C6B] text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-xl transition-all hover:bg-black">
                    <span className="relative z-10">{copy.continue}</span>
                  </button>
                  <button onClick={confirmBack} className="h-16 w-full rounded-[12px] border border-black/5 bg-white text-[11px] font-bold uppercase tracking-[0.2em] text-[#0B2C6B]/55 transition-all hover:bg-black/5">
                    <span className="relative z-10">{copy.exit}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Globally hide navbar/footer during assessment form steps (step >= 0) */}
      {step >= 0 && (
        <style dangerouslySetInnerHTML={{ __html: `
          #global-navbar, 
          .global-navbar,
          header:not(.insight-header), 
          footer,
          #chatbot-trigger,
          #chatbot-window { 
            display: none !important; 
          }
        ` }} />
      )}

      {/* Assessment header */}
      {step >= 0 && (
        <header className="insight-header fixed top-0 inset-x-0 h-16 flex items-center justify-between px-6 md:px-12 z-50 bg-white/92 backdrop-blur-sm border-b border-black/[0.03]">
          <button 
            onClick={() => {
              if (step > 0 && step < 11) {
                setShowExitConfirm(true);
              } else {
                window.location.href = localizePath("/", locale);
              }
            }}
            className="flex items-center hover:opacity-70 transition-opacity"
          >
            <Image 
              src="/full-logo.png" 
              alt="BinaHub Logo" 
              width={120} 
              height={30} 
              className="h-8 w-auto object-contain"
            />
          </button>
          <div className="text-right">
            <div className="text-[10px] font-bold tracking-[0.2em] text-black/24 uppercase">
              {step === 11 ? copy.done : `${copy.step} ${step + 1} ${copy.of} ${TOTAL_STEPS}`}
            </div>
            {currentContext && (
              <div className="mt-1 hidden text-[11px] font-medium text-[#0B2C6B]/60 md:block">
                {currentContext.eyebrow} · {currentContext.title}
              </div>
            )}
          </div>
        </header>
      )}

      {/* Progress bar */}
      {step >= 0 && step < 11 && (
        <div className="fixed top-16 left-0 h-1 bg-black/5 w-full z-50">
          <div className="h-full bg-[#D9A441] transition-all duration-700 ease-out" style={{ width: `${progressPercent}%` }} />
        </div>
      )}

      {/* Main content */}
      <main className={`flex-1 flex flex-col items-center w-full ${step === -1 ? "" : "justify-center mt-16 pb-24"}`}>
        <AnimatePresence mode="wait">
          {step === -1 && !isSubmitting && <LandingStep onStart={nextStep} />}
          {step === 0  && !isSubmitting && <LeadCaptureStep formData={formData} onChange={handleFormChange} onNext={handleSubmitLead} onPrev={prevStep} />}
          {step === 1  && !isSubmitting && <InstructionStep onNext={nextStep} onPrev={prevStep} />}
          {step >= 2 && step <= 8 && !isSubmitting && <QuestionsStep step={step} answers={answers} onAnswer={handleAnswer} />}
          {step === 9  && <OpenQuestionsStep formData={formData} onChange={handleFormChange} onNext={handleSubmitLead} onPrev={prevStep} isSubmitting={isSubmitting} />}
          {step === 10 && <ContactStep formData={formData} onChange={handleFormChange} onSubmit={handleSubmitFinal} onPrev={prevStep} isSubmitting={isSubmitting} />}
          {step === 11 && !isSubmitting && <SuccessStep name={formData.name} company={formData.company} />}
        </AnimatePresence>

        {/* Dynamic Full Screen Loading Overlay */}
        <AnimatePresence>
          {isSubmitting && <LoadingOverlay locale={locale} />}
        </AnimatePresence>
      </main>

      {/* Question page navigation footer */}
      {step >= 2 && step <= 8 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 inset-x-0 p-4 md:p-6 flex justify-between gap-3 z-50 bg-white/96 backdrop-blur-sm border-t border-black/[0.05]"
        >
          <button
            onClick={prevStep}
            className="h-12 px-6 rounded-xl border border-black/10 bg-white shadow-sm flex items-center text-black/60 hover:text-black hover:border-black/30 hover:bg-black/[0.02] transition-all text-xs font-medium uppercase tracking-widest"
          >
            <span><ArrowLeft size={16} className="mr-2 inline" /> {copy.back}</span>
          </button>
          <button
            onClick={nextStep}
            disabled={!isQuestionPageValid()}
            className="h-12 px-8 rounded-xl bg-[#0B2C6B] text-white flex items-center gap-2 font-medium text-xs tracking-widest uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black shadow-md shadow-black/20"
          >
            <span>
              {step === 8 ? copy.nextClosing : copy.nextPage}
              <ArrowRight size={16} className="ml-2 inline" />
            </span>
          </button>
        </motion.div>
      )}
    </div>
  );
}

function LoadingOverlay({ locale }: { locale: "id" | "en" }) {
  const isEnglish = locale === "en";
  const messages = isEnglish
    ? [
        "Receiving and verifying your data...",
        "Our consulting team is preparing the analysis framework...",
        "Mapping performance across 7 operational dimensions...",
        "Formulating strategic priorities and executive recommendations...",
        "Preparing the final BinaHub Insight report...",
        "Almost done, preparing delivery to your email..."
      ]
    : [
        "Menerima dan memverifikasi data Anda...",
        "Tim konsultan kami sedang menyusun kerangka analisis...",
        "Memetakan performa ke dalam 7 dimensi operasional...",
        "Merumuskan prioritas strategis dan rekomendasi eksekutif...",
        "Menyusun laporan akhir BinaHub Insight...",
        "Hampir selesai, menyiapkan pengiriman ke email Anda..."
      ];
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev < messages.length - 1 ? prev + 1 : prev));
    }, 4500);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 text-center"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0B2C6B] via-[#D9A441] to-[#0B2C6B] animate-pulse" />
      
      <div className="mb-12">
        <PixelLoader />
      </div>
      
      <motion.h2 
        key={msgIdx}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="text-xl md:text-2xl font-bold text-[#0B2C6B] mb-4 max-w-lg"
      >
        {messages[msgIdx]}
      </motion.h2>

      <p className="text-sm text-black/40 max-w-md font-light">
        {isEnglish
          ? "Please do not close this page. Our team is processing your business parameters for an accurate result."
          : "Mohon jangan menutup halaman ini. Tim kami sedang memproses parameter bisnis Anda untuk hasil yang akurat."}
      </p>
    </motion.div>
  );
}

function PixelLoader() {
  // Dino Runner Style with 8 Ecosystem Pillars
  const pillars: IconType[] = [
    "insights", "lab", "coach", "journey",
    "play", "academy", "impact", "works"
  ];

  return (
    <div className="relative w-[320px] h-[160px] flex items-center justify-center">
      {/* Soft Background Glow - Darker for visibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0B2C6B]/[0.12] to-transparent blur-3xl" />
      
      <div className="relative w-full h-[120px] overflow-hidden flex items-end pb-2 border-b-2 border-[#0B2C6B]/10">
        {/* Infinite scrolling pillars (8 Ecosystem Icons) */}
        <motion.div 
          animate={{ x: [0, -600] }}
          transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
          className="absolute bottom-2 left-0 flex gap-20 items-end"
        >
          {[...pillars, ...pillars].map((type, i) => (
            <div key={i} className="flex flex-col items-center justify-end shrink-0 opacity-100">
              <PixelIcon type={type} size={32} />
              <div className="w-[1px] h-4 bg-[#0B2C6B]/20 mt-1" />
            </div>
          ))}
        </motion.div>
        
        {/* Running/Bouncing Character (About Icon) */}
        <motion.div
          animate={{ y: [0, -30, 0] }}
          transition={{ repeat: Infinity, duration: 0.45, ease: "easeInOut" }}
          className="relative z-10 ml-10 mb-1"
        >
          <PixelIcon type="about" size={56} />
        </motion.div>

        {/* Speed Lines */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {SPEED_LINES.map((line, i) => (
            <motion.div
              key={i}
              className="absolute h-[1px] bg-[#D9A441]/40"
              initial={{ x: 320, y: 30 + i * 30, width: line.width }}
              animate={{ x: -100 }}
              transition={{ 
                duration: line.duration, 
                repeat: Infinity, 
                ease: "linear",
                delay: i * 0.1
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
