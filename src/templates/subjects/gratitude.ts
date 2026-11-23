import { type TapePattern } from '../../domain/pages';
import { art, list, longDate, month, paper, sub, tape, title, weekDays, weekStart, write, type BuiltInTemplate } from '../kit';

// Gratitude: ready-made pages.

export const gratitudeTemplates: BuiltInTemplate[] = [
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
];
