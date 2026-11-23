import { describe, expect, it } from 'vitest';
import { PRESETS } from '../data/defaults';
import { PAGE_DIMS } from '../domain/pages';
import { monthDate, type TemplateContext } from './kit';
import { BUILT_IN_TEMPLATES, buildTemplatePage } from './library';
import { findTemplates, matchesQuery, subjectsOf } from './search';
import { TEMPLATE_COUNT, TEMPLATE_GROUPS, TEMPLATE_SUBJECTS } from './subjects';
import { monthOfTemplate } from './subjects/months';

const ctx = (today: Date, weekStartsOn = 0): TemplateContext => ({ today, weekStartsOn, tracker: () => '', trackerIds: [] });
const names = (sections: { templates: { name: string }[] }[]) => sections.flatMap((s) => s.templates.map((t) => t.name));

describe('the template library', () => {
  it(`has ${TEMPLATE_COUNT} templates, each with its own id and name`, () => {
    expect(BUILT_IN_TEMPLATES.length).toBe(TEMPLATE_COUNT);
    expect(BUILT_IN_TEMPLATES.length).toBeGreaterThanOrEqual(250);
    expect(new Set(BUILT_IN_TEMPLATES.map((t) => t.id)).size).toBe(TEMPLATE_COUNT);
    expect(new Set(BUILT_IN_TEMPLATES.map((t) => t.name)).size).toBe(TEMPLATE_COUNT);
  });
  it('every subject has at least two templates, and every template has a known subject', () => {
    const count = new Map<string, number>();
    for (const t of BUILT_IN_TEMPLATES) count.set(t.subject, (count.get(t.subject) ?? 0) + 1);
    for (const subject of TEMPLATE_SUBJECTS) expect(count.get(subject) ?? 0, subject).toBeGreaterThanOrEqual(2);
    expect([...count.keys()].filter((s) => !(TEMPLATE_SUBJECTS as readonly string[]).includes(s))).toEqual([]);
  });
  it('every subject is in exactly one group', () => {
    const grouped = TEMPLATE_GROUPS.flatMap((g) => g.subjects);
    expect([...grouped].sort()).toEqual([...TEMPLATE_SUBJECTS].sort());
    expect(new Set(grouped).size).toBe(grouped.length);
  });
  it('every tracker a template needs is a preset', () => {
    const presets = new Set(PRESETS.map((p) => p.name));
    for (const t of BUILT_IN_TEMPLATES) for (const need of t.needs ?? []) expect(presets.has(need), `${t.name} needs ${need}`).toBe(true);
    expect(presets.has('Language practice')).toBe(true);
  });
  it('every template builds a page with its parts on the sheet, for a week starting on Sunday or Monday', () => {
    for (const weekStartsOn of [0, 1]) {
      for (const t of BUILT_IN_TEMPLATES) {
        const page = buildTemplatePage(t, ctx(new Date(2026, 10, 23), weekStartsOn));
        const { w, h } = PAGE_DIMS[t.size];
        expect(page.elements.length, t.name).toBeGreaterThan(0);
        for (const el of page.elements) {
          // bands of colour and tape may run to the edge and a little past it; everything else stays on the sheet
          const slack = el.type === 'tape' || (el.type === 'box' && el.border === 'none') ? 24 : 0;
          expect(el.x >= -slack && el.y >= -slack && el.x + el.w <= w + slack, `${t.name}: ${el.type} at x ${el.x}, y ${el.y}, w ${el.w}`).toBe(true);
          if (el.type !== 'text' && el.type !== 'checklist' && el.type !== 'tracker') expect(el.y + el.h <= h + slack, `${t.name}: ${el.type} ends at ${el.y + el.h}`).toBe(true);
        }
        expect(new Set(page.elements.map((e) => e.id)).size, t.name).toBe(page.elements.length);
      }
    }
  });
});

