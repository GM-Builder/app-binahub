import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load the homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/BinaHub/i);
  });

  test("should display main content", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });

  test("should have working navigation links", async ({ page }) => {
    await page.goto("/");
    const links = page.locator("a[href]");
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe("Navigation", () => {
  test("should navigate to login page", async ({ page }) => {
    await page.goto("/");
    const loginLink = page.locator('a[href="/login"]').first();
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/login/);
    }
  });

  test("should navigate to help page", async ({ page }) => {
    await page.goto("/");
    const helpLink = page.locator('a[href="/help"]').first();
    if (await helpLink.isVisible()) {
      await helpLink.click();
      await expect(page).toHaveURL(/help/);
    }
  });
});

test.describe("Client Pages", () => {
  test("should load client dashboard", async ({ page }) => {
    await page.goto("/client/dashboard");
    await expect(page.locator("body")).toBeVisible();
  });

  test("should load client capability page", async ({ page }) => {
    await page.goto("/client/capability");
    await expect(page.locator("body")).toBeVisible();
  });

  test("should load client actions page", async ({ page }) => {
    await page.goto("/client/actions");
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Facilitator Pages", () => {
  test("should load facilitator dashboard", async ({ page }) => {
    await page.goto("/facilitator/dashboard");
    await expect(page.locator("body")).toBeVisible();
  });

  test("should load facilitator evidence page", async ({ page }) => {
    await page.goto("/facilitator/evidence");
    await expect(page.locator("body")).toBeVisible();
  });

  test("should load facilitator events page", async ({ page }) => {
    await page.goto("/facilitator/events");
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Help Pages", () => {
  test("should load help landing page", async ({ page }) => {
    await page.goto("/help");
    await expect(page.locator("body")).toBeVisible();
  });

  test("should load help support page", async ({ page }) => {
    await page.goto("/help/support");
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Admin Pages", () => {
  test("should load admin dashboard", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("body")).toBeVisible();
  });

  test("should load admin RBAC page", async ({ page }) => {
    await page.goto("/admin/rbac");
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Accessibility", () => {
  test("should have skip-to-content link", async ({ page }) => {
    await page.goto("/");
    const skipLink = page.locator('a[href="#content"]');
    await expect(skipLink).toHaveCount(1);
  });

  test("should have proper heading structure", async ({ page }) => {
    await page.goto("/");
    const h1 = page.locator("h1");
    const h1Count = await h1.count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });
});
