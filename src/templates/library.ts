import { LOCALE } from '../domain/dates';
import { pinFor } from '../domain/newYear';
import { BG_COLORS, type Page, type PageElement } from '../domain/pages';
import type { BuiltInTemplate, TemplateContext } from './kit';
import { planningTemplates } from './subjects/planning';
import { foodTemplates } from './subjects/food';
import { moodTemplates } from './subjects/mood';
import { sleepTemplates } from './subjects/sleep';
import { sportsAndFitnessTemplates } from './subjects/sports-and-fitness';
import { waterTemplates } from './subjects/water';
import { booksTemplates } from './subjects/books';
import { goalsTemplates } from './subjects/goals';
import { gratitudeTemplates } from './subjects/gratitude';
import { memoriesTemplates } from './subjects/memories';
import { moneyTemplates } from './subjects/money';
import { habitsTemplates } from './subjects/habits';
import { bucketListsTemplates } from './subjects/bucket-lists';
import { yearlyBingoTemplates } from './subjects/yearly-bingo';
import { birthdaysTemplates } from './subjects/birthdays';
import { alphabetChallengeTemplates } from './subjects/alphabet-challenge';
import { bookBingoTemplates } from './subjects/book-bingo';
import { movieChallengeTemplates } from './subjects/movie-challenge';
import { seriesTemplates } from './subjects/series';
import { dreamsTemplates } from './subjects/dreams';
import { weatherTemplates } from './subjects/weather';
import { temperatureTemplates } from './subjects/temperature';
import { selfCareTemplates } from './subjects/self-care';
import { travelTemplates } from './subjects/travel';
import { homeTemplates } from './subjects/home';
import { familyTemplates } from './subjects/family';
import { holidaysTemplates } from './subjects/holidays';
import { monthsTemplates } from './subjects/months';
import { bookReviewsTemplates } from './subjects/book-reviews';
import { challengesTemplates } from './subjects/challenges';
import { studyTemplates } from './subjects/study';
import { languageLearningTemplates } from './subjects/language-learning';
import { plantsTemplates } from './subjects/plants';
import { mindsetTemplates } from './subjects/mindset';
import { bulletJournalTemplates } from './subjects/bullet-journal';
import { recipesTemplates } from './subjects/recipes';
import { petsTemplates } from './subjects/pets';
import { kidsTemplates } from './subjects/kids';
import { relationshipTemplates } from './subjects/relationship';
import { musicAndPodcastsTemplates } from './subjects/music-and-podcasts';
import { hobbiesAndCraftsTemplates } from './subjects/hobbies-and-crafts';
import { friendsTemplates } from './subjects/friends';
import { quotesTemplates } from './subjects/quotes';
import { yearInReviewTemplates } from './subjects/year-in-review';
import { wishlistTemplates } from './subjects/wishlist';
import { eventsAndPartiesTemplates } from './subjects/events-and-parties';
import { productivityTemplates } from './subjects/productivity';
import { scrapbookTemplates } from './subjects/scrapbook';
import { dividersTemplates } from './subjects/dividers';
import { newYearTemplates } from './subjects/new-year';

// Every ready-made template, in the order of the subjects. The app loads this
// file (and with it all the templates) only when templates are shown or used.

export type { BuiltInTemplate, TemplateContext } from './kit';

export const BUILT_IN_TEMPLATES: BuiltInTemplate[] = [
  ...planningTemplates,
  ...foodTemplates,
  ...moodTemplates,
  ...sleepTemplates,
  ...sportsAndFitnessTemplates,
  ...waterTemplates,
  ...booksTemplates,
  ...goalsTemplates,
  ...gratitudeTemplates,
  ...memoriesTemplates,
  ...moneyTemplates,
  ...habitsTemplates,
  ...bucketListsTemplates,
  ...yearlyBingoTemplates,
  ...birthdaysTemplates,
  ...alphabetChallengeTemplates,
  ...bookBingoTemplates,
  ...movieChallengeTemplates,
  ...seriesTemplates,
  ...dreamsTemplates,
  ...weatherTemplates,
  ...temperatureTemplates,
  ...selfCareTemplates,
  ...travelTemplates,
  ...homeTemplates,
  ...familyTemplates,
  ...holidaysTemplates,
  ...monthsTemplates,
  ...bookReviewsTemplates,
  ...challengesTemplates,
  ...studyTemplates,
  ...languageLearningTemplates,
  ...plantsTemplates,
  ...mindsetTemplates,
  ...bulletJournalTemplates,
  ...recipesTemplates,
  ...petsTemplates,
  ...kidsTemplates,
  ...relationshipTemplates,
  ...musicAndPodcastsTemplates,
  ...hobbiesAndCraftsTemplates,
  ...friendsTemplates,
  ...quotesTemplates,
  ...yearInReviewTemplates,
  ...wishlistTemplates,
  ...eventsAndPartiesTemplates,
  ...productivityTemplates,
  ...scrapbookTemplates,
  ...dividersTemplates,
  ...newYearTemplates,
];

/** A complete page from a template. Use `createPage(…, from: thisPage)` to save it. */
export function buildTemplatePage(t: BuiltInTemplate, ctx: TemplateContext): Page {
  const built = t.build(ctx);
  const now = new Date().toISOString();
  // a page for a year or a month shows that period's data: its tracker parts open there
  const pin = pinFor(t.asks, ctx);
  const elements = pin ? built.elements.map((el): PageElement => (el.type === 'tracker' && el.year === undefined ? { ...el, ...pin } : el)) : built.elements;
  return {
    id: `template-${t.id}`,
    // a page for a year or a month says which one in its title, so twelve monthly pages can be told apart
    title: t.asks === 'year' ? `${t.name} ${ctx.year}` : t.asks === 'month' ? `${t.name}: ${ctx.month.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' })}` : t.name,
    size: t.size,
    background: built.background ?? { color: BG_COLORS[0], pattern: 'dots' },
    elements,
    isTemplate: false,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
  };
}
