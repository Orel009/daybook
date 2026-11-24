import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { addImage } from '../data/assets';
import { useActiveTrackers } from '../data/hooks';
import { useStore } from '../data/store';
import {
  autoHeight,
  BG_COLORS,
  bookOrder,
  CHALLENGE_PRESETS,
  FRAME_STYLES,
  newBook,
  newBookshelf,
  newBox,
  newChallenge,
  newChecklist,
  newFrame,
  newGrid,
  GRID_PRESETS,
  isWritable,
  TEXTURES,
  TILE_LAYOUTS,
  TILE_SHAPES,
  type FrameElement,
  type LineElement,
  type PartTextStyle,
  newCustomSticker,
  newDrawnSticker,
  newItem,
  newLine,
  newMonth,
  newPhoto,
  newShape,
  newTable,
  newWriting,
  newSticker,
  newTape,
  newText,
  newTrackerElement,
  PAGE_DIMS,
  PATTERNS,
  SHAPES,
  STICKER_SETS,
  TAPE_EDGES,
  TEXT_FONTS,
  TAPE_PATTERNS,
  TEXT_COLORS,
  type Page,
  type PageElement,
} from '../domain/pages';
import { newId, TAPE_COLORS } from '../domain/types';
import { EmptyState } from '../ui/Layout';
import { CustomStickerBody, ElementBody, frameStyle, PageSurface, StaticPage, TapeStrip } from '../ui/PageCanvas';
import { DRAWN_STICKERS, DrawnStickerArt, drawnSticker } from '../stickers/drawn';
import { monthTitle } from '../ui/PageParts';
import { Sheet } from '../ui/Sheet';
import { ShareSheet } from '../ui/ShareSheet';
import { pageTrackerIds } from '../data/shareRules';
import { backPreset, COVER_PRESETS, coverPreset, SPINE_COLORS } from '../domain/covers';
import { recentTapes, rememberTape, TAPE_THEMES, tapeColorFor, THEMED_TAPES, type TapeTheme } from '../domain/tapes';
import { scrollerOf, themeAccent } from '../ui/dom';
import { bendLine, flipLine, isCurved, linePoints, middle, moveLinePoint, straightenLine, type Pt } from '../domain/line';
import { shapeWeight } from '../domain/shapes';
import { ShapeOutline } from '../ui/PageDrawing';

type Mode = 'move' | 'resize' | 'width' | 'rotate';
type Patch = Record<string, unknown>;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const TYPE_NAMES: Record<PageElement['type'], string> = {
  text: 'Text',
  photo: 'Photo',
  frame: 'Photo slot',
  sticker: 'Sticker',
  tape: 'Tape',
  tracker: 'Tracker',
  box: 'Box',
  line: 'Line',
  shape: 'Shape',
  checklist: 'Checklist',
  table: 'Table',
  writing: 'Writing area',
  month: 'Month',
  bookshelf: 'Bookshelf',
  tiles: 'Tile grid',
};
const lines = (text: string) => text.split('\n');

/** New geometry for an element being dragged by one of its handles. */
function applyGesture(start: PageElement, h0: number, mode: Mode, dx: number, dy: number, angle: number): Patch {
  if (mode === 'move') return { x: Math.round(start.x + dx), y: Math.round(start.y + dy) };
  if (mode === 'rotate') {
    let deg = Math.round(angle);
    const near = Math.round(deg / 45) * 45;
    if (Math.abs(deg - near) <= 4) deg = near; // gentle snap to straight and diagonal
    return { rotation: ((deg + 540) % 360) - 180 };
  }
  // resize: work in the element's own axes so it behaves the same when rotated
  const t = (start.rotation * Math.PI) / 180;
  const lx = dx * Math.cos(t) + dy * Math.sin(t);
  const ly = -dx * Math.sin(t) + dy * Math.cos(t);
  let w = start.w;
  let h = h0;
  const extra: Patch = {};
  if (mode === 'width') {
    w = Math.max(80, start.w + lx);
  } else if (start.type === 'photo' || start.type === 'sticker') {
    const s = Math.max(40 / start.w, (start.w + lx) / start.w, (h0 + ly) / h0);
    w = start.w * s;
    h = h0 * s;
  } else if (start.type === 'text') {
    const s = clamp((start.w + lx) / start.w, 0.2, 300 / start.size);
    w = start.w * s;
    h = h0 * s;
    extra.size = Math.round(clamp(start.size * s, 12, 300));
  } else if (start.type === 'tape') {
    w = Math.max(40, start.w + lx);
    h = Math.max(16, h0 + ly);
  } else if (start.type === 'shape' && start.shape === 'circle') {
    // a circle stays round
    const s = Math.max(40 / start.w, (start.w + lx) / start.w, (h0 + ly) / h0);
    w = start.w * s;
    h = h0 * s;
  } else if (start.type === 'shape') {
    w = Math.max(40, start.w + lx);
    h = Math.max(40, h0 + ly);
  } else if (start.type === 'box' || start.type === 'table' || start.type === 'writing' || start.type === 'month' || start.type === 'bookshelf' || start.type === 'tiles' || start.type === 'frame') {
    w = Math.max(120, start.w + lx);
    h = Math.max(80, h0 + ly);
  } else {
    // tracker and checklist: the height follows the content
    w = clamp(start.w + lx, 220, 1100);
  }
  // keep the top-left corner where it is while the size changes
  const ax = (w - start.w) / 2;
  const ay = (h - h0) / 2;
  const cx = start.x + start.w / 2 + ax * Math.cos(t) - ay * Math.sin(t);
  const cy = start.y + h0 / 2 + ax * Math.sin(t) + ay * Math.cos(t);
  return { ...extra, x: Math.round(cx - w / 2), y: Math.round(cy - h / 2), w: Math.round(w), ...(autoHeight(start) ? {} : { h: Math.round(h) }) };
}

function Swatches({ colors, value, label, onPick, allowNone }: { colors: [string, string][]; value: string | undefined; label: string; onPick: (key: string | undefined) => void; allowNone?: boolean }) {
  return (
    <div className="color-row is-small" role="radiogroup" aria-label={label}>
      {allowNone && (
        <button type="button" role="radio" aria-checked={!value} aria-label="None" className={`swatch-none ${!value ? 'is-on' : ''}`} onClick={() => onPick(undefined)} />
      )}
      {colors.map(([key, hex]) => (
        <button type="button" key={key} role="radio" aria-checked={value === key} aria-label={key} className={value === key ? 'is-on' : ''} style={{ background: hex }} onClick={() => onPick(key)} />
      ))}
    </div>
  );
}

const TAPE_LIST = Object.entries(TAPE_COLORS);
const TEXT_LIST: [string, string][] = TEXT_COLORS.map((c) => [c, c]);
const BG_LIST: [string, string][] = BG_COLORS.map((c) => [c, c]);

/** Lettering, size, colour and alignment for everything written in a part. */
function TextStyleFields({ el, onPatch }: { el: PartTextStyle; onPatch: (patch: Patch, tag?: string) => void }) {
  const custom = el.font || el.textSize || el.textColor || el.textAlign;
  return (
    <div className="pe-field pe-textstyle">
      <span>Writing style</span>
      <div className="font-picker" role="radiogroup" aria-label="Lettering for the writing">
        <button role="radio" aria-checked={!el.font} className={!el.font ? 'is-on' : ''} onClick={() => onPatch({ font: undefined })}>
          Standard
        </button>
        {TEXT_FONTS.map((f) => (
          <button key={f.id} role="radio" aria-checked={el.font === f.id} className={el.font === f.id ? 'is-on' : ''} style={{ fontFamily: f.family, fontWeight: f.weight }} onClick={() => onPatch({ font: f.id })}>
            {f.name}
          </button>
        ))}
      </div>
      <label className="pe-slider">
        <span>Size{el.textSize ? `: ${el.textSize}` : ' (standard)'}</span>
        <input type="range" min={12} max={64} value={el.textSize ?? 22} onChange={(e) => onPatch({ textSize: Number(e.target.value) }, 'text-size')} aria-label="Writing size" />
      </label>
      <Swatches colors={TEXT_LIST} value={el.textColor} label="Writing colour" allowNone onPick={(c) => onPatch({ textColor: c })} />
      <div className="seg seg-small" role="radiogroup" aria-label="Writing alignment">
        {(['left', 'center', 'right'] as const).map((a) => (
          <button key={a} role="radio" aria-checked={el.textAlign === a} className={el.textAlign === a ? 'is-on' : ''} onClick={() => onPatch({ textAlign: el.textAlign === a ? undefined : a })}>
            {a[0].toUpperCase() + a.slice(1)}
          </button>
        ))}
      </div>
      {custom && (
        <button className="btn btn-quiet btn-small" onClick={() => onPatch({ font: undefined, textSize: undefined, textColor: undefined, textAlign: undefined })}>
          Back to the standard look
        </button>
      )}
    </div>
  );
}

/** Where a line's handle sits: centred on a point measured from the line's own box. */
const handleAt = (p: Pt) => ({ left: `calc(${p.x}px - var(--hs) / 2)`, top: `calc(${p.y}px - var(--hs) / 2)` });

