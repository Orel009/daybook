import { newId } from './types';
import type { ThemedTape } from './tapes';

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

export type PagePattern = 'dots' | 'grid' | 'lines' | 'plain' | 'cover' | 'linen' | 'leather' | 'kraft' | 'floral' | 'pastel' | 'night';

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
  bold?: boolean; // heavier than the lettering's own weight
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

// A photo slot. Empty, it invites a photo ("Tap to add a photo"); filled, it
// shows the photo cropped to the slot. `zoom`, `panX` and `panY` say which part
// of the photo shows: zoom 1 fills the slot, pan 0.5 is centred.
export const FRAME_STYLES = [
  { id: 'plain', name: 'Plain' },
  { id: 'polaroid', name: 'Polaroid' },
  { id: 'rounded', name: 'Rounded' },
  { id: 'circle', name: 'Circle' },
  { id: 'torn', name: 'Torn paper' },
  { id: 'stamp', name: 'Stamp edge' },
] as const;
export type FrameStyle = (typeof FRAME_STYLES)[number]['id'];

export interface FrameElement extends ElementBase {
  type: 'frame';
  assetId?: string;
  style: FrameStyle;
  zoom?: number; // 1–4
  panX?: number; // 0–1
  panY?: number; // 0–1
  caption?: string;
  /** Shown on the empty slot instead of "Tap to add a photo" (e.g. "The cover"). */
  hint?: string;
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
export type BasicTape = (typeof TAPE_PATTERNS)[number]['id'];
/** A plain pattern drawn by the stylesheet, or a themed tape from tapes.ts. */
export type TapePattern = BasicTape | ThemedTape;

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

// ----- parts that are written in while editing, and ticked while viewing

/**
 * How the writing inside a part looks (not its heading). Every field is
 * optional: left out, the part looks exactly as it always has, so older and
 * shared pages render unchanged.
 */
export interface PartTextStyle {
  font?: TextFont;
  textSize?: number; // page units
  textColor?: string; // hex
  textAlign?: 'left' | 'center' | 'right';
}

/** A frame or coloured panel for grouping things, with an optional heading. */
export interface BoxElement extends ElementBase {
  type: 'box';
  fill?: string; // key of TAPE_COLORS, 'white', or none for see-through
  border: 'solid' | 'dashed' | 'none';
  title?: string;
  shadow?: boolean; // a hard shadow, like a label stuck on
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface ChecklistElement extends ElementBase, PartTextStyle {
  type: 'checklist';
  title: string;
  color: string; // heading colour, key of TAPE_COLORS
  items: ChecklistItem[];
}

export interface TableElement extends ElementBase, PartTextStyle {
  type: 'table';
  title: string;
  color: string;
  cols: string[]; // column headings
  rows: string[]; // row labels (may be empty strings for unlabeled rows)
  cells: Record<string, string>; // "row:col" -> text
}

export interface WritingElement extends ElementBase, PartTextStyle {
  type: 'writing';
  title: string;
  color: string;
  text: string;
  lined: boolean;
}

export interface MonthElement extends ElementBase, PartTextStyle {
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
export interface BookshelfElement extends ElementBase, PartTextStyle {
  type: 'bookshelf';
  title: string;
  color: string;
  books: ShelfBook[];
  perShelf: number;
}

export interface GridTile {
  /** Fixed label printed on the tile: a letter, a genre, a prompt. */
  label?: string;
  /** What was written on it (in Edit). */
  text?: string;
  /** Marked done with a tap while viewing. */
  done?: boolean;
}

export const TILE_SHAPES = [
  { id: 'square', name: 'Squares' },
  { id: 'circle', name: 'Circles' },
  { id: 'heart', name: 'Hearts' },
  { id: 'star', name: 'Stars' },
  { id: 'leaf', name: 'Leaves' },
  { id: 'drop', name: 'Drops' },
  { id: 'spine', name: 'Book spines' },
] as const;
export type TileShape = (typeof TILE_SHAPES)[number]['id'];

/** How the tiles are arranged: rows, a winding path, or the segments of a picture. */
export const TILE_LAYOUTS = [
  { id: 'grid', name: 'Rows' },
  { id: 'path', name: 'Path' },
  { id: 'jar', name: 'Jar of marbles' },
  { id: 'thermo', name: 'Thermometer' },
  { id: 'trail', name: 'Mountain trail' },
  { id: 'tree', name: 'Tree' },
  { id: 'heart', name: 'Big heart' },
] as const;
export type TileLayout = (typeof TILE_LAYOUTS)[number]['id'];

/** Tiles in rows: bingo cards, challenges, A to Z. Rows follow from the tile count. */
export interface GridElement extends ElementBase, PartTextStyle {
  type: 'tiles';
  title: string;
  color: string; // key of TAPE_COLORS, also the colour of the marks
  cols: number;
  tiles: GridTile[];
  /** The middle tile of an odd square counts as done ("Free"). */
  freeCenter?: boolean;
  /** Count full rows, columns and diagonals, and cheer when one is made. */
  bingo?: boolean;
  mark?: 'cross' | 'stamp' | 'fill';
  /** Left out: square tiles, as always. */
  shape?: TileShape;
  /** Left out: rows. */
  layout?: TileLayout;
  /** Show "done / all" in the heading. */
  count?: boolean;
}

export type PageElement =
  | FrameElement
  | GridElement
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

/** Parts that respond to taps when the page is being viewed. */
export const isFillable = (el: PageElement): boolean =>
  el.type === 'tracker' || isWritable(el) || (el.type === 'frame' && !el.assetId);

/** Parts that are written in (in Edit, while selected). */
export const isWritable = (el: PageElement): boolean =>
  el.type === 'checklist' || el.type === 'table' || el.type === 'writing' || el.type === 'month' || el.type === 'bookshelf' || el.type === 'tiles';

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
  /** The book's own covers. They are pages like any other, kept out of the journal, the page count and Arrange. */
  role?: 'cover' | 'back';
  /** Covers: colour of the strip along the binding (hex). */
  spine?: string;
  /** Front cover: leave out the "12 pages" line. */
  hideCount?: boolean;
  createdAt: string;
  /** Any change, including a move in the book. Sync keeps the newest. */
  updatedAt: string;
  /** When what is on the page last changed. Left out on older pages: then it is `updatedAt`. */
  editedAt?: string;
  deletedAt?: string; // tombstone, kept so the delete reaches other devices
}

/** When the page's content last changed (for "recent" lists): moving a page in the book doesn't count. */
export const lastEdited = (p: Pick<Page, 'editedAt' | 'updatedAt'>): string => p.editedAt ?? p.updatedAt;

/** The page after a change to what is on it. */
export const editedPage = <T extends Page>(p: T, at: string): T => ({ ...p, updatedAt: at, editedAt: at });

/** The page at a new place in the book: saved and synced as changed, but not "recently edited". */
export const movedPage = <T extends Page>(p: T, sortOrder: number, at: string): T => ({ ...p, sortOrder, editedAt: lastEdited(p), updatedAt: at });

/** A page of the journal: not a template, not a cover. */
export const isJournalPage = (p: Pick<Page, 'isTemplate' | 'role'>): boolean => !p.isTemplate && !p.role;

/** Journal pages in book order. */
export const bookOrder = <T extends Pick<Page, 'id' | 'isTemplate' | 'role' | 'sortOrder'>>(pages: readonly T[]): T[] =>
  pages.filter(isJournalPage).sort((a, b) => a.sortOrder - b.sortOrder || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

/** The book's front or back cover page, if one was made (the newest, should two devices each have made one). */
export const coverOf = <T extends Pick<Page, 'role' | 'updatedAt'>>(pages: readonly T[], role: 'cover' | 'back'): T | undefined =>
  pages.filter((p) => p.role === role).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];

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

/** Papers with a texture, made for covers and dividers but usable on any page. */
export const TEXTURES: { id: PagePattern; name: string }[] = [
  { id: 'cover', name: 'Polka' },
  { id: 'linen', name: 'Linen' },
  { id: 'leather', name: 'Leather' },
  { id: 'kraft', name: 'Kraft' },
  { id: 'floral', name: 'Floral' },
  { id: 'pastel', name: 'Pastel' },
  { id: 'night', name: 'Night sky' },
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
  { id: 'fruit', name: 'Fruit', stickers: ['🍋', '🍓', '🍒', '🍎', '🍊', '🍑', '🍐', '🍇', '🍉', '🍍', '🥝', '🫐', '🍌', '🥭', '🥥', '🍈'] },
  { id: 'ocean', name: 'Ocean', stickers: ['🌊', '🐚', '🐠', '🐟', '🐬', '🐳', '🐙', '🦀', '🦞', '🪸', '⚓', '⛵', '🏝️', '🐢', '🦭', '🪼'] },
  { id: 'travel', name: 'Travel', stickers: ['✈️', '🧳', '🗺️', '📍', '🌍', '🚆', '🚗', '🚢', '🏨', '🎫', '📸', '🗼', '🗽', '🏰', '⛩️', '🏖️'] },
  { id: 'pets', name: 'Pets', stickers: ['🐱', '🐶', '🐾', '🦴', '🐝', '🐰', '🐹', '🐦', '🐠', '🐢', '🧶', '🥎', '🏠', '❤️'] },
  { id: 'music', name: 'Music', stickers: ['🎵', '🎶', '🎧', '🎤', '🎸', '🎹', '🥁', '🎻', '🎺', '📻', '💿', '🎼', '🎙️', '🪩'] },
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

export const newFrame = (page: Page, style: FrameStyle = 'polaroid'): FrameElement => {
  const w = style === 'circle' ? 320 : 360;
  const h = style === 'circle' ? 320 : style === 'polaroid' ? 400 : 300;
  return { id: newId(), type: 'frame', ...place(page.size, w, h, page.elements.length), w, h, rotation: style === 'polaroid' ? -3 : 0, style };
};

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

export type GridPreset = 'bingo5' | 'bingo4' | 'mini3' | 'az';

export const GRID_PRESETS: { id: GridPreset; name: string }[] = [
  { id: 'bingo5', name: 'Bingo 5×5' },
  { id: 'bingo4', name: 'Bingo 4×4' },
  { id: 'mini3', name: 'Mini 3×3' },
  { id: 'az', name: 'A to Z' },
];

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const newGrid = (page: Page, preset: GridPreset): GridElement => {
  const { w: pw, h: ph } = PAGE_DIMS[page.size];
  const shape = {
    bingo5: { cols: 5, n: 25, w: 640, h: 700, title: 'Bingo', bingo: true, freeCenter: true, mark: 'stamp' as const },
    bingo4: { cols: 4, n: 16, w: 600, h: 660, title: 'Bingo', bingo: true, freeCenter: false, mark: 'stamp' as const },
    mini3: { cols: 3, n: 9, w: 480, h: 530, title: 'Mini bingo', bingo: true, freeCenter: false, mark: 'cross' as const },
    az: { cols: 6, n: 26, w: 720, h: 700, title: 'A to Z', bingo: false, freeCenter: false, mark: 'cross' as const },
  }[preset];
  const w = Math.min(shape.w, pw - 80);
  const h = Math.min(shape.h, ph - 80);
  return {
    id: newId(),
    type: 'tiles',
    x: Math.round((pw - w) / 2),
    y: Math.round((ph - h) / 2),
    w,
    h,
    rotation: 0,
    title: shape.title,
    color: preset === 'az' ? 'sky' : 'rose',
    cols: shape.cols,
    tiles: Array.from({ length: shape.n }, (_, i) => (preset === 'az' ? { label: ALPHABET[i] } : {})),
    bingo: shape.bingo,
    freeCenter: shape.freeCenter,
    mark: shape.mark,
  };
};

// Challenges in other shapes than a bingo card. All of them are tile grids
// with a shape and a layout, so they tick, count and sync like any tile grid.
const numbers = (n: number) => Array.from({ length: n }, (_, i) => ({ label: String(i + 1) }));
const empty = (n: number) => Array.from({ length: n }, () => ({}));
type ChallengeShape = Pick<GridElement, 'title' | 'color' | 'cols' | 'tiles' | 'mark' | 'shape' | 'layout'> & { w: number; h: number };

export const CHALLENGE_PRESETS = [
  { id: 'stamps', name: 'Stamp card', hint: '10 circles to stamp', make: (): ChallengeShape => ({ title: 'Stamp card', color: 'coral', cols: 5, tiles: empty(10), mark: 'stamp', shape: 'circle', w: 640, h: 330 }) },
  { id: 'hearts', name: '100 hearts', hint: 'Colour in a heart each time', make: (): ChallengeShape => ({ title: '100 hearts', color: 'rose', cols: 10, tiles: empty(100), mark: 'fill', shape: 'heart', w: 700, h: 760 }) },
  { id: 'stars', name: 'Stars', hint: '30 stars to earn', make: (): ChallengeShape => ({ title: 'Gold stars', color: 'butter', cols: 6, tiles: numbers(30), mark: 'fill', shape: 'star', w: 660, h: 600 }) },
  { id: 'leaves', name: 'Leaves', hint: '24 leaves to colour', make: (): ChallengeShape => ({ title: 'Turn over a new leaf', color: 'green', cols: 6, tiles: empty(24), mark: 'fill', shape: 'leaf', w: 660, h: 520 }) },
  { id: 'drops', name: 'Drops', hint: 'A week of 8 glasses a day', make: (): ChallengeShape => ({ title: 'Glasses of water', color: 'sky', cols: 8, tiles: empty(56), mark: 'fill', shape: 'drop', w: 700, h: 640 }) },
  { id: 'spines', name: 'Bookshelf to colour', hint: '50 books', make: (): ChallengeShape => ({ title: '50 books', color: 'lilac', cols: 10, tiles: empty(50), mark: 'fill', shape: 'spine', w: 760, h: 820 }) },
  { id: 'path', name: 'Path', hint: '30 steps from start to finish', make: (): ChallengeShape => ({ title: '30-day challenge', color: 'mint', cols: 6, tiles: numbers(30), mark: 'fill', shape: 'circle', layout: 'path', w: 720, h: 700 }) },
  { id: 'jar', name: 'Jar of marbles', hint: 'A marble for every book', make: (): ChallengeShape => ({ title: 'Reading jar', color: 'sky', cols: 1, tiles: empty(40), mark: 'fill', layout: 'jar', w: 480, h: 640 }) },
  { id: 'thermo', name: 'Thermometer', hint: 'Fill it up step by step', make: (): ChallengeShape => ({ title: 'Savings goal', color: 'red', cols: 1, tiles: Array.from({ length: 10 }, (_, i) => ({ label: `${(i + 1) * 10}%` })), mark: 'fill', layout: 'thermo', w: 360, h: 760 }) },
  { id: 'trail', name: 'Mountain trail', hint: '12 stops to the top', make: (): ChallengeShape => ({ title: 'To the summit', color: 'lilac', cols: 1, tiles: numbers(12), mark: 'fill', layout: 'trail', w: 800, h: 480 }) },
  { id: 'tree', name: 'Tree with leaves', hint: 'A leaf for every day', make: (): ChallengeShape => ({ title: 'Habit tree', color: 'green', cols: 1, tiles: empty(30), mark: 'fill', layout: 'tree', w: 620, h: 700 }) },
  { id: 'bigheart', name: 'Heart of hearts', hint: '100 little hearts in one big one', make: (): ChallengeShape => ({ title: 'Acts of kindness', color: 'rose', cols: 1, tiles: empty(100), mark: 'fill', layout: 'heart', w: 700, h: 700 }) },
] as const;
export type ChallengePreset = (typeof CHALLENGE_PRESETS)[number]['id'];

export const newChallenge = (page: Page, preset: ChallengePreset): GridElement => {
  const { w: pw, h: ph } = PAGE_DIMS[page.size];
  const { w: w0, h: h0, ...rest } = (CHALLENGE_PRESETS.find((p) => p.id === preset) ?? CHALLENGE_PRESETS[0]).make();
  const w = Math.min(w0, pw - 80);
  const h = Math.min(h0, ph - 80);
  return { id: newId(), type: 'tiles', x: Math.round((pw - w) / 2), y: Math.round((ph - h) / 2), w, h, rotation: 0, ...rest, count: true };
};

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
export const copyPage = (source: Page, title: string, sortOrder: number, isTemplate: boolean): Page => {
  // a copy is an ordinary page, even when it was made from a cover
  const { role: _role, spine: _spine, hideCount: _hideCount, editedAt: _editedAt, ...rest } = source;
  return {
    ...rest,
    id: newId(),
    title,
    isTemplate,
    sortOrder,
    background: { ...source.background },
    elements: source.elements.map((e) => ({ ...e, id: newId() })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const assetIdsOf = (page: Page): string[] => {
  const ids = page.elements.flatMap((e) => (e.type === 'photo' ? [e.assetId] : (e.type === 'sticker' || e.type === 'frame') && e.assetId ? [e.assetId] : []));
  if (page.background.assetId) ids.push(page.background.assetId);
  return ids;
};
