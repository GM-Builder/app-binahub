import assert from 'node:assert/strict';
import {expect} from '@playwright/test';

export async function verifyMobileHeroDeck(page,previewDir,capture) {
 const hero=page.locator('#home-hero');
 const deck=hero.locator('[data-mobile-hero-deck]');
 const controls=hero.getByRole('group',{name:'Kontrol slide utama'});
 const carousel=hero.getByRole('region',{name:'Pilihan utama BinaHub'});
 await expect(deck).toBeVisible();
 await expect(deck.locator('[data-deck-card]')).toHaveCount(4);
 await expect(controls.getByRole('button')).toHaveCount(5);
 await expect(controls.getByRole('button',{name:'Putar slide otomatis'})).toBeDisabled();
 await expect(hero.locator('[data-program-hero-visual]')).not.toBeVisible();
 const before=await carousel.boundingBox();
 const labels=['Kebutuhan','Kompetensi','Program','Tentang BinaHub'];
 for(let index=0;index<4;index++) {
  await controls.getByRole('button',{name:labels[index],exact:true}).click();
  await expect(deck).toHaveAttribute('data-active-card',String(index));
  const front=deck.locator(`[data-deck-card="${index}"]`);
  await expect(front).toHaveAttribute('data-position','0');
  for(const card of await deck.locator('[data-deck-card]').all()) {
   const size=await card.evaluate(el=>({w:el.clientWidth,h:el.clientHeight}));
   assert(Math.abs(size.w-size.h)<2,'mobile cards are square');
  }
  await expect.poll(()=>front.locator('img').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
  assert.equal(await front.locator('div').first().evaluate(el=>getComputedStyle(el).opacity),'1');
  await expect(hero).toHaveAttribute('data-hero-slide',index===3?'brand':'recommendation');
  await expect(hero.getByRole('heading',{level:1})).toHaveCount(1);
  await expect(hero.getByRole('link',{name:index===3?'Mulai diagnosis':'Dapatkan rekomendasi program',exact:true})).toHaveAttribute('href',index===3?'/id/insight':'/id/rekomendasi-program');
  const after=await carousel.boundingBox();
  assert(Math.abs(before.height-after.height)<1,'deck changes must not shift the hero');
  await page.evaluate(async()=>{await document.fonts.ready;window.scrollTo({top:0,behavior:'instant'});});
  await capture(page,{path:`${previewDir}/home-mobile-deck-${index}.png`,fullPage:false,animations:'disabled'});
 }
 const backgrounds=await deck.locator('[data-deck-card]').evaluateAll(cards=>cards.map(el=>getComputedStyle(el).backgroundImage));
 assert.equal(new Set(backgrounds).size,4,'four distinct card tones');
 const header=await page.locator('#global-navbar nav').boundingBox();
 const deckBox=await deck.boundingBox();
 assert(deckBox.y>=header.y+header.height+8,'deck clears navigation');
 assert((await hero.getByRole('heading',{level:1}).boundingBox()).y>deckBox.y+deckBox.height,'deck is above the offer copy');
 for(const button of await controls.getByRole('button').all())assert((await button.boundingBox()).height>=44,'44px controls');
 for(const width of [320,360,390,430]) {
  await page.setViewportSize({width,height:844});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile overflow '+width);
  if(width===320)await capture(page,{path:previewDir+'/home-mobile-deck-320.png',fullPage:false,animations:'disabled'});
 }
 await page.setViewportSize({width:390,height:844});
 await controls.getByRole('button',{name:'Kebutuhan',exact:true}).click();
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
 const touch=await page.context().newCDPSession(page);
 const box=await deck.boundingBox();
 const x=Math.round(box.x+box.width*.8),y=Math.round(box.y+box.height*.45);
 await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 for(let step=1;step<=7;step++){await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-step*20,y}]});await page.waitForTimeout(25);}
 await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await expect(deck).toHaveAttribute('data-active-card','1');
 const previousScroll=await page.evaluate(()=>scrollY);
 await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 for(let step=1;step<=6;step++){await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-step*16}]});await page.waitForTimeout(25);}
 await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(previousScroll);
 await expect(deck).toHaveAttribute('data-active-card','1');
 await touch.detach();
 await controls.getByRole('button',{name:'Kebutuhan',exact:true}).click();
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
 const scroll=hero.getByRole('link',{name:'Scroll ke bagian berikutnya'});
 await expect(scroll).toHaveAttribute('href','#platform');
 await scroll.click();await expect(page.locator('#platform')).toBeInViewport();
}

export async function verifyMobileDeckAutoplay(page,base) {
 await page.setViewportSize({width:390,height:844});
 await page.goto(base+'/id');await page.mouse.move(2,2);
 const hero=page.locator('#home-hero'),deck=hero.locator('[data-mobile-hero-deck]');
 await expect(deck).toHaveAttribute('data-active-card','0');
 for(const index of [1,2,3,0]) {
  await expect(deck).toHaveAttribute('data-active-card',String(index),{timeout:11000});
  await expect(hero).toHaveAttribute('data-hero-slide',index===3?'brand':'recommendation');
 }
 const controls=hero.getByRole('group',{name:'Kontrol slide utama'});
 await controls.getByRole('button',{name:'Jeda pergantian otomatis'}).tap();
 await expect(hero.getByRole('region',{name:'Pilihan utama BinaHub'})).toHaveAttribute('data-auto-rotating','false');
 await page.waitForTimeout(8500);await expect(deck).toHaveAttribute('data-active-card','0');
 await controls.getByRole('button',{name:'Putar slide otomatis'}).tap();
 await expect(hero.getByRole('region',{name:'Pilihan utama BinaHub'})).toHaveAttribute('data-auto-rotating','true');
 await expect(deck).toHaveAttribute('data-active-card','1',{timeout:11000});
 await controls.getByRole('button',{name:'Jeda pergantian otomatis'}).tap();
 await page.setViewportSize({width:1024,height:1000});
 await expect(deck).not.toBeVisible();await expect(controls.getByRole('button')).toHaveCount(3);
 await controls.getByRole('button',{name:'Tentang BinaHub',exact:true}).click();
 await expect(hero).toHaveAttribute('data-hero-slide','brand');
}
