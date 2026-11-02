import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

// Loopback-only synthetic fixture. Never use this script against a live admin API.
const origin = 'http://127.0.0.1:4318';
const records = Array.from({ length: 41 }, (_, index) => ({
  id: String(index), status: 'ready',
  contact: { name: `Klien ${index + 1}`, company: index === 40 ? 'Arsip lama Nusantara' : `Perusahaan Nusantara ${index + 1}`, email: `sintetis-${index + 1}@example.invalid` },
  submitted_at: '2026-10-01T00:00:00Z',
}));
const browser = await chromium.launch({ headless: true });
let checks = 0;
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    let failing = false;
    let fallback = false;
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) return route.abort();
      if (!url.pathname.startsWith('/api/')) return route.continue();
      if (failing) return route.fulfill({ status: 503, json: {} });
      if (fallback && url.pathname.endsWith('/meetings')) return route.fulfill({ status: 503, json: {} });
      const search = (url.searchParams.get('search') || '').toLowerCase();
      const filtered = records.filter((row) => `${row.contact.name} ${row.contact.company} ${row.contact.email}`.toLowerCase().includes(search));
      const offset = Number(url.searchParams.get('page') || 0) * 20;
      return route.fulfill({ json: { records: filtered.slice(offset, offset + 20), total: filtered.length, searchApplied: true } });
    });
    await page.goto(origin + '/?spin&view=admin');
    await page.getByText('1–20 dari 41', { exact: true }).waitFor();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `tmp/spin-inbox-${viewport.width}.png`, fullPage: true }); checks++;
    await page.getByRole('button', { name: 'Berikutnya', exact: true }).click();
    await page.getByText('21–40 dari 41', { exact: true }).waitFor(); checks++;
    await page.getByRole('searchbox', { name: 'Cari kebutuhan klien' }).fill('Arsip lama');
    await page.getByText('Arsip lama Nusantara', { exact: true }).waitFor();
    assert(await page.getByText('1 hasil pencarian', { exact: true }).isVisible());
    assert(await page.getByRole('button', { name: 'Sebelumnya' }).isDisabled());
    await page.screenshot({ path: `tmp/spin-inbox-search-${viewport.width}.png`, fullPage: true }); checks++;
    fallback = true;
    await page.getByRole('searchbox').fill('tidak ditemukan');
    await page.getByRole('heading', { name: 'Tidak ada kebutuhan yang cocok' }).waitFor();
    assert(await page.getByRole('button', { name: 'Mulai checklist' }).isDisabled());
    await page.screenshot({ path: `tmp/spin-inbox-empty-${viewport.width}.png`, fullPage: true }); checks++;
    failing = true;
    await page.getByRole('button', { name: 'Hapus pencarian' }).click();
    await page.getByRole('alert').waitFor();
    assert.equal(await page.getByText('Arsip lama Nusantara', { exact: true }).count(), 0);
    await page.screenshot({ path: `tmp/spin-inbox-error-${viewport.width}.png`, fullPage: true }); checks++;
    failing = false;
    await page.getByRole('button', { name: 'Coba muat lagi' }).click();
    await page.getByText('1–20 dari 41', { exact: true }).waitFor();
    assert.deepEqual(errors, []); checks++;
    await page.close();
  }
  console.log(`[PASS] ${checks} local Chromium inbox checks; desktop/mobile, mocked APIs, no live services`);
} finally { await browser.close(); }
