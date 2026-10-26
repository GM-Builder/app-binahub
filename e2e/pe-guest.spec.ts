import { test,expect } from '@playwright/test';
const codes=['PE-02','PE-04','PE-06'],names=['Self-Development','Adaptability','Pressure Management'];
const definition={policyId:'fixture',consentVersion:'fixture',privacyVersion:'fixture',notice:'Synthetic development test.',privacyNotice:'No real participant data.',
  acceptingNew:true,sharingConsentVersion:'pe-consultant-review-v1',sharingNotice:'Synthetic review notice.',
  competencies:codes.map((code,n)=>({code,name:names[n],definition:'Synthetic area.'})),
  selfReportItems:Array.from({length:12},(_,n)=>({id:'SR'+(n+1),competencyCode:codes[Math.floor(n/4)],type:'behavioral_self_report',prompt:'Synthetic question '+(n+1)})),
  sjtItems:Array.from({length:6},(_,n)=>({id:'SJ'+(n+1),competencyCode:codes[Math.floor(n/2)],type:'situational_judgment',scenario:'Synthetic work scenario with a deadline and several competing priorities.',
    question:'Choose a synthetic action.',options:[{id:'A',text:'Clarify the priorities and agree on a practical next step.'},{id:'B',text:'Another synthetic alternative.'}]})),
  selfReportScale:[{value:4,label:'Sering'},{value:'NA',label:'Tidak ada kesempatan relevan'}]};
