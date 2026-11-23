import { art, blank, list, paper, table, themed, title, write, type BuiltInTemplate } from '../kit';

// Wishlist: things you wish for, and gift ideas for other people.

export const wishlistTemplates: BuiltInTemplate[] = [
  {
    id: 'wishlist-mine',
    subject: 'Wishlist',
    name: 'Wishlist',
    description: 'What you wish for, where to get it, the price and a tick when you have it.',
    size: 'portrait',
    build: () => ({
      background: paper(2),
      elements: [
        title(60, 50, 560, 'Wishlist'),
        art(730, 40, 110, 'gift', 'red', 8),
        table(60, 190, 780, 700, 'One day', 'rose', ['Wish', 'Where', 'Price', 'Got it'], blank(10)),
        write(60, 920, 380, 230, 'Saving up for', 'butter'),
        list(460, 920, 380, 'Small treats', 'mint', 3),
      ],
    }),
  },
  {
    id: 'wish-gifts',
    subject: 'Wishlist',
    name: 'Gift ideas',
    description: 'Ideas for the people you love, the occasion and whether it is bought, plus things they mentioned.',
    size: 'portrait',
    build: () => ({
      background: paper(6),
      elements: [
        title(60, 50, 560, 'Gift ideas'),
        art(730, 40, 110, 'gift', 'rose', -6),
        table(60, 190, 780, 700, 'For the people I love', 'mint', ['For', 'Idea', 'Occasion', 'Bought'], blank(10)),
        write(60, 920, 780, 190, 'Things they mentioned', 'butter'),
        themed(250, 1130, 400, 'party', -1),
      ],
    }),
  },
];
