import { test,expect } from '@playwright/test';
test.skip(!process.env.PLAYWRIGHT_COMMERCE_PREVIEW,'Opt-in synthetic component preview; never bypasses production admin authentication.');
const configuration={name:null,description:null,priceIdr:null,attempts:null,startWithinDays:null,completeWithinDays:null,
  retentionMonths:null,refundPolicy:null,terms:null,reportVersion:null};
test('responsive draft preparation, real pending decisions and saved feedback',async({page},info)=>{
  let saved={...configuration} as Record<string,unknown>,revision=0;
  await page.route('**/api/admin/assessments/individual/commerce**',async route=>{
    if(route.request().method()==='PUT'){saved=route.request().postDataJSON().configuration;revision++;}
    await route.fulfill({contentType:'application/json',body:JSON.stringify({success:true,dashboard:{revision,configuration:saved,
      areas:[{code:'PE-01',name:'Synthetic Area One'},{code:'PE-03',name:'Synthetic Area Two'},{code:'PE-05',name:'Synthetic Area Three'}],
      readiness:{canSell:false,missing:['Integrasi dan pengujian payment gateway','Format laporan']},
      counts:{pending:0,paid:0,attention:0},orders:[],matchedCount:0}})});
  });
  await page.setViewportSize(info.project.name==='chromium'?{width:1440,height:1000}:{width:390,height:844});
  await page.goto('/');await expect(page.getByText('Belum ada transaksi yang sesuai.')).toBeVisible();
  expect((await page.getByRole('searchbox',{name:'Cari transaksi'}).boundingBox())!.width).toBeGreaterThan(220);
  await page.setViewportSize({width:320,height:844});
  expect((await page.getByRole('searchbox',{name:'Cari transaksi'}).boundingBox())!.width).toBeGreaterThan(220);
  await page.setViewportSize(info.project.name==='chromium'?{width:1440,height:1000}:{width:390,height:844});
  await page.screenshot({path:`.codex_tmp/commerce-orders-${info.project.name}.png`,fullPage:true});
  await page.getByRole('button',{name:'Paket asesmen',exact:true}).click();
  await expect(page.getByLabel('Harga total yang dibayar (Rp)')).toHaveValue('');
  await page.getByLabel('Nama paket',{exact:true}).fill('Synthetic internal draft');
  await page.getByRole('button',{name:'Simpan draft paket',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('Draft paket tersimpan');
  await page.screenshot({path:`.codex_tmp/commerce-package-${info.project.name}.png`,fullPage:true});
  await page.setViewportSize({width:320,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  expect(saved.priceIdr).toBeNull();
  await expect(page.getByRole('button',{name:/aktifkan|tandai lunas|bayar sekarang/i})).toHaveCount(0);
});
