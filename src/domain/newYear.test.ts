import { describe, expect, it } from 'vitest';
import { daysInMonth, defaultMonth, defaultYear, EVERYTHING, isLeapYear, monthChoices, monthKey, monthToSetUp, opensOn, pinFor, planForMonth, planForYear, planningYear, showsNewMonthCard, yearChoices } from './newYear';

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

describe('which year a yearly page is for', () => {
  it('is this year until the end of October', () => {
    expect(defaultYear(d(2026, 1, 1))).toBe(2026);
    expect(defaultYear(d(2026, 6, 15))).toBe(2026);
    expect(defaultYear(d(2026, 10, 31))).toBe(2026);
  });
  it('is next year from November 1', () => {
    expect(defaultYear(d(2026, 11, 1))).toBe(2027);
    expect(defaultYear(d(2026, 11, 24))).toBe(2027);
    expect(defaultYear(d(2026, 12, 31))).toBe(2027);
  });
  it('from December into January: the year that was "next" is now "this"', () => {
    expect(defaultYear(d(2026, 12, 31))).toBe(2027);
    expect(defaultYear(d(2027, 1, 1))).toBe(2027);
    expect(defaultYear(d(2027, 2, 28))).toBe(2027);
  });
  it('offers the year before, the default and the year after', () => {
    expect(yearChoices(d(2026, 6, 15))).toEqual([2025, 2026, 2027]);
    expect(yearChoices(d(2026, 11, 24))).toEqual([2026, 2027, 2028]);
    expect(yearChoices(d(2027, 1, 3))).toEqual([2026, 2027, 2028]);
  });
});

describe('which month a monthly page is for', () => {
  it('is this month, or next month from the 24th', () => {
    expect(defaultMonth(d(2026, 11, 1))).toEqual(d(2026, 11, 1));
    expect(defaultMonth(d(2026, 11, 23))).toEqual(d(2026, 11, 1));
    expect(defaultMonth(d(2026, 11, 24))).toEqual(d(2026, 12, 1));
  });
  it('late December gives January of next year', () => {
    expect(defaultMonth(d(2026, 12, 23))).toEqual(d(2026, 12, 1));
    expect(defaultMonth(d(2026, 12, 24))).toEqual(d(2027, 1, 1));
    expect(defaultMonth(d(2026, 12, 31))).toEqual(d(2027, 1, 1));
    expect(defaultMonth(d(2027, 1, 1))).toEqual(d(2027, 1, 1));
  });
  it('late February gives March, in a leap year too', () => {
    expect(defaultMonth(d(2027, 2, 28))).toEqual(d(2027, 3, 1));
    expect(defaultMonth(d(2028, 2, 29))).toEqual(d(2028, 3, 1));
  });
  it('offers last month, this month and the eleven after, across the new year', () => {
    const list = monthChoices(d(2026, 11, 24));
    expect(list.length).toBe(13);
    expect(list[0]).toEqual(d(2026, 10, 1));
    expect(list[1]).toEqual(d(2026, 11, 1));
    expect(list[3]).toEqual(d(2027, 1, 1));
    expect(list[12]).toEqual(d(2027, 10, 1));
    expect(monthChoices(d(2027, 1, 5))[0]).toEqual(d(2026, 12, 1));
    // every month once, a month apart
    expect(new Set(list.map(monthKey)).size).toBe(13);
  });
  it('remembers a month as year and month', () => {
    expect(monthKey(d(2026, 3, 9))).toBe('2026-03');
    expect(monthKey(d(2027, 12, 1))).toBe('2027-12');
  });
});

