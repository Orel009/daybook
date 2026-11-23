import { art, label, list, longDate, paper, rating, sub, table, title, write, type BuiltInTemplate } from '../kit';

// Productivity: the day hour by hour, time blocking, and a top three.

export const productivityTemplates: BuiltInTemplate[] = [
  {
    id: 'prod-daily',
    subject: 'Productivity',
    name: 'Hour-by-hour day',
    description: 'The day from 7 to 8 in the evening, hour by hour, next to a top three, other tasks and notes.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(1),
      elements: [
        title(60, 50, 640, 'Today, by the hour', { size: 62 }),
        art(740, 40, 100, 'sun', 'butter', 6),
        sub(60, 140, 600, longDate(ctx.today)),
        table(60, 200, 420, 950, 'Hours', 'sky', ['Plan'], ['7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20']),
        list(510, 200, 330, 'Top three', 'coral', 3),
        list(510, 440, 330, 'Also', 'mint', 5),
        write(510, 780, 330, 370, 'Notes', 'butter'),
      ],
    }),
  },
  {
    id: 'prod-time-blocks',
    subject: 'Productivity',
    name: 'Time blocking',
    description: 'Two-hour blocks with the plan on one side and what really happened on the other.',
    size: 'portrait',
    build: () => ({
      background: paper(7, 'grid'),
      elements: [
        title(60, 50, 640, 'Time blocking', { size: 70 }),
        art(740, 40, 100, 'desklamp', 'mint', -6),
        table(60, 190, 780, 800, 'The plan, and what really happened', 'blue', ['Plan', 'Actual'], ['6 am', '8 am', '10 am', '12 pm', '2 pm', '4 pm', '6 pm', '8 pm']),
        write(60, 1020, 780, 130, 'What I will change tomorrow', 'butter', false),
      ],
    }),
  },
  {
    id: 'prod-top-3',
    subject: 'Productivity',
    name: 'Top three',
    description: 'Only three things matter today. Each gets its own steps; everything else can wait.',
    size: 'portrait',
    build: () => ({
      background: paper(4),
      elements: [
        title(60, 50, 560, 'Top three'),
        art(730, 40, 110, 'medal', 'butter', 6),
        list(60, 190, 780, 'First', 'coral', 3),
        list(60, 430, 780, 'Second', 'butter', 3),
        list(60, 670, 780, 'Third', 'mint', 3),
        write(60, 920, 500, 230, 'Everything else can wait', 'lilac'),
        label(590, 934, 250, 'How today went'),
        rating(590, 974, 250),
      ],
    }),
  },
];
