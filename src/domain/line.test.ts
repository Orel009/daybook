import { describe, expect, it } from 'vitest';
import {
  arrowPaths,
  arrowSize,
  arrowWings,
  bendLine,
  controlPoint,
  flipLine,
  headingAt,
  isCurved,
  lineBounds,
  lineDash,
  lineFrom,
  lineGeometry,
  lineLength,
  linePath,
  linePoints,
  middle,
  moveLinePoint,
  pointAt,
  STRAIGHT_SNAP,
  straightenLine,
} from './line';

const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) <= eps;

describe('where a line is', () => {
  it('stores the box around the two ends, with the ends measured from its corner', () => {
    const g = lineGeometry({ a: { x: 300, y: 500 }, b: { x: 100, y: 420 } });
    expect(g).toMatchObject({ x: 100, y: 420, w: 200, h: 80, ax: 200, ay: 80, bx: 0, by: 0 });
    expect(g.mx).toBeUndefined();
    expect(isCurved(g)).toBe(false);
    expect(linePoints(g)).toEqual({ a: { x: 300, y: 500 }, b: { x: 100, y: 420 }, mid: undefined });
    expect(linePoints(g, true)).toEqual({ a: { x: 200, y: 80 }, b: { x: 0, y: 0 }, mid: undefined });
  });
  it('a level line has a box without height, and still knows its ends', () => {
    const g = lineFrom({ x: 50, y: 200 }, { x: 370, y: 200 });
    expect(g).toMatchObject({ x: 50, y: 200, w: 320, h: 0, ay: 0, by: 0, bx: 320 });
    expect(lineLength(linePoints(g))).toBe(320);
  });
  it('rounds to whole page units', () => {
    const g = lineGeometry({ a: { x: 10.4, y: 20.6 }, b: { x: 99.5, y: 80.2 }, mid: { x: 40.2, y: 90.7 } });
    for (const v of [g.x, g.y, g.w, g.h, g.ax, g.ay, g.bx, g.by, g.mx, g.my]) expect(Number.isInteger(v)).toBe(true);
  });
  it('moving the line changes only x and y', () => {
    const g = lineFrom({ x: 100, y: 100 }, { x: 400, y: 300 }, 0.2);
    const moved = { ...g, x: g.x + 36, y: g.y - 20 };
    const before = linePoints(g);
    const after = linePoints(moved);
    for (const k of ['a', 'b', 'mid'] as const) expect(after[k]).toEqual({ x: before[k]!.x + 36, y: before[k]!.y - 20 });
  });
});

describe('a curved line', () => {
  const l = { a: { x: 100, y: 400 }, b: { x: 500, y: 400 }, mid: { x: 300, y: 300 } };
  it('passes through its middle point halfway, and starts and ends at its ends', () => {
    expect(pointAt(l, 0)).toEqual(l.a);
    expect(pointAt(l, 1)).toEqual(l.b);
    expect(pointAt(l, 0.5)).toEqual(l.mid);
    expect(controlPoint(l)).toEqual({ x: 300, y: 200 });
    expect(middle(l)).toEqual(l.mid);
  });
  it('a straight line has no control point and its middle is halfway between the ends', () => {
    const s = { a: { x: 0, y: 0 }, b: { x: 80, y: 60 } };
    expect(controlPoint(s)).toBeUndefined();
    expect(middle(s)).toEqual({ x: 40, y: 30 });
    expect(lineLength(s)).toBe(100);
  });
  it('is longer than the straight line between its ends, and shorter than going round by the control point', () => {
    const len = lineLength(l);
    expect(len).toBeGreaterThan(400);
    expect(len).toBeLessThan(2 * Math.hypot(200, 200));
  });
  it('its box reaches as far as the curve swings out, not as far as the control point', () => {
    expect(lineBounds(l)).toEqual({ x: 100, y: 300, w: 400, h: 100 });
    // a curve that swings past its end sideways
    const hook = { a: { x: 0, y: 0 }, b: { x: 100, y: 200 }, mid: { x: 120, y: 80 } };
    const box = lineBounds(hook);
    expect(box.x).toBe(0);
    expect(box.x + box.w).toBeGreaterThan(120);
    for (let i = 0; i <= 50; i++) {
      const p = pointAt(hook, i / 50);
      expect(p.x).toBeLessThanOrEqual(box.x + box.w + 1e-9);
      expect(p.y).toBeGreaterThanOrEqual(box.y - 1e-9);
      expect(p.y).toBeLessThanOrEqual(box.y + box.h + 1e-9);
    }
  });
  it('lineFrom bends to the right of the way it is drawn for a positive bend, to the left for a negative one', () => {
    const down = linePoints(lineFrom({ x: 100, y: 300 }, { x: 500, y: 300 }, 0.25));
    expect(down.mid).toEqual({ x: 300, y: 400 });
    const up = linePoints(lineFrom({ x: 100, y: 300 }, { x: 500, y: 300 }, -0.25));
    expect(up.mid).toEqual({ x: 300, y: 200 });
    // drawn the other way round, the same bend swings to the other side of the page
    expect(linePoints(lineFrom({ x: 500, y: 300 }, { x: 100, y: 300 }, 0.25)).mid).toEqual({ x: 300, y: 200 });
  });
});

