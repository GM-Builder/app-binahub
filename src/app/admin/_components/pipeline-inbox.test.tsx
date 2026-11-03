import { useState } from 'react';
import { act,fireEvent,render,screen,waitFor,within } from '@testing-library/react';
import { afterEach,beforeEach,describe,expect,it,vi } from 'vitest';
import { PipelinePanel } from './pipeline-panel';
import { pipelineInboxFixture as fixture,pipelineInboxBody as body,pipelineDetailBody as detail } from '@/test/fixtures/pipeline-inbox';
const mocks=vi.hoisted(()=>({fetch:vi.fn(),action:vi.fn(),refresh:vi.fn(),dirty:vi.fn()}));
vi.mock('@/lib/api-fetch',()=>({apiFetch:mocks.fetch}));
const row=fixture(),old=fixture({name:'Arsip Tokyo %_*',createdAt:'2020-01-01T03:00:00Z'});
const response=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status});
const params=(url:string)=>new URL(url,'https://test.invalid').searchParams;
function Harness(){const[refreshToken,setRefreshToken]=useState(0);return <><button type="button" onClick={()=>setRefreshToken(value=>value+1)}>Perbarui semua</button><PipelinePanel serverMode refreshToken={refreshToken} onAction={mocks.action} onRefresh={mocks.refresh} onUnsavedChange={mocks.dirty}/></>;}
beforeEach(()=>{vi.resetAllMocks();mocks.action.mockResolvedValue({success:true});mocks.refresh.mockResolvedValue(undefined);
  mocks.fetch.mockImplementation((url:string)=>Promise.resolve(response(params(url).has('id')?detail(row,Number(params(url).get('historyPage')||0)):body([row],41,Number(params(url).get('page')||0)))));
});
afterEach(()=>vi.useRealTimers());
const ready=()=>screen.findByText('1–20 dari 41 peluang');
const open=async()=>{fireEvent.click(screen.getByRole('button',{name:'Buka detail peluang Peluang Sintetis'}));return screen.findByRole('button',{name:'Ubah peluang'});};
describe('server pipeline archive and scoped detail',()=>{
  it('reads server totals, independent stage counts and pages20, without the general dashboard',async()=>{
    render(<Harness/>);await ready();expect(screen.getByRole('button',{name:'Berhasil 9'})).toBeVisible();
    expect(within(screen.getByRole('region',{name:'Tahap Terkualifikasi'})).getByText('41',{exact:true})).toBeVisible();
    expect(mocks.fetch).toHaveBeenCalledTimes(1);expect(mocks.fetch.mock.calls[0][0]).toContain('/pipeline/inbox?');
    fireEvent.click(screen.getByRole('button',{name:'Berikutnya'}));await screen.findByText('21–40 dari 41 peluang');expect(params(mocks.fetch.mock.calls.at(-1)![0]).get('page')).toBe('1');expect(mocks.action).not.toHaveBeenCalled();
  });
  it('finds old literal matches, hides stale rows, resets page when the search is cleared',async()=>{
    render(<Harness/>);await ready();fireEvent.click(screen.getByRole('button',{name:'Berikutnya'}));await screen.findByText('21–40 dari 41 peluang');
    mocks.fetch.mockImplementation(()=>Promise.resolve(response(body([old],1))));fireEvent.change(screen.getByRole('searchbox'),{target:{value:'A,B %_* 東京'}});
    expect(screen.queryByRole('button',{name:'Buka detail peluang Peluang Sintetis'})).not.toBeInTheDocument();await screen.findByText('1–1 dari 1 peluang');
    expect(Object.fromEntries(params(mocks.fetch.mock.calls.at(-1)![0]))).toMatchObject({search:'A,B %_* 東京',page:'0'});
    mocks.fetch.mockImplementation(()=>Promise.resolve(response(body())));fireEvent.change(screen.getByRole('searchbox'),{target:{value:''}});await ready();expect(screen.getByRole('button',{name:'Sebelumnya'})).toBeDisabled();
  });
  it('passes filters and sort server-side while keeping selection through a failure',async()=>{
    render(<Harness/>);await ready();fireEvent.click(screen.getByRole('button',{name:'Filter'}));
    fireEvent.change(screen.getByRole('combobox',{name:'Filter penanggung jawab'}),{target:{value:'admin@company.invalid'}});await ready();
    fireEvent.change(screen.getByRole('combobox',{name:'Filter sumber peluang'}),{target:{value:'manual_upload'}});await ready();
    fireEvent.change(screen.getByRole('combobox',{name:'Filter tahap peluang'}),{target:{value:'qualified'}});await ready();
    mocks.fetch.mockResolvedValueOnce(response({error:'SQL85 missing PRIVATE_DETAIL'},503));fireEvent.change(screen.getByRole('combobox',{name:'Urutan peluang'}),{target:{value:'value'}});
    expect(await screen.findByRole('alert')).toHaveTextContent('SQL85');expect(screen.getByRole('combobox',{name:'Filter sumber peluang'})).toHaveValue('manual_upload');
    expect(Object.fromEntries(params(mocks.fetch.mock.calls.at(-1)![0]))).toMatchObject({owner:'admin@company.invalid',source:'manual_upload',stage:'qualified',sort:'value',page:'0'});
    expect(screen.queryByText('PRIVATE_DETAIL')).not.toBeInTheDocument();expect(screen.queryByText('Tidak ada peluang yang cocok')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Coba lagi'}));await ready();
  });
  it('loads a fresh record by ID before edits; history is paginated by that ID',async()=>{
    render(<Harness/>);await ready();await open();expect(screen.getByText('4 Self Diagnostic terhubung · 3 konsultasi terhubung')).toBeVisible();
    expect(params(mocks.fetch.mock.calls.at(-1)![0]).get('id')).toBe(row.id);fireEvent.click(screen.getByRole('button',{name:/Riwayat 25/}));await screen.findByText('Catatan terbaru');
    fireEvent.click(within(screen.getByRole('navigation',{name:'Halaman riwayat peluang'})).getByRole('button',{name:'Berikutnya'}));await screen.findByText('Catatan riwayat lama');
    expect(Object.fromEntries(params(mocks.fetch.mock.calls.at(-1)![0]))).toEqual({id:row.id,historyPage:'1'});
    expect(screen.queryByText('Catatan terbaru')).not.toBeInTheDocument();
  });
  it('does not lose unsaved edits when paging history or refreshing the list; close warns',async()=>{
    render(<Harness/>);await ready();await open();fireEvent.click(screen.getByRole('button',{name:'Ubah peluang'}));
    fireEvent.change(screen.getByLabelText('Tindakan berikutnya'),{target:{value:'Local unsaved action'}});
    expect(mocks.dirty).toHaveBeenLastCalledWith(true);fireEvent.click(screen.getByRole('button',{name:'Perbarui semua'}));await ready();
    expect(screen.getByLabelText('Tindakan berikutnya')).toHaveValue('Local unsaved action');
    fireEvent.click(screen.getByRole('button',{name:/Riwayat 25/}));fireEvent.click(within(screen.getByRole('navigation',{name:'Halaman riwayat peluang'})).getByRole('button',{name:'Berikutnya'}));await screen.findByText('Catatan riwayat lama');
    fireEvent.click(screen.getByRole('button',{name:'Ringkasan'}));expect(screen.getByLabelText('Tindakan berikutnya')).toHaveValue('Local unsaved action');
    fireEvent.click(screen.getByRole('button',{name:'Tutup panel'}));expect(screen.getByRole('alert')).toHaveTextContent('Perubahan belum disimpan');
    fireEvent.click(screen.getByRole('button',{name:'Lanjut mengedit'}));expect(screen.getByRole('dialog')).toBeVisible();
  });
  it('preserves failed mutations and prevents double save; one successful save refreshes then closes',async()=>{
    let done:(value:unknown)=>void=()=>{};mocks.action.mockRejectedValueOnce(new Error('Belum tersimpan'));
    render(<Harness/>);await ready();await open();fireEvent.click(screen.getByRole('button',{name:'Ubah peluang'}));
    fireEvent.change(screen.getByLabelText('Tindakan berikutnya'),{target:{value:'New action'}});fireEvent.click(screen.getByRole('button',{name:'Simpan perubahan'}));
    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent('Belum tersimpan');expect(screen.getByLabelText('Tindakan berikutnya')).toHaveValue('New action');
    mocks.action.mockImplementation(()=>new Promise(resolve=>{done=resolve;}));const save=screen.getByRole('button',{name:'Simpan perubahan'});fireEvent.click(save);fireEvent.click(save);
    expect(mocks.action).toHaveBeenCalledTimes(2);await act(async()=>done({success:true}));await waitFor(()=>expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const input=JSON.parse(mocks.action.mock.calls.at(-1)![1].body);expect(input).toMatchObject({leadId:row.id,stage:'qualified',nextAction:'New action'});expect(mocks.refresh).toHaveBeenCalledTimes(1);expect(screen.getByText('Perubahan peluang berhasil disimpan.')).toBeVisible();
  });
  it('treats a post-save refresh failure as saved, never as a retry invitation',async()=>{
    mocks.refresh.mockRejectedValueOnce(new Error('offline'));render(<Harness/>);await ready();await open();fireEvent.click(screen.getByRole('button',{name:'Ubah peluang'}));
    fireEvent.change(screen.getByLabelText('Tindakan berikutnya'),{target:{value:'New action'}});fireEvent.click(screen.getByRole('button',{name:'Simpan perubahan'}));await waitFor(()=>expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByText(/Perubahan sudah tersimpan/)).toBeVisible();expect(mocks.action).toHaveBeenCalledTimes(1);
  });
  it('blocks editing when detail is unavailable or wrong, with independent retry',async()=>{
    render(<Harness/>);await ready();mocks.fetch.mockResolvedValueOnce(response(detail({...row,id:'wrong'})));fireEvent.click(screen.getByRole('button',{name:'Buka detail peluang Peluang Sintetis'}));
    await screen.findByRole('alert');expect(screen.queryByRole('button',{name:'Ubah peluang'})).not.toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Coba lagi'}));await screen.findByRole('button',{name:'Ubah peluang'});expect(mocks.fetch).toHaveBeenCalledTimes(3);
  });
  it('never revives a closed drawer from a late response',async()=>{
    let resolve:(value:Response)=>void=()=>{};render(<Harness/>);await ready();mocks.fetch.mockImplementationOnce(()=>new Promise<Response>(done=>{resolve=done;}));
    fireEvent.click(screen.getByRole('button',{name:'Buka detail peluang Peluang Sintetis'}));await screen.findByText('Memuat detail peluang…');fireEvent.click(screen.getByRole('button',{name:'Tutup panel'}));
    await act(async()=>resolve(response(detail())));expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('does not show a false empty result during history failure; retries only history',async()=>{
    render(<Harness/>);await ready();await open();fireEvent.click(screen.getByRole('button',{name:/Riwayat 25/}));mocks.fetch.mockResolvedValueOnce(response({},503));
    fireEvent.click(within(screen.getByRole('navigation',{name:'Halaman riwayat peluang'})).getByRole('button',{name:'Berikutnya'}));await screen.findByRole('alert');expect(screen.queryByText('Catatan terbaru')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Coba lagi'}));await screen.findByText('Catatan riwayat lama');expect(params(mocks.fetch.mock.calls.at(-1)![0]).get('historyPage')).toBe('1');
  });
  it('discards stale lists when cancellation is ignored',async()=>{
    let resolve:(value:Response)=>void=()=>{};mocks.fetch.mockImplementationOnce(()=>new Promise<Response>(done=>{resolve=done;}));render(<Harness/>);
    mocks.fetch.mockImplementation(()=>Promise.resolve(response(body([old],1))));fireEvent.click(screen.getByRole('button',{name:'Berhasil —'}));await screen.findByText('1–1 dari 1 peluang');
    await act(async()=>resolve(response(body())));expect(screen.queryByRole('button',{name:'Buka detail peluang Peluang Sintetis'})).not.toBeInTheDocument();
  });
  it('distinguishes malformed data from zero and recovers an out-of-range page',async()=>{
    mocks.fetch.mockResolvedValueOnce(response({success:true,total:0}));render(<Harness/>);await screen.findByRole('alert');expect(screen.queryByText('Belum ada peluang pada bagian ini')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Coba lagi'}));await ready();mocks.fetch.mockImplementation((url:string)=>Promise.resolve(response(body([],0,Number(params(url).get('page')||0)))));
    fireEvent.click(screen.getByRole('button',{name:'Berikutnya'}));await screen.findByText('0–0 dari 0 peluang');expect(params(mocks.fetch.mock.calls.at(-1)![0]).get('page')).toBe('0');
  });
  it('times out a hung list and supports retry',async()=>{
    vi.useFakeTimers();mocks.fetch.mockImplementation(()=>new Promise(()=>{}));render(<Harness/>);await act(async()=>{await vi.advanceTimersByTimeAsync(20001);});expect(screen.getByRole('alert')).toHaveTextContent('terlalu lama');
    mocks.fetch.mockImplementation(()=>Promise.resolve(response(body())));await act(async()=>fireEvent.click(screen.getByRole('button',{name:'Coba lagi'})));expect(screen.getByText('1–20 dari 41 peluang')).toBeVisible();
  });
});
