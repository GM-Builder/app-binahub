import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {PetaPDFDownload} from './peta-pdf-download';
import {PetaGroupReport} from './peta-group-report';
import {petaSyntheticReport} from '@/test/fixtures/peta';
const auth=vi.hoisted(()=>({getSession:vi.fn()}));
vi.mock('@/lib/supabase',()=>({supabase:{auth}}));
const group={workspaceId:'test-workspace',programName:'Program sintetis',audience:'internal_admin',issuedAt:petaSyntheticReport.submittedAt,counts:{total:25,included:22,unfinished:1,restricted:1,unavailable:1},members:Array.from({length:22},(_,i)=>({participantName:'Sintetis '+i,report:{...petaSyntheticReport,participantCode:'SYNTHETIC-'+i}}))};
beforeEach(()=>{vi.stubGlobal('fetch',vi.fn());auth.getSession.mockResolvedValue({data:{session:{access_token:'synthetic-admin-token'}}});});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
describe('PETA private PDF controls',()=>{
 it('waits for an explicit click, uses authenticated server IDs only, and does not generate scores in the browser',async()=>{
  vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({success:false,error:'Izin peninjauan tidak tersedia.'}),{status:404,headers:{'Content-Type':'application/json'}}));
  render(<PetaPDFDownload target={{kind:'individual',sessionId:'session-a'}}/>);expect(fetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Unduh PDF individu'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('Izin peninjauan tidak tersedia.');
  expect(fetch).toHaveBeenCalledWith(expect.any(URL),expect.objectContaining({method:'POST',credentials:'include',cache:'no-store',headers:expect.objectContaining({Authorization:'Bearer synthetic-admin-token'}),body:JSON.stringify({sessionId:'session-a'})}));
  expect(screen.getByRole('button',{name:'Unduh PDF individu'})).toBeEnabled();
 });
 it('refuses a success page or JSON masquerading as a PDF and offers retry',async()=>{
  vi.mocked(fetch).mockResolvedValue(new Response('<html>not a PDF</html>',{status:200,headers:{'Content-Type':'text/html'}}));
  render(<PetaPDFDownload target={{kind:'individual',sessionId:'session-a'}}/>);fireEvent.click(screen.getByRole('button'));
  expect(await screen.findByRole('alert')).toHaveTextContent('Berkas PDF belum tersedia');
  expect(vi.mocked(fetch).mock.calls[0][1]?.headers).toEqual({'Content-Type':'application/json',Authorization:'Bearer synthetic-admin-token'});
 });
 it('never requests an admin PDF after the login session expires',async()=>{
  auth.getSession.mockResolvedValue({data:{session:null}});
  render(<PetaPDFDownload target={{kind:'individual',sessionId:'session-a'}}/>);fireEvent.click(screen.getByRole('button'));
  expect(await screen.findByRole('alert')).toHaveTextContent('Sesi berakhir');expect(fetch).not.toHaveBeenCalled();
 });
 it('downloads a protected blob without putting credentials in its URL or storing a report',async()=>{
  const create=vi.fn(()=> 'blob:synthetic');Object.defineProperty(URL,'createObjectURL',{configurable:true,value:create});Object.defineProperty(URL,'revokeObjectURL',{configurable:true,value:vi.fn()});
  const click=vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});
  vi.mocked(fetch).mockResolvedValue(new Response('%PDF-1.3 synthetic',{status:200,headers:{'Content-Type':'application/pdf'}}));
  render(<PetaPDFDownload target={{kind:'group',workspaceId:'workspace-a'}}/>);fireEvent.click(screen.getByRole('button'));
  expect(await screen.findByRole('status')).toHaveTextContent('Periksa unduhan');expect(click).toHaveBeenCalledOnce();expect(create).toHaveBeenCalledOnce();
  expect(String(vi.mocked(fetch).mock.calls[0][0])).toMatch(/\/api\/peta\/admin\/reports\/group\/pdf$/);
  expect(document.querySelector('a[download]')).not.toBeInTheDocument();
 });
 it('never offers a cross-program group export',()=>{
  render(<PetaGroupReport/>);expect(screen.getByRole('heading',{name:'Pilih satu program terlebih dahulu'})).toBeVisible();expect(screen.queryByRole('button',{name:'Unduh PDF grup'})).not.toBeInTheDocument();expect(fetch).not.toHaveBeenCalled();
 });
 it('shows server-wide coverage, not the visible dashboard page, and refreshes permissions for PDF',async()=>{
  vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({success:true,report:group}),{headers:{'Content-Type':'application/json'}}));
  render(<PetaGroupReport workspaceId="test-workspace"/>);expect(fetch).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Siapkan laporan grup'}));
  expect(await screen.findByRole('button',{name:'Unduh PDF grup'})).toBeVisible();expect(screen.getByText('25',{exact:true})).toBeVisible();expect(screen.getByText('22',{exact:true})).toBeVisible();
  expect(screen.getAllByRole('row')).toHaveLength(23);expect(screen.getByText(/Izin dan kelayakan diperiksa ulang/)).toBeVisible();
  expect(vi.mocked(fetch).mock.calls[0][1]?.body).toBe(JSON.stringify({workspaceId:'test-workspace'}));
 });
 it('explains an empty group instead of producing an empty PDF',async()=>{
  vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({success:true,report:{...group,counts:{total:1,included:0,unfinished:0,restricted:1,unavailable:0},members:[]}}),{headers:{'Content-Type':'application/json'}}));
  render(<PetaGroupReport workspaceId="test-workspace"/>);fireEvent.click(screen.getByRole('button'));
  expect(await screen.findByRole('heading',{name:'Belum ada hasil yang dapat disertakan'})).toBeVisible();expect(screen.queryByRole('button',{name:'Unduh PDF grup'})).not.toBeInTheDocument();
 });
 it('discards a stale response after changing program',async()=>{
  let resolve!:(value:Response)=>void;vi.mocked(fetch).mockReturnValue(new Promise(r=>{resolve=r;}));
  const view=render(<PetaGroupReport key="a" workspaceId="a"/>);fireEvent.click(screen.getByRole('button'));
  await waitFor(()=>expect(fetch).toHaveBeenCalled());view.rerender(<PetaGroupReport key="b" workspaceId="b"/>);resolve(new Response(JSON.stringify({success:true,report:group})));
  await waitFor(()=>expect(screen.queryByRole('button',{name:'Unduh PDF grup'})).not.toBeInTheDocument());
 });
});
