import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { useStore } from '../data/store';
import { LOCALE, WEEKDAY_SHORT } from '../domain/dates';
import { bingoCount, centerIndex, gridRows, isFreeTile, tileDone } from '../domain/grid';
import {
  fontOf,
  newItem,
  type BookshelfElement,
  type BoxElement,
  type ChecklistElement,
  type GridElement,
  type MonthElement,
  type PartTextStyle,
  type TableElement,
  type WritingElement,
} from '../domain/pages';
import { TAPE_COLORS } from '../domain/types';

// Page parts that hold writing: checklists, tables, lined writing areas, a
// month grid, a bookshelf and tile grids. Three ways to draw them:
//   static  thumbnails, shared and public pages, unselected parts in Edit
//   view    the finished page: only quick taps (tick, star, mark a tile)
//   edit    the part selected in Edit: typeable in place, with placeholders
// Writing happens only in Edit, so a page being viewed has no text fields.

export type PartChange = (patch: Record<string, unknown>) => void;
export type PartMode = 'static' | 'view' | 'edit';
interface PartProps<E> {
  el: E;
  mode: PartMode;
  onChange?: PartChange;
}

const tint = (color: string | undefined) => TAPE_COLORS[color ?? ''] ?? TAPE_COLORS.rose;

/**
 * The part's text style as CSS variables. Unset fields add nothing, so the
 * stylesheet's own values apply and older pages look exactly as before.
 */
export function textVars(el: PartTextStyle): CSSProperties {
  const v: Record<string, string> = {};
  if (el.font) {
    const f = fontOf(el.font);
    v['--pp-font'] = f.family;
    v['--pp-weight'] = String(f.weight);
  }
  if (el.textSize) v['--pp-size'] = `${el.textSize}px`;
  if (el.textColor) v['--pp-color'] = el.textColor;
  if (el.textAlign) v['--pp-align'] = el.textAlign;
  return v as CSSProperties;
}

const overflows = (el: HTMLElement) => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1;

/**
 * Text in a fixed-size spot (a day note, a table cell, a tile, a book spine).
 * If it fits, it is left alone, so it looks as it always has. If not, it
 * wraps to a second line at a slightly smaller size (whole words only), and
 * if a word still doesn't fit, it ends with "…".
 */
function Fit({ text, className, vertical = false }: { text: string | undefined; className: string; vertical?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.classList.remove('fit-wrap', 'fit-cut');
      if (!text || !overflows(el)) return;
      el.classList.add('fit-wrap');
      // two lines are clamped with "…" already; a single word that is too long needs cutting
      const stillOver = vertical ? overflows(el) : el.scrollWidth > el.clientWidth + 1;
      if (stillOver) el.classList.replace('fit-wrap', 'fit-cut');
    };
    fit();
    let live = true;
    void document.fonts?.ready.then(() => live && fit());
    return () => {
      live = false;
    };
  });
  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}

function Head({ title, color, extra }: { title: string; color: string; extra?: string }) {
  if (!title && !extra) return null;
  return (
    <div className="pp-head" style={{ background: tint(color) }}>
      {title}
      {extra && <span className="pp-head-extra">{extra}</span>}
    </div>
  );
}

export function BoxBody({ el }: { el: BoxElement }) {
  const fill = el.fill === 'white' ? '#FFFDF9' : el.fill ? tint(el.fill) : 'transparent';
  return (
    <div className={`pp-box border-${el.border}`} style={{ background: fill }}>
      {el.title && <div className="pp-box-title">{el.title}</div>}
    </div>
  );
}

export function ChecklistBody({ el, mode, onChange }: PartProps<ChecklistElement>) {
  const [focusId, setFocusId] = useState<string | null>(null);
  const setItems = (items: ChecklistElement['items']) => onChange?.({ items });
  const add = (afterIndex: number) => {
    const item = newItem();
    const items = [...el.items];
    items.splice(afterIndex + 1, 0, item);
    setItems(items);
    setFocusId(item.id);
  };
  const canTick = mode !== 'static' && Boolean(onChange);
  return (
    <div className="pp-panel pp-checklist" style={textVars(el)}>
      <Head title={el.title} color={el.color} />
      <ul>
        {el.items.map((item, i) => (
          <li key={item.id} className={item.done ? 'is-done' : ''}>
            <button
              type="button"
              className="pp-tick"
              role="checkbox"
              aria-checked={item.done}
              aria-label={item.text || `Item ${i + 1}`}
              aria-disabled={!canTick || undefined}
              style={item.done ? { background: tint(el.color) } : undefined}
              onClick={() => canTick && setItems(el.items.map((x) => (x.id === item.id ? { ...x, done: !x.done } : x)))}
            >
              {item.done && (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.500" />
                </svg>
              )}
            </button>
            {mode === 'edit' ? (
              <input
                type="text"
                className="pg-input pp-item-text"
                value={item.text}
                autoFocus={item.id === focusId}
                placeholder="Write here"
                aria-label={`Item ${i + 1}`}
                onChange={(e) => setItems(el.items.map((x) => (x.id === item.id ? { ...x, text: e.target.value } : x)))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    add(i);
                  }
                }}
                onBlur={() => {
                  // tidy up rows left empty, but always keep at least one to type in
                  if (!item.text.trim() && el.items.length > 1 && item.id !== focusId) setItems(el.items.filter((x) => x.id !== item.id));
                  if (item.id === focusId) setFocusId(null);
                }}
              />
            ) : (
              <span className="pp-item-text">{item.text || ' '}</span>
            )}
          </li>
        ))}
      </ul>
      {mode === 'edit' && (
        <button type="button" className="pp-add" onClick={() => add(el.items.length - 1)}>
          + Add a line
        </button>
      )}
    </div>
  );
}

