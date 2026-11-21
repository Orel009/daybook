// Pure rules for the "shared with me" layer and for links, kept apart from
// IndexedDB and the network so they can be unit tested. sharing.ts does the I/O.
// Nothing here touches the book's own records or the sync merge (merge.ts).

import type { Page } from '../domain/pages';

export type SharedKind = 'tracker' | 'entry' | 'category' | 'page';
export type ShareScope = 'page' | 'tracker' | 'book';

/** One record someone shares with this account, as kept on this device. */
export interface SharedItem {
  key: string;
  /** Per-recipient stand-in for the owner (never their account id). */
  ownerKey: string;
  kind: SharedKind;
  id: string;
  data: Record<string, unknown>;
  updatedAt: string;
}

/** A row from shared_records(). */
export interface SharedRow {
  owner_key: string;
  kind: SharedKind;
  id: string;
  data: Record<string, unknown>;
  updated_at: string;
  deleted: boolean;
  synced_at: string;
}

export const sharedKey = (ownerKey: string, kind: string, id: string) => `${ownerKey}:${kind}:${id}`;
export const sharedAssetKey = (ownerKey: string, id: string) => `${ownerKey}:${id}`;

/**
 * Folds pulled rows into a change set: the newest version of each record wins,
 * a tombstone removes it. `null` means "remove from this device".
 */
export function foldSharedRows(rows: readonly SharedRow[]): Map<string, SharedItem | null> {
  const out = new Map<string, SharedItem | null>();
  const stamp = new Map<string, number>();
  for (const r of rows) {
    const key = sharedKey(r.owner_key, r.kind, r.id);
    const t = Date.parse(r.updated_at) || 0;
    if ((stamp.get(key) ?? -1) > t) continue;
    stamp.set(key, t);
    out.set(key, r.deleted ? null : { key, ownerKey: r.owner_key, kind: r.kind, id: r.id, data: r.data, updatedAt: r.updated_at });
  }
  return out;
}

/** Every photo a page shows: background, photos and custom stickers. */
export function pagePhotoIds(page: Pick<Page, 'elements' | 'background'>): string[] {
  const ids = new Set<string>();
  if (page.background?.assetId) ids.add(page.background.assetId);
  for (const el of page.elements ?? []) {
    const assetId = (el as { assetId?: unknown }).assetId;
    if (typeof assetId === 'string' && assetId) ids.add(assetId);
  }
  return [...ids];
}

/** Trackers a page shows in tracker widgets, in page order, without repeats. */
export function pageTrackerIds(page: Pick<Page, 'elements'>): string[] {
  const ids: string[] = [];
  for (const el of page.elements ?? []) {
    if (el.type === 'tracker' && el.trackerId && !ids.includes(el.trackerId)) ids.push(el.trackerId);
  }
  return ids;
}

/** A received copy with its photo ids swapped for the ids they got on this device. */
export function remapPhotos<T extends Pick<Page, 'elements' | 'background'>>(page: T, newIds: ReadonlyMap<string, string>): T {
  const swap = (id: string | undefined) => (id && newIds.get(id)) || id;
  return {
    ...page,
    background: { ...page.background, assetId: swap(page.background?.assetId) },
    elements: page.elements.map((el) => {
      const assetId = (el as { assetId?: string }).assetId;
      return assetId ? { ...el, assetId: swap(assetId) } : el;
    }),
  };
}

// ---------- public links ----------

const B64URL = /^[A-Za-z0-9_-]{43}$/;

/** 256 random bits as 43 URL-safe characters. */
export function newLinkToken(random: (bytes: Uint8Array<ArrayBuffer>) => Uint8Array = (b) => crypto.getRandomValues(b)): string {
  const bytes = random(new Uint8Array(32));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export const isLinkToken = (token: string) => B64URL.test(token);

/** What the server stores instead of the token: its SHA-256, as hex. */
export async function linkTokenHash(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** The counter resets each UTC day. */
export function viewsToday(link: { day: string; views_today: number }, now = new Date()): number {
  return link.day === now.toISOString().slice(0, 10) ? link.views_today : 0;
}

export const linkUrl = (token: string, base = `${location.origin}${location.pathname}`) => `${base}#/s/${token}`;
