import type { DateKey, EntryValue, Schedule, TimeRange, TrackerDefinition, TrackerEntry } from './types';
import { addDays, addMonths, daysBetween, formatMinutes, startOfMonth, startOfWeek, toKey, weekday } from './dates';

// Every visualization and widget reads the same derived numbers from here,
// so a calendar, a garden and a pixel grid can never disagree about a streak.

export interface DaySummary {
  date: DateKey;
  entries: TrackerEntry[];
  /** Sum for number/duration/timeRange, average for rating, count otherwise. */
  total: number;
  done: boolean;
  /** 0–1 towards the daily target (1 when done and there is no target). */
  progress: number;
}

export type DayMap = Map<DateKey, DaySummary>;

export const rangeMinutes = (r: TimeRange): number => {
  const [sh, sm] = r.start.split(':').map(Number);
  const [eh, em] = r.end.split(':').map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60; // crosses midnight
  return mins;
};

export function summarizeDay(def: TrackerDefinition, date: DateKey, entries: TrackerEntry[]): DaySummary {
  let total = 0;
  let done = false;
  const has = entries.length > 0;
  switch (def.valueType) {
    case 'boolean':
      done = entries.some((e) => e.value === true);
      total = done ? 1 : 0;
      break;
    case 'number':
    case 'duration':
      total = entries.reduce((s, e) => s + (typeof e.value === 'number' ? e.value : 0), 0);
      done = def.target ? total >= def.target : has;
      break;
    case 'timeRange':
      total = entries.reduce((s, e) => s + (typeof e.value === 'object' ? rangeMinutes(e.value) : 0), 0);
      done = def.target ? total >= def.target : has;
      break;
    case 'rating': {
      const nums = entries.map((e) => e.value).filter((v): v is number => typeof v === 'number');
      total = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
      done = has;
      break;
    }
    default:
      total = entries.length;
      done = has;
  }
  const usesTarget = !!def.target && ['number', 'duration', 'timeRange'].includes(def.valueType);
  const progress = usesTarget ? Math.min(1, total / def.target!) : done ? 1 : 0;
  return { date, entries, total, done, progress };
}

export function buildDayMap(def: TrackerDefinition, entries: TrackerEntry[]): DayMap {
  const byDate = new Map<DateKey, TrackerEntry[]>();
  for (const e of entries) {
    if (e.trackerId !== def.id) continue;
    const list = byDate.get(e.date);
    if (list) list.push(e);
    else byDate.set(e.date, [e]);
  }
  const map: DayMap = new Map();
  for (const [date, list] of byDate) {
    list.sort((a, b) => a.at.localeCompare(b.at));
    map.set(date, summarizeDay(def, date, list));
  }
  return map;
}

const createdDay = (def: TrackerDefinition): DateKey => toKey(new Date(def.createdAt));

/** Is this a day the tracker expects something? Flexible schedules have no fixed days. */
export function isScheduled(def: TrackerDefinition, date: DateKey): boolean {
  const s = def.schedule;
  switch (s.kind) {
    case 'daily':
      return true;
    case 'weekdays':
      return s.days.includes(weekday(date));
    case 'everyN': {
      const diff = daysBetween(createdDay(def), date);
      return ((diff % s.n) + s.n) % s.n === 0;
    }
    default:
      return true; // perWeek / perMonth: any day can count
  }
}

export const isFlexible = (s: Schedule): s is Extract<Schedule, { kind: 'perWeek' | 'perMonth' }> =>
  s.kind === 'perWeek' || s.kind === 'perMonth';

export interface Streak {
  count: number;
  unit: 'day' | 'week' | 'month';
}

const firstDay = (def: TrackerDefinition, map: DayMap): DateKey => {
  let first = createdDay(def);
  for (const k of map.keys()) if (k < first) first = k;
  return first;
};

function countDone(map: DayMap, from: DateKey, toExclusive: DateKey): number {
  let n = 0;
  for (const [k, s] of map) if (s.done && k >= from && k < toExclusive) n++;
  return n;
}

function periodRuns(def: TrackerDefinition, map: DayMap, today: DateKey, weekStartsOn: number): number[] {
  const s = def.schedule as Extract<Schedule, { kind: 'perWeek' | 'perMonth' }>;
  const weekly = s.kind === 'perWeek';
  const start = (k: DateKey) => (weekly ? startOfWeek(k, weekStartsOn) : startOfMonth(k));
  const next = (k: DateKey) => (weekly ? addDays(k, 7) : addMonths(k, 1));
  const thisPeriod = start(today);
  let p = start(firstDay(def, map));
  const runs: number[] = [];
  let run = 0;
  for (let guard = 0; p <= thisPeriod && guard < 2000; guard++) {
    if (countDone(map, p, next(p)) >= s.times) run++;
    else if (p !== thisPeriod) {
      // the period still in progress never breaks a streak
      if (run) runs.push(run);
      run = 0;
    }
    p = next(p);
  }
  runs.push(run);
  return runs;
}