export function TableBody({ el, mode, onChange }: PartProps<TableElement>) {
  const labelled = el.rows.some((r) => r.trim());
  return (
    <div className="pp-panel pp-table" style={textVars(el)}>
      <Head title={el.title} color={el.color} />
      <div
        className="pp-grid"
        style={{
          gridTemplateColumns: `${labelled ? 'minmax(96px, max-content) ' : ''}repeat(${el.cols.length}, minmax(0, 1fr))`,
          gridTemplateRows: `auto repeat(${el.rows.length}, minmax(0, 1fr))`,
        }}
      >
        {labelled && <div className="pp-th" style={{ background: tint(el.color) }} />}
        {el.cols.map((c, i) => (
          <div key={i} className="pp-th" style={{ background: tint(el.color) }}>
            {c}
          </div>
        ))}
        {el.rows.map((r, ri) => [
          labelled && (
            <div key={`l${ri}`} className="pp-rowlabel">
              {r}
            </div>
          ),
          ...el.cols.map((c, ci) => {
            const key = `${ri}:${ci}`;
            return (
              <div key={key} className="pp-td">
                {mode === 'edit' ? (
                  <textarea
                    className="pg-input pp-cell"
                    value={el.cells[key] ?? ''}
                    aria-label={`${r || `Row ${ri + 1}`}, ${c || `column ${ci + 1}`}`}
                    onChange={(e) => onChange?.({ cells: { ...el.cells, [key]: e.target.value } })}
                  />
                ) : (
                  <Fit className="pp-cell" text={el.cells[key]} />
                )}
              </div>
            );
          }),
        ])}
      </div>
    </div>
  );
}

export function WritingBody({ el, mode, onChange }: PartProps<WritingElement>) {
  return (
    <div className="pp-panel pp-writing" style={textVars(el)}>
      <Head title={el.title} color={el.color} />
      {mode === 'edit' ? (
        <textarea
          className={`pg-input pp-paper ${el.lined ? 'is-lined' : ''}`}
          value={el.text}
          placeholder="Write here"
          aria-label={el.title || 'Writing area'}
          onChange={(e) => onChange?.({ text: e.target.value })}
        />
      ) : (
        <div className={`pp-paper ${el.lined ? 'is-lined' : ''}`}>{el.text}</div>
      )}
    </div>
  );
}

export const monthTitle = (year: number, month: number) => new Date(year, month, 1).toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' });

