import { afterEach, describe, expect, it, vi } from 'vitest';
import { submitAssessment } from './assessment-submit';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
describe('Self Diagnostic submission', () => {
  it('acknowledges durable receipt immediately and finishes loading at five seconds', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, assessmentId: 'saved', processing: true }), { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);
    const accepted = vi.fn(); let done = false;
    const result = submitAssessment({}, 'stable-request-key', accepted).then(() => { done = true; });
    await vi.advanceTimersByTimeAsync(1);
    expect(accepted).toHaveBeenCalledOnce(); expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(4_999); await result;
    expect(done).toBe(true);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ keepalive: true, headers: { 'Idempotency-Key': 'stable-request-key' } });
  });
  it('never claims success on a failed save or malformed response', async () => {
    const accepted = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false, error: 'Unavailable' }), { status: 503 })));
    await expect(submitAssessment({}, 'stable-request-key', accepted)).rejects.toThrow('Unavailable');
    expect(accepted).not.toHaveBeenCalled();
  });
  it('waits for actual receipt when the connection takes longer than five seconds', async () => {
    vi.useFakeTimers(); const accepted = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(new Response(JSON.stringify({ success: true, assessmentId: 'saved' }), { status: 202 })), 7_000))));
    const result = submitAssessment({}, 'stable-request-key', accepted);
    await vi.advanceTimersByTimeAsync(5_000); expect(accepted).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(2_000); await result; expect(accepted).toHaveBeenCalledOnce();
  });
});
