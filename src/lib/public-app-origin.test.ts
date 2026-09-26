import { afterEach, describe, expect, it, vi } from "vitest";
import { resolvePublicAppOrigin } from "@/lib/public-app-origin";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("public APP origin", () => {
  it("mengutamakan origin publik yang dikonfigurasi", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.binahub.id");
    expect(resolvePublicAppOrigin("https://0.0.0.0:3000")).toBe("https://app.binahub.id");
  });

  it("menolak origin reverse proxy lokal pada production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://0.0.0.0:3000");
    expect(resolvePublicAppOrigin("https://0.0.0.0:3000")).toBe("https://app.binahub.id");
  });

  it("mempertahankan localhost untuk development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    expect(resolvePublicAppOrigin("http://localhost:3000")).toBe("http://localhost:3000");
  });
});
