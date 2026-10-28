import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium,expect}=require('@playwright/test');
const probe=createServer();await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));
const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
const base='http://127.0.0.1:'+port;
const output=new URL('../.impeccable/review/',import.meta.url);
await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(port)],{stdio:['ignore','pipe','pipe'],windowsHide:true});
let log='';server.stdout.on('data',s=>log+=s);server.stderr.on('data',s=>log+=s);
const stopped=new Promise(resolve=>server.once('exit',resolve));let browser;
try{
 let ready=false;for(let i=0;i<100;i++){if(server.exitCode!==null)throw new Error(log);try{ready=(await fetch(base+'/insight/individual/packages',{signal:AbortSignal.timeout(1500)})).ok;}catch{}if(ready)break;await new Promise(resolve=>setTimeout(resolve,200));}assert(ready,'preview ready');
 browser=await chromium.launch({headless:true});
 for(const [device,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:device==='mobile',hasTouch:device==='mobile',reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  let requests=0;await page.route('**/api/**',r=>{requests++;return r.fulfill({status:503,json:{success:false}});});
  await page.goto(base+'/insight/individual/packages?utm_source=email&utm_campaign=pricing-ui');
  await expect(page.getByRole('heading',{level:1,name:'Pilih Self Diagnostic Anda.'})).toBeVisible();
  await expect(page.getByRole('button',{name:/Coming soon:/})).toHaveCount(5);
  for(const locked of await page.getByRole('button',{name:/Coming soon:/}).all())await expect(locked).toBeDisabled();
  for(const price of ['59.000','89.000','69.000','119.000','299.000'])await expect(page.getByText(new RegExp(price.replace('.','\\.')))).toBeVisible();
  assert.equal(await page.getByRole('link',{name:/beli|bayar|checkout/i}).count(),0);
  const start=page.getByRole('link',{name:'Mulai Self Diagnostic gratis'});
  const href=await start.getAttribute('href');assert(href.startsWith('/insight/individual?'));assert(href.includes('utm_source=email'));assert(href.includes('utm_campaign=pricing-ui'));
  for(const checkWidth of [320,390,768,1024,1280,1440,1600]){
   await page.setViewportSize({width:checkWidth,height});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+checkWidth);
  }
  await page.setViewportSize({width,height});await page.evaluate(async()=>{await document.fonts.ready;window.scrollTo(0,0);});
  await start.focus();await expect(start).toBeFocused();
  const outline=await start.evaluate(el=>getComputedStyle(el).outlineStyle);assert.notEqual(outline,'none');
  await page.locator('h1').click();await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:fileURLToPath(new URL('individual-pricing-'+device+'.png',output)),fullPage:true,animations:'disabled'});
  await page.screenshot({path:fileURLToPath(new URL('individual-pricing-'+device+'-viewport.png',output)),fullPage:false,animations:'disabled'});
  assert.equal(requests,0,'pricing must not start checkout or submit assessment');
  await start.click();await page.waitForURL(/\/insight\/individual\?/);assert(new URL(page.url()).searchParams.get('utm_source')==='email');
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS: pricing owner prices, free attribution handoff, five paid locks/no checkout, keyboard focus, desktop/mobile and 320–1600px overflow; no real API writes.');
}finally{await browser?.close();if(server.exitCode===null)server.kill();await stopped;}
