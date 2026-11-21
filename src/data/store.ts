import { create } from 'zustand';
import type { Category, EntryValue, Settings, TrackerDefinition, TrackerEntry, DateKey } from '../domain/types';
import { newId } from '../domain/types';
import * as db from './db';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS, type TrackerDraft } from './defaults';
import { assetIdsOf, blankPage, copyPage, type Page, type PageSize } from '../domain/pages';
import { exportAssets, importAssets, removeUnusedAssets, type BackupAsset } from './assets';

const now = () => new Date().toISOString();
const save = (store: db.StoreName, value: unknown) => {
  db.put(store, value).catch((err) => console.error('Could not save', store, err));
};

/** Every photo still in use: on a page, or kept in "My stickers". */
const usedAssets = (pages: Page[], settings: Settings): string[] => [
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
  addEntry: (trackerId: string, date: DateKey, value: EntryValue, note?: string) => void;
  updateEntry: (id: string, patch: Pick<TrackerEntry, 'value' | 'note' | 'date'>) => void;
  removeEntry: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  createPage: (title: string, size: PageSize, from?: Page, isTemplate?: boolean) => Page;
  savePage: (page: Page) => void;
  deletePage: (id: string) => void;
  /** Swap a journal page with its neighbour in book order. */
  movePage: (id: string, by: 1 | -1) => void;
  exportBackup: () => Promise<BackupFile>;
  importBackup: (file: BackupFile) => Promise<void>;
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
      trackers: trackers.sort((a, b) => a.sortOrder - b.sortOrder),
      entries: entries.filter((e) => !e.deletedAt),
      categories: [...DEFAULT_CATEGORIES, ...custom],
      settings: { ...DEFAULT_SETTINGS, ...stored },
      pages: pages.sort((a, b) => a.sortOrder - b.sortOrder),
    });
    void db.requestDurableStorage();
    void removeUnusedAssets(new Set(usedAssets(pages, { ...DEFAULT_SETTINGS, ...stored })));
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

  deleteTracker: (id) => {
    const gone = get().entries.filter((e) => e.trackerId === id);
    set((s) => ({
      trackers: s.trackers.filter((t) => t.id !== id),
      entries: s.entries.filter((e) => e.trackerId !== id),
    }));
    db.remove('trackers', id).catch(console.error);
    for (const e of gone) db.remove('entries', e.id).catch(console.error);
  },

  addCategory: (name, emoji) => {
    const c: Category = { id: newId(), name, emoji, updatedAt: now() };
    set((s) => ({ categories: [...s.categories, c] }));
    save('categories', c);
    return c;
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
    const next = { ...page, updatedAt: now() };
    set((s) => ({ pages: s.pages.some((p) => p.id === page.id) ? s.pages.map((p) => (p.id === page.id ? next : p)) : [...s.pages, next] }));
    save('pages', next);
  },

  deletePage: (id) => {
    set((s) => ({ pages: s.pages.filter((p) => p.id !== id) }));
    db.remove('pages', id).catch(console.error);
    void removeUnusedAssets(new Set(usedAssets(get().pages, get().settings)));
  },

  movePage: (id, by) => {
    const ordered = get().pages.filter((p) => !p.isTemplate).sort((a, b) => a.sortOrder - b.sortOrder);
    const i = ordered.findIndex((p) => p.id === id);
    const other = ordered[i + by];
    if (i < 0 || !other) return;
    const a = { ...ordered[i], sortOrder: other.sortOrder };
    const b = { ...other, sortOrder: ordered[i].sortOrder };
    set((s) => ({ pages: s.pages.map((p) => (p.id === a.id ? a : p.id === b.id ? b : p)) }));
    save('pages', a);
    save('pages', b);
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
      pages: s.pages,
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
      trackers: [...file.trackers].sort((a, b) => a.sortOrder - b.sortOrder),
      entries: file.entries.filter((e) => !e.deletedAt),
      categories: [...DEFAULT_CATEGORIES, ...custom],
      settings,
      pages: [...(file.pages ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    });
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
