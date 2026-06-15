"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Radar } from "lucide-react";
import { useLocale } from "@/i18n/use-locale";

const SAMPLE_SCORES = [
  { label: "Insights", value: 82, signal: "Data performa sudah kuat", tone: "bg-[#D9A441]" },
  { label: "Lab", value: 71, signal: "Kompetensi perlu ditajamkan", tone: "bg-[#8FA3C7]" },
  { label: "Coach", value: 64, signal: "Bottleneck leadership terdeteksi", tone: "bg-[#C86B2B]" },
  { label: "Play", value: 76, signal: "Energi tim relatif positif", tone: "bg-[#6EA27B]" },
  { label: "Academy", value: 68, signal: "Learning path belum konsisten", tone: "bg-[#0B2C6B]" },
  { label: "Works", value: 61, signal: "Ritme eksekusi perlu diperjelas", tone: "bg-[#C86B2B]" },
  { label: "Impact", value: 57, signal: "Dampak program belum terukur", tone: "bg-[#B9471D]" },
];

const SAMPLE_OVERALL = Math.round(SAMPLE_SCORES.reduce((sum, item) => sum + item.value, 0) / SAMPLE_SCORES.length);

const SAMPLE_SIGNAL_EN: Record<string, string> = {
  Insights: "Performance data is already strong",
  Lab: "Competencies need sharper focus",
  Coach: "Leadership bottleneck detected",
  Play: "Team energy is relatively positive",
  Academy: "Learning path is not yet consistent",
  Works: "Execution rhythm needs more clarity",
  Impact: "Program impact is not yet measured",
};

const COPY = {
  id: {
    result: "Hasil Penilaian",
    simulation: "Simulasi output assessment",
    category: "Profesional",
    priority: "Prioritas",
    sampleReport: "Sample Report",
    priorityMap: "Priority Map",
    assessmentCategory: "Kategori assessment",
    interventionPriority: "Prioritas intervensi",
    reportOutput: "Output laporan",
    reportOutputValue: "Analisis + 5 rekomendasi",
  },
  en: {
    result: "Assessment Result",
    simulation: "Assessment output simulation",
    category: "Professional",
    priority: "Priority",
    sampleReport: "Sample Report",
    priorityMap: "Priority Map",
    assessmentCategory: "Assessment category",
    interventionPriority: "Intervention priority",
    reportOutput: "Report output",
    reportOutputValue: "Analysis + 5 recommendations",
  },
};

