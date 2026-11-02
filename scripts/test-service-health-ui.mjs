import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const browser = await chromium.launch({ headless: true });
let checks = 0;
try {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("https://**/*", (route) => route.abort());
    await page.goto("http://127.0.0.1:4318/?monitoring");
    await page.getByText("Siap dibaca", { exact: true }).waitFor();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    checks++;
    await page.screenshot({
      path: `tmp/service-health-${viewport.width}.png`,
      fullPage: true,
    });
    await page
      .getByRole("combobox", { name: "Skenario uji" })
      .selectOption("attention");
    await page
      .getByRole("alert")
      .filter({ hasText: "pekerjaan terlambat" })
      .waitFor();
    await page.getByRole("button", { name: "Tutup notifikasi" }).click();
    await page.screenshot({
      path: `tmp/service-health-attention-${viewport.width}.png`,
      fullPage: true,
    });
    checks++;
    await page
      .getByRole("combobox", { name: "Skenario uji" })
      .selectOption("never_seen");
    await page
      .getByText("Belum ada aktivitas tercatat", { exact: true })
      .waitFor();
    assert(await page.getByText(/Jadwal pemulihan masih menunggu/).isVisible());
    checks++;
    await page
      .getByRole("combobox", { name: "Skenario uji" })
      .selectOption("setup_required");
    await page.getByText(/Periksa deployment API dan SQL81/).waitFor();
    assert.equal(
      await page.getByText("Siap dibaca", { exact: true }).count(),
      0,
    );
    checks++;
    await page
      .getByRole("combobox", { name: "Skenario uji" })
      .selectOption("offline");
    await page
      .getByRole("alert")
      .filter({ hasText: "Status layanan belum dapat dimuat" })
      .waitFor();
    assert.equal(
      await page.getByText("Siap dibaca", { exact: true }).count(),
      0,
    );
    checks++;
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log(
    `[PASS] ${checks} local Chromium monitoring checks; desktop/mobile, no real services`,
  );
} finally {
  await browser.close();
}
