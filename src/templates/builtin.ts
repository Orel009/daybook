import { LOCALE } from '../domain/dates';
import {
  BG_COLORS,
  newItem,
  newBook,
  type BookshelfElement,
  type BoxElement,
  type ChecklistElement,
  type FrameElement,
  type GridElement,
  type MonthElement,
  type Page,
  type PageBackground,
  type PageElement,
  type PageSize,
  type StickerElement,
  type TableElement,
  type TapeElement,
  type TapePattern,
  type TextElement,
  type TrackerElement,
  type WritingElement,
} from '../domain/pages';
import { newId } from '../domain/types';
import { moreTemplates } from './more';

// Ready-made pages. A template is a function that lays out ordinary page
// elements, so everything it makes can be moved, restyled or removed in the
// editor afterwards. Templates are built at the moment they are used, which is
// how they pick up today's date, the current month and the user's trackers.
//
// To add a template: write a build function with the helpers below and append
// it to BUILT_IN_TEMPLATES.

export interface TemplateContext {
  today: Date;
  weekStartsOn: number;
  /** Id of the tracker with this name, or '' when it doesn't exist yet (previews). */
  tracker: (name: string) => string;
  /** Ids of the user's active trackers, in their own order. */
  trackerIds: string[];
}

export const TEMPLATE_SUBJECTS = [
  'Planning', 'Food', 'Mood', 'Sleep', 'Sports and fitness', 'Water', 'Books', 'Goals', 'Gratitude', 'Memories', 'Money', 'Habits',
  'Bucket lists', 'Yearly bingo', 'Birthdays', 'Alphabet challenge', 'Book bingo', 'Movie challenge', 'Series', 'Dreams',
  'Weather', 'Temperature', 'Self-care', 'Travel', 'Home', 'Family', 'Holidays',
] as const;
export type TemplateSubject = (typeof TEMPLATE_SUBJECTS)[number];

/** Subjects in a few groups, so the subject chips stay short. */
export const TEMPLATE_GROUPS: { name: string; subjects: TemplateSubject[] }[] = [
  { name: 'Plan', subjects: ['Planning', 'Goals', 'Money', 'Travel', 'Home', 'Family', 'Holidays'] },
  { name: 'Track', subjects: ['Habits', 'Mood', 'Sleep', 'Dreams', 'Water', 'Food', 'Sports and fitness', 'Self-care', 'Weather', 'Temperature', 'Series'] },
  { name: 'Journal', subjects: ['Gratitude', 'Memories', 'Birthdays', 'Books'] },
  { name: 'Challenges', subjects: ['Yearly bingo', 'Book bingo', 'Alphabet challenge', 'Movie challenge'] },
  { name: 'Lists', subjects: ['Bucket lists'] },
];

export interface BuiltInTemplate {
  id: string;
  subject: TemplateSubject;
  name: string;
  description: string;
  size: PageSize;
  /** Tracker presets (by name) this page shows. Missing ones are created on use. */
  needs?: string[];
  build: (ctx: TemplateContext) => { background?: PageBackground; elements: PageElement[] };
}

const INK = '#3A2B47';
const SOFT = '#6F6180';
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const weekDays = (ctx: TemplateContext) => Array.from({ length: 7 }, (_, i) => DAYS[(ctx.weekStartsOn + i) % 7]);
const longDate = (d: Date) => d.toLocaleDateString(LOCALE, { weekday: 'long', month: 'long', day: 'numeric' });
const monthName = (d: Date) => d.toLocaleDateString(LOCALE, { month: 'long' });
const weekStart = (ctx: TemplateContext) => {
  const d = new Date(ctx.today);
  d.setDate(d.getDate() - ((d.getDay() - ctx.weekStartsOn + 7) % 7));
  return d.toLocaleDateString(LOCALE, { month: 'long', day: 'numeric' });
};

// ----- layout helpers (all sizes in page units: 900×1200 tall, 1200×900 wide)

const title = (x: number, y: number, w: number, text: string, o: Partial<TextElement> = {}): TextElement => ({
  id: newId(), type: 'text', x, y, w, h: 80, rotation: 0, text, font: 'hand', size: 76, color: INK, align: 'left', ...o,
});
const sub = (x: number, y: number, w: number, text: string): TextElement => title(x, y, w, text, { font: 'clean', size: 30, color: SOFT });
const list = (x: number, y: number, w: number, heading: string, color: string, items: number | string[]): ChecklistElement => ({
  id: newId(), type: 'checklist', x, y, w, h: 200, rotation: 0, title: heading, color,
  items: typeof items === 'number' ? Array.from({ length: items }, () => newItem()) : items.map((t) => newItem(t)),
});
const table = (x: number, y: number, w: number, h: number, heading: string, color: string, cols: string[], rows: string[]): TableElement => ({
  id: newId(), type: 'table', x, y, w, h, rotation: 0, title: heading, color, cols, rows, cells: {},
});
const write = (x: number, y: number, w: number, h: number, heading: string, color: string, lined = true): WritingElement => ({
  id: newId(), type: 'writing', x, y, w, h, rotation: 0, title: heading, color, text: '', lined,
});
const box = (x: number, y: number, w: number, h: number, heading: string, rotation = 0): BoxElement => ({
  id: newId(), type: 'box', x, y, w, h, rotation, fill: 'white', border: 'dashed', title: heading,
});
/** A photo slot: tap it to add a photo. */
const frame = (x: number, y: number, w: number, h: number, rotation = 0, o: Partial<FrameElement> = {}): FrameElement => ({
  id: newId(), type: 'frame', x, y, w, h, rotation, style: 'plain', ...o,
});
const month = (x: number, y: number, w: number, h: number, color: string, d: Date): MonthElement => ({
  id: newId(), type: 'month', x, y, w, h, rotation: 0, color, year: d.getFullYear(), month: d.getMonth(), notes: {},
});
const tape = (x: number, y: number, w: number, color: string, pattern: TapePattern, rotation = -3): TapeElement => ({
  id: newId(), type: 'tape', x, y, w, h: 46, rotation, color, pattern, edge: 'torn',
});
const art = (x: number, y: number, size: number, id: string, color?: string, rotation = 0): StickerElement => ({
  id: newId(), type: 'sticker', x, y, w: size, h: size, rotation, emoji: '', art: id, color,
});
const track = (x: number, y: number, w: number, trackerId: string, o: Partial<TrackerElement> = {}): TrackerElement => ({
  id: newId(), type: 'tracker', x, y, w, h: 400, rotation: 0, trackerId, ...o,
});
const shelf = (x: number, y: number, w: number, h: number, books: number, perShelf: number, heading = ''): BookshelfElement => ({
  id: newId(), type: 'bookshelf', x, y, w, h, rotation: 0, title: heading, color: 'tan', perShelf, books: Array.from({ length: books }, (_, i) => newBook(i)),
});
const blank = (n: number) => Array.from({ length: n }, () => '');
const shortDays = (ctx: TemplateContext) => weekDays(ctx).map((d) => d.slice(0, 3));

