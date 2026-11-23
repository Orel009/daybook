import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { useStore } from '../data/store';
import { LOCALE, WEEKDAY_SHORT } from '../domain/dates';
import { isPicture, pathCells, PICTURE_SIZE, pictureSpots, TRAIL_POINTS, type Picture } from '../domain/challenge';
import { bingoCount, centerIndex, gridRows, hasLines, isFreeTile, markTile, progress, tileDone } from '../domain/grid';
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

/** Every fitted text on screen, measured again whenever a font finishes loading. */
const refits = new Set<() => void>();
if (typeof document !== 'undefined') document.fonts?.addEventListener?.('loadingdone', () => refits.forEach((fit) => fit()));

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
    // a lettering that finishes loading later changes the widths: measure again then
    refits.add(fit);
    return () => {
      live = false;
      refits.delete(fit);
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
    <div className={`pp-box border-${el.border}${el.shadow ? ' has-shadow' : ''}`} style={{ background: fill }}>
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
    <div className={`pp-panel pp-writing${el.bare ? ' is-bare' : ''}`} style={textVars(el)}>
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

// Outlines for shaped tiles and picture segments, on a 100×100 grid.
const SHAPES: Record<string, string> = {
  circle: 'M50 5a45 45 0 1 0 .01 0z',
  heart: 'M50 90 12 52a23 23 0 0 1 38-26 23 23 0 0 1 38 26z',
  star: 'm50 6 13 27.500 30 4-22 20.500 5.600 29.500L50 73 23.400 87.500 29 58 7 37.500l30-4z',
  leaf: 'M50 94C14 72 14 34 50 6c36 28 36 66 0 88z',
  drop: 'M50 6c17 27 31 43 31 59a31 31 0 0 1-62 0C19 49 33 33 50 6z',
  spine: 'M6 100V10a8 8 0 0 1 8-8h72a8 8 0 0 1 8 8v90z',
  band: 'M0 0h100v100H0z',
};
const STRETCHED = new Set(['spine', 'band']);

function ShapeArt({ shape, height }: { shape: string; height?: string }) {
  return (
    <svg className="pp-shape" viewBox="0 0 100 100" preserveAspectRatio={STRETCHED.has(shape) ? 'none' : 'xMidYMid meet'} style={height ? { height } : undefined} aria-hidden="true">
      <path d={SHAPES[shape] ?? SHAPES.circle} />
      {shape === 'leaf' && <path className="pp-shape-line" d="M50 90V28" />}
      {shape === 'marble' && <path className="pp-shape-line" d="M28 40a24 24 0 0 1 17-17" />}
    </svg>
  );
}

const TAPE_KEYS = Object.keys(TAPE_COLORS);
/** Marbles in a jar come in a few colours, starting from the part's own. */
const marbleColor = (color: string, i: number) => TAPE_COLORS[TAPE_KEYS[(Math.max(0, TAPE_KEYS.indexOf(color)) + [0, 3, 7, 11][(i * 7) % 4]) % TAPE_KEYS.length]];

/** The drawing behind a picture challenge, in the picture's own units. */
function PictureArt({ layout }: { layout: Picture }) {
  const { w, h } = PICTURE_SIZE[layout];
  const ink = { fill: 'none', stroke: '#3a2b47', strokeWidth: 4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  return (
    <svg className="pp-pic-art" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {layout === 'jar' && (
        <>
          <path {...ink} fill="rgb(255 255 255 / 0.65)" d="M74 62h152v20c0 14 30 22 30 52v200a20 20 0 0 1-20 20H64a20 20 0 0 1-20-20V134c0-30 30-38 30-52z" />
          <rect {...ink} fill="var(--pp-mark)" x="62" y="26" width="176" height="38" rx="10" />
          <path {...ink} strokeOpacity={0.35} strokeWidth={3} d="M70 46h160" />
        </>
      )}
      {layout === 'thermo' && (
        <>
          <path {...ink} fill="rgb(255 255 255 / 0.7)" d="M66 400V38a12 12 0 0 1 12-12h44a12 12 0 0 1 12 12v362" />
          <circle {...ink} fill="var(--pp-mark)" cx="100" cy="424" r="50" />
          <path {...ink} stroke="#fff" strokeOpacity={0.7} strokeWidth={7} d="M76 412a26 26 0 0 1 12-16" />
        </>
      )}
      {layout === 'trail' && (
        <>
          <circle {...ink} strokeWidth={3} fill="#f6db7d" cx="424" cy="54" r="26" />
          <path {...ink} strokeWidth={3} fill="#ece6f5" d="M262 340 398 138l78 202z" />
          <path {...ink} fill="#fffdf9" d="M8 340 240 26l232 314z" />
          <path {...ink} strokeWidth={3} fill="#e6f0fb" d="M240 26l-42 57 20-7 22 15 22-17 20 9z" />
          <path {...ink} strokeWidth={3} strokeOpacity={0.55} strokeDasharray="1 9" d={`M${TRAIL_POINTS.map((p) => p.join(' ')).join('L')}`} />
          <path {...ink} strokeWidth={3} fill="var(--pp-mark)" d="M240 44V6l26 10-26 10" />
          <path {...ink} d="M4 342h472" />
        </>
      )}
      {layout === 'tree' && (
        <>
          <ellipse cx="180" cy="150" rx="168" ry="142" fill="var(--pp-mark)" fillOpacity={0.16} />
          <path {...ink} fill="#b98b6b" d="M158 392c8-42 10-84 4-132h36c-6 48-4 90 4 132z" />
          <path {...ink} stroke="#b98b6b" strokeWidth={9} d="M178 268C150 240 118 228 92 192M184 262c30-30 58-42 86-74M180 258V150" />
          <path {...ink} d="M40 394h280" />
        </>
      )}
    </svg>
  );
}

const SEGMENT: Record<Picture, string> = { jar: 'marble', thermo: 'band', trail: 'circle', tree: 'leaf', heart: 'heart' };

/** Tiles to mark: bingo cards, challenges, A to Z. Tap a tile to mark it; write on it in Edit. */
export function GridBody({ el, mode, onChange }: PartProps<GridElement>) {
  const rows = gridRows(el);
  const center = centerIndex(el);
  const layout = el.layout ?? 'grid';
  const shape = el.shape ?? 'square';
  const lined = hasLines(el);
  const lines = lined ? bingoCount(el) : 0;
  const prog = progress(el);
  const [cheer, setCheer] = useState<string | null>(null);
  const seen = useRef({ lines, complete: prog.complete });
  useEffect(() => {
    // a new line, or the last tile, made by a tap on the finished page: a short celebration
    const was = seen.current;
    seen.current = { lines, complete: prog.complete };
    if (mode !== 'view') return;
    const text = lines > was.lines ? 'Bingo!' : prog.complete && !was.complete && (el.count || !lined) ? 'All done!' : null;
    if (!text) return;
    setCheer(text);
    const t = window.setTimeout(() => setCheer(null), reducedMotion() ? 2200 : 1700);
    return () => window.clearTimeout(t);
  }, [lines, prog.complete, mode, el.count, lined]);

  const setTile = (i: number, patch: Partial<GridElement['tiles'][number]>) => onChange?.({ tiles: el.tiles.map((t, j) => (j === i ? { ...t, ...patch } : t)) });
  const tap = (i: number) => onChange?.({ tiles: markTile(el, i) });
  const canMark = mode !== 'static' && Boolean(onChange);
  const tappable = canMark && mode === 'view';
  const extra =
    [el.count ? `${prog.done}/${prog.total}` : '', lined && lines > 0 ? `${lines} bingo${lines === 1 ? '' : 's'}` : ''].filter(Boolean).join(' · ') || undefined;
  const celebration = cheer && (
    <div className={`pp-bingo ${reducedMotion() ? 'is-still' : ''}`} role="status">
      {cheer}
    </div>
  );
  const nameOf = (i: number) => {
    const t = el.tiles[i];
    const label = t.label?.trim();
    return `${label ? `${label}: ` : ''}${t.text?.trim() || (label ? '' : `Tile ${i + 1}`)}`.replace(/: $/, '');
  };

  // ----- segments of a picture: a jar, a thermometer, a trail, a tree, a big heart
  if (isPicture(layout)) {
    const size = PICTURE_SIZE[layout];
    const spots = pictureSpots(layout, el.tiles.length);
    const seg = SEGMENT[layout];
    const pct = (v: number, of: number) => `${(v / of) * 100}%`;
    return (
      <div className={`pp-panel pp-tilegrid ${el.bare ? 'is-bare ' : ''}is-picture pic-${layout}`} style={{ ...textVars(el), ['--pp-mark' as string]: tint(el.color) }}>
        <Head title={el.title} color={el.color} extra={extra} />
        <div className="pp-picrow">
          <div className="pp-picwrap">
            <div className="pp-picture" style={{ ['--pic-ratio' as string]: size.w / size.h }}>
              <PictureArt layout={layout} />
              {el.tiles.map((t, i) => {
                const s = spots[i];
                const done = Boolean(t.done);
                const label = t.label?.trim();
                const style: CSSProperties = { left: pct(s.x, size.w), top: pct(s.y, size.h), width: pct(s.w, size.w), height: pct(s.h, size.h), transform: s.rot ? `rotate(${s.rot}deg)` : undefined };
                if (layout === 'jar') (style as Record<string, string>)['--seg'] = marbleColor(el.color, i);
                const inside = (
                  <>
                    <ShapeArt shape={seg} />
                    {layout === 'trail' && <span className="pp-seg-num">{label || i + 1}</span>}
                    {layout === 'thermo' && label && <span className="pp-seg-label">{label}</span>}
                  </>
                );
                const cls = `pp-seg seg-${seg} ${done ? 'is-done' : ''}`;
                return tappable ? (
                  <button key={i} type="button" className={cls} style={style} role="checkbox" aria-checked={done} aria-label={nameOf(i) || `Tile ${i + 1}`} onClick={() => tap(i)}>
                    {inside}
                  </button>
                ) : (
                  <div key={i} className={cls} style={style}>
                    {inside}
                  </div>
                );
              })}
            </div>
          </div>
          {layout === 'trail' && (
            <ol className="pp-stops">
              {el.tiles.map((t, i) => (
                <li key={i} className={t.done ? 'is-done' : ''}>
                  <b style={t.done ? { background: tint(el.color) } : undefined}>{t.label?.trim() || i + 1}</b>
                  {mode === 'edit' ? (
                    <input type="text" className="pg-input pp-tile-text" value={t.text ?? ''} placeholder="Write here" aria-label={`Stop ${i + 1}`} onChange={(e) => setTile(i, { text: e.target.value })} />
                  ) : (
                    <Fit className="pp-tile-text" text={t.text} />
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
        {celebration}
      </div>
    );
  }

  // ----- shaped tiles in rows, or tiles along a path
  if (shape !== 'square' || layout === 'path') {
    const cells = layout === 'path' ? pathCells(el.tiles.length, el.cols) : null;
    const mark = el.mark ?? 'fill';
    const last = el.tiles.length - 1;
    return (
      <div className={`pp-panel pp-tilegrid ${el.bare ? 'is-bare ' : ''}is-shaped shape-${shape} ${cells ? 'is-path' : ''} mark-${mark}`} style={{ ...textVars(el), ['--pp-mark' as string]: tint(el.color) }}>
        <Head title={el.title} color={el.color} extra={extra} />
        <div className="pp-tiles" style={{ gridTemplateColumns: `repeat(${Math.max(1, el.cols)}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}>
          {el.tiles.map((t, i) => {
            const done = Boolean(t.done);
            const label = t.label?.trim();
            const cell = cells?.[i];
            const body = (
              <>
                <ShapeArt shape={shape === 'square' ? 'band' : shape} height={shape === 'spine' ? `${SPINE_HEIGHTS[(i * 4 + Math.floor(i / Math.max(1, el.cols))) % SPINE_HEIGHTS.length] - 12}%` : undefined} />
                <span className="pp-shape-body">
                  {label && <span className={`pp-tile-label ${label.length > 3 ? 'is-long' : ''}`}>{label}</span>}
                  {mode === 'edit' ? (
                    <textarea className="pg-input pp-tile-text" value={t.text ?? ''} aria-label={`${label ? `${label}, ` : ''}tile ${i + 1}`} onChange={(e) => setTile(i, { text: e.target.value })} />
                  ) : (
                    t.text && <Fit className="pp-tile-text" text={t.text} />
                  )}
                </span>
                {done && mark !== 'fill' && <span className="pp-mark" aria-hidden="true" />}
                {cell && i === 0 && <span className="pp-path-end">Start</span>}
                {cell && i === last && last > 0 && <span className="pp-path-end is-finish">Finish</span>}
              </>
            );
            const cls = `pp-tile ${done ? 'is-done' : ''} ${cell ? `go-${cell.next}` : ''}`;
            const style = cell ? { gridRow: cell.row + 1, gridColumn: cell.col + 1 } : undefined;
            return tappable ? (
              <button key={i} type="button" className={cls} style={style} role="checkbox" aria-checked={done} aria-label={nameOf(i) || `Tile ${i + 1}`} onClick={() => tap(i)}>
                {body}
              </button>
            ) : (
              <div key={i} className={cls} style={style} aria-label={mode === 'edit' ? undefined : `${nameOf(i) || `Tile ${i + 1}`}${done ? ', done' : ''}`}>
                {body}
              </div>
            );
          })}
        </div>
        {celebration}
      </div>
    );
  }

  return (
    <div className={`pp-panel pp-tilegrid ${el.bare ? 'is-bare ' : ''}mark-${el.mark ?? 'cross'}`} style={{ ...textVars(el), ['--pp-mark' as string]: tint(el.color) }}>
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
          return tappable && !free ? (
            <button key={i} type="button" className={cls} role="checkbox" aria-checked={done} aria-label={name} onClick={() => tap(i)}>
              {body}
            </button>
          ) : (
            <div key={i} className={cls} aria-label={mode === 'edit' ? undefined : `${name}${done ? ', done' : ''}`}>
              {body}
            </div>
          );
        })}
      </div>
      {celebration}
    </div>
  );
}
