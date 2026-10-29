import { expect, test } from '@playwright/test';
import definition from '../src/test/fixtures/spin-definition.json';

test.skip(process.env.PLAYWRIGHT_DIAGNOSIS_REFERENCE !== '1', 'Synthetic loopback production-build test only.');

test('reference design preserves all five stages, nonblocking saves, navigation and a single submission', async ({ page, baseURL }, info) => {
  test.setTimeout(180000);
  expect(baseURL).toMatch(/^http:\/\/127\.0\.0\.1:/);
  const phone = info.project.name.includes('mobile');
  const device = phone ? 'mobile' : 'desktop';
  await page.setViewportSize({ width: phone ? 390 : 1440, height: phone ? 844 : 1000 });
  const browserErrors: string[] = [];
  page.on('pageerror', error => browserErrors.push(error.message));
  let id = '11111111-1111-4111-8111-111111111111';
  let revision = 0;
  let answers: Record<string, unknown> = {};
  let confirmation: unknown = null;
  let submissions = 0;
  let releaseFirstSave: (() => void) | undefined;
  let firstSave = true;
  const saveGate = new Promise<void>(resolve => { releaseFirstSave = resolve; });
  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/assessment/individual/availability') return route.fulfill({ json: { available: true } });
    if (path === '/api/discovery/spin' && request.method() === 'GET') return route.fulfill({ json: { success: true, definition, available: true } });
    if (path === '/api/discovery/spin' && request.method() === 'POST') {
      id = request.postDataJSON().id;
      return route.fulfill({ json: { success: true, attempt: { id, revision, answers, confirmation, status: 'draft' }, challenge: 'Berapa 3 + 4?' } });
    }
    if (path === '/api/discovery/spin/' + id && request.method() === 'PATCH') {
      if (firstSave) { firstSave = false; await saveGate; }
      const body = request.postDataJSON();
      answers = body.answers; confirmation = body.confirmation; revision++;
      if (body.submit) { submissions++; expect(body.submit.processingConsent).toBe(true); expect(body.submit.marketingConsent).toBe(false); }
      return route.fulfill({ json: { success: true, attempt: { id, revision, answers, confirmation, status: body.submit ? 'queued' : 'draft' }, summaryHash: 'a'.repeat(64) } });
    }
    return route.fulfill({ status: 503, json: { success: false, error: 'Synthetic preview blocks all other API calls.' } });
  });
  const capture = async (name: string) => {
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: '.impeccable/review/diagnosis-reference-' + name + '-' + device + '.png', fullPage: true, animations: 'disabled' });
  };
  const noOverflow = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const checkWidths = async () => {
    for (const width of phone ? [320, 390] : [768, 1280, 1440, 1600]) { await page.setViewportSize({ width, height: phone ? 844 : 1000 }); await noOverflow(); }
    await page.setViewportSize({ width: phone ? 390 : 1440, height: phone ? 844 : 1000 });
  };

  try {
    await page.goto('/diagnose?utm_source=instagram&utm_campaign=reference-test');
    await expect(page.getByRole('link', { name: 'Lihat paket individu' })).toHaveAttribute('href', '/insight/individual/packages?utm_source=instagram&utm_campaign=reference-test&source=instagram');
    await expect(page.getByRole('link', { name: 'Mulai diagnosis tim' })).toHaveAttribute('href', '/insight?utm_source=instagram&utm_campaign=reference-test');
    await expect.poll(() => page.getByRole('img', { name: 'BinaHub', exact: true }).evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    await expect(page.getByText(/gratis/i)).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Sudah pernah melakukan diagnosis?' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Buka hasil atau draf individu' })).toHaveAttribute('href', '/insight/individual/packages#hasil-sebelumnya');
    await checkWidths(); await capture('choice');
    await page.getByRole('link', { name: 'Mulai diagnosis tim' }).focus();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Lihat paket individu' })).toBeFocused();
    await page.getByRole('link', { name: 'Dapatkan rekomendasi program' }).click();
    await expect(page).toHaveURL(/\/discovery$/);
    await expect(page.getByRole('button', { name: 'Mulai pengisian' })).toBeDisabled();
    await expect(page.getByRole('checkbox')).not.toBeChecked();
    await page.getByText('Penggunaan dan penyimpanan data', { exact: true }).click();
    await expect(page.getByText(/tanpa menyertakan nama, alamat email/)).toBeVisible();
    await page.getByText('Penggunaan dan penyimpanan data', { exact: true }).click();
    await capture('onboarding');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Mulai pengisian' }).click();
    await expect(page.getByRole('combobox', { name: /Apa yang paling mendorong/ })).toBeVisible();
    await checkWidths(); await capture('form');
    await page.getByRole('combobox', { name: /Apa yang paling mendorong/ }).selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Lanjut', exact: true }).click();
    await expect(page.getByRole('group', { name: 'Peran Anda', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lanjut', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Kembali', exact: true }).click();
    await expect(page.getByRole('combobox', { name: /Apa yang paling mendorong/ })).not.toHaveValue('');
    releaseFirstSave!();

    const seenStages = new Set<string>();
    for (let step = 0; step < 28; step++) {
      const current = page.getByRole('navigation', { name: 'Tahap pengisian' }).locator('[aria-current="step"]');
      seenStages.add((await current.innerText()).replace(/^\d+,?\s*(selesai)?\s*/, '').trim());
      await expect(page.getByRole('navigation', { name: 'Tahap pengisian' }).getByRole('listitem')).toHaveCount(5);
      await noOverflow();
      if (await page.getByRole('heading', { name: 'Ke mana laporan Anda dikirim?' }).count()) break;
      for (let round = 0; round < 3; round++) {
        const groups = page.locator('fieldset');
        for (let n = 0; n < await groups.count(); n++) {
          const group = groups.nth(n), select = group.locator('select'), text = group.locator('textarea'), number = group.locator('input[type="number"]'), checks = group.locator('input[type="checkbox"]');
          if (await select.count() && !await select.inputValue()) await select.selectOption({ index: 1 });
          else if (await text.count() && !await text.inputValue()) await text.fill('Tim menyepakati keputusan, pembagian peran, dan tindak lanjut yang jelas.');
          else if (await number.count() && !await number.inputValue()) await number.fill('20');
          else if (await checks.count() && await group.locator('input:checked').count() === 0) await checks.first().check();
        }
      }
      const before = (await page.locator('#spin-screen-title, fieldset legend').allTextContents()).join('|');
      const confirmationButton = page.getByRole('button', { name: 'Konfirmasi & lanjut' });
      if (await confirmationButton.count()) await confirmationButton.click(); else await page.getByRole('button', { name: 'Lanjut', exact: true }).click();
      await expect.poll(async () => (await page.locator('#spin-screen-title, fieldset legend').allTextContents()).join('|')).not.toBe(before);
      await expect(page.locator('main [role="alert"]')).toHaveCount(0);
    }
    expect(seenStages.size).toBe(5);
    await expect(page.getByRole('heading', { name: 'Ke mana laporan Anda dikirim?' })).toBeVisible();
    await checkWidths(); await capture('final');
    await page.getByLabel('Nama', { exact: true }).fill('Contoh Nadia');
    await page.getByLabel('Email kerja', { exact: true }).fill('synthetic@example.invalid');
    await page.getByLabel('Perusahaan / organisasi', { exact: true }).fill('Organisasi Contoh — data sintetis');
    await page.getByLabel('Jabatan atau fungsi', { exact: true }).fill('HR');
    await page.getByRole('spinbutton', { name: 'Verifikasi singkat: Berapa 3 + 4?' }).fill('7');
    await page.getByRole('checkbox', { name: /Saya memahami penggunaan data/ }).check();
    await expect(page.getByRole('checkbox', { name: /Saya bersedia menerima informasi/ })).toHaveCount(0);
    const acknowledge = page.getByRole('checkbox', { name: /Saya memahami hal tersebut/ });
    if (await acknowledge.count()) await acknowledge.check();
    await page.getByRole('button', { name: 'Kirim permintaan' }).dblclick();
    await expect(page.getByRole('heading', { name: 'Permintaan Anda telah diterima' })).toBeVisible();
    expect(submissions).toBe(1);
    expect(browserErrors).toEqual([]);
  } finally { releaseFirstSave?.(); }
});
