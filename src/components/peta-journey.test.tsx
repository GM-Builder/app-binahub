import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {PetaJourney,PetaSelector} from './peta-journey';
import {PetaReport} from './peta-report';
import {makePetaSession,petaSyntheticReport} from '@/test/fixtures/peta';
const response=(body:unknown,status=200)=>Promise.resolve(new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}}));
beforeEach(()=>{window.history.replaceState(null,'','/peta');vi.stubGlobal('fetch',vi.fn());});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
describe('PETA participant UX',()=>{
 it('offers no uninvited start and no participant login form',async()=>{vi.mocked(fetch).mockImplementation(()=>response({success:false,code:'PETA_SESSION_REQUIRED',error:'Sesi berakhir'},401));render(<PetaJourney/>);expect(await screen.findByRole('heading',{name:'PETA tersedia melalui undangan.'})).toBeVisible();expect(screen.queryByRole('button',{name:'Mulai PETA'})).not.toBeInTheDocument();expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();});
 it('removes invitation from address, requires consent and never preselects consultant access',async()=>{
  window.history.replaceState(null,'','/peta#invite='+'a'.repeat(64));vi.mocked(fetch).mockImplementation(()=>response({success:true,invitation:{workspaceName:'Synthetic',privacyReference:'Synthetic policy',retentionMonths:12,consultantAccess:true,consentVersion:'peta-privacy-v1',purpose:'start',expiresAt:'2026-12-01T00:00:00Z'}}));render(<PetaJourney/>);await screen.findByRole('heading',{name:'Sebelum memulai'});expect(window.location.hash).toBe('');expect(screen.getByRole('button',{name:/Saya setuju dan lanjutkan/})).toBeDisabled();expect(screen.getAllByRole('checkbox').every(box=>!(box as HTMLInputElement).checked)).toBe(true);expect(document.body.textContent).not.toMatch(/Synthetic policy|peta-privacy-v1|Acuan pemberitahuan/);expect(screen.getByText('Penggunaan data dan hasil Anda')).toBeVisible();fireEvent.click(screen.getByLabelText(/Saya telah membaca/));expect(screen.getByRole('button',{name:/Saya setuju dan lanjutkan/})).toBeEnabled();
 });
 it('prevents most/least duplication with labelled native radios',()=>{const block=makePetaSession().blocks[0],change=vi.fn();render(<PetaSelector block={block} pair={{most:'A',least:null}} onChange={change}/>);expect(screen.getByRole('radio',{name:'Paling kurang sesuai dengan saya: '+block.options[0].text})).toBeDisabled();fireEvent.click(screen.getByRole('radio',{name:'Paling kurang sesuai dengan saya: '+block.options[1].text}));expect(change).toHaveBeenCalledWith({most:'A',least:'B'});});
 it('moves to the next situation while the answer request is still pending',async()=>{
  const s=makePetaSession();s.answers[s.blocks[0].id]={most:'A',least:'B'};let finish!:(value:Response)=>void;
  vi.mocked(fetch).mockImplementation((_url,init)=>init?.method==='PUT'?new Promise<Response>(r=>{finish=r;}):response({success:true,session:s,csrfToken:'c'.repeat(64)}));
  render(<PetaJourney/>);const b=s.blocks[1];fireEvent.click(await screen.findByRole('radio',{name:'Paling sesuai dengan saya: '+b.options[0].text}));fireEvent.click(screen.getByRole('radio',{name:'Paling kurang sesuai dengan saya: '+b.options[1].text}));
  fireEvent.click(screen.getByRole('button',{name:'Lanjut'}));
  expect(await screen.findByRole('heading',{name:s.blocks[2].context})).toBeVisible();expect(screen.getByRole('status')).toHaveTextContent('latar belakang');
  finish(new Response(JSON.stringify({success:true,session:{...s,revision:1,answers:{...s.answers,[b.id]:{most:'A',least:'B'}}}})));await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('Semua jawaban tersimpan.'));
 });
 it('keeps selected choices when save fails and never claims the answer was saved',async()=>{
  const s=makePetaSession();s.answers[s.blocks[0].id]={most:'A',least:'B'};vi.mocked(fetch).mockImplementation((_url,init)=>init?.method==='PUT'?response({success:false,code:'PETA_UNAVAILABLE',error:'Jawaban belum tersimpan.'},503):response({success:true,session:s,csrfToken:'c'.repeat(64)}));render(<PetaJourney/>);const option=s.blocks[1].options[2];fireEvent.click(await screen.findByRole('radio',{name:'Paling sesuai dengan saya: '+option.text}));await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('Jawaban belum tersimpan.'));expect(screen.getByRole('radio',{name:'Paling sesuai dengan saya: '+option.text})).toBeChecked();expect(screen.getByRole('status')).not.toHaveTextContent('Semua jawaban tersimpan');
 });
 it('waits for pending answers at final submission, not at Next',async()=>{
  const s=makePetaSession();for(const block of s.blocks.slice(0,23))s.answers[block.id]={most:'A',least:'B'};
  let complete!:(value:Response)=>void;let submitted=false;
  vi.mocked(fetch).mockImplementation((url,init)=>{
   if(init?.method==='PUT')return new Promise<Response>(r=>{complete=r;});
   if(String(url).endsWith('/submit')){submitted=true;return response({success:false,error:'Synthetic stop before result'},503);}
   return response({success:true,session:s,csrfToken:'c'.repeat(64)});
  });
  render(<PetaJourney/>);await screen.findByRole('heading',{name:s.blocks[23].context});
  fireEvent.click(screen.getAllByRole('radio')[0]);fireEvent.click(screen.getAllByRole('radio')[3]);fireEvent.click(screen.getByRole('button',{name:'Tinjau jawaban'}));
  fireEvent.click(screen.getByLabelText('Saya memahami bahwa pilihan akan terkunci setelah dikirim.'));fireEvent.click(screen.getByRole('button',{name:'Kirim dan lihat hasil'}));expect(submitted).toBe(false);
  complete(new Response(JSON.stringify({success:true,session:{...s,revision:1,answers:{...s.answers,[s.blocks[23].id]:{most:'A',least:'B'}}}})));
  await waitFor(()=>expect(submitted).toBe(true));
 });
 it('shows both required charts and exact numbers, without percent scores or hidden keys',()=>{render(<PetaReport report={petaSyntheticReport}/>);expect(screen.getAllByRole('img')).toHaveLength(2);expect(screen.getByRole('table',{name:'Rincian angka pilihan'})).toBeVisible();expect(screen.getByRole('heading',{level:1})).toHaveFocus();expect(screen.getByText('-24')).toBeVisible();expect(screen.getByText('+24')).toBeVisible();expect(document.body.textContent).not.toMatch(/\d+%|qualityFlags|optionToDimension/);});
 it('renders true zero net/count widths, not decorative minimum bars',()=>{render(<PetaReport report={petaSyntheticReport}/>);expect(document.querySelector('[data-net="0"]')).toHaveAttribute('width','0');expect(document.querySelector('[data-count="0"]')).toHaveAttribute('width','0');});
});
