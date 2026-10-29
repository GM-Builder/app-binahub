import {expect,test} from '@playwright/test';
import definition from '../src/test/fixtures/spin-definition.json';
import {spinSyntheticReport} from '../src/test/fixtures/spin-report';
test.skip(process.env.PLAYWRIGHT_SPIN_PREVIEW!=='1','Synthetic loopback preview only.');
test('five-stage submission is nonblocking, preserves answers, and renders report/admin at desktop and phone widths',async({page,baseURL},info)=>{
 test.setTimeout(120000);expect(baseURL).toMatch(/^http:\/\/127\.0\.0\.1:/);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));let revision=0,answers:Record<string,unknown>={},submitCount=0;
 const id='11111111-1111-4111-8111-111111111111';let confirmation:unknown=null,limitChecked=false;
 await page.route('**/api/**',async route=>{
 const req=route.request(),url=new URL(req.url()),body=req.postDataJSON();
 let data:unknown;
 if(url.pathname==='/api/admin/discovery'||url.pathname==='/api/admin/discovery/meetings'){
 const record={id,status:'ready',contact:{name:'Contoh Nadia',email:'synthetic@example.invalid',company:'Contoh Organisasi — data sintetis'},submitted_at:'2026-10-22T03:00:00Z',report:spinSyntheticReport,summary:spinSyntheticReport.summary,answers,internal_report:{fitType:'A',leadTemperature:'warm'},marketing_consent:false};
 data=url.searchParams.has('id')?{record,definition,delivery:[{id:'synthetic-mail',status:'sent',attempts:1,sent_at:'2026-10-22T03:01:00Z'}]}:{records:[record],total:1,page:0};
 }else if(url.pathname==='/api/admin/discovery/'+id+'/meeting')data={definition,original:answers,checklist:{id,source_id:id,contact:{name:'Contoh Nadia',email:'synthetic@example.invalid',company:'Contoh Organisasi'},answers:{},notes:'',status:'in_progress',revision:0,updated_at:null}};
 else if(req.method()==='GET'&&url.pathname==='/api/discovery/spin')data={definition,available:true};
 else if(req.method()==='POST'&&url.pathname==='/api/discovery/spin')data={attempt:{id,revision,answers,confirmation,status:'draft'},challenge:'Berapa 3 + 4?'};
 else if(req.method()==='PATCH'){answers=body.answers;confirmation=body.confirmation;revision++;if(body.submit)submitCount++;data={attempt:{id,revision,answers,confirmation,status:body.submit?'queued':'draft'},summaryHash:'a'.repeat(64)};}
 else data={success:true};
 await route.fulfill({json:{success:true,...data as object}});
 });
 const mobile=info.project.name.includes('mobile');await page.setViewportSize({width:mobile?390:1440,height:mobile?844:1000});
 await page.goto('/?spin');
 await expect(page.getByRole('heading',{name:/Tentukan arah/})).toBeVisible();
 await page.screenshot({path:'.impeccable/review/spin-entry-'+(mobile?'mobile':'desktop')+'.png',fullPage:true});
 await page.getByRole('checkbox').check();await page.getByRole('button',{name:/Mulai pengisian/}).click();
 await expect(page.getByRole('group',{name:'Apa yang paling mendorong perusahaan Anda mencari dukungan pengembangan saat ini?',exact:true})).toBeVisible();
 for(let step=0;step<25;step++){
 if(await page.getByRole('heading',{name:'Ke mana laporan Anda dikirim?'}).count())break;
 for(let round=0;round<3;round++){
 const fields=page.locator('fieldset');for(let i=0;i<await fields.count();i++){
 const f=fields.nth(i),select=f.locator('select'),text=f.locator('textarea'),number=f.locator('input[type=number]'),checks=f.locator('input[type=checkbox]');
 if(await select.count()&&!await select.inputValue()){const value=await select.locator('option').nth(1).getAttribute('value');await select.selectOption(value!);}
 else if(await text.count()&&!await text.inputValue())await text.fill('Rapat menghasilkan keputusan dan tindak lanjut yang jelas.');
 else if(await number.count()&&!await number.inputValue())await number.fill('20');
 else if(await checks.count()&&await f.locator('input:checked').count()===0)await checks.first().check();
 if(!limitChecked&&(await f.locator('legend').textContent())===definition.fields.find(item=>item.key==='effects')!.label){
 await checks.nth(1).check();await expect(checks.nth(2)).toBeDisabled();
 await expect(f.getByRole('status')).toContainText('Batas pilihan tercapai');
 await checks.first().focus();await page.keyboard.press('Space');await expect(checks.nth(2)).toBeEnabled();
 await checks.nth(2).focus();await page.keyboard.press('Space');await expect(checks.nth(2)).toBeChecked();
 await checks.nth(7).focus();await page.keyboard.press('Space');await expect(f.locator('input:checked')).toHaveCount(1);await expect(checks.first()).toBeEnabled();
 await checks.first().check();await checks.nth(1).check();limitChecked=true;
 await page.screenshot({path:'.impeccable/review/spin-limit-'+(mobile?'mobile':'desktop')+'.png',fullPage:true});
 }
 }}
 if(step===3)await page.screenshot({path:'.impeccable/review/spin-form-'+(mobile?'mobile':'desktop')+'.png',fullPage:true});
 const confirm=page.getByRole('button',{name:'Konfirmasi & lanjut'});
 const before=(await page.locator('h1,fieldset legend').allTextContents()).join('|');
 if(await confirm.count())await confirm.click();else await page.getByRole('button',{name:'Lanjut',exact:true}).click();
 await expect.poll(async()=>(await page.locator('h1,fieldset legend').allTextContents()).join('|')).not.toBe(before);
 await expect(page.getByRole('alert')).toHaveCount(0);
 }
 await expect(page.getByRole('heading',{name:'Ke mana laporan Anda dikirim?'})).toBeVisible();
 await page.getByLabel('Nama',{exact:true}).fill('Contoh Nadia');
 await page.getByLabel('Email kerja',{exact:true}).fill('synthetic@example.invalid');
 await page.getByLabel('Perusahaan / organisasi',{exact:true}).fill('Contoh Organisasi');
 await page.getByLabel('Jabatan atau fungsi',{exact:true}).fill('Manajer pengembangan');
 await page.getByRole('spinbutton',{name:'Verifikasi singkat: Berapa 3 + 4?'}).fill('7');
 await page.getByRole('checkbox',{name:/Saya memahami penggunaan data/}).check();
 const conflict=page.getByRole('checkbox',{name:/Saya memahami hal tersebut/});if(await conflict.count())await conflict.check();
 await page.getByRole('button',{name:'Kirim permintaan'}).dblclick();
 await expect(page.getByRole('heading',{name:'Permintaan Anda telah diterima'})).toBeVisible();expect(submitCount).toBe(1);
 await page.goto('/?spin&view=report');
 await expect(page.getByRole('heading',{name:'Arah pengembangan, dalam satu pandangan'})).toBeVisible();
 await page.screenshot({path:'.impeccable/review/spin-report-'+(mobile?'mobile':'desktop')+'.png',fullPage:true});
 await page.goto('/?spin&view=admin');
 await page.getByRole('button',{name:/Contoh Organisasi/}).click();
 await expect(page.getByText('Status laporan: Laporan tersedia')).toBeVisible();
 await page.screenshot({path:'.impeccable/review/spin-admin-'+(mobile?'mobile':'desktop')+'.png',fullPage:true});
 for(const width of [320,768]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 expect(limitChecked).toBe(true);expect(errors).toEqual([]);
});
