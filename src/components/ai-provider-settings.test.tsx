import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("@/lib/api-fetch", () => ({ apiFetch: mock.fetch }));
import { AIProviderSettings } from "./ai-provider-settings";
const initial = { success: true, version: 1, setupRequired: false, updatedAt: null,
  policy: { primaryProvider: "lapakvip", enabledProviders: ["lapakvip", "openrouter"] },
  providers: [{ id: "lapakvip", configured: true, model: "lv/example" }, { id: "codecraft", configured: true, model: "example" }, { id: "openrouter", configured: true, model: "example" }],
};
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
beforeEach(() => { vi.resetAllMocks(); mock.fetch.mockImplementation(async () => reply(initial)); });
afterEach(cleanup);
describe("admin AI provider controls", () => {
  it("shows one primary, keeps it active, and saves provider toggles in one request", async () => {
    render(<AIProviderSettings />);
    await screen.findByRole("radio", { name: "Provider utama" });
    expect(screen.getByRole("switch", { name: "Aktifkan LapakVIP" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Simpan pilihan" })).toBeDisabled();
    fireEvent.click(screen.getByRole("radio", { name: "Jadikan Codecraft utama" }));
    fireEvent.click(screen.getByRole("switch", { name: "Aktifkan LapakVIP" }));
    mock.fetch.mockResolvedValueOnce(reply({ ...initial, version: 2, policy: { primaryProvider: "codecraft", enabledProviders: ["openrouter", "codecraft"] } }));
    fireEvent.click(screen.getByRole("button", { name: "Simpan pilihan" }));
    await screen.findByText(/Pengaturan tersimpan/);
    const init = mock.fetch.mock.calls.at(-1)![1];
    expect(JSON.parse(init.body)).toEqual({ policy: { primaryProvider: "codecraft", enabledProviders: ["openrouter", "codecraft"] }, version: 1 });
    expect(screen.getAllByRole("radio").filter((radio) => (radio as HTMLInputElement).checked)).toHaveLength(1);
  });
  it("preserves edits on failure and blocks duplicate saves while pending", async () => {
    render(<AIProviderSettings />); await screen.findByRole("radio", { name: "Provider utama" });
    fireEvent.click(screen.getByRole("radio", { name: "Jadikan Codecraft utama" }));
    let complete!: (value: Response) => void;
    mock.fetch.mockReturnValueOnce(new Promise((resolve) => { complete = resolve; }));
    fireEvent.click(screen.getByRole("button", { name: "Simpan pilihan" }));
    expect(screen.getByRole("button", { name: "Menyimpan…" })).toBeDisabled();
    complete(reply({ success: false, error: "Coba simpan lagi." }, 503));
    await screen.findByRole("alert");
    expect(screen.getByRole("radio", { name: "Provider utama" })).toHaveAttribute("value", "codecraft");
    expect(screen.getByRole("button", { name: "Simpan pilihan" })).toBeEnabled();
    expect(mock.fetch).toHaveBeenCalledTimes(2);
  });
  it("prevents activating unconfigured providers and explains SQL setup", async () => {
    mock.fetch.mockResolvedValueOnce(reply({ ...initial, setupRequired: true, providers: initial.providers.map((item) => ({ ...item, configured: item.id !== "codecraft" })) }));
    render(<AIProviderSettings />); await screen.findByText(/SQL 68/);
    expect(screen.getByRole("radio", { name: "Jadikan Codecraft utama" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Simpan pilihan" })).toBeDisabled();
  });
  it("reloads explicitly on conflict rather than silently discarding the draft", async () => {
    render(<AIProviderSettings />); await screen.findByRole("radio", { name: "Provider utama" });
    fireEvent.click(screen.getByRole("radio", { name: "Jadikan Codecraft utama" }));
    mock.fetch.mockResolvedValueOnce(reply({ success: false, error: "Diubah admin lain." }, 409));
    fireEvent.click(screen.getByRole("button", { name: "Simpan pilihan" }));
    await screen.findByRole("alert");
    expect(screen.getByRole("button", { name: "Simpan pilihan" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Muat ulang pengaturan" }));
    await waitFor(() => expect(screen.getByRole("radio", { name: "Provider utama" })).toHaveAttribute("value", "lapakvip"));
  });
});
