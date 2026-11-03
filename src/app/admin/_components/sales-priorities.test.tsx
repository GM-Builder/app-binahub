import { act,fireEvent,render,screen,within } from '@testing-library/react';
import { afterEach,beforeEach,describe,expect,it,vi } from 'vitest';
import { salesTaskFixture as fixture,salesPrioritiesBody as body } from '@/test/fixtures/sales-priorities';
const mocks=vi.hoisted(()=>({fetch:vi.fn(),action:vi.fn(),refresh:vi.fn()}));
vi.mock('@/lib/api-fetch',()=>({apiFetch:mocks.fetch}));
vi.mock('./assessment-panel',()=>({AssessmentPanel:(props:{expandedId:string;initialDetailTab:string})=><p>Diagnosis {props.expandedId} · {props.initialDetailTab}</p>}));
vi.mock('./inquiries-panel',()=>({InquiriesPanel:(props:{initialSelectedId:string;onUnsavedChange?:(dirty:boolean)=>void})=><div><p>Inquiry {props.initialSelectedId}</p><button type="button" onClick={()=>props.onUnsavedChange?.(true)}>Ubah inquiry uji</button><button type="button" onClick={()=>props.onUnsavedChange?.(false)}>Simpan inquiry uji</button></div>}));
vi.mock('./pipeline-panel',()=>({PipelinePanel:(props:{initialSelectedId:string})=><p>Peluang {props.initialSelectedId}</p>}));
vi.mock('./acquisition-control-panel',()=>({AcquisitionControlPanel:()=><p>Kampanye</p>}));
vi.mock('./sales-follow-up-control',()=>({SalesFollowUpControl:()=><p>Kontrol tindak lanjut tidak diubah</p>}));
import { SalesWorkspace } from './sales-workspace';
const response=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status});
const params=(url:string)=>new URL(url,'https://test.invalid').searchParams;
const row=fixture(),old=fixture({name:'Arsip Tokyo %_*'});
function Harness(){return <SalesWorkspace serverMode onAction={mocks.action} onRefresh={mocks.refresh}/>;}
const ready=()=>screen.findByText('1–20 dari 41 tugas');
beforeEach(()=>{vi.resetAllMocks();mocks.fetch.mockImplementation((url:string)=>Promise.resolve(response(body([row],41,Number(params(url).get('page')||0)))));mocks.action.mockResolvedValue({success:true});});
afterEach(()=>vi.useRealTimers());
describe('server CRM priorities, no production services',()=>{
  it('starts independently of the general dashboard with exact global counts and bounded pages',async()=>{
    render(<Harness/>);await ready();expect(screen.getByText('121',{exact:true})).toBeVisible();expect(screen.getByText('31',{exact:true})).toBeVisible();
    expect(mocks.fetch).toHaveBeenCalledTimes(1);expect(mocks.fetch.mock.calls[0][0]).toContain('/api/admin/sales/priorities?');
    fireEvent.click(screen.getByRole('button',{name:'Berikutnya'}));await screen.findByText('21–40 dari 41 tugas');expect(params(mocks.fetch.mock.calls.at(-1)![0]).get('page')).toBe('1');expect(mocks.action).not.toHaveBeenCalled();
  });
  it('searches old literal matches, removes stale actions immediately and resets page when cleared',async()=>{
    render(<Harness/>);await ready();fireEvent.click(screen.getByRole('button',{name:'Berikutnya'}));await screen.findByText('21–40 dari 41 tugas');
    mocks.fetch.mockImplementation(()=>Promise.resolve(response(body([old],1))));fireEvent.change(screen.getByRole('searchbox'),{target:{value:'A,B %_* 東京'}});expect(screen.queryByRole('button',{name:'Buka proposal'})).not.toBeInTheDocument();
    await screen.findByText('1–1 dari 1 tugas');expect(Object.fromEntries(params(mocks.fetch.mock.calls.at(-1)![0]))).toMatchObject({page:'0',search:'A,B %_* 東京'});
    mocks.fetch.mockImplementation(()=>Promise.resolve(response(body())));fireEvent.change(screen.getByRole('searchbox'),{target:{value:''}});await ready();expect(screen.getByRole('button',{name:'Sebelumnya'})).toBeDisabled();
  });
  it('preserves kind and search through migration failure, never substitutes a zero or a healthy empty state',async()=>{
    render(<Harness/>);await ready();mocks.fetch.mockResolvedValueOnce(response({error:'SQL86 missing PRIVATE_DIAGNOSTIC'},503));
    fireEvent.click(screen.getByRole('button',{name:'Proposal'}));expect(await screen.findByRole('alert')).toHaveTextContent('SQL86');expect(screen.queryByText(/PRIVATE_DIAGNOSTIC/)).not.toBeInTheDocument();
    expect(screen.getByRole('button',{name:'Proposal'})).toHaveAttribute('aria-pressed','true');expect(screen.queryByText('Tidak ada prioritas yang menunggu di daftar ini')).not.toBeInTheDocument();
    expect(screen.getByText('Perlu ditangani').nextSibling).toHaveTextContent('—');
    fireEvent.click(screen.getByRole('button',{name:'Coba muat prioritas lagi'}));await ready();expect(params(mocks.fetch.mock.calls.at(-1)![0]).get('kind')).toBe('proposal');
  });
  it('uses server follow-up view and returns to a valid reset page',async()=>{
    render(<Harness/>);await ready();fireEvent.click(screen.getByRole('button',{name:'Berikutnya'}));await screen.findByText('21–40 dari 41 tugas');
    fireEvent.click(within(screen.getByRole('navigation',{name:'Workspace Akuisisi dan Penjualan'})).getByRole('button',{name:'Tindak lanjut'}));await ready();expect(Object.fromEntries(params(mocks.fetch.mock.calls.at(-1)![0]))).toMatchObject({view:'followup',kind:'all',page:'0'});
    expect(screen.getByText('Kontrol tindak lanjut tidak diubah')).toBeVisible();expect(mocks.action).not.toHaveBeenCalled();
  });
  it.each([
    ['proposal','proposal','Buka proposal','Diagnosis'],['assessment','summary','Periksa hasil','Diagnosis'],
    ['inquiry',undefined,'Tulis balasan','Inquiry'],['followup','followup','Tinjau tindak lanjut','Diagnosis'],['followup',undefined,'Tinjau tindak lanjut','Inquiry'],
    ['pipeline',undefined,'Buka peluang','Peluang'],
  ] as const)('opens %s/%s using the source ID and intended detail, with no send',async(kind,detail,action,label)=>{
    const task=fixture({kind,detail,action,id:kind+':'+row.recordId,view:kind==='pipeline'?'pipeline':'clients'});mocks.fetch.mockResolvedValueOnce(response(body([task],1)));
    render(<Harness/>);await screen.findByText('1–1 dari 1 tugas');fireEvent.click(screen.getByRole('button',{name:action}));
    expect(await screen.findByText(label+' '+row.recordId+(label==='Diagnosis'?' · '+detail:''))).toBeVisible();expect(mocks.action).not.toHaveBeenCalled();
  });
  it('keeps inquiry edits guarded on outer tabs and returns to refreshed priorities after saving',async()=>{
    const confirm=vi.spyOn(window,'confirm').mockReturnValue(false);
    mocks.fetch.mockResolvedValueOnce(response(body([fixture({kind:'inquiry',detail:undefined,action:'Tulis balasan'})],1)));render(<Harness/>);await screen.findByText('1–1 dari 1 tugas');
    fireEvent.click(screen.getByRole('button',{name:'Tulis balasan'}));await screen.findByText('Inquiry '+row.recordId);fireEvent.click(screen.getByRole('button',{name:'Ubah inquiry uji'}));
    fireEvent.click(screen.getByRole('button',{name:'Prioritas'}));expect(confirm).toHaveBeenCalled();expect(screen.getByText('Inquiry '+row.recordId)).toBeVisible();
    fireEvent.click(screen.getByRole('button',{name:'Simpan inquiry uji'}));fireEvent.click(screen.getByRole('button',{name:'Prioritas'}));await ready();confirm.mockRestore();
  });
  it('offers the existing consultation page instead of inventing an empty booking archive',async()=>{
    render(<Harness/>);await ready();fireEvent.click(screen.getByRole('button',{name:'Konsultasi'}));expect(await screen.findByRole('link',{name:'Buka jadwal konsultasi'})).toHaveAttribute('href','/admin/meetings');
    expect(mocks.fetch.mock.calls.every(call=>!call[0].includes('/dashboard'))).toBe(true);
  });
  it('ignores late responses from replaced filters even if cancellation is ignored',async()=>{
    let resolve:(value:Response)=>void=()=>{};mocks.fetch.mockImplementationOnce(()=>new Promise<Response>(done=>{resolve=done;}));render(<Harness/>);
    mocks.fetch.mockImplementation(()=>Promise.resolve(response(body([old],1))));fireEvent.click(screen.getByRole('button',{name:'Inquiry'}));await screen.findByText('1–1 dari 1 tugas');
    await act(async()=>resolve(response(body())));expect(screen.queryByText('Nadia Sintetis')).not.toBeInTheDocument();expect(screen.getByText('Arsip Tokyo %_*')).toBeVisible();
  });
  it('rejects a malformed action destination, and distinguishes no results from failed reads',async()=>{
    mocks.fetch.mockResolvedValueOnce(response(body([fixture({kind:'pipeline',view:'clients',detail:'proposal'})])));render(<Harness/>);await screen.findByRole('alert');expect(screen.queryByRole('button',{name:'Buka proposal'})).not.toBeInTheDocument();
    mocks.fetch.mockResolvedValueOnce(response(body([],0)));fireEvent.click(screen.getByRole('button',{name:'Coba muat prioritas lagi'}));await screen.findByText('0–0 dari 0 tugas');expect(screen.getByText('Tidak ada prioritas yang menunggu di daftar ini')).toBeVisible();
  });
  it('clamps an invalidated page to the new range',async()=>{
    render(<Harness/>);await ready();mocks.fetch.mockImplementation((url:string)=>Promise.resolve(response(body([],0,Number(params(url).get('page')||0)))));
    fireEvent.click(screen.getByRole('button',{name:'Berikutnya'}));await screen.findByText('0–0 dari 0 tugas');expect(params(mocks.fetch.mock.calls.at(-1)![0]).get('page')).toBe('0');
  });
  it('retries a timeout and invalidates old rows during manual refresh',async()=>{
    vi.useFakeTimers();mocks.fetch.mockImplementation(()=>new Promise(()=>{}));render(<Harness/>);await act(async()=>{await vi.advanceTimersByTimeAsync(20001);});expect(screen.getByRole('alert')).toHaveTextContent('terlalu lama');
    mocks.fetch.mockImplementation(()=>Promise.resolve(response(body())));await act(async()=>fireEvent.click(screen.getByRole('button',{name:'Coba muat prioritas lagi'})));expect(screen.getByText('1–20 dari 41 tugas')).toBeVisible();
    mocks.fetch.mockImplementation(()=>new Promise(()=>{}));fireEvent.click(screen.getByRole('button',{name:'Perbarui prioritas'}));expect(screen.queryByRole('button',{name:'Buka proposal'})).not.toBeInTheDocument();
    expect(within(screen.getByRole('navigation',{name:'Workspace Akuisisi dan Penjualan'})).getByRole('button',{name:'Prioritas'})).toBeVisible();
  });
});
