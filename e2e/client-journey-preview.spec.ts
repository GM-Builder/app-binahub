import { expect, test } from "@playwright/test";

test.skip(process.env.PLAYWRIGHT_CLIENT_JOURNEY_PREVIEW !== "1", "Opt-in synthetic component preview; no production authentication bypass.");

test("client context, bounded history, handoff and evaluation targets remain read-only until save", async ({ page, baseURL }, info) => {
  expect(baseURL).toMatch(/^http:\/\/(?:127\.0\.0\.1|localhost):/);
  const errors: string[] = [];
  const apiRequests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/**", (route) => { apiRequests.push(route.request().url()); return route.abort(); });
  await page.setViewportSize(info.project.name === "chromium" ? { width: 1440, height: 1000 } : { width: 390, height: 844 });
  await page.goto("/?journey");
  await expect(page.getByRole("region", { name: "Brief kebutuhan" })).toBeVisible();
  await page.getByText("Lihat perjalanan klien", { exact: true }).click();
  await expect(page.getByText("Jadwal konsultasi tercatat")).toBeVisible();
  await expect(page.getByText(/dapat belum mencakup seluruh aktivitas/)).toBeVisible();
  await page.screenshot({ path: `.codex_tmp/client-journey-account-${info.project.name}.png`, fullPage: true });
  await page.getByRole("button", { name: "Lengkapi tujuan & indikator" }).click();
  await expect(page.getByLabel("Tujuan pelaksanaan")).toHaveValue("");
  await expect(page.getByRole("textbox", { name: /^Indikator keberhasilan/ })).toHaveValue("");
  await page.getByRole("button", { name: "Tutup modal" }).click();
  await page.getByRole("button", { name: "Buka detail peluang", exact: true }).click();
  const drawer = page.getByRole("dialog");
  await expect(drawer.getByRole("region", { name: "Brief kebutuhan" })).toBeVisible();
  await page.screenshot({ path: `.codex_tmp/client-journey-opportunity-${info.project.name}.png`, fullPage: true });
  await drawer.getByRole("button", { name: /^Riwayat/ }).click();
  await expect(drawer.getByText("Pengiriman hasil dicatat")).toBeVisible();
  await page.screenshot({ path: `.codex_tmp/client-journey-history-${info.project.name}.png`, fullPage: true });
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
  await page.getByRole("button", { name: "Coba serah terima" }).click();
  await page.getByRole("button", { name: "Serahkan", exact: true }).click();
  await expect(page.getByRole("dialog").getByText(/Disampaikan oleh Nadia Putri/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Buat klien & serahkan" })).toBeDisabled();
  await page.screenshot({ path: `.codex_tmp/client-journey-handoff-${info.project.name}.png`, fullPage: true });
  await page.getByRole("button", { name: "Tutup modal" }).click();
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await expect.poll(() => page.evaluate(() => {
      if (document.documentElement.scrollWidth <= window.innerWidth) return [];
      return Array.from(document.querySelectorAll("main *"))
        .filter((element) => element.getBoundingClientRect().right > window.innerWidth)
        .slice(0, 5).map((element) => `${element.tagName}: ${element.textContent?.slice(0, 70)}`);
    })).toEqual([]);
  }
  expect(apiRequests).toEqual([]);
  expect(errors).toEqual([]);
});
