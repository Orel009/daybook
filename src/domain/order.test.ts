import { describe, expect, it } from 'vitest';
import { moveItem, planMove, type Ordered } from './order';

const book = (...orders: number[]): Ordered[] => orders.map((sortOrder, i) => ({ id: 'abcdefghij'[i], sortOrder }));
/** Applies a plan and returns the ids in the new book order. */
const after = (pages: Ordered[], plan: Ordered[]) => {
  const next = pages.map((p) => plan.find((c) => c.id === p.id) ?? p);
  return [...next].sort((a, b) => a.sortOrder - b.sortOrder).map((p) => p.id).join('');
};

describe('moveItem', () => {
  it('moves within the list and clamps the position', () => {
    const list = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    expect(moveItem(list, 'a', 2).map((x) => x.id).join('')).toBe('bca');
    expect(moveItem(list, 'c', 0).map((x) => x.id).join('')).toBe('cab');
    expect(moveItem(list, 'b', 99).map((x) => x.id).join('')).toBe('acb');
    expect(moveItem(list, 'zz', 1)).toEqual(list);
  });
});

describe('planMove', () => {
  it('writes only the moved page, between its new neighbours', () => {
    const pages = book(1, 2, 3, 4);
    const plan = planMove(pages, 'd', 1);
    expect(plan).toEqual([{ id: 'd', sortOrder: 1.5 }]);
    expect(after(pages, plan)).toBe('adbc');
  });
  it('moves to the start and to the end with one record', () => {
    const pages = book(1, 2, 3);
    expect(planMove(pages, 'c', 0)).toEqual([{ id: 'c', sortOrder: 0 }]);
    expect(planMove(pages, 'a', 2)).toEqual([{ id: 'a', sortOrder: 4 }]);
    expect(after(pages, planMove(pages, 'a', 2))).toBe('bca');
  });
  it('does nothing when the page stays where it is, or is unknown', () => {
    expect(planMove(book(1, 2, 3), 'b', 1)).toEqual([]);
    expect(planMove(book(1, 2, 3), 'x', 0)).toEqual([]);
    expect(planMove(book(5), 'a', 0)).toEqual([]);
  });
  it('moving one step down or up lands where expected', () => {
    const pages = book(1, 2, 3, 4);
    expect(after(pages, planMove(pages, 'b', 2))).toBe('acbd');
    expect(after(pages, planMove(pages, 'c', 1))).toBe('acbd');
  });
  it('renumbers only when the gap has run out', () => {
    // two pages made on two devices got the same number
    const pages = book(1, 2, 2, 3);
    const plan = planMove(pages, 'd', 2);
    expect(after(pages, plan)).toBe('abdc');
    const numbers = pages.map((p) => plan.find((c) => c.id === p.id) ?? p).map((p) => p.sortOrder);
    expect(new Set(numbers).size).toBe(4);
    // every page has the same number: all but the first get a new one
    const same = book(1, 1, 1, 1);
    const all = planMove(same, 'd', 1);
    expect(all.map((c) => c.id).sort().join('')).toBe('bcd');
    expect(after(same, all)).toBe('adbc');
  });
  it('keeps working after many moves into the same gap', () => {
    let pages = book(1, 2, 3);
    let single = 0;
    for (let i = 0; i < 80; i++) {
      // always move the last page to position 1
      const ordered = [...pages].sort((a, b) => a.sortOrder - b.sortOrder);
      const last = ordered[ordered.length - 1].id;
      const plan = planMove(ordered, last, 1);
      if (plan.length === 1) single++;
      pages = ordered.map((p) => plan.find((c) => c.id === p.id) ?? p);
      const now = [...pages].sort((a, b) => a.sortOrder - b.sortOrder);
      expect(now[1].id).toBe(last);
      expect(new Set(now.map((p) => p.sortOrder)).size).toBe(3);
    }
    // nearly every move is a single record; a renumbering happens only now and then
    expect(single).toBeGreaterThan(70);
  });
});
