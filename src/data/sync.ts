import { create } from 'zustand';
import * as db from './db';
import { checkSession, cloudConfigured, getClient, logOutOfCloud, type CloudClient } from './cloud';
import { deleteLocalAsset, encodeForCloud, localAssetIds, storeCloudAsset, type CloudAsset } from './assets';
import { clearSent, markManyDirty, onLocalChange, pending, type OutboxItem, type OutboxKind } from './outbox';
import {
  afterFilter,
  chunk,
  fromRow,
  keyOf,
  latestTimestamp,
  missingAssets,
  planAssets,
  planPull,
  pullStart,
  toRow,
  type LocalVersion,
  type RemoteAssetMeta,
  type RemoteRecord,
  type SyncKind,
} from './merge';
import { SETTINGS_ID, usedAssets, useStore } from './store';
import { clearShared, loadSharedFromDevice, syncShared } from './sharing';

// Background sync between this device and the cloud copy.
//
// IndexedDB stays the source the app reads and writes; this module only copies
// changes both ways. One round:
//   1. push  – photos, then records, listed in the outbox (changed here since the last push)
//   2. pull  – every record and photo whose `synced_at` is past the last pull
//   3. merge – per record, the later `updatedAt` wins (merge.ts)
// Runs after login, when the app opens, 2 s after a change, when the app comes
// back into view and when the connection returns. Failures are retried quietly.

export type AccountStatus = 'off' | 'checking' | 'signed-out' | 'signed-in';

interface SyncInfo {
  status: AccountStatus;
  email: string | null;
  syncing: boolean;
  lastSyncedAt: string | null;
  /** Set when the last round didn't finish; it is retried on its own. */
  problem: 'offline' | 'failed' | null;
}

export const useSync = create<SyncInfo>(() => ({
  status: cloudConfigured ? 'checking' : 'off',
  email: null,
  syncing: false,
  lastSyncedAt: null,
  problem: null,
}));

/** Kept in the `meta` store. Cursors belong to one account; another account starts over. */
interface SyncMeta {
  key: 'sync';
  userId: string;
  email: string;
  recordsCursor: string | null;
  assetsCursor: string | null;
  lastSyncedAt: string | null;
}

const loadMeta = () => db.get<SyncMeta>('meta', 'sync');
const saveMeta = (m: SyncMeta) => db.put('meta', m);

const RECORD_BATCH = 200;
const PAGE = 500;
const PHOTO_BATCH = 4;
const DEBOUNCE_MS = 2000;

const STORE: Record<SyncKind, db.StoreName> = { tracker: 'trackers', entry: 'entries', category: 'categories', page: 'pages', settings: 'meta' };

async function readLocal(kind: SyncKind, id: string): Promise<{ updatedAt?: string; deletedAt?: string } | undefined> {
  if (kind === 'settings') return (await db.get<{ value: { updatedAt?: string } }>('meta', 'settings'))?.value;
  return db.get(STORE[kind], id);
}

// ---------- one round ----------

async function pushPhotos(client: CloudClient, userId: string, items: OutboxItem[]) {
  for (const item of items) {
    let photo: CloudAsset | undefined;
    try {
      photo = await encodeForCloud(item.id);
    } catch (err) {
      console.warn('Photo could not be prepared for upload; skipping it', item.id, err);
      await clearSent([item]);
      continue;
    }
    // Not on this device any more: it was deleted here, so delete it in the cloud too.
    const row = photo
      ? { user_id: userId, ...photo, deleted: false }
      : { user_id: userId, id: item.id, mime: null, w: null, h: null, data: null, deleted: true };
    const { error } = await client.from('assets').upsert(row, { onConflict: 'user_id,id' });
    if (error) throw error;
    await clearSent([item]);
  }
}

async function pushRecords(client: CloudClient, userId: string, items: OutboxItem[]) {
  for (const batch of chunk(items, RECORD_BATCH)) {
    const rows = [];
    for (const item of batch) {
      const kind = item.kind as SyncKind;
      const record = await readLocal(kind, item.id);
      if (record) rows.push({ user_id: userId, ...toRow(kind, record, item.id) });
    }
    if (rows.length) {
      const { error } = await client.from('records').upsert(rows, { onConflict: 'user_id,kind,id' });
      if (error) throw error;
    }
    await clearSent(batch);
  }
}

