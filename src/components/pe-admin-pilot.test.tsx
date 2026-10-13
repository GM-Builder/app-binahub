import { render,screen,fireEvent,waitFor,cleanup } from '@testing-library/react';
import { afterEach,beforeEach,describe,it,expect,vi } from 'vitest';
const deps=vi.hoisted(()=>({session:vi.fn(),fetch:vi.fn()}));
vi.mock('@/lib/supabase',()=>({supabase:{auth:{getSession:deps.session}}}));
import { PEAdminPilot } from './pe-admin-pilot';
import { PEReviewAccessPanel } from './pe-review-access';
import { PEHistoryPage } from './pe-history';
const id='00000000-0000-4000-8000-000000000001';
const dashboard={status:'collecting',revision:0,ready:true,counts:{started:1,submitted:1,drafts:0,shared:1},evaluationSampleSize:0,minimumAggregateSize:5,
  areas:[],feedback:{count:0,clarityMean:null,usefulnessMean:null},interpretation:'development_pilot_not_validated'};
const cases=[{id,status:'submitted',createdAt:'2026-10-13T00:00:00Z',role:'Synthetic Manager',goal:'Improve teamwork',channel:'instagram'}];
const response=(body:unknown)=>new Response(JSON.stringify({success:true,...body as object}));
beforeEach(()=>{vi.clearAllMocks();deps.session.mockResolvedValue({data:{session:{user:{id},access_token:'synthetic'}}});
  deps.fetch.mockResolvedValue(response({dashboard,cases}));vi.stubGlobal('fetch',deps.fetch);});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
describe('PE admin, owner access, and history',()=>{
  it('separates audience and shows contextual cases only from authorized response',async()=>{
    render(<PEAdminPilot/>);await screen.findByText('Synthetic Manager');
    expect(screen.getByRole('link',{name:'Tim / Organisasi'})).toHaveAttribute('href','/admin/assessments');
    expect(screen.getByText('Improve teamwork')).toBeVisible();
    fireEvent.change(screen.getByLabelText('Cari konteks atau sumber'),{target:{value:'no match'}});
    expect(screen.queryByText('Synthetic Manager')).not.toBeInTheDocument();
  });
  it('pauses once with server revision and explains protected small-cohort statistics',async()=>{
    deps.fetch.mockImplementation(async(_url,opts)=>response(opts?.method==='PATCH'?{dashboard:{...dashboard,status:'paused',revision:1}}:{dashboard,cases}));
    render(<PEAdminPilot/>);await screen.findByText('Synthetic Manager');fireEvent.click(screen.getByRole('tab',{name:'Evaluasi pilot'}));
    expect(screen.getByText(/Statistik skor belum ditampilkan/)).toBeVisible();
    fireEvent.click(screen.getByRole('button',{name:'Jeda pengisian baru'}));
    await screen.findByRole('button',{name:'Lanjutkan pengisian baru'});
    expect(deps.fetch.mock.calls.filter(([,opts])=>opts?.method==='PATCH')).toHaveLength(1);
    expect(JSON.parse(deps.fetch.mock.calls.find(([,opts])=>opts?.method==='PATCH')![1].body)).toEqual({status:'paused',revision:0});
  });
  it('revokes consultant access without deleting data or adding evaluation consent',async()=>{
    const change=vi.fn();deps.fetch.mockResolvedValue(response({access:{shared:false,evaluationConsent:false,clarity:null,usefulness:null}}));
    render(<PEReviewAccessPanel id={id} token={async()=>'verified'} onChange={change} access={{shared:true,evaluationConsent:false,clarity:null,usefulness:null}}/>);
    fireEvent.click(screen.getByRole('button',{name:'Cabut akses tim BinaHub'}));
    await waitFor(()=>expect(change).toHaveBeenCalled());
    expect(JSON.parse(deps.fetch.mock.calls[0][1].body)).toMatchObject({share:false,consentVersion:null,evaluate:false});
  });
  it('opens owner-scoped history without caching answers or embedding them in links',async()=>{
    deps.fetch.mockResolvedValue(response({history:[{id,status:'submitted',createdAt:'2026-10-13T00:00:00Z',answeredCount:18,retentionUntil:'2027-04-13T00:00:00Z'}]}));
    render(<PEHistoryPage/>);const link=await screen.findByRole('link',{name:/Hasil pengembangan pribadi/});
    expect(link).toHaveAttribute('href',`/insight/individual?attempt=${id}`);
    expect(deps.fetch.mock.calls[0][0]).toBe('/api/assessment/individual/history');
  });
});
