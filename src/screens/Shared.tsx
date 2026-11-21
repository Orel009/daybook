import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { acceptCopy, declineCopy, sharedPhotos, useShared, type CopyOffer } from '../data/sharing';
import { useToday } from '../data/hooks';
import { useStore } from '../data/store';
import { LOCALE, formatShort } from '../domain/dates';
import type { Page } from '../domain/pages';
import { buildDayMap, formatDay, formatValue, scheduleLabel, streakLabel, streaks } from '../domain/stats';
import { TAPE_COLORS, type TrackerDefinition, type TrackerEntry } from '../domain/types';
import { EmptyState, PageHeader } from '../ui/Layout';
import { PageSourceContext, StaticPage, type PageSource } from '../ui/PageCanvas';
import { configFor, getVisualization } from '../visualizations';
import { BookView } from './Book';

// "Shared with me": what other accounts share with this one, read-only.
// Everything here reads the separate shared layer (data/sharing.ts), never
// the book's own records.

const THUMB = { portrait: 168, landscape: 224 };

interface Owner {
  key: string;
  name: string;
  pages: Page[];
  trackers: TrackerDefinition[];
  entries: TrackerEntry[];
  hasBook: boolean;
  source: PageSource;
}

/** Everyone sharing with this account, with what they share. */
export function useOwners(): Owner[] {
  const shares = useShared((s) => s.shares);
  const items = useShared((s) => s.items);
  return useMemo(() => {
    const keys = [...new Set(shares.map((s) => s.owner_key))];
    return keys.map((key) => {
      const mine = items.filter((i) => i.ownerKey === key);
      const of = <T,>(kind: string) => mine.filter((i) => i.kind === kind).map((i) => i.data as unknown as T);
      const trackers = of<TrackerDefinition>('tracker').sort((a, b) => a.sortOrder - b.sortOrder);
      const entries = of<TrackerEntry>('entry');
      const pages = of<Page>('page').filter((p) => !p.isTemplate);
      return {
        key,
        name: shares.find((s) => s.owner_key === key)?.owner_name ?? 'Someone',
        pages,
        trackers,
        entries,
        hasBook: shares.some((s) => s.owner_key === key && s.scope === 'book'),
        source: { photos: sharedPhotos(key), tracker: (id: string) => trackers.find((t) => t.id === id), entries },
      };
    });
  }, [shares, items]);
}

const useOwner = (key: string | undefined) => useOwners().find((o) => o.key === key);

const ViewOnly = ({ name }: { name: string }) => <span className="shared-badge">Shared by {name} · view only</span>;

// ---------- sections in Journal, Trackers and Book ----------

/** Pages and templates someone sent as a copy: add to this book, or decline. */
export function CopiesWaiting() {
  const copies = useShared((s) => s.copies);
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  if (!copies.length && !message) return null;

  const act = async (offer: CopyOffer, accept: boolean) => {
    setBusy(offer.id);
    setMessage('');
    try {
      if (accept) {
        const page = await acceptCopy(offer);
        navigate(page.isTemplate ? '/templates' : `/journal/${page.id}`);
      } else {
        await declineCopy(offer);
        setMessage(`"${offer.title}" was declined.`);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'That did not work. Try again in a moment.');
    }
    setBusy(null);
  };

  return (
    <section className="card form-card copies-waiting" aria-label="Sent to you">
      <h2>Sent to you</h2>
      {copies.map((c) => (
        <div key={c.id} className="copy-offer">
          <p>
            <strong>{c.owner_name}</strong> sent you {c.is_template ? 'a template' : 'a page'}: <strong>{c.title}</strong>
            {c.photos > 0 && <span className="muted"> ({c.photos} photo{c.photos === 1 ? '' : 's'})</span>}
          </p>
          <div className="inline">
            <button className="btn btn-primary btn-small" onClick={() => act(c, true)} disabled={busy !== null}>
              {busy === c.id ? 'Adding…' : c.is_template ? 'Add to my templates' : 'Add to my journal'}
            </button>
            <button className="btn btn-quiet" onClick={() => act(c, false)} disabled={busy !== null}>
              No thanks
            </button>
          </div>
        </div>
      ))}
      {message && (
        <p className="muted" role="status">
          {message}
        </p>
      )}
    </section>
  );
}

