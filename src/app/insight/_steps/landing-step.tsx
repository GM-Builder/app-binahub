"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { DIMENSIONS } from "../questions";
import { PixelIcon } from "@/components/pixel-icon";
import { DiagnosticPreview, ReportPreview } from "./landing-preview";
import { useLocale } from "@/i18n/use-locale";

interface LandingStepProps {
  onStart: () => void;
}

const DIMENSION_COPY: Record<string, string> = {
  Insights: "Menemukan akar masalah performa, bukan sekadar gejala di permukaan.",
  Lab: "Mengukur kesiapan kompetensi dan kemampuan problem solving tim.",
  Coach: "Mengidentifikasi bottleneck kepemimpinan, feedback, dan growth mindset.",
  Play: "Membaca energi, motivasi, engagement, dan kualitas koneksi tim.",
  Academy: "Menilai struktur learning path dan budaya belajar organisasi.",
  Works: "Memetakan kejelasan KPI, proses kerja, dan disiplin eksekusi.",
  Impact: "Melihat bukti dampak program dan ROI pengembangan SDM.",
};

const DIMENSION_COPY_EN: Record<string, string> = {
  Insights: "Find the root causes of performance issues, not just surface-level symptoms.",
  Lab: "Measure competency readiness and team problem-solving capability.",
  Coach: "Identify leadership, feedback, and growth mindset bottlenecks.",
  Play: "Read team energy, motivation, engagement, and connection quality.",
  Academy: "Assess learning path structure and organizational learning culture.",
  Works: "Map KPI clarity, work processes, and execution discipline.",
  Impact: "See evidence of program impact and people-development ROI.",
};

const COPY = {
  id: {
    heroTitle: "Diagnosis performa",
    heroHighlight: "berbasis data.",
    heroBody:
      "Diagnostik mendalam berbasis data untuk menemukan blind spot performa, membaca kesiapan transformasi, dan menentukan prioritas pengembangan tim.",
    start: "Mulai Diagnostik",
    preview: "Lihat Preview Hasil",
    stats: ["5-7 Menit", "49 Indikator", "7 Dimensi"],
    productEyebrow: "Product Experience",
    productTitle: "Apa yang akan Anda dapatkan dari",
    productBody:
      "BinaInsight membantu organisasi melihat performa secara lebih jernih: apa yang sudah kuat, apa yang menghambat, dan area mana yang perlu diprioritaskan.",
    benefits: [
      {
        title: "Skor 7 dimensi yang presisi",
        desc: "Insights, Lab, Coach, Play, Academy, Works, dan Impact dihitung dari 49 indikator.",
      },
      {
        title: "Kategori kesiapan organisasi",
        desc: "Hasil diklasifikasikan menjadi Pemula, Berkembang, Profesional, atau Unggulan.",
      },
      {
        title: "Rekomendasi prioritas",
        desc: "Laporan menampilkan area terendah, analisis singkat, dan aksi pengembangan yang relevan.",
      },
    ],
    spectrumTitle: "Pilih fokus pengukuran organisasi.",
    spectrumBody:
      "Tujuh area ini dibaca sebagai satu spektrum. Pilih salah satu dimensi untuk melihat sinyal yang ingin dipahami sebelum menentukan prioritas intervensi.",
    spectrumTags: ["Diagnose root cause", "Map capability gaps", "Prioritize intervention"],
    ctaMeta: "5-7 menit - 49 indikator - laporan terkirim",
    ctaTitle: "Dalam 7 menit, temukan area yang paling",
    ctaHighlight: "menghambat performa tim.",
  },
  en: {
    heroTitle: "Data-driven",
    heroHighlight: "performance diagnostic.",
    heroBody:
      "A deep data-informed diagnostic to uncover performance blind spots, read transformation readiness, and define team development priorities.",
    start: "Start Diagnostic",
    preview: "View Report Preview",
    stats: ["5-7 Minutes", "49 Indicators", "7 Dimensions"],
    productEyebrow: "Product Experience",
    productTitle: "What will you get from",
    productBody:
      "BinaInsight helps organizations see performance more clearly: what is already strong, what slows progress, and which areas deserve priority.",
    benefits: [
      {
        title: "Precise 7-dimension score",
        desc: "Insights, Lab, Coach, Play, Academy, Works, and Impact are calculated from 49 indicators.",
      },
      {
        title: "Organizational readiness category",
        desc: "Results are classified as Beginner, Developing, Professional, or Excellent.",
      },
      {
        title: "Priority recommendations",
        desc: "The report highlights the lowest areas, brief analysis, and relevant development actions.",
      },
    ],
    spectrumTitle: "Choose the organization's measurement focus.",
    spectrumBody:
      "These seven areas are read as one spectrum. Select a dimension to see the signals worth understanding before setting intervention priorities.",
    spectrumTags: ["Diagnose root cause", "Map capability gaps", "Prioritize intervention"],
    ctaMeta: "5-7 minutes - 49 indicators - report delivered",
    ctaTitle: "In 7 minutes, find the area that most",
    ctaHighlight: "limits team performance.",
  },
};

