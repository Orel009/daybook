import { describe, expect, it } from 'vitest';
import { isBlock, isOwnTemplate, layoutOnly, ownSubjects, pageFromOwnTemplate, redateText, templateFrom } from './ownTemplates';
import type { Page, PageElement } from './pages';

const base = { rotation: 0 };
const page = (elements: PageElement[], extra: Partial<Page> = {}): Page => ({ id: 'p1', title: 'March plans', size: 'portrait', background: { color: '#FFFDF9', pattern: 'dots' }, elements, isTemplate: false, sortOrder: 3, createdAt: 'then', updatedAt: 'then', ...extra });

const full: PageElement[] = [
  { ...base, id: 't', type: 'text', x: 0, y: 0, w: 400, h: 80, text: 'March 2026', font: 'hand', size: 60, color: '#3A2B47', align: 'left' },
  { ...base, id: 'w', type: 'writing', x: 0, y: 100, w: 300, h: 200, title: 'Notes for March', color: 'butter', text: 'Call the plumber', lined: true },
  { ...base, id: 'c', type: 'checklist', x: 0, y: 320, w: 300, h: 200, title: 'To do', color: 'mint', items: [{ id: 'i1', text: 'Buy seeds', done: true }, { id: 'i2', text: 'Plant them', done: false }] },
  { ...base, id: 'tb', type: 'table', x: 0, y: 540, w: 300, h: 200, title: 'Week', color: 'sky', cols: ['A', 'B'], rows: ['1', '2'], cells: { '0:0': 'x' } },
  { ...base, id: 'm', type: 'month', x: 0, y: 760, w: 300, h: 200, color: 'rose', year: 2026, month: 2, notes: { 3: 'Dentist' } },
  { ...base, id: 'g', type: 'tiles', x: 320, y: 0, w: 300, h: 300, title: 'Bingo', color: 'rose', cols: 2, tiles: [{ label: 'Walk', done: true }, { done: true }, { label: 'Read' }, {}] },
  { ...base, id: 'r', type: 'tiles', x: 320, y: 320, w: 250, h: 50, title: '', color: 'butter', cols: 5, tiles: [{ done: true }, { done: true }, { done: true }, {}, {}], bare: true, inOrder: true, shape: 'star', mark: 'fill' },
  { ...base, id: 'f', type: 'frame', x: 320, y: 400, w: 200, h: 200, style: 'polaroid', assetId: 'a1', zoom: 2, panX: 0.2, panY: 0.8, caption: 'Us' },
  { ...base, id: 'ph', type: 'photo', x: 320, y: 620, w: 240, h: 180, assetId: 'a2', frame: 'polaroid', shadow: true },
  { ...base, id: 'bs', type: 'bookshelf', x: 320, y: 820, w: 300, h: 200, title: 'Read', color: 'tan', perShelf: 2, books: [{ id: 'b1', title: 'Emma', color: 'rose', read: true }, { id: 'b2', title: '', color: 'sky', read: false }] },
  { ...base, id: 's', type: 'sticker', x: 640, y: 0, w: 100, h: 100, emoji: '🌸' },
  { ...base, id: 'tp', type: 'tape', x: 640, y: 120, w: 200, h: 46, color: 'rose', pattern: 'stripes', edge: 'torn' },
];