async function pullRecords(client: CloudClient, userId: string, cursor: string | null): Promise<string | null> {
  const start = pullStart(cursor);
  let last: RemoteRecord | undefined;
  for (;;) {
    let q = client.from('records').select('kind,id,data,updated_at,deleted,synced_at').eq('user_id', userId);
    if (last) q = q.or(afterFilter(last.synced_at, [['kind', last.kind], ['id', last.id]]));
    else if (start) q = q.gt('synced_at', start);
    const { data, error } = await q.order('synced_at').order('kind').order('id').limit(PAGE);
    if (error) throw error;
    const rows = (data ?? []) as RemoteRecord[];
    if (!rows.length) return cursor;

    const local = new Map<string, LocalVersion>();
    await Promise.all(
      rows.map(async (r) => {
        const rec = await readLocal(r.kind, r.id);
        if (rec) local.set(keyOf(r.kind, r.id), { updatedAt: rec.updatedAt ?? '', deleted: Boolean(rec.deletedAt) });
      }),
    );
    const plan = planPull(local, rows);
    await useStore.getState().applyRemote(plan.apply.map((r) => ({ kind: r.kind, id: r.id, record: fromRow(r) })));
    if (plan.repush.length) {
      await markManyDirty(
        plan.repush.map((k) => {
          const [kind, ...rest] = k.split(':');
          return { kind: kind as OutboxKind, id: rest.join(':') };
        }),
      );
    }
    cursor = latestTimestamp(cursor, rows);
    last = rows[rows.length - 1];
  }
}

const usedNow = () => new Set(usedAssets(useStore.getState().pages, useStore.getState().settings));

async function downloadPhotos(client: CloudClient, userId: string, ids: string[]) {
  for (const batch of chunk(ids, PHOTO_BATCH)) {
    const { data, error } = await client.from('assets').select('id,mime,w,h,data').eq('user_id', userId).eq('deleted', false).in('id', batch);
    if (error) throw error;
    for (const a of (data ?? []) as CloudAsset[]) if (a.data) await storeCloudAsset(a);
  }
}

async function pullPhotos(client: CloudClient, userId: string, cursor: string | null): Promise<string | null> {
  const start = pullStart(cursor);
  const seen: RemoteAssetMeta[] = [];
  let last: RemoteAssetMeta | undefined;
  for (;;) {
    let q = client.from('assets').select('id,deleted,synced_at').eq('user_id', userId);
    if (last) q = q.or(afterFilter(last.synced_at, [['id', last.id]]));
    else if (start) q = q.gt('synced_at', start);
    const { data, error } = await q.order('synced_at').order('id').limit(PAGE);
    if (error) throw error;
    const rows = (data ?? []) as RemoteAssetMeta[];
    if (!rows.length) break;
    seen.push(...rows);
    last = rows[rows.length - 1];
  }
  const plan = planAssets(seen, await localAssetIds(), usedNow());
  for (const id of plan.removeLocal) await deleteLocalAsset(id);
  if (plan.repush.length) await markManyDirty(plan.repush.map((id) => ({ kind: 'asset' as const, id })));
  await downloadPhotos(client, userId, plan.download);
  return latestTimestamp(cursor, seen);
}

/** First sync of an account on this device: everything here goes up, merged with the cloud. */
async function markEverything() {
  const [trackers, entries, categories, pages, settings, photos] = await Promise.all([
    db.keys('trackers'),
    db.keys('entries'),
    db.keys('categories'),
    db.keys('pages'),
    db.get('meta', 'settings'),
    localAssetIds(),
  ]);
  await markManyDirty(
    [
      ...trackers.map((id) => ({ kind: 'tracker' as const, id })),
      ...entries.map((id) => ({ kind: 'entry' as const, id })),
      ...categories.map((id) => ({ kind: 'category' as const, id })),
      ...pages.map((id) => ({ kind: 'page' as const, id })),
      ...(settings ? [{ kind: 'settings' as const, id: SETTINGS_ID }] : []),
      ...[...photos].map((id) => ({ kind: 'asset' as const, id })),
    ],
    false,
  );
}

