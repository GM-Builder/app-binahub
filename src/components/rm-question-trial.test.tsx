import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {RMQuestionTrial} from './rm-question-trial';
afterEach(cleanup);
const definition={selfReportScale:[{value:4,label:'Sering'}],selfReportItems:[{id:'SR1',prompt:'Pertanyaan sintetis pertama'}],sjtItems:[{id:'SJT1',scenario:'Kondisi sintetis',question:'Apa yang Anda pilih?',options:[{id:'B',text:'Pilihan sintetis'}]}]};
describe('RM full internal trial',()=>{
 it('requires answers, preserves back/edit choices and submits both methods once after review',async()=>{
  const complete=vi.fn().mockResolvedValue(true),close=vi.fn();
  render(<RMQuestionTrial definition={definition} onComplete={complete} onClose={close}/>);
  expect(screen.getByRole('button',{name:'Lanjut'})).toBeDisabled();
  fireEvent.click(screen.getByRole('radio',{name:'Sering'}));fireEvent.click(screen.getByRole('button',{name:'Lanjut'}));
  expect(screen.getByText('Kondisi sintetis')).toBeVisible();
  fireEvent.click(screen.getByRole('button',{name:'Kembali'}));expect(screen.getByRole('radio')).toBeChecked();
  fireEvent.click(screen.getByRole('button',{name:'Lanjut'}));fireEvent.click(screen.getByRole('radio',{name:'Pilihan sintetis'}));fireEvent.click(screen.getByRole('button',{name:'Tinjau jawaban'}));
  expect(complete).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Selesaikan uji dan lihat laporan'}));
  await vi.waitFor(()=>expect(complete).toHaveBeenCalledWith({SR1:4,SJT1:'B'}));expect(close).toHaveBeenCalledOnce();
 });
 it('keeps the review available when the server rejects completion',async()=>{
  const complete=vi.fn().mockResolvedValue(false),close=vi.fn();
  render(<RMQuestionTrial definition={definition} onComplete={complete} onClose={close}/>);
  fireEvent.click(screen.getByRole('radio',{name:'Sering'}));fireEvent.click(screen.getByRole('button',{name:'Lanjut'}));fireEvent.click(screen.getByRole('radio',{name:'Pilihan sintetis'}));fireEvent.click(screen.getByRole('button',{name:'Tinjau jawaban'}));fireEvent.click(screen.getByRole('button',{name:'Selesaikan uji dan lihat laporan'}));
  await vi.waitFor(()=>expect(complete).toHaveBeenCalledOnce());expect(close).not.toHaveBeenCalled();expect(screen.getByRole('heading',{name:'Tinjau jawaban uji'})).toBeVisible();
 });
});
