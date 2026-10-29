import {test,expect} from '@playwright/test';
test.skip(process.env.PLAYWRIGHT_SPIN_PREVIEW!=='1','Loopback synthetic preview only');
test('completes all 27 SR and13 SJT, reviews choices and reads separate/module scores',async({page,baseURL},info)=>{
 test.setTimeout(120000);expect(baseURL).toMatch(/^http:\/\/127\.0\.0\.1:/);
 const phone=info.project.name.includes('mobile');await page.setViewportSize({width:phone?390:1440,height:phone?844:1000});
 const definition={competencies:[],selfReportScale:[{value:4,label:'Sering'}],selfReportItems:Array.from({length:27},(_,i)=>({id:'SR'+i,prompt:`Pertanyaan sintetis ${i+1}.`})),sjtItems:Array.from({length:13},(_,i)=>({id:'SJT'+i,scenario:`Skenario sintetis ${i+1}.`,question:'Apa yang Anda pilih?',options:[{id:'A',text:'Pilihan sintetis A'}]}))};
 let submissions=0;
 await page.route('**/api/**',route=>{
  if(route.request().method()==='GET')return route.fulfill({json:{success:true,readiness:{version:'4.0.0-draft.1',sourceLoaded:true,canSell:false,counts:{competencies:9,selfReport:27,sjt:13},missing:['Pemetaan per kompetensi menunggu CEO.'],reportSections:['Profil kompetensi']},definition}});
  const body=route.request().postDataJSON();expect(body.complete).toBe(true);expect(Object.keys(body.responses)).toHaveLength(40);submissions++;
  return route.fulfill({json:{success:true,report:{notice:'Pratinjau sintetis.',moduleProfile:{selfReport:75,sjt:50,combined:62.5},areas:[{code:'RM-07',name:'Communication',selfReport:{score:75,validCount:3},sjt:{score:null}}],actionPlan:{days:30,stages:['Fokus perilaku']}}}});
 });
 await page.goto('/?rm-review');await page.getByRole('button',{name:'Uji alur pengisian 40 soal'}).click();
 const trial=page.getByRole('region',{name:'Uji pengisian RM'});
 await expect(trial.getByRole('button',{name:'Lanjut'})).toBeDisabled();
 for(let i=0;i<40;i++){
  await expect(trial.getByText(`Pertanyaan ${i+1} dari 40`,{exact:true})).toBeVisible();
  await trial.getByRole('radio').check();
  if(i===0||i===27)await page.screenshot({path:`.impeccable/review/rm-trial-${i===0?'sr':'sjt'}-${phone?'mobile':'desktop'}.png`,fullPage:false});
  await trial.getByRole('button',{name:i===39?'Tinjau jawaban':'Lanjut',exact:true}).click();
 }
 await expect(trial.getByRole('heading',{name:'Tinjau jawaban uji'})).toBeVisible();expect(submissions).toBe(0);
 await trial.getByRole('button',{name:'Selesaikan uji dan lihat laporan'}).click();
 const report=page.getByRole('region',{name:'Pratinjau laporan RM'});await expect(report).toBeVisible();
 await expect(report.getByText('62,5 / 100',{exact:true})).toBeVisible();await expect(report.getByText('Menunggu bobot')).toBeVisible();expect(submissions).toBe(1);
 await report.screenshot({path:`.impeccable/review/rm-module-report-${phone?'mobile':'desktop'}.png`});
});
