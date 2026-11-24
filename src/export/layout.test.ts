import { describe, expect, it } from 'vitest';
import type { PageSize } from '../domain/pages';
import { BLEED, bookletOrder, bookletSequence, bookletSheets, coverSpread, fitBox, homeSheets, pageRange, PAPERS, pixelsFor, pressSheets, stageOf, TRIMS } from './layout';

const tall = (n: number) => ({ n, size: 'portrait' as PageSize });
const wide = (n: number) => ({ n, size: 'landscape' as PageSize });
const pages = (count: number) => Array.from({ length: count }, (_, i) => tall(i + 1));
const close = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) <= eps;

describe('fitting a page on paper', () => {
  it('fits by height in a wider space and by width in a taller one, in the middle', () => {
    expect(fitBox(0.75, { x: 0, y: 0, w: 100, h: 100 })).toEqual({ x: 12.5, y: 0, w: 75, h: 100 });
    expect(fitBox(0.75, { x: 10, y: 20, w: 60, h: 200 })).toEqual({ x: 10, y: 80, w: 60, h: 80 });
  });
  it('a home sheet keeps each page upright: tall pages on upright paper, wide pages on paper turned on its side', () => {
    const sheets = homeSheets([tall(1), wide(2), tall(3)], 'a4');
    expect(sheets.map((s) => [s.w, s.h])).toEqual([[210, 297], [297, 210], [210, 297]]);
    expect(sheets.every((s) => s.placed.length === 1 && !s.placed[0].turned)).toBe(true);
    expect(sheets.map((s) => s.label)).toEqual(['Page 1', 'Page 2', 'Page 3']);
  });
  it('the page is as big as fits inside an 8 mm margin and keeps its shape', () => {
    for (const paper of ['a4', 'letter', 'a5'] as const) {
      for (const item of [tall(1), wide(1)]) {
        const [s] = homeSheets([item], paper);
        const c = s.placed[0].content;
        expect(c.x).toBeGreaterThanOrEqual(8 - 1e-9);
        expect(c.y).toBeGreaterThanOrEqual(8 - 1e-9);
        expect(c.x + c.w).toBeLessThanOrEqual(s.w - 8 + 1e-9);
        expect(c.y + c.h).toBeLessThanOrEqual(s.h - 8 + 1e-9);
        expect(close(c.w / c.h, item.size === 'portrait' ? 0.75 : 4 / 3)).toBe(true);
        // it touches the margin on at least one pair of sides
        expect(close(c.x, 8) || close(c.y, 8)).toBe(true);
        expect(s.placed[0].box).toEqual(c);
      }
    }
  });
  it('where the print dialog cannot mix, every sheet stays upright and wide pages are turned', () => {
    const sheets = homeSheets([tall(1), wide(2)], 'letter', { turnWide: true });
    expect(sheets.map((s) => [s.w, s.h])).toEqual([[215.9, 279.4], [215.9, 279.4]]);
    expect(sheets.map((s) => s.placed[0].turned)).toEqual([false, true]);
    expect(close(sheets[1].placed[0].content.w / sheets[1].placed[0].content.h, 0.75)).toBe(true);
  });
});

