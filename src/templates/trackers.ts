import { draftFromPreset, PRESETS, type TrackerDraft } from '../data/defaults';
import type { TrackerDefinition } from '../domain/types';

// The trackers a page made from a template shows. A template names the
// trackers it needs ("Mood", "Weather"…); the page uses hers when she has one
// with that name, and only otherwise adds one from the preset. Pure: the
// caller passes her trackers and a way to add one, so it can be tested.

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Her tracker with this name (not archived), if she has one. */
export const ownTracker = (own: TrackerDefinition[], name: string): TrackerDefinition | undefined => own.find((t) => !t.archived && sameName(t.name, name));

/**
 * `ctx.tracker` for making a real page: the id of her tracker with that name,
 * or of a new one made from the preset. Asked twice for a name it doesn't
 * have, it adds only one.
 */
export function trackerFinder(own: TrackerDefinition[], add: (draft: TrackerDraft) => TrackerDefinition): (name: string) => string {
  const added: TrackerDefinition[] = [];
  return (name) => (ownTracker(own, name) ?? ownTracker(added, name) ?? added[added.push(add(draftFromPreset(PRESETS.find((p) => sameName(p.name, name))))) - 1]).id;
}
