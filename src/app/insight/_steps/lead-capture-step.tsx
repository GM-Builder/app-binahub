import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Building2, User, Briefcase, Users, ChevronDown, Check } from "lucide-react";
import { FormData } from "../_types";
import { useLocale } from "@/i18n/use-locale";

interface LeadCaptureStepProps {
  formData: FormData;
  onChange: (data: Partial<FormData>) => void;
  onNext: (e: React.FormEvent) => void;
  onPrev: () => void;
}

const EMPLOYEE_OPTIONS = [
  { value: "< 5", id: "< 5 Karyawan", en: "< 5 Employees" },
  { value: "5 - 19", id: "5 - 19 Karyawan", en: "5 - 19 Employees" },
  { value: "20 - 99", id: "20 - 99 Karyawan", en: "20 - 99 Employees" },
  { value: "100 - 499", id: "100 - 499 Karyawan", en: "100 - 499 Employees" },
  { value: "500+", id: "500+ Karyawan", en: "500+ Employees" },
];

const COPY = {
  id: {
    title: "Profil Organisasi",
    subtitle: "Berikan informasi dasar untuk personalisasi laporan diagnostik tim Anda.",
    contextTitle: "Data awal membantu laporan membaca konteks organisasi Anda.",
    contextBody:
      "Informasi ini digunakan untuk menyesuaikan analisis, bukan untuk membuat proses terasa administratif.",
    badges: [
      ["5-7 menit", "Estimasi pengisian"],
      ["49 indikator", "Membaca 7 dimensi"],
      ["Privat", "Dikirim ke Email & WhatsApp"],
    ],
    fields: {
      name: "Nama Lengkap *",
      role: "Jabatan *",
      company: "Nama Perusahaan *",
      employees: "Jumlah Karyawan *",
    },
    placeholders: {
      name: "Contoh: Budi Santoso",
      role: "Contoh: CEO / HR Director",
      company: "Nama PT / Instansi",
      employees: "Pilih skala perusahaan...",
    },
    back: "Kembali",
    next: "Lanjut ke Instruksi",
  },
  en: {
    title: "Organization Profile",
    subtitle: "Share basic information so we can personalize your team diagnostic report.",
    contextTitle: "Initial data helps the report read your organizational context.",
    contextBody:
      "This information is used to tailor the analysis, not to make the process feel administrative.",
    badges: [
      ["5-7 minutes", "Estimated completion"],
      ["49 indicators", "Across 7 dimensions"],
      ["Private", "Sent to Email & WhatsApp"],
    ],
    fields: {
      name: "Full Name *",
      role: "Role *",
      company: "Company Name *",
      employees: "Number of Employees *",
    },
    placeholders: {
      name: "Example: Sarah Johnson",
      role: "Example: CEO / HR Director",
      company: "Company / Institution name",
      employees: "Select company scale...",
    },
    back: "Back",
    next: "Continue to Instructions",
  },
};

