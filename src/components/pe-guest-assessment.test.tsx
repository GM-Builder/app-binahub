import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ request: vi.fn(), read: vi.fn() }));
vi.mock("@/lib/pe-guest", () => ({ guestRequest: mock.request, makeGuestKey: () => "test" }));
vi.mock("@/lib/pe-guest-storage", () => ({ readPEGuestDraft: mock.read, savePEGuestDraft: vi.fn(), clearPEGuestDraft: vi.fn() }));
import { PEGuestAssessment } from "./pe-guest-assessment";
beforeEach(() => {
  vi.resetAllMocks(); mock.read.mockResolvedValue(null);
  mock.request.mockResolvedValue({ definition: { notice: "Old notice", privacyNotice: "Jawaban disimpan selama enam bulan.",
    sharingNotice: "Tim BinaHub meninjau hasil atas persetujuan Anda.",
    competencies: [{ code: "PE-02", name: "Self-Development" }, { code: "PE-04", name: "Adaptability" }, { code: "PE-06", name: "Pressure Management" }],
    selfReportItems: [], sjtItems: [], selfReportScale: [] } });
});
afterEach(cleanup);
describe("public individual assessment introduction", () => {
  it("uses plain professional copy while preserving informed consent and privacy access", async () => {
    render(<PEGuestAssessment />);
    await screen.findByRole("heading", { name: "Sebelum Anda mulai" });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Pahami kebutuhan pengembangan diri Anda.");
    expect(screen.queryByText(/draft sementara|Personal Effectiveness|pilot|CEO/i)).not.toBeInTheDocument();
    expect(screen.getByText(/bukan diagnosis klinis/)).toBeVisible();
    const privacy = screen.getByText("Privasi dan penggunaan data");
    fireEvent.click(privacy);
    expect(privacy.closest("details")).toBeInTheDocument();
    expect(screen.getByText("Jawaban disimpan selama enam bulan.")).toBeInTheDocument();
    expect(screen.getByLabelText("Alamat email")).toHaveAttribute("aria-describedby", "pe-email-help");
    expect(screen.getByRole("button", { name: /Mulai diagnosis/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("button", { name: /Mulai diagnosis/ })).toBeEnabled();
    expect(mock.request).toHaveBeenCalledTimes(1);
  });
});
