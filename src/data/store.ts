import { create } from 'zustand';
import type { Category, EntryValue, Settings, TrackerDefinition, TrackerEntry, DateKey } from '../domain/types';
import { newId } from '../domain/types';
import * as db from './db';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS, type TrackerDraft } from './defaults';
import { assetIdsOf, blankPage, bookOrder, copyPage, coverOf, editedPage, movedPage, type Page, type PageSize } from '../domain/pages';
import { coverPage, matchingBack, standardCover } from '../domain/covers';
import { planMove } from '../domain/order';
import { exportAssets, forgetAllAssets, importAssets, removeUnusedAssets, type BackupAsset } from './assets';
import { markDirty, markManyDirty } from './outbox';
import type { SyncKind } from './merge';

const now = () => new Date().toISOString();

type DataStore = 'trackers' | 'entries' | 'categories' | 'pages' | 'meta';
const KIND: Record<DataStore, SyncKind> = { trackers: 'tracker', entries: 'entry', categories: 'category', pages: 'page', meta: 'settings' };
export const SETTINGS_ID = 'settings';

/** Saves on this device, then notes the change for cloud sync. */
const save = <T extends { id?: string; key?: string }>(store: DataStore, value: T) => {
  db.put(store, value)
    .then(() => markDirty(KIND[store], store === 'meta' ? SETTINGS_ID : value.id!))
    .catch((err) => console.error('Could not save', store, err));
};
const saveMany = (store: DataStore, values: { id: string }[]) => {
  db.putMany(store, values)
    .then(() => markManyDirty(values.map((v) => ({ kind: KIND[store], id: v.id }))))
    .catch((err) => console.error('Could not save', store, err));
};

/** A record pulled from the cloud, already in its local shape. */
export interface IncomingRecord {
  kind: SyncKind;
  id: string;
  record: { updatedAt: string; deletedAt?: string };
}

const live = <T extends { deletedAt?: string }>(list: T[]) => list.filter((x) => !x.deletedAt);

// A cover opened with "Edit cover" exists only in memory until something on it
// is changed: opening the editor and leaving again leaves the book as it was.
const unsavedCovers = new Set<string>();
export const isUnsavedCover = (id: string): boolean => unsavedCovers.has(id);
const byOrder = <T extends { sortOrder: number }>(list: T[]) => [...list].sort((a, b) => a.sortOrder - b.sortOrder);

/** Every photo still in use: on a page, or kept in "My stickers". */
export const usedAssets = (pages: Page[], settings: Settings): string[] => [
  ...pages.flatMap(assetIdsOf),
  ...(settings.customStickers ?? []).map((c) => c.assetId),
];

export interface BackupFile {
  app: 'daybook';
  version: 1;
  exportedAt: string;
  trackers: TrackerDefinition[];
  entries: TrackerEntry[];
  categories: Category[];
  settings: Settings;
  pages?: Page[];
  assets?: BackupAsset[];
}

interface State {
  ready: boolean;
  persistent: boolean;
  trackers: TrackerDefinition[];
  entries: TrackerEntry[]; // live entries only; tombstones stay in storage
  categories: Category[];
  settings: Settings;
  pages: Page[];

  init: () => Promise<void>;
  createTracker: (draft: TrackerDraft) => TrackerDefinition;
  updateTracker: (id: string, patch: Partial<TrackerDefinition>) => void;
  deleteTracker: (id: string) => void;
  addCategory: (name: string, emoji: string) => Category;
  removeCategory: (id: string) => void;
  addEntry: (trackerId: string, date: DateKey, value: EntryValue, note?: string) => void;
  updateEntry: (id: string, patch: Pick<TrackerEntry, 'value' | 'note' | 'date'>) => void;
  removeEntry: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  createPage: (title: string, size: PageSize, from?: Page, isTemplate?: boolean) => Page;
  savePage: (page: Page) => void;
  deletePage: (id: string) => void;
  /** Move a journal page one place earlier or later in book order. */
  movePage: (id: string, by: 1 | -1) => void;
  /** Move a journal page to a position in book order (0 = first). Writes only the moved page when it can. */
  movePageTo: (id: string, index: number) => void;
  /** The book's cover page to edit: made from the built-in look the first time (`accent` is the theme colour), stored with its first change. */
  ensureCover: (role: 'cover' | 'back', accent: string) => Page;
  /** Forgets covers that were opened for editing but never changed. */
  dropUnsavedCovers: () => void;
  exportBackup: () => Promise<BackupFile>;
  importBackup: (file: BackupFile) => Promise<void>;
  /** Writes records pulled from the cloud, without marking them for upload. */
  applyRemote: (incoming: IncomingRecord[]) => Promise<void>;
  /** Empties the book on this device (used when logging out). */
  clearLocal: () => Promise<void>;
}

