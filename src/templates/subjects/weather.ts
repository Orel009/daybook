import { art, month, monthName, paper, tape, title, track, write, type BuiltInTemplate } from '../kit';

// Weather: ready-made pages.

export const weatherTemplates: BuiltInTemplate[] = [
  {
    id: 'weather-year',
    asks: 'year',
    subject: 'Weather',
    name: 'Weather year in pixels',
    description: "A pixel for every day's weather, in its colour, for the whole year.",
    size: 'portrait',
    needs: ['Weather'],
    build: (ctx) => ({
      background: paper(7, 'dots'),
      elements: [
        tape(56, 44, 220, 'sky', 'dots'),
        title(60, 62, 620, `Weather ${ctx.year}`, {}),
        art(724, 44, 126, 'sun', undefined, 0),
        track(60, 200, 780, ctx.tracker('Weather'), { look: 'pixels', full: true }),
      ],
    }),
  },
  {
    id: 'weather-month',
    subject: 'Weather',
    name: 'Weather this month',
    description: 'A month with a note on every day, your weather tracker and the month in a few words.',
    size: 'landscape',
    needs: ['Weather'],
    build: (ctx) => ({
      background: paper(7, 'plain'),
      elements: [
        title(50, 30, 760, `${monthName(ctx.today)} weather`),
        art(1030, 20, 120, 'umbrella', undefined, 8),
        month(50, 150, 800, 700, 'sky', ctx.today),
        track(880, 150, 270, ctx.tracker('Weather'), { year: ctx.today.getFullYear(), month: ctx.today.getMonth() }),
        write(880, 730, 270, 120, 'In a few words', 'butter', false),
      ],
    }),
  },
  {
    id: 'weather-mood',
    subject: 'Weather',
    name: 'Weather and mood',
    description: 'Your weather and mood trackers side by side, to see how one follows the other.',
    size: 'landscape',
    needs: ['Weather', 'Mood'],
    build: (ctx) => ({
      background: paper(5, 'dots'),
      elements: [
        tape(50, 26, 220, 'butter', 'stripes'),
        title(50, 40, 760, 'Weather and mood'),
        art(1040, 24, 110, 'cloud', 'sky', 6),
        track(50, 160, 440, ctx.tracker('Weather'), { look: 'calendar' }),
        track(510, 160, 440, ctx.tracker('Mood'), { look: 'calendar' }),
        write(970, 160, 180, 690, 'What I notice', 'mint'),
      ],
    }),
  },
];
