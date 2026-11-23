import { art, blank, list, paper, table, tape, title, write, type BuiltInTemplate } from '../kit';

// Travel: ready-made pages.

export const travelTemplates: BuiltInTemplate[] = [
  {
    id: 'packing-list',
    subject: 'Travel',
    name: 'Packing list',
    description: 'Clothes, toiletries, documents, tech and extras to tick off as you pack.',
    size: 'portrait',
    build: () => ({
      background: paper(7, 'dots'),
      elements: [
        tape(56, 44, 220, 'sky', 'checker'),
        title(60, 62, 620, 'Packing list'),
        art(724, 44, 126, 'compass', undefined, 6),
        list(60, 200, 380, 'Clothes', 'sky', ['Tops', 'Trousers', 'Underwear', 'Socks', 'Pyjamas', 'Jacket']),
        list(460, 200, 380, 'Toiletries', 'mint', ['Toothbrush', 'Shampoo', 'Sun cream', 'Medicine']),
        list(460, 520, 380, 'Documents', 'butter', ['Passport', 'Tickets', 'Insurance', 'Money']),
        list(60, 600, 380, 'Tech', 'lilac', ['Phone charger', 'Adapter', 'Headphones']),
        list(60, 870, 380, 'Extras', 'peach', 4),
        write(460, 860, 380, 290, 'Before leaving', 'rose'),
      ],
    }),
  },
  {
    id: 'trip-planner',
    subject: 'Travel',
    name: 'Trip planner',
    description: 'Where and when, a day-by-day plan, things to book and a budget.',
    size: 'landscape',
    build: () => ({
      background: paper(6, 'dots'),
      elements: [
        tape(50, 26, 220, 'teal', 'waves'),
        title(50, 40, 700, 'Trip planner'),
        art(1040, 20, 110, 'tent', undefined, 6),
        write(50, 160, 520, 130, 'Where and when', 'teal', false),
        table(50, 320, 520, 530, 'Day by day', 'mint', ['Day', 'Plan', 'Stay'], blank(7)),
        list(600, 160, 260, 'To book', 'butter', 5),
        table(880, 160, 270, 450, 'Budget', 'peach', ['Item', 'Cost'], blank(6)),
        write(600, 640, 550, 210, 'Must see', 'sky'),
      ],
    }),
  },
];
