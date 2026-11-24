import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../data/store';
import { useActiveTrackers, useDayMaps, useToday } from '../data/hooks';
import { NOTE_MESSAGES } from '../data/defaults';
import { addDays, formatLong, fromKey, startOfWeek, WEEKDAY_SHORT } from '../domain/dates';
import { formatDay, isFlexible, isScheduled, periodProgress, streakLabel, streaks, type DayMap } from '../domain/stats';
import { newId, TAPE_COLORS, type DashboardWidget, type TrackerDefinition, type WidgetType } from '../domain/types';
import { EmptyState } from '../ui/Layout';
import { QuickLog } from '../ui/QuickLog';
import { configFor, getVisualization } from '../visualizations';
import { useUi } from '../data/store';
import { NewMonthCard } from './NewYear';

interface WidgetProps {
  widget: DashboardWidget;
  trackers: TrackerDefinition[];
  maps: Map<string, DayMap>;
  today: string;
  weekStartsOn: number;
}

function TodayWidget({ trackers, maps, today, weekStartsOn }: WidgetProps) {
  const planned = trackers.filter((t) => isScheduled(t, today));
  const resting = trackers.filter((t) => !isScheduled(t, today));
  const row = (t: TrackerDefinition, rest = false) => {
    const map = maps.get(t.id)!;
    const day = map.get(today);
    const period = periodProgress(t, map, today, weekStartsOn);
    const detail =
      formatDay(t, day) ||
      (period ? `${period.done} of ${period.times} this ${period.unit}` : rest ? 'Rest day' : t.target ? 'Not started' : '');
    return (
      <li key={t.id} className={`row ${day?.done ? 'is-done' : ''}`}>
        <Link to={`/trackers/${t.id}`} className="row-main">
          <span className="dot" style={{ background: TAPE_COLORS[t.color] }} aria-hidden="true">
            {t.emoji}
          </span>
          <span className="row-text">
            <strong>{t.name}</strong>
            {detail && <small>{detail}</small>}
          </span>
        </Link>
        {day && day.progress > 0 && day.progress < 1 && (
          <span className="mini-bar" aria-hidden="true">
            <i style={{ width: `${day.progress * 100}%`, background: TAPE_COLORS[t.color] }} />
          </span>
        )}
        <QuickLog tracker={t} day={day} date={today} />
      </li>
    );
  };
  const doneCount = planned.filter((t) => maps.get(t.id)!.get(today)?.done).length;
  return (
    <>
      <div className="card-head">
        <h2>Today</h2>
        {planned.length > 0 && (
          <span className="muted">
            {doneCount} of {planned.length} done
          </span>
        )}
      </div>
      {planned.length === 0 && <p className="muted">Nothing planned for today. Enjoy the rest.</p>}
      <ul className="rows">{planned.map((t) => row(t))}</ul>
      {resting.length > 0 && (
        <>
          <h3 className="sub-head">Not planned today</h3>
          <ul className="rows is-quiet">{resting.map((t) => row(t, true))}</ul>
        </>
      )}
    </>
  );
}

