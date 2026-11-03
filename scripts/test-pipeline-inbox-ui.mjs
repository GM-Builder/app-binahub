import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
const origin='http://127.0.0.1:4318';
const base={email:'contact@company.invalid',company:'Organisasi Sintetis',industry:'Jasa',location:'Jakarta',qualificationProfile:{},phone:'',source:'website',
  leadScore:72,leadTemperature:'warm',leadScoreConfidence:90,lifecycleStage:'lead',opportunityStage:'qualified',opportunityOwner:'admin@company.invalid',
  nextAction:'Konfirmasi kebutuhan tim',nextActionDueAt:'2099-01-01T03:00:00Z',leadTimeZone:'Asia/Jakarta',opportunityValue:25000000,lostReason:null,
  wonAt:null,lostAt:null,outreachPaused:false,outreachPauseReason:null,outreachPausedAt:null,outreachPausedBy:null,pipelineUpdatedAt:'2026-11-01T03:00:00Z',createdAt:'2026-11-01T03:00:00Z'};
const stages=['identified','qualified','consultation','proposal','negotiation'];
const records=Array.from({length:45},(_,i)=>({...base,id:`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,
  name:i===44?'Arsip Lama 東京 %_*':`Peluang Sintetis ${i+1}`,opportunityStage:stages[i%5],source:i%2?'manual_upload':'website'}));
const browser=await chromium.launch({headless:true});let checks=0;
try{
  for(const viewport of [{width:1440,height:1000},{width:1024,height:900},{width:390,height:844},{width:320,height:740}]){
    const page=await browser.newPage({viewport}),errors=[],methods=[];let failure=false,empty=false;
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/*',async route=>{
      const url=new URL(route.request().url());if(url.origin!==origin)return route.abort();
      if(!url.pathname.startsWith('/api/'))return route.continue();methods.push(route.request().method());
      if(route.request().method()!=='GET')return route.fulfill({status:409,json:{success:false,error:'Writes disabled'}});
      if(url.pathname!=='/api/admin/pipeline/inbox')return route.fulfill({status:404,json:{success:false}});
      const p=url.searchParams;
      if(p.has('id')){
        const record=records.find(row=>row.id===p.get('id')),historyPage=Number(p.get('historyPage')||0);
        return route.fulfill({status:record?200:404,json:{success:Boolean(record),record,context:{historyPage,activityTotal:25,assessments:4,meetings:3,accountId:null,
          activities:[{id:`history-${historyPage}`,leadId:record?.id,assessmentId:null,inquiryId:null,eventType:'stage_changed',fromStage:'identified',toStage:'qualified',actor:'admin@company.invalid',note:historyPage?'Catatan riwayat lama':'Catatan terbaru',metadata:{},createdAt:'2026-11-01T03:00:00Z'}]}}});
      }
      if(failure)return route.fulfill({status:503,json:{success:false,error:'Storage unavailable'}});
      const rows=empty?[]:records.filter(row=>`${row.name} ${row.email} ${row.company}`.toLowerCase().includes((p.get('search')||'').toLowerCase())
        &&(!p.get('source')||row.source===p.get('source'))&&(!p.get('stage')||row.opportunityStage===p.get('stage')));
      const current=Number(p.get('page')||0),stageCounts=Object.fromEntries(stages.map(stage=>{
        const group=rows.filter(row=>row.opportunityStage===stage);return[stage,{total:group.length,value:group.length*25000000,valued:group.length}];
      }));
      return route.fulfill({json:{success:true,version:1,pageSize:20,page:current,snapshotAt:'2026-11-03T03:00:00Z',total:rows.length,totalValue:rows.length*25000000,
        records:rows.slice(current*20,current*20+20),counts:{all:45,attention:0,overdue:0,unassigned:0,paused:0,value:1125000000,valued:45},
        views:{active:45,won:0,lost:0,review:0},stages:stageCounts,facets:{owners:['admin@company.invalid'],sources:['manual_upload','website']}}});
    });
    await page.goto(origin+'/?pipeline&pipeline-inbox');await page.getByText('1–20 dari 45 peluang',{exact:true}).waitFor();
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`tmp/pipeline-inbox-${viewport.width}.png`,fullPage:true});checks++;
    await page.getByRole('button',{name:'Berikutnya',exact:true}).click();await page.getByText('21–40 dari 45 peluang',{exact:true}).waitFor();checks++;
    await page.getByRole('searchbox').fill('東京 %_*');await page.getByText('1–1 dari 1 peluang',{exact:true}).waitFor();checks++;
    const trigger=page.getByRole('button',{name:'Buka detail peluang Arsip Lama 東京 %_*',exact:true});await trigger.click();await page.getByRole('button',{name:'Ubah peluang',exact:true}).waitFor();
    await page.getByRole('button',{name:'Riwayat 25',exact:true}).click();await page.getByText('Catatan terbaru',{exact:true}).waitFor();
    await page.getByRole('navigation',{name:'Halaman riwayat peluang'}).getByRole('button',{name:'Berikutnya',exact:true}).click();await page.getByText('Catatan riwayat lama',{exact:true}).waitFor();checks++;
    const dialog=page.getByRole('dialog');await page.keyboard.press('Tab');assert(await dialog.evaluate(el=>el.contains(document.activeElement)));await page.keyboard.press('Shift+Tab');assert(await dialog.evaluate(el=>el.contains(document.activeElement)));checks++;
    await page.getByRole('button',{name:'Ringkasan',exact:true}).click();await page.getByRole('button',{name:'Ubah peluang',exact:true}).click();
    await page.getByRole('textbox',{name:'Tindakan berikutnya',exact:true}).fill('Catatan tindakan lokal belum disimpan');
    await page.screenshot({path:`tmp/pipeline-detail-${viewport.width}.png`,fullPage:true});checks++;
    await page.keyboard.press('Escape');await page.getByText('Perubahan belum disimpan',{exact:true}).waitFor();await page.getByRole('button',{name:'Lanjut mengedit',exact:true}).click();
    assert.equal(await page.getByRole('textbox',{name:'Tindakan berikutnya',exact:true}).inputValue(),'Catatan tindakan lokal belum disimpan');checks++;
    await page.getByRole('button',{name:'Batal',exact:true}).click();await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
    assert(await trigger.evaluate(el=>el===document.activeElement));checks++;
    await page.getByRole('searchbox').fill('');await page.getByText('1–20 dari 45 peluang',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Tampilan daftar',exact:true}).click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));checks++;
    failure=true;await page.getByRole('button',{name:'Berikutnya',exact:true}).click();await page.getByRole('alert').waitFor();
    await page.screenshot({path:`tmp/pipeline-error-${viewport.width}.png`,fullPage:true});checks++;
    failure=false;empty=true;await page.getByRole('button',{name:'Coba lagi',exact:true}).click();await page.getByText('0–0 dari 0 peluang',{exact:true}).waitFor();checks++;
    assert.deepEqual(errors,[]);assert(methods.every(method=>method==='GET'));checks++;await page.close();
  }
  console.log(`[PASS] ${checks} local Chromium pipeline checks; 1440/1024/390/320px, mocked API, all writes/external network blocked`);
}finally{await browser.close();}