export function SharedPagesSection() {
  const owners = useOwners().filter((o) => o.pages.length > 0);
  if (!owners.length) return null;
  return (
    <>
      {owners.map((o) => (
        <section className="group" key={o.key}>
          <h2 className="group-title">Shared by {o.name}</h2>
          <PageSourceContext.Provider value={o.source}>
            <div className="page-grid">
              {o.pages.map((p) => (
                <article key={p.id} className="page-card">
                  <Link to={`/shared/${o.key}/page/${p.id}`} className="page-card-link" aria-label={`Open ${p.title || 'Untitled page'}, shared by ${o.name}`}>
                    <StaticPage page={p} width={THUMB[p.size]} />
                  </Link>
                  <div className="page-card-text">
                    <strong>{p.title || 'Untitled page'}</strong>
                    <small className="muted">View only</small>
                  </div>
                </article>
              ))}
            </div>
          </PageSourceContext.Provider>
        </section>
      ))}
    </>
  );
}

export function SharedTrackersSection() {
  const owners = useOwners().filter((o) => o.trackers.some((t) => !t.archived));
  const today = useToday();
  if (!owners.length) return null;
  return (
    <>
      {owners.map((o) => (
        <section className="group" key={o.key}>
          <h2 className="group-title">Shared by {o.name}</h2>
          <div className="tracker-grid">
            {o.trackers
              .filter((t) => !t.archived)
              .map((t) => {
                const day = buildDayMap(t, o.entries).get(today);
                return (
                  <article key={t.id} className="card tracker-card">
                    <span className="tape" style={{ background: TAPE_COLORS[t.color] }} aria-hidden="true" />
                    <Link to={`/shared/${o.key}/tracker/${t.id}`} className="tracker-card-main">
                      <span className="tracker-emoji" aria-hidden="true">
                        {t.emoji}
                      </span>
                      <span>
                        <strong>{t.name}</strong>
                        <small>{scheduleLabel(t.schedule)}</small>
                      </span>
                    </Link>
                    <div className="tracker-card-foot">
                      <span className="muted">{formatDay(t, day) || 'Nothing today yet'}</span>
                      <span className="muted">View only</span>
                    </div>
                  </article>
                );
              })}
          </div>
        </section>
      ))}
    </>
  );
}

