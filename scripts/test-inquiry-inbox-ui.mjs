import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
const origin='http://127.0.0.1:4318';
const records=Array.from({length:45},(_,index)=>({id:`synthetic-${index}`,name:index===44?'Arsip Lama Tokyo':`Klien Sintetis ${index+1}`,
  email:`sintetis-${index}@example.invalid`,messagePreview:index===44?'PT A,B %_* 東京':`Kebutuhan pengembangan manajer dan kolaborasi tim ${index+1}.`,
  source:index%2?'catalog_request':'contact_form',status:'Baru',replyStatus:'reviewed',followUpDue:false,createdAt:'2026-11-01T03:00:00Z'}));
const detail=row=>({...row,whatsapp:'',message:'Konteks kebutuhan lengkap. Tim kami memerlukan dukungan untuk menyelaraskan komunikasi dan prioritas kerja.',notes:'Catatan tersimpan',followUpLevel:0,
  followUpLastSentAt:null,followUpPaused:false,replySubject:'Diskusi kebutuhan pengembangan tim',replyBody:'Terima kasih telah menghubungi BinaHub. Mari bahas konteks dan prioritas pengembangan tim Anda.',replyGeneratedAt:null,replyReviewedAt:null,replyReviewedBy:null,replySentAt:null,replyEmailId:null,moduleRequest:{}});
const browser=await chromium.launch({headless:true});let checks=0;
try{
  for(const viewport of [{width:1440,height:1000},{width:1024,height:900},{width:390,height:844},{width:320,height:740}]){
    const page=await browser.newPage({viewport});let failure=false,empty=false;const errors=[],methods=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/*',async route=>{
      const url=new URL(route.request().url());if(url.origin!==origin)return route.abort();
      if(!url.pathname.startsWith('/api/'))return route.continue();methods.push(route.request().method());
      if(route.request().method()!=='GET')return route.fulfill({status:409,json:{success:false,error:'Mutations disabled in preview'}});
      if(url.pathname!=='/api/admin/inquiries/inbox')return route.fulfill({status:404,json:{success:false}});
      if(url.searchParams.has('id')){const row=records.find(record=>record.id===url.searchParams.get('id'));return route.fulfill({status:row?200:404,json:{success:Boolean(row),record:row?detail(row):null}});}
      if(failure)return route.fulfill({status:503,json:{success:false,error:'Temporary storage failure'}});
      const params=url.searchParams;
      const rows=empty?[]:records.filter(row=>`${row.name} ${row.email} ${row.messagePreview}`.toLowerCase().includes((params.get('search')||'').toLowerCase())&&(!params.get('source')||row.source===params.get('source'))&&(!params.get('status')||row.status===params.get('status')));
      const current=Number(params.get('page')||0);
      return route.fulfill({json:{success:true,version:1,pageSize:20,page:current,total:rows.length,records:rows.slice(current*20,current*20+20),counts:{fresh:rows.length,awaiting:0,ready:rows.length,due:0},facets:{sources:['catalog_request','contact_form'],statuses:['Baru']}}});
    });
    await page.goto(origin+'/?inquiry-inbox');await page.getByText('1–20 dari 45',{exact:true}).waitFor();
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:`tmp/inquiry-inbox-${viewport.width}.png`,fullPage:true});checks++;
    await page.getByRole('button',{name:'Berikutnya',exact:true}).click();await page.getByText('21–40 dari 45',{exact:true}).waitFor();checks++;
    await page.getByRole('searchbox',{name:'Cari inquiry'}).fill('A,B %_* 東京');await page.getByText('1–1 dari 1',{exact:true}).waitFor();checks++;
    await page.getByRole('button',{name:'Buka inquiry Arsip Lama Tokyo',exact:true}).click();await page.getByRole('textbox',{name:'Isi balasan',exact:true}).waitFor();
    const drawer=page.getByRole('dialog',{name:'Arsip Lama Tokyo',exact:true});assert(await drawer.isVisible());
    await page.screenshot({path:`tmp/inquiry-detail-${viewport.width}.png`,fullPage:true});checks++;
    await page.getByRole('textbox',{name:'Isi balasan',exact:true}).fill('Balasan lokal yang belum disimpan tetap dipertahankan saat pembacaan ulang.');
    assert(await page.getByRole('button',{name:'Kirim balasan',exact:true}).isDisabled());
    // Refresh is read-only; the drawer and local draft survive it.
    await page.evaluate(()=>Array.from(document.querySelectorAll('button')).find(button=>button.textContent==='Perbarui')?.click());
    await page.getByRole('textbox',{name:'Isi balasan',exact:true}).waitFor();
    assert((await page.getByRole('textbox',{name:'Isi balasan',exact:true}).inputValue()).startsWith('Balasan lokal'));checks++;
    await page.getByRole('textbox',{name:'Isi balasan',exact:true}).fill(detail(records[44]).replyBody);
    await page.getByRole('button',{name:'Kirim balasan',exact:true}).click();
    const confirmation=page.getByRole('dialog',{name:'Kirim balasan yang sudah direview?',exact:true});assert(await confirmation.isVisible());
    await page.waitForFunction(()=>Array.from(document.querySelectorAll('[role="dialog"]')).some(node=>node.querySelector('h3,h2')?.textContent==='Kirim balasan yang sudah direview?'&&node.contains(document.activeElement)));
    await page.keyboard.press('Tab');assert(await confirmation.evaluate(node=>node.contains(document.activeElement)));
    assert(methods.every(method=>method==='GET'));await confirmation.getByRole('button',{name:'Batal',exact:true}).click();checks++;
    await page.getByRole('button',{name:'Tutup panel',exact:true}).click();
    await page.getByRole('searchbox',{name:'Cari inquiry'}).fill('');await page.getByText('1–20 dari 45',{exact:true}).waitFor();
    await page.getByRole('combobox',{name:'Filter sumber inquiry'}).selectOption('catalog_request');await page.getByText('1–20 dari 22',{exact:true}).waitFor();checks++;
    failure=true;await page.getByRole('button',{name:'Berikutnya',exact:true}).click();await page.getByRole('alert').waitFor();
    assert(await page.getByRole('combobox',{name:'Filter sumber inquiry'}).inputValue()==='catalog_request');
    await page.screenshot({path:`tmp/inquiry-error-${viewport.width}.png`,fullPage:true});checks++;
    failure=false;empty=true;await page.getByRole('button',{name:'Coba muat daftar lagi',exact:true}).click();await page.getByText('0–0 dari 0',{exact:true}).waitFor();checks++;
    assert.deepEqual(errors,[]);assert(methods.every(method=>method==='GET'));checks++;await page.close();
  }
  console.log(`[PASS] ${checks} local Chromium Inquiry checks; desktop/tablet/390/320px, mocked API, no provider or real sending`);
}finally{await browser.close();}
