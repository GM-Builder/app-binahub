import {render,screen,cleanup} from '@testing-library/react';
import {afterEach,describe,it,expect} from 'vitest';
import {IndividualPackages} from './individual-packages';
afterEach(cleanup);
describe('locked individual packages',()=>{
 it('shows exact owner prices, leaves free entry active and never offers checkout',()=>{
  render(<IndividualPackages freeHref="/insight/individual?utm_source=email"/>);
  for(const price of ['59.000','89.000','69.000','119.000','299.000'])expect(screen.getByText(new RegExp(price.replace('.','\\.')))).toBeVisible();
  expect(screen.getAllByText('Coming soon')).toHaveLength(5);
  expect(screen.getByRole('link',{name:'Mulai Self Diagnostic gratis'})).toHaveAttribute('href','/insight/individual?utm_source=email');
  expect(screen.queryByRole('button',{name:/beli|bayar/i})).not.toBeInTheDocument();
 });
 it('presents four focused plans and a complete plan with explicit locked availability',()=>{
  render(<IndividualPackages/>);
  expect(screen.getByRole('heading',{level:1,name:'Pilih Self Diagnostic Anda.'})).toBeVisible();
  expect(screen.getByRole('region',{name:'Paket lengkap'})).toBeVisible();
  expect(screen.getAllByRole('heading',{level:3})).toHaveLength(4);
  for(const button of screen.getAllByRole('button',{name:/Coming soon:/})){
   expect(button).toBeDisabled();
   expect(button).toHaveAttribute('aria-describedby','package-availability');
  }
  expect(screen.getAllByRole('button')).toHaveLength(5);
  expect(screen.getByRole('heading',{name:'Sudah pernah melakukan diagnosis?'})).toBeVisible();
  expect(screen.getByRole('link',{name:'Lihat hasil individu'})).toHaveAttribute('href','/insight/individual/result');
  expect(screen.getByRole('link',{name:'Lanjutkan draf individu'})).toHaveAttribute('href','/insight/individual');
  expect(screen.getByText('Paket gratis tersedia sekarang. Paket berbayar belum dapat dibeli.')).toBeVisible();
  expect(screen.getByRole('link',{name:'Mulai Self Diagnostic gratis'})).toHaveAttribute('href','/insight/individual');
 });
});
