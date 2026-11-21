import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAssetUrl } from '../data/assets';
import { useDayMap, useToday } from '../data/hooks';
import { useStore, useUi } from '../data/store';
import { autoHeight, fontOf, isDarkColor, isFillable, PAGE_DIMS, type Page, type PageElement } from '../domain/pages';
import { TAPE_COLORS } from '../domain/types';
import { configFor, getVisualization } from '../visualizations';
import { DrawnStickerArt } from '../stickers/drawn';
import { BookshelfBody, BoxBody, ChecklistBody, MonthBody, TableBody, WritingBody, type PartChange } from './PageParts';
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

function PhotoBody({ el }: { el: Extract<PageElement, { type: 'photo' }> }) {
  const url = useAssetUrl(el.assetId);
  return (
    <div className={`pg-photo frame-${el.frame} ${el.shadow ? 'has-shadow' : ''}`}>
      {url ? <img src={url} alt="" draggable={false} /> : <span className="pg-photo-wait" />}
    </div>
  );
}

export function CustomStickerBody({ assetId }: { assetId: string }) {
  const url = useAssetUrl(assetId);
  return <div className="pg-sticker">{url && <img className="pg-sticker-img" src={url} alt="" draggable={false} />}</div>;
}

function TrackerBody({ trackerId, live, look, full }: { trackerId: string; live: boolean; look?: string; full?: boolean }) {
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
 * What an element looks like. `live` makes tracker widgets tappable (view mode);
 * `onChange` lets fillable parts save what is typed or ticked.
 */
export function ElementBody({ el, live, onChange }: { el: PageElement; live: boolean; onChange?: PartChange }) {
  switch (el.type) {
    case 'text':
      return (
        <div
          className={`pg-text ${el.note ? 'is-note' : ''}`}
          style={{
            fontFamily: fontOf(el.font).family,
            fontWeight: fontOf(el.font).weight,
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
      return <div className={`pg-tape tape-${el.pattern} edge-${el.edge ?? 'torn'} ${el.sheer ? 'is-sheer' : ''}`} style={{ backgroundColor: TAPE_COLORS[el.color] }} />;
    case 'tracker':
      return <TrackerBody trackerId={el.trackerId} live={live} look={el.look} full={el.full} />;
    case 'bookshelf':
      return <BookshelfBody el={el} onChange={onChange} />;
    case 'box':
      return <BoxBody el={el} />;
    case 'checklist':
      return <ChecklistBody el={el} onChange={onChange} />;
    case 'table':
      return <TableBody el={el} onChange={onChange} />;
    case 'writing':
      return <WritingBody el={el} onChange={onChange} />;
    case 'month':
      return <MonthBody el={el} onChange={onChange} />;
  }
}

interface SurfaceProps {
  page: Page;
  /** Width on screen in CSS pixels; the sheet scales to it. */
  width: number;
  children: ReactNode;
  className?: string;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
}

/** The sheet of paper: background, pattern, and a layer measured in page units. */
export function PageSurface({ page, width, children, className, onPointerDown }: SurfaceProps) {
  const { w, h } = PAGE_DIMS[page.size];
  const scale = width / w;
  const bgUrl = useAssetUrl(page.background.assetId);
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
        {children}
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
}

/** A whole page without editing handles. Used for viewing and for thumbnails. */
export function StaticPage({ page, width, live = false, onElementChange }: StaticProps) {
  return (
    <PageSurface page={page} width={width} className={live ? 'is-live' : 'is-thumb'}>
      {page.elements.map((el) => (
        <div key={el.id} className={`pg-el type-${el.type} ${isFillable(el) ? 'is-fillable' : ''}`} style={frameStyle(el)}>
          <ElementBody el={el} live={live} onChange={live && onElementChange ? (patch) => onElementChange(el.id, patch) : undefined} />
        </div>
      ))}
    </PageSurface>
  );
}
