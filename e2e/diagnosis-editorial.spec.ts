import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
test.skip(process.env.PLAYWRIGHT_DIAGNOSIS_REFERENCE!=='1','Synthetic loopback build only');
test('editorial choice and packages keep returning tools inside individual',async({page,baseURL},info)=>{
 expect(baseURL).toMatch(/^http:\/\/127\.0\.0\.1:/);await mkdir('.impeccable/review',{recursive:true});
 const mobile=info.project.name.includes('mobile'),device=mobile?'mobile':'desktop';
 await page.setViewportSize({width:mobile?390:1440,height:mobile?844:1000});
 await page.route('**/api/**',route=>route.fulfill({json:{available:true}}));
 await page.goto('/diagnose?utm_source=email');
 await expect(page.getByRole('link',{name:'Lihat paket individu'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Sudah pernah melakukan diagnosis?'})).toHaveCount(0);
 await page.screenshot({path:`.impeccable/review/diagnosis-editorial-choice-${device}.png`,fullPage:true});
 for(const width of [320,768,1024]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.setViewportSize({width:mobile?390:1440,height:mobile?844:1000});
 await page.getByRole('link',{name:'Lihat paket individu'}).click();
 await expect(page).toHaveURL(/\/insight\/individual\/packages\?utm_source=email/);
 await expect(page.getByRole('heading',{name:'Sudah pernah melakukan diagnosis?'})).toBeVisible();
 await expect(page.getByRole('link',{name:'Lihat hasil individu'})).toHaveAttribute('href','/insight/individual/result');
 await expect(page.getByRole('link',{name:'Riwayat pengisian akun'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Coming soon: Personal Effectiveness'})).toBeDisabled();
 await expect(page.getByRole('button',{name:'Coming soon: Relationship Management'})).toBeDisabled();
 await page.screenshot({path:`.impeccable/review/diagnosis-editorial-packages-${device}.png`,fullPage:true});
 for(const width of [320,768,1024]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});
