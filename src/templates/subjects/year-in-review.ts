import { frame, label, list, paper, rating, table, title, write, type BuiltInTemplate } from '../kit';

// Year in review: highlights and lessons, a photo for every month, and the year in numbers.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const yearInReviewTemplates: BuiltInTemplate[] = [
  {
    id: 'year-review',
    subject: 'Year in review',
    name: 'Year in review',
    description: 'Highlights, lessons, two photos, what you are grateful for and what you want next year.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(4),
      elements: [
        title(60, 54, 580, 'Year in review', { size: 66 }),
        title(650, 40, 190, String(ctx.today.getFullYear()), { font: 'tall', size: 110, align: 'right' }),
        list(60, 190, 380, 'Highlights', 'butter', 5),
        list(460, 190, 380, 'Lessons', 'mint', 5),
        frame(60, 540, 370, 300, -2, { style: 'polaroid' }),
        frame(470, 550, 370, 290, 2, { style: 'polaroid' }),
        write(60, 880, 380, 270, 'Grateful for', 'rose'),
        write(460, 880, 380, 270, 'Next year I want', 'sky'),
      ],
    }),
  },
  {
    id: 'year-12-photos',
    subject: 'Year in review',
    name: 'Twelve months, twelve photos',
    description: 'One photo for every month of the year, each with its month underneath.',
    size: 'portrait',
    build: () => ({
      background: paper(1, 'plain'),
      elements: [
        title(60, 50, 780, 'Twelve months'),
        ...MONTHS.map((m, i) => frame(60 + (i % 4) * 200, 190 + Math.floor(i / 4) * 325, 180, 290, (i + Math.floor(i / 4)) % 2 ? 1 : -1, { style: 'polaroid', caption: m })),
      ],
    }),
  },
  {
    id: 'year-numbers',
    subject: 'Year in review',
    name: 'My year in numbers',
    description: 'Books read, places visited, things made: count the year up, and give it stars.',
    size: 'portrait',
    build: () => ({
      background: paper(7, 'grid'),
      elements: [
        title(60, 50, 780, 'My year in numbers', { size: 62 }),
        table(60, 180, 780, 560, 'Count them up', 'sky', ['How many', 'The story'], ['Books read', 'Places visited', 'Films watched', 'New friends', 'Photos taken', 'Things I made', 'Miles walked']),
        label(60, 772, 300, 'The year, out of five'),
        rating(60, 812, 320),
        write(60, 900, 780, 250, 'The number I am proudest of', 'butter'),
      ],
    }),
  },
];
