import { describe, expect, it } from 'vitest';
import { bingoCount, bingoLines, centerIndex, gridRows, isFullGrid, tileDone, tilesDone } from './grid';

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
