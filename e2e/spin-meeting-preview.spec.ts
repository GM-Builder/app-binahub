import { expect, test } from '@playwright/test';
import definition from '../src/test/fixtures/spin-definition.json';
import { spinOptions, spinSanitize, spinVisible, type SpinAnswers } from '../src/lib/spin-form';
import { spinSyntheticReport } from '../src/test/fixtures/spin-report';
test.skip(process.env.PLAYWRIGHT_SPIN_PREVIEW !== '1', 'Synthetic loopback preview only.');
test('admin continues client needs, saves/reopens, handles failure and starts a standalone meeting', async ({ page, baseURL }, info) => {
  test.setTimeout(90000); expect(baseURL).toMatch(/^http:\/\/127\.0\.0\.1:/);
  const mobile=info.project.name.includes('mobile'),suffix=mobile?'mobile':'desktop';
  await page.setViewportSize({width:mobile?390:1440,height:mobile?844:1000});
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  const id='11111111-1111-4111-8111-111111111111';
  const answers:SpinAnswers={};
  for(const field of definition.fields){if(!field.required||!spinVisible(field,answers))continue;
    const options=spinOptions(field,answers);answers[field.key]=field.type==='text'?'Tindak lanjut kerja menjadi lebih jelas.':field.type==='number'?20:field.type==='multi'?[options[0].value]:options[0].value;
  }
  answers.trigger='T3';
  const original=spinSanitize(definition,answers);
  const contact={name:'Nadia — data sintetis',company:'Organisasi contoh — data sintetis',email:'synthetic@example.invalid'};
  const record={id,status:'ready',contact,submitted_at:'2026-10-26T03:00:00Z',has_source:true,meeting_status:null,answers:original,summary:spinSyntheticReport.summary,report:spinSyntheticReport,internal_report:{},marketing_consent:false};
  const sessions:Record<string,{id:string;source_id:string|null;contact:typeof contact;answers:SpinAnswers;notes:string;status:string;revision:number;updated_at:string|null}>={};
  let failNext=false;
  await page.route('**/api/**',async route=>{
    const request=route.request(),url=new URL(request.url()),body=request.postDataJSON();let data:object={};
    if(url.pathname==='/api/admin/discovery/meetings'&&request.method()==='GET')data={records:[record,...Object.values(sessions).filter(item=>item.source_id===null).map(item=>({...item,has_source:false,status:'meeting',submitted_at:item.updated_at}))],total:1+Object.values(sessions).filter(item=>item.source_id===null).length};
    else if(url.pathname==='/api/admin/discovery/meetings'&&request.method()==='POST'){
      sessions[body.id]={id:body.id,source_id:null,contact:body.contact,answers:{},notes:'',status:'in_progress',revision:1,updated_at:'2026-10-26T04:00:00Z'};data={checklist:sessions[body.id]};
    } else if(url.pathname.endsWith('/meeting')){
      const currentId=url.pathname.split('/').at(-2)!;
      const current=sessions[currentId]||{id:currentId,source_id:id,contact,answers:{},notes:'',status:'in_progress',revision:0,updated_at:null};
      if(request.method()==='PATCH'){
        if(failNext){failNext=false;await route.fulfill({status:503,json:{error:'Koneksi uji terputus. Coba simpan lagi.'}});return;}
        expect(body.revision).toBe(current.revision);
        sessions[currentId]={...current,...body,revision:current.revision+1,updated_at:'2026-10-26T04:00:00Z'};
        data={checklist:sessions[currentId]};
      } else data={checklist:current,definition,original:current.source_id?original:{}};
    } else if(url.pathname==='/api/admin/discovery')data={record,definition,delivery:[]};
    await route.fulfill({json:{success:true,...data}});
  });
  await page.goto('/?spin&view=admin');
  await expect(page.getByRole('heading',{name:'Kebutuhan program',exact:true})).toBeVisible();
  await page.getByRole('button',{name:/Organisasi contoh/}).click();
  await expect(page.getByRole('heading',{name:'Checklist meeting',exact:true})).toBeVisible();
  await page.screenshot({path:`.impeccable/review/meeting-client-${suffix}.png`,fullPage:true});
  await page.getByLabel('Hanya yang belum diisi').check();
  const contextField=page.getByRole('textbox',{name:'Konteks bisnis atau perubahan yang perlu kami pahami'});
  await expect(contextField).toBeVisible();
  await contextField.fill('Perubahan cara kerja lintas unit perlu dibahas bersama.');
  await expect.poll(()=>sessions[id]?.revision).toBe(1);
  const notes=page.getByLabel('Catatan dan tindak lanjut konsultasi');
  failNext=true;await notes.fill('Jadwalkan diskusi lanjutan dengan pimpinan unit.');
  await expect(page.getByRole('alert')).toContainText('Koneksi uji terputus');await expect(notes).toHaveValue('Jadwalkan diskusi lanjutan dengan pimpinan unit.');
  await page.getByRole('button',{name:'Coba simpan lagi'}).click();
  await expect.poll(()=>sessions[id]?.notes).toBe('Jadwalkan diskusi lanjutan dengan pimpinan unit.');
  await expect(page.getByRole('status').filter({hasText:'Tersimpan'})).toBeVisible();
  await page.screenshot({path:`.impeccable/review/meeting-saved-${suffix}.png`,fullPage:true});
  await page.reload();await page.getByRole('button',{name:/Organisasi contoh/}).click();
  await expect(page.getByLabel('Catatan dan tindak lanjut konsultasi')).toHaveValue('Jadwalkan diskusi lanjutan dengan pimpinan unit.');
  await page.getByRole('button',{name:'Tandai selesai',exact:true}).first().click();
  await expect.poll(()=>sessions[id]?.status).toBe('completed');
  expect(record.answers).toEqual(original);expect(record.report).toEqual(spinSyntheticReport);
  await page.getByRole('button',{name:'Pengisian & laporan klien'}).click();await expect(page.getByRole('heading',{name:'Arah pengembangan, dalam satu pandangan'})).toBeVisible();
  await page.getByRole('button',{name:'Mulai checklist',exact:true}).click();
  await page.getByLabel('Nama klien',{exact:true}).fill('Kontak contoh');await page.getByLabel('Perusahaan / organisasi',{exact:true}).fill('Meeting baru — data sintetis');await page.getByLabel('Email klien',{exact:true}).fill('meeting@example.invalid');
  await page.getByRole('checkbox',{name:/Klien telah diberi tahu/}).check();
  await page.screenshot({path:`.impeccable/review/meeting-new-${suffix}.png`,fullPage:true});
  await page.getByRole('button',{name:'Mulai sesi',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Meeting baru — data sintetis',exact:true})).toBeVisible();
  await expect(page.getByRole('combobox',{name:'Peran Anda',exact:true})).toHaveValue('');
  // Exercise the real outer SalesWorkspace, not just the isolated checklist.
  await page.goto('/?sales');
  await page.getByRole('button',{name:'Klien & proposal',exact:true}).click();
  await page.getByRole('button',{name:'Discovery organisasi',exact:true}).click();
  await page.getByRole('button',{name:/Organisasi contoh/}).click();
  const outerNotes=page.getByLabel('Catatan dan tindak lanjut konsultasi');
  await outerNotes.fill('Perubahan tepat sebelum pindah tab.');
  page.once('dialog',dialog=>dialog.dismiss());
  await page.getByRole('button',{name:'Inbound',exact:true}).click();
  await expect(outerNotes).toHaveValue('Perubahan tepat sebelum pindah tab.');
  await expect.poll(()=>sessions[id]?.notes).toBe('Perubahan tepat sebelum pindah tab.');
  failNext=true;await outerNotes.fill('Tetap ada meskipun simpan gagal.');
  await expect(page.getByRole('alert')).toContainText('Koneksi uji terputus');
  page.once('dialog',dialog=>dialog.dismiss());
  await page.getByRole('button',{name:'Inquiry masuk',exact:true}).click();
  await expect(outerNotes).toHaveValue('Tetap ada meskipun simpan gagal.');
  await page.getByRole('button',{name:'Coba simpan lagi'}).click();
  await expect.poll(()=>sessions[id]?.notes).toBe('Tetap ada meskipun simpan gagal.');
  for(const width of [320,768]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  expect(errors).toEqual([]);
});
