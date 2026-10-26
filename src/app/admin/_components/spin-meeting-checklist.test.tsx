import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import definition from '@/test/fixtures/spin-definition.json';
import { SpinMeetingChecklist } from './spin-meeting-checklist';
import type { MeetingContext } from '../_lib/spin-meeting';
const mocks=vi.hoisted(()=>({fetch:vi.fn()}));
vi.mock('@/lib/api-fetch',()=>({apiFetch:mocks.fetch}));
const id='11111111-1111-4111-8111-111111111111';
const context:MeetingContext={definition,original:{role:'R1'},checklist:{id,source_id:id,contact:{name:'Synthetic',company:'Synthetic',email:'synthetic@example.invalid'},answers:{},notes:'',status:'in_progress',revision:0,updated_at:null}};
const response=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status});
function mount(){return render(<SpinMeetingChecklist id={id} onDirty={vi.fn()} onSaved={vi.fn()}/>);}
beforeEach(()=>{vi.resetAllMocks();mocks.fetch.mockResolvedValue(response(context));});
describe('meeting checklist work survives saves and failures',()=>{
 it('shows client evidence and missing-only controls without rewriting source',async()=>{
  mount();await screen.findByRole('heading',{name:'Checklist meeting'});
  expect(screen.getByText('Diisi klien')).toBeVisible();expect(screen.getByText('HR, People & Culture, L&D, atau OD.')).toBeVisible();
  fireEvent.click(screen.getByLabelText('Hanya yang belum diisi'));
  expect(screen.queryByText('HR, People & Culture, L&D, atau OD.')).not.toBeInTheDocument();expect(screen.getByRole('combobox',{name:'Bidang usaha'})).toBeVisible();
  fireEvent.change(screen.getByRole('combobox',{name:'Bidang usaha'}),{target:{value:'IND1'}});
  expect(screen.getByRole('combobox',{name:'Bidang usaha'})).toHaveValue('IND1');
  expect(context.original).toEqual({role:'R1'});
 });
 it('saves in the background, keeps controls editable, and queues newer notes',async()=>{
  let resolveSave:(value:Response)=>void=()=>{};
  mocks.fetch.mockImplementation((_path:string,init?:RequestInit)=>init?.method==='PATCH'?new Promise<Response>(resolve=>{resolveSave=resolve;}):Promise.resolve(response(context)));
  mount();const notes=await screen.findByLabelText('Catatan dan tindak lanjut konsultasi');
  fireEvent.change(notes,{target:{value:'First note'}});
  await waitFor(()=>expect(mocks.fetch).toHaveBeenCalledTimes(2),{timeout:3000});
  expect(notes).not.toBeDisabled();fireEvent.change(notes,{target:{value:'Newer note'}});
  await act(async()=>resolveSave(response({checklist:{...context.checklist,notes:'First note',revision:1,updated_at:'2026-10-26T00:00:00Z'}})));
  expect(notes).toHaveValue('Newer note');
  await waitFor(()=>expect(mocks.fetch).toHaveBeenCalledTimes(3),{timeout:3000});
  const body=JSON.parse(mocks.fetch.mock.calls[2][1].body);expect(body).toMatchObject({revision:1,notes:'Newer note'});
 });
 it('retains notes on server failure and offers retry instead of clearing the form',async()=>{
  mocks.fetch.mockImplementation((_path:string,init?:RequestInit)=>Promise.resolve(init?.method==='PATCH'?response({error:'Belum tersimpan'},503):response(context)));
  mount();const notes=await screen.findByLabelText('Catatan dan tindak lanjut konsultasi');fireEvent.change(notes,{target:{value:'Do not lose this'}});
  await screen.findByRole('alert',{}, {timeout:3000});expect(notes).toHaveValue('Do not lose this');expect(screen.getByRole('button',{name:'Coba simpan lagi'})).toBeVisible();
 });
 it('does not overwrite on a revision conflict and does not complete missing required answers',async()=>{
  mocks.fetch.mockImplementation((_path:string,init?:RequestInit)=>Promise.resolve(init?.method==='PATCH'?response({error:'Draft berubah'},409):response(context)));
  mount();await screen.findByRole('heading',{name:'Checklist meeting'});
  fireEvent.click(screen.getAllByRole('button',{name:'Tandai selesai'})[0]);expect(screen.getByRole('alert')).toHaveTextContent('Lengkapi jawaban');expect(mocks.fetch).toHaveBeenCalledTimes(1);
  fireEvent.change(screen.getByLabelText('Catatan dan tindak lanjut konsultasi'),{target:{value:'Unmerged'}});
  fireEvent.click(screen.getAllByRole('button',{name:'Simpan sesi'})[0]);await screen.findByRole('button',{name:'Muat versi terbaru'});
  expect(screen.getByLabelText('Catatan dan tindak lanjut konsultasi')).toHaveValue('Unmerged');
 });
});