describe('booklet order', () => {
  it('fills up to a multiple of four with blanks at the end', () => {
    for (let n = 1; n <= 13; n++) {
      const seq = bookletSequence(pages(n));
      expect(seq.length % 4, `${n} pages`).toBe(0);
      expect(seq.length, `${n} pages`).toBe(Math.ceil(n / 4) * 4);
      expect(seq.slice(0, n).map((p) => p?.n)).toEqual(pages(n).map((p) => p.n));
      expect(seq.slice(n).every((p) => p === null)).toBe(true);
    }
  });
  it('gives the known order for 4, 8 and 12 pages', () => {
    const pairs = (n: number) => bookletOrder(n).map((s) => [s.left + 1, s.right + 1]);
    expect(pairs(4)).toEqual([[4, 1], [2, 3]]);
    expect(pairs(8)).toEqual([[8, 1], [2, 7], [6, 3], [4, 5]]);
    expect(pairs(12)).toEqual([[12, 1], [2, 11], [10, 3], [4, 9], [8, 5], [6, 7]]);
  });
  it('for 1 to 13 pages: every page is printed once, and folding the stack reads 1, 2, 3…', () => {
    for (let n = 1; n <= 13; n++) {
      const seq = bookletSequence(pages(n));
      const order = bookletOrder(seq.length);
      expect(order.length, `${n} pages`).toBe(seq.length / 2);
      // every position once
      const used = order.flatMap((s) => [s.left, s.right]).sort((a, b) => a - b);
      expect(used, `${n} pages`).toEqual(seq.map((_, i) => i));
      // fold it: sheets stack outer (0) to inner; each sheet is two leaves. Reading goes through the
      // left leaves from the outside in (front right, then back left), then the right leaves from the inside out.
      const sheets = seq.length / 4;
      const read: number[] = [];
      for (let s = 0; s < sheets; s++) {
        const front = order.find((o) => o.sheet === s && o.side === 'front')!;
        const back = order.find((o) => o.sheet === s && o.side === 'back')!;
        read.push(front.right, back.left);
      }
      for (let s = sheets - 1; s >= 0; s--) {
        const front = order.find((o) => o.sheet === s && o.side === 'front')!;
        const back = order.find((o) => o.sheet === s && o.side === 'back')!;
        read.push(back.right, front.left);
      }
      expect(read, `${n} pages`).toEqual(seq.map((_, i) => i));
      // the two sides of one leaf are consecutive pages: flipped on the short edge, the back's right half is behind the front's left half
      for (let s = 0; s < sheets; s++) {
        const front = order.find((o) => o.sheet === s && o.side === 'front')!;
        const back = order.find((o) => o.sheet === s && o.side === 'back')!;
        expect(back.left, `${n} pages, sheet ${s}`).toBe(front.right + 1);
        expect(back.right, `${n} pages, sheet ${s}`).toBe(front.left - 1);
      }
    }
  });
  it('refuses a count that is not a multiple of four', () => {
    expect(() => bookletOrder(6)).toThrow();
  });
  it('with covers: the insides of the covers stay blank, the pages start on the first right-hand page', () => {
    const front = tall(100);
    const back = tall(200);
    for (let n = 1; n <= 13; n++) {
      const seq = bookletSequence(pages(n), { front, back });
      expect(seq.length % 4, `${n} pages`).toBe(0);
      expect(seq.length, `${n} pages`).toBe(Math.ceil((n + 4) / 4) * 4);
      expect(seq[0]).toBe(front);
      expect(seq[1]).toBeNull(); // inside of the front cover
      expect(seq[seq.length - 2]).toBeNull(); // inside of the back cover
      expect(seq[seq.length - 1]).toBe(back);
      expect(seq.slice(2, n + 2).map((p) => p?.n)).toEqual(pages(n).map((p) => p.n));
      expect(seq.slice(n + 2, -1).every((p) => p === null)).toBe(true);
      // the back of the outer sheet, where the insides of the covers are, carries nothing
      const order = bookletOrder(seq.length);
      const outerBack = order.find((o) => o.sheet === 0 && o.side === 'back')!;
      expect([seq[outerBack.left], seq[outerBack.right]]).toEqual([null, null]);
    }
  });
  it('with "print on the inside of the covers": front cover first, back cover last, blanks just before the back cover', () => {
    const front = tall(100);
    const back = tall(200);
    for (let n = 1; n <= 13; n++) {
      const seq = bookletSequence(pages(n), { front, back, printInside: true });
      expect(seq.length % 4, `${n} pages`).toBe(0);
      expect(seq.length, `${n} pages`).toBe(Math.ceil((n + 2) / 4) * 4);
      expect(seq[0]).toBe(front);
      expect(seq[seq.length - 1]).toBe(back);
      expect(seq.slice(1, n + 1).map((p) => p?.n)).toEqual(pages(n).map((p) => p.n));
      expect(seq.slice(n + 1, -1).every((p) => p === null)).toBe(true);
      // both covers are on the front of the outer sheet: back cover left, front cover right
      const outer = bookletOrder(seq.length)[0];
      expect(seq[outer.left]).toBe(back);
      expect(seq[outer.right]).toBe(front);
    }
  });
  it('six pages make two sheets: four sides, two pages a side, two blanks', () => {
    const sheets = bookletSheets(bookletSequence(pages(6)), 'a4');
    expect(sheets.length).toBe(4);
    expect(sheets.map((s) => s.label)).toEqual(['Sheet 1, front', 'Sheet 1, back', 'Sheet 2, front', 'Sheet 2, back']);
    expect(sheets.every((s) => s.w === 297 && s.h === 210)).toBe(true);
    // 8 | 1, 2 | 7, 6 | 3, 4 | 5 with 7 and 8 blank
    expect(sheets.map((s) => s.placed.map((p) => p.item.n))).toEqual([[1], [2], [6, 3], [4, 5]]);
    // page 1 is on the right half of the first side
    expect(sheets[0].placed[0].content.x).toBeGreaterThan(297 / 2);
  });
  it('each booklet page stays on its own half, clear of the fold and the paper edge, and wide pages are turned', () => {
    for (const paper of ['a4', 'letter'] as const) {
      const sheets = bookletSheets(bookletSequence([tall(1), wide(2), tall(3), tall(4)]), paper);
      const w = PAPERS[paper].h;
      for (const s of sheets) {
        expect(s.marks.length).toBe(2);
        expect(s.marks.every((m) => m.x1 === w / 2 && m.x2 === w / 2)).toBe(true);
        for (const p of s.placed) {
          const left = p.content.x < w / 2;
          expect(left ? p.content.x + p.content.w <= w / 2 - 6 + 1e-9 : p.content.x >= w / 2 + 6 - 1e-9).toBe(true);
          expect(p.content.x >= 8 - 1e-9 && p.content.x + p.content.w <= w - 8 + 1e-9).toBe(true);
          expect(p.turned).toBe(p.item.size === 'landscape');
          expect(close(p.content.w / p.content.h, 0.75)).toBe(true);
        }
      }
    }
  });
});

