import { describe, expect, it } from 'vitest';
import { assetIdsOf, blankPage, CHALLENGE_PRESETS, isFillable, newChallenge, newFrame, PAGE_DIMS } from './pages';

describe('photo slots and challenges', () => {
  const p = blankPage('x', 'portrait', 1);
  it('an empty slot is tappable when viewing; a filled one is not', () => {
    const frame = newFrame(p);
    expect(isFillable(frame)).toBe(true);
    expect(isFillable({ ...frame, assetId: 'a1' })).toBe(false);
  });
  it('a slot\'s photo counts as used, so it is kept and synced', () => {
    const withPhoto = { ...p, elements: [{ ...newFrame(p), assetId: 'a1' }, newFrame(p)] };
    expect(assetIdsOf(withPhoto)).toEqual(['a1']);
  });
  it('there are at least 8 challenge formats besides bingo, each on the page and counting progress', () => {
    expect(CHALLENGE_PRESETS.length).toBeGreaterThanOrEqual(8);
    const looks = new Set<string>();
    for (const preset of CHALLENGE_PRESETS) {
      for (const size of ['portrait', 'landscape'] as const) {
        const el = newChallenge(blankPage('x', size, 1), preset.id);
        expect(el.type).toBe('tiles');
        expect(el.count, preset.id).toBe(true);
        expect(el.tiles.length, preset.id).toBeGreaterThan(0);
        expect(el.x >= 0 && el.y >= 0 && el.x + el.w <= PAGE_DIMS[size].w && el.y + el.h <= PAGE_DIMS[size].h, `${preset.id} ${size}`).toBe(true);
        looks.add(`${el.layout ?? 'grid'}/${el.shape ?? 'square'}`);
      }
    }
    expect(looks.size).toBe(CHALLENGE_PRESETS.length);
  });
});
