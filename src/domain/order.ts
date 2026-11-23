// Book order. Pages are sorted by `sortOrder`; moving a page gives it a value
// between its new neighbours, so a move changes (and syncs) one record instead
// of every page. Only when two neighbours leave no room in between are the
// pages renumbered 1, 2, 3…

export interface Ordered {
  id: string;
  sortOrder: number;
}

/** `list` with the item `id` moved to position `to`. */
export function moveItem<T extends { id: string }>(list: readonly T[], id: string, to: number): T[] {
  const item = list.find((x) => x.id === id);
  if (!item) return [...list];
  const rest = list.filter((x) => x.id !== id);
  rest.splice(Math.max(0, Math.min(rest.length, to)), 0, item);
  return rest;
}

/**
 * The records to rewrite so that `id` ends up at position `to` of `ordered`
 * (which must already be in book order). Usually one; every page whose number
 * changes when the gap between the neighbours has run out.
 */
export function planMove(ordered: readonly Ordered[], id: string, to: number): Ordered[] {
  const from = ordered.findIndex((p) => p.id === id);
  if (from < 0) return [];
  const rest = ordered.filter((p) => p.id !== id);
  const index = Math.max(0, Math.min(rest.length, Math.round(to)));
  if (index === from) return [];
  const prev = rest[index - 1]?.sortOrder;
  const next = rest[index]?.sortOrder;

  let order: number | undefined;
  if (prev === undefined && next !== undefined) order = next - 1;
  else if (next === undefined && prev !== undefined) order = prev + 1;
  else if (prev !== undefined && next !== undefined) {
    const mid = (prev + next) / 2;
    if (prev < mid && mid < next) order = mid;
  }
  if (order !== undefined && Number.isFinite(order)) return [{ id, sortOrder: order }];

  // no room between the neighbours: number the whole book again
  const now = new Map(ordered.map((p) => [p.id, p.sortOrder]));
  return moveItem(ordered, id, index)
    .map((p, i) => ({ id: p.id, sortOrder: i + 1 }))
    .filter((p) => now.get(p.id) !== p.sortOrder);
}
