import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OutboundEmailPanel, type OutboundEmailResponse } from "./outbound-email-panel";
const campaign = { id: "campaign-one", source_id: "manual", name: "Demo email", channel: "email", status: "approved" };
const source = { id: "manual", name: "Daftar internal", channel: "outbound", status: "approved", active: true };
const fixture: OutboundEmailResponse = { ready: true, blockers: [], myEmail: "admin@example.com", mode: "pilot", testSent: false, templateVersion: "ceo-v1", preview: { subject: "Email untuk perusahaan", previewHtml: "<p>Email yang telah disetujui</p>" }, prospects: [{ id: "one", batch_id: "batch-one", name: "Rina", email: "rina@example.com", company: "Contoh", blockedReason: null, deliveryStatus: null, validation_status: "valid" }, { id: "blocked", batch_id: "batch-one", name: "Adi", email: "adi@example.com", company: null, blockedReason: "Tidak boleh dihubungi", deliveryStatus: null, validation_status: "suppressed" }], deliveries: [] };
const action = vi.fn<(url: string, init?: RequestInit) => Promise<unknown>>();
fixture.settings = { enabled: true, recipientMode: "restricted", allowedEmails: ["rina@example.com"], businessHoursOnly: false, version: 1 };
fixture.setupBlockers = [];
const refresh = vi.fn(async () => {});
const setup = vi.fn();
const renderPanel = (batches: Array<{ id: string; campaign_id: string; import_key: string; status: string; valid_rows: number; invalid_rows: number; duplicate_rows: number; suppressed_rows: number }> = []) => render(<OutboundEmailPanel onAction={action} onRefresh={refresh} sources={[source]} campaigns={[campaign]} batches={batches} onSetup={setup} />);
beforeEach(() => { action.mockReset(); action.mockImplementation(async (_url, init) => init?.method ? { success: true, message: "Email masuk antrean" } : structuredClone(fixture)); refresh.mockClear(); setup.mockClear(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });
const go = (name: string) => fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${name}$`) }));
describe("guided outbound workspace", () => {
  it('preserves recipients across steps and language changes, without sending on navigation', async () => {
    renderPanel(); await screen.findByRole('checkbox', { name: 'Pilih rina@example.com' });
    expect(screen.getByRole('button', { name: 'Lanjut ke email' })).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Pilih rina@example.com' })); go('Lanjut ke email'); go('Lanjut ke tinjauan');
    expect(screen.getByRole('region', { name: 'Tinjauan pengiriman' })).toHaveTextContent('rina@example.com');
    fireEvent.change(screen.getByRole('combobox', { name: 'Bahasa email' }), { target: { value: 'en' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Tinjau & kirim' })).toBeEnabled());
    go('Ubah penerima'); expect(screen.getByRole('checkbox', { name: 'Pilih rina@example.com' })).toBeChecked();
    expect(action.mock.calls.filter(([, init]) => init?.method)).toHaveLength(0);
  });
  it('disables stale sending on failed refresh, retains selection and recovers in place', async () => {
    renderPanel(); await screen.findByRole('checkbox', { name: 'Pilih rina@example.com' });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Pilih rina@example.com' })); go('Lanjut ke email'); go('Lanjut ke tinjauan');
    action.mockRejectedValueOnce(new Error('Data belum tersedia')); go('Perbarui'); await screen.findByRole('alert');
    expect(screen.queryByRole('button', { name: 'Tinjau & kirim' })).not.toBeInTheDocument();
    go('Coba muat kampanye lagi'); await screen.findByRole('button', { name: 'Tinjau & kirim' });
    expect(screen.getByRole('region', { name: 'Tinjauan pengiriman' })).toHaveTextContent('rina@example.com');
  });
  it('warns before replacing a campaign with selected recipients', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<OutboundEmailPanel onAction={action} onRefresh={refresh} sources={[source]} campaigns={[campaign, { ...campaign, id: 'two', name: 'Kampanye kedua' }]} batches={[]} onSetup={setup} />);
    await screen.findByRole('checkbox', { name: 'Pilih rina@example.com' }); fireEvent.click(screen.getByRole('checkbox', { name: 'Pilih rina@example.com' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Kampanye email' }), { target: { value: 'two' } });
    expect(confirm).toHaveBeenCalledOnce(); expect(screen.getByRole('combobox', { name: 'Kampanye email' })).toHaveValue(campaign.id); confirm.mockRestore();
  });
  it('does not open another campaign creation flow when leaving selected recipients is declined', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderPanel(); await screen.findByRole('checkbox', { name: 'Pilih rina@example.com' });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Pilih rina@example.com' })); go('Buat kampanye');
    expect(confirm).toHaveBeenCalledOnce(); expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); confirm.mockRestore();
  });
  it('times out hung reads without displaying an empty target list and can retry', async () => {
    vi.useFakeTimers(); action.mockImplementation(() => new Promise(() => {})); renderPanel();
    await act(async () => { await vi.advanceTimersByTimeAsync(20001); }); expect(screen.getByRole('alert')).toHaveTextContent('terlalu lama');
    expect(screen.queryByText('Belum ada target. Tambahkan daftar Anda untuk mulai.')).not.toBeVisible();
    action.mockResolvedValue(structuredClone(fixture)); await act(async () => go('Coba muat kampanye lagi'));
    expect(screen.getByRole('checkbox', { name: 'Pilih rina@example.com' })).toBeVisible();
  });
  it("shows a guided empty setup, not a confusing discovery interface", () => {
    render(<OutboundEmailPanel onAction={action} onRefresh={refresh} sources={[]} campaigns={[]} batches={[]} onSetup={setup} />);
    fireEvent.click(screen.getByRole("button", { name: "Siapkan kampanye" }));
    fireEvent.click(screen.getByRole("button", { name: "Siapkan sumber data" }));
    expect(screen.getByRole('textbox', { name: 'Nama daftar' })).toBeVisible();
    expect(setup).not.toHaveBeenCalled(); expect(action).not.toHaveBeenCalled();
  });
  it("loads readable recipients and locks blocked targets", async () => {
    renderPanel(); await screen.findByText("rina@example.com · Contoh");
    expect(screen.getByRole("checkbox", { name: "Pilih adi@example.com" })).toBeDisabled();
    expect(screen.queryByText("AI Lead Agent")).not.toBeInTheDocument();
  });
  it("guides one step at a time; a test is optional and sending needs confirmation", async () => {
    renderPanel(); await screen.findByRole("checkbox", { name: "Pilih rina@example.com" });
    fireEvent.click(screen.getByRole("checkbox", { name: "Pilih rina@example.com" })); go("Lanjut ke email");
    expect(screen.queryByRole("button", { name: "Tinjau & kirim" })).not.toBeInTheDocument();
    expect(screen.getByTitle("Preview email kampanye")).toBeInTheDocument();
    fireEvent.click(screen.getByText('Kirim email uji ke saya · opsional'));
    fireEvent.click(screen.getByRole("button", { name: "Kirim email uji" }));
    expect(action.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(0);
    const dialog = screen.getByRole("dialog"); expect(dialog).toHaveTextContent("admin@example.com");
    fireEvent.click(within(dialog).getByRole("button", { name: "Kirim uji" }));
    await waitFor(() => expect(action.mock.calls.some(([, init]) => init?.body && JSON.parse(String(init.body)).confirmation === "SEND_TEST_TO_MY_EMAIL")).toBe(true));
  });
  it("keeps an error visible and the same request key when retrying", async () => {
    action.mockImplementation(async (_url, init) => { if (init?.method) throw new Error("Koneksi terputus"); return { ...fixture, testSent: true }; });
    renderPanel(); await screen.findByRole("checkbox", { name: "Pilih rina@example.com" });
    fireEvent.click(screen.getByRole("checkbox", { name: "Pilih rina@example.com" })); go("Lanjut ke email"); go('Lanjut ke tinjauan');
    fireEvent.click(screen.getByRole("button", { name: "Tinjau & kirim" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Konfirmasi pengiriman" }));
    await screen.findByText("Koneksi terputus");
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Konfirmasi pengiriman" }));
    await waitFor(() => expect(action.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(2));
    const bodies = action.mock.calls.filter(([, init]) => init?.method === "POST").map(([, init]) => JSON.parse(String(init!.body)));
    expect(bodies[0].requestKey).toBe(bodies[1].requestKey); expect(bodies[0].prospectIds).toEqual(["one"]);
  });
  it("imports reviewed email lists with one explicit authorization and no sending", async () => {
    renderPanel(); await screen.findByRole("checkbox", { name: "Pilih rina@example.com" });
    fireEvent.click(screen.getByRole("button", { name: "Tambah target" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Daftar email manual" }), { target: { value: "demo@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Periksa daftar" }));
    expect(screen.getByRole("table")).toHaveTextContent("demo@example.com");
    expect(screen.getByRole("button", { name: "Tambahkan target" })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: /Saya telah memeriksa/ }));
    fireEvent.click(screen.getByRole("button", { name: "Tambahkan target" }));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    const payload = action.mock.calls.find(([, init]) => init?.method === "POST")![1]!;
    expect(JSON.parse(String(payload.body))).toMatchObject({ action: "reviewed_batch", payload: { confirmation: "USE_REVIEWED_TARGET_LIST", campaignId: campaign.id, sourceId: source.id, prospects: [{ email: "demo@example.com", consentStatus: "unknown" }] } });
    expect(action.mock.calls.filter(([, init]) => init?.method === "PATCH")).toHaveLength(0);
  });
  it("never labels provider acceptance as inbox delivery", async () => {
    action.mockResolvedValue({ ...fixture, deliveries: [{ id: "sent", name: "Rina", email: "rina@example.com", kind: "initial", status: "sent", error_message: null, created_at: "2026-10-06T03:00:00Z" }] });
    renderPanel(); await screen.findByRole("checkbox", { name: "Pilih rina@example.com" }); go("Hasil");
    expect(screen.getByText("Diterima penyedia email")).toBeInTheDocument();
    expect(screen.getByText(/bukan jaminan masuk inbox/)).toBeInTheDocument();
  });
  it("locks a repeated confirmation while a request is still pending", async () => {
    let resolvePost: (value: unknown) => void = () => {};
    action.mockImplementation(async (_url, init) => init?.method ? await new Promise((resolve) => { resolvePost = resolve; }) : { ...fixture, testSent: true });
    renderPanel(); await screen.findByRole("checkbox", { name: "Pilih rina@example.com" });
    fireEvent.click(screen.getByRole("checkbox", { name: "Pilih rina@example.com" })); go("Lanjut ke email"); go('Lanjut ke tinjauan');
    fireEvent.click(screen.getByRole("button", { name: "Tinjau & kirim" }));
    const button = within(screen.getByRole("dialog")).getByRole("button", { name: "Konfirmasi pengiriman" });
    fireEvent.click(button); fireEvent.click(button);
    expect(action.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(1);
    expect(button).toBeDisabled();
    resolvePost({ success: true, message: "Email masuk antrean" });
    await screen.findByRole("heading", { name: "Status pengiriman" });
  });
  it("does not offer to repeat a successful import when refreshing the dashboard fails", async () => {
    refresh.mockRejectedValueOnce(new Error("Refresh failed"));
    renderPanel(); await screen.findByRole("checkbox", { name: "Pilih rina@example.com" });
    fireEvent.click(screen.getByRole("button", { name: "Tambah target" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Daftar email manual" }), { target: { value: "demo@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Periksa daftar" }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Saya telah memeriksa/ }));
    fireEvent.click(screen.getByRole("button", { name: "Tambahkan target" }));
    await screen.findByText(/Data sudah tersimpan/);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(action.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(1);
  });
  it("does not approve a batch when only a partial recipient sample is visible", async () => {
    renderPanel([{ id: "batch-one", campaign_id: campaign.id, import_key: "manual-demo", status: "staged", valid_rows: 3, invalid_rows: 0, duplicate_rows: 0, suppressed_rows: 0 }]);
    await screen.findByRole("checkbox", { name: "Pilih rina@example.com" });
    fireEvent.click(screen.getByRole("button", { name: "Tinjau & setujui" }));
    const dialog = screen.getByRole("dialog"); expect(within(dialog).getByRole("alert")).toHaveTextContent("Hanya 2 dari 3 target");
    expect(within(dialog).getByRole("button", { name: "Setujui daftar" })).toBeDisabled();
  });
  it("sets up a campaign entirely here without launching a worker or changing follow-up", async () => {
    renderPanel(); await screen.findByRole("checkbox", { name: "Pilih rina@example.com" });
    fireEvent.click(screen.getByText(/Pengaturan lanjutan ·/));
    fireEvent.click(screen.getByRole("button", { name: "Atur pengiriman" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("tidak mengaktifkan follow-up");
    expect(within(dialog).getByRole("button", { name: "Simpan pengaturan" })).toBeDisabled();
    fireEvent.click(within(dialog).getByRole("checkbox", { name: /Saya menyetujui batas/ }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Simpan pengaturan" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const writes = action.mock.calls.filter(([, init]) => init?.method);
    expect(writes).toHaveLength(1); expect(writes[0][1]?.method).toBe("PATCH");
    expect(JSON.parse(String(writes[0][1]?.body))).toMatchObject({ enabled: true, expectedVersion: 1, recipientMode: "restricted", allowedEmails: ["rina@example.com"], confirmation: "SAVE_OUTBOUND_SETTINGS" });
  });
  it("lets an admin pause without activation approval and shows save conflicts", async () => {
    action.mockImplementation(async (_url, init) => { if (init?.method === "PATCH") throw new Error("Pengaturan sudah berubah"); return fixture; });
    renderPanel(); await screen.findByRole("checkbox", { name: "Pilih rina@example.com" });
    fireEvent.click(screen.getByText(/Pengaturan lanjutan ·/));
    fireEvent.click(screen.getByRole("button", { name: "Atur pengiriman" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Dijeda" }));
    expect(within(dialog).getByRole("button", { name: "Simpan pengaturan" })).toBeEnabled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Simpan pengaturan" }));
    await within(dialog).findByRole("alert");
    expect(screen.getByRole("dialog")).toHaveTextContent("Pengaturan sudah berubah");
    expect(JSON.parse(String(action.mock.calls.find(([, init]) => init?.method === "PATCH")![1]?.body)).enabled).toBe(false);
  });
});
