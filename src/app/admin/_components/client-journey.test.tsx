import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { assessmentFixture } from "@/test/fixtures/assessment-admin";
import { clientJourneyFixture } from "@/test/fixtures/client-journey";
import { AssessmentBrief, ClientJourneyContext, ClientJourneyTimeline } from "./client-journey";
import type { JourneyEvent } from "../_lib/client-journey";

afterEach(cleanup);

describe("client journey presentation", () => {
  it("shows respondent context, not a new diagnosis or measured programme result", () => {
    render(<AssessmentBrief assessment={assessmentFixture({ target: "", challenge: "<img src=x onerror=alert(1)>" })} />);
    expect(screen.getByText(/Disampaikan oleh Nadia Putri/)).toBeVisible();
    expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeVisible();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByText("Tujuan yang diharapkan")).not.toBeInTheDocument();
    expect(screen.getByText(/bukan kesimpulan penyebab atau bukti dampak/)).toBeVisible();
  });

  it("explains missing context without inventing zero scores", () => {
    render(<AssessmentBrief assessment={null} />);
    expect(screen.getByText(/Konfirmasi kebutuhan saat konsultasi/)).toBeVisible();
    expect(screen.queryByText("0%")).not.toBeInTheDocument();
  });

  it("progressively shows a bounded timeline and makes coverage limitations explicit", () => {
    const events = Array.from({ length: 25 }, (_, index): JourneyEvent => ({ id: String(index), source: "Peluang", title: `Aktivitas ${index}`, description: "Konteks tersimpan", at: null }));
    render(<ClientJourneyTimeline events={events} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(12);
    expect(screen.getByText(/dapat belum mencakup seluruh aktivitas/)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Lihat 12 aktivitas berikutnya" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(24);
    fireEvent.click(screen.getByRole("button", { name: "Lihat 1 aktivitas berikutnya" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(25);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("does not call an API while opening context and history", () => {
    const { data, account } = clientJourneyFixture();
    render(<ClientJourneyContext data={data} accountId={account.id} />);
    expect(screen.getByRole("region", { name: "Brief kebutuhan" })).toBeVisible();
    const summary = screen.getByText("Lihat perjalanan klien");
    fireEvent.click(summary);
    expect(summary.closest("details")).toHaveAttribute("open");
    expect(screen.getByText("Pengiriman hasil dicatat")).toBeVisible();
    expect(screen.getByRole("link", { name: "Buka daftar assessment" })).toHaveAttribute("href", "/admin/assessments");
  });
});
