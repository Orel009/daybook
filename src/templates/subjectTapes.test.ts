import { describe, expect, it } from 'vitest';
import { TAPE_PATTERNS } from '../domain/pages';
import { isThemedTape, TAPE_DEFAULT_COLOR, TAPE_THEMES, tapeImage, THEMED_TAPES } from '../domain/tapes';
import { TAPE_COLORS } from '../domain/types';
import { BUILT_IN_TEMPLATES } from './library';
import { SUBJECT_TAPES, tapesForSubject } from './subjectTapes';
import { TEMPLATE_SUBJECTS } from './subjects';

describe('tapes for every subject', () => {
  it('every subject has at least four tapes that go with it', () => {
    for (const subject of TEMPLATE_SUBJECTS) {
      expect(SUBJECT_TAPES[subject], subject).toBeDefined();
      expect(SUBJECT_TAPES[subject].length, `${subject} has ${SUBJECT_TAPES[subject]?.length} tapes`).toBeGreaterThanOrEqual(4);
    }
    // and there is no line for a subject that doesn't exist
    expect(Object.keys(SUBJECT_TAPES).sort()).toEqual([...TEMPLATE_SUBJECTS].sort());
  });
  it('every tape named there exists, and none is listed twice for a subject', () => {
    for (const subject of TEMPLATE_SUBJECTS) {
      const list = SUBJECT_TAPES[subject];
      expect(new Set(list).size, subject).toBe(list.length);
      for (const id of list) expect(isThemedTape(id), `${subject}: ${id}`).toBe(true);
    }
  });
  it('the subjects named in the brief have the tapes asked for', () => {
    expect(SUBJECT_TAPES.Money).toEqual(expect.arrayContaining(['coins', 'banknotes', 'piggybanks']));
    expect(SUBJECT_TAPES.Study).toEqual(expect.arrayContaining(['pencils', 'paperclips', 'measure']));
    expect(SUBJECT_TAPES.Pets).toEqual(expect.arrayContaining(['paws', 'bones', 'fishes']));
    expect(SUBJECT_TAPES.Sleep).toEqual(expect.arrayContaining(['moons', 'zzz']));
    expect(SUBJECT_TAPES.Kids).toEqual(expect.arrayContaining(['blocks', 'teddies']));
    expect(SUBJECT_TAPES['Sports and fitness']).toEqual(expect.arrayContaining(['dumbbells', 'sneakers']));
    expect(SUBJECT_TAPES.Weather).toEqual(expect.arrayContaining(['suns', 'clouds', 'rainyday', 'snowflakes']));
    expect(SUBJECT_TAPES['Language learning']).toEqual(expect.arrayContaining(['chat', 'alphabet']));
  });
  it('a page without a subject, or with one of her own, has no special tapes', () => {
    expect(tapesForSubject(undefined)).toEqual([]);
    expect(tapesForSubject('My garden notes')).toEqual([]);
    expect(tapesForSubject('Money')).toBe(SUBJECT_TAPES.Money);
  });
});

describe('the tapes themselves', () => {
  it('every themed tape has its own id, a name, a theme that exists and a colour to start in', () => {
    const basic = new Set<string>(TAPE_PATTERNS.map((p) => p.id));
    const themes = new Set<string>(TAPE_THEMES.map((t) => t.id));
    expect(new Set(THEMED_TAPES.map((t) => t.id)).size).toBe(THEMED_TAPES.length);
    for (const t of THEMED_TAPES) {
      expect(basic.has(t.id), `${t.id} is also a plain pattern`).toBe(false);
      expect(t.name.length, t.id).toBeGreaterThan(1);
      expect(themes.has(t.theme), `${t.id}: theme ${t.theme}`).toBe(true);
      expect(TAPE_COLORS[TAPE_DEFAULT_COLOR[t.id]], `${t.id}: colour ${TAPE_DEFAULT_COLOR[t.id]}`).toBeDefined();
      expect(t.w, t.id).toBeGreaterThanOrEqual(20);
    }
    expect(THEMED_TAPES.length).toBeGreaterThanOrEqual(120);
  });
  it('every theme tab has tapes, and every tape draws as a well-formed tile in its starting colour', () => {
    for (const th of TAPE_THEMES) if (th.id !== 'basics') expect(THEMED_TAPES.some((t) => t.theme === th.id), th.id).toBe(true);
    for (const t of THEMED_TAPES) {
      const svg = decodeURIComponent(tapeImage(t.id, TAPE_DEFAULT_COLOR[t.id])!.slice('url("data:image/svg+xml,'.length, -2));
      expect(svg.startsWith('<svg') && svg.endsWith('</svg>'), t.id).toBe(true);
      expect(/\{\w+\}|NaN|undefined/.test(svg), `${t.id}: ${/\{\w+\}|NaN|undefined/.exec(svg)?.[0]}`).toBe(false);
      // every tag closes: the same number of opening and closing angle brackets, and balanced groups
      expect((svg.match(/<g[\s>]/g) ?? []).length, t.id).toBe((svg.match(/<\/g>/g) ?? []).length);
      expect((svg.match(/<text[\s>]/g) ?? []).length, t.id).toBe((svg.match(/<\/text>/g) ?? []).length);
    }
  });
  it('templates use the tapes of their own subject where they use a themed tape at all (months and seasons aside)', () => {
    const ctx = { today: new Date(2026, 5, 15), weekStartsOn: 0, tracker: () => '', trackerIds: [], year: 2026, month: new Date(2026, 5, 1) };
    let matching = 0;
    for (const t of BUILT_IN_TEMPLATES) {
      for (const el of t.build(ctx).elements) {
        if (el.type === 'tape' && isThemedTape(el.pattern) && SUBJECT_TAPES[t.subject].includes(el.pattern as (typeof SUBJECT_TAPES)[typeof t.subject][number])) matching++;
      }
    }
    expect(matching).toBeGreaterThanOrEqual(40);
  });
});
