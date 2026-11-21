import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../data/store';
import { useDayMaps, useToday } from '../data/hooks';
import { PRESETS } from '../data/defaults';
import { formatDay, scheduleLabel, streakLabel, streaks } from '../domain/stats';
import { TAPE_COLORS } from '../domain/types';
import { EmptyState, PageHeader } from '../ui/Layout';
import { QuickLog } from '../ui/QuickLog';
import { SharedTrackersSection } from './Shared';

export function Trackers() {
  const all = useStore((s) => s.trackers);
  const categories = useStore((s) => s.categories);
  const weekStartsOn = useStore((s) => s.settings.weekStartsOn);
  const maps = useDayMaps();
  const today = useToday();
  const navigate = useNavigate();
  const [showArchived, setShowArchived] = useState(false);

  const active = all.filter((t) => !t.archived);
  const archived = all.filter((t) => t.archived);
  const groups = categories
    .map((c) => ({ category: c, items: active.filter((t) => t.categoryId === c.id) }))
    .filter((g) => g.items.length > 0);
  const orphaned = active.filter((t) => !categories.some((c) => c.id === t.categoryId));
  if (orphaned.length) groups.push({ category: { id: 'other', name: 'Other', emoji: '📎', updatedAt: '' }, items: orphaned });

  return (
    <>
      <PageHeader
        title="Trackers"
        sub={active.length ? `${active.length} in your book` : undefined}
        action={
          <Link className="btn btn-primary" to="/trackers/new">
            Add a tracker
          </Link>
        }
      />

      {active.length === 0 && (
        <EmptyState emoji="🪴" title="Nothing to track yet">
          <p>Start from one of these, or make your own from scratch.</p>
          <div className="preset-grid">
            {PRESETS.map((p, i) => (
              <button key={p.name} className="preset" onClick={() => navigate(`/trackers/new?preset=${i}`)}>
                <span className="dot" style={{ background: TAPE_COLORS[p.color] }} aria-hidden="true">
                  {p.emoji}
                </span>
                {p.name}
              </button>
            ))}
          </div>
        </EmptyState>
      )}

      {groups.map((g) => (
        <section key={g.category.id} className="group">
          <h2 className="group-title">
            <span aria-hidden="true">{g.category.emoji}</span> {g.category.name}
          </h2>
          <div className="tracker-grid">
            {g.items.map((t) => {
              const map = maps.get(t.id)!;
              const s = streaks(t, map, today, weekStartsOn);
              const day = map.get(today);
              return (
                <article key={t.id} className="card tracker-card">
                  <span className="tape" style={{ background: TAPE_COLORS[t.color] }} aria-hidden="true" />
                  <Link to={`/trackers/${t.id}`} className="tracker-card-main">
                    <span className="tracker-emoji" aria-hidden="true">
                      {t.emoji}
                    </span>
                    <span>
                      <strong>{t.name}</strong>
                      <small>{scheduleLabel(t.schedule)}</small>
                    </span>
                  </Link>
                  <div className="tracker-card-foot">
                    <span className="muted">
                      {formatDay(t, day) || (s.current.count > 0 ? `${streakLabel(s.current)} in a row` : 'Nothing today yet')}
                    </span>
                    <QuickLog tracker={t} day={day} date={today} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}

      {archived.length > 0 && (
        <section className="group">
          <button className="btn btn-quiet" onClick={() => setShowArchived(!showArchived)} aria-expanded={showArchived}>
            {showArchived ? 'Hide' : 'Show'} archived ({archived.length})
          </button>
          {showArchived && (
            <ul className="rows is-quiet">
              {archived.map((t) => (
                <li key={t.id} className="row">
                  <Link to={`/trackers/${t.id}`} className="row-main">
                    <span className="dot" style={{ background: TAPE_COLORS[t.color] }} aria-hidden="true">
                      {t.emoji}
                    </span>
                    <span className="row-text">
                      <strong>{t.name}</strong>
                      <small>Archived, history kept</small>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <SharedTrackersSection />
    </>
  );
}
