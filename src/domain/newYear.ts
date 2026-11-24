// The rules for pages that belong to a year or a month: which year a yearly
// page is for when nobody says, when the "Plan <year>" collection shows, when
// Home offers to set up a new month, and what "Set up <year>" makes. Dates
// only, no screens, so every rule is tested (December into January, leap
// years) without waiting for the calendar.

const first = (year: number, month: number) => new Date(year, month, 1);

/** `YYYY-MM`, to remember a month by. */
export const monthKey = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export const isLeapYear = (year: number): boolean => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
export const daysInMonth = (year: number, month: number): number => new Date(year, month + 1, 0).getDate();

/**
 * The year a yearly page (goals, bingo, year in pixels…) is for when it is
 * made today: this year, or next year from November 1, when people start
 * planning ahead.
 */
export const defaultYear = (today: Date): number => today.getFullYear() + (today.getMonth() >= 10 ? 1 : 0);

/** The years offered when asking "For which year?": the one before the default, the default, and the one after. */
export const yearChoices = (today: Date): number[] => {
  const y = defaultYear(today);
  return [y - 1, y, y + 1];
};

/**
 * The month a monthly page (monthly goals) is for when it is made today: this
 * month, or next month once this one is nearly over (from the 24th).
 */
export const defaultMonth = (today: Date): Date => first(today.getFullYear(), today.getMonth() + (today.getDate() >= 24 ? 1 : 0));

/** The months offered when asking "For which month?": last month, this month and the eleven after. */
export const monthChoices = (today: Date): Date[] => Array.from({ length: 13 }, (_, i) => first(today.getFullYear(), today.getMonth() - 1 + i));

/**
 * The year the "Plan <year>" collection is for, or null outside its season.
 * It shows from December 1 (for next year) to January 31 (for the year that
 * has just begun).
 */
export const planningYear = (today: Date): number | null => (today.getMonth() === 11 ? today.getFullYear() + 1 : today.getMonth() === 0 ? today.getFullYear() : null);

/** The month Home offers to set up: the current one during its first seven days, otherwise none. */
export const monthToSetUp = (today: Date): Date | null => (today.getDate() <= 7 ? first(today.getFullYear(), today.getMonth()) : null);

/** Whether the "New month" card shows: in the first week, unless switched off or already dismissed for this month. */
export const showsNewMonthCard = (today: Date, settings: { newMonthCard?: boolean; dismissedMonth?: string }): boolean => {
  const month = monthToSetUp(today);
  return month !== null && settings.newMonthCard !== false && settings.dismissedMonth !== monthKey(month);
};

// ----- tracker parts on a page for a year or a month

/** The period a tracker part opens on: a day inside it, and whether it is a year or a month. */
export interface OpensOn {
  /** `YYYY-MM-DD`: today when today is inside the period, otherwise its first day. */
  date: string;
  span: 'year' | 'month';
}

const dayKey = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

/**
 * Where a tracker part on a page opens. A part pinned to a year or a month
 * (because its page was made for one) opens on that period; inside the
 * period it opens on today, so the current week and day still show. A part
 * without a pin follows the current date, as before: `undefined`.
 */
export function opensOn(part: { year?: number; month?: number }, today: string): OpensOn | undefined {
  if (part.year === undefined) return undefined;
  const [ty, tm] = today.split('-').map(Number);
  if (part.month === undefined) return { span: 'year', date: ty === part.year ? today : dayKey(part.year, 0, 1) };
  return { span: 'month', date: ty === part.year && tm - 1 === part.month ? today : dayKey(part.year, part.month, 1) };
}

/** The pin a page made for a year or a month gives its tracker parts. */
export const pinFor = (asks: 'year' | 'month' | undefined, when: { year: number; month: Date }): { year: number; month?: number } | undefined =>
  asks === 'year' ? { year: when.year } : asks === 'month' ? { year: when.month.getFullYear(), month: when.month.getMonth() } : undefined;

// ----- "Set up <year>"

export const YEAR_GOAL_STYLES = [
  { id: 'year-goals-areas', name: 'By life area' },
  { id: 'year-goals-12', name: '12 goals in 12 months' },
  { id: 'year-goals-steps', name: 'Goals with steps and deadlines' },
] as const;
export const MONTH_GOAL_STYLES = [
  { id: 'goals', name: 'Four areas of life' },
  { id: 'goals-month-focus', name: 'One focus and three goals' },
  { id: 'goals-month-weeks', name: 'Week by week' },
] as const;
export type YearGoalStyle = (typeof YEAR_GOAL_STYLES)[number]['id'];
export type MonthGoalStyle = (typeof MONTH_GOAL_STYLES)[number]['id'];

export interface YearPlanChoice {
  divider: boolean;
  goals: boolean;
  goalStyle: YearGoalStyle;
  word: boolean;
  glance: boolean;
  bingo: boolean;
  /** A Mood year-in-pixels page for the year (using her Mood tracker, or a new one if she has none). */
  mood: boolean;
  months: boolean;
  monthStyle: MonthGoalStyle;
}

export const EVERYTHING: YearPlanChoice = { divider: true, goals: true, goalStyle: 'year-goals-areas', word: true, glance: true, bingo: true, mood: true, months: true, monthStyle: 'goals' };

export interface PlannedPage {
  templateId: string;
  year: number;
  /** For the monthly pages: the first day of their month. */
  month?: Date;
}

/**
 * The pages "Set up <year>" makes for what is ticked, in the order they go
 * into the book: the divider, the yearly goals, the word of the year, the
 * year at a glance, the bingo, the Mood year in pixels, then the twelve
 * monthly goals pages from January to December.
 */
export function planForYear(year: number, c: YearPlanChoice): PlannedPage[] {
  const out: PlannedPage[] = [];
  if (c.divider) out.push({ templateId: 'divider-year', year });
  if (c.goals) out.push({ templateId: c.goalStyle, year });
  if (c.word) out.push({ templateId: 'year-word', year });
  if (c.glance) out.push({ templateId: 'year-glance', year });
  if (c.bingo) out.push({ templateId: 'year-bingo', year });
  if (c.mood) out.push({ templateId: 'mood-pixels', year });
  if (c.months) for (let m = 0; m < 12; m++) out.push({ templateId: c.monthStyle, year, month: first(year, m) });
  return out;
}

/** The two pages the "New month" card makes: that month's cover and its goals page. */
export function planForMonth(month: Date, style: MonthGoalStyle): PlannedPage[] {
  const slug = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'][month.getMonth()];
  return [
    { templateId: `month-${slug}-cover`, year: month.getFullYear(), month },
    { templateId: style, year: month.getFullYear(), month },
  ];
}
