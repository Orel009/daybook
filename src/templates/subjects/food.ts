import { art, blank, frame, list, paper, sub, table, tape, themed, title, weekDays, weekStart, write, type BuiltInTemplate } from '../kit';

// Food: ready-made pages.

export const foodTemplates: BuiltInTemplate[] = [
  {
    id: 'meals',
    subject: 'Food',
    name: 'Weekly meal planner',
    description: 'Breakfast, lunch and dinner for each day, with a shopping list.',
    size: 'landscape',
    build: (ctx) => ({
      background: paper(3),
      elements: [
        title(50, 30, 700, 'Meal plan'),
        sub(54, 132, 600, `Week of ${weekStart(ctx)}`),
        art(1010, 24, 130, 'watermelon', 'red', 10),
        table(50, 190, 790, 660, '', 'peach', ['Breakfast', 'Lunch', 'Dinner'], weekDays(ctx)),
        list(870, 190, 280, 'To buy', 'mint', 7),
        write(870, 706, 280, 144, 'Prep ahead', 'butter'),
      ],
    }),
  },
  {
    id: 'grocery',
    subject: 'Food',
    name: 'Grocery shopping list',
    description: 'Six sections to tick off as you go around the shop.',
    size: 'portrait',
    build: () => {
      const sections: [string, string][] = [['Fruit and veg', 'green'], ['Dairy and eggs', 'butter'], ['Pantry', 'peach'], ['Meat and fish', 'coral'], ['Frozen', 'sky'], ['Everything else', 'lilac']];
      return {
        background: paper(5, 'grid'),
        elements: [
          themed(60, 46, 230, 'cutlery'),
          title(60, 62, 700, 'Grocery list'),
          ...sections.map(([name, color], i) => list(60 + (i % 2) * 400, 210 + Math.floor(i / 2) * 318, 380, name, color, 3)),
        ],
      };
    },
  },
  {
    id: 'dinners',
    subject: 'Food',
    name: 'Dinner plan',
    description: 'Just dinners for the week, with favourites and a shopping list.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(4),
      elements: [
        title(60, 50, 760, 'Dinners this week'),
        table(60, 200, 780, 530, '', 'coral', ['Dinner', 'Notes'], weekDays(ctx)),
        list(60, 756, 380, 'Family favourites', 'butter', 5),
        list(460, 756, 380, 'To buy', 'mint', 5),
      ],
    }),
  },
  {
    id: 'recipe',
    subject: 'Food',
    name: 'Recipe card',
    description: 'A photo, the ingredients to tick off and the method.',
    size: 'portrait',
    build: () => ({
      background: paper(3, 'plain'),
      elements: [
        title(60, 50, 760, 'Recipe'),
        themed(620, 76, 220, 'lemons', 4),
        write(60, 190, 780, 104, 'Name', 'peach', false),
        frame(60, 316, 380, 300, -2),
        write(60, 640, 380, 140, 'Serves and time', 'butter', false),
        list(460, 316, 380, 'Ingredients', 'mint', 6),
        write(60, 800, 780, 350, 'Method', 'sky'),
      ],
    }),
  },
  {
    id: 'kitchen-stock',
    subject: 'Food',
    name: 'Pantry and fridge',
    description: 'What’s in the fridge, freezer and cupboards, what’s running low, and what to use up first.',
    size: 'portrait',
    build: () => ({
      background: paper(5),
      elements: [
        title(60, 50, 700, 'Kitchen check'),
        art(726, 42, 120, 'mug', 'rose', 6),
        list(60, 196, 380, 'Fridge', 'sky', 4),
        list(460, 196, 380, 'Freezer', 'lilac', 4),
        list(60, 536, 380, 'Cupboards', 'peach', 4),
        list(460, 536, 380, 'Running low', 'coral', 4),
        write(60, 880, 780, 270, 'Use up first', 'butter'),
      ],
    }),
  },
  {
    id: 'meal-prep',
    subject: 'Food',
    name: 'Meal prep',
    description: 'What to cook, chop and portion on prep day, and the boxes for each weekday.',
    size: 'landscape',
    build: () => ({
      background: paper(3, 'grid'),
      elements: [
        title(50, 30, 700, 'Meal prep day'),
        art(1030, 24, 120, 'togo', 'peach', 8),
        list(50, 160, 350, 'Cook', 'coral', 4),
        list(425, 160, 350, 'Chop and wash', 'sage', 4),
        list(800, 160, 350, 'Portion and store', 'sky', 4),
        table(50, 500, 760, 350, 'Boxes for the week', 'peach', ['Lunch', 'Dinner'], ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']),
        write(830, 500, 320, 350, 'To buy', 'mint'),
      ],
    }),
  },
  {
    id: 'recipe-index',
    subject: 'Food',
    name: 'Recipe index',
    description: 'Your favourite recipes and where to find them, plus ones you want to try.',
    size: 'portrait',
    build: () => ({
      background: paper(4, 'lines'),
      elements: [
        tape(60, 44, 240, 'peach', 'gingham', -3),
        title(60, 60, 700, 'Recipe index'),
        art(740, 50, 100, 'icecream', 'rose', 10),
        table(60, 200, 780, 640, 'Our favourites', 'coral', ['Recipe', 'Where it is', 'Stars'], blank(10)),
        list(60, 866, 380, 'Want to try', 'mint', 4),
        write(460, 866, 380, 284, 'Kitchen notes', 'butter'),
      ],
    }),
  },
];
