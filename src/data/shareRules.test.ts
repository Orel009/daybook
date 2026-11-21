import { describe, expect, it } from 'vitest';
import {
  foldSharedRows,
  isLinkToken,
  linkTokenHash,
  linkUrl,
  newLinkToken,
  pagePhotoIds,
  pageTrackerIds,
  remapPhotos,
  sharedKey,
  viewsToday,
  type SharedRow,
} from './shareRules';
import type { Page, PageElement } from '../domain/pages';

const row = (id: string, updated_at: string, deleted = false, kind: SharedRow['kind'] = 'page'): SharedRow => ({
  owner_key: 'ok1',
  kind,
  id,
  data: { id, title: `t-${updated_at}` },
  updated_at,
  deleted,
  synced_at: updated_at,
});

const el = (e: Partial<PageElement> & { type: PageElement['type'] }) => ({ id: Math.random().toString(36), x: 0, y: 0, w: 10, h: 10, rotation: 0, ...e }) as PageElement;
const page = (elements: PageElement[], bg?: string): Pick<Page, 'elements' | 'background'> => ({
  elements,
  background: { color: '#fff', pattern: 'dots', assetId: bg },
});

describe('shared rows', () => {
  it('keeps the newest version and turns tombstones into removals', () => {
    const out = foldSharedRows([row('a', '2026-11-21T10:00:00Z'), row('a', '2026-11-21T11:00:00Z'), row('b', '2026-11-21T10:00:00Z'), row('b', '2026-11-21T12:00:00Z', true)]);
    expect(out.get(sharedKey('ok1', 'page', 'a'))?.data.title).toBe('t-2026-11-21T11:00:00Z');
    expect(out.get(sharedKey('ok1', 'page', 'b'))).toBeNull();
  });
  it('an older row arriving later does not win', () => {
    const out = foldSharedRows([row('a', '2026-11-21T11:00:00Z'), row('a', '2026-11-21T10:00:00Z')]);
    expect(out.get(sharedKey('ok1', 'page', 'a'))?.updatedAt).toBe('2026-11-21T11:00:00Z');
  });
  it('keeps kinds and owners apart', () => {
    const out = foldSharedRows([row('x', '2026-11-21T10:00:00Z', false, 'tracker'), { ...row('x', '2026-11-21T10:00:00Z'), owner_key: 'ok2' }]);
    expect(out.size).toBe(2);
  });
});

describe('pages', () => {
  it('finds every photo: background, photos and custom stickers', () => {
    const p = page(
      [el({ type: 'photo', assetId: 'p1' } as never), el({ type: 'sticker', emoji: '', assetId: 's1' } as never), el({ type: 'sticker', emoji: '🌸' } as never), el({ type: 'photo', assetId: 'p1' } as never)],
      'bg1',
    );
    expect(pagePhotoIds(p).sort()).toEqual(['bg1', 'p1', 's1']);
  });
  it('lists the trackers a page shows, once each', () => {
    const p = page([el({ type: 'tracker', trackerId: 't1' } as never), el({ type: 'tracker', trackerId: '' } as never), el({ type: 'tracker', trackerId: 't2' } as never), el({ type: 'tracker', trackerId: 't1' } as never)]);
    expect(pageTrackerIds(p)).toEqual(['t1', 't2']);
  });
  it('swaps photo ids in a received copy', () => {
    const p = page([el({ type: 'photo', assetId: 'old1' } as never), el({ type: 'sticker', emoji: '', assetId: 'old2' } as never), el({ type: 'text', text: 'hi' } as never)], 'old3');
    const out = remapPhotos(p, new Map([['old1', 'new1'], ['old2', 'new2'], ['old3', 'new3']]));
    expect(pagePhotoIds(out).sort()).toEqual(['new1', 'new2', 'new3']);
    expect(pagePhotoIds(p).sort()).toEqual(['old1', 'old2', 'old3']); // original untouched
  });
});

describe('links', () => {
  it('makes 256-bit URL-safe tokens', () => {
    const t = newLinkToken();
    expect(isLinkToken(t)).toBe(true);
    expect(t).toHaveLength(43);
    expect(newLinkToken()).not.toBe(t);
    expect(newLinkToken((b) => b.fill(255))).toBe('__________________________________________8');
  });
  it('rejects anything that is not a token', () => {
    for (const bad of ['', 'abc', 'x'.repeat(42), 'x'.repeat(44), `${'x'.repeat(42)}!`, `${'x'.repeat(42)}=`]) expect(isLinkToken(bad)).toBe(false);
  });
  it('hashes with SHA-256 (hex), the same as the database', async () => {
    expect(await linkTokenHash('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
  it('counts views only for the current UTC day', () => {
    const now = new Date('2026-11-21T23:30:00Z');
    expect(viewsToday({ day: '2026-11-21', views_today: 7 }, now)).toBe(7);
    expect(viewsToday({ day: '2026-11-20', views_today: 7 }, now)).toBe(0);
  });
  it('builds the link with a hash route', () => {
    expect(linkUrl('T', 'https://orel009.github.io/daybook/')).toBe('https://orel009.github.io/daybook/#/s/T');
  });
});
