import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor,within} from '@testing-library/react';
vi.mock('@/lib/supabase',()=>({supabase:{auth:{getSession:async()=>({data:{session:{access_token:'synthetic-admin-token'}}})}}}));
vi.mock('./program-share-card',()=>({ProgramShareCard:()=>null}));
import {PetaAdmin} from './peta-admin';
import {petaSyntheticReport} from '@/test/fixtures/peta';
beforeEach(()=>vi.stubGlobal('fetch',vi.fn()));
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
function serve(canReadResult:boolean,reviewConsent:boolean){
 const dashboard={sourceReady:true,programs:[],workspaces:[],invitations:[],audit:[],sessions:[{id:'synthetic-session',workspaceId:'synthetic-workspace',participantCode:'SYNTHETIC',status:'submitted',completedBlocks:24,retentionUntil:petaSyntheticReport.retentionUntil,submittedAt:petaSyntheticReport.submittedAt,canReadResult,reviewConsent,instrumentVersion:'1.0.0-pilot',consentVersion:'peta-privacy-v1',consentedAt:petaSyntheticReport.submittedAt}]};
 vi.mocked(fetch).mockImplementation((_url,init)=>Promise.resolve(new Response(JSON.stringify(init?.method==='POST'?{success:true,report:petaSyntheticReport}:{success:true,...dashboard}),{status:200,headers:{'Content-Type':'application/json'}})));
}
describe('PETA admin review wording and unchanged access gating',()=>{
 it('shows the plain result action only for a permitted response',async()=>{
  serve(true,true);render(<PetaAdmin/>);const action=await screen.findByRole('button',{name:'Lihat hasil peserta'});
  expect(screen.queryByRole('button',{name:'Buka hasil berizin'})).not.toBeInTheDocument();fireEvent.click(action);
  expect(await screen.findByRole('heading',{name:'Peta preferensi perilaku kerja Anda'})).toBeVisible();
  await waitFor(()=>expect(vi.mocked(fetch).mock.calls.some(([,init])=>init?.body===JSON.stringify({id:'synthetic-session',action:'result',verified:false}))).toBe(true));
 });
 it('explains missing participant permission without offering a result action',async()=>{
  serve(false,false);render(<PetaAdmin/>);expect(await screen.findByText('Peserta belum memberikan izin untuk peninjauan hasil.')).toBeVisible();expect(screen.queryByRole('button',{name:'Lihat hasil peserta'})).not.toBeInTheDocument();
 });
 it('distinguishes a different assigned admin from a participant who declined',async()=>{
  serve(false,true);render(<PetaAdmin/>);expect(await screen.findByText('Hasil hanya dapat dilihat oleh admin pendamping yang ditetapkan untuk peserta ini.')).toBeVisible();expect(screen.queryByText('Peserta belum memberikan izin untuk peninjauan hasil.')).not.toBeInTheDocument();expect(screen.queryByRole('button',{name:'Lihat hasil peserta'})).not.toBeInTheDocument();
 });
});

