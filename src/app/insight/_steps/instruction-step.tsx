import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale } from "@/i18n/use-locale";

const SCALE_ITEMS = [
  { val: 1, id: "SANGAT TIDAK SETUJU", en: "STRONGLY DISAGREE", color: "text-[#EF4444]", bg: "bg-[#FEF2F2]", border: "border-[#FEE2E2]" },
  { val: 2, id: "TIDAK SETUJU", en: "DISAGREE", color: "text-[#F59E0B]", bg: "bg-[#FFFBEB]", border: "border-[#FEF3C7]" },
  { val: 3, id: "NETRAL / 50:50", en: "NEUTRAL / 50:50", color: "text-[#64748B]", bg: "bg-[#F8FAFC]", border: "border-[#F1F5F9]" },
  { val: 4, id: "SETUJU", en: "AGREE", color: "text-[#3B82F6]", bg: "bg-[#EFF6FF]", border: "border-[#DBEAFE]" },
  { val: 5, id: "SANGAT SETUJU", en: "STRONGLY AGREE", color: "text-[#10B981]", bg: "bg-[#ECFDF5]", border: "border-[#D1FAE5]" },
];

const COPY = {
  id: {
    title: "Instruksi Pengisian",
    body: "Berikan penilaian sesuai kondisi di tempat kerja Anda saat ini.",
    bodyStrong: "Kejujuran Anda sangat krusial bagi akurasi laporan.",
    back: "Kembali",
    start: "Saya Mengerti, Mulai",
  },
  en: {
    title: "Assessment Instructions",
    body: "Rate each statement based on your current workplace reality.",
    bodyStrong: "Your honesty is essential for report accuracy.",
    back: "Back",
    start: "I Understand, Start",
  },
};

interface InstructionStepProps {
  onNext: () => void;
  onPrev: () => void;
}

export function InstructionStep({ onNext, onPrev }: InstructionStepProps) {
  const locale = useLocale();
  const copy = COPY[locale];

  return (
    <motion.div
      key="instruction"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full max-w-4xl px-6 py-12 flex flex-col items-center"
    >
      <div className="mb-12 text-center">
        <h2 className="text-3xl md:text-5xl font-light text-[#0B2C6B] mb-4">{copy.title}</h2>
        <p className="text-black/40 text-sm font-medium tracking-wide max-w-xl mx-auto leading-relaxed">
          {copy.body} <br />
          {copy.bodyStrong}
        </p>
      </div>

      <div className="mb-10 w-full max-w-2xl rounded-[16px] border border-black/[0.04] bg-white p-6 shadow-[0_18px_52px_-44px_rgba(11,44,107,0.32)] md:p-12">
        <div className="space-y-4">
          {SCALE_ITEMS.map((item) => (
            <div 
              key={item.val} 
              className={`flex items-center rounded-[12px] border p-3 ${item.bg} ${item.border}`}
            >
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center font-bold text-lg text-[#0B2C6B] mr-4 md:mr-6 shrink-0 border border-black/5">
                {item.val}
              </div>
              <div className={`text-[11px] font-medium uppercase tracking-[0.15em] ${item.color}`}>
                {item[locale]}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 w-full max-w-2xl">
        <button 
          onClick={onPrev} 
          className="px-8 h-14 border border-black/10 rounded-xl text-[11px] font-bold tracking-widest text-black/50 hover:bg-black/5 transition-all uppercase flex items-center gap-2"
        >
          <ArrowLeft size={14} /> {copy.back}
        </button>
        <button 
          onClick={onNext} 
          className="flex-1 h-14 bg-[#0B2C6B] text-white rounded-xl text-[11px] font-bold tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 uppercase shadow-lg shadow-black/10"
        >
          {copy.start} <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}
