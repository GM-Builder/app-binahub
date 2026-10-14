// Only an encrypted, consented draft is persisted. Never fall back to plaintext localStorage.
export type PEGuestDraft = {
  id: string; draftKey: string; name: string; email: string;
  context: { role: string; goal: string; relevance: Record<string, 'low' | 'normal' | 'high'> };
  responses: Record<string, number | 'NA' | 'A' | 'B' | 'C' | 'D'>;
  baseResponses: PEGuestDraft['responses']; revision: number; submissionKey?: string; expiresAt: number;
};
const database = 'binahub-pe-private-draft-v1';
type Stored = { key: CryptoKey; iv: Uint8Array; encrypted: ArrayBuffer };
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(database, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('draft');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Draft lokal tidak tersedia.'));
  });
}
async function transaction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction('draft', mode), request = action(tx.objectStore('draft'));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(new Error('Draft lokal belum tersimpan.'));
      tx.onabort = () => reject(new Error('Draft lokal belum tersimpan.'));
    });
  } finally { db.close(); }
}
export async function readPEGuestDraft(): Promise<PEGuestDraft | null> {
  const saved = await transaction<Stored | undefined>('readonly', store => store.get('current'));
  if (!saved) return null;
  const decoded = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: saved.iv as Uint8Array<ArrayBuffer> }, saved.key, saved.encrypted);
  const draft = JSON.parse(new TextDecoder().decode(decoded)) as PEGuestDraft;
  if (draft.expiresAt <= Date.now()) { await clearPEGuestDraft(); return null; }
  return draft;
}
export async function savePEGuestDraft(draft: PEGuestDraft) {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(draft)));
  await transaction('readwrite', store => store.put({ key, iv, encrypted }, 'current'));
}
export async function clearPEGuestDraft() { await transaction('readwrite', store => store.delete('current')); }
