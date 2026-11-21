import { useStore, useUi } from '../data/store';
import type { DaySummary } from '../domain/stats';
import type { DateKey, TrackerDefinition } from '../domain/types';

interface Props {
  tracker: TrackerDefinition;
  day: DaySummary | undefined;
  date: DateKey;
}

/** The one-tap control at the end of a tracker row. */
export function QuickLog({ tracker, day, date }: Props) {
  const openLog = useUi((s) => s.openLog);
  const { addEntry, removeEntry } = useStore.getState();

  if (tracker.valueType === 'boolean') {
    const done = !!day?.done;
    return (
      <button
        className={`check ${done ? 'is-on' : ''}`}
        role="checkbox"
        aria-checked={done}
        aria-label={`${tracker.name} done`}
        onClick={() => {
          if (done) day!.entries.forEach((e) => removeEntry(e.id));
          else addEntry(tracker.id, date, true);
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </button>
    );
  }

  if (tracker.valueType === 'number' && tracker.step) {
    return (
      <div className="quick">
        <button
          className="btn btn-small"
          onClick={() => addEntry(tracker.id, date, tracker.step!)}
          aria-label={`Add ${tracker.step} ${tracker.unit ?? ''} to ${tracker.name}`}
        >
          +{tracker.step}
        </button>
        <button className="icon-btn" onClick={() => openLog({ trackerId: tracker.id, date })} aria-label={`Log another amount for ${tracker.name}`}>
          ⋯
        </button>
      </div>
    );
  }

  return (
    <button className="btn btn-small" onClick={() => openLog({ trackerId: tracker.id, date })} aria-label={`Log ${tracker.name}`}>
      {day?.entries.length ? 'Add' : 'Log'}
    </button>
  );
}
