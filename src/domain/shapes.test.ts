import { describe, expect, it } from 'vitest';
import { SHAPES } from './pages';
import { circleOf, shapeFill, shapePath, shapeWeight, SHAPE_WEIGHT } from './shapes';

/** Every point a path goes to (and, for curves, steers by), read from its text. */
function pathPoints(d: string): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (const [, cmd, rest] of d.matchAll(/([MLCQAZ])([^MLCQAZ]*)/g)) {
    const nums = rest.trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (cmd === 'A') pts.push({ x: nums[5], y: nums[6] });
    else for (let i = 0; i + 1 < nums.length; i += 2) pts.push({ x: nums[i], y: nums[i + 1] });
  }
  return pts;
}

describe('shape outlines', () => {
  it('there are six shapes and each has an outline that closes', () => {
    expect(SHAPES.map((s) => s.id)).toEqual(['circle', 'ellipse', 'rounded', 'cloud', 'heart', 'speech']);
    for (const s of SHAPES) {
      const d = shapePath(s.id, 300, 200);
      expect(d.startsWith('M'), s.id).toBe(true);
      expect(d.endsWith('Z'), s.id).toBe(true);
      expect(d.includes('NaN'), s.id).toBe(false);
    }
  });
  it('every outline stays inside its box, whatever the size and thickness', () => {
    for (const s of SHAPES) {
      for (const [w, h, weight] of [[300, 300, 4], [520, 180, 4], [140, 420, 10], [60, 60, 2]]) {
        const pts = pathPoints(shapePath(s.id, w, h, weight));
        expect(pts.length, s.id).toBeGreaterThan(1);
        for (const p of pts) {
          expect(p.x >= weight / 2 - 0.06 && p.x <= w - weight / 2 + 0.06, `${s.id} ${w}x${h}: x ${p.x}`).toBe(true);
          expect(p.y >= weight / 2 - 0.06 && p.y <= h - weight / 2 + 0.06, `${s.id} ${w}x${h}: y ${p.y}`).toBe(true);
        }
      }
    }
  });
  it('the outlines reach the edges of the box, so a shape is as big as it is drawn', () => {
    for (const s of SHAPES) {
      // ovals are checked below by their radii; a cloud's bumps reach the edge between the points the path names
      if (s.id === 'circle' || s.id === 'ellipse' || s.id === 'cloud') continue;
      const pts = pathPoints(shapePath(s.id, 400, 300, 4));
      expect(Math.min(...pts.map((p) => p.x)), s.id).toBeCloseTo(2, 0);
      expect(Math.max(...pts.map((p) => p.x)), s.id).toBeCloseTo(398, 0);
      expect(Math.min(...pts.map((p) => p.y)), s.id).toBeCloseTo(2, 0);
      expect(Math.max(...pts.map((p) => p.y)), s.id).toBeCloseTo(298, 0);
    }
  });
  it('a circle stays round in a box that is not square, in the middle of it', () => {
    expect(shapePath('circle', 400, 200, 4)).toBe('M102 100 A98 98 0 1 1 298 100 A98 98 0 1 1 102 100 Z');
    expect(shapePath('ellipse', 400, 200, 4)).toBe('M2 100 A198 98 0 1 1 398 100 A198 98 0 1 1 2 100 Z');
    expect(circleOf({ x: 60, y: 170, w: 780, h: 780 })).toEqual({ cx: 450, cy: 560, r: 390 });
    expect(circleOf({ x: 0, y: 0, w: 400, h: 200 })).toEqual({ cx: 200, cy: 100, r: 100 });
  });
  it('a cloud has eight bumps and a heart is the same on both sides', () => {
    expect(shapePath('cloud', 380, 260).match(/A/g)?.length).toBe(8);
    const pts = pathPoints(shapePath('heart', 300, 280, 4));
    const xs = pts.map((p) => Math.round(p.x * 10) / 10).sort((a, b) => a - b);
    for (let i = 0; i < xs.length; i++) expect(xs[i] + xs[xs.length - 1 - i]).toBeCloseTo(300, 0);
  });
  it('the tail of a speech bubble comes down below the bubble, at the left', () => {
    const pts = pathPoints(shapePath('speech', 380, 280, 4));
    const lowest = pts.reduce((a, b) => (b.y > a.y ? b : a));
    expect(lowest.y).toBe(278);
    expect(lowest.x).toBeLessThan(190);
    expect(pts.filter((p) => p.y === 278).length).toBe(1);
  });
});

describe('shape colours', () => {
  it('the fill is a soft tint: a dark colour mixed into paper cream', () => {
    expect(shapeFill('#3A2B47')).toBe('#DCD7D9');
    expect(shapeFill('#2F7A4D')).toBe('#DAE5DA');
    expect(shapeFill('#000000')).toBe('#D1CFCC');
  });
  it('a light colour (white on a dark page) becomes a see-through veil instead', () => {
    expect(shapeFill('#FFFFFF')).toBe('rgb(255 255 255 / 0.22)');
  });
  it('the outline is 4 thick unless another thickness is set', () => {
    expect(shapeWeight({})).toBe(SHAPE_WEIGHT);
    expect(shapeWeight({ weight: 9 })).toBe(9);
  });
});
