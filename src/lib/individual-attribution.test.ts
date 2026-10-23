import { describe, expect, it } from 'vitest';
import { personalEntryPath } from './individual-assessment';
describe('individual attribution handoff', () => {
  it('preserves campaign and opaque journey but not private parameters', () => {
    const path=personalEntryPath('?utm_source=instagram&utm_campaign=october&utm_content=video&bh_journey=11111111-1111-4111-8111-111111111111&email=private@example.com&access=secret');
    const params=new URL(path,'https://app.binahub.id').searchParams;
    expect(params.get('utm_campaign')).toBe('october');
    expect(params.get('bh_journey')).toBe('11111111-1111-4111-8111-111111111111');
    expect(params.has('email')).toBe(false);expect(params.has('access')).toBe(false);
    expect(personalEntryPath('')).toBe('/insight/individual');
  });
  it('drops contact details and private URLs even when put inside tracking fields',()=>{
    expect(personalEntryPath('?utm_source=someone@example.invalid&utm_campaign=https%3A%2F%2Fprivate.test%2Fresult&utm_term=access_token%3Dsecret')).toBe('/insight/individual?source=other');
  });
});
