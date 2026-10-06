import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { assessmentDashboard, assessmentFixture } from "@/test/fixtures/assessment-admin";
import type { AssessmentRecord } from "../_lib/types";
import { AssessmentPanel } from "./assessment-panel";

vi.mock("@/lib/supabase", () => ({ supabase: { auth: { getSession: vi.fn(async () => ({ data: { session: null } })) } } }));

const action = vi.fn<(url: string, init?: RequestInit) => Promise<unknown>>().mockResolvedValue({ success: true });
const refresh = vi.fn(async () => {});

function Harness({ records }: { records: AssessmentRecord[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(records[0]?.id || null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const [employeeRange, setEmployeeRange] = useState("Semua");
  const [minScore, setMinScore] = useState("0");
  return <AssessmentPanel data={assessmentDashboard(records)} records={records.filter((record) => !query || record.name.toLowerCase().includes(query.toLowerCase()))}
    expandedId={expandedId} setExpandedId={setExpandedId} query={query} setQuery={setQuery} category={category} setCategory={setCategory}
    employeeRange={employeeRange} setEmployeeRange={setEmployeeRange} minScore={minScore} setMinScore={setMinScore} onAction={action} onRefresh={refresh} />;
}

beforeEach(() => { action.mockReset(); action.mockResolvedValue({ success: true }); refresh.mockClear(); });
afterEach(cleanup);
const tab = (name: string) => fireEvent.click(screen.getByRole("tab", { name }));

describe("Assessment Admin workspace", () => {
  it("explains the current score separately from core-data completeness and historic lead records", () => {
    render(<Harness records={[assessmentFixture({ leadScoreRuleVersion: "v1.2-public-diagnostic", recordedLeadScoreRuleVersion: "v1.1-public-diagnostic", leadScoreEvidence: { buyingSignalCount: 3, maximumBuyingSignals: 4, scoreBreakdown: [{ key: "challenge", label: "Tantangan terisi (minimal 20 karakter)", points: 20, maximum: 20 }] } })]} />);
    fireEvent.click(screen.getByText("Rincian penilaian minat"));
    expect(screen.getByText(/Sinyal minat: 3 dari 4/)).toBeInTheDocument();
    expect(screen.getByText(/Kelengkapan data inti:/)).toHaveTextContent("Bukan peluang membeli");
    expect(screen.getByText("20/20")).toBeInTheDocument();
    expect(screen.getByText(/Anggaran dan dukungan pengambil keputusan tidak digunakan/)).toBeInTheDocument();
    expect(screen.getByText(/Riwayat skor lead/)).toBeInTheDocument();
  });
  it("starts with a readable summary and separates technical details", () => {
    render(<Harness records={[assessmentFixture()]} />);
    expect(screen.getByRole("tab", { name: "Ringkasan" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Tantangan utama")).toBeInTheDocument();
    expect(screen.getByText("Minat berkembang")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Buat & kirim proposal standar" })).not.toBeInTheDocument();
  });
  it("filters the actual client list when a queue is selected", () => {
    render(<Harness records={[assessmentFixture({ proposalStatus: "Gagal Otomatis" }), assessmentFixture({ id: "processing", name: "Dina", proposalStatus: "Sedang Disusun" })]} />);
    fireEvent.click(screen.getByRole("button", { name: /Sedang diproses 1/ }));
    expect(screen.queryByRole("button", { name: /Buka assessment Nadia/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Buka assessment Dina/ })).toBeInTheDocument();
  });
  it("requires explicit confirmation before requesting a real proposal", async () => {
    render(<Harness records={[assessmentFixture({ proposalStatus: "Gagal Otomatis" })]} />);
    tab("Proposal");
    fireEvent.click(screen.getByRole("button", { name: "Coba ulang proposal" }));
    expect(action).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Email: nadia@example.com")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Coba lagi" }));
    await waitFor(() => expect(action).toHaveBeenCalledWith("/api/admin/assessments", expect.objectContaining({ method: "POST", body: JSON.stringify({ id: "demo-assessment-1", action: "request_proposal" }) })));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
  });
  it("keeps confirmation open when the request fails", async () => {
    action.mockRejectedValueOnce(new Error("Koneksi terputus"));
    render(<Harness records={[assessmentFixture()]} />);
    tab("Proposal");
    fireEvent.click(screen.getByRole("button", { name: "Buat & kirim proposal standar" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Buat & kirim" }));
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveTextContent("Koneksi terputus"));
    expect(refresh).not.toHaveBeenCalled();
  });
  it("blocks another send while the automatic proposal is processing", () => {
    render(<Harness records={[assessmentFixture({ proposalStatus: "Sedang Disusun" })]} />);
    tab("Proposal");
    expect(screen.getByRole("button", { name: "Sedang diproses" })).toBeDisabled();
    fireEvent.click(screen.getByText("Draf standar yang perlu peninjauan"));
    expect(screen.getByRole("button", { name: "Siapkan draf untuk ditinjau" })).toBeDisabled();
  });
  it("protects uncertain delivery from accidental duplicate sends", () => {
    render(<Harness records={[assessmentFixture({ proposalStatus: "Perlu Rekonsiliasi" })]} />);
    tab("Proposal");
    expect(screen.getByRole("button", { name: "Buat & kirim proposal standar" })).toBeDisabled();
    expect(screen.getByText(/klien tidak menerima proposal ganda/)).toBeInTheDocument();
  });
  it("does not offer a new automatic proposal after delivery", () => {
    render(<Harness records={[assessmentFixture({ proposalSentAt: "2026-10-05T03:00:00Z", proposalStatus: "Terkirim" })]} />);
    tab("Proposal");
    expect(screen.queryByRole("button", { name: "Buat & kirim proposal standar" })).not.toBeInTheDocument();
    expect(screen.getByText(/CEO menyiapkannya secara manual/)).toBeInTheDocument();
  });
  it("distinguishes unavailable archives from loading", () => {
    render(<Harness records={[assessmentFixture({ resultEmailId: null })]} />);
    tab("Dokumen");
    expect(screen.getByRole("button", { name: "Salinan email hasil" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Salinan email proposal" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Unduh proposal terkirim" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Unduh laporan hasil" })).toBeEnabled();
    expect(screen.queryByText("Memuat…")).not.toBeInTheDocument();
  });
  it("requires a note for approval and blocks simulation delivery", () => {
    render(<Harness records={[assessmentFixture({ proposalDraft: { proposal: { subject: "Draf" }, isSimulation: true }, proposalGateStatus: "pending_approval" })]} />);
    tab("Proposal");
    expect(screen.getByRole("button", { name: "Setujui" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Kirim draf yang disetujui" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Catatan keputusan"), { target: { value: "Sudah ditinjau" } });
    expect(screen.getByRole("button", { name: "Setujui" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Buat & kirim proposal standar" })).not.toBeInTheDocument();
  });
  it("resets selected modules and notes when switching draft clients", async () => {
    action.mockResolvedValue({ products: [{ id: "lab", product_key: "binalab", name: "BinaLab" }], modules: [{ id: "module-1", product_id: "lab", name: "Komunikasi tim", active: true, readiness_status: "ready", is_mock: false, base_price: 1000 }] });
    render(<Harness records={[assessmentFixture(), assessmentFixture({ id: "other", name: "Arif", recommendations: [] })]} />);
    tab("Proposal"); fireEvent.click(screen.getByText("Draf standar yang perlu peninjauan"));
    fireEvent.click(screen.getByRole("button", { name: "Siapkan draf untuk ditinjau" }));
    await waitFor(() => expect(screen.getByRole("checkbox")).toBeChecked());
    fireEvent.change(screen.getByLabelText("Catatan peninjau"), { target: { value: "Catatan klien pertama" } });
    fireEvent.click(screen.getByRole("button", { name: /Buka assessment Arif/ }));
    tab("Proposal"); fireEvent.click(screen.getByText("Draf standar yang perlu peninjauan"));
    fireEvent.click(screen.getByRole("button", { name: "Siapkan draf untuk ditinjau" }));
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(screen.getByLabelText("Catatan peninjau")).toHaveValue("");
  });
  it("stops result reminders when a proposal is requested", () => {
    render(<Harness records={[assessmentFixture()]} />);
    tab("Tindak lanjut");
    expect(screen.getAllByRole("button", { name: "Hari ke-2" }).every((button) => button.hasAttribute("disabled"))).toBe(true);
  });
  it("supports keyboard tab navigation", () => {
    render(<Harness records={[assessmentFixture()]} />);
    fireEvent.keyDown(screen.getByRole("tab", { name: "Ringkasan" }), { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Proposal" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Proposal" })).toHaveFocus();
  });
  it("resets filters and never leaves a hidden client's detail active", () => {
    render(<Harness records={[assessmentFixture()]} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "tidak ditemukan" } });
    expect(screen.queryByRole("tab", { name: "Proposal" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hapus filter" }));
    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(screen.getByRole("button", { name: /Buka assessment Nadia/ })).toBeInTheDocument();
  });
});
