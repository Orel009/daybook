import { describe, expect, it } from 'vitest';
import {
  afterFilter,
  chunk,
  compareTimestamps,
  decide,
  fromRow,
  keyOf,
  latestTimestamp,
  missingAssets,
  planAssets,
  planPull,
  pullStart,
  toRow,
  type LocalVersion,
  type RemoteRecord,
} from './merge';

const remote = (id: string, updated_at: string, deleted = false, extra: Record<string, unknown> = {}): RemoteRecord => ({
  kind: 'tracker',
  id,
  data: { id, name: 'Water', updatedAt: updated_at, ...extra },
  updated_at,
  deleted,
  synced_at: '2026-11-21T10:00:00.5+00:00',
});
const local = (updatedAt: string, deleted = false): LocalVersion => ({ updatedAt, deleted });

describe('decide (later updatedAt wins)', () => {
  it('takes a newer remote version', () => {
    expect(decide(local('2026-11-20T10:00:00.000Z'), remote('a', '2026-11-21T10:00:00.000Z'))).toBe('take-remote');
  });
  it('keeps a newer local version, even against a remote delete', () => {
    expect(decide(local('2026-11-21T10:00:00.000Z'), remote('a', '2026-11-20T10:00:00.000Z', true))).toBe('keep-local');
  });
  it('a newer remote delete beats an older local edit', () => {
    expect(decide(local('2026-11-20T10:00:00.000Z'), remote('a', '2026-11-21T10:00:00.000Z', true))).toBe('take-remote');
  });
  it('a newer local delete beats an older remote edit', () => {
    expect(decide(local('2026-11-21T10:00:00.000Z', true), remote('a', '2026-11-20T10:00:00.000Z'))).toBe('keep-local');
  });
  it('equal stamps change nothing', () => {
    expect(decide(local('2026-11-21T10:00:00.000Z'), remote('a', '2026-11-21T10:00:00.000Z'))).toBe('same');
  });
  it('compares instants, not strings', () => {
    // same instant written two ways
    expect(decide(local('2026-11-21T12:00:00.000+02:00'), remote('a', '2026-11-21T10:00:00Z'))).toBe('same');
  });
  it('new records are taken, unknown tombstones are ignored', () => {
    expect(decide(undefined, remote('a', '2026-11-21T10:00:00.000Z'))).toBe('take-remote');
    expect(decide(undefined, remote('a', '2026-11-21T10:00:00.000Z', true))).toBe('same');
  });
  it('a record never saved with a stamp loses to any remote version', () => {
    expect(decide(local(''), remote('a', '2026-01-01T00:00:00.000Z'))).toBe('take-remote');
  });
});

describe('planPull', () => {
  it('splits a pull into records to apply and records to push back', () => {
    const locals = new Map([
      [keyOf('tracker', 'old'), local('2026-11-01T00:00:00.000Z')],
      [keyOf('tracker', 'mine'), local('2026-11-21T09:00:00.000Z')],
      [keyOf('tracker', 'same'), local('2026-11-05T00:00:00.000Z')],
    ]);
    const plan = planPull(locals, [
      remote('old', '2026-11-02T00:00:00.000Z'),
      remote('mine', '2026-11-03T00:00:00.000Z'),
      remote('same', '2026-11-05T00:00:00.000Z'),
      remote('new', '2026-11-04T00:00:00.000Z'),
    ]);
    expect(plan.apply.map((r) => r.id).sort()).toEqual(['new', 'old']);
    expect(plan.repush).toEqual([keyOf('tracker', 'mine')]);
  });
  it('uses the newest copy when a row appears twice', () => {
    const plan = planPull(new Map(), [remote('a', '2026-11-02T00:00:00.000Z', false, { name: 'B' }), remote('a', '2026-11-01T00:00:00.000Z', false, { name: 'A' })]);
    expect(plan.apply).toHaveLength(1);
    expect(plan.apply[0].data.name).toBe('B');
  });
  it('keeps the same id apart across kinds', () => {
    const entry = { ...remote('x', '2026-11-02T00:00:00.000Z'), kind: 'entry' as const };
    const plan = planPull(new Map([[keyOf('tracker', 'x'), local('2026-11-09T00:00:00.000Z')]]), [entry]);
    expect(plan.apply).toEqual([entry]);
  });
});

