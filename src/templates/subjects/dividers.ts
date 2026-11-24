import { art, band, paper, SOFT, sub, tape, title, type BuiltInTemplate } from '../kit';

// Chapter dividers: a page with a big title, a band of colour and a few
// stickers, to split the book into parts. They are ordinary pages: put one
// where a chapter starts (Journal → Arrange) and change its title in Edit.

export const dividersTemplates: BuiltInTemplate[] = [
  {
    id: 'divider-chapter',
    subject: 'Dividers',
    name: 'Chapter divider',
    description: 'A big chapter title on a band of colour, to start a new part of the book.',
    size: 'portrait',
    build: () => ({
      background: paper(0, 'plain'),
      elements: [
        band(-20, 420, 940, 330, 'rose'),
        tape(-10, 398, 920, 'rose', 'doily', 0),
        tape(-10, 728, 920, 'rose', 'doily', 0),
        title(40, 468, 820, 'Chapter one', { font: 'elegant', size: 124, align: 'center' }),
        title(40, 640, 820, 'A new part of the story', { font: 'cursive', size: 46, align: 'center', color: SOFT }),
        art(120, 200, 150, 'daisy', 'lilac', -10),
        art(650, 230, 130, 'butterfly', 'rose', 12),
        art(380, 860, 140, 'tulip', 'rose', 4),
      ],
    }),
  },
  {
    id: 'divider-season',
    subject: 'Dividers',
    name: 'Season divider',
    description: 'A side band, a huge brush title and seasonal stickers. Rename it Spring, Summer, Autumn or Winter.',
    size: 'portrait',
    build: () => ({
      background: paper(4, 'dots'),
      elements: [
        band(-20, -20, 250, 1240, 'butter'),
        tape(170, 120, 150, 'orange', 'citrus', 86),
        tape(170, 940, 150, 'orange', 'lemons', 92),
        title(270, 400, 600, 'Summer', { font: 'brush', size: 150, align: 'center' }),
        sub(270, 620, 600, 'Long days, warm evenings'),
        art(60, 470, 130, 'sun', 'butter'),
        art(640, 180, 150, 'watermelon', 'red', 10),
        art(330, 800, 130, 'icecream', 'rose', -8),
        art(620, 840, 150, 'shell', 'peach', 12),
      ],
    }),
  },
  {
    id: 'divider-memories',
    subject: 'Dividers',
    name: 'Memories divider',
    description: 'Tall capitals between two bands of colour, with stars. For photos, trips and keepsakes.',
    size: 'portrait',
    build: () => ({
      background: paper(9, 'plain'),
      elements: [
        band(-20, 250, 940, 90, 'sky'),
        band(-20, 880, 940, 90, 'sky'),
        title(40, 430, 820, 'MEMORIES', { font: 'tall', size: 260, align: 'center' }),
        title(40, 740, 820, 'the ones worth keeping', { font: 'script', size: 56, align: 'center', color: SOFT }),
        tape(330, 226, 240, 'butter', 'starsmoons', -2),
        tape(330, 946, 240, 'butter', 'starsmoons', 2),
        art(110, 80, 120, 'camera', 'lilac', -10),
        art(680, 70, 130, 'star', 'butter', 12),
        art(130, 1020, 120, 'sparkle', 'butter'),
        art(660, 1010, 130, 'heart', 'rose', 10),
      ],
    }),
  },
  {
    id: 'divider-year',
    asks: 'year',
    subject: 'Dividers',
    name: 'Year divider',
    description: 'The year in huge numbers over a band of colour.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(8, 'grid'),
      elements: [
        band(-20, 760, 940, 460, 'lilac'),
        tape(-10, 738, 920, 'lilac', 'confetti', 0),
        title(40, 330, 820, String(ctx.year), { font: 'round', size: 300, align: 'center' }),
        title(40, 820, 820, 'A year in pages', { font: 'hand', size: 76, align: 'center' }),
        art(110, 130, 130, 'moon', 'butter', -12),
        art(670, 150, 110, 'star', 'butter', 10),
        art(160, 980, 130, 'balloon', 'rose', -8),
        art(620, 960, 140, 'cake', 'peach', 6),
      ],
    }),
  },
];
