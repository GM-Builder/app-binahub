import { SITE_URL } from '@/lib/site';
export const INBOUND_CHANNELS = [
  { id: 'social', label: 'Media sosial', channel: 'organic', source: 'social', medium: 'social' },
  { id: 'email', label: 'Email', channel: 'email', source: 'newsletter', medium: 'email' },
  { id: 'google', label: 'Google Ads', channel: 'google_ads', source: 'google', medium: 'cpc' },
  { id: 'meta', label: 'Meta Ads', channel: 'meta_ads', source: 'meta', medium: 'paid_social' },
  { id: 'linkedin', label: 'LinkedIn', channel: 'linkedin', source: 'linkedin', medium: 'social' },
  { id: 'referral', label: 'Rujukan / mitra', channel: 'referral', source: 'partner', medium: 'referral' },
] as const;
export const INBOUND_DESTINATIONS = [
  { path: '/rekomendasi-program', label: 'Rekomendasi program organisasi', url: 'https://binahub.id/rekomendasi-program' },
  { path: '/insight', label: 'Diagnosis tim / organisasi', url: SITE_URL + '/insight' },
] as const;
export type InboundCampaign = { id: string; source_id: string; campaign_code: string; name: string; status: string;
  channel: string; owner: string; utm_config: Record<string, unknown>; target_definition: Record<string, unknown> };
export function inboundCampaignLink(campaign: InboundCampaign) {
  const path = campaign.target_definition?.landingPath;
  const destination = INBOUND_DESTINATIONS.find(item => item.path === path);
  if (!destination) return null;
  const link = new URL(destination.url);
  for (const [key, field] of [['utm_source', 'source'], ['utm_medium', 'medium'], ['utm_campaign', 'campaign']]) {
    const value = campaign.utm_config?.[field];
    if (typeof value !== 'string' || !value.trim() || value.length > 200) return null;
    link.searchParams.set(key, value);
  }
  return link.href;
}
