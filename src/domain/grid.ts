import type { GridElement } from './pages';

// Tile grids: bingo cards, challenges, A to Z. Pure rules, unit tested.

type GridShape = Pick<GridElement, 'cols' | 'tiles' | 'freeCenter'>;

export const gridRows = (g: Pick<GridElement, 'cols' | 'tiles'>): number => Math.max(1, Math.ceil(g.tiles.length / Math.max(1, g.cols)));

/** A grid with every cell filled: only these can make bingo lines. */
export const isFullGrid = (g: Pick<GridElement, 'cols' | 'tiles'>): boolean => g.cols > 0 && g.tiles.length === g.cols * gridRows(g);

/** Index of the middle tile of an odd square, or -1. */
export function centerIndex(g: Pick<GridElement, 'cols' | 'tiles'>): number {
  const rows = gridRows(g);
  if (!isFullGrid(g) || rows !== g.cols || g.cols % 2 === 0) return -1;
  return Math.floor(rows / 2) * g.cols + Math.floor(g.cols / 2);
}

export const isFreeTile = (g: GridShape, i: number): boolean => Boolean(g.freeCenter) && i === centerIndex(g);

export const tileDone = (g: GridShape, i: number): boolean => isFreeTile(g, i) || Boolean(g.tiles[i]?.done);

/**
 * Every complete line: rows, columns, and on square grids the two diagonals.
 * Each line is the list of tile indexes it runs through.
 */
export function bingoLines(g: GridShape): number[][] {
  if (!isFullGrid(g)) return [];
  const rows = gridRows(g);
  const cols = g.cols;
  const lines: number[][] = [];
  for (let r = 0; r < rows; r++) lines.push(Array.from({ length: cols }, (_, c) => r * cols + c));
  for (let c = 0; c < cols; c++) lines.push(Array.from({ length: rows }, (_, r) => r * cols + c));
  if (rows === cols && cols > 1) {
    lines.push(Array.from({ length: cols }, (_, i) => i * cols + i));
    lines.push(Array.from({ length: cols }, (_, i) => i * cols + (cols - 1 - i)));
  }
  return lines.filter((line) => line.every((i) => tileDone(g, i)));
}

export const bingoCount = (g: GridShape): number => bingoLines(g).length;

/** Tiles done, free tile included, out of all tiles. */
export const tilesDone = (g: GridShape): number => g.tiles.reduce((n, _, i) => n + (tileDone(g, i) ? 1 : 0), 0);

// ----- challenges in other shapes (hearts, a path, a jar, a thermometer…)

/** Layouts that fill up in order, like a thermometer: marking a segment marks everything below it. */
const SEQUENTIAL: ReadonlySet<string> = new Set(['jar', 'thermo', 'trail']);
export const isSequential = (layout: string | undefined): boolean => SEQUENTIAL.has(layout ?? '');

/** Only plain rows of tiles can make bingo lines. */
export const hasLines = (g: Pick<GridElement, 'layout' | 'bingo'>): boolean => Boolean(g.bingo) && (g.layout ?? 'grid') === 'grid';

export interface Progress {
  done: number;
  total: number;
  /** Every tile is done (and there is at least one). */
  complete: boolean;
}

export function progress(g: GridShape): Progress {
  const total = g.tiles.length;
  const done = tilesDone(g);
  return { done, total, complete: total > 0 && done === total };
}

/**
 * The tiles after a tap on tile `i`. Usually the tap toggles that tile. In a
 * layout that fills up in order, tapping an empty segment fills up to it, and
 * tapping a filled one empties it and everything above.
 */
export function markTile<T extends { done?: boolean }>(g: { tiles: readonly T[]; layout?: string; inOrder?: boolean }, i: number): T[] {
  if (i < 0 || i >= g.tiles.length) return [...g.tiles];
  if (!isSequential(g.layout) && !g.inOrder) return g.tiles.map((t, j) => (j === i ? { ...t, done: !t.done } : t));
  const upTo = g.tiles[i].done ? i : i + 1;
  return g.tiles.map((t, j) => (Boolean(t.done) === j < upTo ? t : { ...t, done: j < upTo }));
}