/**
 * Day streaks: consecutive *scheduled* days done.
 *  - a missed scheduled day resets the streak to zero
 *  - rest days neither break nor are required (doing one anyway adds a bonus day)
 *  - today never breaks the streak until the day is over
 */
function dayRuns(def: TrackerDefinition, map: DayMap, today: DateKey): number[] {
  let d = firstDay(def, map);
  const runs: number[] = [];
  let run = 0;
  for (let guard = 0; d <= today && guard < 20000; guard++) {
    if (map.get(d)?.done) run++;
    else if (isScheduled(def, d) && d !== today) {
      if (run) runs.push(run);
      run = 0;
    }
    d = addDays(d, 1);
  }
  runs.push(run);
  return runs;
}

/**
 * Every unbroken run in the tracker's history, oldest first. The last item is
 * the current streak (0 right after a miss). Earlier runs are never lost, which
 * is what lets a garden keep its finished plants after a reset.
 */
export function streakRuns(
  def: TrackerDefinition,
  map: DayMap,
  today: DateKey,
  weekStartsOn: number,
): { runs: number[]; unit: Streak['unit'] } {
  if (isFlexible(def.schedule)) {
    return { runs: periodRuns(def, map, today, weekStartsOn), unit: def.schedule.kind === 'perWeek' ? 'week' : 'month' };
  }
  return { runs: dayRuns(def, map, today), unit: 'day' };
}

export function streaks(
  def: TrackerDefinition,
  map: DayMap,
  today: DateKey,
  weekStartsOn: number,
): { current: Streak; best: Streak } {
  const { runs, unit } = streakRuns(def, map, today, weekStartsOn);
  return {
    current: { count: runs[runs.length - 1], unit },
    best: { count: Math.max(...runs), unit },
  };
}

/** Progress inside the current week/month for flexible schedules. */
export function periodProgress(def: TrackerDefinition, map: DayMap, today: DateKey, weekStartsOn: number) {
  if (!isFlexible(def.schedule)) return null;
  const weekly = def.schedule.kind === 'perWeek';
  const from = weekly ? startOfWeek(today, weekStartsOn) : startOfMonth(today);
  const to = weekly ? addDays(from, 7) : addMonths(from, 1);
  return { done: countDone(map, from, to), times: def.schedule.times, unit: weekly ? 'week' : 'month' };
}

export const streakLabel = (s: Streak): string => `${s.count} ${s.unit}${s.count === 1 ? '' : 's'}`;

export function scheduleLabel(s: Schedule): string {
  switch (s.kind) {
    case 'daily':
      return 'Every day';
    case 'weekdays':
      return s.days.length === 7
        ? 'Every day'
        : [...s.days].sort().map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ');
    case 'everyN':
      return s.n === 1 ? 'Every day' : `Every ${s.n} days`;
    case 'perWeek':
      return `${s.times}× a week`;
    case 'perMonth':
      return `${s.times}× a month`;
  }
}

export function formatValue(def: TrackerDefinition, v: EntryValue): string {
  switch (def.valueType) {
    case 'boolean':
      return v ? 'Done' : 'Not done';
    case 'number':
      return `${v}${def.unit ? ` ${def.unit}` : ''}`;
    case 'duration':
      return formatMinutes(v as number);
    case 'timeRange': {
      const r = v as TimeRange;
      return `${r.start} to ${r.end} (${formatMinutes(rangeMinutes(r))})`;
    }
    case 'rating':
      return `${v} out of ${def.ratingMax ?? 5}`;
    default:
      return String(v);
  }
}

/** A plain amount in the tracker's own unit, e.g. "6 glasses" or "1h 20m". */
export function formatAmount(def: TrackerDefinition, n: number): string {
  if (def.valueType === 'duration' || def.valueType === 'timeRange') return formatMinutes(n);
  const rounded = Math.round(n * 100) / 100;
  return `${rounded}${def.unit ? ` ${def.unit}` : ''}`;
}

/** Short text for a day's summary, e.g. "6 of 8 glasses". */
export function formatDay(def: TrackerDefinition, day: DaySummary | undefined): string {
  if (!day || day.entries.length === 0) return '';
  switch (def.valueType) {
    case 'boolean':
      return day.done ? 'Done' : '';
    case 'number': {
      const total = Math.round(day.total * 100) / 100;
      const unit = def.unit ? ` ${def.unit}` : '';
      return def.target ? `${total} of ${def.target}${unit}` : `${total}${unit}`;
    }
    case 'duration':
    case 'timeRange':
      return def.target
        ? `${formatMinutes(day.total)} of ${formatMinutes(def.target)}`
        : formatMinutes(day.total);
    case 'rating':
      return `${Math.round(day.total * 10) / 10} out of ${def.ratingMax ?? 5}`;
    case 'choice':
      return day.entries.map((e) => String(e.value)).join(', ');
    case 'text':
      return day.entries.length === 1 ? '1 note' : `${day.entries.length} notes`;
  }
}
