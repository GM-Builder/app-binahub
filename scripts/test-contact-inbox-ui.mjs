import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
const origin='http://127.0.0.1:4318';
const records=Array.from({length:45},(_,index)=>{
  const type=index%2?'coach':'lead',recordId=`00000000-0000-4000-8000-${String(index===43?45:index+1).padStart(12,'0')}`;
  return {id:`${type}:${recordId}`,recordId,name:index===44?'Arsip Lama 東京 %_*':index===43?'Referensi sama ID':`Kontak Sintetis ${index+1}`,
    email:`sintetis-${index}@example.invalid`,whatsapp:'',source:type==='lead'?'website':'coach',sourceType:type,
    category:type==='lead'?'Lead':'Coach',status:type==='lead'?'New Lead':'active',createdAt:'2026-11-01T03:00:00Z'};
});
const detail=row=>({...row,notes:'Catatan tersimpan',message:'Konteks awal kontak. Percakapan tentang proposal tidak otomatis menjadikan seseorang sebagai Client.'});
const browser=await chromium.launch({headless:true});let checks=0;
try{
  for(const viewport of [{width:1440,height:1000},{width:1024,height:900},{width:390,height:844},{width:320,height:740}]){
    const page=await browser.newPage({viewport}),errors=[],methods=[];let failure=false,empty=false;
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/*',async route=>{
      const url=new URL(route.request().url());if(url.origin!==origin)return route.abort();
      if(!url.pathname.startsWith('/api/'))return route.continue();methods.push(route.request().method());
      if(route.request().method()!=='GET')return route.fulfill({status:409,json:{success:false,error:'Mutations disabled'}});
      if(url.pathname!=='/api/admin/contacts/inbox')return route.fulfill({status:404,json:{success:false}});
      const params=url.searchParams;
      if(params.has('id')){const row=records.find(row=>row.recordId===params.get('id')&&row.sourceType===params.get('type'));return route.fulfill({status:row?200:404,json:{success:Boolean(row),record:row?detail(row):null}});}
      if(failure)return route.fulfill({status:503,json:{success:false,error:'Storage unavailable'}});
      const rows=empty?[]:records.filter(row=>`${row.name} ${row.email} ${row.source}`.toLowerCase().includes((params.get('search')||'').toLowerCase())&&(!params.get('type')||row.sourceType===params.get('type'))&&(!params.get('category')||row.category===params.get('category'))&&(!params.get('status')||row.status===params.get('status')));
      const current=Number(params.get('page')||0);
      return route.fulfill({json:{success:true,version:1,pageSize:20,page:current,total:rows.length,records:rows.slice(current*20,current*20+20),counts:{leads:rows.filter(row=>row.sourceType==='lead').length,reachable:rows.length,sources:new Set(rows.map(row=>row.source)).size},facets:{types:['coach','lead'],categories:['Coach','Lead'],statuses:['New Lead','active']}}});
    });
    await page.goto(origin+'/?contact-inbox');await page.getByText('1–20 dari 45',{exact:true}).waitFor();
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`tmp/contact-inbox-${viewport.width}.png`,fullPage:true});checks++;
    await page.getByRole('button',{name:'Berikutnya',exact:true}).click();await page.getByText('21–40 dari 45',{exact:true}).waitFor();checks++;
    await page.getByRole('searchbox',{name:'Cari kontak'}).fill('東京 %_*');await page.getByText('1–1 dari 1',{exact:true}).waitFor();checks++;
    await page.getByRole('button',{name:'Buka detail Arsip Lama 東京 %_*',exact:true}).click();await page.getByRole('textbox',{name:'Catatan internal',exact:true}).waitFor();
    assert.equal(await page.getByRole('combobox',{name:'Status kontak',exact:true}).inputValue(),'New Lead');
    assert(await page.getByText('Status tercatat',{exact:true}).isVisible());
    await page.screenshot({path:`tmp/contact-detail-${viewport.width}.png`,fullPage:true});checks++;
    await page.getByRole('textbox',{name:'Catatan internal',exact:true}).fill('Catatan lokal belum disimpan.');
    await page.evaluate(()=>Array.from(document.querySelectorAll('button')).find(button=>button.textContent==='Perbarui')?.click());
    await page.getByRole('textbox',{name:'Catatan internal',exact:true}).waitFor();assert.equal(await page.getByRole('textbox',{name:'Catatan internal',exact:true}).inputValue(),'Catatan lokal belum disimpan.');checks++;
    page.once('dialog',dialog=>dialog.dismiss());await page.getByRole('button',{name:'Tutup panel',exact:true}).click();assert(await page.getByRole('dialog').isVisible());
    await page.getByRole('textbox',{name:'Catatan internal',exact:true}).fill('Catatan tersimpan');await page.getByRole('button',{name:'Tutup panel',exact:true}).click();checks++;
    await page.getByRole('searchbox',{name:'Cari kontak'}).fill('Referensi sama ID');await page.getByText('1–1 dari 1',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Buka detail Referensi sama ID',exact:true}).click();await page.getByText(/Kontak ini berasal dari sumber referensi/).waitFor();assert.equal(await page.getByRole('button',{name:'Simpan perubahan',exact:true}).count(),0);await page.getByRole('button',{name:'Tutup panel',exact:true}).click();checks++;
    await page.getByRole('searchbox',{name:'Cari kontak'}).fill('');await page.getByText('1–20 dari 45',{exact:true}).waitFor();
    await page.getByRole('combobox',{name:'Filter jenis kontak'}).selectOption('lead');await page.getByText('1–20 dari 23',{exact:true}).waitFor();
    await page.getByRole('combobox',{name:'Filter kategori kontak'}).selectOption('Lead');await page.getByText('1–20 dari 23',{exact:true}).waitFor();checks++;
    failure=true;await page.getByRole('button',{name:'Berikutnya',exact:true}).click();await page.getByRole('alert').waitFor();assert.equal(await page.getByRole('combobox',{name:'Filter kategori kontak'}).inputValue(),'Lead');await page.screenshot({path:`tmp/contact-error-${viewport.width}.png`,fullPage:true});checks++;
    failure=false;empty=true;await page.getByRole('button',{name:'Coba muat daftar lagi',exact:true}).click();await page.getByText('0–0 dari 0',{exact:true}).waitFor();assert(await page.getByText('Kontak tidak ditemukan',{exact:true}).isVisible());checks++;
    assert.deepEqual(errors,[]);assert(methods.every(method=>method==='GET'));checks++;await page.close();
  }
  console.log(`[PASS] ${checks} local Chromium contact checks; 1440/1024/390/320px, mocked API, all writes blocked`);
}finally{await browser.close();}
