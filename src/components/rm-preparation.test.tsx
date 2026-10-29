import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
const deps=vi.hoisted(()=>({session:vi.fn(),fetch:vi.fn()}));
vi.mock('@/lib/supabase',()=>({supabase:{auth:{getSession:deps.session}}}));
import {RMPreparation} from './rm-preparation';
const readiness={version:'4.0.0-draft.1',sourceLoaded:true,canSell:false,counts:{competencies:9,selfReport:27,sjt:13},missing:['Bobot studi kasus belum disahkan.'],reportSections:['Profil sembilan kompetensi']};
beforeEach(()=>{vi.resetAllMocks();deps.session.mockResolvedValue({data:{session:{access_token:'synthetic'}}});vi.stubGlobal('fetch',deps.fetch);});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
describe('RM preparation review',()=>{
 it('shows missing installation and never offers checkout',async()=>{
  deps.fetch.mockResolvedValue(new Response(JSON.stringify({success:true,readiness:{...readiness,sourceLoaded:false},definition:null})));
  render(<RMPreparation/>);await screen.findByText(/Sumber privat belum dipasang/);expect(screen.queryByRole('button',{name:/beli|bayar/i})).not.toBeInTheDocument();
 });
 it('previews synthetic answers without saving, changing source, or claiming a complete SJT score',async()=>{
  deps.fetch.mockImplementation(async(_url,options)=>new Response(JSON.stringify(options.method==='POST'?{success:true,report:{notice:'Pratinjau internal',areas:[{code:'RM-07',name:'Communication',selfReport:{score:75,validCount:3},sjt:{score:null}}],actionPlan:{days:30,stages:['Fokus perilaku']}}}:{success:true,readiness,definition:{competencies:[],selfReportScale:[{value:4,label:'Sering'}],selfReportItems:[{id:'synthetic',prompt:'Pertanyaan sintetis'}],sjtItems:[]}})));
  render(<RMPreparation/>);await screen.findByText(/9 kompetensi/);fireEvent.click(screen.getByText('Tinjau bank soal dan coba laporan'));
  fireEvent.change(screen.getByRole('combobox',{name:'Jawaban 1'}),{target:{value:'4'}});fireEvent.click(screen.getByRole('button',{name:'Lihat pratinjau laporan'}));
  await screen.findByRole('region',{name:'Pratinjau laporan RM'});expect(screen.getByText('Menunggu bobot')).toBeInTheDocument();
  expect(JSON.parse(deps.fetch.mock.calls[1][1].body)).toEqual({responses:{synthetic:4}});
 });
});
