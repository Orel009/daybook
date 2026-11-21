import type { DaySummary } from './stats';
import { TAPE_COLORS, type TrackerDefinition } from './types';

// Value colours: "pick one" and rating trackers can give every answer its own
// colour (blue = sad, pink = happy…). Looks that draw one mark per day, such as
// Pixels and Calendar, use that colour instead of the tracker's single colour.

const CYCLE = ['rose', 'butter', 'sky', 'mint', 'lilac', 'peach', 'blue', 'coral', 'sage', 'plum'];
const RATING_5 = ['blue', 'sky', 'butter', 'peach', 'rose'];
const RATING_10 = ['blue', 'blue', 'sky', 'teal', 'mint', 'butter', 'peach', 'orange', 'rose', 'berry'];

export const usesValueColors = (def: Pick<TrackerDefinition, 'valueType'>): boolean =>
  def.valueType === 'choice' || def.valueType === 'rating';

/** The answers a tracker can have, in display order (choices, or 1…max). */
export function valueKeys(def: Pick<TrackerDefinition, 'valueType' | 'choices' | 'ratingMax'>): string[] {
  if (def.valueType === 'choice') return def.choices ?? [];
  if (def.valueType === 'rating') return Array.from({ length: def.ratingMax ?? 5 }, (_, i) => String(i + 1));
  return [];
}

export function defaultValueColor(def: Pick<TrackerDefinition, 'valueType' | 'ratingMax'>, key: string, index: number): string {
  if (def.valueType === 'rating') return ((def.ratingMax ?? 5) === 10 ? RATING_10 : RATING_5)[index] ?? 'rose';
  void key;
  return CYCLE[index % CYCLE.length];
}

/** Colour name for one answer: the saved choice, or a sensible default. */
export function valueColorName(def: TrackerDefinition, key: string): string {
  const saved = def.valueColors?.[key];
  if (saved && TAPE_COLORS[saved]) return saved;
  const index = valueKeys(def).indexOf(key);
  return index >= 0 ? defaultValueColor(def, key, index) : def.color;
}

export const valueColorHex = (def: TrackerDefinition, key: string): string =>
  TAPE_COLORS[valueColorName(def, key)] ?? TAPE_COLORS.rose;

/** Which answer a day stands for: the latest choice, or the rounded average rating. */
export function dayValueKey(def: TrackerDefinition, day: DaySummary | undefined): string | undefined {
  if (!day || day.entries.length === 0 || !usesValueColors(def)) return undefined;
  if (def.valueType === 'choice') return String(day.entries[day.entries.length - 1].value);
  return String(Math.max(1, Math.round(day.total)));
}

/** The colour to draw a day in, or undefined to use the tracker's own colour. */
export function dayColor(def: TrackerDefinition, day: DaySummary | undefined): string | undefined {
  const key = dayValueKey(def, day);
  return key === undefined ? undefined : valueColorHex(def, key);
}
