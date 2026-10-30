import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
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
