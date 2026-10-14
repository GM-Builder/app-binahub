import { beforeEach,afterEach,describe,it,expect,vi } from 'vitest';
import { guestRequest,makeGuestKey } from './pe-guest';
const fetchMock=vi.fn();
beforeEach(()=>{fetchMock.mockReset();vi.stubGlobal('fetch',fetchMock);});
afterEach(()=>vi.unstubAllGlobals());
describe('guest same-origin transport',()=>{
  it('keeps cookies on the app rewrite without adding an account bearer token',async()=>{
    fetchMock.mockResolvedValue(new Response(JSON.stringify({success:true})));
    await guestRequest('/test/result');
    const [url,opts]=fetchMock.mock.calls[0];expect(url).toBeInstanceOf(URL);expect(url.origin).toBe(window.location.origin);
    expect(opts.credentials).toBe('include');expect(opts.headers.Authorization).toBeUndefined();expect(opts.cache).toBe('no-store');
  });
  it('sends the separate draft capability in a header, never the URL or body',async()=>{
    fetchMock.mockResolvedValue(new Response(JSON.stringify({success:true})));
    await guestRequest('/test','PATCH',{revision:0,responses:{}},'a'.repeat(64));
    const [url,opts]=fetchMock.mock.calls[0];expect(String(url)).not.toContain('a'.repeat(64));expect(opts.body).not.toContain('a'.repeat(64));
    expect(opts.headers.Authorization).toBe('PE-Draft '+'a'.repeat(64));
  });
  it('preserves safe service error codes and generates 256-bit capabilities',async()=>{
    fetchMock.mockResolvedValue(new Response(JSON.stringify({success:false,code:'PE_LINK_EXPIRED',error:'Minta tautan baru.'}),{status:410}));
    await expect(guestRequest('/test/result')).rejects.toMatchObject({code:'PE_LINK_EXPIRED',status:410});
    const key=makeGuestKey();expect(key).toMatch(/^[a-f0-9]{64}$/);expect(makeGuestKey()).not.toBe(key);
  });
});
