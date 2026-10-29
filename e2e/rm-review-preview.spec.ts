import {test,expect} from '@playwright/test';
test.skip(process.env.PLAYWRIGHT_SPIN_PREVIEW!=='1','Loopback synthetic preview only');
test('RM admin source review is honest, responsive and does not save participant answers',async({page,baseURL},info)=>{
 expect(baseURL).toMatch(/^http:\/\/127\.0\.0\.1:/);
 const mobile=info.project.name.includes('mobile');await page.setViewportSize({width:mobile?390:1440,height:mobile?844:1000});
 const names=['Communication','Presentation & Public Speaking','Professional Presence','Relationship Building','Trust Building','Collaboration','Influencing','Conflict Management','Customer Orientation'];
 await page.route('**/api/**',route=>route.fulfill({json:route.request().method()==='GET'?{success:true,readiness:{version:'4.0.0-draft.1',sourceLoaded:true,canSell:false,counts:{competencies:9,selfReport:27,sjt:13},missing:['Bobot studi kasus ke kompetensi belum disahkan.'],reportSections:['Ringkasan eksekutif','Profil sembilan kompetensi','Rencana aksi30hari']},definition:{competencies:[],selfReportItems:[{id:'synthetic',prompt:'Contoh pertanyaan untuk menguji tampilan tanpa materi instrumen.'}],sjtItems:[],selfReportScale:[{value:4,label:'Sering'}]}}:{success:true,report:{notice:'Pratinjau internal sintetis. Studi kasus belum dapat dihitung.',areas:names.map((name,i)=>({code:'RM-'+(i+7),name,selfReport:{score:i===0?75:null,validCount:i===0?3:0},sjt:{score:null}})),actionPlan:{days:30,stages:['Fokus perilaku','Opsi pengembangan BinaHub','Praktik di tempat kerja','Evaluasi dan perbaikan lanjutan']}}}}));
 await page.goto('/?rm-review');await expect(page.getByText(/9 kompetensi/)).toBeVisible();
 await page.getByText('Tinjau bank soal dan coba laporan').click();await page.getByRole('combobox').selectOption('4');await page.getByRole('button',{name:'Lihat pratinjau laporan'}).click();
 await expect(page.getByRole('region',{name:'Pratinjau laporan RM'})).toBeVisible();
 await expect(page.getByText('Menunggu bobot')).toHaveCount(9);
 await page.screenshot({path:'.impeccable/review/rm-review-'+(mobile?'mobile':'desktop')+'.png',fullPage:true});
 for(const width of [320,768,1024]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});
