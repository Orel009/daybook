import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isUnsavedCover, useStore } from '../data/store';
import { matchingBack } from '../domain/covers';
import { bookOrder, coverOf, type Page } from '../domain/pages';
import { themeAccent } from '../ui/dom';
import { EmptyState, PageHeader } from '../ui/Layout';
import { StaticPage } from '../ui/PageCanvas';
import { SharedBooksList } from './Shared';

// The book: every journal page bound in order between two covers.
//   - wide screens show a two-page spread, narrow ones a single page
//   - a turn is drawn as one leaf rotating about the spine: its front is the
//     page being left, its back the page being arrived at
// Pages here are for reading; "Open" goes to the page itself for writing.

type Side = { kind: 'cover'; page?: Page } | { kind: 'back'; page?: Page } | { kind: 'blank' } | { kind: 'page'; page: Page };

const TURN_MS = 620;
const RATIO = 3 / 4; // every side is a tall sheet; wide pages are fitted inside

function SideView({ side, width, owner, count }: { side: Side | undefined; width: number; owner: string; count: number }) {
  const height = width / RATIO;
  if (!side) return <div className="bk-side is-empty" style={{ width, height }} />;
  if ((side.kind === 'cover' || side.kind === 'back') && side.page) {
    // a cover the owner designed: an ordinary page, drawn edge to edge
    return (
      <div className={`bk-side bk-own-cover ${side.kind === 'back' ? 'is-back' : ''}`} style={{ width, height }}>
        <StaticPage page={side.page} width={width} coverCount={count} />
      </div>
    );
  }
  if (side.kind === 'cover') {
    return (
      <div className="bk-side bk-cover" style={{ width, height }}>
        <span className="bk-cover-tape" aria-hidden="true" />
        <div className="bk-cover-label">
          <strong>{owner ? `${owner}’s` : 'My'}</strong>
          <span>Daybook</span>
        </div>
        <small>
          {count} page{count === 1 ? '' : 's'}
        </small>
      </div>
    );
  }
  if (side.kind === 'back') return <div className="bk-side bk-cover is-back" style={{ width, height }} />;
  if (side.kind === 'blank') return <div className="bk-side bk-blank" style={{ width, height }} />;
  const wide = side.page.size === 'landscape';
  return (
    <div className="bk-side bk-page" style={{ width, height }}>
      <StaticPage page={side.page} width={wide ? width - 16 : width} />
    </div>
  );
}

/** This book, with reordering and a way into each page. */
export function Book() {
  const navigate = useNavigate();
  const allPages = useStore((s) => s.pages);
  const owner = useStore((s) => s.settings.ownerName);
  const movePage = useStore((s) => s.movePage);
  const ensureCover = useStore((s) => s.ensureCover);
  const pages = useMemo(() => bookOrder(allPages), [allPages]);
  // a cover that was opened for editing and left unchanged is not the book's cover
  const dropUnsavedCovers = useStore((s) => s.dropUnsavedCovers);
  useEffect(() => dropUnsavedCovers(), [dropUnsavedCovers]);
  const saved = useMemo(() => allPages.filter((p) => !isUnsavedCover(p.id)), [allPages]);
  const cover = useMemo(() => coverOf(saved, 'cover'), [saved]);
  const back = useMemo(() => coverOf(saved, 'back'), [saved]);
  return (
    <BookView
      pages={pages}
      owner={owner}
      cover={cover}
      back={back}
      header={<PageHeader title="Book" sub="Swipe, tap the arrows or use the arrow keys to turn the page" />}
      coverAction={(which) => (
        <button
          className="btn btn-small btn-primary"
          onClick={() => {
            // the first time, the cover page is made from the look the book has now
            const page = ensureCover(which, themeAccent());
            navigate(`/journal/${page.id}?edit=1`);
          }}
        >
          {which === 'cover' ? 'Edit cover' : 'Edit back cover'}
        </button>
      )}
      empty={
        <>
          <PageHeader title="Book" />
          <EmptyState emoji="📖" title="Your book is waiting for its first page">
            <p>Every page you make in the journal is bound in here, in order, ready to flip through.</p>
            <Link className="btn btn-primary" to="/journal">
              Go to the journal
            </Link>
          </EmptyState>
        </>
      }
      pageActions={(page, n, total) => (
        <>
          <button className="btn btn-small" onClick={() => movePage(page.id, -1)} disabled={n === 1} aria-label={`Move ${page.title || 'this page'} earlier in the book`}>
            Earlier
          </button>
          <button className="btn btn-small" onClick={() => movePage(page.id, 1)} disabled={n === total} aria-label={`Move ${page.title || 'this page'} later in the book`}>
            Later
          </button>
          <Link className="btn btn-small btn-primary" to={`/journal/${page.id}`}>
            Open
          </Link>
        </>
      )}
      after={<SharedBooksList />}
    />
  );
}

