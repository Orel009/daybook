import { art, blank, challenge, frame, list, paper, sticky, table, themed, title, write, type BuiltInTemplate } from '../kit';

// Relationship: date ideas, your story so far and an anniversary page.

export const relationshipTemplates: BuiltInTemplate[] = [
  {
    id: 'love-date-ideas',
    subject: 'Relationship',
    name: 'Date ideas',
    description: 'Twelve hearts to write date ideas on. Colour each one in when you have done it.',
    size: 'portrait',
    build: () => ({
      background: paper(2),
      elements: [
        title(60, 50, 640, 'Date ideas'),
        art(740, 40, 100, 'heart', 'rose', 8),
        challenge(60, 190, 780, 700, 'Colour a heart when we have done it', 'rose', 4, 12, { shape: 'heart' }),
        list(60, 920, 380, 'Stay-in ideas', 'lilac', 3),
        write(460, 920, 380, 216, 'Best date so far', 'butter'),
      ],
    }),
  },
  {
    id: 'love-our-story',
    subject: 'Relationship',
    name: 'Our story',
    description: 'A photo from then and one from now, how it went in between, and the moment you knew.',
    size: 'portrait',
    build: () => ({
      background: paper(3),
      elements: [
        title(60, 50, 640, 'Our story'),
        art(740, 40, 100, 'letter', 'rose', 6),
        frame(60, 200, 360, 400, -2, { style: 'polaroid', caption: 'Then' }),
        frame(470, 210, 370, 390, 2, { style: 'polaroid', caption: 'Now' }),
        themed(300, 180, 300, 'sweethearts', -2),
        table(60, 640, 780, 370, 'How it went', 'rose', ['When', 'What happened'], blank(5)),
        write(60, 1040, 780, 110, 'The moment I knew', 'butter', false),
      ],
    }),
  },
  {
    id: 'love-anniversary',
    subject: 'Relationship',
    name: 'Anniversary',
    description: 'One big photo, what this year held, what you love about them and plans for the next.',
    size: 'portrait',
    build: () => ({
      background: paper(8, 'plain'),
      elements: [
        title(60, 50, 640, 'Anniversary'),
        art(730, 40, 110, 'cake', 'rose', 6),
        frame(190, 200, 520, 470, -2, { style: 'polaroid' }),
        themed(340, 180, 220, 'loveletters', 2),
        write(60, 710, 380, 220, 'This year we', 'rose'),
        write(460, 710, 380, 220, 'I love that you', 'lilac'),
        list(60, 960, 380, 'Next year, together', 'butter', 3),
        sticky(480, 1000, 340, 'Here is to us', 'peach', 2),
      ],
    }),
  },
];
