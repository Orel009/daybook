import type { PageElement } from '../../domain/pages';
import { art, blank, challenge, label, line, list, numbered, paper, rating, shape, shortDays, sub, table, themed, tiles, title, weekStart, write, type BuiltInTemplate } from '../kit';

// Study: planning the week, the timetable, exams, notes and revision.

/**
 * A mind map: lines from the edge of the shape in the middle to each branch.
 * The middle is an oval `rx` by `ry` around (cx, cy). Each branch is a place
 * to write, and the line ends at the middle of the side `at` names. The lines
 * come first, so they lie behind the shape and the branches.
 */
interface Branch {
  x: number;
  y: number;
  w: number;
  h: number;
  at: 'left' | 'right' | 'top' | 'bottom';
  ink: string;
  bend: number;
}
const branchLines = (cx: number, cy: number, rx: number, ry: number, branches: Branch[]): PageElement[] =>
  branches.map((b) => {
    const gap = 6; // the line stops just short of the branch
    const tx = b.at === 'left' ? b.x - gap : b.at === 'right' ? b.x + b.w + gap : b.x + b.w / 2;
    const ty = b.at === 'top' ? b.y - gap : b.at === 'bottom' ? b.y + b.h + gap : b.y + b.h / 2;
    // where the way to the branch crosses the edge of the oval
    const k = 1 / Math.hypot((tx - cx) / rx, (ty - cy) / ry);
    return line(cx + (tx - cx) * k, cy + (ty - cy) * k, tx, ty, { bend: b.bend, color: b.ink, weight: 5 });
  });