interface BookViewProps {
  /** Journal pages in book order. */
  pages: Page[];
  /** Name on the cover. */
  owner: string;
  header: ReactNode;
  empty: ReactNode;
  /** Buttons under the pages in view (own book only). */
  pageActions?: (page: Page, number: number, total: number) => ReactNode;
  /** The covers as the owner designed them; without them the book draws its standard covers. */
  cover?: Page;
  back?: Page;
  /** A button shown while a cover is in view (own book only). */
  coverAction?: (which: 'cover' | 'back') => ReactNode;
  after?: ReactNode;
}

/** Any book: this one, one shared with this account, or one opened from a public link. */
export function BookView({ pages, owner, header, empty, pageActions, cover, back, coverAction, after }: BookViewProps) {

  // cover, pages, a blank if needed so the back cover closes on the left, back cover
  const sides = useMemo<Side[]>(() => {
    const list: Side[] = [{ kind: 'cover', page: cover }, ...pages.map((page) => ({ kind: 'page' as const, page }))];
    if (pages.length % 2 === 1) list.push({ kind: 'blank' });
    // a back cover without a design of its own matches the front
    list.push({ kind: 'back', page: back ?? (cover ? matchingBack(cover) : undefined) });
    return list;
  }, [pages, cover, back]);

  // ----- sizing
  const area = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 320, vh: 800, vw: 400 });
  useLayoutEffect(() => {
    const measure = () => setBox({ w: area.current?.clientWidth ?? 320, vh: window.innerHeight, vw: window.innerWidth });
    measure();
    const ro = new ResizeObserver(measure);
    if (area.current) ro.observe(area.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [pages.length === 0]);
  const spread = box.vw >= 900;
  const roomH = Math.max(320, box.vh - (spread ? 250 : 300));
  const sideW = Math.floor(spread ? Math.min(box.w / 2 - 6, roomH * RATIO) : Math.min(box.w - 4, Math.max(roomH * RATIO, 260)));

  // ----- position. In spread mode `at` counts spreads; otherwise it counts sides.
  const last = spread ? Math.floor(sides.length / 2) : sides.length - 1;
  const [atRaw, setAt] = useState(0);
  const at = Math.min(atRaw, last);
  const [turn, setTurn] = useState<1 | -1 | null>(null);
  const reduceMotion = useMemo(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false, []);
  const wasSpread = useRef(spread);
  useEffect(() => {
    // keep the same page in view when the layout switches between one and two pages
    if (wasSpread.current !== spread) setAt((a) => (spread ? Math.ceil(a / 2) : Math.max(0, a * 2 - 1)));
    wasSpread.current = spread;
  }, [spread]);

  const go = (dir: 1 | -1) => {
    if (turn || at + dir < 0 || at + dir > last) return;
    if (reduceMotion) return setAt(at + dir);
    setTurn(dir);
    window.setTimeout(() => {
      setAt((a) => Math.min(last, Math.max(0, a + dir)));
      setTurn(null);
    }, TURN_MS);
  };
  const goRef = useRef(go);
  goRef.current = go;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, textarea, select')) return;
      if (e.key === 'ArrowRight') goRef.current(1);
      if (e.key === 'ArrowLeft') goRef.current(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // swipe to turn
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const onDown = (e: React.PointerEvent) => (swipe.current = { x: e.clientX, y: e.clientY });
  const onUp = (e: React.PointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(e.clientY - s.y) * 1.3) go(dx < 0 ? 1 : -1);
  };

  if (pages.length === 0) {
    return (
      <>
        {empty}
        {after}
      </>
    );
  }

  const side = (i: number) => (i >= 0 && i < sides.length ? sides[i] : undefined);
  const view = (s: Side | undefined) => <SideView side={s} width={sideW} owner={owner} count={pages.length} />;

  // which sides sit underneath, and which two ride on the turning leaf
  let left: Side | undefined;
  let right: Side | undefined;
  let leafFront: Side | undefined;
  let leafBack: Side | undefined;
  if (spread) {
    const L = (s: number) => side(2 * s - 1);
    const R = (s: number) => side(2 * s);
    left = turn === -1 ? L(at - 1) : L(at);
    right = turn === 1 ? R(at + 1) : R(at);
    if (turn === 1) [leafFront, leafBack] = [R(at), L(at + 1)];
    if (turn === -1) [leafFront, leafBack] = [L(at), R(at - 1)];
  } else {
    right = turn === 1 ? side(at + 1) : side(at);
    if (turn === 1) leafFront = side(at);
    if (turn === -1) leafFront = side(at - 1);
  }

  const shown = (spread ? [side(2 * at - 1), side(2 * at)] : [side(at)]).filter((s): s is Extract<Side, { kind: 'page' }> => s?.kind === 'page');
  const numberOf = (p: Page) => pages.findIndex((x) => x.id === p.id) + 1;
  const where =
    shown.length === 0
      ? at === 0
        ? 'Front cover'
        : 'Back cover'
      : `Page ${shown.map((s) => numberOf(s.page)).join(' and ')} of ${pages.length}`;

  return (
    <>
      {header}

      <div className="bk-area" ref={area}>
        <div
          className={`bk ${spread ? 'is-spread' : 'is-single'} ${turn === 1 ? 'turn-next' : ''} ${turn === -1 ? 'turn-prev' : ''}`}
          style={{ width: spread ? sideW * 2 : sideW, height: sideW / RATIO, ['--turn' as string]: `${TURN_MS}ms` }}
          onPointerDown={onDown}
          onPointerUp={onUp}
          onPointerCancel={() => (swipe.current = null)}
          role="group"
          aria-label={`Book, ${where}`}
        >
          {spread && <div className="bk-half is-left">{view(left)}</div>}
          <div className="bk-half is-right">{view(right)}</div>
          {turn && (
            <div className="bk-leaf" aria-hidden="true">
              <div className="bk-face is-front">{view(leafFront)}</div>
              {spread && <div className="bk-face is-back">{view(leafBack)}</div>}
            </div>
          )}
          {spread && at > 0 && at < last && <span className="bk-spine" aria-hidden="true" />}
        </div>
      </div>

      <div className="bk-controls">
        <button className="btn" onClick={() => go(-1)} disabled={at === 0 || !!turn} aria-label="Previous page">
          ‹ Back
        </button>
        <strong aria-live="polite">{where}</strong>
        <button className="btn" onClick={() => go(1)} disabled={at === last || !!turn} aria-label="Next page">
          Next ›
        </button>
      </div>

      {coverAction && shown.length === 0 && <div className="bk-cover-actions">{coverAction(at === 0 ? 'cover' : 'back')}</div>}

      {shown.length > 0 && (
        <ul className="bk-pages">
          {shown.map((s) => {
            const n = numberOf(s.page);
            return (
              <li key={s.page.id}>
                <span>
                  <strong>{s.page.title || 'Untitled page'}</strong>
                  <small className="muted">Page {n}</small>
                </span>
                {pageActions && <span className="bk-page-actions">{pageActions(s.page, n, pages.length)}</span>}
              </li>
            );
          })}
        </ul>
      )}
      {after}
    </>
  );
}
