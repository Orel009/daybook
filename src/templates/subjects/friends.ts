import { art, blank, frame, list, paper, table, themed, title, write, type BuiltInTemplate } from '../kit';

// Friends: who to catch up with, letters sent, and a page of photos and inside jokes.

export const friendsTemplates: BuiltInTemplate[] = [
  {
    id: 'friends-catch-up',
    subject: 'Friends',
    name: 'Catch-up list',
    description: 'Who you want to see, when you last did and an idea for next time.',
    size: 'portrait',
    build: () => ({
      background: paper(7),
      elements: [
        title(60, 50, 640, 'Catch up'),
        art(740, 40, 100, 'mug', 'rose', 6),
        table(60, 190, 780, 600, 'Who I want to see', 'sky', ['Friend', 'Last time', 'Idea for next time'], blank(9)),
        list(60, 820, 380, 'Message this week', 'mint', 4),
        write(460, 820, 380, 266, 'Something to tell them', 'butter'),
      ],
    }),
  },
  {
    id: 'friends-letters',
    subject: 'Friends',
    name: 'Letters sent',
    description: 'A post book: who you wrote to, when, what you sent and whether a reply came.',
    size: 'portrait',
    build: () => ({
      background: paper(2),
      elements: [
        title(60, 50, 640, 'Letters sent'),
        art(730, 40, 110, 'letter', 'rose', -6),
        table(60, 190, 780, 600, 'Post book', 'rose', ['To', 'Sent', 'What I sent', 'Reply'], blank(9)),
        list(60, 820, 380, 'To write to', 'lilac', 4),
        write(460, 820, 380, 266, 'Lovely post I received', 'butter'),
        themed(60, 1114, 420, 'airmail', -1),
      ],
    }),
  },
  {
    id: 'friends-memories',
    subject: 'Friends',
    name: 'Friends and memories',
    description: 'Two photos, inside jokes, why you love them and things to do together.',
    size: 'portrait',
    build: () => ({
      background: paper(4),
      elements: [
        title(60, 50, 640, 'With friends'),
        art(740, 40, 100, 'balloon', 'sky', 6),
        frame(60, 190, 370, 430, -2, { style: 'polaroid' }),
        frame(470, 200, 370, 290, 2, { style: 'rounded' }),
        write(470, 520, 370, 220, 'Inside jokes', 'butter'),
        write(60, 660, 380, 240, 'Why I love them', 'rose'),
        list(470, 770, 370, 'Things to do together', 'mint', 4),
        themed(60, 940, 380, 'party', -2),
      ],
    }),
  },
];
