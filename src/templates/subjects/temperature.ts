import { art, monthName, paper, table, tape, title, track, type BuiltInTemplate } from '../kit';

// Temperature: ready-made pages.

export const temperatureTemplates: BuiltInTemplate[] = [
  {
    id: 'temp-blanket-c',
    subject: 'Temperature',
    name: 'Temperature blanket (°C)',
    description: "Each day's high as a coloured pixel, coldest blue to hottest red: a year-long temperature blanket.",
    size: 'portrait',
    needs: ['Temperature (°C)'],
    build: (ctx) => ({
      background: paper(0, 'grid'),
      elements: [
        tape(56, 44, 240, 'coral', 'rainbow'),
        title(60, 62, 640, 'Temperature blanket', { size: 50 }),
        art(724, 44, 126, 'mitten', 'blue', 8),
        track(60, 200, 780, ctx.tracker('Temperature (°C)'), { look: 'pixels', full: true }),
      ],
    }),
  },
  {
    id: 'temp-blanket-f',
    subject: 'Temperature',
    name: 'Temperature blanket (°F)',
    description: "Each day's high as a coloured pixel in Fahrenheit bands: a year-long temperature blanket.",
    size: 'portrait',
    needs: ['Temperature (°F)'],
    build: (ctx) => ({
      background: paper(0, 'grid'),
      elements: [
        tape(56, 44, 240, 'orange', 'rainbow'),
        title(60, 62, 640, 'Temperature blanket', { size: 50 }),
        art(724, 44, 126, 'sun', undefined, 0),
        track(60, 200, 780, ctx.tracker('Temperature (°F)'), { look: 'pixels', full: true }),
      ],
    }),
  },
  {
    id: 'temp-highlow',
    subject: 'Temperature',
    name: 'Daily highs and lows',
    description: 'The high and low of every day this month, with a note, in two columns.',
    size: 'landscape',
    build: (ctx) => {
      const days = new Date(ctx.today.getFullYear(), ctx.today.getMonth() + 1, 0).getDate();
      const nums = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => String(a + i));
      return {
        background: paper(1, 'plain'),
        elements: [
          title(50, 30, 960, `${monthName(ctx.today)} temperatures`, { size: 56 }),
          art(1040, 20, 110, 'snowflake', undefined, 0),
          table(50, 140, 540, 720, 'Days 1 to 16', 'sky', ['High', 'Low', 'Note'], nums(1, 16)),
          table(610, 140, 540, 720, `Days 17 to ${days}`, 'coral', ['High', 'Low', 'Note'], nums(17, days)),
        ],
      };
    },
  },
];
