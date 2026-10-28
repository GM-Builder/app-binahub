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
});