describe('print-ready pages', () => {
  it('each page is the trim size plus 0.125 in of bleed on every side', () => {
    expect(BLEED).toBe(3.175);
    for (const id of Object.keys(TRIMS) as (keyof typeof TRIMS)[]) {
      const [s] = pressSheets([tall(1)], id);
      expect(close(s.w, TRIMS[id].w + 6.35)).toBe(true);
      expect(close(s.h, TRIMS[id].h + 6.35)).toBe(true);
      expect(s.trim).toEqual({ x: 3.175, y: 3.175, w: TRIMS[id].w, h: TRIMS[id].h });
      const p = s.placed[0];
      // background to the edge of the bleed, the page itself inside the cut
      expect(p.box).toEqual({ x: 0, y: 0, w: s.w, h: s.h });
      expect(p.content.x >= 3.175 - 1e-9 && p.content.y >= 3.175 - 1e-9).toBe(true);
      expect(p.content.x + p.content.w <= 3.175 + TRIMS[id].w + 1e-9).toBe(true);
      expect(p.content.y + p.content.h <= 3.175 + TRIMS[id].h + 1e-9).toBe(true);
      expect(close(p.content.w / p.content.h, 0.75)).toBe(true);
    }
  });
  it('8 × 10 in: the page fills the height and leaves 6.35 mm of background at each side', () => {
    const p = pressSheets([tall(1)], '8x10')[0].placed[0];
    expect(close(p.content.h, 254)).toBe(true);
    expect(close(p.content.w, 190.5)).toBe(true);
    expect(close(p.content.x - 3.175, 6.35)).toBe(true);
  });
  it('wide pages are turned, so every page of the book has the same size', () => {
    const sheets = pressSheets([tall(1), wide(2)], '6x9');
    expect(sheets[0].w).toBe(sheets[1].w);
    expect(sheets[0].h).toBe(sheets[1].h);
    expect(sheets[1].placed[0].turned).toBe(true);
    expect(sheets[1].placed[0].content).toEqual(sheets[0].placed[0].content);
  });
});

describe('the cover of a printed book', () => {
  const spread = coverSpread(tall(1), tall(2), '8x10', 12, '#3A2B47');
  it('is back cover + spine + front cover, with bleed all round', () => {
    expect(close(spread.w, 3.175 + 203.2 + 12 + 203.2 + 3.175)).toBe(true);
    expect(close(spread.h, 254 + 6.35)).toBe(true);
    expect(spread.trim).toEqual({ x: 3.175, y: 3.175, w: 418.4, h: 254 });
  });
  it('the back cover is on the left, the front on the right, the spine between them', () => {
    const [back, front] = spread.placed;
    expect(back.item.n).toBe(2);
    expect(front.item.n).toBe(1);
    expect(back.box).toEqual({ x: 0, y: 0, w: 206.375, h: 260.35 });
    expect(close(front.box.x, 218.375)).toBe(true);
    expect(close(front.box.x + front.box.w, spread.w)).toBe(true);
    expect(spread.fills).toEqual([{ x: 206.375, y: 0, w: 12, h: 260.35, color: '#3A2B47' }]);
    // nothing overlaps and nothing is left uncovered
    expect(close(back.box.w + spread.fills[0].w + front.box.w, spread.w)).toBe(true);
    // each cover sits inside its own trimmed half
    expect(back.content.x >= 3.175 && back.content.x + back.content.w <= 3.175 + 203.2 + 1e-9).toBe(true);
    expect(front.content.x >= 218.375 - 1e-9 && front.content.x + front.content.w <= 218.375 + 203.2 + 1e-9).toBe(true);
  });
  it('the width follows the spine: one more millimetre of spine is one more millimetre of cover', () => {
    for (const id of Object.keys(TRIMS) as (keyof typeof TRIMS)[]) {
      for (const spine of [0, 3, 6.35, 25]) {
        const s = coverSpread(tall(1), tall(2), id, spine, '#000000');
        expect(close(s.w, 2 * TRIMS[id].w + spine + 2 * BLEED)).toBe(true);
        expect(close(s.h, TRIMS[id].h + 2 * BLEED)).toBe(true);
        expect(s.fills.length).toBe(spine > 0 ? 1 : 0);
        // fold marks at both edges of the spine, in the bleed only
        expect(s.marks.map((m) => m.x1).sort((a, b) => a - b)).toEqual([BLEED + TRIMS[id].w, BLEED + TRIMS[id].w, BLEED + TRIMS[id].w + spine, BLEED + TRIMS[id].w + spine]);
        expect(s.marks.every((m) => (m.y1 < BLEED && m.y2 < BLEED) || (m.y1 > s.h - BLEED && m.y2 > s.h - BLEED))).toBe(true);
      }
    }
  });
});

