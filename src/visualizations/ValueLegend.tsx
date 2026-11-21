import { valueColorHex, valueKeys } from '../domain/colors';
import type { TrackerDefinition } from '../domain/types';

/** Colour key for trackers whose answers each have their own colour. */
export function ValueLegend({ tracker }: { tracker: TrackerDefinition }) {
  const keys = valueKeys(tracker);
  if (keys.length === 0) return null;
  return (
    <ul className="value-legend" aria-label="Colour key">
      {keys.map((k) => (
        <li key={k}>
          <i style={{ background: valueColorHex(tracker, k) }} aria-hidden="true" />
          {k}
        </li>
      ))}
    </ul>
  );
}
