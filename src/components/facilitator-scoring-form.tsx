"use client";

import { Minus, Plus, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

import {
  masmindoCriteria,
  teamBuildingGames,
  type ScoringCriterionKey,
} from "@/lib/team-building";
import { supabase } from "@/lib/supabase";

const initialScores = masmindoCriteria.reduce(
  (acc, criterion) => ({ ...acc, [criterion.key]: 0 }),
  {} as Record<ScoringCriterionKey, number>,
);

type SavedSession = {
  id: string;
  companyName: string;
  teamName: string;
  gameName: string;
  sessionCount: number;
  sessionNumber: number;
  assessmentDate: string;
  facilitatorName: string;
};

export function FacilitatorScoringForm() {
  const [scores, setScores] = useState(initialScores);
  const [companyName, setCompanyName] = useState("PT Masmindo Dwi Area");
  const [teamName, setTeamName] = useState("Tim A");
  const [gameName, setGameName] = useState<(typeof teamBuildingGames)[number]>("Minefield Strategy");
  const [sessionCount, setSessionCount] = useState(3);
  const [sessionNumber, setSessionNumber] = useState(1);
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().slice(0, 10));
  const [facilitatorName, setFacilitatorName] = useState("Fasilitator A");
  const [savedSession, setSavedSession] = useState<SavedSession | null>(null);
  const [savingFormat, setSavingFormat] = useState(false);
  const [savingScore, setSavingScore] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const total = useMemo(
    () => Object.values(scores).reduce((sum, value) => sum + value, 0),
    [scores],
  );

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  };

  const updateScore = (key: ScoringCriterionKey, direction: 1 | -1) => {
    setScores((current) => ({
      ...current,
      [key]: current[key] + direction,
    }));
  };

  const handleCreateSession = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingFormat(true);
    setNotice("");
    setError("");

    const token = await getToken();
    if (!token) {
      setError("Sesi fasilitator tidak ditemukan.");
      setSavingFormat(false);
      return;
    }

    const response = await fetch("/api/facilitator/team-scores", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        companyName,
        teamName,
        gameName,
        sessionCount,
        sessionNumber,
        assessmentDate,
        facilitatorName,
      }),
    });
    const json = await response.json();

    if (!response.ok || !json.success) {
      setError(json.error || "Gagal membuat sesi penilaian.");
      setSavingFormat(false);
      return;
    }

    setSavedSession({
      id: json.score.id,
      companyName,
      teamName,
      gameName,
      sessionCount,
      sessionNumber,
      assessmentDate,
      facilitatorName,
    });
    setScores(initialScores);
    setNotice("Sesi penilaian tersimpan.");
    setSavingFormat(false);
  };

  const handleSaveScore = async () => {
    if (!savedSession) return;

    setSavingScore(true);
    setNotice("");
    setError("");

    const token = await getToken();
    if (!token) {
      setError("Sesi fasilitator tidak ditemukan.");
      setSavingScore(false);
      return;
    }

    const response = await fetch("/api/facilitator/team-scores", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: savedSession.id,
        scores,
      }),
    });
    const json = await response.json();

    if (!response.ok || !json.success) {
      setError(json.error || "Gagal menyimpan poin.");
      setSavingScore(false);
      return;
    }

    setNotice(`Poin tersimpan. Total ${json.score.total_score}.`);
    setSavingScore(false);
  };

  const resetSession = () => {
    setSavedSession(null);
    setScores(initialScores);
    setNotice("");
    setError("");
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
      <form onSubmit={handleCreateSession}>
        <section className="rounded-[20px] border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
          <div className="flex items-start justify-between gap-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">
              Format
            </p>
            {savedSession && (
              <button
                type="button"
                onClick={resetSession}
                className="inline-flex items-center gap-2 rounded-full border border-[#0B2C6B]/10 px-3 py-2 text-xs font-bold text-[#0B2C6B] transition hover:border-[#D9A441] hover:text-[#D9A441]"
              >
                <RotateCcw size={14} />
                Sesi Baru
              </button>
            )}
          </div>

          <div className="mt-4 grid gap-3">
            <Field disabled={Boolean(savedSession)} label="Nama Perusahaan" value={companyName} onChange={setCompanyName} />
            <Field disabled={Boolean(savedSession)} label="Nama Tim" value={teamName} onChange={setTeamName} />
            <SelectField
              disabled={Boolean(savedSession)}
              label="Nama Game"
              value={gameName}
              options={teamBuildingGames}
              onChange={(value) => setGameName(value as (typeof teamBuildingGames)[number])}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <NumberField disabled={Boolean(savedSession)} label="Jumlah Sesi" value={sessionCount} onChange={setSessionCount} />
              <NumberField disabled={Boolean(savedSession)} label="Sesi Ke" value={sessionNumber} onChange={setSessionNumber} />
            </div>
            <Field disabled={Boolean(savedSession)} label="Tanggal" value={assessmentDate} onChange={setAssessmentDate} type="date" />
            <Field disabled={Boolean(savedSession)} label="Nama Fasilitator" value={facilitatorName} onChange={setFacilitatorName} />
          </div>

          {!savedSession && (
            <button
              disabled={savingFormat}
              className="mt-5 h-12 rounded-[12px] bg-[#0B2C6B] px-5 text-sm font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingFormat ? "Menyimpan..." : "Simpan Format"}
            </button>
          )}
        </section>
      </form>

      <section className="rounded-[20px] border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
        {!savedSession ? (
          <div className="flex min-h-[420px] items-center justify-center rounded-[16px] bg-[#F5F7FA] p-8 text-center">
            <p className="max-w-sm text-sm font-semibold leading-relaxed text-[#0B2C6B]/56">
              Simpan format penilaian untuk membuka poin penilaian.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 rounded-[16px] bg-[#F5F7FA] p-4 sm:grid-cols-2 xl:grid-cols-5">
              <SummaryItem label="Nama Tim" value={savedSession.teamName} />
              <SummaryItem label="Nama Game" value={savedSession.gameName} />
              <SummaryItem label="Sesi Ke" value={`${savedSession.sessionNumber} / ${savedSession.sessionCount}`} />
              <SummaryItem label="Nama Perusahaan" value={savedSession.companyName} />
              <SummaryItem label="Tanggal" value={formatDate(savedSession.assessmentDate)} />
            </div>

            <div className="mt-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">
                  Penilaian
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#0B2C6B]">
                  Total {total}
                </h2>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {masmindoCriteria.map((criterion) => (
                <div
                  key={criterion.key}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-[16px] bg-[#F5F7FA] p-3 sm:grid-cols-[1fr_auto_auto_auto]"
                >
                  <p className="text-sm font-semibold text-[#0B2C6B]">{criterion.label}</p>
                  <button
                    type="button"
                    onClick={() => updateScore(criterion.key, -1)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0B2C6B] shadow-sm transition hover:bg-[#0B2C6B] hover:text-white"
                    aria-label={`Kurangi ${criterion.label}`}
                  >
                    <Minus size={18} />
                  </button>
                  <span className="flex h-10 min-w-12 items-center justify-center rounded-full bg-white px-4 text-base font-bold text-[#0B2C6B] shadow-sm">
                    {scores[criterion.key]}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateScore(criterion.key, 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D9A441] text-white shadow-sm transition hover:bg-[#0B2C6B]"
                    aria-label={`Tambah ${criterion.label}`}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSaveScore}
              disabled={savingScore}
              className="mt-5 h-12 rounded-[12px] bg-[#0B2C6B] px-5 text-sm font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingScore ? "Menyimpan..." : "Simpan Poin"}
            </button>
          </>
        )}

        {notice && (
          <p className="mt-4 rounded-[12px] bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {notice}
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-[12px] bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block rounded-[8px] bg-[#F5F7FA] px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0B2C6B]/45">
        {label}
      </p>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full bg-transparent text-sm font-semibold text-[#0B2C6B] outline-none disabled:cursor-not-allowed disabled:opacity-80"
        required
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block rounded-[8px] bg-[#F5F7FA] px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0B2C6B]/45">
        {label}
      </p>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full bg-transparent text-sm font-semibold text-[#0B2C6B] outline-none disabled:cursor-not-allowed disabled:opacity-80"
        required
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block rounded-[8px] bg-[#F5F7FA] px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0B2C6B]/45">
        {label}
      </p>
      <input
        type="number"
        min={1}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 w-full bg-transparent text-sm font-semibold text-[#0B2C6B] outline-none disabled:cursor-not-allowed disabled:opacity-80"
        required
      />
    </label>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#0B2C6B]/45">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-[#0B2C6B]">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