async function round(): Promise<void> {
  const session = await checkSession();
  if (session.kind === 'unreachable') {
    // Offline: an account that synced here before stays shown as logged in and retries later.
    const meta = await loadMeta();
    useSync.setState({ status: meta ? 'signed-in' : 'signed-out', problem: meta ? 'offline' : null });
    if (meta) retryLater();
    return;
  }
  if (session.kind === 'signed-out') {
    useSync.setState({ status: 'signed-out', problem: null });
    return;
  }

  let meta = await loadMeta();
  if (meta?.userId !== session.user.id) {
    meta = { key: 'sync', userId: session.user.id, email: session.user.email, recordsCursor: null, assetsCursor: null, lastSyncedAt: null };
    await markEverything();
    await clearShared(); // what was shared with another account stays with it
    await saveMeta(meta);
  }
  useSync.setState({ status: 'signed-in', email: meta.email, syncing: true, lastSyncedAt: meta.lastSyncedAt });

  try {
    const client = await getClient();
    const items = await pending();
    await pushPhotos(client, meta.userId, items.filter((i) => i.kind === 'asset'));
    await pushRecords(client, meta.userId, items.filter((i) => i.kind !== 'asset'));
    meta.recordsCursor = await pullRecords(client, meta.userId, meta.recordsCursor);
    await saveMeta(meta);
    meta.assetsCursor = await pullPhotos(client, meta.userId, meta.assetsCursor);
    // Photos a page needs but this device lacks (for example, one that arrived before its page).
    await downloadPhotos(client, meta.userId, missingAssets(usedNow(), await localAssetIds()));
    meta.lastSyncedAt = new Date().toISOString();
    await saveMeta(meta);
    failures = 0;
    useSync.setState({ lastSyncedAt: meta.lastSyncedAt, problem: null });
    // What others share with this account: a separate layer, after the book's
    // own sync, so a problem there never holds up or fails the book itself.
    await syncShared(client).catch((err) => console.warn('Shared items did not sync; will try again next time', err));
  } catch (err) {
    console.warn('Sync did not finish; will try again', err);
    useSync.setState({ problem: navigator.onLine ? 'failed' : 'offline' });
    retryLater();
  } finally {
    useSync.setState({ syncing: false });
  }
}

// ---------- scheduling ----------

let running: Promise<void> | null = null;
let again = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let failures = 0;

/** Runs a round now, or once more after the current one if one is running. */
export function syncNow(): Promise<void> {
  if (!cloudConfigured) return Promise.resolve();
  clearTimeout(timer);
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    do {
      again = false;
      await round();
    } while (again);
  })().finally(() => {
    running = null;
  });
  return running;
}

const scheduleSync = (delay: number) => {
  clearTimeout(timer);
  timer = setTimeout(() => void syncNow(), delay);
};

function retryLater() {
  failures++;
  scheduleSync(Math.min(5 * 60_000, 15_000 * 2 ** (failures - 1)));
}

const whenSignedIn = (delay: number) => () => {
  if (useSync.getState().status === 'signed-in') scheduleSync(delay);
};

let started = false;

/** Called once the local book is loaded. */
export function startSync(): void {
  if (!cloudConfigured || started) return;
  started = true;
  onLocalChange(whenSignedIn(DEBOUNCE_MS));
  window.addEventListener('online', whenSignedIn(0));
  window.addEventListener('focus', whenSignedIn(0));
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && whenSignedIn(0)());
  void loadSharedFromDevice();
  void loadMeta().then((meta) => {
    if (meta) useSync.setState({ email: meta.email, lastSyncedAt: meta.lastSyncedAt });
    // Neon is only contacted when this device has logged in before, or is coming back from Google.
    const backFromGoogle = new URLSearchParams(location.search).has('neon_auth_session_verifier');
    if (meta || backFromGoogle) void syncNow();
    else useSync.setState({ status: 'signed-out' });
  });
}

// ---------- account actions ----------

/** Changes made here that haven't reached the cloud yet. */
export const unsentCount = async () => (await pending()).length;

/**
 * Logs out. `clear` also empties the book on this device; otherwise it stays.
 * Returns an error message, or null.
 */
export async function logOut(clear: boolean): Promise<string | null> {
  await running?.catch(() => undefined);
  const error = await logOutOfCloud();
  if (error) return error;
  clearTimeout(timer);
  await db.remove('meta', 'sync');
  await clearShared();
  if (clear) await useStore.getState().clearLocal();
  useSync.setState({ status: 'signed-out', email: null, lastSyncedAt: null, problem: null });
  return null;
}
