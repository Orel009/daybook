import { PAGE_DIMS, type PageSize } from '../domain/pages';

// Where pages go on paper. Only numbers here (millimetres, measured from the
// top left of a sheet), so every layout can be tested without drawing
// anything. The same sheets feed the preview on screen, the browser's own
// print dialog and the PDF that is saved.
//
// A sheet is one side of one piece of paper (or, for print-ready files, one
// page of the PDF including its bleed). Each page placed on it has:
//   box      the area it covers, including any background extended past it
//   content  where the page's own 900 × 1200 (or 1200 × 900) sheet is drawn
//   turned   a wide page turned a quarter (its top towards the left of the
//            paper), so it fills a tall space

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Placed<T> {
  item: T;
  box: Box;
  content: Box;
  turned: boolean;
}

export interface Sheet<T> {
  w: number;
  h: number;
  /** Print-ready files: where the paper is cut. Outside it is bleed. */
  trim?: Box;
  placed: Placed<T>[];
  /** Flat areas of colour (the spine of a cover). */
  fills: (Box & { color: string })[];
  /** Short hairlines: fold marks and cut marks, outside the pages. */
  marks: { x1: number; y1: number; x2: number; y2: number }[];
  label: string;
}

export const MM_PER_INCH = 25.4;

export const PAPERS = {
  a4: { name: 'A4', w: 210, h: 297 },
  letter: { name: 'US Letter', w: 215.9, h: 279.4 },
  a5: { name: 'A5', w: 148, h: 210 },
} as const;
export type PaperId = keyof typeof PAPERS;

/** Sizes a photo book or print shop trims to. */
export const TRIMS = {
  '8x10': { name: '8 × 10 in', w: 203.2, h: 254 },
  '8.5x11': { name: '8.5 × 11 in', w: 215.9, h: 279.4 },
  a4: { name: 'A4', w: 210, h: 297 },
  '6x9': { name: '6 × 9 in', w: 152.4, h: 228.6 },
} as const;
export type TrimId = keyof typeof TRIMS;

/** Background printed past the cut line, so no white edge shows if the cut is a little off: 0.125 in, about 3 mm. */
export const BLEED = 3.175;
/** Text and photos closer to the cut than this may be trimmed or look cramped. */
export const SAFE = 5;
/** White edge around a page printed at home. Most printers can't print closer to the edge than this. */
export const HOME_MARGIN = 8;

interface Sized {
  size: PageSize;
}

const ratioOf = (size: PageSize) => PAGE_DIMS[size].w / PAGE_DIMS[size].h;

/** The largest box of this shape (width / height) inside another, in its middle. */
export function fitBox(ratio: number, into: Box): Box {
  const w = Math.min(into.w, into.h * ratio);
  const h = w / ratio;
  return { x: into.x + (into.w - w) / 2, y: into.y + (into.h - h) / 2, w, h };
}

const inset = (b: Box, by: number): Box => ({ x: b.x + by, y: b.y + by, w: b.w - 2 * by, h: b.h - 2 * by });

/** The shape a page takes up on paper: a turned wide page is as tall as a tall one. */
const shapeOnPaper = (size: PageSize, turned: boolean) => (turned ? 1 / ratioOf(size) : ratioOf(size));

// ---------- printing at home: one page per sheet

/**
 * Each page on its own sheet, as large as fits inside a small margin. A wide
 * page gets a sheet turned on its side, so tall and wide pages share one PDF.
 * `turnWide` keeps every sheet upright and turns the wide pages instead, for
 * browsers whose print dialog can't mix the two.
 */
export function homeSheets<T extends Sized>(items: T[], paper: PaperId, opts: { margin?: number; turnWide?: boolean } = {}): Sheet<T>[] {
  const { margin = HOME_MARGIN, turnWide = false } = opts;
  const p = PAPERS[paper];
  return items.map((item, i) => {
    const wide = item.size === 'landscape';
    const turned = wide && turnWide;
    const sideways = wide && !turnWide;
    const w = sideways ? p.h : p.w;
    const h = sideways ? p.w : p.h;
    const content = fitBox(shapeOnPaper(item.size, turned), inset({ x: 0, y: 0, w, h }, margin));
    return { w, h, placed: [{ item, box: content, content, turned }], fills: [], marks: [], label: `Page ${i + 1}` };
  });
}

