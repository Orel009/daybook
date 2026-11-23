import { art, blank, month, monthName, paper, photoSpot, table, tape, title, write, type BuiltInTemplate } from '../kit';

// Family: ready-made pages.

export const familyTemplates: BuiltInTemplate[] = [
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
];
