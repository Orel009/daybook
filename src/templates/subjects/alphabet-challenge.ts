import { ALPHABET } from '../../domain/pages';
import { art, list, paper, table, tape, tiles, title, write, type BuiltInTemplate } from '../kit';

// Alphabet challenge: ready-made pages.

const azPage = (id: string, name: string, what: string, color: string, sticker: string, paperIndex: number, note: string): BuiltInTemplate => ({
  id,
  subject: 'Alphabet challenge',
  name,
  description: `One ${what} for every letter of the alphabet: write it on its letter, tap it when it's done.`,
  size: 'portrait',
  build: () => ({
    background: paper(paperIndex, 'dots'),
    elements: [
      tape(56, 44, 220, color, 'confetti'),
      title(60, 62, 620, name, { size: 64 }),
      art(724, 44, 126, sticker, color, 8),
      tiles(60, 200, 780, 760, 'A to Z', color, 6, ALPHABET, { mark: 'cross' }),
      write(60, 990, 500, 160, note, 'butter'),
      list(590, 990, 250, 'Favourites', 'rose', 2),
    ],
  }),
});

export const alphabetChallengeTemplates: BuiltInTemplate[] = [
  azPage('az-read', 'A to Z to read', 'book', 'sky', 'bookstack', 7, 'Books I loved'),
  azPage('az-watch', 'A to Z to watch', 'film or series', 'coral', 'star', 3, 'Best watched'),
  azPage('az-listen', 'A to Z to listen', 'album, song or podcast', 'mint', 'sparkle', 5, 'On repeat'),
  {
    id: 'az-mixed',
    subject: 'Alphabet challenge',
    name: 'A to Z mixed',
    description: 'A book, film or album for every letter. Note which it was on each tile, and keep count.',
    size: 'portrait',
    build: () => ({
      background: paper(8, 'grid'),
      elements: [
        tape(56, 44, 220, 'lilac', 'stars'),
        title(60, 62, 620, 'A to Z mixed', {}),
        art(724, 44, 126, 'openbook', 'sky', -6),
        tiles(60, 200, 780, 760, 'Read, watch or listen', 'lilac', 6, ALPHABET, { mark: 'stamp' }),
        table(60, 990, 500, 160, 'Count', 'butter', ['Read', 'Watched', 'Listened'], ['']),
        write(590, 990, 250, 160, 'Notes', 'mint'),
      ],
    }),
  },
];
