import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ProposalBook, type ProposalView } from "./proposal-book";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
  useReducedMotion: () => true,
  motion: { article: ({ children, className, "aria-label": label }: { children: ReactNode; className: string; "aria-label": string }) => <article className={className} aria-label={label}>{children}</article> },
}));
afterEach(cleanup);
const view: ProposalView = { company: "Aurora", contactName: "Nadia", challenge: "Koordinasi tim", issuedAt: "2026-10-05T03:00:00Z", locale: "id", proposal: {
  documentKind: "commercial", proposalType: "standard", proposedProgram: "Pengembangan tim",
  opening: "Proposal Standar untuk kebutuhan tim.", scope: ["Komunikasi tim"], timeline: "Durasi katalog: 1 hari.",
  investmentNote: "Harga dasar katalog: Rp 25.000.000 untuk 1 hari pelaksanaan.",
} };

describe("client proposal book", () => {
  it.each(["standard", "custom"] as const)("does not reveal the %s classification", (proposalType) => {
    render(<ProposalBook view={{ ...view, proposal: { ...view.proposal, proposalType } }} downloadUrl="#test" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Proposal Solusi");
    expect(document.body.textContent).not.toMatch(/proposal standar|proposal custom/i);
  });
  it("cleans legacy investment wording while preserving the amount and duration", () => {
    render(<ProposalBook view={view} downloadUrl="#test" />);
    fireEvent.click(screen.getByRole("button", { name: "Investasi, 5 / 6" }));
    expect(screen.getByText("Investasi program: Rp 25.000.000 untuk 1 hari pelaksanaan.")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/katalog|harga dasar|snapshot/i);
  });
  it("uses program scope rather than catalog terminology", () => {
    render(<ProposalBook view={view} downloadUrl="#test" />);
    fireEvent.click(screen.getByRole("button", { name: "Pelaksanaan, 4 / 6" }));
    expect(screen.getByRole("heading", { name: "Cakupan program" })).toBeInTheDocument();
    expect(document.body.textContent).toContain("Durasi program: 1 hari.");
    expect(document.body.textContent).not.toMatch(/katalog|standar/i);
  });
  it("keeps the English title neutral", () => {
    render(<ProposalBook view={{ ...view, locale: "en" }} downloadUrl="#test" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Solution Proposal");
  });
});
