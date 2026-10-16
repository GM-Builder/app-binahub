import { render,screen,fireEvent,cleanup,waitFor } from '@testing-library/react';
import { afterEach,beforeEach,describe,it,expect,vi } from 'vitest';
const deps=vi.hoisted(()=>({session:vi.fn(),fetch:vi.fn()}));
vi.mock('@/lib/supabase',()=>({supabase:{auth:{getSession:deps.session}}}));
import { PECommerceAdmin } from './pe-commerce-admin';
const configuration={name:null,description:null,priceIdr:null,attempts:null,startWithinDays:null,completeWithinDays:null,
  retentionMonths:null,refundPolicy:null,terms:null,reportVersion:null};
const dashboard={revision:0,configuration,areas:[{code:'PE-01',name:'Synthetic area'}],readiness:{canSell:false,missing:['Harga total','Payment gateway']},
  counts:{pending:0,paid:0,attention:0},orders:[],matchedCount:0};
const response=(data=dashboard)=>new Response(JSON.stringify({success:true,dashboard:data}));
beforeEach(()=>{vi.clearAllMocks();deps.session.mockResolvedValue({data:{session:{user:{id:'admin'},access_token:'synthetic'}}});
  deps.fetch.mockImplementation(async()=>response());vi.stubGlobal('fetch',deps.fetch);});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
describe('individual commerce preparation UI',()=>{
  it('shows real empty transactions and never offers activation or manual paid bypass',async()=>{
    render(<PECommerceAdmin/>);await screen.findByText('Belum ada transaksi yang sesuai.');
    expect(screen.getByText('Belum menerima pembayaran')).toBeVisible();
    expect(screen.queryByRole('button',{name:/aktifkan|tandai lunas|bayar sekarang/i})).not.toBeInTheDocument();
  });
  it('saves unknown decisions as null, retains revision and does not invent prices',async()=>{
    render(<PECommerceAdmin/>);await screen.findByText('Belum ada transaksi yang sesuai.');
    fireEvent.click(screen.getByRole('button',{name:'Paket asesmen'}));
    expect(screen.getByLabelText('Harga total yang dibayar (Rp)')).toHaveValue(null);
    fireEvent.change(screen.getByLabelText('Nama paket'),{target:{value:'Synthetic draft'}});
    fireEvent.click(screen.getByRole('button',{name:'Simpan draft paket'}));
    await screen.findByText(/Draft paket tersimpan/);
    const [,init]=deps.fetch.mock.calls.find(([,options])=>options.method==='PUT')!;
    expect(JSON.parse(init.body)).toEqual({revision:0,configuration:{...configuration,name:'Synthetic draft'}});
  });
  it('keeps user input after failure and explains stale draft replacement',async()=>{
    deps.fetch.mockImplementation(async(_url,init)=>init.method==='PUT'?new Response(JSON.stringify({success:false,error:'Draft berubah di tab lain.'}),{status:409}):response());
    render(<PECommerceAdmin/>);await screen.findByText('Belum ada transaksi yang sesuai.');
    fireEvent.click(screen.getByRole('button',{name:'Paket asesmen'}));fireEvent.change(screen.getByLabelText('Nama paket'),{target:{value:'Keep this'}});
    fireEvent.click(screen.getByRole('button',{name:'Simpan draft paket'}));
    await screen.findByRole('alert');expect(screen.getByLabelText('Nama paket')).toHaveValue('Keep this');
    expect(screen.getByRole('button',{name:'Muat versi terbaru'})).toBeVisible();
  });
  it('does not render a failed response as an empty or zero-valued successful dashboard',async()=>{
    deps.fetch.mockRejectedValueOnce(new Error('Belum dapat terhubung.'));render(<PECommerceAdmin/>);
    await screen.findByRole('alert');expect(screen.queryByText('Belum ada transaksi yang sesuai.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Coba lagi'}));await screen.findByText('Belum ada transaksi yang sesuai.');
    await waitFor(()=>expect(deps.fetch).toHaveBeenCalledTimes(2));
  });
});
