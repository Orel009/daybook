import { art, blank, list, paper, sub, table, themed, title, track, weekDays, weekStart, write, type BuiltInTemplate } from '../kit';

// Sports and fitness: ready-made pages.

/** One page per sport: its tracker, something to work on, notes and a table of sessions. */
const sportLog = (id: string, name: string, preset: string, sticker: string, color: string, cols: string[], listTitle: string, items: number | string[]): BuiltInTemplate => ({
  id,
  subject: 'Sports and fitness',
  name,
  description: `Your ${preset.toLowerCase()} tracker, ${listTitle.toLowerCase()}, notes and a table of sessions.`,
  size: 'portrait',
  needs: [preset],
  build: (ctx) => ({
    elements: [
      title(60, 56, 620, name),
      art(724, 50, 124, sticker, color, 8),
      track(60, 210, 400, ctx.tracker(preset)),
      list(490, 210, 350, listTitle, color, items),
      write(490, 600, 350, 310, 'Notes', 'butter'),
      table(60, 940, 780, 210, 'Sessions', color, cols, blank(3)),
    ],
  }),
});

export const sportsAndFitnessTemplates: BuiltInTemplate[] = [
  {
    id: 'fitness',
    subject: 'Sports and fitness',
    name: 'Fitness planner',
    description: 'Plan each day’s workout and see your workout tracker alongside.',
    size: 'landscape',
    needs: ['Workout'],
    build: (ctx) => ({
      elements: [
        title(50, 30, 700, 'Fitness plan'),
        sub(54, 132, 600, `Week of ${weekStart(ctx)}`),
        art(560, 30, 120, 'dumbbell', 'sky', -10),
        table(50, 190, 620, 660, '', 'coral', ['Workout', 'Time', 'How it felt'], weekDays(ctx)),
        track(700, 150, 450, ctx.tracker('Workout')),
      ],
    }),
  },
  sportLog('running', 'Running log', 'Running', 'medal', 'orange', ['Date', 'Distance', 'Time', 'How it felt'], 'Goals', ['Run 5 km without stopping', 'Three runs a week', '']),
  sportLog('tennis', 'Tennis log', 'Tennis', 'tennis', 'lime', ['Date', 'Played with', 'Score', 'Notes'], 'Working on', ['Serve', 'Backhand', 'Footwork']),
  sportLog('cycling', 'Cycling log', 'Cycling', 'trophy', 'teal', ['Date', 'Route', 'Distance', 'Time'], 'Rides to try', 3),
  sportLog('swimming', 'Swimming log', 'Swimming', 'medal', 'blue', ['Date', 'Laps', 'Stroke', 'Time'], 'Goals', 3),
  sportLog('yoga', 'Yoga log', 'Yoga', 'daisy', 'lilac', ['Date', 'Class or video', 'Minutes', 'How I felt'], 'Poses to practise', 3),
  sportLog('strength', 'Strength log', 'Strength training', 'dumbbell', 'coral', ['Date', 'Exercise', 'Sets and reps', 'Weight'], 'Goals', 3),
  {
    id: 'stretching',
    subject: 'Sports and fitness',
    name: 'Stretching goals',
    description: 'A daily routine to tick off, goals to reach, and a four-week progress check.',
    size: 'portrait',
    needs: ['Stretching'],
    build: (ctx) => ({
      background: paper(6),
      elements: [
        title(60, 56, 700, 'Stretching goals'),
        themed(620, 150, 220, 'dumbbells', 4),
        track(60, 210, 400, ctx.tracker('Stretching')),
        list(490, 210, 350, 'Daily routine', 'mint', ['Neck rolls', 'Shoulders', 'Hamstrings', 'Hip opener', 'Child’s pose']),
        list(490, 606, 350, 'Goals', 'rose', ['Touch my toes', 'Deep squat for a minute', '']),
        table(60, 934, 780, 216, 'Progress check', 'sky', ['Week 1', 'Week 2', 'Week 3', 'Week 4'], ['Toe reach', 'Shoulders', 'Hips']),
      ],
    }),
  },
  sportLog('walking', 'Walking log', 'Walking', 'mountain', 'sage', ['Date', 'Steps', 'Route', 'With'], 'Routes to try', 3),
  {
    id: 'workout-week',
    subject: 'Sports and fitness',
    name: 'Weekly workout plan',
    description: 'One workout per day with minutes and a tick, plus a warm-up and how your body feels.',
    size: 'landscape',
    build: (ctx) => ({
      background: paper(7, 'grid'),
      elements: [
        title(50, 30, 700, 'Workout plan'),
        sub(54, 132, 600, `Week of ${weekStart(ctx)}`),
        art(1036, 30, 110, 'dumbbell', 'coral', -8),
        table(50, 190, 700, 660, '', 'coral', ['Workout', 'Minutes', 'Done'], weekDays(ctx)),
        list(780, 190, 370, 'Warm-up', 'butter', ['Jumping jacks', 'Arm circles', 'Leg swings']),
        write(780, 480, 370, 370, 'How my body feels', 'mint'),
      ],
    }),
  },
  {
    id: 'personal-bests',
    subject: 'Sports and fitness',
    name: 'Personal bests',
    description: 'Your best times and records, the next challenges and what you’re proud of.',
    size: 'portrait',
    build: () => ({
      background: paper(4),
      elements: [
        themed(60, 44, 240, 'sneakers', -3),
        title(60, 60, 640, 'Personal bests'),
        art(724, 40, 120, 'trophy', 'butter', 6),
        table(60, 200, 780, 520, '', 'butter', ['Activity', 'Best', 'Date'], ['5 km run', 'Longest walk', 'Plank', 'Push-ups', 'Swim laps', '', '']),
        list(60, 746, 380, 'Next challenges', 'rose', 4),
        write(460, 746, 380, 404, 'What I’m proud of', 'mint'),
      ],
    }),
  },
];
