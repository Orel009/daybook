import { art, blank, list, longDate, month, monthName, paper, shortDays, sub, table, tape, themed, title, weekDays, weekStart, write, type BuiltInTemplate } from '../kit';

// Planning: ready-made pages.

export const planningTemplates: BuiltInTemplate[] = [
  {
    id: 'daily',
    subject: 'Planning',
    name: 'Daily planner',
    description: 'Top three, a to-do list, an hour-by-hour schedule and notes.',
    size: 'portrait',
    build: (ctx) => ({
      elements: [
        themed(56, 44, 250, 'calendars'),
        title(60, 62, 600, 'Today'),
        sub(62, 168, 600, longDate(ctx.today)),
        art(716, 52, 132, 'sun'),
        list(60, 250, 390, 'Top three', 'rose', 3),
        list(60, 544, 390, 'To do', 'sky', 5),
        table(480, 250, 360, 652, 'Schedule', 'butter', ['Plan'], ['8 am', '9', '10', '11', '12 pm', '1', '2', '3', '4', '5', '6', '7']),
        write(60, 934, 780, 216, 'Notes', 'mint'),
      ],
    }),
  },
  {
    id: 'weekly',
    subject: 'Planning',
    name: 'Weekly planner',
    description: 'A box for each day of the week, plus one for notes.',
    size: 'landscape',
    build: (ctx) => {
      const colors = ['rose', 'peach', 'butter', 'mint', 'sky', 'lilac', 'berry', 'sage'];
      const names = [...weekDays(ctx), 'Notes'];
      return {
        elements: [
          title(50, 30, 700, 'This week'),
          sub(54, 132, 600, `Week of ${weekStart(ctx)}`),
          themed(930, 64, 220, 'checkmarks', 4),
          ...names.map((n, i) => write(50 + (i % 4) * 279, 196 + Math.floor(i / 4) * 342, 262, 326, n, colors[i])),
        ],
      };
    },
  },
  {
    id: 'monthly',
    subject: 'Planning',
    name: 'Monthly planner',
    description: 'The whole month with room in every day, goals and notes.',
    size: 'landscape',
    build: (ctx) => ({
      elements: [
        title(50, 30, 760, 'Monthly plan'),
        tape(900, 66, 240, 'lilac', 'dots', 3),
        month(50, 150, 800, 700, 'mint', ctx.today),
        list(880, 150, 270, 'Goals', 'rose', 4),
        write(880, 500, 270, 350, 'Notes', 'butter'),
      ],
    }),
  },
  {
    id: 'todo',
    subject: 'Planning',
    name: 'To-do list',
    description: 'Sorted into must, should and could, with space for notes.',
    size: 'portrait',
    build: () => ({
      elements: [
        title(60, 56, 620, 'To-do list'),
        art(720, 50, 126, 'star', 'butter', 8),
        list(60, 210, 780, 'Must do', 'rose', 4),
        list(60, 556, 380, 'Should do', 'butter', 4),
        list(460, 556, 380, 'Could do', 'mint', 4),
        write(60, 904, 780, 246, 'Notes', 'sky'),
      ],
    }),
  },
  {
    id: 'daily-parts',
    subject: 'Planning',
    name: 'Daily planner, three parts',
    description: 'Morning, afternoon and evening, with your top three beside them.',
    size: 'landscape',
    build: (ctx) => ({
      background: paper(7),
      elements: [
        title(50, 30, 700, 'Today'),
        sub(54, 132, 600, longDate(ctx.today)),
        tape(930, 64, 220, 'butter', 'candy', 4),
        write(50, 190, 270, 660, 'Morning', 'butter'),
        write(336, 190, 270, 660, 'Afternoon', 'peach'),
        write(622, 190, 270, 660, 'Evening', 'lilac'),
        list(908, 190, 242, 'Top three', 'rose', 3),
        write(908, 480, 242, 178, 'Grateful for', 'mint'),
        write(908, 674, 242, 176, 'Tomorrow', 'sky'),
      ],
    }),
  },
  {
    id: 'weekly-lists',
    subject: 'Planning',
    name: 'Weekly planner, checklists',
    description: 'A short checklist for each day and one for the weekend jobs.',
    size: 'portrait',
    build: (ctx) => {
      const colors = ['rose', 'peach', 'butter', 'mint', 'sky', 'lilac', 'berry', 'sage'];
      return {
        elements: [
          title(60, 50, 700, 'This week'),
          sub(62, 150, 600, `Week of ${weekStart(ctx)}`),
          ...[...weekDays(ctx), 'Sometime this week'].map((n, i) => list(60 + (i % 2) * 400, 206 + Math.floor(i / 2) * 238, 380, n, colors[i], 2)),
        ],
      };
    },
  },
  {
    id: 'month-glance',
    subject: 'Planning',
    name: 'Month at a glance',
    description: 'The month on top, with focus, birthdays and reminders below.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(6),
      elements: [
        title(60, 50, 760, monthName(ctx.today)),
        art(728, 46, 120, 'banner', 'rose', -6),
        month(60, 196, 780, 570, 'sky', ctx.today),
        list(60, 790, 250, 'Focus', 'rose', 3),
        list(325, 790, 250, 'Birthdays', 'butter', 3),
        list(590, 790, 250, 'Don’t forget', 'mint', 3),
      ],
    }),
  },
  {
    id: 'project',
    subject: 'Planning',
    name: 'Project plan',
    description: 'The goal, the steps with dates, and what to do next.',
    size: 'portrait',
    build: () => ({
      background: paper(1, 'grid'),
      elements: [
        title(60, 50, 760, 'Project plan'),
        write(60, 196, 780, 150, 'The goal', 'butter'),
        table(60, 366, 780, 430, 'Steps', 'sky', ['Task', 'By when', 'Done'], blank(7)),
        list(60, 816, 380, 'Next actions', 'rose', 4),
        write(460, 816, 380, 334, 'Notes', 'mint'),
      ],
    }),
  },
  {
    id: 'week-glance',
    subject: 'Planning',
    name: 'Week at a glance',
    description: 'Morning, afternoon and evening for every day, with priorities and notes underneath.',
    size: 'landscape',
    build: (ctx) => ({
      background: paper(1, 'grid'),
      elements: [
        title(50, 30, 700, 'Week at a glance'),
        sub(54, 132, 600, `Week of ${weekStart(ctx)}`),
        tape(930, 60, 220, 'sky', 'checker', 3),
        table(50, 190, 1100, 450, '', 'sky', shortDays(ctx), ['Morning', 'Afternoon', 'Evening']),
        list(50, 664, 540, 'Top priorities', 'rose', 2),
        write(610, 664, 540, 206, 'Notes', 'butter'),
      ],
    }),
  },
  {
    id: 'time-blocks',
    subject: 'Planning',
    name: 'Time-blocked day',
    description: 'Every hour from 6 am to 9 pm, with must-dos, notes and tomorrow.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(0),
      elements: [
        title(60, 50, 620, 'Today'),
        sub(62, 150, 600, longDate(ctx.today)),
        art(724, 44, 120, 'bulb', 'butter', 6),
        table(60, 214, 440, 936, 'Hour by hour', 'mint', ['Plan', 'Done'], ['6 am', '7', '8', '9', '10', '11', '12 pm', '1', '2', '3', '4', '5', '6', '7', '8', '9']),
        list(530, 214, 310, 'Must do', 'rose', 3),
        write(530, 500, 310, 330, 'Notes', 'butter'),
        write(530, 850, 310, 300, 'Tomorrow', 'lilac'),
      ],
    }),
  },
  {
    id: 'brain-dump',
    subject: 'Planning',
    name: 'Brain dump',
    description: 'Empty your head onto the page, then sort it into today, this week and someday.',
    size: 'portrait',
    build: () => ({
      background: paper(7, 'plain'),
      elements: [
        title(60, 50, 620, 'Brain dump'),
        art(712, 34, 136, 'cloud', 'sky', -6),
        art(658, 104, 56, 'sparkle', 'butter'),
        write(60, 196, 780, 560, 'Everything on my mind', 'sky'),
        list(60, 786, 250, 'Today', 'rose', 3),
        list(325, 786, 250, 'This week', 'butter', 3),
        list(590, 786, 250, 'Someday', 'mint', 3),
      ],
    }),
  },
];
