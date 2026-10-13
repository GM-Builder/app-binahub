import { test,expect } from '@playwright/test';

test.describe('Personal Effectiveness entry and privacy (synthetic readiness)',()=>{
  test.beforeEach(async ({baseURL})=>{
    test.skip(!/^https?:\/\/(?:127\.0\.0\.1|localhost)(?::|\/|$)/i.test(baseURL||''),'Synthetic fixtures only run against a local app.');
  });
  test('synthetic signed-in participant completes, resumes, and sees results without overflow',async({page},info)=>{
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
    test.skip(!url,'Public Supabase URL is required for the local browser session fixture.');
    const id='00000000-0000-4000-8000-000000000099',userId='00000000-0000-4000-8000-000000000098';
    const expiry=Math.floor(Date.now()/1000)+3600;
    const jwt=[Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),
      Buffer.from(JSON.stringify({sub:userId,exp:expiry,iss:`${url}/auth/v1`,role:'authenticated',aud:'authenticated'})).toString('base64url'),'synthetic_signature'].join('.');
    const user={id:userId,aud:'authenticated',email:'synthetic@example.invalid',email_confirmed_at:new Date().toISOString(),user_metadata:{},app_metadata:{}};
    const session={access_token:jwt,refresh_token:'synthetic_refresh_token',expires_at:expiry,expires_in:3600,token_type:'bearer',user};
    const cookieName=`sb-${new URL(url!).hostname.split('.')[0]}-auth-token`;
    await page.context().addCookies([{name:cookieName,value:'base64-'+Buffer.from(JSON.stringify(session)).toString('base64url'),url:info.project.use.baseURL!,sameSite:'Lax'}]);
    await page.route('**/auth/v1/**',route=>route.fulfill({json:user}));
    const codes=['PE-02','PE-04','PE-06'],names=['Self-Development','Adaptability','Pressure Management'];
    const definition={policyId:'fixture',consentVersion:'fixture',privacyVersion:'fixture',notice:'Synthetic browser test.',privacyNotice:'No real data.',
      competencies:codes.map((code,n)=>({code,name:names[n],definition:'Synthetic development description for a local test.'})),
      selfReportItems:Array.from({length:12},(_,n)=>({id:'SR'+(n+1),competencyCode:codes[Math.floor(n/4)],type:'behavioral_self_report',prompt:'Synthetic question '+(n+1)})),
      sjtItems:Array.from({length:6},(_,n)=>({id:'SJ'+(n+1),competencyCode:codes[Math.floor(n/2)],type:'situational_judgment',scenario:'Synthetic work scenario used only to check a long paragraph on a small screen. The participant has a deadline, conflicting priorities and a need to coordinate clearly with colleagues.',
        question:'Choose a synthetic action.',options:[{id:'A',text:'Discuss the priorities, clarify the expected outcome and agree on a practical next step with the people involved.'},{id:'B',text:'Another synthetic alternative.'}]})),
      selfReportScale:[{value:4,label:'Sering'},{value:'NA',label:'Tidak ada kesempatan relevan'}]};
    let attempt={id,status:'draft',revision:0,responses:{} as Record<string,unknown>,context:{role:'Manager',goal:'Practice work habits',relevance:{}},retentionUntil:'2027-04-13T00:00:00Z',submittedAt:null as string|null};
    const report={goal:'Practice work habits',methodology:'Two separate methods on a 0–100 scale; not percent mastery.',priorityExplanation:'Context and completeness come first.',notice:'Synthetic fixture.',
      areas:codes.map((code,n)=>({code,name:names[n],definition:'Synthetic description.',relevance:'normal',
        selfReport:{score:75,validCount:4,naCount:0,status:'scored'},sjt:{score:50,validCount:2,status:'scored'},practice:null})),priorities:[]};
    await page.route('**/api/**',async route=>{
      const req=route.request();const path=new URL(req.url()).pathname;
      if(path==='/api/assessment/individual') {
        if(req.method()==='POST'){const body=req.postDataJSON();attempt={...attempt,id:body.id,context:body.context};return route.fulfill({json:{success:true,attempt}});}
        return route.fulfill({json:{success:true,definition}});
      }
      if(path===`/api/assessment/individual/${attempt.id}`) {
        if(req.method()==='PATCH'){const body=req.postDataJSON();attempt={...attempt,responses:body.responses,revision:attempt.revision+1,
          status:body.submissionKey?'submitted':'draft',submittedAt:body.submissionKey?'2026-10-13T00:00:00Z':null};
          return route.fulfill({json:{success:true,attempt}});}
        return route.fulfill({json:{success:true,attempt,report:attempt.status==='submitted'?report:null}});
      }
      return route.fulfill({json:{success:false}});
    });
    await page.goto('/insight/individual');
    await page.getByLabel('Peran atau pekerjaan Anda').fill('Manager');
    await page.getByLabel('Apa yang ingin Anda kembangkan?').fill('Practice work habits');
    await page.getByRole('checkbox').check();
    await page.screenshot({path:`test-results/pe-form-${info.project.name}.png`,fullPage:true});
    await page.getByRole('button',{name:'Mulai 18 soal'}).click();
    for(let n=0;n<18;n++) {
      await page.getByRole('radio').first().check();
      const next=page.getByRole('button',{name:n===17?'Tinjau jawaban':'Lanjut',exact:true});
      await expect(next).toBeEnabled();
      if(n===12)await page.screenshot({path:`test-results/pe-scenario-${info.project.name}.png`,fullPage:true});
      await next.click();
    }
    await page.getByRole('button',{name:'Kirim dan lihat hasil'}).click();
    await expect(page.getByRole('heading',{name:'Langkah kecil yang lebih terarah.'})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
    await page.screenshot({path:`test-results/pe-result-${info.project.name}.png`,fullPage:true});
    await page.reload();
    await expect(page.getByRole('heading',{name:'Langkah kecil yang lebih terarah.'})).toBeVisible();
  });
  test('choice works on desktop/mobile and preserves campaign attribution for organization',async({page},info)=>{
    await page.route('**/api/assessment/individual/availability',route=>route.fulfill({json:{success:true,available:true}}));
    await page.goto('/diagnose?utm_source=instagram&utm_campaign=pe-pilot');
    await expect(page.getByRole('heading',{name:'Mulai dari kebutuhan Anda.'})).toBeVisible();
    const organization=page.getByRole('link',{name:/Tim \/ Organisasi/});
    await expect(organization).toHaveAttribute('href','/insight?utm_source=instagram&utm_campaign=pe-pilot');
    await expect(page.getByRole('link',{name:'Mulai diagnosis individu'})).toHaveAttribute('href','/insight/individual');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
    await page.screenshot({path:`test-results/pe-choice-${info.project.name}.png`,fullPage:true});
  });
  test('signed-out individual page shows access options but makes no private question request',async({page},info)=>{
    let questionRequests=0;
    await page.route('**/api/assessment/individual',route=>{questionRequests++;return route.fulfill({json:{success:false}});});
    await page.goto('/insight/individual');
    await expect(page.getByRole('heading',{name:'Hasil pribadi, akses yang aman.'})).toBeVisible();
    await expect(page.getByRole('link',{name:/Masuk dan mulai/})).toHaveAttribute('href','/?mode=signin&next=%2Finsight%2Findividual');
    expect(questionRequests).toBe(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
    await page.screenshot({path:`test-results/pe-private-entry-${info.project.name}.png`,fullPage:true});
  });
});
