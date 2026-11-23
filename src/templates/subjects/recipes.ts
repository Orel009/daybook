import { art, blank, frame, label, list, paper, photoSpot, rating, table, themed, title, write, type BuiltInTemplate } from '../kit';

// Recipes: a recipe with its photo, an index of where recipes are, and a baking log.

export const recipesTemplates: BuiltInTemplate[] = [
  {
    id: 'recipe-photo',
    subject: 'Recipes',
    name: 'Recipe with photo',
    description: 'A wide recipe card: a photo of the dish, ingredients, method, how long it takes and how good it was.',
    size: 'landscape',
    build: () => ({
      background: paper(3),
      elements: [
        title(50, 30, 640, 'Recipe'),
        ...photoSpot(50, 150, 420, 330, -2, 'butter', 'gingham'),
        table(50, 520, 420, 160, '', 'peach', [''], ['Serves', 'Time', 'From']),
        label(50, 706, 160, 'How good?'),
        rating(210, 694, 260),
        themed(50, 790, 420, 'citrus', -1),
        list(500, 150, 300, 'Ingredients', 'mint', 9),
        write(500, 690, 300, 110, 'Next time', 'butter', false),
        write(830, 150, 320, 650, 'Method', 'sky'),
      ],
    }),
  },
  {
    id: 'recipe-finder',
    subject: 'Recipes',
    name: 'Recipe finder',
    description: 'Every recipe worth keeping, where it is from, the page and a rating.',
    size: 'portrait',
    build: () => ({
      background: paper(4),
      elements: [
        title(60, 50, 640, 'Recipe finder'),
        art(740, 40, 100, 'lemon', 'butter', 8),
        table(60, 180, 780, 840, 'Where to find it', 'peach', ['Recipe', 'From', 'Page', 'Rating'], blank(14)),
        write(60, 1050, 780, 100, 'To try next', 'mint', false),
      ],
    }),
  },
  {
    id: 'recipe-baking-log',
    subject: 'Recipes',
    name: 'Baking log',
    description: 'Photos of what came out of the oven, how each bake went and the tricks worth remembering.',
    size: 'portrait',
    build: () => ({
      background: paper(2),
      elements: [
        title(60, 50, 560, 'Baking log'),
        art(730, 36, 110, 'cake', 'rose', 6),
        frame(60, 190, 370, 300, -2, { style: 'polaroid' }),
        frame(470, 200, 370, 290, 2, { style: 'polaroid' }),
        table(60, 530, 780, 420, 'What came out of the oven', 'rose', ['Bake', 'Date', 'How it went'], blank(6)),
        write(60, 980, 780, 170, 'Tricks worth remembering', 'butter'),
      ],
    }),
  },
];
