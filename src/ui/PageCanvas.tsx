import { createContext, useContext, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { addImage, useAssetUrl, type PhotoSource } from '../data/assets';
import { useDayMap, useToday } from '../data/hooks';
import { useStore, useUi } from '../data/store';
import { autoHeight, fontOf, isDarkColor, isFillable, PAGE_DIMS, type FrameElement, type Page, type PageElement } from '../domain/pages';
import { isWordTape, tapeImage } from '../domain/tapes';
import { TAPE_COLORS, type TrackerDefinition, type TrackerEntry } from '../domain/types';
import { buildDayMap } from '../domain/stats';
import { configFor, getVisualization } from '../visualizations';
import { DrawnStickerArt } from '../stickers/drawn';
import { LineBody, ShapeBody } from './PageDrawing';
import { BookshelfBody, BoxBody, ChecklistBody, GridBody, MonthBody, TableBody, WritingBody, type PartChange, type PartMode } from './PageParts';
import { QuickLog } from './QuickLog';

/** Position, size and rotation of an element, in page units. */
export function frameStyle(el: PageElement): CSSProperties {
  return {
    left: el.x,
    top: el.y,
    width: el.w,
    height: autoHeight(el) ? undefined : el.h,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
  };
}

/**
 * A page that isn't one of this book's own (shared with this account, or opened
 * from a public link): where its photos and tracker data come from. Pages
 * drawn inside a source are read-only.
 */
export interface PageSource {
  photos: PhotoSource;
  tracker: (id: string) => TrackerDefinition | undefined;
  entries: TrackerEntry[];
}
export const PageSourceContext = createContext<PageSource | null>(null);
const usePagePhoto = (id: string | undefined) => useAssetUrl(id, useContext(PageSourceContext)?.photos);

function PhotoBody({ el }: { el: Extract<PageElement, { type: 'photo' }> }) {
  const url = usePagePhoto(el.assetId);
  return (
    <div className={`pg-photo frame-${el.frame} ${el.shadow ? 'has-shadow' : ''}`}>
      {url ? <img src={url} alt="" draggable={false} /> : <span className="pg-photo-wait" />}
    </div>
  );
}

const CameraIcon = () => (
  <svg className="pg-frame-icon" viewBox="0 0 100 100" aria-hidden="true">
    <path d="M16 34h13l7-11h28l7 11h13a7 7 0 0 1 7 7v33a7 7 0 0 1-7 7H16a7 7 0 0 1-7-7V41a7 7 0 0 1 7-7z" />
    <circle cx="50" cy="56" r="15" />
    <path d="M50 49v14M43 56h14" />
  </svg>
);

/** How a frame's photo sits in its window: bigger than the window by `zoom`, shifted by the pan. */
export function frameImageStyle(el: Pick<FrameElement, 'zoom' | 'panX' | 'panY'>): CSSProperties {
  const zoom = Math.max(1, Math.min(4, el.zoom ?? 1));
  const px = Math.max(0, Math.min(1, el.panX ?? 0.5));
  const py = Math.max(0, Math.min(1, el.panY ?? 0.5));
  return {
    width: `${zoom * 100}%`,
    height: `${zoom * 100}%`,
    left: `${-(zoom - 1) * px * 100}%`,
    top: `${-(zoom - 1) * py * 100}%`,
    objectPosition: `${px * 100}% ${py * 100}%`,
  };
}

/**
 * A photo slot. Empty, a tap picks a photo (from the gallery or the camera)
 * when the page is being viewed; replacing and positioning happen in Edit.
 */
function FrameBody({ el, mode, onChange }: { el: FrameElement; mode: PartMode; onChange?: PartChange }) {
  const source = useContext(PageSourceContext);
  const url = usePagePhoto(el.assetId);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const canAdd = mode === 'view' && Boolean(onChange) && !source;
  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setFailed(false);
    try {
      const asset = await addImage(file);
      onChange?.({ assetId: asset.id, zoom: undefined, panX: undefined, panY: undefined });
    } catch {
      setFailed(true);
    }
    setBusy(false);
    if (input.current) input.current.value = '';
  };
  const invite = (
    <>
      <CameraIcon />
      <span>{busy ? 'Adding…' : failed ? "That file isn't a picture. Tap to try another." : el.hint || (source ? 'No photo yet' : 'Tap to add a photo')}</span>
    </>
  );
  return (
    <div className={`pg-frame frame-${el.style} ${el.assetId ? 'has-photo' : 'is-empty'} ${el.caption ? 'has-caption' : ''}`}>
      <div className="pg-frame-window">
        {el.assetId ? (
          url ? (
            <img src={url} alt={el.caption || ''} draggable={false} style={frameImageStyle(el)} />
          ) : (
            <span className="pg-photo-wait" />
          )
        ) : canAdd ? (
          <button type="button" className="pg-frame-add" onClick={() => input.current?.click()} disabled={busy} aria-label={el.hint ? `${el.hint}: add a photo` : 'Add a photo'}>
            {invite}
          </button>
        ) : (
          <div className="pg-frame-add">{invite}</div>
        )}
      </div>
      {el.caption && <div className="pg-frame-caption">{el.caption}</div>}
      {canAdd && <input ref={input} type="file" accept="image/*" hidden onChange={(e) => void pick(e.target.files?.[0])} />}
    </div>
  );
}