export const useStore = create<State>((set, get) => ({
  ready: false,
  persistent: false,
  trackers: [],
  entries: [],
  categories: DEFAULT_CATEGORIES,
  settings: DEFAULT_SETTINGS,
  pages: [],

  init: async () => {
    const [trackers, entries, categories, meta, pages] = await Promise.all([
      db.getAll<TrackerDefinition>('trackers'),
      db.getAll<TrackerEntry>('entries'),
      db.getAll<Category>('categories'),
      db.getAll<{ key: string; value: Settings }>('meta'),
      db.getAll<Page>('pages'),
    ]);
    const stored = meta.find((m) => m.key === 'settings')?.value;
    const custom = categories.filter((c) => !DEFAULT_CATEGORIES.some((d) => d.id === c.id));
    set({
      ready: true,
      persistent: db.isPersistent(),
      trackers: byOrder(live(trackers)),
      entries: live(entries),
      categories: [...DEFAULT_CATEGORIES, ...live(custom)],
      settings: { ...DEFAULT_SETTINGS, ...stored },
      pages: byOrder(live(pages)),
    });
    void db.requestDurableStorage();
    void removeUnusedAssets(new Set(usedAssets(live(pages), { ...DEFAULT_SETTINGS, ...stored })));
  },

  createTracker: (draft) => {
    const t: TrackerDefinition = {
      ...draft,
      id: newId(),
      archived: false,
      sortOrder: get().trackers.reduce((m, x) => Math.max(m, x.sortOrder), 0) + 1,
      createdAt: now(),
      updatedAt: now(),
    };
    set((s) => ({ trackers: [...s.trackers, t] }));
    save('trackers', t);
    return t;
  },

  updateTracker: (id, patch) => {
    const current = get().trackers.find((t) => t.id === id);
    if (!current) return;
    const next = { ...current, ...patch, id, updatedAt: now() };
    set((s) => ({ trackers: s.trackers.map((t) => (t.id === id ? next : t)) }));
    save('trackers', next);
  },

  // Deletes leave tombstones in storage so they reach other devices.
  deleteTracker: (id) => {
    const tracker = get().trackers.find((t) => t.id === id);
    if (!tracker) return;
    const at = now();
    const gone = get().entries.filter((e) => e.trackerId === id);
    set((s) => ({
      trackers: s.trackers.filter((t) => t.id !== id),
      entries: s.entries.filter((e) => e.trackerId !== id),
    }));
    save('trackers', { ...tracker, deletedAt: at, updatedAt: at });
    saveMany('entries', gone.map((e) => ({ ...e, deletedAt: at, updatedAt: at })));
  },

  addCategory: (name, emoji) => {
    const c: Category = { id: newId(), name, emoji, updatedAt: now() };
    set((s) => ({ categories: [...s.categories, c] }));
    save('categories', c);
    return c;
  },

  removeCategory: (id) => {
    const c = get().categories.find((x) => x.id === id);
    if (!c || c.builtIn) return;
    set((s) => ({ categories: s.categories.filter((x) => x.id !== id) }));
    save('categories', { ...c, deletedAt: now(), updatedAt: now() });
  },

  addEntry: (trackerId, date, value, note) => {
    const e: TrackerEntry = {
      id: newId(),
      trackerId,
      date,
      at: now(),
      value,
      note: note?.trim() || undefined,
      updatedAt: now(),
    };
    set((s) => ({ entries: [...s.entries, e] }));
    save('entries', e);
  },

  updateEntry: (id, patch) => {
    const current = get().entries.find((e) => e.id === id);
    if (!current) return;
    const next = { ...current, ...patch, note: patch.note?.trim() || undefined, updatedAt: now() };
    set((s) => ({ entries: s.entries.map((e) => (e.id === id ? next : e)) }));
    save('entries', next);
  },

  removeEntry: (id) => {
    const current = get().entries.find((e) => e.id === id);
    if (!current) return;
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));
    save('entries', { ...current, deletedAt: now(), updatedAt: now() });
  },

  updateSettings: (patch) => {
    const next = { ...get().settings, ...patch, updatedAt: now() };
    set({ settings: next });
    save('meta', { key: 'settings', value: next });
  },

  createPage: (title, size, from, isTemplate = false) => {
    const order = get().pages.reduce((m, p) => Math.max(m, p.sortOrder), 0) + 1;
    const page = from ? copyPage(from, title, order, isTemplate) : { ...blankPage(title, size, order), isTemplate };
    set((s) => ({ pages: [...s.pages, page] }));
    save('pages', page);
    return page;
  },

  savePage: (page) => {
    const next = editedPage(page, now());
    unsavedCovers.delete(page.id);
    set((s) => ({ pages: s.pages.some((p) => p.id === page.id) ? s.pages.map((p) => (p.id === page.id ? next : p)) : [...s.pages, next] }));
    save('pages', next);
  },

  deletePage: (id) => {
    const page = get().pages.find((p) => p.id === id);
    if (!page) return;
    set((s) => ({ pages: s.pages.filter((p) => p.id !== id) }));
    if (unsavedCovers.delete(id)) return; // never stored: nothing to tell other devices
    save('pages', { ...page, deletedAt: now(), updatedAt: now() });
    void removeUnusedAssets(new Set(usedAssets(get().pages, get().settings)), true);
  },

  movePage: (id, by) => {
    const i = bookOrder(get().pages).findIndex((p) => p.id === id);
    if (i >= 0) get().movePageTo(id, i + by);
  },

  movePageTo: (id, index) => {
    const changes = new Map(planMove(bookOrder(get().pages), id, index).map((c) => [c.id, c.sortOrder]));
    if (!changes.size) return;
    const at = now();
    const moved: Page[] = [];
    const pages = get().pages.map((p) => {
      const sortOrder = changes.get(p.id);
      if (sortOrder === undefined) return p;
      const next = movedPage(p, sortOrder, at);
      moved.push(next);
      return next;
    });
    set({ pages });
    saveMany('pages', moved);
  },

  ensureCover: (role, accent) => {
    const existing = coverOf(get().pages, role);
    if (existing) return existing;
    const front = coverOf(get().pages, 'cover');
    const design = role === 'back' && front ? matchingBack(front) : role === 'back' ? { ...standardCover('', accent), elements: [] } : standardCover(get().settings.ownerName, accent);
    const page = coverPage(role, { background: { ...design.background }, spine: design.spine, elements: design.elements });
    unsavedCovers.add(page.id);
    set((s) => ({ pages: [...s.pages, page] }));
    return page;
  },

  dropUnsavedCovers: () => {
    if (get().pages.some((p) => unsavedCovers.has(p.id))) set((s) => ({ pages: s.pages.filter((p) => !unsavedCovers.has(p.id)) }));
    unsavedCovers.clear();
  },

  exportBackup: async () => {
    const s = get();
    return {
      app: 'daybook',
      version: 1,
      exportedAt: now(),
      trackers: s.trackers,
      entries: s.entries,
      categories: s.categories.filter((c) => !c.builtIn),
      settings: s.settings,
      pages: s.pages.filter((p) => !unsavedCovers.has(p.id)),
      assets: await exportAssets(usedAssets(s.pages, s.settings)),
    };
  },

  importBackup: async (file) => {
    if (file?.app !== 'daybook' || !Array.isArray(file.trackers) || !Array.isArray(file.entries)) {
      throw new Error('This file is not a Daybook backup.');
    }
    const settings = { ...DEFAULT_SETTINGS, ...file.settings };
    const custom = (file.categories ?? []).filter((c) => !c.builtIn);
    await db.replaceAll({
      trackers: file.trackers,
      entries: file.entries,
      categories: custom,
      meta: [{ key: 'settings', value: settings }],
      pages: file.pages ?? [],
    });
    await importAssets(file.assets ?? []);
    set({
      trackers: byOrder(live(file.trackers)),
      entries: live(file.entries),
      categories: [...DEFAULT_CATEGORIES, ...live(custom)],
      settings,
      pages: byOrder(live(file.pages ?? [])),
    });
    // When logged in, the restored book is merged into the cloud copy.
    await markManyDirty([
      ...file.trackers.map((x) => ({ kind: 'tracker' as const, id: x.id })),
      ...file.entries.map((x) => ({ kind: 'entry' as const, id: x.id })),
      ...custom.map((x) => ({ kind: 'category' as const, id: x.id })),
      ...(file.pages ?? []).map((x) => ({ kind: 'page' as const, id: x.id })),
      ...(file.assets ?? []).map((x) => ({ kind: 'asset' as const, id: x.id })),
      { kind: 'settings', id: SETTINGS_ID },
    ]);
  },

  applyRemote: async (incoming) => {
    if (!incoming.length) return;
    const s = get();
    // This device may have changed a record while the pull was running: keep whichever is newer.
    const current = (kind: SyncKind, id: string): { updatedAt: string } | undefined =>
      kind === 'tracker' ? s.trackers.find((x) => x.id === id)
      : kind === 'entry' ? s.entries.find((x) => x.id === id)
      : kind === 'category' ? s.categories.find((x) => x.id === id)
      : kind === 'page' ? s.pages.find((x) => x.id === id)
      : s.settings;
    const fresh = incoming.filter((r) => {
      const c = current(r.kind, r.id);
      return !c?.updatedAt || Date.parse(r.record.updatedAt) >= Date.parse(c.updatedAt);
    });
    const of = <T>(kind: SyncKind) => fresh.filter((r) => r.kind === kind).map((r) => r.record as unknown as T);
    const merge = <T extends { id: string; deletedAt?: string }>(list: T[], changes: T[]) => {
      const byId = new Map(list.map((x) => [x.id, x]));
      for (const c of changes) {
        if (c.deletedAt) byId.delete(c.id);
        else byId.set(c.id, c);
      }
      return [...byId.values()];
    };

    const trackers = of<TrackerDefinition>('tracker');
    const entries = of<TrackerEntry>('entry');
    const categories = of<Category>('category').filter((c) => !c.builtIn);
    const pages = of<Page>('page');
    const settings = of<Settings>('settings').at(-1);

    await Promise.all([
      db.putMany('trackers', trackers),
      db.putMany('entries', entries),
      db.putMany('categories', categories),
      db.putMany('pages', pages),
      settings ? db.put('meta', { key: 'settings', value: settings }) : undefined,
    ]);
    set((st) => ({
      trackers: trackers.length ? byOrder(merge(st.trackers, trackers)) : st.trackers,
      entries: entries.length ? merge(st.entries, entries) : st.entries,
      categories: categories.length ? merge(st.categories, categories) : st.categories,
      pages: pages.length ? byOrder(merge(st.pages, pages)) : st.pages,
      settings: settings ? { ...DEFAULT_SETTINGS, ...settings } : st.settings,
    }));
  },

  clearLocal: async () => {
    await db.replaceAll({ trackers: [], entries: [], categories: [], meta: [], pages: [], assets: [], outbox: [] });
    forgetAllAssets();
    set({ trackers: [], entries: [], categories: DEFAULT_CATEGORIES, settings: DEFAULT_SETTINGS, pages: [] });
  },
}));

// Which sheet is open. Kept apart from saved data on purpose.
interface LogTarget {
  trackerId: string;
  date?: DateKey;
  entryId?: string;
}
export const useUi = create<{ log: LogTarget | null; openLog: (t: LogTarget) => void; closeLog: () => void }>(
  (set) => ({
    log: null,
    openLog: (log) => set({ log }),
    closeLog: () => set({ log: null }),
  }),
);
