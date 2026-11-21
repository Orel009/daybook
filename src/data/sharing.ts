import { create } from 'zustand';
import * as db from './db';
import { getClient, type CloudClient } from './cloud';
import { addReceivedPhoto, blobFromBase64, photoArrived, type PhotoSource } from './assets';
import { useStore } from './store';
import type { Page } from '../domain/pages';
import {
  foldSharedRows,
  linkTokenHash,
  newLinkToken,
  pagePhotoIds,
  remapPhotos,
  sharedAssetKey,
  type SharedItem,
  type SharedRow,
  type ShareScope,
} from './shareRules';

// Read-only sharing between accounts, as a layer beside the book:
//   * what others share with this account lives in the `shared` and
//     `sharedAssets` stores, keyed by the owner's per-recipient key, and is
//     never mixed into the book's own records, outbox or merge
//   * every access is decided in Postgres (db/sharing.sql); this file only
//     calls those functions and keeps the local copy in step
//   * a received copy becomes ordinary pages of this book (new ids), so after
//     accepting there is no link back to the sender

export interface ShareInfo {
  share_id: string;
  owner_key: string;
  owner_name: string;
  scope: ShareScope;
  item_id: string | null;
  created_at: string;
}
export interface CopyOffer {
  id: string;
  owner_name: string;
  title: string;
  is_template: boolean;
  photos: number;
  created_at: string;
}
export interface MyShare {
  id: string;
  recipient_email: string;
  scope: ShareScope;
  item_id: string | null;
  owner_name: string;
  created_at: string;
}
export interface MyLink {
  id: string;
  scope: 'page' | 'book';
  item_id: string | null;
  daily_limit: number;
  day: string;
  views_today: number;
  created_at: string;
}
export interface SentCopy {
  id: string;
  recipient_email: string;
  title: string;
  is_template: boolean;
  created_at: string;
  expires_at: string;
}

interface SharedState {
  shares: ShareInfo[];
  items: SharedItem[];
  copies: CopyOffer[];
}

export const useShared = create<SharedState>(() => ({ shares: [], items: [], copies: [] }));

interface SharedMeta {
  key: 'sharedSync';
  shareIds: string;
  cursor: { ts: string; owner: string; kind: string; id: string } | null;
  shares: ShareInfo[];
  copies: CopyOffer[];
}

const PAGE = 500;
const PHOTO_BATCH = 8;

/** Shows what was synced last time, before the network answers (works offline). */
export async function loadSharedFromDevice(): Promise<void> {
  const [items, meta] = await Promise.all([db.getAll<SharedItem>('shared'), db.get<SharedMeta>('meta', 'sharedSync')]);
  useShared.setState({ items, shares: meta?.shares ?? [], copies: meta?.copies ?? [] });
}

const rpc = async <T>(client: CloudClient, fn: string, args: Record<string, unknown> = {}): Promise<T> => {
  const { data, error } = await client.rpc(fn, args);
  if (error) throw error;
  return data as T;
};

/**
 * One round for the shared layer, after the book's own sync. When the set of
 * shares changed (one added or revoked) everything shared is read again and
 * replaces what this device holds; otherwise only changes since the cursor.
 */
export async function syncShared(client: CloudClient): Promise<void> {
  const [shares, copies] = await Promise.all([rpc<ShareInfo[]>(client, 'shared_with_me'), rpc<CopyOffer[]>(client, 'copies_for_me')]);
  const meta = await db.get<SharedMeta>('meta', 'sharedSync');
  const shareIds = shares.map((s) => s.share_id).sort().join(',');
  const full = !meta || meta.shareIds !== shareIds;
  let cursor = full ? null : meta.cursor;

  const rows: SharedRow[] = [];
  if (shares.length) {
    for (;;) {
      const page = await rpc<SharedRow[]>(client, 'shared_records', {
        p_after_synced_at: cursor?.ts ?? null,
        p_after_owner: cursor?.owner ?? '',
        p_after_kind: cursor?.kind ?? '',
        p_after_id: cursor?.id ?? '',
        p_limit: PAGE,
      });
      if (!page.length) break;
      rows.push(...page);
      const last = page[page.length - 1];
      cursor = { ts: last.synced_at, owner: last.owner_key, kind: last.kind, id: last.id };
    }
  }

  const changes = foldSharedRows(rows);
  if (full) {
    await db.replaceAll({ shared: [...changes.values()].filter((x): x is SharedItem => x !== null) });
  } else {
    for (const [key, item] of changes) {
      if (item) await db.put('shared', item);
      else await db.remove('shared', key);
    }
  }
  const items = await db.getAll<SharedItem>('shared');
  await syncSharedPhotos(client, items);
  await db.put('meta', { key: 'sharedSync', shareIds, cursor, shares, copies } satisfies SharedMeta);
  useShared.setState({ shares, items, copies });
}

/** Downloads photos of shared pages this device lacks and drops ones no shared page uses. */
async function syncSharedPhotos(client: CloudClient, items: SharedItem[]) {
  const needed = new Map<string, { ownerKey: string; id: string }>();
  for (const it of items) {
    if (it.kind !== 'page') continue;
    for (const id of pagePhotoIds(it.data as unknown as Page)) needed.set(sharedAssetKey(it.ownerKey, id), { ownerKey: it.ownerKey, id });
  }
  const have = new Set(await db.keys('sharedAssets'));
  for (const key of have) if (!needed.has(key)) await db.remove('sharedAssets', key);
  const missing = [...needed.entries()].filter(([key]) => !have.has(key)).map(([, v]) => v.id);
  for (let i = 0; i < missing.length; i += PHOTO_BATCH) {
    const got = await rpc<{ owner_key: string; id: string; mime: string; w: number; h: number; data: string }[]>(client, 'shared_assets', {
      p_ids: missing.slice(i, i + PHOTO_BATCH),
    });
    for (const a of got) {
      const key = sharedAssetKey(a.owner_key, a.id);
      if (!needed.has(key)) continue;
      await db.put('sharedAssets', { key, ownerKey: a.owner_key, id: a.id, w: a.w, h: a.h, blob: blobFromBase64(a.mime, a.data) });
      photoArrived(`shared:${a.owner_key}`, a.id);
    }
  }
}

