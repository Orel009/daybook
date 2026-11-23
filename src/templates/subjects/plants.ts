import { art, blank, frame, list, paper, photoSpot, shortDays, table, themed, tiles, title, write, type BuiltInTemplate } from '../kit';

// Plants: profiles with a photo, watering, propagation, sowing and harvest, a bed planner and a wishlist.

export const plantsTemplates: BuiltInTemplate[] = [
  {
    id: 'plant-profiles',
    subject: 'Plants',
    name: 'Plant profiles',
    description: 'Four plant cards, each with a photo slot and its light, water, soil and when you bought it.',
    size: 'portrait',
    build: () => ({
      background: paper(5),
      elements: [
        title(60, 50, 640, 'My plants'),
        art(740, 40, 110, 'sprout', 'green'),
        ...[0, 1, 2, 3].flatMap((i) => {
          const x = 60 + (i % 2) * 400;
          const y = 190 + Math.floor(i / 2) * 490;
          return [
            write(x, y, 380, 80, 'Name', ['sage', 'mint', 'green', 'butter'][i], false),
            frame(x, y + 96, 170, 230, i % 2 ? 2 : -2),
            table(x + 186, y + 96, 194, 230, '', 'green', [''], ['Light', 'Water', 'Soil', 'Bought']),
            write(x, y + 342, 380, 120, 'Notes', 'mint', false),
          ];
        }),
      ],
    }),
  },
  {
    id: 'plant-watering',
    subject: 'Plants',
    name: 'Watering schedule',
    description: 'A grid of plants and days to tick when each one has had a drink.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(7, 'grid'),
      elements: [
        title(60, 50, 660, 'Watering schedule', { size: 66 }),
        art(740, 36, 110, 'wateringcan', 'mint', -8),
        table(60, 190, 780, 700, 'Who got a drink', 'sky', ['Plant', ...shortDays(ctx)], blank(10)),
        list(60, 920, 380, 'Also this week', 'mint', ['Feed', 'Mist', 'Turn the pots']),
        write(460, 920, 380, 220, 'Looking thirsty', 'butter'),
      ],
    }),
  },
  {
    id: 'plant-propagation',
    subject: 'Plants',
    name: 'Propagation tracker',
    description: 'Cuttings from the day you took them to roots and a pot of their own.',
    size: 'portrait',
    build: () => ({
      background: paper(6),
      elements: [
        title(60, 50, 640, 'Propagation'),
        art(730, 40, 110, 'succulent', 'sage', 6),
        table(60, 190, 780, 560, 'Cuttings', 'green', ['Plant', 'Cut on', 'Roots', 'Potted'], blank(8)),
        ...photoSpot(60, 800, 300, 250, -2, 'mint', 'leaves'),
        write(390, 790, 450, 270, 'What worked', 'butter'),
        themed(60, 1090, 380, 'sprouts', -2),
      ],
    }),
  },
  {
    id: 'plant-seeds',
    subject: 'Plants',
    name: 'Seed sowing and harvest',
    description: 'From seed to plate: when you sowed, when it sprouted, when it went out and what you picked.',
    size: 'portrait',
    build: () => ({
      background: paper(4),
      elements: [
        title(60, 50, 680, 'Sowing and harvest', { size: 62 }),
        art(750, 36, 100, 'sprout', 'green', -6),
        table(60, 180, 780, 640, 'From seed to plate', 'sage', ['Seed', 'Sown', 'Sprouted', 'Planted out', 'Harvest'], blank(9)),
        list(60, 850, 380, 'To sow next', 'mint', 4),
        write(460, 850, 380, 266, 'Best crop this year', 'butter'),
      ],
    }),
  },
  {
    id: 'plant-bed-planner',
    subject: 'Plants',
    name: 'Garden bed planner',
    description: 'The bed as a grid of squares to write plants on, with a to-plant list beside it.',
    size: 'landscape',
    build: () => ({
      background: paper(5, 'grid'),
      elements: [
        title(50, 30, 700, 'Garden bed planner', { size: 62 }),
        art(1050, 20, 100, 'bee', 'butter', 8),
        tiles(50, 150, 760, 560, 'The bed, square by square', 'green', 6, 24),
        list(840, 150, 310, 'To plant', 'sage', 6),
        write(840, 540, 310, 250, 'Notes', 'butter'),
        themed(50, 750, 500, 'meadow', -1),
      ],
    }),
  },
  {
    id: 'plant-wishlist',
    subject: 'Plants',
    name: 'Plant wishlist',
    description: 'Plants you would love to have, photo slots for the dream ones and where to find them.',
    size: 'portrait',
    build: () => ({
      background: paper(2),
      elements: [
        title(60, 50, 640, 'Plant wishlist', { size: 70 }),
        art(740, 40, 100, 'roundcactus', 'green', 6),
        list(60, 190, 400, 'Would love to have', 'green', 9),
        frame(490, 190, 350, 270, 2, { caption: 'Dream plant' }),
        frame(500, 490, 330, 220, -2, { style: 'rounded' }),
        table(60, 740, 780, 300, 'Where to find them', 'sage', ['Plant', 'Shop or swap', 'Price'], blank(4)),
        write(60, 1060, 780, 100, 'There is room for one more on the', 'mint', false),
      ],
    }),
  },
];