/** A strip of washi tape: a plain pattern from the stylesheet, or a themed tape drawn as a tile. */
export function TapeStrip({ color, pattern, edge, sheer }: { color: string; pattern: string; edge?: string; sheer?: boolean }) {
  const art = tapeImage(pattern, color);
  // word tapes: a second, empty layer keeps the colour edge to edge while the words stay inside the ends
  const words = art && isWordTape(pattern);
  return (
    <div
      className={`pg-tape ${art ? `tape-art ${words ? 'tape-words' : ''}` : `tape-${pattern}`} edge-${edge ?? 'torn'} ${sheer ? 'is-sheer' : ''}`}
      style={{ backgroundColor: TAPE_COLORS[color], backgroundImage: words ? `${art}, linear-gradient(transparent, transparent)` : art }}
    />
  );
}

export function CustomStickerBody({ assetId }: { assetId: string }) {
  const url = usePagePhoto(assetId);
  return <div className="pg-sticker">{url && <img className="pg-sticker-img" src={url} alt="" draggable={false} />}</div>;
}

/** A tracker widget on a shared or public page: the owner's data, nothing tappable. */
function SourceTrackerBody({ source, trackerId, look, full }: { source: PageSource; trackerId: string; look?: string; full?: boolean }) {
  const weekStartsOn = useStore((s) => s.settings.weekStartsOn);
  const today = useToday();
  const tracker = source.tracker(trackerId);
  const days = useMemo(() => (tracker ? buildDayMap(tracker, source.entries) : new Map()), [tracker, source.entries]);
  if (!tracker || tracker.archived) return <div className="pg-tracker card is-missing">This tracker isn't shared.</div>;
  const viz = getVisualization(look ?? tracker.visualizationId);
  return (
    <div className={`pg-tracker card ${full ? 'is-full' : ''}`} style={{ ['--tracker' as string]: TAPE_COLORS[tracker.color] }}>
      <div className="card-head">
        <h2>
          <span>
            <span aria-hidden="true">{tracker.emoji}</span> {tracker.name}
          </span>
        </h2>
      </div>
      <viz.Component tracker={tracker} days={days} today={today} weekStartsOn={weekStartsOn} config={configFor(tracker.visualizationConfig, viz.id)} compact={!full} />
    </div>
  );
}

function TrackerBody(props: { trackerId: string; live: boolean; look?: string; full?: boolean }) {
  const source = useContext(PageSourceContext);
  return source ? <SourceTrackerBody source={source} {...props} /> : <OwnTrackerBody {...props} />;
}

function OwnTrackerBody({ trackerId, live, look, full }: { trackerId: string; live: boolean; look?: string; full?: boolean }) {
  const tracker = useStore((s) => s.trackers.find((t) => t.id === trackerId && !t.archived));
  const weekStartsOn = useStore((s) => s.settings.weekStartsOn);
  const openLog = useUi((s) => s.openLog);
  const today = useToday();
  const days = useDayMap(tracker);
  if (!tracker) return <div className="pg-tracker card is-missing">{trackerId ? 'This tracker was removed or archived.' : 'A tracker goes here.'}</div>;
  const viz = getVisualization(look ?? tracker.visualizationId);
  return (
    <div className={`pg-tracker card ${full ? 'is-full' : ''}`} style={{ ['--tracker' as string]: TAPE_COLORS[tracker.color] }}>
      <div className="card-head">
        <h2>
          {live ? (
            <Link to={`/trackers/${tracker.id}`}>
              <span aria-hidden="true">{tracker.emoji}</span> {tracker.name}
            </Link>
          ) : (
            <span>
              <span aria-hidden="true">{tracker.emoji}</span> {tracker.name}
            </span>
          )}
        </h2>
        {live && <QuickLog tracker={tracker} day={days.get(today)} date={today} />}
      </div>
      <viz.Component
        tracker={tracker}
        days={days}
        today={today}
        weekStartsOn={weekStartsOn}
        config={configFor(tracker.visualizationConfig, viz.id)}
        onPickDay={live ? (date) => openLog({ trackerId: tracker.id, date }) : undefined}
        compact={!full}
      />
    </div>
  );
}

/**
 * What an element looks like. `live` (the finished page) makes tracker widgets
 * tappable and lets parts save quick taps through `onChange`; `editing` (the
 * part selected in Edit) makes written parts typeable in place.
 */
