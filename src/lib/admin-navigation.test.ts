import { describe, expect, it } from "vitest";
import { ADMIN_NAV_ITEMS, findAdminNavigation } from "./admin-navigation";

describe("admin navigation", () => {
  it("memiliki URL kanonis yang unik", () => {
    const hrefs = ADMIN_NAV_ITEMS.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("memetakan pintu masuk lama ke dashboard", () => {
    expect(findAdminNavigation("/admin").item.href).toBe("/admin/dashboard");
  });

  it("memilih route paling spesifik untuk test program", () => {
    expect(findAdminNavigation("/admin/programs/tests").item.href).toBe("/admin/programs/tests");
  });

  it("mempertahankan route kelola program sebagai bagian dari Program", () => {
    expect(findAdminNavigation("/admin/engagements/manage").item.href).toBe("/admin/programs");
  });

  it("memetakan detail peserta ke area Klien", () => {
    expect(findAdminNavigation("/admin/clients/detail").item.href).toBe("/admin/clients");
  });

  it("menampilkan control plane pilot sebagai halaman tata kelola", () => {
    const pilot = ADMIN_NAV_ITEMS.find((item) => item.href === "/admin/governance");
    expect(pilot?.label).toBe("Kesiapan & Pilot");
    expect(findAdminNavigation("/admin/governance").item.href).toBe("/admin/governance");
  });
});
