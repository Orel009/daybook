import { describe, expect, it } from 'vitest';
import { PRESETS } from '../data/defaults';
import { defaultMonth, defaultYear, EVERYTHING, MONTH_GOAL_STYLES, planForMonth, planForYear, YEAR_GOAL_STYLES } from '../domain/newYear';
import { isCurved, linePoints, type Pt } from '../domain/line';
import { PAGE_DIMS, type LineElement, type PageElement, type ShapeElement, type WritingElement } from '../domain/pages';
import { circleOf } from '../domain/shapes';
import { monthDate, type TemplateContext } from './kit';
import { BUILT_IN_TEMPLATES, buildTemplatePage } from './library';
import { findTemplates, matchesQuery, subjectsOf } from './search';
import { TEMPLATE_COUNT, TEMPLATE_GROUPS, TEMPLATE_SUBJECTS } from './subjects';
import { monthOfTemplate } from './subjects/months';

const ctx = (today: Date, weekStartsOn = 0, year = defaultYear(today), month = defaultMonth(today)): TemplateContext => ({ today, weekStartsOn, tracker: () => '', trackerIds: [], year, month });
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

// ----- the drawn templates: mind maps and circles of control

const page = (id: string) => buildTemplatePage(BUILT_IN_TEMPLATES.find((t) => t.id === id)!, ctx(new Date(2026, 10, 23)));
const ofType = <T extends PageElement['type']>(els: PageElement[], type: T) => els.filter((e): e is Extract<PageElement, { type: T }> => e.type === type);
/** How many whole lines a writing area has to write on: 44 a line, under its heading, inside its border. */
const rowsOf = (w: WritingElement) => Math.floor((w.h - 4 - (w.title ? 56 : 0)) / 44);
const corners = (r: { x: number; y: number; w: number; h: number }): Pt[] => [
  { x: r.x, y: r.y },
  { x: r.x + r.w, y: r.y },
  { x: r.x, y: r.y + r.h },
  { x: r.x + r.w, y: r.y + r.h },
];
/** How far a point is from a box (0 inside it). */
const awayFrom = (p: Pt, r: { x: number; y: number; w: number; h: number }) => Math.hypot(Math.max(r.x - p.x, 0, p.x - r.x - r.w), Math.max(r.y - p.y, 0, p.y - r.y - r.h));

describe('mind maps', () => {
  for (const [id, count] of [['study-mind-map', 6], ['study-mind-map-dump', 8]] as const) {
    it(`${id}: ${count} branches, each joined to the shape in the middle by its own curved line`, () => {
      const els = page(id).elements;
      const shapes = ofType(els, 'shape');
      const branches = ofType(els, 'writing');
      const joins = ofType(els, 'line');
      expect(shapes.length).toBe(1);
      expect(branches.length).toBe(count);
      expect(joins.length).toBe(count);
      const middle = shapes[0];
      // the lines lie behind the shape and the branches, so the joins look clean
      expect(Math.max(...joins.map((l) => els.indexOf(l)))).toBeLessThan(els.indexOf(middle));
      const joined = new Set<string>();
      for (const l of joins) {
        const { a, b } = linePoints(l);
        expect(isCurved(l), 'curved').toBe(true);
        // starts on the edge of the shape in the middle (1 is exactly on the edge of its oval)
        const k = Math.hypot((a.x - (middle.x + middle.w / 2)) / (middle.w / 2), (a.y - (middle.y + middle.h / 2)) / (middle.h / 2));
        expect(k, `${id}: a line starts ${k} of the way out`).toBeGreaterThan(0.8);
        expect(k).toBeLessThanOrEqual(1.01);
        // ends just outside exactly one branch
        const touched = branches.filter((w) => awayFrom(b, w) <= 8);
        expect(touched.length, `${id}: a line ends at ${b.x}, ${b.y}`).toBe(1);
        expect(awayFrom(b, touched[0])).toBeGreaterThan(0);
        joined.add(touched[0].id);
      }
      expect(joined.size).toBe(count);
      // a few lines to write on in every branch, and no branch over another or over the middle
      for (const w of branches) {
        expect(w.lined).toBe(true);
        expect(rowsOf(w), `${id}: rows in a branch`).toBeGreaterThanOrEqual(3);
        for (const other of [...branches.filter((o) => o !== w), middle]) {
          const apart = w.x + w.w <= other.x || other.x + other.w <= w.x || w.y + w.h <= other.y || other.y + other.h <= w.y;
          expect(apart, `${id}: a branch overlaps`).toBe(true);
        }
      }
    });
  }
  it('the main idea sits in a circle, the brain dump in a cloud', () => {
    expect(ofType(page('study-mind-map').elements, 'shape')[0].shape).toBe('circle');
    expect(ofType(page('study-mind-map-dump').elements, 'shape')[0].shape).toBe('cloud');
  });
  it('a line made for a template has no stray fields', () => {
    const l: LineElement = ofType(page('study-mind-map').elements, 'line')[0];
    expect(Object.values(l).every((v) => v !== undefined)).toBe(true);
  });
});