test.beforeEach(async({baseURL})=>{
  test.skip(!/^https?:\/\/(?:127\.0\.0\.1|localhost)(?::|\/|$)/i.test(baseURL||''),'Only local synthetic tests.');
});
test('requests an email result link without an account or remembered attempt number',async({page})=>{
  let requests=0;await page.route('**/api/assessment/individual/guest/request-link',route=>{
    expect(route.request().postDataJSON()).toEqual({email:'synthetic@example.invalid'});requests++;
    return route.fulfill({status:202,json:{success:true}});
  });
  await page.goto('/insight/individual/result');await page.getByText('Butuh tautan baru?',{exact:true}).click();await page.getByLabel('Email pengisian').fill('synthetic@example.invalid');
  await page.getByRole('button',{name:'Kirim tautan baru'}).click();await expect(page.getByRole('status')).toHaveText(/Jika email sesuai dengan data pengisian/);
  expect(requests).toBe(1);await expect(page.getByRole('heading',{name:'Langkah kecil yang lebih terarah.'})).toHaveCount(0);
});
test('guest completes without auth; pending choice survives reload; one final submission and no scores before email',async({page},info)=>{
  let attempt={id:'',status:'draft',revision:0,responses:{} as Record<string,unknown>,context:{},retentionUntil:'2027-04-13T00:00:00Z',submittedAt:null as string|null};
  let failSave=false,submissions=0;
  await page.route('**/api/assessment/individual/guest**',async route=>{
    const req=route.request(),path=new URL(req.url()).pathname;
    if(path.endsWith('/guest')&&req.method()==='GET')return route.fulfill({json:{success:true,definition}});
    if(req.method()==='POST'){const body=req.postDataJSON();expect(body.ownerId).toBeUndefined();attempt={...attempt,id:body.id,context:body.context};return route.fulfill({status:201,json:{success:true,attempt}});}
    if(req.method()==='PATCH'){
      if(failSave){failSave=false;return route.abort('connectionfailed');}
      const body=req.postDataJSON();if(body.submissionKey)submissions++;
      attempt={...attempt,revision:attempt.revision+1,responses:body.responses,status:body.submissionKey?'submitted':'draft',submittedAt:body.submissionKey?'2026-10-14T00:00:00Z':null};
      return route.fulfill({status:body.submissionKey?202:200,json:{success:true,attempt,emailStatus:body.submissionKey?'pending':null}});
    }
    return route.fulfill({json:{success:true,attempt,emailStatus:null}});
  });
  await page.goto('/insight/individual');
  await expect(page.getByRole('heading',{name:'Pahami kebutuhan pengembangan diri Anda.'})).toBeVisible();
  await page.getByLabel('Nama Anda',{exact:true}).fill('Synthetic Person');await page.getByLabel('Alamat email',{exact:true}).fill('synthetic@example.invalid');
  await page.getByLabel('Peran atau pekerjaan Anda').fill('Synthetic role');await page.getByLabel('Apa yang ingin Anda kembangkan?').fill('Synthetic goal');
  await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Mulai diagnosis',exact:true}).click();
  await expect(page.getByText('Synthetic question 1',{exact:true})).toBeVisible();
  failSave=true;await page.getByRole('radio').first().check();await expect(page.getByText(/Jawaban belum tersimpan di server/)).toBeVisible();
  expect(attempt.responses).toEqual({});
  const local=await page.evaluate(async()=>{
    const db=await new Promise<IDBDatabase>((resolve,reject)=>{const req=indexedDB.open('binahub-pe-private-draft-v1');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
    const data=await new Promise<{key:CryptoKey;encrypted:ArrayBuffer}>((resolve,reject)=>{const req=db.transaction('draft').objectStore('draft').get('current');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});db.close();
    return {extractable:data.key.extractable,plain:new TextDecoder().decode(data.encrypted),keys:Object.keys(localStorage)};
  });
  expect(local.extractable).toBe(false);expect(local.plain).not.toContain('synthetic@example.invalid');expect(local.keys.some(k=>k.includes('pe.private'))).toBe(false);
  await page.reload();await expect(page.getByText('Synthetic question 2',{exact:true})).toBeVisible();
  for(let n=1;n<18;n++){
    await page.getByRole('radio').first().check();const next=page.getByRole('button',{name:n===17?'Tinjau jawaban':'Lanjut',exact:true});await expect(next).toBeEnabled();await next.click();
  }
  await page.getByRole('button',{name:'Kirim jawaban',exact:true}).dblclick();
  await expect(page.getByRole('heading',{name:'Jawaban Anda sudah diterima.'})).toBeVisible();
  expect(Object.keys(attempt.responses)).toHaveLength(18);expect(attempt.responses.SR1).toBe(4);expect(submissions).toBe(1);
  await expect(page.getByRole('heading',{name:'Langkah kecil yang lebih terarah.'})).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`test-results/pe-guest-confirmation-${info.project.name}.png`,fullPage:true});
});
test('email result consumes token only on click, clears URL fragment and recovers a failed result read',async({page},info)=>{
  const id='00000000-0000-4000-8000-000000000099',token='a'.repeat(64);let exchanged=false,failRead=true,exchangeCalls=0;
  const report={goal:'Synthetic goal',methodology:'Separate methods, not percent mastery.',priorityExplanation:'Context first.',notice:'Synthetic development report.',
    areas:codes.map((code,n)=>({code,name:names[n],definition:'Synthetic area.',relevance:'normal',
      selfReport:{score:75,validCount:4,naCount:0,status:'scored'},sjt:{score:50,validCount:2,status:'scored'},interpretation:'Explore differences through concrete work examples.',practice:null})),priorities:[]};
  await page.route('**/api/assessment/individual/guest/**',async route=>{
    if(route.request().method()==='POST'){exchangeCalls++;expect(route.request().postDataJSON()).toEqual({token});exchanged=true;return route.fulfill({json:{success:true}});}
    if(!exchanged)return route.fulfill({status:404,json:{success:false,error:'Private result.'}});
    if(failRead){failRead=false;return route.abort('connectionfailed');}
    return route.fulfill({json:{success:true,report,retentionUntil:'2027-04-13T00:00:00Z',access:{shared:true,evaluationConsent:false,exportConsent:false,clarity:null,usefulness:null}}});
  });
  await page.goto(`/insight/individual/result?attempt=${id}#access=${token}`);
  const open=page.getByRole('button',{name:'Lihat hasil saya',exact:true});await expect(open).toBeEnabled();
  expect(exchangeCalls).toBe(0);expect(page.url()).not.toContain(token);
  await open.click();await expect(page.getByRole('alert')).toBeVisible();await expect(open).toBeEnabled();await open.click();
  await expect(page.getByRole('heading',{name:'Hasil asesmen individu'})).toBeVisible();expect(exchangeCalls).toBe(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`test-results/pe-email-result-${info.project.name}.png`,fullPage:true});
});