// ---------- booklet: folded sheets, stapled in the fold

/**
 * The pages of a booklet in reading order, filled up with blanks (null) to a
 * multiple of four, because every folded sheet carries four pages. With
 * covers, the front cover comes first and the back cover last, so both are on
 * the outside of the outer sheet. The insides of the covers stay blank, as in
 * a bought notebook, unless `printInside` lets the pages start there. Blanks
 * that fill up the count go just before the (inside of the) back cover.
 */
export function bookletSequence<T>(pages: T[], covers?: { front: T; back: T; printInside?: boolean }): (T | null)[] {
  if (!covers) return [...pages, ...Array.from({ length: (4 - (pages.length % 4)) % 4 }, () => null)];
  const inside: (T | null)[] = covers.printInside ? [] : [null];
  const count = pages.length + 2 + 2 * inside.length;
  const blanks = Array.from({ length: (4 - (count % 4)) % 4 }, () => null);
  return [covers.front, ...inside, ...pages, ...blanks, ...inside, covers.back];
}

export interface BookletSide {
  /** Which sheet of paper, counted from the outside (0 is the outer sheet). */
  sheet: number;
  side: 'front' | 'back';
  /** Positions in the reading order (0 is the first page) on the left and right half. */
  left: number;
  right: number;
}

/**
 * Saddle-stitch order for `count` pages (a multiple of four): which two pages
 * share each side of each sheet. Printed on both sides and flipped on the
 * short edge, the sheets stack outer to inner, fold in half, and read in order.
 */
export function bookletOrder(count: number): BookletSide[] {
  if (count % 4 !== 0) throw new Error('A booklet needs a multiple of four pages.');
  const sides: BookletSide[] = [];
  for (let s = 0; s < count / 4; s++) {
    sides.push({ sheet: s, side: 'front', left: count - 1 - 2 * s, right: 2 * s });
    sides.push({ sheet: s, side: 'back', left: 2 * s + 1, right: count - 2 - 2 * s });
  }
  return sides;
}

/** Booklet sheets: paper on its side, two pages on each side, with small fold marks at the top and bottom. */
export function bookletSheets<T extends Sized>(sequence: (T | null)[], paper: 'a4' | 'letter', margin = HOME_MARGIN): Sheet<T>[] {
  const w = PAPERS[paper].h;
  const h = PAPERS[paper].w;
  const half = w / 2;
  const gutter = 6; // room on each side of the fold
  const halves: Box[] = [
    { x: margin, y: margin, w: half - margin - gutter, h: h - 2 * margin },
    { x: half + gutter, y: margin, w: half - margin - gutter, h: h - 2 * margin },
  ];
  return bookletOrder(sequence.length).map((side) => {
    const placed: Placed<T>[] = [];
    [side.left, side.right].forEach((index, k) => {
      const item = sequence[index];
      if (!item) return;
      const turned = item.size === 'landscape';
      const content = fitBox(shapeOnPaper(item.size, turned), halves[k]);
      placed.push({ item, box: content, content, turned });
    });
    return {
      w,
      h,
      placed,
      fills: [],
      marks: [
        { x1: half, y1: 0, x2: half, y2: 4 },
        { x1: half, y1: h - 4, x2: half, y2: h },
      ],
      label: `Sheet ${side.sheet + 1}, ${side.side}`,
    };
  });
}

// ---------- print-ready: trimmed pages with bleed, and a cover

/**
 * One PDF page per book page, the trim size plus bleed all round. The page is
 * fitted inside the cut line and its background runs on to the edge of the
 * bleed. A bound book has one page size, so wide pages are turned a quarter.
 */
export function pressSheets<T extends Sized>(items: T[], trim: TrimId, bleed = BLEED): Sheet<T>[] {
  const t = TRIMS[trim];
  const w = t.w + 2 * bleed;
  const h = t.h + 2 * bleed;
  const cut: Box = { x: bleed, y: bleed, w: t.w, h: t.h };
  return items.map((item, i) => {
    const turned = item.size === 'landscape';
    return {
      w,
      h,
      trim: cut,
      placed: [{ item, box: { x: 0, y: 0, w, h }, content: fitBox(shapeOnPaper(item.size, turned), cut), turned }],
      fills: [],
      marks: [],
      label: `Page ${i + 1}`,
    };
  });
}

