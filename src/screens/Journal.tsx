import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../data/store';
import { LOCALE } from '../domain/dates';
import type { Page, PageSize } from '../domain/pages';
import { EmptyState, PageHeader } from '../ui/Layout';
import { StaticPage } from '../ui/PageCanvas';
import { Sheet } from '../ui/Sheet';
import { useActiveTrackers } from '../data/hooks';
import { draftFromPreset, PRESETS } from '../data/defaults';
import { BUILT_IN_TEMPLATES, buildTemplatePage, TEMPLATE_SUBJECTS, type BuiltInTemplate } from '../templates/builtin';

const THUMB = { portrait: 168, landscape: 224 };

function PageCard({ page, children }: { page: Page; children?: ReactNode }) {
  return (
    <article className="page-card">
      <Link to={`/journal/${page.id}`} className="page-card-link" aria-label={`Open ${page.title || 'Untitled page'}`}>
        <StaticPage page={page} width={THUMB[page.size]} />
      </Link>
      <div className="page-card-text">
        <strong>{page.title || 'Untitled page'}</strong>
        <small className="muted">
          Changed {new Date(page.updatedAt).toLocaleDateString(LOCALE, { month: 'short', day: 'numeric' })}
        </small>
      </div>
      {children}
    </article>
  );
}

/** Ready-made templates: previews for the library, and a way to make a page from one. */
function useBuiltInTemplates() {
  const navigate = useNavigate();
  const trackers = useActiveTrackers();
  const weekStartsOn = useStore((s) => s.settings.weekStartsOn);
  const byName = (name: string) => useStore.getState().trackers.find((t) => !t.archived && t.name.trim().toLowerCase() === name.toLowerCase());

  const previews = useMemo(() => {
    const ctx = { today: new Date(), weekStartsOn, tracker: (name: string) => byName(name)?.id ?? '', trackerIds: trackers.map((t) => t.id) };
    return new Map(BUILT_IN_TEMPLATES.map((t) => [t.id, buildTemplatePage(t, ctx)]));
  }, [trackers, weekStartsOn]);

  /** Trackers this template shows that don't exist yet. */
  const missing = (t: BuiltInTemplate) => (t.needs ?? []).filter((name) => !byName(name));

  const use = (t: BuiltInTemplate, title?: string) => {
    const { createTracker, createPage } = useStore.getState();
    // a page that shows a tracker needs that tracker: reuse one with the same name, or add it
    const tracker = (name: string) => (byName(name) ?? createTracker(draftFromPreset(PRESETS.find((p) => p.name === name)))).id;
    const page = buildTemplatePage(t, { today: new Date(), weekStartsOn, tracker, trackerIds: trackers.map((x) => x.id) });
    const saved = createPage(title?.trim() || t.name, t.size, page, false);
    navigate(`/journal/${saved.id}`);
  };

  return { previews, missing, use };
}

