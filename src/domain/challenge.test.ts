import { describe, expect, it } from 'vitest';
import { heartSpots, isPicture, jarSpots, JAR_INSIDE, pathCells, PICTURE_SIZE, pictureSpots, thermoSpots, trailSpots, TRAIL_POINTS, treeSpots, type Picture, type Spot } from './challenge';

const centre = (s: Spot) => ({ x: s.x + s.w / 2, y: s.y + s.h / 2 });
const gap = (a: Spot, b: Spot) => Math.hypot(centre(a).x - centre(b).x, centre(a).y - centre(b).y);

describe('path', () => {
  it('runs left to right, then right to left', () => {
    const cells = pathCells(10, 4);
    expect(cells.map((c) => `${c.row}${c.col}`).join(' ')).toBe('00 01 02 03 13 12 11 10 20 21');
    expect(cells.map((c) => c.next[0]).join('')).toBe('rrrdllldre');
  });
  it('every step is to a neighbouring cell', () => {
    const cells = pathCells(30, 6);
    for (let i = 1; i < cells.length; i++) {
      expect(Math.abs(cells[i].row - cells[i - 1].row) + Math.abs(cells[i].col - cells[i - 1].col)).toBe(1);
    }
    expect(cells.at(-1)?.next).toBe('end');
  });
  it('copes with one column and with nothing', () => {
    expect(pathCells(3, 1).map((c) => c.next)).toEqual(['down', 'down', 'end']);
    expect(pathCells(0, 5)).toEqual([]);
  });
});

describe('pictures', () => {
  const counts = [1, 2, 7, 12, 30, 50, 100];
  it('give one spot per tile, inside the picture', () => {
    for (const layout of Object.keys(PICTURE_SIZE) as Picture[]) {
      const { w, h } = PICTURE_SIZE[layout];
      for (const n of counts) {
        const spots = pictureSpots(layout, n);
        expect(spots.length, `${layout} ${n}`).toBe(n);
        for (const s of spots) {
          expect(s.w, `${layout} ${n}`).toBeGreaterThan(0);
          expect(s.x, `${layout} ${n}`).toBeGreaterThanOrEqual(-0.5);
          expect(s.y, `${layout} ${n}`).toBeGreaterThanOrEqual(-0.5);
          expect(s.x + s.w, `${layout} ${n}`).toBeLessThanOrEqual(w + 0.5);
          expect(s.y + s.h, `${layout} ${n}`).toBeLessThanOrEqual(h + 0.5);
        }
      }
    }
  });
  it('knows which layouts are pictures', () => {
    expect(isPicture('jar')).toBe(true);
    expect(isPicture('path')).toBe(false);
    expect(isPicture(undefined)).toBe(false);
  });
  it('marbles stay in the jar, fill from the bottom and do not overlap', () => {
    for (const n of [5, 40, 100]) {
      const spots = jarSpots(n);
      for (const s of spots) {
        expect(s.x).toBeGreaterThanOrEqual(JAR_INSIDE.left - 0.01);
        expect(s.x + s.w).toBeLessThanOrEqual(JAR_INSIDE.right + 0.01);
        expect(s.y).toBeGreaterThanOrEqual(JAR_INSIDE.top - 0.01);
        expect(s.y + s.h).toBeLessThanOrEqual(JAR_INSIDE.bottom + 0.01);
      }
      for (let i = 1; i < spots.length; i++) expect(spots[i].y).toBeLessThanOrEqual(spots[i - 1].y + 0.01);
      for (let i = 0; i < spots.length; i++) for (let j = i + 1; j < spots.length; j++) expect(gap(spots[i], spots[j])).toBeGreaterThan(spots[i].w * 0.95);
    }
  });
  it('thermometer bands stack from the bottom without gaps', () => {
    const spots = thermoSpots(10);
    for (let i = 1; i < spots.length; i++) expect(spots[i].y + spots[i].h).toBeCloseTo(spots[i - 1].y, 5);
    expect(spots[0].y + spots[0].h).toBeGreaterThan(spots[9].y);
  });
  it('the trail climbs, ends on the summit and keeps its stops apart', () => {
    const [sx, sy] = TRAIL_POINTS[TRAIL_POINTS.length - 1];
    for (const n of [5, 12, 20]) {
      const spots = trailSpots(n);
      const last = centre(spots[n - 1]);
      expect(last.x).toBeCloseTo(sx, 3);
      expect(last.y).toBeCloseTo(sy, 3);
      expect(centre(spots[0]).y).toBeGreaterThan(last.y);
      for (let i = 1; i < n; i++) expect(gap(spots[i], spots[i - 1])).toBeGreaterThan(spots[i].w * 0.9);
    }
  });
  it('leaves and little hearts keep apart', () => {
    for (const [make, n, least] of [[treeSpots, 30, 0.7], [treeSpots, 60, 0.7], [heartSpots, 100, 0.8], [heartSpots, 50, 0.8]] as const) {
      const spots = make(n);
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) expect(gap(spots[i], spots[j])).toBeGreaterThan(spots[i].w * least);
    }
  });
  it('the big heart is the same on both sides', () => {
    const { w } = PICTURE_SIZE.heart;
    const spots = heartSpots(100);
    const left = spots.filter((s) => centre(s).x < w / 2 - 1).length;
    const right = spots.filter((s) => centre(s).x > w / 2 + 1).length;
    expect(Math.abs(left - right)).toBeLessThanOrEqual(1);
  });
});
