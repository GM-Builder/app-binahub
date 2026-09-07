import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAuthenticatedRole, fetchCurrentAuthenticatedRole } from "./authenticated-role";

type AuthClient = Parameters<typeof fetchCurrentAuthenticatedRole>[0];

function roleResponse(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function session(accessToken: string, userId = "user-1") {
  return {
    access_token: accessToken,
    user: { id: userId },
  };
}

describe("fetchAuthenticatedRole", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("menolak token kosong tanpa memanggil jaringan", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    await expect(fetchAuthenticatedRole("  ")).resolves.toMatchObject({
      ok: false,
      status: 401,
      role: null,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("selalu mengirim bearer token dan tidak memakai cache", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      success: true,
      role: "admin",
      fullName: "Admin BinaHub",
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));

    await expect(fetchAuthenticatedRole("access-token")).resolves.toEqual({
      ok: true,
      status: 200,
      role: "admin",
      fullName: "Admin BinaHub",
      error: "",
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/role", {
      headers: { Authorization: "Bearer access-token" },
      cache: "no-store",
    });
  });

  it("tidak mempercayai role yang tidak dikenal", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      success: true,
      role: "superadmin",
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));

    await expect(fetchAuthenticatedRole("access-token")).resolves.toMatchObject({
      ok: false,
      status: 200,
      role: null,
    });
  });

  it("memakai sesi saat ini tanpa refresh ketika token masih valid", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(roleResponse(200, {
      success: true,
      role: "admin",
    }));
    const auth = {
      getSession: vi.fn().mockResolvedValue({ data: { session: session("current-token") }, error: null }),
      refreshSession: vi.fn(),
      signOut: vi.fn(),
    } as unknown as AuthClient;

    await expect(fetchCurrentAuthenticatedRole(auth)).resolves.toMatchObject({
      ok: true,
      role: "admin",
      userId: "user-1",
    });
    expect(auth.refreshSession).not.toHaveBeenCalled();
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it("refresh satu kali lalu mengulangi pemeriksaan role ketika token lama ditolak", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(roleResponse(403, { success: false, error: "Token tidak valid" }))
      .mockResolvedValueOnce(roleResponse(200, { success: true, role: "admin" }));
    const auth = {
      getSession: vi.fn().mockResolvedValue({ data: { session: session("stale-token") }, error: null }),
      refreshSession: vi.fn().mockResolvedValue({ data: { session: session("fresh-token") }, error: null }),
      signOut: vi.fn(),
    } as unknown as AuthClient;

    await expect(fetchCurrentAuthenticatedRole(auth)).resolves.toMatchObject({
      ok: true,
      role: "admin",
      userId: "user-1",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/auth/role", {
      headers: { Authorization: "Bearer fresh-token" },
      cache: "no-store",
    });
    expect(auth.refreshSession).toHaveBeenCalledTimes(1);
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it("membersihkan sesi lokal jika token hasil refresh tetap ditolak", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(roleResponse(403, { success: false, error: "Token tidak valid" }))
      .mockResolvedValueOnce(roleResponse(403, { success: false, error: "Token tidak valid" }));
    const auth = {
      getSession: vi.fn().mockResolvedValue({ data: { session: session("stale-token") }, error: null }),
      refreshSession: vi.fn().mockResolvedValue({ data: { session: session("still-invalid") }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    } as unknown as AuthClient;

    await expect(fetchCurrentAuthenticatedRole(auth)).resolves.toMatchObject({
      ok: false,
      status: 401,
      role: null,
      userId: "",
      error: "Sesi tidak valid. Silakan masuk kembali.",
    });
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });
});