const COVER_COLORS: [string, string][] = ['#F3A3BA', '#F8C19B', '#F6DB7D', '#A9DFC4', '#A8CDF2', '#C9B6F0', '#E9E1D3', '#CFAE86', '#6B4A3A', '#262B4A'].map((c) => [c, c]);
const SPINE_LIST: [string, string][] = SPINE_COLORS.map((c) => [c, c]);
const BASIC_TAPES = new Set<string>(TAPE_PATTERNS.map((t) => t.id));
const themeOfTape = (pattern: string): TapeTheme => THEMED_TAPES.find((t) => t.id === pattern)?.theme ?? 'basics';

/**
 * On narrow screens the options panel sits over the bottom of the screen.
 * Scrolls so `part` is fully visible above it (or, if it is taller than the
 * space, its top, or the field being typed in).
 */
function revealAbove(panel: HTMLElement | null, part: HTMLElement, field?: HTMLElement) {
  if (!panel || getComputedStyle(panel).position !== 'fixed') return;
  const limit = panel.getBoundingClientRect().top - 14;
  const top = 14;
  const room = limit - top;
  const r = part.getBoundingClientRect();
  let target = r;
  if (r.height > room) target = field ? field.getBoundingClientRect() : new DOMRect(r.left, r.top, r.width, Math.min(r.height, room));
  let delta = 0;
  if (target.bottom > limit) delta = target.bottom - limit;
  if (target.top - delta < top) delta = target.top - top;
  if (Math.abs(delta) < 2) return;
  const smooth = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  scrollerOf(part).scrollBy({ top: delta, behavior: smooth ? 'smooth' : 'auto' });
}

