import { newId } from './types';
import type { BoxElement, Page, PageBackground, PageElement, StickerElement, TapeElement, TapePattern, TextElement, TextFont } from './pages';

// The book's covers. A cover is an ordinary page (900×1200) with a role, so
// it is edited with the normal editor and syncs like any page. Until one is
// made, the book draws its built-in cover; `standardCover` is that same look
// as a page, and the presets are other designs to start from.

const INK = '#3A2B47';

const text = (x: number, y: number, w: number, value: string, font: TextFont, size: number, color: string, rotation = 0): TextElement => ({
  id: newId(), type: 'text', x, y, w, h: 80, rotation, text: value, font, size, color, align: 'center',
});
const label = (x: number, y: number, w: number, h: number, rotation = 0, fill = 'white', border: BoxElement['border'] = 'solid'): BoxElement => ({
  id: newId(), type: 'box', x, y, w, h, rotation, fill, border, title: '', shadow: true,
});
const tape = (x: number, y: number, w: number, h: number, color: string, pattern: TapePattern, rotation = 0, edge: TapeElement['edge'] = 'straight'): TapeElement => ({
  id: newId(), type: 'tape', x, y, w, h, rotation, color, pattern, edge,
});
const art = (x: number, y: number, size: number, id: string, color?: string, rotation = 0): StickerElement => ({
  id: newId(), type: 'sticker', x, y, w: size, h: size, rotation, emoji: '', art: id, color,
});

export interface CoverDesign {
  background: PageBackground;
  spine?: string;
  elements: PageElement[];
}

const names = (owner: string) => ({ whose: owner.trim() ? `${owner.trim()}’s` : 'My', book: 'Daybook' });

/** The built-in front cover, as a page: same colour, tape and title. */
export function standardCover(owner: string, color: string): CoverDesign {
  const n = names(owner);
  return {
    background: { color, pattern: 'cover' },
    elements: [
      tape(297, 108, 306, 60, 'butter', 'stripes', -4),
      label(200, 449, 500, 250, -2),
      text(200, 503, 500, n.whose, 'hand', 46, INK, -2),
      { ...text(200, 558, 500, n.book, 'hand', 76, INK, -2), bold: true },
    ],
  };
}

export const COVER_PRESETS = [
  { id: 'classic', name: 'Classic', swatch: '#F3A3BA' },
  { id: 'linen', name: 'Linen', swatch: '#E9E1D3' },
  { id: 'leather', name: 'Leather', swatch: '#6B4A3A' },
  { id: 'kraft', name: 'Kraft', swatch: '#CFAE86' },
  { id: 'floral', name: 'Floral', swatch: '#FDE4EC' },
  { id: 'pastel', name: 'Pastel', swatch: '#E4DCFA' },
  { id: 'night', name: 'Night sky', swatch: '#262B4A' },
] as const;
export type CoverPreset = (typeof COVER_PRESETS)[number]['id'];

/** Paper and spine of a preset: all a back cover needs. */
const LOOK: Record<CoverPreset, { background: PageBackground; spine?: string }> = {
  classic: { background: { color: '#F3A3BA', pattern: 'cover' } },
  linen: { background: { color: '#E9E1D3', pattern: 'linen' }, spine: '#B7A58B' },
  leather: { background: { color: '#6B4A3A', pattern: 'leather' }, spine: '#4A3226' },
  kraft: { background: { color: '#CFAE86', pattern: 'kraft' }, spine: '#8C6B4A' },
  floral: { background: { color: '#FDE4EC', pattern: 'floral' }, spine: '#E88AC0' },
  pastel: { background: { color: '#E4DCFA', pattern: 'pastel' }, spine: '#B893DE' },
  night: { background: { color: '#262B4A', pattern: 'night' }, spine: '#15182E' },
};

