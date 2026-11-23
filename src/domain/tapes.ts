import { drawnSticker } from '../stickers/drawn';
import { TAPE_COLORS } from './types';

// Themed washi tapes. The plain patterns (stripes, dots…) are drawn by the
// stylesheet; these are small SVG tiles, repeated along the tape and scaled to
// its height, so they work with every tape colour, edge and "see-through".
// A tile is 40 units tall. "{rose}" in a tile is a colour from TAPE_COLORS;
// when the tape itself has that colour the motif turns cream, so it still shows.
// To add a tape: append an entry to THEMED_TAPES.

const INK = '#3A2B47';
const CREAM = '#FFFDF9';
const H = 40;

export const TAPE_THEMES = [
  { id: 'basics', name: 'Basics' },
  { id: 'flowers', name: 'Flowers' },
  { id: 'leaves', name: 'Leaves' },
  { id: 'fruit', name: 'Fruit' },
  { id: 'autumn', name: 'Autumn' },
  { id: 'winter', name: 'Winter' },
  { id: 'holidays', name: 'Holidays' },
  { id: 'love', name: 'Hearts' },
  { id: 'sky', name: 'Sky' },
  { id: 'ocean', name: 'Ocean' },
  { id: 'travel', name: 'Travel' },
  { id: 'cosy', name: 'Cosy' },
  { id: 'animals', name: 'Animals' },
  { id: 'patterns', name: 'Patterns' },
  { id: 'words', name: 'Words' },
] as const;
export type TapeTheme = (typeof TAPE_THEMES)[number]['id'];

interface Tape<I extends string> {
  id: I;
  name: string;
  theme: TapeTheme;
  /** Tile width in units (the height is always 40). */
  w: number;
  body: string;
}

/** A drawn sticker placed on a tile. */
const motif = (id: string, x: number, y: number, size: number, rot = 0, color?: string): string => {
  const art = drawnSticker(id);
  if (!art) return '';
  const c = `{${color ?? art.color}}`;
  return `<g transform="translate(${x} ${y}) scale(${size / 100})${rot ? ` rotate(${rot} 50 50)` : ''}" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round">${art.svg.split('{C}').join(c)}</g>`;
};

type Item = [id: string, color?: string, size?: number, rot?: number, dy?: number];

/** Stickers in a row, repeated along the tape. */
const strip = <I extends string>(id: I, name: string, theme: TapeTheme, items: Item[], gap = 9): Tape<I> => {
  let x = gap / 2;
  let body = '';
  for (const [art, color, size = 30, rot = 0, dy = 0] of items) {
    body += motif(art, x, (H - size) / 2 + dy, size, rot, color);
    x += size + gap;
  }
  return { id, name, theme, w: Math.round(x - gap / 2), body };
};

const tile = <I extends string>(id: I, name: string, theme: TapeTheme, w: number, body: string): Tape<I> => ({ id, name, theme, w, body });

const thin = `fill="none" stroke="${INK}" stroke-linecap="round" stroke-linejoin="round"`;
const flower = (cx: number, cy: number, r: number, petal: string, centre = '{butter}') =>
  [0, 72, 144, 216, 288]
    .map((a) => {
      const t = ((a - 90) * Math.PI) / 180;
      return `<circle cx="${(cx + Math.cos(t) * r * 0.62).toFixed(1)}" cy="${(cy + Math.sin(t) * r * 0.62).toFixed(1)}" r="${(r * 0.5).toFixed(1)}" fill="${petal}" stroke="${INK}" stroke-width="1.1"/>`;
    })
    .join('') + `<circle cx="${cx}" cy="${cy}" r="${(r * 0.36).toFixed(1)}" fill="${centre}" stroke="${INK}" stroke-width="1.1"/>`;
const leafAt = (x: number, y: number, rot: number, fill = '{green}', s = 1) =>
  `<path transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" fill="${fill}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round" d="M0 0c-5-4-6-10 0-16 6 6 5 12 0 16z"/>`;
const drop = (x: number, y: number, s = 1, fill = '{sky}') =>
  `<path transform="translate(${x} ${y}) scale(${s})" fill="${fill}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round" d="M0-8c4 6 6 9 6 12a6 6 0 0 1-12 0c0-3 2-6 6-12z"/>`;
