import {PetaRequestError, type PetaPair, type PetaSession} from './peta';

export type PetaSaveState = 'saved' | 'pending' | 'saving' | 'error';
type Transport = {
  save: (revision: number, blockId: string, pair: PetaPair) => Promise<PetaSession>;
  read: () => Promise<PetaSession>;
  state: (state: PetaSaveState) => void;
  session: (session: PetaSession) => void;
};
const equal = (a?: PetaPair, b?: PetaPair) => a?.most === b?.most && a?.least === b?.least;

/** Serial, in-memory synchronization. Never overwrites the participant's UI choices. */
export class PetaAnswerSync {
  private pending = new Map<string, PetaPair>();
  private flight: Promise<void> | null = null;
  private uncertain = false;
  private attempted: {id:string;pair:PetaPair} | null = null;
  private disposed = false;
  constructor(private current: PetaSession, private transport: Transport) {}
  get dirty() { return this.pending.size > 0 || this.flight !== null; }
  enqueue(blockId: string, pair: PetaPair) {
    this.pending.set(blockId, {...pair});
    this.transport.state('pending');
  }
  dispose() { this.disposed = true; }
  private async reconcile() {
    const remote = await this.transport.read();
    if (remote.id !== this.current.id || remote.status !== 'in_progress') {
      throw new PetaRequestError('Pengisian sudah berakhir. Muat jawaban tersimpan untuk melanjutkan.', 'PETA_FINALIZED', 409);
    }
    const keys = new Set([...Object.keys(this.current.answers), ...Object.keys(remote.answers)]);
    for (const id of keys) {
      if (!equal(remote.answers[id], this.current.answers[id]) && !equal(remote.answers[id], this.pending.get(id))
        && !(this.attempted?.id===id&&equal(remote.answers[id],this.attempted.pair))) {
        throw new PetaRequestError('Jawaban berubah pada tab lain. Muat versi tersimpan sebelum menyimpan kembali.', 'PETA_REVISION_CONFLICT', 412);
      }
    }
    for (const [id, pair] of this.pending) if (equal(remote.answers[id], pair)) this.pending.delete(id);
    this.current = remote;
    this.transport.session(remote);
    this.uncertain = false;
    this.attempted = null;
  }
  flush(): Promise<void> {
    if (this.flight) return this.flight;
    if (this.disposed) return Promise.reject(new Error('Sesi halaman sudah ditutup.'));
    const work = async () => {
      try {
        if (this.uncertain) await this.reconcile();
        while (this.pending.size && !this.disposed) {
          const [id, pair] = this.pending.entries().next().value!;
          this.transport.state('saving');
          this.attempted={id,pair};
          const remote = await this.transport.save(this.current.revision, id, pair);
          if (remote.id !== this.current.id) throw new Error('Sesi jawaban tidak sesuai.');
          this.current = remote;
          this.attempted = null;
          if (!this.disposed) this.transport.session(remote);
          if (this.pending.get(id) === pair) this.pending.delete(id);
        }
        if (!this.disposed) this.transport.state('saved');
      } catch (error) {
        this.uncertain = true;
        if (!this.disposed) this.transport.state('error');
        throw error;
      }
    };
    this.flight = work().finally(() => { this.flight = null; });
    return this.flight;
  }
}
