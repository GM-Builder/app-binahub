import { cleanup,fireEvent,render,screen,waitFor } from '@testing-library/react';
import { afterEach,beforeEach,describe,expect,it,vi } from 'vitest';
const mock=vi.hoisted(()=>({session:vi.fn(),fetch:vi.fn()}));
vi.mock('@/lib/supabase',()=>({supabase:{auth:{getSession:mock.session}}}));
import { IndividualAssessment,PEResult } from './individual-assessment';
import type { PEDefinition,PEReport } from '@/lib/individual-assessment';
const userId='00000000-0000-4000-8000-000000000001';
const definition:PEDefinition={policyId:'test',consentVersion:'test',privacyVersion:'test',notice:'For development.',privacyNotice:'Private result.',
  competencies:[{code:'PE-02',name:'Self-Development',definition:'Synthetic definition'}],
  selfReportItems:[{id:'SR05',competencyCode:'PE-02',type:'behavioral_self_report',prompt:'Synthetic self report question'}],
  sjtItems:[{id:'SJ03',competencyCode:'PE-02',type:'situational_judgment',scenario:'Synthetic scenario',question:'Synthetic case question',options:[{id:'A',text:'Synthetic action A'},{id:'B',text:'Synthetic action B'}]}],
  selfReportScale:[{value:4,label:'Sering'},{value:'NA',label:'Tidak ada kesempatan relevan'}]};
const report:PEReport={goal:'Growth',methodology:'Separate evidence.',priorityExplanation:'Context first.',notice:'Development use.',
  areas:[{code:'PE-02',name:'Self-Development',definition:'Synthetic definition',relevance:'high',
    selfReport:{score:null,validCount:0,naCount:4,status:'insufficient_evidence'},sjt:{score:0,validCount:2,status:'scored'},practice:null}],priorities:[]};
const response=(body:unknown,status=200)=>new Response(JSON.stringify({success:true,...body as object}),{status});
beforeEach(()=>{vi.clearAllMocks();localStorage.clear();vi.stubGlobal('fetch',mock.fetch);
  mock.session.mockResolvedValue({data:{session:{user:{id:userId},access_token:'verified'}}});
  mock.fetch.mockResolvedValue(response({definition}));vi.stubGlobal('scrollTo',vi.fn());});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
describe('individual diagnosis UI',()=>{
  it('provides a safe sign-in return path without exposing questions to a signed-out visitor',async()=>{
    mock.session.mockResolvedValue({data:{session:null}});render(<IndividualAssessment/>);
    const signIn=await screen.findByRole('link',{name:/Masuk dan mulai/});
    expect(signIn).toHaveAttribute('href','/?mode=signin&next=%2Finsight%2Findividual');
    expect(mock.fetch).not.toHaveBeenCalled();
  });
  it('requires context and consent, saves choices, reviews, submits once, and shows a private result',async()=>{
    let attempt={id:'00000000-0000-4000-8000-000000000002',status:'draft',revision:0,responses:{} as Record<string,unknown>,
      context:{role:'Manager',goal:'Growth',relevance:{'PE-02':'normal','PE-04':'normal','PE-06':'normal'}},
      retentionUntil:'2027-04-13T00:00:00Z',submittedAt:null as string|null};
    mock.fetch.mockImplementation(async(url:string,options?:RequestInit)=>{
      if(options?.method==='POST')return response({attempt});
      if(options?.method==='PATCH'){
        const body=JSON.parse(options.body as string);attempt={...attempt,responses:body.responses,revision:attempt.revision+1,
          status:body.submissionKey?'submitted':'draft',submittedAt:body.submissionKey?'2026-10-13T00:00:00Z':null};
        return response({attempt});
      }
      return response(url.endsWith('/individual')?{definition}:{attempt,report});
    });
    render(<IndividualAssessment/>);await screen.findByText('Peran atau pekerjaan Anda');
    expect(screen.getByRole('button',{name:/Mulai 18 soal/})).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Peran atau pekerjaan Anda'),{target:{value:'Manager'}});
    fireEvent.change(screen.getByLabelText('Apa yang ingin Anda kembangkan?'),{target:{value:'Growth'}});
    fireEvent.click(screen.getByRole('checkbox'));fireEvent.click(screen.getByRole('button',{name:/Mulai 18 soal/}));
    await screen.findByText('Synthetic self report question');fireEvent.click(screen.getByLabelText('Sering'));
    await waitFor(()=>expect(screen.getByRole('button',{name:'Lanjut'})).toBeEnabled());fireEvent.click(screen.getByRole('button',{name:'Lanjut'}));
    await screen.findByText('Synthetic case question');fireEvent.click(screen.getByLabelText('Synthetic action A'));
    await waitFor(()=>expect(screen.getByRole('button',{name:'Tinjau jawaban'})).toBeEnabled());fireEvent.click(screen.getByRole('button',{name:'Tinjau jawaban'}));
    fireEvent.click(screen.getByRole('button',{name:/Kirim dan lihat hasil/}));
    await screen.findByText('Hasil asesmen individu');
    expect(mock.fetch.mock.calls.filter(([,args])=>args?.method==='PATCH'&&JSON.parse(args.body).submissionKey)).toHaveLength(1);
    const stored=localStorage.getItem(`binahub.pe.attempt.${userId}`);expect(stored).toBeTruthy();
    expect(stored).not.toMatch(/responses|Manager|Growth/);
  });
  it('resumes a saved attempt and exposes a clear recovery action on revision conflict',async()=>{
    localStorage.setItem(`binahub.pe.attempt.${userId}`,'00000000-0000-4000-8000-000000000002');
    const attempt={id:'00000000-0000-4000-8000-000000000002',status:'draft',revision:1,responses:{SR05:4},context:{role:'Manager',goal:'Growth',relevance:{}},retentionUntil:'2027-04-13T00:00:00Z'};
    mock.fetch.mockImplementation(async(url:string,opts?:RequestInit)=>opts?.method==='PATCH'?
      new Response(JSON.stringify({success:false,code:'PE_REVISION_CONFLICT',error:'Draft berubah di tab lain.'}),{status:409}):
      response(url.endsWith('/individual')?{definition}:{attempt,report:null}));
    render(<IndividualAssessment/>);await screen.findByText('Synthetic case question');fireEvent.click(screen.getByLabelText('Synthetic action A'));
    await screen.findByText('Draft berubah di tab lain.');expect(screen.getByRole('button',{name:'Muat draft terbaru'})).toBeEnabled();
  });
  it('shows legitimate zero differently from insufficient evidence and does not claim percent mastery',()=>{
    render(<PEResult report={report} retentionUntil="2027-04-13T00:00:00Z"/>);
    expect(screen.getByRole('img',{name:'Self-Development, Pengalaman kerja: bukti belum cukup'})).toBeVisible();
    expect(screen.getByRole('img',{name:'Self-Development, Studi kasus: 0 dari 100'})).toBeVisible();
    fireEvent.click(screen.getByText('Rincian Self-Development'));
    expect(screen.getByText('Bukti belum cukup untuk menampilkan skor.')).toBeVisible();
  });
});
