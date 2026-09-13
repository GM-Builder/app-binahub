import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ObservabilityPanel } from "./observability-panel";

afterEach(cleanup);
describe("admin runtime observability", () => {
  it("shows a permanent log panel when the sink has no errors", async () => {
    const onAction = vi.fn().mockResolvedValue({ success: true, openCount: 0, events: [] });
    render(<ObservabilityPanel onAction={onAction} />);
    await waitFor(() => expect(screen.getByText("Belum ada error tercatat.")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Uji penyimpanan log" })).toBeInTheDocument();
  });
  it("shows a fixed alert for unseen errors even outside the log page", async () => {
    render(<ObservabilityPanel compact onAction={vi.fn().mockResolvedValue({ success: true, openCount: 2, events: [] })} />);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("2 kelompok error"));
    expect(screen.getByRole("link", { name: "Buka log" })).toHaveAttribute("href", "/admin/operations#runtime-observability");
  });
  it("does not display a green status when the monitoring API fails", async () => {
    render(<ObservabilityPanel compact onAction={vi.fn().mockRejectedValue(new Error("offline"))} />);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("belum dapat dimuat"));
  });
});
