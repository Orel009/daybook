import { describe, expect, it } from 'vitest';
import { TAPE_PATTERNS } from './pages';
import { isThemedTape, isWordTape, TAPE_DEFAULT_COLOR, tapeColorFor, tapeImage, TAPE_THEMES, THEMED_TAPES, withRecent } from './tapes';
import { TAPE_COLORS } from './types';

const svgOf = (image: string) => decodeURIComponent(image.slice('url("data:image/svg+xml,'.length, -2));

describe('themed tapes', () => {
  it('have their own ids: none repeats, none is the id of a plain pattern', () => {
    const ids = THEMED_TAPES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    const plain = new Set<string>(TAPE_PATTERNS.map((t) => t.id));
    expect(ids.filter((id) => plain.has(id))).toEqual([]);
  });
  it('there are at least 40, each in a theme that has a tab', () => {
    expect(THEMED_TAPES.length).toBeGreaterThanOrEqual(40);
    const themes = new Set<string>(TAPE_THEMES.map((t) => t.id));
    for (const t of THEMED_TAPES) expect(themes.has(t.theme), t.id).toBe(true);
    // every tab except Basics (the plain patterns) has tapes in it
    for (const theme of TAPE_THEMES) if (theme.id !== 'basics') expect(THEMED_TAPES.some((t) => t.theme === theme.id), theme.id).toBe(true);
  });
  it('every tape draws a tile with no colour left unresolved', () => {
    for (const t of THEMED_TAPES) {
      const image = tapeImage(t.id, 'rose');
      expect(image, t.id).toMatch(/^url\("data:image\/svg\+xml,/);
      const svg = svgOf(image!);
      expect(svg, t.id).toContain(`viewBox="0 0 ${t.w} 40"`);
      expect(svg, t.id).not.toMatch(/[{}]/);
      expect(svg, t.id).not.toContain('undefined');
      expect(svg, t.id).not.toContain('NaN');
      expect(svg.length, t.id).toBeGreaterThan(150);
    }
  });
  it('leaves the plain patterns to the stylesheet', () => {
    for (const t of TAPE_PATTERNS) {
      expect(isThemedTape(t.id)).toBe(false);
      expect(tapeImage(t.id, 'rose')).toBeUndefined();
    }
  });
  it('a motif in the tape\'s own colour turns cream so it still shows', () => {
    const onRose = svgOf(tapeImage('sweethearts', 'rose')!);
    const onSky = svgOf(tapeImage('sweethearts', 'sky')!);
    expect(onSky).toContain(TAPE_COLORS.rose);
    expect(onRose).not.toContain(`fill="${TAPE_COLORS.rose}"`);
    expect(onRose).toContain('#FFFDF9');
  });
});

describe('default colours', () => {
  it('every themed tape has one, and it is a tape colour', () => {
    for (const t of THEMED_TAPES) expect(TAPE_COLORS[TAPE_DEFAULT_COLOR[t.id]], t.id).toMatch(/^#/);
    expect(Object.keys(TAPE_DEFAULT_COLOR).length).toBe(THEMED_TAPES.length);
  });
  it('kraft is brown, foil is gold, newspaper is grey', () => {
    expect(tapeColorFor('kraft', 'rose')).toBe('tan');
    expect(tapeColorFor('foil', 'rose')).toBe('butter');
    expect(tapeColorFor('newspaper', 'rose')).toBe('grey');
    expect(tapeColorFor('measure', 'rose')).toBe('butter');
  });
  it('a plain pattern keeps the colour the tape has', () => {
    expect(tapeColorFor('stripes', 'mint')).toBe('mint');
    expect(tapeColorFor('dots', 'sky')).toBe('sky');
  });
  it('no default hides the main motif of a tape by turning it cream', () => {
    // the bees stay yellow, the lemons stay yellow, the hearts stay pink
    for (const [tape, motif] of [['bees', 'butter'], ['lemons', 'butter'], ['sweethearts', 'rose'], ['strawberries', 'red'], ['pumpkins', 'orange']] as const) {
      expect(TAPE_DEFAULT_COLOR[tape], tape).not.toBe(motif);
    }
  });
});

describe('word tapes', () => {
  it('are the tapes in the Words theme', () => {
    expect(isWordTape('word-hello')).toBe(true);
    expect(isWordTape('word-november')).toBe(true);
    expect(isWordTape('lemons')).toBe(false);
    expect(isWordTape('stripes')).toBe(false);
    expect(THEMED_TAPES.filter((t) => isWordTape(t.id)).length).toBe(17);
  });
  it('the word starts at the start of the tile and is pinned to a width inside it', () => {
    for (const t of THEMED_TAPES.filter((x) => isWordTape(x.id))) {
      const svg = svgOf(tapeImage(t.id, 'rose')!);
      const m = /<text x="(\d+)"[^>]*textLength="(\d+)"/.exec(svg);
      expect(m, t.id).not.toBeNull();
      expect(Number(m![1]), t.id).toBeLessThanOrEqual(8);
      expect(Number(m![1]) + Number(m![2]), t.id).toBeLessThan(t.w - 20);
    }
  });
});

describe('recently used tapes', () => {
  it('puts the newest first, without repeats, at most eight', () => {
    expect(withRecent(['dots', 'lemons'], 'cats')).toEqual(['cats', 'dots', 'lemons']);
    expect(withRecent(['dots', 'lemons', 'cats'], 'lemons')).toEqual(['lemons', 'dots', 'cats']);
    expect(withRecent(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], 'z')).toEqual(['z', 'a', 'b', 'c', 'd', 'e', 'f', 'g']);
  });
});
