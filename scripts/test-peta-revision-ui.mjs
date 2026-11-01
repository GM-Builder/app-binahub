// Synthetic PETA revision checks, independent of a platform-native bundler.
// Run offline in the documented sandbox; no real account, report or network is used.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import Module,{createRequire} from 'node:module';
import ts from 'typescript';
import {JSDOM} from 'jsdom';
const require=createRequire(import.meta.url),dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://app.binahub.id/peta'});
for(const key of ['window','document','navigator','HTMLElement','HTMLInputElement','Node','MutationObserver','getComputedStyle']){
 Object.defineProperty(globalThis,key,{value:typeof dom.window[key]==='function'&&key==='getComputedStyle'?dom.window[key].bind(dom.window):dom.window[key],configurable:true,writable:true});
}
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const React=require('react'),{render,screen,fireEvent,within,waitFor,cleanup}=require('@testing-library/react');
const styles=new Proxy({},{get:(_,name)=>String(name)}),cache=new Map();
function compile(path,dependencies={}){
 const filename=resolve(path);if(cache.has(filename))return cache.get(filename);
 const mod=new Module(filename);mod.filename=filename;mod.paths=[resolve('node_modules')];
 const nativeRequire=mod.require.bind(mod);
 mod.require=name=>Object.hasOwn(dependencies,name)?dependencies[name]:name.endsWith('.module.css')?{__esModule:true,default:styles}:nativeRequire(name);
 mod._compile(ts.transpileModule(readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,filename);
 cache.set(filename,mod.exports);return mod.exports;
}
const peta=compile('src/lib/peta.ts');
const narrative=compile('src/lib/peta-narrative.ts');
const fixtures=compile('src/test/fixtures/peta.ts');
const sync=compile('src/lib/peta-answer-sync.ts',{'./peta':peta});
const {PetaReport}=compile('src/components/peta-report.tsx',{'@/lib/peta':peta,'@/lib/peta-narrative':narrative});
const icons=Object.fromEntries(['ArrowLeft','ArrowRight','Check','ChevronDown','Copy','RefreshCw','Search'].map(name=>[name,()=>React.createElement('svg',{'aria-hidden':true})]));
const {PetaJourney}=compile('src/components/peta-journey.tsx',{
 'next/link':({children,...props})=>React.createElement('a',props,children),'lucide-react':icons,
 './diagnosis-shell':{DiagnosisShell:({children})=>React.createElement('div',null,children)},
 './peta-report':{PetaReport},'@/lib/peta':peta,'@/lib/peta-answer-sync':sync,
});
const {PetaAdmin}=compile('src/components/peta-admin.tsx',{
 'next/link':({children,...props})=>React.createElement('a',props,children),'lucide-react':icons,
 '@/lib/supabase':{supabase:{auth:{getSession:async()=>({data:{session:{access_token:'synthetic-admin'}}})}}},
 '@/lib/peta':peta,'./peta-report':{PetaReport},'./program-share-card':{ProgramShareCard:()=>null},
});
const response=value=>Promise.resolve(new Response(JSON.stringify({success:true,...value}),{headers:{'Content-Type':'application/json'}}));
let checks=0;
function passed(name){checks++;console.log('PASS '+name);}
try{
 const report=fixtures.petaSyntheticReport,before=JSON.stringify(report);
 render(React.createElement(PetaReport,{report}));
 assert(screen.getByText('Hasil merupakan kecenderungan pribadi/tabiat, bukan ukuran kemampuan/kompetensi.'));
 assert(screen.getByText(/Berdasarkan pilihan Anda, kecenderungan untuk mengambil keputusan/));
 assert.equal(screen.getAllByRole('img').length,2);assert(screen.getByRole('table',{name:'Rincian angka pilihan'}));
 assert(!document.body.textContent.includes('1.0.0-pilot'));assert(!document.body.textContent.includes(report.participantCode));
 assert(!document.body.textContent.includes('Hasil pilot, bukan ukuran kompetensi.'));assert.equal(JSON.stringify(report),before);
 cleanup();passed('CEO disclaimer, one reflective narrative, two original charts, no technical version/ID');

 const nets=values=>({...report.result,rows:report.result.rows.map((row,i)=>({...row,net:values[i]}))});
 assert(narrative.petaNarrative(nets([0,0,0,0])).includes('Tidak ada satu kecenderungan yang paling menonjol'));
 assert(narrative.petaNarrative(nets([4,4,-4,-4])).includes('selisih pilihan tertinggi yang sama'));
 assert(narrative.petaNarrative(nets([2,1,-1,-2])).includes('Selisih dengan kecenderungan berikutnya tipis'));
 assert(narrative.petaNarrative(nets([-2,4,1,-3])).includes('bertukar gagasan'));
 assert(narrative.petaNarrative(nets([-2,1,4,-3])).includes('menjaga dukungan'));
 assert(narrative.petaNarrative(nets([-2,1,-3,4])).includes('memperhatikan ketelitian'));
 passed('narrative follows actual scores, preserves ties and qualifies close patterns');

 const session=fixtures.makePetaSession();for(const block of session.blocks.slice(0,23))session.answers[block.id]={most:'A',least:'B'};
 globalThis.fetch=async(_url,input)=>{
  if(input?.method==='PUT'){
   const answer=JSON.parse(input.body);session.answers[answer.blockId]={most:answer.most,least:answer.least};session.revision++;
  }
  return response({session,csrfToken:'c'.repeat(64)});
 };
 render(React.createElement(PetaJourney));
 const last=await screen.findByRole('heading',{name:session.blocks[23].context});assert(last.closest('[data-peta-question]'));
 fireEvent.click(screen.getByRole('radio',{name:'Paling sesuai dengan saya: '+session.blocks[23].options[0].text}));
 fireEvent.click(screen.getByRole('radio',{name:'Paling tidak sesuai dengan saya: '+session.blocks[23].options[1].text}));
 fireEvent.click(screen.getByRole('button',{name:'Tinjau jawaban'}));
 const first=screen.getByRole('heading',{name:'1. '+session.blocks[0].context}).closest('li');
 assert(within(first).getByText('Paling sesuai'));assert(within(first).getByText('Paling tidak sesuai'));
 assert(within(first).getByText(session.blocks[0].options[0].text));assert(within(first).getByText(session.blocks[0].options[1].text));
 assert.equal(within(first).queryByText(session.blocks[0].options[2].text),null);
 assert.equal(document.querySelectorAll('ol li').length,24);
 fireEvent.click(screen.getByRole('button',{name:'Ubah situasi 1'}));
 assert(screen.getByRole('heading',{name:session.blocks[0].context}).closest('[data-peta-question]'));
 assert(screen.getByRole('radio',{name:'Paling sesuai dengan saya: '+session.blocks[0].options[0].text}).checked);
 await waitFor(()=>assert(screen.getByRole('status').textContent.includes('Semua jawaban tersimpan')));
 cleanup();passed('situation precedes statements; review shows two selected texts and editing preserves choices');

 window.history.replaceState(null,'','/peta#invite='+'a'.repeat(64));
 globalThis.fetch=()=>response({invitation:{workspaceName:'Synthetic',retentionMonths:12,consultantAccess:true,consentVersion:'peta-privacy-v1',purpose:'start',expiresAt:null}});
 render(React.createElement(PetaJourney));await screen.findByRole('heading',{name:'Sebelum memulai'});
 assert(screen.getByText(/PETA \(Pemetaan Tabiat\) membantu Anda mengenali kecenderungan/));
 assert(screen.getByText(/Anda akan menanggapi 24 situasi kerja/));
 const instructions=screen.getByRole('heading',{name:'Petunjuk pengisian'}).nextElementSibling;
 assert.equal(instructions.tagName,'OL');assert.equal(instructions.children.length,5);
 assert(within(instructions).getByText('Kolom 1 — Paling sesuai:'));
 assert(within(instructions).getByText('Kolom 2 — Paling tidak sesuai:'));
 assert(within(instructions).getByText(/Tidak ada jawaban benar atau salah/));
 assert(screen.getByText(/Latihan tidak dihitung dalam hasil dan tidak disimpan/));
 assert.equal(screen.getAllByText('Hasil merupakan kecenderungan pribadi/tabiat, bukan ukuran kemampuan/kompetensi.').length,1);
 assert(!document.body.textContent.includes('1.0.0-pilot'));
 assert.equal(screen.getByRole('checkbox',{name:/Saya mengizinkan tim admin BinaHub/}).checked,false);
 assert.equal(screen.getByRole('button',{name:/Saya setuju dan lanjutkan/}).disabled,true);
 cleanup();passed('complete introduction/instructions/disclaimer coexist with separate unchecked consent');

 window.history.replaceState(null,'','/admin/peta');
 const dashboard={sourceReady:true,programs:[{id:'program',title:'Synthetic program',code:'SYN',status:'active',petaEnabled:true}],workspaces:[{id:'workspace',programId:'program',name:'Synthetic program',consultantAccess:true,privacyReference:'Synthetic internal policy'}],invitations:[],audit:[],sessions:[{id:'session',workspaceId:'workspace',participantCode:'SYN',status:'submitted',completedBlocks:24,canReadResult:true,reviewConsent:true,retentionUntil:report.retentionUntil,submittedAt:report.submittedAt,consentedAt:report.submittedAt,instrumentVersion:'1.0.0-pilot',consentVersion:'peta-privacy-v1'}]};
 globalThis.fetch=()=>response(dashboard);render(React.createElement(PetaAdmin));
 await screen.findByRole('button',{name:'Lihat hasil peserta'});
 assert(screen.getByText(/Semua admin BinaHub dapat mengelola pengisian PETA/));
 fireEvent.click(screen.getByRole('button',{name:'Pengaturan'}));
 assert.equal(screen.getByRole('checkbox',{name:/Aktifkan peninjauan hasil oleh tim admin/}).checked,true);
 cleanup();dashboard.sessions[0].canReadResult=false;dashboard.sessions[0].reviewConsent=false;
 render(React.createElement(PetaAdmin));await screen.findByText('Peserta belum memberikan izin untuk peninjauan hasil.');
 assert.equal(screen.queryByRole('button',{name:'Lihat hasil peserta'}),null);
 cleanup();passed('shared admin copy/settings match the contract; declined consent never offers a report');
 console.log(checks+' PETA UI integration checks passed. Synthetic DOM only, not browser layout verification.');
}finally{cleanup();dom.window.close();}
