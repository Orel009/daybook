import { art, blank, challenge, list, numbered, paper, sub, table, themed, title, track, weekDays, write, type BuiltInTemplate } from '../kit';

// Language learning: words, verbs, phrases, a 30-day path, a practice log and the levels from A1 to C2.

const COLORS = ['rose', 'butter', 'mint', 'sky', 'lilac', 'peach', 'sage', 'coral'];

export const languageLearningTemplates: BuiltInTemplate[] = [
  {
    id: 'lang-vocabulary',
    subject: 'Language learning',
    name: 'Vocabulary list',
    description: 'A table for new words: the word, what it means, an example and a tick when it has stuck.',
    size: 'portrait',
    build: () => ({
      background: paper(7),
      elements: [
        themed(56, 34, 240, 'chat'),
        title(60, 50, 640, 'Vocabulary'),
        art(740, 40, 100, 'speech', 'lilac', 6),
        table(60, 180, 780, 820, 'New words', 'sky', ['Word', 'Meaning', 'Example', 'Learned'], blank(12)),
        write(60, 1030, 780, 120, 'Word of the week', 'butter', false),
      ],
    }),
  },
  {
    id: 'lang-verbs',
    subject: 'Language learning',
    name: 'Verb conjugation',
    description: 'One verb in present, past and future for every person, with room for the irregular bits.',
    size: 'portrait',
    build: () => ({
      background: paper(3, 'grid'),
      elements: [
        title(60, 50, 720, 'Verb conjugation', { size: 66 }),
        write(60, 170, 780, 90, 'The verb, and what it means', 'peach', false),
        table(60, 290, 780, 520, '', 'coral', ['Present', 'Past', 'Future'], ['I', 'You', 'He or she', 'We', 'You all', 'They']),
        write(60, 840, 380, 300, 'Irregular bits', 'butter'),
        write(460, 840, 380, 300, 'Example sentences', 'mint'),
      ],
    }),
  },
  {
    id: 'lang-phrases',
    subject: 'Language learning',
    name: 'Phrase of the day',
    description: 'A phrase for every day of the week, and your favourite at the end.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(4),
      elements: [
        title(60, 50, 720, 'Phrase of the day', { size: 66 }),
        ...[...weekDays(ctx), 'Favourite of the week'].map((day, i) => write(60 + (i % 2) * 400, 180 + Math.floor(i / 2) * 245, 380, 225, day, COLORS[i])),
      ],
    }),
  },
  {
    id: 'lang-path-30',
    subject: 'Language learning',
    name: '30 days of a language',
    description: 'A path of thirty days: a little practice every day gets you to the finish.',
    size: 'portrait',
    build: () => ({
      background: paper(6),
      elements: [
        title(60, 50, 780, '30 days of practice', { size: 62 }),
        write(60, 170, 780, 96, 'The language, and why', 'mint', false),
        challenge(60, 296, 780, 650, 'A little every day', 'teal', 6, numbered(30), { shape: 'circle', layout: 'path' }),
        list(60, 976, 780, 'Ways to practise', 'butter', ['Listen and speak', 'Read and write']),
      ],
    }),
  },
  {
    id: 'lang-practice-log',
    subject: 'Language learning',
    name: 'Language practice log',
    description: 'Your language practice tracker, a plan for the week, what you noticed and a table of sessions.',
    size: 'portrait',
    needs: ['Language practice'],
    build: (ctx) => ({
      elements: [
        title(60, 56, 620, 'Practice log'),
        art(724, 50, 124, 'headphones', 'rose', -6),
        track(60, 210, 400, ctx.tracker('Language practice')),
        list(490, 210, 350, 'This week I will', 'teal', 4),
        write(490, 600, 350, 310, 'New things I noticed', 'butter'),
        table(60, 940, 780, 210, 'Sessions', 'teal', ['Date', 'What I did', 'Minutes'], blank(3)),
      ],
    }),
  },
  {
    id: 'lang-levels',
    subject: 'Language learning',
    name: 'My level, A1 to C2',
    description: 'The six levels as a path to colour in, with what you can do now and your next step.',
    size: 'portrait',
    build: () => ({
      background: paper(8, 'plain'),
      elements: [
        title(60, 50, 640, 'My level'),
        art(740, 40, 100, 'trophy', 'butter', 6),
        sub(60, 146, 700, 'Colour each level as you reach it.'),
        challenge(60, 210, 780, 250, 'From A1 to C2', 'lilac', 6, ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], { shape: 'circle', layout: 'path', inOrder: true }),
        table(60, 490, 780, 420, 'What I can do', 'sky', ['Can do now', 'Working on'], ['Listening', 'Speaking', 'Reading', 'Writing']),
        write(60, 940, 780, 210, 'My next step', 'butter'),
      ],
    }),
  },
  {
    id: 'lang-media',
    subject: 'Language learning',
    name: 'Shows, songs and books',
    description: 'What to watch, hear and read in the language, and how much of it you understood.',
    size: 'portrait',
    build: () => ({
      background: paper(2),
      elements: [
        title(60, 50, 640, 'In the language', { size: 70 }),
        art(740, 40, 100, 'note', 'lilac', 6),
        list(60, 190, 380, 'Shows and films', 'rose', 5),
        list(460, 190, 380, 'Songs and podcasts', 'lilac', 5),
        list(60, 540, 380, 'Books and comics', 'sky', 5),
        write(460, 540, 380, 313, 'Favourite line', 'butter'),
        table(60, 890, 780, 260, 'How much I understood', 'mint', ['Title', 'A little', 'Most', 'All'], blank(4)),
      ],
    }),
  },
];
