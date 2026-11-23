import { art, blank, list, paper, photoSpot, table, tape, title, write, type BuiltInTemplate } from '../kit';

// Holidays: ready-made pages.

export const holidaysTemplates: BuiltInTemplate[] = [
  {
    id: 'gift-planner',
    subject: 'Holidays',
    name: 'Gift planner',
    description: 'For each person: the gift, the budget, and ticks for bought and wrapped.',
    size: 'landscape',
    build: () => ({
      background: paper(0, 'dots'),
      elements: [
        tape(50, 26, 220, 'red', 'candy'),
        title(50, 40, 700, 'Gift planner'),
        art(1040, 20, 110, 'gift', 'red', 6),
        table(50, 160, 780, 690, 'Gifts', 'red', ['Who', 'Gift', 'Budget', 'Bought', 'Wrapped'], blank(10)),
        list(860, 160, 290, 'Still to find', 'green', 5),
        art(950, 600, 120, 'xmastree', undefined, -4),
      ],
    }),
  },
  {
    id: 'holiday-bucket',
    subject: 'Holidays',
    name: 'Holiday bucket list',
    description: 'Holiday-season things to do, traditions to keep, a photo spot and favourite moments.',
    size: 'portrait',
    build: () => ({
      background: paper(10, 'dots'),
      elements: [
        tape(56, 44, 240, 'red', 'stars'),
        title(60, 62, 620, 'Holiday bucket list', { color: '#FFFFFF', size: 60 }),
        art(724, 44, 126, 'stringlights', undefined, 0),
        list(60, 200, 380, 'To do', 'red', ['Bake together', 'See the lights', 'Make a gift', 'Holiday film night', '']),
        list(460, 200, 380, 'Traditions', 'green', ['Decorate', 'Sing', 'Light the candles', '']),
        ...photoSpot(70, 620, 360, 300, -2, 'butter', 'stars'),
        art(380, 880, 90, 'candle', undefined, 6),
        write(470, 620, 370, 300, 'Favourite moments', 'butter'),
        write(60, 960, 780, 190, 'Next year', 'sky'),
      ],
    }),
  },
];
