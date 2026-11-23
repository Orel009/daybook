import type { TextFont } from '../../domain/pages';
import type { ThemedTape } from '../../domain/tapes';
import { art, band, blank, frame, list, month, monthDate, SOFT, sticky, table, tape, themed, title, write, type BuiltInTemplate } from '../kit';

// Months: for every month a cover, a "month at a glance" and a memories page,
// each in the month's own colours, stickers and tape. A month page is for that
// month this year if it hasn't passed yet, and otherwise for next year.

interface MonthLook {
  name: string;
  /** Lettering of the month's name, and the size at which the name fills the page's width. */
  font: TextFont;
  size: number;
  upper?: boolean;
  /** Paper colour and the colour of the band. */
  bg: string;
  band: string;
  ink: string;
  tag: string;
  tapes: [ThemedTape, ThemedTape];
  art: [string, string][];
  /** Colour of the calendar, then three for lists and writing areas. */
  cal: string;
  accents: [string, string, string];
}

const MONTHS: MonthLook[] = [
  { name: 'January', font: 'tall', size: 300, upper: true, bg: '#E6F0FB', band: 'sky', ink: '#2F5FB0', tag: 'Snow and a fresh start', tapes: ['snowflakes', 'word-january'], art: [['snowflake', 'sky'], ['snowman', 'rose'], ['mitten', 'red'], ['sparkle', 'butter']], cal: 'sky', accents: ['sky', 'lilac', 'mint'] },
  { name: 'February', font: 'cursive', size: 190, bg: '#FDEFF3', band: 'rose', ink: '#B03A6B', tag: 'Hearts and little kindnesses', tapes: ['sweethearts', 'word-february'], art: [['heart', 'rose'], ['letter', 'red'], ['heart', 'berry'], ['sparkle', 'butter']], cal: 'rose', accents: ['rose', 'lilac', 'peach'] },
  { name: 'March', font: 'round', size: 220, bg: '#E4F4EC', band: 'mint', ink: '#1E7A78', tag: 'Spring rain and first shoots', tapes: ['rainyday', 'word-march'], art: [['raincloud', 'sky'], ['umbrella', 'rose'], ['sprout', 'green'], ['drop', 'sky']], cal: 'mint', accents: ['mint', 'sky', 'butter'] },
  { name: 'April', font: 'brush', size: 210, bg: '#FFF8D9', band: 'butter', ink: '#B03A6B', tag: 'Flowers everywhere', tapes: ['tulips', 'word-april'], art: [['tulip', 'rose'], ['daisy', 'lilac'], ['butterfly', 'lilac'], ['tulip', 'coral']], cal: 'lilac', accents: ['rose', 'lilac', 'mint'] },
  { name: 'May', font: 'elegant', size: 250, bg: '#EEF6E2', band: 'sage', ink: '#2F7A4D', tag: 'Out in the garden', tapes: ['meadow', 'word-may'], art: [['wateringcan', 'mint'], ['sprout', 'green'], ['bee', 'butter'], ['daisy', 'rose']], cal: 'green', accents: ['sage', 'butter', 'rose'] },
  { name: 'June', font: 'marker', size: 210, bg: '#E6F0FB', band: 'teal', ink: '#1E7A78', tag: 'Sand, sea and long days', tapes: ['shells', 'word-june'], art: [['shell', 'peach'], ['starfish', 'coral'], ['beachball', 'rose'], ['sun', 'butter']], cal: 'teal', accents: ['teal', 'peach', 'butter'] },
  { name: 'July', font: 'brush', size: 240, bg: '#FFF1E4', band: 'coral', ink: '#B5383F', tag: 'Summer fruit and sunshine', tapes: ['watermelons', 'word-july'], art: [['watermelon', 'red'], ['lemon', 'butter'], ['cherry', 'red'], ['icecream', 'rose']], cal: 'coral', accents: ['coral', 'butter', 'mint'] },
  { name: 'August', font: 'round', size: 200, bg: '#E4F4EC', band: 'blue', ink: '#2F5FB0', tag: 'Ocean days and far-away places', tapes: ['seawaves', 'word-august'], art: [['wave', 'sky'], ['anchor', 'blue'], ['suitcase', 'peach'], ['plane', 'sky']], cal: 'blue', accents: ['sky', 'teal', 'peach'] },
  { name: 'September', font: 'typewriter', size: 128, bg: '#FFF8D9', band: 'red', ink: '#B5383F', tag: 'Back to school and apples', tapes: ['apples', 'word-september'], art: [['apple', 'red'], ['pencil', 'butter'], ['book', 'lilac'], ['bookstack', 'rose']], cal: 'red', accents: ['red', 'butter', 'sage'] },
  { name: 'October', font: 'marker', size: 165, bg: '#FFF1E4', band: 'orange', ink: '#B8601C', tag: 'Leaves and pumpkins', tapes: ['pumpkins', 'word-october'], art: [['pumpkin', 'orange'], ['maple', 'red'], ['acorn', 'tan'], ['mushroom', 'red']], cal: 'orange', accents: ['orange', 'tan', 'sage'] },
  { name: 'November', font: 'elegant', size: 160, bg: '#F2EDE7', band: 'tan', ink: '#B8601C', tag: 'Cosy coffee and warm knits', tapes: ['knits', 'word-november'], art: [['mug', 'rose'], ['yarn', 'coral'], ['togo', 'peach'], ['bean', 'tan']], cal: 'tan', accents: ['tan', 'peach', 'rose'] },
  { name: 'December', font: 'tall', size: 280, upper: true, bg: '#EEF6E2', band: 'red', ink: '#B5383F', tag: 'Lights, Christmas and Hanukkah', tapes: ['christmas', 'word-december'], art: [['xmastree', 'green'], ['menorah', 'blue'], ['stringlights', 'rose'], ['gift', 'red']], cal: 'green', accents: ['red', 'green', 'blue'] },
];

