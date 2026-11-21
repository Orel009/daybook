import { TAPE_COLORS } from '../domain/types';

// Built-in drawn stickers. Each is a small original vector drawing on a
// 100×100 grid with the app's ink outline, so they look the same on every
// device and stay sharp at any size. "{C}" is replaced by the sticker's colour.
// To add one: append an entry with a set id from STICKER_SETS in pages.ts.

const INK = '#3A2B47';
const CREAM = '#FFFDF9';
const BROWN = '#B98B6B';
const TAN = '#ECC9A6';
const GREEN = '#8FCF9E';
const YELLOW = '#F6DB7D';
const RED = '#F08080';
const BLUE = '#A8CDF2';

export interface DrawnSticker {
  id: string;
  set: string;
  name: string;
  /** Default colour (key of TAPE_COLORS). */
  color: string;
  /** True when the drawing has no recolourable part. */
  fixed?: boolean;
  svg: string;
}

const spin = (angles: number[], inner: string) => angles.map((a) => `<g transform="rotate(${a} 50 50)">${inner}</g>`).join('');
const outlined = (d: string, wide = 9, thin = 4.5) =>
  `<path stroke-width="${wide}" d="${d}"/><path stroke="{C}" stroke-width="${thin}" d="${d}"/>`;
const flake = 'M50 10v80M50 25l-9-9M50 25l9-9M50 75l-9 9M50 75l9 9';
const menorah = 'M14 38v8a36 36 0 0 0 72 0v-8M26 38v8a24 24 0 0 0 48 0v-8M38 38v8a12 12 0 0 0 24 0v-8M50 32v54M32 88h36';
const flame = (x: number, y: number) => `<path fill="${YELLOW}" stroke-width="2" d="M${x} ${y}c-4-4-3-8 0-12 3 4 4 8 0 12z"/>`;
const cane = 'M40 88V40a15 15 0 0 1 30 0v4';

