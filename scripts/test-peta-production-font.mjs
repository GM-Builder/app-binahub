// Built Next.js on loopback only; API data is synthetic and all remote requests are blocked.
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {createServer} from 'node:net';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';

const require = createRequire(import.meta.url);
const portProbe = createServer();
await new Promise(resolve => portProbe.listen(0, '127.0.0.1', resolve));
const port = portProbe.address().port;
await new Promise(resolve => portProbe.close(resolve));
const origin = 'http://127.0.0.1:'+port;
const server = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
  windowsHide:true, stdio:['ignore','pipe','pipe'], env:{...process.env, NEXT_TELEMETRY_DISABLED:'1'},
});
let output = '', browser;
server.stdout.on('data', chunk => {output = (output+chunk).slice(-3000);});
server.stderr.on('data', chunk => {output = (output+chunk).slice(-3000);});
const report = {participantCode:'PETA-SYNTHETIC', submittedAt:'2026-10-30T00:00:00Z', retentionUntil:'2027-10-30T00:00:00Z', result:{instrumentVersion:'1.0.0-pilot', method:'forced_choice_most_least_net_v1', rows:[{dimension:'D', most:10, least:0, net:10}, {dimension:'I', most:7, least:7, net:0}, {dimension:'S', most:4, least:9, net:-5}, {dimension:'C', most:3, least:8, net:-5}], topDimensions:['D'], topIsTied:false, closeTopScores:false}};
const session = {id:'74be2e2f-d596-43de-bde2-665ecf69e5a2', status:'submitted', revision:24, participantCode:report.participantCode, instrumentVersion:'1.0.0-pilot', retentionUntil:report.retentionUntil, submittedAt:report.submittedAt, reviewConsent:false, privacyReference:'Kebijakan sintetis', consentVersion:'peta-privacy-v1', answers:{}, blocks:[]};
try {
  let ready = false;
  for (let i=0; i<150; i++) {
    if (server.exitCode !== null) throw Error('Next start failed: '+output);
    try {const response = await fetch(origin+'/peta/hasil'); if (response.ok) {ready = true; break;}} catch {}
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  assert(ready, 'Production loopback server did not become ready');
  browser = await chromium.launch();
  for (const [device, width, height] of [['desktop',1440,1000], ['mobile',390,844]]) {
    const context = await browser.newContext({viewport:{width,height}});
    const page = await context.newPage(), errors = [], external = [], fonts = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {if (new URL(response.url()).pathname.endsWith('.ttf')) fonts.push({url:response.url(), status:response.status()});});
    await page.addInitScript(() => {window.__fontCspViolations = []; document.addEventListener('securitypolicyviolation', event => {window.__fontCspViolations.push(event.blockedURI);});});
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.pathname.includes('/api/peta/')) return route.fulfill({json:url.pathname.endsWith('/result') ? {success:true, report} : {success:true, session, csrfToken:'c'.repeat(64)}});
      if (url.origin !== origin) {external.push(url.href); return route.abort();}
      return route.continue();
    });
    const response = await page.goto(origin+'/peta/hasil');
    const policy = response.headers()['content-security-policy'];
    assert(policy?.includes("font-src 'self' data:"));
    assert(policy.includes("style-src 'self' 'unsafe-inline'"));
    assert(!/fonts\.googleapis|fonts\.gstatic/.test(policy));
    await page.getByRole('table', {name:'Rincian angka pilihan'}).waitFor();
    assert(await page.evaluate(async () => {
      const faces = await document.fonts.load('400 16px "Plus Jakarta Sans"');
      const bold = await document.fonts.load('800 16px "Plus Jakarta Sans"');
      return faces.length>0 && bold.length>0 && [...faces,...bold].every(face => face.status==='loaded');
    }), 'Brand font did not load');
    assert(fonts.some(font => font.url.startsWith(origin+'/fonts/') && font.status===200));
    assert.deepEqual(await page.evaluate(() => window.__fontCspViolations), []);
    assert.deepEqual(external, []);
    assert.deepEqual(errors, []);
    assert(await page.evaluate(() => document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:'.impeccable/review/peta-production-font-'+device+'.png', fullPage:true});
    console.log(device+': production CSP preserved, same-origin font 200, PETA report rendered, no external request or page error');
    await context.close();
  }
} finally {
  if (browser) await browser.close();
  server.kill();
}
