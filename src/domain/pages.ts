import { newId } from './types';

// Scrapbook pages. A page is a fixed-size sheet measured in page units; the
// screen scales the whole sheet to fit, so a layout looks the same on a phone
// and a tablet. Three things stay separate:
//   layout   – each element's x, y, w, rotation and order in `elements`
//   content  – the element's own props (text, photo asset, tracker id…)
//   data     – tracker widgets only hold a trackerId and always show live data

export type PageSize = 'portrait' | 'landscape';

export const PAGE_DIMS: Record<PageSize, { w: number; h: number }> = {
  portrait: { w: 900, h: 1200 },
  landscape: { w: 1200, h: 900 },
};

export type PagePattern = 'dots' | 'grid' | 'lines' | 'plain';

export interface PageBackground {
  color: string; // hex
  pattern: PagePattern;
  assetId?: string; // optional photo covering the page
}

interface ElementBase {
  id: string;
  x: number;
  y: number;
  w: number;
  /** Ignored for text and tracker elements: their height follows their content. */
  h: number;
  rotation: number; // degrees
}

// Lettering styles for journal text. To add one: bundle the font in main.tsx
// and add a line here. Saved pages only store the id.
export const TEXT_FONTS = [
  { id: 'hand', name: 'Handwritten', family: 'var(--font-display)', weight: 600 },
  { id: 'script', name: 'Quick note', family: "'Caveat', cursive", weight: 700 },
  { id: 'cursive', name: 'Cursive', family: "'Dancing Script', cursive", weight: 700 },
  { id: 'brush', name: 'Brush', family: "'Pacifico', cursive", weight: 400 },
  { id: 'tall', name: 'Tall caps', family: "'Amatic SC', sans-serif", weight: 700 },
  { id: 'marker', name: 'Marker', family: "'Permanent Marker', cursive", weight: 400 },
  { id: 'round', name: 'Rounded', family: "'Fredoka', sans-serif", weight: 600 },
  { id: 'clean', name: 'Clean', family: 'var(--font-body)', weight: 600 },
  { id: 'elegant', name: 'Elegant', family: "'Playfair Display', Georgia, serif", weight: 600 },
  { id: 'classic', name: 'Classic', family: "Georgia, 'Times New Roman', serif", weight: 600 },
  { id: 'typewriter', name: 'Typewriter', family: "'Special Elite', 'Courier New', monospace", weight: 400 },
  { id: 'pixel', name: 'Pixel', family: "'Press Start 2P', monospace", weight: 400 },
] as const;
export type TextFont = (typeof TEXT_FONTS)[number]['id'];
export const fontOf = (id: string) => TEXT_FONTS.find((f) => f.id === id) ?? TEXT_FONTS[0];

export interface TextElement extends ElementBase {
  type: 'text';
  text: string;
  font: TextFont;
  size: number;
  color: string; // hex
  align: 'left' | 'center' | 'right';
  note?: string; // sticky-note colour (key of TAPE_COLORS), or none
}

export interface PhotoElement extends ElementBase {
  type: 'photo';
  assetId: string;
  frame: 'none' | 'border' | 'polaroid';
  shadow: boolean;
}

/** One of three kinds: an emoji, a built-in drawn sticker (`art`), or the user's own picture (`assetId`). */
export interface StickerElement extends ElementBase {
  type: 'sticker';
  emoji: string;
  art?: string; // id in stickers/drawn.tsx
  color?: string; // drawn stickers: key of TAPE_COLORS
  assetId?: string; // "My stickers"
}

