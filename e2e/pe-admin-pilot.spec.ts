import { test,expect } from '@playwright/test';
test.describe('PE admin pilot (isolated local auth/API fixtures)',()=>{
  test('reviews context/answers/report and pauses new entries on desktop and mobile',async({page,baseURL},info)=>{
    test.skip(process.env.NEXT_PUBLIC_SUPABASE_URL!=='http://127.0.0.1:4329'||!baseURL?.startsWith('http://127.0.0.1:'),'Requires the loopback-only auth fixture, never a production account.');
    const userId='00000000-0000-4000-8000-000000000098',id='00000000-0000-4000-8000-000000000097';
    const expiry=Math.floor(Date.now()/1000)+3600;
    const jwt=[Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:userId,exp:expiry,iss:'http://127.0.0.1:4329/auth/v1',role:'authenticated',aud:'authenticated'})).toString('base64url'),'synthetic_signature'].join('.');
    const user={id:userId,aud:'authenticated',email:'synthetic@example.invalid',email_confirmed_at:'2026-10-13T00:00:00Z',user_metadata:{},app_metadata:{}};
    await page.context().addCookies([{name:'sb-127-auth-token',value:'base64-'+Buffer.from(JSON.stringify({access_token:jwt,refresh_token:'synthetic_refresh',expires_at:expiry,expires_in:3600,token_type:'bearer',user})).toString('base64url'),url:baseURL!,sameSite:'Lax'}]);
    const codes=['PE-02','PE-04','PE-06'],names=['Self-Development','Adaptability','Pressure Management'];
    const report={goal:'Improve collaboration under pressure',methodology:'Synthetic: methods are separate, not percent mastery.',priorityExplanation:'Context first.',notice:'Synthetic fixture.',
      areas:codes.map((code,n)=>({code,name:names[n],definition:'Synthetic development description.',relevance:'high',selfReport:{score:75,validCount:4,naCount:0,status:'scored'},sjt:{score:50,validCount:2,status:'scored'},practice:null})),priorities:[]};
    let dashboard={status:'collecting',revision:0,ready:true,counts:{started:1,submitted:1,drafts:0,shared:1},evaluationSampleSize:0,minimumAggregateSize:5,areas:[],feedback:{count:0,clarityMean:null,usefulnessMean:null},interpretation:'development_pilot_not_validated'};
    await page.route('**/api/**',async route=>{
      const req=route.request(),url=new URL(req.url());
      if(url.pathname==='/api/auth/role')return route.fulfill({json:{success:true,role:'admin',fullName:'Synthetic tester'}});
      if(url.pathname==='/api/admin/assessments/individual'){
        if(req.method()==='PATCH'){const body=req.postDataJSON();dashboard={...dashboard,status:body.status,revision:dashboard.revision+1};return route.fulfill({json:{success:true,dashboard}});}
        if(url.searchParams.has('id'))return route.fulfill({json:{success:true,detail:{id,status:'submitted',createdAt:'2026-10-13T00:00:00Z',submittedAt:'2026-10-13T00:10:00Z',retentionUntil:'2027-04-13T00:00:00Z',
          context:{role:'HR Manager',goal:'Improve collaboration under pressure',relevance:{}},participant:{name:'Synthetic participant',email:'synthetic@example.invalid'},channel:'instagram',
          answers:[{id:'SR05',areaCode:'PE-02',type:'behavioral_self_report',prompt:'Synthetic question for a browser fixture.',scenario:null,answer:'Sering'}],report}}});
        return route.fulfill({json:{success:true,dashboard,cases:[{id,status:'submitted',createdAt:'2026-10-13T00:00:00Z',role:'HR Manager',goal:'Improve collaboration under pressure',channel:'instagram'}]}});
      }
      return route.fulfill({json:{success:true}});
    });
    await page.goto('/admin/assessments/individual');
    await expect(page.getByRole('heading',{name:'Pahami orangnya. Arahkan pengembangannya.'})).toBeVisible();
    await page.getByRole('button',{name:/HR Manager[\s\S]*Tinjau konteks/}).click();
    await expect(page.getByRole('heading',{name:'Synthetic participant'})).toBeVisible();
    await page.getByText('Jawaban peserta (1)').click();await expect(page.getByText('Synthetic question for a browser fixture.')).toBeVisible();
    await expect(page.getByRole('heading',{name:'Langkah kecil yang lebih terarah.'})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
    await page.screenshot({path:`test-results/pe-admin-detail-${info.project.name}.png`,fullPage:true});
    await page.getByRole('button',{name:'Tutup detail'}).click();await page.getByRole('tab',{name:'Evaluasi pilot'}).click();
    await page.getByRole('button',{name:'Jeda pengisian baru'}).click();
    await expect(page.getByRole('button',{name:'Lanjutkan pengisian baru'})).toBeVisible();
    await page.screenshot({path:`test-results/pe-admin-pilot-${info.project.name}.png`,fullPage:true});
  });
});