describe('month templates', () => {
  const monthTemplates = BUILT_IN_TEMPLATES.filter((t) => t.subject === 'Months');
  it('there are at least two for each of the twelve months', () => {
    for (let m = 0; m < 12; m++) expect(monthTemplates.filter((t) => monthOfTemplate(t.id) === m).length, `month ${m}`).toBeGreaterThanOrEqual(2);
    expect(monthTemplates.every((t) => monthOfTemplate(t.id) >= 0)).toBe(true);
  });
  it('a month that has not passed is this year, one that has passed is next year', () => {
    const nov23 = new Date(2026, 10, 23);
    expect(monthDate(nov23, 10)).toEqual(new Date(2026, 10, 1)); // November: the current month counts
    expect(monthDate(nov23, 11)).toEqual(new Date(2026, 11, 1));
    expect(monthDate(nov23, 0)).toEqual(new Date(2027, 0, 1));
    expect(monthDate(nov23, 9)).toEqual(new Date(2027, 9, 1));
    expect(monthDate(new Date(2026, 0, 1), 0)).toEqual(new Date(2026, 0, 1));
    expect(monthDate(new Date(2026, 11, 31), 11)).toEqual(new Date(2026, 11, 1));
    expect(monthDate(new Date(2026, 11, 31), 0)).toEqual(new Date(2027, 0, 1));
  });
  it('every template with a month part shows its own month, in the right year', () => {
    for (const today of [new Date(2026, 10, 23), new Date(2026, 0, 5), new Date(2026, 5, 30), new Date(2026, 11, 31)]) {
      let withMonth = 0;
      for (const t of monthTemplates) {
        const m = monthOfTemplate(t.id);
        for (const el of buildTemplatePage(t, ctx(today)).elements) {
          if (el.type !== 'month') continue;
          withMonth++;
          expect(el.month, t.name).toBe(m);
          expect(el.year, `${t.name} seen on ${today.toDateString()}`).toBe(today.getFullYear() + (m < today.getMonth() ? 1 : 0));
        }
      }
      expect(withMonth).toBe(12);
    }
  });
  it('the cover says the same year as the calendar', () => {
    const today = new Date(2026, 10, 23);
    const cover = buildTemplatePage(monthTemplates.find((t) => t.id === 'month-mar-cover')!, ctx(today));
    expect(cover.elements.some((e) => e.type === 'text' && e.text === '2027')).toBe(true);
    const dec = buildTemplatePage(monthTemplates.find((t) => t.id === 'month-dec-cover')!, ctx(today));
    expect(dec.elements.some((e) => e.type === 'text' && e.text === '2026')).toBe(true);
  });
});

describe('searching the Templates screen', () => {
  const all = BUILT_IN_TEMPLATES;
  it('finds a template by its name', () => {
    expect(names(findTemplates(all, { query: 'Watchlist' }))).toEqual(['Watchlist']);
    expect(names(findTemplates(all, { query: '  watchLIST ' }))).toEqual(['Watchlist']);
  });
  it('finds a template by a word in its description', () => {
    expect(names(findTemplates(all, { query: 'cards to send' }))).toEqual(['Birthday gift list']);
  });
  it('finds a whole subject by its name', () => {
    const found = findTemplates(all, { query: 'temperature' });
    expect(found.map((s) => s.subject)).toContain('Temperature');
    expect(found.find((s) => s.subject === 'Temperature')?.templates.length).toBe(3);
  });
  it('finds nothing for a word that is nowhere', () => {
    expect(findTemplates(all, { query: 'zzqxw' })).toEqual([]);
    expect(matchesQuery('zzqxw', 'Watchlist', 'Films to see')).toBe(false);
  });
  it('an empty search shows everything again', () => {
    expect(names(findTemplates(all, {})).length).toBe(TEMPLATE_COUNT);
    expect(names(findTemplates(all, { query: '   ', group: 'All', subject: 'All' })).length).toBe(TEMPLATE_COUNT);
  });
  it('a group shows only its own subjects, in the group\'s order', () => {
    const challenges = findTemplates(all, { group: 'Challenges' });
    expect(challenges.map((s) => s.subject)).toEqual(['Challenges', 'Yearly bingo', 'Book bingo', 'Alphabet challenge', 'Movie challenge']);
    expect(subjectsOf('Months')).toEqual(['Months']);
    expect(names(findTemplates(all, { group: 'Months' })).length).toBe(36);
    expect(findTemplates(all, { group: 'No such group' })).toEqual([]);
  });
  it('a subject narrows it to that subject, and the search still applies', () => {
    expect(findTemplates(all, { group: 'Learn', subject: 'Study' }).map((s) => s.subject)).toEqual(['Study']);
    expect(names(findTemplates(all, { subject: 'Months', query: 'at a glance' })).length).toBe(12);
    expect(names(findTemplates(all, { group: 'Track', query: 'january' }))).toEqual([]);
  });
});
