import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
const request=vi.hoisted(()=>vi.fn());
vi.mock('@/lib/pe-guest',()=>({guestRequest:request}));
import {PEConsultationRequest} from './pe-consultation-request';
beforeEach(()=>request.mockReset());afterEach(cleanup);
describe('individual consultation request',()=>{
  it('requires current sharing permission without sending marketing consent',()=>{
    render(<PEConsultationRequest id="synthetic" shared={false}/>);
    expect(screen.getByRole('button',{name:'Minta konsultasi'})).toBeDisabled();
    expect(screen.getByText(/Aktifkan izin tinjau/)).toBeVisible();expect(request).not.toHaveBeenCalled();
  });
  it('locks repeat clicks while pending and announces success',async()=>{
    let resolve!:(value:unknown)=>void;request.mockReturnValue(new Promise(done=>{resolve=done;}));
    render(<PEConsultationRequest id="synthetic" shared/>);
    const button=screen.getByRole('button',{name:'Minta konsultasi'});fireEvent.click(button);fireEvent.click(button);
    expect(screen.getByRole('button',{name:'Mengirim permintaan…'})).toBeDisabled();expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith('/synthetic/result','PATCH',{action:'request_consultation'});
    await act(async()=>resolve({success:true}));expect(screen.getByRole('status')).toHaveTextContent('Permintaan konsultasi diterima');
  });
  it('supports retry after an error and disables a revoked permission',async()=>{
    request.mockRejectedValueOnce(new Error('offline')).mockResolvedValue({success:true});
    const view=render(<PEConsultationRequest id="synthetic" shared/>);
    fireEvent.click(screen.getByRole('button',{name:'Minta konsultasi'}));await screen.findByRole('alert');
    view.rerender(<PEConsultationRequest id="synthetic" shared={false}/>);
    expect(screen.getByRole('button',{name:'Minta konsultasi'})).toBeDisabled();
    view.rerender(<PEConsultationRequest id="synthetic" shared/>);fireEvent.click(screen.getByRole('button',{name:'Minta konsultasi'}));
    await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('Permintaan konsultasi diterima'));expect(request).toHaveBeenCalledTimes(2);
  });
});
