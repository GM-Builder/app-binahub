import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../package.json',import.meta.url));
const {chromium,expect}=require('@playwright/test');
const root=fileURLToPath(new URL('../../website-prod/',import.meta.url));
const websiteRequire=createRequire(root+'/package.json');
const dir=fileURLToPath(new URL('../.impeccable/review/',import.meta.url));
await mkdir(dir,{recursive:true});
const probe=createServer();await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));
const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
const base='http://127.0.0.1:'+port;
const server=spawn(process.execPath,[websiteRequire.resolve('next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(port)],{cwd:root,stdio:['ignore','pipe','pipe'],windowsHide:true});
let log='';server.stdout.on('data',s=>log+=s);server.stderr.on('data',s=>log+=s);
const stopped=new Promise(resolve=>server.once('exit',resolve));let browser;
const names={id:['Rekomendasi Program','Diagnosis Tim/Organisasi','Self Diagnostic Individu','PETA — Pemetaan Tabiat','Mengapa Program Gagal','Alur Kerja','Peta Layanan','Pilih Kebutuhan'],en:['Program Recommendations','Team/Organization Diagnosis','Individual Self Diagnostic','PETA — Behavioral Mapping','Why Programs Fail','Workflow','Service Map','Choose Your Need']};
async function shot(page,name,locator,options={}){
 if(process.env.SERVICE_UI_NO_CAPTURE==='1')return;
 await page.evaluate(async()=>{await document.fonts.ready;});
 await (locator||page).screenshot({path:dir+'/service-refine-'+name+'.png',animations:'disabled',...options});
}
async function overflow(page){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow at '+page.viewportSize().width);}
async function verifyLinks(container,locale){
 await expect(container.getByRole('link')).toHaveCount(8);
 for(let i=0;i<names[locale].length;i++)await expect(container.getByRole('link').nth(i)).toContainText(names[locale][i]);
 const hrefs=await container.getByRole('link').evaluateAll(links=>links.map(a=>a.getAttribute('href')));
 assert.equal(hrefs[0].replace(/\/$/,''),'/'+locale+'/rekomendasi-program');
 assert.equal(new URL(hrefs[1]).pathname,locale==='en'?'/en/insight':'/insight');
 assert.equal(new URL(hrefs[2]).pathname,'/insight/individual/packages');
 assert.equal(new URL(hrefs[3]).pathname,'/peta');
 assert(!hrefs[3].includes('#'),'public PETA link must not contain an invitation');
 for(const [index,hash] of ['latar-belakang','alur-kerja','solusi','detail'].entries()){
  const destination=new URL(hrefs[index+4],'https://binahub.id');
  assert.equal(destination.pathname.replace(/\/$/,''),'/'+locale+'/ecosystem');assert.equal(destination.hash,'#'+hash);
 }
 await expect(container).toContainText(locale==='id'?'Melalui undangan.':'By invitation.');
}
try{
 let ready=false;for(let i=0;i<100;i++){if(server.exitCode!==null)throw Error(log);try{ready=(await fetch(base+'/id/rekomendasi-program',{signal:AbortSignal.timeout(1500)})).ok;}catch{}if(ready)break;await new Promise(r=>setTimeout(r,200));}assert(ready,'preview ready');
 browser=await chromium.launch({headless:true});
 const errors=[];
 for(const locale of ['id','en']){
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(e.message));await page.route('**/api/**',r=>r.fulfill({status:503,json:{success:false}}));
  await page.goto(base+'/'+locale+'/rekomendasi-program?utm_source=qa&utm_campaign=navigation');
  const heading=page.getByRole('heading',{level:1});
  await expect(heading).toHaveCount(1);
  const h=await heading.boundingBox();assert(Math.abs(h.x+h.width/2-720)<2,'centered landing heading');
  const primary=page.locator('[data-program-opening]').getByRole('link',{name:locale==='id'?'Dapatkan rekomendasi program':'Get program recommendations',exact:true});
  assert.equal(new URL(await primary.getAttribute('href')).pathname,'/discovery');
  const preview=page.locator('#recommendation-preview');const b=await preview.boundingBox();
  assert(b.width>=1100&&b.y>h.y+h.height,'wide preview beneath centered offer');
  await expect(page.locator('[data-program-opening] figure')).toHaveCount(0);
  await overflow(page);if(locale==='id')await shot(page,'landing-desktop');
  const trigger=page.locator('#desktop-trigger-services');await trigger.focus();await page.keyboard.press('Enter');
  const menu=page.locator('#desktop-submenu-services');await expect(menu).toBeVisible();await verifyLinks(menu,locale);
  if(locale==='id')await shot(page,'services-desktop');
  await page.keyboard.press('Escape');await expect(trigger).toBeFocused();await expect(menu).toHaveCount(0);
  for(const width of [320,390,768,1024]){
   await page.setViewportSize({width,height:844});await overflow(page);
   const rect=await heading.boundingBox();assert(rect.y>=96,'heading clears fixed navbar');
   const tabs=page.getByRole('tablist');await expect(tabs.getByRole('tab')).toHaveCount(3);
   await tabs.getByRole('tab').first().focus();await page.keyboard.press('ArrowRight');await expect(tabs.getByRole('tab').nth(1)).toHaveAttribute('aria-selected','true');
   await page.keyboard.press('Home');await expect(tabs.getByRole('tab').first()).toHaveAttribute('aria-selected','true');
   if(locale==='id'&&width===390){await page.evaluate(()=>{document.activeElement?.blur();scrollTo({top:0,behavior:'instant'});});await shot(page,'landing-mobile');}
  }
  await page.setViewportSize({width:390,height:844});await page.goto(base+'/'+locale);
  const toggle=page.locator('[aria-controls="mobile-navigation"]');
  await expect(toggle).toBeVisible();await page.evaluate(async()=>{scrollTo({top:0,behavior:'instant'});await document.fonts.ready;});
  await expect.poll(()=>toggle.evaluate(el=>el.getBoundingClientRect().width)).toBeGreaterThanOrEqual(43.99);
  const box=await toggle.boundingBox();assert(box.width>=43.99&&box.height>=43.99,'home menu touch target '+JSON.stringify(box));
  assert.equal(Math.round(box.width),44,'lighter mobile home toggle');assert(Math.abs(box.x+box.width-370)<2,'header side spacing');
  const logo=page.locator('#global-navbar a').first().locator('img');const lb=await logo.boundingBox();assert.equal(Math.round(lb.width),144,'smaller home mobile logo');
  const cue=page.locator('#home-hero a[href="#platform"]');const cb=await cue.boundingBox();assert(cb.height>=44,'scroll cue retains 44px touch target');assert(Math.abs(cb.x+cb.width/2-195)<2,'scroll cue centered');
  assert.equal(await cue.evaluate(el=>getComputedStyle(el).fontSize),'10px');
  const chat=page.locator('#chatbot-trigger');await expect(chat).toBeVisible();assert.equal(await chat.evaluate(el=>getComputedStyle(el).position),'fixed');
  await expect.poll(()=>chat.evaluate(el=>el.getBoundingClientRect().width)).toBeGreaterThanOrEqual(55.99);
  const chatBox=await chat.boundingBox();assert(cb.x+cb.width+40<chatBox.x,'cue separated horizontally from chat');
  if(locale==='id'){
   await shot(page,'home-mobile');
   const heroBox=await page.locator('#home-hero').boundingBox();
   const cueBox=await cue.boundingBox();
   const fullHeight=Math.ceil(Math.max(heroBox.y+heroBox.height,cueBox.y+cueBox.height+22)+await page.evaluate(()=>scrollY));
   await shot(page,'home-mobile-full',null,{fullPage:true,clip:{x:0,y:0,width:390,height:fullHeight}});
  }
  await toggle.click();await page.getByRole('button',{name:locale==='id'?'Buka/tutup submenu Layanan':'Toggle submenu for Services',exact:true}).click();
  const mobileMenu=page.locator('#mobile-submenu-services');await verifyLinks(mobileMenu,locale);
  if(locale==='id'){await shot(page,'services-mobile-top');await mobileMenu.getByRole('link').last().scrollIntoViewIfNeeded();await shot(page,'services-mobile-bottom');}
  await page.keyboard.press('Escape');await expect(toggle).toBeFocused();
  await page.setViewportSize({width:1440,height:1000});
  await expect.poll(()=>cue.locator('svg').evaluate(el=>el.getBoundingClientRect().width)).toBe(16);
  await page.setViewportSize({width:390,height:844});
  await expect.poll(()=>cue.locator('svg').evaluate(el=>el.getBoundingClientRect().width)).toBe(12);
  await page.goto(base+'/'+locale+'/rekomendasi-program');
  const footer=page.locator('footer');const mobileServices=footer.locator('details').filter({has:page.locator('summary').filter({hasText:locale==='id'?'Layanan':'Services'})});
  await mobileServices.locator('summary').focus();await page.keyboard.press('Enter');
  await expect(mobileServices).toHaveAttribute('open','');
  const footerLinks=mobileServices.locator('ul a');await expect(footerLinks).toHaveCount(8);
  await expect(footerLinks.nth(3)).toContainText(locale==='id'?'melalui undangan':'by invitation');
  if(locale==='id'){await page.evaluate(()=>document.activeElement?.blur());await shot(page,'footer-mobile',mobileServices);}
  await page.setViewportSize({width:1440,height:1000});
  const desktopFooter=footer.locator('div.hidden.md\\:block');
  for(const title of [names[locale][0],names[locale][1],names[locale][2]])await expect(desktopFooter.getByRole('link',{name:title,exact:true})).toBeVisible();
  if(locale==='id')await shot(page,'footer-desktop',footer);
  await overflow(page);await page.close();
 }
 assert.deepEqual(errors,[]);console.log('PASS: ID/EN Services keeps all four original links + four new routes; footer; keyboard; home mobile header/Scroll/chat; centered landing + tabs; 320/390/768/1024/1440 overflow. Chromium emulation only.');
}finally{
 await browser?.close();server.kill();await Promise.race([stopped,new Promise(r=>setTimeout(r,3000))]);
}
