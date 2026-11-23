import { describe, expect, it } from 'vitest';
import { backPreset, COVER_PRESETS, coverPage, coverPreset, matchingBack, standardCover } from './covers';
import { assetIdsOf, blankPage, bookOrder, CHALLENGE_PRESETS, copyPage, coverOf, editedPage, isFillable, isJournalPage, lastEdited, movedPage, newChallenge, newFrame, PAGE_DIMS, type Page } from './pages';

const page = (id: string, sortOrder: number, extra: Partial<Page> = {}): Page => ({ ...blankPage(id, 'portrait', sortOrder), id, ...extra });

describe('journal pages, templates and covers', () => {
  const pages = [page('c', 3), page('a', 1), page('t', 2, { isTemplate: true }), page('cover', 0, { role: 'cover' }), page('b', 2), page('back', 0, { role: 'back' })];
  it('only ordinary pages are journal pages', () => {
    expect(pages.filter(isJournalPage).map((p) => p.id).sort()).toEqual(['a', 'b', 'c']);
  });
  it('book order leaves out templates and covers', () => {
    expect(bookOrder(pages).map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });
  it('pages with the same number keep one order on every device', () => {
    const tied = [page('z', 1), page('m', 1), page('a', 1)];
    expect(bookOrder(tied).map((p) => p.id)).toEqual(['a', 'm', 'z']);
    expect(bookOrder([...tied].reverse()).map((p) => p.id)).toEqual(['a', 'm', 'z']);
  });
  it('finds the covers, and the newest when there are two', () => {
    expect(coverOf(pages, 'cover')?.id).toBe('cover');
    expect(coverOf(pages, 'back')?.id).toBe('back');
    expect(coverOf([page('x', 1)], 'cover')).toBeUndefined();
    const two = [page('old', 0, { role: 'cover', updatedAt: '2026-01-01T00:00:00.000Z' }), page('new', 0, { role: 'cover', updatedAt: '2026-02-01T00:00:00.000Z' })];
    expect(coverOf(two, 'cover')?.id).toBe('new');
  });
  it('a copy of a cover is an ordinary page', () => {
    const copy = copyPage(page('cover', 0, { role: 'cover', spine: '#000000', hideCount: true }), 'Copy', 5, false);
    expect(copy.role).toBeUndefined();
    expect('spine' in copy).toBe(false);
    expect('hideCount' in copy).toBe(false);
    expect(isJournalPage(copy)).toBe(true);
  });
});

describe('covers', () => {
  const onPage = (p: Pick<Page, 'elements'>) => p.elements.every((e) => e.x + e.w > 0 && e.x < PAGE_DIMS.portrait.w && e.y >= 0 && e.y < PAGE_DIMS.portrait.h);
  it('the standard cover has the colour, the tape and the title of the built-in one', () => {
    const d = standardCover('Kim', '#F3A3BA');
    expect(d.background).toEqual({ color: '#F3A3BA', pattern: 'cover' });
    expect(d.elements.map((e) => e.type)).toEqual(['tape', 'box', 'text', 'text']);
    // the label's shadow and the heavier title, as on the built-in cover
    expect(d.elements.some((e) => e.type === 'box' && e.shadow)).toBe(true);
    expect(d.elements.some((e) => e.type === 'text' && e.text === 'Daybook' && e.bold)).toBe(true);
    expect(d.elements.filter((e) => e.type === 'text').map((e) => (e.type === 'text' ? e.text : ''))).toEqual(['Kim’s', 'Daybook']);
    expect(standardCover('  ', '#F3A3BA').elements.some((e) => e.type === 'text' && e.text === 'My')).toBe(true);
  });
  it('every preset gives a front with the title and a back with only paper and spine', () => {
    for (const { id } of COVER_PRESETS) {
      const front = coverPreset(id, 'Kim', '#F3A3BA');
      expect(front.elements.some((e) => e.type === 'text' && e.text === 'Daybook'), id).toBe(true);
      expect(onPage(front), id).toBe(true);
      const back = backPreset(id, '#F3A3BA');
      expect(back.elements, id).toEqual([]);
      expect(back.background, id).toEqual(front.background);
      expect(back.spine, id).toBe(front.spine);
    }
  });
  it('a cover page is a portrait page with a role, outside the book order', () => {
    const p = coverPage('cover', standardCover('Kim', '#F3A3BA'));
    expect(p.role).toBe('cover');
    expect(p.size).toBe('portrait');
    expect(p.isTemplate).toBe(false);
    expect(isJournalPage(p)).toBe(false);
  });
  it('the back matches the front until it has a design of its own', () => {
    const front = coverPage('cover', coverPreset('night', 'Kim', '#F3A3BA'));
    const back = matchingBack(front);
    expect(back.role).toBe('back');
    expect(back.background).toEqual(front.background);
    expect(back.spine).toBe(front.spine);
    expect(back.elements).toEqual([]);
    expect(back.id).not.toBe(front.id);
  });
});

describe('photo slots and challenges', () => {
  const p = blankPage('x', 'portrait', 1);
  it('an empty slot is tappable when viewing; a filled one is not', () => {
    const frame = newFrame(p);
    expect(isFillable(frame)).toBe(true);
    expect(isFillable({ ...frame, assetId: 'a1' })).toBe(false);
  });
  it('a slot\'s photo counts as used, so it is kept and synced', () => {
    const withPhoto = { ...p, elements: [{ ...newFrame(p), assetId: 'a1' }, newFrame(p)] };
    expect(assetIdsOf(withPhoto)).toEqual(['a1']);
  });
  it('there are at least 8 challenge formats besides bingo, each on the page and counting progress', () => {
    expect(CHALLENGE_PRESETS.length).toBeGreaterThanOrEqual(8);
    const looks = new Set<string>();
    for (const preset of CHALLENGE_PRESETS) {
      for (const size of ['portrait', 'landscape'] as const) {
        const el = newChallenge(blankPage('x', size, 1), preset.id);
        expect(el.type).toBe('tiles');
        expect(el.count, preset.id).toBe(true);
        expect(el.tiles.length, preset.id).toBeGreaterThan(0);
        expect(el.x >= 0 && el.y >= 0 && el.x + el.w <= PAGE_DIMS[size].w && el.y + el.h <= PAGE_DIMS[size].h, `${preset.id} ${size}`).toBe(true);
        looks.add(`${el.layout ?? 'grid'}/${el.shape ?? 'square'}`);
      }
    }
    expect(looks.size).toBe(CHALLENGE_PRESETS.length);
  });
});

describe('recently edited', () => {
  const made = '2026-03-01T10:00:00.000Z';
  const old = page('a', 1, { createdAt: made, updatedAt: made });
  it('an older page without editedAt counts as edited when it was last saved', () => {
    expect(lastEdited(old)).toBe(made);
  });
  it('a content edit moves both dates', () => {
    const next = editedPage(old, '2026-05-05T08:00:00.000Z');
    expect(next.updatedAt).toBe('2026-05-05T08:00:00.000Z');
    expect(lastEdited(next)).toBe('2026-05-05T08:00:00.000Z');
  });
  it('moving a page changes updatedAt (for sync) but not when it was edited', () => {
    const moved = movedPage(old, 7.5, '2026-06-01T09:00:00.000Z');
    expect(moved.sortOrder).toBe(7.5);
    expect(moved.updatedAt).toBe('2026-06-01T09:00:00.000Z');
    expect(lastEdited(moved)).toBe(made);
    // and again: still the original date
    expect(lastEdited(movedPage(moved, 2, '2026-07-01T09:00:00.000Z'))).toBe(made);
  });
  it('a moved page stays where it was in a "recent" list', () => {
    const a = page('a', 1, { updatedAt: '2026-01-01T00:00:00.000Z' });
    const b = page('b', 2, { updatedAt: '2026-02-01T00:00:00.000Z' });
    const c = page('c', 3, { updatedAt: '2026-03-01T00:00:00.000Z' });
    const recent = (list: Page[]) => [...list].sort((x, y) => lastEdited(y).localeCompare(lastEdited(x))).map((p) => p.id).join('');
    expect(recent([a, b, c])).toBe('cba');
    expect(recent([movedPage(a, 9, '2026-09-09T00:00:00.000Z'), b, c])).toBe('cba');
    expect(recent([editedPage(a, '2026-09-09T00:00:00.000Z'), b, c])).toBe('acb');
  });
  it('a copy starts fresh: it is not as old as the page it was copied from', () => {
    const copy = copyPage({ ...old, editedAt: made }, 'Copy', 2, false);
    expect('editedAt' in copy).toBe(false);
    expect(lastEdited(copy)).toBe(copy.updatedAt);
    expect(copy.updatedAt > made).toBe(true);
  });
});