export const TAPE_PATTERNS = [
  { id: 'stripes', name: 'Stripes' },
  { id: 'diagonal', name: 'Diagonal stripes' },
  { id: 'candy', name: 'Candy stripes' },
  { id: 'dots', name: 'Polka dots' },
  { id: 'gingham', name: 'Gingham' },
  { id: 'plaid', name: 'Plaid' },
  { id: 'checker', name: 'Checkerboard' },
  { id: 'grid', name: 'Grid' },
  { id: 'chevron', name: 'Zigzag' },
  { id: 'waves', name: 'Waves' },
  { id: 'triangles', name: 'Triangles' },
  { id: 'cross', name: 'Little crosses' },
  { id: 'hearts', name: 'Hearts' },
  { id: 'stars', name: 'Stars' },
  { id: 'flowers', name: 'Flowers' },
  { id: 'leaves', name: 'Leaves' },
  { id: 'snow', name: 'Snowflakes' },
  { id: 'confetti', name: 'Confetti' },
  { id: 'stitch', name: 'Stitched' },
  { id: 'lace', name: 'Scalloped lace' },
  { id: 'ombre', name: 'Fade' },
  { id: 'rainbow', name: 'Rainbow' },
  { id: 'plain', name: 'Plain' },
] as const;
export type TapePattern = (typeof TAPE_PATTERNS)[number]['id'];

export const TAPE_EDGES = [
  { id: 'torn', name: 'Torn' },
  { id: 'straight', name: 'Straight' },
  { id: 'notched', name: 'Ribbon' },
  { id: 'pointed', name: 'Pointed' },
] as const;
export type TapeEdge = (typeof TAPE_EDGES)[number]['id'];

export interface TapeElement extends ElementBase {
  type: 'tape';
  color: string; // key of TAPE_COLORS
  pattern: TapePattern;
  edge?: TapeEdge;
  sheer?: boolean; // see-through, like real washi over a photo
}

export interface TrackerElement extends ElementBase {
  type: 'tracker';
  trackerId: string;
  /** Draw with this look instead of the tracker's own (e.g. always 'pixels'). */
  look?: string;
  /** Full version with its colour key and week/month/year switch, not the small widget. */
  full?: boolean;
}

// ----- parts that are filled in while viewing a page (no edit mode needed)

