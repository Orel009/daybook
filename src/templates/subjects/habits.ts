import { art, blank, list, monthName, paper, shortDays, SOFT, sub, table, tape, title, track, weekStart, write, type BuiltInTemplate } from '../kit';

// Habits: ready-made pages.

export const habitsTemplates: BuiltInTemplate[] = [
  {
    id: 'habits',
    subject: 'Habits',
    name: 'Habit dashboard',
    description: 'Up to three of your trackers side by side on one page.',
    size: 'landscape',
    build: (ctx) => ({
      elements: [
        title(50, 30, 700, 'My habits'),
        tape(900, 66, 240, 'rose', 'hearts', 3),
        ...(ctx.trackerIds.length
          ? ctx.trackerIds.slice(0, 3).map((id, i) => track(50 + i * 375, 160, 350, id))
          : [title(50, 220, 900, 'Add a tracker first, then use the Tracker tool in Edit to place it here.', { font: 'clean', size: 34, color: SOFT })]),
      ],
    }),
  },
  {
    id: 'habit-week',
    subject: 'Habits',
    name: 'Weekly habit grid',
    description: 'Write your habits down the side and mark each day across the week.',
    size: 'landscape',
    build: (ctx) => ({
      background: paper(5),
      elements: [
        title(50, 30, 700, 'Habits this week'),
        sub(54, 132, 600, `Week of ${weekStart(ctx)}`),
        tape(930, 64, 220, 'mint', 'checker', 4),
        table(50, 190, 1100, 540, '', 'mint', ['Habit', ...shortDays(ctx)], blank(7)),
        write(50, 746, 1100, 104, 'Notes', 'butter', false),
      ],
    }),
  },
  {
    id: 'habit-month',
    subject: 'Habits',
    name: 'Habit month grid',
    description: 'Name up to six habits, then mark each one on every day of the month.',
    size: 'landscape',
    build: (ctx) => {
      const days = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => String(from + i));
      const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
      return {
        background: paper(1),
        elements: [
          title(50, 26, 700, `${monthName(ctx.today)} habits`),
          tape(930, 56, 220, 'lilac', 'stitch', 3),
          table(50, 150, 340, 700, 'My habits', 'butter', ['Habit'], letters),
          table(410, 150, 740, 340, 'Days 1 to 15', 'mint', days(1, 15), letters),
          table(410, 510, 740, 340, 'Days 16 to 31', 'sky', days(16, 31), letters),
        ],
      };
    },
  },
  {
    id: 'habit-garden',
    subject: 'Habits',
    name: 'Habit garden',
    description: 'Two of your trackers as growing plants: keep the streak going and watch them bloom.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(5, 'plain'),
      elements: [
        title(60, 50, 700, 'Habit garden'),
        art(730, 40, 110, 'tulip', 'rose', 6),
        ...(ctx.trackerIds.length
          ? [
              ...ctx.trackerIds.slice(0, 2).map((id, i) => track(60 + i * 400, 196, 380, id, { look: 'garden' })),
              write(60, 790, 780, 360, 'How my garden is growing', 'mint'),
            ]
          : [title(60, 240, 780, 'Add a tracker first, then use the Tracker tool in Edit to place it here.', { font: 'clean', size: 34, color: SOFT })]),
      ],
    }),
  },
  {
    id: 'daily-habits',
    subject: 'Habits',
    name: 'Daily habits checklist',
    description: 'Morning, daytime and evening habits, a week of ticks and a reward for a full week.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(0),
      elements: [
        title(60, 50, 640, 'Daily habits'),
        art(730, 44, 110, 'sun', 'butter'),
        list(60, 200, 250, 'Morning', 'butter', 3),
        list(325, 200, 250, 'Daytime', 'mint', 3),
        list(590, 200, 250, 'Evening', 'lilac', 3),
        table(60, 490, 780, 500, 'This week', 'mint', ['Habit', ...shortDays(ctx)], blank(8)),
        write(60, 1010, 780, 140, 'Reward for a full week', 'rose', false),
      ],
    }),
  },
];