/** A front cover to start from. `accent` is the app theme's colour, used by Classic. */
export function coverPreset(id: CoverPreset, owner: string, accent: string): CoverDesign {
  const n = names(owner);
  const look = LOOK[id];
  switch (id) {
    case 'classic':
      return standardCover(owner, accent);
    case 'linen':
      return {
        ...look,
        elements: [
          tape(120, 150, 660, 40, 'tan', 'doily'),
          label(210, 420, 480, 290),
          text(210, 462, 480, n.whose, 'elegant', 50, INK),
          text(210, 534, 480, n.book, 'elegant', 92, INK),
          art(400, 800, 100, 'leaf', 'sage', 20),
          tape(120, 1000, 660, 40, 'tan', 'doily'),
        ],
      };
    case 'leather':
      return {
        ...look,
        elements: [
          tape(110, 170, 680, 26, 'butter', 'foil'),
          tape(110, 210, 680, 10, 'butter', 'foil'),
          text(150, 440, 600, n.whose, 'elegant', 56, '#EFD08A'),
          text(100, 520, 700, n.book, 'elegant', 124, '#EFD08A'),
          art(410, 790, 80, 'star', 'butter'),
          tape(110, 970, 680, 10, 'butter', 'foil'),
          tape(110, 994, 680, 26, 'butter', 'foil'),
        ],
      };
    case 'kraft':
      return {
        ...look,
        elements: [
          tape(-20, 120, 940, 44, 'grey', 'airmail'),
          label(190, 390, 520, 320, -2),
          text(190, 438, 520, n.whose, 'typewriter', 44, INK, -2),
          text(190, 514, 520, n.book, 'typewriter', 84, INK, -2),
          tape(350, 366, 200, 50, 'butter', 'stripes', -5, 'torn'),
          art(610, 700, 130, 'plane', 'sky', -12),
          art(170, 760, 120, 'camera', 'lilac', 10),
          tape(-20, 1040, 940, 44, 'grey', 'airmail'),
        ],
      };
    case 'floral':
      return {
        ...look,
        elements: [
          label(190, 400, 520, 310, -1),
          text(190, 446, 520, n.whose, 'cursive', 56, '#B03A6B', -1),
          text(190, 522, 520, n.book, 'cursive', 104, '#B03A6B', -1),
          tape(330, 376, 240, 50, 'rose', 'daisies', -3, 'torn'),
          art(110, 250, 150, 'daisy', 'lilac', -10),
          art(650, 300, 130, 'tulip', 'rose', 12),
          art(640, 780, 150, 'daisy', 'butter', 14),
          art(130, 800, 130, 'butterfly', 'lilac', -12),
        ],
      };
    case 'pastel':
      return {
        ...look,
        elements: [
          art(330, 190, 240, 'rainbow'),
          label(200, 420, 500, 290, 2),
          text(200, 458, 500, n.whose, 'round', 50, '#6B45B0', 2),
          text(200, 528, 500, n.book, 'round', 92, '#6B45B0', 2),
          art(120, 330, 110, 'cloud', 'sky', -6),
          art(680, 360, 100, 'star', 'butter', 14),
          art(150, 820, 110, 'heart', 'rose', -12),
          art(650, 800, 120, 'sparkle', 'butter', 8),
          tape(300, 1010, 300, 50, 'lilac', 'rainbow', -2, 'torn'),
        ],
      };
    case 'night':
      return {
        ...look,
        elements: [
          art(560, 170, 200, 'moon', 'butter', 12),
          art(170, 250, 90, 'star', 'butter', -10),
          art(330, 180, 60, 'sparkle', 'butter'),
          text(150, 470, 600, n.whose, 'hand', 60, '#FFFFFF'),
          text(100, 550, 700, n.book, 'hand', 128, '#FFFFFF'),
          art(130, 800, 80, 'sparkle', 'butter', 10),
          art(690, 760, 100, 'star', 'butter', 16),
          art(420, 880, 60, 'star', 'peach', -8),
        ],
      };
  }
}

/** Paper and spine only, for the back cover. */
export const backPreset = (id: CoverPreset, accent: string): CoverDesign => ({
  ...(id === 'classic' ? { background: { color: accent, pattern: 'cover' as const } } : LOOK[id]),
  elements: [],
});

export const SPINE_COLORS = ['#3A2B47', '#6B4A3A', '#8C6B4A', '#B7A58B', '#E88AC0', '#F08080', '#F7AD6F', '#F6DB7D', '#8FCF9E', '#86D3CF', '#86A9EA', '#B893DE', '#15182E', '#FFFDF9'];

/** A cover page for the book. */
export function coverPage(role: 'cover' | 'back', design: CoverDesign): Page {
  const now = new Date().toISOString();
  return {
    id: newId(),
    title: role === 'cover' ? 'Front cover' : 'Back cover',
    size: 'portrait',
    background: design.background,
    spine: design.spine,
    elements: design.elements,
    isTemplate: false,
    role,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
  };
}

/** The back cover that goes with a front cover, until the back gets a page of its own. */
export const matchingBack = (front: Page): Page => ({ ...front, id: `${front.id}-back`, role: 'back', title: 'Back cover', elements: [] });