describe('circles of control', () => {
  const rings = (els: PageElement[]) => ofType(els, 'shape').sort((a, b) => b.w - a.w);
  const inside = (p: Pt, c: ShapeElement, margin: number) => Math.hypot(p.x - circleOf(c).cx, p.y - circleOf(c).cy) <= circleOf(c).r - margin;
  for (const [id, names] of [
    ['mind-control', ['Out of my hands', 'I can influence', 'In my control']],
    ['mind-control-two', ['Out of my hands', 'In my control']],
  ] as const) {
    it(`${id}: ${names.length} circles inside each other, each ring named and with lines that fit in it`, () => {
      const els = page(id).elements;
      const circles = rings(els);
      expect(circles.map((c) => c.shape)).toEqual(names.map(() => 'circle'));
      // each circle lies wholly inside the one before, and is drawn after it
      for (let i = 1; i < circles.length; i++) {
        const out = circleOf(circles[i - 1]);
        const inn = circleOf(circles[i]);
        expect(Math.hypot(inn.cx - out.cx, inn.cy - out.cy) + inn.r).toBeLessThan(out.r);
        expect(els.indexOf(circles[i])).toBeGreaterThan(els.indexOf(circles[i - 1]));
      }
      const areas = ofType(els, 'writing').filter((w) => w.bare);
      expect(areas.length).toBe(names.length);
      const labels = ofType(els, 'text').filter((t) => (names as readonly string[]).includes(t.text));
      expect(labels.map((t) => t.text)).toEqual([...names]);
      areas.forEach((w, i) => {
        expect(Math.floor((w.h - 4) / 44), `${id}: rows in ring ${i}`).toBeGreaterThanOrEqual(3);
        expect(w.lined).toBe(true);
        // the whole writing area is inside its own circle (clear of the line) and outside the next one in
        for (const p of corners(w)) {
          expect(inside(p, circles[i], 3), `${id}: ring ${i} corner ${p.x}, ${p.y} is inside its circle`).toBe(true);
          if (circles[i + 1]) expect(inside(p, circles[i + 1], -2), `${id}: ring ${i} corner ${p.x}, ${p.y} is clear of the next circle`).toBe(false);
        }
        // and so is its name, above it (a letter of the handwritten lettering is about 0.58 of its size wide)
        const t = labels[i];
        const half = (t.text.length * t.size * 0.58) / 2;
        const box = { x: t.x + t.w / 2 - half, y: t.y + t.size * 0.2, w: half * 2, h: t.size };
        expect(box.y + box.h).toBeLessThanOrEqual(w.y);
        for (const p of corners(box)) {
          expect(inside(p, circles[i], 3), `${id}: the name of ring ${i} at ${p.x}, ${p.y}`).toBe(true);
          if (circles[i + 1]) expect(inside(p, circles[i + 1], -2)).toBe(false);
        }
      });
      // drawn above the circles, so the writing is never hidden
      expect(Math.min(...areas.map((w) => els.indexOf(w)))).toBeGreaterThan(Math.max(...circles.map((c) => els.indexOf(c))));
    });
  }
  it('both keep a place for where the energy goes and what to let go of', () => {
    const heads = (id: string) => ofType(page(id).elements, 'writing').filter((w) => !w.bare).map((w) => w.title);
    expect(heads('mind-control')).toEqual(['Where I will put my energy', 'What I am letting go of']);
    expect(heads('mind-control-two')).toEqual(['My energy goes to', 'I am letting go of']);
  });
});