export function MonthBody({ el, mode, onChange }: PartProps<MonthElement>) {
  const weekStartsOn = useStore((s) => s.settings.weekStartsOn);
  const days = new Date(el.year, el.month + 1, 0).getDate();
  const lead = (new Date(el.year, el.month, 1).getDay() - weekStartsOn + 7) % 7;
  const weeks = Math.ceil((lead + days) / 7);
  const now = new Date();
  const today = now.getFullYear() === el.year && now.getMonth() === el.month ? now.getDate() : 0;
  return (
    <div className="pp-panel pp-month" style={textVars(el)}>
      <Head title={monthTitle(el.year, el.month)} color={el.color} />
      <div className="pp-grid" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gridTemplateRows: `auto repeat(${weeks}, minmax(0, 1fr))` }}>
        {Array.from({ length: 7 }, (_, i) => (
          <div key={`h${i}`} className="pp-th is-plain">
            {WEEKDAY_SHORT[(weekStartsOn + i) % 7]}
          </div>
        ))}
        {Array.from({ length: weeks * 7 }, (_, i) => {
          const day = i - lead + 1;
          if (day < 1 || day > days) return <div key={i} className="pp-td is-off" />;
          return (
            <div key={i} className={`pp-td pp-day ${day === today ? 'is-today' : ''}`}>
              <b style={day === today ? { background: tint(el.color) } : undefined}>{day}</b>
              {mode === 'edit' ? (
                <textarea
                  className="pg-input pp-note"
                  value={el.notes[day] ?? ''}
                  aria-label={`${monthTitle(el.year, el.month)} ${day}`}
                  onChange={(e) => onChange?.({ notes: { ...el.notes, [day]: e.target.value } })}
                />
              ) : (
                <Fit className="pp-note" text={el.notes[day]} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const SPINE_HEIGHTS = [92, 100, 84, 96, 80, 100, 88, 94, 82];

/** Shelves of blank book spines. Write titles in Edit; tap a star once it's read. */
export function BookshelfBody({ el, mode, onChange }: PartProps<BookshelfElement>) {
  const per = Math.max(1, el.perShelf);
  const shelves = Array.from({ length: Math.ceil(el.books.length / per) }, (_, i) => el.books.slice(i * per, (i + 1) * per));
  const setBook = (id: string, patch: Partial<BookshelfElement['books'][number]>) => onChange?.({ books: el.books.map((b) => (b.id === id ? { ...b, ...patch } : b)) });
  return (
    <div className="pp-panel pp-bookcase" style={textVars(el)}>
      <Head title={el.title} color={el.color} />
      <div className="pp-shelves" style={{ gridTemplateRows: `repeat(${Math.max(1, shelves.length)}, minmax(0, 1fr))` }}>
        {shelves.map((row, r) => (
          <div key={r} className="pp-shelf">
            {row.map((book, i) => {
              const n = r * per + i;
              return (
                <div key={book.id} className={`pp-book ${book.read ? 'is-read' : ''}`} style={{ height: `${SPINE_HEIGHTS[(n * 4 + r) % SPINE_HEIGHTS.length]}%`, background: tint(book.color) }}>
                  {mode === 'edit' ? (
                    <textarea className="pg-input pp-spine" value={book.title} placeholder="Title" aria-label={`Book ${n + 1} title`} onChange={(e) => setBook(book.id, { title: e.target.value.replace(/\n/g, ' ') })} />
                  ) : (
                    <Fit className="pp-spine" text={book.title} vertical />
                  )}
                  <button
                    type="button"
                    className="pp-read"
                    role="checkbox"
                    aria-checked={book.read}
                    aria-label={`${book.title || `Book ${n + 1}`} read`}
                    disabled={mode === 'static' || !onChange}
                    onClick={() => setBook(book.id, { read: !book.read })}
                  >
                    {book.read ? '★' : '☆'}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

const reducedMotion = () => typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

/** Tiles to mark: bingo cards, challenges, A to Z. Tap a tile to mark it; write on it in Edit. */
export function GridBody({ el, mode, onChange }: PartProps<GridElement>) {
  const rows = gridRows(el);
  const center = centerIndex(el);
  const lines = el.bingo ? bingoCount(el) : 0;
  const [cheer, setCheer] = useState(false);
  const seen = useRef(lines);
  useEffect(() => {
    // a new line made by a tap on the finished page: a short celebration
    if (mode === 'view' && lines > seen.current) {
      setCheer(true);
      const t = window.setTimeout(() => setCheer(false), reducedMotion() ? 2200 : 1700);
      seen.current = lines;
      return () => window.clearTimeout(t);
    }
    seen.current = lines;
  }, [lines, mode]);

  const setTile = (i: number, patch: Partial<GridElement['tiles'][number]>) => onChange?.({ tiles: el.tiles.map((t, j) => (j === i ? { ...t, ...patch } : t)) });
  const canMark = mode !== 'static' && Boolean(onChange);
  const extra = el.bingo && lines > 0 ? `${lines} bingo${lines === 1 ? '' : 's'}` : undefined;

  return (
    <div className={`pp-panel pp-tilegrid mark-${el.mark ?? 'cross'}`} style={{ ...textVars(el), ['--pp-mark' as string]: tint(el.color) }}>
      <Head title={el.title} color={el.color} extra={extra} />
      <div className="pp-tiles" style={{ gridTemplateColumns: `repeat(${Math.max(1, el.cols)}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}>
        {el.tiles.map((t, i) => {
          const free = isFreeTile(el, i);
          const done = tileDone(el, i);
          const label = t.label?.trim();
          const name = `${label ? `${label}: ` : ''}${t.text?.trim() || (free ? 'Free' : `Tile ${i + 1}`)}`;
          const body = (
            <>
              {label && <span className={`pp-tile-label ${label.length > 3 ? 'is-long' : ''}`}>{label}</span>}
              {free ? (
                <span className="pp-tile-free" aria-hidden="true">
                  ★<small>Free</small>
                </span>
              ) : mode === 'edit' ? (
                <textarea className="pg-input pp-tile-text" value={t.text ?? ''} placeholder={label ? '' : 'Write here'} aria-label={`${label ? `${label}, ` : ''}tile ${i + 1}`} onChange={(e) => setTile(i, { text: e.target.value })} />
              ) : (
                <Fit className="pp-tile-text" text={t.text} />
              )}
              {done && !free && <span className="pp-mark" aria-hidden="true" />}
            </>
          );
          const cls = `pp-tile ${done ? 'is-done' : ''} ${free ? 'is-free' : ''} ${i === center ? 'is-center' : ''}`;
          return canMark && mode === 'view' && !free ? (
            <button key={i} type="button" className={cls} role="checkbox" aria-checked={done} aria-label={name} onClick={() => setTile(i, { done: !t.done })}>
              {body}
            </button>
          ) : (
            <div key={i} className={cls} aria-label={mode === 'edit' ? undefined : `${name}${done ? ', done' : ''}`}>
              {body}
            </div>
          );
        })}
      </div>
      {cheer && (
        <div className={`pp-bingo ${reducedMotion() ? 'is-still' : ''}`} role="status">
          Bingo!
        </div>
      )}
    </div>
  );
}
