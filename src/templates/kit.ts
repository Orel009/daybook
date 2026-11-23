import { LOCALE } from '../domain/dates';
import {
  BG_COLORS,
  newItem,
  newBook,
  type BookshelfElement,
  type BoxElement,
  type ChecklistElement,
  type FrameElement,
  type GridElement,
  type MonthElement,
  type PageBackground,
  type PageElement,
  type PageSize,
  type StickerElement,
  type TableElement,
  type TapeElement,
  type TapePattern,
  type TextElement,
  type TrackerElement,
  type WritingElement,
} from '../domain/pages';
import { TAPE_DEFAULT_COLOR, type ThemedTape } from '../domain/tapes';
import { newId } from '../domain/types';
import type { TemplateSubject } from './subjects';

// Ready-made pages. A template is a function that lays out ordinary page
// elements, so everything it makes can be moved, restyled or removed in the
// editor afterwards. Templates are built at the moment they are used, which is
// how they pick up today's date, the current month and the user's trackers.
//
// This file holds the helpers templates are written with. The templates
// themselves are in subjects/, one file per subject; library.ts gathers them.
// To add a template: write it with these helpers in its subject's file.

export interface TemplateContext {
  today: Date;
  weekStartsOn: number;
  /** Id of the tracker with this name, or '' when it doesn't exist yet (previews). */
  tracker: (name: string) => string;
  /** Ids of the user's active trackers, in their own order. */
  trackerIds: string[];
}

export interface BuiltInTemplate {
  id: string;
  subject: TemplateSubject;
  name: string;
  description: string;
  size: PageSize;
  /** Tracker presets (by name) this page shows. Missing ones are created on use. */
  needs?: string[];
  build: (ctx: TemplateContext) => { background?: PageBackground; elements: PageElement[] };
}

export const INK = '#3A2B47';
export const SOFT = '#6F6180';
export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const weekDays = (ctx: TemplateContext) => Array.from({ length: 7 }, (_, i) => DAYS[(ctx.weekStartsOn + i) % 7]);
export const longDate = (d: Date) => d.toLocaleDateString(LOCALE, { weekday: 'long', month: 'long', day: 'numeric' });
export const monthName = (d: Date) => d.toLocaleDateString(LOCALE, { month: 'long' });
export const weekStart = (ctx: TemplateContext) => {
  const d = new Date(ctx.today);
  d.setDate(d.getDate() - ((d.getDay() - ctx.weekStartsOn + 7) % 7));
  return d.toLocaleDateString(LOCALE, { month: 'long', day: 'numeric' });
};

// ----- layout helpers (all sizes in page units: 900×1200 tall, 1200×900 wide)

export const title = (x: number, y: number, w: number, text: string, o: Partial<TextElement> = {}): TextElement => ({
  id: newId(), type: 'text', x, y, w, h: 80, rotation: 0, text, font: 'hand', size: 76, color: INK, align: 'left', ...o,
});
export const sub = (x: number, y: number, w: number, text: string): TextElement => title(x, y, w, text, { font: 'clean', size: 30, color: SOFT });
export const list = (x: number, y: number, w: number, heading: string, color: string, items: number | string[]): ChecklistElement => ({
  id: newId(), type: 'checklist', x, y, w, h: 200, rotation: 0, title: heading, color,
  items: typeof items === 'number' ? Array.from({ length: items }, () => newItem()) : items.map((t) => newItem(t)),
});
export const table = (x: number, y: number, w: number, h: number, heading: string, color: string, cols: string[], rows: string[]): TableElement => ({
  id: newId(), type: 'table', x, y, w, h, rotation: 0, title: heading, color, cols, rows, cells: {},
});
export const write = (x: number, y: number, w: number, h: number, heading: string, color: string, lined = true): WritingElement => ({
  id: newId(), type: 'writing', x, y, w, h, rotation: 0, title: heading, color, text: '', lined,
});
export const box = (x: number, y: number, w: number, h: number, heading: string, rotation = 0): BoxElement => ({
  id: newId(), type: 'box', x, y, w, h, rotation, fill: 'white', border: 'dashed', title: heading,
});
/** A photo slot: tap it to add a photo. */
export const frame = (x: number, y: number, w: number, h: number, rotation = 0, o: Partial<FrameElement> = {}): FrameElement => ({
  id: newId(), type: 'frame', x, y, w, h, rotation, style: 'plain', ...o,
});
export const month = (x: number, y: number, w: number, h: number, color: string, d: Date): MonthElement => ({
  id: newId(), type: 'month', x, y, w, h, rotation: 0, color, year: d.getFullYear(), month: d.getMonth(), notes: {},
});
export const tape = (x: number, y: number, w: number, color: string, pattern: TapePattern, rotation = -3): TapeElement => ({
  id: newId(), type: 'tape', x, y, w, h: 46, rotation, color, pattern, edge: 'torn',
});
export const art = (x: number, y: number, size: number, id: string, color?: string, rotation = 0): StickerElement => ({
  id: newId(), type: 'sticker', x, y, w: size, h: size, rotation, emoji: '', art: id, color,
});
export const track = (x: number, y: number, w: number, trackerId: string, o: Partial<TrackerElement> = {}): TrackerElement => ({
  id: newId(), type: 'tracker', x, y, w, h: 400, rotation: 0, trackerId, ...o,
});
export const shelf = (x: number, y: number, w: number, h: number, books: number, perShelf: number, heading = ''): BookshelfElement => ({
  id: newId(), type: 'bookshelf', x, y, w, h, rotation: 0, title: heading, color: 'tan', perShelf, books: Array.from({ length: books }, (_, i) => newBook(i)),
});
export const blank = (n: number) => Array.from({ length: n }, () => '');
/** The numbers 1 to n as labels. */
export const numbered = (n: number, from = 1) => Array.from({ length: n }, (_, i) => String(from + i));
/** A band of colour across the page (a box without a line). */
export const band = (x: number, y: number, w: number, h: number, color: string, rotation = 0): BoxElement => ({ ...box(x, y, w, h, '', rotation), fill: color, border: 'none' });
/** A white card with a line around it, for putting text and stickers on. */
export const card = (x: number, y: number, w: number, h: number, rotation = 0, o: Partial<BoxElement> = {}): BoxElement => ({ ...box(x, y, w, h, '', rotation), border: 'solid', ...o });
/** A small label in the plain lettering. */
export const label = (x: number, y: number, w: number, text: string, o: Partial<TextElement> = {}): TextElement => title(x, y, w, text, { font: 'clean', size: 26, color: SOFT, ...o });
/** A sticky note with a few words on it. */
export const sticky = (x: number, y: number, w: number, text: string, color: string, rotation = 0, o: Partial<TextElement> = {}): TextElement =>
  title(x, y, w, text, { font: 'script', size: 40, align: 'center', note: color, rotation, ...o });
