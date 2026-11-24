import { art, blank, list, month, paper, sub, table, tape, themed, title, track, write, type BuiltInTemplate } from '../kit';

// Dreams: ready-made pages.

export const dreamsTemplates: BuiltInTemplate[] = [
  {
    id: 'dream-log',
    subject: 'Dreams',
    name: 'Dream log',
    description: 'The date, the dream, how it felt and whether it was lucid, with your dreams tracker.',
    size: 'portrait',
    needs: ['Dreams'],
    build: (ctx) => ({
      background: paper(10, 'dots'),
      elements: [
        themed(56, 44, 220, 'moons'),
        title(60, 62, 620, 'Dream log', { color: '#FFFFFF' }),
        art(724, 44, 126, 'starlight', undefined, 0),
        write(60, 200, 380, 600, 'Themes this month', 'plum'),
        track(460, 200, 380, ctx.tracker('Dreams')),
        table(60, 900, 780, 250, 'Dreams', 'lilac', ['Date', 'Dream', 'Feeling', 'Lucid?'], blank(4)),
      ],
    }),
  },
  {
    id: 'dream-symbols',
    subject: 'Dreams',
    name: 'Recurring dreams',
    description: 'Dreams that keep coming back, and the symbols in them: what they might mean and how often.',
    size: 'portrait',
    build: () => ({
      background: paper(8, 'dots'),
      elements: [
        themed(56, 44, 240, 'zzz'),
        title(60, 62, 620, 'Recurring dreams', { size: 64 }),
        art(724, 44, 126, 'cloud', 'lilac', 6),
        write(60, 200, 780, 330, 'Dreams that come back', 'plum'),
        table(60, 560, 780, 480, 'Symbols', 'lilac', ['Symbol', 'What it might mean', 'Times seen'], blank(7)),
        art(70, 1060, 100, 'starlight', undefined, -6),
        sub(190, 1080, 650, 'Write dreams down as soon as you wake.'),
      ],
    }),
  },
  {
    id: 'dream-month',
    subject: 'Dreams',
    name: 'Dream calendar',
    description: 'A month with a word for each night’s dream, dream signs to watch for and the patterns you notice.',
    size: 'landscape',
    build: (ctx) => ({
      background: paper(8, 'dots'),
      elements: [
        title(50, 30, 760, 'Dream calendar'),
        tape(900, 60, 230, 'lilac', 'stars', 3),
        month(50, 150, 800, 700, 'lilac', ctx.today),
        list(880, 150, 270, 'Dream signs', 'plum', 4),
        write(880, 520, 270, 330, 'Patterns', 'lilac'),
      ],
    }),
  },
  {
    id: 'dream-lucid',
    subject: 'Dreams',
    name: 'Lucid dreams and sleep',
    description: 'Your sleep and dreams trackers, lucid-dream habits to tick, and a table of sleep quality.',
    size: 'portrait',
    needs: ['Sleep', 'Dreams'],
    build: (ctx) => ({
      background: paper(10, 'grid'),
      elements: [
        title(60, 56, 620, 'Lucid dreaming', { color: '#FFFFFF', size: 64 }),
        art(724, 40, 126, 'owl', undefined, 6),
        track(60, 190, 380, ctx.tracker('Sleep')),
        track(460, 190, 380, ctx.tracker('Dreams')),
        list(60, 890, 380, 'Every day', 'lilac', ['Reality check', 'Dream journal', 'No screens late', 'Same bedtime']),
        table(460, 890, 380, 270, 'Sleep quality', 'sky', ['Night', 'Hours', '1 to 5'], blank(4)),
      ],
    }),
  },
];