const programs=[{id:'program-a',title:'Pengembangan Tim A',code:'TEAM-A',status:'active',petaEnabled:true},{id:'program-b',title:'Pengembangan Tim B',code:'TEAM-B',status:'active',petaEnabled:true}];
function servePrograms(overrides:Record<string,unknown>={}){
 const dashboard={sourceReady:true,programs,workspaces:programs.map(p=>({id:'workspace-'+p.id,programId:p.id,name:p.title,privacyReference:'Kebijakan internal program sintetis',consultantAccess:true})),invitations:[],audit:[],sessions:[
  {id:'session-a',workspaceId:'workspace-program-a',programId:'program-a',participantCode:'CODE-A',participantName:'Ayu Sintetis',status:'submitted',completedBlocks:24,retentionUntil:petaSyntheticReport.retentionUntil,submittedAt:petaSyntheticReport.submittedAt,canReadResult:true,reviewConsent:true,instrumentVersion:'1.0.0-pilot',consentVersion:'peta-privacy-v1',consentedAt:petaSyntheticReport.submittedAt},
  {id:'session-b',workspaceId:'workspace-program-b',programId:'program-b',participantCode:'CODE-B',participantName:'Budi Sintetis',status:'in_progress',completedBlocks:8,retentionUntil:petaSyntheticReport.retentionUntil,submittedAt:null,canReadResult:false,reviewConsent:false,instrumentVersion:'1.0.0-pilot',consentVersion:'peta-privacy-v1',consentedAt:petaSyntheticReport.submittedAt},
 ],...overrides};
 vi.mocked(fetch).mockImplementation((_url,init)=>Promise.resolve(new Response(JSON.stringify(init?.method==='POST'?{success:true,report:petaSyntheticReport}:{success:true,...dashboard}),{status:200,headers:{'Content-Type':'application/json'}})));
}
describe('PETA admin task workspace',()=>{
 it('does not label a draft program as available to participants',async()=>{
  servePrograms({programs:[{...programs[0],status:'draft'}]});render(<PetaAdmin/>);
  expect(await screen.findByText('Program belum aktif',{exact:true})).toBeVisible();expect(screen.queryByText('Siap digunakan',{exact:true})).not.toBeInTheDocument();
 });
 it('retains unsaved program settings if changing program is cancelled',async()=>{
  servePrograms();const confirm=vi.spyOn(window,'confirm').mockReturnValue(false);render(<PetaAdmin/>);await screen.findByRole('heading',{name:'Ayu Sintetis'});
  fireEvent.change(screen.getByRole('combobox',{name:'Program'}),{target:{value:'program-a'}});fireEvent.click(screen.getByRole('button',{name:'Pengaturan'}));
  fireEvent.change(screen.getByRole('textbox',{name:'Acuan pemberitahuan privasi'}),{target:{value:'Perubahan yang belum disimpan'}});
  fireEvent.change(screen.getByRole('combobox',{name:'Program'}),{target:{value:'program-b'}});
  expect(confirm).toHaveBeenCalled();expect(screen.getByRole('combobox',{name:'Program'})).toHaveValue('program-a');expect(screen.getByRole('textbox',{name:'Acuan pemberitahuan privasi'})).toHaveValue('Perubahan yang belum disimpan');confirm.mockRestore();
 });
 it('starts with participant management, scopes one program picker, and resets search on a program change',async()=>{
  servePrograms();render(<PetaAdmin/>);await screen.findByRole('heading',{name:'Ayu Sintetis'});
  expect(screen.queryByRole('textbox',{name:'Acuan pemberitahuan privasi'})).not.toBeInTheDocument();
  expect(screen.getAllByRole('combobox',{name:'Program'})).toHaveLength(1);
  fireEvent.change(screen.getByRole('searchbox'),{target:{value:'Ayu'}});expect(screen.queryByRole('heading',{name:'Budi Sintetis'})).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox',{name:'Program'}),{target:{value:'program-b'}});
  expect(screen.getByRole('searchbox')).toHaveValue('');expect(screen.getByRole('heading',{name:'Budi Sintetis'})).toBeVisible();expect(screen.queryByRole('heading',{name:'Ayu Sintetis'})).not.toBeInTheDocument();
 });
 it('preserves program/search filters and restores heading focus when returning from an identified participant result',async()=>{
  servePrograms();render(<PetaAdmin/>);await screen.findByRole('heading',{name:'Ayu Sintetis'});
  fireEvent.change(screen.getByRole('combobox',{name:'Program'}),{target:{value:'program-a'}});
  fireEvent.change(screen.getByRole('searchbox'),{target:{value:'Ayu'}});fireEvent.click(screen.getByRole('button',{name:'Lihat hasil peserta'}));
  expect(await screen.findByRole('heading',{name:'Hasil Ayu Sintetis'})).toBeVisible();expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Kembali ke daftar peserta'}));expect(screen.getByRole('searchbox')).toHaveValue('Ayu');expect(screen.getByRole('combobox',{name:'Program'})).toHaveValue('program-a');
  expect(screen.getByRole('heading',{name:'Pengisian peserta'})).toHaveFocus();
 });
 it('shows an actionable empty filter without pretending participants do not exist',async()=>{
  servePrograms();render(<PetaAdmin/>);await screen.findByRole('heading',{name:'Ayu Sintetis'});
  fireEvent.change(screen.getByRole('searchbox'),{target:{value:'tidak-ada'}});expect(screen.getByRole('heading',{name:'Peserta tidak ditemukan'})).toBeVisible();
  fireEvent.click(screen.getByRole('button',{name:'Hapus pencarian dan filter'}));expect(screen.getByRole('heading',{name:'Ayu Sintetis'})).toBeVisible();
 });
 it('hides destructive actions behind participant management and does not send an erase request after cancellation',async()=>{
  servePrograms();vi.spyOn(window,'prompt').mockReturnValue(null);render(<PetaAdmin/>);
  const row=(await screen.findByRole('heading',{name:'Ayu Sintetis'})).closest('li')!;
  expect(within(row).getByText('Hapus data PETA')).not.toBeVisible();fireEvent.click(within(row).getByText('Kelola peserta'));
  fireEvent.click(within(row).getByRole('button',{name:'Hapus data PETA'}));expect(vi.mocked(fetch).mock.calls.every(([,init])=>init?.method!=='POST')).toBe(true);
  vi.restoreAllMocks();
 });
 it('blocks sharing before setup and keeps the existing settings payload and explicit approval',async()=>{
  servePrograms({workspaces:[]});render(<PetaAdmin/>);await screen.findByRole('heading',{name:'Ayu Sintetis'});
  fireEvent.change(screen.getByRole('combobox',{name:'Program'}),{target:{value:'program-a'}});fireEvent.click(screen.getByRole('button',{name:'Akses peserta'}));
  expect(screen.getByRole('heading',{name:'Siapkan PETA sebelum membagikan akses'})).toBeVisible();fireEvent.click(screen.getByRole('button',{name:'Buka pengaturan PETA'}));
  expect(screen.getByRole('button',{name:'Simpan pengaturan PETA'})).toBeDisabled();
  fireEvent.change(screen.getByRole('textbox',{name:'Acuan pemberitahuan privasi'}),{target:{value:'Kebijakan internal sintetis'}});
  fireEvent.click(screen.getByLabelText(/Tetapkan akun admin saya/));fireEvent.click(screen.getByLabelText(/Saya memastikan hak penggunaan/));fireEvent.click(screen.getByRole('button',{name:'Simpan pengaturan PETA'}));
  await waitFor(()=>expect(vi.mocked(fetch).mock.calls.some(([,init])=>init?.body===JSON.stringify({programId:'program-a',privacyReference:'Kebijakan internal sintetis',consultantAccess:true,privacyApproved:true,contentRightsConfirmed:true,pilotAcknowledged:true}))).toBe(true));
 });
 it('recovers an initial load error without losing the retry control',async()=>{
  vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({success:false,error:'Connexion indisponible'}),{status:503}));render(<PetaAdmin/>);
  expect(await screen.findByRole('alert')).toHaveTextContent('Connexion indisponible');servePrograms();fireEvent.click(screen.getByRole('button',{name:'Muat ulang data'}));expect(await screen.findByRole('heading',{name:'Ayu Sintetis'})).toBeVisible();expect(screen.queryByRole('alert')).not.toBeInTheDocument();
 });
});