/** The first day of month `m` (0 to 11): this year if the month hasn't passed, otherwise next year. */
export const monthDate = (today: Date, m: number): Date => new Date(today.getFullYear() + (m < today.getMonth() ? 1 : 0), m, 1);
/** The first day of the month `n` months after today's. */
export const monthsAhead = (today: Date, n: number): Date => new Date(today.getFullYear(), today.getMonth() + n, 1);
export const shortDays = (ctx: TemplateContext) => weekDays(ctx).map((d) => d.slice(0, 3));

export const paper = (index: number, pattern: PageBackground['pattern'] = 'dots'): PageBackground => ({ color: BG_COLORS[index], pattern });

/** Tiles for bingo cards and challenges: labels are printed, the rest is written in Edit. */
export const tiles = (x: number, y: number, w: number, h: number, heading: string, color: string, cols: number, labels: number | string[], o: Partial<GridElement> = {}): GridElement => ({
  id: newId(), type: 'tiles', x, y, w, h, rotation: 0, title: heading, color, cols, mark: 'cross',
  tiles: typeof labels === 'number' ? Array.from({ length: labels }, () => ({})) : labels.map((label) => (label ? { label } : {})),
  ...o,
});
/** A themed washi tape in its own colour (kraft is brown, lemons are on teal…). */
export const themed = (x: number, y: number, w: number, pattern: ThemedTape, rotation = -3, o: Partial<TapeElement> = {}): TapeElement => ({ ...tape(x, y, w, TAPE_DEFAULT_COLOR[pattern], pattern, rotation), ...o });
/** A row of stars (or hearts, drops…) to tap, without a panel: a rating. Tapping the fourth marks four. */
export const rating = (x: number, y: number, w: number, color = 'butter', shape: GridElement['shape'] = 'star', n = 5): GridElement => ({
  id: newId(), type: 'tiles', x, y, w, h: Math.round(w / n), rotation: 0, title: '', color, cols: n, tiles: Array.from({ length: n }, () => ({})), mark: 'fill', shape, bare: true, inOrder: true,
});
/** A challenge to colour in: tiles in a shape or a picture, with a progress count. */
export const challenge = (x: number, y: number, w: number, h: number, heading: string, color: string, cols: number, labels: number | string[], o: Partial<GridElement> = {}): GridElement =>
  tiles(x, y, w, h, heading, color, cols, labels, { mark: 'fill', count: true, ...o });
/** A photo slot held by a strip of tape. */
export const photoSpot = (x: number, y: number, w: number, h: number, rotation: number, color: string, pattern: TapePattern, o: Partial<FrameElement> = {}): PageElement[] => [
  frame(x, y, w, h, rotation, o),
  tape(x + w / 2 - 70, y - 18, 140, color, pattern, -rotation),
];
