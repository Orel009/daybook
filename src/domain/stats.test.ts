import { describe, expect, it } from 'vitest';
import type { Schedule, TrackerDefinition, TrackerEntry, ValueType } from './types';
import { buildDayMap, isScheduled, rangeMinutes, streakRuns, streaks } from './stats';

const def = (schedule: Schedule, extra: Partial<TrackerDefinition> = {}): TrackerDefinition => ({
  id: 't',
  name: 'Workout',
  emoji: '🏃',
  color: 'rose',
  categoryId: 'health',
  valueType: 'boolean' as ValueType,
  schedule,
  visualizationId: 'calendar',
  visualizationConfig: {},
  archived: false,
  sortOrder: 0,
  createdAt: new Date(2026, 10, 1, 9).toISOString(), // Sun 1 Nov 2026
  updatedAt: '',
  ...extra,
});

const done = (date: string, value: TrackerEntry['value'] = true): TrackerEntry => ({
  id: date + Math.random(),
  trackerId: 't',
  date,
  at: `${date}T10:00:00.000Z`,
  value,
  updatedAt: '',
});

const run = (d: TrackerDefinition, entries: TrackerEntry[], today: string) =>
  streaks(d, buildDayMap(d, entries), today, 0);

describe('day streaks', () => {
  it('counts consecutive days', () => {
    const d = def({ kind: 'daily' });
    const r = run(d, ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04'].map((k) => done(k)), '2026-11-04');
    expect(r.current.count).toBe(4);
  });

  it('resets to zero after a missed day, then starts again at one', () => {
    const d = def({ kind: 'daily' });
    const four = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04'].map((k) => done(k));
    // day five missed, today is day six and nothing logged yet
    expect(run(d, four, '2026-11-06').current.count).toBe(0);
    // next workout day starts over
    const r = run(d, [...four, done('2026-11-06')], '2026-11-06');
    expect(r.current.count).toBe(1);
    expect(r.best.count).toBe(4);
  });

  it('does not break the streak while today is still open', () => {
    const d = def({ kind: 'daily' });
    expect(run(d, [done('2026-11-01'), done('2026-11-02')], '2026-11-03').current.count).toBe(2);
  });

  it('rest days do not break the streak', () => {
    const d = def({ kind: 'weekdays', days: [1, 3, 5] }); // Mon Wed Fri
    const r = run(d, [done('2026-11-02'), done('2026-11-04'), done('2026-11-06')], '2026-11-08');
    expect(r.current.count).toBe(3);
  });

  it('a missed scheduled day breaks the streak on a weekday schedule', () => {
    const d = def({ kind: 'weekdays', days: [1, 3, 5] });
    const r = run(d, [done('2026-11-02'), done('2026-11-06')], '2026-11-07');
    expect(r.current.count).toBe(1);
  });

  it('numeric trackers need the target to count as done', () => {
    const d = def({ kind: 'daily' }, { valueType: 'number', target: 8 });
    const r = run(d, [done('2026-11-01', 5), done('2026-11-01', 3), done('2026-11-02', 7)], '2026-11-02');
    expect(r.current.count).toBe(1);
    expect(r.best.count).toBe(1);
  });
});

describe('streak runs (garden history)', () => {
  it('keeps earlier runs after a reset', () => {
    const d = def({ kind: 'daily' });
    const days = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-06', '2026-11-07'];
    const r = streakRuns(d, buildDayMap(d, days.map((k) => done(k))), '2026-11-07', 0);
    expect(r).toEqual({ runs: [4, 2], unit: 'day' });
  });

  it('ends with zero right after a missed day', () => {
    const d = def({ kind: 'daily' });
    const r = streakRuns(d, buildDayMap(d, [done('2026-11-01'), done('2026-11-02')]), '2026-11-05', 0);
    expect(r.runs).toEqual([2, 0]);
  });
});

describe('flexible schedules', () => {
  it('counts weeks that reach the target', () => {
    const d = def({ kind: 'perWeek', times: 2 });
    const r = run(
      d,
      [done('2026-11-01'), done('2026-11-03'), done('2026-11-09'), done('2026-11-12'), done('2026-11-16')],
      '2026-11-17',
    );
    expect(r.current).toEqual({ count: 2, unit: 'week' }); // third week still in progress
  });

  it('a week below target resets', () => {
    const d = def({ kind: 'perWeek', times: 2 });
    const r = run(d, [done('2026-11-01'), done('2026-11-03'), done('2026-11-09')], '2026-11-17');
    expect(r.current.count).toBe(0);
    expect(r.best.count).toBe(1);
  });
});

describe('helpers', () => {
  it('every-N schedule', () => {
    const d = def({ kind: 'everyN', n: 3 });
    expect(isScheduled(d, '2026-11-01')).toBe(true);
    expect(isScheduled(d, '2026-11-02')).toBe(false);
    expect(isScheduled(d, '2026-11-04')).toBe(true);
  });

  it('time ranges may cross midnight', () => {
    expect(rangeMinutes({ start: '23:00', end: '07:30' })).toBe(510);
  });
});
