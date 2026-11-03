import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
const origin='http://127.0.0.1:4318';
const records=Array.from({length:45},(_,i)=>{
  const kind=i===44?'inquiry':['proposal','inquiry','assessment','followup','pipeline'][i%5],recordId=`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`;
  const detail=kind==='proposal'?'proposal':kind==='assessment'?'summary':kind==='followup'?'followup':null;
  return{id:`${kind}:${recordId}`,recordId,kind,name:i===44?'Arsip Lama 東京 %_*':`Klien Sintetis ${i+1}`,company:'Organisasi Sintetis',email:`synthetic-${i}@company.invalid`,source:i%2?'catalog':'website',
    note:kind==='proposal'?'Proposal diminta':kind==='followup'?'Pengingat hasil 1 siap ditinjau':'Tinjau catatan kebutuhan dan langkah berikutnya.',
    action:kind==='proposal'?'Buka proposal':kind==='inquiry'?'Tulis balasan':kind==='assessment'?'Periksa hasil':kind==='pipeline'?'Buka peluang':'Tinjau tindak lanjut',
    view:kind==='pipeline'?'pipeline':'clients',detail,priority:kind==='proposal'?0:kind==='inquiry'?1:kind==='followup'?3:2,at:'2020-01-01T03:00:00Z'};
});
const inquiry=row=>({id:row.recordId,name:row.name,email:row.email,source:row.source,status:'Baru',messagePreview:'Konteks kebutuhan program.',replyStatus:'none',followUpDue:false,createdAt:row.at});
const inquiryDetail=row=>({...inquiry(row),whatsapp:'',message:'Kebutuhan pengembangan tim sintetis.',notes:'Catatan tersimpan',followUpLevel:0,followUpLastSentAt:null,followUpPaused:false,
  replySubject:'',replyBody:'',replyGeneratedAt:null,replyReviewedAt:null,replyReviewedBy:null,replySentAt:null,replyEmailId:null,moduleRequest:{}});
const assessment=row=>({id:row.recordId,name:row.name,email:row.email,company:row.company,role:'HR',employees:'51–100',category:'Berkembang',overallScore:62,
  assessmentStatus:'Minta Proposal',proposalStatus:'Diminta',proposalGateStatus:'not_evaluated',proposalDraft:null,proposalSentAt:null,resultEmailSentAt:row.at,
  resultFollowUpLevel:0,proposalFollowUpLevel:0,followUpPaused:false,createdAt:row.at});
const assessmentDetail=row=>({...assessment(row),whatsapp:'',scores:{Insights:62},answers:{'1':4},aiAnalysis:'Ringkasan sintetis untuk kebutuhan koordinasi.',recommendations:[],
  challenge:'Perlu memperbaiki koordinasi.',target:'Kesepakatan kerja yang lebih jelas.',proposalEligibility:{eligible:true,missing:[],summary:'Data lengkap.'},resultEmailId:null,proposalRequestedAt:null,proposalEmailId:null});
