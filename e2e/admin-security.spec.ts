import { expect, test } from "@playwright/test";

test.describe("Admin security boundary", () => {
  test("an anonymous visitor is rejected before the admin workspace renders", async ({ context, page }) => {
    await context.clearCookies();
    await page.goto("/admin/governance");

    await expect(page).toHaveURL(/\?mode=signin&reason=session_expired/);
    await expect(page.locator("#admin-page-content")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Masuk ke akun Anda" })).toBeVisible();
  });

  test("the unauthenticated role probe fails closed", async ({ request }) => {
    const response = await request.get("/api/auth/role");
    expect(response.status()).toBe(401);
  });
});
