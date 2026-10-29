import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {mkdir,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {verifyMobileHeroDeck,verifyMobileDeckAutoplay} from './mobile-hero-deck-checks.mjs';
const require=createRequire(new URL('../package.json',import.meta.url));
const {chromium,expect}=require('@playwright/test');
const ts=require('typescript');
const root=fileURLToPath(new URL('../../website-prod/',import.meta.url)).replace(/[\\/]$/,'');
const websiteRequire=createRequire(root+'/package.json');
const previewDir=fileURLToPath(new URL('../.impeccable/review/',import.meta.url));
const capture=(page,options)=>process.env.PROGRAM_UI_NO_CAPTURE==='1'?Promise.resolve():page.screenshot(options);
await mkdir(previewDir,{recursive:true});
const source=await readFile(root+'/src/lib/program-journey-url.ts','utf8');
const sandbox={exports:{},URL};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,sandbox);
const next=sandbox.exports.programJourneyUrl('https://app.binahub.id/discovery','https://binahub.id/id/rekomendasi-program?utm_source=email&utm_campaign=test&email=person@example.invalid&token=private&utm_content=person@example.invalid');
assert.equal(new URL(next).searchParams.get('utm_source'),'email');assert.equal(new URL(next).searchParams.get('utm_campaign'),'test');assert(!next.includes('private'));assert(!next.includes('person'));
const probe=createServer();await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
const base='http://127.0.0.1:'+port;
const server=spawn(process.execPath,[websiteRequire.resolve('next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(port)],{cwd:root,stdio:['ignore','pipe','pipe'],windowsHide:true});
let log='';server.stdout.on('data',s=>log+=s);server.stderr.on('data',s=>log+=s);
const stopped=new Promise(resolve=>server.once('exit',resolve));let browser;
const layoutIssues=[];
try{
 let ready=false;for(let i=0;i<100;i++){if(server.exitCode!==null)throw new Error(log);try{ready=(await fetch(base+'/id/rekomendasi-program',{signal:AbortSignal.timeout(1500)})).ok;}catch{}if(ready)break;await new Promise(r=>setTimeout(r,200));}assert(ready,'preview ready');
 browser=await chromium.launch({headless:true});
 for(const [device,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:device==='mobile',isMobile:device==='mobile',reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/**',r=>r.fulfill({status:503,json:{success:false}}));
  await page.goto(base+'/id?utm_source=email&utm_campaign=program-test');
  const hero=page.locator('#home-hero');await hero.getByRole('link',{name:'Dapatkan rekomendasi program'}).waitFor();
  await expect(hero).toHaveAttribute('data-hero-slide','recommendation');
  if(device==='desktop'){
  const heroVisual=hero.locator('[data-program-hero-visual]');
  await expect(heroVisual).toBeVisible();
  for(const label of ['Kebutuhan','Kompetensi','Program','Tantangan dan tujuan tim Anda.','Fokus pengembangan yang relevan.','Pilihan untuk dibahas bersama.'])await expect(heroVisual.getByText(label,{exact:true})).toBeVisible();
  await expect(heroVisual.locator('[data-journey-layer]')).toHaveCount(3);
  await expect(heroVisual.getByText('Team Synergy',{exact:true})).toHaveCount(0);
  const sculpturePaths=new Set();
  for(const panel of await heroVisual.locator('img').all()){
   const path=await panel.getAttribute('src');sculpturePaths.add(path);
   assert(/hero-(needs|competencies|program)\.webp/.test(path),'semantic imagegen illustration');
   await expect.poll(()=>panel.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
  }
  assert.equal(sculpturePaths.size,3,'each card has its own illustration');
  const cardTones=await heroVisual.locator('[data-hero-tone]').evaluateAll(cards=>cards.map(card=>getComputedStyle(card).backgroundImage));
  assert.equal(new Set(cardTones).size,3,'each card has its own color palette');
  assert.equal(await heroVisual.locator('[data-program-orbit]').evaluate(el=>getComputedStyle(el).animationName),'none','static orbit in reduced motion');
  const liquid=heroVisual.locator('[data-hero-liquid]');
  await expect(liquid).toBeVisible();
  await expect(liquid.locator('[data-liquid-flow]')).toHaveCount(3);
  for(const pool of await liquid.locator('[data-liquid-flow]').all())assert.equal(await pool.evaluate(el=>getComputedStyle(el).animationName),'none','liquid remains still with reduced motion');
  const carousel=hero.getByRole('region',{name:'Pilihan utama BinaHub'});
  const controls=hero.getByRole('group',{name:'Kontrol slide utama'});
  await expect(controls.getByRole('button',{name:'Putar slide otomatis'})).toBeDisabled();
  const boxBefore=await carousel.boundingBox();
  await controls.getByRole('button',{name:'Tentang BinaHub',exact:true}).click();
  await expect(hero).toHaveAttribute('data-hero-slide','brand');await expect(heroVisual).not.toBeVisible();
  await expect(hero.locator('.hero-orbit-stage')).toBeVisible();
  await expect(hero.getByRole('link',{name:'Mulai diagnosis',exact:true})).toHaveAttribute('href','/id/insight');
  await expect(hero.getByRole('heading',{level:1})).toHaveCount(1);
  const inactive=hero.locator('[aria-roledescription="slide"][aria-hidden="true"]');
  await expect(inactive).toHaveAttribute('inert','');
  const boxAfter=await carousel.boundingBox();assert(Math.abs(boxBefore.height-boxAfter.height)<1,'no slide layout shift');
  await page.evaluate(async()=>{await document.fonts.ready;window.scrollTo(0,0);await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);});
  await capture(page,{path:previewDir+'/program-hero-brand-'+device+'.png',fullPage:false,animations:'disabled'});
  await controls.getByRole('button',{name:'Rekomendasi program',exact:true}).click();
  await expect(hero).toHaveAttribute('data-hero-slide','recommendation');await expect(heroVisual).toBeVisible();
  await expect.poll(()=>hero.locator('[data-hero-reveal]').evaluate(el=>Number(getComputedStyle(el).opacity))).toBe(1);
  await page.evaluate(async()=>{await document.fonts.ready;window.scrollTo(0,0);await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'home overflow '+device);
  if(device==='mobile'){
   const headerBox=await page.locator('#global-navbar nav').boundingBox();
   const needsBox=await heroVisual.locator('[data-journey-layer="0"]').boundingBox();
   assert(needsBox.y>=headerBox.y+headerBox.height+8,'needs card clears mobile header');
  }
  await capture(page,{path:previewDir+'/program-hero-'+device+'.png',fullPage:false,animations:'disabled'});
  const controlsBox=await controls.boundingBox(),heroBox=await hero.boundingBox();
  assert(Math.abs(controlsBox.x+controlsBox.width/2-width/2)<2,'controls centered across hero '+device);
  assert(heroBox.y+heroBox.height-controlsBox.y-controlsBox.height>=80,'controls leave space for Scroll '+device);
  assert(heroBox.y+heroBox.height-controlsBox.y-controlsBox.height<=95,'controls at hero bottom '+device);
  const scroll=hero.getByRole('link',{name:'Scroll ke bagian berikutnya'});await expect(scroll).toHaveAttribute('href','#platform');
  const scrollBox=await scroll.boundingBox();
  assert(Math.abs(scrollBox.x+scrollBox.width/2-width/2)<2,'Scroll centered '+device);
  assert(scrollBox.y>=controlsBox.y+controlsBox.height+12,'Scroll separated from controls '+device);
  assert(scrollBox.height>=44,'Scroll touch target');
  if(process.env.PROGRAM_UI_NO_CAPTURE!=='1')await controls.screenshot({path:previewDir+'/program-hero-controls-'+device+'.png',animations:'disabled'});
  if(process.env.PROGRAM_UI_NO_CAPTURE!=='1')await heroVisual.screenshot({path:previewDir+'/program-hero-example-'+device+'.png',animations:'disabled'});
  if(device==='mobile'&&process.env.PROGRAM_UI_NO_CAPTURE!=='1'){
   await page.evaluate(()=>window.scrollTo(0,0));await hero.screenshot({path:previewDir+'/program-hero-full-mobile.png',animations:'disabled'});
  }
  for(const homeWidth of device==='desktop'?[768,1024,1280,1440,1600]:[320,390]){
   await page.setViewportSize({width:homeWidth,height});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'home overflow '+homeWidth);
   for(const layer of await heroVisual.locator('[data-journey-layer]').all())if(!await layer.evaluate(el=>{const copy=el.querySelector('[data-card-copy]'),style=getComputedStyle(el);return copy.offsetHeight+parseFloat(style.paddingTop)+parseFloat(style.paddingBottom)<=el.clientHeight+1;}))layoutIssues.push('journey copy overflows at '+homeWidth+' layer '+await layer.getAttribute('data-journey-layer'));
   if([320,1280].includes(homeWidth)&&process.env.PROGRAM_UI_NO_CAPTURE!=='1')await heroVisual.screenshot({path:previewDir+'/program-hero-fit-'+homeWidth+'.png',animations:'disabled',style:'#global-navbar {visibility:hidden}'});
   if(homeWidth>=1024)assert(await hero.locator(':scope > div').evaluate(el=>parseFloat(getComputedStyle(el).minHeight))<=1010,'bounded desktop minimum; intrinsic content may grow '+homeWidth);
  }
  await page.setViewportSize({width,height});
  if(device==='desktop'){
   await page.emulateMedia({forcedColors:'active'});
   assert.equal(await heroVisual.locator('[data-journey-layer="0"]').evaluate(el=>getComputedStyle(el).backdropFilter),'none','hero forced-color fallback');
   assert.equal(await heroVisual.locator('img').first().locator('..').evaluate(el=>getComputedStyle(el).display),'none','hide sculpture raster in forced colors');
   await expect(liquid).not.toBeVisible();
   await page.emulateMedia({forcedColors:'none'});
  }
  await scroll.click();await expect(page).toHaveURL(/#platform$/);await expect(page.locator('#platform')).toBeInViewport();
  } else {await verifyMobileHeroDeck(page,previewDir,capture);}
  await hero.getByRole('link',{name:'Dapatkan rekomendasi program'}).click();await page.waitForURL(/\/id\/rekomendasi-program/);
  assert.equal(new URL(page.url()).searchParams.get('utm_campaign'),'program-test');
  await page.getByRole('heading',{level:1,name:'Temukan program yang tepat untuk tim Anda.'}).waitFor();
  const titleBox=await page.getByRole('heading',{level:1}).boundingBox(),navBox=await page.locator('#global-navbar').boundingBox();
  assert(titleBox.y>=navBox.y+navBox.height,'landing heading must clear the fixed navigation');
  for(const name of ['Diagnosis tim / organisasi','Self Diagnostic individu','Katalog program','Inquiry / konsultasi'])await page.getByRole('heading',{name,exact:true}).waitFor();
  const canonical=await page.locator('link[rel=canonical]').getAttribute('href');assert(canonical.replace(/\/$/,'').endsWith('/id/rekomendasi-program'),canonical);
  assert.equal(await page.locator('link[hreflang]').count(),2);
  const demo=page.getByRole('tablist',{name:'Ilustrasi alur rekomendasi'});
  assert.equal(await demo.evaluate(el=>getComputedStyle(el).backdropFilter),'none','tab rail must remain flat');
  assert.equal(await demo.evaluate(el=>getComputedStyle(el).backgroundImage),'none','no gradient on tab rail');
  assert.equal(await demo.locator('svg').count(),0,'tabs have no icons');
  assert.equal(await page.locator('#recommendation-preview').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(247, 248, 250)','original canvas ground');
  assert.equal(await page.locator('#recommendation-preview').evaluate(el=>getComputedStyle(el).backgroundImage),'none','no gradient on outer showcase');
  const needs=demo.getByRole('tab',{name:'Kebutuhan',exact:true});
  const competency=demo.getByRole('tab',{name:'Kompetensi',exact:true});
  const program=demo.getByRole('tab',{name:'Program',exact:true});
  await expect(needs).toHaveAttribute('aria-selected','true');
  const preview=page.locator('#recommendation-preview');
  const artPanel=preview.locator('[data-tone]');
  const artCopy=artPanel.locator(':scope > p');
  assert.equal(await artPanel.locator(':scope > div').count(),0,'no inset card over artwork');
  const sceneChecks=[
   ['needs','direction-ribbon.webp','Dari tantanganmenuju hasil yang nyata.'],
   ['competencies','competency-lenses.webp','Kenali kemampuanyang perlu dikembangkan.'],
   ['program','program-layers.webp','Program yang tepat.Langkah yang jelas.'],
  ];
  await expect(artPanel.locator('img')).toHaveCount(3);
  const tones=new Set();
  for(const [index,[tone,file,copy]] of sceneChecks.entries()){
   await demo.getByRole('tab').nth(index).click();
   await expect(artPanel).toHaveAttribute('data-tone',tone);
   assert.equal(await artCopy.textContent(),copy);
   const activeArt=artPanel.locator('img[data-active="true"]');
   assert((await activeArt.getAttribute('src')).includes(file),'unique image '+tone);
   await expect.poll(()=>activeArt.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
   tones.add(await artPanel.evaluate(el=>getComputedStyle(el).backgroundColor));
   assert.equal(await activeArt.evaluate(el=>getComputedStyle(el).filter),'blur(20px)','direct static image blur');
   assert.equal(await activeArt.evaluate(el=>getComputedStyle(el).transitionDuration),'0s','blur must not animate');
   assert.equal(await artPanel.evaluate(el=>getComputedStyle(el).backdropFilter),'none','no extra glass sheet');
   assert.equal(await artCopy.evaluate(el=>getComputedStyle(el).filter),'none','copy remains sharp');
   for(const sceneWidth of [320,768,width]){await page.setViewportSize({width:sceneWidth,height});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'scene overflow '+tone+' '+sceneWidth);}
   await page.setViewportSize({width,height});
   if(process.env.PROGRAM_UI_NO_CAPTURE!=='1')await preview.screenshot({path:previewDir+'/program-scene-'+tone+'-'+device+'.png',animations:'disabled'});
  }
  assert.equal(tones.size,3,'three distinct image-panel tones');
  await needs.click();
  await page.evaluate(()=>document.fonts.ready);
  const originalPreview=await preview.boundingBox();
  await needs.focus();await needs.press('ArrowRight');
  await expect(competency).toBeFocused();await expect(competency).toHaveAttribute('aria-selected','true');
  const competencyPreview=await preview.boundingBox();assert(Math.abs(originalPreview.height-competencyPreview.height)<1,'competency demo stable '+device);
  await expect(page.getByRole('tabpanel')).toHaveCount(1);
  await expect(page.getByRole('tabpanel').getByRole('heading',{name:'Collaboration',exact:true})).toBeVisible();
  await competency.press('End');await expect(program).toBeFocused();
  const catalogExample=page.getByRole('link',{name:'Lihat program ini di katalog'});
  await expect(catalogExample).toHaveAttribute('href','/id/pricing/?solution=SS-13');
  const programPreview=await preview.boundingBox();
  assert(Math.abs(originalPreview.height-programPreview.height)<1,'no demo layout shift '+device+': '+originalPreview.height+' -> '+programPreview.height);
  await program.press('Home');await expect(needs).toBeFocused();
  assert.equal(await needs.evaluate(el=>getComputedStyle(el,'::before').opacity),'0.75','selected tab gradient is softer');
  if(device==='desktop'){
   await competency.hover();await page.waitForTimeout(200);
   assert.equal(await competency.evaluate(el=>getComputedStyle(el,'::before').opacity),'0.4','hover gradient is softer');
   await capture(page,{path:previewDir+'/program-glass-tabs-hover.png',fullPage:false,animations:'disabled'});
  }
  if(process.env.PROGRAM_UI_NO_CAPTURE!=='1')await demo.screenshot({path:previewDir+'/program-glass-tabs-'+device+'.png',animations:'disabled'});
  await competency.click();await expect(competency).toHaveAttribute('aria-selected','true');
  await needs.click();await expect(needs).toHaveAttribute('aria-selected','true');
  await page.getByText('Apakah saya perlu membuat akun?',{exact:true}).click();
  await expect(page.getByText('Tidak. Anda dapat langsung memulai pengisian kebutuhan.',{exact:false})).toBeVisible();
  await page.getByText('Apakah saya perlu membuat akun?',{exact:true}).click();
  const art=preview.locator('img[data-active="true"]');assert(await art.evaluate(image=>image.complete&&image.naturalWidth>0),'generated artwork loaded');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'landing overflow '+device);
  for(const checkWidth of device==='desktop'?[768,1280,1600]:[320,390]){await page.setViewportSize({width:checkWidth,height});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow at '+checkWidth);}
  await page.setViewportSize({width,height});
  await page.evaluate(async()=>{await document.fonts.ready;window.scrollTo(0,0);await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);});
  await capture(page,{path:previewDir+'/program-landing-'+device+'.png',fullPage:true,animations:'disabled'});
  await capture(page,{path:previewDir+'/program-landing-'+device+'-viewport.png',fullPage:false,animations:'disabled'});
  const reportDocument=page.getByRole('heading',{name:'Arah pengembangan organisasi',exact:true}).locator('..');
  assert.notEqual(await reportDocument.evaluate(el=>getComputedStyle(el).backdropFilter),'none','report document uses static backdrop blur');
  const reportFrame=reportDocument.locator('..');
  assert.equal(await reportDocument.evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(255, 255, 255, 0.2)','only inner document is transparent glass');
  assert.equal(await reportFrame.evaluate(el=>getComputedStyle(el,'::before').backgroundImage),'none','no ribbon behind report frame');
  assert.equal(await reportFrame.evaluate(el=>getComputedStyle(el).backdropFilter),'none','outer report frame is not glass');
  assert(await reportFrame.evaluate(el=>{const sample=document.createElement('span');sample.style.backgroundImage=getComputedStyle(el).getPropertyValue('--program-gradient-daylight');el.append(sample);const same=getComputedStyle(sample).backgroundImage===getComputedStyle(el).backgroundImage;sample.remove();return same;}),'original Daylight frame');
  if(process.env.PROGRAM_UI_NO_CAPTURE!=='1')await reportFrame.screenshot({path:previewDir+'/program-glass-report-'+device+'.png',animations:'disabled'});
  const processSection=page.locator('#program-process');
  const processCards=processSection.locator('[data-process-card]');
  const openingArt=page.locator('[data-program-opening] figure img');
  await expect.poll(()=>openingArt.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
  const processRail=processSection.getByRole('list');
  if(device==='mobile'){
   assert.equal(await preview.locator('[data-tone]').evaluate(el=>Math.round(el.getBoundingClientRect().width)),64,'mobile demo art is a side accent, not another stacked section');
   assert(await processRail.evaluate(el=>el.scrollWidth>el.clientWidth),'mobile steps are a horizontal reading rail');
   await processRail.evaluate(el=>window.scrollTo({top:el.getBoundingClientRect().top+window.scrollY-160,behavior:'instant'}));
   await expect(processRail).toBeInViewport();
   const box=await processRail.boundingBox();const touchSession=await page.context().newCDPSession(page);
   const gestureY=Math.round(Math.max(120,Math.min(height-100,box.y+box.height/2)));
   const gestureX=Math.round(box.x+box.width*.8);
   await touchSession.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:gestureX,y:gestureY}]});
   for(let step=1;step<=8;step++){
    await touchSession.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:gestureX-28*step,y:gestureY}]});
    await page.waitForTimeout(30);
   }
   await touchSession.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await expect.poll(()=>processRail.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
   await touchSession.detach();
   await processRail.evaluate(el=>el.scrollLeft=0);
  }
  await expect(processCards).toHaveCount(3);
  for(const card of await processCards.all()){
   assert.notEqual(await card.evaluate(el=>getComputedStyle(el).backdropFilter),'none','process cards use static glass');
   assert.equal(await card.evaluate(el=>getComputedStyle(el).transitionDuration),'0s','process glass does not animate');
  }
  assert.equal(await processSection.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(240, 241, 248)','calm lavender-blue process ground');
  assert.equal(await processSection.locator('p').first().evaluate(el=>getComputedStyle(el).color),'rgb(64, 86, 117)','dark readable process copy outside cards');
  const closing=page.locator('#program-closing');
  await closing.scrollIntoViewIfNeeded();
  const ctaArt=closing.locator('img');
  assert((await ctaArt.getAttribute('src')).includes('cta-glass-path.webp'),'dedicated generated CTA background');
  await expect.poll(()=>ctaArt.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
  await expect(closing.getByRole('link',{name:'Dapatkan rekomendasi program'})).toHaveAttribute('href',/\/discovery/);
  if(process.env.PROGRAM_UI_NO_CAPTURE!=='1'){
   await processSection.screenshot({path:previewDir+'/program-process-'+device+'.png',animations:'disabled'});
   await closing.screenshot({path:previewDir+'/program-closing-'+device+'.png',animations:'disabled'});
  }
  if(device==='desktop'){
   await page.emulateMedia({forcedColors:'active'});
   assert.equal(await reportDocument.evaluate(el=>getComputedStyle(el).backdropFilter),'none','opaque forced-color fallback');
   assert.equal(await artPanel.locator('img[data-active="true"]').evaluate(el=>getComputedStyle(el).display),'none','art forced-color fallback');
   assert.equal(await processCards.first().evaluate(el=>getComputedStyle(el).backdropFilter),'none','process forced-color fallback');
   assert.equal(await ctaArt.evaluate(el=>getComputedStyle(el).display),'none','CTA image hidden in forced colors');
   await page.emulateMedia({forcedColors:'none'});
  }
  await page.route('**/discovery?**',r=>r.fulfill({body:'Synthetic handoff only',contentType:'text/html'}));
  await page.getByRole('link',{name:'Dapatkan rekomendasi program',exact:true}).first().click();await page.waitForURL(/\/discovery\?/);
  assert.equal(new URL(page.url()).searchParams.get('utm_campaign'),'program-test');
  await page.goto(base+'/en/rekomendasi-program');await page.getByRole('heading',{level:1,name:'Find the right program for your team.'}).waitFor();
  assert.equal(await page.locator('[data-tone="needs"] > p').textContent(),'From challengesto tangible results.');
  await page.getByRole('tab',{name:'Competencies',exact:true}).click();
  assert.equal(await page.locator('[data-tone="competencies"] > p').textContent(),'Identify the capabilitiesyour team needs to develop.');
  await page.getByRole('tab',{name:'Program',exact:true}).click();
  assert.equal(await page.locator('[data-tone="program"] p').textContent(),'The right program.A clear next step.');
  await expect(page.getByRole('link',{name:'View this program in the catalog'})).toHaveAttribute('href','/en/pricing/?solution=SS-13');
  assert((await page.locator('link[rel=canonical]').getAttribute('href')).replace(/\/$/,'').endsWith('/en/rekomendasi-program'));
  await page.goto(base+'/en');
  await expect(page.locator('#home-hero')).toHaveAttribute('data-hero-slide','recommendation');
  if(device==='desktop')for(const label of ['Your needs','Competencies','Your program'])await expect(page.locator('[data-program-hero-visual]').getByText(label,{exact:true})).toBeVisible();
  else {await expect(page.locator('[data-mobile-hero-deck]')).toBeVisible();for(const label of ['Your needs','Competencies','Your program','About BinaHub'])await expect(page.locator('#home-hero').getByRole('button',{name:label,exact:true})).toBeVisible();}
  assert.deepEqual(errors,[]);await page.close();
 }
 const auto=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});
 await auto.addInitScript(()=>sessionStorage.setItem('binahub:intro-seen','1'));
 await auto.route('**/api/**',r=>r.fulfill({status:503,json:{success:false}}));
  await auto.goto(base+'/id');
 const hero=auto.locator('#home-hero'),controls=hero.getByRole('group',{name:'Kontrol slide utama'});
 const programVisual=hero.locator('[data-program-hero-visual]');
 await expect(controls.getByRole('button',{name:'Jeda pergantian otomatis'})).toBeVisible();
  await expect(hero.getByRole('region',{name:'Pilihan utama BinaHub'})).toHaveAttribute('data-auto-rotating','true');
  await expect(programVisual).toHaveAttribute('data-orbit-running','true');
  assert.equal(await programVisual.locator('[data-program-orbit]').evaluate(el=>getComputedStyle(el).animationPlayState),'running','orbit rotates with playback');
  const orbitBefore=await programVisual.locator('[data-program-orbit]').evaluate(el=>getComputedStyle(el).transform);
  await auto.waitForTimeout(150);
  assert.notEqual(await programVisual.locator('[data-program-orbit]').evaluate(el=>getComputedStyle(el).transform),orbitBefore,'orbit transform advances');
  const pool=programVisual.locator('[data-liquid-flow=ice]');
  assert.equal(await pool.evaluate(el=>getComputedStyle(el).animationPlayState),'running','liquid plays with recommendation');
  const liquidBefore=await pool.evaluate(el=>getComputedStyle(el).transform);
  await auto.waitForTimeout(150);
  assert.notEqual(await pool.evaluate(el=>getComputedStyle(el).transform),liquidBefore,'liquid color pool transform advances');
  assert.equal(await pool.evaluate(el=>getComputedStyle(el).filter),'blur(26px)','liquid blur stays static');
  await expect(controls.getByRole('button',{name:'Tentang BinaHub',exact:true})).toHaveAttribute('aria-pressed','true',{timeout:11000});
 await expect(hero).toHaveAttribute('data-hero-slide','brand');
 await expect(programVisual).toHaveAttribute('data-orbit-running','false');
 assert.equal(await pool.evaluate(el=>getComputedStyle(el).animationPlayState),'paused','liquid pauses on inactive slide');
 await controls.getByRole('button',{name:'Jeda pergantian otomatis'}).click();await auto.mouse.move(20,20);
  await auto.waitForTimeout(8500);await expect(controls.getByRole('button',{name:'Tentang BinaHub',exact:true})).toHaveAttribute('aria-pressed','true');
 await controls.getByRole('button',{name:'Putar slide otomatis'}).click();await auto.mouse.move(20,20);
  await expect(hero.getByRole('region',{name:'Pilihan utama BinaHub'})).toHaveAttribute('data-auto-rotating','true');
  await expect(controls.getByRole('button',{name:'Rekomendasi program',exact:true})).toHaveAttribute('aria-pressed','true',{timeout:11000});
 await expect(hero).toHaveAttribute('data-hero-slide','recommendation');
  await hero.getByRole('link',{name:'Dapatkan rekomendasi program',exact:true}).hover();await auto.waitForTimeout(8500);
 await expect(controls.getByRole('button',{name:'Rekomendasi program',exact:true})).toHaveAttribute('aria-pressed','true');
  await auto.mouse.move(20,20);await expect(hero.getByRole('region',{name:'Pilihan utama BinaHub'})).toHaveAttribute('data-auto-rotating','true');await expect(controls.getByRole('button',{name:'Tentang BinaHub',exact:true})).toHaveAttribute('aria-pressed','true',{timeout:11000});
  await hero.getByRole('link',{name:'Mulai diagnosis',exact:true}).focus();await auto.waitForTimeout(8500);
 await expect(controls.getByRole('button',{name:'Putar slide otomatis'})).toBeVisible();await expect(controls.getByRole('button',{name:'Tentang BinaHub',exact:true})).toHaveAttribute('aria-pressed','true');
 const rotation=controls.getByRole('button',{name:'Putar slide otomatis'});await rotation.focus();await rotation.press('Enter');
 await expect(hero.getByRole('region',{name:'Pilihan utama BinaHub'})).toHaveAttribute('data-auto-rotating','true');
 await auto.evaluate(()=>window.scrollTo(0,innerHeight*2));
 await expect(hero.getByRole('region',{name:'Pilihan utama BinaHub'})).toHaveAttribute('data-auto-rotating','false');
  await expect(programVisual).toHaveAttribute('data-orbit-running','false');
 assert.equal(await pool.evaluate(el=>getComputedStyle(el).animationPlayState),'paused','liquid pauses offscreen');
 await auto.evaluate(()=>window.scrollTo(0,0));
 await expect(hero.getByRole('region',{name:'Pilihan utama BinaHub'})).toHaveAttribute('data-auto-rotating','true');
 await auto.close();
 const mobileAuto=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'no-preference'});
 await mobileAuto.addInitScript(()=>sessionStorage.setItem('binahub:intro-seen','1'));
 await mobileAuto.route('**/api/**',r=>r.fulfill({status:503,json:{success:false}}));
 await verifyMobileDeckAutoplay(mobileAuto,base);await mobileAuto.close();
 assert.deepEqual(layoutIssues,[],'responsive journey content must fit');
 console.log('PASS: existing carousel regression; landing demo keyboard/touch, stable height, catalog link, FAQ, image; reduced motion, desktop/mobile, five paths, ID/EN metadata and tracked handoff; no API writes.');
}finally{await browser?.close();if(server.exitCode===null)server.kill();await stopped;}
