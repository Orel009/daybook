import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToday } from '../data/hooks';
import { useStore } from '../data/store';
import { LOCALE } from '../domain/dates';
import { defaultMonth, defaultYear, EVERYTHING, MONTH_GOAL_STYLES, monthChoices, monthKey, monthToSetUp, planForMonth, planForYear, showsNewMonthCard, YEAR_GOAL_STYLES, yearChoices, type MonthGoalStyle, type YearPlanChoice } from '../domain/newYear';
import type { BuiltInTemplate } from '../templates/kit';
import { makePlanned } from '../templates/make';
import { ownTracker } from '../templates/trackers';
import { Sheet } from '../ui/Sheet';

// Pages for a year or a month: asking which one, setting up a whole new year
// in one go, and Home's offer to set up a new month. Nothing here makes a
// page until its button is pressed.

const monthAndYear = (d: Date) => d.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' });
const monthOnly = (d: Date) => d.toLocaleDateString(LOCALE, { month: 'long' });

/** "For which year?" or "For which month?", before a page that shows one is made. */
export function WhenSheet({ template, onMake, onClose }: { template: BuiltInTemplate; onMake: (when: { year?: number; month?: Date }) => void; onClose: () => void }) {
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(defaultYear(today));
  const [month, setMonth] = useState(monthKey(defaultMonth(today)));
  const months = monthChoices(today);
  const byYear = template.asks === 'year';
  return (
    <Sheet
      title={byYear ? 'For which year?' : 'For which month?'}
      onClose={onClose}
      footer={
        <button className="btn btn-primary" onClick={() => onMake(byYear ? { year } : { month: months.find((m) => monthKey(m) === month) ?? defaultMonth(today) })}>
          Make the page
        </button>
      }
    >
      <p>
        <strong>{template.name}</strong> {byYear ? 'is a page for one year. The year is written on the page when it is made.' : 'is a page for one month. The month is written on the page when it is made.'}
      </p>
      {byYear ? (
        <div className="seg" role="radiogroup" aria-label="Year">
          {yearChoices(today).map((y) => (
            <button key={y} role="radio" aria-checked={year === y} className={year === y ? 'is-on' : ''} onClick={() => setYear(y)}>
              {y}
            </button>
          ))}
        </div>
      ) : (
        <div className="chips" role="radiogroup" aria-label="Month">
          {months.map((m) => (
            <button key={monthKey(m)} role="radio" aria-checked={month === monthKey(m)} className={`chip ${month === monthKey(m) ? 'is-on' : ''}`} onClick={() => setMonth(monthKey(m))}>
              {monthAndYear(m)}
            </button>
          ))}
        </div>
      )}
    </Sheet>
  );
}

const Tick = ({ on, onChange, children }: { on: boolean; onChange: (on: boolean) => void; children: React.ReactNode }) => (
  <label className="tick-row">
    <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} />
    <span>{children}</span>
  </label>
);