const spot = (cx: number, cy: number, rx: number, ry: number, rot: number) =>
  `<g transform="rotate(${rot} ${cx} ${cy})"><ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.5}" ry="${ry * 0.5}" fill="#B98B6B"/><path ${thin} stroke-width="2.4" d="M${cx - rx} ${cy + 1.5}a${rx} ${ry} 0 0 1 ${rx * 1.25} ${-ry - 1}M${cx + rx} ${cy - 1.5}a${rx} ${ry} 0 0 1 ${-rx * 1.1} ${ry + 1}"/></g>`;

const word = <I extends string>(id: I, text: string): Tape<I> => {
  // textLength pins the width, so the word fits its tile whatever serif the device has
  const tw = Math.round(text.length * 10.4 + 6);
  const heart = tw + 22;
  return tile(
    id,
    `"${text}"`,
    'words',
    tw + 38,
    `<text x="6" y="27.500" textLength="${tw}" lengthAdjust="spacingAndGlyphs" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-weight="700" font-size="21" fill="${INK}" fill-opacity=".86">${text}</text><path fill="${CREAM}" stroke="${INK}" stroke-width="1.1" d="M${heart} 26l-4.500-4.500a2.700 2.700 0 0 1 4.500-2.800 2.700 2.700 0 0 1 4.500 2.800z"/>`,
  );
};

const spines = [
  [2, 9, 26, 'rose'], [12, 7, 31, 'sky'], [20, 10, 22, 'butter'], [31, 8, 28, 'mint'], [40, 9, 24, 'lilac'], [50, 7, 32, 'peach'], [58, 10, 25, 'teal'], [69, 9, 29, 'coral'],
] as const;

