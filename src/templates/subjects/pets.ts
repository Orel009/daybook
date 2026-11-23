import { art, blank, frame, list, paper, photoSpot, shortDays, table, themed, title, write, type BuiltInTemplate } from '../kit';

// Pets: a profile, a vet and care log, and the week's walks and meals.

export const petsTemplates: BuiltInTemplate[] = [
  {
    id: 'pet-profile',
    subject: 'Pets',
    name: 'Pet profile',
    description: 'A round photo, name, birthday, breed, favourite treat and vet, with funny habits and how you met.',
    size: 'portrait',
    build: () => ({
      background: paper(3),
      elements: [
        title(60, 50, 640, 'All about'),
        art(740, 40, 100, 'cat', 'peach', 6),
        frame(60, 190, 340, 340, 0, { style: 'circle' }),
        art(310, 440, 110, 'paw', 'tan', 10),
        table(440, 190, 400, 340, '', 'peach', [''], ['Name', 'Birthday', 'Breed', 'Favourite treat', 'Vet']),
        write(60, 570, 380, 260, 'Funny habits', 'butter'),
        list(460, 570, 380, 'Loves', 'rose', 4),
        write(60, 860, 780, 200, 'How we met', 'mint'),
        themed(60, 1090, 400, 'paws', -2),
      ],
    }),
  },
  {
    id: 'pet-care-log',
    subject: 'Pets',
    name: 'Vet and care log',
    description: 'Visits and treatments with the date of the next one, monthly care to tick and questions for the vet.',
    size: 'portrait',
    build: () => ({
      background: paper(7),
      elements: [
        title(60, 50, 660, 'Vet and care log', { size: 66 }),
        art(740, 40, 100, 'bone', 'grey', -10),
        table(60, 190, 780, 560, 'Visits and treatments', 'sky', ['Date', 'What', 'Notes', 'Next'], blank(8)),
        list(60, 780, 380, 'Monthly care', 'mint', ['Flea and tick', 'Nails', 'Brush', 'Weigh']),
        write(460, 780, 380, 266, 'Things to ask the vet', 'butter'),
      ],
    }),
  },
  {
    id: 'pet-week',
    subject: 'Pets',
    name: 'Walks and meals',
    description: 'Walks and meals for every day of the week, things to buy, new tricks and a photo.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(5, 'grid'),
      elements: [
        title(60, 50, 660, 'Walks and meals', { size: 66 }),
        art(740, 36, 110, 'dog', 'tan', 6),
        table(60, 190, 780, 420, 'This week', 'green', shortDays(ctx), ['Morning walk', 'Evening walk', 'Breakfast', 'Dinner']),
        list(60, 640, 380, 'To buy', 'butter', 4),
        write(460, 640, 380, 266, 'New tricks', 'rose'),
        ...photoSpot(60, 960, 300, 190, -2, 'peach', 'dots'),
        write(390, 940, 450, 210, 'Best moment', 'sky'),
      ],
    }),
  },
];
