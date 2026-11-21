import * as db from './db';
import { keyOf, type SyncKind } from './merge';

// The list of things changed on this device that the cloud hasn't seen yet.
// Each mark carries a stamp; after a push, a mark is only cleared if nothing
// changed it while the push was running.

export type OutboxKind = SyncKind | 'asset';

export interface OutboxItem {
  key: string;
  kind: OutboxKind;
  id: string;
  stamp: number;
}

let seq = 0;
const listeners = new Set<() => void>();

/** Called after every local change; sync.ts listens to schedule a push. */
export const onLocalChange = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

const item = (kind: OutboxKind, id: string): OutboxItem => ({ key: keyOf(kind, id), kind, id, stamp: Date.now() * 1000 + (seq++ % 1000) });

export async function markDirty(kind: OutboxKind, id: string): Promise<void> {
  await db.put('outbox', item(kind, id)).catch((err) => console.error('Could not note change for sync', err));
  for (const fn of listeners) fn();
}

export async function markManyDirty(list: { kind: OutboxKind; id: string }[], notify = true): Promise<void> {
  await db.putMany('outbox', list.map((x) => item(x.kind, x.id))).catch((err) => console.error('Could not note changes for sync', err));
  if (notify) for (const fn of listeners) fn();
}

export const pending = () => db.getAll<OutboxItem>('outbox');

/** Clears marks that are unchanged since they were read. */
export async function clearSent(sent: OutboxItem[]): Promise<void> {
  for (const s of sent) {
    const now = await db.get<OutboxItem>('outbox', s.key);
    if (now && now.stamp === s.stamp) await db.remove('outbox', s.key);
  }
}
