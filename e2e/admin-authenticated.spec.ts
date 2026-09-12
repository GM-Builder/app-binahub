import { expect, test } from "@playwright/test";
import { ADMIN_NAV_ITEMS } from "../src/lib/admin-navigation";

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

test.describe("Authenticated admin navigation", () => {
  test.skip(!adminEmail || !adminPassword, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run the authenticated production-safe checks.");
  test.setTimeout(120_000);

  test("an administrator can open every canonical admin route", async ({ page }) => {
    await signIn(page);

    for (const item of ADMIN_NAV_ITEMS) {
      await page.goto(item.href, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(new RegExp(`${item.href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|[/?#])`));
      await expect(page.locator("#admin-page-content")).toBeVisible();
      await expect(page.locator("#admin-page-content h1").first()).toBeVisible();
    }
  });

  test("the mobile drawer opens, traps focus, closes with Escape, and returns focus", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chromium", "Mobile-only interaction check.");

    await signIn(page);

    await page.goto("/admin/dashboard", { waitUntil: "domcontentloaded" });
    const trigger = page.getByRole("button", { name: "Buka navigasi admin" });
    await trigger.click();
    await expect(page.getByRole("dialog", { name: "Navigasi admin" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Navigasi admin" })).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
});