describe('dragging the handles', () => {
  const straight = lineFrom({ x: 100, y: 300 }, { x: 500, y: 300 });
  it('an end handle moves that end and leaves the other where it was', () => {
    const g = moveLinePoint(straight, 'b', { x: 420, y: 520 });
    expect(linePoints(g)).toEqual({ a: { x: 100, y: 300 }, b: { x: 420, y: 520 }, mid: undefined });
    const h = moveLinePoint(g, 'a', { x: 600, y: 100 });
    expect(linePoints(h)).toEqual({ a: { x: 600, y: 100 }, b: { x: 420, y: 520 }, mid: undefined });
    expect(h).toMatchObject({ x: 420, y: 100, w: 180, h: 420 });
  });
  it('the middle handle bends the line through the point it is dragged to', () => {
    const g = moveLinePoint(straight, 'mid', { x: 310, y: 180 });
    expect(isCurved(g)).toBe(true);
    const l = linePoints(g);
    expect(l.mid).toEqual({ x: 310, y: 180 });
    expect(pointAt(l, 0.5)).toEqual({ x: 310, y: 180 });
    expect(l.a).toEqual({ x: 100, y: 300 });
    expect(l.b).toEqual({ x: 500, y: 300 });
    expect(g).toMatchObject({ x: 100, y: 180, h: 120 });
  });
  it('let go next to the straight line, the line is straight again', () => {
    const bent = moveLinePoint(straight, 'mid', { x: 300, y: 150 });
    expect(isCurved(bent)).toBe(true);
    expect(isCurved(moveLinePoint(bent, 'mid', { x: 300, y: 300 + STRAIGHT_SNAP - 1 }))).toBe(false);
    expect(isCurved(moveLinePoint(bent, 'mid', { x: 300, y: 300 + STRAIGHT_SNAP + 1 }))).toBe(true);
  });
  it('the middle handle stays between the ends', () => {
    const l = linePoints(moveLinePoint(straight, 'mid', { x: 900, y: 200 }));
    expect(l.mid).toEqual({ x: 460, y: 200 }); // at most four tenths of the length from the middle
    expect(linePoints(moveLinePoint(straight, 'mid', { x: -300, y: 200 })).mid).toEqual({ x: 140, y: 200 });
  });
  it('a curve keeps its bend when an end moves: turned and scaled with the line', () => {
    const bent = lineFrom({ x: 100, y: 300 }, { x: 500, y: 300 }, -0.25); // middle 100 above
    // twice as long: the bend doubles
    expect(linePoints(moveLinePoint(bent, 'b', { x: 900, y: 300 })).mid).toEqual({ x: 500, y: 100 });
    // turned a quarter: the bend turns with it
    expect(linePoints(moveLinePoint(bent, 'b', { x: 100, y: 700 })).mid).toEqual({ x: 200, y: 500 });
  });
  it('an end dragged onto the other end does not break the line', () => {
    const g = moveLinePoint(lineFrom({ x: 100, y: 300 }, { x: 500, y: 300 }, 0.2), 'b', { x: 100, y: 300 });
    for (const v of [g.x, g.y, g.w, g.h, g.ax, g.ay, g.bx, g.by, g.mx, g.my]) expect(Number.isFinite(v)).toBe(true);
    const back = moveLinePoint(g, 'b', { x: 300, y: 300 });
    expect(linePoints(back).b).toEqual({ x: 300, y: 300 });
  });
  it('Curved bends a straight line a little, Straight takes the bend out, and neither moves the ends', () => {
    const bent = bendLine(straight);
    expect(isCurved(bent)).toBe(true);
    expect(linePoints(bent).mid).toEqual({ x: 300, y: 228 }); // 18% of 400, upwards
    const again = straightenLine(bent);
    expect(again).toEqual(straight);
  });
  it('flipping swaps the ends and keeps the curve', () => {
    const bent = lineFrom({ x: 100, y: 300 }, { x: 500, y: 360 }, 0.2);
    const flipped = flipLine(bent);
    expect(linePoints(flipped).a).toEqual(linePoints(bent).b);
    expect(linePoints(flipped).b).toEqual(linePoints(bent).a);
    expect(linePoints(flipped).mid).toEqual(linePoints(bent).mid);
    expect({ x: flipped.x, y: flipped.y, w: flipped.w, h: flipped.h }).toEqual({ x: bent.x, y: bent.y, w: bent.w, h: bent.h });
  });
});

