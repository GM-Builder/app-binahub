import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
const origin = 'http://127.0.0.1:4318';
const browser = await chromium.launch({ headless: true }); let checks = 0;
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1024, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
    const page = await browser.newPage({ viewport }), errors = [], external = [], writes = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => { window.campaignActions = []; window.addEventListener('campaign-preview-action', event => window.campaignActions.push(event.detail)); });
    await page.route('**/*', route => {
      const request = route.request(), url = new URL(request.url());
      if (url.origin !== origin) { external.push(url.hostname); return route.abort(); }
      if (request.method() !== 'GET') { writes.push(request.method()); return route.fulfill({ status: 409, json: { error: 'Real mutations disabled' } }); }
      return route.continue();
    });
    await page.goto(origin + '/?outbound'); await page.getByRole('checkbox', { name: 'Pilih nadia@example.com', exact: true }).waitFor();
    assert(await page.getByRole('checkbox', { name: 'Pilih mira@example.com', exact: true }).isDisabled());
    assert.equal(await page.getByRole('region', { name: 'Email dan pengiriman', exact: true }).count(), 0);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `tmp/campaign-recipients-${viewport.width}.png`, fullPage: true }); checks++;
    await page.getByRole('checkbox', { name: 'Pilih nadia@example.com', exact: true }).check();
    await page.getByRole('button', { name: 'Lanjut ke email', exact: true }).click(); await page.getByTitle('Preview email kampanye').waitFor();
    await page.screenshot({ path: `tmp/campaign-email-${viewport.width}.png`, fullPage: true }); checks++;
    await page.getByText('Kirim email uji ke saya · opsional', { exact: true }).click(); await page.getByRole('button', { name: 'Kirim email uji', exact: true }).click();
    await page.getByRole('dialog', { name: 'Kirim email uji?', exact: true }).waitFor(); await page.getByRole('button', { name: 'Tutup dialog konfirmasi', exact: true }).click();
    assert.equal(await page.evaluate(() => window.campaignActions.filter(a => a.method === 'POST').length), 0); checks++;
    await page.getByRole('button', { name: 'Lanjut ke tinjauan', exact: true }).click(); await page.getByRole('heading', { name: 'Periksa pengiriman Anda', exact: true }).waitFor();
    assert(await page.getByRole('region', { name: 'Tinjauan pengiriman', exact: true }).getByText('nadia@example.com', { exact: true }).isVisible());
    await page.screenshot({ path: `tmp/campaign-review-${viewport.width}.png`, fullPage: true }); checks++;
    await page.getByRole('button', { name: 'Ubah penerima', exact: true }).click(); assert(await page.getByRole('checkbox', { name: 'Pilih nadia@example.com', exact: true }).isChecked());
    await page.getByRole('button', { name: 'Lanjut ke email', exact: true }).click(); await page.getByRole('button', { name: 'Lanjut ke tinjauan', exact: true }).click(); checks++;
    await page.getByRole('button', { name: 'Tinjau & kirim', exact: true }).click(); const confirm = page.getByRole('dialog', { name: 'Kirim email ke 1 target?', exact: true }); await confirm.waitFor();
    assert(await confirm.getByText('nadia@example.com', { exact: true }).isVisible()); await confirm.getByRole('button', { name: 'Konfirmasi pengiriman', exact: true }).click();
    await page.getByRole('heading', { name: 'Status pengiriman', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => window.campaignActions.filter(a => a.body?.action === 'send').length), 1); checks++;
    await page.getByRole('button', { name: 'Buat kampanye', exact: true }).click(); await page.getByRole('textbox', { name: 'Nama kampanye', exact: true }).fill('Kampanye baru sintetis');
    await page.getByRole('button', { name: 'Gunakan asal daftar baru', exact: true }).click(); await page.getByRole('textbox', { name: 'Nama daftar', exact: true }).waitFor();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: `tmp/campaign-source-${viewport.width}.png`, fullPage: true }); checks++;
    await page.getByRole('textbox', { name: 'Nama daftar', exact: true }).fill('Kontak acara sintetis');
    await page.getByRole('textbox', { name: 'Bagaimana daftar diperoleh?', exact: true }).fill('Daftar kontak contoh yang telah ditinjau');
    await page.getByRole('combobox', { name: 'Dasar penggunaan yang telah ditetapkan', exact: true }).selectOption('consent');
    await page.getByRole('textbox', { name: 'Tautan pemberitahuan privasi', exact: true }).fill('https://company.invalid/privacy');
    await page.getByRole('spinbutton').fill('30'); await page.getByRole('textbox', { name: 'Email pemilik data', exact: true }).fill('owner@company.invalid');
    await page.getByRole('textbox', { name: 'Email penanggung jawab legal', exact: true }).fill('legal@company.invalid');
    await page.getByRole('textbox', { name: 'Catatan pemeriksaan', exact: true }).fill('Data sintetis telah ditinjau.'); await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Setujui sumber & lanjut', exact: true }).click(); await page.getByRole('textbox', { name: 'Nama kampanye', exact: true }).waitFor();
    await page.getByRole('dialog').getByRole('button', { name: 'Buat kampanye', exact: true }).click(); await page.getByRole('dialog').waitFor({ state: 'hidden' }); checks++;
    await page.goto(origin + '/?outbound&inbound'); await page.getByRole('heading', { name: 'Kampanye inbound', exact: true }).waitFor();
    assert(await page.getByRole('button', { name: 'Salin tautan', exact: true }).isVisible());
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: `tmp/campaign-inbound-${viewport.width}.png`, fullPage: true }); checks++;
    await page.getByRole('button', { name: 'Buat kampanye', exact: true }).click(); await page.getByRole('textbox', { name: 'Nama kampanye', exact: true }).fill('Kampanye inbound sintetis');
    await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Buat tautan kampanye', exact: true }).click(); await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page.getByRole('heading', { name: 'Kampanye inbound sintetis', exact: true }).waitFor();
    const url = await page.getByRole('textbox', { name: 'Tautan Kampanye inbound sintetis', exact: true }).inputValue(); assert(url.startsWith('https://binahub.id/rekomendasi-program?utm_source=social&')); checks++;
    await page.getByRole('button', { name: 'Respons masuk', exact: true }).click(); await page.getByRole('heading', { name: 'Respons yang masuk dari kampanye', exact: true }).waitFor();
    assert(await page.getByText(/bukan total sepanjang waktu dan bukan jumlah orang unik/).isVisible());
    await page.screenshot({ path: `tmp/campaign-inbound-responses-${viewport.width}.png`, fullPage: true }); checks++;
    assert.deepEqual(errors, []); assert.deepEqual(external, []); assert.deepEqual(writes, []); checks++; await page.close();
  }
  console.log(`[PASS] ${checks} local Chromium campaign checks; four viewports, in-memory API fixture, real writes/external network blocked`);
} finally { await browser.close(); }
