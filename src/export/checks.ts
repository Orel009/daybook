import { PAGE_DIMS, type Page, type PageElement } from '../domain/pages';
import { MM_PER_INCH, SAFE, stageOf, type Placed } from './layout';

// Checks for print-ready files: photos that would print coarse, and text or
// photos too close to where the paper is cut. Numbers only, so they are tested
// without drawing anything.

/** Below this, a printed photo starts to look soft. */
export const MIN_DPI = 200;

export interface Pixels {
  w: number;
  h: number;
}

/**
 * Dots per inch of a photo that covers a box (in page units), the way photo
 * slots and page backgrounds show them: scaled until it fills the box, then
 * zoomed. `unitsPerMm` says how big a page unit prints.
 */
export function coverDpi(photo: Pixels, box: { w: number; h: number }, unitsPerMm: number, zoom = 1): number {
  const shownW = Math.max(box.w, (box.h * photo.w) / photo.h) * Math.max(1, zoom); // width of the whole photo, in page units
  return photo.w / (shownW / unitsPerMm / MM_PER_INCH);
}

/** Dots per inch of a photo stretched over a box exactly (loose photos and picture stickers). */
export const fillDpi = (photo: Pixels, boxW: number, unitsPerMm: number): number => photo.w / (boxW / unitsPerMm / MM_PER_INCH);

export interface PhotoUse {
  assetId: string;
  /** What it is, for the warning: "the photo", "the photo slot", "the background picture". */
  what: string;
  dpi: (photo: Pixels, unitsPerMm: number, stage: { w: number; h: number }) => number;
}

/** Every photo on a page and how to work out its print resolution. */
export function photosOn(page: Page): PhotoUse[] {
  const uses: PhotoUse[] = [];
  if (page.background.assetId) uses.push({ assetId: page.background.assetId, what: 'the background picture', dpi: (photo, u, stage) => coverDpi(photo, stage, u) });
  for (const el of page.elements) {
    if (el.type === 'photo') uses.push({ assetId: el.assetId, what: 'a photo', dpi: (photo, u) => fillDpi(photo, el.w, u) });
    if (el.type === 'frame' && el.assetId) uses.push({ assetId: el.assetId, what: 'a photo slot', dpi: (photo, u) => coverDpi(photo, { w: el.w, h: el.h }, u, el.zoom) });
    if (el.type === 'sticker' && el.assetId) uses.push({ assetId: el.assetId, what: 'a picture sticker', dpi: (photo, u) => fillDpi(photo, el.w, u) });
  }
  return uses;
}

/** Parts that are there to be read or looked at: these should stay clear of the cut. Tape, stickers, lines, shapes and bands of colour may run to the edge. */
const matters = (el: PageElement): boolean => {
  if (el.type === 'tape' || el.type === 'sticker' || el.type === 'line' || el.type === 'shape') return false;
  if (el.type === 'box') return Boolean(el.title);
  return true;
};

/** A fair guess at how tall a part is whose height follows its content. */
function heightOf(el: PageElement): number {
  if (el.type === 'text') return el.text.split('\n').length * el.size * 1.2;
  if (el.type === 'checklist') return (el.title ? 56 : 0) + el.items.length * 50 + 24;
  if (el.type === 'tracker') return 320;
  return el.h;
}

/** The upright box around a part, turned as it is, in page units. */
export function boundsOf(el: PageElement): { x: number; y: number; w: number; h: number } {
  const h = heightOf(el);
  const t = (el.rotation * Math.PI) / 180;
  const w2 = (Math.abs(el.w * Math.cos(t)) + Math.abs(h * Math.sin(t))) / 2;
  const h2 = (Math.abs(el.w * Math.sin(t)) + Math.abs(h * Math.cos(t))) / 2;
  const cx = el.x + el.w / 2;
  const cy = el.y + h / 2;
  return { x: cx - w2, y: cy - h2, w: w2 * 2, h: h2 * 2 };
}

/**
 * How close (in millimetres) each part of a page comes to the cut line, for a
 * page placed on a print-ready sheet. Returns the parts closer than the safe
 * margin, with the distance; negative means it would be cut.
 */
export function nearTheCut(page: Page, placed: Placed<{ size: Page['size'] }>, trim: { x: number; y: number; w: number; h: number }, safe = SAFE): { id: string; type: PageElement['type']; distance: number }[] {
  const dims = PAGE_DIMS[page.size];
  const u = stageOf(placed).unitsPerMm;
  const c = placed.content;
  // how far the page's own edges are inside the cut, in the page's upright view
  const gap = placed.turned
    ? { left: trim.y + trim.h - (c.y + c.h), top: c.x - trim.x, right: c.y - trim.y, bottom: trim.x + trim.w - (c.x + c.w) }
    : { left: c.x - trim.x, top: c.y - trim.y, right: trim.x + trim.w - (c.x + c.w), bottom: trim.y + trim.h - (c.y + c.h) };
  const out: { id: string; type: PageElement['type']; distance: number }[] = [];
  for (const el of page.elements) {
    if (!matters(el)) continue;
    const b = boundsOf(el);
    const distance = Math.min(gap.left + b.x / u, gap.top + b.y / u, gap.right + (dims.w - b.x - b.w) / u, gap.bottom + (dims.h - b.y - b.h) / u);
    if (distance < safe - 1e-9) out.push({ id: el.id, type: el.type, distance: Math.round(distance * 10) / 10 });
  }
  return out;
}
