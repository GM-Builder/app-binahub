import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TbosProgramSelector } from "./tbos-program-selector";

const mocks = vi.hoisted(() => ({
  fetchPrograms: vi.fn(),
}));

vi.mock("@/modules/tbos/api-client", () => ({
  fetchTbosPrograms: mocks.fetchPrograms,
}));

describe("TbosProgramSelector", () => {
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
});
