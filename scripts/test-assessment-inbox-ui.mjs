import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

// Synthetic loopback-only verification; never authorize real proposal/email actions.
const origin = 'http://127.0.0.1:4318';
const records = Array.from({ length: 45 }, (_, index) => ({
  id: `synthetic-${index}`, name: index === 44 ? 'Arsip Lama Tokyo' : `Klien Sintetis ${index + 1}`,
  company: index === 44 ? 'PT A, B %_ 東京' : `PT Nusantara ${index + 1}`, email: `sintetis-${index}@example.invalid`,
  role: 'HR Manager', employees: index % 2 ? '1000+' : '51–100', category: index % 2 ? 'Profesional' : 'Berkembang',
  overallScore: index % 2 ? 87 : 62, assessmentStatus: 'Minta Proposal', proposalStatus: 'Diminta',
  proposalGateStatus: 'not_evaluated', proposalDraft: null, proposalSentAt: null, resultEmailSentAt: '2026-10-01T03:00:00Z',
  resultFollowUpLevel: 0, proposalFollowUpLevel: 0, followUpPaused: false, createdAt: '2026-10-01T02:00:00Z',
}));
const detail = (row) => ({ ...row, whatsapp: '', scores: { Insights: 62 }, answers: { '1': 4 }, aiAnalysis: 'Ringkasan sintetis. Fokus awal adalah menyelaraskan koordinasi dan pelaksanaan prioritas tim.',
  recommendations: [], challenge: 'Koordinasi lintas fungsi perlu diperkuat.', target: 'Membangun kebiasaan kolaborasi yang lebih konsisten.',
  proposalEligibility: { eligible: true, missing: [], summary: 'Data Self Diagnostic lengkap.' }, resultEmailId: null, proposalRequestedAt: null, proposalEmailId: null });
const browser = await chromium.launch({ headless: true });
let checks = 0;
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1024, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [], methods = [];
    let failure = false, empty = false;
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) return route.abort();
      if (!url.pathname.startsWith('/api/')) return route.continue();
      methods.push(route.request().method());
      if (route.request().method() !== 'GET') return route.fulfill({ status: 409, json: { success: false, error: 'Real sending disabled in preview.' } });
      if (url.pathname !== '/api/admin/assessments/inbox') return route.fulfill({ status: 404, json: { success: false } });
      const params = url.searchParams;
      if (params.has('id')) {
        const row = records.find((item) => item.id === params.get('id'));
        return route.fulfill({ status: row ? 200 : 404, json: { success: Boolean(row), record: row ? detail(row) : null } });
      }
      if (params.has('distribution')) return route.fulfill({ json: { success: true, answerDistribution: Array.from({ length: 49 }, (_, i) => ({ question: 'Q' + (i + 1), '1': 0, '2': 0, '3': 0, '4': 45, '5': 0 })) } });
      if (failure) return route.fulfill({ status: 503, json: { error: 'Database temporarily unavailable' } });
      const filtered = empty ? [] : records.filter((row) => `${row.name} ${row.email} ${row.company}`.toLowerCase().includes((params.get('search') || '').toLowerCase())
        && (!params.get('category') || row.category === params.get('category')) && (!params.get('employees') || row.employees === params.get('employees'))
        && row.overallScore >= Number(params.get('minScore') || 0));
      const currentPage = Number(params.get('page') || 0);
      return route.fulfill({ json: { success: true, version: 1, pageSize: 20, page: currentPage, total: filtered.length,
        records: filtered.slice(currentPage * 20, currentPage * 20 + 20), counts: { all: filtered.length, attention: filtered.length, processing: 0, sent: 0 },
        facets: { categories: ['Berkembang', 'Profesional'], employees: ['51–100', '1000+'] } } });
    });
    await page.goto(origin + '/?assessment-inbox');
    await page.getByText('1–20 dari 45', { exact: true }).waitFor();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `tmp/assessment-inbox-${viewport.width}.png`, fullPage: true }); checks++;
    await page.getByRole('button', { name: 'Berikutnya', exact: true }).click();
    await page.getByText('21–40 dari 45', { exact: true }).waitFor(); checks++;
    await page.getByRole('searchbox', { name: 'Cari Self Diagnostic' }).fill('A, B %_ 東京');
    await page.getByText('1–1 dari 1', { exact: true }).waitFor();
    assert(await page.getByRole('button', { name: /Buka Self Diagnostic Arsip Lama Tokyo/ }).isVisible()); checks++;
    await page.getByRole('button', { name: /Buka Self Diagnostic Arsip Lama Tokyo/ }).click();
    await page.getByRole('heading', { name: 'Arsip Lama Tokyo', exact: true }).waitFor();
    await page.screenshot({ path: `tmp/assessment-inbox-detail-${viewport.width}.png`, fullPage: true });
    await page.getByRole('tab', { name: 'Proposal', exact: true }).click();
    await page.getByRole('button', { name: 'Buat & kirim proposal standar', exact: true }).click();
    assert(await page.getByRole('dialog').isVisible());
    assert(methods.every((method) => method === 'GET')); checks++;
    await page.getByRole('button', { name: 'Batal', exact: true }).click();
    if (viewport.width < 1280) await page.getByRole('button', { name: 'Kembali ke daftar klien', exact: true }).click();
    await page.getByRole('searchbox').fill('');
    await page.getByText('1–20 dari 45', { exact: true }).waitFor();
    await page.getByText('Filter lanjutan', { exact: true }).click();
    await page.getByRole('combobox', { name: 'Kategori Self Diagnostic', exact: true }).selectOption('Profesional');
    await page.getByText('1–20 dari 22', { exact: true }).waitFor();
    await page.getByRole('combobox', { name: 'Skor diagnosis minimum', exact: true }).selectOption('85');
    await page.getByText('1–20 dari 22', { exact: true }).waitFor(); checks++;
    failure = true;
    await page.getByRole('button', { name: 'Berikutnya', exact: true }).click();
    await page.getByRole('alert').waitFor();
    await page.screenshot({ path: `tmp/assessment-inbox-error-${viewport.width}.png`, fullPage: true });
    assert(await page.getByRole('button', { name: 'Ekspor halaman CSV' }).isDisabled()); checks++;
    failure = false; empty = true;
    await page.getByRole('button', { name: 'Coba muat daftar lagi' }).click();
    await page.getByText('0–0 dari 0', { exact: true }).waitFor();
    assert(await page.getByText('Tidak ada Self Diagnostic yang cocok', { exact: true }).isVisible());
    await page.screenshot({ path: `tmp/assessment-inbox-empty-${viewport.width}.png`, fullPage: true }); checks++;
    assert.deepEqual(errors, []); assert(methods.every((method) => method === 'GET')); checks++;
    await page.close();
  }
  console.log(`[PASS] ${checks} local Chromium diagnosis checks; desktop/tablet/mobile, mocked API, no real sending`);
} finally { await browser.close(); }
