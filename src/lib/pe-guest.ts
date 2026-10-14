import { PERequestError } from './individual-assessment';
export const guestBase = '/api/assessment/individual/guest';
export function makeGuestKey() { return Array.from(crypto.getRandomValues(new Uint8Array(32)), value => value.toString(16).padStart(2, '0')).join(''); }
export async function guestRequest<T>(path = '', method = 'GET', body?: unknown, key?: string): Promise<T> {
  // URL objects bypass the legacy authenticated fetch bridge. Keep private result cookies
  // same-origin through Next's existing API rewrite, including on local/staging browsers.
  const response = await fetch(new URL(guestBase + path,window.location.origin), { method, credentials: 'include', cache: 'no-store',
    signal: AbortSignal.timeout(20_000), headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(key ? { Authorization: `PE-Draft ${key}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.success !== true) throw new PERequestError(data?.error || 'Belum dapat terhubung. Coba lagi.', data?.code || 'PE_NETWORK_ERROR', response.status);
  return data;
}
