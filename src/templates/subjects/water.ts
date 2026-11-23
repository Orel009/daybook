import { art, list, month, monthName, paper, shortDays, sub, table, tape, title, track, weekDays, weekStart, write, type BuiltInTemplate } from '../kit';

// Water: ready-made pages.

export const waterTemplates: BuiltInTemplate[] = [
  {
    id: 'water',
    subject: 'Water',
    name: 'Water intake tracker',
    description: 'Your water tracker with reminders for when to drink.',
    size: 'portrait',
    needs: ['Water'],
    build: (ctx) => ({
      background: paper(7),
      elements: [
        title(60, 56, 620, 'Water'),
        tape(600, 84, 240, 'sky', 'waves', 4),
        track(60, 210, 480, ctx.tracker('Water')),
        list(570, 210, 270, 'Reminders', 'sky', ['Wake up', 'Mid-morning', 'Lunch', 'Afternoon', 'Dinner']),
        write(570, 620, 270, 330, 'Notes', 'mint'),
      ],
    }),
  },
  {
    id: 'water-week',
    subject: 'Water',
    name: 'Water week',
    description: 'Morning, afternoon and evening for each day, beside your water tracker.',
    size: 'landscape',
    needs: ['Water'],
    build: (ctx) => ({
      background: paper(7),
      elements: [
        title(50, 30, 700, 'Water this week'),
        sub(54, 132, 600, `Week of ${weekStart(ctx)}`),
        table(50, 190, 740, 660, '', 'sky', ['Morning', 'Afternoon', 'Evening', 'Total'], weekDays(ctx)),
        track(820, 150, 330, ctx.tracker('Water'), { look: 'progress' }),
        write(820, 716, 330, 134, 'Notes', 'mint', false),
      ],
    }),
  },
  {
    id: 'water-glasses',
    subject: 'Water',
    name: 'Eight glasses a day',
    description: 'A box for every glass on every day of the week, with tips that help.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(7, 'plain'),
      elements: [
        title(60, 50, 700, 'Eight glasses'),
        tape(600, 76, 240, 'sky', 'waves', 4),
        sub(62, 150, 700, 'Tick a box for every glass.'),
        table(60, 210, 780, 560, '', 'sky', ['1', '2', '3', '4', '5', '6', '7', '8'], weekDays(ctx)),
        list(60, 796, 380, 'Tips that help', 'mint', ['Bottle by the bed', 'A glass with every meal', 'Lemon or mint']),
        write(460, 796, 380, 354, 'Notes', 'butter'),
      ],
    }),
  },
  {
    id: 'water-month',
    subject: 'Water',
    name: 'Water month',
    description: 'Glasses per day for the whole month, beside your water tracker.',
    size: 'landscape',
    needs: ['Water'],
    build: (ctx) => ({
      background: paper(7),
      elements: [
        title(50, 30, 700, `${monthName(ctx.today)} water`),
        month(50, 150, 700, 700, 'sky', ctx.today),
        track(780, 150, 370, ctx.tracker('Water'), { look: 'progress' }),
        art(1050, 760, 90, 'sparkle', 'sky'),
      ],
    }),
  },
  {
    id: 'water-plan',
    subject: 'Water',
    name: 'Drink more water',
    description: 'Why it matters to you, a simple plan, flavour ideas and a week of check-ins.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(6),
      elements: [
        title(60, 50, 700, 'Drink more water'),
        art(744, 40, 100, 'watermelon', 'red', 10),
        write(60, 196, 780, 190, 'Why I want to', 'sky', false),
        list(60, 406, 380, 'My plan', 'mint', ['A glass when I wake up', 'Bottle in my bag', 'A glass before meals', 'Herbal tea at night']),
        write(460, 406, 380, 310, 'Flavour ideas', 'peach'),
        table(60, 750, 780, 400, 'This week', 'sky', shortDays(ctx), ['Morning', 'Afternoon', 'Evening']),
      ],
    }),
  },
];
