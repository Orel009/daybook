import { useState } from 'react';
import { addDays, addMonths, formatLong, formatMonth, fromKey, startOfMonth, startOfWeek, WEEKDAY_SHORT } from '../domain/dates';
import { formatDay, isFlexible, isScheduled } from '../domain/stats';
import { dayColor, usesValueColors } from '../domain/colors';
import { ValueLegend } from './ValueLegend';
import { registerVisualization, type VisualizationProps } from './registry';

function CalendarViz({ tracker, days, today, weekStartsOn, onPickDay, compact }: VisualizationProps) {
  const [month, setMonth] = useState(() => startOfMonth(today));
  const gridStart = startOfWeek(month, weekStartsOn);
  const monthIndex = fromKey(month).getMonth();
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  // drop a trailing week that belongs entirely to next month
  const visible = fromKey(cells[35]).getMonth() === monthIndex ? cells : cells.slice(0, 35);
  const atCurrentMonth = month === startOfMonth(today);

  return (
    <div className="cal">
      <div className="cal-head">
        <button className="icon-btn" onClick={() => setMonth(addMonths(month, -1))} aria-label="Previous month">
          ‹
        </button>
        <h3 className="cal-title">{formatMonth(month)}</h3>
        <button
          className="icon-btn"
          onClick={() => setMonth(addMonths(month, 1))}
          disabled={atCurrentMonth}
          aria-label="Next month"
        >
          ›
        </button>
      </div>
      <div className="cal-grid" role="grid" aria-label={formatMonth(month)}>
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="cal-dow" aria-hidden="true">
            {WEEKDAY_SHORT[(weekStartsOn + i) % 7]}
          </div>
        ))}
        {visible.map((date) => {
          const day = days.get(date);
          const inMonth = fromKey(date).getMonth() === monthIndex;
          const future = date > today;
          const rest = !isFlexible(tracker.schedule) && !isScheduled(tracker, date);
          const progress = day?.progress ?? 0;
          const summary = formatDay(tracker, day);
          const valueColor = dayColor(tracker, day);
          const cls = [
            'cal-day',
            !inMonth && 'is-out',
            future && 'is-future',
            rest && 'is-rest',
            day?.done && 'is-done',
            date === today && 'is-today',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <button
              key={date}
              className={cls}
              disabled={future || !onPickDay}
              onClick={() => onPickDay?.(date)}
              style={{ ['--fill' as string]: `${Math.round(progress * 100)}%`, ...(valueColor ? { ['--tracker' as string]: valueColor } : {}) }}
              aria-label={`${formatLong(date)}${summary ? `, ${summary}` : rest ? ', rest day' : ', nothing logged'}`}
            >
              <span className="cal-num">{fromKey(date).getDate()}</span>
            </button>
          );
        })}
      </div>
      {!compact && usesValueColors(tracker) && <ValueLegend tracker={tracker} />}
      {!compact && !usesValueColors(tracker) && <div className="cal-legend">
        <span><i className="swatch is-done" /> Done</span>
        <span><i className="swatch is-part" /> Partly</span>
        {!isFlexible(tracker.schedule) && tracker.schedule.kind !== 'daily' && (
          <span><i className="swatch is-rest" /> Rest day</span>
        )}
      </div>}
    </div>
  );
}

registerVisualization({
  id: 'calendar',
  name: 'Calendar',
  icon: '📅',
  description: 'A month at a glance, coloured in as days are completed.',
  supports: 'all',
  defaultConfig: {},
  Component: CalendarViz,
});
