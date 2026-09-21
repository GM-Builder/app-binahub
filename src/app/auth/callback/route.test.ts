import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const exchangeCodeForSession = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { exchangeCodeForSession },
  })),
}));

import { GET } from "./route";

describe("GET /auth/callback", () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset();
  });

  it("menukar code PKCE satu kali lalu menuju path internal", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });

    const response = await GET(new NextRequest("https://app.binahub.id/auth/callback?code=valid&next=%2Fadmin%2Ftbos"));

    expect(exchangeCodeForSession).toHaveBeenCalledOnce();
    expect(exchangeCodeForSession).toHaveBeenCalledWith("valid");
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://app.binahub.id/admin/tbos");
  });

  it("menolak callback tanpa code", async () => {
    const response = await GET(new NextRequest("https://app.binahub.id/auth/callback"));

    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://app.binahub.id/?mode=signin&error=auth_callback_missing_code");
  });

  it("kembali ke login jika penukaran code gagal", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: new Error("PKCE invalid") });

    const response = await GET(new NextRequest("https://app.binahub.id/auth/callback?code=expired"));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://app.binahub.id/?mode=signin&error=auth_callback_failed");
  });
});
