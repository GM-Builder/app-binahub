import { test, expect, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const codes = ['PE-02', 'PE-04', 'PE-06'];
const names = ['Self-Development', 'Adaptability', 'Pressure Management'];
const definition = {
  policyId: 'synthetic', consentVersion: 'synthetic', privacyVersion: 'synthetic', acceptingNew: true,
  sharingConsentVersion: 'pe-consultant-review-v1', notice: 'Data sintetis untuk uji tampilan.',
  privacyNotice: 'Data sintetis. Jawaban disimpan enam bulan.', sharingNotice: 'Tim BinaHub dapat meninjau atas izin peserta.',
  competencies: codes.map((code, i) => ({ code, name: names[i], definition: ['Mengembangkan diri melalui refleksi dan pengalaman kerja.', 'Menyesuaikan cara kerja ketika situasi dan kebutuhan berubah.', 'Mengelola respons saat menghadapi tuntutan dan tekanan.'][i] })),
  selfReportItems: Array.from({ length: 12 }, (_, i) => ({ id: `SR${i + 1}`, competencyCode: codes[Math.floor(i / 4)], type: 'behavioral_self_report', prompt: `Contoh uji ${i + 1}: Saya meninjau pengalaman kerja untuk menentukan hal yang dapat diperbaiki.` })),
  sjtItems: Array.from({ length: 6 }, (_, i) => ({ id: `SJ${i + 1}`, competencyCode: codes[Math.floor(i / 2)], type: 'situational_judgment',
    scenario: 'Contoh uji: Prioritas proyek berubah, sementara tenggat pekerjaan tetap. Anda dan rekan kerja perlu menyepakati langkah berikutnya.',
    question: `Studi kasus uji ${i + 1}: Apa yang akan Anda lakukan?`, options: [{ id: 'A', text: 'Membahas prioritas bersama dan menyepakati penyesuaian rencana kerja.' }, { id: 'B', text: 'Melanjutkan rencana awal tanpa membahas perubahan tersebut.' }] })),
  selfReportScale: [{ value: 1, label: 'Hampir tidak pernah' }, { value: 2, label: 'Jarang' }, { value: 3, label: 'Kadang-kadang' }, { value: 4, label: 'Sering' }, { value: 5, label: 'Hampir selalu' }, { value: 'NA', label: 'Tidak ada kesempatan relevan' }],
};
const practice = { focus: 'Pilih satu perubahan kecil untuk dicoba minggu ini.', context: 'Gunakan pada rapat koordinasi atau pekerjaan dengan prioritas yang berubah.', successIndicator: 'Catat satu contoh penyesuaian yang membantu pekerjaan.', followUp: 'Tinjau pengalaman tersebut bersama rekan tepercaya.' };
const report = {
  goal: 'Contoh uji: Lebih terarah dalam bekerja dan beradaptasi dengan perubahan.', methodology: 'Pengalaman kerja dan studi kasus dibaca terpisah; keduanya bukan persentase penguasaan kompetensi.',
  priorityExplanation: 'Contoh rekomendasi sintetis berdasarkan konteks dan dua metode yang terpisah.', notice: 'Laporan sintetis untuk uji tampilan, bukan hasil peserta nyata.',
  metadata: { instrumentId: 'SYNTHETIC', instrumentVersion: 'test', scoringVersion: 'test', reportVersion: 'test', priorityVersion: 'test', assessmentDate: '2026-10-26T03:00:00Z', generatedAt: '2026-10-26T03:00:00Z', releaseStatus: 'test' },
  summary: { role: 'Staf operasional — contoh uji', goal: 'Contoh tujuan', answeredCount: 18, expectedCount: 18, naCount: 0, areasWithBothMethods: 3, focusNames: ['Adaptability', 'Pressure Management'], description: 'Baca hasil bersama contoh perilaku dalam konteks pekerjaan.' },
  areas: codes.map((code, i) => ({ code, name: names[i], definition: definition.competencies[i].definition, relevance: 'high', interpretation: 'Refleksikan hasil bersama pengalaman kerja Anda; perbedaan metode dapat menjadi bahan diskusi.', selfReport: { score: [75, 62.5, 50][i], validCount: 4, naCount: 0, status: 'scored' }, sjt: { score: [50, 75, 50][i], validCount: 2, status: 'scored' }, practice })),
  priorities: [1, 2].map(i => ({ code: codes[i], name: names[i], reason: 'Contoh uji: Area ini relevan dengan tujuan Anda dan dapat menjadi fokus latihan berikutnya.', practice })),
  solutions: { status: 'available', items: [{ title: 'Adaptive Agility', description: 'Contoh program', url: '/catalog', reason: 'Contoh uji: Diskusikan program yang membantu Anda menghadapi perubahan dalam pekerjaan.' }] },
};
async function fits(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
test.beforeEach(async ({ baseURL }) => {
  test.skip(process.env.PLAYWRIGHT_INDIVIDUAL_REFERENCE !== '1' || !/^http:\/\/(127\.0\.0\.1|localhost):/.test(baseURL || ''), 'Explicit loopback-only synthetic UI verification.');
});

test('individual reference: context to answers, review, private result and privacy', async ({ page }, info) => {
  test.setTimeout(120000);
  await mkdir('.impeccable/review', { recursive: true });
  const device = info.project.name === 'chromium' ? 'desktop' : 'mobile';
  if (device === 'desktop') await page.setViewportSize({ width: 1440, height: 1000 });
  const capture = async (state: string) => {
    await page.evaluate(async () => {
      window.scrollTo({ top: 0, behavior: 'instant' }); await document.fonts.ready;
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    });
    await page.screenshot({ path: `.impeccable/review/individual-reference-${state}-${device}.png`, fullPage: true, animations: 'disabled' });
  };
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  let attempt = { id: '', status: 'draft', revision: 0, context: {}, responses: {} as Record<string, unknown>, retentionUntil: '2027-04-26T00:00:00Z', submittedAt: null as string | null };
  let submissions = 0, exchanges = 0, consultations = 0, deletions = 0;
  let access = { shared: true, evaluationConsent: false, exportConsent: false, clarity: null, usefulness: null };
  let releaseSave!: () => void;
  const heldSave = new Promise<void>(resolve => { releaseSave = resolve; });
  let saveStarted = false;
  await page.route('**/api/**', async route => {
    const request = route.request(), path = new URL(request.url()).pathname, method = request.method();
    if (path.endsWith('/guest') && method === 'GET') return route.fulfill({ json: { success: true, definition } });
    if (path.endsWith('/guest') && method === 'POST') { const body = request.postDataJSON(); expect(body.ownerId).toBeUndefined(); expect(body.attribution.utmSource).toBe('email'); attempt = { ...attempt, id: body.id, context: body.context }; return route.fulfill({ status: 201, json: { success: true, attempt } }); }
    if (path.endsWith('/request-link')) return route.fulfill({ status: 202, json: { success: true } });
    if (path.endsWith('/result')) {
      if (method === 'POST') { exchanges++; expect(request.postDataJSON()).toEqual({ token: 'a'.repeat(64) }); return route.fulfill({ json: { success: true } }); }
      if (method === 'PATCH') { const body = request.postDataJSON(); if (body.action) consultations++; else access = { ...access, shared: body.share, evaluationConsent: body.evaluate, clarity: body.clarity, usefulness: body.usefulness }; return route.fulfill({ json: { success: true, access } }); }
      if (method === 'DELETE') { deletions++; return route.fulfill({ json: { success: true } }); }
      return route.fulfill({ json: { success: true, report, access, retentionUntil: attempt.retentionUntil } });
    }
    if (path.endsWith(attempt.id) && method === 'PATCH') {
      const body = request.postDataJSON();
      if (!saveStarted) { saveStarted = true; await heldSave; }
      if (body.submissionKey) submissions++;
      attempt = { ...attempt, responses: body.responses, revision: attempt.revision + 1, status: body.submissionKey ? 'submitted' : 'draft', submittedAt: body.submissionKey ? '2026-10-26T03:00:00Z' : null };
      return route.fulfill({ status: body.submissionKey ? 202 : 200, json: { success: true, attempt, emailStatus: body.submissionKey ? 'pending' : null } });
    }
    if (path.endsWith(attempt.id) && method === 'GET') return route.fulfill({ json: { success: true, attempt } });
    throw new Error(`Unexpected API request: ${method} ${path}`);
  });
  await page.goto('/insight/individual/packages?utm_source=email&utm_campaign=ui-test');
  await expect(page.getByText('Coming soon',{exact:true})).toHaveCount(5);
  await expect(page.getByRole('link',{name:'Mulai Self Diagnostic gratis'})).toHaveAttribute('href',/utm_source=email/);
  await fits(page);await capture('packages');
  await page.getByRole('link',{name:'Mulai Self Diagnostic gratis'}).click();
  await expect(page.getByRole('heading', { name: 'Sebelum Anda mulai' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Pahami kebutuhan/);
  await expect(page.getByText(/melalui 18 pertanyaan/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mulai diagnosis' })).toBeDisabled();
  await expect(page.getByRole('checkbox')).not.toBeChecked();
  for (const width of [320, 390, 768, 1280, 1440, 1600]) { await page.setViewportSize({ width, height: 1000 }); await fits(page); }
  await page.setViewportSize(device === 'desktop' ? { width: 1440, height: 1000 } : { width: 390, height: 844 });
  await capture('onboarding');
  await page.getByLabel('Nama Anda', { exact: true }).fill('Peserta Sintetis');
  await page.getByLabel('Alamat email', { exact: true }).fill('synthetic@example.invalid');
  await page.getByLabel('Peran atau pekerjaan Anda').fill('Staf operasional — contoh uji');
  await page.getByLabel('Apa yang ingin Anda kembangkan?').fill(report.goal);
  await page.getByLabel('Relevansi Adaptability').selectOption('high');
  await page.getByText('Privasi dan penggunaan data', { exact: true }).click();
  await expect(page.getByText('Data sintetis. Jawaban disimpan enam bulan.')).toBeVisible();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Mulai diagnosis', exact: true }).click();
  await expect(page.getByRole('group', { name: definition.selfReportItems[0].prompt })).toBeVisible();
  await expect(page.getByRole('complementary',{name:'Tentang Self Diagnostic ini'})).toBeVisible();
  await expect(page.getByText('Self-Development',{exact:true})).toBeVisible();
  await expect(page.locator('[aria-current]')).toHaveCount(0);
  await expect(page.getByText(/^[0-4] dari 4$/)).toHaveCount(0);
  const originalWidth=page.viewportSize()!.width;
  for(const width of [320,768,1024]){await page.setViewportSize({width,height:900});await fits(page);}
  await page.setViewportSize({width:originalWidth,height:device==='desktop'?1000:844});
  await capture('question');
  await page.getByRole('radio', { name: 'Sering', exact: true }).check();
  await expect.poll(() => saveStarted).toBe(true);
  await expect(page.getByRole('button', { name: 'Lanjut', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Lanjut', exact: true }).click();
  await expect(page.getByText(definition.selfReportItems[1].prompt, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Kembali', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Sering', exact: true })).toBeChecked();
  await page.getByRole('radio', { name: 'Hampir selalu', exact: true }).check(); releaseSave();
  await page.getByRole('button', { name: 'Lanjut', exact: true }).click();
  for (let i = 1; i < 18; i++) {
    if (i === 12) { await expect(page.getByText(definition.sjtItems[0].scenario, { exact: true })).toBeVisible(); await capture('case'); }
    await page.getByRole('radio').first().check();
    await page.getByRole('button', { name: i === 17 ? 'Tinjau jawaban' : 'Lanjut', exact: true }).click();
  }
  await expect(page.getByRole('heading', { name: 'Periksa sebelum mengirim.' })).toBeVisible();
  await expect(page.getByRole('button',{name:/Ubah jawaban \d/})).toHaveCount(6);
  await expect(page.getByRole('radio')).toHaveCount(0);
  await page.getByRole('button',{name:'Lihat jawaban berikutnya'}).click();
  await expect(page.getByRole('button',{name:/Ubah jawaban \d/})).toHaveCount(12);
  await fits(page); await capture('review');
  await page.getByRole('button', { name: 'Kirim jawaban', exact: true }).dblclick();
  await expect(page.getByRole('heading', { name: 'Jawaban Anda sudah diterima.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Jawaban Anda sudah diterima.' })).toBeFocused();
  expect(submissions).toBe(1); expect(attempt.responses.SR1).toBe(5); expect(Object.keys(attempt.responses)).toHaveLength(18);
  await expect(page.getByRole('heading', { name: 'Hasil Self Diagnostic individu' })).toHaveCount(0);
  await capture('receipt');
  await page.goto(`/insight/individual/result?attempt=${attempt.id}#access=${'a'.repeat(64)}`);
  const open = page.getByRole('button', { name: 'Lihat hasil saya', exact: true });
  await expect(open).toBeEnabled(); expect(page.url()).not.toContain('#access'); expect(exchanges).toBe(0);
  await capture('access'); await open.dblclick();
  await expect(page.getByRole('heading', { name: 'Hasil Self Diagnostic individu' })).toBeVisible(); expect(exchanges).toBe(1);
  await expect(page.getByRole('figure')).toBeVisible();
  for (const width of [320, 390, 768, 1280, 1440, 1600]) { await page.setViewportSize({ width, height: 1000 }); await fits(page); }
  await page.setViewportSize(device === 'desktop' ? { width: 1440, height: 1000 } : { width: 390, height: 844 });
  await capture('report');
  await page.getByRole('button', { name: 'Minta konsultasi', exact: true }).dblclick(); await expect(page.getByText(/Permintaan konsultasi diterima/)).toBeVisible(); expect(consultations).toBe(1);
  await page.getByText('Privasi & data', { exact: true }).click();
  await expect(page.getByRole('checkbox', { name: /Bantu meningkatkan/ })).not.toBeChecked();
  await page.getByRole('checkbox', { name: 'Izinkan tim BinaHub meninjau hasil saya' }).uncheck();
  await page.getByRole('button', { name: 'Simpan pilihan' }).click();
  await expect(page.getByText('Pilihan privasi Anda telah disimpan.')).toBeVisible(); expect(access.shared).toBe(false);
  await page.getByRole('button', { name: 'Hapus data pengisian' }).click();
  await page.getByRole('button', { name: 'Batal', exact: true }).click(); expect(deletions).toBe(0);
  expect(errors).toEqual([]);
});
