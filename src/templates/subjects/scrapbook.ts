import { art, band, blank, frame, paper, shortDays, SOFT, table, tape, themed, title, write, type BuiltInTemplate } from '../kit';

// Scrapbook: a collage, tickets and keepsakes, a week in photos and a postcard.

export const scrapbookTemplates: BuiltInTemplate[] = [
  {
    id: 'scrap-collage',
    subject: 'Scrapbook',
    name: 'Collage with captions',
    description: 'Five photo slots in five different frames, loosely arranged, with the story beside them.',
    size: 'portrait',
    build: () => ({
      background: paper(9, 'plain'),
      elements: [
        title(60, 50, 640, 'A little collage', { size: 66 }),
        art(740, 40, 100, 'camera', 'lilac', 8),
        frame(60, 180, 400, 330, -3, { style: 'polaroid', caption: 'Here' }),
        frame(490, 190, 350, 400, 2, { style: 'torn' }),
        frame(80, 540, 300, 300, 0, { style: 'circle' }),
        frame(420, 620, 420, 300, -2, { style: 'stamp' }),
        frame(60, 880, 330, 270, 2, { style: 'rounded' }),
        write(420, 950, 420, 200, 'The story', 'butter'),
        themed(160, 160, 170, 'daisies', -4),
        tape(580, 172, 150, 'mint', 'dots', 3),
      ],
    }),
  },
  {
    id: 'scrap-tickets',
    subject: 'Scrapbook',
    name: 'Tickets and keepsakes',
    description: 'Stamp-edged slots for tickets, a photo, where you went and what you kept and why.',
    size: 'portrait',
    build: () => ({
      background: paper(9, 'kraft'),
      elements: [
        title(60, 50, 780, 'Tickets and keepsakes', { size: 58 }),
        frame(60, 180, 380, 200, -2, { style: 'stamp', hint: 'A ticket' }),
        frame(470, 190, 370, 200, 2, { style: 'stamp', hint: 'A ticket' }),
        frame(60, 420, 300, 360, 2, { style: 'polaroid' }),
        table(400, 420, 440, 360, 'Where we went', 'peach', ['What', 'When', 'With'], blank(5)),
        write(60, 820, 780, 200, 'What I kept and why', 'butter'),
        themed(60, 1056, 400, 'travelstamps', -1),
        themed(480, 1062, 360, 'journey', 2),
      ],
    }),
  },
  {
    id: 'scrap-week-photos',
    subject: 'Scrapbook',
    name: 'This week in photos',
    description: 'A photo for each day of the week, named by its day, and the best bit of the week.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(1),
      elements: [
        title(60, 50, 780, 'This week in photos', { size: 62 }),
        ...shortDays(ctx).map((day, i) => frame(60 + (i % 3) * 265, 180 + Math.floor(i / 3) * 330, 250, 310, [-2, 1, -1][i % 3], { style: 'polaroid', caption: day })),
        write(325, 840, 515, 310, 'Best bit of the week', 'butter'),
      ],
    }),
  },
  {
    id: 'scrap-postcard',
    subject: 'Scrapbook',
    name: 'Postcard',
    description: 'A postcard to keep: the picture on the left, a stamp, your message and who it is to.',
    size: 'landscape',
    build: () => ({
      background: paper(3, 'plain'),
      elements: [
        { ...band(40, 40, 1120, 820, 'white'), shadow: true },
        frame(70, 70, 520, 760, 0),
        band(608, 90, 4, 720, 'grey'),
        title(640, 86, 320, 'Postcard', { font: 'elegant', size: 44, color: SOFT }),
        frame(978, 72, 152, 176, 3, { style: 'stamp', hint: 'Stamp' }),
        themed(640, 176, 320, 'airmail', 0),
        write(636, 260, 496, 330, 'Dear', 'rose'),
        write(636, 610, 496, 220, 'To', 'sky'),
      ],
    }),
  },
];
