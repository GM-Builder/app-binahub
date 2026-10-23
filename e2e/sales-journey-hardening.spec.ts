import {test,expect,type Route} from '@playwright/test';
const id='00000000-0000-4000-8000-000000000099';
const report={goal:'Prioritas kerja lebih terarah',methodology:'Metode ditampilkan terpisah.',priorityExplanation:'Prioritas berdasarkan konteks.',notice:'Data sintetis untuk pengujian.',
  areas:['Self-Development','Adaptability','Pressure Management'].map((name,n)=>({code:`PE-0${n+1}`,name,definition:'Area pengembangan kerja.',relevance:'high',
    selfReport:{score:75,validCount:4,naCount:0,status:'scored'},sjt:{score:50,validCount:2,status:'scored'},practice:null})),priorities:[]};
test.beforeEach(async({baseURL})=>test.skip(!/^http:\/\/(127\.0\.0\.1|localhost):/.test(baseURL||''),'Synthetic loopback only.'));
test('private result consultation: loading, no duplicate click, success and mobile layout',async({page},info)=>{
  let pending:Route|undefined,requests=0;
  await page.route('**/api/**',async route=>{
    if(route.request().method()==='PATCH'){
      expect(route.request().postDataJSON()).toEqual({action:'request_consultation'});requests++;pending=route;return;
    }
    return route.fulfill({json:{success:true,report,retentionUntil:'2027-04-18T00:00:00Z',access:{shared:true,evaluationConsent:false,clarity:null,usefulness:null}}});
  });
  await page.goto(`/insight/individual/result?attempt=${id}`);
  await expect(page.getByRole('heading',{name:'Hasil asesmen individu',exact:true})).toBeVisible();
  const button=page.getByRole('button',{name:'Minta konsultasi',exact:true});await button.click();
  await expect(page.getByRole('button',{name:'Mengirim permintaan…'})).toBeDisabled();
  await expect.poll(()=>requests).toBe(1);await page.getByRole('button',{name:'Mengirim permintaan…'}).evaluate(element=>(element as HTMLButtonElement).click());expect(requests).toBe(1);
  await pending!.fulfill({json:{success:true,consultation:{status:'requested'}}});
  await expect(page.getByText('Permintaan konsultasi diterima. Tim BinaHub akan menghubungi Anda melalui email.')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`test-results/sales-result-${info.project.name}.png`,fullPage:true});
});
test('revoked review permission cannot create a consultation request',async({page})=>{
  let requests=0;
  await page.route('**/api/**',route=>{
    if(route.request().method()==='PATCH')requests++;
    return route.fulfill({json:{success:true,report,retentionUntil:'2027-04-18T00:00:00Z',access:{shared:false,evaluationConsent:false,clarity:null,usefulness:null}}});
  });
  await page.goto(`/insight/individual/result?attempt=${id}`);
  await expect(page.getByRole('button',{name:'Minta konsultasi',exact:true})).toBeDisabled();expect(requests).toBe(0);
});
