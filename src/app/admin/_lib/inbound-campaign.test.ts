import { describe, expect, it } from 'vitest';
import { inboundCampaignLink, type InboundCampaign } from './inbound-campaign';
const fixture: InboundCampaign = { id: 'id', source_id: 'source', campaign_code: 'INBOUND-TEST', name: 'Kampanye', channel: 'organic', owner: 'admin@company.invalid',
  status: 'approved', utm_config: { source: 'social', medium: 'social', campaign: 'inbound-test' }, target_definition: { landingPath: '/rekomendasi-program' } };
describe('inbound campaign URL', () => {
  it('uses the tracked recommendation landing page, not the untracked direct form', () => {
    const link = new URL(inboundCampaignLink(fixture)!); expect(link.origin + link.pathname).toBe('https://binahub.id/rekomendasi-program');
    expect(Object.fromEntries(link.searchParams)).toEqual({ utm_source: 'social', utm_medium: 'social', utm_campaign: 'inbound-test' });
  });
  it.each(['https://evil.invalid', '//evil.invalid', '/admin', '/discovery', '/catalog', undefined])('never builds unknown or legacy destination %s', landingPath => {
    expect(inboundCampaignLink({ ...fixture, target_definition: { landingPath } })).toBeNull();
  });
  it('does not guess missing tracking or include identity data from other campaign fields', () => {
    expect(inboundCampaignLink({ ...fixture, utm_config: {} })).toBeNull();
    expect(inboundCampaignLink({ ...fixture, utm_config: { ...fixture.utm_config, campaign: 'x'.repeat(201) } })).toBeNull();
    expect(inboundCampaignLink(fixture)).not.toContain('admin');
  });
});
