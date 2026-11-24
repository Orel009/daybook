import { PAGE_DIMS, type PageElement, type PageSize } from './pages';
import { newId } from './types';

// Working with several parts at once: lining them up, spacing them evenly,
// moving them together, and carrying them from one page to another (the
// clipboard, and saved blocks). Numbers only: where a part's real height
// follows its content, the editor measures it and passes it in as `h`.

export interface Box {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Align = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

/** The box around several boxes. */
export function around(boxes: Pick<Box, 'x' | 'y' | 'w' | 'h'>[]): { x: number; y: number; w: number; h: number } {
  const x = Math.min(...boxes.map((b) => b.x));
  const y = Math.min(...boxes.map((b) => b.y));
  return { x, y, w: Math.max(...boxes.map((b) => b.x + b.w)) - x, h: Math.max(...boxes.map((b) => b.y + b.h)) - y };
}

/** New positions that line the parts up: by an edge of the box around them, or through its middle. Only what changes is returned. */
export function alignBoxes(boxes: Box[], how: Align): { id: string; x?: number; y?: number }[] {
  if (boxes.length < 2) return [];
  const all = around(boxes);
  return boxes
    .map((b) => {
      switch (how) {
        case 'left':
          return { id: b.id, x: all.x };
        case 'center':
          return { id: b.id, x: Math.round(all.x + (all.w - b.w) / 2) };
        case 'right':
          return { id: b.id, x: all.x + all.w - b.w };
        case 'top':
          return { id: b.id, y: all.y };
        case 'middle':
          return { id: b.id, y: Math.round(all.y + (all.h - b.h) / 2) };
        default:
          return { id: b.id, y: all.y + all.h - b.h };
      }
    })
    .filter((p) => {
      const b = boxes.find((x) => x.id === p.id)!;
      return (p.x !== undefined && p.x !== b.x) || (p.y !== undefined && p.y !== b.y);
    });
}

/**
 * New positions that put the same gap between the parts, across or down. The
 * first and the last stay where they are; it takes at least three.
 */
export function distributeBoxes(boxes: Box[], axis: 'across' | 'down'): { id: string; x?: number; y?: number }[] {
  if (boxes.length < 3) return [];
  const pos = (b: Box) => (axis === 'across' ? b.x : b.y);
  const size = (b: Box) => (axis === 'across' ? b.w : b.h);
  const sorted = [...boxes].sort((a, b) => pos(a) - pos(b) || a.id.localeCompare(b.id));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const room = pos(last) + size(last) - pos(first) - sorted.reduce((n, b) => n + size(b), 0);
  const gap = room / (sorted.length - 1);
  const out: { id: string; x?: number; y?: number }[] = [];
  let at = pos(first) + size(first) + gap;
  for (const b of sorted.slice(1, -1)) {
    const to = Math.round(at);
    if (to !== pos(b)) out.push(axis === 'across' ? { id: b.id, x: to } : { id: b.id, y: to });
    at += size(b) + gap;
  }
  return out;
}

/**
 * How far a group may move by (dx, dy) so that the box around it stays at
 * least half on the sheet, like a single part being dragged.
 */
export function clampMove(boxes: Pick<Box, 'x' | 'y' | 'w' | 'h'>[], dx: number, dy: number, size: PageSize): { dx: number; dy: number } {
  const all = around(boxes);
  const d = PAGE_DIMS[size];
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  return { dx: clamp(all.x + dx, -all.w / 2, d.w - all.w / 2) - all.x, dy: clamp(all.y + dy, -all.h / 2, d.h - all.h / 2) - all.y };
}

// ----- carrying parts: the clipboard and saved blocks

/** The parts moved as a group so the box around them starts at the top left: how a block or a copy is kept. */
export function gathered(parts: PageElement[]): PageElement[] {
  if (!parts.length) return [];
  const all = around(parts);
  return parts.map((p) => ({ ...p, x: p.x - all.x, y: p.y - all.y }));
}

/**
 * Parts put onto a page: as a group in the middle of the sheet (or at their
 * old place moved a little, when `near` gives where they came from), with new
 * ids, never locked, and never off the sheet.
 */
export function placed(parts: PageElement[], size: PageSize, near?: { x: number; y: number }): PageElement[] {
  if (!parts.length) return [];
  const all = around(parts);
  const d = PAGE_DIMS[size];
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(Math.max(lo, hi), v));
  const x = clamp(near ? near.x + 36 : (d.w - all.w) / 2, 0, d.w - all.w);
  const y = clamp(near ? near.y + 36 : (d.h - all.h) / 2.4, 0, d.h - all.h);
  return parts.map((p) => {
    const { locked: _locked, ...rest } = p;
    return { ...rest, id: newId(), x: Math.round(p.x - all.x + x), y: Math.round(p.y - all.y + y) } as PageElement;
  });
}

const CLIP_KEY = 'daybook.clipboard';

/** Parts copied to paste on another page. Kept on this device: a convenience, not part of the book. */
export function copyParts(parts: PageElement[]): void {
  try {
    localStorage.setItem(CLIP_KEY, JSON.stringify({ at: around(parts), parts: gathered(parts) }));
  } catch {
    /* nowhere to keep it */
  }
}

export function copiedParts(): { parts: PageElement[]; at: { x: number; y: number } } | null {
  try {
    const kept = JSON.parse(localStorage.getItem(CLIP_KEY) ?? 'null');
    if (!kept || !Array.isArray(kept.parts) || kept.parts.length === 0) return null;
    return { parts: kept.parts as PageElement[], at: { x: Number(kept.at?.x) || 0, y: Number(kept.at?.y) || 0 } };
  } catch {
    return null;
  }
}
