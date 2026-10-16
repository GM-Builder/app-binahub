import { test,expect } from '@playwright/test';
test.skip(!process.env.PLAYWRIGHT_CATALOG,'Opt-in website-prod UI verification; not an app route.');

// Run against website-prod with PLAYWRIGHT_BASE_URL/PORT and reuse enabled.
// Synthetic API fixtures: no production journey events or contact requests.
const module=(code:string,name:string)=>({id:code,code,name,description:'Pengembangan yang relevan dengan kebutuhan organisasi.',tagline:'Bangun kebiasaan kerja yang berdampak.',
  learningObjectives:['Tujuan CEO sintetis yang tetap utuh.'],contentOutline:['Cakupan CEO sintetis yang tetap utuh.'],outputs:['Hasil CEO sintetis yang tetap utuh.'],
  bestFor:'Manager dan pemimpin tim',engagementFormat:'Workshop',duration:'1 hari',capacity:'20 orang',serviceBrand:'BinaHub',notes:'Catatan CEO sintetis.',standardScope:null,deliverables:null});
const products=[
  {key:'signature-self',name:'Self Transformation',modules:[module('COACH-01','Executive Coaching'),module('SELF-01','Personal Effectiveness')]},
  {key:'signature-team',name:'Team Transformation',modules:[module('TEAM-01','High Performing Teams'),module('TEAM-02','Team Alignment')]},
  {key:'signature-organization',name:'Organization Transformation',modules:[module('ORG-01','Culture Transformation'),module('ORG-02','Change Leadership')]},
];
test.beforeEach(async({page})=>{
  await page.route('https://api.binahub.id/**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(
    route.request().url().includes('/api/catalog/modules')?{success:true,products}:{success:true,journeyId:'00000000-0000-4000-8000-000000000001'})}));
});
test('compact Indonesian catalog, English item titles, combined filters and complete accessible details',async({page},info)=>{
  await page.setViewportSize(info.project.name==='chromium'?{width:1440,height:1000}:{width:390,height:844});
  await page.goto('/id/pricing/');
  await expect(page.getByRole('heading',{name:'Katalog solusi BinaHub'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Executive Coaching',exact:true})).toBeVisible();
  await expect(page.getByRole('combobox',{name:'Kategori'})).toContainText('Pengembangan tim');
  await page.screenshot({path:`.codex_tmp/catalog-${info.project.name}.png`,fullPage:true});
  const search=page.getByRole('searchbox',{name:'Cari solusi'});
  await search.fill('co');
  await expect(page.getByRole('heading',{name:'Executive Coaching',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Team Alignment',exact:true})).toHaveCount(0);
  await page.getByRole('combobox',{name:'Kategori'}).selectOption('signature-team');
  await expect(page.getByText('Belum ada solusi yang cocok.')).toBeVisible();
  await page.getByRole('button',{name:'Hapus filter',exact:true}).click();
  const trigger=page.getByRole('button',{name:'Lihat rincian: Executive Coaching',exact:true}).first();
  await trigger.click();
  const dialog=page.getByRole('dialog',{name:'Rincian solusi: Executive Coaching'});
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button',{name:'Tutup',exact:true}).focus();await page.keyboard.press('Shift+Tab');
  expect(await dialog.evaluate(element=>element.contains(document.activeElement))).toBe(true);
  for(const text of ['Tujuan CEO sintetis yang tetap utuh.','Cakupan CEO sintetis yang tetap utuh.','Hasil CEO sintetis yang tetap utuh.'])await expect(dialog.getByText(text)).toBeVisible();
  await page.screenshot({path:`.codex_tmp/catalog-detail-${info.project.name}.png`});
  await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(trigger).toBeFocused();
  await expect(page.locator('main')).not.toContainText(/Rp\s?[0-9]/);
  await expect(page.locator('main')).toHaveCount(1);
  await page.setViewportSize({width:320,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
test('page metadata and interface follow locale without translating item titles',async({page})=>{
  await page.goto('/id/pricing/');await expect(page).toHaveTitle(/Katalog Solusi/);
  await page.goto('/en/pricing/');await expect(page).toHaveTitle(/Solutions Catalog/);
  await expect(page.getByRole('heading',{name:'Find the right solution for your team.'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Executive Coaching',exact:true})).toBeVisible();
});
test('selection survives reload, selected-only and contact links exclude unavailable codes',async({page})=>{
  await page.goto('/id/pricing/');
  await page.getByRole('button',{name:'Tambahkan ke pilihan: Executive Coaching',exact:true}).click();
  await page.getByRole('button',{name:'Pilihan saya (1)',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Team Alignment',exact:true})).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button',{name:'Hapus dari pilihan: Executive Coaching',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Pilihan Anda 1',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Pilihan Anda'});
  await expect(dialog.getByRole('link',{name:'Diskusikan pilihan'})).toHaveAttribute('href','/id/contact?modules=COACH-01');
  await dialog.getByRole('button',{name:'Hapus dari pilihan: Executive Coaching',exact:true}).click();
  await expect(dialog.getByText('Belum ada solusi yang dipilih.')).toBeVisible();
});
test('failed catalog request supports retry without fake products',async({page})=>{
  let failing=true;
  await page.route('**/api/catalog/modules**',route=>route.fulfill({status:failing?503:200,contentType:'application/json',body:JSON.stringify(failing?{success:false}:{success:true,products})}));
  await page.goto('/id/pricing/');await expect(page.getByRole('heading',{name:'Katalog belum tersedia'})).toBeVisible();
  failing=false;
  await page.getByRole('button',{name:'Coba lagi',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Executive Coaching',exact:true})).toBeVisible();
});
