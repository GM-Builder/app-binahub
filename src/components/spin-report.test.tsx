import { render,screen } from '@testing-library/react';
import { describe,it,expect } from 'vitest';
import { SpinReport } from './spin-report';
import { spinSyntheticReport } from '@/test/fixtures/spin-report';

describe('consulting report dashboard',()=>{
 it('breaks dense summaries into readable points while keeping every detail available',()=>{
  render(<SpinReport report={{...spinSyntheticReport,summary:{...spinSyntheticReport.summary,problem:'Koordinasi belum lancar. · Informasi berbeda.; Proses berubah. · Dukungan terbatas. · Hambatan lainnya.'}}}/>);
  expect(screen.getByText('Koordinasi belum lancar.').tagName).toBe('LI');
  expect(screen.getByText('Lihat 2 poin lainnya').tagName).toBe('SUMMARY');
  expect(screen.getByText('Dukungan terbatas.')).toBeInTheDocument();
 });
 it('connects need, outcomes, catalog program, competency focus and bounded investment',()=>{
  render(<SpinReport report={spinSyntheticReport}/>);
  expect(screen.getByRole('heading',{name:'Arah pengembangan, dalam satu pandangan'})).toBeInTheDocument();
  expect(screen.getByText('Meeting Leadership')).toBeInTheDocument();
  expect(screen.getByText(/Rp\s*25\.000\.000/)).toBeInTheDocument();
  expect(screen.getByText(/bukan skor atau hasil pengukuran/)).toBeInTheDocument();
  expect(screen.getByText('Lihat materi dan komponen program').tagName).toBe('SUMMARY');
 });
 it('displays verified catalog options for review without suggesting a definite offer or price',()=>{
  render(<SpinReport report={{...spinSyntheticReport,solutions:[],exploration:spinSyntheticReport.solutions,investments:[],advisory:{status:'review_required',title:'Opsi program untuk dibahas bersama',description:'Kebutuhan proses dan pembelajaran perlu diselaraskan.',reasons:['Pelatihan saja belum cukup.']}}}/>);
  expect(screen.getByRole('heading',{name:'Meeting Excellence & Facilitation'})).toBeInTheDocument();
  expect(screen.getByText('Pelatihan saja belum cukup.')).toBeInTheDocument();
  expect(screen.queryByText(/25\.000\.000/)).not.toBeInTheDocument();
 });
 it('reads an unchanged legacy report honestly without inventing competencies or catalog options',()=>{
  render(<SpinReport report={{...spinSyntheticReport,solutions:[],investments:[]}}/>);
  expect(screen.getByRole('heading',{name:'Belum ada program yang ditetapkan'})).toBeInTheDocument();
  expect(screen.queryByText('Meeting Leadership')).not.toBeInTheDocument();
  expect(screen.getByRole('link',{name:/Bahas kebutuhan/})).toHaveAttribute('href','mailto:admin@binahub.id');
 });
});
