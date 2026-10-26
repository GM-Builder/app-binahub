import { cleanup,fireEvent,render,screen } from '@testing-library/react';
import { afterEach,beforeEach,describe,expect,it,vi } from 'vitest';
import definition from '@/test/fixtures/spin-definition.json';
import { DiscoverySteps, SpinDiscovery } from './spin-discovery';
import { SpinReport } from './spin-report';
import { spinSyntheticReport } from '@/test/fixtures/spin-report';
const mock=vi.hoisted(()=>({fetch:vi.fn()}));
vi.mock('next/link',()=>({default:({href,children,...rest}:React.AnchorHTMLAttributes<HTMLAnchorElement>)=><a href={href} {...rest}>{children}</a>}));
beforeEach(()=>{sessionStorage.clear();mock.fetch.mockReset();vi.stubGlobal('fetch',mock.fetch);});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
const json=(data:unknown)=>new Response(JSON.stringify(data));
describe('SPIN client experience',()=>{
 it('keeps all five stages readable without shortcuts past validation',()=>{
 render(<DiscoverySteps stages={definition.stages} active={2}/>);
 const stages=screen.getAllByRole('listitem');
 expect(stages).toHaveLength(5);
 expect(stages[2]).toHaveAttribute('aria-current','step');
 expect(stages[0]).toHaveTextContent('selesai');
 expect(stages[1]).toHaveTextContent('selesai');
 expect(screen.queryByRole('button')).not.toBeInTheDocument();
 expect(screen.queryByRole('link')).not.toBeInTheDocument();
 });
 it('keeps consent unchecked, no account requirement or automatic six-month deletion promise',async()=>{
 mock.fetch.mockResolvedValue(json({definition,available:true}));render(<SpinDiscovery/>);
 expect(await screen.findByText('Tentukan arah pengembangan organisasi Anda.')).toBeVisible();
 expect(screen.getByRole('checkbox')).not.toBeChecked();expect(screen.getByRole('button',{name:/Mulai pengisian/})).toBeDisabled();
 expect(screen.queryByText(/enam bulan/)).not.toBeInTheDocument();expect(screen.getByText(/Data disimpan tanpa penghapusan otomatis/)).toBeInTheDocument();
 });
 it('shows the choice immediately without waiting for an answer save',async()=>{
 const attempt={id:'11111111-1111-4111-8111-111111111111',revision:0,answers:{},confirmation:null,status:'draft'};
 mock.fetch.mockImplementation((_url,init)=>Promise.resolve(json(init?.method==='POST'?{attempt,challenge:'Berapa 3 + 4?'}:{definition,available:true})));
 render(<SpinDiscovery/>);fireEvent.click(await screen.findByRole('checkbox'));fireEvent.click(screen.getByRole('button',{name:/Mulai pengisian/}));
 const field=await screen.findByLabelText('Peran Anda');fireEvent.change(field,{target:{value:'R1'}});
 expect(field).toHaveAccessibleDescription('Pilih peran Anda dalam organisasi.');
 expect(screen.getByLabelText('Bidang usaha')).toHaveAccessibleDescription('Pilih bidang usaha utama organisasi Anda.');
 expect(screen.getByLabelText('Jumlah karyawan')).toHaveAccessibleDescription('Pilih rentang jumlah karyawan dalam organisasi Anda.');
 expect(field).toHaveValue('R1');expect(screen.getByRole('button',{name:'Lanjut'})).toBeEnabled();
 fireEvent.click(screen.getByRole('button',{name:'Lanjut'}));expect(await screen.findByRole('alert')).toHaveTextContent('Lengkapi');
 });
 it('keeps backend failures actionable without exposing configuration details',async()=>{
 mock.fetch.mockRejectedValue(new Error('Layanan belum tersedia.'));render(<SpinDiscovery/>);
 expect(await screen.findByRole('button',{name:'Coba lagi'})).toBeVisible();expect(screen.getByRole('link',{name:'Hubungi BinaHub'})).toHaveAttribute('href','mailto:admin@binahub.id');
 });
 it('renders six report sections with no internal statuses or expiry promises',()=>{
 render(<SpinReport report={spinSyntheticReport}/>);
 expect(screen.getAllByRole('heading',{level:2})).toHaveLength(6);
 expect(screen.getAllByRole('heading',{name:'Meeting Excellence & Facilitation'})).toHaveLength(2);
 expect(screen.getByText(/Rp.*25/)).toBeVisible();
 expect(document.body.textContent).not.toMatch(/prepared_not_active|fitType|leadTemperature|manual_review|katalog dasar|proposal standar|proposal custom|masa berlaku/i);
 });
});
