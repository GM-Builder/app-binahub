import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ClientProgramModules } from "./client-program-modules";

describe("ClientProgramModules", () => {
  it("shows only modules enabled for the program", () => {
    render(<ClientProgramModules modules={[{ key: "lep", enabled: true, clientAvailable: true }]} />);
    expect(screen.getByText("LEP")).toBeInTheDocument();
    expect(screen.queryByText("Game T-BOS")).not.toBeInTheDocument();
  });

  it("presents T-BOS as a facilitator-guided activity", () => {
    render(<ClientProgramModules modules={[{ key: "tbos", enabled: true, clientAvailable: false }]} />);
    expect(screen.getByText("Game T-BOS")).toBeInTheDocument();
    expect(screen.getByText("Tidak ada formulir yang perlu Anda isi pada modul ini.")).toBeInTheDocument();
  });

  it("does not render disabled modules", () => {
    render(<ClientProgramModules modules={[{ key: "lep", enabled: false, clientAvailable: true }]} />);
    expect(screen.queryByText("LEP")).not.toBeInTheDocument();
    expect(screen.getByText("Belum ada modul yang tersedia untuk program ini.")).toBeInTheDocument();
  });
});