describe('leap years', () => {
  it('every fourth year, but not the hundreds, except the four-hundreds', () => {
    expect([2024, 2028, 2000, 2400].every(isLeapYear)).toBe(true);
    expect([2025, 2026, 2027, 1900, 2100].some(isLeapYear)).toBe(false);
  });
  it('February has 29 days in a leap year, and the year at a glance follows', () => {
    expect(daysInMonth(2028, 1)).toBe(29);
    expect(daysInMonth(2027, 1)).toBe(28);
    expect(Array.from({ length: 12 }, (_, m) => daysInMonth(2028, m)).reduce((a, b) => a + b, 0)).toBe(366);
    expect(Array.from({ length: 12 }, (_, m) => daysInMonth(2027, m)).reduce((a, b) => a + b, 0)).toBe(365);
  });
});

describe('the "Plan <year>" collection', () => {
  it('shows from December 1 to January 31', () => {
    expect(planningYear(d(2026, 11, 30))).toBeNull();
    expect(planningYear(d(2026, 12, 1))).toBe(2027);
    expect(planningYear(d(2026, 12, 31))).toBe(2027);
    expect(planningYear(d(2027, 1, 1))).toBe(2027);
    expect(planningYear(d(2027, 1, 31))).toBe(2027);
    expect(planningYear(d(2027, 2, 1))).toBeNull();
    expect(planningYear(d(2027, 7, 1))).toBeNull();
  });
  it('in December it plans next year, in January the year that has just begun', () => {
    expect(planningYear(d(2027, 12, 15))).toBe(2028);
    expect(planningYear(d(2028, 1, 15))).toBe(2028);
  });
  it('"Set up" makes the ticked pages in order: divider, goals, word, year at a glance, bingo, Mood in pixels, then January to December', () => {
    const plan = planForYear(2027, EVERYTHING);
    expect(plan.length).toBe(18);
    expect(plan.slice(0, 6).map((p) => p.templateId)).toEqual(['divider-year', 'year-goals-areas', 'year-word', 'year-glance', 'year-bingo', 'mood-pixels']);
    expect(plan.every((p) => p.year === 2027)).toBe(true);
    const months = plan.slice(6);
    expect(months.every((p) => p.templateId === 'goals')).toBe(true);
    expect(months.map((p) => p.month!.getMonth())).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(months.every((p) => p.month!.getFullYear() === 2027 && p.month!.getDate() === 1)).toBe(true);
  });
  it('makes only what is ticked, in the style that was picked', () => {
    expect(planForYear(2027, { ...EVERYTHING, divider: false, word: false, bingo: false, mood: false, months: false, goalStyle: 'year-goals-12' })).toEqual([
      { templateId: 'year-goals-12', year: 2027 },
      { templateId: 'year-glance', year: 2027 },
    ]);
    expect(planForYear(2027, { ...EVERYTHING, divider: false, goals: false, word: false, glance: false, bingo: false, mood: false, monthStyle: 'goals-month-weeks' }).map((p) => p.templateId)).toEqual(Array.from({ length: 12 }, () => 'goals-month-weeks'));
    expect(planForYear(2027, { ...EVERYTHING, divider: false, goals: false, word: false, glance: false, bingo: false, mood: false, months: false })).toEqual([]);
    // the Mood page alone: one page for the year, and no tracker of its own (the page uses hers, or adds one if she has none)
    expect(planForYear(2027, { ...EVERYTHING, divider: false, goals: false, word: false, glance: false, bingo: false, months: false })).toEqual([{ templateId: 'mood-pixels', year: 2027 }]);
  });
  it('a leap year is planned like any other: twelve monthly pages', () => {
    expect(planForYear(2028, EVERYTHING).filter((p) => p.month).length).toBe(12);
  });
});

