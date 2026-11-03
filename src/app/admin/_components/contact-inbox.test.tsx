import { useState } from 'react';
import { act,fireEvent,render,screen,waitFor,within } from '@testing-library/react';
import { afterEach,beforeEach,describe,expect,it,vi } from 'vitest';
import { ContactsPanel } from './contacts-panel';
const mocks=vi.hoisted(()=>({fetch:vi.fn(),action:vi.fn(),refresh:vi.fn()}));
vi.mock('@/lib/api-fetch',()=>({apiFetch:mocks.fetch}));
const recordId='11111111-1111-4111-8111-111111111111';
const row={id:'lead:'+recordId,recordId,name:'Dewi',email:'dewi@example.invalid',whatsapp:'',source:'website',sourceType:'lead',category:'Lead',status:'New Lead',createdAt:'2020-01-01T03:00:00Z'};
const old={...row,id:'coach:'+recordId,name:'Arsip Tokyo',sourceType:'coach',category:'Coach',status:'active'};
const detail=(value=row)=>({...value,notes:'Stored notes',message:'Private initial context, not a reason to classify as client.'});
const body=(records=[row],total=41,page=0)=>({success:true,version:1,page,pageSize:20,records,total,counts:{leads:30,reachable:40,sources:5},facets:{types:['coach','lead'],categories:['Coach','Lead'],statuses:['New Lead','Archived','active']}});
const response=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status});
const params=(url:string)=>new URL(url,'https://test.invalid').searchParams;
function Harness(){const[refreshToken,setRefreshToken]=useState(0);return <><button type="button" onClick={()=>setRefreshToken(value=>value+1)}>Perbarui semua</button><ContactsPanel serverMode refreshToken={refreshToken} contacts={[]} onAction={mocks.action} onRefresh={mocks.refresh}/></>;}
beforeEach(()=>{vi.resetAllMocks();vi.spyOn(window,'confirm').mockReturnValue(false);mocks.action.mockResolvedValue({success:true});mocks.fetch.mockImplementation((url:string)=>Promise.resolve(response(params(url).has('id')?{success:true,record:detail(params(url).get('type')==='coach'?old:row)}:body([row],41,Number(params(url).get('page')||0)))));});
afterEach(()=>vi.useRealTimers());
describe('server contact archive preserves explicit status and write target',()=>{
  it('uses exact totals/metrics, pages20 and never loads full details or dashboard on entry',async()=>{
    render(<Harness/>);await screen.findByText('1–20 dari 41');expect(screen.getByText('30',{exact:true})).toBeVisible();expect(mocks.fetch).toHaveBeenCalledTimes(1);expect(screen.queryByText('Private initial context, not a reason to classify as client.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Berikutnya'}));await screen.findByText('21–40 dari 41');expect(params(mocks.fetch.mock.calls.at(-1)![0]).get('page')).toBe('1');expect(mocks.action).not.toHaveBeenCalled();
  });
  it('searches literal historical data, hides stale rows and resets page when search is cleared',async()=>{
    render(<Harness/>);await screen.findByText('1–20 dari 41');fireEvent.click(screen.getByRole('button',{name:'Berikutnya'}));await screen.findByText('21–40 dari 41');
    mocks.fetch.mockImplementation(()=>Promise.resolve(response(body([old],1))));fireEvent.change(screen.getByRole('searchbox'),{target:{value:'A,B %_* 東京'}});expect(screen.queryByRole('button',{name:'Buka detail Dewi'})).not.toBeInTheDocument();await screen.findByText('1–1 dari 1');expect(Object.fromEntries(params(mocks.fetch.mock.calls.at(-1)![0]))).toMatchObject({search:'A,B %_* 東京',page:'0'});
    mocks.fetch.mockImplementation(()=>Promise.resolve(response(body())));fireEvent.change(screen.getByRole('searchbox'),{target:{value:''}});await screen.findByText('1–20 dari 41');expect(screen.getByRole('button',{name:'Sebelumnya'})).toBeDisabled();
  });
  it('passes all filters before paging, preserving them through failures and retry',async()=>{
    render(<Harness/>);await screen.findByText('1–20 dari 41');
    fireEvent.change(screen.getByRole('combobox',{name:'Filter jenis kontak'}),{target:{value:'lead'}});await screen.findByText('1–20 dari 41');fireEvent.change(screen.getByRole('combobox',{name:'Filter kategori kontak'}),{target:{value:'Lead'}});await screen.findByText('1–20 dari 41');
    mocks.fetch.mockImplementation(()=>Promise.resolve(response({error:'SQL84 missing private@example.invalid'},503)));fireEvent.change(screen.getByRole('combobox',{name:'Filter status kontak'}),{target:{value:'Archived'}});expect(await screen.findByRole('alert')).toHaveTextContent('SQL84');expect(screen.queryByText('Kontak tidak ditemukan')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox',{name:'Filter jenis kontak'})).toHaveValue('lead');expect(screen.getByRole('combobox',{name:'Filter kategori kontak'})).toHaveValue('Lead');expect(screen.getByRole('combobox',{name:'Filter status kontak'})).toHaveValue('Archived');
    expect(Object.fromEntries(params(mocks.fetch.mock.calls.at(-1)![0]))).toMatchObject({type:'lead',category:'Lead',status:'Archived',page:'0'});
    mocks.fetch.mockImplementation(()=>Promise.resolve(response(body([],0))));fireEvent.click(screen.getByRole('button',{name:'Coba muat daftar lagi'}));await screen.findByText('0–0 dari 0');expect(screen.getByText('Kontak tidak ditemukan')).toBeVisible();
  });
  it('opens the correct composite identity when source types share one UUID',async()=>{
    mocks.fetch.mockImplementation((url:string)=>Promise.resolve(response(params(url).has('id')?{success:true,record:detail(params(url).get('type')==='coach'?old:row)}:body([row,old],2))));render(<Harness/>);await screen.findByText('1–2 dari 2');
    fireEvent.click(screen.getByRole('button',{name:'Buka detail Arsip Tokyo'}));await screen.findByRole('dialog',{name:'Arsip Tokyo'});expect(screen.getByText(/Kontak ini berasal dari sumber referensi/)).toBeVisible();expect(screen.queryByRole('button',{name:'Simpan perubahan'})).not.toBeInTheDocument();
    expect(Object.fromEntries(params(mocks.fetch.mock.calls.at(-1)![0]))).toEqual({type:'coach',id:recordId});
  });
  it('reads status as stored, not guessed from text or age, and saves only notes by default',async()=>{
    render(<Harness/>);await screen.findByText('1–20 dari 41');fireEvent.click(screen.getByRole('button',{name:'Buka detail Dewi'}));await screen.findByLabelText('Catatan internal');expect(screen.getByRole('combobox',{name:'Status kontak'})).toHaveValue('New Lead');
    fireEvent.change(screen.getByLabelText('Catatan internal'),{target:{value:'New note'}});fireEvent.click(screen.getByRole('button',{name:'Simpan perubahan'}));await waitFor(()=>expect(mocks.action).toHaveBeenCalledWith('/api/admin/contacts',{method:'PATCH',body:JSON.stringify({id:recordId,notes:'New note'})}));expect(mocks.refresh).not.toHaveBeenCalled();
  });
  it('sends a status only when the admin actually chooses a new one',async()=>{
    render(<Harness/>);await screen.findByText('1–20 dari 41');fireEvent.click(screen.getByRole('button',{name:'Buka detail Dewi'}));await screen.findByLabelText('Catatan internal');fireEvent.change(screen.getByRole('combobox',{name:'Status kontak'}),{target:{value:'Qualified'}});fireEvent.click(screen.getByRole('button',{name:'Simpan perubahan'}));
    await waitFor(()=>expect(mocks.action).toHaveBeenCalledWith('/api/admin/contacts',{method:'PATCH',body:JSON.stringify({id:recordId,notes:'Stored notes',status:'Qualified'})}));
  });
  it('never restores a stale status when only notes were edited before a refresh',async()=>{
    render(<Harness/>);await screen.findByText('1–20 dari 41');fireEvent.click(screen.getByRole('button',{name:'Buka detail Dewi'}));await screen.findByLabelText('Catatan internal');fireEvent.change(screen.getByLabelText('Catatan internal'),{target:{value:'Local notes'}});
    mocks.fetch.mockImplementation((url:string)=>Promise.resolve(response(params(url).has('id')?{success:true,record:detail({...row,status:'Client'})}:body())));fireEvent.click(screen.getByRole('button',{name:'Perbarui semua'}));
    await waitFor(()=>expect(screen.getByRole('combobox',{name:'Status kontak'})).toHaveValue('Client'));expect(screen.getByLabelText('Catatan internal')).toHaveValue('Local notes');fireEvent.click(screen.getByRole('button',{name:'Simpan perubahan'}));
    await waitFor(()=>expect(mocks.action).toHaveBeenCalledWith('/api/admin/contacts',{method:'PATCH',body:JSON.stringify({id:recordId,notes:'Local notes'})}));
  });
  it('does not reapply an already-saved status after a later external change',async()=>{
    render(<Harness/>);await screen.findByText('1–20 dari 41');fireEvent.click(screen.getByRole('button',{name:'Buka detail Dewi'}));await screen.findByLabelText('Catatan internal');fireEvent.change(screen.getByRole('combobox',{name:'Status kontak'}),{target:{value:'Qualified'}});
    mocks.fetch.mockImplementation((url:string)=>Promise.resolve(response(params(url).has('id')?{success:true,record:detail({...row,status:'Qualified'})}:body())));fireEvent.click(screen.getByRole('button',{name:'Simpan perubahan'}));await waitFor(()=>expect(mocks.fetch.mock.calls.length).toBeGreaterThanOrEqual(4));await screen.findByLabelText('Catatan internal');
    mocks.fetch.mockImplementation((url:string)=>Promise.resolve(response(params(url).has('id')?{success:true,record:detail({...row,status:'Client'})}:body())));fireEvent.click(screen.getByRole('button',{name:'Perbarui semua'}));await waitFor(()=>expect(screen.getByRole('combobox',{name:'Status kontak'})).toHaveValue('Client'));
    fireEvent.change(screen.getByLabelText('Catatan internal'),{target:{value:'Another note'}});fireEvent.click(screen.getByRole('button',{name:'Simpan perubahan'}));await waitFor(()=>expect(mocks.action).toHaveBeenLastCalledWith('/api/admin/contacts',{method:'PATCH',body:JSON.stringify({id:recordId,notes:'Another note'})}));
  });
  it('preserves notes through a failed refresh and detail-only retry; warns before closing',async()=>{
    render(<Harness/>);await screen.findByText('1–20 dari 41');fireEvent.click(screen.getByRole('button',{name:'Buka detail Dewi'}));await screen.findByLabelText('Catatan internal');fireEvent.change(screen.getByLabelText('Catatan internal'),{target:{value:'Unsaved local note'}});
    mocks.fetch.mockImplementation((url:string)=>Promise.resolve(params(url).has('id')?response({},503):response(body())));fireEvent.click(screen.getByRole('button',{name:'Perbarui semua'}));await screen.findByRole('alert');fireEvent.click(screen.getByRole('button',{name:'Tutup panel'}));expect(window.confirm).toHaveBeenCalled();expect(screen.getByRole('dialog')).toBeVisible();
    mocks.fetch.mockImplementation(()=>Promise.resolve(response({success:true,record:detail()})));fireEvent.click(screen.getByRole('button',{name:'Coba muat detail lagi'}));expect(await screen.findByLabelText('Catatan internal')).toHaveValue('Unsaved local note');
  });
  it('shows mutation failure inside the drawer and keeps edits',async()=>{
    mocks.action.mockRejectedValueOnce(new Error('Belum tersimpan'));render(<Harness/>);await screen.findByText('1–20 dari 41');fireEvent.click(screen.getByRole('button',{name:'Buka detail Dewi'}));await screen.findByLabelText('Catatan internal');fireEvent.change(screen.getByLabelText('Catatan internal'),{target:{value:'Preserved'}});fireEvent.click(screen.getByRole('button',{name:'Simpan perubahan'}));expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent('Belum tersimpan');expect(screen.getByLabelText('Catatan internal')).toHaveValue('Preserved');
  });
  it('retries detail independently without an actionable stale record',async()=>{
    render(<Harness/>);await screen.findByText('1–20 dari 41');mocks.fetch.mockResolvedValueOnce(response({},503));fireEvent.click(screen.getByRole('button',{name:'Buka detail Dewi'}));await screen.findByRole('alert');expect(screen.queryByRole('button',{name:'Simpan perubahan'})).not.toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Coba muat detail lagi'}));await screen.findByLabelText('Catatan internal');expect(mocks.fetch).toHaveBeenCalledTimes(3);
  });
  it('does not revive a closed detail after a late response',async()=>{
    let resolve:(value:Response)=>void=()=>{};mocks.fetch.mockImplementation((url:string)=>params(url).has('id')?new Promise<Response>(done=>{resolve=done;}):Promise.resolve(response(body())));render(<Harness/>);await screen.findByText('1–20 dari 41');fireEvent.click(screen.getByRole('button',{name:'Buka detail Dewi'}));await screen.findByText('Memuat detail kontak…');fireEvent.click(screen.getByRole('button',{name:'Tutup panel'}));await act(async()=>resolve(response({success:true,record:detail()})));expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('ignores stale lists even when transport ignores cancellation',async()=>{
    let resolve:(value:Response)=>void=()=>{};mocks.fetch.mockImplementationOnce(()=>new Promise<Response>(done=>{resolve=done;}));render(<Harness/>);mocks.fetch.mockImplementation(()=>Promise.resolve(response(body([old],1))));fireEvent.change(screen.getByRole('combobox',{name:'Filter jenis kontak'}),{target:{value:'lead'}});await screen.findByText('1–1 dari 1');await act(async()=>resolve(response(body())));expect(screen.queryByRole('button',{name:'Buka detail Dewi'})).not.toBeInTheDocument();
  });
  it('distinguishes malformed data from empty and clamps out-of-range pages',async()=>{
    mocks.fetch.mockResolvedValueOnce(response({success:true,total:0}));render(<Harness/>);await screen.findByRole('alert');expect(screen.queryByText('Kontak tidak ditemukan')).not.toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Coba muat daftar lagi'}));await screen.findByText('1–20 dari 41');mocks.fetch.mockImplementation((url:string)=>Promise.resolve(response(body([],0,Number(params(url).get('page')||0)))));fireEvent.click(screen.getByRole('button',{name:'Berikutnya'}));await screen.findByText('0–0 dari 0');expect(params(mocks.fetch.mock.calls.at(-1)![0]).get('page')).toBe('0');
  });
  it('times out an unsettled transport and supports retry',async()=>{
    vi.useFakeTimers();mocks.fetch.mockImplementation(()=>new Promise(()=>{}));render(<Harness/>);await act(async()=>{await vi.advanceTimersByTimeAsync(20001);});expect(screen.getByRole('alert')).toHaveTextContent('terlalu lama');mocks.fetch.mockImplementation(()=>Promise.resolve(response(body([],0))));await act(async()=>fireEvent.click(screen.getByRole('button',{name:'Coba muat daftar lagi'})));expect(screen.getByText('0–0 dari 0')).toBeVisible();
  });
});
