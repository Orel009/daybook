import { describe, expect, it } from 'vitest';
import { alignBoxes, around, clampMove, distributeBoxes, gathered, placed, type Box } from './arrange';
import { PALETTES, recolour } from './palettes';
import { isDarkColor, type Page, type PageElement } from './pages';

const box = (id: string, x: number, y: number, w: number, h: number): Box => ({ id, x, y, w, h });
const a = box('a', 100, 100, 200, 50);
const b = box('b', 400, 300, 100, 100);
const c = box('c', 250, 600, 300, 80);

describe('lining parts up', () => {
  it('the box around them', () => {
    expect(around([a, b, c])).toEqual({ x: 100, y: 100, w: 450, h: 580 });
  });
  it('left, right, top and bottom put them against that edge', () => {
    expect(alignBoxes([a, b, c], 'left')).toEqual([{ id: 'b', x: 100 }, { id: 'c', x: 100 }]);
    expect(alignBoxes([a, b, c], 'right')).toEqual([{ id: 'a', x: 350 }, { id: 'b', x: 450 }]);
    expect(alignBoxes([a, b, c], 'top')).toEqual([{ id: 'b', y: 100 }, { id: 'c', y: 100 }]);
    expect(alignBoxes([a, b, c], 'bottom')).toEqual([{ id: 'a', y: 630 }, { id: 'b', y: 580 }]);
  });
  it('centre and middle put them on one line through the middle', () => {
    expect(alignBoxes([a, b, c], 'center')).toEqual([{ id: 'a', x: 225 }, { id: 'b', x: 275 }, { id: 'c', x: 175 }]);
    expect(alignBoxes([a, b], 'middle')).toEqual([{ id: 'a', y: 225 }, { id: 'b', y: 200 }]);
  });
  it('one part alone has nothing to line up with, and parts already in line are left', () => {
    expect(alignBoxes([a], 'left')).toEqual([]);
    expect(alignBoxes([a, box('d', 100, 400, 50, 50)], 'left')).toEqual([]);
  });
});

describe('spacing parts evenly', () => {
  it('keeps the first and last and puts the same gap between all of them', () => {
    const boxes = [box('1', 0, 0, 100, 10), box('2', 130, 0, 100, 10), box('3', 500, 0, 100, 10)];
    expect(distributeBoxes(boxes, 'across')).toEqual([{ id: '2', x: 250 }]); // gaps of 150 and 150
    const four = [box('1', 0, 0, 10, 100), box('2', 0, 120, 10, 60), box('3', 0, 600, 10, 100), box('4', 0, 300, 10, 40)];
    const moved = distributeBoxes(four, 'down');
    // 700 tall in all, 300 of parts: three gaps of 133.33
    expect(moved).toEqual([{ id: '2', y: 233 }, { id: '4', y: 427 }]);
  });
  it('takes at least three, and leaves evenly spaced parts alone', () => {
    expect(distributeBoxes([a, b], 'across')).toEqual([]);
    expect(distributeBoxes([box('1', 0, 0, 10, 10), box('2', 50, 0, 10, 10), box('3', 100, 0, 10, 10)], 'across')).toEqual([]);
  });
  it('works whatever order the parts were picked in', () => {
    const boxes = [box('3', 500, 0, 100, 10), box('1', 0, 0, 100, 10), box('2', 130, 0, 100, 10)];
    expect(distributeBoxes(boxes, 'across')).toEqual([{ id: '2', x: 250 }]);
  });
});

describe('moving parts together', () => {
  it('the group moves freely inside the sheet', () => {
    expect(clampMove([a, b], 50, -20, 'portrait')).toEqual({ dx: 50, dy: -20 });
  });
  it('and stops with half of the group still on the sheet', () => {
    // the group is 400 wide from x 100: its middle may go to the sheet's edges
    expect(clampMove([a, b], -1000, 0, 'portrait')).toEqual({ dx: -300, dy: 0 });
    expect(clampMove([a, b], 2000, 0, 'portrait').dx).toBe(900 - 200 - 100);
    expect(clampMove([a, b], 0, 5000, 'landscape').dy).toBe(900 - 150 - 100);
  });
});

const base = { rotation: 0 };
const text = (id: string, x: number, y: number, extra: Partial<PageElement> = {}): PageElement => ({ ...base, id, type: 'text', x, y, w: 200, h: 80, text: id, font: 'hand', size: 40, color: '#3A2B47', align: 'left', ...extra }) as PageElement;

describe('carrying parts to another page', () => {
  const parts = [text('one', 300, 500), text('two', 620, 560, { locked: true })];
  it('a copy or a block keeps the parts together, starting at the top left', () => {
    const g = gathered(parts);
    expect(g.map((p) => [p.x, p.y])).toEqual([[0, 0], [320, 60]]);
    expect(parts[0].x).toBe(300);
    expect(gathered([])).toEqual([]);
  });
  it('placed on a page they keep their arrangement, get new ids and are not locked', () => {
    const put = placed(gathered(parts), 'portrait');
    expect(put[1].x - put[0].x).toBe(320);
    expect(put[1].y - put[0].y).toBe(60);
    expect(put.some((p) => p.id === 'one' || p.id === 'two')).toBe(false);
    expect(new Set(put.map((p) => p.id)).size).toBe(2);
    expect(put.every((p) => !('locked' in p))).toBe(true);
    // in the middle of the sheet, across
    const all = around(put);
    expect(all.x).toBe(Math.round((900 - 520) / 2));
  });
  it('pasted on the page they came from they land a little beside the originals', () => {
    const put = placed(gathered(parts), 'portrait', { x: 300, y: 500 });
    expect([put[0].x, put[0].y]).toEqual([336, 536]);
  });
  it('never off the sheet, even from a wide page onto a tall one', () => {
    const wide = [text('w', 0, 0, { w: 1100 } as Partial<PageElement>), text('v', 1000, 700)];
    for (const p of placed(wide, 'portrait', { x: 900, y: 1150 })) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeGreaterThanOrEqual(0);
    }
    const one = placed([text('z', 0, 0)], 'portrait', { x: 880, y: 1190 });
    expect(one[0].x).toBe(700);
    expect(one[0].y).toBe(1120);
  });
});

