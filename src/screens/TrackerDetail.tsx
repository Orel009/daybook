import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore, useUi } from '../data/store';
import { useDayMap, useToday } from '../data/hooks';
import { formatShort } from '../domain/dates';
import { formatDay, formatValue, periodProgress, scheduleLabel, streaks } from '../domain/stats';
import { TAPE_COLORS } from '../domain/types';
import { EmptyState } from '../ui/Layout';
import { QuickLog } from '../ui/QuickLog';
import { Sheet } from '../ui/Sheet';
import { configFor, getVisualization } from '../visualizations';

export function TrackerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const today = useToday();
  const tracker = useStore((s) => s.trackers.find((t) => t.id === id));
  const allEntries = useStore((s) => s.entries);
  const weekStartsOn = useStore((s) => s.settings.weekStartsOn);
  const { updateTracker, deleteTracker } = useStore.getState();
  const openLog = useUi((s) => s.openLog);
  const days = useDayMap(tracker);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [shown, setShown] = useState(20);

  const history = useMemo(
    () =>
      allEntries
        .filter((e) => e.trackerId === id)
        .sort((a, b) => (a.date === b.date ? b.at.localeCompare(a.at) : b.date.localeCompare(a.date))),
    [allEntries, id],
  );

  if (!tracker) {
    return (
      <EmptyState emoji="🔍" title="This tracker is gone">
        <Link className="btn btn-primary" to="/trackers">
          Back to trackers
        </Link>
      </EmptyState>
    );
  }

  const s = streaks(tracker, days, today, weekStartsOn);
  const period = periodProgress(tracker, days, today, weekStartsOn);
  const viz = getVisualization(tracker.visualizationId);
  const vizConfig = configFor(tracker.visualizationConfig, viz.id);
  const todaySummary = days.get(today);
  const doneDays = [...days.values()].filter((d) => d.done).length;

  const pickDay = (date: string) => {
    const existing = days.get(date)?.entries;
    // single-answer trackers: tapping a filled day edits it instead of adding another
    if (tracker.valueType === 'boolean' && existing?.length) openLog({ trackerId: tracker.id, entryId: existing[0].id });
    else openLog({ trackerId: tracker.id, date });
  };

  return (
    <>
      <header className="page-head detail-head">
        <Link to="/trackers" className="icon-btn" aria-label="Back to trackers">
          ‹
        </Link>
        <span className="detail-emoji" style={{ background: TAPE_COLORS[tracker.color] }} aria-hidden="true">
          {tracker.emoji}
        </span>
        <div className="page-head-text">
          <h1>{tracker.name}</h1>
          <p className="muted">
            {scheduleLabel(tracker.schedule)}
            {tracker.archived ? ', archived' : ''}
          </p>
        </div>
        <div className="page-head-action">
          <Link className="btn" to={`/trackers/${tracker.id}/edit`}>
            Edit
          </Link>
        </div>
      </header>

      <div className="detail-grid">
        <section className="card today-card">
          <span className="tape" style={{ background: TAPE_COLORS[tracker.color] }} aria-hidden="true" />
          <div>
            <h2>Today</h2>
            <p className="muted">
              {formatDay(tracker, todaySummary) ||
                (period ? `${period.done} of ${period.times} this ${period.unit}` : 'Nothing logged yet')}
            </p>
          </div>
          {!tracker.archived && <QuickLog tracker={tracker} day={todaySummary} date={today} />}
        </section>

        <section className="stats" aria-label="Summary">
          <div className="stat">
            <strong>{s.current.count}</strong>
            <span>
              {s.current.unit}
              {s.current.count === 1 ? '' : 's'} in a row
            </span>
          </div>
          <div className="stat">
            <strong>{s.best.count}</strong>
            <span>best streak</span>
          </div>
          <div className="stat">
            <strong>{doneDays}</strong>
            <span>day{doneDays === 1 ? '' : 's'} done</span>
          </div>
        </section>

        <section className="card viz-card" style={{ ['--tracker' as string]: TAPE_COLORS[tracker.color] }}>
          <viz.Component
            tracker={tracker}
            days={days}
            today={today}
            weekStartsOn={weekStartsOn}
            config={vizConfig}
            onPickDay={tracker.archived ? undefined : pickDay}
            onConfigChange={(patch) =>
              updateTracker(tracker.id, {
                visualizationConfig: { ...tracker.visualizationConfig, [viz.id]: { ...vizConfig, ...patch } },
              })
            }
          />
          {!tracker.archived && viz.id !== 'garden' && <p className="muted hint">Tap a day to add or fix an entry.</p>}
          <p className="muted hint">
            Showing as {viz.name}. <Link to={`/trackers/${tracker.id}/edit`} className="text-link">Change the look</Link>
          </p>
        </section>

        <section className="card history-card">
          <div className="card-head">
            <h2>History</h2>
            {history.length > 0 && <span className="muted">{history.length} entries</span>}
          </div>
          {history.length === 0 ? (
            <p className="muted">Entries appear here as you log them.</p>
          ) : (
            <ul className="history">
              {history.slice(0, shown).map((e) => (
                <li key={e.id}>
                  <button onClick={() => openLog({ trackerId: tracker.id, entryId: e.id })} aria-label={`Edit entry from ${formatShort(e.date)}`}>
                    <span className="history-date">{formatShort(e.date)}</span>
                    <span className="history-value">
                      {formatValue(tracker, e.value)}
                      {e.note && <small>{e.note}</small>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {history.length > shown && (
            <button className="btn btn-quiet" onClick={() => setShown(shown + 40)}>
              Show older entries
            </button>
          )}
        </section>
      </div>

      <div className="detail-actions">
        <button className="btn btn-quiet" onClick={() => updateTracker(tracker.id, { archived: !tracker.archived })}>
          {tracker.archived ? 'Bring back from archive' : 'Archive'}
        </button>
        <button className="btn btn-quiet danger" onClick={() => setConfirmDelete(true)}>
          Delete
        </button>
      </div>

      {confirmDelete && (
        <Sheet
          title={`Delete ${tracker.name}?`}
          onClose={() => setConfirmDelete(false)}
          footer={
            <>
              <button className="btn btn-quiet" onClick={() => setConfirmDelete(false)}>
                Keep it
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  deleteTracker(tracker.id);
                  navigate('/trackers');
                }}
              >
                Delete tracker and history
              </button>
            </>
          }
        >
          <p>
            {history.length === 0
              ? 'This removes the tracker for good.'
              : `This removes the tracker and its ${history.length} ${history.length === 1 ? 'entry' : 'entries'} for good. To hide it and keep the history, archive it instead.`}
          </p>
        </Sheet>
      )}
    </>
  );
}