describe('arrowheads', () => {
  it('a straight line arrives at each end heading away from the other', () => {
    const l = { a: { x: 0, y: 0 }, b: { x: 30, y: 40 } };
    expect(headingAt(l, 'b')).toEqual({ x: 0.6, y: 0.8 });
    expect(headingAt(l, 'a')).toEqual({ x: -0.6, y: -0.8 });
  });
  it('a curve arrives along its own direction at the end, not along the straight line', () => {
    const l = { a: { x: 100, y: 400 }, b: { x: 500, y: 400 }, mid: { x: 300, y: 300 } };
    const h = headingAt(l, 'b'); // coming down from the control point at (300, 200)
    expect(h.x).toBeGreaterThan(0);
    expect(h.y).toBeGreaterThan(0);
    expect(near(Math.hypot(h.x, h.y), 1)).toBe(true);
    expect(near(h.x, h.y)).toBe(true);
  });
  it('the two strokes of an arrowhead are the same length, on either side of the line, behind the tip', () => {
    const tip = { x: 200, y: 100 };
    const [p, q] = arrowWings(tip, { x: 1, y: 0 }, 30);
    expect(near(Math.hypot(p.x - tip.x, p.y - tip.y), 30)).toBe(true);
    expect(near(Math.hypot(q.x - tip.x, q.y - tip.y), 30)).toBe(true);
    expect(p.x).toBeLessThan(tip.x);
    expect(near(p.x, q.x)).toBe(true);
    expect(near(p.y - tip.y, -(q.y - tip.y))).toBe(true);
    expect(Math.abs(p.y - tip.y)).toBeGreaterThan(5);
  });
  it('grows with the thickness of the line, within limits', () => {
    expect(arrowSize(1)).toBe(16);
    expect(arrowSize(5)).toBe(25);
    expect(arrowSize(40)).toBe(46);
  });
  it('none, one at the end, or one at both ends', () => {
    const l = { a: { x: 0, y: 0 }, b: { x: 200, y: 0 } };
    expect(arrowPaths(l, undefined, 5)).toEqual([]);
    const one = arrowPaths(l, 'end', 5);
    expect(one.length).toBe(1);
    expect(one[0]).toContain('L200 0 ');
    const two = arrowPaths(l, 'both', 5);
    expect(two.length).toBe(2);
    expect(two[0]).toContain('L0 0 ');
    expect(two[1]).toBe(one[0]);
  });
});

describe('drawing a line', () => {
  it('a straight line is drawn with a slight wobble but starts and ends exactly at its ends', () => {
    const d = linePath({ a: { x: 10, y: 20 }, b: { x: 310, y: 20 } });
    expect(d.startsWith('M10 20 C')).toBe(true);
    expect(d.endsWith(' 310 20')).toBe(true);
    const ys = d.slice(d.indexOf('C') + 1).trim().split(' ').map(Number).filter((_, i) => i % 2 === 1);
    expect(ys.length).toBe(3);
    expect(ys[0]).not.toBe(20); // off the straight line
    expect(Math.abs(ys[0] - 20)).toBeLessThanOrEqual(3); // but only just
    expect(Math.abs(ys[1] - 20)).toBeLessThanOrEqual(3);
  });
  it('a very short line hardly wobbles', () => {
    const d = linePath({ a: { x: 0, y: 0 }, b: { x: 20, y: 0 } });
    const ys = d.slice(d.indexOf('C') + 1).trim().split(' ').map(Number).filter((_, i) => i % 2 === 1);
    expect(Math.max(...ys.map(Math.abs))).toBeLessThanOrEqual(0.3);
  });
  it('a curve is drawn through its control point', () => {
    expect(linePath({ a: { x: 100, y: 400 }, b: { x: 500, y: 400 }, mid: { x: 300, y: 300 } })).toBe('M100 400 Q300 200 500 400');
  });
  it('dashes and dots follow the thickness; a solid line has none', () => {
    expect(lineDash(undefined, 5)).toBeUndefined();
    expect(lineDash('dashed', 5)).toBe('15 13');
    expect(lineDash('dotted', 5)).toBe('0.1 11');
  });
});
