import { afterEach, describe, expect, it, vi } from 'vitest';
import { PERequestError, type PEAttempt } from './individual-assessment';
import { PEGuestSyncQueue } from './pe-guest-sync';
import type { PEGuestDraft } from './pe-guest-storage';

function fixture() {
  let current: PEGuestDraft = { id: 'test-id', draftKey: 'key', name: 'Synthetic', email: 'synthetic@example.invalid',
    context: { role: 'Synthetic role', goal: 'Synthetic goal', relevance: {} }, responses: { SR01: 4 }, baseResponses: {}, revision: 0, expiresAt: Date.now() + 100000 };
  const request = vi.fn(), status = vi.fn(), failure = vi.fn();
  const persist = vi.fn(async (draft: PEGuestDraft) => { current = draft; });
  const queue = new PEGuestSyncQueue({ current: () => current, persist, request, startPayload: () => ({}), status, failure });
  return { queue, request, persist, status, failure, current: () => current, edit: (responses: PEGuestDraft['responses']) => { current = { ...current, responses }; } };
}
const reply = (responses: PEGuestDraft['responses'], revision: number) => ({ attempt: { id: 'test-id', status: 'draft', revision, responses } as PEAttempt });
afterEach(() => vi.useRealTimers());
describe('non-blocking guest answer sync', () => {
  it('batches quick selections and sends a direct PATCH without a preceding GET', async () => {
    vi.useFakeTimers(); const f = fixture(); f.request.mockResolvedValue(reply({ SR01: 4, SR02: 5 }, 1));
    f.queue.schedule(); f.edit({ SR01: 4, SR02: 5 }); f.queue.schedule();
    await vi.advanceTimersByTimeAsync(350);
    expect(f.request).toHaveBeenCalledTimes(1);
    expect(f.request.mock.calls[0]).toEqual(['/test-id', 'PATCH', { revision: 0, responses: { SR01: 4, SR02: 5 } }, 'key']);
    expect(f.current().revision).toBe(1); f.queue.dispose();
  });
  it('keeps new selections while an old acknowledgement is in flight and serializes writes', async () => {
    const f = fixture(); let complete!: (value: unknown) => void;
    f.request.mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }))
      .mockResolvedValueOnce(reply({ SR01: 5, SR02: 4 }, 2));
    const flush = f.queue.flush();
    f.edit({ SR01: 5, SR02: 4 });
    complete(reply({ SR01: 4 }, 1)); await flush;
    expect(f.current().responses).toEqual({ SR01: 5, SR02: 4 });
    expect(f.request.mock.calls[1][2]).toEqual({ revision: 1, responses: { SR01: 5, SR02: 4 } });
    expect(f.request).toHaveBeenCalledTimes(2); f.queue.dispose();
  });
  it('merges disjoint tab changes on conflict but never overwrites a conflicting answer', async () => {
    const f = fixture();
    f.request.mockRejectedValueOnce(new PERequestError('Conflict', 'PE_REVISION_CONFLICT', 409))
      .mockResolvedValueOnce(reply({ SR02: 3 }, 1)).mockResolvedValueOnce(reply({ SR01: 4, SR02: 3 }, 2));
    await f.queue.flush(); expect(f.current().responses).toEqual({ SR01: 4, SR02: 3 });
    f.edit({ SR01: 5, SR02: 3 });
    f.request.mockRejectedValueOnce(new PERequestError('Conflict', 'PE_REVISION_CONFLICT', 409))
      .mockResolvedValueOnce(reply({ SR01: 2, SR02: 3 }, 3));
    await expect(f.queue.flush()).rejects.toThrow('tab lain');
    expect(f.current().responses.SR01).toBe(5); expect(f.request).toHaveBeenCalledTimes(5); f.queue.dispose();
  });
  it('retains local answers after a network failure and safely retries a lost acknowledgement', async () => {
    const f = fixture(); f.request.mockRejectedValueOnce(new Error('offline'));
    await expect(f.queue.flush()).rejects.toThrow('offline'); expect(f.current().responses).toEqual({ SR01: 4 });
    f.request.mockRejectedValueOnce(new PERequestError('Conflict', 'PE_REVISION_CONFLICT', 409))
      .mockResolvedValueOnce(reply({ SR01: 4 }, 1)).mockResolvedValueOnce(reply({ SR01: 4 }, 2));
    await f.queue.flush(); expect(f.current().baseResponses).toEqual({ SR01: 4 }); f.queue.dispose();
  });
  it('waits for autosave, then finalizes the latest answers and reuses the same submission key on retry', async () => {
    const f = fixture(); let complete!: (value: unknown) => void;
    f.request.mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
    const background = f.queue.flush(); f.edit({ SR01: 5, SR02: 4 });
    f.request.mockResolvedValueOnce(reply({ SR01: 5, SR02: 4 }, 2)).mockRejectedValueOnce(new Error('lost submit response'));
    const submit = f.queue.flush(true); complete(reply({ SR01: 4 }, 1));
    await background; await expect(submit).rejects.toThrow('lost submit response');
    const key = f.current().submissionKey; expect(key).toBeTruthy();
    f.request.mockResolvedValueOnce(reply({ SR01: 5, SR02: 4 }, 3));
    await f.queue.flush(true);
    expect(f.request.mock.calls.at(-1)?.[2]).toMatchObject({ responses: { SR01: 5, SR02: 4 }, submissionKey: key });
    f.queue.dispose();
  });
  it('does not persist stale acknowledgements after the component was disposed', async () => {
    const f = fixture(); let complete!: (value: unknown) => void;
    f.request.mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
    const flush = f.queue.flush(); f.queue.dispose(); complete(reply({ SR01: 4 }, 1)); await flush;
    expect(f.persist).not.toHaveBeenCalled();
  });
});
