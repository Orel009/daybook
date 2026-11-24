// Print-quality copies of photos, for people who print their book.
//
// A photo on a page is stored at 1600 pixels at most, which is plenty for a
// screen and keeps the book small to sync. Printed large it looks soft. With
// "Keep print-quality photos on this device" switched on, a new photo also
// keeps a copy of up to 3000 pixels here.
//
// These copies never leave the device: they are not synced, not shared and not
// part of a backup. They live in a small database of their own, apart from the
// book, and go when their photo goes. The switch itself is remembered on this
// device only.

export const PRINT_SIDE = 3000;
const KEY = 'daybook.keepPrintPhotos';
const DB_NAME = 'daybook-print';
const STORE = 'photos';

export interface PrintPhoto {
  id: string; // the same id as the photo it is a copy of
  blob: Blob;
  w: number;
  h: number;
}

export function keepsPrintPhotos(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function setKeepPrintPhotos(on: boolean): void {
  try {
    if (on) localStorage.setItem(KEY, '1');
    else localStorage.removeItem(KEY);
  } catch {
    /* nowhere to remember it: it stays off */
  }
}

let opening: Promise<IDBDatabase | null> | null = null;
function open(): Promise<IDBDatabase | null> {
  opening ??= new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return opening;
}

const wrap = <T>(req: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

async function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>, fallback: T): Promise<T> {
  const db = await open();
  if (!db) return fallback;
  try {
    return await wrap(work(db.transaction(STORE, mode).objectStore(STORE)));
  } catch {
    return fallback;
  }
}

export const savePrintPhoto = (photo: PrintPhoto): Promise<unknown> => run<unknown>('readwrite', (s) => s.put(photo) as IDBRequest<unknown>, undefined);
export const printPhoto = (id: string): Promise<PrintPhoto | undefined> => run<PrintPhoto | undefined>('readonly', (s) => s.get(id), undefined);
export const removePrintPhoto = (id: string): Promise<unknown> => run<unknown>('readwrite', (s) => s.delete(id) as IDBRequest<unknown>, undefined);
export const removeAllPrintPhotos = (): Promise<unknown> => run<unknown>('readwrite', (s) => s.clear() as IDBRequest<unknown>, undefined);

/** How many print-quality copies there are and how much room they take. */
export async function printPhotoUsage(): Promise<{ count: number; bytes: number }> {
  const all = await run<PrintPhoto[]>('readonly', (s) => s.getAll(), []);
  return { count: all.length, bytes: all.reduce((n, p) => n + (p.blob?.size ?? 0), 0) };
}