export function DiagnosticPreview() {
  const locale = useLocale();
  const copy = COPY[locale];
  const sampleScores = SAMPLE_SCORES.map((item) => ({
    ...item,
    signal: locale === "en" ? SAMPLE_SIGNAL_EN[item.label] : item.signal,
  }));
  const samplePriority = [...sampleScores].sort((a, b) => a.value - b.value)[0];
  const [tilt, setTilt] = useState({ x: 0, y: 0, active: false });

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    setTilt({
      x: -x * 12,
      y: y * 10,
      active: true,
    });
  };

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setTilt({ x: 0, y: 0, active: false })}
      className="hidden md:block w-full justify-self-start max-w-[400px] [perspective:1400px]"
    >
      <motion.div
        animate={{
          y: [0, -7, 0],
          rotateX: tilt.y + 5,
          rotateY: tilt.x - 10,
          rotateZ: tilt.active ? 0 : [-1.1, 0.7, -1.1],
          x: tilt.active ? tilt.x * 1.2 : 0,
          scale: tilt.active ? 1.015 : 1,
        }}
        transition={{
          y: { duration: 12, repeat: Infinity, ease: "easeInOut" },
          rotateZ: { duration: 12, repeat: Infinity, ease: "easeInOut" },
          rotateX: { type: "spring", stiffness: 120, damping: 20 },
          rotateY: { type: "spring", stiffness: 120, damping: 20 },
          x: { type: "spring", stiffness: 120, damping: 20 },
          scale: { type: "spring", stiffness: 120, damping: 20 },
        }}
        className="relative [transform-style:preserve-3d] will-change-transform"
      >
        <div className="absolute inset-5 translate-x-10 translate-y-8 rounded-[8px] border border-white/10 bg-white/[0.08] shadow-2xl shadow-black/10 backdrop-blur-md [transform:translateZ(-92px)]" />
        <div className="absolute inset-3 translate-x-5 translate-y-4 rounded-[8px] border border-white/12 bg-[#D9A441]/[0.08] shadow-2xl shadow-black/10 backdrop-blur-md [transform:translateZ(-48px)]" />

        <div className="relative rounded-[16px] border border-white/16 bg-white/[0.11] p-4 shadow-[0_34px_90px_-42px_rgba(0,0,0,0.65)] backdrop-blur-xl [transform-style:preserve-3d]">
          <div className="mb-4 flex items-center justify-between [transform:translateZ(34px)]">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/52">Preview</span>
            <span className="rounded-full bg-[#D9A441]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#D9A441]">Live Map</span>
          </div>
          <div className="rounded-[8px] bg-white p-5 shadow-[0_18px_48px_-34px_rgba(11,44,107,0.45)] [transform:translateZ(72px)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#F5F7FA]">
                <Radar size={19} className="text-[#0B2C6B]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0B2C6B]">{copy.result}</p>
                <p className="text-xs text-black/40">{copy.simulation}</p>
              </div>
            </div>
            <div className="grid grid-cols-[0.9fr_1.1fr] gap-3">
              <div className="rounded-[12px] bg-[#0B2C6B] p-4 text-white shadow-xl shadow-[#0B2C6B]/18">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/44">Overall</p>
                <p className="mt-2 text-4xl font-light">{SAMPLE_OVERALL}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#D9A441]">{copy.category}</p>
              </div>
              <div className="rounded-[12px] bg-[#F5F7FA] p-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/34">{copy.priority}</p>
                <p className="mt-2 text-lg font-light text-[#0B2C6B]">{samplePriority.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-black/46">{samplePriority.signal}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {sampleScores.slice(0, 3).map((item) => (
                <div key={item.label} className="rounded-[10px] bg-[#F5F7FA] p-3">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-black/34">{item.label}</p>
                  <p className="mt-1 text-lg font-light text-[#0B2C6B]">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function ReportPreview() {
  const locale = useLocale();
  const copy = COPY[locale];
  const sampleScores = SAMPLE_SCORES.map((item) => ({
    ...item,
    signal: locale === "en" ? SAMPLE_SIGNAL_EN[item.label] : item.signal,
  }));
  const samplePriority = [...sampleScores].sort((a, b) => a.value - b.value)[0];

  return (
    <div className="relative z-10 w-full rounded-[8px] border border-black/[0.04] bg-white p-5 shadow-[0_18px_58px_-46px_rgba(11,44,107,0.42)] md:p-7">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#D9A441]">{copy.sampleReport}</p>
          <h3 className="mt-2 text-2xl font-light text-[#0B2C6B]">{copy.priorityMap}</h3>
        </div>
        <BarChart3 className="text-[#0B2C6B]" size={26} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[12px] bg-[#0B2C6B] p-4 text-white">
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/38">Overall Score</p>
          <p className="mt-1 text-3xl font-light">{SAMPLE_OVERALL}/100</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#D9A441]">{copy.category}</p>
        </div>
        <div className="rounded-[12px] bg-[#F5F7FA] p-4">
          <p className="text-[9px] font-bold uppercase tracking-widest text-black/34">Lowest Signal</p>
          <p className="mt-1 text-2xl font-light text-[#0B2C6B]">{samplePriority.label}</p>
          <p className="mt-1 text-[10px] leading-relaxed text-black/46">{samplePriority.signal}</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-7 gap-1.5">
        {sampleScores.map((item) => (
          <div key={item.label} className="flex h-24 items-end rounded-xl bg-[#F5F7FA] px-1.5 pb-1.5">
            <div className={`w-full rounded-lg ${item.tone}`} style={{ height: `${Math.max(item.value, 24)}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1.5 text-center">
        {sampleScores.map((item) => (
          <span key={item.label} className="truncate text-[8px] font-bold uppercase tracking-wider text-black/34">
            {item.label.slice(0, 3)}
          </span>
        ))}
      </div>
      <div className="mt-5 space-y-3">
        {[
          [copy.assessmentCategory, copy.category],
          [copy.interventionPriority, samplePriority.label],
          [copy.reportOutput, copy.reportOutputValue],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between rounded-[10px] border border-black/[0.04] px-4 py-3">
            <span className="text-sm text-black/58">{label}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#0B2C6B]">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
