import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../data/store';
import { moveItem } from '../domain/order';
import { bookOrder, type Page } from '../domain/pages';
import { EmptyState, PageHeader } from '../ui/Layout';
import { StaticPage } from '../ui/PageCanvas';
import { Sheet } from '../ui/Sheet';
import { scrollerOf } from '../ui/dom';

// Arrange pages: every journal page as a small card, in book order.
//   touch  press and hold a card, then drag it; the screen scrolls near its edges
//   mouse  drag a card
//   keys   the "…" menu on each card moves it one place, to the start or to the end
// A move is saved when the card is dropped, as one changed page (see order.ts).

const THUMB_W = 132;
const HOLD_MS = 350;
const EDGE = 96; // how close to the top or bottom edge the screen starts to scroll

interface Drag {
  id: string;
  /** Where the card would land. */
  index: number;
  /** Pointer position, and where inside the card it was grabbed. */
  x: number;
  y: number;
  dx: number;
  dy: number;
  w: number;
}

const thumbWidth = (p: Page) => (p.size === 'landscape' ? THUMB_W : Math.round(THUMB_W * 0.82));

export function Arrange() {
  const [params] = useSearchParams();
  const back = params.get('from') === 'book' ? '/book' : '/journal';
  const all = useStore((s) => s.pages);
  const movePageTo = useStore((s) => s.movePageTo);
  const pages = useMemo(() => bookOrder(all), [all]);

  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [said, setSaid] = useState('');
  const grid = useRef<HTMLDivElement>(null);
  const cards = useRef(new Map<string, HTMLElement>());

  // what is on screen: the saved order, with the card in hand moved to where it would land
  const shown = drag ? moveItem(pages, drag.id, drag.index) : pages;
  const shownRef = useRef(shown);
  shownRef.current = shown;

  const update = (next: Drag | null) => {
    dragRef.current = next;
    setDrag(next);
  };

  /** The position the pointer is over, from the cards as they are laid out now. */
  const indexAt = (x: number, y: number): number | null => {
    const list = shownRef.current;
    let nearest: { i: number; d: number } | null = null;
    for (let i = 0; i < list.length; i++) {
      const r = cards.current.get(list[i].id)?.getBoundingClientRect();
      if (!r) continue;
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return i;
      const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
      if (!nearest || d < nearest.d) nearest = { i, d };
    }
    // between or beyond the cards: the nearest one, if it is close
    return nearest && nearest.d < 220 ? nearest.i : null;
  };

  const press = (e: React.PointerEvent<HTMLElement>, page: Page) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const start = { x: e.clientX, y: e.clientY };
    const pointer = { x: e.clientX, y: e.clientY };
    const touch = e.pointerType !== 'mouse';
    let active = false;
    let raf = 0;

    const pickUp = () => {
      active = true;
      const index = shownRef.current.findIndex((p) => p.id === page.id);
      update({ id: page.id, index, x: pointer.x, y: pointer.y, dx: start.x - rect.left, dy: start.y - rect.top, w: rect.width });
      navigator.vibrate?.(12);
      const scroller = scrollerOf(card);
      const tick = () => {
        // near the top or bottom edge: scroll, faster the closer the finger is
        const top = pointer.y;
        const bottom = window.innerHeight - pointer.y;
        const by = top < EDGE ? -Math.ceil((EDGE - top) / 6) : bottom < EDGE ? Math.ceil((EDGE - bottom) / 6) : 0;
        if (by) {
          scroller.scrollBy(0, by);
          follow();
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const follow = () => {
      const now = dragRef.current;
      if (!now) return;
      const index = indexAt(pointer.x, pointer.y) ?? now.index;
      update({ ...now, x: pointer.x, y: pointer.y, index });
    };

    const timer = touch ? window.setTimeout(pickUp, HOLD_MS) : 0;
    const move = (ev: PointerEvent) => {
      pointer.x = ev.clientX;
      pointer.y = ev.clientY;
      if (active) return follow();
      const far = Math.hypot(ev.clientX - start.x, ev.clientY - start.y);
      if (touch) {
        if (far > 10) finish(false); // the finger moved before the hold: that is scrolling
      } else if (far > 5) pickUp();
    };
    // once a card is in hand, the finger moves the card, not the screen
    const noScroll = (ev: TouchEvent) => active && ev.cancelable && ev.preventDefault();
    const finish = (drop: boolean) => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('touchmove', noScroll);
      const now = dragRef.current;
      update(null);
      if (!active || !now) return;
      if (drop) {
        const from = pages.findIndex((p) => p.id === now.id);
        if (from !== now.index) {
          movePageTo(now.id, now.index);
          setSaid(`${page.title || 'Untitled page'} is now page ${now.index + 1} of ${pages.length}.`);
        }
      }
    };
    const up = () => finish(true);
    const cancel = () => finish(false);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('touchmove', noScroll, { passive: false });
  };

  // a drag in progress must not outlive the screen
  useEffect(() => () => update(null), []);

  const menuPage = pages.find((p) => p.id === menuId);
  const menuIndex = menuPage ? pages.indexOf(menuPage) : -1;
  const moveFromMenu = (to: number) => {
    if (!menuPage) return;
    movePageTo(menuPage.id, to);
    setSaid(`${menuPage.title || 'Untitled page'} is now page ${Math.max(0, Math.min(pages.length - 1, to)) + 1} of ${pages.length}.`);
    setMenuId(null);
  };
  const inHand = drag ? pages.find((p) => p.id === drag.id) : undefined;

  return (
    <>
      <PageHeader
        title="Arrange pages"
        sub={pages.length > 1 ? 'Press and hold a page, then drag it to its place. The book follows this order.' : undefined}
        action={
          <Link className="btn btn-primary" to={back}>
            Done
          </Link>
        }
      />
      {pages.length === 0 ? (
        <EmptyState emoji="📖" title="No pages to arrange yet">
          <Link className="btn btn-primary" to="/journal">
            Go to the journal
          </Link>
        </EmptyState>
      ) : (
        <div className={`arr-grid ${drag ? 'is-dragging' : ''}`} ref={grid} onContextMenu={(e) => e.preventDefault()}>
          {shown.map((p, i) => (
            <div
              key={p.id}
              className={`arr-card ${drag?.id === p.id ? 'is-placeholder' : ''}`}
              ref={(node) => {
                if (node) cards.current.set(p.id, node);
                else cards.current.delete(p.id);
              }}
              onPointerDown={(e) => press(e, p)}
            >
              <div className="arr-thumb">
                <StaticPage page={p} width={thumbWidth(p)} />
              </div>
              <div className="arr-text">
                <span className="arr-num">{i + 1}</span>
                <strong>{p.title || 'Untitled page'}</strong>
                <button className="icon-btn arr-menu" aria-label={`Move ${p.title || 'Untitled page'}, page ${i + 1}`} onClick={() => setMenuId(p.id)}>
                  ⋯
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {drag && inHand && (
        <div className="arr-ghost" style={{ left: drag.x - drag.dx, top: drag.y - drag.dy, width: drag.w }} aria-hidden="true">
          <div className="arr-thumb">
            <StaticPage page={inHand} width={thumbWidth(inHand)} />
          </div>
        </div>
      )}
      <p className="sr-only" role="status" aria-live="polite">
        {said}
      </p>

      {menuPage && (
        <Sheet title={menuPage.title || 'Untitled page'} onClose={() => setMenuId(null)}>
          <p className="muted">
            Page {menuIndex + 1} of {pages.length}
          </p>
          <div className="menu-list">
            <button className="btn" onClick={() => moveFromMenu(0)} disabled={menuIndex === 0}>
              Move to start
            </button>
            <button className="btn" onClick={() => moveFromMenu(menuIndex - 1)} disabled={menuIndex === 0}>
              Move one earlier
            </button>
            <button className="btn" onClick={() => moveFromMenu(menuIndex + 1)} disabled={menuIndex === pages.length - 1}>
              Move one later
            </button>
            <button className="btn" onClick={() => moveFromMenu(pages.length - 1)} disabled={menuIndex === pages.length - 1}>
              Move to end
            </button>
          </div>
        </Sheet>
      )}
    </>
  );
}
