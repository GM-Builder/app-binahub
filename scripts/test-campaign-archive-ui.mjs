import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
const origin = 'http://127.0.0.1:4318';
const browser = await chromium.launch({ headless: true }); let checks = 0;
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1024, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
    const page = await browser.newPage({ viewport }), errors = [], external = [], writes = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => { window.campaignActions = []; window.addEventListener('campaign-preview-action', e => window.campaignActions.push(e.detail)); });
    await page.route('**/*', route => {
      const request = route.request(), url = new URL(request.url());
      if (url.origin !== origin) { external.push(url.hostname); return route.abort(); }
      if (request.method() !== 'GET') { writes.push(request.method()); return route.abort(); }
      return route.continue();
    });
    await page.goto(origin + '/?campaign-archive'); await page.getByRole('heading', { name: 'Arsip kampanye', exact: true }).waitFor();
    await page.getByText('1.005 catatan cocok · 1–20 ditampilkan', { exact: true }).waitFor();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); checks++;
    await page.screenshot({ path: `tmp/campaign-archive-list-${viewport.width}.png`, fullPage: false });
    await page.getByRole('button', { name: 'Berikutnya', exact: true }).click(); await page.getByText('Halaman 2 dari 51', { exact: true }).waitFor(); checks++;
    await page.getByRole('searchbox').fill('%_* 東京'); await page.getByText('1 catatan cocok · 1–1 ditampilkan', { exact: true }).waitFor();
    assert(await page.getByText('1.005', { exact: true }).isVisible()); assert(await page.getByRole('button', { name: 'Sebelumnya', exact: true }).isDisabled()); checks++;
    await page.getByRole('button', { name: 'Buka riwayat', exact: true }).click(); await page.getByRole('heading', { name: 'Pengiriman email', exact: true }).waitFor();
    await page.getByText('Email uji · Indonesia', { exact: true }).first().waitFor(); assert(await page.getByText(/bukan bukti masuk inbox/).isVisible());
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); checks++;
    await page.screenshot({ path: `tmp/campaign-archive-history-${viewport.width}.png`, fullPage: false });
    await page.getByRole('button', { name: 'Daftar penerima', exact: true }).click(); await page.getByRole('heading', { name: 'Daftar penerima', exact: true }).waitFor();
    await page.getByText(/Bukan persetujuan kirim baru/).first().waitFor(); checks++;
    await page.getByRole('button', { name: 'Riwayat impor', exact: true }).click(); await page.getByRole('heading', { name: 'Riwayat impor', exact: true }).waitFor();
    await page.getByText('50 baris · 44 valid · 2 tidak valid · 3 ganda · 1 tersaring', { exact: true }).first().waitFor(); checks++;
    await page.getByRole('button', { name: 'Kunjungan inbound', exact: true }).click(); await page.getByRole('button', { name: 'Lihat aktivitas', exact: true }).first().waitFor();
    assert(await page.getByText(/bukan jumlah orang unik/).isVisible()); await page.getByRole('button', { name: 'Lihat aktivitas', exact: true }).first().click();
    await page.getByRole('heading', { name: 'Aktivitas kunjungan', exact: true }).waitFor(); checks++;
    await page.getByRole('button', { name: 'Kembali ke daftar arsip', exact: true }).click(); assert.equal(await page.getByRole('searchbox').inputValue(), '%_* 東京'); checks++;
    await page.goto(origin + '/?campaign-archive&archive-error'); await page.getByRole('alert').waitFor();
    assert(await page.getByRole('alert').getByText(/SQL88/).isVisible()); assert.equal(await page.getByRole('button', { name: 'Buka riwayat', exact: true }).count(), 0); checks++;
    assert.deepEqual(errors, []); assert.deepEqual(external, []); assert.deepEqual(writes, []);
    assert(await page.evaluate(() => window.campaignActions.every(a => a.method === 'GET'))); checks++; await page.close();
  }
  console.log(`[PASS] ${checks} local Chromium archive checks; four viewports; synthetic data; real writes and external network blocked`);
} finally { await browser.close(); }
