import { art, frame, label, list, paper, rating, table, themed, title, write, type BuiltInTemplate } from '../kit';

// Book reviews: a page per book, quick reviews, a detailed review and a wall of the year's books.
// The stars are a rating row: tap the fourth star and four are filled.

const COLORS = ['rose', 'butter', 'mint', 'sky', 'lilac', 'peach'];

export const bookReviewsTemplates: BuiltInTemplate[] = [
  {
    id: 'review-cover',
    subject: 'Book reviews',
    name: 'Book review with cover',
    description: 'A slot for the cover, a star rating, title, author and dates, your review and a favourite quote.',
    size: 'portrait',
    build: () => ({
      background: paper(3),
      elements: [
        title(60, 50, 640, 'Book review'),
        art(730, 44, 110, 'openbook', 'sky', 8),
        frame(60, 200, 280, 400, -2, { hint: 'The cover' }),
        themed(130, 182, 150, 'books', -4),
        table(370, 200, 470, 250, '', 'peach', [''], ['Title', 'Author', 'Started', 'Finished']),
        label(370, 476, 200, 'My rating'),
        rating(370, 516, 300),
        write(60, 640, 780, 300, 'What I thought', 'sky'),
        write(60, 970, 780, 180, 'Favourite quote', 'rose', false),
      ],
    }),
  },
  {
    id: 'review-quick',
    subject: 'Book reviews',
    name: 'Quick reviews',
    description: 'Six small cover slots, each with stars and a line or two. A page for a whole month of reading.',
    size: 'portrait',
    build: () => ({
      background: paper(8, 'plain'),
      elements: [
        title(60, 50, 640, 'Quick reviews'),
        art(740, 40, 100, 'bookmark', 'mint', 8),
        ...COLORS.flatMap((color, i) => {
          const x = 60 + (i % 3) * 265;
          const y = 200 + Math.floor(i / 3) * 480;
          return [frame(x, y, 250, 300, [-2, 1, -1][i % 3], { hint: 'Cover' }), rating(x + 25, y + 314, 200), write(x, y + 366, 250, 94, '', color, false)];
        }),
      ],
    }),
  },
  {
    id: 'review-detailed',
    subject: 'Book reviews',
    name: 'Detailed book review',
    description: 'Characters, plot, and meters for spice, tears and laughs, plus whether you would recommend it.',
    size: 'portrait',
    build: () => ({
      background: paper(9),
      elements: [
        title(60, 50, 700, 'Detailed book review', { size: 60 }),
        frame(60, 170, 220, 310, -2, { hint: 'The cover' }),
        table(310, 170, 530, 200, '', 'lilac', [''], ['Title', 'Author', 'Genre', 'Read in']),
        label(310, 398, 150, 'Overall'),
        rating(470, 386, 260),
        write(60, 510, 380, 240, 'Characters', 'rose'),
        write(460, 510, 380, 240, 'Plot', 'sky'),
        label(60, 792, 120, 'Spice'),
        rating(180, 784, 220, 'red', 'heart'),
        label(60, 852, 120, 'Tears'),
        rating(180, 844, 220, 'sky', 'drop'),
        label(60, 912, 120, 'Laughs'),
        rating(180, 904, 220, 'butter', 'star'),
        list(460, 780, 380, 'Recommend it?', 'mint', ['Yes, to everyone', 'To the right reader', 'Not really']),
        write(60, 1036, 780, 124, 'One line to remember', 'peach', false),
      ],
    }),
  },
  {
    id: 'review-year-wall',
    asks: 'year',
    subject: 'Book reviews',
    name: 'Books of the year',
    description: 'A wall of twelve cover slots with stars under each: the year in books at one glance.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(4, 'plain'),
      elements: [
        title(60, 54, 580, 'Books of the year', { size: 58 }),
        title(650, 40, 190, String(ctx.year), { font: 'tall', size: 110, align: 'right' }),
        ...Array.from({ length: 12 }, (_, i) => {
          const x = 60 + (i % 4) * 200;
          const y = 190 + Math.floor(i / 4) * 330;
          return [frame(x, y, 180, 250, (i + Math.floor(i / 4)) % 2 ? 1 : -1, { hint: 'Cover' }), rating(x + 10, y + 262, 160)];
        }).flat(),
      ],
    }),
  },
];