/**
 * The cover of a printed book as one flat sheet: back cover, spine, front
 * cover, with bleed all round. The print service gives the spine width for
 * the number of pages and the paper. Small marks in the bleed show where the
 * spine folds.
 */
export function coverSpread<T extends Sized>(front: T, back: T, trim: TrimId, spine: number, spineColor: string, bleed = BLEED): Sheet<T> {
  const t = TRIMS[trim];
  const w = 2 * bleed + 2 * t.w + spine;
  const h = t.h + 2 * bleed;
  const backTrim: Box = { x: bleed, y: bleed, w: t.w, h: t.h };
  const frontTrim: Box = { x: bleed + t.w + spine, y: bleed, w: t.w, h: t.h };
  const fold = [bleed + t.w, bleed + t.w + spine];
  return {
    w,
    h,
    trim: { x: bleed, y: bleed, w: 2 * t.w + spine, h: t.h },
    placed: [
      { item: back, box: { x: 0, y: 0, w: bleed + t.w, h }, content: fitBox(ratioOf('portrait'), backTrim), turned: false },
      { item: front, box: { x: bleed + t.w + spine, y: 0, w: t.w + bleed, h }, content: fitBox(ratioOf('portrait'), frontTrim), turned: false },
    ],
    fills: spine > 0 ? [{ x: bleed + t.w, y: 0, w: spine, h, color: spineColor }] : [],
    marks: fold.flatMap((x) => [
      { x1: x, y1: 0, x2: x, y2: bleed - 0.8 },
      { x1: x, y1: h - bleed + 0.8, x2: x, y2: h },
    ]),
    label: 'Cover',
  };
}

// ---------- from a placed page to what is drawn

export interface StageSize {
  /** Page units per millimetre on paper. */
  unitsPerMm: number;
  /** Background to draw around the page, in page units, in the page's own upright view. */
  pad: { left: number; top: number; right: number; bottom: number };
  /** The whole drawing (page and padding) in page units. */
  w: number;
  h: number;
}

/**
 * How a placed page is drawn before it goes on the sheet: its own size in page
 * units plus the background around it. A turned page is drawn upright and
 * turned afterwards, so its padding is given in its own view: what is on the
 * paper's left is at the page's top.
 */
export function stageOf(p: Placed<Sized>): StageSize {
  const dims = PAGE_DIMS[p.item.size];
  const gap = {
    left: p.content.x - p.box.x,
    top: p.content.y - p.box.y,
    right: p.box.x + p.box.w - (p.content.x + p.content.w),
    bottom: p.box.y + p.box.h - (p.content.y + p.content.h),
  };
  const unitsPerMm = dims.w / (p.turned ? p.content.h : p.content.w);
  const u = (mm: number) => Math.max(0, mm) * unitsPerMm;
  const pad = p.turned
    ? { left: u(gap.bottom), top: u(gap.left), right: u(gap.top), bottom: u(gap.right) }
    : { left: u(gap.left), top: u(gap.top), right: u(gap.right), bottom: u(gap.bottom) };
  return { unitsPerMm, pad, w: dims.w + pad.left + pad.right, h: dims.h + pad.top + pad.bottom };
}

/** How many pixels a drawing of this size needs to print at `dpi`. */
export const pixelsFor = (stage: StageSize, dpi: number): { w: number; h: number } => ({
  w: Math.max(1, Math.round((stage.w / stage.unitsPerMm / MM_PER_INCH) * dpi)),
  h: Math.max(1, Math.round((stage.h / stage.unitsPerMm / MM_PER_INCH) * dpi)),
});

// ---------- which pages

/** Pages `from` to `to` of the book (counted from 1, either way round, clipped to the book). */
export function pageRange<T>(pages: T[], from: number, to: number): T[] {
  const a = Math.max(1, Math.min(from, to));
  const b = Math.min(pages.length, Math.max(from, to));
  return pages.slice(a - 1, b);
}