const browser=await chromium.launch({headless:true});let checks=0;
try{
  for(const viewport of [{width:1440,height:1000},{width:1024,height:900},{width:390,height:844},{width:320,height:740}]){
    const page=await browser.newPage({viewport}),errors=[],methods=[];let failure=false,empty=false;
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/*',async route=>{
      const url=new URL(route.request().url());if(url.origin!==origin)return route.abort();
      if(!url.pathname.startsWith('/api/'))return route.continue();methods.push(route.request().method());if(route.request().method()!=='GET')return route.fulfill({status:409,json:{success:false,error:'Writes disabled'}});
      const p=url.searchParams,current=Number(p.get('page')||0);
      if(url.pathname==='/api/admin/sales/priorities'){
        if(failure)return route.fulfill({status:503,json:{success:false,error:'Storage unavailable'}});
        const rows=empty?[]:records.filter(row=>(p.get('view')!=='followup'||row.kind==='followup')&&(!p.get('kind')||p.get('kind')==='all'||row.kind===p.get('kind'))
          &&`${row.name} ${row.company} ${row.email} ${row.source}`.toLowerCase().includes((p.get('search')||'').toLowerCase()));
        return route.fulfill({json:{success:true,version:1,page:current,pageSize:20,snapshotAt:'2026-11-03T03:00:00Z',total:rows.length,counts:{all:45,proposal:9,followup:9,won:8},records:rows.slice(current*20,current*20+20)}});
      }
      if(url.pathname==='/api/admin/inquiries/inbox'){
        if(p.has('id')){const row=records.find(row=>row.recordId===p.get('id'));return route.fulfill({json:{success:true,record:inquiryDetail(row)}});}
        const rows=records.filter(row=>row.kind==='inquiry');return route.fulfill({json:{success:true,version:1,page:current,pageSize:20,total:rows.length,counts:{fresh:rows.length,awaiting:rows.length,ready:0,due:0},facets:{sources:['catalog','website'],statuses:['Baru']},records:rows.map(inquiry)}});
      }
      if(url.pathname==='/api/admin/assessments/inbox'){
        if(p.has('id')){const row=records.find(row=>row.recordId===p.get('id'));return route.fulfill({json:{success:true,record:assessmentDetail(row)}});}
        const rows=records.filter(row=>['proposal','assessment','followup'].includes(row.kind));return route.fulfill({json:{success:true,version:1,page:current,pageSize:20,total:rows.length,counts:{all:rows.length,attention:rows.length,processing:0,sent:0},facets:{categories:['Berkembang'],employees:['51–100']},records:rows.slice(0,20).map(assessment)}});
      }
      if(url.pathname==='/api/admin/sales-settings')return route.fulfill({json:{success:true,ready:true,settings:{enabled:false,version:1,activated_at:null},blockers:[]}});
      return route.fulfill({status:404,json:{success:false}});
    });
    await page.goto(origin+'/?sales-priorities');await page.getByText('1–20 dari 45 tugas',{exact:true}).waitFor();
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`tmp/sales-priorities-${viewport.width}.png`,fullPage:true});checks++;
    await page.getByRole('button',{name:'Berikutnya',exact:true}).click();await page.getByText('21–40 dari 45 tugas',{exact:true}).waitFor();checks++;
    await page.getByRole('searchbox',{name:'Cari prioritas penjualan'}).fill('東京 %_*');await page.getByText('1–1 dari 1 tugas',{exact:true}).waitFor();checks++;
    await page.getByRole('button',{name:'Tulis balasan',exact:true}).click();await page.getByRole('dialog',{name:'Arsip Lama 東京 %_*',exact:true}).waitFor();
    await page.screenshot({path:`tmp/sales-priority-inquiry-${viewport.width}.png`,fullPage:true});checks++;
    await page.getByRole('textbox',{name:'Isi balasan',exact:true}).fill('Balasan lokal yang belum disimpan.');
    page.once('dialog',dialog=>dialog.dismiss());await page.getByRole('button',{name:'Tutup panel',exact:true}).click();assert(await page.getByRole('dialog').isVisible());checks++;
    await page.getByRole('textbox',{name:'Isi balasan',exact:true}).fill('');await page.getByRole('button',{name:'Tutup panel',exact:true}).click();
    const nav=page.getByRole('navigation',{name:'Workspace Akuisisi dan Penjualan'});await nav.getByRole('button',{name:'Prioritas',exact:true}).click();
    await page.getByRole('searchbox',{name:'Cari prioritas penjualan'}).fill('');await page.getByText('1–20 dari 45 tugas',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Proposal',exact:true}).click();await page.getByText('1–9 dari 9 tugas',{exact:true}).waitFor();checks++;
    await page.getByRole('button',{name:'Buka proposal',exact:true}).first().click();await page.getByRole('tab',{name:'Proposal',exact:true}).waitFor();
    assert.equal(await page.getByRole('tab',{name:'Proposal',exact:true}).getAttribute('aria-selected'),'true');await page.screenshot({path:`tmp/sales-priority-proposal-${viewport.width}.png`,fullPage:true});checks++;
    await nav.getByRole('button',{name:'Tindak lanjut',exact:true}).click();await page.getByText('1–9 dari 9 tugas',{exact:true}).waitFor();assert(await page.getByText(/Tindak lanjut otomatis · Dijeda/).isVisible());checks++;
    failure=true;await page.getByRole('button',{name:'Perbarui prioritas',exact:true}).click();await page.getByRole('alert').waitFor();await page.screenshot({path:`tmp/sales-priorities-error-${viewport.width}.png`,fullPage:true});checks++;
    failure=false;empty=true;await page.getByRole('button',{name:'Coba muat prioritas lagi',exact:true}).click();await page.getByText('0–0 dari 0 tugas',{exact:true}).waitFor();checks++;
    assert.deepEqual(errors,[]);assert(methods.every(method=>method==='GET'));checks++;await page.close();
  }
  console.log(`[PASS] ${checks} local Chromium CRM-priority checks; 1440/1024/390/320px, mocked API, writes/external network blocked`);
}finally{await browser.close();}
