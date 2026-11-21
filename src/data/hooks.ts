import { useEffect, useMemo, useState } from 'react';
import { useStore } from './store';
import { buildDayMap, type DayMap } from '../domain/stats';
import { todayKey } from '../domain/dates';
import type { TrackerDefinition } from '../domain/types';

/** Day summaries for every active tracker, recomputed only when data changes. */
export function useDayMaps(): Map<string, DayMap> {
  const trackers = useStore((s) => s.trackers);
  const entries = useStore((s) => s.entries);
  return useMemo(() => {
    const maps = new Map<string, DayMap>();
    for (const t of trackers) maps.set(t.id, buildDayMap(t, entries));
    return maps;
  }, [trackers, entries]);
}

export function useDayMap(tracker: TrackerDefinition | undefined): DayMap {
  const entries = useStore((s) => s.entries);
  return useMemo(() => (tracker ? buildDayMap(tracker, entries) : new Map()), [tracker, entries]);
}

/** Today's date key, refreshed when the app is reopened or midnight passes. */
export function useToday(): string {
  const [today, setToday] = useState(todayKey);
  useEffect(() => {
    const check = () => setToday(todayKey());
    const timer = setInterval(check, 60_000);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);
  return today;
}

export const useActiveTrackers = () => {
  const trackers = useStore((s) => s.trackers);
  return useMemo(() => trackers.filter((t) => !t.archived), [trackers]);
};
