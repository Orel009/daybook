import type { DateKey } from './types';

// All day logic works on local calendar days ("YYYY-MM-DD"), never on raw
// timestamps, so streaks do not shift with time zones or daylight saving.

// The app is English-only for now: never follow the device language.
export const LOCALE = 'en-US';

const pad = (n: number) => String(n).padStart(2, '0');

export const toKey = (d: Date): DateKey =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const fromKey = (k: DateKey): Date => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const todayKey = (): DateKey => toKey(new Date());

export const addDays = (k: DateKey, n: number): DateKey => {
  const d = fromKey(k);
  d.setDate(d.getDate() + n);
  return toKey(d);
};

export const addMonths = (k: DateKey, n: number): DateKey => {
  const d = fromKey(k);
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  return toKey(d);
};

export const weekday = (k: DateKey): number => fromKey(k).getDay();

export const startOfWeek = (k: DateKey, weekStartsOn: number): DateKey =>
  addDays(k, -((weekday(k) - weekStartsOn + 7) % 7));

export const startOfMonth = (k: DateKey): DateKey => `${k.slice(0, 8)}01`;

export const daysBetween = (a: DateKey, b: DateKey): number =>
  Math.round((fromKey(b).getTime() - fromKey(a).getTime()) / 86_400_000);

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const formatLong = (k: DateKey): string =>
  fromKey(k).toLocaleDateString(LOCALE, { weekday: 'long', month: 'long', day: 'numeric' });

export const formatShort = (k: DateKey): string =>
  fromKey(k).toLocaleDateString(LOCALE, { weekday: 'short', month: 'short', day: 'numeric' });

export const formatMonth = (k: DateKey): string =>
  fromKey(k).toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' });

export const formatMinutes = (m: number): string => {
  const mins = Math.round(m);
  const h = Math.floor(mins / 60);
  const r = mins % 60;
  if (h && r) return `${h}h ${r}m`;
  if (h) return `${h}h`;
  return `${r}m`;
};