describe('recolour page', () => {
  const page: Page = {
    id: 'p', title: 'p', size: 'portrait', background: { color: '#FFFDF9', pattern: 'grid', assetId: 'bg' }, isTemplate: false, sortOrder: 1, createdAt: '', updatedAt: '',
    elements: [
      text('t', 0, 0),
      text('note', 0, 100, { note: 'butter' } as Partial<PageElement>),
      { ...base, id: 'w', type: 'writing', x: 0, y: 0, w: 10, h: 10, title: 'Notes', color: 'butter', text: 'kept', lined: true, textColor: '#B03A6B' },
      { ...base, id: 'c', type: 'checklist', x: 0, y: 0, w: 10, h: 10, title: 'To do', color: 'mint', items: [{ id: 'i', text: 'x', done: true }] },
      { ...base, id: 'tp', type: 'tape', x: 0, y: 0, w: 10, h: 10, color: 'rose', pattern: 'lemons', edge: 'torn' },
      { ...base, id: 'b1', type: 'box', x: 0, y: 0, w: 10, h: 10, fill: 'sky', border: 'none', title: '' },
      { ...base, id: 'b2', type: 'box', x: 0, y: 0, w: 10, h: 10, fill: 'white', border: 'solid', title: '' },
      { ...base, id: 's1', type: 'sticker', x: 0, y: 0, w: 10, h: 10, emoji: '', art: 'star', color: 'butter' },
      { ...base, id: 's2', type: 'sticker', x: 0, y: 0, w: 10, h: 10, emoji: '🌸' },
      { ...base, id: 'ln', type: 'line', x: 0, y: 0, w: 10, h: 0, ax: 0, ay: 0, bx: 10, by: 0, color: '#3A2B47', weight: 5 },
      { ...base, id: 'ph', type: 'photo', x: 0, y: 0, w: 10, h: 10, assetId: 'a', frame: 'none', shadow: false },
    ],
  };
  it('there are ten palettes, each with its own name, a paper, an ink that shows on it and six accents', () => {
    expect(PALETTES.length).toBe(10);
    expect(new Set(PALETTES.map((p) => p.id)).size).toBe(10);
    expect(new Set(PALETTES.map((p) => p.name)).size).toBe(10);
    for (const p of PALETTES) {
      for (const hex of [p.paper, p.ink, ...p.accents]) expect(/^#[0-9A-F]{6}$/.test(hex), `${p.name}: ${hex}`).toBe(true);
      expect(isDarkColor(p.paper), p.name).not.toBe(isDarkColor(p.ink));
      expect(p.accents.length).toBe(6);
    }
  });
  it('gives the paper, the lettering and every coloured part the palette\'s colours, in turn', () => {
    const palette = PALETTES.find((p) => p.id === 'seaside')!;
    const made = recolour(page, palette);
    const by = (id: string) => made.elements.find((e) => e.id === id) as PageElement & Record<string, unknown>;
    expect(made.background).toEqual({ color: palette.paper, pattern: 'grid', assetId: 'bg' });
    expect(by('t').color).toBe(palette.ink);
    expect(by('note').note).toBe(palette.accents[0]);
    expect(by('w').color).toBe(palette.accents[1]);
    expect(by('c').color).toBe(palette.accents[2]);
    expect(by('tp').color).toBe(palette.accents[3]);
    expect(by('b1').fill).toBe(palette.accents[4]);
    expect(by('s1').color).toBe(palette.accents[5]);
    // the line takes the next accent (the first again), deepened so it shows on the paper
    expect(by('ln').color).not.toBe(palette.accents[0]);
    expect(isDarkColor(by('ln').color as string)).toBe(true);
  });
  it('leaves what has no colour of its own, and everything that was written', () => {
    const made = recolour(page, PALETTES[0]);
    const by = (id: string) => made.elements.find((e) => e.id === id)!;
    expect(by('b2')).toEqual(page.elements[6]);
    expect(by('s2')).toEqual(page.elements[8]);
    expect(by('ph')).toEqual(page.elements[10]);
    expect(by('w')).toMatchObject({ text: 'kept', title: 'Notes', lined: true });
    expect('textColor' in by('w')).toBe(false); // a writing colour of her own would fight the palette
    expect(by('c')).toMatchObject({ items: [{ id: 'i', text: 'x', done: true }] });
    expect(by('tp')).toMatchObject({ pattern: 'lemons', edge: 'torn' });
    expect(made.elements.map((e) => [e.id, e.x, e.y, e.w, e.h])).toEqual(page.elements.map((e) => [e.id, e.x, e.y, e.w, e.h]));
    expect(page.background.color).toBe('#FFFDF9');
  });
  it('on a dark palette lettering is light and sticky notes keep dark lettering', () => {
    const made = recolour(page, PALETTES.find((p) => p.id === 'midnight')!);
    expect(made.elements.find((e) => e.id === 't')).toMatchObject({ color: '#FFFFFF' });
    expect(made.elements.find((e) => e.id === 'note')).toMatchObject({ color: '#3A2B47' });
  });
});
