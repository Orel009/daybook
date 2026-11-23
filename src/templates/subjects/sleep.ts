import { art, blank, list, month, paper, sub, table, title, track, weekDays, weekStart, write, type BuiltInTemplate } from '../kit';

// Sleep: ready-made pages.

export const sleepTemplates: BuiltInTemplate[] = [
  {
    id: 'sleep',
    subject: 'Sleep',
    name: 'Sleep journal',
    description: 'Your sleep tracker, a wind-down routine and a place for dreams.',
    size: 'portrait',
    needs: ['Sleep'],
    build: (ctx) => ({
      background: paper(8, 'plain'),
      elements: [
        title(60, 56, 620, 'Sleep journal'),
        art(724, 50, 124, 'sparkle', 'butter'),
        track(60, 210, 430, ctx.tracker('Sleep')),
        list(520, 210, 320, 'Wind-down', 'lilac', ['No screens', 'Warm drink', 'Read a little', 'Lights out']),
        write(520, 560, 320, 330, 'Dreams', 'sky'),
        write(60, 934, 780, 216, 'How I slept this week', 'butter'),
      ],
    }),
  },
  {
    id: 'sleep-log',
    subject: 'Sleep',
    name: 'Sleep log',
    description: 'Bedtime, wake-up, hours and how rested you felt, day by day.',
    size: 'landscape',
    build: (ctx) => ({
      background: paper(8),
      elements: [
        title(50, 30, 700, 'Sleep log'),
        sub(54, 132, 600, `Week of ${weekStart(ctx)}`),
        table(50, 190, 800, 660, '', 'lilac', ['Bedtime', 'Woke up', 'Hours', 'Rested?'], weekDays(ctx)),
        list(880, 190, 270, 'Helps me sleep', 'sky', 4),
        write(880, 540, 270, 310, 'Notes', 'butter'),
      ],
    }),
  },
  {
    id: 'routines',
    subject: 'Sleep',
    name: 'Evening and morning routine',
    description: 'Two checklists to bookend the day, and what to try next.',
    size: 'portrait',
    build: () => ({
      background: paper(8, 'plain'),
      elements: [
        title(60, 56, 620, 'Routines'),
        art(724, 46, 124, 'starlight', 'butter'),
        list(60, 210, 380, 'Evening', 'lilac', ['Tidy up', 'Tomorrow’s clothes', 'Wash and skincare', 'Read', 'Lights out']),
        list(460, 210, 380, 'Morning', 'butter', ['Water', 'Stretch', 'Breakfast', 'Plan the day', '']),
        write(60, 620, 780, 250, 'What works for me', 'mint'),
        write(60, 890, 780, 260, 'To try', 'sky'),
      ],
    }),
  },
  {
    id: 'sleep-month',
    subject: 'Sleep',
    name: 'Sleep month',
    description: 'Hours slept on every day of the month, and what helped or kept you up.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(8, 'plain'),
      elements: [
        title(60, 50, 700, 'Sleep this month'),
        art(736, 40, 110, 'starlight', 'butter'),
        month(60, 196, 780, 640, 'lilac', ctx.today),
        write(60, 866, 380, 284, 'What helped', 'mint'),
        write(460, 866, 380, 284, 'What kept me up', 'sky'),
      ],
    }),
  },
  {
    id: 'night-routine',
    subject: 'Sleep',
    name: 'Night-time routine',
    description: 'A calm dark page: an hour-before checklist, worries parked until morning, three good things.',
    size: 'portrait',
    build: () => ({
      background: paper(10, 'dots'),
      elements: [
        title(60, 50, 640, 'Winding down', { color: '#FFFFFF' }),
        title(62, 150, 640, 'Slow down, one step at a time.', { font: 'clean', size: 30, color: '#D9D2E3' }),
        art(720, 40, 120, 'starlight', 'butter', 4),
        art(660, 130, 56, 'sparkle', 'butter'),
        list(60, 214, 380, 'An hour before', 'lilac', ['Dim the lights', 'Phone on charge', 'Tidy one thing', 'Warm shower']),
        list(460, 214, 380, 'In bed', 'sky', ['Slow breaths', 'A few pages', 'Lights out']),
        write(60, 560, 780, 300, 'Worries parked until morning', 'butter'),
        write(60, 880, 780, 270, 'Three good things today', 'rose'),
      ],
    }),
  },
  {
    id: 'dream-journal',
    subject: 'Sleep',
    name: 'Dream journal',
    description: 'Write the dream down before it fades, with how you slept and what it might mean.',
    size: 'landscape',
    build: () => ({
      background: paper(8, 'dots'),
      elements: [
        title(50, 30, 700, 'Dream journal'),
        art(1040, 20, 110, 'cloud', 'lilac', -4),
        art(990, 80, 56, 'sparkle', 'butter'),
        write(50, 160, 700, 470, 'Last night I dreamed', 'lilac'),
        table(50, 650, 700, 200, 'How I slept', 'sky', ['Bedtime', 'Woke up', 'Rested?'], blank(1)),
        write(780, 160, 370, 330, 'How it felt', 'rose'),
        write(780, 510, 370, 340, 'What it might mean', 'mint'),
      ],
    }),
  },
];
