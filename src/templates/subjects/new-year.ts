import { art, blank, label, lines, list, miniMonth, paper, shape, sticky, sub, table, themed, title, write, type BuiltInTemplate } from '../kit';

// New year: yearly goals three ways, a word for the year, the whole year at a
// glance, and a letter to open when the year is over. Each asks which year it
// is for; "Set up <year>" on the Templates screen makes a set of them in one go.

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const COLORS = ['sky', 'rose', 'mint', 'butter', 'lilac', 'peach', 'coral', 'sage', 'teal', 'orange', 'blue', 'berry'];

export const newYearTemplates: BuiltInTemplate[] = [
  {
    id: 'year-goals-areas',
    asks: 'year',
    subject: 'New year',
    name: 'Yearly goals by life area',
    description: 'Three goals in each of six areas of life, and why this year matters.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(5),
      elements: [
        title(60, 50, 640, `${ctx.year} goals`),
        sub(62, 146, 600, 'By life area'),
        art(730, 40, 110, 'star', 'butter', 8),
        ...['Health', 'Home and family', 'Work and learning', 'Money', 'Fun and travel', 'Just for me'].map((area, i) =>
          list(60 + (i % 2) * 400, 210 + Math.floor(i / 2) * 262, 380, area, ['mint', 'peach', 'sky', 'butter', 'coral', 'lilac'][i], 3),
        ),
        write(60, 1000, 780, 150, 'Why this year matters', 'rose'),
      ],
    }),
  },
  {
    id: 'year-goals-12',
    asks: 'year',
    subject: 'New year',
    name: 'Twelve goals in twelve months',
    description: 'One goal for every month of the year, each in its own box.',
    size: 'landscape',
    build: (ctx) => ({
      background: paper(3),
      elements: [
        title(50, 28, 800, `Twelve goals for ${ctx.year}`, { size: 66 }),
        art(1060, 20, 96, 'medal', 'butter', 6),
        ...MONTHS.map((m, i) => write(50 + (i % 4) * 280, 150 + Math.floor(i / 4) * 240, 262, 224, m, COLORS[i])),
      ],
    }),
  },
  {
    id: 'year-goals-steps',
    asks: 'year',
    subject: 'New year',
    name: 'Yearly goals with steps and deadlines',
    description: 'Six goals, each with its first step and a deadline, the milestones to celebrate and what might get in the way.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(7, 'grid'),
      elements: [
        title(60, 50, 780, `${ctx.year}: goals and steps`, { size: 62 }),
        table(60, 180, 780, 520, 'My goals', 'mint', ['Goal', 'First step', 'Deadline', 'Done'], blank(6)),
        list(60, 730, 380, 'Milestones to celebrate', 'butter', 4),
        write(460, 730, 380, 296, 'What might get in the way', 'rose'),
        write(60, 1050, 780, 100, 'Who can help', 'sky', false),
      ],
    }),
  },
  {
    id: 'year-word',
    asks: 'year',
    subject: 'New year',
    name: 'Word of the year',
    description: 'One word to steer the year by, written large, with what it means at home, at work and for you.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(8),
      elements: [
        title(60, 50, 780, `My word for ${ctx.year}`, { size: 66, align: 'center' }),
        shape(110, 180, 680, 330, 'cloud', '#6B45B0', { fill: true, weight: 5 }),
        label(250, 262, 400, 'My word', { align: 'center' }),
        lines(250, 300, 400, 2, { textSize: 44, font: 'hand' }),
        write(60, 550, 780, 170, 'Why this word', 'lilac'),
        write(60, 744, 250, 250, 'At home it means', 'mint'),
        write(325, 744, 250, 250, 'At work it means', 'sky'),
        write(590, 744, 250, 250, 'For me it means', 'rose'),
        sticky(240, 1040, 420, 'Come back to it every month', 'butter', -2),
      ],
    }),
  },
  {
    id: 'year-glance',
    asks: 'year',
    subject: 'New year',
    name: 'Year at a glance',
    description: 'All twelve months of the year as small calendars on one page.',
    size: 'landscape',
    build: (ctx) => ({
      background: paper(0, 'plain'),
      elements: [
        title(50, 22, 700, `${ctx.year} at a glance`, { size: 60 }),
        ...MONTHS.map((_, i) => miniMonth(50 + (i % 4) * 280, 128 + Math.floor(i / 4) * 254, 262, 240, COLORS[i], new Date(ctx.year, i, 1))),
      ],
    }),
  },
  {
    id: 'year-letter',
    asks: 'year',
    subject: 'New year',
    name: 'A letter to myself',
    description: 'A letter to the you of a year from now, to open when the year is over.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(2, 'lines'),
      elements: [
        themed(-10, 30, 920, 'airmail', 0),
        title(60, 96, 640, 'A letter to myself', { size: 66 }),
        art(730, 90, 110, 'letter', 'rose', 8),
        sub(62, 186, 700, `To open on December 31, ${ctx.year}`),
        write(60, 250, 780, 560, 'Dear me, a year from now,', 'rose'),
        write(60, 834, 380, 220, 'Right now I am proud of', 'butter'),
        write(460, 834, 380, 220, 'I hope that by then', 'sky'),
        sticky(250, 1082, 400, `Do not open before ${ctx.year + 1}`, 'mint', -2),
      ],
    }),
  },
];
