// Pure sync rules, kept apart from IndexedDB and the network so they can be
// unit tested. sync.ts does the I/O and calls these.
//
// Every record carries `updatedAt`, stamped by the device that changed it.
// Deletes are tombstones (`deletedAt` set, `deleted` in the cloud), so a delete
// travels like any other change. When two versions meet, the later
// `updatedAt` wins; a tie keeps what this device already has.

export type SyncKind = 'tracker' | 'entry' | 'category' | 'page' | 'settings';

/** A row of the `records` table as the Data API returns it. */
export interface RemoteRecord {
  kind: SyncKind;
  id: string;
  data: Record<string, unknown>;
  updated_at: string;
  deleted: boolean;
  synced_at: string;
}

/** What this device holds for one record, tombstones included. */
export interface LocalVersion {
  updatedAt: string;
  deleted: boolean;
}

export const keyOf = (kind: string, id: string) => `${kind}:${id}`;

const EPOCH = '1970-01-01T00:00:00.000Z';

/** Milliseconds since 1970, with empty or unreadable stamps counting as the oldest. */
export const stampMs = (iso: string | undefined | null): number => {
  const ms = iso ? Date.parse(iso) : NaN;
  return Number.isNaN(ms) ? 0 : ms;
};

export type Decision = 'take-remote' | 'keep-local' | 'same';

export function decide(local: LocalVersion | undefined, remote: Pick<RemoteRecord, 'updated_at' | 'deleted'>): Decision {
  if (!local) return remote.deleted ? 'same' : 'take-remote'; // nothing to delete here
  const l = stampMs(local.updatedAt);
  const r = stampMs(remote.updated_at);
  if (r > l) return 'take-remote';
  if (l > r) return 'keep-local';
  return 'same';
}

export interface PullPlan {
  /** Remote versions to write on this device. */
  apply: RemoteRecord[];
  /** Keys where this device's copy is newer; they go back into the outbox. */
  repush: string[];
}

/** Decides, record by record, what a batch of pulled rows does to this device. */
export function planPull(local: ReadonlyMap<string, LocalVersion>, remote: readonly RemoteRecord[]): PullPlan {
  // A pull can contain the same record twice (the cursor overlaps); keep the newest.
  const newest = new Map<string, RemoteRecord>();
  for (const r of remote) {
    const k = keyOf(r.kind, r.id);
    const seen = newest.get(k);
    if (!seen || stampMs(r.updated_at) >= stampMs(seen.updated_at)) newest.set(k, r);
  }
  const plan: PullPlan = { apply: [], repush: [] };
  for (const [k, r] of newest) {
    const d = decide(local.get(k), r);
    if (d === 'take-remote') plan.apply.push(r);
    else if (d === 'keep-local') plan.repush.push(k);
  }
  return plan;
}

/** The cloud row for a local record. Tombstones keep their last data. */
export function toRow(kind: SyncKind, record: { id?: string; updatedAt?: string; deletedAt?: string }, id = record.id ?? '') {
  return {
    kind,
    id,
    data: record as Record<string, unknown>,
    updated_at: record.updatedAt || EPOCH,
    deleted: Boolean(record.deletedAt),
  };
}

/** The local record for a cloud row: a tombstone gets `deletedAt` so it stays hidden. */
export function fromRow<T>(row: Pick<RemoteRecord, 'data' | 'deleted' | 'updated_at'>): T {
  const data: Record<string, unknown> = { ...row.data, updatedAt: row.updated_at };
  if (row.deleted) data.deletedAt = row.data.deletedAt ?? row.updated_at;
  else delete data.deletedAt;
  return data as T;
}

// ---------- cursors ----------
//
// Postgres sends timestamps with microseconds and trims trailing zeros
// ("…:19.12+00:00"), which Date cannot hold exactly. Compare them as
// [seconds, microseconds] so the cursor never moves backwards or skips.

