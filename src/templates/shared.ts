import type { TapePattern } from '../domain/pages';

// Data that several subjects use: the seasons and their look, and prompts for bingo cards.

export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export const seasonOf = (d: Date): Season => (['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'fall', 'fall', 'fall', 'winter'] as const)[d.getMonth()];
/** The year a yearly page is for: next year from October on. */
export const planYear = (d: Date) => (d.getMonth() >= 9 ? d.getFullYear() + 1 : d.getFullYear());
export const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);

export const SEASON_LOOK: Record<Season, { name: string; paper: number; colors: [string, string, string]; art: [string, string, string]; tape: [TapePattern, TapePattern] }> = {
  spring: { name: 'Spring', paper: 5, colors: ['rose', 'mint', 'lilac'], art: ['tulip', 'butterfly', 'umbrella'], tape: ['flowers', 'gingham'] },
  summer: { name: 'Summer', paper: 4, colors: ['butter', 'sky', 'coral'], art: ['sun', 'icecream', 'watermelon'], tape: ['waves', 'stripes'] },
  fall: { name: 'Fall', paper: 3, colors: ['orange', 'tan', 'coral'], art: ['maple', 'pumpkin', 'acorn'], tape: ['leaves', 'gingham'] },
  winter: { name: 'Winter', paper: 7, colors: ['sky', 'lilac', 'teal'], art: ['snowflake', 'snowman', 'mitten'], tape: ['snow', 'dots'] },
};

export const BUCKET_IDEAS: Record<Season, [string[], string[]]> = {
  spring: [['Plant seeds', 'Picnic in the park', 'Pick wildflowers'], ['Spring clean one room', 'Bake with lemons', 'Fly a kite']],
  summer: [['Swim outside', 'Watch a sunset', 'Eat ice cream on a pier'], ['Night under the stars', 'Outdoor film', 'Make lemonade']],
  fall: [['Jump in a pile of leaves', 'Visit an orchard', 'Long autumn walk'], ['Bake an apple pie', 'Cosy reading day', 'Make soup from scratch']],
  winter: [['Build a snowman', 'Go ice skating', 'Visit a winter market'], ['Board game night', 'Hot chocolate bar', 'Movie marathon']],
};

export const SEASON_BINGO: Record<Season, string[]> = {
  spring: ['Plant something', 'Picnic', 'Spot a butterfly', 'Fresh flowers at home', 'Spring clean a drawer', 'Walk in the rain', 'Visit a garden', 'Fly a kite', 'Eat outside', 'Sunrise walk', 'Cook with greens', 'Open every window', 'Bike ride', 'Visit a market', 'Pick wildflowers', 'Write a letter'],
  summer: ['Swim outside', 'Ice cream', 'Watch a sunset', 'Beach day', 'Read in a hammock', 'Night under the stars', 'Pick fruit', 'Outdoor film', 'Make lemonade', 'Walk barefoot', 'Day trip', 'Camping', 'Water fight', 'Festival', 'Picnic dinner', 'Photo of the sea'],
  fall: ['Jump in leaves', 'Bake with apples', 'Hot chocolate', 'Pumpkin patch', 'Cosy reading day', 'Wear a scarf', 'Collect acorns', 'Soup night', 'Autumn walk', 'Light a candle', 'Spooky film', 'Knit or craft', 'Visit an orchard', 'Red leaves photo', 'Make a playlist', 'Sunday roast'],
  winter: ['Build a snowman', 'Hot bath', 'Board game night', 'First snow', 'Bake cookies', 'Ice skating', 'Warm spiced drink', 'Winter walk', 'Movie marathon', 'Write a card', 'Make soup', 'Fairy lights', 'Winter market', 'Sledging', 'Pyjama day', 'Look at the stars'],
};

export const BOOK_BINGO = {
  cosy: ['A blue cover', 'Set in another country', 'From the year you were born', 'A re-read', 'Recommended by a friend', 'Under 200 pages', 'A debut', 'Set in a small town', 'Has a recipe in it', 'A rainy-day read', 'Features a bookshop', 'Has a map inside', 'A cosy mystery', 'Set in winter', 'About friendship', 'A title with a colour', 'A book you got as a gift', 'Set by the sea', 'An animal on the cover', 'Unread from your shelf', 'A love story', 'A comfort read', 'Translated', 'A book about food'],
  adventure: ['Set on another continent', 'A journey or quest', 'Over 500 pages', 'A survival story', 'Set at sea', 'A fantasy world', 'Based on a true story', 'Has a map', 'A road trip', 'Set in the mountains', 'A heist', 'Historical adventure', 'Translated', 'A dragon', 'A treasure hunt', 'First in a series'],
  summer: ['Read outside', 'A beach read', 'Set in summer', 'Finished in a day', 'A yellow cover', 'Set on an island', 'A holiday romance', 'A thriller', 'Recommended by a friend', 'From a holiday bookshop', 'A summer-camp story', 'An audiobook on a walk', 'Under 200 pages', 'Fruit on the cover', 'Set in Italy', 'Coming of age'],
  classic: ['Published before 1900', 'A Russian classic', 'Austen or a Brontë', 'Read at school', 'A classic play', 'Poetry', 'Over 600 pages', 'A gothic novel', 'An adventure classic', 'From your country', 'A dystopian classic', 'Translated from French', 'A Victorian novel', 'A Nobel Prize winner', "A children's classic", 'A war novel', 'By a woman, before 1950', 'Short stories', 'A classic mystery', 'Set in Paris', 'A novella', 'Older than your grandparents', 'A classic love story', 'Re-read a classic'],
};

export const GENRES = ['Comedy', 'Horror', 'Documentary', 'Animated', 'Musical', 'Foreign language', 'True story', 'Romance', 'Sci-fi', 'Classic before 1980', 'Thriller', 'Fantasy', 'Western', 'Family film', 'Award winner', 'From your birth year'];

/** A centre spot for the free tile of a 5×5 card. */
export const withFree = (prompts: string[]) => [...prompts.slice(0, 12), '', ...prompts.slice(12, 24)];
