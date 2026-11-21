import { useState } from 'react';
import { useStore } from '../data/store';
import { LOCALE, WEEKDAY_SHORT } from '../domain/dates';
import { newItem, type BookshelfElement, type BoxElement, type ChecklistElement, type MonthElement, type TableElement, type WritingElement } from '../domain/pages';
import { TAPE_COLORS } from '../domain/types';

// Page parts that are filled in while viewing: checklists, tables, lined
// writing areas and a month grid. When `onChange` is given (view mode) they
// show real inputs and save on every change; otherwise they draw the same
// content as plain text (thumbnails, and while arranging in edit mode).

export type PartChange = (patch: Record<string, unknown>) => void;

const tint = (color: string | undefined) => TAPE_COLORS[color ?? ''] ?? TAPE_COLORS.rose;

function Head({ title, color }: { title: string; color: string }) {
  if (!title) return null;
  return (
    <div className="pp-head" style={{ background: tint(color) }}>
      {title}
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

export function ChecklistBody({ el, onChange }: { el: ChecklistElement; onChange?: PartChange }) {
  const [focusId, setFocusId] = useState<string | null>(null);
  const setItems = (items: ChecklistElement['items']) => onChange?.({ items });
  const add = (afterIndex: number) => {
    const item = newItem();
    const items = [...el.items];
    items.splice(afterIndex + 1, 0, item);
    setItems(items);
    setFocusId(item.id);
  };
  return (
    <div className="pp-panel pp-checklist">
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
              style={item.done ? { background: tint(el.color) } : undefined}
              onClick={() => setItems(el.items.map((x) => (x.id === item.id ? { ...x, done: !x.done } : x)))}
            >
              {item.done && (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.500" />
                </svg>
              )}
            </button>
            {onChange ? (
              <input
                type="text"
                className="pg-input"
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
              <span className="pp-item-text">{item.text || ' '}</span>
            )}
          </li>
        ))}
      </ul>
      {onChange && (
        <button type="button" className="pp-add" onClick={() => add(el.items.length - 1)}>
          + Add a line
        </button>
      )}
    </div>
  );
}

export function TableBody({ el, onChange }: { el: TableElement; onChange?: PartChange }) {
  const labelled = el.rows.some((r) => r.trim());
  return (
    <div className="pp-panel pp-table">
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
                {onChange ? (
                  <textarea
                    className="pg-input"
                    value={el.cells[key] ?? ''}
                    aria-label={`${r || `Row ${ri + 1}`}, ${c || `column ${ci + 1}`}`}
                    onChange={(e) => onChange({ cells: { ...el.cells, [key]: e.target.value } })}
                  />
                ) : (
                  <span>{el.cells[key]}</span>
                )}
              </div>
            );
          }),
        ])}
      </div>
    </div>
  );
}

export function WritingBody({ el, onChange }: { el: WritingElement; onChange?: PartChange }) {
  return (
    <div className="pp-panel pp-writing">
      <Head title={el.title} color={el.color} />
      {onChange ? (
        <textarea
          className={`pg-input pp-paper ${el.lined ? 'is-lined' : ''}`}
          value={el.text}
          placeholder="Write here"
          aria-label={el.title || 'Writing area'}
          onChange={(e) => onChange({ text: e.target.value })}
        />
      ) : (
        <div className={`pp-paper ${el.lined ? 'is-lined' : ''}`}>{el.text}</div>
      )}
    </div>
  );
}

export const monthTitle = (year: number, month: number) => new Date(year, month, 1).toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' });

export function MonthBody({ el, onChange }: { el: MonthElement; onChange?: PartChange }) {
  const weekStartsOn = useStore((s) => s.settings.weekStartsOn);
  const days = new Date(el.year, el.month + 1, 0).getDate();
  const lead = (new Date(el.year, el.month, 1).getDay() - weekStartsOn + 7) % 7;
  const weeks = Math.ceil((lead + days) / 7);
  const now = new Date();
  const today = now.getFullYear() === el.year && now.getMonth() === el.month ? now.getDate() : 0;
  return (
    <div className="pp-panel pp-month">
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
              {onChange ? (
                <textarea
                  className="pg-input"
                  value={el.notes[day] ?? ''}
                  aria-label={`${monthTitle(el.year, el.month)} ${day}`}
                  onChange={(e) => onChange({ notes: { ...el.notes, [day]: e.target.value } })}
                />
              ) : (
                <span>{el.notes[day]}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const SPINE_HEIGHTS = [92, 100, 84, 96, 80, 100, 88, 94, 82];

/** Shelves of blank book spines. Type a title on a spine; tap its star once it's read. */
export function BookshelfBody({ el, onChange }: { el: BookshelfElement; onChange?: PartChange }) {
  const per = Math.max(1, el.perShelf);
  const shelves = Array.from({ length: Math.ceil(el.books.length / per) }, (_, i) => el.books.slice(i * per, (i + 1) * per));
  const setBook = (id: string, patch: Partial<BookshelfElement['books'][number]>) => onChange?.({ books: el.books.map((b) => (b.id === id ? { ...b, ...patch } : b)) });
  return (
    <div className="pp-panel pp-bookcase">
      <Head title={el.title} color={el.color} />
      <div className="pp-shelves" style={{ gridTemplateRows: `repeat(${Math.max(1, shelves.length)}, minmax(0, 1fr))` }}>
        {shelves.map((row, r) => (
          <div key={r} className="pp-shelf">
            {row.map((book, i) => {
              const n = r * per + i;
              return (
                <div key={book.id} className={`pp-book ${book.read ? 'is-read' : ''}`} style={{ height: `${SPINE_HEIGHTS[(n * 4 + r) % SPINE_HEIGHTS.length]}%`, background: tint(book.color) }}>
                  {onChange ? (
                    <textarea className="pg-input pp-spine" value={book.title} placeholder="Title" aria-label={`Book ${n + 1} title`} onChange={(e) => setBook(book.id, { title: e.target.value.replace(/\n/g, ' ') })} />
                  ) : (
                    <span className="pp-spine">{book.title}</span>
                  )}
                  <button type="button" className="pp-read" role="checkbox" aria-checked={book.read} aria-label={`${book.title || `Book ${n + 1}`} read`} disabled={!onChange} onClick={() => setBook(book.id, { read: !book.read })}>
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
