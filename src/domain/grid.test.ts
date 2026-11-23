import { describe, expect, it } from 'vitest';
import { bingoCount, bingoLines, centerIndex, gridRows, hasLines, isFullGrid, isSequential, markTile, progress, tileDone, tilesDone } from './grid';

const grid = (cols: number, n: number, done: number[] = [], freeCenter = false) => ({
  cols,
  freeCenter,
  tiles: Array.from({ length: n }, (_, i) => ({ done: done.includes(i) })),
});
const range = (a: number, b: number, step = 1) => Array.from({ length: Math.floor((b - a) / step) + 1 }, (_, i) => a + i * step);

describe('grid shape', () => {
  it('derives rows from the tile count', () => {
    expect(gridRows(grid(5, 25))).toBe(5);
    expect(gridRows(grid(6, 26))).toBe(5);
    expect(isFullGrid(grid(6, 26))).toBe(false);
    expect(isFullGrid(grid(4, 16))).toBe(true);
  });
  it('finds the centre of odd squares only', () => {
    expect(centerIndex(grid(5, 25))).toBe(12);
    expect(centerIndex(grid(3, 9))).toBe(4);
    expect(centerIndex(grid(4, 16))).toBe(-1);
    expect(centerIndex(grid(5, 20))).toBe(-1);
  });
});

describe('bingo', () => {
  it('nothing done, no bingo', () => {
    expect(bingoCount(grid(5, 25))).toBe(0);
  });
  it('a full row', () => {
    expect(bingoCount(grid(5, 25, range(5, 9)))).toBe(1);
  });
  it('a full column', () => {
    expect(bingoLines(grid(4, 16, [1, 5, 9, 13]))).toEqual([[1, 5, 9, 13]]);
  });
  it('both diagonals', () => {
    expect(bingoCount(grid(3, 9, [0, 4, 8]))).toBe(1);
    expect(bingoCount(grid(3, 9, [0, 4, 8, 2, 6]))).toBe(2);
  });
  it('the free centre counts as done', () => {
    const g = grid(5, 25, [10, 11, 13, 14], true);
    expect(tileDone(g, 12)).toBe(true);
    expect(bingoCount(g)).toBe(1); // middle row
    expect(bingoCount(grid(5, 25, [10, 11, 13, 14], false))).toBe(0);
  });
  it('counts every line on a full card: rows + columns + diagonals', () => {
    expect(bingoCount(grid(5, 25, range(0, 24)))).toBe(12);
    expect(bingoCount(grid(4, 16, range(0, 15)))).toBe(10);
  });
  it('one short of a line is not bingo', () => {
    expect(bingoCount(grid(5, 25, [0, 1, 2, 3]))).toBe(0);
    expect(bingoCount(grid(5, 25, [0, 6, 18, 24], true))).toBe(1); // diagonal through the free centre
    expect(bingoCount(grid(5, 25, [0, 6, 18], true))).toBe(0);
  });
  it('grids that are not full (A to Z) never make lines', () => {
    expect(bingoCount(grid(6, 26, range(0, 25)))).toBe(0);
    expect(tilesDone(grid(6, 26, [0, 1, 2]))).toBe(3);
  });
  it('non-square full grids have rows and columns but no diagonals', () => {
    expect(bingoCount(grid(4, 8, range(0, 7)))).toBe(2 + 4);
  });
});

describe('progress', () => {
  it('counts done tiles out of all tiles', () => {
    expect(progress(grid(10, 100, range(0, 36)))).toEqual({ done: 37, total: 100, complete: false });
    expect(progress(grid(5, 10))).toEqual({ done: 0, total: 10, complete: false });
  });
  it('is complete only when every tile is done', () => {
    expect(progress(grid(5, 10, range(0, 8))).complete).toBe(false);
    expect(progress(grid(5, 10, range(0, 9))).complete).toBe(true);
    expect(progress(grid(5, 0)).complete).toBe(false);
  });
  it('the free centre counts towards the total done', () => {
    expect(progress(grid(3, 9, [], true))).toEqual({ done: 1, total: 9, complete: false });
    expect(progress(grid(3, 9, [0, 1, 2, 3, 5, 6, 7, 8], true)).complete).toBe(true);
  });
});

describe('marking with a tap', () => {
  const dones = (tiles: { done?: boolean }[]) => tiles.map((t) => (t.done ? 'x' : '.')).join('');
  it('toggles one tile in rows, on a path, a tree or a heart', () => {
    for (const layout of [undefined, 'grid', 'path', 'tree', 'heart']) {
      const g = { ...grid(3, 6, [1]), layout };
      expect(dones(markTile(g, 4))).toBe('.x..x.');
      expect(dones(markTile(g, 1))).toBe('......');
    }
  });
  it('keeps what is written on a tile', () => {
    const g: { tiles: { label?: string; text?: string; done?: boolean }[] } = { tiles: [{ label: 'A', text: 'Apples' }, { label: 'B' }] };
    expect(markTile(g, 0)[0]).toEqual({ label: 'A', text: 'Apples', done: true });
  });
  it('fills up to the tapped segment in a jar, a thermometer and a trail', () => {
    for (const layout of ['jar', 'thermo', 'trail']) {
      expect(isSequential(layout)).toBe(true);
      const g = { ...grid(1, 6), layout };
      expect(dones(markTile(g, 0))).toBe('x.....');
      expect(dones(markTile(g, 3))).toBe('xxxx..');
    }
  });
  it('tapping a filled segment empties it and everything above', () => {
    const g = { ...grid(1, 6, [0, 1, 2, 3]), layout: 'thermo' };
    expect(dones(markTile(g, 3))).toBe('xxx...');
    expect(dones(markTile(g, 1))).toBe('x.....');
    expect(dones(markTile(g, 0))).toBe('......');
  });
  it('a filling layout never has gaps, even when the saved marks had one', () => {
    const g = { ...grid(1, 6, [0, 4]), layout: 'jar' };
    expect(dones(markTile(g, 2))).toBe('xxx...');
  });
  it('a rating fills in order whatever its layout: the fourth star marks four', () => {
    const stars = { ...grid(5, 5), inOrder: true };
    expect(dones(markTile(stars, 3))).toBe('xxxx.');
    expect(dones(markTile({ ...grid(5, 5, [0, 1, 2, 3]), inOrder: true }, 3))).toBe('xxx..');
    expect(dones(markTile({ ...grid(5, 5, [0, 1, 2, 3]), inOrder: true }, 0))).toBe('.....');
  });
  it('ignores a tap outside the tiles', () => {
    expect(dones(markTile(grid(2, 4, [0]), 9))).toBe('x...');
  });
  it('only plain rows make bingo lines', () => {
    expect(hasLines({ bingo: true })).toBe(true);
    expect(hasLines({ bingo: true, layout: 'path' })).toBe(false);
    expect(hasLines({ bingo: false })).toBe(false);
  });
});
