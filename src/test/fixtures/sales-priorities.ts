import type { SalesTask } from '@/app/admin/_lib/sales-workspace';
export function salesTaskFixture(overrides:Partial<SalesTask>={}):SalesTask{
  return {id:'proposal:11111111-1111-4111-8111-111111111111',recordId:'11111111-1111-4111-8111-111111111111',kind:'proposal',
    name:'Nadia Sintetis',company:'Organisasi Sintetis',email:'nadia@company.invalid',source:'website',note:'Proposal diminta',action:'Buka proposal',
    view:'clients',detail:'proposal',priority:0,at:'2026-11-01T03:00:00Z',...overrides};
}
export function salesPrioritiesBody(records:SalesTask[]=[salesTaskFixture()],total=41,page=0){
  return {success:true,version:1,page,pageSize:20,snapshotAt:'2026-11-03T03:00:00Z',total,counts:{all:121,proposal:31,followup:42,won:8},
    records:records.map(task=>({...task,detail:task.detail??null}))};
}
