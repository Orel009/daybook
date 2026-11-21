// Core data model. Three things are kept strictly apart:
//   1. TrackerDefinition – what is tracked and how it is configured
//   2. TrackerEntry      – the historical data (never references a visualization)
//   3. visualizationId   – which registered template draws the data
// Switching visualization only changes (3), so history is never touched.

export type DateKey = string; // local calendar day, "YYYY-MM-DD"

export type ValueType =
  | 'boolean'
  | 'number'
  | 'rating'
  | 'choice'
  | 'text'
  | 'duration'
  | 'timeRange';

export type Schedule =
  | { kind: 'daily' }
  | { kind: 'weekdays'; days: number[] } // 0 = Sunday … 6 = Saturday; other days are rest days
  | { kind: 'everyN'; n: number } // every n days, counted from the tracker's creation day
  | { kind: 'perWeek'; times: number } // flexible: any `times` days in a week
  | { kind: 'perMonth'; times: number };

export interface TimeRange {
  start: string; // "HH:MM"
  end: string; // "HH:MM" – may be past midnight
}

export type EntryValue = boolean | number | string | TimeRange;

export interface TrackerDefinition {
  id: string;
  name: string;
  emoji: string;
  color: string; // key into TAPE_COLORS
  categoryId: string;
  valueType: ValueType;
  unit?: string; // number trackers: "glasses", "km" …
  step?: number; // number trackers: quick-add amount
  ratingMax?: 5 | 10;
  choices?: string[];
  /** Colour name per answer (a choice's text, or a rating as "1", "2"…). */
  valueColors?: Record<string, string>;
  /** Daily target. number: amount in `unit`; duration / timeRange: minutes. */
  target?: number;
  schedule: Schedule;
  visualizationId: string;
  /** Settings per look, keyed by visualization id, so switching back restores them. */
  visualizationConfig: Record<string, Record<string, unknown>>;
  archived: boolean;
  sortOrder: number;
  createdAt: string; // ISO timestamp
  updatedAt: string;
}

export interface TrackerEntry {
  id: string;
  trackerId: string;
  date: DateKey;
  at: string; // ISO timestamp of when it was logged
  value: EntryValue;
  note?: string;
  updatedAt: string;
  deletedAt?: string; // tombstone, kept in storage for future sync
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  builtIn?: boolean;
  updatedAt: string;
}

export type ThemeId = 'scrapbook' | 'dark' | 'minimal';

export type WidgetType = 'today' | 'streaks' | 'week' | 'note' | 'tracker';

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  size: 'half' | 'full';
  text?: string; // note widget
  trackerId?: string; // tracker widget: shows that tracker's current look
}

export interface Settings {
  theme: ThemeId;
  ownerName: string;
  weekStartsOn: 0 | 1;
  dashboard: DashboardWidget[];
  /** "My stickers": the user's own pictures, kept for reuse on any page. */
  customStickers?: { assetId: string; ratio: number }[];
  updatedAt: string;
}

export const TAPE_COLORS: Record<string, string> = {
  rose: '#F3A3BA',
  berry: '#E88AC0',
  red: '#F08080',
  coral: '#F59C8E',
  orange: '#F7AD6F',
  peach: '#F8C19B',
  butter: '#F6DB7D',
  lime: '#D3E27E',
  sage: '#BFD6A0',
  green: '#8FCF9E',
  mint: '#A9DFC4',
  teal: '#86D3CF',
  sky: '#A8CDF2',
  blue: '#86A9EA',
  lilac: '#C9B6F0',
  plum: '#B893DE',
  tan: '#D9BC9E',
  grey: '#C8C5D0',
};

export const VALUE_TYPE_LABELS: Record<ValueType, { name: string; hint: string }> = {
  boolean: { name: 'Done or not', hint: 'A simple check for the day' },
  number: { name: 'Number', hint: 'Glasses, km, pages, calories…' },
  duration: { name: 'Duration', hint: 'How long something took' },
  timeRange: { name: 'Start and end', hint: 'Bedtime to wake-up, for example' },
  rating: { name: 'Rating', hint: 'A score from 1 to 5 or 10' },
  choice: { name: 'Pick one', hint: 'Choose from your own list' },
  text: { name: 'Note', hint: 'A few words each time' },
};

export const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
