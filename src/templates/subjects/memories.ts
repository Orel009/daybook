import { LOCALE } from '../../domain/dates';
import { type TapePattern } from '../../domain/pages';
import { art, blank, frame, list, longDate, paper, sub, table, tape, title, write, type BuiltInTemplate } from '../kit';

// Memories: ready-made pages.

export const memoriesTemplates: BuiltInTemplate[] = [
  {
    id: 'memory',
    subject: 'Memories',
    name: 'Memory journal',
    description: 'Space for two photos and the story of the day.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(4, 'plain'),
      elements: [
        title(60, 56, 760, 'A day to remember'),
        sub(62, 160, 600, longDate(ctx.today)),
        frame(64, 236, 430, 330, -2),
        frame(520, 290, 320, 270, 3),
        tape(190, 214, 170, 'rose', 'dots', -4),
        tape(610, 268, 150, 'mint', 'stripes', 5),
        art(760, 180, 90, 'sparkle', 'butter'),
        write(60, 610, 780, 290, 'What happened', 'butter'),
        write(60, 920, 380, 230, 'Who was there', 'rose'),
        write(460, 920, 380, 230, 'Favourite moment', 'sky'),
      ],
    }),
  },
  {
    id: 'collage',
    subject: 'Memories',
    name: 'Photo collage',
    description: 'Four photo spots at playful angles with a caption underneath.',
    size: 'portrait',
    build: () => ({
      background: paper(7, 'plain'),
      elements: [
        title(60, 50, 760, 'Moments'),
        frame(70, 210, 360, 330, -4),
        frame(470, 230, 360, 300, 3),
        frame(90, 580, 340, 320, 2),
        frame(460, 570, 370, 340, -3),
        tape(170, 190, 160, 'rose', 'hearts', -6),
        tape(580, 212, 150, 'butter', 'stripes', 5),
        tape(180, 562, 150, 'mint', 'dots', 4),
        tape(570, 552, 160, 'sky', 'stars', -4),
        write(60, 950, 780, 200, 'The story', 'butter'),
      ],
    }),
  },
  {
    id: 'trip',
    subject: 'Memories',
    name: 'Trip journal',
    description: 'Where, when and with whom, two photos, highlights and the best meal.',
    size: 'portrait',
    build: () => ({
      background: paper(5),
      elements: [
        title(60, 50, 700, 'Trip journal'),
        art(726, 40, 124, 'mountain', 'lilac'),
        table(60, 196, 780, 100, '', 'sky', ['Where', 'When', 'With'], blank(1)),
        frame(64, 322, 380, 300, -2),
        frame(462, 330, 376, 290, 2),
        tape(190, 304, 150, 'peach', 'triangles', -4),
        list(60, 650, 380, 'Highlights', 'rose', 4),
        write(460, 650, 380, 320, 'Best meal', 'butter'),
        write(60, 990, 780, 160, 'Next time', 'mint'),
      ],
    }),
  },
  {
    id: 'photo-wall',
    subject: 'Memories',
    name: 'Photo wall',
    description: 'Six photo spots pinned at playful angles, like a wall of favourite pictures.',
    size: 'landscape',
    build: () => {
      const spots: [number, number, number, string, TapePattern][] = [
        [60, 160, -3, 'rose', 'hearts'],
        [430, 150, 2, 'butter', 'stripes'],
        [800, 166, -2, 'mint', 'dots'],
        [70, 500, 2, 'sky', 'stars'],
        [440, 512, -2, 'lilac', 'confetti'],
        [806, 496, 3, 'peach', 'gingham'],
      ];
      return {
        background: paper(0, 'plain'),
        elements: [
          title(50, 26, 700, 'Favourite pictures'),
          ...spots.flatMap(([x, y, rot, color, pattern]) => [frame(x, y, 330, 300, rot), tape(x + 100, y - 18, 130, color, pattern, -rot)]),
        ],
      };
    },
  },
  {
    id: 'year-in-memories',
    subject: 'Memories',
    name: 'A year of memories',
    description: 'One box for each month: the moment you want to remember from it.',
    size: 'portrait',
    build: (ctx) => {
      const colors = ['sky', 'rose', 'mint', 'butter', 'lilac', 'peach'];
      const months = Array.from({ length: 12 }, (_, i) => new Date(2000, i, 1).toLocaleDateString(LOCALE, { month: 'long' }));
      return {
        background: paper(9),
        elements: [
          title(60, 50, 760, `${ctx.today.getFullYear()} in memories`),
          ...months.map((m, i) => write(60 + (i % 3) * 265, 196 + Math.floor(i / 3) * 240, 250, 226, m, colors[i % colors.length])),
        ],
      };
    },
  },
  {
    id: 'birthday',
    subject: 'Memories',
    name: 'Birthday page',
    description: 'A photo spot, who celebrated, the best moment, gifts, wishes and a note for next year.',
    size: 'portrait',
    build: () => ({
      background: paper(2),
      elements: [
        title(60, 50, 640, 'Happy birthday'),
        art(730, 40, 110, 'gift', 'rose', 6),
        art(680, 120, 56, 'sparkle', 'butter'),
        frame(64, 206, 410, 360, -2),
        tape(190, 186, 150, 'butter', 'confetti', -4),
        write(500, 200, 340, 176, 'Who celebrated', 'butter'),
        write(500, 394, 340, 176, 'Best moment', 'mint'),
        list(60, 600, 380, 'Gifts', 'rose', 4),
        write(460, 600, 380, 310, 'Wishes for this year', 'lilac'),
        write(60, 940, 780, 210, 'A note to read next birthday', 'sky'),
      ],
    }),
  },
];