describe('keep only the layout', () => {
  const kept = layoutOnly(page(full)).elements;
  const by = (id: string) => kept.find((e) => e.id === id)!;
  it('clears what was written, and keeps headings and printed labels', () => {
    expect(by('w')).toMatchObject({ text: '', title: 'Notes for March', lined: true });
    expect(by('tb')).toMatchObject({ cells: {}, cols: ['A', 'B'], rows: ['1', '2'] });
    expect(by('m')).toMatchObject({ notes: {}, year: 2026, month: 2 });
    expect(by('bs')).toMatchObject({ books: [{ id: 'b1', title: '', color: 'rose', read: false }, { id: 'b2', title: '', color: 'sky', read: false }] });
    expect(by('t')).toEqual(full[0]);
  });
  it('clears ticks, marks and ratings, and keeps the items and the labels on tiles', () => {
    expect(by('c')).toMatchObject({ items: [{ id: 'i1', text: 'Buy seeds', done: false }, { id: 'i2', text: 'Plant them', done: false }] });
    expect(by('g')).toMatchObject({ tiles: [{ label: 'Walk' }, {}, { label: 'Read' }, {}] });
    expect(by('r')).toMatchObject({ tiles: [{}, {}, {}, {}, {}], inOrder: true, bare: true });
  });
  it('takes the photos out but keeps a slot where each one was', () => {
    const slot = by('f');
    expect(slot).toMatchObject({ type: 'frame', style: 'polaroid', caption: 'Us', x: 320, y: 400, w: 200, h: 200 });
    expect('assetId' in slot || 'zoom' in slot || 'panX' in slot).toBe(false);
    expect(by('ph')).toEqual({ id: 'ph', type: 'frame', x: 320, y: 620, w: 240, h: 180, rotation: 0, style: 'polaroid' });
  });
  it('leaves stickers and tape alone, and the page it was given', () => {
    expect(by('s')).toEqual(full[10]);
    expect(by('tp')).toEqual(full[11]);
    expect(full[1]).toMatchObject({ text: 'Call the plumber' });
    expect(kept.length).toBe(full.length);
  });
});

describe('saving a page as a template', () => {
  const today = new Date(2026, 2, 14);
  const source = page(full, { role: undefined, editedAt: 'x', subject: 'Planning' });
  it('keeps what she wrote when asked to, under the name, subject and description she gave', () => {
    const t = templateFrom(source, { name: '  My month  ', subject: 'Garden', description: 'A month in the garden', keep: 'all', followDate: false }, today, 9);
    expect(t).toMatchObject({ title: 'My month', subject: 'Garden', description: 'A month in the garden', isTemplate: true, sortOrder: 9 });
    expect(t.autoDate).toBeUndefined();
    expect('editedAt' in t).toBe(false);
    expect(t.id).not.toBe(source.id);
    expect(t.elements.find((e) => e.type === 'writing')).toMatchObject({ text: 'Call the plumber' });
    // new ids throughout, so the template is not the page
    expect(t.elements.some((e) => full.some((f) => f.id === e.id))).toBe(false);
  });
  it('keeps only the layout when asked to', () => {
    const t = templateFrom(source, { name: 'Blank month', subject: '', description: '', keep: 'layout', followDate: false }, today, 1);
    expect(t.elements.find((e) => e.type === 'writing')).toMatchObject({ text: '' });
    expect(t.elements.filter((e) => e.type === 'frame').length).toBe(2);
    expect(t.elements.some((e) => e.type === 'photo')).toBe(false);
    expect('subject' in t || 'description' in t).toBe(false);
  });
  it('remembers the month it was saved in when the dates should follow', () => {
    expect(templateFrom(source, { name: 'x', subject: '', description: '', keep: 'all', followDate: true }, today, 1).autoDate).toBe('2026-03');
    expect(templateFrom(source, { name: 'x', subject: '', description: '', keep: 'all', followDate: true }, new Date(2026, 11, 31), 1).autoDate).toBe('2026-12');
  });
  it('a template made from a cover or from another template is an ordinary template', () => {
    const t = templateFrom(page([], { role: 'cover', spine: '#000000', hideCount: true, autoDate: '2020-01', description: 'old' }), { name: 'Cover idea', subject: '', description: '', keep: 'all', followDate: false }, today, 1);
    expect('role' in t || 'spine' in t || 'hideCount' in t || 'autoDate' in t || 'description' in t).toBe(false);
    expect(isOwnTemplate(t)).toBe(true);
  });
  it('without a name it takes the page\'s title', () => {
    expect(templateFrom(source, { name: ' ', subject: '', description: '', keep: 'all', followDate: false }, today, 1).title).toBe('March plans');
  });
});

