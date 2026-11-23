import { art, paper, tape, tiles, title, write, type BuiltInTemplate } from '../kit';
import { BOOK_BINGO, withFree } from '../shared';

// Book bingo: ready-made pages.

const bookBingo = (id: string, name: string, prompts: string[], five: boolean, color: string, sticker: string, paperIndex: number): BuiltInTemplate => ({
  id,
  subject: 'Book bingo',
  name,
  description: `${five ? 'A 5×5 card with a free centre' : 'A 4×4 card'} of reading prompts. Write the book you read on its tile, tap it, and get a bingo for a full line.`,
  size: 'portrait',
  build: () => ({
    background: paper(paperIndex, five ? 'grid' : 'dots'),
    elements: [
      tape(56, 44, 230, color, five ? 'stripes' : 'hearts'),
      title(60, 62, 640, name, { size: 50 }),
      art(726, 44, 124, sticker, undefined, 8),
      tiles(60, 200, 780, 820, 'Read one for each tile', color, five ? 5 : 4, five ? withFree(prompts) : prompts.slice(0, 16), { bingo: true, freeCenter: five, mark: 'stamp' }),
      write(60, 1046, 780, 110, 'Favourite of the card', 'butter', false),
    ],
  }),
});

export const bookBingoTemplates: BuiltInTemplate[] = [
  bookBingo('book-bingo-cosy', 'Cosy book bingo', BOOK_BINGO.cosy, true, 'peach', 'mug', 3),
  bookBingo('book-bingo-adventure', 'Adventure book bingo', BOOK_BINGO.adventure, false, 'teal', 'compass', 6),
  bookBingo('book-bingo-summer', 'Summer reading bingo', BOOK_BINGO.summer, false, 'butter', 'sun', 4),
  bookBingo('book-bingo-classic', 'Classics bingo', BOOK_BINGO.classic, true, 'plum', 'glasses', 9),
];