/** One page per sport: its tracker, something to work on, notes and a table of sessions. */
const sportLog = (id: string, name: string, preset: string, sticker: string, color: string, cols: string[], listTitle: string, items: number | string[]): BuiltInTemplate => ({
  id,
  subject: 'Sports and fitness',
  name,
  description: `Your ${preset.toLowerCase()} tracker, ${listTitle.toLowerCase()}, notes and a table of sessions.`,
  size: 'portrait',
  needs: [preset],
  build: (ctx) => ({
    elements: [
      title(60, 56, 620, name),
      art(724, 50, 124, sticker, color, 8),
      track(60, 210, 400, ctx.tracker(preset)),
      list(490, 210, 350, listTitle, color, items),
      write(490, 600, 350, 310, 'Notes', 'butter'),
      table(60, 940, 780, 210, 'Sessions', color, cols, blank(3)),
    ],
  }),
});

const paper = (index: number, pattern: PageBackground['pattern'] = 'dots'): PageBackground => ({ color: BG_COLORS[index], pattern });

/** Tiles for bingo cards and challenges: labels are printed, the rest is written in Edit. */
const tiles = (x: number, y: number, w: number, h: number, heading: string, color: string, cols: number, labels: number | string[], o: Partial<GridElement> = {}): GridElement => ({
  id: newId(), type: 'tiles', x, y, w, h, rotation: 0, title: heading, color, cols, mark: 'cross',
  tiles: typeof labels === 'number' ? Array.from({ length: labels }, () => ({})) : labels.map((label) => (label ? { label } : {})),
  ...o,
});
/** A photo slot held by a strip of tape. */
const photoSpot = (x: number, y: number, w: number, h: number, rotation: number, color: string, pattern: TapePattern, o: Partial<FrameElement> = {}): PageElement[] => [
  frame(x, y, w, h, rotation, o),
  tape(x + w / 2 - 70, y - 18, 140, color, pattern, -rotation),
];

/** The layout helpers, for templates kept in other files (more.ts). */
const kit = { title, sub, list, table, write, box, frame, month, tape, art, track, shelf, tiles, photoSpot, blank, paper, weekDays, shortDays, monthName, longDate, INK, SOFT };
export type TemplateKit = typeof kit;