describe('row conversion', () => {
  it('round-trips a live record', () => {
    const rec = { id: 't1', name: 'Water', updatedAt: '2026-11-21T10:00:00.000Z' };
    const row = toRow('tracker', rec);
    expect(row).toMatchObject({ kind: 'tracker', id: 't1', updated_at: rec.updatedAt, deleted: false });
    expect(fromRow({ ...row })).toEqual(rec);
  });
  it('round-trips a tombstone', () => {
    const rec = { id: 'e1', updatedAt: '2026-11-21T10:00:00.000Z', deletedAt: '2026-11-21T10:00:00.000Z' };
    const row = toRow('entry', rec);
    expect(row.deleted).toBe(true);
    expect(fromRow<typeof rec>(row).deletedAt).toBe(rec.deletedAt);
  });
  it('a record brought back to life loses its deletedAt', () => {
    expect(fromRow<{ deletedAt?: string }>({ data: { deletedAt: 'x' }, deleted: false, updated_at: '2026-11-21T10:00:00Z' }).deletedAt).toBeUndefined();
  });
  it('settings use a fixed id and an epoch stamp when never saved', () => {
    expect(toRow('settings', { updatedAt: '' }, 'settings')).toMatchObject({ id: 'settings', updated_at: '1970-01-01T00:00:00.000Z' });
  });
});

describe('cursors', () => {
  it('compares Postgres timestamps to the microsecond', () => {
    expect(compareTimestamps('2026-11-21T10:00:00.12+00:00', '2026-11-21T10:00:00.119999+00:00')).toBeGreaterThan(0);
    expect(compareTimestamps('2026-11-21T10:00:00+00:00', '2026-11-21T10:00:00.000001+00:00')).toBeLessThan(0);
    expect(compareTimestamps('2026-11-21T12:00:00.5+02:00', '2026-11-21T10:00:00.5Z')).toBe(0);
  });
  it('keeps the latest synced_at', () => {
    expect(latestTimestamp(null, [])).toBeNull();
    expect(
      latestTimestamp('2026-11-21T10:00:00.1+00:00', [{ synced_at: '2026-11-21T10:00:00.05+00:00' }, { synced_at: '2026-11-21T10:00:00.100001+00:00' }]),
    ).toBe('2026-11-21T10:00:00.100001+00:00');
  });
  it('starts the next pull a little before the cursor', () => {
    expect(pullStart(null)).toBeNull();
    expect(pullStart('2026-11-21T10:01:00.5+00:00')).toBe('2026-11-21T10:00:00.500Z'); // 60 s overlap
  });
  it('builds a keyset filter that does not skip rows sharing a timestamp', () => {
    expect(afterFilter('2026-11-21T10:00:00.5+00:00', [['kind', 'entry'], ['id', 'abc']])).toBe(
      'synced_at.gt."2026-11-21T10:00:00.5+00:00",' +
        'and(synced_at.eq."2026-11-21T10:00:00.5+00:00",kind.gt."entry"),' +
        'and(synced_at.eq."2026-11-21T10:00:00.5+00:00",kind.eq."entry",id.gt."abc")',
    );
  });
});

describe('photos', () => {
  const meta = (id: string, deleted: boolean, synced_at = '2026-11-21T10:00:00+00:00') => ({ id, deleted, synced_at });
  it('downloads only photos this device uses and lacks', () => {
    const plan = planAssets([meta('used', false), meta('unused', false), meta('have', false)], new Set(['have']), new Set(['used', 'have']));
    expect(plan).toEqual({ download: ['used'], removeLocal: [], repush: [] });
  });
  it('removes a deleted photo that nothing here uses', () => {
    expect(planAssets([meta('p', true)], new Set(['p']), new Set()).removeLocal).toEqual(['p']);
  });
  it('uploads a deleted photo again when a page here still uses it', () => {
    expect(planAssets([meta('p', true)], new Set(['p']), new Set(['p'])).repush).toEqual(['p']);
  });
  it('follows the latest row when a photo appears twice', () => {
    const plan = planAssets([meta('p', false, '2026-11-21T10:00:01+00:00'), meta('p', true, '2026-11-21T10:00:00+00:00')], new Set(), new Set(['p']));
    expect(plan.download).toEqual(['p']);
  });
  it('lists used photos missing on this device', () => {
    expect(missingAssets(['a', 'b', 'a', 'c'], new Set(['b']))).toEqual(['a', 'c']);
  });
  it('chunks lists for batched requests', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
});