describe('from paper to pixels', () => {
  it('a page printed at home is drawn as it is, with nothing around it', () => {
    const [s] = homeSheets([tall(1)], 'a4');
    const stage = stageOf(s.placed[0]);
    expect(stage.pad).toEqual({ left: 0, top: 0, right: 0, bottom: 0 });
    expect(stage.w).toBe(900);
    expect(stage.h).toBe(1200);
    expect(close(stage.unitsPerMm, 900 / s.placed[0].content.w)).toBe(true);
  });
  it('a print-ready page is drawn with its background reaching the edge of the bleed', () => {
    const [s] = pressSheets([tall(1)], '8x10');
    const stage = stageOf(s.placed[0]);
    const u = 1200 / 254;
    expect(close(stage.unitsPerMm, u)).toBe(true);
    expect(close(stage.pad.top, 3.175 * u) && close(stage.pad.bottom, 3.175 * u)).toBe(true);
    expect(close(stage.pad.left, 9.525 * u) && close(stage.pad.right, 9.525 * u)).toBe(true);
    expect(close(stage.w / u, s.w) && close(stage.h / u, s.h)).toBe(true);
    // at 300 dots per inch that is the trim size plus bleed in pixels
    expect(pixelsFor(stage, 300)).toEqual({ w: Math.round((209.55 / 25.4) * 300), h: Math.round((260.35 / 25.4) * 300) });
  });
  it('a turned wide page is drawn upright: what is at the left of the paper is at its top', () => {
    const [s] = pressSheets([wide(1)], '6x9');
    const p = s.placed[0];
    const stage = stageOf(p);
    expect(close(stage.unitsPerMm, 1200 / p.content.h)).toBe(true);
    const mm = (v: number) => v / stage.unitsPerMm;
    expect(close(mm(stage.pad.top), p.content.x)).toBe(true);
    expect(close(mm(stage.pad.bottom), s.w - p.content.x - p.content.w)).toBe(true);
    expect(close(mm(stage.pad.right), p.content.y)).toBe(true);
    expect(close(mm(stage.pad.left), s.h - p.content.y - p.content.h)).toBe(true);
    // the drawing is as wide as the paper is tall
    expect(close(mm(stage.w), s.h) && close(mm(stage.h), s.w)).toBe(true);
  });
  it('A4 at 300 dots per inch is 2480 pixels wide less the margins', () => {
    const [s] = homeSheets([tall(1)], 'a4');
    const px = pixelsFor(stageOf(s.placed[0]), 300);
    expect(px.w).toBe(Math.round(((210 - 16) / 25.4) * 300));
    expect(close(px.w / px.h, 0.75, 0.001)).toBe(true);
  });
});

describe('a range of pages', () => {
  it('counts from 1, takes both ends, either way round, and stops at the ends of the book', () => {
    const book = pages(10).map((p) => p.n);
    expect(pageRange(book, 3, 5)).toEqual([3, 4, 5]);
    expect(pageRange(book, 5, 3)).toEqual([3, 4, 5]);
    expect(pageRange(book, 0, 2)).toEqual([1, 2]);
    expect(pageRange(book, 9, 40)).toEqual([9, 10]);
    expect(pageRange(book, 4, 4)).toEqual([4]);
    expect(pageRange(book, 20, 30)).toEqual([]);
  });
});
