import { art, blank, challenge, list, numbered, paper, sub, table, themed, title, write, type BuiltInTemplate } from '../kit';

// Challenges in other shapes than a bingo card: a jar of marbles, a shelf to
// colour, a mountain trail, a path, a big heart, a stamp card, a thermometer
// and a board game. A tap marks a tile; the heading counts how far you are.

export const challengesTemplates: BuiltInTemplate[] = [
  {
    id: 'challenge-reading-jar',
    subject: 'Challenges',
    name: 'Reading jar',
    description: 'Drop a marble in the jar for every book you finish, with a list of the books beside it.',
    size: 'portrait',
    build: () => ({
      background: paper(7),
      elements: [
        title(60, 50, 560, 'Reading jar'),
        art(740, 40, 110, 'bookstack', 'rose', 8),
        challenge(60, 200, 420, 660, 'A marble for every book', 'sky', 1, 40, { layout: 'jar' }),
        list(510, 200, 330, 'Books read', 'peach', 8),
        write(510, 690, 330, 170, 'My goal', 'butter', false),
        write(60, 890, 780, 260, 'Favourites so far', 'rose'),
      ],
    }),
  },
  {
    id: 'challenge-bookshelf-50',
    subject: 'Challenges',
    name: '50 books to colour',
    description: 'A bookcase of fifty spines: colour one in for every book you read.',
    size: 'portrait',
    build: () => ({
      background: paper(9, 'plain'),
      elements: [
        title(60, 50, 660, '50 books to colour', { size: 62 }),
        art(750, 36, 100, 'glasses', 'butter', -6),
        challenge(60, 180, 780, 760, 'Colour a spine for every book', 'lilac', 10, 50, { shape: 'spine' }),
        write(60, 970, 780, 180, 'Best of the shelf', 'butter'),
      ],
    }),
  },
  {
    id: 'challenge-trail-12',
    subject: 'Challenges',
    name: 'Mountain of 12 books',
    description: 'Twelve stops up a mountain trail, one for each book, with the titles listed alongside.',
    size: 'portrait',
    build: () => ({
      background: paper(6),
      elements: [
        title(60, 50, 700, '12 books to the top', { size: 62 }),
        challenge(50, 180, 800, 520, 'To the summit', 'lilac', 1, numbered(12), { layout: 'trail' }),
        write(60, 730, 380, 260, 'Why these twelve', 'sky'),
        list(460, 730, 380, 'At the top I will', 'mint', 3),
        themed(60, 1040, 380, 'camping', -2),
        art(680, 960, 150, 'mountain', 'lilac', 6),
      ],
    }),
  },
  {
    id: 'challenge-path-30',
    subject: 'Challenges',
    name: '30-day challenge path',
    description: 'Thirty steps along a winding path from start to finish, for any habit you want to build.',
    size: 'portrait',
    build: () => ({
      background: paper(4),
      elements: [
        title(60, 50, 720, '30-day challenge', { size: 66 }),
        write(60, 180, 540, 110, 'My challenge', 'butter', false),
        art(660, 160, 150, 'trophy', 'butter', 8),
        challenge(60, 320, 780, 640, 'One step a day', 'mint', 6, numbered(30), { shape: 'circle', layout: 'path' }),
        write(60, 990, 780, 160, 'My reward at the finish', 'rose', false),
      ],
    }),
  },
  {
    id: 'challenge-hearts-100',
    subject: 'Challenges',
    name: '100 acts of kindness',
    description: 'A big heart made of a hundred little ones. Colour one for every kind thing you do.',
    size: 'portrait',
    build: () => ({
      background: paper(2, 'plain'),
      elements: [
        title(60, 50, 780, '100 acts of kindness', { size: 62 }),
        challenge(100, 170, 700, 720, 'A heart for each one', 'rose', 1, 100, { layout: 'heart' }),
        list(60, 920, 380, 'Ideas', 'lilac', 4),
        write(460, 920, 380, 236, 'It made someone smile', 'peach'),
      ],
    }),
  },
  {
    id: 'challenge-stamps-52',
    subject: 'Challenges',
    name: '52 weeks stamp card',
    description: 'A stamp card with a circle for every week of the year.',
    size: 'portrait',
    build: () => ({
      background: paper(5, 'grid'),
      elements: [
        title(60, 50, 640, '52 weeks'),
        art(740, 40, 100, 'star', 'butter', 8),
        sub(60, 146, 700, 'A stamp for every week you kept it up'),
        write(60, 200, 780, 100, 'What I am doing every week', 'mint', false),
        challenge(60, 330, 780, 640, 'Stamp card', 'coral', 8, numbered(52), { shape: 'circle', mark: 'stamp' }),
        write(60, 1000, 780, 150, 'Halfway treat and finish-line treat', 'butter', false),
      ],
    }),
  },
  {
    id: 'challenge-no-spend',
    subject: 'Challenges',
    name: 'No-spend thermometer',
    description: 'A thermometer that fills a day at a time, with your rules and what you are saving for.',
    size: 'portrait',
    build: () => ({
      background: paper(6),
      elements: [
        title(60, 50, 720, 'No-spend challenge', { size: 62 }),
        challenge(60, 190, 330, 950, 'Days without spending', 'green', 1, Array.from({ length: 30 }, (_, i) => ((i + 1) % 5 === 0 ? `${i + 1} days` : '')), { layout: 'thermo' }),
        list(420, 190, 420, 'My rules', 'mint', 4),
        write(420, 480, 420, 220, 'What I am saving for', 'butter'),
        table(420, 730, 420, 410, 'Tempted, but did not', 'rose', ['What', 'Saved'], blank(6)),
      ],
    }),
  },
  {
    id: 'challenge-fitness-quest',
    subject: 'Challenges',
    name: 'Fitness quest board',
    description: 'A board-game path of twenty little workouts, from start to "Celebrate!".',
    size: 'portrait',
    build: () => ({
      background: paper(7, 'grid'),
      elements: [
        title(60, 50, 640, 'Fitness quest'),
        art(730, 40, 110, 'dumbbell', 'sky', -8),
        challenge(60, 190, 780, 800, 'Move on one square at a time', 'teal', 4, [
          '10 squats', 'Walk 20 minutes', 'Stretch', 'Dance to a song', 'Rest day', '15 lunges', 'Plank 30 seconds', 'Climb the stairs', 'Yoga flow', 'Walk 30 minutes',
          '10 push-ups', 'Rest day', 'Skip rope', 'Bike ride', 'Stretch', '20 squats', 'Swim or walk', 'Dance to two songs', 'Plank 45 seconds', 'Celebrate!',
        ], { shape: 'square', layout: 'path' }),
        write(60, 1020, 780, 130, 'How I feel at the finish', 'peach', false),
      ],
    }),
  },
];
