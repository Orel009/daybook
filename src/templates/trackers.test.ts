import { describe, expect, it } from 'vitest';
import { draftFromPreset, PRESETS, type TrackerDraft } from '../data/defaults';
import type { TrackerDefinition } from '../domain/types';
import { BUILT_IN_TEMPLATES, buildTemplatePage } from './library';
import { trackerFinder } from './trackers';

const tracker = (id: string, name: string, archived = false): TrackerDefinition => ({ ...draftFromPreset(PRESETS.find((p) => p.name === name)), name, id, archived, sortOrder: 0, createdAt: '', updatedAt: '' });

/** A stand-in for the store's createTracker, counting what it adds. */
const adder = () => {
  const added: TrackerDraft[] = [];
  const add = (draft: TrackerDraft): TrackerDefinition => {
    added.push(draft);
    return { ...draft, id: `new-${added.length}`, archived: false, sortOrder: 0, createdAt: '', updatedAt: '' };
  };
  return { added, add };
};

describe('the trackers a page made from a template shows', () => {
  it('uses her tracker with that name, and adds nothing', () => {
    const { added, add } = adder();
    const find = trackerFinder([tracker('hers', 'Mood')], add);
    expect(find('Mood')).toBe('hers');
    expect(find(' mood ')).toBe('hers');
    expect(added).toEqual([]);
  });
  it('adds one from the preset only when she has none, and only once', () => {
    const { added, add } = adder();
    const find = trackerFinder([tracker('other', 'Water')], add);
    expect(find('Mood')).toBe('new-1');
    expect(find('Mood')).toBe('new-1');
    expect(added.map((d) => d.name)).toEqual(['Mood']);
    expect(added[0].valueType).toBe(PRESETS.find((p) => p.name === 'Mood')!.valueType);
  });
  it('an archived tracker is not used: a new one is added', () => {
    const { added, add } = adder();
    expect(trackerFinder([tracker('old', 'Mood', true)], add)('Mood')).toBe('new-1');
    expect(added.length).toBe(1);
  });
  it('every template that needs trackers uses hers when she has them all, and adds none', () => {
    const own = PRESETS.map((p, i) => tracker(`hers-${i}`, p.name));
    const needing = BUILT_IN_TEMPLATES.filter((t) => t.needs?.length);
    expect(needing.length).toBeGreaterThanOrEqual(15);
    for (const t of needing) {
      const { added, add } = adder();
      const page = buildTemplatePage(t, { today: new Date(2026, 10, 24), weekStartsOn: 0, tracker: trackerFinder(own, add), trackerIds: own.map((x) => x.id), year: 2027, month: new Date(2026, 11, 1) });
      expect(added.map((d) => d.name), t.name).toEqual([]);
      for (const name of t.needs!) {
        const id = own.find((x) => x.name === name)!.id;
        expect(page.elements.some((e) => e.type === 'tracker' && e.trackerId === id), `${t.name} shows her ${name}`).toBe(true);
      }
    }
  });
  it('"Set up 2027" with a Mood tracker of hers: the Mood page uses it, pinned to 2027, and adds no second one', () => {
    const { added, add } = adder();
    const t = BUILT_IN_TEMPLATES.find((x) => x.id === 'mood-pixels')!;
    const page = buildTemplatePage(t, { today: new Date(2026, 11, 5), weekStartsOn: 0, tracker: trackerFinder([tracker('hers', 'Mood')], add), trackerIds: ['hers'], year: 2027, month: new Date(2027, 0, 1) });
    const parts = page.elements.filter((e) => e.type === 'tracker');
    expect(parts).toEqual([expect.objectContaining({ trackerId: 'hers', year: 2027, look: 'pixels' })]);
    expect(added).toEqual([]);
  });
});
