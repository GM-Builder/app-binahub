import { describe,expect,it } from 'vitest';
import { firstUnanswered,countAnswered,personalSignInPath,type PEQuestion } from './individual-assessment';
describe('PE navigation helpers',()=>{
  const questions:PEQuestion[]=[{id:'SR05',competencyCode:'PE-02',type:'self'},{id:'SJ03',competencyCode:'PE-02',type:'sjt'}];
  it('treats NA as answered and counts only entitled question IDs',()=>{
    expect(firstUnanswered(questions,{SR05:'NA'})).toBe(1);
    expect(countAnswered(questions,{SR01:5,SR05:'NA',SJ03:'D'})).toBe(2);
    expect(firstUnanswered(questions,{SR05:4,SJ03:'D'})).toBe(2);
  });
  it('uses a fixed internal return path for sign in and registration',()=>{
    expect(personalSignInPath('signup')).toBe('/?mode=signup&next=%2Finsight%2Findividual');
    expect(personalSignInPath('//evil')).toBe('/?mode=signin&next=%2Finsight%2Findividual');
  });
});
