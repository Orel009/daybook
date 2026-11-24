import { describe, expect, it } from 'vitest';
import type { Page, PageElement } from '../domain/pages';
import { boundsOf, coverDpi, fillDpi, MIN_DPI, nearTheCut, photosOn } from './checks';
import { pressSheets, stageOf } from './layout';
import { crc32, uniqueNames, zip } from './zip';

const base = { rotation: 0 };
const page = (elements: PageElement[], size: Page['size'] = 'portrait', background: Page['background'] = { color: '#FFFDF9', pattern: 'dots' }): Page => ({
  id: 'p', title: 'p', size, background, elements, isTemplate: false, sortOrder: 0, createdAt: '', updatedAt: '',
});
const text = (x: number, y: number, w: number, size = 40, rotation = 0): PageElement => ({ id: `t${x}-${y}`, type: 'text', x, y, w, h: 80, rotation, text: 'Hello', font: 'hand', size, color: '#000000', align: 'left' });
const photo = (x: number, y: number, w: number, h: number): PageElement => ({ ...base, id: 'ph', type: 'photo', x, y, w, h, assetId: 'a1', frame: 'none', shadow: false });

describe('print resolution of photos', () => {
  // an 8 x 10 in book: a page unit prints 1200 units to 254 mm
  const u = 1200 / 254;
  it('a 1600 pixel photo across the whole 7.5 in page prints at about 213 dots per inch', () => {
    expect(Math.round(fillDpi({ w: 1600, h: 1200 }, 900, u))).toBe(213);
  });
  it('the same photo at half the width prints twice as fine', () => {
    expect(Math.round(fillDpi({ w: 1600, h: 1200 }, 450, u))).toBe(427);
  });
  it('a photo slot shows the photo covering it: a wide photo in a tall slot is enlarged, and zooming enlarges it more', () => {
    const wide = { w: 1600, h: 1200 };
    // slot 450 wide: the photo is exactly as wide
    expect(Math.round(coverDpi(wide, { w: 450, h: 300 }, u))).toBe(427);
    // tall slot 300 x 600: the photo is scaled to 600 high, so 800 wide
    expect(Math.round(coverDpi(wide, { w: 300, h: 600 }, u))).toBe(Math.round(1600 / (800 / u / 25.4)));
    expect(coverDpi(wide, { w: 300, h: 600 }, u, 2)).toBeCloseTo(coverDpi(wide, { w: 300, h: 600 }, u) / 2, 6);
    expect(coverDpi(wide, { w: 300, h: 600 }, u, 0.5)).toBe(coverDpi(wide, { w: 300, h: 600 }, u)); // zoom never goes below 1
  });
  it('finds every photo on a page: loose photos, filled slots, picture stickers and the background', () => {
    const p = page(
      [
        photo(100, 100, 300, 200),
        { ...base, id: 'f1', type: 'frame', x: 0, y: 0, w: 300, h: 300, style: 'plain', assetId: 'a2', zoom: 2 },
        { ...base, id: 'f2', type: 'frame', x: 0, y: 0, w: 300, h: 300, style: 'plain' },
        { ...base, id: 's1', type: 'sticker', x: 0, y: 0, w: 100, h: 100, emoji: '', assetId: 'a3' },
        { ...base, id: 's2', type: 'sticker', x: 0, y: 0, w: 100, h: 100, emoji: '🌸' },
      ],
      'portrait',
      { color: '#FFFFFF', pattern: 'plain', assetId: 'bg' },
    );
    expect(photosOn(p).map((x) => x.assetId)).toEqual(['bg', 'a1', 'a2', 'a3']);
    const [bg, loose, slot] = photosOn(p);
    const stage = { w: 900, h: 1200 };
    expect(Math.round(loose.dpi({ w: 1600, h: 1200 }, u, stage))).toBe(Math.round(fillDpi({ w: 1600, h: 1200 }, 300, u)));
    expect(slot.dpi({ w: 1600, h: 1200 }, u, stage)).toBeCloseTo(coverDpi({ w: 1600, h: 1200 }, { w: 300, h: 300 }, u, 2), 6);
    // a wide photo covering a tall page is enlarged a lot
    expect(bg.dpi({ w: 1600, h: 1200 }, u, stage)).toBeLessThan(MIN_DPI);
  });
});

