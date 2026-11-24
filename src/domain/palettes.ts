import { isDarkColor, type Page, type PageElement } from './pages';

// "Recolour page": one palette applied to every part of a page at once. A
// palette is a paper colour, an ink for lettering and lines, and a handful of
// accents that the headings, tapes, boxes, sticky notes and stickers take in
// turn, in the order the parts lie on the page.

export interface Palette {
  id: string;
  name: string;
  paper: string;
  ink: string;
  accents: string[];
}

export const PALETTES: Palette[] = [
  { id: 'sorbet', name: 'Sorbet', paper: '#FFFDF9', ink: '#3A2B47', accents: ['#F3A3BA', '#F8C19B', '#F6DB7D', '#A9DFC4', '#A8CDF2', '#C9B6F0'] },
  { id: 'meadow', name: 'Meadow', paper: '#F3F8EA', ink: '#2E4A35', accents: ['#A9DFC4', '#BFD6A0', '#F6DB7D', '#8FCF9E', '#D3E27E', '#F8C19B'] },
  { id: 'seaside', name: 'Seaside', paper: '#EEF6FB', ink: '#1F3F5C', accents: ['#A8CDF2', '#86D3CF', '#F6DB7D', '#86A9EA', '#C8E4F4', '#F59C8E'] },
  { id: 'berries', name: 'Berries', paper: '#FDF1F5', ink: '#5A1F3D', accents: ['#E88AC0', '#F3A3BA', '#B893DE', '#F08080', '#F8C19B', '#C9B6F0'] },
  { id: 'autumn', name: 'Autumn', paper: '#FBF3E6', ink: '#4A2F1E', accents: ['#F7AD6F', '#D9BC9E', '#F6DB7D', '#F59C8E', '#BFD6A0', '#C98A5B'] },
  { id: 'lavender', name: 'Lavender', paper: '#F5F1FC', ink: '#3A2B63', accents: ['#C9B6F0', '#B893DE', '#A8CDF2', '#F3A3BA', '#DCD2F5', '#86A9EA'] },
  { id: 'cocoa', name: 'Cocoa', paper: '#F4ECE3', ink: '#3E2A20', accents: ['#D9BC9E', '#C8A58A', '#F8C19B', '#E6D5C3', '#B98B6B', '#F6DB7D'] },
  { id: 'citrus', name: 'Citrus', paper: '#FFFBE8', ink: '#4A3A0F', accents: ['#F6DB7D', '#F7AD6F', '#D3E27E', '#F59C8E', '#A9DFC4', '#FFE9A8'] },
  { id: 'pebble', name: 'Pebble', paper: '#F3F3F1', ink: '#2F3338', accents: ['#C8C5D0', '#D9D9D4', '#B8C4CC', '#E3DED6', '#A9B4BD', '#D0C8C0'] },
  { id: 'midnight', name: 'Midnight', paper: '#2A2633', ink: '#FFFFFF', accents: ['#86A9EA', '#B893DE', '#F6DB7D', '#86D3CF', '#F3A3BA', '#A8CDF2'] },
];

/** A darker shade of an accent, for lines and outlines that have to show on the paper. */
const deepen = (hex: string, paper: string): string => {
  const n = parseInt(hex.slice(1), 16);
  // on dark paper a line shows best in the accent itself
  if (isDarkColor(paper)) return hex.toUpperCase();
  const k = 0.55;
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(c * k).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
};

/**
 * The page in a palette. The paper takes the palette's colour (its pattern and
 * any picture stay); lettering takes the ink; headings, tapes, filled boxes,
 * sticky notes and coloured stickers take the accents in turn; lines and
 * shapes take a deeper shade of theirs. Photos, emoji and writing stay as
 * they are, and so does anything that had no colour (a see-through box).
 */
export function recolour(page: Page, palette: Palette): Page {
  let turn = 0;
  const next = () => palette.accents[turn++ % palette.accents.length];
  const elements = page.elements.map((el): PageElement => {
    switch (el.type) {
      case 'text':
        return { ...el, color: palette.ink, ...(el.note ? { note: next(), color: isDarkColor(palette.paper) ? '#3A2B47' : palette.ink } : {}) };
      case 'checklist':
      case 'table':
      case 'writing':
      case 'month':
      case 'bookshelf':
      case 'tiles': {
        const { textColor: _t, ...rest } = el;
        return { ...rest, color: next() } as PageElement;
      }
      case 'tape':
        return { ...el, color: next() };
      case 'box':
        return el.fill && el.fill !== 'white' ? { ...el, fill: next() } : el;
      case 'sticker':
        return el.art ? { ...el, color: next() } : el;
      case 'line':
      case 'shape':
        return { ...el, color: deepen(next(), palette.paper) };
      default:
        return el;
    }
  });
  return { ...page, background: { ...page.background, color: palette.paper }, elements };
}
