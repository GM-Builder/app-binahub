import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { CompetencyDictionary, CompetencyDictionaryView } from "./competency-dictionary";

const mocks = vi.hoisted(() => ({ session: vi.fn(), fetch: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ supabase: { auth: { getSession: mocks.session } } }));
const data = {
  framework: { id: "signature-2026-competency-v1", source_file: "CEO catalog.docx", source_sha256: "a".repeat(64), measurement_status: "awaiting_ceo_kpi_and_questions" },
  competencies: [
    { code: "COMP-001", name: "Adaptasi", definition: null, behavioral_indicators: [], kpi_source_version: null, content_status: "awaiting_ceo" as const },
    { code: "COMP-002", name: "Komunikasi", definition: null, behavioral_indicators: [], kpi_source_version: null, content_status: "awaiting_ceo" as const },
  ],
  mappings: [
    { module_id: "m8", competency_code: "COMP-001", role: "core" as const, display_order: 1, source_solution_title: "Adaptive Leadership", catalog_modules: { module_code: "SS-08", active: true } },
    { module_id: "m1", competency_code: "COMP-002", role: "secondary" as const, display_order: 1, source_solution_title: "Emotional Intelligence", catalog_modules: { module_code: "SS-01", active: false } },
  ],
};
beforeEach(() => {
  mocks.session.mockReset(); mocks.fetch.mockReset();
  mocks.session.mockResolvedValue({ data: { session: { access_token: "admin-test-token" } } });
  mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true, ...data }) });
  vi.stubGlobal("fetch", mocks.fetch);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("read-only competency dictionary", () => {
  it("shows pending definitions without implying Self Diagnostic is active", () => {
    render(<CompetencyDictionaryView data={data} />);
    expect(screen.getByText("Belum diaktifkan")).toBeInTheDocument();
    expect(screen.getAllByText("Menunggu definisi CEO")).toHaveLength(3); // filter + two badges
    expect(screen.getByText(/Keduanya bukan bobot skor/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /simpan|aktifkan|bayar/i })).not.toBeInTheDocument();
  });
  it("searches official competency names, English solution titles, and SS codes", () => {
    render(<CompetencyDictionaryView data={data} />);
    const search = screen.getByRole("searchbox", { name: "Cari kompetensi atau solusi" });
    for (const query of ["ADAPTASI", "Adaptive Leadership", "ss-08"]) {
      fireEvent.change(search, { target: { value: query } });
      expect(screen.getByRole("heading", { name: "Adaptasi" })).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "Komunikasi" })).not.toBeInTheDocument();
    }
    fireEvent.change(search, { target: { value: "no match" } });
    expect(screen.getByText(/Tidak ada kompetensi yang cocok/)).toBeInTheDocument();
  });
  it("separates core and secondary and marks archived solutions", () => {
    render(<CompetencyDictionaryView data={data} />);
    const card = screen.getByRole("heading", { name: "Komunikasi" }).closest("article")!;
    expect(within(card).getByText("Secondary · kompetensi pendukung")).toBeInTheDocument();
    expect(within(card).getByText("Emotional Intelligence")).toBeInTheDocument();
    expect(within(card).getByText("Diarsipkan")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Kesiapan definisi" }), { target: { value: "approved" } });
    expect(screen.getByText(/Tidak ada kompetensi yang cocok/)).toBeInTheDocument();
  });
  it("loads once with the admin session and no shared cache", async () => {
    render(<CompetencyDictionary />);
    expect(await screen.findByRole("heading", { name: "Adaptasi" })).toBeInTheDocument();
    expect(mocks.fetch).toHaveBeenCalledWith("/api/admin/competencies", expect.objectContaining({ cache: "no-store", headers: { Authorization: "Bearer admin-test-token" } }));
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
  });
  it("shows SQL setup errors and supports an explicit retry", async () => {
    mocks.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Tim teknis perlu menjalankan SQL 63." }) });
    render(<CompetencyDictionary />);
    expect(await screen.findByRole("alert")).toHaveTextContent("SQL 63");
    fireEvent.click(screen.getByRole("button", { name: "Muat ulang" }));
    expect(await screen.findByRole("heading", { name: "Adaptasi" })).toBeInTheDocument();
  });
  it("does not request privileged data without a session", async () => {
    mocks.session.mockResolvedValue({ data: { session: null } });
    render(<CompetencyDictionary />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Silakan masuk kembali");
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it("aborts in-flight requests when leaving the page", async () => {
    mocks.fetch.mockImplementation(() => new Promise(() => {}));
    const view = render(<CompetencyDictionary />);
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(1));
    const signal = mocks.fetch.mock.calls[0][1].signal as AbortSignal;
    view.unmount(); expect(signal.aborted).toBe(true);
  });
});
