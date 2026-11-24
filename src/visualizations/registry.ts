import type { ComponentType } from 'react';
import type { DateKey, TrackerDefinition, ValueType } from '../domain/types';
import type { DayMap } from '../domain/stats';
import type { OpensOn } from '../domain/newYear';

// A visualization is a pure view over a tracker's day summaries. It never
// reads or writes entries itself. To add a new look (pixel grid, garden…):
//   1. write a component that accepts VisualizationProps
//   2. call registerVisualization({ id, name, supports, Component, … })
// Nothing in the tracking system changes.

export interface VisualizationProps {
  tracker: TrackerDefinition;
  days: DayMap;
  today: DateKey;
  weekStartsOn: number;
  config: Record<string, unknown>;
  /** Called when a day is tapped, if the visualization has tappable days. */
  onPickDay?: (date: DateKey) => void;
  /** Saves a change to this look's own settings. Absent when settings are read-only. */
  onConfigChange?: (patch: Record<string, unknown>) => void;
  /** True in the tracker form: show this look's design options (plant, ring period…). */
  editing?: boolean;
  /** Small embedding (dashboard widget): draw the essentials, hide the settings. */
  compact?: boolean;
  /**
   * A page made for a year or a month: open on that period instead of the
   * current one (looks that show a period: pixels and calendar). Left out,
   * the look opens on today, as always.
   */
  opensOn?: OpensOn;
}

export interface VisualizationTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  /** Value types this look can draw, or 'all'. */
  supports: ValueType[] | 'all';
  defaultConfig: Record<string, unknown>;
  Component: ComponentType<VisualizationProps>;
}

const registry = new Map<string, VisualizationTemplate>();

export function registerVisualization(t: VisualizationTemplate): void {
  registry.set(t.id, t);
}

export const FALLBACK_VISUALIZATION = 'calendar';

/** Always returns something drawable, even if a saved id is unknown. */
export function getVisualization(id: string): VisualizationTemplate {
  return registry.get(id) ?? registry.get(FALLBACK_VISUALIZATION)!;
}

/** A tracker's saved settings for one look, on top of that look's defaults. */
export function configFor(visualizationConfig: Record<string, Record<string, unknown>> | undefined, id: string) {
  return { ...getVisualization(id).defaultConfig, ...(visualizationConfig?.[id] ?? {}) };
}

export function visualizationsFor(valueType: ValueType): VisualizationTemplate[] {
  return [...registry.values()].filter((t) => t.supports === 'all' || t.supports.includes(valueType));
}
