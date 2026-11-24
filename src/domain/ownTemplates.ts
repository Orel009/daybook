import { LOCALE } from './dates';
import { newId } from './types';
import type { FrameElement, Page, PageElement } from './pages';

// Her own templates: what "Save as a template" keeps, and what using one
// gives. A template of her own is an ordinary page with `isTemplate` set, so
// it is edited in the same editor and syncs like any page.

/** A page that is one of her templates (covers and saved blocks are something else). */
export const isOwnTemplate = (p: Pick<Page, 'isTemplate' | 'role'>): boolean => p.isTemplate && !p.role;
/** A saved block: a few parts kept to drop onto any page ("My blocks"). */
export const isBlock = (p: Pick<Page, 'role'>): boolean => p.role === 'block';

/** The subject her templates go under when she hasn't chosen one. */
export const NO_SUBJECT = 'My templates';

const emptied = (el: PageElement): PageElement => {
  switch (el.type) {
    case 'writing':
      return { ...el, text: '' };
    case 'checklist':
      return { ...el, items: el.items.map((i) => ({ ...i, done: false })) };
    case 'table':
      return { ...el, cells: {} };
    case 'month':
      return { ...el, notes: {} };
    case 'bookshelf':
      return { ...el, books: el.books.map((b) => ({ ...b, title: '', read: false })) };
    case 'tiles':
      return { ...el, tiles: el.tiles.map((t) => ({ ...(t.label ? { label: t.label } : {}) })) };
    case 'frame': {
      const { assetId: _a, zoom: _z, panX: _x, panY: _y, ...slot } = el;
      return slot;
    }
    case 'photo': {
      // a loose photo becomes an empty slot of the same size, so the layout keeps its place for a photo
      const slot: FrameElement = { id: el.id, type: 'frame', x: el.x, y: el.y, w: el.w, h: el.h, rotation: el.rotation, style: el.frame === 'polaroid' ? 'polaroid' : 'plain' };
      if (el.locked) slot.locked = true;
      return slot;
    }
    default:
      return el;
  }
};

/**
 * "Keep only the layout": what was written, ticked, marked, rated and the
 * photos are cleared; the parts themselves, their headings, printed labels,
 * titles, stickers and tape stay. Photos leave an empty photo slot behind.
 */
export const layoutOnly = (page: Page): Page => ({ ...page, elements: page.elements.map(emptied) });

export interface TemplateDetails {
  name: string;
  subject: string;
  description: string;
  /** Keep what was written on the page, or only its layout. */
  keep: 'all' | 'layout';
  /** The month and year in its titles follow the date the template is used on. */
  followDate: boolean;
}

/** The template a page becomes with these details (not yet saved; ids are new). */
export function templateFrom(page: Page, d: TemplateDetails, today: Date, sortOrder: number): Page {
  const source = d.keep === 'layout' ? layoutOnly(page) : page;
  const now = today.toISOString();
  const { role: _r, spine: _s, hideCount: _h, editedAt: _e, autoDate: _d, description: _desc, subject: _subj, ...rest } = source;
  const made: Page = {
    ...rest,
    id: newId(),
    title: d.name.trim() || page.title || 'Untitled template',
    isTemplate: true,
    sortOrder,
    background: { ...source.background },
    elements: source.elements.map((e) => ({ ...e, id: newId() })),
    createdAt: now,
    updatedAt: now,
  };
  if (d.subject.trim()) made.subject = d.subject.trim();
  if (d.description.trim()) made.description = d.description.trim();
  if (d.followDate) made.autoDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  return made;
}

const monthNames = (style: 'long' | 'short') => Array.from({ length: 12 }, (_, m) => new Date(2000, m, 1).toLocaleDateString(LOCALE, { month: style }));
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** A text with the month and year it was written in replaced by another month and year. Whole words only. */
export function redateText(text: string, from: { year: number; month: number }, to: { year: number; month: number }): string {
  let out = text;
  for (const style of ['long', 'short'] as const) {
    const names = monthNames(style);
    // "May" is the same long and short: once is enough
    if (style === 'short' && names[from.month] === monthNames('long')[from.month]) continue;
    out = out.replace(new RegExp(`(?<![\\p{L}\\d])${escape(names[from.month])}(?![\\p{L}\\d])`, 'gu'), names[to.month]);
  }
  return out.replace(new RegExp(`(?<!\\d)${from.year}(?!\\d)`, 'g'), String(to.year));
}

/**
 * The page a template of hers gives when it is used on `today`. The details
 * that belong to the template (its description, the date switch) are left
 * behind. With the date switch on, the month and year in its title, texts and
 * headings move from the month it was saved in to this month, and month parts
 * and tracker parts pinned to a month or year move with them.
 */
export function pageFromOwnTemplate(template: Page, today: Date): Page {
  const { description: _d, autoDate, ...page } = template;
  const match = /^(\d{4})-(\d{2})$/.exec(autoDate ?? '');
  if (!match) return page;
  const from = { year: Number(match[1]), month: Number(match[2]) - 1 };
  const to = { year: today.getFullYear(), month: today.getMonth() };
  const shift = (to.year - from.year) * 12 + (to.month - from.month);
  const re = (s: string) => redateText(s, from, to);
  return {
    ...page,
    title: re(page.title),
    elements: page.elements.map((el): PageElement => {
      if (el.type === 'text') return { ...el, text: re(el.text) };
      if (el.type === 'month') {
        const moved = new Date(el.year, el.month + shift, 1);
        return { ...el, year: moved.getFullYear(), month: moved.getMonth() };
      }
      // a tracker part pinned to a month or a year moves with the page
      if (el.type === 'tracker' && el.year !== undefined) {
        if (el.month === undefined) return { ...el, year: el.year + (to.year - from.year) };
        const moved = new Date(el.year, el.month + shift, 1);
        return { ...el, year: moved.getFullYear(), month: moved.getMonth() };
      }
      if ('title' in el && typeof el.title === 'string') return { ...el, title: re(el.title) } as PageElement;
      return el;
    }),
  };
}

/** Her own subjects: the ones her templates are filed under that aren't among the ready-made subjects, in A to Z order. */
export const ownSubjects = (pages: Pick<Page, 'isTemplate' | 'role' | 'subject'>[], builtIn: readonly string[]): string[] =>
  [...new Set(pages.filter(isOwnTemplate).map((p) => p.subject ?? '').filter((s) => s && !builtIn.includes(s)))].sort((a, b) => a.localeCompare(b));
