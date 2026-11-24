import { useMemo, useRef, useState } from 'react';
import { useStore } from '../data/store';
import { around, gathered } from '../domain/arrange';
import { isBlock, ownSubjects, templateFrom, type TemplateDetails } from '../domain/ownTemplates';
import { PALETTES, type Palette } from '../domain/palettes';
import { lastEdited, type Page, type PageElement } from '../domain/pages';
import { newId } from '../domain/types';
import { TEMPLATE_SUBJECTS } from '../templates/subjects';
import { ElementBody, frameStyle } from '../ui/PageCanvas';
import { Sheet } from '../ui/Sheet';
import { SubjectPicker } from '../ui/SubjectPicker';

// Pieces of the page editor that stand on their own: mixing a colour, saving a
// page as a template, recolouring a page, and saved blocks.

const MAX_SAVED = 12;

/**
 * Any colour at all, next to the ready-made swatches: the colours she mixed
 * before, and a button that opens the device's colour picker. A mixed colour
 * is remembered (and synced with her settings) so it can be used again.
 */
export function ColorMix({ value, label, onPick }: { value: string | undefined; label: string; onPick: (hex: string) => void }) {
  const saved = useStore((s) => s.settings.customColors) ?? [];
  const updateSettings = useStore((s) => s.updateSettings);
  const input = useRef<HTMLInputElement>(null);
  const remember = (hex: string) => updateSettings({ customColors: [hex, ...(useStore.getState().settings.customColors ?? []).filter((c) => c !== hex)].slice(0, MAX_SAVED) });
  const isMine = Boolean(value && /^#[0-9a-f]{6}$/i.test(value) && !saved.includes(value.toUpperCase()));
  return (
    <div className="color-row is-small color-mix" role="group" aria-label={`${label}: my colours`}>
      {saved.map((hex) => (
        <button type="button" key={hex} aria-pressed={value?.toUpperCase() === hex} aria-label={`My colour ${hex}`} title={hex} className={value?.toUpperCase() === hex ? 'is-on' : ''} style={{ background: hex }} onClick={() => onPick(hex)} />
      ))}
      <button type="button" className="swatch-mix" onClick={() => input.current?.click()} aria-label={`${label}: mix a colour`} title="Mix a colour">
        +
      </button>
      <input
        ref={input}
        type="color"
        className="sr-only"
        tabIndex={-1}
        aria-label={`${label}: any colour`}
        value={value && /^#[0-9a-f]{6}$/i.test(value) ? value : '#F3A3BA'}
        onChange={(e) => onPick(e.target.value.toUpperCase())}
        // remembered once she has settled on it, not for every shade passed on the way
        onBlur={(e) => /^#[0-9a-f]{6}$/i.test(e.target.value) && remember(e.target.value.toUpperCase())}
      />
      {isMine && value && (
        <button type="button" className="btn btn-quiet btn-small" onClick={() => remember(value.toUpperCase())}>
          Keep this colour
        </button>
      )}
    </div>
  );
}

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

/** The ten palettes of "Recolour page", each as a row of its colours. */
export function RecolourList({ onPick }: { onPick: (palette: Palette) => void }) {
  return (
    <div className="palette-list">
      {PALETTES.map((p) => (
        <button key={p.id} className="palette" onClick={() => onPick(p)} aria-label={`Recolour the page: ${p.name}`}>
          <span className="palette-dots" aria-hidden="true">
            <i style={{ background: p.paper }} />
            <i style={{ background: p.ink }} />
            {p.accents.slice(0, 4).map((c) => (
              <i key={c} style={{ background: c }} />
            ))}
          </span>
          {p.name}
        </button>
      ))}
    </div>
  );
}

/** A saved block drawn small. */
function BlockThumb({ block, size = 104 }: { block: Page; size?: number }) {
  const all = around(block.elements.length ? block.elements : [{ x: 0, y: 0, w: 1, h: 1 }]);
  const w = Math.max(40, all.x + all.w);
  const h = Math.max(40, all.y + all.h);
  const scale = Math.min(size / w, size / h);
  return (
    <span className="pg is-thumb blk-thumb" style={{ width: size, height: size }} aria-hidden="true">
      <span className="pg-layer" style={{ width: w, height: h, left: (size - w * scale) / 2, top: (size - h * scale) / 2, transform: `scale(${scale})`, ['--pg-line' as string]: 'rgb(58 43 71 / 0.16)', ['--pg-scale' as string]: scale }}>
        {block.elements.map((el) => (
          <span key={el.id} className={`pg-el type-${el.type}`} style={{ ...frameStyle(el), display: 'block' }}>
            <ElementBody el={el} live={false} />
          </span>
        ))}
      </span>
    </span>
  );
}

/** "My blocks": parts she saved to use again, on any page. */
export function BlocksSheet({ onInsert, onClose }: { onInsert: (parts: PageElement[]) => void; onClose: () => void }) {
  const pages = useStore((s) => s.pages);
  const deletePage = useStore((s) => s.deletePage);
  const blocks = useMemo(() => pages.filter(isBlock).sort((a, b) => lastEdited(b).localeCompare(lastEdited(a))), [pages]);
  const [removing, setRemoving] = useState(false);
  return (
    <Sheet title="My blocks" onClose={onClose}>
      {blocks.length === 0 ? (
        <p className="muted">No blocks yet. Select a part (or several, with "Select") and choose "Save as a block": it is kept here, ready to drop onto any page.</p>
      ) : (
        <>
          <div className="inline">
            <button className="btn btn-quiet btn-small" onClick={() => setRemoving(!removing)} aria-pressed={removing}>
              {removing ? 'Done removing' : 'Remove some'}
            </button>
          </div>
          <div className="block-grid">
            {blocks.map((b) => (
              <button key={b.id} className={removing ? 'is-removing' : ''} onClick={() => (removing ? deletePage(b.id) : onInsert(b.elements))} aria-label={removing ? `Remove the block ${b.title}` : `Add the block ${b.title}`}>
                <BlockThumb block={b} />
                <span>{b.title}</span>
                {removing && (
                  <span className="remove-badge" aria-hidden="true">
                    ✕
                  </span>
                )}
              </button>
            ))}
          </div>
          {removing && <p className="muted">Removing a block keeps it on pages that already use it.</p>}
        </>
      )}
    </Sheet>
  );
}

/** Naming a block before it is saved. */
export function SaveBlockSheet({ parts, size, onClose, onSaved }: { parts: PageElement[]; size: Page['size']; onClose: () => void; onSaved: (name: string) => void }) {
  const [name, setName] = useState('');
  const save = () => {
    const { pages, savePage } = useStore.getState();
    const now = new Date().toISOString();
    const title = name.trim() || `Block ${pages.filter(isBlock).length + 1}`;
    // a block is kept like a template (so it never goes out with a shared book) and marked as a block
    savePage({
      id: newId(),
      title,
      size,
      background: { color: '#FFFDF9', pattern: 'plain' },
      elements: gathered(parts).map((p) => {
        const { locked: _locked, ...rest } = p;
        return { ...rest, id: newId() } as PageElement;
      }),
      isTemplate: true,
      role: 'block',
      sortOrder: pages.reduce((m, p) => Math.max(m, p.sortOrder), 0) + 1,
      createdAt: now,
      updatedAt: now,
    });
    onSaved(title);
  };
  return (
    <Sheet
      title="Save as a block"
      onClose={onClose}
      footer={
        <button className="btn btn-primary" onClick={save}>
          Save the block
        </button>
      }
    >
      <p className="muted">
        {parts.length === 1 ? 'This part is' : `These ${parts.length} parts are`} kept in "My blocks" as they are now, to drop onto any page.
      </p>
      <div className="field">
        <label htmlFor="sb-name">Name</label>
        <input id="sb-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Week header" maxLength={40} />
      </div>
    </Sheet>
  );
}