export const studyTemplates: BuiltInTemplate[] = [
  {
    id: 'study-week',
    subject: 'Study',
    name: 'Weekly study planner',
    description: 'Morning, afternoon and evening for each day, with goals, things to revise and deadlines.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(7, 'grid'),
      elements: [
        title(60, 50, 640, 'Study planner'),
        art(740, 40, 100, 'pencil', 'butter', 8),
        sub(60, 146, 600, `Week of ${weekStart(ctx)}`),
        table(60, 200, 780, 420, 'This week', 'sky', shortDays(ctx), ['Morning', 'Afternoon', 'Evening']),
        list(60, 650, 380, 'Goals for the week', 'mint', 4),
        write(460, 650, 380, 266, 'To revise', 'butter'),
        table(60, 950, 780, 200, 'Deadlines', 'rose', ['What', 'Subject', 'Due'], blank(3)),
      ],
    }),
  },
  {
    id: 'study-timetable',
    subject: 'Study',
    name: 'Class timetable',
    description: 'Monday to Friday across, eight periods down. Write the subject and the room in each.',
    size: 'landscape',
    build: () => ({
      background: paper(0),
      elements: [
        title(50, 30, 700, 'Class timetable'),
        art(1060, 24, 100, 'bookstack', 'rose', 6),
        table(50, 150, 1100, 640, '', 'lilac', ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], numbered(8)),
        themed(50, 812, 420, 'bookspines', -1),
      ],
    }),
  },
  {
    id: 'study-exams',
    subject: 'Study',
    name: 'Assignments and exams',
    description: 'What is due and when, with a two-week countdown to cross off a day at a time.',
    size: 'portrait',
    build: () => ({
      background: paper(3),
      elements: [
        title(60, 50, 780, 'Assignments and exams', { size: 58 }),
        table(60, 170, 780, 460, 'To hand in and to sit', 'coral', ['What', 'Subject', 'Due', 'Done'], blank(8)),
        tiles(60, 660, 780, 300, 'Days to go: cross one off each day', 'butter', 7, ['14', '13', '12', '11', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1'], { count: true }),
        write(60, 990, 780, 160, 'The big one is on', 'rose', false),
      ],
    }),
  },
  {
    id: 'study-cornell',
    subject: 'Study',
    name: 'Cornell notes',
    description: 'Cues on the left, notes on the right, a summary underneath: the classic way to take notes.',
    size: 'portrait',
    build: () => ({
      background: paper(1, 'plain'),
      elements: [
        title(60, 50, 560, 'Cornell notes', { size: 66 }),
        art(740, 40, 100, 'bulb', 'butter', -6),
        write(60, 160, 780, 90, 'Topic and date', 'sky', false),
        write(60, 270, 240, 640, 'Cues', 'butter'),
        write(320, 270, 520, 640, 'Notes', 'mint'),
        write(60, 930, 780, 220, 'Summary', 'rose'),
      ],
    }),
  },
  {
    id: 'study-mind-map',
    subject: 'Study',
    name: 'Mind map',
    description: 'The main idea in a circle in the middle, joined by curved lines to six branches with lines to write on.',
    size: 'landscape',
    build: () => {
      // three branches down each side of the circle
      const rows = [146, 389, 632];
      const looks: [string, string][] = [['rose', '#B03A6B'], ['butter', '#B8601C'], ['mint', '#2F7A4D'], ['sky', '#2F5FB0'], ['lilac', '#6B45B0'], ['coral', '#B5383F']];
      const branches: (Branch & { color: string })[] = rows.flatMap((y, i) => [
        { x: 40, y, w: 290, h: 192, at: 'right' as const, color: looks[i][0], ink: looks[i][1], bend: [0.14, 0.05, -0.14][i] },
        { x: 870, y, w: 290, h: 192, at: 'left' as const, color: looks[i + 3][0], ink: looks[i + 3][1], bend: [-0.14, -0.05, 0.14][i] },
      ]);
      return {
        background: paper(8),
        elements: [
          ...branchLines(600, 485, 130, 130, branches),
          shape(470, 355, 260, 260, 'circle', '#B8601C', { fill: true, weight: 5 }),
          title(490, 458, 220, 'Main idea', { size: 42, align: 'center' }),
          ...branches.map((b) => write(b.x, b.y, b.w, b.h, 'Branch', b.color)),
          title(350, 28, 500, 'Mind map', { size: 66, align: 'center' }),
          art(1070, 20, 90, 'sparkle', 'butter'),
          art(40, 24, 90, 'bulb', 'butter', -8),
        ],
      };
    },
  },
  {
    id: 'study-mind-map-dump',
    subject: 'Study',
    name: 'Brain dump mind map',
    description: 'Everything on your mind in a cloud in the middle, with eight small branches around it to empty your head into.',
    size: 'landscape',
    build: () => {
      const inks = ['#B03A6B', '#B8601C', '#2F7A4D', '#1E7A78', '#2F5FB0', '#6B45B0', '#B5383F', '#6F6180'];
      const rows = [160, 397, 634];
      const spots: Omit<Branch, 'ink'>[] = [
        ...rows.map((y, i) => ({ x: 40, y, w: 240, h: 136, at: 'right' as const, bend: [0.12, 0.05, -0.12][i] })),
        { x: 480, y: 140, w: 240, h: 136, at: 'bottom' as const, bend: 0.08 },
        ...rows.map((y, i) => ({ x: 920, y, w: 240, h: 136, at: 'left' as const, bend: [-0.12, -0.05, 0.12][i] })),
        { x: 480, y: 654, w: 240, h: 136, at: 'top' as const, bend: 0.08 },
      ];
      const branches: Branch[] = spots.map((s, i) => ({ ...s, ink: inks[i] }));
      return {
        background: paper(3),
        elements: [
          ...branchLines(600, 465, 138, 88, branches),
          shape(440, 360, 320, 210, 'cloud', '#2F5FB0', { fill: true, weight: 5 }),
          title(460, 443, 280, 'On my mind', { size: 36, align: 'center' }),
          ...branches.map((b) => write(b.x, b.y, b.w, b.h, '', 'butter')),
          title(40, 36, 420, 'Brain dump', { size: 62 }),
          art(1060, 30, 96, 'bulb', 'butter', 8),
        ],
      };
    },
  },
  {
    id: 'study-revision',
    subject: 'Study',
    name: 'Revision checklist',
    description: 'Every topic with a box for read, notes, practised and confident.',
    size: 'portrait',
    build: () => ({
      background: paper(5),
      elements: [
        title(60, 50, 640, 'Revision checklist', { size: 62 }),
        art(740, 40, 100, 'bulb', 'butter'),
        table(60, 180, 780, 640, 'Topics', 'mint', ['Topic', 'Read', 'Notes', 'Practised', 'Confident'], blank(10)),
        list(60, 850, 380, 'Before the exam', 'butter', ['Sleep well', 'Pack my bag', 'Eat breakfast']),
        write(460, 850, 380, 260, 'Still tricky', 'rose'),
      ],
    }),
  },
  {
    id: 'study-grades',
    subject: 'Study',
    name: 'Grade tracker',
    description: 'A table of subjects and tests for the term, what you are aiming for and what you are proud of.',
    size: 'portrait',
    build: () => ({
      background: paper(9, 'grid'),
      elements: [
        title(60, 50, 560, 'Grade tracker', { size: 70 }),
        art(720, 36, 120, 'medal', 'butter', 6),
        table(60, 190, 780, 560, 'This term', 'blue', ['Subject', 'Test 1', 'Test 2', 'Test 3', 'Final'], blank(8)),
        write(60, 780, 380, 240, 'Aiming for', 'mint'),
        write(460, 780, 380, 240, 'Proud of', 'butter'),
        label(60, 1056, 300, 'How the term went'),
        rating(60, 1096, 300),
      ],
    }),
  },
  {
    id: 'study-pomodoro',
    subject: 'Study',
    name: 'Pomodoro tiles',
    description: 'Colour a tomato for every 25 minutes of focus, next to the tasks you are working through.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(2),
      elements: [
        title(60, 50, 560, 'Pomodoro'),
        art(740, 36, 100, 'apple', 'red', 8),
        sub(60, 146, 760, 'Focus for 25 minutes, then colour a tomato.'),
        challenge(60, 210, 440, 470, 'Today', 'red', 4, 16, { shape: 'circle' }),
        list(530, 210, 310, 'Tasks', 'coral', 6),
        write(60, 710, 380, 200, 'Break ideas', 'mint'),
        write(460, 710, 380, 200, 'Distractions to park', 'butter'),
        table(60, 940, 780, 210, 'This week', 'rose', shortDays(ctx), ['Tomatoes']),
      ],
    }),
  },
];