export const THEMED_TAPES = [
  // flowers
  strip('daisies', 'Daisies', 'flowers', [['daisy', 'lilac', 30, 0], ['daisy', 'rose', 24, 20, 3], ['daisy', 'butter', 30, 10], ['daisy', 'sky', 24, -15, -3]], 7),
  strip('tulips', 'Tulips', 'flowers', [['tulip', 'rose', 34, -6], ['tulip', 'butter', 34, 6], ['tulip', 'lilac', 34, -4]], 4),
  tile('blossom', 'Blossom', 'flowers', 56, `${flower(12, 13, 8, '{rose}')}${flower(40, 27, 8, '{peach}')}${flower(28, 8, 4.5, '{butter}', '{rose}')}${flower(52, 9, 4.5, '{lilac}')}${flower(10, 33, 4.5, '{lilac}')}${leafAt(25, 30, 60, '{green}', 0.6)}${leafAt(46, 14, -120, '{green}', 0.6)}`),
  tile('meadow', 'Meadow', 'flowers', 60, `<path ${thin} stroke-width="1.6" d="M8 40V22M24 40V14M40 40V24M54 40V17"/>${leafAt(8, 34, 55, '{green}', 0.7)}${leafAt(24, 32, -55, '{green}', 0.7)}${leafAt(40, 36, 55, '{green}', 0.6)}${leafAt(54, 32, -55, '{green}', 0.7)}${flower(8, 20, 6.5, '{rose}')}${flower(24, 12, 7, '{butter}', '{orange}')}${flower(40, 22, 6, '{lilac}')}${flower(54, 15, 6.5, '{coral}')}`),
  // leaves
  strip('ferns', 'Leaves', 'leaves', [['leaf', 'green', 30, -35], ['leaf', 'sage', 26, 40, 2], ['leaf', 'mint', 30, -20], ['leaf', 'green', 24, 60, -2]], 6),
  tile('vine', 'Vine', 'leaves', 64, `<path ${thin} stroke-width="1.8" d="M0 20q16-13 32 0t32 0"/>${leafAt(10, 14, -30)}${leafAt(22, 15, 30, '{sage}')}${leafAt(42, 26, 150)}${leafAt(54, 25, 210, '{sage}')}${leafAt(32, 20, 90, '{mint}', 0.7)}${leafAt(0, 20, 90, '{mint}', 0.7)}${leafAt(64, 20, 90, '{mint}', 0.7)}`),
  tile('eucalyptus', 'Eucalyptus', 'leaves', 48, `<path ${thin} stroke-width="1.6" d="M0 20h48"/>${[6, 30].map((x) => `<ellipse cx="${x}" cy="12.500" rx="6.500" ry="5.500" fill="{sage}" stroke="${INK}" stroke-width="1.2"/>`).join('')}${[18, 42].map((x) => `<ellipse cx="${x}" cy="27.500" rx="6.500" ry="5.500" fill="{mint}" stroke="${INK}" stroke-width="1.2"/>`).join('')}`),
  strip('cacti', 'Cacti', 'leaves', [['saguaro', 'green', 32], ['roundcactus', 'green', 30], ['succulent', 'sage', 30], ['pricklypear', 'green', 30]], 6),
  strip('sprouts', 'Sprouts', 'leaves', [['sprout', 'green', 30], ['sprout', 'sage', 26, 0, 2], ['wateringcan', 'mint', 30]], 8),
  // fruit
  strip('lemons', 'Lemons', 'fruit', [['lemon', 'butter', 32, -12], ['lemon', 'butter', 26, 20, 2], ['leaf', 'green', 20, 40]], 6),
  strip('strawberries', 'Strawberries', 'fruit', [['strawberry', 'red', 30, -10], ['strawberry', 'red', 24, 14, 3], ['daisy', 'rose', 18, 0, -6]], 7),
  strip('cherries', 'Cherries', 'fruit', [['cherry', 'red', 32], ['cherry', 'rose', 26, -14, 2]], 9),
  strip('apples', 'Apples', 'fruit', [['apple', 'red', 30, -8], ['apple', 'green', 30, 8], ['apple', 'butter', 30, -4]], 7),
  strip('citrus', 'Citrus slices', 'fruit', [['orange', 'orange', 30], ['orange', 'butter', 26, 20], ['orange', 'coral', 30, 40], ['orange', 'lime', 26, 10]], 7),
  strip('watermelons', 'Watermelon', 'fruit', [['watermelon', 'red', 34, -10], ['watermelon', 'rose', 28, 12, 2]], 8),
  // autumn
  strip('autumnleaves', 'Autumn leaves', 'autumn', [['maple', 'orange', 30, -20], ['maple', 'red', 24, 30, 3], ['maple', 'butter', 30, 15], ['acorn', 'tan', 22, -10, -3]], 6),
  strip('pumpkins', 'Pumpkins', 'autumn', [['pumpkin', 'orange', 32], ['pumpkin', 'peach', 24, 0, 4], ['maple', 'red', 20, 25, -2]], 7),
  strip('woodland', 'Woodland', 'autumn', [['mushroom', 'red', 28], ['acorn', 'tan', 26, 10], ['toadstools', 'coral', 30], ['leaf', 'orange', 24, 35]], 7),
  strip('knits', 'Knits', 'autumn', [['yarn', 'rose', 30], ['mitten', 'coral', 28, -8], ['yarn', 'butter', 30], ['mug', 'peach', 28]], 7),
  // winter
  strip('snowflakes', 'Big snowflakes', 'winter', [['snowflake', 'sky', 30], ['snowflake', 'blue', 20, 30, 5], ['snowflake', 'teal', 26, 15, -3], ['snowflake', 'lilac', 18, 0, 6]], 7),
  strip('snowmen', 'Snowmen', 'winter', [['snowman', 'rose', 32], ['mitten', 'red', 26, -10], ['snowflake', 'sky', 20, 0, -4], ['pine', 'green', 30]], 7),
  // holidays
  strip('christmas', 'Christmas trees', 'holidays', [['xmastree', 'green', 34], ['gift', 'red', 26, -6, 3], ['xmastree', 'sage', 30, 0, 2], ['bauble', 'rose', 26, 8, 2]], 6),
  strip('candycanes', 'Candy canes', 'holidays', [['candycane', 'red', 32, -15], ['holly', 'green', 28], ['candycane', 'green', 32, 15], ['stocking', 'red', 28, 8]], 6),
  strip('holly', 'Holly', 'holidays', [['holly', 'green', 32], ['holly', 'sage', 26, 20, 2]], 9),
  strip('hanukkah', 'Hanukkah', 'holidays', [['menorah', 'blue', 32], ['dreidel', 'sky', 28, 12], ['magen', 'blue', 28], ['gelt', 'butter', 26, 0, 2]], 7),
  strip('dreidels', 'Dreidels', 'holidays', [['dreidel', 'blue', 30, -14], ['sufganiyah', 'red', 28], ['dreidel', 'lilac', 30, 14], ['candle', 'sky', 30]], 7),
  strip('party', 'Party', 'holidays', [['balloon', 'rose', 32, -8], ['partyhat', 'lilac', 28, 10], ['cake', 'peach', 30], ['balloon', 'sky', 30, 8], ['gift', 'butter', 26, 0, 3]], 6),
  // hearts
  strip('sweethearts', 'Sweethearts', 'love', [['heart', 'rose', 28, -12], ['heart', 'red', 20, 14, 4], ['heart', 'berry', 26, 8, -2], ['heart', 'lilac', 18, -10, 5]], 7),
  strip('loveletters', 'Love letters', 'love', [['letter', 'rose', 32, -6], ['heart', 'red', 18, 10, -4], ['letter', 'red', 28, 8, 2], ['heart', 'rose', 16, -10, 6]], 7),
  // sky
  strip('starsmoons', 'Stars and moons', 'sky', [['moon', 'butter', 28, -20], ['star', 'butter', 20, 10, 5], ['sparkle', 'butter', 24], ['star', 'peach', 16, -10, -6]], 8),
  strip('clouds', 'Clouds', 'sky', [['cloud', 'sky', 34], ['cloud', 'grey', 26, 0, 5], ['cloud', 'sky', 30, 0, -4]], 7),
  strip('rainbows', 'Rainbows', 'sky', [['rainbow', undefined, 34], ['cloud', 'sky', 24, 0, 4], ['sun', 'butter', 28]], 8),
  tile('raindrops', 'Raindrops', 'sky', 44, `${drop(6, 13)}${drop(21, 27, 0.8, '{blue}')}${drop(36, 12, 0.9, '{teal}')}${drop(6, 35, 0.6, '{blue}')}${drop(36, 34, 0.6)}${drop(21, 7, 0.5)}`),
  strip('rainyday', 'Rainy day', 'sky', [['raincloud', 'sky', 32], ['umbrella', 'rose', 30, 10], ['raincloud', 'grey', 28, 0, 2], ['drop', 'sky', 18, 0, 4]], 7),
  // ocean
  strip('shells', 'Shells', 'ocean', [['shell', 'peach', 28], ['starfish', 'coral', 26, 15], ['shell', 'rose', 22, -20, 4], ['starfish', 'butter', 20, -10, -4]], 8),
  strip('fishes', 'Little fish', 'ocean', [['fish', 'sky', 28], ['fish', 'coral', 22, 0, 6], ['wave', 'teal', 26], ['fish', 'butter', 24, 0, -4]], 8),
  strip('anchors', 'Anchors', 'ocean', [['anchor', 'blue', 30], ['wave', 'sky', 26, 0, 3], ['anchor', 'red', 30], ['beachball', 'rose', 24, 15, 2]], 8),
  tile('seawaves', 'Sea waves', 'ocean', 40, `<path fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="3" stroke-linecap="round" d="M-2 9q10.500-8 21 0t21 0"/><path fill="none" stroke="{blue}" stroke-width="3" stroke-linecap="round" d="M-12 20q10.500-8 21 0t21 0 21 0"/><path fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="3" stroke-linecap="round" d="M-2 31q10.500-8 21 0t21 0"/>`),
  // travel
  tile('travelstamps', 'Travel stamps', 'travel', 118, `<g ${thin} stroke-opacity=".75" stroke-width="1.6"><circle cx="20" cy="20" r="14"/><circle cx="20" cy="20" r="9.500"/><path d="M36 13q4-3 8 0t8 0M36 20q4-3 8 0t8 0M36 27q4-3 8 0t8 0"/></g><path fill="${INK}" fill-opacity=".75" d="m20 14 1.800 4 4.200.500-3.100 3 .800 4.300-3.700-2.100-3.700 2.100.800-4.300-3.100-3 4.200-.500z"/><rect x="60" y="6" width="23" height="28" rx="1.500" fill="${CREAM}" stroke="${INK}" stroke-width="1.300" stroke-dasharray="2.200 1.800"/>${motif('mountain', 62.500, 10.500, 18)}${motif('plane', 90, 9, 22, -8)}`),
  tile('airmail', 'Air mail', 'travel', 48, `<path fill="{red}" d="M4 0h12L8 40H-4z"/><path fill="#fff" fill-opacity=".8" d="M16 0h12l-8 40H8z"/><path fill="{blue}" d="M28 0h12l-8 40H20z"/><path fill="#fff" fill-opacity=".8" d="M40 0h12l-8 40H32z"/>`),
  strip('journey', 'Journey', 'travel', [['suitcase', 'peach', 28], ['plane', 'sky', 26, -10], ['pin', 'red', 26], ['globe', 'sky', 28], ['camera', 'lilac', 28]], 7),
  strip('camping', 'Camping', 'travel', [['tent', 'peach', 30], ['pine', 'green', 30], ['campfire', 'orange', 28], ['mountain', 'lilac', 32], ['compass', 'sky', 26]], 6),
  // cosy
  strip('coffee', 'Coffee', 'cosy', [['mug', 'rose', 30], ['bean', 'tan', 18, 20, 4], ['togo', 'peach', 30], ['bean', 'tan', 18, -30, -4]], 7),
  strip('books', 'Books', 'cosy', [['book', 'lilac', 30, -8], ['bookstack', 'rose', 30], ['openbook', 'sky', 30], ['glasses', 'butter', 26]], 7),
  tile('bookspines', 'Bookshelf', 'cosy', 80, `${spines.map(([x, w, h, c]) => `<rect x="${x}" y="${37 - h}" width="${w}" height="${h}" rx="1.200" fill="{${c}}" stroke="${INK}" stroke-width="1.200"/><path stroke="${INK}" stroke-width="1" stroke-opacity=".6" d="M${x + 1.5} ${42 - h}h${w - 3}"/>`).join('')}<path stroke="${INK}" stroke-width="1.600" d="M0 37.600h80"/>`),
  tile('musicnotes', 'Music notes', 'cosy', 76, `<path fill="none" stroke="${INK}" stroke-opacity=".3" stroke-width="1" d="M0 10h76M0 15h76M0 20h76M0 25h76M0 30h76"/><g fill="${INK}"><ellipse cx="12" cy="27" rx="4.300" ry="3.200" transform="rotate(-20 12 27)"/><ellipse cx="30" cy="22" rx="4.300" ry="3.200" transform="rotate(-20 30 22)"/><ellipse cx="50" cy="29.500" rx="4.300" ry="3.200" transform="rotate(-20 50 29.500)"/><ellipse cx="66" cy="17" rx="4.300" ry="3.200" transform="rotate(-20 66 17)"/></g><path ${thin} stroke-width="1.700" d="M16 26V9M34 21V4M54 28.500V11M62 18v17"/><path fill="none" stroke="${INK}" stroke-width="3.200" d="M16 9.500 34 4.500"/><path ${thin} stroke-width="1.700" d="M54 11c5 1 7 4 6 9"/>`),
  strip('playlist', 'Playlist', 'cosy', [['note', 'lilac', 28], ['headphones', 'rose', 28], ['record', 'butter', 28], ['note', 'sky', 24, 10, 2]], 8),
  strip('lights', 'Fairy lights', 'cosy', [['stringlights', undefined, 44], ['starlight', 'butter', 26, 0, 2], ['candle', 'rose', 28]], 5),
  // animals
  strip('cats', 'Cats', 'animals', [['cat', 'peach', 30], ['paw', 'tan', 18, -20, 5], ['cat', 'grey', 30], ['yarn', 'rose', 20, 0, 5]], 7),
  strip('dogs', 'Dogs', 'animals', [['dog', 'tan', 30], ['bone', undefined, 22, -20, 4], ['dog', 'peach', 30], ['paw', 'tan', 18, 20, 5]], 7),
  strip('paws', 'Paw prints', 'animals', [['paw', 'tan', 24, -25, -4], ['paw', 'peach', 24, 25, 4], ['paw', 'grey', 24, -25, -4], ['paw', 'tan', 24, 25, 4]], 8),
  strip('bees', 'Bees', 'animals', [['bee', 'butter', 28, -10], ['daisy', 'lilac', 22, 0, 4], ['bee', 'butter', 24, 14, -3], ['daisy', 'rose', 20, 0, 5]], 8),
  strip('mushrooms', 'Mushrooms', 'animals', [['mushroom', 'red', 30], ['slimshrooms', 'lilac', 30], ['porcini', 'tan', 28], ['toadstools', 'red', 30]], 6),
  strip('birds', 'Birds', 'animals', [['roundbird', 'sky', 30], ['feather', 'teal', 26, 20], ['owl', 'tan', 30], ['birdhouse', 'coral', 30]], 7),
  strip('butterflies', 'Butterflies', 'animals', [['butterfly', 'lilac', 30, -15], ['butterfly', 'rose', 22, 20, 4], ['butterfly', 'butter', 28, 10, -2]], 9),
  // patterns
  tile('picnic', 'Picnic gingham', 'patterns', 20, `<path fill="#fff" fill-opacity=".5" d="M0 0h10v40H0z"/><path fill="#fff" fill-opacity=".5" d="M0 0h20v10H0zM0 20h20v10H0z"/>`),
  tile('tartan', 'Tartan', 'patterns', 40, `<path fill="#fff" fill-opacity=".3" d="M0 0h14v40H0zM0 0h40v14H0z"/><path fill="${INK}" fill-opacity=".22" d="M22 0h6v40h-6zM0 22h40v6H0z"/><path fill="none" stroke="{red}" stroke-width="1.500" d="M34.500 0v40M0 34.500h40"/><path fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="1" d="M7 0v40M0 7h40"/>`),
  tile('leopard', 'Leopard', 'patterns', 64, `${spot(10, 11, 7, 5.5, -20)}${spot(30, 26, 7.5, 5.5, 25)}${spot(50, 10, 6.5, 5, 10)}${spot(12, 31, 6, 4.5, 40)}${spot(54, 30, 7, 5, -30)}${spot(31, 6, 4.500, 3.500, 60)}`),
  tile('newspaper', 'Newspaper', 'patterns', 96, `<path fill="${CREAM}" fill-opacity=".55" d="M0 0h96v40H0z"/><g fill="none" stroke="${INK}" stroke-opacity=".62"><path stroke-width="3.400" d="M4 8h36M52 8h24"/><path stroke-width="1.200" d="M4 15h40M4 19h38M4 23h40M4 27h30M4 31h40M4 35h36M52 15h40M52 19h34M52 23h40M52 27h38M52 31h28M52 35h40"/><path stroke-width="1" d="M48 4v33"/></g>`),
  tile('measure', 'Measuring tape', 'patterns', 500, `${Array.from({ length: 50 }, (_, i) => `<path stroke="${INK}" stroke-width="${i % 5 === 0 ? 1.8 : 1.2}" d="M${i * 10 + 5} 0v${i % 10 === 0 ? 17 : i % 5 === 0 ? 12 : 7}"/>`).join('')}${Array.from({ length: 5 }, (_, i) => `<text x="${i * 100 + 5}" y="33" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="14" fill="${INK}">${i + 1}</text>`).join('')}<path stroke="${INK}" stroke-opacity=".5" stroke-width="1" d="M0 38.500h500"/>`),
  tile('kraft', 'Kraft paper', 'patterns', 90, `<path fill="#B98B6B" fill-opacity=".38" d="M0 0h90v40H0z"/><g fill="none" stroke="#6E4F38" stroke-opacity=".4" stroke-width=".9" stroke-linecap="round"><path d="M6 8l7 2M24 5l-5 4M40 12l8-1M62 6l5 3M80 11l-7 2M12 22l6-3M33 25l7 2M55 21l-6 3M72 27l8-2M5 34l7-1M26 36l-5-3M46 33l7 3M66 36l6-2M84 20l-4 4"/></g><g fill="#6E4F38" fill-opacity=".45"><circle cx="18" cy="14" r=".900"/><circle cx="50" cy="6" r=".800"/><circle cx="70" cy="17" r=".900"/><circle cx="36" cy="18" r=".700"/><circle cx="60" cy="30" r=".900"/><circle cx="16" cy="30" r=".800"/><circle cx="86" cy="32" r=".800"/></g>`),
  tile('doily', 'Lace doily', 'patterns', 40, `<g fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="1.500">${[5, 15, 25, 35].map((x) => `<circle cx="${x}" cy="3" r="4.500"/><circle cx="${x}" cy="37" r="4.500"/>`).join('')}<path d="M0 9.500h40M0 30.500h40"/><circle cx="20" cy="20" r="6.500"/><circle cx="0" cy="20" r="6.500"/><circle cx="40" cy="20" r="6.500"/></g><g fill="#fff" fill-opacity=".9"><circle cx="20" cy="20" r="2"/><circle cx="0" cy="20" r="2"/><circle cx="40" cy="20" r="2"/><circle cx="10" cy="14.500" r="1.300"/><circle cx="30" cy="14.500" r="1.300"/><circle cx="10" cy="25.500" r="1.300"/><circle cx="30" cy="25.500" r="1.300"/></g>`),
  tile('foil', 'Gold foil', 'patterns', 80, `<defs><linearGradient id="f" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="80" y2="0" spreadMethod="repeat" gradientTransform="skewX(-28)"><stop offset="0" stop-color="#C99A2E" stop-opacity=".55"/><stop offset=".18" stop-color="#FFF6C8" stop-opacity=".95"/><stop offset=".34" stop-color="#E2B84A" stop-opacity=".6"/><stop offset=".5" stop-color="#FFFBE6" stop-opacity=".9"/><stop offset=".68" stop-color="#B8891F" stop-opacity=".6"/><stop offset=".84" stop-color="#FFF1B0" stop-opacity=".9"/><stop offset="1" stop-color="#C99A2E" stop-opacity=".55"/></linearGradient></defs><path fill="url(#f)" d="M0 0h80v40H0z"/><g fill="#fff" fill-opacity=".9"><path d="M14 9l1 3 3 1-3 1-1 3-1-3-3-1 3-1zM58 24l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/></g>`),
  tile('terrazzo', 'Terrazzo', 'patterns', 70, `<path fill="{coral}" d="M5 8l8-3 4 6-7 5z"/><path fill="{teal}" d="M26 22l9 2-2 8-9-3z"/><path fill="{butter}" d="M44 5l7 4-5 7-6-5z"/><path fill="{lilac}" d="M57 24l8-4 3 8-8 4z"/><path fill="#fff" fill-opacity=".85" d="M14 27l6-2 2 6-6 3zM30 6l5 1-1 5-5-1zM50 30l5-3 2 5-4 3zM63 7l4 3-3 4-4-3z"/><path fill="${INK}" fill-opacity=".55" d="M21 14l3 1-1 3-3-1zM42 22l3-1 1 3-3 1zM8 36l3-2 1 3zM38 36l3 1-2 2z"/>`),
  // words
  word('word-hello', 'hello'),
  word('word-today', 'today'),
  word('word-memories', 'memories'),
  word('word-thankyou', 'thank you'),
  word('word-love', 'with love'),
  word('word-january', 'January'),
  word('word-february', 'February'),
  word('word-march', 'March'),
  word('word-april', 'April'),
  word('word-may', 'May'),
  word('word-june', 'June'),
  word('word-july', 'July'),
  word('word-august', 'August'),
  word('word-september', 'September'),
  word('word-october', 'October'),
  word('word-november', 'November'),
  word('word-december', 'December'),
] as const;

