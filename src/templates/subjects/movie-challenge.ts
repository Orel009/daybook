import { art, blank, list, paper, table, tape, themed, tiles, title, write, type BuiltInTemplate } from '../kit';
import { GENRES } from '../shared';

// Movie challenge: ready-made pages.

export const movieChallengeTemplates: BuiltInTemplate[] = [
  {
    id: 'movie-genres',
    subject: 'Movie challenge',
    name: 'Movie genre challenge',
    description: 'Sixteen genres to watch: the title, the date and your stars on each tile.',
    size: 'landscape',
    build: () => ({
      background: paper(10, 'dots'),
      elements: [
        themed(50, 26, 220, 'filmstrip'),
        title(50, 40, 760, 'Movie genre challenge', { color: '#FFFFFF', size: 64 }),
        art(1040, 20, 110, 'star', 'butter', 8),
        tiles(50, 150, 1100, 700, 'One film per genre: title, date, stars', 'coral', 4, GENRES, { bingo: true, mark: 'stamp' }),
      ],
    }),
  },
  {
    id: 'movie-log',
    subject: 'Movie challenge',
    name: 'Movie log',
    description: 'Every film you watch: date, title, genre, who with and stars.',
    size: 'portrait',
    build: () => ({
      background: paper(1, 'lines'),
      elements: [
        themed(56, 44, 220, 'popcorn'),
        title(60, 62, 620, 'Movie log'),
        art(724, 44, 126, 'starlight', undefined, 6),
        table(60, 200, 780, 820, 'Watched', 'sky', ['Date', 'Film', 'Genre', 'With', 'Stars'], blank(14)),
        write(60, 1046, 780, 110, 'Film of the month', 'butter', false),
      ],
    }),
  },
  {
    id: 'watchlist',
    subject: 'Movie challenge',
    name: 'Watchlist',
    description: 'Films to watch, ones friends recommended and ones for a cosy night, with notes.',
    size: 'portrait',
    build: () => ({
      background: paper(9, 'dots'),
      elements: [
        tape(56, 44, 240, 'lilac', 'stars'),
        title(60, 62, 620, 'Watchlist'),
        art(724, 44, 126, 'stringlights', undefined, 0),
        list(60, 200, 380, 'To watch', 'lilac', 8),
        list(460, 200, 380, 'Friends recommend', 'rose', 8),
        list(60, 700, 380, 'For a cosy night', 'peach', 5),
        write(460, 700, 380, 450, 'Notes', 'mint'),
      ],
    }),
  },
];
