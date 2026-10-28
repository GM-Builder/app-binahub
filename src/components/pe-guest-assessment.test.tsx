import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ request: vi.fn(), read: vi.fn(), save: vi.fn(), clear: vi.fn() }));
vi.mock("@/lib/pe-guest", () => ({ guestRequest: mock.request, makeGuestKey: () => "test" }));
vi.mock("@/lib/pe-guest-storage", () => ({ readPEGuestDraft: mock.read, savePEGuestDraft: mock.save, clearPEGuestDraft: mock.clear }));
import { PEGuestAssessment } from "./pe-guest-assessment";
beforeEach(() => {
  vi.resetAllMocks(); mock.read.mockResolvedValue(null);
  mock.request.mockResolvedValue({ definition: { notice: "Old notice", privacyNotice: "Jawaban disimpan selama enam bulan.",
    sharingNotice: "Tim BinaHub meninjau hasil atas persetujuan Anda.",
    competencies: [{ code: "PE-02", name: "Self-Development" }, { code: "PE-04", name: "Adaptability" }, { code: "PE-06", name: "Pressure Management" }],
    selfReportItems: [], sjtItems: [], selfReportScale: [] } });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
describe("public individual Self Diagnostic introduction", () => {
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
  it('lets participants select, navigate and revise while a server save is still pending', async () => {
    const pendingDraft = { id: 'synthetic-id', draftKey: 'synthetic-key', name: 'Synthetic', email: 'test@example.invalid',
      context: { role: 'Synthetic role', goal: 'Synthetic goal', relevance: {} }, revision: 0, responses: {}, baseResponses: {}, expiresAt: Date.now() + 10000 };
    const definition = { competencies: [{ code: 'PE-02', name: 'Self-Development' }],
      selfReportItems: [{ id: 'SR01', competencyCode: 'PE-02', type: 'behavioral_self_report', prompt: 'Synthetic question one' },
        { id: 'SR02', competencyCode: 'PE-02', type: 'behavioral_self_report', prompt: 'Synthetic question two' }], sjtItems: [],
      selfReportScale: [{ value: 4, label: 'Sering' }, { value: 5, label: 'Hampir selalu' }] };
    let complete!: (value: unknown) => void;
    mock.read.mockResolvedValue(pendingDraft); mock.save.mockResolvedValue(undefined); vi.stubGlobal('scrollTo', vi.fn());
    mock.request.mockImplementation(async (path = '', method = 'GET', body) => {
      if (!path) return { definition };
      if (method === 'GET') return { attempt: { ...pendingDraft, status: 'draft' } };
      if (body.revision === 0) return new Promise(resolve => { complete = resolve; });
      return { attempt: { ...pendingDraft, revision: 2, responses: body.responses, status: 'draft' } };
    });
    render(<PEGuestAssessment />); await screen.findByText('Synthetic question one');
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('radio', { name: 'Sering' }));
    expect(screen.getByRole('button', { name: 'Lanjut' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }));
    expect(screen.getByText('Synthetic question two')).toBeVisible();
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    expect(mock.request.mock.calls.filter(([, method]) => method === 'PATCH')).toHaveLength(1);
    fireEvent.click(screen.getByRole('radio', { name: 'Hampir selalu' }));
    expect(screen.getByRole('button', { name: 'Tinjau jawaban' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Kembali' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Hampir selalu' }));
    expect(screen.getByRole('radio', { name: 'Hampir selalu' })).toBeChecked();
    await act(async () => { complete({ attempt: { ...pendingDraft, revision: 1, responses: { SR01: 4 }, status: 'draft' } }); });
    vi.useRealTimers();
    await waitFor(() => expect(mock.save.mock.calls.at(-1)?.[0].responses).toEqual({ SR01: 5, SR02: 5 }));
    expect(screen.getByRole('radio', { name: 'Hampir selalu' })).toBeChecked();
  });
});