export type ThemedTape = (typeof THEMED_TAPES)[number]['id'];

/**
 * The colour a themed tape gets when it is picked, so each looks right straight
 * away (kraft is brown, foil is gold). It is an ordinary tape colour: she can
 * change it afterwards like any other.
 */
export const TAPE_DEFAULT_COLOR: Record<ThemedTape, string> = {
  daisies: 'mint', tulips: 'butter', blossom: 'mint', meadow: 'sky',
  ferns: 'butter', vine: 'peach', eucalyptus: 'tan', cacti: 'peach', sprouts: 'butter',
  lemons: 'teal', strawberries: 'butter', cherries: 'mint', apples: 'sky', citrus: 'mint', watermelons: 'sky',
  autumnleaves: 'tan', pumpkins: 'sage', woodland: 'tan', knits: 'lilac',
  snowflakes: 'blue', snowmen: 'sky',
  christmas: 'red', candycanes: 'mint', holly: 'butter', hanukkah: 'sky', dreidels: 'butter', party: 'lilac',
  sweethearts: 'peach', loveletters: 'lilac',
  starsmoons: 'blue', clouds: 'sky', rainbows: 'sky', raindrops: 'grey', rainyday: 'lilac',
  shells: 'teal', fishes: 'blue', anchors: 'sky', seawaves: 'teal',
  travelstamps: 'tan', airmail: 'grey', journey: 'butter', camping: 'sage',
  coffee: 'tan', books: 'peach', bookspines: 'grey', musicnotes: 'butter', playlist: 'mint', lights: 'blue',
  cats: 'butter', dogs: 'mint', paws: 'sky', bees: 'sky', mushrooms: 'sage', birds: 'peach', butterflies: 'mint',
  picnic: 'red', tartan: 'green', leopard: 'tan', newspaper: 'grey', measure: 'butter', kraft: 'tan', doily: 'rose', foil: 'butter', terrazzo: 'grey',
  'word-hello': 'butter', 'word-today': 'mint', 'word-memories': 'peach', 'word-thankyou': 'rose', 'word-love': 'lilac',
  'word-january': 'sky', 'word-february': 'rose', 'word-march': 'mint', 'word-april': 'butter', 'word-may': 'sage', 'word-june': 'teal',
  'word-july': 'coral', 'word-august': 'peach', 'word-september': 'tan', 'word-october': 'orange', 'word-november': 'lilac', 'word-december': 'red',
};

