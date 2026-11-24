import { art, blank, list, monthName, paper, sub, table, tape, themed, title, write, type BuiltInTemplate } from '../kit';
import { addMonths } from '../shared';

// Birthdays: ready-made pages.

export const birthdaysTemplates: BuiltInTemplate[] = [
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
          themed(600, 70, 130, 'cakes', 6),
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
        themed(50, 30, 220, 'balloons'),
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
];
