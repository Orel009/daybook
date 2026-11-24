import { art, list, paper, photoSpot, shortDays, table, tape, themed, title, track, write, type BuiltInTemplate } from '../kit';

// Self-care: ready-made pages.

export const selfCareTemplates: BuiltInTemplate[] = [
  {
    id: 'selfcare-checklist',
    subject: 'Self-care',
    name: 'Self-care checklist',
    description: 'Small things for body, mind and space to tick off, and a note on how you feel.',
    size: 'portrait',
    build: () => ({
      background: paper(2, 'dots'),
      elements: [
        themed(56, 44, 220, 'bubbles'),
        title(60, 62, 620, 'Self-care', {}),
        art(724, 44, 126, 'heart', 'rose', 6),
        list(60, 200, 380, 'Body', 'rose', ['Drink water', 'Move for 20 minutes', 'Eat something green', 'Stretch']),
        list(460, 200, 380, 'Mind', 'lilac', ['Five quiet minutes', 'Write it down', 'Read for fun', 'Phone off early']),
        list(60, 560, 380, 'Space', 'mint', ['Make the bed', 'Open a window', 'Tidy one corner', 'Fresh flowers']),
        list(460, 560, 380, 'People', 'peach', ['Message a friend', 'Say no to one thing', 'Ask for help']),
        write(60, 920, 780, 230, 'How I feel today', 'butter'),
      ],
    }),
  },
  {
    id: 'selfcare-menu',
    subject: 'Self-care',
    name: 'Self-care menu',
    description: 'Ideas sorted by the time you have: five minutes, half an hour, an hour.',
    size: 'landscape',
    build: () => ({
      background: paper(3, 'dots'),
      elements: [
        themed(50, 26, 220, 'coffee'),
        title(50, 40, 700, 'Self-care menu'),
        art(1040, 20, 110, 'mug', 'peach', 8),
        list(50, 170, 350, '5 minutes', 'butter', ['Deep breaths', 'A cup of tea', 'Favourite song', 'Stretch', 'Step outside']),
        list(425, 170, 350, '30 minutes', 'peach', ['A walk', 'A bath', 'Call someone', 'Read a chapter', 'Journal']),
        list(800, 170, 350, '1 hour', 'rose', ['Cook something nice', 'A long walk', 'A nap', 'Craft or paint', 'Yoga class']),
        write(50, 640, 1100, 210, 'My own ideas', 'mint'),
      ],
    }),
  },
  {
    id: 'selfcare-sunday',
    subject: 'Self-care',
    name: 'Self-care Sunday',
    description: 'A slow Sunday routine to tick, a photo spot, how you feel and a plan for the week.',
    size: 'portrait',
    build: () => ({
      background: paper(5, 'dots'),
      elements: [
        tape(56, 44, 240, 'mint', 'flowers'),
        title(60, 62, 620, 'Self-care Sunday', { size: 64 }),
        art(724, 44, 126, 'tulip', undefined, 6),
        list(60, 200, 380, 'Slow Sunday', 'mint', ['Sleep in', 'Long breakfast', 'Walk outside', 'Face mask', 'Plan the week']),
        ...photoSpot(480, 210, 350, 280, 2, 'rose', 'dots'),
        write(60, 600, 780, 250, 'How I feel', 'rose'),
        list(60, 880, 780, 'This week I will', 'sky', 3),
      ],
    }),
  },
  {
    id: 'selfcare-week',
    subject: 'Self-care',
    name: 'Self-care week',
    description: 'Your self-care tracker and a week grid of small things, ticked day by day.',
    size: 'landscape',
    needs: ['Self-care'],
    build: (ctx) => ({
      background: paper(2, 'grid'),
      elements: [
        tape(50, 26, 220, 'rose', 'hearts'),
        title(50, 40, 700, 'Self-care week'),
        art(1040, 20, 110, 'sparkle', 'butter', 6),
        table(50, 160, 780, 690, 'This week', 'rose', shortDays(ctx), ['Water', 'Move', 'Rest', 'Outside', 'Someone', 'Just me']),
        track(860, 160, 290, ctx.tracker('Self-care')),
      ],
    }),
  },
];
