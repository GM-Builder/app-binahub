import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));

vi.mock("@/lib/supabase", () => ({
  supabase: { auth: { getSession } },
}));

import { apiFetch } from "@/lib/api-fetch";

describe("apiFetch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    getSession.mockReset();
    getSession.mockResolvedValue({
      data: { session: { access_token: "test-access-token" } },
      error: null,
    });
  });

  it("targets the API origin and attaches the current bearer token", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));

    await apiFetch("/api/tbos/missions");

    const [url, init] = fetchMock.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(String(url)).toBe("https://api.binahub.id/api/tbos/missions");
    expect(headers.get("Authorization")).toBe("Bearer test-access-token");
    expect(headers.get("X-Request-ID")).toMatch(/^[0-9a-f-]{36}$/i);
    expect(init?.credentials).toBe("include");
  });

  it("preserves caller authorization and FormData content type handling", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    const body = new FormData();
    body.set("evidence", new Blob(["ok"], { type: "text/plain" }), "evidence.txt");

    await apiFetch("https://api.binahub.id/api/evidence", {
      method: "POST",
      headers: { Authorization: "Bearer caller-token" },
      body,
    });

    const [, init] = fetchMock.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe("Bearer caller-token");
    expect(headers.has("Content-Type")).toBe(false);
    expect(getSession).not.toHaveBeenCalled();
  });

  it("fails closed when no authenticated session exists", async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    const fetchMock = vi.spyOn(globalThis, "fetch");

    await expect(apiFetch("/api/tbos/missions")).rejects.toThrow("Sesi tidak tersedia");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