function WeekWidget({ trackers, maps, today, weekStartsOn }: WidgetProps) {
  const start = startOfWeek(today, weekStartsOn);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return (
    <>
      <div className="card-head">
        <h2>This week</h2>
      </div>
      <div className="week">
        {days.map((d) => {
          const due = trackers.filter((t) => !isFlexible(t.schedule) && isScheduled(t, d));
          const done = due.filter((t) => maps.get(t.id)!.get(d)?.done).length;
          const pct = due.length ? done / due.length : 0;
          const future = d > today;
          return (
            <div
              key={d}
              className={`week-day ${d === today ? 'is-today' : ''} ${future ? 'is-future' : ''}`}
              role="img"
              aria-label={`${formatLong(d)}: ${future ? 'not yet' : `${done} of ${due.length} done`}`}
            >
              <div className="week-jar">
                <i style={{ height: `${pct * 100}%` }} />
              </div>
              <span>{WEEKDAY_SHORT[fromKey(d).getDay()]}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

function StreaksWidget({ trackers, maps, today, weekStartsOn }: WidgetProps) {
  const list = trackers
    .map((t) => ({ t, s: streaks(t, maps.get(t.id)!, today, weekStartsOn) }))
    .filter((x) => x.s.current.count > 0)
    .sort((a, b) => b.s.current.count - a.s.current.count)
    .slice(0, 5);
  return (
    <>
      <div className="card-head">
        <h2>Streaks</h2>
      </div>
      {list.length === 0 ? (
        <p className="muted">Streaks show up here after the first completed day.</p>
      ) : (
        <ul className="streaks">
          {list.map(({ t, s }) => (
            <li key={t.id}>
              <Link to={`/trackers/${t.id}`}>
                <span aria-hidden="true">{t.emoji}</span>
                <span className="streak-name">{t.name}</span>
                <strong>{streakLabel(s.current)}</strong>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function NoteWidget({ widget, today }: WidgetProps) {
  const dayNumber = Math.floor(fromKey(today).getTime() / 86_400_000);
  const text = widget.text?.trim() || NOTE_MESSAGES[Math.abs(dayNumber) % NOTE_MESSAGES.length];
  return <p className="note-text">{text}</p>;
}

/** One tracker drawn with whatever look it currently uses. */
function TrackerWidget({ widget, trackers, maps, today, weekStartsOn }: WidgetProps) {
  const openLog = useUi((s) => s.openLog);
  const t = trackers.find((x) => x.id === widget.trackerId);
  if (!t) return <p className="muted">This tracker was removed or archived.</p>;
  const viz = getVisualization(t.visualizationId);
  const map = maps.get(t.id)!;
  return (
    <div style={{ ['--tracker' as string]: TAPE_COLORS[t.color] }}>
      <div className="card-head">
        <h2>
          <Link to={`/trackers/${t.id}`}>
            <span aria-hidden="true">{t.emoji}</span> {t.name}
          </Link>
        </h2>
        <QuickLog tracker={t} day={map.get(today)} date={today} />
      </div>
      <viz.Component
        tracker={t}
        days={map}
        today={today}
        weekStartsOn={weekStartsOn}
        config={configFor(t.visualizationConfig, viz.id)}
        onPickDay={(date) => openLog({ trackerId: t.id, date })}
        compact
      />
    </div>
  );
}

const WIDGETS: Record<WidgetType, { name: string; Component: (p: WidgetProps) => ReactNode }> = {
  today: { name: 'Today', Component: TodayWidget },
  week: { name: 'This week', Component: WeekWidget },
  streaks: { name: 'Streaks', Component: StreaksWidget },
  note: { name: 'Note', Component: NoteWidget },
  tracker: { name: 'Tracker', Component: TrackerWidget },
};

export function Home() {
  const today = useToday();
  const trackers = useActiveTrackers();
  const maps = useDayMaps();
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const [editing, setEditing] = useState(false);

  const widgets = settings.dashboard;
  const setWidgets = (dashboard: DashboardWidget[]) => updateSettings({ dashboard });
  const move = (i: number, by: number) => {
    const next = [...widgets];
    const [w] = next.splice(i, 1);
    next.splice(i + by, 0, w);
    setWidgets(next);
  };
  const patch = (id: string, p: Partial<DashboardWidget>) => setWidgets(widgets.map((w) => (w.id === id ? { ...w, ...p } : w)));
  const missing = (Object.keys(WIDGETS) as WidgetType[]).filter(
    (type) => type !== 'tracker' && (type === 'note' || !widgets.some((w) => w.type === type)),
  );
  const unpinned = trackers.filter((t) => !widgets.some((w) => w.type === 'tracker' && w.trackerId === t.id));
  const nameOf = (w: DashboardWidget) =>
    w.type === 'tracker' ? (trackers.find((t) => t.id === w.trackerId)?.name ?? 'Tracker') : WIDGETS[w.type].name;

  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <header className="page-head">
        <div className="page-head-text">
          <h1>
            {greeting}
            {settings.ownerName ? `, ${settings.ownerName}` : ''}
          </h1>
          <p className="muted">{formatLong(today)}</p>
        </div>
        {trackers.length > 0 && (
          <div className="page-head-action">
            <button className="btn btn-quiet" onClick={() => setEditing(!editing)} aria-pressed={editing}>
              {editing ? 'Done arranging' : 'Arrange'}
            </button>
          </div>
        )}
      </header>

      <NewMonthCard />

      {trackers.length === 0 ? (
        <EmptyState emoji="🌱" title="Your first page is blank">
          <p>Add something to track and it shows up here every day.</p>
          <Link className="btn btn-primary" to="/trackers/new">
            Add a tracker
          </Link>
        </EmptyState>
      ) : (
        <div className="widgets">
          {widgets.map((w, i) => {
            const def = WIDGETS[w.type];
            if (!def) return null;
            return (
              <section key={w.id} className={`card widget widget-${w.type} size-${w.size} ${editing ? 'is-editing' : ''}`}>
                <span className={`tape tape-${['rose', 'mint', 'butter', 'sky', 'lilac'][i % 5]}`} aria-hidden="true" />
                <def.Component widget={w} trackers={trackers} maps={maps} today={today} weekStartsOn={settings.weekStartsOn} />
                {editing && (
                  <div className="widget-tools">
                    {w.type === 'note' && (
                      <input
                        type="text"
                        value={w.text ?? ''}
                        onChange={(e) => patch(w.id, { text: e.target.value })}
                        placeholder="Write your own note, or leave empty for a daily one"
                        aria-label="Note text"
                      />
                    )}
                    <div className="widget-buttons">
                      <button className="btn btn-small" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${nameOf(w)} up`}>
                        ↑ Up
                      </button>
                      <button className="btn btn-small" onClick={() => move(i, 1)} disabled={i === widgets.length - 1} aria-label={`Move ${nameOf(w)} down`}>
                        ↓ Down
                      </button>
                      <button className="btn btn-small" onClick={() => patch(w.id, { size: w.size === 'full' ? 'half' : 'full' })}>
                        {w.size === 'full' ? 'Make narrow' : 'Make wide'}
                      </button>
                      <button className="btn btn-small danger" onClick={() => setWidgets(widgets.filter((x) => x.id !== w.id))}>
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
          {editing && (
            <section className="card widget size-full add-widget">
              <h2>Add to this page</h2>
              <div className="chips">
                {missing.map((type) => (
                  <button key={type} className="chip" onClick={() => setWidgets([...widgets, { id: newId(), type, size: 'half' }])}>
                    + {WIDGETS[type].name}
                  </button>
                ))}
              </div>
              {unpinned.length > 0 && (
                <>
                  <h3>Show a tracker</h3>
                  <div className="chips">
                    {unpinned.map((t) => (
                      <button key={t.id} className="chip" onClick={() => setWidgets([...widgets, { id: newId(), type: 'tracker', size: 'half', trackerId: t.id }])}>
                        + {t.emoji} {t.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </section>
          )}
        </div>
      )}
    </>
  );
}