describe('staying clear of the cut', () => {
  const placedFor = (p: Page, trim: '8x10' | '6x9' = '8x10') => {
    const [sheet] = pressSheets([p], trim);
    return { placed: sheet.placed[0], trim: sheet.trim! };
  };
  it('a part well inside the page is fine', () => {
    const p = page([text(60, 60, 400)]);
    const { placed, trim } = placedFor(p);
    expect(nearTheCut(p, placed, trim)).toEqual([]);
  });
  it('8 x 10 in leaves 6.35 mm of background beside the page, so even a part at the page edge is clear at the sides', () => {
    const p = page([text(0, 400, 300)]);
    const { placed, trim } = placedFor(p);
    expect(nearTheCut(p, placed, trim)).toEqual([]);
  });
  it('but the page fills the height, so a part within 5 mm of its top or bottom is reported, with the distance', () => {
    const p = page([text(60, 10, 300), photo(100, 1100, 300, 95)]);
    const { placed, trim } = placedFor(p);
    const found = nearTheCut(p, placed, trim);
    expect(found.map((f) => f.type)).toEqual(['text', 'photo']);
    expect(found[0].distance).toBe(Math.round((10 / (1200 / 254)) * 10) / 10); // 2.1 mm
    expect(found[1].distance).toBe(Math.round((5 / (1200 / 254)) * 10) / 10); // 1.1 mm
  });
  it('a part hanging off the page would be cut: the distance is negative', () => {
    const p = page([photo(300, -40, 300, 200)]);
    const { placed, trim } = placedFor(p);
    expect(nearTheCut(p, placed, trim)[0].distance).toBeLessThan(0);
  });
  it('tape, stickers, lines, shapes and bands of colour may run to the edge', () => {
    const p = page([
      { ...base, id: 'tp', type: 'tape', x: -10, y: 0, w: 300, h: 46, color: 'rose', pattern: 'stripes', edge: 'torn' },
      { ...base, id: 'st', type: 'sticker', x: 0, y: 0, w: 100, h: 100, emoji: '🌸' },
      { ...base, id: 'bd', type: 'box', x: 0, y: 0, w: 900, h: 100, fill: 'rose', border: 'none', title: '' },
      { ...base, id: 'sh', type: 'shape', x: 0, y: 0, w: 900, h: 900, shape: 'circle', color: '#000000' },
      { ...base, id: 'ln', type: 'line', x: 0, y: 0, w: 900, h: 0, ax: 0, ay: 0, bx: 900, by: 0, color: '#000000', weight: 5 },
    ]);
    const { placed, trim } = placedFor(p);
    expect(nearTheCut(p, placed, trim)).toEqual([]);
  });
  it('a turned part is measured by the box around it as it lies', () => {
    const b = boundsOf(text(100, 100, 400, 40, 90));
    // 400 wide, 48 tall, turned a quarter about its middle
    expect(Math.round(b.w)).toBe(48);
    expect(Math.round(b.h)).toBe(400);
    expect(Math.round(b.x + b.w / 2)).toBe(300);
    expect(Math.round(b.y + b.h / 2)).toBe(124);
  });
  it('on a turned wide page the sides swap: 6 x 9 in leaves room at the page ends, not along its long sides', () => {
    const p = page([text(10, 300, 300), text(500, 5, 300)], 'landscape');
    const { placed, trim } = placedFor(p, '6x9');
    expect(placed.turned).toBe(true);
    const u = stageOf(placed).unitsPerMm;
    // the page's long sides (its top and bottom) lie along the paper's long sides and touch the cut
    expect(Math.abs(placed.content.x - trim.x)).toBeLessThan(1e-9);
    const found = nearTheCut(p, placed, trim);
    // the part 5 units from the top is 1 mm from the cut; the part 10 units from the left end has the leftover background beside it
    expect(found.map((f) => f.id)).toEqual(['t500-5']);
    expect(found[0].distance).toBe(Math.round((5 / u) * 10) / 10);
  });
});

describe('saving several pictures as one file', () => {
  it('works out the checksum the ZIP format asks for', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
    expect(crc32(new Uint8Array())).toBe(0);
  });
  it('gives pages with the same title different file names', () => {
    expect(uniqueNames(['a.png', 'b.png', 'A.png', 'a.png', 'plain', 'plain'])).toEqual(['a.png', 'b.png', 'A (2).png', 'a (3).png', 'plain', 'plain (2)']);
  });
  it('writes a ZIP that lists each file with its size and where it starts', async () => {
    const files = [
      { name: 'one.png', blob: new Blob([new Uint8Array([1, 2, 3])]) },
      { name: 'two.png', blob: new Blob([new Uint8Array([4, 5, 6, 7, 8])]) },
    ];
    const bytes = new Uint8Array(await (await zip(files)).arrayBuffer());
    const view = new DataView(bytes.buffer);
    expect(view.getUint32(0, true)).toBe(0x04034b50);
    // the end record: two files, and where the list starts
    const end = bytes.length - 22;
    expect(view.getUint32(end, true)).toBe(0x06054b50);
    expect(view.getUint16(end + 10, true)).toBe(2);
    const listAt = view.getUint32(end + 16, true);
    expect(view.getUint32(listAt, true)).toBe(0x02014b50);
    // first entry: size 3, starts at 0; its data follows its 30-byte header and 7-byte name
    expect(view.getUint32(listAt + 24, true)).toBe(3);
    expect(view.getUint32(listAt + 42, true)).toBe(0);
    expect([...bytes.slice(37, 40)]).toEqual([1, 2, 3]);
    // second entry starts right after the first file
    const second = listAt + 46 + 7;
    expect(view.getUint32(second + 42, true)).toBe(40);
    expect(view.getUint32(40, true)).toBe(0x04034b50);
    expect(new TextDecoder().decode(bytes.slice(40 + 30, 40 + 37))).toBe('two.png');
    expect(view.getUint32(40 + 14, true)).toBe(crc32(new Uint8Array([4, 5, 6, 7, 8])));
  });
});
