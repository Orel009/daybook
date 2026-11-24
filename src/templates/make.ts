import { useStore } from '../data/store';
import { defaultMonth, defaultYear, type PlannedPage } from '../domain/newYear';
import type { Page } from '../domain/pages';
import type { BuiltInTemplate } from './kit';
import { trackerFinder } from './trackers';

// Making real pages from ready-made templates. This is the one place where a
// template turns into something saved: the page, and any tracker it shows that
// doesn't exist yet. Previews never come through here.

type Library = typeof import('./library');

/** A journal page from a template, for the year or month given (or the usual ones). */
export function makePage(library: Library, t: BuiltInTemplate, when: { year?: number; month?: Date } = {}): Page {
  const { settings, trackers, createTracker, createPage } = useStore.getState();
  const today = new Date();
  const page = library.buildTemplatePage(t, {
    today,
    weekStartsOn: settings.weekStartsOn,
    // a page that shows a tracker uses hers with that name, and adds one only if she has none
    tracker: trackerFinder(trackers, createTracker),
    trackerIds: trackers.filter((x) => !x.archived).map((x) => x.id),
    year: when.year ?? defaultYear(today),
    month: when.month ?? defaultMonth(today),
  });
  return createPage(page.title, t.size, page, false);
}

/** Several pages in one go, in the order given (for "Set up <year>" and the new month). The templates are fetched if need be. */
export async function makePlanned(plan: PlannedPage[]): Promise<Page[]> {
  const library = await import('./library');
  const made: Page[] = [];
  for (const p of plan) {
    const t = library.BUILT_IN_TEMPLATES.find((x) => x.id === p.templateId);
    if (t) made.push(makePage(library, t, { year: p.year, month: p.month }));
  }
  return made;
}
