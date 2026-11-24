import type { ThemedTape } from '../domain/tapes';
import type { TemplateSubject } from './subjects';

// The washi tapes that go with each template subject. A page made from a
// template remembers its subject, and the tape picker offers these first, as
// "For this page". To give a new subject its tapes, add a line here: the test
// fails if a subject has fewer than four.

export const SUBJECT_TAPES: Record<TemplateSubject, ThemedTape[]> = {
  Planning: ['calendars', 'checkmarks', 'measure', 'coffee', 'word-today'],
  Food: ['cutlery', 'lemons', 'strawberries', 'picnic', 'citrus', 'apples'],
  Mood: ['smileys', 'rainbows', 'clouds', 'weather', 'sweethearts'],
  Sleep: ['zzz', 'moons', 'starsmoons', 'clouds'],
  'Sports and fitness': ['dumbbells', 'sneakers', 'balls', 'medals'],
  Water: ['waterglasses', 'raindrops', 'seawaves', 'bubbles'],
  Books: ['books', 'bookspines', 'reading', 'coffee'],
  Goals: ['targets', 'checkmarks', 'medals', 'foil'],
  Gratitude: ['sweethearts', 'daisies', 'blossom', 'word-thankyou', 'loveletters'],
  Memories: ['polaroids', 'cameras', 'word-memories', 'kraft', 'travelstamps'],
  Money: ['coins', 'banknotes', 'piggybanks', 'foil'],
  Habits: ['checkmarks', 'targets', 'sprouts', 'medals'],
  'Bucket lists': ['journey', 'travelstamps', 'camping', 'starsmoons', 'cameras'],
  'Yearly bingo': ['fireworks', 'party', 'checkmarks', 'targets', 'foil'],
  Birthdays: ['cakes', 'balloons', 'gifts', 'party'],
  'Alphabet challenge': ['alphabet', 'blocks', 'pencils', 'checkmarks'],
  'Book bingo': ['bookspines', 'reading', 'books', 'checkmarks'],
  'Movie challenge': ['filmstrip', 'popcorn', 'tickets', 'lights'],
  Series: ['popcorn', 'filmstrip', 'tickets', 'lights'],
  Dreams: ['moons', 'starsmoons', 'clouds', 'zzz'],
  Weather: ['weather', 'suns', 'rainyday', 'snowflakes', 'clouds', 'raindrops'],
  Temperature: ['suns', 'snowflakes', 'weather', 'knits'],
  'Self-care': ['bubbles', 'coffee', 'blossom', 'sweethearts', 'lights'],
  Travel: ['travelstamps', 'airmail', 'journey', 'camping', 'cameras'],
  Home: ['houses', 'sprouts', 'coffee', 'tartan'],
  Family: ['houses', 'sweethearts', 'loveletters', 'polaroids', 'picnic'],
  Holidays: ['christmas', 'candycanes', 'holly', 'hanukkah', 'dreidels', 'fireworks'],
  Months: ['calendars', 'blossom', 'watermelons', 'autumnleaves', 'snowflakes'],
  'Book reviews': ['reading', 'bookspines', 'books', 'coffee'],
  Challenges: ['targets', 'checkmarks', 'medals', 'foil'],
  Study: ['pencils', 'paperclips', 'measure', 'books', 'crayons'],
  'Language learning': ['chat', 'alphabet', 'word-languages', 'pencils', 'word-hello'],
  Plants: ['sprouts', 'cacti', 'ferns', 'vine', 'eucalyptus'],
  Mindset: ['rainbows', 'butterflies', 'clouds', 'eucalyptus', 'smileys'],
  'Bullet journal': ['checkmarks', 'calendars', 'kraft', 'newspaper', 'measure'],
  Recipes: ['cutlery', 'lemons', 'picnic', 'citrus', 'strawberries'],
  Pets: ['paws', 'bones', 'fishes', 'cats', 'dogs'],
  Kids: ['blocks', 'teddies', 'crayons', 'balloons'],
  Relationship: ['sweethearts', 'loveletters', 'blossom', 'word-love'],
  'Music and podcasts': ['musicnotes', 'playlist', 'records', 'lights'],
  'Hobbies and crafts': ['buttons', 'knits', 'measure', 'crayons', 'terrazzo'],
  Friends: ['chat', 'coffee', 'party', 'sweethearts', 'polaroids'],
  Quotes: ['chat', 'newspaper', 'word-hello', 'kraft', 'doily'],
  'Year in review': ['fireworks', 'cameras', 'polaroids', 'foil', 'party'],
  Wishlist: ['gifts', 'sweethearts', 'starsmoons', 'foil'],
  'Events and parties': ['party', 'cakes', 'balloons', 'tickets', 'lights'],
  Productivity: ['checkmarks', 'targets', 'calendars', 'coffee', 'paperclips'],
  Scrapbook: ['polaroids', 'kraft', 'doily', 'newspaper', 'travelstamps', 'buttons'],
  Dividers: ['kraft', 'foil', 'doily', 'terrazzo'],
  'New year': ['fireworks', 'calendars', 'party', 'foil', 'targets'],
};

/** The tapes to offer first on a page of this subject (none for a subject of her own, or a page without one). */
export const tapesForSubject = (subject: string | undefined): ThemedTape[] => (subject ? ((SUBJECT_TAPES as Record<string, ThemedTape[]>)[subject] ?? []) : []);