type DimensionIconType = "insights" | "lab" | "coach" | "play" | "academy" | "works" | "impact";

export function LandingStep({ onStart }: LandingStepProps) {
  const locale = useLocale();
  const copy = COPY[locale];
  const dimensionCopy = locale === "en" ? DIMENSION_COPY_EN : DIMENSION_COPY;
  const [activeDimension, setActiveDimension] = useState(0);
  const activeName = DIMENSIONS[activeDimension];

  return (
    <motion.div
      key="landing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20, filter: "blur(4px)" }}
      transition={{ duration: 0.6 }}
      className="w-full flex flex-col pt-20 md:pt-26"
    >
      {/* Hero */}
      <section className="w-full px-4 mb-12">
        <div className="relative flex min-h-[620px] w-full items-center justify-center overflow-hidden rounded-[16px] border border-black/[0.03] shadow-[0_24px_78px_-58px_rgba(11,44,107,0.52)] md:h-[78svh] md:rounded-[18px]">
          <div className="absolute inset-0 w-full h-full">
            <Image
              src="/asset/bg-insight.png"
              alt="Team Collaboration"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center scale-105 saturate-[0.94] brightness-[1.12]"
            />
            <div className="absolute inset-0 bg-[#061A3A]/22 mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#071A33]/82 via-[#0B2C6B]/38 to-[#0B2C6B]/6" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/24 via-transparent to-black/5" />
            <div className="absolute left-[58%] top-[30%] h-56 w-96 bg-[#D9A63A]/8 blur-3xl" />
          </div>

          <div className="relative z-10 grid w-full items-center justify-items-start gap-8 px-6 py-14 md:grid-cols-[60%_40%] md:px-12 lg:px-14 xl:px-16">
            <div className="text-left w-full max-w-[980px]">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/18 text-[11px] uppercase tracking-widest font-medium mb-8 text-white/84 bg-white/12">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D9A441] animate-pulse" />
                BinaInsight Diagnostic
              </div>
              <h1 className="max-w-4xl text-4xl sm:text-5xl md:text-6xl lg:text-[4.45rem] xl:text-[4.9rem] font-light tracking-tight leading-[1.04] mb-6 text-white">
                {copy.heroTitle} <br />{" "}
                <span className="text-[#D9A441] font-light italic">{copy.heroHighlight}</span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-white/70 max-w-xl mb-10 leading-relaxed">
                {copy.heroBody}
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10">
                <button
                  onClick={onStart}
                  className="w-full sm:w-auto group relative inline-flex items-center justify-center h-14 md:h-16 px-10 md:px-12 bg-[#0B2C6B] text-[#D9A441] rounded-full text-[13px] font-bold tracking-widest hover:bg-[#08245A] transition-all overflow-hidden uppercase shadow-xl shadow-[#0B2C6B]/30 border border-[#D9A441]/20"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    {copy.start}
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
                <a
                  href="#about-insight"
                  className="rounded-full border border-white/18 px-6 py-4 text-white/72 hover:text-white hover:bg-white/10 text-[11px] font-bold tracking-widest uppercase transition-colors"
                >
                  {copy.preview}
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-white/54 text-[10px] font-medium tracking-[0.2em] uppercase border-t border-white/10 pt-8">
                <span>{copy.stats[0]}</span>
                <div className="w-1 h-1 rounded-full bg-white/20" />
                <span>{copy.stats[1]}</span>
                <div className="w-1 h-1 rounded-full bg-white/20" />
                <span>{copy.stats[2]}</span>
              </div>
            </div>

            <DiagnosticPreview />
          </div>
        </div>
      </section>

      {/* Why BinaInsight */}
      <section id="about-insight" className="py-12 md:py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-[0.9fr_1.1fr] gap-16 items-center">
          <div>
            <div className="text-[10px] font-bold tracking-[0.3em] text-[#D9A441] uppercase mb-4">
              {copy.productEyebrow}
            </div>
            <h2 className="text-3xl md:text-5xl font-light leading-tight mb-8 text-[#0B2C6B]">
              {copy.productTitle} <span className="italic">BinaInsight?</span>
            </h2>
            <p className="text-black/58 text-lg leading-relaxed mb-10 font-light">
              {copy.productBody}
            </p>
            <div className="space-y-7">
              {copy.benefits.map((item, i) => (
                <div key={i} className="flex gap-5 group">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] border border-black/[0.03] bg-[#F5F7FA] transition-all duration-300 group-hover:bg-[#0B2C6B] group-hover:text-white">
                    <Check size={20} className={i === 0 ? "text-[#D9A441]" : ""} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm tracking-wide text-black uppercase mb-1">
                      {item.title}
                    </h4>
                    <p className="text-sm text-black/48 font-light leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="group relative flex aspect-[4/4.5] items-center justify-center overflow-hidden rounded-[16px] border border-black/[0.05] bg-[#F5F7FA] p-6 md:p-10">
              <Image
                src="/asset/Play.png"
                alt="Team Analysis"
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover opacity-18 grayscale transition-all duration-700 group-hover:scale-105 group-hover:opacity-24 group-hover:grayscale-0"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-white/86 via-white/64 to-[#0B2C6B]/10" />
              <ReportPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Measurement Spectrum */}
      <section className="relative left-1/2 mb-12 w-screen -translate-x-1/2 bg-[#071A33] text-white md:mb-16 lg:mb-20">
          <div className="relative overflow-hidden px-6 py-12 md:px-10 lg:flex lg:min-h-[460px] lg:items-center lg:px-16 lg:py-14 xl:min-h-[500px] xl:px-20">
            <Image
              src="/insight-spectrum-bg.png"
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-70 saturate-[0.96] brightness-[1.06]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,26,51,0.32)_0%,rgba(7,26,51,0.18)_48%,rgba(7,26,51,0.04)_100%)]" />
            <div className="absolute inset-0 bg-[#071A33]/2" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-[#D9A441]/40" />

            <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D9A441]">7 Dimensions</p>
                <h2 className="mt-5 max-w-3xl text-4xl font-light leading-[1.02] tracking-[-0.05em] md:text-6xl lg:text-[4.2rem]">
                  {copy.spectrumTitle}
                </h2>
                <p className="mt-6 max-w-xl text-sm font-light leading-relaxed text-white/62 md:text-base">
                  {copy.spectrumBody}
                </p>

                <div className="mt-8 hidden items-center gap-4 lg:flex">
                  <span className="font-mono text-sm text-[#D9A441]">{String(activeDimension + 1).padStart(2, "0")}</span>
                  <div className="h-px flex-1 bg-white/14">
                    <motion.div
                      className="h-px bg-[#D9A441]"
                      animate={{ width: `${((activeDimension + 1) / DIMENSIONS.length) * 100}%` }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                    />
                  </div>
                  <span className="font-mono text-sm text-white/32">07</span>
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="grid min-h-[330px] grid-cols-[0.34fr_1fr] border-y border-white/14">
                  <div className="border-r border-white/14 py-7 pr-8">
                    <div className="space-y-0">
                      {DIMENSIONS.map((dim, index) => (
                        <button
                          key={dim}
                          type="button"
                          onClick={() => setActiveDimension(index)}
                          className={`group flex w-full items-center justify-between border-b border-white/10 py-4 text-left transition-colors last:border-b-0 ${
                            activeDimension === index ? "text-[#D9A441]" : "text-white/42 hover:text-white/72"
                          }`}
                        >
                          <span className="text-sm font-semibold tracking-[-0.01em]">{dim}</span>
                          <span className="font-mono text-xs">{String(index + 1).padStart(2, "0")}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center py-7 pl-10">
                    <motion.div
                      key={activeName}
                      initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="mb-8 flex h-16 w-16 items-center justify-center">
                        <PixelIcon type={activeName.toLowerCase() as DimensionIconType} size={52} />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D9A441]">
                        {String(activeDimension + 1).padStart(2, "0")} / 07
                      </p>
                      <h3 className="mt-4 text-6xl font-light tracking-[-0.055em] text-white xl:text-7xl">{activeName}</h3>
                      <p className="mt-6 max-w-xl text-xl font-light leading-[1.65] text-white/68">
                        {dimensionCopy[activeName]}
                      </p>
                    </motion.div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 border-y border-white/12 text-[10px] font-bold uppercase tracking-[0.18em] text-white/42">
                  <span className="border-r border-white/12 py-4">{copy.spectrumTags[0]}</span>
                  <span className="border-r border-white/12 px-5 py-4">{copy.spectrumTags[1]}</span>
                  <span className="px-5 py-4">{copy.spectrumTags[2]}</span>
                </div>
              </div>

              <div className="lg:hidden">
                <div className="mb-6 flex snap-x gap-3 overflow-x-auto pb-2">
                  {DIMENSIONS.map((dim, index) => (
                    <button
                      key={dim}
                      type="button"
                      onClick={() => setActiveDimension(index)}
                      className={`snap-start whitespace-nowrap border-b px-1 pb-2 text-sm font-semibold transition-colors ${
                        activeDimension === index ? "border-[#D9A441] text-[#D9A441]" : "border-white/18 text-white/50"
                      }`}
                    >
                      {dim}
                    </button>
                  ))}
                </div>
                <motion.div
                  key={activeName}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  className="border-y border-white/12 py-7"
                >
                  <div className="mb-6 flex items-center gap-4">
                    <span className="font-mono text-sm text-[#D9A441]">{String(activeDimension + 1).padStart(2, "0")} / 07</span>
                    <PixelIcon type={activeName.toLowerCase() as DimensionIconType} size={40} />
                  </div>
                  <h3 className="text-4xl font-light tracking-[-0.04em] text-white">{activeName}</h3>
                  <p className="mt-4 text-sm font-light leading-relaxed text-white/68">{dimensionCopy[activeName]}</p>
                </motion.div>
              </div>
              {/* <div className="divide-y divide-white/12 border-y border-white/12 lg:hidden">
                {DIMENSIONS.map((dim, index) => (
                  <motion.div
                    key={dim}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-20% 0px" }}
                    transition={{ duration: 0.42, delay: index * 0.035 }}
                    className="grid gap-4 py-6 sm:grid-cols-[80px_1fr]"
                  >
                    <div className="flex items-center gap-4 sm:block">
                      <span className="font-mono text-sm text-[#D9A441]">{String(index + 1).padStart(2, "0")}</span>
                      <PixelIcon type={dim.toLowerCase() as DimensionIconType} size={34} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-light tracking-[-0.04em] text-white">{dim}</h3>
                      <p className="mt-3 text-sm font-light leading-relaxed text-white/62">{DIMENSION_COPY[dim]}</p>
                    </div>
                  </motion.div>
                ))}
              </div> */}
            </div>
          </div>
      </section>

      {/* Focused CTA Section */}
      <section className="w-full px-4 md:px-8 mb-16">
        <div className="relative flex w-full flex-col items-center justify-between gap-8 overflow-hidden rounded-[16px] border border-white/5 bg-[#0B2C6B] px-6 py-10 shadow-[0_24px_70px_-52px_rgba(11,44,107,0.68)] md:h-48 md:flex-row md:px-16">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
          </div>
          <div className="absolute top-1/2 left-0 w-32 h-px bg-gradient-to-r from-transparent to-[#D9A441]/50" />
          <div className="absolute top-1/2 right-0 w-32 h-px bg-gradient-to-l from-transparent to-[#D9A441]/50" />

          <div className="relative z-10">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#D9A441]">
              {copy.ctaMeta}
            </p>
            <h3 className="text-2xl md:text-4xl font-light text-white tracking-tight">
              {copy.ctaTitle} <span className="text-[#D9A441] font-bold italic">{copy.ctaHighlight}</span>
            </h3>
          </div>

          <button
            onClick={onStart}
            className="relative z-10 group flex items-center gap-4 px-8 h-14 bg-white text-[#0B2C6B] rounded-full text-xs font-bold tracking-widest hover:bg-[#D9A441] transition-all shadow-xl"
          >
            {copy.start}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>
    </motion.div>
  );
}
