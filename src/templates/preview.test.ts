import { describe, expect, it } from 'vitest';
import { PRESETS } from '../data/defaults';
import type { TrackerDefinition, TrackerEntry } from '../domain/types';
import { BUILT_IN_TEMPLATES, buildTemplatePage } from './library';
import { previewOf, standInTracker, trackersToAdd } from './preview';

const today = new Date(2026, 10, 23);
const tracker = (id: string, name: string, extra: Partial<TrackerDefinition> = {}): TrackerDefinition => ({ ...standInTracker(name), id, name, ...extra });
const mood = tracker('own-mood', 'Mood');
const water = tracker('own-water', 'water'); // names match whatever their capitals
const old = tracker('own-sleep', 'Sleep', { archived: true });
const entries: TrackerEntry[] = [{ id: 'e1', trackerId: 'own-mood', date: '2026-11-20', at: '2026-11-20T08:00:00.000Z', value: 'Happy', updatedAt: '' } as unknown as TrackerEntry];

describe('previewing a template', () => {
  it('with my data: my own trackers are shown, by name, with what I logged', () => {
    const { ctx, source } = previewOf({ today, weekStartsOn: 1, own: [mood, water, old], entries, withData: true });
    expect(ctx.tracker('Mood')).toBe('own-mood');
    expect(ctx.tracker('Water')).toBe('own-water');
    expect(ctx.trackerIds).toEqual(['own-mood', 'own-water']);
    expect(source.tracker('own-mood')).toBe(mood);
    expect(source.entries).toBe(entries);
    expect(ctx.today).toBe(today);
    expect(ctx.weekStartsOn).toBe(1);
  });
  it('a tracker I do not have (or have archived) is shown from its preset, in memory only', () => {
    const { ctx, source } = previewOf({ today, weekStartsOn: 0, own: [mood, old], entries, withData: true });
    const id = ctx.tracker('Sleep');
    expect(id).not.toBe('own-sleep');
    const shown = source.tracker(id)!;
    expect(shown.name).toBe('Sleep');
    expect(shown.valueType).toBe(PRESETS.find((p) => p.name === 'Sleep')!.valueType);
    expect(shown.archived).toBe(false);
    expect(source.tracker('own-sleep')).toBeUndefined();
  });
  it('empty: every tracker comes from its preset and there are no entries', () => {
    const { ctx, source } = previewOf({ today, weekStartsOn: 0, own: [mood, water], entries, withData: false });
    expect(ctx.tracker('Mood')).not.toBe('own-mood');
    expect(source.tracker(ctx.tracker('Mood'))!.name).toBe('Mood');
    expect(ctx.trackerIds).toEqual([]);
    expect(source.entries).toEqual([]);
  });
  it('photos are never fetched for a preview', async () => {
    const { source } = previewOf({ today, weekStartsOn: 0, own: [], entries: [], withData: true });
    expect(await source.photos.load('anything')).toBeUndefined();
  });
  it('says which trackers using the template would add: the ones I do not have yet', () => {
    expect(trackersToAdd({ needs: ['Mood', 'Sleep', 'Water'] }, [mood, water, old])).toEqual(['Sleep']);
    expect(trackersToAdd({ needs: ['Mood'] }, [mood])).toEqual([]);
    expect(trackersToAdd({}, [])).toEqual([]);
    expect(trackersToAdd({ needs: ['Weather'] }, [])).toEqual(['Weather']);
  });
  it('every template can be previewed both ways, and every tracker on it has something to show', () => {
    for (const withData of [true, false]) {
      const { ctx, source } = previewOf({ today, weekStartsOn: 0, own: [mood, water, old], entries, withData });
      for (const t of BUILT_IN_TEMPLATES) {
        const page = buildTemplatePage(t, ctx);
        for (const el of page.elements) {
          if (el.type !== 'tracker') continue;
          expect(source.tracker(el.trackerId), `${t.name}: tracker "${el.trackerId}" (${withData ? 'with my data' : 'empty'})`).toBeDefined();
        }
      }
    }
  });
  it('building a preview changes nothing it is given', () => {
    const own = [mood, water, old];
    const before = JSON.stringify({ own, entries });
    const { ctx } = previewOf({ today, weekStartsOn: 0, own, entries, withData: true });
    for (const t of BUILT_IN_TEMPLATES.filter((x) => x.needs?.length)) buildTemplatePage(t, ctx);
    expect(JSON.stringify({ own, entries })).toBe(before);
    expect(own.length).toBe(3);
  });
});
