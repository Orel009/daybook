import { useEffect, useState, type ReactNode } from 'react';
import { addDays, addMonths, formatLong, formatMonth, fromKey, LOCALE, startOfMonth, startOfWeek, toKey, WEEKDAY_SHORT } from '../domain/dates';
import { dayColor, usesValueColors } from '../domain/colors';
import { formatDay } from '../domain/stats';
import type { DateKey } from '../domain/types';
import { ValueLegend } from './ValueLegend';
import { registerVisualization, type VisualizationProps } from './registry';

const RANGES = [
  { id: 'week', name: 'Week' },
  { id: 'month', name: 'Month' },
  { id: 'year', name: 'Year' },
] as const;
type RangeId = (typeof RANGES)[number]['id'];

const MONTH_LETTERS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dayMonth = (k: DateKey) => fromKey(k).toLocaleDateString(LOCALE, { month: 'short', day: 'numeric' });

/**
 * "Year in pixels": one square per day.
 *   Year  – months across, days 1–31 down
 *   Month – a week per row
 *   Week  – seven large squares
 * Trackers with a colour per answer (mood, ratings) use that colour; the rest
 * use the tracker colour, lighter for partly done days.
 */
function PixelViz({ tracker, days, today, weekStartsOn, config, onPickDay, onConfigChange, compact }: VisualizationProps) {
  const saved: RangeId = RANGES.some((r) => r.id === config.range) ? (config.range as RangeId) : 'year';
  const [range, setRange] = useState<RangeId>(saved);
  const [back, setBack] = useState(0); // how many periods before the current one
  useEffect(() => setRange(saved), [saved]);

  const choose = (r: RangeId) => {
    setRange(r);
    setBack(0);
    onConfigChange?.({ range: r });
  };

  const valued = usesValueColors(tracker);
  let shown = 0;
  let coloured = 0;

  const cell = (date: DateKey | null, key: string, label?: string) => {
    if (!date) return <span key={key} className="px-cell is-none" aria-hidden="true" />;
    const day = days.get(date);
    const future = date > today;
    const progress = day?.progress ?? 0;
    const level = day?.done ? 4 : progress > 0 ? Math.max(1, Math.ceil(progress * 3)) : 0;
    const color = dayColor(tracker, day);
    const summary = formatDay(tracker, day);
    if (!future) {
      shown++;
      if (level > 0) coloured++;
    }
    return (
      <button
        key={key}
        className={`px-cell level-${level} ${future ? 'is-future' : ''} ${date === today ? 'is-today' : ''}`}
        disabled={future || !onPickDay}
        onClick={() => onPickDay?.(date)}
        style={color ? { ['--tracker' as string]: color } : undefined}
        aria-label={`${formatLong(date)}${summary ? `, ${summary}` : ', nothing logged'}`}
      >
        {label}
      </button>
    );
  };

  let title: string;
  let grid: ReactNode;

  if (range === 'year') {
    const year = fromKey(today).getFullYear() - back;
    title = String(year);
    grid = (
      <div className="px-year" role="grid" aria-label={`${tracker.name}, ${year}`}>
        <span className="px-corner" aria-hidden="true" />
        {MONTH_LETTERS.map((m, i) => (
          <span key={i} className="px-head" title={MONTH_NAMES[i]} aria-hidden="true">
            {m}
          </span>
        ))}
        {Array.from({ length: 31 }, (_, d) => [
          <span key={`n${d}`} className="px-num" aria-hidden="true">
            {d + 1}
          </span>,
          ...MONTH_LETTERS.map((_, m) => {
            const exists = d + 1 <= new Date(year, m + 1, 0).getDate();
            return cell(exists ? toKey(new Date(year, m, d + 1)) : null, `${m}-${d}`);
          }),
        ])}
      </div>
    );
  } else if (range === 'month') {
    const first = addMonths(startOfMonth(today), -back);
    const length = new Date(fromKey(first).getFullYear(), fromKey(first).getMonth() + 1, 0).getDate();
    const lead = (fromKey(first).getDay() - weekStartsOn + 7) % 7;
    const slots = Array.from({ length: Math.ceil((lead + length) / 7) * 7 }, (_, i) => (i >= lead && i < lead + length ? addDays(first, i - lead) : null));
    title = formatMonth(first);
    grid = (
      <div className="px-month" role="grid" aria-label={`${tracker.name}, ${title}`}>
        {Array.from({ length: 7 }, (_, i) => (
          <span key={i} className="px-head" aria-hidden="true">
            {WEEKDAY_SHORT[(weekStartsOn + i) % 7]}
          </span>
        ))}
        {slots.map((d, i) => cell(d, String(i), d ? String(fromKey(d).getDate()) : undefined))}
      </div>
    );
  } else {
    const start = addDays(startOfWeek(today, weekStartsOn), -7 * back);
    const week = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    title = `${dayMonth(week[0])} to ${dayMonth(week[6])}`;
    grid = (
      <div className="px-week" role="grid" aria-label={`${tracker.name}, week of ${dayMonth(week[0])}`}>
        {week.map((d) => (
          <span key={`h${d}`} className="px-head" aria-hidden="true">
            {WEEKDAY_SHORT[fromKey(d).getDay()]}
          </span>
        ))}
        {week.map((d) => cell(d, d, String(fromKey(d).getDate())))}
      </div>
    );
  }

  return (
    <div className={`px px-is-${range} ${compact ? 'is-compact' : ''}`}>
      {!compact && (
        <div className="px-bar">
          <div className="seg seg-small px-ranges" role="radiogroup" aria-label="Show">
            {RANGES.map((r) => (
              <button type="button" key={r.id} role="radio" aria-checked={range === r.id} className={range === r.id ? 'is-on' : ''} onClick={() => choose(r.id)}>
                {r.name}
              </button>
            ))}
          </div>
          <div className="px-nav">
            <button type="button" className="icon-btn" onClick={() => setBack(back + 1)} aria-label={`Previous ${range}`}>
              ‹
            </button>
            <strong aria-live="polite">{title}</strong>
            <button type="button" className="icon-btn" onClick={() => setBack(back - 1)} disabled={back === 0} aria-label={`Next ${range}`}>
              ›
            </button>
          </div>
        </div>
      )}

      <div className="px-body">
        <div className="px-sheet">{grid}</div>
        {!compact && (
          <div className="px-side">
            {valued ? (
              <ValueLegend tracker={tracker} />
            ) : (
              <ul className="value-legend" aria-label="Colour key">
                <li>
                  <i style={{ background: 'var(--tracker, var(--accent))' }} aria-hidden="true" />
                  Done
                </li>
                {tracker.target ? (
                  <li>
                    <i style={{ background: 'color-mix(in srgb, var(--tracker, var(--accent)) 45%, var(--paper))' }} aria-hidden="true" />
                    Partly
                  </li>
                ) : null}
                <li>
                  <i style={{ background: 'var(--paper)' }} aria-hidden="true" />
                  Nothing logged
                </li>
              </ul>
            )}
            <p className="muted viz-caption">
              {coloured} of {shown} days coloured in
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

registerVisualization({
  id: 'pixels',
  name: 'Pixels',
  icon: '🟪',
  description: 'A square for every day, coloured in. See a week, a month or the whole year.',
  supports: 'all',
  defaultConfig: { range: 'year' },
  Component: PixelViz,
});
