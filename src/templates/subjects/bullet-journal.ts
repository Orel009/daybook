import { art, blank, list, longDate, monthName, monthsAhead, paper, sticky, sub, table, themed, title, write, type BuiltInTemplate, type TemplateContext } from '../kit';

// Bullet journal basics: the index, the key, a future log, a daily log, a brain dump and a migration page.

const COLORS = ['rose', 'butter', 'mint', 'sky', 'lilac', 'peach', 'sage', 'coral', 'teal', 'tan', 'blue', 'plum'];

/** A box for each of the coming months, starting with this one. */
const futureLog = (id: string, name: string, months: number, cols: number, description: string): BuiltInTemplate => ({
  id,
  subject: 'Bullet journal',
  name,
  description,
  size: 'portrait',
  build: (ctx: TemplateContext) => {
    const w = Math.round((780 - (cols - 1) * 20) / cols);
    const rows = months / cols;
    const h = Math.round((950 - (rows - 1) * 16) / rows);
    return {
      background: paper(0),
      elements: [
        themed(56, 34, 240, 'checkmarks'),
        title(60, 50, 640, 'Future log'),
        sub(60, 146, 600, months === 6 ? 'The next six months' : 'The year ahead'),
        ...Array.from({ length: months }, (_, i) => write(60 + (i % cols) * (w + 20), 200 + Math.floor(i / cols) * (h + 16), w, h, monthName(monthsAhead(ctx.today, i)), COLORS[i])),
      ],
    };
  },
});

export const bulletJournalTemplates: BuiltInTemplate[] = [
  {
    id: 'bujo-index',
    subject: 'Bullet journal',
    name: 'Index',
    description: 'Page numbers and what is on them, so you can find anything in the book again.',
    size: 'portrait',
    build: () => ({
      background: paper(0),
      elements: [
        title(60, 50, 400, 'Index'),
        art(740, 40, 100, 'bookmark', 'mint', 6),
        table(60, 180, 380, 960, '', 'mint', ['Page', 'What is on it'], blank(16)),
        table(460, 180, 380, 960, '', 'sky', ['Page', 'What is on it'], blank(16)),
      ],
    }),
  },
  {
    id: 'bujo-key',
    subject: 'Bullet journal',
    name: 'Key',
    description: 'The signs of a bullet journal and what they mean, with room for your own and for colours.',
    size: 'portrait',
    build: () => ({
      background: paper(0),
      elements: [
        title(60, 50, 400, 'Key'),
        art(740, 40, 100, 'pencil', 'butter', 8),
        {
          ...table(60, 180, 480, 560, 'Signs', 'lilac', ['Means'], ['•', '○', '—', '>', '<', '!', '★']),
          cells: { '0:0': 'Task', '1:0': 'Event', '2:0': 'Note', '3:0': 'Moved forward', '4:0': 'Scheduled', '5:0': 'Important', '6:0': 'Idea' },
        },
        list(570, 180, 270, 'Colours', 'rose', ['Home', 'Work', 'Health', 'Fun']),
        write(570, 470, 270, 270, 'My own signs', 'butter'),
        write(60, 770, 780, 200, 'How I use this journal', 'mint'),
        sticky(250, 1010, 400, 'Keep it simple', 'butter', -2),
      ],
    }),
  },
  futureLog('bujo-future-6', 'Future log, 6 months', 6, 2, 'A box for each of the next six months, starting with this one.'),
  futureLog('bujo-future-12', 'Future log, 12 months', 12, 3, 'The whole year ahead on one page, a box for each month.'),
  {
    id: 'bujo-daily',
    subject: 'Bullet journal',
    name: 'Daily log',
    description: 'Tasks, events and notes for today, a space for thoughts and two things for tomorrow.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(0),
      elements: [
        title(60, 50, 560, 'Daily log'),
        sub(60, 146, 600, longDate(ctx.today)),
        list(60, 200, 400, 'Tasks', 'mint', 8),
        write(490, 200, 350, 220, 'Events', 'sky'),
        write(490, 440, 350, 223, 'Notes', 'butter'),
        write(60, 690, 780, 240, 'Thoughts', 'lilac'),
        list(60, 960, 380, 'Tomorrow', 'rose', 2),
        sticky(490, 990, 330, 'One thing at a time', 'butter', 2),
      ],
    }),
  },
  {
    id: 'bujo-brain-dump',
    subject: 'Bullet journal',
    name: 'Brain dump, sorted',
    description: 'Empty your head onto the page, then sort it into do now, do later and let go.',
    size: 'portrait',
    build: () => ({
      background: paper(0),
      elements: [
        title(60, 50, 640, 'Brain dump'),
        art(740, 40, 100, 'bulb', 'butter', -6),
        write(60, 180, 780, 470, 'Out of my head, onto the page', 'lilac', false),
        list(60, 680, 250, 'Do now', 'coral', 5),
        list(325, 680, 250, 'Do later', 'butter', 5),
        list(590, 680, 250, 'Let go', 'mint', 5),
        write(60, 1020, 780, 130, 'The one that matters most', 'rose', false),
      ],
    }),
  },
  {
    id: 'bujo-migration',
    subject: 'Bullet journal',
    name: 'Migration page',
    description: 'What is left from last month: does it still matter, and where does it move to?',
    size: 'portrait',
    build: () => ({
      background: paper(0),
      elements: [
        title(60, 50, 640, 'Migration'),
        sub(60, 146, 700, 'Move on what still matters. Cross out the rest.'),
        table(60, 210, 780, 700, 'Unfinished from last month', 'sky', ['Task', 'Still matters?', 'Move to'], blank(10)),
        write(60, 940, 780, 210, 'What I noticed', 'butter'),
      ],
    }),
  },
];
