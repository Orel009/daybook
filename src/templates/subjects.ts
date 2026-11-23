// The subjects templates are sorted into, and the groups of subjects on the
// Templates screen. Small on purpose: this loads with the app, the templates
// themselves (library.ts) only when they are needed.

export const TEMPLATE_SUBJECTS = [
  'Planning', 'Food', 'Mood', 'Sleep', 'Sports and fitness', 'Water', 'Books', 'Goals', 'Gratitude', 'Memories', 'Money', 'Habits',
  'Bucket lists', 'Yearly bingo', 'Birthdays', 'Alphabet challenge', 'Book bingo', 'Movie challenge', 'Series', 'Dreams',
  'Weather', 'Temperature', 'Self-care', 'Travel', 'Home', 'Family', 'Holidays', 'Dividers',
] as const;
export type TemplateSubject = (typeof TEMPLATE_SUBJECTS)[number];

/** Subjects in a few groups, so the subject chips stay short. */
export const TEMPLATE_GROUPS: { name: string; subjects: TemplateSubject[] }[] = [
  { name: 'Plan', subjects: ['Planning', 'Goals', 'Money', 'Travel', 'Home', 'Family', 'Holidays'] },
  { name: 'Track', subjects: ['Habits', 'Mood', 'Sleep', 'Dreams', 'Water', 'Food', 'Sports and fitness', 'Self-care', 'Weather', 'Temperature', 'Series'] },
  { name: 'Journal', subjects: ['Gratitude', 'Memories', 'Birthdays', 'Books', 'Dividers'] },
  { name: 'Challenges', subjects: ['Yearly bingo', 'Book bingo', 'Alphabet challenge', 'Movie challenge'] },
  { name: 'Lists', subjects: ['Bucket lists'] },
];