// ----- pages for a year or a month

describe('templates that show a year or a month', () => {
  const today = new Date(2026, 5, 15);
  const texts = (els: PageElement[]) => els.flatMap((e) => [e.type === 'text' ? e.text : '', 'title' in e && typeof e.title === 'string' ? e.title : '']).join(' | ');
  it('a template that asks for a year writes that year on its page, and its page title says it', () => {
    const asking = BUILT_IN_TEMPLATES.filter((t) => t.asks === 'year');
    expect(asking.length).toBeGreaterThanOrEqual(15);
    for (const t of asking) {
      const made = buildTemplatePage(t, ctx(today, 0, 2031));
      const shown = made.elements.some((e) => e.type === 'month' && e.year === 2031) || texts(made.elements).includes('2031');
      expect(shown, `${t.name} shows 2031`).toBe(true);
      expect(made.title, t.name).toBe(`${t.name} 2031`);
      expect(texts(made.elements).includes('2026'), `${t.name} does not also show this year`).toBe(false);
    }
  });
  it('no other template writes a year it was not asked for (months keep their own rule)', () => {
    for (const t of BUILT_IN_TEMPLATES.filter((x) => !x.asks && x.subject !== 'Months')) {
      const made = buildTemplatePage(t, ctx(today, 0, 2031));
      expect(texts(made.elements).includes('2031'), t.name).toBe(false);
      expect(/\b20[2-9]\d\b/.test(texts(made.elements)), `${t.name} writes a year without asking`).toBe(false);
      expect(made.title).toBe(t.name);
    }
  });
  it('a template that asks for a month writes that month, in the year it falls in', () => {
    const asking = BUILT_IN_TEMPLATES.filter((t) => t.asks === 'month');
    expect(asking.map((t) => t.id).sort()).toEqual(['bills', 'budget', 'goals', 'goals-month-focus', 'goals-month-weeks', 'no-spend', 'spending']);
    for (const t of asking) {
      const january = buildTemplatePage(t, ctx(new Date(2026, 11, 28), 0, 2027, new Date(2027, 0, 1)));
      // a month written in a heading, or a month part showing it
      expect(texts(january.elements).includes('January') || january.elements.some((e) => e.type === 'month' && e.year === 2027 && e.month === 0), t.name).toBe(true);
      expect(texts(january.elements).includes('December'), t.name).toBe(false);
      expect(january.elements.some((e) => e.type === 'month' && !(e.year === 2027 && e.month === 0)), `${t.name}: no month part for another month`).toBe(false);
      expect(january.title, t.name).toBe(`${t.name}: January 2027`);
    }
  });
  it('the usual year is this year, or next year from November 1', () => {
    const bingo = BUILT_IN_TEMPLATES.find((t) => t.id === 'year-bingo')!;
    expect(texts(buildTemplatePage(bingo, ctx(new Date(2026, 9, 31))).elements)).toContain('2026 Bingo');
    expect(texts(buildTemplatePage(bingo, ctx(new Date(2026, 10, 1))).elements)).toContain('2027 Bingo');
    expect(texts(buildTemplatePage(bingo, ctx(new Date(2027, 0, 1))).elements)).toContain('2027 Bingo');
  });
  it('the year at a glance has twelve small months of that year, in order, leap year or not', () => {
    const glance = BUILT_IN_TEMPLATES.find((t) => t.id === 'year-glance')!;
    for (const year of [2027, 2028]) {
      const months = ofType(buildTemplatePage(glance, ctx(today, 0, year)).elements, 'month');
      expect(months.map((m) => m.month)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
      expect(months.every((m) => m.year === year && m.mini === true)).toBe(true);
      // none over another, all on the sheet
      for (const a of months) for (const b of months) if (a !== b) expect(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y).toBe(true);
    }
  });
  it('there are three styles of yearly goals and three of monthly goals, and "Set up" knows them all', () => {
    for (const s of [...YEAR_GOAL_STYLES, ...MONTH_GOAL_STYLES]) expect(BUILT_IN_TEMPLATES.some((t) => t.id === s.id), s.id).toBe(true);
    expect(YEAR_GOAL_STYLES.every((s) => BUILT_IN_TEMPLATES.find((t) => t.id === s.id)!.asks === 'year')).toBe(true);
    expect(MONTH_GOAL_STYLES.every((s) => BUILT_IN_TEMPLATES.find((t) => t.id === s.id)!.asks === 'month')).toBe(true);
  });
  it('everything "Set up <year>" and the new month card make exists, and is made for the right year and month', () => {
    const made = [...planForYear(2028, EVERYTHING), ...planForMonth(new Date(2028, 1, 1), 'goals-month-weeks')].map((p) => {
      const t = BUILT_IN_TEMPLATES.find((x) => x.id === p.templateId);
      expect(t, p.templateId).toBeDefined();
      return buildTemplatePage(t!, ctx(new Date(2027, 11, 20), 0, p.year, p.month ?? new Date(p.year, 0, 1)));
    });
    expect(made.length).toBe(20);
    expect(made[0].title).toBe('Year divider 2028');
    expect(made[5].title).toBe('Mood, year in pixels 2028');
    expect(made.slice(6, 18).map((p) => p.title)).toEqual(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m) => `Monthly goals: ${m} 2028`));
    expect(made[19].title).toBe('Monthly goals, week by week: February 2028');
  });
  it('a page made for a year or a month pins every tracker part on it to that period', () => {
    let pinned = 0;
    for (const t of BUILT_IN_TEMPLATES.filter((x) => x.asks)) {
      const made = buildTemplatePage(t, { ...ctx(today, 0, 2027, new Date(2027, 2, 1)), tracker: (name) => `id-${name}`, trackerIds: ['a', 'b', 'c'] });
      for (const part of ofType(made.elements, 'tracker')) {
        pinned++;
        expect(part.year, t.name).toBe(2027);
        expect(part.month, t.name).toBe(t.asks === 'year' ? undefined : 2);
      }
    }
    // the year in pixels pages: Mood, Weather and the two temperature blankets
    expect(pinned).toBeGreaterThanOrEqual(4);
  });
  it('"Weather this month" is for the month it is made in: its tracker opens on that month', () => {
    const t = BUILT_IN_TEMPLATES.find((x) => x.id === 'weather-month')!;
    const [part] = ofType(buildTemplatePage(t, ctx(new Date(2026, 10, 24))).elements, 'tracker');
    expect([part.year, part.month]).toEqual([2026, 10]);
  });
  it('no other template pins its tracker parts: they follow today, as they always have', () => {
    for (const t of BUILT_IN_TEMPLATES.filter((x) => !x.asks && x.id !== 'weather-month')) {
      for (const part of ofType(buildTemplatePage(t, { ...ctx(today), tracker: (name) => `id-${name}`, trackerIds: ['a', 'b', 'c'] }).elements, 'tracker')) {
        expect('year' in part || 'month' in part, t.name).toBe(false);
      }
    }
  });
  it('a page made from a template remembers its subject', () => {
    for (const t of BUILT_IN_TEMPLATES.slice(0, 40)) expect(buildTemplatePage(t, ctx(today)).subject).toBe(t.subject);
  });
});
