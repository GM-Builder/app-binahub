import { useState } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InquiriesPanel } from './inquiries-panel';
const mocks=vi.hoisted(()=>({fetch:vi.fn(),action:vi.fn(),refresh:vi.fn()}));
vi.mock('@/lib/api-fetch',()=>({apiFetch:mocks.fetch}));
const row={id:'first',name:'Maya',email:'maya@example.invalid',source:'website',status:'Baru',replyStatus:'reviewed',messagePreview:'Preview context',followUpDue:false,createdAt:'2026-11-01T03:00:00Z'};
const old={...row,id:'old',name:'Arsip lama',source:'catalog'};
const detail=(value=row)=>({...value,whatsapp:'',message:'Full context',notes:'Existing notes',followUpLevel:0,followUpLastSentAt:null,followUpPaused:false,replySubject:'Reviewed subject',replyBody:'Reviewed reply with enough context.',replyGeneratedAt:null,replyReviewedAt:null,replyReviewedBy:null,replySentAt:null,replyEmailId:null,moduleRequest:{}});
const body=(records=[row],total=41,page=0)=>({success:true,version:1,records,total,page,pageSize:20,counts:{fresh:30,awaiting:15,ready:12,due:4},facets:{sources:['catalog','website'],statuses:['Baru','Diproses']}});
const response=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status});
const params=(url:string)=>new URL(url,'https://test.invalid').searchParams;
function Harness({initialId=null,onDirty}:{initialId?:string|null;onDirty?:(dirty:boolean)=>void}){
  const [refreshToken,setRefreshToken]=useState(0);
  return <><button type="button" onClick={()=>setRefreshToken(value=>value+1)}>Perbarui semua</button><InquiriesPanel serverMode refreshToken={refreshToken} inquiries={[]} initialSelectedId={initialId} onUnsavedChange={onDirty} onAction={mocks.action} onRefresh={mocks.refresh}/></>;
}
beforeEach(()=>{
  vi.resetAllMocks();vi.spyOn(window,'confirm').mockReturnValue(false);
  mocks.action.mockResolvedValue({success:true});
  mocks.fetch.mockImplementation((url:string)=>Promise.resolve(response(params(url).has('id')?{success:true,record:detail(params(url).get('id')==='old'?old:row)}:body([row],41,Number(params(url).get('page')||0)))));
});
afterEach(()=>vi.useRealTimers());
describe('server-wide Inquiry inbox',()=>{
  it('uses server totals and metrics, pages20 and does not read detail/dashboard on entry',async()=>{
    render(<Harness/>);await screen.findByText('1–20 dari 41');expect(screen.getByText('30',{exact:true})).toBeVisible();
    expect(screen.getAllByRole('button',{name:/Buka inquiry/})).toHaveLength(1);expect(mocks.fetch).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button',{name:'Berikutnya'}));await screen.findByText('21–40 dari 41');
    expect(params(mocks.fetch.mock.calls.at(-1)![0]).get('page')).toBe('1');expect(mocks.action).not.toHaveBeenCalled();
    expect(mocks.fetch.mock.calls.every(([url])=>url.startsWith('/api/admin/inquiries/inbox?'))).toBe(true);
  });
  it('searches literal archive text, hides stale rows and resets when returning to the earlier search',async()=>{
    render(<Harness/>);await screen.findByText('1–20 dari 41');fireEvent.click(screen.getByRole('button',{name:'Berikutnya'}));await screen.findByText('21–40 dari 41');
    mocks.fetch.mockResolvedValue(response(body([old],1)));fireEvent.change(screen.getByRole('searchbox'),{target:{value:'A,B "O\'Brien" %_* 東京'}});
    expect(screen.queryByRole('button',{name:'Buka inquiry Maya'})).not.toBeInTheDocument();await screen.findByText('1–1 dari 1');
    expect(Object.fromEntries(params(mocks.fetch.mock.calls.at(-1)![0]))).toMatchObject({search:'A,B "O\'Brien" %_* 東京',page:'0'});
    mocks.fetch.mockResolvedValue(response(body()));fireEvent.change(screen.getByRole('searchbox'),{target:{value:''}});await screen.findByText('1–20 dari 41');expect(screen.getByRole('button',{name:'Sebelumnya'})).toBeDisabled();
  });
  it('keeps source/status and separates unavailable from empty results',async()=>{
    render(<Harness/>);await screen.findByText('1–20 dari 41');
    fireEvent.change(screen.getByRole('combobox',{name:'Filter sumber inquiry'}),{target:{value:'catalog'}});await screen.findByText('1–20 dari 41');
    mocks.fetch.mockResolvedValue(response({error:'SQL83 missing private@example.invalid'},503));fireEvent.change(screen.getByRole('combobox',{name:'Filter status inquiry'}),{target:{value:'Diproses'}});
    expect(await screen.findByRole('alert')).toHaveTextContent('SQL83');expect(screen.queryByText('Inquiry tidak ditemukan')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox',{name:'Filter sumber inquiry'})).toHaveValue('catalog');expect(screen.getByRole('combobox',{name:'Filter status inquiry'})).toHaveValue('Diproses');
    expect(screen.queryByText('private@example.invalid')).not.toBeInTheDocument();
    mocks.fetch.mockResolvedValue(response(body([],0)));fireEvent.click(screen.getByRole('button',{name:'Coba muat daftar lagi'}));await screen.findByText('0–0 dari 0');expect(screen.getByText('Inquiry tidak ditemukan')).toBeVisible();
  });
  it('treats malformed response as unavailable, never an empty healthy inbox',async()=>{
    mocks.fetch.mockResolvedValue(response({success:true,total:0,records:[]}));render(<Harness/>);await screen.findByRole('alert');expect(screen.queryByText('Inquiry tidak ditemukan')).not.toBeInTheDocument();
  });
  it('loads detail only when opened and retries detail without remounting list or clearing filters',async()=>{
    render(<Harness/>);await screen.findByText('1–20 dari 41');mocks.fetch.mockResolvedValueOnce(response({},503));fireEvent.click(screen.getByRole('button',{name:'Buka inquiry Maya'}));
    await screen.findByRole('alert');expect(mocks.fetch).toHaveBeenCalledTimes(2);expect(screen.queryByRole('button',{name:'Kirim balasan'})).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Coba muat detail lagi'}));await screen.findByLabelText('Isi balasan');expect(mocks.fetch).toHaveBeenCalledTimes(3);
    expect(screen.getByText('Full context')).toBeVisible();expect(screen.getByRole('button',{name:'Kirim balasan'})).toBeEnabled();
  });
  it('opens a historical selected ID even outside the current page',async()=>{
    render(<Harness initialId="old"/>);await screen.findByRole('dialog',{name:'Arsip lama'});expect(screen.getByRole('textbox',{name:'Isi balasan'})).toHaveValue('Reviewed reply with enough context.');
  });
  it('preserves local draft through failed detail refresh and retry; warns before close',async()=>{
    const dirty=vi.fn();render(<Harness onDirty={dirty}/>);await screen.findByText('1–20 dari 41');fireEvent.click(screen.getByRole('button',{name:'Buka inquiry Maya'}));await screen.findByLabelText('Isi balasan');
    fireEvent.change(screen.getByLabelText('Isi balasan'),{target:{value:'My unsaved revised response with extra context.'}});expect(screen.getByRole('button',{name:'Kirim balasan'})).toBeDisabled();expect(dirty).toHaveBeenLastCalledWith(true);
    mocks.fetch.mockImplementation((url:string)=>Promise.resolve(params(url).has('id')?response({},503):response(body())));
    fireEvent.click(screen.getByRole('button',{name:'Perbarui semua'}));await screen.findByRole('alert');expect(dirty).toHaveBeenLastCalledWith(true);
    fireEvent.click(screen.getByRole('button',{name:'Tutup panel'}));expect(window.confirm).toHaveBeenCalled();expect(screen.getByRole('dialog')).toBeVisible();
    mocks.fetch.mockResolvedValue(response({success:true,record:detail()}));fireEvent.click(screen.getByRole('button',{name:'Coba muat detail lagi'}));
    expect(await screen.findByLabelText('Isi balasan')).toHaveValue('My unsaved revised response with extra context.');
  });
  it('requires review and explicit confirmation before a send, then refreshes only this inbox',async()=>{
    render(<Harness/>);await screen.findByText('1–20 dari 41');fireEvent.click(screen.getByRole('button',{name:'Buka inquiry Maya'}));await screen.findByLabelText('Isi balasan');
    fireEvent.click(screen.getByRole('button',{name:'Kirim balasan'}));expect(mocks.action).not.toHaveBeenCalled();
    const confirm=screen.getByRole('dialog',{name:'Kirim balasan yang sudah direview?'});fireEvent.click(within(confirm).getByRole('button',{name:'Kirim balasan'}));
    await waitFor(()=>expect(mocks.action).toHaveBeenCalledWith('/api/admin/inquiries',expect.objectContaining({method:'POST',body:JSON.stringify({action:'send_reviewed_reply',id:'first',confirmation:'SEND_REVIEWED_INQUIRY_REPLY'})})));
    await waitFor(()=>expect(mocks.fetch.mock.calls.length).toBeGreaterThanOrEqual(4));expect(mocks.refresh).not.toHaveBeenCalled();
  });
  it('keeps edits and exposes mutation failure inside the open drawer',async()=>{
    mocks.action.mockRejectedValue(new Error('Simpan belum berhasil'));render(<Harness/>);await screen.findByText('1–20 dari 41');fireEvent.click(screen.getByRole('button',{name:'Buka inquiry Maya'}));await screen.findByLabelText('Isi balasan');
    fireEvent.change(screen.getByLabelText('Isi balasan'),{target:{value:'A new valid reply that remains on failure.'}});fireEvent.click(screen.getByRole('button',{name:'Simpan hasil edit'}));
    const drawer=screen.getByRole('dialog');expect(await within(drawer).findByRole('alert')).toHaveTextContent('Simpan belum berhasil');expect(screen.getByLabelText('Isi balasan')).toHaveValue('A new valid reply that remains on failure.');
  });
  it('matches server trimming after a successful review instead of leaving a false unsaved warning',async()=>{
    render(<Harness/>);await screen.findByText('1–20 dari 41');fireEvent.click(screen.getByRole('button',{name:'Buka inquiry Maya'}));await screen.findByLabelText('Isi balasan');
    fireEvent.change(screen.getByLabelText('Isi balasan'),{target:{value:'  Reviewed reply with enough context.  '}});
    fireEvent.click(screen.getByRole('button',{name:'Simpan hasil edit'}));
    await waitFor(()=>expect(screen.getByRole('button',{name:'Kirim balasan'})).toBeEnabled());
    expect(screen.getByLabelText('Isi balasan')).toHaveValue('Reviewed reply with enough context.');
    expect(screen.queryByText('Perubahan belum disimpan. Simpan hasil edit sebelum mengirim.')).not.toBeInTheDocument();
  });
  it('ignores out-of-order list responses even when transport ignores abort',async()=>{
    let resolveOld:(value:Response)=>void=()=>{};mocks.fetch.mockImplementationOnce(()=>new Promise<Response>(resolve=>{resolveOld=resolve;}));
    render(<Harness/>);mocks.fetch.mockResolvedValue(response(body([old],1)));fireEvent.change(screen.getByRole('combobox',{name:'Filter sumber inquiry'}),{target:{value:'catalog'}});await screen.findByText('1–1 dari 1');
    await act(async()=>resolveOld(response(body())));expect(screen.queryByRole('button',{name:'Buka inquiry Maya'})).not.toBeInTheDocument();expect(screen.getByRole('button',{name:'Buka inquiry Arsip lama'})).toBeVisible();
  });
  it('does not revive a detail closed before its late response',async()=>{
    let resolveDetail:(value:Response)=>void=()=>{};
    mocks.fetch.mockImplementation((url:string)=>params(url).has('id')?new Promise<Response>(resolve=>{resolveDetail=resolve;}):Promise.resolve(response(body())));
    render(<Harness/>);await screen.findByText('1–20 dari 41');fireEvent.click(screen.getByRole('button',{name:'Buka inquiry Maya'}));await screen.findByText('Memuat detail inquiry…');
    fireEvent.click(screen.getByRole('button',{name:'Tutup panel'}));await act(async()=>resolveDetail(response({success:true,record:detail()})));expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('recovers a page which became out of range after data changed',async()=>{
    render(<Harness/>);await screen.findByText('1–20 dari 41');mocks.fetch.mockImplementation((url:string)=>Promise.resolve(response(body([],0,Number(params(url).get('page')||0)))));
    fireEvent.click(screen.getByRole('button',{name:'Berikutnya'}));await screen.findByText('0–0 dari 0');expect(params(mocks.fetch.mock.calls.at(-1)![0]).get('page')).toBe('0');
  });
  it('times out when the transport never settles and allows a retry',async()=>{
    vi.useFakeTimers();mocks.fetch.mockImplementation(()=>new Promise(()=>{}));render(<Harness/>);
    await act(async()=>{await vi.advanceTimersByTimeAsync(20001);});expect(screen.getByRole('alert')).toHaveTextContent('terlalu lama');
    mocks.fetch.mockResolvedValue(response(body([],0)));await act(async()=>fireEvent.click(screen.getByRole('button',{name:'Coba muat daftar lagi'})));
    expect(screen.getByText('0–0 dari 0')).toBeVisible();vi.useRealTimers();
  });
});
