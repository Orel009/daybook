import { useState } from 'react';
import { useStore, useUi } from '../data/store';
import { useToday } from '../data/hooks';
import type { EntryValue } from '../domain/types';
import { addDays, formatLong, formatShort } from '../domain/dates';
import { Sheet } from './Sheet';
import { emptyValue, isValidValue, ValueInput } from './ValueInput';

/** Add or edit one entry for any tracker, on any past day. */
export function LogSheet() {
  const target = useUi((s) => s.log)!;
  const close = useUi((s) => s.closeLog);
  const today = useToday();
  const tracker = useStore((s) => s.trackers.find((t) => t.id === target.trackerId));
  const existing = useStore((s) => (target.entryId ? s.entries.find((e) => e.id === target.entryId) : undefined));
  const { addEntry, updateEntry, removeEntry } = useStore.getState();

  const [date, setDate] = useState(existing?.date ?? target.date ?? today);
  const [value, setValue] = useState<EntryValue>(() => existing?.value ?? (tracker ? emptyValue(tracker) : true));
  const [note, setNote] = useState(existing?.note ?? '');

  if (!tracker) return null;
  const valid = isValidValue(tracker, value) && date <= today;
  const isText = tracker.valueType === 'text';

  const saveEntry = () => {
    if (!valid) return;
    if (existing) updateEntry(existing.id, { value, note, date });
    else addEntry(tracker.id, date, value, note);
    close();
  };

  return (
    <Sheet
      title={`${tracker.emoji} ${tracker.name}`}
      onClose={close}
      footer={
        <>
          {existing && (
            <button
              className="btn btn-quiet danger"
              onClick={() => {
                removeEntry(existing.id);
                close();
              }}
            >
              Delete entry
            </button>
          )}
          <button className="btn btn-primary" onClick={saveEntry} disabled={!valid}>
            {existing ? 'Save changes' : 'Save entry'}
          </button>
        </>
      }
    >
      <div className="field">
        <ValueInput tracker={tracker} value={value} onChange={setValue} />
      </div>
      <div className="field">
        <span className="label" id="log-day-label">Day</span>
        <div className="day-stepper" role="group" aria-labelledby="log-day-label">
          <button type="button" className="icon-btn" onClick={() => setDate(addDays(date, -1))} aria-label="Previous day">
            ‹
          </button>
          <strong aria-live="polite">{date === today ? `Today, ${formatShort(date)}` : formatLong(date)}</strong>
          <button type="button" className="icon-btn" onClick={() => setDate(addDays(date, 1))} disabled={date >= today} aria-label="Next day">
            ›
          </button>
        </div>
      </div>
      {!isText && (
        <div className="field">
          <label htmlFor="log-note">Note (optional)</label>
          <input id="log-note" type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="How did it go?" />
        </div>
      )}
    </Sheet>
  );
}
