import { art, blank, frame, label, list, paper, rating, sticky, table, themed, title, weekDays, write, type BuiltInTemplate } from '../kit';

// Mindset: affirmations, reframing, what is and isn't in your control, wins, values, worries and a vision board.

export const mindsetTemplates: BuiltInTemplate[] = [
  {
    id: 'mind-affirmations',
    subject: 'Mindset',
    name: 'Affirmations',
    description: 'Six starters to finish in your own words: I am, I can, I will, I choose, I let go of, I am grateful for.',
    size: 'portrait',
    build: () => ({
      background: paper(2),
      elements: [
        title(60, 50, 640, 'Affirmations'),
        art(740, 40, 100, 'sparkle', 'butter'),
        ...['I am', 'I can', 'I will', 'I choose', 'I let go of', 'I am grateful for'].map((head, i) =>
          write(60 + (i % 2) * 400, 190 + Math.floor(i / 2) * 300, 380, 280, head, ['rose', 'butter', 'mint', 'sky', 'lilac', 'peach'][i]),
        ),
        sticky(230, 1090, 440, 'Say them out loud', 'butter', -2),
      ],
    }),
  },
  {
    id: 'mind-reframing',
    subject: 'Mindset',
    name: 'Reframing thoughts',
    description: 'A fixed thought on the left, the growth version of it on the right.',
    size: 'portrait',
    build: () => ({
      background: paper(8),
      elements: [
        title(60, 50, 780, 'Reframing thoughts', { size: 62 }),
        table(60, 180, 780, 640, 'From fixed to growth', 'lilac', ['Fixed thought', 'Growth thought'], blank(6)),
        write(60, 850, 780, 180, 'What I learned about myself', 'butter'),
        sticky(240, 1060, 420, 'Not yet is not never', 'mint', -2),
      ],
    }),
  },
  {
    id: 'mind-control',
    subject: 'Mindset',
    name: 'Circle of control',
    description: 'Sort what is on your mind into in my control, can influence and out of my hands.',
    size: 'portrait',
    build: () => ({
      background: paper(6, 'plain'),
      elements: [
        title(60, 50, 720, 'Circle of control', { size: 66 }),
        list(60, 190, 250, 'In my control', 'green', 4),
        list(325, 190, 250, 'Can influence', 'butter', 4),
        list(590, 190, 250, 'Out of my hands', 'grey', 4),
        write(60, 540, 780, 260, 'Where I will put my energy', 'mint'),
        write(60, 830, 780, 200, 'What I am letting go of', 'lilac'),
        art(395, 1050, 110, 'butterfly', 'lilac'),
      ],
    }),
  },
  {
    id: 'mind-wins',
    subject: 'Mindset',
    name: 'Wins of the week',
    description: 'One win for every day, the biggest of the week and how the week felt in stars.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(4),
      elements: [
        title(60, 50, 640, 'Wins of the week', { size: 66 }),
        art(740, 40, 100, 'trophy', 'butter', 6),
        table(60, 190, 780, 560, 'One win a day', 'butter', ['Win'], weekDays(ctx)),
        write(60, 780, 780, 200, 'Biggest win', 'rose'),
        label(60, 1016, 400, 'How the week felt'),
        rating(60, 1056, 320),
      ],
    }),
  },
  {
    id: 'mind-values',
    subject: 'Mindset',
    name: 'Values and intentions',
    description: 'Your values, what living them looks like, and one intention for today.',
    size: 'portrait',
    build: () => ({
      background: paper(9),
      elements: [
        title(60, 50, 780, 'Values and intentions', { size: 60 }),
        list(60, 180, 380, 'My values', 'lilac', 5),
        write(460, 180, 380, 313, 'My word for this season', 'butter', false),
        table(60, 530, 780, 420, 'Living them', 'mint', ['Value', 'What it looks like'], blank(5)),
        write(60, 980, 780, 170, 'One intention for today', 'rose', false),
      ],
    }),
  },
  {
    id: 'mind-worry-dump',
    subject: 'Mindset',
    name: 'Worry dump',
    description: 'Get everything out of your head, then sort it: can I act on it, and what is the next small step?',
    size: 'portrait',
    build: () => ({
      background: paper(7),
      elements: [
        title(60, 50, 560, 'Worry dump'),
        art(730, 40, 110, 'cloud', 'sky'),
        write(60, 190, 780, 380, 'Everything on my mind', 'sky'),
        table(60, 600, 780, 380, 'Sorting it out', 'lilac', ['Worry', 'Can I act on it?', 'Next small step'], blank(5)),
        sticky(240, 1020, 420, 'This too shall pass', 'butter', -2),
      ],
    }),
  },
  {
    id: 'mind-vision-tall',
    subject: 'Mindset',
    name: 'Vision board with photos',
    description: 'Six photo slots in different frames for home, health, love, travel, work and you.',
    size: 'portrait',
    build: () => ({
      background: paper(1, 'plain'),
      elements: [
        title(60, 50, 640, 'My vision'),
        art(740, 40, 100, 'star', 'butter', 8),
        frame(60, 180, 360, 300, -2, { style: 'polaroid', caption: 'Home' }),
        frame(470, 190, 370, 280, 2, { style: 'rounded', caption: 'Health' }),
        frame(70, 520, 300, 320, 0, { style: 'circle', caption: 'Love' }),
        frame(430, 510, 400, 300, -2, { style: 'torn', caption: 'Travel' }),
        frame(60, 870, 380, 280, 2, { style: 'stamp', caption: 'Work' }),
        frame(480, 850, 360, 300, -2, { caption: 'Me' }),
        themed(170, 160, 150, 'starsmoons', -4),
      ],
    }),
  },
];