/** "Set up <year>": tick what to make, pick the styles, and make it all in one go. */
export function SetUpYearSheet({ year, onClose }: { year: number; onClose: () => void }) {
  const trackers = useStore((s) => s.trackers);
  const [choice, setChoice] = useState<YearPlanChoice>(EVERYTHING);
  // her own Mood tracker, if she has one: the Mood page uses it rather than adding a second one
  const moodTracker = ownTracker(trackers, 'Mood');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ pages: number; moodAdded: boolean; moodUsed: boolean } | null>(null);
  const set = (patch: Partial<YearPlanChoice>) => setChoice({ ...choice, ...patch });
  const plan = planForYear(year, choice);

  const create = async () => {
    setBusy(true);
    const before = useStore.getState().trackers.length;
    const made = await makePlanned(plan);
    setBusy(false);
    setDone({ pages: made.length, moodAdded: choice.mood && useStore.getState().trackers.length > before, moodUsed: choice.mood && Boolean(moodTracker) });
  };

  if (done) {
    return (
      <Sheet
        title={`${year} is set up`}
        onClose={onClose}
        footer={
          <>
            <button className="btn btn-quiet" onClick={onClose}>
              Close
            </button>
            <Link className="btn btn-primary" to="/book" onClick={onClose}>
              See them in the book
            </Link>
          </>
        }
      >
        <p role="status">
          {done.pages} page{done.pages === 1 ? ' is' : 's are'} now at the end of your book, in order.
          {done.moodUsed && ' The Mood year in pixels uses your Mood tracker.'}
          {done.moodAdded && ' A Mood tracker was added to fill in the year in pixels.'}
        </p>
        <p className="muted">You can move them with "Arrange pages", and change or remove any of them like every other page.</p>
      </Sheet>
    );
  }

  return (
    <Sheet
      title={`Set up ${year}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-quiet" onClick={onClose}>
            Not now
          </button>
          <button className="btn btn-primary" onClick={() => void create()} disabled={busy || plan.length === 0}>
            {busy ? 'Making…' : plan.length === 0 ? 'Nothing ticked' : `Create ${plan.length} page${plan.length === 1 ? '' : 's'}`}
          </button>
        </>
      }
    >
      <p>Tick the pages you want for {year}. They are added to the end of your book in this order. Nothing is made until you press the button.</p>
      <div className="tick-list">
        <Tick on={choice.divider} onChange={(divider) => set({ divider })}>
          A divider page with {year} in large numbers
        </Tick>
        <Tick on={choice.goals} onChange={(goals) => set({ goals })}>
          Yearly goals
        </Tick>
        {choice.goals && (
          <div className="seg seg-small seg-wrap tick-sub" role="radiogroup" aria-label="Style of the yearly goals">
            {YEAR_GOAL_STYLES.map((s) => (
              <button key={s.id} role="radio" aria-checked={choice.goalStyle === s.id} className={choice.goalStyle === s.id ? 'is-on' : ''} onClick={() => set({ goalStyle: s.id })}>
                {s.name}
              </button>
            ))}
          </div>
        )}
        <Tick on={choice.word} onChange={(word) => set({ word })}>
          Word of the year
        </Tick>
        <Tick on={choice.glance} onChange={(glance) => set({ glance })}>
          Year at a glance (twelve small calendars)
        </Tick>
        <Tick on={choice.bingo} onChange={(bingo) => set({ bingo })}>
          Year bingo
        </Tick>
        <Tick on={choice.mood} onChange={(mood) => set({ mood })}>
          Mood, {year} in pixels{' '}
          <small className="muted">{moodTracker ? `(uses your ${moodTracker.name} tracker)` : '(adds a Mood tracker to fill it in)'}</small>
        </Tick>
        <Tick on={choice.months} onChange={(months) => set({ months })}>
          Twelve monthly goals pages, January to December
        </Tick>
        {choice.months && (
          <div className="seg seg-small seg-wrap tick-sub" role="radiogroup" aria-label="Style of the monthly goals">
            {MONTH_GOAL_STYLES.map((s) => (
              <button key={s.id} role="radio" aria-checked={choice.monthStyle === s.id} className={choice.monthStyle === s.id ? 'is-on' : ''} onClick={() => set({ monthStyle: s.id })}>
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  );
}

/**
 * Home, in the first seven days of a month: a gentle offer to make that
 * month's cover and goals page. It can be dismissed for the month, and
 * switched off for good in Settings.
 */
export function NewMonthCard() {
  const todayKey = useToday();
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const today = useMemo(() => new Date(), [todayKey]);
  const [style, setStyle] = useState<MonthGoalStyle>('goals');
  const [busy, setBusy] = useState(false);
  const [made, setMade] = useState<{ month: string; coverId: string } | null>(null);
  const month = monthToSetUp(today);

  if (made) {
    return (
      <section className="card new-month" aria-label="New month" role="status">
        <p>
          <strong>{made.month} is set up.</strong> Its cover and goals page are at the end of your book.
        </p>
        <div className="inline">
          <Link className="btn btn-primary btn-small" to={`/journal/${made.coverId}`}>
            Open the cover
          </Link>
          <button className="btn btn-quiet btn-small" onClick={() => setMade(null)}>
            Close
          </button>
        </div>
      </section>
    );
  }
  if (!month || !showsNewMonthCard(today, settings)) return null;
  const name = monthOnly(month);
  const setUp = async () => {
    setBusy(true);
    const pages = await makePlanned(planForMonth(month, style));
    updateSettings({ dismissedMonth: monthKey(month) });
    setBusy(false);
    if (pages[0]) setMade({ month: name, coverId: pages[0].id });
  };
  return (
    <section className="card new-month" aria-label="New month">
      <h2>New month: set up {name}</h2>
      <p className="muted">Makes {name}'s cover page and a goals page, at the end of your book.</p>
      <div className="seg seg-small seg-wrap" role="radiogroup" aria-label="Style of the goals page">
        {MONTH_GOAL_STYLES.map((s) => (
          <button key={s.id} role="radio" aria-checked={style === s.id} className={style === s.id ? 'is-on' : ''} onClick={() => setStyle(s.id)}>
            {s.name}
          </button>
        ))}
      </div>
      <div className="inline">
        <button className="btn btn-primary" onClick={() => void setUp()} disabled={busy}>
          {busy ? 'Making…' : `Set up ${name}`}
        </button>
        <button className="btn btn-quiet" onClick={() => updateSettings({ dismissedMonth: monthKey(month) })}>
          Not this month
        </button>
      </div>
    </section>
  );
}