/** Photos of one owner's shared pages, for PageCanvas. */
const sources = new Map<string, PhotoSource>();
export function sharedPhotos(ownerKey: string): PhotoSource {
  let s = sources.get(ownerKey);
  if (!s) {
    s = { ns: `shared:${ownerKey}`, load: async (id) => (await db.get<{ blob: Blob }>('sharedAssets', sharedAssetKey(ownerKey, id)))?.blob };
    sources.set(ownerKey, s);
  }
  return s;
}

/** Forgets everything shared with this account (on log out or another login). */
export async function clearShared(): Promise<void> {
  await db.replaceAll({ shared: [], sharedAssets: [] });
  await db.remove('meta', 'sharedSync');
  useShared.setState({ shares: [], items: [], copies: [] });
}

// ---------- as the owner ----------

const ownerName = (name: string) => name.trim().slice(0, 60) || 'A friend';

export async function shareItem(email: string, scope: ShareScope, itemId: string | null, name: string): Promise<string> {
  return rpc<string>(await getClient(), 'share_create', { p_recipient_email: email, p_scope: scope, p_item_id: itemId, p_owner_name: ownerName(name) });
}

export async function myShares(): Promise<MyShare[]> {
  const { data, error } = await (await getClient()).from('shares').select('id,recipient_email,scope,item_id,owner_name,created_at').order('created_at');
  if (error) throw error;
  return data as MyShare[];
}

export async function revokeShare(id: string): Promise<void> {
  const { error } = await (await getClient()).from('shares').delete().eq('id', id);
  if (error) throw error;
}

export async function sendCopy(email: string, pageId: string, name: string): Promise<string> {
  return rpc<string>(await getClient(), 'copy_send', { p_recipient_email: email, p_page_id: pageId, p_owner_name: ownerName(name) });
}

export async function sentCopies(): Promise<SentCopy[]> {
  const { data, error } = await (await getClient()).from('copies').select('id,recipient_email,title,is_template,created_at,expires_at').order('created_at');
  if (error) throw error;
  return data as SentCopy[];
}

export async function cancelCopy(id: string): Promise<void> {
  const { error } = await (await getClient()).from('copies').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Makes a public link. The token is made here and only its hash is sent; the
 * token itself is kept on this device so the link can be copied again later.
 */
export async function createLink(scope: 'page' | 'book', itemId: string | null, name: string): Promise<{ id: string; token: string }> {
  const token = newLinkToken();
  const id = await rpc<string>(await getClient(), 'link_create', {
    p_token_hash: await linkTokenHash(token),
    p_scope: scope,
    p_item_id: itemId,
    p_owner_name: ownerName(name),
  });
  const saved = (await db.get<{ key: string; tokens: Record<string, string> }>('meta', 'linkTokens'))?.tokens ?? {};
  await db.put('meta', { key: 'linkTokens', tokens: { ...saved, [id]: token } });
  return { id, token };
}

export async function myLinks(): Promise<(MyLink & { token?: string })[]> {
  const { data, error } = await (await getClient()).from('links').select('id,scope,item_id,daily_limit,day,views_today,created_at').order('created_at');
  if (error) throw error;
  const tokens = (await db.get<{ tokens: Record<string, string> }>('meta', 'linkTokens'))?.tokens ?? {};
  return (data as MyLink[]).map((l) => ({ ...l, token: tokens[l.id] }));
}

export async function revokeLink(id: string): Promise<void> {
  const { error } = await (await getClient()).from('links').delete().eq('id', id);
  if (error) throw error;
  const saved = (await db.get<{ tokens: Record<string, string> }>('meta', 'linkTokens'))?.tokens ?? {};
  delete saved[id];
  await db.put('meta', { key: 'linkTokens', tokens: saved });
}

// ---------- copies sent to this account ----------

/** Saves a received page (or template) as this book's own, with its photos, then clears the offer. */
export async function acceptCopy(offer: CopyOffer): Promise<Page> {
  const client = await getClient();
  const sent = await rpc<Page | null>(client, 'copy_page', { p_copy_id: offer.id });
  if (!sent) throw new Error('This copy is no longer available.');
  const ids = pagePhotoIds(sent);
  const newIds = new Map<string, string>();
  for (let i = 0; i < ids.length; i += PHOTO_BATCH) {
    const got = await rpc<{ id: string; mime: string; w: number; h: number; data: string }[]>(client, 'copy_photos', {
      p_copy_id: offer.id,
      p_ids: ids.slice(i, i + PHOTO_BATCH),
    });
    for (const a of got) newIds.set(a.id, await addReceivedPhoto(blobFromBase64(a.mime, a.data), a.w, a.h));
  }
  const page = remapPhotos(sent, newIds);
  const saved = useStore.getState().createPage(page.title || offer.title, page.size, page, Boolean(page.isTemplate));
  await rpc(client, 'copy_done', { p_copy_id: offer.id });
  useShared.setState((s) => ({ copies: s.copies.filter((c) => c.id !== offer.id) }));
  return saved;
}

export async function declineCopy(offer: CopyOffer): Promise<void> {
  await rpc(await getClient(), 'copy_done', { p_copy_id: offer.id });
  useShared.setState((s) => ({ copies: s.copies.filter((c) => c.id !== offer.id) }));
}
