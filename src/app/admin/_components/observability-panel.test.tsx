import {
  cleanup,
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ObservabilityPanel } from "./observability-panel";
import { syntheticServiceHealth } from "@/test/fixtures/service-health";

const action = (state = "healthy", count = 0) =>
  vi.fn(async (url: string) =>
    url.endsWith("service-health")
      ? syntheticServiceHealth(state)
      : { success: true, openCount: count, events: [] },
  );

afterEach(cleanup);
describe("admin runtime observability", () => {
  it("shows a permanent log panel when the sink has no errors", async () => {
    const onAction = action();
    render(<ObservabilityPanel onAction={onAction} />);
    await waitFor(() =>
      expect(screen.getByText("Belum ada error tercatat.")).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("button", { name: "Uji penyimpanan log" }),
    ).toBeInTheDocument();
  });
  it("shows a fixed alert for unseen errors even outside the log page", async () => {
    render(<ObservabilityPanel compact onAction={action("healthy", 2)} />);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("2 kelompok error"),
    );
    expect(screen.getByRole("link", { name: "Buka log" })).toHaveAttribute(
      "href",
      "/admin/operations#runtime-observability",
    );
  });
  it("does not display a green status when the monitoring API fails", async () => {
    render(
      <ObservabilityPanel
        compact
        onAction={vi.fn().mockRejectedValue(new Error("offline"))}
      />,
    );
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("belum dapat dimuat"),
    );
  });
  it("shows missing evidence rather than a false zero-count success", async () => {
    render(<ObservabilityPanel onAction={action("setup_required")} />);
    await waitFor(() =>
      expect(
        screen.getByText(/Periksa deployment API dan SQL81/),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText("Siap dibaca")).not.toBeInTheDocument();
  });
  it("shows queue alerts globally without treating never-seen worker as a confirmed outage", async () => {
    const { unmount } = render(
      <ObservabilityPanel compact onAction={action("attention")} />,
    );
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "pekerjaan terlambat",
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Tutup notifikasi" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    unmount();
    render(<ObservabilityPanel onAction={action("never_seen")} />);
    await waitFor(() =>
      expect(
        screen.getByText("Belum ada aktivitas tercatat"),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByText(/Jadwal pemulihan masih menunggu/),
    ).toBeInTheDocument();
  });
  it("removes old ready data if a later refresh fails while leaving valid logs usable", async () => {
    let failed = false;
    const onAction = vi.fn(async (url: string) => {
      if (url.endsWith("service-health")) {
        if (failed) throw new Error("PRIVATE_DETAIL");
        return syntheticServiceHealth();
      }
      return { success: true, openCount: 0, events: [] };
    });
    render(<ObservabilityPanel onAction={onAction} />);
    await waitFor(() =>
      expect(screen.getByText("Siap dibaca")).toBeInTheDocument(),
    );
    failed = true;
    fireEvent.click(
      screen.getByRole("button", { name: "Perbarui status & log" }),
    );
    await waitFor(() =>
      expect(screen.queryByText("Siap dibaca")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Belum ada error tercatat.")).toBeInTheDocument();
    expect(screen.queryByText("PRIVATE_DETAIL")).not.toBeInTheDocument();
  });
  it("ignores late responses from an old mount and aborts its requests", async () => {
    let resolveOld: (value: unknown) => void = () => {};
    let oldSignal: AbortSignal | undefined;
    const oldAction = vi.fn((url: string, init?: RequestInit) => {
      if (url.endsWith("service-health")) {
        oldSignal = init?.signal as AbortSignal;
        return new Promise<unknown>((resolve) => {
          resolveOld = resolve;
        });
      }
      return Promise.resolve({ success: true, openCount: 0, events: [] });
    });
    const { rerender } = render(<ObservabilityPanel onAction={oldAction} />);
    await waitFor(() => expect(oldAction).toHaveBeenCalledTimes(2));
    rerender(<ObservabilityPanel onAction={action()} />);
    await waitFor(() =>
      expect(screen.getByText("Siap dibaca")).toBeInTheDocument(),
    );
    expect(oldSignal?.aborted).toBe(true);
    await act(async () => resolveOld(syntheticServiceHealth("unavailable")));
    expect(screen.getByText("Siap dibaca")).toBeInTheDocument();
  });
  it("reopens a dismissed warning when a queue has a new overdue count", async () => {
    let extra = 0;
    const onAction = vi.fn(async (url: string) => {
      if (!url.endsWith("service-health"))
        return { success: true, openCount: 0, events: [] };
      const result = syntheticServiceHealth("attention");
      if (result.health.queues) result.health.queues[2].overdue += extra;
      return result;
    });
    render(<ObservabilityPanel onAction={onAction} />);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "pekerjaan terlambat",
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Tutup notifikasi" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    extra = 1;
    fireEvent.click(screen.getByRole("button", { name: /^Perbarui status$/ }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "pekerjaan terlambat",
      ),
    );
  });
});
