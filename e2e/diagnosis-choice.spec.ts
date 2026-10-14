import { test, expect } from '@playwright/test';

test.beforeEach(async ({ baseURL, page }) => {
  test.skip(!/^https?:\/\/(?:127\.0\.0\.1|localhost)(?::|\/|$)/i.test(baseURL || ''), 'UI fixtures only run against a local app.');
  await page.route('**/api/**', route => route.fulfill({ json: { success: false } }));
});

test('balanced responsive choices retain navigation and keyboard access', async ({ page }, info) => {
  await page.route('**/api/assessment/individual/availability', route => route.fulfill({ json: { available: true } }));
  await page.goto('/diagnose?lang=en&utm_source=instagram&utm_campaign=ui-test');
  await expect.poll(() => page.getByRole('img', { name: 'BinaHub', exact: true })
    .evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  const team = page.getByRole('link', { name: 'Mulai diagnosis tim' });
  const individual = page.getByRole('link', { name: 'Mulai diagnosis individu' });
  await expect(team).toHaveAttribute('href', '/en/insight?lang=en&utm_source=instagram&utm_campaign=ui-test');
  await expect(individual).toHaveAttribute('href', '/insight/individual?source=instagram');
  await expect(page.getByRole('link', { name: 'Riwayat pengisian akun' })).toBeVisible();
  await expect(page.getByText(/gratis/i)).toHaveCount(0);

  const widths = info.project.name === 'chromium' ? [1440, 768] : [390, 320];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const cards = await page.getByRole('article').all();
    const bounds = await Promise.all(cards.map(card => card.boundingBox()));
    const teamBounds = await team.boundingBox();
    const individualBounds = await individual.boundingBox();
    if (width >= 720) {
      expect(Math.abs(bounds[0]!.height - bounds[1]!.height)).toBeLessThan(2);
      expect(Math.abs(teamBounds!.y - individualBounds!.y)).toBeLessThan(2);
      expect(teamBounds!.width).toBeCloseTo(individualBounds!.width, 0);
    } else {
      expect(bounds[1]!.y).toBeGreaterThan(bounds[0]!.y + bounds[0]!.height);
      expect(teamBounds!.height).toBeGreaterThanOrEqual(44);
      expect(individualBounds!.height).toBeGreaterThanOrEqual(44);
    }
    await page.screenshot({ path: `test-results/diagnosis-choice-${width}.png`, fullPage: true });
  }
  await team.focus();
  await expect(team).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(individual).toBeFocused();
  await individual.click();
  await expect(page).toHaveURL(/\/insight\/individual\?source=instagram$/);
  await expect(page.getByRole('heading', { name: 'Kenali kebutuhan pengembangan Anda.' })).toBeVisible();
});

test('availability check is announced and paused entry cannot be started', async ({ page }, info) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/assessment/individual/availability', async route => {
    await gate;
    await route.fulfill({ json: { available: false } });
  });
  await page.goto('/diagnose');
  await expect(page.getByRole('button', { name: 'Memeriksa ketersediaan…' })).toBeDisabled();
  await page.screenshot({ path: `test-results/diagnosis-loading-${info.project.name}.png`, fullPage: true });
  release();
  await expect(page.getByText(/Pengisian baru sedang dijeda/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Mulai diagnosis individu' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Mulai diagnosis tim' })).toBeVisible();
  await page.screenshot({ path: `test-results/diagnosis-paused-${info.project.name}.png`, fullPage: true });
});

test('temporary failure has an accessible retry without changing release controls', async ({ page }, info) => {
  let requests = 0;
  await page.route('**/api/assessment/individual/availability', route => route.fulfill({
    status: ++requests === 1 ? 503 : 200,
    json: requests === 1 ? { error: 'synthetic unavailable' } : { available: true },
  }));
  await page.goto('/diagnose');
  await expect(page.getByRole('button', { name: 'Coba lagi' })).toBeVisible();
  await page.screenshot({ path: `test-results/diagnosis-retry-${info.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Coba lagi' }).click();
  await expect(page.getByRole('link', { name: 'Mulai diagnosis individu' })).toBeVisible();
  expect(requests).toBe(2);
});
