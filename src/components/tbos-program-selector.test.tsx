import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TbosProgramSelector } from "./tbos-program-selector";

const mocks = vi.hoisted(() => ({
  fetchPrograms: vi.fn(),
}));

vi.mock("@/modules/tbos/api-client", () => ({
  fetchTbosPrograms: mocks.fetchPrograms,
}));

describe("TbosProgramSelector", () => {
  beforeEach(() => {
    mocks.fetchPrograms.mockReset();
    window.sessionStorage.clear();
  });

  it("loads the program list once and does not refetch after selection", async () => {
    mocks.fetchPrograms.mockResolvedValue([
      { id: "program-1", code: "TBOS-1", title: "Program T-BOS" },
    ]);
    const onChange = vi.fn();
    const view = render(<TbosProgramSelector value="" onChange={onChange} />);

    await waitFor(() => expect(onChange).toHaveBeenCalledWith("program-1"));
    expect(mocks.fetchPrograms).toHaveBeenCalledTimes(1);

    view.rerender(<TbosProgramSelector value="program-1" onChange={onChange} />);
    await waitFor(() => expect(mocks.fetchPrograms).toHaveBeenCalledTimes(1));
  });

  it("shows the loading failure instead of disguising it as an empty program list", async () => {
    mocks.fetchPrograms.mockRejectedValue(new Error("Sesi tidak tersedia. Silakan login ulang."));
    const { findByRole } = render(<TbosProgramSelector value="" onChange={vi.fn()} moduleKey="lep" />);

    expect(await findByRole("alert")).toHaveTextContent("Sesi tidak tersedia");
  });

  it("requests and selects an available LEP program", async () => {
    mocks.fetchPrograms.mockResolvedValue([
      { id: "lep-1", code: "LEP-2026", title: "Program LEP" },
    ]);
    const onChange = vi.fn();

    render(<TbosProgramSelector value="" onChange={onChange} moduleKey="lep" />);

    await waitFor(() => expect(mocks.fetchPrograms).toHaveBeenCalledWith("lep"));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith("lep-1"));
  });

  it("restores the last selected program during facilitator navigation", async () => {
    window.sessionStorage.setItem("binahub:tbos:selected-program", "program-2");
    mocks.fetchPrograms.mockResolvedValue([
      { id: "program-1", code: "TBOS-1", title: "Program Pertama" },
      { id: "program-2", code: "TBOS-2", title: "Program Tersimpan" },
    ]);
    const onChange = vi.fn();

    render(<TbosProgramSelector value="" onChange={onChange} />);

    await waitFor(() => expect(onChange).toHaveBeenCalledWith("program-2"));
  });
});
