import { ALPHABET, type TapePattern } from '../domain/pages';
import type { BuiltInTemplate, TemplateKit } from './builtin';

// More ready-made pages: bucket lists, bingo cards, challenges, birthdays,
// dreams, weather, temperature, self-care, travel, home, family and holidays.
// Built from the same helpers as builtin.ts (passed in as `k`), all sizes in
// page units (900×1200 tall, 1200×900 wide).

type Season = 'spring' | 'summer' | 'fall' | 'winter';
const seasonOf = (d: Date): Season => (['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'fall', 'fall', 'fall', 'winter'] as const)[d.getMonth()];
/** The year a yearly page is for: next year from October on. */
const planYear = (d: Date) => (d.getMonth() >= 9 ? d.getFullYear() + 1 : d.getFullYear());
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);

const SEASON_LOOK: Record<Season, { name: string; paper: number; colors: [string, string, string]; art: [string, string, string]; tape: [TapePattern, TapePattern] }> = {
  spring: { name: 'Spring', paper: 5, colors: ['rose', 'mint', 'lilac'], art: ['tulip', 'butterfly', 'umbrella'], tape: ['flowers', 'gingham'] },
  summer: { name: 'Summer', paper: 4, colors: ['butter', 'sky', 'coral'], art: ['sun', 'icecream', 'watermelon'], tape: ['waves', 'stripes'] },
  fall: { name: 'Fall', paper: 3, colors: ['orange', 'tan', 'coral'], art: ['maple', 'pumpkin', 'acorn'], tape: ['leaves', 'gingham'] },
  winter: { name: 'Winter', paper: 7, colors: ['sky', 'lilac', 'teal'], art: ['snowflake', 'snowman', 'mitten'], tape: ['snow', 'dots'] },
};

const BUCKET_IDEAS: Record<Season, [string[], string[]]> = {
  spring: [['Plant seeds', 'Picnic in the park', 'Pick wildflowers'], ['Spring clean one room', 'Bake with lemons', 'Fly a kite']],
  summer: [['Swim outside', 'Watch a sunset', 'Eat ice cream on a pier'], ['Night under the stars', 'Outdoor film', 'Make lemonade']],
  fall: [['Jump in a pile of leaves', 'Visit an orchard', 'Long autumn walk'], ['Bake an apple pie', 'Cosy reading day', 'Make soup from scratch']],
  winter: [['Build a snowman', 'Go ice skating', 'Visit a winter market'], ['Board game night', 'Hot chocolate bar', 'Movie marathon']],
};

const SEASON_BINGO: Record<Season, string[]> = {
  spring: ['Plant something', 'Picnic', 'Spot a butterfly', 'Fresh flowers at home', 'Spring clean a drawer', 'Walk in the rain', 'Visit a garden', 'Fly a kite', 'Eat outside', 'Sunrise walk', 'Cook with greens', 'Open every window', 'Bike ride', 'Visit a market', 'Pick wildflowers', 'Write a letter'],
  summer: ['Swim outside', 'Ice cream', 'Watch a sunset', 'Beach day', 'Read in a hammock', 'Night under the stars', 'Pick fruit', 'Outdoor film', 'Make lemonade', 'Walk barefoot', 'Day trip', 'Camping', 'Water fight', 'Festival', 'Picnic dinner', 'Photo of the sea'],
  fall: ['Jump in leaves', 'Bake with apples', 'Hot chocolate', 'Pumpkin patch', 'Cosy reading day', 'Wear a scarf', 'Collect acorns', 'Soup night', 'Autumn walk', 'Light a candle', 'Spooky film', 'Knit or craft', 'Visit an orchard', 'Red leaves photo', 'Make a playlist', 'Sunday roast'],
  winter: ['Build a snowman', 'Hot bath', 'Board game night', 'First snow', 'Bake cookies', 'Ice skating', 'Warm spiced drink', 'Winter walk', 'Movie marathon', 'Write a card', 'Make soup', 'Fairy lights', 'Winter market', 'Sledging', 'Pyjama day', 'Look at the stars'],
};

const BOOK_BINGO = {
  cosy: ['A blue cover', 'Set in another country', 'From the year you were born', 'A re-read', 'Recommended by a friend', 'Under 200 pages', 'A debut', 'Set in a small town', 'Has a recipe in it', 'A rainy-day read', 'Features a bookshop', 'Has a map inside', 'A cosy mystery', 'Set in winter', 'About friendship', 'A title with a colour', 'A book you got as a gift', 'Set by the sea', 'An animal on the cover', 'Unread from your shelf', 'A love story', 'A comfort read', 'Translated', 'A book about food'],
  adventure: ['Set on another continent', 'A journey or quest', 'Over 500 pages', 'A survival story', 'Set at sea', 'A fantasy world', 'Based on a true story', 'Has a map', 'A road trip', 'Set in the mountains', 'A heist', 'Historical adventure', 'Translated', 'A dragon', 'A treasure hunt', 'First in a series'],
  summer: ['Read outside', 'A beach read', 'Set in summer', 'Finished in a day', 'A yellow cover', 'Set on an island', 'A holiday romance', 'A thriller', 'Recommended by a friend', 'From a holiday bookshop', 'A summer-camp story', 'An audiobook on a walk', 'Under 200 pages', 'Fruit on the cover', 'Set in Italy', 'Coming of age'],
  classic: ['Published before 1900', 'A Russian classic', 'Austen or a Brontë', 'Read at school', 'A classic play', 'Poetry', 'Over 600 pages', 'A gothic novel', 'An adventure classic', 'From your country', 'A dystopian classic', 'Translated from French', 'A Victorian novel', 'A Nobel Prize winner', "A children's classic", 'A war novel', 'By a woman, before 1950', 'Short stories', 'A classic mystery', 'Set in Paris', 'A novella', 'Older than your grandparents', 'A classic love story', 'Re-read a classic'],
};

const GENRES = ['Comedy', 'Horror', 'Documentary', 'Animated', 'Musical', 'Foreign language', 'True story', 'Romance', 'Sci-fi', 'Classic before 1980', 'Thriller', 'Fantasy', 'Western', 'Family film', 'Award winner', 'From your birth year'];

/** A centre spot for the free tile of a 5×5 card. */
const withFree = (prompts: string[]) => [...prompts.slice(0, 12), '', ...prompts.slice(12, 24)];

export function moreTemplates(k: TemplateKit): BuiltInTemplate[] {
  const { title, sub, list, table, write, month, tape, art, track, tiles, photoSpot, blank, paper, shortDays, monthName } = k;

  const bucket = (season: Season): BuiltInTemplate => {
    const s = SEASON_LOOK[season];
    const [outside, home] = BUCKET_IDEAS[season];
    const lines = (ideas: string[]) => [...ideas, '', '', '', ''];
    return {
      id: `bucket-${season}`,
      subject: 'Bucket lists',
      name: `${s.name} bucket list`,
      description: `Things to do this ${season === 'fall' ? 'autumn' : season}, outside and at home, ticked off one by one, with a photo spot and the best moment.`,
      size: 'portrait',
      build: () => ({
        background: paper(s.paper, season === 'winter' ? 'grid' : 'dots'),
        elements: [
          tape(56, 44, 240, s.colors[0], s.tape[0]),
          title(60, 64, 620, `${s.name} bucket list`, { size: 54 }),
          art(720, 40, 130, s.art[0], undefined, 8),
          list(60, 200, 380, 'Outside', s.colors[0], lines(outside)),
          list(460, 200, 380, 'At home', s.colors[1], lines(home)),
          ...photoSpot(70, 640, 360, 300, -2, s.colors[2], s.tape[1]),
          art(372, 900, 96, s.art[1], undefined, -10),
          write(470, 640, 370, 300, 'Best moment', s.colors[2]),
          write(60, 990, 780, 160, 'Next time', s.colors[1]),
          art(756, 1080, 96, s.art[2], undefined, 6),
        ],
      }),
    };
  };

  const azPage = (id: string, name: string, what: string, color: string, sticker: string, paperIndex: number, note: string): BuiltInTemplate => ({
    id,
    subject: 'Alphabet challenge',
    name,
    description: `One ${what} for every letter of the alphabet: write it on its letter, tap it when it's done.`,
    size: 'portrait',
    build: () => ({
      background: paper(paperIndex, 'dots'),
      elements: [
        tape(56, 44, 220, color, 'confetti'),
        title(60, 62, 620, name, { size: 64 }),
        art(724, 44, 126, sticker, color, 8),
        tiles(60, 200, 780, 760, 'A to Z', color, 6, ALPHABET, { mark: 'cross' }),
        write(60, 990, 500, 160, note, 'butter'),
        list(590, 990, 250, 'Favourites', 'rose', 2),
      ],
    }),
  });

  const bookBingo = (id: string, name: string, prompts: string[], five: boolean, color: string, sticker: string, paperIndex: number): BuiltInTemplate => ({
    id,
    subject: 'Book bingo',
    name,
    description: `${five ? 'A 5×5 card with a free centre' : 'A 4×4 card'} of reading prompts. Write the book you read on its tile, tap it, and get a bingo for a full line.`,
    size: 'portrait',
    build: () => ({
      background: paper(paperIndex, five ? 'grid' : 'dots'),
      elements: [
        tape(56, 44, 230, color, five ? 'stripes' : 'hearts'),
        title(60, 62, 640, name, { size: 50 }),
        art(726, 44, 124, sticker, undefined, 8),
        tiles(60, 200, 780, 820, 'Read one for each tile', color, five ? 5 : 4, five ? withFree(prompts) : prompts.slice(0, 16), { bingo: true, freeCenter: five, mark: 'stamp' }),
        write(60, 1046, 780, 110, 'Favourite of the card', 'butter', false),
      ],
    }),
  });

  return [
    // ---------- Bucket lists ----------
    bucket('spring'),
    bucket('summer'),
    bucket('fall'),
    bucket('winter'),

    // ---------- Yearly bingo ----------
    {
      id: 'year-bingo',
      subject: 'Yearly bingo',
      name: 'Year bingo',
      description: 'A 5×5 bingo of goals for the year, with a free centre. Tap a goal when you reach it.',
      size: 'portrait',
      build: (ctx) => ({
        background: paper(8, 'dots'),
        elements: [
          tape(56, 40, 260, 'lilac', 'confetti'),
          title(60, 60, 620, `${planYear(ctx.today)} Bingo`),
          art(722, 40, 128, 'sparkle', 'butter', 8),
          sub(62, 160, 620, '24 goals for the year. Get a line!'),
          tiles(60, 230, 780, 820, '', 'lilac', 5, 25, { bingo: true, freeCenter: true, mark: 'stamp' }),
          write(60, 1074, 780, 90, 'Reward for a bingo', 'butter', false),
        ],
      }),
    },
    {
      id: 'year-bingo-4',
      subject: 'Yearly bingo',
      name: 'Year bingo, 4×4',
      description: 'Sixteen goals for the year on a smaller card, with a note for each line you finish.',
      size: 'portrait',
      build: (ctx) => ({
        background: paper(6, 'grid'),
        elements: [
          tape(56, 40, 240, 'mint', 'gingham'),
          title(60, 60, 620, `${planYear(ctx.today)} goals bingo`, { size: 60 }),
          art(724, 40, 126, 'star', 'butter', -8),
          tiles(60, 200, 780, 760, '', 'teal', 4, 16, { bingo: true, mark: 'cross' }),
          write(60, 990, 380, 170, 'Why these goals', 'mint'),
          list(460, 990, 380, 'Lines done', 'butter', 2),
        ],
      }),
    },
    {
      id: 'month-bingo',
      subject: 'Yearly bingo',
      name: 'Monthly mini bingo',
      description: 'A 3×3 bingo for one month: nine small things to try, and how it went.',
      size: 'portrait',
      build: (ctx) => ({
        background: paper(2, 'dots'),
        elements: [
          tape(56, 40, 220, 'rose', 'hearts'),
          title(60, 60, 640, `${monthName(ctx.today)} bingo`, { size: 56 }),
          art(726, 44, 124, 'heart', 'rose', 6),
          tiles(110, 210, 680, 700, '', 'rose', 3, ['Try a new recipe', 'Call a friend', 'Read every day', 'A long walk', 'A no-spend day', 'An early night', 'Tidy one drawer', 'Learn something new', 'Do something kind'], { bingo: true, mark: 'stamp' }),
          write(60, 950, 780, 200, 'How the month went', 'peach'),
        ],
      }),
    },
    {
      id: 'season-bingo',
      subject: 'Yearly bingo',
      name: 'Seasonal bingo',
      description: "Sixteen things to do this season (the one you're in), with a line to cheer for.",
      size: 'portrait',
      build: (ctx) => {
        const season = seasonOf(ctx.today);
        const s = SEASON_LOOK[season];
        return {
          background: paper(s.paper, 'dots'),
          elements: [
            tape(56, 40, 230, s.colors[0], s.tape[0]),
            title(60, 60, 620, `${s.name} bingo`),
            art(724, 40, 126, s.art[0], undefined, 8),
            tiles(60, 200, 780, 800, '', s.colors[0], 4, SEASON_BINGO[season], { bingo: true, mark: 'stamp' }),
            art(60, 1030, 110, s.art[1], undefined, -8),
            write(190, 1030, 650, 130, 'Favourite one', s.colors[1], false),
          ],
        };
      },
    },

    // ---------- Birthdays ----------
    {
      id: 'birthdays-year',
      subject: 'Birthdays',
      name: 'Birthdays all year',
      description: 'Twelve months with room for names and dates, so no birthday is missed.',
      size: 'portrait',
      build: (ctx) => {
        const colors = ['rose', 'peach', 'butter', 'lime', 'mint', 'teal', 'sky', 'blue', 'lilac', 'plum', 'berry', 'coral'];
        return {
          background: paper(2, 'dots'),
          elements: [
            title(60, 50, 600, 'Birthdays'),
            art(700, 34, 120, 'gift', 'rose', -6),
            tape(600, 70, 130, 'butter', 'confetti', 6),
            ...Array.from({ length: 12 }, (_, i) =>
              table(50 + (i % 3) * 270, 170 + Math.floor(i / 3) * 252, 260, 240, new Date(ctx.today.getFullYear(), i, 1).toLocaleDateString('en-US', { month: 'long' }), colors[i], ['Name', 'Day'], blank(3)),
            ),
          ],
        };
      },
    },
    {
      id: 'birthday-gifts',
      subject: 'Birthdays',
      name: 'Birthday gift list',
      description: 'Who, when, a gift idea and whether the card has gone, plus a list of cards to send.',
      size: 'landscape',
      build: () => ({
        background: paper(3, 'plain'),
        elements: [
          tape(50, 30, 220, 'coral', 'stripes'),
          title(50, 46, 720, 'Birthday gift list'),
          art(1030, 26, 120, 'gift', 'coral', 8),
          table(50, 170, 760, 680, 'Birthdays', 'coral', ['Name', 'Birthday', 'Gift idea', 'Budget'], blank(10)),
          list(840, 170, 310, 'Cards sent', 'mint', 6),
          art(940, 690, 120, 'banner', 'butter', -6),
        ],
      }),
    },
    {
      id: 'birthdays-upcoming',
      subject: 'Birthdays',
      name: 'Upcoming birthdays',
      description: 'The next three months of birthdays, with plans and things to buy.',
      size: 'portrait',
      build: (ctx) => {
        const months = [0, 1, 2].map((n) => addMonths(ctx.today, n));
        const colors = ['rose', 'butter', 'sky'];
        return {
          background: paper(4, 'dots'),
          elements: [
            tape(56, 40, 240, 'rose', 'confetti'),
            title(60, 60, 620, 'Coming up', {}),
            art(720, 40, 128, 'sparkle', 'butter', 6),
            sub(62, 160, 620, 'Birthdays in the next three months'),
            ...months.map((d, i) => table(60, 230 + i * 250, 500, 230, monthName(d), colors[i], ['Who', 'Day', 'Plan'], blank(3))),
            list(590, 230, 250, 'To buy', 'peach', 6),
            art(640, 640, 150, 'gift', 'lilac', 8),
            write(60, 990, 780, 160, 'Ideas', 'mint'),
          ],
        };
      },
    },

    // ---------- Alphabet challenge ----------
    azPage('az-read', 'A to Z to read', 'book', 'sky', 'bookstack', 7, 'Books I loved'),
    azPage('az-watch', 'A to Z to watch', 'film or series', 'coral', 'star', 3, 'Best watched'),
    azPage('az-listen', 'A to Z to listen', 'album, song or podcast', 'mint', 'sparkle', 5, 'On repeat'),
    {
      id: 'az-mixed',
      subject: 'Alphabet challenge',
      name: 'A to Z mixed',
      description: 'A book, film or album for every letter. Note which it was on each tile, and keep count.',
      size: 'portrait',
      build: () => ({
        background: paper(8, 'grid'),
        elements: [
          tape(56, 44, 220, 'lilac', 'stars'),
          title(60, 62, 620, 'A to Z mixed', {}),
          art(724, 44, 126, 'openbook', 'sky', -6),
          tiles(60, 200, 780, 760, 'Read, watch or listen', 'lilac', 6, ALPHABET, { mark: 'stamp' }),
          table(60, 990, 500, 160, 'Count', 'butter', ['Read', 'Watched', 'Listened'], ['']),
          write(590, 990, 250, 160, 'Notes', 'mint'),
        ],
      }),
    },

    // ---------- Book bingo ----------
    bookBingo('book-bingo-cosy', 'Cosy book bingo', BOOK_BINGO.cosy, true, 'peach', 'mug', 3),
    bookBingo('book-bingo-adventure', 'Adventure book bingo', BOOK_BINGO.adventure, false, 'teal', 'compass', 6),
    bookBingo('book-bingo-summer', 'Summer reading bingo', BOOK_BINGO.summer, false, 'butter', 'sun', 4),
    bookBingo('book-bingo-classic', 'Classics bingo', BOOK_BINGO.classic, true, 'plum', 'glasses', 9),

    // ---------- Movie challenge ----------
    {
      id: 'movie-genres',
      subject: 'Movie challenge',
      name: 'Movie genre challenge',
      description: 'Sixteen genres to watch: the title, the date and your stars on each tile.',
      size: 'landscape',
      build: () => ({
        background: paper(10, 'dots'),
        elements: [
          tape(50, 26, 220, 'coral', 'stripes'),
          title(50, 40, 760, 'Movie genre challenge', { color: '#FFFFFF', size: 64 }),
          art(1040, 20, 110, 'star', 'butter', 8),
          tiles(50, 150, 1100, 700, 'One film per genre: title, date, stars', 'coral', 4, GENRES, { bingo: true, mark: 'stamp' }),
        ],
      }),
    },
    {
      id: 'movie-log',
      subject: 'Movie challenge',
      name: 'Movie log',
      description: 'Every film you watch: date, title, genre, who with and stars.',
      size: 'portrait',
      build: () => ({
        background: paper(1, 'lines'),
        elements: [
          tape(56, 44, 220, 'sky', 'checker'),
          title(60, 62, 620, 'Movie log'),
          art(724, 44, 126, 'starlight', undefined, 6),
          table(60, 200, 780, 820, 'Watched', 'sky', ['Date', 'Film', 'Genre', 'With', 'Stars'], blank(14)),
          write(60, 1046, 780, 110, 'Film of the month', 'butter', false),
        ],
      }),
    },
    {
      id: 'watchlist',
      subject: 'Movie challenge',
      name: 'Watchlist',
      description: 'Films to watch, ones friends recommended and ones for a cosy night, with notes.',
      size: 'portrait',
      build: () => ({
        background: paper(9, 'dots'),
        elements: [
          tape(56, 44, 240, 'lilac', 'stars'),
          title(60, 62, 620, 'Watchlist'),
          art(724, 44, 126, 'stringlights', undefined, 0),
          list(60, 200, 380, 'To watch', 'lilac', 8),
          list(460, 200, 380, 'Friends recommend', 'rose', 8),
          list(60, 700, 380, 'For a cosy night', 'peach', 5),
          write(460, 700, 380, 450, 'Notes', 'mint'),
        ],
      }),
    },

    // ---------- Series ----------
    {
      id: 'series-now',
      subject: 'Series',
      name: 'Watching now',
      description: "Series you're in the middle of: season, episode, where it's on and how it's going, with your episodes tracker.",
      size: 'landscape',
      needs: ['Series watched'],
      build: (ctx) => ({
        background: paper(9, 'grid'),
        elements: [
          tape(50, 26, 220, 'plum', 'stripes'),
          title(50, 40, 700, 'Watching now'),
          art(1040, 20, 110, 'desklamp', undefined, 6),
          table(50, 160, 720, 690, 'Series', 'plum', ['Series', 'Season', 'Episode', 'Where', 'Status'], blank(10)),
          track(800, 160, 350, ctx.tracker('Series watched')),
        ],
      }),
    },
    {
      id: 'series-episodes',
      subject: 'Series',
      name: 'Episode tracker',
      description: 'Tick off every episode, season by season: two seasons of up to 12 episodes per page.',
      size: 'portrait',
      build: () => {
        const eps = Array.from({ length: 12 }, (_, i) => String(i + 1));
        return {
          background: paper(8, 'dots'),
          elements: [
            tape(56, 44, 220, 'lilac', 'checker'),
            title(60, 62, 620, 'Episode tracker', { size: 64 }),
            art(724, 44, 126, 'star', 'butter', 6),
            write(60, 200, 780, 110, 'Series', 'lilac', false),
            tiles(60, 340, 780, 360, 'Season', 'sky', 6, eps, { mark: 'cross' }),
            tiles(60, 730, 780, 360, 'Season', 'rose', 6, eps, { mark: 'cross' }),
            sub(62, 1110, 780, 'Write the season numbers in Edit; tap an episode once watched.'),
          ],
        };
      },
    },
    {
      id: 'series-finished',
      subject: 'Series',
      name: 'Finished series',
      description: "Every series you've finished, with seasons, when you finished and stars, and favourite moments.",
      size: 'portrait',
      build: () => ({
        background: paper(4, 'dots'),
        elements: [
          tape(56, 44, 220, 'butter', 'stars'),
          title(60, 62, 620, 'Finished series', { size: 64 }),
          art(724, 44, 126, 'trophy', undefined, 6),
          table(60, 200, 780, 640, 'Finished', 'butter', ['Series', 'Seasons', 'Finished', 'Stars'], blank(10)),
          write(60, 870, 780, 280, 'Favourite moments', 'rose'),
        ],
      }),
    },
    {
      id: 'series-want',
      subject: 'Series',
      name: 'Series to watch',
      description: 'A want-to-watch list, where each is on, and who recommended it.',
      size: 'portrait',
      build: () => ({
        background: paper(6, 'dots'),
        elements: [
          tape(56, 44, 240, 'mint', 'gingham'),
          title(60, 62, 620, 'Want to watch'),
          art(724, 44, 126, 'sparkle', 'butter', 6),
          list(60, 200, 380, 'Next up', 'mint', 7),
          list(460, 200, 380, 'Someday', 'sky', 7),
          table(60, 640, 780, 510, 'Where and who', 'lilac', ['Series', 'Where', 'Recommended by'], blank(7)),
        ],
      }),
    },

    // ---------- Dreams ----------
    {
      id: 'dream-log',
      subject: 'Dreams',
      name: 'Dream log',
      description: 'The date, the dream, how it felt and whether it was lucid, with your dreams tracker.',
      size: 'portrait',
      needs: ['Dreams'],
      build: (ctx) => ({
        background: paper(10, 'dots'),
        elements: [
          tape(56, 44, 220, 'lilac', 'stars'),
          title(60, 62, 620, 'Dream log', { color: '#FFFFFF' }),
          art(724, 44, 126, 'starlight', undefined, 0),
          write(60, 200, 380, 600, 'Themes this month', 'plum'),
          track(460, 200, 380, ctx.tracker('Dreams')),
          table(60, 840, 780, 310, 'Dreams', 'lilac', ['Date', 'Dream', 'Feeling', 'Lucid?'], blank(4)),
        ],
      }),
    },
    {
      id: 'dream-symbols',
      subject: 'Dreams',
      name: 'Recurring dreams',
      description: 'Dreams that keep coming back, and the symbols in them: what they might mean and how often.',
      size: 'portrait',
      build: () => ({
        background: paper(8, 'dots'),
        elements: [
          tape(56, 44, 240, 'plum', 'stars'),
          title(60, 62, 620, 'Recurring dreams', { size: 64 }),
          art(724, 44, 126, 'cloud', 'lilac', 6),
          write(60, 200, 780, 330, 'Dreams that come back', 'plum'),
          table(60, 560, 780, 480, 'Symbols', 'lilac', ['Symbol', 'What it might mean', 'Times seen'], blank(7)),
          art(70, 1060, 100, 'starlight', undefined, -6),
          sub(190, 1080, 650, 'Write dreams down as soon as you wake.'),
        ],
      }),
    },
    {
      id: 'dream-month',
      subject: 'Dreams',
      name: 'Dream calendar',
      description: 'A month with a word for each night’s dream, dream signs to watch for and the patterns you notice.',
      size: 'landscape',
      build: (ctx) => ({
        background: paper(8, 'dots'),
        elements: [
          title(50, 30, 760, 'Dream calendar'),
          tape(900, 60, 230, 'lilac', 'stars', 3),
          month(50, 150, 800, 700, 'lilac', ctx.today),
          list(880, 150, 270, 'Dream signs', 'plum', 4),
          write(880, 520, 270, 330, 'Patterns', 'lilac'),
        ],
      }),
    },
    {
      id: 'dream-lucid',
      subject: 'Dreams',
      name: 'Lucid dreams and sleep',
      description: 'Your sleep and dreams trackers, lucid-dream habits to tick, and a table of sleep quality.',
      size: 'portrait',
      needs: ['Sleep', 'Dreams'],
      build: (ctx) => ({
        background: paper(10, 'grid'),
        elements: [
          title(60, 56, 620, 'Lucid dreaming', { color: '#FFFFFF', size: 64 }),
          art(724, 40, 126, 'owl', undefined, 6),
          track(60, 190, 380, ctx.tracker('Sleep')),
          track(460, 190, 380, ctx.tracker('Dreams')),
          list(60, 830, 380, 'Every day', 'lilac', ['Reality check', 'Dream journal', 'No screens late', 'Same bedtime']),
          table(460, 830, 380, 320, 'Sleep quality', 'sky', ['Night', 'Hours', '1 to 5'], blank(4)),
        ],
      }),
    },

    // ---------- Weather ----------
    {
      id: 'weather-year',
      subject: 'Weather',
      name: 'Weather year in pixels',
      description: "A pixel for every day's weather, in its colour, for the whole year.",
      size: 'portrait',
      needs: ['Weather'],
      build: (ctx) => ({
        background: paper(7, 'dots'),
        elements: [
          tape(56, 44, 220, 'sky', 'dots'),
          title(60, 62, 620, 'Weather year', {}),
          art(724, 44, 126, 'sun', undefined, 0),
          track(60, 200, 780, ctx.tracker('Weather'), { look: 'pixels', full: true }),
        ],
      }),
    },
    {
      id: 'weather-month',
      subject: 'Weather',
      name: 'Weather this month',
      description: 'A month with a note on every day, your weather tracker and the month in a few words.',
      size: 'landscape',
      needs: ['Weather'],
      build: (ctx) => ({
        background: paper(7, 'plain'),
        elements: [
          title(50, 30, 760, `${monthName(ctx.today)} weather`),
          art(1030, 20, 120, 'umbrella', undefined, 8),
          month(50, 150, 800, 700, 'sky', ctx.today),
          track(880, 150, 270, ctx.tracker('Weather')),
          write(880, 730, 270, 120, 'In a few words', 'butter', false),
        ],
      }),
    },
    {
      id: 'weather-mood',
      subject: 'Weather',
      name: 'Weather and mood',
      description: 'Your weather and mood trackers side by side, to see how one follows the other.',
      size: 'landscape',
      needs: ['Weather', 'Mood'],
      build: (ctx) => ({
        background: paper(5, 'dots'),
        elements: [
          tape(50, 26, 220, 'butter', 'stripes'),
          title(50, 40, 760, 'Weather and mood'),
          art(1040, 24, 110, 'cloud', 'sky', 6),
          track(50, 160, 440, ctx.tracker('Weather'), { look: 'calendar' }),
          track(510, 160, 440, ctx.tracker('Mood'), { look: 'calendar' }),
          write(970, 160, 180, 690, 'What I notice', 'mint'),
        ],
      }),
    },

    // ---------- Temperature ----------
    {
      id: 'temp-blanket-c',
      subject: 'Temperature',
      name: 'Temperature blanket (°C)',
      description: "Each day's high as a coloured pixel, coldest blue to hottest red: a year-long temperature blanket.",
      size: 'portrait',
      needs: ['Temperature (°C)'],
      build: (ctx) => ({
        background: paper(0, 'grid'),
        elements: [
          tape(56, 44, 240, 'coral', 'rainbow'),
          title(60, 62, 640, 'Temperature blanket', { size: 50 }),
          art(724, 44, 126, 'mitten', 'blue', 8),
          track(60, 200, 780, ctx.tracker('Temperature (°C)'), { look: 'pixels', full: true }),
        ],
      }),
    },
    {
      id: 'temp-blanket-f',
      subject: 'Temperature',
      name: 'Temperature blanket (°F)',
      description: "Each day's high as a coloured pixel in Fahrenheit bands: a year-long temperature blanket.",
      size: 'portrait',
      needs: ['Temperature (°F)'],
      build: (ctx) => ({
        background: paper(0, 'grid'),
        elements: [
          tape(56, 44, 240, 'orange', 'rainbow'),
          title(60, 62, 640, 'Temperature blanket', { size: 50 }),
          art(724, 44, 126, 'sun', undefined, 0),
          track(60, 200, 780, ctx.tracker('Temperature (°F)'), { look: 'pixels', full: true }),
        ],
      }),
    },
    {
      id: 'temp-highlow',
      subject: 'Temperature',
      name: 'Daily highs and lows',
      description: 'The high and low of every day this month, with a note, in two columns.',
      size: 'landscape',
      build: (ctx) => {
        const days = new Date(ctx.today.getFullYear(), ctx.today.getMonth() + 1, 0).getDate();
        const nums = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => String(a + i));
        return {
          background: paper(1, 'plain'),
          elements: [
            title(50, 30, 960, `${monthName(ctx.today)} temperatures`, { size: 56 }),
            art(1040, 20, 110, 'snowflake', undefined, 0),
            table(50, 140, 540, 720, 'Days 1 to 16', 'sky', ['High', 'Low', 'Note'], nums(1, 16)),
            table(610, 140, 540, 720, `Days 17 to ${days}`, 'coral', ['High', 'Low', 'Note'], nums(17, days)),
          ],
        };
      },
    },

    // ---------- Self-care ----------
    {
      id: 'selfcare-checklist',
      subject: 'Self-care',
      name: 'Self-care checklist',
      description: 'Small things for body, mind and space to tick off, and a note on how you feel.',
      size: 'portrait',
      build: () => ({
        background: paper(2, 'dots'),
        elements: [
          tape(56, 44, 220, 'rose', 'hearts'),
          title(60, 62, 620, 'Self-care', {}),
          art(724, 44, 126, 'heart', 'rose', 6),
          list(60, 200, 380, 'Body', 'rose', ['Drink water', 'Move for 20 minutes', 'Eat something green', 'Stretch']),
          list(460, 200, 380, 'Mind', 'lilac', ['Five quiet minutes', 'Write it down', 'Read for fun', 'Phone off early']),
          list(60, 560, 380, 'Space', 'mint', ['Make the bed', 'Open a window', 'Tidy one corner', 'Fresh flowers']),
          list(460, 560, 380, 'People', 'peach', ['Message a friend', 'Say no to one thing', 'Ask for help']),
          write(60, 920, 780, 230, 'How I feel today', 'butter'),
        ],
      }),
    },
    {
      id: 'selfcare-menu',
      subject: 'Self-care',
      name: 'Self-care menu',
      description: 'Ideas sorted by the time you have: five minutes, half an hour, an hour.',
      size: 'landscape',
      build: () => ({
        background: paper(3, 'dots'),
        elements: [
          tape(50, 26, 220, 'peach', 'flowers'),
          title(50, 40, 700, 'Self-care menu'),
          art(1040, 20, 110, 'mug', 'peach', 8),
          list(50, 170, 350, '5 minutes', 'butter', ['Deep breaths', 'A cup of tea', 'Favourite song', 'Stretch', 'Step outside']),
          list(425, 170, 350, '30 minutes', 'peach', ['A walk', 'A bath', 'Call someone', 'Read a chapter', 'Journal']),
          list(800, 170, 350, '1 hour', 'rose', ['Cook something nice', 'A long walk', 'A nap', 'Craft or paint', 'Yoga class']),
          write(50, 640, 1100, 210, 'My own ideas', 'mint'),
        ],
      }),
    },
    {
      id: 'selfcare-sunday',
      subject: 'Self-care',
      name: 'Self-care Sunday',
      description: 'A slow Sunday routine to tick, a photo spot, how you feel and a plan for the week.',
      size: 'portrait',
      build: () => ({
        background: paper(5, 'dots'),
        elements: [
          tape(56, 44, 240, 'mint', 'flowers'),
          title(60, 62, 620, 'Self-care Sunday', { size: 64 }),
          art(724, 44, 126, 'tulip', undefined, 6),
          list(60, 200, 380, 'Slow Sunday', 'mint', ['Sleep in', 'Long breakfast', 'Walk outside', 'Face mask', 'Plan the week']),
          ...photoSpot(480, 210, 350, 280, 2, 'rose', 'dots'),
          write(60, 600, 780, 250, 'How I feel', 'rose'),
          list(60, 880, 780, 'This week I will', 'sky', 3),
        ],
      }),
    },
    {
      id: 'selfcare-week',
      subject: 'Self-care',
      name: 'Self-care week',
      description: 'Your self-care tracker and a week grid of small things, ticked day by day.',
      size: 'landscape',
      needs: ['Self-care'],
      build: (ctx) => ({
        background: paper(2, 'grid'),
        elements: [
          tape(50, 26, 220, 'rose', 'hearts'),
          title(50, 40, 700, 'Self-care week'),
          art(1040, 20, 110, 'sparkle', 'butter', 6),
          table(50, 160, 780, 690, 'This week', 'rose', shortDays(ctx), ['Water', 'Move', 'Rest', 'Outside', 'Someone', 'Just me']),
          track(860, 160, 290, ctx.tracker('Self-care')),
        ],
      }),
    },

    // ---------- Travel ----------
    {
      id: 'packing-list',
      subject: 'Travel',
      name: 'Packing list',
      description: 'Clothes, toiletries, documents, tech and extras to tick off as you pack.',
      size: 'portrait',
      build: () => ({
        background: paper(7, 'dots'),
        elements: [
          tape(56, 44, 220, 'sky', 'checker'),
          title(60, 62, 620, 'Packing list'),
          art(724, 44, 126, 'compass', undefined, 6),
          list(60, 200, 380, 'Clothes', 'sky', ['Tops', 'Trousers', 'Underwear', 'Socks', 'Pyjamas', 'Jacket']),
          list(460, 200, 380, 'Toiletries', 'mint', ['Toothbrush', 'Shampoo', 'Sun cream', 'Medicine']),
          list(460, 520, 380, 'Documents', 'butter', ['Passport', 'Tickets', 'Insurance', 'Money']),
          list(60, 600, 380, 'Tech', 'lilac', ['Phone charger', 'Adapter', 'Headphones']),
          list(60, 870, 380, 'Extras', 'peach', 4),
          write(460, 860, 380, 290, 'Before leaving', 'rose'),
        ],
      }),
    },
    {
      id: 'trip-planner',
      subject: 'Travel',
      name: 'Trip planner',
      description: 'Where and when, a day-by-day plan, things to book and a budget.',
      size: 'landscape',
      build: () => ({
        background: paper(6, 'dots'),
        elements: [
          tape(50, 26, 220, 'teal', 'waves'),
          title(50, 40, 700, 'Trip planner'),
          art(1040, 20, 110, 'tent', undefined, 6),
          write(50, 160, 520, 130, 'Where and when', 'teal', false),
          table(50, 320, 520, 530, 'Day by day', 'mint', ['Day', 'Plan', 'Stay'], blank(7)),
          list(600, 160, 260, 'To book', 'butter', 5),
          table(880, 160, 270, 450, 'Budget', 'peach', ['Item', 'Cost'], blank(6)),
          write(600, 640, 550, 210, 'Must see', 'sky'),
        ],
      }),
    },

    // ---------- Home ----------
    {
      id: 'cleaning-routine',
      subject: 'Home',
      name: 'Cleaning routine',
      description: 'Daily, weekly and monthly jobs to tick, and a table of rooms by day.',
      size: 'portrait',
      build: (ctx) => ({
        background: paper(6, 'grid'),
        elements: [
          tape(56, 44, 220, 'mint', 'gingham'),
          title(60, 62, 620, 'Cleaning routine', { size: 64 }),
          art(724, 44, 126, 'sparkle', 'butter', 6),
          list(60, 200, 250, 'Daily', 'mint', ['Dishes', 'Wipe surfaces', 'Ten-minute tidy']),
          list(325, 200, 250, 'Weekly', 'sky', ['Vacuum', 'Bathroom', 'Bed sheets']),
          list(590, 200, 250, 'Monthly', 'lilac', ['Fridge', 'Windows', 'Dust high places']),
          table(60, 560, 780, 590, 'Rooms', 'butter', shortDays(ctx), ['Kitchen', 'Bathroom', 'Living room', 'Bedroom', 'Hall', 'Laundry']),
        ],
      }),
    },
    {
      id: 'plant-care',
      subject: 'Home',
      name: 'Plant care',
      description: 'Each plant with its watering, light and last watered day, plus a month of waterings.',
      size: 'portrait',
      build: (ctx) => ({
        background: paper(5, 'dots'),
        elements: [
          tape(56, 44, 220, 'green', 'leaves'),
          title(60, 62, 620, 'Plant care'),
          art(724, 44, 126, 'succulent', undefined, 0),
          table(60, 200, 780, 470, 'My plants', 'green', ['Plant', 'Water every', 'Light', 'Last watered'], blank(6)),
          month(60, 700, 500, 450, 'mint', ctx.today),
          art(600, 720, 120, 'roundcactus', undefined, -6),
          write(590, 870, 250, 280, 'New leaves', 'lime'),
        ],
      }),
    },

    // ---------- Family ----------
    {
      id: 'family-firsts',
      subject: 'Family',
      name: 'Family firsts',
      description: 'Milestones and firsts with dates, and three photo spots to go with them.',
      size: 'portrait',
      build: () => ({
        background: paper(3, 'plain'),
        elements: [
          tape(56, 44, 220, 'peach', 'hearts'),
          title(60, 62, 620, 'Family firsts'),
          art(724, 44, 126, 'nest', undefined, 6),
          ...photoSpot(60, 210, 250, 230, -3, 'rose', 'dots'),
          ...photoSpot(325, 220, 250, 230, 2, 'butter', 'stripes'),
          ...photoSpot(590, 210, 250, 230, -2, 'mint', 'confetti'),
          table(60, 490, 780, 520, 'Firsts', 'peach', ['First', 'Who', 'Date'], blank(8)),
          write(60, 1040, 780, 120, 'Remember this', 'rose', false),
        ],
      }),
    },
    {
      id: 'family-calendar',
      subject: 'Family',
      name: 'Family calendar',
      description: "The month with everyone's plans, and who has what each day of the week.",
      size: 'landscape',
      build: (ctx) => ({
        background: paper(4, 'dots'),
        elements: [
          title(50, 30, 760, `Family: ${monthName(ctx.today)}`, { size: 64 }),
          art(1040, 20, 110, 'birdhouse', undefined, 6),
          month(50, 150, 720, 700, 'butter', ctx.today),
          table(800, 150, 350, 470, 'Who has what', 'sky', ['Who', 'Plans'], blank(6)),
          write(800, 650, 350, 200, 'Notes', 'rose'),
        ],
      }),
    },

    // ---------- Holidays ----------
    {
      id: 'gift-planner',
      subject: 'Holidays',
      name: 'Gift planner',
      description: 'For each person: the gift, the budget, and ticks for bought and wrapped.',
      size: 'landscape',
      build: () => ({
        background: paper(0, 'dots'),
        elements: [
          tape(50, 26, 220, 'red', 'candy'),
          title(50, 40, 700, 'Gift planner'),
          art(1040, 20, 110, 'gift', 'red', 6),
          table(50, 160, 780, 690, 'Gifts', 'red', ['Who', 'Gift', 'Budget', 'Bought', 'Wrapped'], blank(10)),
          list(860, 160, 290, 'Still to find', 'green', 5),
          art(950, 600, 120, 'xmastree', undefined, -4),
        ],
      }),
    },
    {
      id: 'holiday-bucket',
      subject: 'Holidays',
      name: 'Holiday bucket list',
      description: 'Holiday-season things to do, traditions to keep, a photo spot and favourite moments.',
      size: 'portrait',
      build: () => ({
        background: paper(10, 'dots'),
        elements: [
          tape(56, 44, 240, 'red', 'stars'),
          title(60, 62, 620, 'Holiday bucket list', { color: '#FFFFFF', size: 60 }),
          art(724, 44, 126, 'stringlights', undefined, 0),
          list(60, 200, 380, 'To do', 'red', ['Bake together', 'See the lights', 'Make a gift', 'Holiday film night', '']),
          list(460, 200, 380, 'Traditions', 'green', ['Decorate', 'Sing', 'Light the candles', '']),
          ...photoSpot(70, 620, 360, 300, -2, 'butter', 'stars'),
          art(380, 880, 90, 'candle', undefined, 6),
          write(470, 620, 370, 300, 'Favourite moments', 'butter'),
          write(60, 960, 780, 190, 'Next year', 'sky'),
        ],
      }),
    },
  ] satisfies BuiltInTemplate[];
}

