import { type TapePattern } from '../../domain/pages';
import { art, blank, frame, label, list, monthName, paper, rating, sub, table, tape, themed, title, write, type BuiltInTemplate } from '../kit';

// Goals: ready-made pages.

export const goalsTemplates: BuiltInTemplate[] = [
  {
    id: 'goals',
    asks: 'month',
    subject: 'Goals',
    name: 'Monthly goals',
    description: 'Goals in four areas of life, why they matter, and a review.',
    size: 'portrait',
    build: (ctx) => ({
      elements: [
        themed(60, 46, 260, 'targets'),
        title(60, 62, 760, `${monthName(ctx.month)} goals`),
        list(60, 210, 380, 'Health', 'mint', 3),
        list(460, 210, 380, 'Home', 'peach', 3),
        list(60, 510, 380, 'For me', 'lilac', 3),
        list(460, 510, 380, 'People', 'rose', 3),
        write(60, 814, 780, 156, 'Why these matter', 'butter'),
        write(60, 990, 780, 160, 'End of month review', 'sky'),
      ],
    }),
  },
  {
    id: 'goals-month-focus',
    asks: 'month',
    subject: 'Goals',
    name: 'Monthly goals: one focus',
    description: 'One focus for the month, three goals with their steps, and a reward for getting there.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(4),
      elements: [
        themed(60, 46, 240, 'checkmarks'),
        title(60, 62, 660, `${monthName(ctx.month)} goals`, { size: 68 }),
        sub(62, 160, 600, `One focus for ${monthName(ctx.month)} ${ctx.month.getFullYear()}`),
        art(730, 44, 110, 'star', 'butter', 8),
        write(60, 220, 780, 150, 'My one focus this month', 'butter', false),
        list(60, 400, 250, 'Goal one', 'mint', 3),
        list(325, 400, 250, 'Goal two', 'sky', 3),
        list(590, 400, 250, 'Goal three', 'rose', 3),
        write(60, 690, 780, 196, 'What will make it easier', 'lilac'),
        write(60, 910, 480, 240, 'My reward when I get there', 'peach'),
        label(570, 924, 270, 'How the month went'),
        rating(570, 964, 270),
      ],
    }),
  },
  {
    id: 'goals-month-weeks',
    asks: 'month',
    subject: 'Goals',
    name: 'Monthly goals, week by week',
    description: 'A goal and one small step for each week of the month, with the big picture above and a review below.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(7, 'grid'),
      elements: [
        title(60, 58, 780, `${monthName(ctx.month)}, week by week`, { size: 52 }),
        sub(62, 140, 600, `Goals for ${monthName(ctx.month)} ${ctx.month.getFullYear()}`),
        write(60, 200, 780, 150, 'The big picture this month', 'butter', false),
        table(60, 380, 780, 470, 'Week by week', 'sky', ['My goal', 'One small step', 'Done'], ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5']),
        write(60, 880, 380, 270, 'What went well', 'mint'),
        write(460, 880, 380, 270, 'What I will change', 'rose'),
      ],
    }),
  },
  {
    id: 'big-goal',
    subject: 'Goals',
    name: 'One big goal',
    description: 'Why it matters, what could get in the way, first steps and milestones.',
    size: 'portrait',
    build: () => ({
      background: paper(4),
      elements: [
        title(60, 50, 700, 'One big goal'),
        art(726, 44, 120, 'trophy', 'butter', 6),
        write(60, 196, 780, 130, 'My goal', 'butter', false),
        write(60, 346, 380, 250, 'Why it matters', 'rose'),
        write(460, 346, 380, 250, 'What might get in the way', 'sky'),
        list(60, 616, 380, 'First steps', 'mint', 5),
        table(460, 616, 380, 372, 'Milestones', 'lilac', ['What', 'By when'], blank(5)),
        write(60, 1010, 780, 140, 'How I’ll celebrate', 'peach', false),
      ],
    }),
  },
  {
    id: 'year-goals',
    asks: 'year',
    subject: 'Goals',
    name: 'Goals for the year',
    description: 'A checklist for each quarter, a word for the year and a look back.',
    size: 'landscape',
    build: (ctx) => ({
      elements: [
        title(50, 30, 700, `${ctx.year} goals`),
        tape(930, 64, 220, 'butter', 'stars', 4),
        ...['January to March', 'April to June', 'July to September', 'October to December'].map((q, i) => list(50 + i * 279, 190, 262, q, ['mint', 'butter', 'peach', 'sky'][i], 5)),
        write(50, 590, 548, 260, 'My word for the year', 'rose', false),
        write(614, 590, 536, 260, 'Looking back', 'lilac'),
      ],
    }),
  },
  {
    id: 'smart-goal',
    subject: 'Goals',
    name: 'SMART goal',
    description: 'Turn a wish into a plan: specific, measurable, achievable, relevant, with a date.',
    size: 'portrait',
    build: () => ({
      background: paper(1, 'grid'),
      elements: [
        title(60, 50, 640, 'SMART goal'),
        art(720, 40, 120, 'banner', 'mint', -6),
        write(60, 190, 780, 180, 'Specific: what exactly?', 'rose'),
        write(60, 386, 780, 180, 'Measurable: how will I know?', 'peach'),
        write(60, 582, 780, 180, 'Achievable: is it realistic?', 'butter'),
        write(60, 778, 780, 180, 'Relevant: why does it matter now?', 'mint'),
        write(60, 974, 780, 176, 'Time-bound: by when?', 'sky'),
      ],
    }),
  },
  {
    id: 'vision-board',
    subject: 'Goals',
    name: 'Vision board',
    description: 'Six photo spots for the life you’re building: home, health, work, love, travel and you.',
    size: 'landscape',
    build: () => {
      const spots: [number, number, string, number, string, TapePattern][] = [
        [50, 166, 'Home', -2, 'peach', 'gingham'],
        [425, 150, 'Health', 2, 'mint', 'dots'],
        [800, 166, 'Work', -1, 'sky', 'stripes'],
        [60, 508, 'Love', 2, 'rose', 'hearts'],
        [430, 520, 'Travel', -2, 'butter', 'triangles'],
        [800, 506, 'Me', 2, 'lilac', 'stars'],
      ];
      return {
        background: paper(9, 'plain'),
        elements: [
          title(50, 26, 700, 'Vision board'),
          art(1060, 20, 90, 'sparkle', 'butter'),
          ...spots.flatMap(([x, y, name, rot, color, pattern]) => [frame(x, y, 340, 300, rot, { caption: name }), tape(x + 110, y - 18, 130, color, pattern, rot * -2)]),
        ],
      };
    },
  },
  {
    id: 'goal-steps',
    subject: 'Goals',
    name: 'Goal steps',
    description: 'Break one goal into small steps with dates, a reward and who can help.',
    size: 'portrait',
    build: () => ({
      background: paper(5),
      elements: [
        title(60, 50, 640, 'Small steps'),
        art(724, 40, 120, 'arrow', 'rose', -10),
        write(60, 186, 780, 110, 'The goal', 'butter', false),
        table(60, 316, 780, 520, 'Steps', 'mint', ['Step', 'By when', 'Done'], blank(8)),
        write(60, 856, 380, 140, 'My reward', 'rose', false),
        write(460, 856, 380, 140, 'Who can help', 'sky', false),
        write(60, 1016, 780, 134, 'Notes', 'lilac'),
      ],
    }),
  },
];