const CORE_TEMPLATES: BuiltInTemplate[] = [
  {
    id: 'daily',
    subject: 'Planning',
    name: 'Daily planner',
    description: 'Top three, a to-do list, an hour-by-hour schedule and notes.',
    size: 'portrait',
    build: (ctx) => ({
      elements: [
        tape(56, 44, 250, 'rose', 'stripes'),
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
          tape(930, 64, 220, 'mint', 'gingham', 4),
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
    id: 'meals',
    subject: 'Food',
    name: 'Weekly meal planner',
    description: 'Breakfast, lunch and dinner for each day, with a shopping list.',
    size: 'landscape',
    build: (ctx) => ({
      background: paper(3),
      elements: [
        title(50, 30, 700, 'Meal plan'),
        sub(54, 132, 600, `Week of ${weekStart(ctx)}`),
        art(1010, 24, 130, 'watermelon', 'red', 10),
        table(50, 190, 790, 660, '', 'peach', ['Breakfast', 'Lunch', 'Dinner'], weekDays(ctx)),
        list(870, 190, 280, 'To buy', 'mint', 7),
        write(870, 706, 280, 144, 'Prep ahead', 'butter'),
      ],
    }),
  },
  {
    id: 'grocery',
    subject: 'Food',
    name: 'Grocery shopping list',
    description: 'Six sections to tick off as you go around the shop.',
    size: 'portrait',
    build: () => {
      const sections: [string, string][] = [['Fruit and veg', 'green'], ['Dairy and eggs', 'butter'], ['Pantry', 'peach'], ['Meat and fish', 'coral'], ['Frozen', 'sky'], ['Everything else', 'lilac']];
      return {
        background: paper(5, 'grid'),
        elements: [
          tape(60, 46, 230, 'green', 'leaves'),
          title(60, 62, 700, 'Grocery list'),
          ...sections.map(([name, color], i) => list(60 + (i % 2) * 400, 210 + Math.floor(i / 2) * 318, 380, name, color, 3)),
        ],
      };
    },
  },
  {
    id: 'mood',
    subject: 'Mood',
    name: 'Mood journal',
    description: 'Your mood tracker beside space to write about the day.',
    size: 'portrait',
    needs: ['Mood'],
    build: (ctx) => ({
      background: paper(8),
      elements: [
        title(60, 56, 620, 'Mood journal'),
        art(724, 56, 120, 'cloud', 'sky', -6),
        track(60, 210, 470, ctx.tracker('Mood')),
        write(560, 210, 280, 340, 'Today I feel', 'rose'),
        write(560, 570, 280, 340, 'What helped', 'mint'),
        write(560, 930, 280, 220, 'For tomorrow', 'butter'),
      ],
    }),
  },
  {
    id: 'sleep',
    subject: 'Sleep',
    name: 'Sleep journal',
    description: 'Your sleep tracker, a wind-down routine and a place for dreams.',
    size: 'portrait',
    needs: ['Sleep'],
    build: (ctx) => ({
      background: paper(8, 'plain'),
      elements: [
        title(60, 56, 620, 'Sleep journal'),
        art(724, 50, 124, 'sparkle', 'butter'),
        track(60, 210, 430, ctx.tracker('Sleep')),
        list(520, 210, 320, 'Wind-down', 'lilac', ['No screens', 'Warm drink', 'Read a little', 'Lights out']),
        write(520, 560, 320, 330, 'Dreams', 'sky'),
        write(60, 934, 780, 216, 'How I slept this week', 'butter'),
      ],
    }),
  },
  {
    id: 'fitness',
    subject: 'Sports and fitness',
    name: 'Fitness planner',
    description: 'Plan each day’s workout and see your workout tracker alongside.',
    size: 'landscape',
    needs: ['Workout'],
    build: (ctx) => ({
      elements: [
        title(50, 30, 700, 'Fitness plan'),
        sub(54, 132, 600, `Week of ${weekStart(ctx)}`),
        art(560, 30, 120, 'dumbbell', 'sky', -10),
        table(50, 190, 620, 660, '', 'coral', ['Workout', 'Time', 'How it felt'], weekDays(ctx)),
        track(700, 150, 450, ctx.tracker('Workout')),
      ],
    }),
  },
  {
    id: 'water',
    subject: 'Water',
    name: 'Water intake tracker',
    description: 'Your water tracker with reminders for when to drink.',
    size: 'portrait',
    needs: ['Water'],
    build: (ctx) => ({
      background: paper(7),
      elements: [
        title(60, 56, 620, 'Water'),
        tape(600, 84, 240, 'sky', 'waves', 4),
        track(60, 210, 480, ctx.tracker('Water')),
        list(570, 210, 270, 'Reminders', 'sky', ['Wake up', 'Mid-morning', 'Lunch', 'Afternoon', 'Dinner']),
        write(570, 620, 270, 330, 'Notes', 'mint'),
      ],
    }),
  },
  {
    id: 'reading',
    subject: 'Books',
    name: 'Reading tracker',
    description: 'Your reading tracker, what you’re reading now and what’s next.',
    size: 'portrait',
    needs: ['Reading'],
    build: (ctx) => ({
      background: paper(9),
      elements: [
        title(60, 56, 620, 'Reading log'),
        track(60, 210, 410, ctx.tracker('Reading')),
        write(500, 210, 340, 250, 'Reading now', 'sage'),
        list(500, 480, 340, 'Want to read', 'lilac', 5),
        table(60, 940, 780, 210, 'Finished', 'butter', ['Title', 'Author', 'Stars'], ['', '', '']),
      ],
    }),
  },
  {
    id: 'goals',
    subject: 'Goals',
    name: 'Monthly goals',
    description: 'Goals in four areas of life, why they matter, and a review.',
    size: 'portrait',
    build: (ctx) => ({
      elements: [
        tape(60, 46, 260, 'butter', 'stars'),
        title(60, 62, 760, `${monthName(ctx.today)} goals`),
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
    id: 'gratitude',
    subject: 'Gratitude',
    name: 'Gratitude journal',
    description: 'Four gentle prompts for the end of the day.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(2),
      elements: [
        title(60, 56, 620, 'Gratitude'),
        sub(62, 160, 600, longDate(ctx.today)),
        art(724, 50, 124, 'heart', 'rose', 8),
        write(60, 230, 780, 250, 'Three good things today', 'rose'),
        write(60, 500, 380, 300, 'Someone I appreciate', 'butter'),
        write(460, 500, 380, 300, 'A small win', 'mint'),
        write(60, 820, 780, 330, 'Something to look forward to', 'lilac'),
      ],
    }),
  },
  {
    id: 'memory',
    subject: 'Memories',
    name: 'Memory journal',
    description: 'Space for two photos and the story of the day.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(4, 'plain'),
      elements: [
        title(60, 56, 760, 'A day to remember'),
        sub(62, 160, 600, longDate(ctx.today)),
        frame(64, 236, 430, 330, -2),
        frame(520, 290, 320, 270, 3),
        tape(190, 214, 170, 'rose', 'dots', -4),
        tape(610, 268, 150, 'mint', 'stripes', 5),
        art(760, 180, 90, 'sparkle', 'butter'),
        write(60, 610, 780, 290, 'What happened', 'butter'),
        write(60, 920, 380, 230, 'Who was there', 'rose'),
        write(460, 920, 380, 230, 'Favourite moment', 'sky'),
      ],
    }),
  },
  {
    id: 'budget',
    subject: 'Money',
    name: 'Budget planner',
    description: 'Planned, spent and left for each category, with bills to pay.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(6, 'grid'),
      elements: [
        title(60, 56, 620, 'Budget'),
        sub(62, 160, 600, ctx.today.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' })),
        table(60, 230, 780, 500, '', 'mint', ['Planned', 'Spent', 'Left'], ['Home', 'Food', 'Transport', 'Bills', 'Fun', 'Savings', 'Other', 'Total']),
        list(60, 760, 380, 'Bills to pay', 'rose', 4),
        write(460, 760, 380, 390, 'Notes', 'butter'),
      ],
    }),
  },
  // ----- planning, more ways
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

  // ----- food
  {
    id: 'dinners',
    subject: 'Food',
    name: 'Dinner plan',
    description: 'Just dinners for the week, with favourites and a shopping list.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(4),
      elements: [
        title(60, 50, 760, 'Dinners this week'),
        table(60, 200, 780, 530, '', 'coral', ['Dinner', 'Notes'], weekDays(ctx)),
        list(60, 756, 380, 'Family favourites', 'butter', 5),
        list(460, 756, 380, 'To buy', 'mint', 5),
      ],
    }),
  },
  {
    id: 'recipe',
    subject: 'Food',
    name: 'Recipe card',
    description: 'A photo, the ingredients to tick off and the method.',
    size: 'portrait',
    build: () => ({
      background: paper(3, 'plain'),
      elements: [
        title(60, 50, 760, 'Recipe'),
        tape(620, 76, 220, 'peach', 'gingham', 4),
        write(60, 190, 780, 104, 'Name', 'peach', false),
        frame(60, 316, 380, 300, -2),
        write(60, 640, 380, 140, 'Serves and time', 'butter', false),
        list(460, 316, 380, 'Ingredients', 'mint', 6),
        write(60, 800, 780, 350, 'Method', 'sky'),
      ],
    }),
  },

  // ----- mood
  {
    id: 'mood-pixels',
    subject: 'Mood',
    name: 'Mood, year in pixels',
    description: 'One square for every day of the year, each mood in its own colour.',
    size: 'portrait',
    needs: ['Mood'],
    build: (ctx) => ({
      background: paper(1),
      elements: [
        title(60, 44, 760, 'Year in pixels'),
        tape(600, 72, 240, 'lilac', 'confetti', 4),
        track(60, 160, 780, ctx.tracker('Mood'), { look: 'pixels', full: true }),
      ],
    }),
  },
  {
    id: 'mood-checkin',
    subject: 'Mood',
    name: 'Mood check-in',
    description: 'Your mood tracker, what affected it, and what you need.',
    size: 'portrait',
    needs: ['Mood'],
    build: (ctx) => ({
      background: paper(2),
      elements: [
        title(60, 56, 620, 'Check-in'),
        art(724, 50, 124, 'heart', 'rose', -8),
        track(60, 210, 420, ctx.tracker('Mood'), { look: 'pixels' }),
        list(510, 210, 330, 'What affected it', 'lilac', ['Sleep', 'Food', 'People', 'Weather', 'Work']),
        write(510, 606, 330, 300, 'What I need', 'rose'),
        write(60, 930, 780, 220, 'One thing I can do', 'butter'),
      ],
    }),
  },

  // ----- sleep
  {
    id: 'sleep-log',
    subject: 'Sleep',
    name: 'Sleep log',
    description: 'Bedtime, wake-up, hours and how rested you felt, day by day.',
    size: 'landscape',
    build: (ctx) => ({
      background: paper(8),
      elements: [
        title(50, 30, 700, 'Sleep log'),
        sub(54, 132, 600, `Week of ${weekStart(ctx)}`),
        table(50, 190, 800, 660, '', 'lilac', ['Bedtime', 'Woke up', 'Hours', 'Rested?'], weekDays(ctx)),
        list(880, 190, 270, 'Helps me sleep', 'sky', 4),
        write(880, 540, 270, 310, 'Notes', 'butter'),
      ],
    }),
  },
  {
    id: 'routines',
    subject: 'Sleep',
    name: 'Evening and morning routine',
    description: 'Two checklists to bookend the day, and what to try next.',
    size: 'portrait',
    build: () => ({
      background: paper(8, 'plain'),
      elements: [
        title(60, 56, 620, 'Routines'),
        art(724, 46, 124, 'starlight', 'butter'),
        list(60, 210, 380, 'Evening', 'lilac', ['Tidy up', 'Tomorrow’s clothes', 'Wash and skincare', 'Read', 'Lights out']),
        list(460, 210, 380, 'Morning', 'butter', ['Water', 'Stretch', 'Breakfast', 'Plan the day', '']),
        write(60, 620, 780, 250, 'What works for me', 'mint'),
        write(60, 890, 780, 260, 'To try', 'sky'),
      ],
    }),
  },

  // ----- sports, one page per sport
  sportLog('running', 'Running log', 'Running', 'medal', 'orange', ['Date', 'Distance', 'Time', 'How it felt'], 'Goals', ['Run 5 km without stopping', 'Three runs a week', '']),
  sportLog('tennis', 'Tennis log', 'Tennis', 'tennis', 'lime', ['Date', 'Played with', 'Score', 'Notes'], 'Working on', ['Serve', 'Backhand', 'Footwork']),
  sportLog('cycling', 'Cycling log', 'Cycling', 'trophy', 'teal', ['Date', 'Route', 'Distance', 'Time'], 'Rides to try', 3),
  sportLog('swimming', 'Swimming log', 'Swimming', 'medal', 'blue', ['Date', 'Laps', 'Stroke', 'Time'], 'Goals', 3),
  sportLog('yoga', 'Yoga log', 'Yoga', 'daisy', 'lilac', ['Date', 'Class or video', 'Minutes', 'How I felt'], 'Poses to practise', 3),
  sportLog('strength', 'Strength log', 'Strength training', 'dumbbell', 'coral', ['Date', 'Exercise', 'Sets and reps', 'Weight'], 'Goals', 3),
  {
    id: 'stretching',
    subject: 'Sports and fitness',
    name: 'Stretching goals',
    description: 'A daily routine to tick off, goals to reach, and a four-week progress check.',
    size: 'portrait',
    needs: ['Stretching'],
    build: (ctx) => ({
      background: paper(6),
      elements: [
        title(60, 56, 700, 'Stretching goals'),
        tape(620, 150, 220, 'mint', 'waves', 4),
        track(60, 210, 400, ctx.tracker('Stretching')),
        list(490, 210, 350, 'Daily routine', 'mint', ['Neck rolls', 'Shoulders', 'Hamstrings', 'Hip opener', 'Child’s pose']),
        list(490, 606, 350, 'Goals', 'rose', ['Touch my toes', 'Deep squat for a minute', '']),
        table(60, 934, 780, 216, 'Progress check', 'sky', ['Week 1', 'Week 2', 'Week 3', 'Week 4'], ['Toe reach', 'Shoulders', 'Hips']),
      ],
    }),
  },

  // ----- water
  {
    id: 'water-week',
    subject: 'Water',
    name: 'Water week',
    description: 'Morning, afternoon and evening for each day, beside your water tracker.',
    size: 'landscape',
    needs: ['Water'],
    build: (ctx) => ({
      background: paper(7),
      elements: [
        title(50, 30, 700, 'Water this week'),
        sub(54, 132, 600, `Week of ${weekStart(ctx)}`),
        table(50, 190, 740, 660, '', 'sky', ['Morning', 'Afternoon', 'Evening', 'Total'], weekDays(ctx)),
        track(820, 150, 330, ctx.tracker('Water'), { look: 'progress' }),
        write(820, 716, 330, 134, 'Notes', 'mint', false),
      ],
    }),
  },

  // ----- books
  {
    id: 'bookshelf',
    subject: 'Books',
    name: 'Bookshelf',
    description: 'Three shelves of blank books. Write a title on each spine and star the ones you’ve read.',
    size: 'portrait',
    build: () => ({
      background: paper(9, 'plain'),
      elements: [
        title(60, 50, 700, 'My bookshelf'),
        art(726, 44, 124, 'bookstack', 'rose', 6),
        title(62, 152, 780, 'Write a title on a spine. Tap the star when you’ve read it.', { font: 'clean', size: 25, color: SOFT }),
        shelf(60, 220, 780, 930, 30, 10),
      ],
    }),
  },
  {
    id: 'bookshelf-wide',
    subject: 'Books',
    name: 'Bookshelf, to read and read',
    description: 'Two shelves side by side: books waiting, and books finished.',
    size: 'landscape',
    build: () => ({
      background: paper(9),
      elements: [
        title(50, 30, 700, 'Books'),
        art(1030, 26, 120, 'openbook', 'sky', 6),
        shelf(50, 160, 540, 690, 16, 8, 'To read'),
        shelf(610, 160, 540, 690, 16, 8, 'Finished'),
      ],
    }),
  },
  {
    id: 'book-review',
    subject: 'Books',
    name: 'Book review',
    description: 'Title, author, dates and stars, with room for a quote and your thoughts.',
    size: 'portrait',
    build: () => ({
      background: paper(4, 'plain'),
      elements: [
        title(60, 50, 700, 'Book review'),
        write(60, 196, 500, 104, 'Title', 'rose', false),
        write(60, 318, 500, 104, 'Author', 'butter', false),
        table(60, 440, 500, 100, '', 'mint', ['Started', 'Finished', 'Stars'], blank(1)),
        frame(590, 196, 250, 344, 2, { hint: 'The cover' }),
        tape(650, 176, 130, 'sky', 'dots', -4),
        write(60, 562, 780, 250, 'What it’s about', 'sky'),
        write(60, 832, 380, 318, 'Favourite quote', 'lilac'),
        write(460, 832, 380, 318, 'What I thought', 'peach'),
      ],
    }),
  },
  {
    id: 'to-read',
    subject: 'Books',
    name: 'Books to read',
    description: 'What’s next, what was recommended, and what’s been borrowed or lent.',
    size: 'portrait',
    build: () => ({
      elements: [
        title(60, 50, 700, 'To read'),
        art(726, 44, 120, 'bookmark', 'mint', 8),
        list(60, 206, 380, 'Up next', 'rose', 5),
        list(460, 206, 380, 'Recommended to me', 'sky', 5),
        table(60, 610, 780, 340, 'Borrowed and lent', 'butter', ['Book', 'Who', 'When'], blank(5)),
        write(60, 970, 780, 180, 'Notes', 'mint'),
      ],
    }),
  },

  // ----- goals
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
    subject: 'Goals',
    name: 'Goals for the year',
    description: 'A checklist for each quarter, a word for the year and a look back.',
    size: 'landscape',
    build: (ctx) => ({
      elements: [
        title(50, 30, 700, `${ctx.today.getFullYear()} goals`),
        tape(930, 64, 220, 'butter', 'stars', 4),
        ...['January to March', 'April to June', 'July to September', 'October to December'].map((q, i) => list(50 + i * 279, 190, 262, q, ['mint', 'butter', 'peach', 'sky'][i], 5)),
        write(50, 590, 548, 260, 'My word for the year', 'rose', false),
        write(614, 590, 536, 260, 'Looking back', 'lilac'),
      ],
    }),
  },

  // ----- gratitude
  {
    id: 'gratitude-week',
    subject: 'Gratitude',
    name: 'A week of gratitude',
    description: 'One good thing for each day, and the best of the week.',
    size: 'landscape',
    build: (ctx) => {
      const colors = ['rose', 'peach', 'butter', 'mint', 'sky', 'lilac', 'berry', 'sage'];
      return {
        background: paper(2),
        elements: [
          title(50, 30, 760, 'Good things'),
          art(1030, 22, 124, 'sparkle', 'butter'),
          sub(54, 132, 600, `Week of ${weekStart(ctx)}`),
          ...[...weekDays(ctx), 'Best of the week'].map((n, i) => write(50 + (i % 4) * 279, 196 + Math.floor(i / 4) * 342, 262, 326, n, colors[i])),
        ],
      };
    },
  },

  // ----- memories
  {
    id: 'collage',
    subject: 'Memories',
    name: 'Photo collage',
    description: 'Four photo spots at playful angles with a caption underneath.',
    size: 'portrait',
    build: () => ({
      background: paper(7, 'plain'),
      elements: [
        title(60, 50, 760, 'Moments'),
        frame(70, 210, 360, 330, -4),
        frame(470, 230, 360, 300, 3),
        frame(90, 580, 340, 320, 2),
        frame(460, 570, 370, 340, -3),
        tape(170, 190, 160, 'rose', 'hearts', -6),
        tape(580, 212, 150, 'butter', 'stripes', 5),
        tape(180, 562, 150, 'mint', 'dots', 4),
        tape(570, 552, 160, 'sky', 'stars', -4),
        write(60, 950, 780, 200, 'The story', 'butter'),
      ],
    }),
  },
  {
    id: 'trip',
    subject: 'Memories',
    name: 'Trip journal',
    description: 'Where, when and with whom, two photos, highlights and the best meal.',
    size: 'portrait',
    build: () => ({
      background: paper(5),
      elements: [
        title(60, 50, 700, 'Trip journal'),
        art(726, 40, 124, 'mountain', 'lilac'),
        table(60, 196, 780, 100, '', 'sky', ['Where', 'When', 'With'], blank(1)),
        frame(64, 322, 380, 300, -2),
        frame(462, 330, 376, 290, 2),
        tape(190, 304, 150, 'peach', 'triangles', -4),
        list(60, 650, 380, 'Highlights', 'rose', 4),
        write(460, 650, 380, 320, 'Best meal', 'butter'),
        write(60, 990, 780, 160, 'Next time', 'mint'),
      ],
    }),
  },

  // ----- money
  {
    id: 'savings',
    subject: 'Money',
    name: 'Savings goal',
    description: 'What you’re saving for, the target, and every deposit along the way.',
    size: 'portrait',
    build: () => ({
      background: paper(6),
      elements: [
        title(60, 50, 700, 'Savings goal'),
        art(726, 44, 120, 'gelt', 'butter', 8),
        write(60, 196, 780, 110, 'Saving for', 'butter', false),
        table(60, 326, 780, 100, '', 'mint', ['Goal amount', 'By when', 'Saved so far'], blank(1)),
        table(60, 446, 780, 440, 'Deposits', 'sky', ['Date', 'Amount', 'Total'], blank(7)),
        write(60, 906, 780, 244, 'Why I want this', 'rose'),
      ],
    }),
  },
  {
    id: 'spending',
    subject: 'Money',
    name: 'Spending log',
    description: 'Every purchase with its amount, and what you noticed at the end.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(1, 'grid'),
      elements: [
        title(60, 50, 700, 'Spending log'),
        sub(62, 150, 600, ctx.today.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' })),
        table(60, 210, 780, 770, '', 'peach', ['Date', 'What', 'Amount', 'Needed?'], blank(14)),
        write(60, 1000, 780, 150, 'What I noticed', 'butter'),
      ],
    }),
  },

  // ----- habits
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
  // ===== More templates: three new ones for every subject =====

  // ----- planning
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

  // ----- food
  {
    id: 'kitchen-stock',
    subject: 'Food',
    name: 'Pantry and fridge',
    description: 'What’s in the fridge, freezer and cupboards, what’s running low, and what to use up first.',
    size: 'portrait',
    build: () => ({
      background: paper(5),
      elements: [
        title(60, 50, 700, 'Kitchen check'),
        art(726, 42, 120, 'mug', 'rose', 6),
        list(60, 196, 380, 'Fridge', 'sky', 4),
        list(460, 196, 380, 'Freezer', 'lilac', 4),
        list(60, 536, 380, 'Cupboards', 'peach', 4),
        list(460, 536, 380, 'Running low', 'coral', 4),
        write(60, 880, 780, 270, 'Use up first', 'butter'),
      ],
    }),
  },
  {
    id: 'meal-prep',
    subject: 'Food',
    name: 'Meal prep',
    description: 'What to cook, chop and portion on prep day, and the boxes for each weekday.',
    size: 'landscape',
    build: () => ({
      background: paper(3, 'grid'),
      elements: [
        title(50, 30, 700, 'Meal prep day'),
        art(1030, 24, 120, 'togo', 'peach', 8),
        list(50, 160, 350, 'Cook', 'coral', 4),
        list(425, 160, 350, 'Chop and wash', 'sage', 4),
        list(800, 160, 350, 'Portion and store', 'sky', 4),
        table(50, 500, 760, 350, 'Boxes for the week', 'peach', ['Lunch', 'Dinner'], ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']),
        write(830, 500, 320, 350, 'To buy', 'mint'),
      ],
    }),
  },
  {
    id: 'recipe-index',
    subject: 'Food',
    name: 'Recipe index',
    description: 'Your favourite recipes and where to find them, plus ones you want to try.',
    size: 'portrait',
    build: () => ({
      background: paper(4, 'lines'),
      elements: [
        tape(60, 44, 240, 'peach', 'gingham', -3),
        title(60, 60, 700, 'Recipe index'),
        art(740, 50, 100, 'icecream', 'rose', 10),
        table(60, 200, 780, 640, 'Our favourites', 'coral', ['Recipe', 'Where it is', 'Stars'], blank(10)),
        list(60, 866, 380, 'Want to try', 'mint', 4),
        write(460, 866, 380, 284, 'Kitchen notes', 'butter'),
      ],
    }),
  },

  // ----- mood
  {
    id: 'mood-week',
    subject: 'Mood',
    name: 'Mood week',
    description: 'Mood, energy and why, day by day, beside your mood tracker.',
    size: 'landscape',
    needs: ['Mood'],
    build: (ctx) => ({
      background: paper(2),
      elements: [
        title(50, 30, 700, 'Mood week'),
        sub(54, 132, 600, `Week of ${weekStart(ctx)}`),
        table(50, 190, 700, 660, '', 'rose', ['Mood', 'Energy 1 to 5', 'Why'], weekDays(ctx)),
        track(780, 150, 370, ctx.tracker('Mood'), { look: 'calendar' }),
      ],
    }),
  },
  {
    id: 'name-the-feeling',
    subject: 'Mood',
    name: 'Name the feeling',
    description: 'Tick the words that fit today, then write about what happened and what you need.',
    size: 'portrait',
    build: () => ({
      background: paper(8),
      elements: [
        title(60, 50, 700, 'Name the feeling'),
        sub(62, 150, 700, 'Tick every word that fits today.'),
        art(744, 46, 100, 'speech', 'lilac', 6),
        list(60, 210, 250, 'Happy', 'butter', ['Excited', 'Proud', 'Grateful']),
        list(325, 210, 250, 'Calm', 'mint', ['Relaxed', 'Content', 'Safe']),
        list(590, 210, 250, 'Sad', 'blue', ['Lonely', 'Let down', 'Tired']),
        list(60, 490, 250, 'Worried', 'lilac', ['Nervous', 'Overwhelmed', 'Unsure']),
        list(325, 490, 250, 'Angry', 'coral', ['Frustrated', 'Annoyed', 'Jealous']),
        list(590, 490, 250, 'Something else', 'sage', 3),
        write(60, 790, 380, 360, 'What happened', 'rose'),
        write(460, 790, 380, 360, 'What I need right now', 'sky'),
      ],
    }),
  },
  {
    id: 'mood-month-notes',
    subject: 'Mood',
    name: 'Mood month',
    description: 'A word or colour for every day of the month, a key, and the patterns you notice.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(1),
      elements: [
        title(60, 50, 700, `${monthName(ctx.today)} moods`),
        tape(620, 156, 220, 'lilac', 'confetti', 4),
        month(60, 196, 780, 630, 'lilac', ctx.today),
        table(60, 850, 380, 300, 'My key', 'butter', ['Word or colour', 'Feeling'], blank(5)),
        write(460, 850, 380, 300, 'Patterns I notice', 'mint'),
      ],
    }),
  },

  // ----- sleep
  {
    id: 'sleep-month',
    subject: 'Sleep',
    name: 'Sleep month',
    description: 'Hours slept on every day of the month, and what helped or kept you up.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(8, 'plain'),
      elements: [
        title(60, 50, 700, 'Sleep this month'),
        art(736, 40, 110, 'starlight', 'butter'),
        month(60, 196, 780, 640, 'lilac', ctx.today),
        write(60, 866, 380, 284, 'What helped', 'mint'),
        write(460, 866, 380, 284, 'What kept me up', 'sky'),
      ],
    }),
  },
  {
    id: 'night-routine',
    subject: 'Sleep',
    name: 'Night-time routine',
    description: 'A calm dark page: an hour-before checklist, worries parked until morning, three good things.',
    size: 'portrait',
    build: () => ({
      background: paper(10, 'dots'),
      elements: [
        title(60, 50, 640, 'Winding down', { color: '#FFFFFF' }),
        title(62, 150, 640, 'Slow down, one step at a time.', { font: 'clean', size: 30, color: '#D9D2E3' }),
        art(720, 40, 120, 'starlight', 'butter', 4),
        art(660, 130, 56, 'sparkle', 'butter'),
        list(60, 214, 380, 'An hour before', 'lilac', ['Dim the lights', 'Phone on charge', 'Tidy one thing', 'Warm shower']),
        list(460, 214, 380, 'In bed', 'sky', ['Slow breaths', 'A few pages', 'Lights out']),
        write(60, 560, 780, 300, 'Worries parked until morning', 'butter'),
        write(60, 880, 780, 270, 'Three good things today', 'rose'),
      ],
    }),
  },
  {
    id: 'dream-journal',
    subject: 'Sleep',
    name: 'Dream journal',
    description: 'Write the dream down before it fades, with how you slept and what it might mean.',
    size: 'landscape',
    build: () => ({
      background: paper(8, 'dots'),
      elements: [
        title(50, 30, 700, 'Dream journal'),
        art(1040, 20, 110, 'cloud', 'lilac', -4),
        art(990, 80, 56, 'sparkle', 'butter'),
        write(50, 160, 700, 470, 'Last night I dreamed', 'lilac'),
        table(50, 650, 700, 200, 'How I slept', 'sky', ['Bedtime', 'Woke up', 'Rested?'], blank(1)),
        write(780, 160, 370, 330, 'How it felt', 'rose'),
        write(780, 510, 370, 340, 'What it might mean', 'mint'),
      ],
    }),
  },

  // ----- sports and fitness
  sportLog('walking', 'Walking log', 'Walking', 'mountain', 'sage', ['Date', 'Steps', 'Route', 'With'], 'Routes to try', 3),
  {
    id: 'workout-week',
    subject: 'Sports and fitness',
    name: 'Weekly workout plan',
    description: 'One workout per day with minutes and a tick, plus a warm-up and how your body feels.',
    size: 'landscape',
    build: (ctx) => ({
      background: paper(7, 'grid'),
      elements: [
        title(50, 30, 700, 'Workout plan'),
        sub(54, 132, 600, `Week of ${weekStart(ctx)}`),
        art(1036, 30, 110, 'dumbbell', 'coral', -8),
        table(50, 190, 700, 660, '', 'coral', ['Workout', 'Minutes', 'Done'], weekDays(ctx)),
        list(780, 190, 370, 'Warm-up', 'butter', ['Jumping jacks', 'Arm circles', 'Leg swings']),
        write(780, 480, 370, 370, 'How my body feels', 'mint'),
      ],
    }),
  },
  {
    id: 'personal-bests',
    subject: 'Sports and fitness',
    name: 'Personal bests',
    description: 'Your best times and records, the next challenges and what you’re proud of.',
    size: 'portrait',
    build: () => ({
      background: paper(4),
      elements: [
        tape(60, 44, 240, 'butter', 'stars', -3),
        title(60, 60, 640, 'Personal bests'),
        art(724, 40, 120, 'trophy', 'butter', 6),
        table(60, 200, 780, 520, '', 'butter', ['Activity', 'Best', 'Date'], ['5 km run', 'Longest walk', 'Plank', 'Push-ups', 'Swim laps', '', '']),
        list(60, 746, 380, 'Next challenges', 'rose', 4),
        write(460, 746, 380, 404, 'What I’m proud of', 'mint'),
      ],
    }),
  },

  // ----- water
  {
    id: 'water-glasses',
    subject: 'Water',
    name: 'Eight glasses a day',
    description: 'A box for every glass on every day of the week, with tips that help.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(7, 'plain'),
      elements: [
        title(60, 50, 700, 'Eight glasses'),
        tape(600, 76, 240, 'sky', 'waves', 4),
        sub(62, 150, 700, 'Tick a box for every glass.'),
        table(60, 210, 780, 560, '', 'sky', ['1', '2', '3', '4', '5', '6', '7', '8'], weekDays(ctx)),
        list(60, 796, 380, 'Tips that help', 'mint', ['Bottle by the bed', 'A glass with every meal', 'Lemon or mint']),
        write(460, 796, 380, 354, 'Notes', 'butter'),
      ],
    }),
  },
  {
    id: 'water-month',
    subject: 'Water',
    name: 'Water month',
    description: 'Glasses per day for the whole month, beside your water tracker.',
    size: 'landscape',
    needs: ['Water'],
    build: (ctx) => ({
      background: paper(7),
      elements: [
        title(50, 30, 700, `${monthName(ctx.today)} water`),
        month(50, 150, 700, 700, 'sky', ctx.today),
        track(780, 150, 370, ctx.tracker('Water'), { look: 'progress' }),
        art(1050, 760, 90, 'sparkle', 'sky'),
      ],
    }),
  },
  {
    id: 'water-plan',
    subject: 'Water',
    name: 'Drink more water',
    description: 'Why it matters to you, a simple plan, flavour ideas and a week of check-ins.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(6),
      elements: [
        title(60, 50, 700, 'Drink more water'),
        art(744, 40, 100, 'watermelon', 'red', 10),
        write(60, 196, 780, 190, 'Why I want to', 'sky', false),
        list(60, 406, 380, 'My plan', 'mint', ['A glass when I wake up', 'Bottle in my bag', 'A glass before meals', 'Herbal tea at night']),
        write(460, 406, 380, 310, 'Flavour ideas', 'peach'),
        table(60, 750, 780, 400, 'This week', 'sky', shortDays(ctx), ['Morning', 'Afternoon', 'Evening']),
      ],
    }),
  },

  // ----- books
  {
    id: 'reading-challenge',
    subject: 'Books',
    name: 'Reading challenge',
    description: 'Forty blank books for the year: write each title on a spine and star it when it’s read.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(9),
      elements: [
        title(60, 56, 680, 'Reading challenge', { size: 62 }),
        title(62, 150, 780, `${ctx.today.getFullYear()}: forty books. Star each one when you finish it.`, { font: 'clean', size: 26, color: SOFT }),
        art(744, 40, 100, 'bookstack', 'rose', 6),
        shelf(60, 206, 780, 944, 40, 10),
      ],
    }),
  },
  {
    id: 'reading-log-table',
    subject: 'Books',
    name: 'Reading list',
    description: 'Title, author, pages and stars for every book, plus genres to try and a favourite quote.',
    size: 'portrait',
    build: () => ({
      background: paper(0, 'lines'),
      elements: [
        title(60, 50, 640, 'Reading list'),
        art(730, 40, 110, 'glasses', 'butter', -6),
        table(60, 196, 780, 700, '', 'sage', ['Title', 'Author', 'Pages', 'Stars'], blank(12)),
        list(60, 920, 380, 'Genres to try', 'lilac', 3),
        write(460, 920, 380, 230, 'A quote I loved', 'rose'),
      ],
    }),
  },
  {
    id: 'book-club',
    subject: 'Books',
    name: 'Book club',
    description: 'This month’s book, when and where you meet, questions to discuss and what’s next.',
    size: 'landscape',
    build: () => ({
      background: paper(2),
      elements: [
        title(50, 30, 700, 'Book club'),
        art(1040, 24, 110, 'openbook', 'rose', 6),
        write(50, 160, 540, 120, 'This month’s book', 'rose', false),
        table(610, 160, 540, 120, '', 'butter', ['Date', 'Where', 'Host'], blank(1)),
        write(50, 300, 540, 550, 'Questions to talk about', 'sky'),
        write(610, 300, 540, 340, 'What I thought', 'peach'),
        list(610, 660, 540, 'Next picks', 'mint', 2),
      ],
    }),
  },

  // ----- goals
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

  // ----- gratitude
  {
    id: 'gratitude-jar',
    subject: 'Gratitude',
    name: 'Gratitude jar',
    description: 'Little notes for the jar, a person, a place, something small and a look back at the week.',
    size: 'portrait',
    build: () => ({
      background: paper(2, 'plain'),
      elements: [
        title(60, 50, 640, 'Gratitude jar'),
        art(730, 44, 110, 'heart', 'rose', 8),
        list(60, 196, 500, 'Notes for the jar', 'rose', 8),
        write(590, 196, 250, 250, 'A person', 'butter'),
        write(590, 466, 250, 240, 'A place', 'mint'),
        write(590, 726, 250, 424, 'Something small', 'lilac'),
        write(60, 760, 500, 390, 'Looking back on this week', 'sky'),
      ],
    }),
  },
  {
    id: 'thanks-month',
    subject: 'Gratitude',
    name: 'Thirty days of thanks',
    description: 'One thing you’re thankful for on every day of the month, and the best day.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(4),
      elements: [
        title(60, 56, 700, '30 days of thanks', { size: 64 }),
        tape(620, 150, 220, 'rose', 'hearts', 3),
        month(60, 196, 780, 700, 'rose', ctx.today),
        write(60, 920, 780, 230, 'The best day this month', 'butter'),
      ],
    }),
  },
  {
    id: 'thank-you-notes',
    subject: 'Gratitude',
    name: 'Thank-you notes',
    description: 'Four little cards to write to the people who made your week better.',
    size: 'landscape',
    build: () => {
      const cards: [number, number, number, string, string, TapePattern][] = [
        [50, 176, -1.5, 'rose', 'rose', 'stripes'],
        [610, 186, 1.5, 'butter', 'butter', 'dots'],
        [56, 522, 1, 'mint', 'mint', 'gingham'],
        [606, 530, -1, 'sky', 'sky', 'stars'],
      ];
      return {
        background: paper(9),
        elements: [
          title(50, 26, 700, 'Thank-you notes'),
          art(1050, 20, 100, 'speech', 'rose', -6),
          ...cards.flatMap(([x, y, rot, head, tapeColor, pattern]) => [
            { ...write(x, y, 540, 320, 'Dear …', head), rotation: rot },
            tape(x + 200, y - 18, 140, tapeColor, pattern, -rot * 2),
          ]),
        ],
      };
    },
  },

  // ----- memories
  {
    id: 'photo-wall',
    subject: 'Memories',
    name: 'Photo wall',
    description: 'Six photo spots pinned at playful angles, like a wall of favourite pictures.',
    size: 'landscape',
    build: () => {
      const spots: [number, number, number, string, TapePattern][] = [
        [60, 160, -3, 'rose', 'hearts'],
        [430, 150, 2, 'butter', 'stripes'],
        [800, 166, -2, 'mint', 'dots'],
        [70, 500, 2, 'sky', 'stars'],
        [440, 512, -2, 'lilac', 'confetti'],
        [806, 496, 3, 'peach', 'gingham'],
      ];
      return {
        background: paper(0, 'plain'),
        elements: [
          title(50, 26, 700, 'Favourite pictures'),
          ...spots.flatMap(([x, y, rot, color, pattern]) => [frame(x, y, 330, 300, rot), tape(x + 100, y - 18, 130, color, pattern, -rot)]),
        ],
      };
    },
  },
  {
    id: 'year-in-memories',
    subject: 'Memories',
    name: 'A year of memories',
    description: 'One box for each month: the moment you want to remember from it.',
    size: 'portrait',
    build: (ctx) => {
      const colors = ['sky', 'rose', 'mint', 'butter', 'lilac', 'peach'];
      const months = Array.from({ length: 12 }, (_, i) => new Date(2000, i, 1).toLocaleDateString(LOCALE, { month: 'long' }));
      return {
        background: paper(9),
        elements: [
          title(60, 50, 760, `${ctx.today.getFullYear()} in memories`),
          ...months.map((m, i) => write(60 + (i % 3) * 265, 196 + Math.floor(i / 3) * 240, 250, 226, m, colors[i % colors.length])),
        ],
      };
    },
  },
  {
    id: 'birthday',
    subject: 'Memories',
    name: 'Birthday page',
    description: 'A photo spot, who celebrated, the best moment, gifts, wishes and a note for next year.',
    size: 'portrait',
    build: () => ({
      background: paper(2),
      elements: [
        title(60, 50, 640, 'Happy birthday'),
        art(730, 40, 110, 'gift', 'rose', 6),
        art(680, 120, 56, 'sparkle', 'butter'),
        frame(64, 206, 410, 360, -2),
        tape(190, 186, 150, 'butter', 'confetti', -4),
        write(500, 200, 340, 176, 'Who celebrated', 'butter'),
        write(500, 394, 340, 176, 'Best moment', 'mint'),
        list(60, 600, 380, 'Gifts', 'rose', 4),
        write(460, 600, 380, 310, 'Wishes for this year', 'lilac'),
        write(60, 940, 780, 210, 'A note to read next birthday', 'sky'),
      ],
    }),
  },

  // ----- money
  {
    id: 'bills',
    subject: 'Money',
    name: 'Bills tracker',
    description: 'Every regular bill with its due date, amount and a paid column, plus what’s coming up.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(6, 'grid'),
      elements: [
        title(60, 50, 640, 'Bills'),
        sub(62, 150, 600, ctx.today.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' })),
        art(730, 44, 110, 'gelt', 'butter', 8),
        table(60, 214, 780, 620, '', 'mint', ['Bill', 'Due', 'Amount', 'Paid'], ['Rent', 'Electricity', 'Water', 'Phone', 'Internet', 'Insurance', 'Subscriptions', '', '']),
        list(60, 856, 380, 'Coming up', 'rose', 4),
        write(460, 856, 380, 294, 'Notes', 'butter'),
      ],
    }),
  },
  {
    id: 'no-spend',
    subject: 'Money',
    name: 'No-spend month',
    description: 'Mark every day without extra spending, set your rules and watch the savings add up.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(5),
      elements: [
        tape(60, 44, 240, 'mint', 'checker', -3),
        title(60, 60, 700, 'No-spend month'),
        month(60, 196, 780, 630, 'mint', ctx.today),
        list(60, 850, 380, 'My rules', 'butter', ['Groceries are fine', 'Bills are fine', 'No takeaway', 'No online shopping']),
        write(460, 850, 380, 300, 'Money saved', 'rose'),
      ],
    }),
  },
  {
    id: 'wish-list',
    subject: 'Money',
    name: 'Wish list',
    description: 'Things you’d love, what they cost, what you’ve saved, and the ones you bought.',
    size: 'landscape',
    build: () => ({
      background: paper(2, 'grid'),
      elements: [
        title(50, 30, 700, 'Wish list'),
        art(1040, 24, 110, 'star', 'butter', 8),
        table(50, 160, 740, 690, '', 'rose', ['Item', 'Price', 'Saved', 'Bought'], blank(10)),
        write(820, 160, 330, 400, 'Why I want it', 'butter'),
        list(820, 580, 330, 'Bought it!', 'mint', 2),
      ],
    }),
  },

  // ----- habits
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

export const BUILT_IN_TEMPLATES: BuiltInTemplate[] = [...CORE_TEMPLATES, ...moreTemplates(kit)];

/** A complete page from a template. Use `createPage(…, from: thisPage)` to save it. */
export function buildTemplatePage(t: BuiltInTemplate, ctx: TemplateContext): Page {
  const built = t.build(ctx);
  const now = new Date().toISOString();
  return {
    id: `template-${t.id}`,
    title: t.name,
    size: t.size,
    background: built.background ?? { color: BG_COLORS[0], pattern: 'dots' },
    elements: built.elements,
    isTemplate: false,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
  };
}
