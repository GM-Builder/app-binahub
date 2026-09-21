import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DIMENSION_LIST } from "@/modules/tbos/config";
import type { TbosDbTeam } from "@/modules/tbos/api-client";
import type { TbosObservation, TeamScoreSummary } from "@/modules/tbos/types";
import { TbosTeamReports } from "./team-reports";

vi.mock("@/lib/api-fetch", () => ({ apiFetch: vi.fn() }));

const teams: TeamScoreSummary[] = [
  {
    teamId: "team-alpha",
    teamName: "Alpha",
    batch: "Batch 1",
    overallTeamScore: 4.1,
    missionScores: [],
    dimensionAverages: DIMENSION_LIST.map((dimension, index) => ({
      dimensionCode: dimension.code,
      dimensionName: dimension.name,
      score: 3 + (index % 3) * 0.5,
      observationCount: 1,
    })),
    strongestDimension: null,
    weakestDimension: null,
    totalObservations: 5,
  },
  {
    teamId: "team-beta",
    teamName: "Beta",
    batch: "Batch 2",
    overallTeamScore: 3.4,
    missionScores: [],
    dimensionAverages: DIMENSION_LIST.map((dimension) => ({
      dimensionCode: dimension.code,
      dimensionName: dimension.name,
      score: 3.4,
      observationCount: 1,
    })),
    strongestDimension: null,
    weakestDimension: null,
    totalObservations: 4,
  },
];

const roster: TbosDbTeam[] = [
  {
    id: "team-alpha",
    name: "Alpha",
    batch: "Batch 1",
    batchId: "batch-1",
    batchName: "Batch 1",
    members: [
      { id: "member-1", profile_id: null, member_name: "Alya", is_captain: true },
      { id: "member-2", profile_id: null, member_name: "Bima", is_captain: false },
    ],
    observation: null,
  },
  {
    id: "team-beta",
    name: "Beta",
    batch: "Batch 2",
    batchId: "batch-2",
    batchName: "Batch 2",
    members: [{ id: "member-3", profile_id: null, member_name: "Citra", is_captain: true }],
    observation: null,
  },
];

const observations: TbosObservation[] = [
  {
    id: "observation-alpha",
    teamId: "team-alpha",
    teamName: "Alpha",
    missionId: "mission-program",
    missionCode: "program_observation",
    missionName: "Observasi Kompetensi Program",
    profileId: "facilitator-dian",
    facilitatorName: "Dian Puspitasari",
    batch: "Batch 1",
    observedAt: "2026-09-21T08:15:00.000Z",
    submittedAt: "2026-09-21T08:20:00.000Z",
    status: "submitted",
    notes: "Tim membagi peran dengan jelas dan menjaga komunikasi selama aktivitas.",
    scores: [
      { dimensionCode: "goal_alignment", dimensionName: "Goal Alignment", levelValue: 4, levelLabel: "Effective" },
      { dimensionCode: "communication", dimensionName: "Communication", levelValue: 5, levelLabel: "Exemplary" },
    ],
  },
  {
    id: "observation-beta",
    teamId: "team-beta",
    teamName: "Beta",
    missionId: "mission-program",
    missionCode: "program_observation",
    missionName: "Observasi Kompetensi Program",
    profileId: "facilitator-fajar",
    facilitatorName: "Fajar Hidayat",
    batch: "Batch 2",
    observedAt: "2026-09-21T09:15:00.000Z",
    submittedAt: "2026-09-21T09:20:00.000Z",
    status: "locked",
    notes: null,
    scores: [{ dimensionCode: "adaptability", dimensionName: "Adaptability", levelValue: 3, levelLabel: "Functional" }],
  },
];

describe("TbosTeamReports", () => {
  it("shows the complete per-team report and all eight dimensions", () => {
    render(<TbosTeamReports teams={teams} roster={roster} observations={observations} />);

    expect(screen.getByRole("heading", { name: "Laporan per Tim" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Alpha" })).toBeInTheDocument();
    expect(screen.getAllByText("Alya")).toHaveLength(2);
    expect(screen.getByText("Bima")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: /dari 5/ })).toHaveLength(8);
    expect(screen.getByRole("button", { name: "Unduh PDF Tim" })).toBeEnabled();
    expect(screen.getByRole("heading", { name: "Evidence & catatan fasilitator" })).toBeInTheDocument();
    expect(screen.getByText("Dian Puspitasari")).toBeInTheDocument();
    expect(screen.getByText("Tim membagi peran dengan jelas dan menjaga komunikasi selama aktivitas.")).toBeInTheDocument();
    expect(screen.queryByText("Fajar Hidayat")).not.toBeInTheDocument();
  });

  it("switches the report when an admin selects another team", () => {
    render(<TbosTeamReports teams={teams} roster={roster} observations={observations} />);

    const selector = screen.getByRole("button", { name: /Beta/ });
    fireEvent.click(selector);

    const report = screen.getByRole("region", { name: "Beta" });
    expect(within(report).getByRole("heading", { name: "Beta" })).toBeInTheDocument();
    expect(within(report).getAllByText("Citra")).toHaveLength(2);
    expect(selector).toHaveAttribute("aria-pressed", "true");
    expect(within(report).getByText("Fajar Hidayat")).toBeInTheDocument();
    expect(within(report).getByText("Tidak ada catatan tambahan pada observasi ini.")).toBeInTheDocument();
    expect(within(report).queryByText("Dian Puspitasari")).not.toBeInTheDocument();
  });
});
