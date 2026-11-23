import { describe, expect, it } from 'vitest';
import { assetIdsOf, blankPage, isFillable, newFrame } from './pages';

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
});