export const DRAWN_STICKERS: DrawnSticker[] = [
  // doodles
  { id: 'heart', set: 'doodles', name: 'Heart', color: 'rose', svg: `<path fill="{C}" d="M50 84 18 52a19 19 0 0 1 32-22 19 19 0 0 1 32 22z"/>` },
  { id: 'star', set: 'doodles', name: 'Star', color: 'butter', svg: `<path fill="{C}" d="m50 12 11.500 24 26.500 3.500-19.500 18 5 26L50 71 26.500 83.500l5-26-19.500-18 26.500-3.500z"/>` },
  { id: 'sparkle', set: 'doodles', name: 'Sparkles', color: 'butter', svg: `<path fill="{C}" d="M46 10c4 22 10 28 32 32-22 4-28 10-32 32-4-22-10-28-32-32 22-4 28-10 32-32z"/><path fill="{C}" d="M80 64c1.500 8 4 10.500 12 12-8 1.500-10.500 4-12 12-1.500-8-4-10.500-12-12 8-1.500 10.500-4 12-12z"/>` },
  { id: 'cloud', set: 'doodles', name: 'Cloud', color: 'sky', svg: `<path fill="{C}" d="M28 74a16 16 0 0 1-2-32 22 22 0 0 1 42-6 19 19 0 0 1 6 38z"/>` },
  { id: 'rainbow', set: 'doodles', name: 'Rainbow', color: 'rose', fixed: true, svg: `<path stroke="#F3A3BA" stroke-width="9" d="M14 76a36 36 0 0 1 72 0"/><path stroke="${YELLOW}" stroke-width="9" d="M23 76a27 27 0 0 1 54 0"/><path stroke="${BLUE}" stroke-width="9" d="M32 76a18 18 0 0 1 36 0"/><path d="M9.500 76a40.500 40.500 0 0 1 81 0M36.500 76a13.500 13.500 0 0 1 27 0"/><circle fill="${CREAM}" cx="16" cy="78" r="9"/><circle fill="${CREAM}" cx="84" cy="78" r="9"/>` },
  { id: 'banner', set: 'doodles', name: 'Ribbon label', color: 'rose', svg: `<path fill="{C}" d="M6 34h88L84 50l10 16H6l10-16z"/>` },
  { id: 'speech', set: 'doodles', name: 'Speech bubble', color: 'lilac', svg: `<path fill="{C}" d="M18 20h64a8 8 0 0 1 8 8v32a8 8 0 0 1-8 8H48L30 84V68H18a8 8 0 0 1-8-8V28a8 8 0 0 1 8-8z"/>` },
  { id: 'arrow', set: 'doodles', name: 'Arrow', color: 'rose', fixed: true, svg: `<path stroke-width="4.500" d="M12 64c20-30 46-34 70-22M66 28l18 13-19 11"/>` },

  // coffee
  { id: 'mug', set: 'coffee', name: 'Mug', color: 'rose', svg: `<path d="M38 30c-4-6 4-8 0-15M50 30c-4-6 4-8 0-15M62 30c-4-6 4-8 0-15M70 48h6a9 9 0 0 1 0 18h-6"/><rect fill="{C}" x="24" y="38" width="46" height="42" rx="9"/><path fill="${CREAM}" d="M47 69l-9-9a5.500 5.500 0 0 1 9-6 5.500 5.500 0 0 1 9 6z"/><path d="M14 88h72"/>` },
  { id: 'togo', set: 'coffee', name: 'Takeaway cup', color: 'peach', svg: `<path fill="${CREAM}" d="M30 34h40l-5 54H35z"/><path fill="{C}" d="M32 52h36l-2 18H34z"/><rect fill="${BROWN}" x="26" y="24" width="48" height="10" rx="3"/><path d="M34 24l2-8h28l2 8"/>` },
  { id: 'bean', set: 'coffee', name: 'Coffee bean', color: 'tan', svg: `<ellipse fill="{C}" cx="50" cy="50" rx="24" ry="34" transform="rotate(32 50 50)"/><path d="M38 24c16 14 4 34 24 52"/>` },

  // nature
  { id: 'leaf', set: 'nature', name: 'Leaf', color: 'green', svg: `<path fill="{C}" d="M50 90C20 70 20 36 50 10c30 26 30 60 0 80z"/><path d="M50 90V32M50 68 36 56M50 68l14-12M50 50l-10-9M50 50l10-9"/>` },
  { id: 'mushroom', set: 'nature', name: 'Mushroom', color: 'red', svg: `<path fill="${CREAM}" d="M40 52h20l5 30a5 5 0 0 1-5 6H40a5 5 0 0 1-5-6z"/><path fill="{C}" d="M14 54a36 32 0 0 1 72 0z"/><circle fill="${CREAM}" cx="36" cy="38" r="5"/><circle fill="${CREAM}" cx="58" cy="34" r="6"/><circle fill="${CREAM}" cx="71" cy="46" r="3.500"/>` },
  { id: 'mountain', set: 'nature', name: 'Mountain', color: 'lilac', svg: `<circle fill="${YELLOW}" cx="76" cy="26" r="10"/><path fill="{C}" d="M6 84 38 26l16 26 10-14 30 46z"/><path fill="${CREAM}" d="M38 26 28 44l10-5 7 7 4-8z"/>` },
  { id: 'pine', set: 'nature', name: 'Pine tree', color: 'green', svg: `<rect fill="${BROWN}" x="45" y="76" width="10" height="14"/><path fill="{C}" d="M50 10 30 38h10L24 58h12L18 78h64L64 58h12L60 38h10z"/>` },

  // camping
  { id: 'tent', set: 'camping', name: 'Tent', color: 'peach', svg: `<path d="M50 20V8l11 5-11 5"/><path fill="{C}" d="M50 20 10 82h80z"/><path fill="#6F6180" d="M50 46 36 82h28z"/><path d="M4 82h92"/>` },
  { id: 'campfire', set: 'camping', name: 'Campfire', color: 'orange', svg: `<path fill="{C}" d="M50 12c6 16 22 24 22 44a22 22 0 0 1-44 0c0-10 6-14 8-24 6 4 9 8 14-20z"/><path fill="${YELLOW}" d="M50 44c4 8 10 12 10 20a10 10 0 0 1-20 0c0-6 6-10 10-20z"/><rect fill="${BROWN}" x="20" y="79" width="60" height="9" rx="4.500" transform="rotate(12 50 83)"/><rect fill="${BROWN}" x="20" y="79" width="60" height="9" rx="4.500" transform="rotate(-12 50 83)"/>` },
  { id: 'compass', set: 'camping', name: 'Compass', color: 'sky', svg: `<path d="M50 16V8"/><circle fill="{C}" cx="50" cy="54" r="36"/><circle fill="${CREAM}" cx="50" cy="54" r="27"/><path fill="${RED}" d="M50 32l8 22H42z"/><path fill="${CREAM}" d="M50 76l8-22H42z"/><circle fill="${INK}" cx="50" cy="54" r="2"/>` },

  // spring
  { id: 'tulip', set: 'spring', name: 'Tulip', color: 'rose', svg: `<path d="M50 58v32"/><path fill="${GREEN}" d="M50 86c-14 0-22-8-24-22 12 2 20 8 24 22zM50 86c14 0 22-8 24-22-12 2-20 8-24 22z"/><path fill="{C}" d="M30 22c0 24 8 38 20 38s20-14 20-38L60 34 50 18 40 34z"/>` },
  { id: 'daisy', set: 'spring', name: 'Daisy', color: 'lilac', svg: `${spin([0, 45, 90, 135, 180, 225, 270, 315], `<ellipse fill="{C}" cx="50" cy="24" rx="9" ry="16"/>`)}<circle fill="${YELLOW}" cx="50" cy="50" r="11"/>` },
  { id: 'umbrella', set: 'spring', name: 'Umbrella', color: 'sky', svg: `<path d="M50 50v30a8 8 0 0 1-16 0M50 16v-6"/><path fill="{C}" d="M10 52a40 36 0 0 1 80 0c-5-6-15-6-20 0-5-6-15-6-20 0-5-6-15-6-20 0-5-6-15-6-20 0z"/>` },
  { id: 'butterfly', set: 'spring', name: 'Butterfly', color: 'lilac', svg: `<ellipse fill="{C}" cx="31" cy="38" rx="20" ry="16" transform="rotate(20 31 38)"/><ellipse fill="{C}" cx="69" cy="38" rx="20" ry="16" transform="rotate(-20 69 38)"/><ellipse fill="{C}" cx="36" cy="66" rx="14" ry="12"/><ellipse fill="{C}" cx="64" cy="66" rx="14" ry="12"/><ellipse fill="${INK}" cx="50" cy="54" rx="4" ry="22"/><path d="M48 32c-2-8-6-12-12-14M52 32c2-8 6-12 12-14"/>` },

  // summer
  { id: 'sun', set: 'summer', name: 'Sun', color: 'butter', svg: `${spin([0, 45, 90, 135, 180, 225, 270, 315], `<path d="M50 6v13"/>`)}<circle fill="{C}" cx="50" cy="50" r="23"/><path d="M42 55c4 5 12 5 16 0"/><circle fill="${INK}" stroke="none" cx="43" cy="46" r="2.200"/><circle fill="${INK}" stroke="none" cx="57" cy="46" r="2.200"/>` },
  { id: 'icecream', set: 'summer', name: 'Ice cream', color: 'rose', svg: `<path fill="${TAN}" d="M32 50h36L50 92z"/><path d="M41 58l13 12M59 58 46 70"/><circle fill="{C}" cx="50" cy="36" r="22"/><circle fill="${RED}" cx="57" cy="12" r="5"/>` },
  { id: 'watermelon', set: 'summer', name: 'Watermelon', color: 'red', svg: `<path fill="${GREEN}" d="M8 38a42 42 0 0 0 84 0z"/><path fill="{C}" d="M17 38a33 33 0 0 0 66 0z"/><path stroke-width="4" d="M36 47v4M50 54v4M64 47v4"/>` },

  // fall
  { id: 'maple', set: 'fall', name: 'Autumn leaf', color: 'orange', svg: `<path fill="{C}" d="M50 62C30 66 14 52 12 32c8 2 13 0 17-7 4 7 8 9 14 7-2-9 1-16 7-22 6 6 9 13 7 22 6 2 10 0 14-7 4 7 9 9 17 7-2 20-18 34-38 30z"/><path d="M50 90V40M50 62 34 48M50 62l16-14"/>` },
  { id: 'pumpkin', set: 'fall', name: 'Pumpkin', color: 'orange', svg: `<path fill="${BROWN}" d="M46 32c0-8 2-12 8-16l4 5c-4 3-5 6-5 11z"/><ellipse fill="{C}" cx="50" cy="60" rx="38" ry="28"/><path d="M50 32c-12 6-12 50 0 56M50 32c12 6 12 50 0 56M34 36c-10 10-10 38 0 48M66 36c10 10 10 38 0 48"/>` },
  { id: 'acorn', set: 'fall', name: 'Acorn', color: 'tan', svg: `<path d="M50 24v-10"/><path fill="{C}" d="M28 44h44c0 24-11 38-22 44-11-6-22-20-22-44z"/><path fill="${BROWN}" d="M22 46a28 22 0 0 1 56 0z"/><path d="M36 36l4 5M48 32l3 6M61 34l-4 6"/>` },

  // winter
  { id: 'snowflake', set: 'winter', name: 'Snowflake', color: 'sky', svg: `${spin([0, 60, 120], `<path stroke-width="9" d="${flake}"/>`)}${spin([0, 60, 120], `<path stroke="{C}" stroke-width="4.500" d="${flake}"/>`)}` },
  { id: 'snowman', set: 'winter', name: 'Snowman', color: 'rose', svg: `<circle fill="${CREAM}" cx="50" cy="66" r="24"/><circle fill="${CREAM}" cx="50" cy="34" r="16"/><path fill="${INK}" d="M36 21h28v-4h-6V6H42v11h-6z"/><path fill="{C}" d="M36 44c8 6 20 6 28 0l2 7c-9 6-23 6-32 0z"/><path fill="{C}" d="M58 51l8 2-3 16-8-2z"/><circle fill="${INK}" stroke="none" cx="44" cy="31" r="2"/><circle fill="${INK}" stroke="none" cx="56" cy="31" r="2"/><path fill="#F7AD6F" stroke-width="2" d="M50 35l12 3-12 2z"/><circle fill="${INK}" stroke="none" cx="50" cy="62" r="2.200"/><circle fill="${INK}" stroke="none" cx="50" cy="74" r="2.200"/>` },
  { id: 'mitten', set: 'winter', name: 'Mitten', color: 'red', svg: `<path fill="{C}" d="M34 46V30a16 16 0 0 1 32 0v8c4-6 14-4 12 4-1 5-6 8-12 12v10H34z"/><rect fill="${CREAM}" x="30" y="64" width="40" height="20" rx="5"/><path d="M40 69v10M50 69v10M60 69v10"/>` },

  // christmas
  { id: 'xmastree', set: 'christmas', name: 'Christmas tree', color: 'green', svg: `<rect fill="${BROWN}" x="44" y="78" width="12" height="12"/><path fill="{C}" d="M50 16 32 42h8L24 62h10L16 80h68L66 62h10L60 42h8z"/><path fill="${YELLOW}" stroke-width="2" d="m50 4 3 7 7 .800-5.500 4.700 1.800 7.500L50 20l-6.300 4 1.800-7.500L40 11.800l7-.800z"/><circle fill="${RED}" stroke-width="2" cx="44" cy="52" r="3.500"/><circle fill="${YELLOW}" stroke-width="2" cx="58" cy="64" r="3.500"/><circle fill="${BLUE}" stroke-width="2" cx="38" cy="72" r="3.500"/><circle fill="#F3A3BA" stroke-width="2" cx="63" cy="74" r="3.500"/>` },
  { id: 'gift', set: 'christmas', name: 'Gift', color: 'red', svg: `<rect fill="{C}" x="18" y="42" width="64" height="44" rx="4"/><rect fill="{C}" x="12" y="30" width="76" height="14" rx="4"/><path fill="${CREAM}" d="M44 30h12v56H44z"/><path fill="${CREAM}" d="M50 30c-10-18-26-14-22-4 2 5 12 5 22 4zM50 30c10-18 26-14 22-4-2 5-12 5-22 4z"/>` },
  { id: 'stocking', set: 'christmas', name: 'Stocking', color: 'red', svg: `<path fill="{C}" d="M36 30h28v28c0 8-4 12-10 16l-12 8c-8 5-18 2-20-6s4-14 10-16l4-2z"/><rect fill="${CREAM}" x="32" y="14" width="36" height="18" rx="5"/>` },
  { id: 'candycane', set: 'christmas', name: 'Candy cane', color: 'red', svg: `<path stroke-width="17" d="${cane}"/><path stroke="${CREAM}" stroke-width="11" d="${cane}"/><path stroke="{C}" stroke-width="11" stroke-dasharray="9 11" stroke-linecap="butt" d="${cane}"/>` },
  { id: 'bauble', set: 'christmas', name: 'Ornament', color: 'rose', svg: `<circle cx="50" cy="14" r="5"/><rect fill="${YELLOW}" x="42" y="19" width="16" height="10" rx="2"/><circle fill="{C}" cx="50" cy="58" r="30"/><path stroke="${CREAM}" d="M24 56l7 8 6-8 7 8 6-8 6 8 7-8 6 8 7-8"/>` },

  // hanukkah
  { id: 'menorah', set: 'hanukkah', name: 'Menorah', color: 'blue', svg: `${outlined(menorah)}${[14, 26, 38, 62, 74, 86].map((x) => flame(x, 34)).join('')}${flame(50, 28)}` },
  { id: 'dreidel', set: 'hanukkah', name: 'Dreidel', color: 'blue', svg: `<rect fill="${BROWN}" x="45" y="10" width="10" height="18" rx="2"/><path fill="{C}" d="M26 28h48v30L50 88 26 58z"/><path stroke="${CREAM}" stroke-width="5" d="M42 38h11v18H41"/>` },
  { id: 'magen', set: 'hanukkah', name: 'Star of David', color: 'blue', svg: outlined('M50 12 83 70H17zM50 88 17 30h66z') },
  { id: 'sufganiyah', set: 'hanukkah', name: 'Sufganiyah', color: 'red', svg: `<ellipse fill="${TAN}" cx="50" cy="56" rx="38" ry="28"/><path fill="${CREAM}" stroke-width="2" d="M18 46c8-18 56-18 64 0-8 8-56 8-64 0z"/><circle fill="{C}" cx="50" cy="42" r="9"/>` },
  { id: 'gelt', set: 'hanukkah', name: 'Gelt', color: 'butter', svg: `<circle fill="{C}" cx="50" cy="50" r="36"/><circle cx="50" cy="50" r="28" stroke-width="2" stroke-dasharray="3 5"/><path fill="${CREAM}" d="m50 32 5 11 12 1.500-9 8 2.500 12L50 58l-10.500 6.500 2.500-12-9-8 12-1.500z"/>` },
  { id: 'candle', set: 'hanukkah', name: 'Candle', color: 'sky', svg: `<rect fill="{C}" x="40" y="38" width="20" height="50" rx="3"/><path d="M50 38v-6"/><path fill="${YELLOW}" d="M50 30c-7-6-5-13 0-20 5 7 7 14 0 20z"/><path stroke="${CREAM}" d="M46 50v26"/>` },

  // books
  { id: 'openbook', set: 'books', name: 'Open book', color: 'sky', svg: `<path fill="{C}" d="M8 28c14-6 28-6 42 2 14-8 28-8 42-2v52c-14-6-28-6-42 2-14-8-28-8-42-2z"/><path fill="${CREAM}" d="M14 33c12-4 24-3 36 4v40c-12-7-24-8-36-4zM86 33c-12-4-24-3-36 4v40c12-7 24-8 36-4z"/><path stroke-width="2.500" d="M22 46c7-2 13-1 20 2M22 57c7-2 13-1 20 2M58 48c7-3 13-4 20-2M58 59c7-3 13-4 20-2"/>` },
  { id: 'bookstack', set: 'books', name: 'Stack of books', color: 'rose', svg: `<rect fill="{C}" x="16" y="64" width="68" height="18" rx="3"/><rect fill="${YELLOW}" x="22" y="46" width="60" height="18" rx="3"/><rect fill="${BLUE}" x="14" y="28" width="64" height="18" rx="3"/><path d="M26 73h22M32 55h18M24 37h20"/><path d="M10 84h80"/>` },
  { id: 'book', set: 'books', name: 'Book', color: 'lilac', svg: `<path fill="${RED}" d="M56 80v16l6-5 6 5V80z"/><rect fill="{C}" x="22" y="10" width="56" height="76" rx="5"/><path d="M34 10v76"/><rect fill="${CREAM}" x="42" y="24" width="28" height="16" rx="2"/><path d="M48 32h16"/>` },
  { id: 'bookmark', set: 'books', name: 'Bookmark', color: 'mint', svg: `<path fill="{C}" d="M32 8h36v84L50 76 32 92z"/><path fill="${CREAM}" d="m50 26 4 9 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z"/>` },
  { id: 'glasses', set: 'books', name: 'Reading glasses', color: 'butter', svg: `<circle fill="{C}" fill-opacity=".55" cx="30" cy="54" r="17"/><circle fill="{C}" fill-opacity=".55" cx="70" cy="54" r="17"/><path stroke-width="4" d="M46 51c3-3 5-3 8 0M13 50 8 34M87 50l5-16"/>` },

  // cactus
  { id: 'saguaro', set: 'cactus', name: 'Tall cactus', color: 'green', svg: `<path fill="{C}" d="M40 54H30a7 7 0 0 1-7-7V36a5 5 0 0 1 10 0v8h7zM60 46h10a7 7 0 0 0 7-7v-9a5 5 0 0 0-10 0v6h-7z"/><rect fill="{C}" x="39" y="12" width="22" height="64" rx="11"/><path stroke-width="2" d="M50 22v5M50 36v5M50 50v5M50 64v4"/><path fill="${TAN}" d="M28 72h44l-5 18H33z"/>` },
  { id: 'roundcactus', set: 'cactus', name: 'Round cactus', color: 'green', svg: `<ellipse fill="{C}" cx="50" cy="52" rx="27" ry="25"/><path stroke-width="2" d="M50 28v48M38 32c-7 12-7 28 0 40M62 32c7 12 7 28 0 40"/><circle fill="#F3A3BA" cx="50" cy="24" r="8"/><circle fill="${YELLOW}" stroke-width="2" cx="50" cy="24" r="3"/><path fill="${TAN}" d="M28 70h44l-5 20H33z"/>` },
  { id: 'pricklypear', set: 'cactus', name: 'Prickly pear', color: 'green', svg: `<ellipse fill="{C}" cx="30" cy="40" rx="13" ry="18" transform="rotate(-25 30 40)"/><ellipse fill="{C}" cx="70" cy="38" rx="13" ry="18" transform="rotate(25 70 38)"/><ellipse fill="{C}" cx="50" cy="64" rx="19" ry="25"/><circle fill="${RED}" cx="22" cy="20" r="5"/><circle fill="${RED}" cx="79" cy="18" r="5"/><path stroke-width="2" d="M44 56l-3-3M57 60l3-3M48 74l-3 3M30 38l-3-3M70 36l3-3"/>` },
  { id: 'succulent', set: 'cactus', name: 'Succulent', color: 'sage', svg: `${[-64, -32, 0, 32, 64].map((a) => `<path fill="{C}" transform="rotate(${a} 50 68)" d="M50 68c-9-13-9-28 0-44 9 16 9 31 0 44z"/>`).join('')}<path fill="${TAN}" d="M28 66h44l-5 24H33z"/>` },

  // mushrooms
  { id: 'toadstools', set: 'mushrooms', name: 'Toadstools', color: 'red', svg: `<path fill="${CREAM}" d="M36 50h16l3 34a4 4 0 0 1-4 4H37a4 4 0 0 1-4-4z"/><path fill="{C}" d="M12 52a32 30 0 0 1 64 0z"/><circle fill="${CREAM}" cx="32" cy="38" r="5"/><circle fill="${CREAM}" cx="52" cy="32" r="5"/><circle fill="${CREAM}" cx="64" cy="44" r="3"/><path fill="${CREAM}" d="M72 72h10l2 13a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3z"/><path fill="{C}" d="M60 74a17 15 0 0 1 34 0z"/>` },
  { id: 'porcini', set: 'mushrooms', name: 'Brown mushroom', color: 'tan', svg: `<path fill="${CREAM}" d="M36 50h28c6 14 8 26 2 36a6 6 0 0 1-5 3H39a6 6 0 0 1-5-3c-6-10-4-22 2-36z"/><path fill="{C}" d="M12 52c0-22 16-36 38-36s38 14 38 36c-10 6-66 6-76 0z"/>` },
  { id: 'slimshrooms', set: 'mushrooms', name: 'Little mushrooms', color: 'lilac', svg: `<path stroke-width="5" d="M34 88c0-16 2-27 6-38M52 88c0-20-1-34-2-50M68 88c0-13-2-22-6-32"/><path fill="{C}" d="M26 52a14 12 0 0 1 28 0z"/><path fill="{C}" d="M33 40a17 15 0 0 1 34 0z"/><path fill="{C}" d="M50 58a12 10 0 0 1 24 0z"/><path d="M14 88h72"/>` },
  { id: 'shroomhouse', set: 'mushrooms', name: 'Mushroom house', color: 'red', svg: `<path fill="${CREAM}" d="M30 54h40v30a4 4 0 0 1-4 4H34a4 4 0 0 1-4-4z"/><path fill="{C}" d="M10 56c0-24 18-40 40-40s40 16 40 40z"/><path fill="${BROWN}" d="M43 88V72a7 7 0 0 1 14 0v16z"/><circle fill="${CREAM}" cx="34" cy="40" r="5"/><circle fill="${CREAM}" cx="56" cy="30" r="6"/><circle fill="${CREAM}" cx="73" cy="44" r="4"/>` },

  // birds
  { id: 'roundbird', set: 'birds', name: 'Little bird', color: 'sky', svg: `<path fill="{C}" d="M68 58c10 0 19 4 24 11-11 2-19 0-26-5z"/><ellipse fill="{C}" cx="48" cy="54" rx="28" ry="26"/><path fill="#F7AD6F" d="M22 47l-13 4 13 6z"/><circle fill="${INK}" stroke="none" cx="35" cy="46" r="3"/><path d="M44 58c6 7 17 7 23-2M42 79v9M54 80v8M37 88h9M49 88h9"/>` },
  { id: 'flyingbird', set: 'birds', name: 'Flying bird', color: 'lilac', svg: `<path fill="{C}" d="M12 56c10-10 24-12 38-8l36-9-24 19c-10 12-28 14-42 6z"/><path fill="{C}" d="M44 51c4-17 14-27 28-31-2 15-8 25-18 33z"/><path fill="#F7AD6F" stroke-width="2" d="M13 55l-9 3 10 3z"/><circle fill="${INK}" stroke="none" cx="23" cy="54" r="2.200"/>` },
  { id: 'owl', set: 'birds', name: 'Owl', color: 'tan', svg: `<path fill="{C}" d="M24 32c0-10 6-17 10-19 4 6 28 6 32 0 4 2 10 9 10 19v28a26 26 0 0 1-52 0z"/><circle fill="${CREAM}" cx="38" cy="41" r="11"/><circle fill="${CREAM}" cx="62" cy="41" r="11"/><circle fill="${INK}" stroke="none" cx="38" cy="41" r="4"/><circle fill="${INK}" stroke="none" cx="62" cy="41" r="4"/><path fill="#F7AD6F" stroke-width="2" d="M46 51h8l-4 8z"/><path stroke-width="2.500" d="M40 67c3 3 6 3 9 0M51 67c3 3 6 3 9 0M44 75c2 3 4 3 6 0M50 75c2 3 4 3 6 0"/>` },
  { id: 'feather', set: 'birds', name: 'Feather', color: 'teal', svg: `<path fill="{C}" d="M80 10c8 30-8 60-42 68-4-30 12-58 42-68z"/><path d="M78 14C58 34 38 60 20 92"/><path stroke-width="2.500" d="M56 44l-11-5M49 55l-12-3M64 34l-9-7M62 40h12M54 52h13M46 64h12"/>` },
  { id: 'birdhouse', set: 'birds', name: 'Birdhouse', color: 'coral', svg: `<path d="M50 72v22"/><rect fill="${CREAM}" x="28" y="38" width="44" height="34" rx="3"/><path fill="{C}" d="M18 44 50 14l32 30z"/><circle fill="${INK}" cx="50" cy="52" r="7"/><path d="M43 64h14"/>` },
  { id: 'nest', set: 'birds', name: 'Nest', color: 'sky', svg: `<ellipse fill="{C}" cx="37" cy="50" rx="9" ry="12"/><ellipse fill="{C}" cx="53" cy="47" rx="9" ry="12"/><ellipse fill="{C}" cx="68" cy="51" rx="8" ry="11"/><path fill="${BROWN}" d="M12 56h76c0 18-17 30-38 30S12 74 12 56z"/><path stroke-width="2.500" d="M22 65c10 4 20 4 28 0M48 75c9 3 19 1 27-5"/>` },

  // lights
  { id: 'bulb', set: 'lights', name: 'Light bulb', color: 'butter', svg: `${spin([-60, -30, 0, 30, 60], `<path d="M50 2v6"/>`).replace(/50 50/g, '50 40')}<path fill="{C}" d="M50 16a24 24 0 0 0-15 43c4 3 5 7 5 11h20c0-4 1-8 5-11a24 24 0 0 0-15-43z"/><rect fill="#C8C5D0" x="40" y="70" width="20" height="13" rx="3"/><path d="M44 89h12M44 46l6 8 6-8M50 54v16"/>` },
  { id: 'stringlights', set: 'lights', name: 'String lights', color: 'rose', fixed: true, svg: `<path d="M4 24c22 26 70 26 92 0"/>${[[14, 33, '#F3A3BA'], [32, 41, YELLOW], [50, 44, BLUE], [68, 41, GREEN], [86, 33, '#C9B6F0']].map(([x, y, f]) => `<rect fill="#C8C5D0" stroke-width="2" x="${Number(x) - 4}" y="${y}" width="8" height="6"/><ellipse fill="${f}" cx="${x}" cy="${Number(y) + 16}" rx="8" ry="10"/>`).join('')}` },
  { id: 'lantern', set: 'lights', name: 'Lantern', color: 'butter', svg: `<path d="M50 6v10"/><path fill="{C}" d="M30 24h40l4 50H26z"/><path fill="${YELLOW}" stroke-width="2" d="M50 64c-8-7-6-15 0-23 6 8 8 16 0 23z"/><path d="M41 24l-3 50M59 24l3 50"/><rect fill="${INK}" x="34" y="14" width="32" height="10" rx="3"/><rect fill="${INK}" x="24" y="74" width="52" height="11" rx="3"/>` },
  { id: 'starlight', set: 'lights', name: 'Star lantern', color: 'butter', svg: `<path d="M50 2v16"/><path fill="{C}" d="m50 18 9.500 20 22 2.800-16 15.200 4 21.800L50 67 30.500 77.800l4-21.800-16-15.200 22-2.800z"/><path stroke="${CREAM}" stroke-width="2.500" d="M50 30v24M40 42h20"/>` },
  { id: 'desklamp', set: 'lights', name: 'Desk lamp', color: 'mint', svg: `<path fill="${YELLOW}" fill-opacity=".6" stroke-width="2" d="M64 50l20 34H52z"/><path stroke-width="5" d="M42 82 34 52l22-20"/><path fill="{C}" d="M50 18l32 22-20 14z"/><rect fill="${INK}" x="20" y="82" width="44" height="9" rx="3"/>` },

  // sports
  { id: 'soccer', set: 'sports', name: 'Football', color: 'grey', fixed: true, svg: `<circle fill="${CREAM}" cx="50" cy="50" r="38"/><path fill="${INK}" d="m50 34 15 11-6 18H41l-6-18z"/><path d="M50 34V13M65 45l20-7M59 63l12 18M41 63 29 81M35 45l-20-7"/>` },
  { id: 'basketball', set: 'sports', name: 'Basketball', color: 'orange', svg: `<circle fill="{C}" cx="50" cy="50" r="38"/><path d="M12 50h76M50 12v76M22 24c14 12 14 40 0 52M78 24c-14 12-14 40 0 52"/>` },
  { id: 'tennis', set: 'sports', name: 'Tennis ball', color: 'lime', svg: `<circle fill="{C}" cx="50" cy="50" r="38"/><path stroke="${CREAM}" stroke-width="4" d="M21 26c16 10 16 38 0 48M79 26c-16 10-16 38 0 48"/>` },
  { id: 'trophy', set: 'sports', name: 'Trophy', color: 'butter', svg: `<path d="M30 26H18c0 14 6 22 16 24M70 26h12c0 14-6 22-16 24"/><path fill="{C}" d="M30 16h40v22a20 20 0 0 1-40 0z"/><path fill="{C}" d="M44 58h12v12H44z"/><rect fill="${BROWN}" x="32" y="70" width="36" height="14" rx="3"/>` },
  { id: 'dumbbell', set: 'sports', name: 'Dumbbell', color: 'sky', svg: `<rect fill="#C8C5D0" x="30" y="46" width="40" height="8"/><rect fill="{C}" x="14" y="30" width="16" height="40" rx="5"/><rect fill="{C}" x="70" y="30" width="16" height="40" rx="5"/><rect fill="{C}" x="6" y="38" width="8" height="24" rx="3"/><rect fill="{C}" x="86" y="38" width="8" height="24" rx="3"/>` },
  { id: 'medal', set: 'sports', name: 'Medal', color: 'butter', svg: `<path fill="${BLUE}" d="M34 8h14l8 30H42z"/><path fill="${RED}" d="M66 8H52l-8 30h14z"/><circle fill="{C}" cx="50" cy="62" r="26"/><path fill="${CREAM}" d="m50 48 4 9 10 1-7.500 6.500 2.200 9.500L50 69l-8.700 5 2.200-9.500L36 58l10-1z"/>` },
];

const BY_ID = new Map(DRAWN_STICKERS.map((s) => [s.id, s]));
export const drawnSticker = (id: string | undefined) => (id ? BY_ID.get(id) : undefined);

/** Renders one drawn sticker. The markup is static and written here, never user input. */
export function DrawnStickerArt({ id, color }: { id: string; color?: string }) {
  const art = BY_ID.get(id);
  if (!art) return null;
  const hex = TAPE_COLORS[color ?? art.color] ?? TAPE_COLORS[art.color] ?? TAPE_COLORS.rose;
  const body = `<g fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${art.svg.split('{C}').join(hex)}</g>`;
  return <svg className="drawn-sticker" viewBox="0 0 100 100" aria-hidden="true" dangerouslySetInnerHTML={{ __html: body }} />;
}
