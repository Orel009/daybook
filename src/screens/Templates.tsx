import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { draftFromPreset, PRESETS } from '../data/defaults';
import { useActiveTrackers } from '../data/hooks';
import { useStore } from '../data/store';
import { lastEdited, PAGE_DIMS, type Page, type PageSize } from '../domain/pages';
import type { BuiltInTemplate, TemplateContext } from '../templates/library';
import { findTemplates, matchesQuery, subjectsOf } from '../templates/search';
import { TEMPLATE_GROUPS } from '../templates/subjects';
import { PageHeader } from '../ui/Layout';
import { StaticPage } from '../ui/PageCanvas';
import { PageCard, THUMB } from './Journal';
import { TemplatePreview } from './TemplatePreview';

// The Templates screen. With a few hundred templates it has to stay light:
//   - the templates themselves (templates/library.ts) are a separate piece of
//     the app, fetched the first time this screen is opened
//   - a thumbnail is only drawn once its card scrolls near the screen
// Tapping a card opens a preview (the address gets ?preview=<id>, so Back
// closes it); the card's "Use" button makes the page straight away.

type Library = typeof import('../templates/library');
let loaded: Library | null = null;

/** The template library, or null while it is being fetched. */
function useLibrary(): Library | null {
  const [library, setLibrary] = useState(loaded);
  useEffect(() => {
    if (library) return;
    let live = true;
    void import('../templates/library').then((m) => {
      loaded = m;
      if (live) setLibrary(m);
    });
    return () => {
      live = false;
    };
  }, [library]);
  return library;
}

/** A page thumbnail that is drawn when it comes near the screen; until then, an empty sheet of the same size. */
function LazyThumb({ page, size }: { page: () => Page; size: PageSize }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    const node = ref.current;
    if (near || !node) return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setNear(true), { rootMargin: '600px 0px' });
    io.observe(node);
    return () => io.disconnect();
  }, [near]);
  const width = THUMB[size];
  if (near) return <StaticPage page={page()} width={width} />;
  return <div ref={ref} className="pg is-thumb is-waiting" style={{ width, height: (PAGE_DIMS[size].h * width) / PAGE_DIMS[size].w }} />;
}

