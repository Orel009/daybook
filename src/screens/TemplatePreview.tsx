import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useActiveTrackers } from '../data/hooks';
import { useStore } from '../data/store';
import { PAGE_DIMS } from '../domain/pages';
import type { BuiltInTemplate } from '../templates/kit';
import { previewOf, trackersToAdd } from '../templates/preview';
import { PageSourceContext, StaticPage } from '../ui/PageCanvas';

// A template shown full size before it is used. Looking makes nothing: the
// page is built in memory, its trackers come from templates/preview.ts, and
// only "Add to my journal" creates the page (and any tracker it needs).

type Library = typeof import('../templates/library');

interface Props {
  library: Library;
  /** The templates to move through with the arrows or a swipe, in the order they are listed. */
  list: BuiltInTemplate[];
  template: BuiltInTemplate;
  onMove: (t: BuiltInTemplate) => void;
  onClose: () => void;
  onUse: (t: BuiltInTemplate) => void;
  onPrint: (t: BuiltInTemplate) => void;
}

const ZOOMS = [1, 1.5, 2, 3];
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const joined = (names: string[]) => (names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

export function TemplatePreview({ library, list, template, onMove, onClose, onUse, onPrint }: Props) {
  const trackers = useActiveTrackers();
  const entries = useStore((s) => s.entries);
  const weekStartsOn = useStore((s) => s.settings.weekStartsOn);
  const [withData, setWithData] = useState(true);
  const [zoom, setZoom] = useState(1);

  const { page, source } = useMemo(() => {
    const made = previewOf({ today: new Date(), weekStartsOn, own: trackers, entries, withData });
    return { page: library.buildTemplatePage(template, made.ctx), source: made.source };
  }, [library, template, trackers, entries, weekStartsOn, withData]);
  // the switch is only there when the template shows trackers at all
  const showsTrackers = useMemo(() => {
    if ((template.needs?.length ?? 0) > 0) return true;
    const own = previewOf({ today: new Date(), weekStartsOn, own: trackers, entries: [], withData: true });
    return library.buildTemplatePage(template, own.ctx).elements.some((e) => e.type === 'tracker');
  }, [library, template, trackers, weekStartsOn]);
  const adds = trackersToAdd(template, trackers);

  const at = list.findIndex((t) => t.id === template.id);
  const prev = at > 0 ? list[at - 1] : undefined;
  const next = at >= 0 && at < list.length - 1 ? list[at + 1] : undefined;
  const move = (t: BuiltInTemplate | undefined) => {
    if (!t) return;
    setZoom(1);
    onMove(t);
  };
  const moveRef = useRef({ prev, next, move, onClose });
  moveRef.current = { prev, next, move, onClose };

  // ----- focus and keys, like any dialog
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      const m = moveRef.current;
      if (e.key === 'Escape') m.onClose();
      if (e.key === 'ArrowLeft') m.move(m.prev);
      if (e.key === 'ArrowRight') m.move(m.next);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      before?.focus?.();
    };
  }, []);

  // ----- size: the whole page fits at first; zooming makes it larger than its window, which then scrolls
  const area = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState({ w: 300, h: 400 });
  useLayoutEffect(() => {
    const measure = () => setRoom({ w: area.current?.clientWidth ?? 300, h: area.current?.clientHeight ?? 400 });
    measure();
    const ro = new ResizeObserver(measure);
    if (area.current) ro.observe(area.current);
    return () => ro.disconnect();
  }, []);
  const dims = PAGE_DIMS[template.size];
  const fit = Math.max(120, Math.floor(Math.min(room.w - 24, ((room.h - 24) * dims.w) / dims.h)));
  const width = Math.round(fit * zoom);
  useEffect(() => {
    if (zoom === 1) area.current?.scrollTo({ left: 0, top: 0 });
  }, [zoom, template.id]);

  // ----- fingers: one swipes to the next template (when not zoomed in), two pinch to zoom
  const fingers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ x: number; y: number; pinch?: { dist: number; zoom: number } } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    fingers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (fingers.current.size === 1) gesture.current = { x: e.clientX, y: e.clientY };
    if (fingers.current.size === 2 && gesture.current) {
      const [a, b] = [...fingers.current.values()];
      gesture.current.pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom };
    }
  };
  const onMoveFinger = (e: React.PointerEvent) => {
    if (!fingers.current.has(e.pointerId)) return;
    fingers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pinch = gesture.current?.pinch;
    if (pinch && fingers.current.size >= 2) {
      const [a, b] = [...fingers.current.values()];
      setZoom(Math.round(clamp((pinch.zoom * Math.hypot(a.x - b.x, a.y - b.y)) / Math.max(1, pinch.dist), 1, 4) * 20) / 20);
    }
  };
  const onUp = (e: React.PointerEvent) => {
    const g = gesture.current;
    fingers.current.delete(e.pointerId);
    if (fingers.current.size > 0 || !g) return;
    gesture.current = null;
    if (g.pinch || zoom !== 1) return;
    const dx = e.clientX - g.x;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(e.clientY - g.y) * 1.3) move(dx < 0 ? next : prev);
  };
  /** The next zoom step up or down. */
  const step = (by: 1 | -1) => setZoom((z) => (by > 0 ? (ZOOMS.find((v) => v > z + 0.001) ?? 4) : ([...ZOOMS].reverse().find((v) => v < z - 0.001) ?? 1)));

  return createPortal(
    <div className="tp-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="tp" role="dialog" aria-modal="true" aria-label={`Preview of the ${template.name} template`} tabIndex={-1} ref={dialog}>
        <header className="tp-head">
          <div className="tp-title">
            <h2>{template.name}</h2>
            <small className="muted">
              {template.subject}
              {list.length > 1 && at >= 0 && ` · ${at + 1} of ${list.length}`}
            </small>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close the preview">
            ✕
          </button>
        </header>

        <div className="tp-stage">
          <button className="icon-btn tp-arrow is-prev" onClick={() => move(prev)} disabled={!prev} aria-label={prev ? `Previous template: ${prev.name}` : 'Previous template'}>
            ‹
          </button>
          <div
            className={`tp-area ${zoom > 1 ? 'is-zoomed' : ''}`}
            ref={area}
            onPointerDown={onDown}
            onPointerMove={onMoveFinger}
            onPointerUp={onUp}
            onPointerCancel={(e) => {
              fingers.current.delete(e.pointerId);
              gesture.current = null;
            }}
            onWheel={(e) => {
              if (!e.ctrlKey) return;
              setZoom((z) => Math.round(clamp(z * (e.deltaY < 0 ? 1.1 : 1 / 1.1), 1, 4) * 20) / 20);
            }}
          >
            <div className="tp-page" style={{ width, height: (width * dims.h) / dims.w }}>
              <PageSourceContext.Provider value={source}>
                <StaticPage page={page} width={width} />
              </PageSourceContext.Provider>
            </div>
          </div>
          <button className="icon-btn tp-arrow is-next" onClick={() => move(next)} disabled={!next} aria-label={next ? `Next template: ${next.name}` : 'Next template'}>
            ›
          </button>
        </div>

        <div className="tp-tools">
          <div className="tp-zoom" role="group" aria-label="Zoom">
            <button className="btn btn-small" onClick={() => step(-1)} disabled={zoom <= 1} aria-label="Zoom out">
              −
            </button>
            <button className="btn btn-small" onClick={() => setZoom(1)} disabled={zoom === 1}>
              Fit
            </button>
            <button className="btn btn-small" onClick={() => step(1)} disabled={zoom >= 4} aria-label="Zoom in">
              +
            </button>
            <small className="muted" aria-live="polite">
              {Math.round(zoom * 100)}%
            </small>
          </div>
          {showsTrackers && (
            <div className="seg seg-small" role="radiogroup" aria-label="Show trackers">
              <button role="radio" aria-checked={withData} className={withData ? 'is-on' : ''} onClick={() => setWithData(true)}>
                With my data
              </button>
              <button role="radio" aria-checked={!withData} className={!withData ? 'is-on' : ''} onClick={() => setWithData(false)}>
                Empty
              </button>
            </div>
          )}
        </div>

        <div className="tp-foot">
          <p>
            {template.description}
            {adds.length > 0 && <strong className="tp-adds"> Adds a {joined(adds)} tracker.</strong>}
          </p>
          <div className="tp-actions">
            <button className="btn btn-primary" onClick={() => onUse(template)}>
              Add to my journal
            </button>
            <button className="btn" onClick={() => onPrint(template)}>
              Print blank
            </button>
            <button className="btn btn-quiet" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