describe('tracker parts on a page for a year or a month', () => {
  it('a part without a year follows today, as every older part does', () => {
    expect(opensOn({}, '2026-11-24')).toBeUndefined();
    expect(opensOn({ month: 3 }, '2026-11-24')).toBeUndefined();
  });
  it('a part for a year opens on that year: on today inside it, on January 1 otherwise', () => {
    expect(opensOn({ year: 2027 }, '2026-11-24')).toEqual({ span: 'year', date: '2027-01-01' });
    expect(opensOn({ year: 2027 }, '2027-06-09')).toEqual({ span: 'year', date: '2027-06-09' });
    expect(opensOn({ year: 2025 }, '2027-06-09')).toEqual({ span: 'year', date: '2025-01-01' });
  });
  it('a part for a month opens on that month, across the turn of the year', () => {
    expect(opensOn({ year: 2027, month: 0 }, '2026-12-28')).toEqual({ span: 'month', date: '2027-01-01' });
    expect(opensOn({ year: 2026, month: 11 }, '2027-01-03')).toEqual({ span: 'month', date: '2026-12-01' });
    expect(opensOn({ year: 2027, month: 0 }, '2027-01-17')).toEqual({ span: 'month', date: '2027-01-17' });
    // the same month a year later is not that month
    expect(opensOn({ year: 2026, month: 0 }, '2027-01-17')).toEqual({ span: 'month', date: '2026-01-01' });
  });
  it('February in a leap year opens on its own first day', () => {
    expect(opensOn({ year: 2028, month: 1 }, '2027-11-30')).toEqual({ span: 'month', date: '2028-02-01' });
    expect(opensOn({ year: 2028, month: 1 }, '2028-02-29')).toEqual({ span: 'month', date: '2028-02-29' });
  });
  it('a page made for a year pins its parts to the year, a page for a month to the month, others to nothing', () => {
    const when = { year: 2027, month: new Date(2027, 0, 1) };
    expect(pinFor('year', when)).toEqual({ year: 2027 });
    expect(pinFor('month', when)).toEqual({ year: 2027, month: 0 });
    expect(pinFor('month', { year: 2027, month: new Date(2026, 11, 1) })).toEqual({ year: 2026, month: 11 });
    expect(pinFor(undefined, when)).toBeUndefined();
  });
});

describe('the "New month" card on Home', () => {
  it('shows during the first seven days of a month', () => {
    expect(monthToSetUp(d(2026, 12, 1))).toEqual(d(2026, 12, 1));
    expect(monthToSetUp(d(2026, 12, 7))).toEqual(d(2026, 12, 1));
    expect(monthToSetUp(d(2026, 12, 8))).toBeNull();
    expect(monthToSetUp(d(2026, 11, 24))).toBeNull();
  });
  it('on January 1 it is for January of the new year', () => {
    expect(monthToSetUp(d(2027, 1, 1))).toEqual(d(2027, 1, 1));
    expect(monthToSetUp(d(2026, 12, 31))).toBeNull();
  });
  it('can be dismissed for that month, and comes back the next month', () => {
    expect(showsNewMonthCard(d(2026, 12, 3), {})).toBe(true);
    expect(showsNewMonthCard(d(2026, 12, 3), { dismissedMonth: '2026-12' })).toBe(false);
    expect(showsNewMonthCard(d(2027, 1, 2), { dismissedMonth: '2026-12' })).toBe(true);
    expect(showsNewMonthCard(d(2027, 1, 2), { dismissedMonth: '2027-01' })).toBe(false);
  });
  it('can be switched off in Settings', () => {
    expect(showsNewMonthCard(d(2026, 12, 3), { newMonthCard: false })).toBe(false);
    expect(showsNewMonthCard(d(2026, 12, 3), { newMonthCard: true })).toBe(true);
    expect(showsNewMonthCard(d(2026, 12, 20), { newMonthCard: true })).toBe(false);
  });
  it('makes that month\'s cover and its goals page, for the right year', () => {
    expect(planForMonth(d(2027, 1, 1), 'goals')).toEqual([
      { templateId: 'month-jan-cover', year: 2027, month: d(2027, 1, 1) },
      { templateId: 'goals', year: 2027, month: d(2027, 1, 1) },
    ]);
    expect(planForMonth(d(2026, 12, 1), 'goals-month-focus').map((p) => p.templateId)).toEqual(['month-dec-cover', 'goals-month-focus']);
    expect(planForMonth(d(2028, 2, 1), 'goals')[0].templateId).toBe('month-feb-cover');
  });
});
