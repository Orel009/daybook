import { isDarkColor, type ShapeElement, type ShapeKind } from './pages';

// The outlines of the shape part, as SVG paths sized to the part's box. The
// outline is drawn in real page units (not stretched from a small drawing), so
// its thickness and its dashes look the same whatever the size of the shape.

export const SHAPE_WEIGHT = 4;
export const shapeWeight = (el: Pick<ShapeElement, 'weight'>): number => el.weight ?? SHAPE_WEIGHT;

const PAPER = [255, 253, 249]; // the cream of the pages

/**
 * The soft tint a shape is filled with. A dark colour is mixed into paper
 * cream, so shapes on top of each other stay clean; a light colour (white, on
 * a dark page) becomes a see-through veil of itself.
 */
export const shapeFill = (hex: string): string => {
  const n = parseInt(hex.slice(1), 16);
  const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  if (!isDarkColor(hex)) return `rgb(${rgb.join(' ')} / 0.22)`;
  return `#${rgb.map((c, i) => Math.round(PAPER[i] + (c - PAPER[i]) * 0.18).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
};

const n1 = (v: number) => String(Math.round(v * 10) / 10);

// ----- cloud: bumps around an oval, worked out once in a box from 0 to 1

interface Bump {
  x: number;
  y: number;
  rx: number;
  ry: number;
}

/** Where each bump of the cloud ends (going round clockwise), and how round it is, in a box from 0 to 1. */
const cloudBumps = (() => {
  const stops = [-162, -118, -68, -22, 24, 68, 112, 156]; // degrees round the oval, uneven like a real cloud
  const at = (deg: number) => ({ x: 1.3 * Math.cos((deg * Math.PI) / 180), y: 0.82 * Math.sin((deg * Math.PI) / 180) });
  const pts = stops.map(at);
  const xs: number[] = [];
  const ys: number[] = [];
  const arcs = pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length];
    const chord = Math.hypot(q.x - p.x, q.y - p.y);
    const r = chord * 0.58;
    // the centre of the bump's circle sits inside the cloud, the bump swells outwards
    const inward = Math.sqrt(r * r - (chord * chord) / 4);
    const cx = (p.x + q.x) / 2 - ((q.y - p.y) / chord) * inward;
    const cy = (p.y + q.y) / 2 + ((q.x - p.x) / chord) * inward;
    const from = Math.atan2(p.y - cy, p.x - cx);
    let to = Math.atan2(q.y - cy, q.x - cx);
    if (to < from) to += 2 * Math.PI;
    for (let k = 0; k <= 16; k++) {
      const t = from + ((to - from) * k) / 16;
      xs.push(cx + r * Math.cos(t));
      ys.push(cy + r * Math.sin(t));
    }
    return { x: q.x, y: q.y, r };
  });
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  const sx = Math.max(...xs) - x0;
  const sy = Math.max(...ys) - y0;
  const start = { x: (pts[0].x - x0) / sx, y: (pts[0].y - y0) / sy };
  const bumps: Bump[] = arcs.map((a) => ({ x: (a.x - x0) / sx, y: (a.y - y0) / sy, rx: a.r / sx, ry: a.r / sy }));
  return { start, bumps };
})();

// ----- heart: one curve per side, in a box from 0 to 1 (start, then six curves of three points each)

const HEART = [
  [50, 26],
  [44, 10], [33, 3], [24, 3],
  [11, 3], [2, 13], [2, 27],
  [2, 50], [24, 70], [50, 97],
  [76, 70], [98, 50], [98, 27],
  [98, 13], [89, 3], [76, 3],
  [67, 3], [56, 10], [50, 26],
].map(([x, y]) => [(x - 2) / 96, (y - 3) / 94]);

/**
 * The outline of a shape in a box `w` by `h`, as an SVG path. The line is
 * `weight` thick and stays inside the box. A circle stays round: it takes the
 * smaller of the two sizes and sits in the middle.
 */
export function shapePath(kind: ShapeKind, w: number, h: number, weight = SHAPE_WEIGHT): string {
  const inset = weight / 2;
  const W = Math.max(1, w - weight);
  const H = Math.max(1, h - weight);
  const X = (u: number) => n1(inset + u * W);
  const Y = (v: number) => n1(inset + v * H);
  const oval = (rx: number, ry: number) => {
    const cx = w / 2;
    const cy = h / 2;
    return `M${n1(cx - rx)} ${n1(cy)} A${n1(rx)} ${n1(ry)} 0 1 1 ${n1(cx + rx)} ${n1(cy)} A${n1(rx)} ${n1(ry)} 0 1 1 ${n1(cx - rx)} ${n1(cy)} Z`;
  };
  switch (kind) {
    case 'circle':
      return oval(Math.min(W, H) / 2, Math.min(W, H) / 2);
    case 'ellipse':
      return oval(W / 2, H / 2);
    case 'rounded': {
      const r = n1(Math.min(W, H) * 0.18);
      const c = (x: number, y: number) => `A${r} ${r} 0 0 1 ${n1(x)} ${n1(y)}`;
      const k = Math.min(W, H) * 0.18;
      const x0 = inset;
      const y0 = inset;
      const x1 = inset + W;
      const y1 = inset + H;
      return `M${n1(x0 + k)} ${n1(y0)} L${n1(x1 - k)} ${n1(y0)} ${c(x1, y0 + k)} L${n1(x1)} ${n1(y1 - k)} ${c(x1 - k, y1)} L${n1(x0 + k)} ${n1(y1)} ${c(x0, y1 - k)} L${n1(x0)} ${n1(y0 + k)} ${c(x0 + k, y0)} Z`;
    }
    case 'cloud':
      return `M${X(cloudBumps.start.x)} ${Y(cloudBumps.start.y)} ${cloudBumps.bumps.map((b) => `A${n1(b.rx * W)} ${n1(b.ry * H)} 0 0 1 ${X(b.x)} ${Y(b.y)}`).join(' ')} Z`;
    case 'heart': {
      const p = HEART.map(([x, y]) => `${X(x)} ${Y(y)}`);
      const curves = Array.from({ length: 6 }, (_, i) => `C${p[1 + i * 3]} ${p[2 + i * 3]} ${p[3 + i * 3]}`);
      return `M${p[0]} ${curves.join(' ')} Z`;
    }
    case 'speech': {
      // a rounded bubble with a tail at the bottom left
      const tail = Math.min(H * 0.22, W * 0.3);
      const x0 = inset;
      const y0 = inset;
      const x1 = inset + W;
      const yb = inset + H - tail;
      const k = Math.min(W, H - tail) * 0.22;
      const r = n1(k);
      const c = (x: number, y: number) => `A${r} ${r} 0 0 1 ${n1(x)} ${n1(y)}`;
      return (
        `M${n1(x0 + k)} ${n1(y0)} L${n1(x1 - k)} ${n1(y0)} ${c(x1, y0 + k)} L${n1(x1)} ${n1(yb - k)} ${c(x1 - k, yb)} ` +
        `L${n1(x0 + W * 0.44)} ${n1(yb)} L${n1(x0 + W * 0.18)} ${n1(inset + H)} L${n1(x0 + W * 0.24)} ${n1(yb)} ` +
        `L${n1(x0 + k)} ${n1(yb)} ${c(x0, yb - k)} L${n1(x0)} ${n1(y0 + k)} ${c(x0 + k, y0)} Z`
      );
    }
  }
}

/** A circle shape's middle and radius on the page (to the outside of its line). */
export const circleOf = (el: Pick<ShapeElement, 'x' | 'y' | 'w' | 'h'>): { cx: number; cy: number; r: number } => ({
  cx: el.x + el.w / 2,
  cy: el.y + el.h / 2,
  r: Math.min(el.w, el.h) / 2,
});
