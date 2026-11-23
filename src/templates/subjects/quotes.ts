import { art, paper, sticky, themed, title, write, type BuiltInTemplate } from '../kit';

// Quotes: one for the week, a collection, and words to live by.

export const quotesTemplates: BuiltInTemplate[] = [
  {
    id: 'quote-week',
    subject: 'Quotes',
    name: 'Quote of the week',
    description: 'One quote written large, who said it and what it means to you.',
    size: 'portrait',
    build: () => ({
      background: paper(8),
      elements: [
        title(60, 50, 720, 'Quote of the week', { size: 62 }),
        art(60, 190, 130, 'speech', 'lilac', -6),
        write(210, 200, 630, 420, '', 'lilac', false),
        write(60, 650, 780, 110, 'Who said it', 'butter', false),
        write(60, 790, 780, 240, 'What it means to me', 'rose'),
        sticky(250, 1060, 400, 'Words to keep', 'mint', -2),
      ],
    }),
  },
  {
    id: 'quote-collection',
    subject: 'Quotes',
    name: 'Quote collection',
    description: 'Six cards for quotes: brave ones, funny ones, and ones from a book, a song or someone you love.',
    size: 'portrait',
    build: () => ({
      background: paper(4, 'plain'),
      elements: [
        title(60, 50, 720, 'Quote collection', { size: 66 }),
        ...['Makes me brave', 'Makes me laugh', 'Makes me think', 'From a book', 'From a song', 'From someone I love'].map((head, i) =>
          write(60 + (i % 2) * 400, 190 + Math.floor(i / 2) * 320, 380, 300, head, ['coral', 'butter', 'sky', 'lilac', 'mint', 'rose'][i], false),
        ),
      ],
    }),
  },
  {
    id: 'quote-words',
    subject: 'Quotes',
    name: 'Words to live by',
    description: 'Three big spaces: words for today, for this year and for always.',
    size: 'portrait',
    build: () => ({
      background: paper(9),
      elements: [
        title(60, 50, 660, 'Words to live by', { size: 66 }),
        art(740, 40, 100, 'sparkle', 'butter'),
        write(60, 190, 780, 280, 'Today', 'rose', false),
        write(60, 500, 780, 280, 'This year', 'butter', false),
        write(60, 810, 780, 280, 'Always', 'mint', false),
        themed(250, 1116, 400, 'word-memories', -1),
      ],
    }),
  },
];
