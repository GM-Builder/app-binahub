import type { PipelineLeadRecord } from '@/app/admin/_lib/types';
export const pipelineInboxFixture=(overrides:Partial<PipelineLeadRecord>={}):PipelineLeadRecord=>({
  id:'11111111-1111-4111-8111-111111111111',name:'Peluang Sintetis',email:'contact@company.invalid',company:'Organisasi Sintetis',
  industry:'Jasa',location:'Jakarta',qualificationProfile:{},phone:'',source:'website',leadScore:72,leadTemperature:'warm',
  leadScoreConfidence:90,lifecycleStage:'lead',opportunityStage:'qualified',opportunityOwner:'admin@company.invalid',
  nextAction:'Konfirmasi kebutuhan',nextActionDueAt:'2099-01-01T03:00:00Z',leadTimeZone:'Asia/Jakarta',opportunityValue:25000000,
  lostReason:null,wonAt:null,lostAt:null,outreachPaused:false,outreachPauseReason:null,outreachPausedAt:null,outreachPausedBy:null,
  pipelineUpdatedAt:'2026-11-01T03:00:00Z',createdAt:'2026-11-01T03:00:00Z',...overrides,
});
export const pipelineInboxBody=(records=[pipelineInboxFixture()],total=41,page=0)=>({
  success:true,version:1,page,pageSize:20,snapshotAt:'2026-11-03T03:00:00Z',records,total,totalValue:1025000000,
  counts:{all:41,attention:22,overdue:11,unassigned:7,paused:3,value:1025000000,valued:30},
  views:{active:41,won:9,lost:5,review:1},stages:{qualified:{total:41,value:1025000000,valued:30}},
  facets:{owners:['admin@company.invalid'],sources:['website','manual_upload']},
});
export const pipelineDetailBody=(record=pipelineInboxFixture(),page=0)=>({success:true,record,context:{
  historyPage:page,activityTotal:25,assessments:4,meetings:3,accountId:null,
  activities:[{id:`history-${page}`,leadId:record.id,assessmentId:null,inquiryId:null,eventType:'stage_changed',
    fromStage:'identified',toStage:'qualified',actor:'admin@company.invalid',note:page?'Catatan riwayat lama':'Catatan terbaru',metadata:{},createdAt:'2026-11-01T03:00:00Z'}],
}});
