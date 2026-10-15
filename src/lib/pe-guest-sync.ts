import { PERequestError, type PEAttempt } from './individual-assessment';
import type { PEGuestDraft } from './pe-guest-storage';

type Reply = { attempt: PEAttempt; emailStatus?: string | null };
type Options = {
  current: () => PEGuestDraft | null;
  persist: (draft: PEGuestDraft) => Promise<void>;
  request: <T>(path: string, method?: string, body?: unknown, key?: string) => Promise<T>;
  startPayload: (draft: PEGuestDraft) => unknown;
  status: (message: string) => void;
  failure: (error: unknown) => void;
};
export const hasPendingPEAnswers = (draft: PEGuestDraft) => Object.entries(draft.responses)
  .some(([id, value]) => draft.baseResponses[id] !== value);

/** One serialized writer; UI selection/navigation never waits on this queue. */
export class PEGuestSyncQueue {
  private flight: Promise<void> | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;
  constructor(private options: Options) {}

  schedule() {
    if (this.disposed) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush().catch(this.options.failure);
    }, 350);
  }
  dispose() {
    this.disposed = true;
    if (this.timer) clearTimeout(this.timer);
  }
  async flush(submit = false): Promise<void> {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    // Multiple callers (online/retry/submit) cannot start concurrent PATCHes.
    while (this.flight) {
      try { await this.flight; } catch (error) { if (!submit) throw error; }
    }
    if (this.disposed) return;
    const work = this.drain(submit);
    this.flight = work;
    try { await work; } finally { if (this.flight === work) this.flight = null; }
  }
  private async drain(submit: boolean) {
    for (;;) {
      const current = this.options.current();
      if (!current || (!submit && (!hasPendingPEAnswers(current) || current.submissionKey))) return;
      const snapshot = structuredClone(current);
      if (submit) {
        snapshot.submissionKey ||= crypto.randomUUID();
        await this.options.persist(snapshot);
      }
      this.options.status(submit ? 'Mengirim jawaban…' : 'Menyimpan jawaban…');
      let pending = snapshot;
      let reply: Reply | null = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          reply = await this.options.request<Reply>(`/${snapshot.id}`, 'PATCH', {
            revision: pending.revision, responses: pending.responses,
            ...(submit ? { submissionKey: snapshot.submissionKey } : {}),
          }, snapshot.draftKey);
          break;
        } catch (error) {
          if (attempt > 0 || !(error instanceof PERequestError) || ![404, 409].includes(error.status)) throw error;
          const remote = error.status === 404
            ? await this.options.request<Reply>('', 'POST', this.options.startPayload(snapshot))
            : await this.options.request<Reply>(`/${snapshot.id}`, 'GET', undefined, snapshot.draftKey);
          const dirty = Object.entries(snapshot.responses).filter(([id, value]) => snapshot.baseResponses[id] !== value);
          if (dirty.some(([id, value]) => remote.attempt.responses[id] !== snapshot.baseResponses[id]
            && remote.attempt.responses[id] !== value)) {
            throw new Error('Jawaban berubah di tab lain. Pilihan Anda tetap disimpan di perangkat. Tinjau sebelum menyinkronkan kembali.');
          }
          pending = { ...snapshot, revision: remote.attempt.revision,
            responses: { ...remote.attempt.responses, ...Object.fromEntries(dirty) } };
        }
      }
      if (!reply) throw new Error('Jawaban belum dapat disimpan. Silakan coba lagi.');
      if (this.disposed) return;
      const latest = this.options.current();
      if (!latest || latest.id !== snapshot.id) return;
      // An old acknowledgement must not replace answers selected while the request was in flight.
      const newer = Object.fromEntries(Object.entries(latest.responses)
        .filter(([id, value]) => snapshot.responses[id] !== value));
      await this.options.persist({ ...latest, revision: reply.attempt.revision,
        baseResponses: reply.attempt.responses,
        responses: { ...reply.attempt.responses, ...newer },
        ...(submit ? { submissionKey: snapshot.submissionKey } : {}),
      });
      if (submit) return;
      if (!this.options.current() || !hasPendingPEAnswers(this.options.current()!)) {
        this.options.status('Semua jawaban tersimpan.'); return;
      }
    }
  }
}
