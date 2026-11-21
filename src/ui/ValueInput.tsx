import type { EntryValue, TimeRange, TrackerDefinition } from '../domain/types';
import { formatMinutes } from '../domain/dates';
import { rangeMinutes } from '../domain/stats';
import { valueColorHex } from '../domain/colors';

export function DurationInput({ minutes, onChange, idPrefix }: { minutes: number; onChange: (m: number) => void; idPrefix: string }) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const clamp = (v: string, max: number) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
  return (
    <div className="duration">
      <label>
        <input
          id={`${idPrefix}-h`}
          type="number"
          inputMode="numeric"
          min={0}
          max={99}
          value={h || ''}
          placeholder="0"
          onChange={(e) => onChange(clamp(e.target.value, 99) * 60 + m)}
        />
        <span>hours</span>
      </label>
      <label>
        <input
          id={`${idPrefix}-m`}
          type="number"
          inputMode="numeric"
          min={0}
          max={59}
          value={m || ''}
          placeholder="0"
          onChange={(e) => onChange(h * 60 + clamp(e.target.value, 59))}
        />
        <span>minutes</span>
      </label>
    </div>
  );
}

export const emptyValue = (t: TrackerDefinition): EntryValue => {
  switch (t.valueType) {
    case 'boolean':
      return true;
    case 'number':
      return t.step ?? 0;
    case 'duration':
      return 0;
    case 'rating':
      return 0;
    case 'timeRange':
      return { start: '22:30', end: '06:30' };
    default:
      return '';
  }
};

export const isValidValue = (t: TrackerDefinition, v: EntryValue): boolean => {
  switch (t.valueType) {
    case 'boolean':
      return true;
    case 'number':
      return typeof v === 'number' && Number.isFinite(v) && v !== 0;
    case 'duration':
      return typeof v === 'number' && v > 0;
    case 'rating':
      return typeof v === 'number' && v >= 1;
    case 'timeRange':
      return typeof v === 'object' && !!v.start && !!v.end && v.start !== v.end;
    default:
      return typeof v === 'string' && v.trim().length > 0;
  }
};

interface Props {
  tracker: TrackerDefinition;
  value: EntryValue;
  onChange: (v: EntryValue) => void;
}

/** One input per value type. Adding a value type means adding a case here. */
export function ValueInput({ tracker, value, onChange }: Props) {
  switch (tracker.valueType) {
    case 'boolean':
      return (
        <div className="seg" role="radiogroup" aria-label="Status">
          <button className={value === true ? 'is-on' : ''} role="radio" aria-checked={value === true} onClick={() => onChange(true)}>
            Done
          </button>
          <button className={value === false ? 'is-on' : ''} role="radio" aria-checked={value === false} onClick={() => onChange(false)}>
            Not done
          </button>
        </div>
      );

    case 'number': {
      const n = typeof value === 'number' ? value : 0;
      const step = tracker.step || 1;
      return (
        <div className="stepper">
          <button className="btn" onClick={() => onChange(Math.round((n - step) * 100) / 100)} aria-label={`Minus ${step}`}>
            −
          </button>
          <label className="stepper-field">
            <input
              type="number"
              inputMode="decimal"
              value={Number.isFinite(n) ? n : ''}
              onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
              aria-label={`Amount${tracker.unit ? ` in ${tracker.unit}` : ''}`}
            />
            {tracker.unit && <span>{tracker.unit}</span>}
          </label>
          <button className="btn" onClick={() => onChange(Math.round((n + step) * 100) / 100)} aria-label={`Plus ${step}`}>
            +
          </button>
        </div>
      );
    }

    case 'duration':
      return <DurationInput idPrefix="log" minutes={typeof value === 'number' ? value : 0} onChange={onChange} />;

    case 'timeRange': {
      const r = (typeof value === 'object' ? value : { start: '', end: '' }) as TimeRange;
      return (
        <div className="timerange">
          <label>
            <span>From</span>
            <input type="time" value={r.start} onChange={(e) => onChange({ ...r, start: e.target.value })} />
          </label>
          <label>
            <span>To</span>
            <input type="time" value={r.end} onChange={(e) => onChange({ ...r, end: e.target.value })} />
          </label>
          {r.start && r.end && r.start !== r.end && <p className="muted">{formatMinutes(rangeMinutes(r))} in total</p>}
        </div>
      );
    }

    case 'rating': {
      const max = tracker.ratingMax ?? 5;
      return (
        <div className={`rating rating-${max}`} role="radiogroup" aria-label={`Rating out of ${max}`}>
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
            <button key={n} role="radio" aria-checked={value === n} className={value === n ? 'is-on' : ''} style={{ ['--accent' as string]: valueColorHex(tracker, String(n)) }} onClick={() => onChange(n)}>
              {n}
            </button>
          ))}
        </div>
      );
    }

    case 'choice':
      return (
        <div className="chips" role="radiogroup" aria-label="Choose one">
          {(tracker.choices ?? []).map((c) => (
            <button key={c} role="radio" aria-checked={value === c} className={`chip ${value === c ? 'is-on' : ''}`} style={{ ['--accent' as string]: valueColorHex(tracker, c) }} onClick={() => onChange(c)}>
              <i className="chip-dot" aria-hidden="true" />
              {c}
            </button>
          ))}
        </div>
      );

    default:
      return (
        <textarea
          rows={4}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write a few words"
          aria-label="Note"
        />
      );
  }
}
