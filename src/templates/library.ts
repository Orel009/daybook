import { BG_COLORS, type Page } from '../domain/pages';
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
import { dividersTemplates } from './subjects/dividers';

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
  ...dividersTemplates,
];

/** A complete page from a template. Use `createPage(…, from: thisPage)` to save it. */
export function buildTemplatePage(t: BuiltInTemplate, ctx: TemplateContext): Page {
  const built = t.build(ctx);
  const now = new Date().toISOString();
  return {
    id: `template-${t.id}`,
    title: t.name,
    size: t.size,
    background: built.background ?? { color: BG_COLORS[0], pattern: 'dots' },
    elements: built.elements,
    isTemplate: false,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
  };
}
