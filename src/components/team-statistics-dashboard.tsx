"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useMemo, useState } from "react";

import {
  demoTeamScores,
  getTotalScore,
  masmindoCriteria,
  type TeamScore,
} from "@/lib/team-building";
import { supabase } from "@/lib/supabase";

const colors = ["#0B2C6B", "#D9A441", "#4A6FA5", "#7C8DA7", "#B8A15A", "#233B63"];

export function TeamStatisticsDashboard() {
  const [items, setItems] = useState<TeamScore[]>(demoTeamScores);
  const [team, setTeam] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadScores() {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch("/api/facilitator/team-scores", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json();

      if (alive && response.ok && json.success && json.scores.length > 0) {
        setItems(json.scores.map(mapRowToTeamScore));
      }
      if (alive) setLoading(false);
    }

    void loadScores();
    return () => {
      alive = false;
    };
  }, []);

  const selectedTeams = useMemo(
    () => (team === "all" ? items : items.filter((item) => item.team === team)),
    [items, team],
  );

  const teamOptions = useMemo(
    () => Array.from(new Set(items.map((item) => item.team))).filter(Boolean),
    [items],
  );

  const rankingData = useMemo(() => aggregateTeams(items), [items]);

  const criteriaData = masmindoCriteria.map((criterion) => ({
    name: criterion.label,
    score: selectedTeams.length
      ? Math.round(
          selectedTeams.reduce((sum, item) => sum + item.scores[criterion.key], 0) /
            selectedTeams.length,
        )
      : 0,
  }));

  const leader = rankingData.reduce(
    (best, item) => (item.total > best.total ? item : best),
    { team: "-", total: 0 },
  );

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">
            Statistik
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#0B2C6B]">
            Teambuilding Masmindo
          </h2>
        </div>
        <select
          value={team}
          onChange={(event) => setTeam(event.target.value)}
          className="h-11 rounded-[12px] border border-[#0B2C6B]/10 bg-white px-4 text-sm font-semibold text-[#0B2C6B]"
        >
          <option value="all">Semua Tim</option>
          {teamOptions.map((teamName) => (
            <option key={teamName} value={teamName}>
              {teamName}
            </option>
          ))}
        </select>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Tim Unggul" value={leader.team} />
        <Metric label="Total Tertinggi" value={String(leader.total)} />
        <Metric label={loading ? "Memuat" : "Tim Dinilai"} value={String(selectedTeams.length)} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartPanel title="Perbandingan Total Tim">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={rankingData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="team" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" radius={[10, 10, 0, 0]} fill="#0B2C6B" />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Profil Kriteria">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={criteriaData} dataKey="score" nameKey="name" innerRadius={58} outerRadius={96}>
                {criteriaData.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      <section className="grid gap-3">
        {selectedTeams.map((item, index) => (
          <TeamSummary key={`${item.team}-${item.game}-${item.date}-${index}`} item={item} />
        ))}
      </section>
    </div>
  );
}

type ScoreRow = {
  id?: string;
  company_name: string;
  team_name: string;
  game_name: string;
  session_count: number;
  assessment_date: string;
  facilitator_name: string;
  scores: TeamScore["scores"];
};

function mapRowToTeamScore(row: ScoreRow): TeamScore {
  return {
    company: row.company_name,
    team: row.team_name,
    game: row.game_name,
    sessionCount: row.session_count,
    date: row.assessment_date,
    facilitator: row.facilitator_name,
    scores: row.scores,
  };
}

function aggregateTeams(items: TeamScore[]) {
  const map = new Map<string, { team: string; total: number }>();

  items.forEach((item) => {
    const existing = map.get(item.team) || { team: item.team, total: 0 };
    existing.total += getTotalScore(item.scores);
    map.set(item.team, existing);
  });

  return Array.from(map.values());
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D9A441]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#0B2C6B]">{value}</p>
    </div>
  );
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[20px] border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
      <h3 className="mb-4 text-base font-semibold text-[#0B2C6B]">{title}</h3>
      {children}
    </section>
  );
}

function TeamSummary({ item }: { item: TeamScore }) {
  const sorted = masmindoCriteria
    .map((criterion) => ({ label: criterion.label, score: item.scores[criterion.key] }))
    .sort((a, b) => b.score - a.score);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  return (
    <article className="rounded-[18px] border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-[#0B2C6B]">{item.team}</p>
          <p className="mt-1 text-sm text-[#4A4C54]/68">
            {item.facilitator} · {item.game}
          </p>
        </div>
        <p className="text-2xl font-semibold text-[#0B2C6B]">{getTotalScore(item.scores)}</p>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <p className="rounded-[12px] bg-[#F5F7FA] px-4 py-3 text-sm text-[#0B2C6B]">
          Kekuatan: <strong>{strongest.label}</strong>
        </p>
        <p className="rounded-[12px] bg-[#F5F7FA] px-4 py-3 text-sm text-[#0B2C6B]">
          Perlu diperkuat: <strong>{weakest.label}</strong>
        </p>
      </div>
    </article>
  );
}
