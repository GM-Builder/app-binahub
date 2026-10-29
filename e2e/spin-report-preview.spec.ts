import {expect,test} from '@playwright/test';
test.skip(process.env.PLAYWRIGHT_SPIN_PREVIEW!=='1','Synthetic loopback preview only.');
test('report dashboard keeps recommendation, review and empty states readable across viewports',async({page,baseURL},info)=>{
 expect(baseURL).toMatch(/^http:\/\/127\.0\.0\.1:/);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',route=>route.abort());
 const mobile=info.project.name.includes('mobile');await page.setViewportSize({width:mobile?390:1440,height:mobile?844:1000});
 await page.goto('/?spin&view=report');await expect(page.getByRole('heading',{name:'Program yang relevan'})).toBeVisible();
 await expect(page.getByText('Meeting Leadership')).toBeVisible();
 await page.getByText('Lihat materi dan komponen program',{exact:true}).click();
 await expect(page.getByText('Desain agenda dan fasilitasi diskusi.')).toBeVisible();
 await page.screenshot({path:'.impeccable/review/spin-report-'+(mobile?'mobile':'desktop')+'.png',fullPage:true});
 await page.goto('/?spin&view=report&reportCase=review');
 await expect(page.getByRole('heading',{name:'Opsi program untuk konsultasi'})).toBeVisible();
 await expect(page.getByText(/Hambatan proses, peran/)).toBeVisible();await expect(page.getByText(/Rp/)).toHaveCount(0);
 await page.screenshot({path:'.impeccable/review/spin-report-review-'+(mobile?'mobile':'desktop')+'.png',fullPage:true});
 await page.goto('/?spin&view=report&reportCase=empty');await expect(page.getByRole('heading',{name:'Belum ada program yang ditetapkan'})).toBeVisible();
 for(const width of [320,768,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.setViewportSize({width:mobile?390:1440,height:mobile?844:1000});
 await page.goto('/?spin&view=report&reportCase=dense');
 await expect(page.getByText('Lihat 2 poin lainnya')).toBeVisible();
 await expect(page.getByText('Kebiasaan lama masih berulang.')).toBeHidden();
 await page.getByText('Lihat 2 poin lainnya').click();
 await expect(page.getByText('Kebiasaan lama masih berulang.')).toBeVisible();
 await page.screenshot({path:'.impeccable/review/spin-summary-points-'+(mobile?'mobile':'desktop')+'.png',fullPage:true});
 const context=page.getByText('Lihat konteks dan rincian kebutuhan',{exact:true});await context.click();
 await expect(context.locator('..').locator('li').first()).toBeVisible();
 await context.locator('..').screenshot({path:'.impeccable/review/spin-context-'+(mobile?'mobile':'desktop')+'.png'});
 expect(errors).toEqual([]);
});