const slug = (name: string) => name.slice(0, 3).toLowerCase();
const shown = (m: MonthLook) => (m.upper ? m.name.toUpperCase() : m.name);
const sticker = (m: MonthLook, n: number, x: number, y: number, size: number, rotation = 0) => art(x, y, size, m.art[n][0], m.art[n][1], rotation);

/** A cover for the month: its name very big, the year, the month's stickers and tape. Three layouts take turns. */
const cover = (m: MonthLook, i: number): BuiltInTemplate => ({
  id: `month-${slug(m.name)}-cover`,
  subject: 'Months',
  name: `${m.name} cover`,
  description: `${m.name} in big letters to open the month: ${m.tag.toLowerCase()}.`,
  size: 'portrait',
  build: (ctx) => {
    const year = String(monthDate(ctx.today, i).getFullYear());
    const background = { color: m.bg, pattern: 'dots' as const };
    if (i % 3 === 0) {
      // the name sits in the upper part of the band, clear of the line of words under it
      const size = Math.min(m.size, 200);
      return {
        background,
        elements: [
          band(-20, 400, 940, 390, m.band),
          themed(-10, 378, 920, m.tapes[0], 0, { edge: 'straight' }),
          themed(-10, 768, 920, m.tapes[0], 0, { edge: 'straight' }),
          title(40, 250, 820, year, { font: 'clean', size: 64, align: 'center', color: m.ink }),
          title(40, Math.round(414 + (270 - size * 1.2) / 2), 820, shown(m), { font: m.font, size, align: 'center' }),
          title(40, 698, 820, m.tag, { font: 'script', size: 50, align: 'center' }),
          sticker(m, 0, 70, 70, 170, -8),
          sticker(m, 1, 660, 60, 170, 8),
          sticker(m, 2, 80, 860, 160, 6),
          sticker(m, 3, 660, 870, 160, -6),
          list(270, 850, 360, 'This month', m.accents[0], 3),
          themed(270, 1116, 360, m.tapes[1], -2),
        ],
      };
    }
    if (i % 3 === 1) {
      const size = Math.min(m.size, 230);
      return {
        background,
        elements: [
          title(40, 60, 820, shown(m), { font: m.font, size, align: 'center', color: m.ink }),
          title(40, Math.round(70 + size * 1.2), 820, year, { font: 'clean', size: 48, align: 'center', color: SOFT }),
          frame(240, 440, 420, 500, -3, { style: 'polaroid' }),
          themed(360, 420, 180, m.tapes[0], 2),
          sticker(m, 0, 50, 470, 170, -10),
          sticker(m, 1, 690, 520, 160, 10),
          sticker(m, 2, 70, 760, 150, 8),
          sticker(m, 3, 690, 780, 150, -8),
          sticky(230, 980, 440, m.tag, m.accents[1], -2),
          themed(280, 1126, 340, m.tapes[1], 1),
        ],
      };
    }
    const size = Math.round(Math.min(m.size * 0.68, 170));
    return {
      background,
      elements: [
        band(-20, -20, 270, 1240, m.band),
        sticker(m, 0, 45, 80, 160, -6),
        sticker(m, 1, 45, 350, 160, 6),
        sticker(m, 2, 45, 620, 160, -4),
        sticker(m, 3, 45, 890, 160, 8),
        themed(300, 60, 540, m.tapes[0], 0),
        title(290, 140, 560, shown(m), { font: m.font, size, color: m.ink }),
        title(290, Math.round(146 + size * 1.2), 560, year, { font: 'clean', size: 48, color: SOFT }),
        title(290, 440, 560, m.tag, { font: 'script', size: 50 }),
        list(290, 590, 550, `Hello, ${m.name}`, m.accents[0], 4),
        write(290, 880, 550, 210, 'Looking forward to', m.accents[1]),
        themed(290, 1116, 360, m.tapes[1], -2),
      ],
    };
  },
});