const TS = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?(Z|[+-]\d{2}(?::?\d{2})?)?$/;

export function timestampParts(ts: string): [number, number] {
  const m = TS.exec(ts.trim());
  if (!m) return [Math.floor(stampMs(ts) / 1000), 0];
  let zone = m[4] ?? 'Z';
  if (/^[+-]\d{2}$/.test(zone)) zone += ':00';
  const seconds = Math.floor(Date.parse(`${m[1]}T${m[2]}${zone}`) / 1000);
  const micros = Number((m[3] ?? '').padEnd(6, '0'));
  return [seconds, micros];
}

export function compareTimestamps(a: string, b: string): number {
  const [as, au] = timestampParts(a);
  const [bs, bu] = timestampParts(b);
  return as - bs || au - bu;
}

export function latestTimestamp(current: string | null, rows: readonly { synced_at: string }[]): string | null {
  let best = current;
  for (const r of rows) if (!best || compareTimestamps(r.synced_at, best) > 0) best = r.synced_at;
  return best;
}

/**
 * Where the next pull starts. A write that started before the last pull but
 * finished after it can carry a slightly older `synced_at`, so each pull reads
 * a short stretch again. Merging is idempotent, so seeing a row twice is harmless.
 */
export const OVERLAP_MS = 60_000;
export function pullStart(cursor: string | null): string | null {
  if (!cursor) return null;
  const [s, us] = timestampParts(cursor);
  return new Date(s * 1000 + Math.floor(us / 1000) - OVERLAP_MS).toISOString();
}

/**
 * PostgREST filter for "rows after (synced_at, …keys)" in (synced_at, …keys)
 * order, so paging never skips rows that share a timestamp.
 */
export function afterFilter(syncedAt: string, keys: [column: string, value: string][]): string {
  const q = (v: string) => `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  const parts = [`synced_at.gt.${q(syncedAt)}`];
  for (let i = 0; i < keys.length; i++) {
    const eqs = [`synced_at.eq.${q(syncedAt)}`, ...keys.slice(0, i).map(([c, v]) => `${c}.eq.${q(v)}`)];
    parts.push(`and(${[...eqs, `${keys[i][0]}.gt.${q(keys[i][1])}`].join(',')})`);
  }
  return parts.join(',');
}

// ---------- photos ----------

export interface RemoteAssetMeta {
  id: string;
  deleted: boolean;
  synced_at: string;
}

export interface AssetPlan {
  download: string[];
  removeLocal: string[];
  /** Deleted in the cloud but still used here: upload again so it isn't lost. */
  repush: string[];
}

/**
 * Photos never change once taken, so the only question is whether they exist.
 * A photo that is deleted somewhere but still used on this device wins: it is
 * uploaded again, so two devices can never lose a photo between them.
 */
export function planAssets(remote: readonly RemoteAssetMeta[], localIds: ReadonlySet<string>, usedIds: ReadonlySet<string>): AssetPlan {
  const latest = new Map<string, RemoteAssetMeta>();
  for (const r of remote) {
    const seen = latest.get(r.id);
    if (!seen || compareTimestamps(r.synced_at, seen.synced_at) >= 0) latest.set(r.id, r);
  }
  const plan: AssetPlan = { download: [], removeLocal: [], repush: [] };
  for (const r of latest.values()) {
    const here = localIds.has(r.id);
    const used = usedIds.has(r.id);
    if (r.deleted) {
      if (used && here) plan.repush.push(r.id);
      else if (here && !used) plan.removeLocal.push(r.id);
    } else if (!here && used) {
      plan.download.push(r.id);
    }
  }
  return plan;
}

/** Photos a page or "My stickers" needs that this device doesn't have yet. */
export const missingAssets = (usedIds: Iterable<string>, localIds: ReadonlySet<string>): string[] =>
  [...new Set(usedIds)].filter((id) => !localIds.has(id));

export const chunk = <T>(list: readonly T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
};