export function Templates() {
  const navigate = useNavigate();
  const library = useLibrary();
  const trackers = useActiveTrackers();
  const weekStartsOn = useStore((s) => s.settings.weekStartsOn);
  const createPage = useStore((s) => s.createPage);
  const allPages = useStore((s) => s.pages);
  const mine = useMemo(() => allPages.filter((p) => p.isTemplate).sort((a, b) => lastEdited(b).localeCompare(lastEdited(a))), [allPages]);

  const [group, setGroup] = useState('All');
  const [subject, setSubject] = useState('All');
  const [query, setQuery] = useState('');

  const byName = (name: string) => useStore.getState().trackers.find((t) => !t.archived && t.name.trim().toLowerCase() === name.toLowerCase());
  /** Trackers this template shows that don't exist yet. */
  const missing = (t: BuiltInTemplate) => (t.needs ?? []).filter((name) => !byName(name));

  // previews are built one at a time, when their card is first drawn, and kept until the trackers change
  const previews = useMemo(() => new Map<string, Page>(), [trackers, weekStartsOn, library]);
  const preview = (t: BuiltInTemplate) => {
    let page = previews.get(t.id);
    if (!page && library) {
      const ctx: TemplateContext = { today: new Date(), weekStartsOn, tracker: (name) => byName(name)?.id ?? '', trackerIds: trackers.map((x) => x.id) };
      page = library.buildTemplatePage(t, ctx);
      previews.set(t.id, page);
    }
    return page!;
  };

  const use = (t: BuiltInTemplate, fromPreview = false) => {
    if (!library) return;
    const { createTracker } = useStore.getState();
    // a page that shows a tracker needs that tracker: reuse one with the same name, or add it
    const tracker = (name: string) => (byName(name) ?? createTracker(draftFromPreset(PRESETS.find((p) => p.name === name)))).id;
    const page = library.buildTemplatePage(t, { today: new Date(), weekStartsOn, tracker, trackerIds: trackers.map((x) => x.id) });
    const saved = createPage(t.name, t.size, page, false);
    // from the preview, the new page takes the preview's place, so Back returns to the templates
    navigate(`/journal/${saved.id}`, { replace: fromPreview });
  };

  const sections = useMemo(() => (library ? findTemplates(library.BUILT_IN_TEMPLATES, { query, group, subject }) : []), [library, query, group, subject]);
  const myMatches = mine.filter((t) => matchesQuery(query, t.title || 'Untitled page'));
  const nothing = Boolean(library) && sections.length === 0 && myMatches.length === 0;

  // ----- the preview: which template, and which ones the arrows and swipes move through
  const [params, setParams] = useSearchParams();
  const previewId = params.get('preview');
  const previewed = previewId && library ? library.BUILT_IN_TEMPLATES.find((t) => t.id === previewId) : undefined;
  const openedHere = useRef(false);
  useEffect(() => {
    if (!previewId) openedHere.current = false;
    // an address with a template that doesn't exist: just the list
    else if (library && !previewed) setParams({}, { replace: true });
  }, [previewId, library, previewed, setParams]);
  const openPreview = (t: BuiltInTemplate) => {
    openedHere.current = true;
    setParams({ preview: t.id });
  };
  const closePreview = () => {
    // Back closes it too; closing by hand goes back the same way, so it isn't left in the history
    if (openedHere.current) navigate(-1);
    else setParams({}, { replace: true });
  };
  const previewList = useMemo(() => {
    if (!previewed) return [];
    // searching: the results in order; otherwise the templates of its subject
    if (query.trim()) return sections.flatMap((s) => s.templates);
    return sections.find((s) => s.subject === previewed.subject)?.templates ?? [previewed];
  }, [previewed, query, sections]);

  return (
    <>
      <PageHeader title="Templates" sub="Start a page from one of these, then make it yours" />

      <div className="template-search">
        <label htmlFor="template-search" className="sr-only">
          Search templates
        </label>
        <input id="template-search" type="search" placeholder="Search templates: bingo, birthday, January…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {myMatches.length > 0 && (
        <section className="group">
          <h2 className="group-title">Your templates</h2>
          <div className="page-grid">
            {myMatches.map((t) => (
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
                <button className="btn btn-small btn-quiet" onClick={() => navigate(`/export?page=${t.id}`)} aria-label={`Print ${t.title || 'this template'}`}>
                  Print
                </button>
              </PageCard>
            ))}
          </div>
        </section>
      )}

      <div className="sticker-sets group-chips" role="radiogroup" aria-label="Kind of template">
        {['All', ...TEMPLATE_GROUPS.map((g) => g.name)].map((name) => (
          <button
            key={name}
            role="radio"
            aria-checked={group === name}
            className={`chip ${group === name ? 'is-on' : ''}`}
            onClick={() => {
              setGroup(name);
              setSubject('All');
            }}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="sticker-sets subject-chips" role="radiogroup" aria-label="Subject">
        <button role="radio" aria-checked={subject === 'All'} className={`chip ${subject === 'All' ? 'is-on' : ''}`} onClick={() => setSubject('All')}>
          {group === 'All' ? 'Every subject' : `All ${group.toLowerCase()}`}
        </button>
        {subjectsOf(group).map((name) => (
          <button key={name} role="radio" aria-checked={subject === name} className={`chip ${subject === name ? 'is-on' : ''}`} onClick={() => setSubject(name)}>
            {name}
          </button>
        ))}
      </div>

      {!library && (
        <p className="muted" role="status">
          Getting the templates…
        </p>
      )}
      {nothing && <p className="muted">No templates match "{query.trim()}". Try another word, or pick a subject.</p>}

      {sections.map(({ subject: name, templates }) => (
        <section className="group" key={name}>
          <h2 className="group-title">{name}</h2>
          <div className="page-grid">
            {templates.map((t) => {
              const needs = missing(t);
              return (
                <article key={t.id} className="page-card">
                  <button className="page-card-link" onClick={() => openPreview(t)} aria-label={`Preview the ${t.name} template`}>
                    <LazyThumb page={() => preview(t)} size={t.size} />
                  </button>
                  <div className="page-card-text">
                    <strong>{t.name}</strong>
                    <small className="muted">
                      {t.description}
                      {needs.length > 0 && ` Adds a ${needs.join(' and ')} tracker.`}
                    </small>
                  </div>
                  <div className="page-card-actions">
                    <button className="btn btn-small" onClick={() => use(t)} aria-label={`Use the ${t.name} template`}>
                      Use
                    </button>
                    <button className="btn btn-small btn-quiet" onClick={() => navigate(`/export?template=${t.id}`)} aria-label={`Print the ${t.name} template blank`}>
                      Print blank
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}

      <p className="muted">To save one of your own pages as a template, open it and choose More, then "Save as a template".</p>

      {library && previewed && (
        <TemplatePreview
          library={library}
          list={previewList.some((t) => t.id === previewed.id) ? previewList : [previewed]}
          template={previewed}
          onMove={(t) => setParams({ preview: t.id }, { replace: true })}
          onClose={closePreview}
          onUse={(t) => use(t, true)}
          onPrint={(t) => navigate(`/export?template=${t.id}`)}
        />
      )}
    </>
  );
}
