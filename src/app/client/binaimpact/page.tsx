"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ClientAuthGate } from "@/components/client-auth-gate";

const ratingItems = [
  "Program ini merupakan pengalaman yang menyenangkan & menambah wawasan",
  "Program ini bermanfaat & sesuai dengan kebutuhan saya maupun organisasi saya",
  "Saya merasa program ini layak untuk direkomendasikan kepada orang lain.",
  "Saya sudah dan akan terus mempraktekkan apa yang telah saja pelajari di dalam pelatihan ini.",
  "Pemateri dapat membawakan topik dengan baik, efektif, & menarik",
];

export default function BinaImpactPage() {
  return (
    <ClientAuthGate>
      <AppShell role="client" eyebrow="BinaImpact" title="Evaluasi Program">
        <LevelOneEvaluationForm />
      </AppShell>
    </ClientAuthGate>
  );
}

function LevelOneEvaluationForm() {
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        setSubmitted(false);
        setError("");

        const form = new FormData(event.currentTarget);
        const response = await fetch("/api/binaimpact/level1", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participantName: String(form.get("participantName") || ""),
            organizationName: String(form.get("organizationName") || ""),
            assessmentDate: String(form.get("assessmentDate") || ""),
            email: String(form.get("email") || ""),
            ratings: ratingItems.map((_, index) => Number(form.get(`rating-${index}`))),
            mostImportantLearning: String(form.get("mostImportantLearning") || ""),
            mostInterestingPart: String(form.get("mostInterestingPart") || ""),
            generalFeedback: String(form.get("generalFeedback") || ""),
          }),
        });
        const json = await response.json();

        if (!response.ok || !json.success) {
          setError(json.error || "Evaluasi gagal disimpan.");
          setSaving(false);
          return;
        }

        setSubmitted(true);
        setSaving(false);
      }}
      className="mx-auto grid w-full max-w-3xl gap-4"
    >
      <section className="rounded-[18px] border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D9A441]">
          Lembar Evaluasi Program BinaHub
        </p>
        <div className="mt-5 grid gap-3">
          <Field label="Nama" name="participantName" required />
          <Field label="Nama Organisasi" name="organizationName" required />
          <Field label="Tanggal" name="assessmentDate" type="date" required />
          <Field label="Email" name="email" type="email" required className="md:col-span-2" />
        </div>
      </section>

      <section className="rounded-[18px] border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D9A441]">
          Lembar Evaluasi Program
        </p>
        <div className="mt-5 grid gap-3">
          {ratingItems.map((item, index) => (
            <RatingRow key={item} label={item} name={`rating-${index}`} />
          ))}
        </div>
      </section>

      <section className="rounded-[18px] border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
        <div className="grid gap-3">
          <TextArea name="mostImportantLearning" label="Apa hal terpenting yang Anda pelajari dari program ini?" required />
          <TextArea name="mostInterestingPart" label="Apa yang paling menarik dari Program ini?" required />
          <TextArea name="generalFeedback" label="Adakah komentar umum maupun saran/masukan terhadap program ini?" />
        </div>
        {submitted && (
          <p className="mt-5 rounded-[12px] bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            Evaluasi tersimpan.
          </p>
        )}
        {error && (
          <p className="mt-5 rounded-[12px] bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}
        <button
          disabled={saving}
          className="mt-5 h-12 w-full rounded-[12px] bg-[#0B2C6B] px-5 text-sm font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {saving ? "Menyimpan..." : "Simpan Evaluasi"}
        </button>
      </section>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  className = "",
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`block rounded-[8px] bg-[#F5F7FA] px-4 py-3 ${className}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0B2C6B]/45">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </p>
      <input
        name={name}
        type={type}
        required={required}
        className="mt-1 w-full bg-transparent text-sm font-semibold text-[#0B2C6B] outline-none"
      />
    </label>
  );
}

function RatingRow({ label, name }: { label: string; name: string }) {
  return (
    <fieldset className="rounded-[8px] bg-[#F5F7FA] p-4">
      <legend className="pt-10 text-sm font-semibold leading-relaxed text-[#0B2C6B]">
        {label}
        <span className="ml-1 text-red-500">*</span>
      </legend>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <span className="text-xs font-semibold text-[#0B2C6B]/58">Sangat Tidak Setuju</span>
        <div className="flex justify-center gap-2">
        {[1, 2, 3, 4].map((value) => (
          <label
            key={value}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white text-sm font-bold text-[#0B2C6B] shadow-sm transition has-[:checked]:bg-[#0B2C6B] has-[:checked]:text-white"
          >
            <input className="sr-only" type="radio" name={name} value={value} required />
            {value}
          </label>
        ))}
        </div>
        <span className="text-left text-xs font-semibold text-[#0B2C6B]/58 sm:text-right">Sangat Setuju</span>
      </div>
    </fieldset>
  );
}

function TextArea({ name, label, required = false }: { name: string; label: string; required?: boolean }) {
  return (
    <label className="block rounded-[8px] bg-[#F5F7FA] px-4 py-3">
      <p className="text-sm font-semibold text-[#0B2C6B]">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </p>
      <textarea
        name={name}
        required={required}
        rows={4}
        className="mt-3 w-full resize-none rounded-[12px] border border-[#0B2C6B]/10 bg-white p-3 text-sm font-medium text-[#0B2C6B] outline-none focus:border-[#D9A441]"
      />
    </label>
  );
}
