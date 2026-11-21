import { addDays, formatLong, fromKey, startOfWeek, WEEKDAY_SHORT } from '../domain/dates';
import { formatAmount, isFlexible, isScheduled } from '../domain/stats';
import { registerVisualization, type VisualizationProps } from './registry';

const R = 52;
const CIRC = 2 * Math.PI * R;

/** A ring for today or this week, plus a bar for each day of the week. */
function ProgressViz({ tracker, days, today, weekStartsOn, config, onPickDay, onConfigChange, compact, editing }: VisualizationProps) {
  const period = config.period === 'week' ? 'week' : 'day';
  const start = startOfWeek(today, weekStartsOn);
  const week = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const amountType = ['number', 'duration', 'timeRange'].includes(tracker.valueType);
  const target = amountType ? tracker.target : undefined;
  const todaySummary = days.get(today);

  const plannedDays = isFlexible(tracker.schedule)
    ? Math.min(7, tracker.schedule.kind === 'perWeek' ? tracker.schedule.times : 7)
    : week.filter((d) => isScheduled(tracker, d)).length;
  const weekTotal = week.reduce((s, d) => s + (days.get(d)?.total ?? 0), 0);
  const weekDone = week.filter((d) => days.get(d)?.done).length;

  // ring value (null = no goal to measure against, show a plain counter)
  let ratio: number | null;
  let main: string;
  let sub: string;
  if (amountType) {
    const total = period === 'day' ? (todaySummary?.total ?? 0) : weekTotal;
    const goal = target ? (period === 'day' ? target : target * Math.max(1, plannedDays)) : 0;
    ratio = goal ? Math.min(1, total / goal) : null;
    // with a goal the unit is shown once, in the line below the number
    main = goal && tracker.valueType === 'number' ? String(Math.round(total * 100) / 100) : formatAmount(tracker, total);
    sub = goal ? `of ${formatAmount(tracker, goal)}` : period === 'day' ? 'today' : 'this week';
  } else if (period === 'day') {
    ratio = todaySummary?.done ? 1 : 0;
    main = todaySummary?.done ? 'Done' : 'Not yet';
    sub = 'today';
  } else {
    ratio = plannedDays ? Math.min(1, weekDone / plannedDays) : 0;
    main = `${weekDone} of ${plannedDays}`;
    sub = 'days this week';
  }

  const maxTotal = Math.max(target ?? 0, ...week.map((d) => days.get(d)?.total ?? 0), 1);

  return (
    <div className={`prog ${compact ? 'is-compact' : ''}`}>
      {editing && onConfigChange && (
        <div className="viz-options">
          <div className="seg seg-small" role="radiogroup" aria-label="Ring shows">
            {(['day', 'week'] as const).map((p) => (
              <button key={p} role="radio" aria-checked={period === p} className={period === p ? 'is-on' : ''} onClick={() => onConfigChange({ period: p })}>
                {p === 'day' ? 'Today' : 'This week'}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="prog-body">
        <div className="prog-ring" role="img" aria-label={`${main} ${sub}`}>
          <svg viewBox="0 0 140 140" aria-hidden="true">
            <circle cx="70" cy="70" r={R} className="ring-track" />
            {ratio !== null && (
              <circle
                cx="70"
                cy="70"
                r={R}
                className="ring-fill"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - ratio)}
                transform="rotate(-90 70 70)"
              />
            )}
          </svg>
          <div className="prog-center">
            <strong>{main}</strong>
            <span>{sub}</span>
          </div>
        </div>

        <div className="prog-bars" role="group" aria-label="This week, day by day">
          {week.map((d) => {
            const day = days.get(d);
            const future = d > today;
            const height = amountType ? (day?.total ?? 0) / maxTotal : day?.done ? 1 : 0;
            const label = amountType && day ? formatAmount(tracker, day.total) : day?.done ? 'done' : 'nothing logged';
            return (
              <button
                key={d}
                className={`prog-bar ${day?.done ? 'is-done' : ''} ${future ? 'is-future' : ''} ${d === today ? 'is-today' : ''}`}
                disabled={future || !onPickDay}
                onClick={() => onPickDay?.(d)}
                aria-label={`${formatLong(d)}: ${future ? 'not yet' : label}`}
              >
                <span className="prog-col">
                  <i style={{ height: `${Math.min(1, height) * 100}%` }} />
                </span>
                <small>{WEEKDAY_SHORT[fromKey(d).getDay()]}</small>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

registerVisualization({
  id: 'progress',
  name: 'Progress',
  icon: '🎯',
  description: 'A ring towards the goal and a bar for each day of the week.',
  supports: 'all',
  defaultConfig: { period: 'day' },
  Component: ProgressViz,
});