export function ElementBody({ el, live, onChange, editing = false }: { el: PageElement; live: boolean; onChange?: PartChange; editing?: boolean }) {
  const mode: PartMode = editing ? 'edit' : live && onChange ? 'view' : 'static';
  switch (el.type) {
    case 'text':
      return (
        <div
          className={`pg-text ${el.note ? 'is-note' : ''}`}
          style={{
            fontFamily: fontOf(el.font).family,
            fontWeight: el.bold ? Math.max(700, fontOf(el.font).weight) : fontOf(el.font).weight,
            fontSize: el.size,
            color: el.color,
            textAlign: el.align,
            background: el.note ? TAPE_COLORS[el.note] : undefined,
          }}
        >
          {el.text || ' '}
        </div>
      );
    case 'photo':
      return <PhotoBody el={el} />;
    case 'sticker':
      if (el.art) {
        return (
          <div className="pg-sticker">
            <DrawnStickerArt id={el.art} color={el.color} />
          </div>
        );
      }
      if (el.assetId) return <CustomStickerBody assetId={el.assetId} />;
      return (
        <div className="pg-sticker" style={{ fontSize: Math.min(el.w, el.h) * 0.78 }}>
          {el.emoji}
        </div>
      );
    case 'tape':
      return <TapeStrip color={el.color} pattern={el.pattern} edge={el.edge} sheer={el.sheer} />;
    case 'frame':
      return <FrameBody el={el} mode={mode} onChange={onChange} />;
    case 'tracker':
      return <TrackerBody trackerId={el.trackerId} live={live} look={el.look} full={el.full} />;
    case 'bookshelf':
      return <BookshelfBody el={el} mode={mode} onChange={onChange} />;
    case 'box':
      return <BoxBody el={el} />;
    case 'line':
      return <LineBody el={el} />;
    case 'shape':
      return <ShapeBody el={el} />;
    case 'checklist':
      return <ChecklistBody el={el} mode={mode} onChange={onChange} />;
    case 'table':
      return <TableBody el={el} mode={mode} onChange={onChange} />;
    case 'writing':
      return <WritingBody el={el} mode={mode} onChange={onChange} />;
    case 'month':
      return <MonthBody el={el} mode={mode} onChange={onChange} />;
    case 'tiles':
      return <GridBody el={el} mode={mode} onChange={onChange} />;
  }
}

interface SurfaceProps {
  page: Page;
  /** Width on screen in CSS pixels; the sheet scales to it. */
  width: number;
  children: ReactNode;
  className?: string;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  /** Front cover: how many pages the book has, for its "12 pages" line. */
  coverCount?: number;
}

/** The sheet of paper: background, pattern, and a layer measured in page units. */
export function PageSurface({ page, width, children, className, onPointerDown, coverCount }: SurfaceProps) {
  const { w, h } = PAGE_DIMS[page.size];
  const scale = width / w;
  const bgUrl = usePagePhoto(page.background.assetId);
  const dark = isDarkColor(page.background.color);
  return (
    <div className={`pg ${className ?? ''}`} style={{ width, height: h * scale }}>
      <div
        className={`pg-layer pattern-${page.background.pattern}`}
        onPointerDown={onPointerDown}
        style={{
          width: w,
          height: h,
          transform: `scale(${scale})`,
          backgroundColor: page.background.color,
          ['--pg-line' as string]: dark ? 'rgb(255 255 255 / 0.16)' : 'rgb(58 43 71 / 0.16)',
          ['--pg-scale' as string]: scale,
        }}
      >
        {bgUrl && <img className="pg-bg" src={bgUrl} alt="" draggable={false} />}
        {page.role && <span className={`pg-spine is-${page.role}`} style={page.spine ? { background: page.spine } : undefined} aria-hidden="true" />}
        {children}
        {page.role === 'cover' && !page.hideCount && coverCount !== undefined && (
          <small className={`pg-cover-count ${dark ? 'is-light' : ''}`}>
            {coverCount} page{coverCount === 1 ? '' : 's'}
          </small>
        )}
      </div>
    </div>
  );
}

interface StaticProps {
  page: Page;
  width: number;
  live?: boolean;
  /** View mode only: saves what is typed or ticked in a fillable part. */
  onElementChange?: (id: string, patch: Record<string, unknown>) => void;
  coverCount?: number;
}

/** A whole page without editing handles. Used for viewing and for thumbnails. */
export function StaticPage({ page, width, live = false, onElementChange, coverCount }: StaticProps) {
  return (
    <PageSurface page={page} width={width} className={live ? 'is-live' : 'is-thumb'} coverCount={coverCount}>
      {page.elements.map((el) => (
        <div key={el.id} className={`pg-el type-${el.type} ${isFillable(el) ? 'is-fillable' : ''}`} style={frameStyle(el)}>
          <ElementBody el={el} live={live} onChange={live && onElementChange ? (patch) => onElementChange(el.id, patch) : undefined} />
        </div>
      ))}
    </PageSurface>
  );
}
