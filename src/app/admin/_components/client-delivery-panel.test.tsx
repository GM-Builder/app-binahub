import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {assessmentDashboard} from '@/test/fixtures/assessment-admin';
import type {PipelineLeadRecord} from '../_lib/types';
import {ClientDeliveryPanel} from './client-delivery-panel';
import {clientJourneyFixture} from '@/test/fixtures/client-journey';
afterEach(()=>{cleanup();window.history.replaceState(null,'','/');});
describe('won opportunity handoff entry',()=>{
  it('shows agreed indicators separately from impact and opens the existing project form without saving',()=>{
    const {data}=clientJourneyFixture(),action=vi.fn();
    render(<ClientDeliveryPanel data={data} onAction={action} onRefresh={vi.fn()}/>);
    expect(screen.getByText(/Indikator adalah acuan evaluasi/)).toBeVisible();
    expect(screen.getByText(/Peluang lanjutan belum merupakan order/)).toBeVisible();
    expect(screen.queryByText('Riwayat Aktivitas')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Lengkapi tujuan & indikator'}));
    expect(screen.getByLabelText('Tujuan pelaksanaan')).toHaveValue('');
    expect(screen.getByRole('textbox',{name:/^Indikator keberhasilan/})).toHaveValue('');
    expect(action).not.toHaveBeenCalled();
  });
  it('shows the exact linked Self Diagnostic brief at handoff without changing its fields or sending it',()=>{
    const {data,lead}=clientJourneyFixture();data.clientAccounts=[];data.deliveryProjects=[];
    window.history.replaceState(null,'',`/admin/clients?lead=${lead.id}`);
    const action=vi.fn();render(<ClientDeliveryPanel data={data} onAction={action} onRefresh={vi.fn()}/>);
    expect(screen.getByRole('dialog')).toHaveTextContent(data.assessments[0].challenge!);
    expect(screen.getByRole('dialog')).toHaveTextContent('bukan ukuran hasil yang sudah disepakati');
    expect(action).not.toHaveBeenCalled();
  });
  it('prefills a won lead without creating a client or reopening after refresh',()=>{
    const lead={id:'won-1',company:'Synthetic Company',name:'Synthetic',email:'synthetic@example.invalid',opportunityStage:'won',opportunityOwner:'owner@example.invalid'} as PipelineLeadRecord;
    const data={...assessmentDashboard([]),pipelineLeads:[lead]};const action=vi.fn(),refresh=vi.fn();
    window.history.replaceState(null,'','/admin/clients?lead=won-1');
    const view=render(<ClientDeliveryPanel data={data} onAction={action} onRefresh={refresh}/>);
    expect(screen.getByRole('dialog')).toBeVisible();expect(screen.getByLabelText('Nama proyek awal')).toHaveValue('Synthetic Company — Pelaksanaan Awal');
    expect(screen.getByLabelText('Penanggung jawab komersial')).toHaveValue('owner@example.invalid');
    expect(action).not.toHaveBeenCalled();expect(screen.getByRole('button',{name:'Buat klien & serahkan'})).toBeDisabled();
    fireEvent.click(screen.getByRole('button',{name:'Tutup modal'}));view.rerender(<ClientDeliveryPanel data={{...data}} onAction={action} onRefresh={refresh}/>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();expect(action).not.toHaveBeenCalled();
  });
  it('never opens a handoff for a lead that has not won',()=>{
    const data={...assessmentDashboard([]),pipelineLeads:[{id:'open-1',opportunityStage:'proposal'} as PipelineLeadRecord]};
    window.history.replaceState(null,'','/admin/clients?lead=open-1');
    render(<ClientDeliveryPanel data={data} onAction={vi.fn()} onRefresh={vi.fn()}/>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
