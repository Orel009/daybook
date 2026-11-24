import { art, blank, list, month, monthName, paper, sub, table, themed, title, track, weekDays, weekStart, write, type BuiltInTemplate } from '../kit';

// Mood: ready-made pages.

export const moodTemplates: BuiltInTemplate[] = [
  {
    id: 'mood',
    subject: 'Mood',
    name: 'Mood journal',
    description: 'Your mood tracker beside space to write about the day.',
    size: 'portrait',
    needs: ['Mood'],
    build: (ctx) => ({
      background: paper(8),
      elements: [
        title(60, 56, 620, 'Mood journal'),
        art(724, 56, 120, 'cloud', 'sky', -6),
        track(60, 210, 470, ctx.tracker('Mood')),
        write(560, 210, 280, 340, 'Today I feel', 'rose'),
        write(560, 570, 280, 340, 'What helped', 'mint'),
        write(560, 930, 280, 220, 'For tomorrow', 'butter'),
      ],
    }),
  },
  {
    id: 'mood-pixels',
    asks: 'year',
    subject: 'Mood',
    name: 'Mood, year in pixels',
    description: 'One square for every day of the year, each mood in its own colour.',
    size: 'portrait',
    needs: ['Mood'],
    build: (ctx) => ({
      background: paper(1),
      elements: [
        title(60, 44, 760, `${ctx.year} in pixels`),
        themed(600, 72, 240, 'smileys', 4),
        track(60, 160, 780, ctx.tracker('Mood'), { look: 'pixels', full: true }),
      ],
    }),
  },
  {
    id: 'mood-checkin',
    subject: 'Mood',
    name: 'Mood check-in',
    description: 'Your mood tracker, what affected it, and what you need.',
    size: 'portrait',
    needs: ['Mood'],
    build: (ctx) => ({
      background: paper(2),
      elements: [
        title(60, 56, 620, 'Check-in'),
        art(724, 50, 124, 'heart', 'rose', -8),
        track(60, 210, 420, ctx.tracker('Mood'), { look: 'pixels' }),
        list(510, 210, 330, 'What affected it', 'lilac', ['Sleep', 'Food', 'People', 'Weather', 'Work']),
        write(510, 606, 330, 300, 'What I need', 'rose'),
        write(60, 930, 780, 220, 'One thing I can do', 'butter'),
      ],
    }),
  },
  {
    id: 'mood-week',
    subject: 'Mood',
    name: 'Mood week',
    description: 'Mood, energy and why, day by day, beside your mood tracker.',
    size: 'landscape',
    needs: ['Mood'],
    build: (ctx) => ({
      background: paper(2),
      elements: [
        title(50, 30, 700, 'Mood week'),
        sub(54, 132, 600, `Week of ${weekStart(ctx)}`),
        table(50, 190, 700, 660, '', 'rose', ['Mood', 'Energy 1 to 5', 'Why'], weekDays(ctx)),
        track(780, 150, 370, ctx.tracker('Mood'), { look: 'calendar' }),
      ],
    }),
  },
  {
    id: 'name-the-feeling',
    subject: 'Mood',
    name: 'Name the feeling',
    description: 'Tick the words that fit today, then write about what happened and what you need.',
    size: 'portrait',
    build: () => ({
      background: paper(8),
      elements: [
        title(60, 50, 700, 'Name the feeling'),
        sub(62, 150, 700, 'Tick every word that fits today.'),
        art(744, 46, 100, 'speech', 'lilac', 6),
        list(60, 210, 250, 'Happy', 'butter', ['Excited', 'Proud', 'Grateful']),
        list(325, 210, 250, 'Calm', 'mint', ['Relaxed', 'Content', 'Safe']),
        list(590, 210, 250, 'Sad', 'blue', ['Lonely', 'Let down', 'Tired']),
        list(60, 490, 250, 'Worried', 'lilac', ['Nervous', 'Overwhelmed', 'Unsure']),
        list(325, 490, 250, 'Angry', 'coral', ['Frustrated', 'Annoyed', 'Jealous']),
        list(590, 490, 250, 'Something else', 'sage', 3),
        write(60, 790, 380, 360, 'What happened', 'rose'),
        write(460, 790, 380, 360, 'What I need right now', 'sky'),
      ],
    }),
  },
  {
    id: 'mood-month-notes',
    subject: 'Mood',
    name: 'Mood month',
    description: 'A word or colour for every day of the month, a key, and the patterns you notice.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(1),
      elements: [
        title(60, 50, 700, `${monthName(ctx.today)} moods`),
        themed(620, 156, 220, 'rainbows', 4),
        month(60, 196, 780, 630, 'lilac', ctx.today),
        table(60, 850, 380, 300, 'My key', 'butter', ['Word or colour', 'Feeling'], blank(5)),
        write(460, 850, 380, 300, 'Patterns I notice', 'mint'),
      ],
    }),
  },
];
