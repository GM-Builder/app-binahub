import { motion } from "framer-motion";
import { DIMENSIONS, QUESTIONS } from "../questions";
import { LIKERT_OPTIONS } from "../_types";
import { useLocale } from "@/i18n/use-locale";
import { publicSiteTranslations } from "@/i18n/site-translations";

const DIMENSION_GUIDANCE: Record<string, string> = {
  Insights: "Kami membaca bagaimana data, indikator, dan akar masalah digunakan dalam keputusan tim.",
  Lab: "Dimensi ini melihat kecocokan kompetensi, kualitas komunikasi, dan kemampuan problem solving.",
  Coach: "Bagian ini menilai kualitas arahan, feedback, tanggung jawab, dan growth mindset.",
  Play: "Kami mengukur energi kerja, engagement, rasa dihargai, dan koneksi antaranggota tim.",
  Academy: "Dimensi ini memetakan struktur pembelajaran, kurikulum, dan budaya belajar berkelanjutan.",
  Works: "Bagian ini melihat kejelasan KPI, dokumentasi proses, peran, dan ritme monitoring pekerjaan.",
  Impact: "Kami membaca sejauh mana program pengembangan punya indikator, bukti dampak, dan ROI.",
};

const REINFORCEMENT = [
  "Jawaban yang jujur lebih berguna daripada jawaban yang terlihat ideal.",
  "Banyak organisasi menemukan blind spot saat membandingkan praktik harian dengan ekspektasi strategis.",
  "Pola kecil yang konsisten sering menjadi sinyal terbesar dalam performa tim.",
];

const DIMENSION_GUIDANCE_EN: Record<string, string> = {
  Insights: "We look at how data, indicators, and root causes are used in team decisions.",
  Lab: "This dimension reviews competency fit, communication quality, and problem-solving capability.",
  Coach: "This section assesses guidance quality, feedback, ownership, and growth mindset.",
  Play: "We measure work energy, engagement, appreciation, and connection between team members.",
  Academy: "This dimension maps learning structure, curriculum, and sustainable learning culture.",
  Works: "This section reviews KPI clarity, process documentation, roles, and work monitoring rhythm.",
  Impact: "We review how far development programs have indicators, impact evidence, and ROI visibility.",
};

const REINFORCEMENT_EN = [
  "Honest answers are more useful than answers that look ideal.",
  "Many organizations find blind spots when comparing daily practice with strategic expectations.",
  "Small consistent patterns often become the biggest signal in team performance.",
];

const LIKERT_LABELS_EN: Record<number, string> = {
  1: "Strongly Disagree",
  2: "Disagree",
  3: "Agree",
  4: "Strongly Agree",
};

interface QuestionsStepProps {
  step: number;
  answers: Record<number, number>;
  onAnswer: (qId: number, val: number) => void;
}

export function QuestionsStep({ step, answers, onAnswer }: QuestionsStepProps) {
  const locale = useLocale();
  const isEnglish = locale === "en";
  const pageIndex = step - 2;
  const pageQuestions = QUESTIONS.slice(pageIndex * 7, pageIndex * 7 + 7);
  const dimension = DIMENSIONS[pageIndex];

  return (
    <motion.div
      key={`page-${step}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full max-w-4xl px-4 py-6 flex flex-col items-center"
    >
      <div className="mb-8 max-w-3xl text-center">
        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.24em] text-[#D9A441]">
          {isEnglish ? `${dimension} Dimension` : `Dimensi ${dimension}`}
        </p>
        <h2 className="text-3xl md:text-4xl font-light text-[#0B2C6B] leading-tight">
          {isEnglish ? "How strongly do you agree with the following statements?" : "Sejauh mana Anda setuju dengan pernyataan berikut?"}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm font-light leading-relaxed text-black/48">
          {isEnglish ? DIMENSION_GUIDANCE_EN[dimension] : DIMENSION_GUIDANCE[dimension]}
        </p>
      </div>

      <div className="space-y-4 w-full max-w-3xl">
        {pageQuestions.map((q, idx) => {
          return (
            <div
              key={q.id}
              className="relative overflow-hidden rounded-[8px] border border-black/[0.05] bg-white p-4 shadow-[0_14px_46px_-38px_rgba(11,44,107,0.28)] md:p-8"
            >
              <div className="relative z-10">
                <div className="mb-4 h-px w-10 bg-[#D9A441]/45" />
                <h3 className="text-sm md:text-lg font-light text-[#0B2C6B] mb-5 text-left leading-relaxed px-2">
                  {isEnglish ? publicSiteTranslations[q.text] || q.text : q.text}
                </h3>

                {idx === 3 && (
                  <div className="mb-5 rounded-[12px] border border-[#D9A441]/18 bg-[#D9A441]/[0.055] px-5 py-4">
                    <p className="text-xs font-medium leading-relaxed text-[#0B2C6B]/62">
                      {isEnglish ? REINFORCEMENT_EN[pageIndex % REINFORCEMENT_EN.length] : REINFORCEMENT[pageIndex % REINFORCEMENT.length]}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-5 gap-1.5 md:gap-4">
                  {LIKERT_OPTIONS.map((opt) => {
                    const isSelected = answers[q.id] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => onAnswer(q.id, opt.value)}
                        className={`flex flex-col items-center justify-center rounded-[10px] border py-2.5 transition-all duration-300 md:py-5 ${isSelected
                            ? "bg-[#0B2C6B] border-[#0B2C6B] text-white shadow-[0_14px_34px_-22px_rgba(10,26,58,0.48)] scale-[1.02]"
                            : "bg-[#F5F7F9] border-black/[0.03] text-black/60 hover:bg-black/[0.05] hover:border-black/10"
                          }`}
                      >
                        <span className={`text-xl md:text-2xl font-bold mb-1 transition-colors ${isSelected ? "text-[#D9A441]" : "text-[#0B2C6B]"}`}>
                          {opt.value}
                        </span>
                        <span className={`text-[7px] md:text-[9px] text-center leading-tight uppercase tracking-[0.08em] font-bold transition-colors ${isSelected ? "text-white" : "text-black/40"}`}>
                          {isEnglish ? LIKERT_LABELS_EN[opt.value] || opt.label : opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
