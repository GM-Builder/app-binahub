import {describe,it,expect} from 'vitest';
import {peCombinedScore} from './pe-combined-score';
describe('temporary equal-weight display score',()=>{
 it('weights methods equally rather than weighting question counts',()=>{
  expect(peCombinedScore(50,100)).toBe(75);expect(peCombinedScore(62.5,66.67)).toBe(64.59);
  expect(peCombinedScore(0,0)).toBe(0);
 });
 it('does not replace missing evidence with a zero or the other method',()=>{
  expect(peCombinedScore(null,90)).toBeNull();expect(peCombinedScore(90,null)).toBeNull();
  expect(peCombinedScore(NaN,90)).toBeNull();
 });
});