describe('a month and year that follow the date', () => {
  const march = { year: 2026, month: 2 };
  it('replaces the month name and the year, whole words only', () => {
    expect(redateText('March 2026', march, { year: 2026, month: 3 })).toBe('April 2026');
    expect(redateText('Plans for March', march, { year: 2027, month: 0 })).toBe('Plans for January');
    expect(redateText('Mar 2026 budget', march, { year: 2026, month: 11 })).toBe('Dec 2026 budget');
    expect(redateText('Marching on in 20261', march, { year: 2027, month: 0 })).toBe('Marching on in 20261');
    expect(redateText('2026 was the year', march, { year: 2027, month: 2 })).toBe('2027 was the year');
  });
  it('May is one word, long or short', () => {
    expect(redateText('May goals', { year: 2026, month: 4 }, { year: 2026, month: 5 })).toBe('June goals');
    expect(redateText('June goals', { year: 2026, month: 5 }, { year: 2026, month: 4 })).toBe('May goals');
  });
  it('December to January moves the year too', () => {
    expect(redateText('December 2026', { year: 2026, month: 11 }, { year: 2027, month: 0 })).toBe('January 2027');
  });
  it('using a template with the switch on moves titles, texts, headings and month parts to today', () => {
    const template = page(full, { isTemplate: true, autoDate: '2026-03', description: 'About it' });
    const made = pageFromOwnTemplate(template, new Date(2027, 0, 9));
    expect(made.title).toBe('January plans');
    expect(made.elements.find((e) => e.id === 't')).toMatchObject({ text: 'January 2027' });
    expect(made.elements.find((e) => e.id === 'w')).toMatchObject({ title: 'Notes for January', text: 'Call the plumber' });
    expect(made.elements.find((e) => e.id === 'm')).toMatchObject({ year: 2027, month: 0 });
    expect('autoDate' in made || 'description' in made).toBe(false);
    // the template itself is untouched
    expect(template.elements.find((e) => e.id === 't')).toMatchObject({ text: 'March 2026' });
  });
  it('a month part moves by the same number of months: one for February stays a month ahead', () => {
    const template = page([{ ...base, id: 'm1', type: 'month', x: 0, y: 0, w: 300, h: 200, color: 'rose', year: 2026, month: 1, notes: {} }], { isTemplate: true, autoDate: '2026-01' });
    expect(pageFromOwnTemplate(template, new Date(2026, 11, 5)).elements[0]).toMatchObject({ year: 2027, month: 0 });
    // into a leap year's February
    expect(pageFromOwnTemplate(template, new Date(2028, 0, 31)).elements[0]).toMatchObject({ year: 2028, month: 1 });
  });
  it('tracker parts pinned to a month or a year move with it; a tracker part that follows today stays as it is', () => {
    const tracker = (id: string, pin: { year?: number; month?: number }) => ({ ...base, id, type: 'tracker' as const, x: 0, y: 0, w: 300, h: 400, trackerId: 'mood', ...pin });
    const template = page([tracker('m', { year: 2026, month: 10 }), tracker('y', { year: 2026 }), tracker('t', {})], { isTemplate: true, autoDate: '2026-11' });
    const made = pageFromOwnTemplate(template, new Date(2027, 1, 3));
    expect(made.elements[0]).toMatchObject({ year: 2027, month: 1 });
    expect(made.elements[1]).toMatchObject({ year: 2027 });
    expect('month' in made.elements[1]).toBe(false);
    expect(made.elements[2]).toEqual(template.elements[2]);
  });
  it('with the switch off nothing is changed, only the template\'s own details are left behind', () => {
    const template = page(full, { isTemplate: true, description: 'About it', subject: 'Planning' });
    const made = pageFromOwnTemplate(template, new Date(2030, 5, 1));
    expect(made.title).toBe('March plans');
    expect(made.elements).toEqual(template.elements);
    expect(made.subject).toBe('Planning');
    expect('description' in made).toBe(false);
  });
});

describe('her templates and blocks among the pages', () => {
  const pages = [
    page([], { id: 'a', isTemplate: true, subject: 'Garden' }),
    page([], { id: 'b', isTemplate: true, subject: 'Planning' }),
    page([], { id: 'c', isTemplate: true }),
    page([], { id: 'd', isTemplate: true, subject: 'Baking' }),
    page([], { id: 'e', isTemplate: true, role: 'block', subject: 'Blocks' }),
    page([], { id: 'f', isTemplate: false, subject: 'Travel diary' }),
  ];
  it('a block is not a template, and a journal page is neither', () => {
    expect(pages.filter(isOwnTemplate).map((p) => p.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(pages.filter(isBlock).map((p) => p.id)).toEqual(['e']);
  });
  it('her own subjects are the ones that are not ready-made, A to Z', () => {
    expect(ownSubjects(pages, ['Planning', 'Travel'])).toEqual(['Baking', 'Garden']);
    expect(ownSubjects([], ['Planning'])).toEqual([]);
  });
});
