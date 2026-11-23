import { art, blank, list, paper, sub, table, tape, tiles, title, track, write, type BuiltInTemplate } from '../kit';

// Series: ready-made pages.

export const seriesTemplates: BuiltInTemplate[] = [
  {
    id: 'series-now',
    subject: 'Series',
    name: 'Watching now',
    description: "Series you're in the middle of: season, episode, where it's on and how it's going, with your episodes tracker.",
    size: 'landscape',
    needs: ['Series watched'],
    build: (ctx) => ({
      background: paper(9, 'grid'),
      elements: [
        tape(50, 26, 220, 'plum', 'stripes'),
        title(50, 40, 700, 'Watching now'),
        art(1040, 20, 110, 'desklamp', undefined, 6),
        table(50, 160, 720, 690, 'Series', 'plum', ['Series', 'Season', 'Episode', 'Where', 'Status'], blank(10)),
        track(800, 160, 350, ctx.tracker('Series watched')),
      ],
    }),
  },
  {
    id: 'series-episodes',
    subject: 'Series',
    name: 'Episode tracker',
    description: 'Tick off every episode, season by season: two seasons of up to 12 episodes per page.',
    size: 'portrait',
    build: () => {
      const eps = Array.from({ length: 12 }, (_, i) => String(i + 1));
      return {
        background: paper(8, 'dots'),
        elements: [
          tape(56, 44, 220, 'lilac', 'checker'),
          title(60, 62, 620, 'Episode tracker', { size: 64 }),
          art(724, 44, 126, 'star', 'butter', 6),
          write(60, 200, 780, 110, 'Series', 'lilac', false),
          tiles(60, 340, 780, 360, 'Season', 'sky', 6, eps, { mark: 'cross' }),
          tiles(60, 730, 780, 360, 'Season', 'rose', 6, eps, { mark: 'cross' }),
          sub(62, 1110, 780, 'Write the season numbers in Edit; tap an episode once watched.'),
        ],
      };
    },
  },
  {
    id: 'series-finished',
    subject: 'Series',
    name: 'Finished series',
    description: "Every series you've finished, with seasons, when you finished and stars, and favourite moments.",
    size: 'portrait',
    build: () => ({
      background: paper(4, 'dots'),
      elements: [
        tape(56, 44, 220, 'butter', 'stars'),
        title(60, 62, 620, 'Finished series', { size: 64 }),
        art(724, 44, 126, 'trophy', undefined, 6),
        table(60, 200, 780, 640, 'Finished', 'butter', ['Series', 'Seasons', 'Finished', 'Stars'], blank(10)),
        write(60, 870, 780, 280, 'Favourite moments', 'rose'),
      ],
    }),
  },
  {
    id: 'series-want',
    subject: 'Series',
    name: 'Series to watch',
    description: 'A want-to-watch list, where each is on, and who recommended it.',
    size: 'portrait',
    build: () => ({
      background: paper(6, 'dots'),
      elements: [
        tape(56, 44, 240, 'mint', 'gingham'),
        title(60, 62, 620, 'Want to watch'),
        art(724, 44, 126, 'sparkle', 'butter', 6),
        list(60, 200, 380, 'Next up', 'mint', 7),
        list(460, 200, 380, 'Someday', 'sky', 7),
        table(60, 640, 780, 510, 'Where and who', 'lilac', ['Series', 'Where', 'Recommended by'], blank(7)),
      ],
    }),
  },
];
