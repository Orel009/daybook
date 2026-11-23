// The subjects templates are sorted into, and the groups of subjects on the
// Templates screen. Small on purpose: this loads with the app, the templates
// themselves (library.ts) only when they are needed.

export const TEMPLATE_SUBJECTS = [
  'Planning', 'Food', 'Mood', 'Sleep', 'Sports and fitness', 'Water', 'Books', 'Goals', 'Gratitude', 'Memories', 'Money', 'Habits',
  'Bucket lists', 'Yearly bingo', 'Birthdays', 'Alphabet challenge', 'Book bingo', 'Movie challenge', 'Series', 'Dreams',
  'Weather', 'Temperature', 'Self-care', 'Travel', 'Home', 'Family', 'Holidays',
  'Months', 'Book reviews', 'Challenges', 'Study', 'Language learning', 'Plants', 'Mindset', 'Bullet journal',
  'Recipes', 'Pets', 'Kids', 'Relationship', 'Music and podcasts', 'Hobbies and crafts', 'Friends', 'Quotes',
  'Year in review', 'Wishlist', 'Events and parties', 'Productivity', 'Scrapbook', 'Dividers',
] as const;
export type TemplateSubject = (typeof TEMPLATE_SUBJECTS)[number];

/** Subjects in a few groups, so the subject chips stay short. Every subject is in exactly one. */
export const TEMPLATE_GROUPS: { name: string; subjects: TemplateSubject[] }[] = [
  { name: 'Plan', subjects: ['Planning', 'Productivity', 'Goals', 'Money', 'Travel', 'Events and parties', 'Holidays'] },
  { name: 'Track', subjects: ['Habits', 'Sleep', 'Water', 'Food', 'Sports and fitness', 'Weather', 'Temperature', 'Series'] },
  { name: 'Journal', subjects: ['Bullet journal', 'Birthdays', 'Quotes', 'Year in review'] },
  { name: 'Challenges', subjects: ['Challenges', 'Yearly bingo', 'Book bingo', 'Alphabet challenge', 'Movie challenge'] },
  { name: 'Lists', subjects: ['Bucket lists', 'Wishlist', 'Books', 'Book reviews', 'Music and podcasts'] },
  { name: 'Months', subjects: ['Months'] },
  { name: 'Learn', subjects: ['Study', 'Language learning'] },
  { name: 'Mind', subjects: ['Mindset', 'Mood', 'Self-care', 'Gratitude', 'Dreams'] },
  { name: 'Home and family', subjects: ['Home', 'Family', 'Kids', 'Pets', 'Plants', 'Recipes', 'Relationship', 'Friends'] },
  { name: 'Scrapbook', subjects: ['Scrapbook', 'Memories', 'Hobbies and crafts', 'Dividers'] },
];

/** How many ready-made templates there are, for screens that mention the number without loading them. */
export const TEMPLATE_COUNT = 258;
