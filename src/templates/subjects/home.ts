import { art, blank, list, month, paper, shortDays, table, tape, title, write, type BuiltInTemplate } from '../kit';

// Home: ready-made pages.

export const homeTemplates: BuiltInTemplate[] = [
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
];
