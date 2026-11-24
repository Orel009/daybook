import { draftFromPreset, PRESETS } from '../data/defaults';
import type { TrackerDefinition, TrackerEntry } from '../domain/types';
import type { PageSource } from '../ui/PageCanvas';
import { defaultMonth, defaultYear } from '../domain/newYear';
import type { BuiltInTemplate, TemplateContext } from './kit';

// Showing a template without making anything: for the preview and for
// printing it blank. A template that shows trackers gets them from here: the
// user's own trackers where they exist (by name), and otherwise a stand-in
// made from the preset, held in memory only. Nothing is saved, so nothing
// syncs.

const STAND_IN = 'preview:';
const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** A tracker as its preset would make it, for showing only. */
export function standInTracker(name: string): TrackerDefinition {
  const draft = draftFromPreset(PRESETS.find((p) => sameName(p.name, name)));
  return { ...draft, name: draft.name || name, id: `${STAND_IN}${name}`, archived: false, sortOrder: 0, createdAt: '', updatedAt: '' };
}

/** The trackers a template shows that the user doesn't have yet (so using it would add them). */
export const trackersToAdd = (t: Pick<BuiltInTemplate, 'needs'>, own: TrackerDefinition[]): string[] =>
  (t.needs ?? []).filter((name) => !own.some((x) => !x.archived && sameName(x.name, name)));

export interface PreviewOptions {
  today: Date;
  weekStartsOn: number;
  /** The user's trackers. */
  own: TrackerDefinition[];
  entries: TrackerEntry[];
  /** Show the user's own trackers with what they logged; otherwise every tracker is shown empty. */
  withData: boolean;
  /** For templates that ask: the year and the month. Left out, the ones a page made today would get. */
  year?: number;
  month?: Date;
}

/**
 * What a template needs to be drawn without creating anything: the context to
 * build its page with, and where that page's trackers and entries come from.
 */
export function previewOf(o: PreviewOptions): { ctx: TemplateContext; source: PageSource } {
  const active = o.own.filter((t) => !t.archived);
  const ctx: TemplateContext = {
    today: o.today,
    weekStartsOn: o.weekStartsOn,
    tracker: (name) => (o.withData ? active.find((t) => sameName(t.name, name))?.id : undefined) ?? `${STAND_IN}${name}`,
    trackerIds: o.withData ? active.map((t) => t.id) : [],
    year: o.year ?? defaultYear(o.today),
    month: o.month ?? defaultMonth(o.today),
  };
  const source: PageSource = {
    photos: { ns: 'preview', load: async () => undefined },
    tracker: (id) => (id.startsWith(STAND_IN) ? standInTracker(id.slice(STAND_IN.length)) : active.find((t) => t.id === id)),
    entries: o.withData ? o.entries : [],
  };
  return { ctx, source };
}
