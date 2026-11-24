import { art, list, monthName, paper, sub, tape, themed, tiles, title, write, type BuiltInTemplate } from '../kit';
import { seasonOf, SEASON_LOOK, SEASON_BINGO } from '../shared';

// Yearly bingo: ready-made pages.

export const yearlyBingoTemplates: BuiltInTemplate[] = [
  {
    id: 'year-bingo',
    asks: 'year',
    subject: 'Yearly bingo',
    name: 'Year bingo',
    description: 'A 5×5 bingo of goals for the year, with a free centre. Tap a goal when you reach it.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(8, 'dots'),
      elements: [
        themed(56, 40, 260, 'fireworks'),
        title(60, 60, 620, `${ctx.year} Bingo`),
        art(722, 40, 128, 'sparkle', 'butter', 8),
        sub(62, 160, 620, '24 goals for the year. Get a line!'),
        tiles(60, 230, 780, 820, '', 'lilac', 5, 25, { bingo: true, freeCenter: true, mark: 'stamp' }),
        write(60, 1074, 780, 90, 'Reward for a bingo', 'butter', false),
      ],
    }),
  },
  {
    id: 'year-bingo-4',
    asks: 'year',
    subject: 'Yearly bingo',
    name: 'Year bingo, 4×4',
    description: 'Sixteen goals for the year on a smaller card, with a note for each line you finish.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(6, 'grid'),
      elements: [
        themed(56, 40, 240, 'party'),
        title(60, 60, 620, `${ctx.year} goals bingo`, { size: 60 }),
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
];