function PageEditor({ stored }: { stored: Page }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const trackers = useActiveTrackers();
  const { savePage, createPage, deletePage } = useStore.getState();

  const [page, setPageState] = useState(stored);
  const pageRef = useRef(page);
  const [editing, setEditing] = useState(params.get('edit') === '1');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const propsRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [panelPad, setPanelPad] = useState(0);
  const [sheet, setSheet] = useState<null | 'sticker' | 'tracker' | 'background' | 'more' | 'delete' | 'grid' | 'cover' | 'shape'>(null);
  const isCover = Boolean(stored.role);
  const pageCount = useStore((st) => bookOrder(st.pages).length);
  // photo slots: which one the picker is filling, and which one's photo is being positioned
  const frameInput = useRef<HTMLInputElement>(null);
  const frameTarget = useRef<string | null>(null);
  const [croppingId, setCroppingId] = useState<string | null>(null);
  const lastPress = useRef({ id: '', wasSelected: false, moved: false });
  const [tapeTheme, setTapeTheme] = useState<TapeTheme | null>(null);
  const [recent, setRecent] = useState(recentTapes);
  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState('');
  const [stickerSet, setStickerSet] = useState(STICKER_SETS[0].id); // stays on the last set used
  const [managing, setManaging] = useState(false);
  const myStickers = useStore((st) => st.settings.customStickers) ?? [];
  const updateSettings = useStore((st) => st.updateSettings);
  const stickerInput = useRef<HTMLInputElement>(null);
  const undo = useRef<Page[]>([]);
  const lastTag = useRef({ tag: '', at: 0 });
  const [undoCount, setUndoCount] = useState(0);
  const photoInput = useRef<HTMLInputElement>(null);
  const bgInput = useRef<HTMLInputElement>(null);

  // ----- sizing: fit the sheet to the column, and on wide screens to the height too
  const column = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 320, vh: 800, wide: false });
  useLayoutEffect(() => {
    const measure = () => setBox({ w: column.current?.clientWidth ?? 320, vh: window.innerHeight, wide: window.innerWidth >= 900 });
    measure();
    const ro = new ResizeObserver(measure);
    if (column.current) ro.observe(column.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [editing]);
  const dims = PAGE_DIMS[page.size];
  const width = Math.max(200, Math.floor(box.wide ? Math.min(box.w, ((box.vh - 170) * dims.w) / dims.h) : box.w));
  const scale = width / dims.w;
  const scaleRef = useRef(scale);
  scaleRef.current = scale;

  // ----- changes: every edit goes through here so undo and saving stay in one place
  const setPage = (next: Page) => {
    pageRef.current = next;
    setPageState(next);
  };
  const remember = (tag?: string) => {
    const now = Date.now();
    // typing or sliding counts as one undo step, not one per keystroke
    if (tag && lastTag.current.tag === tag && now - lastTag.current.at < 1200) {
      lastTag.current.at = now;
      return;
    }
    lastTag.current = { tag: tag ?? '', at: now };
    undo.current.push(pageRef.current);
    if (undo.current.length > 50) undo.current.shift();
    setUndoCount(undo.current.length);
  };
  const change = (fn: (p: Page) => Page, tag?: string) => {
    remember(tag);
    const next = fn(pageRef.current);
    setPage(next);
    savePage(next);
  };
  const undoLast = () => {
    const previous = undo.current.pop();
    if (!previous) return;
    setUndoCount(undo.current.length);
    lastTag.current = { tag: '', at: 0 };
    setPage(previous);
    savePage(previous);
    if (!previous.elements.some((e) => e.id === selectedId)) setSelectedId(null);
  };

  const selected = page.elements.find((e) => e.id === selectedId) ?? null;
  const patchEl = (id: string, patch: Patch, tag?: string) =>
    change((p) => ({ ...p, elements: p.elements.map((e) => (e.id === id ? ({ ...e, ...patch } as PageElement) : e)) }), tag);
  const addEl = (el: PageElement) => {
    change((p) => ({ ...p, elements: [...p.elements, el] }));
    setSelectedId(el.id);
  };
  const removeEl = (id: string) => {
    change((p) => ({ ...p, elements: p.elements.filter((e) => e.id !== id) }));
    setSelectedId(null);
  };
  const reorder = (id: string, by: number) =>
    change((p) => {
      const list = [...p.elements];
      const i = list.findIndex((e) => e.id === id);
      const j = clamp(i + by, 0, list.length - 1);
      const [el] = list.splice(i, 1);
      list.splice(j, 0, el);
      return { ...p, elements: list };
    });
  /** All the way behind everything else, or in front of it. */
  const toEdge = (id: string, edge: 'back' | 'front') =>
    change((p) => {
      const el = p.elements.find((e) => e.id === id);
      if (!el) return p;
      const rest = p.elements.filter((e) => e.id !== id);
      return { ...p, elements: edge === 'back' ? [el, ...rest] : [...rest, el] };
    });
  const duplicateEl = (el: PageElement) => addEl({ ...el, id: newId(), x: el.x + 36, y: el.y + 36 });

  // ----- gestures
  const begin = (e: React.PointerEvent, el: PageElement, mode: Mode) => {
    e.stopPropagation();
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    lastPress.current = { id: el.id, wasSelected: selectedId === el.id, moved: false };
    setSelectedId(el.id);
    const node = (e.currentTarget as HTMLElement).closest('.pg-el') as HTMLElement;
    const rect = node.getBoundingClientRect();
    const g = { sx: e.clientX, sy: e.clientY, cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2, h0: node.offsetHeight, moved: false };
    const move = (ev: PointerEvent) => {
      if (!g.moved) {
        if (Math.hypot(ev.clientX - g.sx, ev.clientY - g.sy) < 4) return; // a tap, not a drag
        g.moved = true;
        lastPress.current.moved = true;
        remember();
      }
      const s = scaleRef.current;
      const angle = (Math.atan2(ev.clientY - g.cy, ev.clientX - g.cx) * 180) / Math.PI + 90;
      const patch = applyGesture(el, g.h0, mode, (ev.clientX - g.sx) / s, (ev.clientY - g.sy) / s, angle);
      if (mode === 'move') {
        // keep the middle of the element on the sheet so nothing can be lost off the edge
        const d = PAGE_DIMS[pageRef.current.size];
        patch.x = clamp(patch.x as number, -el.w / 2, d.w - el.w / 2);
        patch.y = clamp(patch.y as number, -g.h0 / 2, d.h - g.h0 / 2);
      }
      const p = pageRef.current;
      setPage({ ...p, elements: p.elements.map((x) => (x.id === el.id ? ({ ...x, ...patch } as PageElement) : x)) });
    };
    const end = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      if (g.moved) savePage(pageRef.current);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };

  // ----- lines: drag an end to move it, or the middle to bend the line
  const beginPoint = (e: React.PointerEvent, el: LineElement, which: 'a' | 'b' | 'mid') => {
    e.stopPropagation();
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const l = linePoints(el);
    const from = which === 'mid' ? middle(l) : l[which];
    const other = which === 'a' ? l.b : l.a;
    const g = { sx: e.clientX, sy: e.clientY, moved: false };
    const move = (ev: PointerEvent) => {
      if (!g.moved) {
        if (Math.hypot(ev.clientX - g.sx, ev.clientY - g.sy) < 4) return;
        g.moved = true;
        remember();
      }
      const s = scaleRef.current;
      const d = PAGE_DIMS[pageRef.current.size];
      // the handle follows the finger, and stays on the sheet
      const to = { x: clamp(from.x + (ev.clientX - g.sx) / s, 0, d.w), y: clamp(from.y + (ev.clientY - g.sy) / s, 0, d.h) };
      if (which !== 'mid' && !l.mid) {
        // nearly level or upright: make it exactly so
        if (Math.abs(to.y - other.y) <= 6) to.y = other.y;
        if (Math.abs(to.x - other.x) <= 6) to.x = other.x;
      }
      const patch = moveLinePoint(el, which, to);
      const p = pageRef.current;
      setPage({ ...p, elements: p.elements.map((x) => (x.id === el.id ? ({ ...x, ...patch } as PageElement) : x)) });
    };
    const end = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      if (g.moved) savePage(pageRef.current);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };

  // ----- photo slots: drag the photo inside its frame, pinch or scroll to zoom
  const fingers = useRef(new Map<number, { x: number; y: number }>());
  const beginPan = (e: React.PointerEvent, el: FrameElement) => {
    e.stopPropagation();
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const node = e.currentTarget as HTMLElement;
    const win = node.querySelector<HTMLElement>('.pg-frame-window');
    const img = win?.querySelector('img');
    if (!win || !img?.naturalWidth) return;
    const pts = fingers.current;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size > 1) return; // the first finger's listeners handle the pinch
    const current = () => pageRef.current.elements.find((x) => x.id === el.id) as FrameElement | undefined;
    const ratio = img.naturalWidth / img.naturalHeight;
    const ww = win.offsetWidth;
    const wh = win.offsetHeight;
    const cover = ratio > ww / wh ? { w: wh * ratio, h: wh } : { w: ww, h: ww / ratio };
    const t = (el.rotation * Math.PI) / 180;
    let from = { x: e.clientX, y: e.clientY, panX: el.panX ?? 0.5, panY: el.panY ?? 0.5 };
    let pinch: { dist: number; zoom: number } | null = null;
    let moved = false;
    const apply = (patch: Patch) => {
      if (!moved) {
        moved = true;
        remember();
      }
      const p = pageRef.current;
      setPage({ ...p, elements: p.elements.map((x) => (x.id === el.id ? ({ ...x, ...patch } as PageElement) : x)) });
    };
    const move = (ev: PointerEvent) => {
      if (!pts.has(ev.pointerId)) return;
      pts.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      const now = current();
      if (!now) return;
      if (pts.size >= 2) {
        const [a, b] = [...pts.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        pinch ??= { dist, zoom: now.zoom ?? 1 };
        apply({ zoom: Math.round(clamp((pinch.zoom * dist) / Math.max(1, pinch.dist), 1, 4) * 100) / 100 });
        return;
      }
      if (pinch) {
        // back to one finger: carry on panning from here
        pinch = null;
        from = { x: ev.clientX, y: ev.clientY, panX: now.panX ?? 0.5, panY: now.panY ?? 0.5 };
        return;
      }
      const s = scaleRef.current;
      const dx = (ev.clientX - from.x) / s;
      const dy = (ev.clientY - from.y) / s;
      if (!moved && Math.hypot(dx, dy) < 3) return;
      const zoom = clamp(now.zoom ?? 1, 1, 4);
      const slackX = cover.w * zoom - ww;
      const slackY = cover.h * zoom - wh;
      // along the frame's own axes, so it feels the same when the frame is turned
      const lx = dx * Math.cos(t) + dy * Math.sin(t);
      const ly = -dx * Math.sin(t) + dy * Math.cos(t);
      apply({
        panX: slackX > 1 ? Math.round(clamp(from.panX - lx / slackX, 0, 1) * 1000) / 1000 : 0.5,
        panY: slackY > 1 ? Math.round(clamp(from.panY - ly / slackY, 0, 1) * 1000) / 1000 : 0.5,
      });
    };
    const end = (ev: PointerEvent) => {
      pts.delete(ev.pointerId);
      if (pts.size > 0) return;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      if (moved) savePage(pageRef.current);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };

  const pickFramePhoto = async (file: File | undefined) => {
    const id = frameTarget.current;
    if (frameInput.current) frameInput.current.value = '';
    if (!file || !id) return;
    setMessage('');
    try {
      const asset = await addImage(file);
      patchEl(id, { assetId: asset.id, zoom: undefined, panX: undefined, panY: undefined });
    } catch {
      setMessage("That file couldn't be opened as a picture. Try a JPG or PNG.");
    }
  };
  const openFramePicker = (id: string) => {
    frameTarget.current = id;
    frameInput.current?.click();
  };

  const onKey = (e: React.KeyboardEvent, el: PageElement) => {
    // keys typed into a part's own fields are writing, not moving or removing
    if ((e.target as HTMLElement).closest('input, textarea')) return;
    const step = e.shiftKey ? 50 : 10;
    const moves: Record<string, Patch> = {
      ArrowLeft: { x: el.x - step },
      ArrowRight: { x: el.x + step },
      ArrowUp: { y: el.y - step },
      ArrowDown: { y: el.y + step },
    };
    if (moves[e.key]) {
      e.preventDefault();
      patchEl(el.id, moves[e.key], `nudge-${el.id}`);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      removeEl(el.id);
    }
  };

  // leave edit mode cleanly
  useEffect(() => {
    if (!editing) setSelectedId(null);
  }, [editing]);
  // positioning a photo ends when something else is selected
  useEffect(() => {
    setCroppingId((id) => (id && id === selectedId ? id : null));
    setTapeTheme(null);
  }, [selectedId]);

  // Narrow screens: room under the page for the options panel, so the last parts can be reached.
  useEffect(() => {
    const panel = propsRef.current;
    if (!editing || !panel) return setPanelPad(0);
    const measure = () => {
      const fixed = getComputedStyle(panel).position === 'fixed';
      setPanelPad(fixed ? Math.ceil(window.innerHeight - panel.getBoundingClientRect().top + 24) : 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(panel);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [editing, selectedId]);

  // A part just selected: scroll it fully into view above the panel.
  useEffect(() => {
    if (!editing || !selectedId) return;
    const id = requestAnimationFrame(() => {
      const part = canvasRef.current?.querySelector<HTMLElement>('.pg-el.is-selected');
      if (part) revealAbove(propsRef.current, part);
    });
    return () => cancelAnimationFrame(id);
  }, [editing, selectedId, panelPad]);

  /** The Photo tool takes several pictures at once; each becomes its own photo on the page. */
  const pickPhotos = async (files: FileList | null) => {
    const list = Array.from(files ?? []);
    if (!list.length) return;
    setMessage('');
    let failed = 0;
    for (const file of list) {
      try {
        const asset = await addImage(file);
        addEl(newPhoto(pageRef.current, asset.id, asset.w / asset.h));
      } catch {
        failed++;
      }
    }
    if (failed) setMessage(list.length === 1 ? "That file couldn't be opened as a picture. Try a JPG or PNG." : `${failed} of ${list.length} files couldn't be opened as pictures. Try JPG or PNG.`);
    if (photoInput.current) photoInput.current.value = '';
  };

  const pickBackground = async (file: File | undefined) => {
    if (!file) return;
    setMessage('');
    try {
      const asset = await addImage(file);
      change((p) => ({ ...p, background: { ...p.background, assetId: asset.id } }));
    } catch {
      setMessage("That file couldn't be opened as a picture. Try a JPG or PNG.");
    }
    if (bgInput.current) bgInput.current.value = '';
  };

  /** Adds pictures to "My stickers" so they can be reused on any page. */
  const importStickers = async (files: FileList | null) => {
    if (!files?.length) return;
    setMessage('');
    const added: { assetId: string; ratio: number }[] = [];
    let failed = 0;
    for (const file of Array.from(files)) {
      try {
        const asset = await addImage(file, 600);
        added.push({ assetId: asset.id, ratio: asset.w / asset.h });
      } catch {
        failed++;
      }
    }
    if (added.length) updateSettings({ customStickers: [...(useStore.getState().settings.customStickers ?? []), ...added] });
    if (failed) setMessage(`${failed} file${failed === 1 ? '' : 's'} couldn't be opened as a picture. Try PNG or JPG.`);
    if (stickerInput.current) stickerInput.current.value = '';
  };

  const backTo = isCover ? '/book' : page.isTemplate ? '/templates' : '/journal';
  const coverName = page.role === 'back' ? 'Back cover' : 'Front cover';
  const applyCover = (id: (typeof COVER_PRESETS)[number]['id']) => {
    const owner = useStore.getState().settings.ownerName;
    change((p) => {
      // the front gets the whole design; the back only its paper and spine
      if (p.role === 'back') return { ...p, background: backPreset(id, themeAccent()).background, spine: backPreset(id, themeAccent()).spine };
      const d = coverPreset(id, owner, themeAccent());
      return { ...p, background: d.background, spine: d.spine, elements: d.elements };
    });
    setSelectedId(null);
    setSheet(null);
  };

  // ----- panels
  const tools = editing && (
    <div className="pe-tools" role="toolbar" aria-label="Add to page">
      {isCover && (
        <button className="pe-tool" onClick={() => setSheet('cover')}>
          <span aria-hidden="true">📕</span>Cover
        </button>
      )}
      <button className="pe-tool" onClick={() => addEl(newText(pageRef.current))}>
        <span aria-hidden="true">✏️</span>Text
      </button>
      <button className="pe-tool" onClick={() => photoInput.current?.click()}>
        <span aria-hidden="true">📷</span>Photo
      </button>
      <button className="pe-tool" onClick={() => addEl(newFrame(pageRef.current))}>
        <span aria-hidden="true">🖼️</span>Slot
      </button>
      <button className="pe-tool" onClick={() => setSheet('sticker')}>
        <span aria-hidden="true">🌸</span>Sticker
      </button>
      <button className="pe-tool" onClick={() => addEl(newTape(pageRef.current, TAPE_LIST[page.elements.length % TAPE_LIST.length][0], TAPE_PATTERNS[page.elements.filter((x) => x.type === 'tape').length % TAPE_PATTERNS.length].id))}>
        <span aria-hidden="true">🎀</span>Tape
      </button>
      <button className="pe-tool" onClick={() => setSheet('tracker')}>
        <span aria-hidden="true">✅</span>Tracker
      </button>
      <button className="pe-tool" onClick={() => addEl(newChecklist(pageRef.current))}>
        <span aria-hidden="true">☑️</span>List
      </button>
      <button className="pe-tool" onClick={() => addEl(newWriting(pageRef.current))}>
        <span aria-hidden="true">📝</span>Lines
      </button>
      <button className="pe-tool" onClick={() => addEl(newTable(pageRef.current))}>
        <span aria-hidden="true">▦</span>Table
      </button>
      <button className="pe-tool" onClick={() => addEl(newMonth(pageRef.current, new Date()))}>
        <span aria-hidden="true">📅</span>Month
      </button>
      <button className="pe-tool" onClick={() => addEl(newBookshelf(pageRef.current))}>
        <span aria-hidden="true">📚</span>Shelf
      </button>
      <button className="pe-tool" onClick={() => setSheet('grid')}>
        <span aria-hidden="true">🎯</span>Challenge
      </button>
      <button className="pe-tool" onClick={() => addEl(newBox(pageRef.current))}>
        <span aria-hidden="true">⬜</span>Box
      </button>
      <button className="pe-tool" onClick={() => addEl(newLine(pageRef.current))}>
        <span aria-hidden="true">↗️</span>Line
      </button>
      <button className="pe-tool" onClick={() => setSheet('shape')}>
        <span aria-hidden="true">⭕</span>Shape
      </button>
      <button className="pe-tool" onClick={() => setSheet('background')}>
        <span aria-hidden="true">🎨</span>Paper
      </button>
      <button className="pe-tool" onClick={undoLast} disabled={undoCount === 0}>
        <span aria-hidden="true">↩️</span>Undo
      </button>
      <input ref={photoInput} type="file" accept="image/*" multiple hidden onChange={(e) => void pickPhotos(e.target.files)} />
      <input ref={frameInput} type="file" accept="image/*" hidden onChange={(e) => void pickFramePhoto(e.target.files?.[0])} />
    </div>
  );

  const props = editing && (
    <div className="pe-props" aria-live="polite" ref={propsRef}>
      {!selected ? (
        <p className="muted">Tap something on the page to move, resize or change it. Drag the round handle to turn it, the corner to resize.</p>
      ) : (
        <>
          <div className="pe-props-head">
            <strong>{TYPE_NAMES[selected.type]}</strong>
            <div className="pe-actions">
              <button className="btn btn-small" onClick={() => reorder(selected.id, 1)} disabled={page.elements[page.elements.length - 1].id === selected.id}>
                Forward
              </button>
              <button className="btn btn-small" onClick={() => reorder(selected.id, -1)} disabled={page.elements[0].id === selected.id}>
                Back
              </button>
              <button className="btn btn-small" onClick={() => duplicateEl(selected)}>
                Copy
              </button>
              <button className="btn btn-small danger" onClick={() => removeEl(selected.id)}>
                Remove
              </button>
            </div>
          </div>

          {selected.type === 'text' && (
            <>
              <textarea rows={3} value={selected.text} onChange={(e) => patchEl(selected.id, { text: e.target.value }, 'text')} aria-label="Text" />
              <div className="pe-field">
                <span>Lettering</span>
                <div className="font-picker" role="radiogroup" aria-label="Lettering">
                  {TEXT_FONTS.map((f) => (
                    <button key={f.id} role="radio" aria-checked={selected.font === f.id} className={selected.font === f.id ? 'is-on' : ''} style={{ fontFamily: f.family, fontWeight: f.weight }} onClick={() => patchEl(selected.id, { font: f.id })}>
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pe-row">
                <div className="seg seg-small" role="radiogroup" aria-label="Alignment">
                  {(['left', 'center', 'right'] as const).map((a) => (
                    <button key={a} role="radio" aria-checked={selected.align === a} className={selected.align === a ? 'is-on' : ''} onClick={() => patchEl(selected.id, { align: a })}>
                      {a[0].toUpperCase() + a.slice(1)}
                    </button>
                  ))}
                </div>
                <button className={`chip ${selected.bold ? 'is-on' : ''}`} aria-pressed={!!selected.bold} onClick={() => patchEl(selected.id, { bold: selected.bold ? undefined : true })}>
                  Bold
                </button>
              </div>
              <label className="pe-slider">
                <span>Size</span>
                <input type="range" min={16} max={200} value={selected.size} onChange={(e) => patchEl(selected.id, { size: Number(e.target.value) }, 'size')} />
              </label>
              <div className="pe-field">
                <span>Colour</span>
                <Swatches colors={TEXT_LIST} value={selected.color} label="Text colour" onPick={(c) => patchEl(selected.id, { color: c })} />
              </div>
              <div className="pe-field">
                <span>Sticky note</span>
                <Swatches colors={TAPE_LIST} value={selected.note} label="Sticky note colour" allowNone onPick={(c) => patchEl(selected.id, { note: c })} />
              </div>
            </>
          )}

          {selected.type === 'photo' && (
            <div className="pe-row">
              <div className="seg seg-small" role="radiogroup" aria-label="Frame">
                {([['polaroid', 'Polaroid'], ['border', 'Border'], ['none', 'No frame']] as const).map(([f, name]) => (
                  <button key={f} role="radio" aria-checked={selected.frame === f} className={selected.frame === f ? 'is-on' : ''} onClick={() => patchEl(selected.id, { frame: f })}>
                    {name}
                  </button>
                ))}
              </div>
              <button className={`chip ${selected.shadow ? 'is-on' : ''}`} aria-pressed={selected.shadow} onClick={() => patchEl(selected.id, { shadow: !selected.shadow })}>
                Shadow
              </button>
            </div>
          )}

          {selected.type === 'frame' && (
            <>
              <div className="pe-row">
                <button className="btn btn-small btn-primary" onClick={() => openFramePicker(selected.id)}>
                  {selected.assetId ? 'Replace photo' : 'Add a photo'}
                </button>
                {selected.assetId && (
                  <>
                    <button className={`chip ${croppingId === selected.id ? 'is-on' : ''}`} aria-pressed={croppingId === selected.id} onClick={() => setCroppingId(croppingId === selected.id ? null : selected.id)}>
                      Move photo in frame
                    </button>
                    <button
                      className="btn btn-small btn-quiet"
                      onClick={() => {
                        setCroppingId(null);
                        patchEl(selected.id, { assetId: undefined, zoom: undefined, panX: undefined, panY: undefined });
                      }}
                    >
                      Remove photo
                    </button>
                  </>
                )}
              </div>
              {selected.assetId && (
                <>
                  <label className="pe-slider">
                    <span>Zoom</span>
                    <input type="range" min={1} max={4} step={0.05} value={selected.zoom ?? 1} onChange={(e) => patchEl(selected.id, { zoom: Number(e.target.value) }, 'frame-zoom')} aria-label="Zoom the photo" />
                  </label>
                  {croppingId === selected.id ? (
                    <p className="muted">Drag the photo to choose what shows. Pinch, scroll or use the slider to zoom.</p>
                  ) : (
                    ((selected.zoom ?? 1) !== 1 || (selected.panX ?? 0.5) !== 0.5 || (selected.panY ?? 0.5) !== 0.5) && (
                      <button className="btn btn-quiet btn-small" onClick={() => patchEl(selected.id, { zoom: undefined, panX: undefined, panY: undefined })}>
                        Centre the photo
                      </button>
                    )
                  )}
                </>
              )}
              <div className="pe-field">
                <span>Frame</span>
                <div className="seg seg-small seg-wrap" role="radiogroup" aria-label="Frame style">
                  {FRAME_STYLES.map((f) => (
                    <button key={f.id} role="radio" aria-checked={selected.style === f.id} className={selected.style === f.id ? 'is-on' : ''} onClick={() => patchEl(selected.id, { style: f.id })}>
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
              <label className="pe-field">
                <span>Caption</span>
                <input type="text" value={selected.caption ?? ''} onChange={(e) => patchEl(selected.id, { caption: e.target.value || undefined }, 'caption')} placeholder="No caption" maxLength={60} />
              </label>
              {!selected.assetId && <p className="muted">An empty slot can also be filled with a tap after Done.</p>}
            </>
          )}

          {selected.type === 'tape' && (
            <>
              <div className="pe-field">
                <span>Pattern</span>
                <div className="sticker-sets tape-themes" role="radiogroup" aria-label="Tape theme">
                  {TAPE_THEMES.map((th) => {
                    const on = (tapeTheme ?? themeOfTape(selected.pattern)) === th.id;
                    return (
                      <button key={th.id} role="radio" aria-checked={on} className={`chip ${on ? 'is-on' : ''}`} onClick={() => setTapeTheme(th.id)}>
                        {th.name}
                      </button>
                    );
                  })}
                </div>
                {recent.length > 0 && (
                  <>
                    <small className="muted">Recently used</small>
                    <div className="tape-picker is-recent" role="group" aria-label="Recently used tapes">
                      {recent.map((id) => {
                        const name = TAPE_PATTERNS.find((t) => t.id === id)?.name ?? THEMED_TAPES.find((t) => t.id === id)?.name;
                        if (!name) return null;
                        return (
                          <button key={id} aria-label={name} title={name} aria-pressed={selected.pattern === id} className={selected.pattern === id ? 'is-on' : ''} onClick={() => patchEl(selected.id, { pattern: id, color: tapeColorFor(id, selected.color) })}>
                            <TapeStrip color={tapeColorFor(id, selected.color)} pattern={id} edge={selected.edge} />
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
                <div className="tape-picker" role="radiogroup" aria-label="Tape pattern">
                  {((tapeTheme ?? themeOfTape(selected.pattern)) === 'basics' ? TAPE_PATTERNS : THEMED_TAPES.filter((t) => t.theme === (tapeTheme ?? themeOfTape(selected.pattern)))).map((t) => (
                    <button
                      key={t.id}
                      role="radio"
                      aria-checked={selected.pattern === t.id}
                      aria-label={t.name}
                      title={t.name}
                      className={selected.pattern === t.id ? 'is-on' : ''}
                      onClick={() => {
                        // a themed tape comes in its own colour (kraft is brown, foil is gold); she can change it below
                        patchEl(selected.id, { pattern: t.id, color: tapeColorFor(t.id, selected.color) });
                        setRecent(rememberTape(t.id));
                      }}
                    >
                      {BASIC_TAPES.has(t.id) ? <i className={`pg-tape tape-${t.id} edge-${selected.edge ?? 'torn'}`} style={{ backgroundColor: TAPE_COLORS[selected.color] }} /> : <TapeStrip color={tapeColorFor(t.id, selected.color)} pattern={t.id} edge={selected.edge} />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pe-field">
                <span>Ends</span>
                <div className="pe-row">
                  <div className="seg seg-small" role="radiogroup" aria-label="Tape ends">
                    {TAPE_EDGES.map((f) => (
                      <button key={f.id} role="radio" aria-checked={(selected.edge ?? 'torn') === f.id} className={(selected.edge ?? 'torn') === f.id ? 'is-on' : ''} onClick={() => patchEl(selected.id, { edge: f.id })}>
                        {f.name}
                      </button>
                    ))}
                  </div>
                  <button className={`chip ${selected.sheer ? 'is-on' : ''}`} aria-pressed={!!selected.sheer} onClick={() => patchEl(selected.id, { sheer: !selected.sheer })}>
                    See-through
                  </button>
                </div>
              </div>
              <div className="pe-field">
                <span>Colour</span>
                <Swatches colors={TAPE_LIST} value={selected.color} label="Tape colour" onPick={(c) => patchEl(selected.id, { color: c })} />
              </div>
            </>
          )}

          {selected.type === 'sticker' && selected.art && !drawnSticker(selected.art)?.fixed && (
            <div className="pe-field">
              <span>Colour</span>
              <Swatches colors={TAPE_LIST} value={selected.color ?? drawnSticker(selected.art)?.color} label="Sticker colour" onPick={(c) => patchEl(selected.id, { color: c })} />
            </div>
          )}

          {(selected.type === 'checklist' || selected.type === 'table' || selected.type === 'writing' || selected.type === 'box' || selected.type === 'bookshelf' || selected.type === 'tiles') && (
            <label className="pe-field">
              <span>Heading</span>
              <input type="text" value={selected.title ?? ''} onChange={(e) => patchEl(selected.id, { title: e.target.value }, 'title-el')} placeholder="No heading" maxLength={40} />
            </label>
          )}

          {selected.type === 'checklist' && (
            <label className="pe-field">
              <span>Items, one per line</span>
              <textarea
                rows={4}
                value={selected.items.map((i) => i.text).join('\n')}
                onChange={(e) => {
                  const old = selected.items;
                  patchEl(selected.id, { items: lines(e.target.value).map((text, i) => ({ ...(old[i] ?? newItem()), text })) }, 'items');
                }}
              />
            </label>
          )}

          {selected.type === 'table' && (
            <div className="pe-row pe-two">
              <label className="pe-field">
                <span>Columns, one per line</span>
                <textarea rows={4} value={selected.cols.join('\n')} onChange={(e) => patchEl(selected.id, { cols: lines(e.target.value).slice(0, 8) }, 'cols')} />
              </label>
              <label className="pe-field">
                <span>Rows, one per line</span>
                <textarea rows={4} value={selected.rows.join('\n')} onChange={(e) => patchEl(selected.id, { rows: lines(e.target.value).slice(0, 20) }, 'rows')} />
              </label>
            </div>
          )}

          {selected.type === 'bookshelf' && (
            <>
              <label className="pe-slider">
                <span>Books: {selected.books.length}</span>
                <input
                  type="range"
                  min={4}
                  max={60}
                  value={selected.books.length}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    const books = selected.books.slice(0, n);
                    while (books.length < n) books.push(newBook(books.length));
                    patchEl(selected.id, { books }, 'books');
                  }}
                />
              </label>
              <label className="pe-slider">
                <span>Per shelf: {selected.perShelf}</span>
                <input type="range" min={4} max={16} value={selected.perShelf} onChange={(e) => patchEl(selected.id, { perShelf: Number(e.target.value) }, 'per-shelf')} />
              </label>
            </>
          )}

          {selected.type === 'writing' && (
            <div className="pe-row">
              <button className={`chip ${selected.lined ? 'is-on' : ''}`} aria-pressed={selected.lined} onClick={() => patchEl(selected.id, { lined: !selected.lined })}>
                Ruled lines
              </button>
              <button className={`chip ${selected.bare ? '' : 'is-on'}`} aria-pressed={!selected.bare} onClick={() => patchEl(selected.id, { bare: selected.bare ? undefined : true })}>
                Panel
              </button>
            </div>
          )}

          {selected.type === 'line' && (
            <>
              <div className="pe-row">
                <div className="seg seg-small" role="radiogroup" aria-label="Straight or curved">
                  <button role="radio" aria-checked={!isCurved(selected)} className={!isCurved(selected) ? 'is-on' : ''} onClick={() => isCurved(selected) && patchEl(selected.id, straightenLine(selected))}>
                    Straight
                  </button>
                  <button role="radio" aria-checked={isCurved(selected)} className={isCurved(selected) ? 'is-on' : ''} onClick={() => !isCurved(selected) && patchEl(selected.id, bendLine(selected))}>
                    Curved
                  </button>
                </div>
                <div className="seg seg-small" role="radiogroup" aria-label="Line style">
                  {([[undefined, 'Solid'], ['dashed', 'Dashed'], ['dotted', 'Dotted']] as const).map(([f, name]) => (
                    <button key={name} role="radio" aria-checked={selected.dash === f} className={selected.dash === f ? 'is-on' : ''} onClick={() => patchEl(selected.id, { dash: f })}>
                      {name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pe-field">
                <span>Arrowhead</span>
                <div className="pe-row">
                  <div className="seg seg-small" role="radiogroup" aria-label="Arrowhead">
                    {([[undefined, 'None'], ['end', 'One end'], ['both', 'Both ends']] as const).map(([f, name]) => (
                      <button key={name} role="radio" aria-checked={selected.arrow === f} className={selected.arrow === f ? 'is-on' : ''} onClick={() => patchEl(selected.id, { arrow: f })}>
                        {name}
                      </button>
                    ))}
                  </div>
                  {selected.arrow === 'end' && (
                    <button className="btn btn-quiet btn-small" onClick={() => patchEl(selected.id, flipLine(selected))}>
                      Other end
                    </button>
                  )}
                </div>
              </div>
              <label className="pe-slider">
                <span>Thickness: {selected.weight}</span>
                <input type="range" min={2} max={16} value={selected.weight} onChange={(e) => patchEl(selected.id, { weight: Number(e.target.value) }, 'line-weight')} aria-label="Line thickness" />
              </label>
              <div className="pe-field">
                <span>Colour</span>
                <Swatches colors={TEXT_LIST} value={selected.color} label="Line colour" onPick={(c) => c && patchEl(selected.id, { color: c })} />
              </div>
              <p className="muted">Drag the round ends to where the line starts and stops. Drag the yellow handle in the middle to bend it.</p>
            </>
          )}

          {selected.type === 'shape' && (
            <>
              <div className="pe-field">
                <span>Shape</span>
                <div className="seg seg-small seg-wrap" role="radiogroup" aria-label="Shape">
                  {SHAPES.map((f) => (
                    <button key={f.id} role="radio" aria-checked={selected.shape === f.id} className={selected.shape === f.id ? 'is-on' : ''} onClick={() => patchEl(selected.id, { shape: f.id })}>
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pe-row">
                <div className="seg seg-small" role="radiogroup" aria-label="Outline">
                  {([[false, 'Solid line'], [true, 'Dashed']] as const).map(([f, name]) => (
                    <button key={name} role="radio" aria-checked={!!selected.dashed === f} className={!!selected.dashed === f ? 'is-on' : ''} onClick={() => patchEl(selected.id, { dashed: f || undefined })}>
                      {name}
                    </button>
                  ))}
                </div>
                <button className={`chip ${selected.fill ? 'is-on' : ''}`} aria-pressed={!!selected.fill} onClick={() => patchEl(selected.id, { fill: selected.fill ? undefined : true })}>
                  Soft fill
                </button>
              </div>
              <label className="pe-slider">
                <span>Thickness: {shapeWeight(selected)}</span>
                <input type="range" min={2} max={14} value={shapeWeight(selected)} onChange={(e) => patchEl(selected.id, { weight: Number(e.target.value) }, 'shape-weight')} aria-label="Outline thickness" />
              </label>
              <div className="pe-field">
                <span>Colour</span>
                <Swatches colors={TEXT_LIST} value={selected.color} label="Outline colour" onPick={(c) => c && patchEl(selected.id, { color: c })} />
              </div>
              <div className="pe-row">
                <button className="btn btn-small" onClick={() => toEdge(selected.id, 'back')} disabled={page.elements[0].id === selected.id}>
                  Behind everything
                </button>
                <button className="btn btn-small" onClick={() => toEdge(selected.id, 'front')} disabled={page.elements[page.elements.length - 1].id === selected.id}>
                  In front of everything
                </button>
              </div>
              <p className="muted">To write inside a shape, put it behind everything, then add text or lines to write on over it.</p>
            </>
          )}

          {selected.type === 'month' && (
            <div className="px-nav">
              <button className="icon-btn" aria-label="Previous month" onClick={() => patchEl(selected.id, selected.month === 0 ? { month: 11, year: selected.year - 1 } : { month: selected.month - 1 })}>
                ‹
              </button>
              <strong>{monthTitle(selected.year, selected.month)}</strong>
              <button className="icon-btn" aria-label="Next month" onClick={() => patchEl(selected.id, selected.month === 11 ? { month: 0, year: selected.year + 1 } : { month: selected.month + 1 })}>
                ›
              </button>
            </div>
          )}

          {selected.type === 'box' && (
            <>
              <div className="pe-row">
                <div className="seg seg-small" role="radiogroup" aria-label="Border">
                  {([['solid', 'Solid line'], ['dashed', 'Dashed'], ['none', 'No line']] as const).map(([f, name]) => (
                    <button key={f} role="radio" aria-checked={selected.border === f} className={selected.border === f ? 'is-on' : ''} onClick={() => patchEl(selected.id, { border: f })}>
                      {name}
                    </button>
                  ))}
                </div>
                <button className={`chip ${selected.shadow ? 'is-on' : ''}`} aria-pressed={!!selected.shadow} onClick={() => patchEl(selected.id, { shadow: selected.shadow ? undefined : true })}>
                  Shadow
                </button>
              </div>
              <div className="pe-field">
                <span>Fill</span>
                <Swatches colors={[['white', '#FFFDF9'], ...TAPE_LIST]} value={selected.fill} label="Box fill" allowNone onPick={(c) => patchEl(selected.id, { fill: c })} />
              </div>
            </>
          )}

          {selected.type === 'tiles' && (
            <>
              <div className="pe-row pe-two">
                <label className="pe-field">
                  <span>Layout</span>
                  <select value={selected.layout ?? 'grid'} onChange={(e) => patchEl(selected.id, { layout: e.target.value === 'grid' ? undefined : e.target.value })} aria-label="Layout">
                    {TILE_LAYOUTS.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </label>
                {(selected.layout ?? 'grid') === 'grid' || selected.layout === 'path' ? (
                  <label className="pe-field">
                    <span>Shape</span>
                    <select
                      value={selected.shape ?? 'square'}
                      onChange={(e) => patchEl(selected.id, e.target.value === 'square' ? { shape: undefined } : { shape: e.target.value, mark: selected.shape ? selected.mark : 'fill' })}
                      aria-label="Tile shape"
                    >
                      {TILE_SHAPES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <span />
                )}
              </div>
              {((selected.layout ?? 'grid') === 'grid' || selected.layout === 'path') && (
                <div className="pe-row">
                  <div className="seg seg-small" role="radiogroup" aria-label="Mark">
                    {([['cross', 'Cross'], ['stamp', 'Stamp'], ['fill', 'Colour in']] as const).map(([m, name]) => {
                      const now = selected.mark ?? ((selected.shape ?? 'square') === 'square' && selected.layout !== 'path' ? 'cross' : 'fill');
                      return (
                        <button key={m} role="radio" aria-checked={now === m} className={now === m ? 'is-on' : ''} onClick={() => patchEl(selected.id, { mark: m })}>
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="pe-row">
                <button className={`chip ${selected.count ? 'is-on' : ''}`} aria-pressed={!!selected.count} onClick={() => patchEl(selected.id, { count: selected.count ? undefined : true })}>
                  Show progress
                </button>
                <button className={`chip ${selected.bare ? '' : 'is-on'}`} aria-pressed={!selected.bare} onClick={() => patchEl(selected.id, { bare: selected.bare ? undefined : true })}>
                  Panel
                </button>
                {((selected.layout ?? 'grid') === 'grid' || selected.layout === 'path') && (
                  <button className={`chip ${selected.inOrder ? 'is-on' : ''}`} aria-pressed={!!selected.inOrder} onClick={() => patchEl(selected.id, { inOrder: selected.inOrder ? undefined : true })}>
                    Fill in order
                  </button>
                )}
                {(selected.layout ?? 'grid') === 'grid' && (
                  <>
                    <button className={`chip ${selected.bingo ? 'is-on' : ''}`} aria-pressed={!!selected.bingo} onClick={() => patchEl(selected.id, { bingo: !selected.bingo })}>
                      Bingo lines
                    </button>
                    {(selected.shape ?? 'square') === 'square' && (
                      <button className={`chip ${selected.freeCenter ? 'is-on' : ''}`} aria-pressed={!!selected.freeCenter} onClick={() => patchEl(selected.id, { freeCenter: !selected.freeCenter })}>
                        Free centre
                      </button>
                    )}
                  </>
                )}
              </div>
              {((selected.layout ?? 'grid') === 'grid' || selected.layout === 'path') && (
                <label className="pe-slider">
                  <span>Columns: {selected.cols}</span>
                  <input type="range" min={2} max={12} value={selected.cols} onChange={(e) => patchEl(selected.id, { cols: Number(e.target.value) }, 'grid-cols')} />
                </label>
              )}
              <label className="pe-slider">
                <span>{selected.layout === 'trail' ? 'Stops' : 'Tiles'}: {selected.tiles.length}</span>
                <input
                  type="range"
                  min={selected.layout === 'trail' ? 3 : 4}
                  max={selected.layout === 'trail' ? 16 : selected.layout === 'thermo' ? 31 : 100}
                  value={selected.tiles.length}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    const tiles = selected.tiles.slice(0, n);
                    while (tiles.length < n) tiles.push({});
                    patchEl(selected.id, { tiles }, 'grid-tiles');
                  }}
                />
              </label>
              <label className="pe-field">
                <span>Labels, one per tile (optional)</span>
                <textarea
                  rows={4}
                  value={selected.tiles.map((t) => t.label ?? '').join('\n').replace(/\n+$/, '')}
                  onChange={(e) => {
                    const labels = lines(e.target.value);
                    patchEl(selected.id, { tiles: selected.tiles.map((t, i) => ({ ...t, label: labels[i]?.trim() || undefined })) }, 'grid-labels');
                  }}
                />
              </label>
              {selected.tiles.some((t) => t.done) && (
                <button className="btn btn-quiet btn-small" onClick={() => patchEl(selected.id, { tiles: selected.tiles.map((t) => ({ ...t, done: false })) })}>
                  Clear all marks
                </button>
              )}
            </>
          )}

          {(selected.type === 'checklist' || selected.type === 'table' || selected.type === 'writing' || selected.type === 'month' || selected.type === 'bookshelf' || selected.type === 'tiles') && (
            <div className="pe-field">
              <span>Heading colour</span>
              <Swatches colors={TAPE_LIST} value={selected.color} label="Heading colour" onPick={(c) => patchEl(selected.id, { color: c })} />
            </div>
          )}

          {isWritable(selected) && <TextStyleFields el={selected as PartTextStyle} onPatch={(patch, tag) => patchEl(selected.id, patch, tag)} />}

          {isWritable(selected) && (
            <p className="muted">Write straight on the part while it is selected. Move it by its heading or the ✥ handle. After Done, ticks{selected.type === 'tiles' ? ' and tile marks' : ''} still work with a tap.</p>
          )}

          {selected.type === 'tracker' && <p className="muted">Shows this tracker live, in the look chosen for it. Tap it outside editing to log.</p>}

          {selected.rotation !== 0 && (
            <button className="btn btn-quiet btn-small" onClick={() => patchEl(selected.id, { rotation: 0 })}>
              Straighten
            </button>
          )}
        </>
      )}
      {message && (
        <p className="warning" role="alert">
          {message}
        </p>
      )}
    </div>
  );

  return (
    <div className={`pe ${editing ? 'is-editing' : ''} ${selected ? 'has-selection' : ''}`}>
      <header className="page-head pe-head">
        <Link to={backTo} className="icon-btn" aria-label={isCover ? 'Back to the book' : page.isTemplate ? 'Back to templates' : 'Back to journal'}>
          ‹
        </Link>
        <div className="page-head-text">
          {isCover ? (
            <h1>{coverName}</h1>
          ) : editing ? (
            <input className="pe-title" type="text" value={page.title} onChange={(e) => change((p) => ({ ...p, title: e.target.value }), 'title')} aria-label="Page title" maxLength={60} />
          ) : (
            <h1>{page.title || 'Untitled page'}</h1>
          )}
          {page.isTemplate && <p className="muted">Template</p>}
          {isCover && <p className="muted">Of your book</p>}
        </div>
        <div className="page-head-action pe-head-actions">
          <button className="btn" onClick={() => setSheet('more')}>
            More
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              // drop "?edit=1" so reopening or reloading shows the finished page
              if (editing && params.get('edit')) navigate(`/journal/${page.id}`, { replace: true });
              setEditing(!editing);
            }}
          >
            {editing ? 'Done' : 'Edit'}
          </button>
        </div>
      </header>

      <div className="pe-body">
        {tools}
        {props}
        <div
          className="pe-canvas"
          ref={(node) => {
            column.current = node;
            canvasRef.current = node;
          }}
          style={panelPad ? { paddingBottom: panelPad } : undefined}
          onFocusCapture={(e) => {
            // typing in a part: keep the field (and its part) above the panel once the keyboard is up
            const field = e.target as HTMLElement;
            if (!editing || !field.matches('input, textarea')) return;
            const part = field.closest<HTMLElement>('.pg-el');
            if (part) window.setTimeout(() => revealAbove(propsRef.current, part, field), 320);
          }}
        >
          {editing ? (
            <PageSurface page={page} width={width} className="is-edit" coverCount={pageCount} onPointerDown={(e) => e.target === e.currentTarget && setSelectedId(null)}>
              {page.elements.map((el) => {
                const on = el.id === selectedId;
                const typing = on && isWritable(el);
                const cropping = on && el.type === 'frame' && croppingId === el.id && Boolean(el.assetId);
                return (
                  <div
                    key={el.id}
                    className={`pg-el type-${el.type} ${on ? 'is-selected' : ''} ${typing ? 'is-typing' : ''} ${cropping ? 'is-cropping' : ''}`}
                    style={frameStyle(el)}
                    tabIndex={0}
                    role="button"
                    aria-label={`${TYPE_NAMES[el.type]}${el.type === 'text' ? `: ${el.text.slice(0, 40)}` : ''}${on ? ', selected' : ''}`}
                    onPointerDown={(e) => {
                      // in the selected part, pressing a field or button types or taps; elsewhere it drags
                      if (typing && (e.target as HTMLElement).closest('input, textarea, button')) return e.stopPropagation();
                      if (cropping && el.type === 'frame') return beginPan(e, el);
                      begin(e, el, 'move');
                    }}
                    onClick={() => {
                      // a tap on an empty photo slot that was already selected opens the picker
                      const press = lastPress.current;
                      if (el.type === 'frame' && !el.assetId && press.id === el.id && press.wasSelected && !press.moved) openFramePicker(el.id);
                    }}
                    onWheel={
                      cropping && el.type === 'frame'
                        ? (e) => patchEl(el.id, { zoom: Math.round(clamp((el.zoom ?? 1) * (e.deltaY < 0 ? 1.08 : 1 / 1.08), 1, 4) * 100) / 100 }, 'frame-zoom')
                        : undefined
                    }
                    onFocus={(e) => e.target === e.currentTarget && setSelectedId(el.id)}
                    onKeyDown={(e) => onKey(e, el)}
                  >
                    <div className="pg-el-body">
                      <ElementBody el={el} live={false} editing={typing} onChange={typing ? (patch) => patchEl(el.id, patch, `fill-${el.id}`) : undefined} />
                    </div>
                    {on && el.type === 'line' && (
                      <>
                        <span className="handle handle-point" data-handle="a" style={handleAt(linePoints(el, true).a)} onPointerDown={(e) => beginPoint(e, el, 'a')} aria-hidden="true" />
                        <span className="handle handle-point" data-handle="b" style={handleAt(linePoints(el, true).b)} onPointerDown={(e) => beginPoint(e, el, 'b')} aria-hidden="true" />
                        <span className="handle handle-bend" data-handle="mid" style={handleAt(middle(linePoints(el, true)))} onPointerDown={(e) => beginPoint(e, el, 'mid')} aria-hidden="true" />
                      </>
                    )}
                    {on && el.type !== 'line' && (
                      <>
                        {typing && (
                          <span className="handle handle-move" onPointerDown={(e) => begin(e, el, 'move')} aria-hidden="true">
                            ✥
                          </span>
                        )}
                        <span className="handle-stem" aria-hidden="true" />
                        <span className="handle handle-rotate" onPointerDown={(e) => begin(e, el, 'rotate')} aria-hidden="true" />
                        <span className="handle handle-resize" onPointerDown={(e) => begin(e, el, 'resize')} aria-hidden="true" />
                        {(el.type === 'text' || el.type === 'checklist') && <span className="handle handle-width" onPointerDown={(e) => begin(e, el, 'width')} aria-hidden="true" />}
                      </>
                    )}
                  </div>
                );
              })}
            </PageSurface>
          ) : (
            <StaticPage
              page={page}
              width={width}
              live
              coverCount={pageCount}
              onElementChange={(elId, patch) => {
                // typing and ticking on the finished page saves straight away
                const p = pageRef.current;
                const next = { ...p, elements: p.elements.map((x) => (x.id === elId ? ({ ...x, ...patch } as PageElement) : x)) };
                setPage(next);
                savePage(next);
              }}
            />
          )}
          {!editing && page.elements.length === 0 && (
            <p className="muted pe-empty">This page is empty. Tap Edit to add text, photos, stickers and trackers.</p>
          )}
        </div>
      </div>

      {sheet === 'sticker' && (
        <Sheet title="Add a sticker" onClose={() => setSheet(null)}>
          <div className="sticker-sets" role="radiogroup" aria-label="Sticker set">
            <button role="radio" aria-checked={stickerSet === 'mine'} className={`chip ${stickerSet === 'mine' ? 'is-on' : ''}`} onClick={() => setStickerSet('mine')}>
              <span aria-hidden="true">🖼️</span> My stickers
            </button>
            {STICKER_SETS.map((set) => (
              <button key={set.id} role="radio" aria-checked={stickerSet === set.id} className={`chip ${stickerSet === set.id ? 'is-on' : ''}`} onClick={() => setStickerSet(set.id)}>
                {set.stickers[0] ? (
                  <span aria-hidden="true">{set.stickers[0]}</span>
                ) : (
                  <span className="chip-art" aria-hidden="true">
                    <DrawnStickerArt id={DRAWN_STICKERS.find((d) => d.set === set.id)?.id ?? 'heart'} />
                  </span>
                )}{' '}
                {set.name}
              </button>
            ))}
          </div>

          {stickerSet === 'mine' ? (
            <>
              <div className="inline">
                <button className="btn btn-primary" onClick={() => stickerInput.current?.click()}>
                  Add pictures
                </button>
                {myStickers.length > 0 && (
                  <button className="btn btn-quiet" onClick={() => setManaging(!managing)} aria-pressed={managing}>
                    {managing ? 'Done removing' : 'Remove some'}
                  </button>
                )}
                <input ref={stickerInput} type="file" accept="image/*" multiple hidden onChange={(e) => importStickers(e.target.files)} />
              </div>
              {myStickers.length === 0 ? (
                <p className="muted">
                  Add your own sticker pictures from this device and they stay here for any page. Pictures with a see-through background (PNG) look best.
                </p>
              ) : (
                <div className="sticker-grid is-art">
                  {myStickers.map((c, i) => (
                    <button
                      key={c.assetId}
                      className={managing ? 'is-removing' : ''}
                      onClick={() => {
                        if (managing) {
                          updateSettings({ customStickers: myStickers.filter((x) => x.assetId !== c.assetId) });
                        } else {
                          addEl(newCustomSticker(pageRef.current, c.assetId, c.ratio));
                          setSheet(null);
                        }
                      }}
                      aria-label={managing ? `Remove my sticker ${i + 1}` : `My sticker ${i + 1}`}
                    >
                      <CustomStickerBody assetId={c.assetId} />
                      {managing && <span className="remove-badge" aria-hidden="true">✕</span>}
                    </button>
                  ))}
                </div>
              )}
              {managing && <p className="muted">Removing a sticker here keeps it on pages that already use it.</p>}
              {message && (
                <p className="warning" role="alert">
                  {message}
                </p>
              )}
            </>
          ) : (
            <>
              {DRAWN_STICKERS.some((d) => d.set === stickerSet) && (
                <div className="sticker-grid is-art">
                  {DRAWN_STICKERS.filter((d) => d.set === stickerSet).map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        addEl(newDrawnSticker(pageRef.current, d.id, d.color));
                        setSheet(null);
                      }}
                      aria-label={`${d.name} sticker`}
                      title={d.name}
                    >
                      <DrawnStickerArt id={d.id} />
                    </button>
                  ))}
                </div>
              )}
              <div className="sticker-grid">
                {(STICKER_SETS.find((x) => x.id === stickerSet) ?? STICKER_SETS[0]).stickers.map((em) => (
                  <button
                    key={em}
                    onClick={() => {
                      addEl(newSticker(pageRef.current, em));
                      setSheet(null);
                    }}
                    aria-label={`Sticker ${em}`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </>
          )}
        </Sheet>
      )}

      {sheet === 'tracker' && (
        <Sheet title="Add a tracker" onClose={() => setSheet(null)}>
          {trackers.length === 0 ? (
            <p>
              There are no trackers yet. <Link to="/trackers/new" className="text-link">Add a tracker</Link> first, then place it on a page.
            </p>
          ) : (
            <ul className="rows">
              {trackers.map((t) => (
                <li key={t.id} className="row">
                  <button
                    className="row-main row-button"
                    onClick={() => {
                      addEl(newTrackerElement(pageRef.current, t.id));
                      setSheet(null);
                    }}
                  >
                    <span className="dot" style={{ background: TAPE_COLORS[t.color] }} aria-hidden="true">
                      {t.emoji}
                    </span>
                    <span className="row-text">
                      <strong>{t.name}</strong>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Sheet>
      )}

      {sheet === 'background' && (
        <Sheet title="Paper" onClose={() => setSheet(null)}>
          <div className="pe-field">
            <span>Colour</span>
            <Swatches colors={isCover ? [...BG_LIST, ...COVER_COLORS] : BG_LIST} value={page.background.color} label="Paper colour" onPick={(c) => c && change((p) => ({ ...p, background: { ...p.background, color: c } }))} />
          </div>
          <div className="pe-field">
            <span>Pattern</span>
            <div className="seg seg-small" role="radiogroup" aria-label="Paper pattern">
              {PATTERNS.map((pt) => (
                <button key={pt.id} role="radio" aria-checked={page.background.pattern === pt.id} className={page.background.pattern === pt.id ? 'is-on' : ''} onClick={() => change((p) => ({ ...p, background: { ...p.background, pattern: pt.id } }))}>
                  {pt.name}
                </button>
              ))}
            </div>
          </div>
          <div className="pe-field">
            <span>Texture</span>
            <div className="seg seg-small seg-wrap" role="radiogroup" aria-label="Paper texture">
              {TEXTURES.map((pt) => (
                <button key={pt.id} role="radio" aria-checked={page.background.pattern === pt.id} className={page.background.pattern === pt.id ? 'is-on' : ''} onClick={() => change((p) => ({ ...p, background: { ...p.background, pattern: pt.id } }))}>
                  {pt.name}
                </button>
              ))}
            </div>
          </div>
          <div className="pe-field">
            <span>Background picture</span>
            <div className="inline">
              <button className="btn" onClick={() => bgInput.current?.click()}>
                {page.background.assetId ? 'Change picture' : 'Choose a picture'}
              </button>
              {page.background.assetId && (
                <button className="btn btn-quiet" onClick={() => change((p) => ({ ...p, background: { ...p.background, assetId: undefined } }))}>
                  Remove picture
                </button>
              )}
              <input ref={bgInput} type="file" accept="image/*" hidden onChange={(e) => void pickBackground(e.target.files?.[0])} />
            </div>
          </div>
        </Sheet>
      )}

      {sheet === 'cover' && (
        <Sheet title={coverName} onClose={() => setSheet(null)}>
          <div className="pe-field">
            <span>Start from a design</span>
            <div className="cover-presets">
              {COVER_PRESETS.map((c) => (
                <button key={c.id} className="cover-preset" onClick={() => applyCover(c.id)}>
                  <i style={{ background: c.id === 'classic' ? themeAccent() : c.swatch }} className={`pattern-${c.id === 'classic' ? 'cover' : c.id}`} aria-hidden="true" />
                  {c.name}
                </button>
              ))}
            </div>
            <small className="muted">
              {page.role === 'back' ? 'Changes the paper and the spine. What you put on the back cover stays.' : 'Replaces what is on the cover now. Undo brings it back.'}
            </small>
          </div>
          <div className="pe-field">
            <span>Spine</span>
            <Swatches colors={SPINE_LIST} value={page.spine} label="Spine colour" allowNone onPick={(c) => change((p) => ({ ...p, spine: c }))} />
          </div>
          {page.role === 'cover' && (
            <button className={`chip ${page.hideCount ? '' : 'is-on'}`} aria-pressed={!page.hideCount} onClick={() => change((p) => ({ ...p, hideCount: p.hideCount ? undefined : true }))}>
              Show the number of pages
            </button>
          )}
          <p className="muted">Everything else works as on any page: Paper for the colour and texture, and text, photos, stickers and tape on top.</p>
        </Sheet>
      )}

      {sheet === 'more' && (
        <Sheet title={isCover ? coverName : page.title || 'Untitled page'} onClose={() => setSheet(null)}>
          <div className="menu-list">
            {isCover ? (
              <>
                <p className="muted">The covers are shared together with the whole book.</p>
                <button className="btn" onClick={() => setSheet('cover')}>
                  Cover designs and spine
                </button>
              </>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => {
                  setSheet(null);
                  setSharing(true);
                }}
              >
                Share…
              </button>
            )}
            {!isCover && (
              <button className="btn" onClick={() => navigate(`/export?page=${page.id}`)}>
                Print or save as PDF
              </button>
            )}
            {isCover ? null : page.isTemplate ? (
              <button
                className="btn"
                onClick={() => {
                  const made = createPage(page.title, page.size, page, false);
                  navigate(`/journal/${made.id}?edit=1`);
                }}
              >
                Make a page from this template
              </button>
            ) : (
              <>
                <button
                  className="btn"
                  onClick={() => {
                    const made = createPage(`${page.title || 'Untitled page'} copy`, page.size, page, false);
                    navigate(`/journal/${made.id}?edit=1`);
                  }}
                >
                  Duplicate this page
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    createPage(page.title || 'Untitled page', page.size, page, true);
                    setSheet(null);
                    navigate('/templates');
                  }}
                >
                  Save as a template
                </button>
              </>
            )}
            <button className="btn danger" onClick={() => setSheet('delete')}>
              {isCover ? 'Go back to the standard cover' : `Delete this ${page.isTemplate ? 'template' : 'page'}`}
            </button>
          </div>
        </Sheet>
      )}

      {sheet === 'shape' && (
        <Sheet title="Add a shape" onClose={() => setSheet(null)}>
          <div className="shape-picker">
            {SHAPES.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  addEl(newShape(pageRef.current, f.id));
                  setSheet(null);
                }}
              >
                <ShapeOutline shape={f.id} w={f.id === 'circle' || f.id === 'rounded' ? 84 : 110} h={84} color="#3A2B47" weight={4} />
                {f.name}
              </button>
            ))}
          </div>
          <p className="muted">Change its colour, fill it softly or put it behind the rest once it is on the page.</p>
        </Sheet>
      )}

      {sheet === 'grid' && (
        <Sheet title="Add a challenge" onClose={() => setSheet(null)}>
          <p className="muted">Write on it in Edit; after Done, a tap marks a tile, a marble or a step.</p>
          <h3 className="sheet-sub">Tiles and bingo</h3>
          <div className="menu-list is-two">
            {GRID_PRESETS.map((g) => (
              <button
                key={g.id}
                className="btn"
                onClick={() => {
                  addEl(newGrid(pageRef.current, g.id));
                  setSheet(null);
                }}
              >
                {g.name}
              </button>
            ))}
          </div>
          <h3 className="sheet-sub">Other shapes</h3>
          <div className="menu-list is-two">
            {CHALLENGE_PRESETS.map((c) => (
              <button
                key={c.id}
                className="btn btn-stack"
                onClick={() => {
                  addEl(newChallenge(pageRef.current, c.id));
                  setSheet(null);
                }}
              >
                {c.name}
                <small>{c.hint}</small>
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {sharing && (
        <ShareSheet
          target={{ scope: 'page', itemId: page.id, title: page.title || 'this page', isTemplate: page.isTemplate, trackerIds: pageTrackerIds(page) }}
          onClose={() => setSharing(false)}
        />
      )}

      {sheet === 'delete' && (
        <Sheet
          title={isCover ? 'Go back to the standard cover?' : `Delete ${page.title || 'this page'}?`}
          onClose={() => setSheet(null)}
          footer={
            <>
              <button className="btn btn-quiet" onClick={() => setSheet(null)}>
                Keep it
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  deletePage(page.id);
                  navigate(backTo);
                }}
              >
                {isCover ? 'Remove my design' : `Delete ${page.isTemplate ? 'template' : 'page'}`}
              </button>
            </>
          }
        >
          {isCover ? (
            <p>This removes your design for the {coverName.toLowerCase()} for good. The book shows its standard cover again, and you can design a new one any time.</p>
          ) : (
            <p>This removes the {page.isTemplate ? 'template' : 'page'} and its layout for good. Trackers shown on it keep all their history.</p>
          )}
        </Sheet>
      )}
    </div>
  );
}

export function PageScreen() {
  const { id } = useParams();
  const stored = useStore((s) => s.pages.find((p) => p.id === id));
  if (!stored) {
    return (
      <EmptyState emoji="🔍" title="This page is gone">
        <Link className="btn btn-primary" to="/journal">
          Back to journal
        </Link>
      </EmptyState>
    );
  }
  // keyed so moving to another page starts with a fresh editor
  return <PageEditor key={stored.id} stored={stored} />;
}
