import { art, blank, frame, list, paper, table, themed, title, write, type BuiltInTemplate } from '../kit';

// Hobbies and crafts: projects on the go, the stash, and photos of what got finished.

export const hobbiesAndCraftsTemplates: BuiltInTemplate[] = [
  {
    id: 'craft-projects',
    subject: 'Hobbies and crafts',
    name: 'Project tracker',
    description: 'Every project on the go with when it started and the next step, plus ideas for later.',
    size: 'portrait',
    build: () => ({
      background: paper(5),
      elements: [
        title(60, 50, 640, 'Projects'),
        art(740, 40, 100, 'yarn', 'rose', 6),
        table(60, 190, 780, 640, 'On the go', 'mint', ['Project', 'Started', 'Next step', 'Done'], blank(9)),
        list(60, 860, 380, 'Ideas for later', 'butter', 4),
        write(460, 860, 380, 266, 'Finished and proud of', 'rose'),
      ],
    }),
  },
  {
    id: 'craft-stash',
    subject: 'Hobbies and crafts',
    name: 'Yarn and supplies stash',
    description: 'What is in the stash: the colour, how much there is and what it is saved for.',
    size: 'portrait',
    build: () => ({
      background: paper(3, 'grid'),
      elements: [
        title(60, 50, 640, 'My stash'),
        art(730, 40, 110, 'yarn', 'coral', -8),
        table(60, 190, 780, 700, 'What I have', 'peach', ['Item', 'Colour', 'How much', 'Saved for'], blank(10)),
        list(60, 920, 380, 'To buy', 'coral', 3),
        write(460, 920, 380, 216, 'Do not buy more of', 'butter'),
      ],
    }),
  },
  {
    id: 'craft-gallery',
    subject: 'Hobbies and crafts',
    name: 'Finished projects',
    description: 'Four photos of things you made, each with room for a caption.',
    size: 'portrait',
    build: () => ({
      background: paper(1, 'plain'),
      elements: [
        title(60, 50, 720, 'Finished projects', { size: 66 }),
        frame(60, 190, 370, 430, -2, { style: 'polaroid' }),
        frame(470, 200, 370, 430, 2, { style: 'polaroid' }),
        frame(60, 660, 370, 430, 2, { style: 'polaroid' }),
        frame(470, 670, 370, 430, -2, { style: 'polaroid' }),
        themed(250, 1124, 400, 'knits', -1),
      ],
    }),
  },
];
