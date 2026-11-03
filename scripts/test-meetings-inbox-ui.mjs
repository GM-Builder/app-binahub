import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
const origin = 'http://127.0.0.1:4318';
const records = Array.from({ length: 45 }, (_, i) => ({ id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
  title: 'Diskusi kebutuhan pengembangan organisasi lintas fungsi', status: 'confirmed', attendeeName: i === 44 ? 'Arsip Lama 東京 %_*' : `Peserta Sintetis ${i + 1}`,
  attendeeEmail: i === 44 ? 'very.long.participant.name.for.testing@organisation.company.invalid' : `synthetic-${i}@company.invalid`,
  eventTypeSlug: 'konsultasi-30-menit', startTime: '2099-01-01T00:00:00Z', endTime: '2099-01-01T01:00:00Z', timeZone: 'America/New_York',
  updatedAt: '2026-11-03T03:00:00Z', isUpcoming: true, isSuperseded: false }));
const browser = await chromium.launch({ headless: true }); let checks = 0;
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1024, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
    const page = await browser.newPage({ viewport }), errors = [], methods = []; let failure = false, detailFailure = false, empty = false;
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', async route => {
      const url = new URL(route.request().url()); if (url.origin !== origin) return route.abort();
      if (!url.pathname.startsWith('/api/')) return route.continue();
      methods.push(route.request().method()); if (route.request().method() !== 'GET') return route.fulfill({ status: 409, json: { success: false } });
      if (url.pathname !== '/api/admin/meetings/inbox') return route.fulfill({ status: 404, json: { success: false } });
      const p = url.searchParams;
      if (p.has('id')) {
        if (detailFailure) return route.fulfill({ status: 503, json: { success: false } });
        return route.fulfill({ json: { success: true, record: { ...records.find(r => r.id === p.get('id')), providerUid: 'synthetic-cal', leadId: null,
          assessmentId: null, organizerEmail: 'admin@company.invalid', meetingUrl: 'https://meet.company.invalid/synthetic', cancellationReason: null } } });
      }
      if (failure) return route.fulfill({ status: 503, json: { success: false, error: 'SQL87 missing' } });
      const rows = empty ? [] : records.filter(r => `${r.attendeeName} ${r.attendeeEmail}`.toLowerCase().includes((p.get('search') || '').toLowerCase()));
      const current = Number(p.get('page') || 0);
      return route.fulfill({ json: { success: true, version: 1, page: current, pageSize: 20, snapshotAt: '2026-11-03T03:00:00Z', timeZone: 'Asia/Jakarta', total: rows.length,
        counts: { all: empty ? 0 : 1201, upcoming: 45, today: 2, history: 1150, cancelled: 4, review: 2, waiting: 3, completed: 750 },
        statuses: ['confirmed', 'cancelled'], nextBooking: empty ? null : records[0], records: rows.slice(current * 20, current * 20 + 20) } });
    });
    await page.goto(origin + '/?meetings-inbox'); await page.getByText('1–20 dari 45 jadwal', { exact: true }).waitFor();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: `tmp/meetings-${viewport.width}.png`, fullPage: true }); checks++;
    await page.screenshot({ path: `tmp/meetings-top-${viewport.width}.png` });
    assert(await page.getByRole('button', { name: 'Buka konsultasi Peserta Sintetis 1', exact: true }).first().evaluate(el => {
      const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth;
    }));
    await page.getByRole('button', { name: 'Berikutnya', exact: true }).click(); await page.getByText('21–40 dari 45 jadwal', { exact: true }).waitFor(); checks++;
    await page.getByRole('searchbox').fill('東京 %_*'); await page.getByText('1–1 dari 1 jadwal', { exact: true }).waitFor(); checks++;
    const trigger = page.getByRole('button', { name: 'Buka konsultasi Arsip Lama 東京 %_*', exact: true });
    await trigger.click(); const dialog = page.getByRole('dialog', { name: 'Arsip Lama 東京 %_*', exact: true }); await dialog.waitFor();
    await dialog.getByRole('link', { name: /Buka ruang konsultasi/ }).waitFor(); assert(await dialog.getByText('Mulai (WIB)', { exact: true }).isVisible());
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: `tmp/meeting-detail-${viewport.width}.png`, fullPage: true }); checks++;
    await dialog.getByRole('link', { name: /Buka ruang konsultasi/ }).focus(); await page.keyboard.press('Tab');
    assert(await dialog.evaluate(el => el.contains(document.activeElement))); await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'hidden' });
    assert(await trigger.evaluate(el => el === document.activeElement)); checks++;
    detailFailure = true; await trigger.click(); await page.getByRole('alert').waitFor(); assert.equal(await page.getByRole('link', { name: /Buka ruang konsultasi/ }).count(), 0); checks++;
    detailFailure = false; await page.getByRole('button', { name: 'Coba muat detail lagi', exact: true }).click(); await page.getByRole('link', { name: /Buka ruang konsultasi/ }).waitFor(); await page.keyboard.press('Escape'); checks++;
    failure = true; await page.getByRole('button', { name: 'Perbarui jadwal', exact: true }).click(); await page.getByRole('alert').waitFor();
    assert.equal(await page.getByText('Belum ada booking tersinkronisasi', { exact: true }).count(), 0); checks++;
    failure = false; empty = true; await page.getByRole('button', { name: 'Coba muat jadwal lagi', exact: true }).click(); await page.getByText('0–0 dari 0 jadwal', { exact: true }).waitFor(); checks++;
    assert.deepEqual(errors, []); assert(methods.every(method => method === 'GET')); checks++; await page.close();
  }
  console.log(`[PASS] ${checks} local Chromium consultation checks; 1440/1024/390/320px, mocked API, external network/writes blocked`);
} finally { await browser.close(); }
