import { expect, test } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/?mode=signin", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Masuk dengan Email", exact: true }).click();
  await page.locator("#auth-email:visible").fill(adminEmail || "");
  await page.locator("#auth-password:visible").fill(adminPassword || "");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(/\/home/, { timeout: 20_000 });
}

test.describe("T-BOS production workspace", () => {
  test.skip(!adminEmail || !adminPassword, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run T-BOS production checks.");
  test.setTimeout(90_000);

  test("admin can load the program, controls, and every report view", async ({ page }) => {
    await signIn(page);
    await page.goto("/admin/tbos", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Dashboard T-BOS" })).toBeVisible();
    const program = page.getByLabel("Program");
    await expect(program).toBeEnabled({ timeout: 20_000 });
    await expect(program).not.toHaveValue("");
    await expect(page.getByRole("button", { name: /Tambah Tim/ }).first()).toBeVisible();

    const emptyState = page.getByRole("heading", { name: "Belum Ada Data Tim T-BOS" });
    if (await emptyState.isVisible()) {
      await expect(page.getByPlaceholder(/Nama batch/)).toBeVisible();
    } else {
      await expect(page.getByRole("button", { name: "Tugaskan Fasilitator" })).toBeVisible();
      for (const tab of [
        "Ringkasan",
        "Ringkasan Eksekutif",
        "Laporan per Tim",
        "Grafik Radar",
        "Heatmap",
        "Peringkat",
        "Perbandingan Batch",
      ]) {
        const button = page.getByRole("button", { name: tab, exact: true });
        await expect(button).toBeVisible();
        await button.click();
        await expect(button).toHaveAttribute("aria-pressed", "true");
      }
    }

    await expect(page.getByText(/tbos_teams_batch_check|violates check constraint/i)).toHaveCount(0);
  });
});