/** A frame or coloured panel for grouping things, with an optional heading. */
export interface BoxElement extends ElementBase {
  type: 'box';
  fill?: string; // key of TAPE_COLORS, 'white', or none for see-through
  border: 'solid' | 'dashed' | 'none';
  title?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface ChecklistElement extends ElementBase {
  type: 'checklist';
  title: string;
  color: string; // heading colour, key of TAPE_COLORS
  items: ChecklistItem[];
}

export interface TableElement extends ElementBase {
  type: 'table';
  title: string;
  color: string;
  cols: string[]; // column headings
  rows: string[]; // row labels (may be empty strings for unlabeled rows)
  cells: Record<string, string>; // "row:col" -> text
}

export interface WritingElement extends ElementBase {
  type: 'writing';
  title: string;
  color: string;
  text: string;
  lined: boolean;
}

export interface MonthElement extends ElementBase {
  type: 'month';
  color: string;
  year: number;
  month: number; // 0–11
  notes: Record<string, string>; // day of month -> text
}

export interface ShelfBook {
  id: string;
  title: string;
  color: string; // key of TAPE_COLORS
  read: boolean;
}

/** Rows of blank book spines to write titles on. */
export interface BookshelfElement extends ElementBase {
  type: 'bookshelf';
  title: string;
  color: string;
  books: ShelfBook[];
  perShelf: number;
}

export type PageElement =
  | BookshelfElement
  | TextElement
  | PhotoElement
  | StickerElement
  | TapeElement
  | TrackerElement
  | BoxElement
  | ChecklistElement
  | TableElement
  | WritingElement
  | MonthElement;

/** Parts that respond to taps and typing when the page is being viewed. */
export const isFillable = (el: PageElement): boolean =>
  el.type === 'tracker' || el.type === 'checklist' || el.type === 'table' || el.type === 'writing' || el.type === 'month' || el.type === 'bookshelf';

export interface Page {
  id: string;
  title: string;
  size: PageSize;
  background: PageBackground;
  /** Back to front: later elements are drawn on top. */
  elements: PageElement[];
  /** Templates live in the template library and are copied when used. */
  isTemplate: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string; // tombstone, kept so the delete reaches other devices
}

/** Elements whose height is decided by their content, not by `h`. */
export const autoHeight = (el: PageElement): boolean => el.type === 'text' || el.type === 'tracker' || el.type === 'checklist';

export const BG_COLORS = ['#FFFDF9', '#FFFFFF', '#FDEFF3', '#FFF1E4', '#FFF8D9', '#EEF6E2', '#E4F4EC', '#E6F0FB', '#F0EAFB', '#F2EDE7', '#2A2633'];

export const TEXT_COLORS = ['#3A2B47', '#6F6180', '#B03A6B', '#B5383F', '#B8601C', '#2F7A4D', '#1E7A78', '#2F5FB0', '#6B45B0', '#FFFFFF'];

export const PATTERNS: { id: PagePattern; name: string }[] = [
  { id: 'dots', name: 'Dots' },
  { id: 'grid', name: 'Grid' },
  { id: 'lines', name: 'Lines' },
  { id: 'plain', name: 'Plain' },
];

// Sticker sets. Each is a named group of emoji; add a set or an emoji here and
// it shows up in the picker.
export const STICKER_SETS: { id: string; name: string; stickers: string[] }[] = [
  { id: 'doodles', name: 'Doodles', stickers: [] },
  { id: 'favourites', name: 'Favourites', stickers: ['🌸', '⭐', '✨', '❤️', '🌈', '☀️', '🌙', '🦋', '🎀', '💌', '📌', '📎', '✏️', '📷', '🎉', '🏠'] },
  { id: 'coffee', name: 'Coffee', stickers: ['☕', '🍵', '🫖', '🧋', '🥛', '🥐', '🍩', '🧁', '🍪', '🥯', '🍰', '🧇', '🥄', '📖', '🕰️', '🤎'] },
  { id: 'nature', name: 'Nature', stickers: ['🌿', '🍃', '🌱', '🪴', '🌳', '🌲', '🌵', '🍄', '🌾', '🪨', '🌊', '⛰️', '🦋', '🐝', '🐞', '🐦', '🦉', '🦊', '🐿️', '🦔'] },
  { id: 'camping', name: 'Camping', stickers: ['⛺', '🏕️', '🔥', '🪵', '🎒', '🥾', '🧭', '🗺️', '🔦', '🪓', '🎣', '🛶', '🌌', '🌠', '🦌', '🐻', '🚐', '🥫', '🍢', '🧤'] },
  { id: 'spring', name: 'Spring', stickers: ['🌷', '🌸', '🌼', '💐', '🪻', '🌱', '🐣', '🐥', '🐇', '🐝', '🦋', '🪺', '☔', '🌦️', '🌈', '🧺', '🪁', '🍓'] },
  { id: 'summer', name: 'Summer', stickers: ['☀️', '🌞', '🏖️', '🌊', '🐚', '🩴', '🕶️', '👒', '🍉', '🍦', '🍹', '🥥', '🌴', '⛱️', '🏄', '🤿', '🐬', '🦀', '🍋', '✈️'] },
  { id: 'fall', name: 'Fall', stickers: ['🍂', '🍁', '🎃', '🌰', '🍄', '🍎', '🥧', '🌽', '🧣', '🧥', '☕', '🕯️', '🦃', '🦉', '🐿️', '🌧️', '📚', '🧶'] },
  { id: 'winter', name: 'Winter', stickers: ['❄️', '☃️', '⛄', '🌨️', '🧊', '🧣', '🧤', '🧦', '⛷️', '🏂', '⛸️', '🛷', '🏔️', '🔥', '☕', '🍲', '🐧', '🦭', '🌲', '✨'] },
  { id: 'christmas', name: 'Christmas', stickers: ['🎄', '🎅', '🤶', '🦌', '🎁', '🔔', '⭐', '🌟', '🕯️', '🧦', '🍪', '🥛', '❄️', '☃️', '🛷', '🎶', '🧑‍🎄', '🎀', '🍬', '❤️'] },
  { id: 'hanukkah', name: 'Hanukkah', stickers: ['🕎', '🕯️', '✡️', '🍩', '🥞', '🪙', '🎁', '🫒', '✨', '🌟', '💙', '🤍', '🎶', '🍫', '🥔', '🧆'] },
  { id: 'books', name: 'Books', stickers: ['📚', '📖', '📕', '📗', '📘', '📙', '📓', '📔', '📒', '🔖', '📑', '👓', '🤓', '🖋️', '✏️', '📝', '🕯️', '☕', '🛋️', '🏛️'] },
  { id: 'cactus', name: 'Cactus', stickers: ['🌵', '🪴', '🏜️', '🌞', '🦎', '🐪', '🌺', '🪨', '🌶️', '🤠', '🐍', '🦂', '🌅', '🏺'] },
  { id: 'mushrooms', name: 'Mushrooms', stickers: ['🍄', '🌲', '🍂', '🪵', '🐌', '🌧️', '🧚', '🌿', '🐿️', '🦔', '🧺', '🐸', '🪲', '🌰'] },
  { id: 'birds', name: 'Birds', stickers: ['🐦', '🐤', '🐥', '🐣', '🦉', '🦅', '🦆', '🦢', '🦜', '🦩', '🕊️', '🪶', '🪺', '🪹', '🐧', '🦚', '🐓', '🦃'] },
  { id: 'lights', name: 'Lights', stickers: ['💡', '🕯️', '🔦', '🏮', '🪔', '✨', '🌟', '⭐', '🎇', '🎆', '🌙', '🔆', '🪩', '🔥', '🎄', '🕎'] },
  { id: 'sports', name: 'Sports', stickers: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏓', '🏸', '🥊', '🏋️', '🤸', '🧘', '🏃', '🚴', '🏊', '⛳', '🏆', '🥇', '👟', '💪'] },
  { id: 'food', name: 'Food', stickers: ['🍓', '🍋', '🍎', '🥑', '🥗', '🍕', '🍝', '🍣', '🥪', '🍳', '🥞', '🧀', '🍫', '🍿', '🍇', '🥕', '🍞', '🍜'] },
  { id: 'animals', name: 'Animals', stickers: ['🐱', '🐶', '🐰', '🐻', '🦊', '🐼', '🐨', '🦁', '🐸', '🐢', '🐙', '🐳', '🦄', '🐴', '🐑', '🕊️', '🦜', '🐾'] },
  { id: 'party', name: 'Celebrations', stickers: ['🎉', '🎊', '🎈', '🎂', '🥂', '🎁', '🎆', '🎇', '💝', '💍', '🎓', '👶', '🏡', '🪩', '🎶', '🥳'] },
  { id: 'hearts', name: 'Hearts', stickers: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💖', '💕', '💞', '💓', '💗', '💘', '💌'] },
  { id: 'everyday', name: 'Everyday', stickers: ['📚', '✏️', '🖍️', '📝', '📅', '⏰', '💡', '🎨', '🎵', '🎧', '📷', '💻', '🛒', '🧺', '🧹', '🚗', '🚲', '💤'] },
];

export const isDarkColor = (hex: string): boolean => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b < 128;
};

/** A spot near the middle of the page, nudged so new items don't stack exactly. */
function place(size: PageSize, w: number, h: number, count: number) {
  const dims = PAGE_DIMS[size];
  const nudge = (count % 6) * 26;
  return { x: Math.round((dims.w - w) / 2 + nudge - 60), y: Math.round((dims.h - h) / 2.6 + nudge) };
}

export const newText = (page: Page): TextElement => ({
  id: newId(),
  type: 'text',
  ...place(page.size, 460, 80, page.elements.length),
  w: 460,
  h: 80,
  rotation: 0,
  text: 'Write something',
  font: 'hand',
  size: 52,
  color: isDarkColor(page.background.color) ? '#FFFFFF' : '#3A2B47',
  align: 'left',
});

export const newPhoto = (page: Page, assetId: string, ratio: number): PhotoElement => {
  const w = ratio >= 1 ? 440 : 340;
  const h = Math.round(w / ratio);
  return { id: newId(), type: 'photo', ...place(page.size, w, h, page.elements.length), w, h, rotation: -3, assetId, frame: 'polaroid', shadow: true };
};

const stickerBase = (page: Page, w: number, h: number) => ({
  id: newId(),
  type: 'sticker' as const,
  ...place(page.size, w, h, page.elements.length),
  w,
  h,
  rotation: 0,
  emoji: '',
});

export const newSticker = (page: Page, emoji: string): StickerElement => ({ ...stickerBase(page, 130, 130), emoji });

export const newDrawnSticker = (page: Page, art: string, color: string): StickerElement => ({ ...stickerBase(page, 170, 170), art, color });

export const newCustomSticker = (page: Page, assetId: string, ratio: number): StickerElement => {
  const w = ratio >= 1 ? 200 : Math.round(200 * ratio);
  return { ...stickerBase(page, w, Math.round(w / ratio)), assetId };
};

export const newTape = (page: Page, color: string, pattern: TapePattern = 'stripes'): TapeElement => ({
  id: newId(),
  type: 'tape',
  ...place(page.size, 300, 54, page.elements.length),
  w: 300,
  h: 54,
  rotation: -4,
  color,
  pattern,
  edge: 'torn',
});

export const newTrackerElement = (page: Page, trackerId: string): TrackerElement => ({
  id: newId(),
  type: 'tracker',
  ...place(page.size, 520, 420, page.elements.length),
  w: 520,
  h: 420,
  rotation: 0,
  trackerId,
});

export const newItem = (text = '', done = false): ChecklistItem => ({ id: newId(), text, done });

export const newBox = (page: Page): BoxElement => ({
  id: newId(),
  type: 'box',
  ...place(page.size, 420, 300, page.elements.length),
  w: 420,
  h: 300,
  rotation: 0,
  fill: 'white',
  border: 'solid',
  title: '',
});

export const newChecklist = (page: Page): ChecklistElement => ({
  id: newId(),
  type: 'checklist',
  ...place(page.size, 400, 260, page.elements.length),
  w: 400,
  h: 260,
  rotation: 0,
  title: 'To do',
  color: 'rose',
  items: [newItem(), newItem(), newItem()],
});

export const newTable = (page: Page): TableElement => ({
  id: newId(),
  type: 'table',
  ...place(page.size, 620, 360, page.elements.length),
  w: 620,
  h: 360,
  rotation: 0,
  title: '',
  color: 'sky',
  cols: ['One', 'Two', 'Three'],
  rows: ['', '', '', ''],
  cells: {},
});

export const newWriting = (page: Page): WritingElement => ({
  id: newId(),
  type: 'writing',
  ...place(page.size, 440, 320, page.elements.length),
  w: 440,
  h: 320,
  rotation: 0,
  title: 'Notes',
  color: 'butter',
  text: '',
  lined: true,
});

export const newMonth = (page: Page, today: Date): MonthElement => ({
  id: newId(),
  type: 'month',
  ...place(page.size, 760, 600, page.elements.length),
  w: 760,
  h: 600,
  rotation: 0,
  color: 'mint',
  year: today.getFullYear(),
  month: today.getMonth(),
  notes: {},
});

const BOOK_COLORS = ['rose', 'sky', 'butter', 'mint', 'lilac', 'peach', 'sage', 'coral', 'teal', 'berry', 'blue', 'tan'];
export const newBook = (index: number): ShelfBook => ({ id: newId(), title: '', color: BOOK_COLORS[(index * 5) % BOOK_COLORS.length], read: false });

export const newBookshelf = (page: Page): BookshelfElement => ({
  id: newId(),
  type: 'bookshelf',
  ...place(page.size, 700, 560, page.elements.length),
  w: 700,
  h: 560,
  rotation: 0,
  title: '',
  color: 'tan',
  books: Array.from({ length: 18 }, (_, i) => newBook(i)),
  perShelf: 9,
});

export const blankPage = (title: string, size: PageSize, sortOrder: number): Page => ({
  id: newId(),
  title,
  size,
  background: { color: BG_COLORS[0], pattern: 'dots' },
  elements: [],
  isTemplate: false,
  sortOrder,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

/** A full copy with fresh ids, so the copy and the original never share elements. */
export const copyPage = (source: Page, title: string, sortOrder: number, isTemplate: boolean): Page => ({
  ...source,
  id: newId(),
  title,
  isTemplate,
  sortOrder,
  background: { ...source.background },
  elements: source.elements.map((e) => ({ ...e, id: newId() })),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const assetIdsOf = (page: Page): string[] => {
  const ids = page.elements.flatMap((e) => (e.type === 'photo' ? [e.assetId] : e.type === 'sticker' && e.assetId ? [e.assetId] : []));
  if (page.background.assetId) ids.push(page.background.assetId);
  return ids;
};