function NewPageSheet({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const templates = useStore((s) => s.pages).filter((p) => p.isTemplate);
  const createPage = useStore((s) => s.createPage);
  const [title, setTitle] = useState('');
  const [size, setSize] = useState<PageSize>('portrait');
  const [templateId, setTemplateId] = useState<string | null>(null);
  const template = templates.find((t) => t.id === templateId);
  const builtIn = useBuiltInTemplates();
  const ready = BUILT_IN_TEMPLATES.find((t) => `ready-${t.id}` === templateId);

  const create = () => {
    if (ready) return builtIn.use(ready, title);
    const page = createPage(title.trim() || template?.title || 'Untitled page', template?.size ?? size, template, false);
    navigate(`/journal/${page.id}?edit=1`);
  };

  return (
    <Sheet
      title="New page"
      onClose={onClose}
      footer={
        <button className="btn btn-primary" onClick={create}>
          Create page
        </button>
      }
    >
      <div className="field">
        <label htmlFor="np-title">Title</label>
        <input id="np-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summer memories" maxLength={60} />
      </div>
      {(
        <div className="field">
          <span className="label" id="np-from">Start from</span>
          <div className="chips" role="radiogroup" aria-labelledby="np-from">
            <button role="radio" aria-checked={!template && !ready} className={`chip ${!template && !ready ? 'is-on' : ''}`} onClick={() => setTemplateId(null)}>
              Blank page
            </button>
            {templates.map((t) => (
              <button key={t.id} role="radio" aria-checked={templateId === t.id} className={`chip ${templateId === t.id ? 'is-on' : ''}`} onClick={() => setTemplateId(t.id)}>
                {t.title || 'Untitled template'}
              </button>
            ))}
          </div>
          <Link className="text-link" to="/templates" onClick={onClose}>
            Or pick from {BUILT_IN_TEMPLATES.length} ready-made templates
          </Link>
        </div>
      )}
      {!template && !ready && (
        <div className="field">
          <span className="label" id="np-shape">Shape</span>
          <div className="seg" role="radiogroup" aria-labelledby="np-shape">
            {(['portrait', 'landscape'] as const).map((s) => (
              <button key={s} role="radio" aria-checked={size === s} className={size === s ? 'is-on' : ''} onClick={() => setSize(s)}>
                {s === 'portrait' ? 'Tall' : 'Wide'}
              </button>
            ))}
          </div>
        </div>
      )}
    </Sheet>
  );
}

export function Journal() {
  const pages = useStore((s) => s.pages)
    .filter((p) => !p.isTemplate)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageHeader
        title="Journal"
        sub={pages.length ? `${pages.length} page${pages.length === 1 ? '' : 's'}` : undefined}
        action={
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            New page
          </button>
        }
      />
      {pages.length === 0 ? (
        <EmptyState emoji="✂️" title="No pages yet">
          <p>Make a page and arrange it however you like: photos, stickers, tape, notes and your trackers.</p>
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            Make the first page
          </button>
        </EmptyState>
      ) : (
        <div className="page-grid">
          {pages.map((p) => (
            <PageCard key={p.id} page={p} />
          ))}
        </div>
      )}
      {creating && <NewPageSheet onClose={() => setCreating(false)} />}
    </>
  );
}

export function Templates() {
  const navigate = useNavigate();
  const templates = useStore((s) => s.pages)
    .filter((p) => p.isTemplate)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const createPage = useStore((s) => s.createPage);
  const builtIn = useBuiltInTemplates();
  const [subject, setSubject] = useState<string>('All');

  return (
    <>
      <PageHeader title="Templates" sub="Start a page from one of these, then make it yours" />

      {templates.length > 0 && (
        <section className="group">
          <h2 className="group-title">Your templates</h2>
          <div className="page-grid">
            {templates.map((t) => (
              <PageCard key={t.id} page={t}>
                <button
                  className="btn btn-small"
                  onClick={() => {
                    const page = createPage(t.title, t.size, t, false);
                    navigate(`/journal/${page.id}?edit=1`);
                  }}
                >
                  Use template
                </button>
              </PageCard>
            ))}
          </div>
        </section>
      )}

      <div className="sticker-sets subject-chips" role="radiogroup" aria-label="Subject">
        <button role="radio" aria-checked={subject === 'All'} className={`chip ${subject === 'All' ? 'is-on' : ''}`} onClick={() => setSubject('All')}>
          All
        </button>
        {TEMPLATE_SUBJECTS.map((name) => (
          <button key={name} role="radio" aria-checked={subject === name} className={`chip ${subject === name ? 'is-on' : ''}`} onClick={() => setSubject(name)}>
            {name}
          </button>
        ))}
      </div>

      {TEMPLATE_SUBJECTS.filter((name) => subject === 'All' || subject === name).map((name) => (
        <section className="group" key={name}>
          <h2 className="group-title">{name}</h2>
          <div className="page-grid">
            {BUILT_IN_TEMPLATES.filter((t) => t.subject === name).map((t) => {
              const missing = builtIn.missing(t);
              return (
                <article key={t.id} className="page-card">
                  <button className="page-card-link" onClick={() => builtIn.use(t)} aria-label={`Use the ${t.name} template`}>
                    <StaticPage page={builtIn.previews.get(t.id)!} width={THUMB[t.size]} />
                  </button>
                  <div className="page-card-text">
                    <strong>{t.name}</strong>
                    <small className="muted">
                      {t.description}
                      {missing.length > 0 && ` Adds a ${missing.join(' and ')} tracker.`}
                    </small>
                  </div>
                  <button className="btn btn-small" onClick={() => builtIn.use(t)}>
                    Use template
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      ))}

      <p className="muted">To save one of your own pages as a template, open it and choose More, then "Save as a template".</p>
    </>
  );
}
