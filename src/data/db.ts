// Thin IndexedDB layer. The app keeps a working copy in memory (see store.ts)
// and writes every change through here. If IndexedDB is unavailable the app
// still runs, just without saving – `isPersistent()` reports which.
//
// A future sync adapter only needs these same four operations plus the
// `updatedAt` / `deletedAt` fields every record already carries.

export type StoreName = 'trackers' | 'entries' | 'categories' | 'meta' | 'pages' | 'assets';

const DB_NAME = 'daybook';
const DB_VERSION = 2; // v2 adds scrapbook pages and their photos

let dbPromise: Promise<IDBDatabase | null> | null = null;
let persistent = false;

function open(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('trackers')) db.createObjectStore('trackers', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('entries')) {
          const s = db.createObjectStore('entries', { keyPath: 'id' });
          s.createIndex('trackerId', 'trackerId');
          s.createIndex('date', 'date');
        }
        if (!db.objectStoreNames.contains('categories')) db.createObjectStore('categories', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
        if (!db.objectStoreNames.contains('pages')) db.createObjectStore('pages', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('assets')) db.createObjectStore('assets', { keyPath: 'id' });
      };
      req.onsuccess = () => {
        persistent = true;
        resolve(req.result);
      };
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

const wrap = <T>(req: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

export const isPersistent = () => persistent;

export async function getAll<T>(store: StoreName): Promise<T[]> {
  const db = await open();
  if (!db) return [];
  try {
    return await wrap(db.transaction(store).objectStore(store).getAll() as IDBRequest<T[]>);
  } catch {
    return [];
  }
}

export async function get<T>(store: StoreName, key: string): Promise<T | undefined> {
  const db = await open();
  if (!db) return undefined;
  try {
    return await wrap(db.transaction(store).objectStore(store).get(key) as IDBRequest<T | undefined>);
  } catch {
    return undefined;
  }
}

export async function keys(store: StoreName): Promise<string[]> {
  const db = await open();
  if (!db) return [];
  try {
    return (await wrap(db.transaction(store).objectStore(store).getAllKeys())) as string[];
  } catch {
    return [];
  }
}

export async function put(store: StoreName, value: unknown): Promise<void> {
  const db = await open();
  if (!db) return;
  await wrap(db.transaction(store, 'readwrite').objectStore(store).put(value));
}

export async function remove(store: StoreName, key: string): Promise<void> {
  const db = await open();
  if (!db) return;
  await wrap(db.transaction(store, 'readwrite').objectStore(store).delete(key));
}

export async function replaceAll(data: Partial<Record<StoreName, unknown[]>>): Promise<void> {
  const db = await open();
  if (!db) return;
  const names = Object.keys(data) as StoreName[];
  const tx = db.transaction(names, 'readwrite');
  for (const name of names) {
    const s = tx.objectStore(name);
    s.clear();
    for (const v of data[name] ?? []) s.put(v);
  }
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/** Ask the browser not to clear this app's data when the device runs low on space. */
export async function requestDurableStorage(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch {
    /* not supported */
  }
  return false;
}
