import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { funnelDashboard } from "@/test/fixtures/sales-funnel";
const mocks = vi.hoisted(() => ({ fetch: vi.fn(), session: vi.fn(), replace: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ supabase: { auth: { getSession: mocks.session } } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }) }));
vi.mock("@/components/admin-auth-gate", () => ({ AdminAuthGate: ({ children }: { children: ReactNode }) => children }));
vi.mock("@/components/admin-shell", () => ({ AdminShell: ({ children, title }: { children: ReactNode; title: string }) => <main><h1>{title}</h1>{children}</main> }));
vi.mock("./observability-panel", () => ({ ObservabilityPanel: () => <section aria-label="Peringatan operasional" /> }));
import { AdminWorkspace } from "./admin-workspace";
beforeEach(() => {
  mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true, ...funnelDashboard([]) }) });
  mocks.session.mockResolvedValue({ data: { session: { access_token: "admin-test-token", user: { id: "placement-test-admin" } } } });
  vi.stubGlobal("fetch", mocks.fetch);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe("dashboard funnel placement", () => {
  it("places the funnel first before warnings and existing overview sections", async () => {
    const view = render(<AdminWorkspace section="Overview" />);
    const funnel = await screen.findByRole("region", { name: "Sales funnel" });
    expect(screen.getByRole("heading", { name: "Dashboard bisnis" })).toBeInTheDocument();
    const sections = Array.from(view.container.querySelectorAll("section"));
    expect(sections[0]).toBe(funnel);
    expect(sections[1]).toBe(screen.getByRole("region", { name: "Peringatan operasional" }));
    expect(sections.indexOf(screen.getByRole("region", { name: "Hal yang membutuhkan keputusan Anda" }))).toBeGreaterThan(1);
  });
});
