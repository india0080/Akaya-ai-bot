/** Recorded audio lives in IndexedDB (blobs are too large for localStorage). */
const DB = 'akaya-voice-notes';
const STORE = 'audio';

function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('IndexedDB unavailable'));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db();
  return new Promise((resolve, reject) => {
    const req = fn(d.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const putAudio = (id: string, blob: Blob) => run('readwrite', (s) => s.put(blob, id));
export const getAudio = (id: string) => run<Blob | undefined>('readonly', (s) => s.get(id));
export const deleteAudio = (id: string) => run('readwrite', (s) => s.delete(id)).catch(() => undefined);