const BY_ID = new Map<string, Tape<string>>(THEMED_TAPES.map((t) => [t.id, t]));
export const isThemedTape = (pattern: string): boolean => BY_ID.has(pattern);
/** The colour to give a tape when this pattern is picked: the theme's own, or (plain patterns) the one it has. */
export const tapeColorFor = (pattern: string, current: string): string => (TAPE_DEFAULT_COLOR as Record<string, string>)[pattern] ?? current;
/** Tapes with words on them repeat whole words only, starting with a whole word. */
export const isWordTape = (pattern: string): boolean => BY_ID.get(pattern)?.theme === 'words';

const cache = new Map<string, string>();

/** The tile of a themed tape as a CSS background image, or undefined for the plain patterns. */
export function tapeImage(pattern: string, color: string): string | undefined {
  const tape = BY_ID.get(pattern);
  if (!tape) return undefined;
  const key = `${pattern}|${color}`;
  let url = cache.get(key);
  if (!url) {
    const body = tape.body.replace(/\{(\w+)\}/g, (_, name: string) => (name === color ? CREAM : TAPE_COLORS[name] ?? CREAM));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tape.w}" height="${H}" viewBox="0 0 ${tape.w} ${H}">${body}</svg>`;
    url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    cache.set(key, url);
  }
  return url;
}

// ----- recently used (kept on this device only; it is a convenience, not data)

const RECENT_KEY = 'daybook.recentTapes';
const RECENT_MAX = 8;

export function recentTapes(): string[] {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string').slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

/** The list with `pattern` moved to the front. */
export const withRecent = (list: readonly string[], pattern: string): string[] => [pattern, ...list.filter((p) => p !== pattern)].slice(0, RECENT_MAX);

export function rememberTape(pattern: string): string[] {
  const next = withRecent(recentTapes(), pattern);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // private browsing: the row just doesn't persist
  }
  return next;
}