export function SharedBooksList() {
  const owners = useOwners().filter((o) => o.hasBook);
  if (!owners.length) return null;
  return (
    <section className="group">
      <h2 className="group-title">Books shared with you</h2>
      <ul className="rows">
        {owners.map((o) => (
          <li key={o.key} className="row">
            <Link to={`/shared/${o.key}/book`} className="row-main">
              <span className="dot" aria-hidden="true">
                📖
              </span>
              <span className="row-text">
                <strong>{o.name}’s book</strong>
                <small>
                  {o.pages.length} page{o.pages.length === 1 ? '' : 's'} · view only
                </small>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------- screens ----------

/** Width of a column, kept up to date. */
function useColumnWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  useLayoutEffect(() => {
    const measure = () => setWidth(ref.current?.clientWidth ?? 320);
    measure();
    const ro = new ResizeObserver(measure);
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

const Gone = ({ what, back, to }: { what: string; back: string; to: string }) => (
  <EmptyState emoji="🔒" title={`This ${what} isn't shared with you any more`}>
    <Link className="btn btn-primary" to={to}>
      {back}
    </Link>
  </EmptyState>
);

const BackLink = ({ to, label }: { to: string; label: string }) => (
  <Link to={to} className="icon-btn" aria-label={label}>
    ‹
  </Link>
);

/** A whole page, fitted to the screen, nothing editable. */
export function ReadOnlyPage({ page, source, children }: { page: Page; source: PageSource; children?: ReactNode }) {
  const { ref, width } = useColumnWidth();
  return (
    <div className="shared-page" ref={ref}>
      {children}
      <PageSourceContext.Provider value={source}>
        <StaticPage page={page} width={Math.min(width, page.size === 'landscape' ? 1200 : 900)} />
      </PageSourceContext.Provider>
    </div>
  );
}

export function SharedPageScreen() {
  const { owner, id } = useParams();
  const o = useOwner(owner);
  const page = o?.pages.find((p) => p.id === id);
  if (!o || !page) return <Gone what="page" back="Back to the journal" to="/journal" />;
  return (
    <>
      <PageHeader title={page.title || 'Untitled page'} sub={undefined} back={<BackLink to="/journal" label="Back to the journal" />} />
      <ViewOnly name={o.name} />
      <ReadOnlyPage page={page} source={o.source} />
    </>
  );
}

export function SharedTrackerScreen() {
  const { owner, id } = useParams();
  const o = useOwner(owner);
  const tracker = o?.trackers.find((t) => t.id === id);
  const weekStartsOn = useStore((s) => s.settings.weekStartsOn);
  const today = useToday();
  const days = useMemo(() => (tracker && o ? buildDayMap(tracker, o.entries) : new Map()), [tracker, o]);
  if (!o || !tracker) return <Gone what="tracker" back="Back to trackers" to="/trackers" />;

  const s = streaks(tracker, days, today, weekStartsOn);
  const viz = getVisualization(tracker.visualizationId);
  const recent = o.entries
    .filter((e) => e.trackerId === tracker.id && !e.deletedAt)
    .sort((a, b) => (a.date === b.date ? b.at.localeCompare(a.at) : b.date.localeCompare(a.date)))
    .slice(0, 20);

  return (
    <>
      <header className="page-head detail-head">
        <BackLink to="/trackers" label="Back to trackers" />
        <span className="detail-emoji" style={{ background: TAPE_COLORS[tracker.color] }} aria-hidden="true">
          {tracker.emoji}
        </span>
        <div className="page-head-text">
          <h1>{tracker.name}</h1>
          <p className="muted">{scheduleLabel(tracker.schedule)}</p>
        </div>
      </header>
      <ViewOnly name={o.name} />
      <div className="detail-grid">
        <section className="stats" aria-label="Summary">
          <div className="stat">
            <strong>{s.current.count}</strong>
            <span>
              {s.current.unit}
              {s.current.count === 1 ? '' : 's'} in a row
            </span>
          </div>
          <div className="stat">
            <strong>{s.best.count}</strong>
            <span>best streak ({streakLabel(s.best)})</span>
          </div>
        </section>
        <section className="card viz-card" style={{ ['--tracker' as string]: TAPE_COLORS[tracker.color] }}>
          <viz.Component tracker={tracker} days={days} today={today} weekStartsOn={weekStartsOn} config={configFor(tracker.visualizationConfig, viz.id)} />
        </section>
        <section className="card">
          <h2>Recent entries</h2>
          {recent.length === 0 ? (
            <p className="muted">Nothing logged yet.</p>
          ) : (
            <ul className="rows is-quiet">
              {recent.map((e) => (
                <li key={e.id} className="row">
                  <span className="row-text">
                    <strong>{formatShort(e.date)}</strong>
                    <small>
                      {formatValue(tracker, e.value)}
                      {e.note ? ` · ${e.note}` : ''}
                    </small>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

export function SharedBookScreen() {
  const { owner } = useParams();
  const o = useOwner(owner);
  const pages = useMemo(() => (o ? [...o.pages].sort((a, b) => a.sortOrder - b.sortOrder) : []), [o]);
  if (!o || !o.hasBook) return <Gone what="book" back="Back to the book" to="/book" />;
  return (
    <PageSourceContext.Provider value={o.source}>
      <BookView
        pages={pages}
        owner={o.name}
        header={<PageHeader title={`${o.name}’s book`} sub="Shared with you · view only" back={<BackLink to="/book" label="Back to your book" />} />}
        empty={<EmptyState emoji="📖" title={`${o.name}’s book has no pages yet`} />}
      />
    </PageSourceContext.Provider>
  );
}

/** A short date for lists ("Nov 21"). */
export const shortDate = (iso: string) => new Date(iso).toLocaleDateString(LOCALE, { month: 'short', day: 'numeric' });
