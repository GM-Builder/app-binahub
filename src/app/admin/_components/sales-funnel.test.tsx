import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { funnelAccount, funnelDashboard, funnelLead, funnelPreviewData } from "@/test/fixtures/sales-funnel";
import { assessmentFixture } from "@/test/fixtures/assessment-admin";
import { SalesFunnel } from "./sales-funnel";

afterEach(cleanup);
describe("interactive sales funnel", () => {
  it("shows the reference stages and keeps lost deals separate", () => {
    render(<SalesFunnel data={funnelPreviewData()} />);
    expect(screen.getByRole("button", { name: "Awareness: 7 peluang. Lihat detail" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Consideration: 2 peluang. Lihat detail" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Decision: 1 peluang. Lihat detail" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Loyal: 1 peluang. Lihat detail" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Tidak lanjut · 1/ }));
    expect(screen.getByRole("button", { name: /Lihat detail Dito Santoso/ })).toBeInTheDocument();
    expect(screen.getByText(/bukan conversion rate/)).toBeInTheDocument();
  });
  it("updates stage detail immediately, paginates all loaded opportunities, and resets filters on stage change", () => {
    render(<SalesFunnel data={funnelPreviewData()} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Laras" } });
    expect(screen.getByRole("button", { name: /Lihat detail Laras/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Interact: 1 peluang. Lihat detail" }));
    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(screen.getByRole("button", { name: /Lihat detail Dina/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Awareness: 7 peluang. Lihat detail" }));
    fireEvent.click(screen.getByRole("button", { name: "Halaman berikutnya" }));
    expect(screen.getByText("Halaman 2 dari 2")).toBeInTheDocument();
  });
  it("filters source and attention while preserving the real stage count", () => {
    render(<SalesFunnel data={funnelPreviewData()} />);
    fireEvent.change(screen.getByRole("combobox", { name: "Sumber peluang" }), { target: { value: "outbound" } });
    expect(screen.getByText("Menampilkan 3 dari 7 peluang pada tahap ini")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Awareness: 7 peluang. Lihat detail" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "Hanya yang perlu perhatian" }));
    expect(screen.getByText(/Tidak ada peluang yang cocok/)).toBeInTheDocument();
  });
  it("opens a detailed drawer and closes with Escape without mutating data", () => {
    render(<SalesFunnel data={funnelPreviewData()} />);
    fireEvent.click(screen.getByRole("button", { name: "Consideration: 2 peluang. Lihat detail" }));
    fireEvent.click(screen.getByRole("button", { name: /Lihat detail Arif/ }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Status proposal")).toBeInTheDocument();
    expect(within(dialog).getByText("Terkirim")).toBeInTheDocument();
    expect(within(dialog).getByText("Follow-up dijeda: Menunggu respons klien")).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: /Kelola peluang/ })).toHaveAttribute("href", "/admin/pipeline");
    fireEvent.keyDown(document, { key: "Escape" }); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("does not attach an unrelated assessment merely because its email matches", () => {
    const lead = funnelLead(); const data = funnelDashboard([lead]); data.assessments = [assessmentFixture({ email: lead.email, leadId: "another-lead" })];
    render(<SalesFunnel data={data} />); fireEvent.click(screen.getByRole("button", { name: /Lihat detail Nadia/ }));
    expect(within(screen.getByRole("dialog")).getByText(/Belum ada assessment yang terhubung/)).toBeInTheDocument();
  });
  it("supports empty stages and deliberately including test records", () => {
    render(<SalesFunnel data={funnelDashboard([funnelLead({ email: "test@example.invalid" })])} />);
    expect(screen.getByText("Belum ada peluang pada tahap ini.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "Sertakan data uji (1)" }));
    expect(screen.getByRole("button", { name: "Awareness: 1 peluang. Lihat detail" })).toBeInTheDocument();
  });
  it("does not claim partial data are total counts", () => {
    const data = funnelDashboard([funnelLead()]); data.salesFunnelCoverage!.total = 2000;
    render(<SalesFunnel data={data} />); expect(screen.getByText(/Data belum lengkap: 1 dari 2000/)).toBeInTheDocument();
  });
  it("does not substitute zeros for unavailable stage data", () => {
    const data = funnelDashboard([]); data.salesFunnelCoverage!.stageDataAvailable = false;
    render(<SalesFunnel data={data} />); expect(screen.getByRole("alert")).toHaveTextContent("Data tahap penjualan belum tersedia");
    expect(screen.queryByRole("button", { name: /Awareness:/ })).not.toBeInTheDocument();
  });
  it("shows unmapped accounts separately instead of inventing a Decision count", () => {
    const data = funnelDashboard([]); data.clientAccounts = [funnelAccount()];
    render(<SalesFunnel data={data} />); fireEvent.click(screen.getByRole("button", { name: /1 akun klien belum terhubung/ }));
    expect(screen.getByRole("dialog")).toHaveTextContent("PT Aurora Nusantara");
    expect(screen.getByRole("button", { name: "Decision: 0 peluang. Lihat detail" })).toBeInTheDocument();
  });
});
