import { art, blank, frame, list, paper, shelf, SOFT, table, tape, title, track, write, type BuiltInTemplate } from '../kit';

// Books: ready-made pages.

export const booksTemplates: BuiltInTemplate[] = [
  {
    id: 'reading',
    subject: 'Books',
    name: 'Reading tracker',
    description: 'Your reading tracker, what you’re reading now and what’s next.',
    size: 'portrait',
    needs: ['Reading'],
    build: (ctx) => ({
      background: paper(9),
      elements: [
        title(60, 56, 620, 'Reading log'),
        track(60, 210, 410, ctx.tracker('Reading')),
        write(500, 210, 340, 250, 'Reading now', 'sage'),
        list(500, 480, 340, 'Want to read', 'lilac', 5),
        table(60, 940, 780, 210, 'Finished', 'butter', ['Title', 'Author', 'Stars'], ['', '', '']),
      ],
    }),
  },
  {
    id: 'bookshelf',
    subject: 'Books',
    name: 'Bookshelf',
    description: 'Three shelves of blank books. Write a title on each spine and star the ones you’ve read.',
    size: 'portrait',
    build: () => ({
      background: paper(9, 'plain'),
      elements: [
        title(60, 50, 700, 'My bookshelf'),
        art(726, 44, 124, 'bookstack', 'rose', 6),
        title(62, 152, 780, 'Write a title on a spine. Tap the star when you’ve read it.', { font: 'clean', size: 25, color: SOFT }),
        shelf(60, 220, 780, 930, 30, 10),
      ],
    }),
  },
  {
    id: 'bookshelf-wide',
    subject: 'Books',
    name: 'Bookshelf, to read and read',
    description: 'Two shelves side by side: books waiting, and books finished.',
    size: 'landscape',
    build: () => ({
      background: paper(9),
      elements: [
        title(50, 30, 700, 'Books'),
        art(1030, 26, 120, 'openbook', 'sky', 6),
        shelf(50, 160, 540, 690, 16, 8, 'To read'),
        shelf(610, 160, 540, 690, 16, 8, 'Finished'),
      ],
    }),
  },
  {
    id: 'book-review',
    subject: 'Books',
    name: 'Book review',
    description: 'Title, author, dates and stars, with room for a quote and your thoughts.',
    size: 'portrait',
    build: () => ({
      background: paper(4, 'plain'),
      elements: [
        title(60, 50, 700, 'Book review'),
        write(60, 196, 500, 104, 'Title', 'rose', false),
        write(60, 318, 500, 104, 'Author', 'butter', false),
        table(60, 440, 500, 100, '', 'mint', ['Started', 'Finished', 'Stars'], blank(1)),
        frame(590, 196, 250, 344, 2, { hint: 'The cover' }),
        tape(650, 176, 130, 'sky', 'dots', -4),
        write(60, 562, 780, 250, 'What it’s about', 'sky'),
        write(60, 832, 380, 318, 'Favourite quote', 'lilac'),
        write(460, 832, 380, 318, 'What I thought', 'peach'),
      ],
    }),
  },
  {
    id: 'to-read',
    subject: 'Books',
    name: 'Books to read',
    description: 'What’s next, what was recommended, and what’s been borrowed or lent.',
    size: 'portrait',
    build: () => ({
      elements: [
        title(60, 50, 700, 'To read'),
        art(726, 44, 120, 'bookmark', 'mint', 8),
        list(60, 206, 380, 'Up next', 'rose', 5),
        list(460, 206, 380, 'Recommended to me', 'sky', 5),
        table(60, 610, 780, 340, 'Borrowed and lent', 'butter', ['Book', 'Who', 'When'], blank(5)),
        write(60, 970, 780, 180, 'Notes', 'mint'),
      ],
    }),
  },
  {
    id: 'reading-challenge',
    subject: 'Books',
    name: 'Reading challenge',
    description: 'Forty blank books for the year: write each title on a spine and star it when it’s read.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(9),
      elements: [
        title(60, 56, 680, 'Reading challenge', { size: 62 }),
        title(62, 150, 780, `${ctx.today.getFullYear()}: forty books. Star each one when you finish it.`, { font: 'clean', size: 26, color: SOFT }),
        art(744, 40, 100, 'bookstack', 'rose', 6),
        shelf(60, 206, 780, 944, 40, 10),
      ],
    }),
  },
  {
    id: 'reading-log-table',
    subject: 'Books',
    name: 'Reading list',
    description: 'Title, author, pages and stars for every book, plus genres to try and a favourite quote.',
    size: 'portrait',
    build: () => ({
      background: paper(0, 'lines'),
      elements: [
        title(60, 50, 640, 'Reading list'),
        art(730, 40, 110, 'glasses', 'butter', -6),
        table(60, 196, 780, 700, '', 'sage', ['Title', 'Author', 'Pages', 'Stars'], blank(12)),
        list(60, 920, 380, 'Genres to try', 'lilac', 3),
        write(460, 920, 380, 230, 'A quote I loved', 'rose'),
      ],
    }),
  },
  {
    id: 'book-club',
    subject: 'Books',
    name: 'Book club',
    description: 'This month’s book, when and where you meet, questions to discuss and what’s next.',
    size: 'landscape',
    build: () => ({
      background: paper(2),
      elements: [
        title(50, 30, 700, 'Book club'),
        art(1040, 24, 110, 'openbook', 'rose', 6),
        write(50, 160, 540, 120, 'This month’s book', 'rose', false),
        table(610, 160, 540, 120, '', 'butter', ['Date', 'Where', 'Host'], blank(1)),
        write(50, 300, 540, 550, 'Questions to talk about', 'sky'),
        write(610, 300, 540, 340, 'What I thought', 'peach'),
        list(610, 660, 540, 'Next picks', 'mint', 2),
      ],
    }),
  },
];
