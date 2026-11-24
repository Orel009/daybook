import { useMemo, useState } from 'react';
import { useStore } from '../data/store';
import { ownSubjects, templateFrom, type TemplateDetails } from '../domain/ownTemplates';
import type { Page } from '../domain/pages';
import { TEMPLATE_SUBJECTS } from '../templates/subjects';
import { Sheet } from '../ui/Sheet';
import { SubjectPicker } from '../ui/SubjectPicker';

// Pieces of the page editor that stand on their own: saving a page as a template.

/** "Save as a template": its name, where it is filed, what it keeps. */
export function SaveTemplateSheet({ page, onClose, onSaved }: { page: Page; onClose: () => void; onSaved: (template: Page) => void }) {
  const pages = useStore((s) => s.pages);
  const own = useMemo(() => ownSubjects(pages, TEMPLATE_SUBJECTS), [pages]);
  const [d, setD] = useState<TemplateDetails>({ name: page.title || '', subject: page.subject ?? '', description: '', keep: 'layout', followDate: false });
  const set = (patch: Partial<TemplateDetails>) => setD({ ...d, ...patch });
  const save = () => {
    const { pages: all, savePage } = useStore.getState();
    const made = templateFrom(page, d, new Date(), all.reduce((m, p) => Math.max(m, p.sortOrder), 0) + 1);
    savePage(made);
    onSaved(made);
  };
  return (
    <Sheet
      title="Save as a template"
      onClose={onClose}
      footer={
        <button className="btn btn-primary" onClick={save}>
          Save the template
        </button>
      }
    >
      <div className="field">
        <label htmlFor="st-name">Name</label>
        <input id="st-name" type="text" value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="My weekly page" maxLength={60} />
      </div>
      <div className="field">
        <label htmlFor="st-subject">Subject</label>
        <SubjectPicker id="st-subject" value={d.subject} own={own} onChange={(subject) => set({ subject })} />
      </div>
      <div className="field">
        <label htmlFor="st-description">Description</label>
        <input id="st-description" type="text" value={d.description} onChange={(e) => set({ description: e.target.value })} placeholder="What this template is for" maxLength={140} />
      </div>
      <div className="field">
        <span className="label" id="st-keep">
          What it keeps
        </span>
        <div className="seg seg-small seg-wrap" role="radiogroup" aria-labelledby="st-keep">
          <button role="radio" aria-checked={d.keep === 'layout'} className={d.keep === 'layout' ? 'is-on' : ''} onClick={() => set({ keep: 'layout' })}>
            Keep only the layout
          </button>
          <button role="radio" aria-checked={d.keep === 'all'} className={d.keep === 'all' ? 'is-on' : ''} onClick={() => set({ keep: 'all' })}>
            Keep what I wrote
          </button>
        </div>
        <small className="muted">
          {d.keep === 'layout' ? 'Clears what you wrote, ticks, marks, ratings and photos. Headings, titles, stickers and tape stay, and each photo leaves an empty slot.' : 'The template starts with everything that is on this page now.'}
        </small>
      </div>
      <button className={`chip ${d.followDate ? 'is-on' : ''}`} role="switch" aria-checked={d.followDate} onClick={() => set({ followDate: !d.followDate })}>
        Month and year in titles follow the date
      </button>
      {d.followDate && <small className="muted">Where a title, a heading or a month on this page says this month or this year, a page made from the template will say the month and year it is made in.</small>}
    </Sheet>
  );
}
