import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../data/store';
import { LOCALE } from '../domain/dates';
import { isJournalPage, lastEdited, type Page, type PageSize } from '../domain/pages';
import { EmptyState, PageHeader } from '../ui/Layout';
import { StaticPage } from '../ui/PageCanvas';
import { Sheet } from '../ui/Sheet';
import { TEMPLATE_COUNT } from '../templates/subjects';
import { CopiesWaiting, SharedPagesSection } from './Shared';

export const THUMB = { portrait: 168, landscape: 224 };

export function PageCard({ page, children }: { page: Page; children?: ReactNode }) {
  return (
    <article className="page-card">
      <Link to={`/journal/${page.id}`} className="page-card-link" aria-label={`Open ${page.title || 'Untitled page'}`}>
        <StaticPage page={page} width={THUMB[page.size]} />
      </Link>
      <div className="page-card-text">
        <strong>{page.title || 'Untitled page'}</strong>
        <small className="muted">
          Changed {new Date(lastEdited(page)).toLocaleDateString(LOCALE, { month: 'short', day: 'numeric' })}
        </small>
      </div>
      {children}
    </article>
  );
}

function NewPageSheet({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const templates = useStore((s) => s.pages).filter((p) => p.isTemplate);
  const createPage = useStore((s) => s.createPage);
  const [title, setTitle] = useState('');
  const [size, setSize] = useState<PageSize>('portrait');
  const [templateId, setTemplateId] = useState<string | null>(null);
  const template = templates.find((t) => t.id === templateId);

  const create = () => {
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
            <button role="radio" aria-checked={!template} className={`chip ${!template ? 'is-on' : ''}`} onClick={() => setTemplateId(null)}>
              Blank page
            </button>
            {templates.map((t) => (
              <button key={t.id} role="radio" aria-checked={templateId === t.id} className={`chip ${templateId === t.id ? 'is-on' : ''}`} onClick={() => setTemplateId(t.id)}>
                {t.title || 'Untitled template'}
              </button>
            ))}
          </div>
          <Link className="text-link" to="/templates" onClick={onClose}>
            Or pick from {TEMPLATE_COUNT} ready-made templates
          </Link>
        </div>
      )}
      {!template && (
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
    .filter(isJournalPage)
    // most recently edited first; moving a page in the book is not an edit
    .sort((a, b) => lastEdited(b).localeCompare(lastEdited(a)));
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageHeader
        title="Journal"
        sub={pages.length ? `${pages.length} page${pages.length === 1 ? '' : 's'}` : undefined}
        action={
          <>
            {pages.length > 1 && (
              <Link className="btn" to="/arrange">
                Arrange
              </Link>
            )}
            <button className="btn btn-primary" onClick={() => setCreating(true)}>
              New page
            </button>
          </>
        }
      />
      <CopiesWaiting />
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
      <SharedPagesSection />
      {creating && <NewPageSheet onClose={() => setCreating(false)} />}
    </>
  );
}
