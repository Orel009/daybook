import { art, blank, frame, paper, photoSpot, table, themed, title, write, type BuiltInTemplate } from '../kit';

// Kids: milestones, first words and growing up.

export const kidsTemplates: BuiltInTemplate[] = [
  {
    id: 'kids-milestones',
    subject: 'Kids',
    name: 'Milestones',
    description: 'A photo, name and birthday, and a table of firsts with the date and what happened.',
    size: 'portrait',
    build: () => ({
      background: paper(4),
      elements: [
        themed(56, 34, 240, 'blocks'),
        title(60, 50, 640, 'Milestones'),
        art(740, 40, 100, 'star', 'butter', 8),
        ...photoSpot(60, 200, 300, 290, -3, 'butter', 'stars'),
        table(390, 190, 450, 300, '', 'butter', [''], ['Name', 'Born', 'Today is']),
        table(60, 530, 780, 470, 'Firsts', 'peach', ['Milestone', 'Date', 'What happened'], blank(7)),
        write(60, 1030, 780, 120, 'Right now you love', 'rose', false),
      ],
    }),
  },
  {
    id: 'kids-first-words',
    subject: 'Kids',
    name: 'First words',
    description: 'The words as they came, what they meant and when, with the funniest thing said so far.',
    size: 'portrait',
    build: () => ({
      background: paper(2),
      elements: [
        title(60, 50, 640, 'First words'),
        art(730, 40, 110, 'speech', 'lilac', 6),
        table(60, 190, 780, 560, 'What you said', 'rose', ['Word', 'What it meant', 'Date'], blank(8)),
        write(60, 780, 380, 300, 'Funniest thing you said', 'butter'),
        frame(470, 790, 360, 300, 2, { style: 'polaroid' }),
      ],
    }),
  },
  {
    id: 'kids-growth',
    subject: 'Kids',
    name: 'Growing up',
    description: 'Height, weight and shoe size over time, two photos and a letter to read later.',
    size: 'portrait',
    build: () => ({
      background: paper(6),
      elements: [
        title(60, 50, 640, 'Growing up'),
        art(740, 40, 100, 'balloon', 'rose', -6),
        table(60, 190, 480, 620, 'How you grew', 'mint', ['Date', 'Height', 'Weight', 'Shoe size'], blank(9)),
        frame(570, 190, 270, 300, 2, { style: 'polaroid' }),
        frame(580, 520, 250, 290, -2, { style: 'polaroid' }),
        write(60, 840, 780, 300, 'A letter to you', 'butter'),
      ],
    }),
  },
];
