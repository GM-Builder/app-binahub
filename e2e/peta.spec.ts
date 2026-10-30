import {test,expect} from '@playwright/test';
import {makePetaSession,petaSyntheticReport} from '../src/test/fixtures/peta';
test.skip(process.env.PLAYWRIGHT_PETA_PREVIEW!=='1','Synthetic loopback only');
const ws='a3115319-1922-471e-bce7-8239ac25e0c0';

test('program entry uses participant auth, private consent details, immediate Next and finite motion',async({page},info)=>{
 const phone=info.project.name.includes('mobile'),device=phone?'mobile':'desktop';await page.setViewportSize({width:phone?390:1440,height:phone?844:1000});
 const s=makePetaSession();s.answers[s.blocks[0].id]={most:'A',least:'B'};
 let resume=false,finish:()=>void=()=>{};const delayed=new Promise<void>(r=>{finish=r;});
 await page.route('**/api/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname;
  expect(req.headers()['authorization']).toBe('Bearer synthetic-preview-not-a-credential');
  if(path.endsWith('/program'))return route.fulfill({json:{success:true,hasSession:resume,invitation:{workspaceName:'Program sintetis',privacyReference:'INTERNAL_REFERENCE_NEVER_RENDER',retentionMonths:12,consultantAccess:true,consentVersion:'peta-privacy-v1',purpose:'start',expiresAt:null}}});
  if(path.endsWith('/program/start')||path.endsWith('/program/resume')){resume=true;return route.fulfill({json:{success:true,session:s,csrfToken:'c'.repeat(64)}});}
  if(path.endsWith('/answer')){const body=req.postDataJSON();await delayed;s.answers[body.blockId]={most:body.most,least:body.least};s.revision++;return route.fulfill({json:{success:true,session:s}});}
  return route.fulfill({json:{success:true,session:s,csrfToken:'c'.repeat(64)}});
 });
 await page.goto('/?peta-program');await expect(page.getByRole('heading',{name:'Sebelum memulai'})).toBeVisible();
 await expect(page.getByText('INTERNAL_REFERENCE_NEVER_RENDER')).toHaveCount(0);await expect(page.getByText(/peta-privacy-v1/)).toHaveCount(0);
 await page.getByText('Penggunaan data dan hasil Anda',{exact:true}).click();await expect(page.getByText(/satu tahun sejak Anda mulai/)).toBeVisible();await page.screenshot({path:'.impeccable/review/peta-program-privacy-'+device+'.png',fullPage:true});await page.getByText('Penggunaan data dan hasil Anda',{exact:true}).click();
 await page.screenshot({path:'.impeccable/review/peta-program-consent-'+device+'.png',fullPage:true});
 await page.getByLabel(/Saya telah membaca/).check();await page.getByRole('button',{name:'Saya setuju dan lanjutkan'}).click();
 await expect(page.getByRole('heading',{name:'Situasi sintetis 2',exact:true})).toBeVisible();await page.getByRole('radio').nth(0).check();await page.getByRole('radio').nth(3).check();
 await page.getByRole('button',{name:'Lanjut',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Situasi sintetis 3',exact:true})).toBeVisible();await expect(page.getByRole('status')).toContainText('latar belakang');
 const step=page.locator('[data-peta-question]');expect(await step.evaluate(el=>getComputedStyle(el).animationDuration)).toBe('0.2s');
 await page.screenshot({path:'.impeccable/review/peta-program-question-'+device+'.png',fullPage:true});
 await page.getByRole('button',{name:'Sebelumnya',exact:true}).click();await expect(page.getByRole('radio').nth(0)).toBeChecked();await expect(page.getByRole('radio').nth(3)).toBeChecked();
 finish();await expect(page.getByRole('status')).toHaveText('Semua jawaban tersimpan.');
 await page.emulateMedia({reducedMotion:'reduce'});expect(await step.evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
 for(const width of [320,768,1024]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});

test('program admin reuses the existing QR/card, module setup and participant-code management',async({page},info)=>{
 const phone=info.project.name.includes('mobile'),device=phone?'mobile':'desktop';await page.setViewportSize({width:phone?390:1440,height:phone?844:1000});
 const actions:unknown[]=[];
 const dashboard={sourceReady:true,programs:[{id:ws,title:'Program PETA sintetis',code:'PETA-TEST-2026',status:'active',petaEnabled:true}],workspaces:[{id:ws,name:'Program PETA sintetis',programId:ws,consultantAccess:true,privacyReference:'Acuan internal sintetis'}],invitations:[],sessions:[{id:makePetaSession().id,workspaceId:ws,programId:ws,participantCode:'PETA-SYNTHETIC',participantName:'Peserta sintetis',status:'submitted',completedBlocks:24,submittedAt:petaSyntheticReport.submittedAt,retentionUntil:petaSyntheticReport.retentionUntil,canReadResult:false,instrumentVersion:'1.0.0-pilot',consentVersion:'peta-privacy-v1',consentedAt:petaSyntheticReport.submittedAt,reviewConsent:false}],audit:[]};
 await page.route('**/api/**',route=>{if(route.request().method()==='GET')return route.fulfill({json:{success:true,...dashboard}});actions.push(route.request().postDataJSON());return route.fulfill({json:{success:true,id:ws}});});
 await page.goto('/?peta-admin&program_id='+ws);await expect(page.getByRole('combobox',{name:'Program',exact:true})).toHaveValue(ws);
 await expect(page.getByRole('heading',{name:'Pengisian peserta'})).toBeVisible();
 await page.getByText('Kelola peserta',{exact:true}).click();
 await expect(page.getByRole('link',{name:'Kelola kode peserta'})).toHaveAttribute('href','/admin/engagements/access-codes?engagement_id='+ws);
 await expect(page.getByRole('button',{name:'Pulihkan akses',exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'Lihat hasil peserta'})).toHaveCount(0);
 await page.getByRole('button',{name:'Pengaturan',exact:true}).click();
 await page.getByLabel(/Saya memastikan hak penggunaan/).check();await page.getByRole('button',{name:'Simpan pengaturan PETA'}).click();await expect.poll(()=>actions.length).toBe(1);expect(actions[0]).toMatchObject({programId:ws,privacyReference:'Acuan internal sintetis'});
 await page.getByRole('button',{name:'Akses peserta',exact:true}).click();
 const qr=page.getByRole('img',{name:'QR code akses program Program PETA sintetis'});await expect(qr).toBeVisible();await expect(page.getByText('PETA-TEST-2026',{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Download PNG'})).toBeEnabled();
 await page.screenshot({path:'.impeccable/review/peta-program-admin-'+device+'.png',fullPage:true});
 for(const width of [320,768,1024]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});
test('invitation, consent, practice, 24 required pairs, review and two-chart report',async({page,baseURL},info)=>{
 test.setTimeout(120000);expect(baseURL).toMatch(/^http:\/\/127\.0\.0\.1:/);const phone=info.project.name.includes('mobile'),device=phone?'mobile':'desktop';await page.setViewportSize({width:phone?390:1440,height:phone?844:1000});
 const s=makePetaSession();let submits=0;const saves:string[]=[];
 await page.route('**/api/**',async route=>{const request=route.request(),path=new URL(request.url()).pathname;
  if(path.endsWith('/invitation'))return route.fulfill({json:{success:true,invitation:{workspaceName:'Ruang pilot sintetis',privacyReference:'Kebijakan pilot sintetis, disetujui untuk pengujian lokal',retentionMonths:12,consultantAccess:true,consentVersion:'peta-privacy-v1',purpose:'start',expiresAt:'2026-12-01T00:00:00Z'}}});
  if(path.endsWith('/start')){const body=request.postDataJSON();expect(body.consentAccepted).toBe(true);expect(body.reviewConsent).toBe(false);return route.fulfill({json:{success:true,session:s,csrfToken:'c'.repeat(64)}});}
  if(path.endsWith('/answer')){const body=request.postDataJSON();expect(Number(request.headers()['if-match'])).toBe(s.revision);expect(body.most).not.toBe(body.least);s.answers[body.blockId]={most:body.most,least:body.least};s.revision++;saves.push(body.blockId);await new Promise(r=>setTimeout(r,60));return route.fulfill({json:{success:true,session:s}});}
  if(path.endsWith('/submit')){expect(Object.keys(s.answers)).toHaveLength(24);expect(Object.values(s.answers).every(a=>a.most&&a.least&&a.most!==a.least)).toBe(true);expect(request.headers()['idempotency-key']).toBeTruthy();submits++;s.status='submitted';s.submittedAt=petaSyntheticReport.submittedAt;return route.fulfill({json:{success:true,status:'submitted',submittedAt:s.submittedAt}});}
  if(path.endsWith('/result'))return route.fulfill({json:{success:true,report:petaSyntheticReport}});
  return route.fulfill({json:{success:true,session:s,csrfToken:'c'.repeat(64)}});
 });
 await page.goto('/?peta#invite='+'a'.repeat(64));await expect(page.getByRole('heading',{name:'Sebelum memulai'})).toBeVisible();expect(new URL(page.url()).hash).toBe('');await expect(page.getByRole('button',{name:'Saya setuju dan lanjutkan'})).toBeDisabled();
 await page.screenshot({path:'.impeccable/review/peta-consent-'+device+'.png',fullPage:true});await page.getByLabel('Saya telah membaca',{exact:false}).check();await page.getByRole('button',{name:'Saya setuju dan lanjutkan'}).click();
 await expect(page.getByRole('heading',{name:'Coba satu situasi terlebih dahulu.'})).toBeVisible();await expect(page.getByRole('button',{name:'Mulai 24 situasi'})).toBeDisabled();const practice=page.getByRole('radio');await practice.nth(0).check();await expect(practice.nth(1)).toBeDisabled();await practice.nth(3).check();await page.getByRole('button',{name:'Mulai 24 situasi'}).click();
 for(let i=0;i<24;i++){await expect(page.getByRole('heading',{level:1,name:'Situasi sintetis '+(i+1),exact:true})).toBeVisible();await page.getByRole('radio').nth(0).check();await page.getByRole('radio').nth(3).check();if(i===0){await page.screenshot({path:'.impeccable/review/peta-question-'+device+'.png',fullPage:true});}
  await page.getByRole('button',{name:i===23?'Tinjau jawaban':'Lanjut',exact:true}).click();
 }
 await expect(page.getByRole('heading',{name:'Ringkasan 24 situasi'})).toBeVisible();expect(submits).toBe(0);await expect.poll(()=>saves.length).toBeGreaterThanOrEqual(24);await expect(page.getByRole('button',{name:'Kirim dan lihat hasil'})).toBeDisabled();await page.screenshot({path:'.impeccable/review/peta-review-'+device+'.png',fullPage:true});await page.getByLabel('Saya memahami bahwa pilihan akan terkunci setelah dikirim.').check();await page.getByRole('button',{name:'Kirim dan lihat hasil'}).click();
 await expect(page.getByRole('heading',{name:'Peta preferensi perilaku kerja Anda'})).toBeFocused();await expect(page.getByRole('table',{name:'Rincian angka pilihan'})).toBeVisible();await expect(page.getByRole('img')).toHaveCount(3);expect(submits).toBe(1);await page.screenshot({path:'.impeccable/review/peta-result-'+device+'.png',fullPage:true});
 for(const width of [320,768,1024]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);}
});
test('does not offer an uninvited start and preserves local choices after a save error',async({page},info)=>{
 const phone=info.project.name.includes('mobile');await page.setViewportSize({width:phone?390:1440,height:900});let active=false,fail=true;const s=makePetaSession();s.answers[s.blocks[0].id]={most:'A',least:'B'};
 await page.route('**/api/**',route=>{if(!active)return route.fulfill({status:401,json:{success:false,code:'PETA_SESSION_REQUIRED',error:'Sesi berakhir'}});if(route.request().method()==='PUT'&&fail){fail=false;return route.fulfill({status:503,json:{success:false,code:'PETA_UNAVAILABLE',error:'Koneksi terputus. Coba simpan kembali.'}});}if(route.request().method()==='PUT'){const b=route.request().postDataJSON();s.answers[b.blockId]=b;s.revision++;}return route.fulfill({json:{success:true,session:s,csrfToken:'c'.repeat(64)}});});
 await page.goto('/?peta');await expect(page.getByRole('heading',{name:'PETA tersedia melalui undangan.'})).toBeVisible();await page.screenshot({path:'.impeccable/review/peta-welcome-'+(phone?'mobile':'desktop')+'.png',fullPage:true});active=true;await page.getByRole('button',{name:'Lanjutkan sesi pada perangkat ini'}).click();
 await page.getByRole('radio').nth(0).check();await expect(page.getByRole('alert')).toContainText('Koneksi terputus');await expect(page.getByRole('radio').nth(0)).toBeChecked();await page.getByRole('button',{name:'Coba simpan kembali'}).click();await expect(page.getByRole('status')).toHaveText('Semua jawaban tersimpan.');
});
test('admin sees scoped progress and explicit source/permission boundaries',async({page},info)=>{
 const phone=info.project.name.includes('mobile');await page.setViewportSize({width:phone?390:1440,height:1000});const actions:string[]=[];
 const dashboard={sourceReady:true,workspaces:[{id:ws,name:'Ruang sintetis',consultantAccess:true,privacyReference:'Kebijakan sintetis'}],invitations:[{id:ws,workspaceId:ws,participantCode:'PETA-SYNTHETIC',purpose:'start',expiresAt:'2026-12-01T00:00:00Z',status:'used'}],sessions:[{id:makePetaSession().id,workspaceId:ws,participantCode:'PETA-SYNTHETIC',status:'submitted',completedBlocks:24,submittedAt:petaSyntheticReport.submittedAt,retentionUntil:petaSyntheticReport.retentionUntil,canReadResult:true,instrumentVersion:'1.0.0-pilot',consentVersion:'peta-privacy-v1',consentedAt:petaSyntheticReport.submittedAt,reviewConsent:true}],audit:[{id:'1',workspaceId:ws,participantCode:'PETA-SYNTHETIC',event:'participant_result_opened',createdAt:'2026-10-29T04:00:00Z',adminAction:false}]};
 await page.route('**/api/**',route=>{if(route.request().method()==='GET')return route.fulfill({json:{success:true,...dashboard}});const body=route.request().postDataJSON();actions.push(body.action||'invite');if(body.action==='result')return route.fulfill({json:{success:true,report:petaSyntheticReport}});return route.fulfill({json:{success:true,invitationPath:'/peta#invite='+'a'.repeat(64),expiresAt:'2026-12-01T00:00:00Z'}});});
  await page.goto('/?peta-admin');await expect(page.getByRole('heading',{name:'PETA-SYNTHETIC',exact:true})).toBeVisible();
  await page.getByText('Detail pengisian',{exact:true}).click();await expect(page.getByText('peta-privacy-v1',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Pengaturan',exact:true}).click();await page.getByText('Undangan pilot lama',{exact:true}).click();await page.getByRole('combobox',{name:'Ruang pilot lama',exact:true}).selectOption(ws);await page.getByRole('textbox',{name:'Kode peserta',exact:true}).fill('PETA-NEW');await page.getByRole('button',{name:'Buat tautan undangan'}).click();await expect(page.getByRole('heading',{name:'Tautan pribadi siap dibagikan'})).toBeVisible();await page.getByRole('button',{name:'Tutup tautan'}).click();await page.getByText('Riwayat akses dan tindakan',{exact:true}).click();await expect(page.getByText('Peserta membuka hasil',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Peserta',exact:true}).click();await page.screenshot({path:'.impeccable/review/peta-admin-'+(phone?'mobile':'desktop')+'.png',fullPage:true});await page.getByRole('button',{name:'Lihat hasil peserta'}).click();await expect(page.getByRole('heading',{name:'Peta preferensi perilaku kerja Anda'})).toBeFocused();expect(actions).toContain('result');
  await page.getByRole('button',{name:'Kembali ke daftar peserta'}).click();await expect(page.getByRole('heading',{name:'Pengisian peserta'})).toBeFocused();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});

test('admin workspace keeps one program context, searchable participants, safe actions and a clear result return',async({page},info)=>{
 const phone=info.project.name.includes('mobile'),device=phone?'mobile':'desktop';await page.setViewportSize({width:phone?390:1440,height:phone?844:1000});
 const external:string[]=[],errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>{if(new URL(route.request().url()).hostname!=='127.0.0.1'){external.push(route.request().url());return route.abort();}return route.fallback();});
 const sessions=[{id:'synthetic-ready',workspaceId:ws,programId:ws,participantName:'Ayu Sintetis',participantCode:'CODE-A',status:'submitted',completedBlocks:24,submittedAt:petaSyntheticReport.submittedAt,retentionUntil:petaSyntheticReport.retentionUntil,canReadResult:true,reviewConsent:true,instrumentVersion:'1.0.0-pilot',consentVersion:'peta-program-privacy-v1',consentedAt:petaSyntheticReport.submittedAt},
 {id:'synthetic-busy',workspaceId:ws,programId:ws,participantName:'Budi Sintetis',participantCode:'CODE-B',status:'in_progress',completedBlocks:8,submittedAt:null,retentionUntil:petaSyntheticReport.retentionUntil,canReadResult:false,reviewConsent:false,instrumentVersion:'1.0.0-pilot',consentVersion:'peta-program-privacy-v1',consentedAt:petaSyntheticReport.submittedAt},
 {id:'synthetic-private',workspaceId:ws,programId:ws,participantName:'Citra Sintetis',participantCode:'CODE-C',status:'submitted',completedBlocks:24,submittedAt:petaSyntheticReport.submittedAt,retentionUntil:petaSyntheticReport.retentionUntil,canReadResult:false,reviewConsent:false,instrumentVersion:'1.0.0-pilot',consentVersion:'peta-program-privacy-v1',consentedAt:petaSyntheticReport.submittedAt}];
 const dashboard={sourceReady:true,programs:[{id:ws,title:'Pengembangan Tim Nusantara',code:'TEAM-2026',status:'active',petaEnabled:true}],workspaces:[{id:ws,name:'Pengembangan Tim Nusantara',programId:ws,consultantAccess:true,privacyReference:'Kebijakan internal sintetis'}],invitations:[],sessions,audit:[]};
 let fail=false;
 await page.route('**/api/**',route=>{if(route.request().method()==='GET')return route.fulfill({json:{success:true,...dashboard}});if(fail)return route.fulfill({status:503,json:{success:false,error:'Hasil belum dapat dihubungi. Coba kembali.'}});return route.fulfill({json:{success:true,report:petaSyntheticReport}});});
 await page.goto('/?peta-admin');await expect(page.getByRole('heading',{name:'Ayu Sintetis'})).toBeVisible();await expect(page.getByRole('combobox',{name:'Program',exact:true})).toHaveValue(ws);
 await expect(page.getByRole('combobox',{name:'Program',exact:true})).toHaveCount(1);await expect(page.getByRole('button',{name:'Lihat hasil peserta'})).toHaveCount(1);await expect(page.getByText('Peserta belum memberikan izin untuk peninjauan hasil.')).toBeVisible();
 await page.evaluate(()=>document.fonts.ready);expect(await page.evaluate(async()=>{const faces=await document.fonts.load('400 16px "Plus Jakarta Sans"');return faces.length>0&&faces.every(face=>face.status==='loaded');})).toBe(true);
 await page.screenshot({path:'.impeccable/review/peta-workspace-participants-'+device+'.png',fullPage:true});
 for(const width of [320,768,1024]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.setViewportSize({width:phone?390:1440,height:phone?844:1000});
 await page.getByRole('searchbox').fill('tidak ada');await expect(page.getByRole('heading',{name:'Peserta tidak ditemukan'})).toBeVisible();await page.getByRole('button',{name:'Hapus pencarian dan filter'}).click();await page.getByRole('combobox',{name:'Status pengisian'}).selectOption('in_progress');await expect(page.getByRole('heading',{name:'Budi Sintetis'})).toBeVisible();await expect(page.getByRole('heading',{name:'Ayu Sintetis'})).toHaveCount(0);
 await page.getByRole('combobox',{name:'Status pengisian'}).selectOption('all');await page.getByRole('searchbox').fill('Ayu');
 fail=true;await page.getByRole('button',{name:'Lihat hasil peserta'}).click();await expect(page.getByRole('alert')).toContainText('Hasil belum dapat dihubungi');await expect(page.getByRole('searchbox')).toHaveValue('Ayu');
 fail=false;await page.getByRole('button',{name:'Lihat hasil peserta'}).click();await expect(page.getByRole('heading',{name:'Hasil Ayu Sintetis'})).toBeVisible();await expect(page.getByRole('table',{name:'Rincian angka pilihan'})).toBeVisible();await page.screenshot({path:'.impeccable/review/peta-workspace-result-'+device+'.png',fullPage:true});
 await page.getByRole('button',{name:'Kembali ke daftar peserta'}).click();await expect(page.getByRole('heading',{name:'Pengisian peserta'})).toBeFocused();await expect(page.getByRole('searchbox')).toHaveValue('Ayu');
 await page.getByRole('button',{name:'Akses peserta',exact:true}).click();await expect(page.getByRole('img',{name:'QR code akses program Pengembangan Tim Nusantara'})).toBeVisible();await page.screenshot({path:'.impeccable/review/peta-workspace-access-'+device+'.png',fullPage:true});
 for(const width of [320,390,768,1024]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.setViewportSize({width:phone?390:1440,height:phone?844:1000});
 await page.getByRole('button',{name:'Pengaturan',exact:true}).click();await expect(page.getByRole('textbox',{name:'Acuan pemberitahuan privasi'})).toHaveValue('Kebijakan internal sintetis');await page.screenshot({path:'.impeccable/review/peta-workspace-settings-'+device+'.png',fullPage:true});
 expect(errors).toEqual([]);expect(external).toEqual([]);
});
