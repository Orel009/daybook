import { art, blank, card, challenge, label, list, numbered, paper, rating, shortDays, sub, table, themed, tiles, title, weekStart, write, type BuiltInTemplate } from '../kit';

// Study: planning the week, the timetable, exams, notes and revision.

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
    description: 'The main idea in the middle and eight branches around it to fill in.',
    size: 'landscape',
    build: () => ({
      background: paper(8),
      elements: [
        title(50, 24, 380, 'Mind map', { size: 66 }),
        card(430, 350, 340, 190, 0, { title: 'Main idea', shadow: true }),
        write(450, 130, 300, 190, 'Branch', 'butter', false),
        write(450, 570, 300, 190, 'Branch', 'mint', false),
        ...[160, 390, 620].flatMap((y, i) => [
          write(60, y, 340, 200, 'Branch', ['rose', 'peach', 'lilac'][i], false),
          write(800, y, 340, 200, 'Branch', ['sky', 'sage', 'coral'][i], false),
        ]),
        art(1070, 20, 90, 'sparkle', 'butter'),
      ],
    }),
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