/** The month at a glance: its calendar, goals, habits and a photo. */
const glance = (m: MonthLook, i: number): BuiltInTemplate => ({
  id: `month-${slug(m.name)}-glance`,
  subject: 'Months',
  name: `${m.name} at a glance`,
  description: `The ${m.name} calendar with goals, habits and a photo of the month.`,
  size: 'portrait',
  build: (ctx) => {
    const d = monthDate(ctx.today, i);
    const head = [title(60, 44, 670, `${m.name} at a glance`, { size: 54 }), sticker(m, 0, 742, 30, 108, 8)];
    return i % 2 === 0
      ? {
          background: { color: m.bg, pattern: 'dots' },
          elements: [
            ...head,
            month(60, 150, 780, 500, m.cal, d),
            list(60, 680, 300, 'Goals', m.accents[0], 4),
            table(380, 680, 460, 266, 'Habits, week by week', m.accents[1], ['Habit', '1', '2', '3', '4', '5'], blank(4)),
            frame(60, 990, 300, 180, -2),
            themed(110, 972, 200, m.tapes[0], -3),
            write(390, 980, 450, 186, 'Notes', m.accents[2]),
          ],
        }
      : {
          background: { color: m.bg, pattern: 'grid' },
          elements: [
            ...head,
            month(60, 150, 780, 480, m.cal, d),
            frame(60, 670, 330, 250, 2),
            themed(130, 652, 190, m.tapes[0], 3),
            list(420, 660, 420, 'Goals', m.accents[0], 4),
            table(60, 950, 780, 216, 'Habits this month', m.accents[1], ['Habit', 'Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'], blank(3)),
          ],
        };
  },
});

/** A page of photos and best moments for the month. */
const memories = (m: MonthLook, i: number): BuiltInTemplate => ({
  id: `month-${slug(m.name)}-memories`,
  subject: 'Months',
  name: `${m.name} memories`,
  description: `Photo slots, best moments and highlights to keep from ${m.name}.`,
  size: 'portrait',
  build: () => {
    const head = [title(60, 44, 670, `${m.name} memories`, { size: 60 }), sticker(m, 1, 742, 30, 108, -8)];
    return i % 2 === 0
      ? {
          background: { color: m.bg, pattern: 'plain' },
          elements: [
            ...head,
            frame(60, 170, 370, 430, -2, { style: 'polaroid' }),
            themed(160, 150, 170, m.tapes[0], -4),
            frame(470, 190, 370, 290, 2, { style: 'rounded' }),
            frame(490, 520, 330, 250, -2, { style: 'torn' }),
            write(60, 640, 400, 240, 'Best moments', m.accents[0]),
            list(60, 910, 400, 'Highlights', m.accents[1], 4),
            write(490, 810, 350, 356, 'I want to remember', m.accents[2]),
            themed(540, 1130, 250, m.tapes[1], -2),
          ],
        }
      : {
          background: { color: m.bg, pattern: 'dots' },
          elements: [
            ...head,
            frame(60, 180, 250, 310, -3, { style: 'polaroid' }),
            frame(325, 190, 250, 310, 2, { style: 'polaroid' }),
            frame(590, 180, 250, 310, -2, { style: 'polaroid' }),
            themed(110, 162, 150, m.tapes[0], -4),
            tape(380, 172, 140, m.accents[0], 'dots', 3),
            themed(640, 162, 150, m.tapes[0], 4),
            write(60, 540, 780, 250, 'Best moments', m.accents[0]),
            list(60, 820, 380, 'Highlights', m.accents[1], 5),
            frame(470, 830, 370, 300, 2, { style: 'stamp' }),
            themed(60, 1140, 340, m.tapes[1], -1),
          ],
        };
  },
});

export const monthsTemplates: BuiltInTemplate[] = MONTHS.flatMap((m, i) => [cover(m, i), glance(m, i), memories(m, i)]);

/** The month (0 to 11) a Months template is for, by its id. */
export const monthOfTemplate = (id: string): number => MONTHS.findIndex((m) => id.startsWith(`month-${slug(m.name)}-`));
