import { motion } from "framer-motion";
import { ArrowLeft, Send } from "lucide-react";
import { FormData } from "../_types";
import { useLocale } from "@/i18n/use-locale";

interface OpenQuestionsStepProps {
  formData: FormData;
  onChange: (data: Partial<FormData>) => void;
  onNext: (e: React.FormEvent) => void;
  onPrev: () => void;
  isSubmitting: boolean;
}

const COPY = {
  id: {
    challenge: "Apa tantangan terbesar tim Anda saat ini?",
    challengePlaceholder: "Tuliskan tantangan utama...",
    target: "Target utama (3-6 bulan)?",
    targetPlaceholder: "Tuliskan target strategis...",
    back: "Kembali",
    processing: "Memproses Data...",
    submit: "Lanjut ke Kontak",
  },
  en: {
    challenge: "What is your team's biggest challenge right now?",
    challengePlaceholder: "Write the main challenge...",
    target: "Main target (3-6 months)?",
    targetPlaceholder: "Write the strategic target...",
    back: "Back",
    processing: "Processing Data...",
    submit: "Continue to Contact",
  },
};

export function OpenQuestionsStep({
  formData,
  onChange,
  onNext,
  onPrev,
  isSubmitting,
}: OpenQuestionsStepProps) {
  const locale = useLocale();
  const copy = COPY[locale];
  const textareaClass =
    "w-full resize-none rounded-[12px] border border-black/10 bg-black/[0.02] px-5 py-4 text-base font-medium text-[#0B2C6B] placeholder:text-black/10 transition-all focus:border-[#0B2C6B] focus:bg-white focus:outline-none";

  return (
    <motion.div
      key="open-questions"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full max-w-2xl px-4 py-12"
    >
      <form
        onSubmit={onNext}
        className="space-y-8 rounded-[16px] border border-black/[0.04] bg-white p-8 text-left shadow-[0_18px_54px_-44px_rgba(11,44,107,0.34)] md:p-12"
      >
        <div className="space-y-3">
          <label className="block text-[10px] font-medium text-[#0B2C6B]/60 uppercase tracking-widest px-1">
            {copy.challenge}
          </label>
          <textarea
            rows={4}
            value={formData.challenge}
            onChange={(e) => onChange({ challenge: e.target.value })}
            className={textareaClass}
            placeholder={copy.challengePlaceholder}
          />
        </div>

        <div className="space-y-3">
          <label className="block text-[10px] font-medium text-[#0B2C6B]/60 uppercase tracking-widest px-1">
            {copy.target}
          </label>
          <textarea
            rows={4}
            value={formData.target}
            onChange={(e) => onChange({ target: e.target.value })}
            className={textareaClass}
            placeholder={copy.targetPlaceholder}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-black/[0.05]">
          <button
            type="button"
            onClick={onPrev}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-[12px] border border-[#0B2C6B]/10 bg-white text-[11px] font-bold uppercase tracking-widest text-[#0B2C6B]/60 transition-all hover:bg-black/[0.03] hover:text-[#0B2C6B]"
          >
            <ArrowLeft size={16} /> {copy.back}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="group flex h-14 flex-[2] items-center justify-center gap-3 rounded-[12px] bg-[#0B2C6B] text-[11px] font-bold uppercase tracking-widest text-white shadow-lg shadow-[#0B2C6B]/10 transition-all hover:bg-black disabled:opacity-70"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-3">
                {copy.processing}{" "}
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </span>
            ) : (
              <span className="flex items-center gap-3">
                {copy.submit} <Send size={16} />
              </span>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