export function LeadCaptureStep({ formData, onChange, onNext, onPrev }: LeadCaptureStepProps) {
  const locale = useLocale();
  const copy = COPY[locale];
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const inputClass =
    "w-full bg-white border border-black/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#0B2C6B] transition-all font-medium text-black placeholder:text-black/20";
  const labelClass =
    "flex items-center gap-2 text-[10px] font-medium tracking-widest text-black/60 mb-2.5 uppercase";

  return (
    <motion.div
      key="lead"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full max-w-6xl px-6 py-12 flex flex-col items-center"
    >
      <div className="mb-12 text-center">
        <h2 className="text-3xl md:text-5xl font-light text-[#0B2C6B] mb-4">{copy.title}</h2>
        <p className="text-black/40 text-sm font-medium tracking-wide">
          {copy.subtitle}
        </p>
      </div>

      <div className="grid w-full gap-6 lg:grid-cols-[0.72fr_1fr] lg:items-stretch">
        <aside className="relative overflow-hidden rounded-[16px] bg-[#0B2C6B] p-8 text-white shadow-[0_24px_80px_-58px_rgba(11,44,107,0.68)] md:p-10">
          <div className="absolute -right-20 -top-20 h-52 w-80 bg-[#D9A441]/16 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.16) 1px, transparent 1px)", backgroundSize: "42px 42px" }} />
          <div className="relative z-10 flex h-full min-h-[420px] flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D9A441]">Diagnostic Context</p>
              <h3 className="mt-5 text-3xl font-light leading-tight">
                {copy.contextTitle}
              </h3>
              <p className="mt-5 text-sm font-light leading-relaxed text-white/58">
                {copy.contextBody}
              </p>
            </div>
            <div className="grid gap-3">
              {copy.badges.map(([value, label]) => (
                <div key={value} className="rounded-[12px] border border-white/10 bg-white/[0.075] px-5 py-4">
                  <p className="text-sm font-bold text-white">{value}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/36">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <form
          onSubmit={onNext}
          className="w-full rounded-[16px] border border-black/[0.04] bg-white p-6 shadow-[0_18px_54px_-44px_rgba(11,44,107,0.34)] md:p-12"
        >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8 md:mb-12">
          <div className="space-y-1">
            <label className={labelClass}>
              <User size={14} className="text-[#D9A441]" /> {copy.fields.name}
            </label>
            <input
              required
              type="text"
              placeholder={copy.placeholders.name}
              value={formData.name}
              onChange={(e) => onChange({ name: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>
              <Briefcase size={14} className="text-[#D9A441]" /> {copy.fields.role}
            </label>
            <input
              required
              type="text"
              placeholder={copy.placeholders.role}
              value={formData.role}
              onChange={(e) => onChange({ role: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label className={labelClass}>
              <Building2 size={14} className="text-[#D9A441]" /> {copy.fields.company}
            </label>
            <input
              required
              type="text"
              placeholder={copy.placeholders.company}
              value={formData.company}
              onChange={(e) => onChange({ company: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>
              <Users size={14} className="text-[#D9A441]" /> {copy.fields.employees}
            </label>
            <div className="relative">
              <div 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`${inputClass} cursor-pointer flex items-center justify-between group hover:border-black/30`}
              >
                <span className={formData.employees ? "text-black" : "text-black/20"}>
                  {formData.employees ? EMPLOYEE_OPTIONS.find(o => o.value === formData.employees)?.[locale] : copy.placeholders.employees}
                </span>
                <ChevronDown size={16} className={`transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""} text-black/20 group-hover:text-black/40`} />
              </div>

              <AnimatePresence>
                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setIsDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 5, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.98 }}
                      className="absolute left-0 right-0 top-full z-[101] mt-2 overflow-hidden rounded-[12px] border border-black/[0.06] bg-white shadow-[0_18px_58px_-42px_rgba(11,44,107,0.34)]"
                    >
                      <div className="p-2 max-h-[240px] overflow-y-auto">
                        {EMPLOYEE_OPTIONS.map((opt) => {
                          const isSelected = formData.employees === opt.value;
                          return (
                            <div
                              key={opt.value}
                              onClick={() => {
                                onChange({ employees: opt.value });
                                setIsDropdownOpen(false);
                              }}
                              className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
                                isSelected 
                                  ? "bg-[#0B2C6B] text-white" 
                                  : "hover:bg-black/[0.03] text-black/60 hover:text-black"
                              }`}
                            >
                              <span className="text-sm font-medium">{opt[locale]}</span>
                              {isSelected && <Check size={14} className="text-white" />}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onPrev}
            className="px-8 h-14 border border-black/10 rounded-xl text-[11px] font-medium tracking-widest text-black/40 hover:bg-black/5 transition-all uppercase flex items-center gap-2"
          >
            <ArrowLeft size={14} /> {copy.back}
          </button>
          <button
            type="submit"
            className="flex-1 h-14 bg-[#0B2C6B] text-white rounded-xl text-[11px] font-medium tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 uppercase shadow-lg shadow-black/10"
          >
            {copy.next} <ArrowRight size={16} />
          </button>
        </div>
        </form>
      </div>
    </motion.div>
  );
}
