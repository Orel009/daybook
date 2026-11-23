import type { LineElement } from './pages';

// The geometry of a line part: where its points are, the curve through them,
// the box around it, arrowheads, and what dragging a handle does. No drawing
// here, only numbers, so it can be tested on its own.
//
// A line is stored as a box (x, y, w, h) with its two ends measured from the
// box's corner. A curved line also stores the point it passes through halfway
// (`mx`, `my`): that is the middle handle in the editor.

export interface Pt {
  x: number;
  y: number;
}

/** A line by its points, all in the same coordinates (page units unless said otherwise). */
export interface LinePoints {
  a: Pt;
  b: Pt;
  /** Curved lines: the point the curve passes through halfway. */
  mid?: Pt;
}

export type LineGeometry = Pick<LineElement, 'x' | 'y' | 'w' | 'h' | 'ax' | 'ay' | 'bx' | 'by' | 'mx' | 'my'>;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const dist = (p: Pt, q: Pt) => Math.hypot(q.x - p.x, q.y - p.y);
const unit = (from: Pt, to: Pt): Pt => {
  const d = dist(from, to);
  return d ? { x: (to.x - from.x) / d, y: (to.y - from.y) / d } : { x: 1, y: 0 };
};

/** The line's points on the page, or (`local`) measured from its own box, as the drawing needs them. */
export const linePoints = (el: LineGeometry, local = false): LinePoints => {
  const ox = local ? 0 : el.x;
  const oy = local ? 0 : el.y;
  return {
    a: { x: ox + el.ax, y: oy + el.ay },
    b: { x: ox + el.bx, y: oy + el.by },
    mid: el.mx === undefined || el.my === undefined ? undefined : { x: ox + el.mx, y: oy + el.my },
  };
};

export const isCurved = (el: Pick<LineElement, 'mx' | 'my'>): boolean => el.mx !== undefined && el.my !== undefined;

/**
 * The control point of a curved line. The curve from `a` to `b` bent towards
 * this point passes exactly through `mid` halfway along.
 */
export const controlPoint = ({ a, b, mid }: LinePoints): Pt | undefined =>
  mid && { x: 2 * mid.x - (a.x + b.x) / 2, y: 2 * mid.y - (a.y + b.y) / 2 };

/** The point a fraction `t` (0 to 1) of the way along the line. */
export const pointAt = (l: LinePoints, t: number): Pt => {
  const c = controlPoint(l);
  const u = 1 - t;
  if (!c) return { x: u * l.a.x + t * l.b.x, y: u * l.a.y + t * l.b.y };
  return { x: u * u * l.a.x + 2 * u * t * c.x + t * t * l.b.x, y: u * u * l.a.y + 2 * u * t * c.y + t * t * l.b.y };
};

/** Where the middle handle sits: on the line, halfway. */
export const middle = (l: LinePoints): Pt => l.mid ?? pointAt(l, 0.5);

export const lineLength = (l: LinePoints): number => {
  if (!l.mid) return dist(l.a, l.b);
  let total = 0;
  let prev = l.a;
  for (let i = 1; i <= 32; i++) {
    const p = pointAt(l, i / 32);
    total += dist(prev, p);
    prev = p;
  }
  return total;
};

/** The box around the line: its two ends and, for a curve, the furthest it swings out. */
export const lineBounds = (l: LinePoints): { x: number; y: number; w: number; h: number } => {
  const xs = [l.a.x, l.b.x];
  const ys = [l.a.y, l.b.y];
  const c = controlPoint(l);
  if (c) {
    // a curve turns back where its speed along an axis is zero
    const turn = (a: number, k: number, b: number) => {
      const d = a - 2 * k + b;
      return d === 0 ? -1 : (a - k) / d;
    };
    const tx = turn(l.a.x, c.x, l.b.x);
    const ty = turn(l.a.y, c.y, l.b.y);
    if (tx > 0 && tx < 1) xs.push(pointAt(l, tx).x);
    if (ty > 0 && ty < 1) ys.push(pointAt(l, ty).y);
  }
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
};

/** What is stored for a line through these page points: the box, and the points measured from its corner. Whole numbers. */
export const lineGeometry = (l: LinePoints): LineGeometry => {
  const round = (p: Pt): Pt => ({ x: Math.round(p.x), y: Math.round(p.y) });
  const pts: LinePoints = { a: round(l.a), b: round(l.b), mid: l.mid && round(l.mid) };
  const box = lineBounds(pts);
  const x = Math.floor(box.x);
  const y = Math.floor(box.y);
  return {
    x,
    y,
    w: Math.ceil(box.x + box.w) - x,
    h: Math.ceil(box.y + box.h) - y,
    ax: pts.a.x - x,
    ay: pts.a.y - y,
    bx: pts.b.x - x,
    by: pts.b.y - y,
    mx: pts.mid ? pts.mid.x - x : undefined,
    my: pts.mid ? pts.mid.y - y : undefined,
  };
};

/** Where `p` is, seen from the straight line a to b: how far along it from its middle, and how far to its side. */
const fromStraight = (a: Pt, b: Pt, p: Pt) => {
  const u = unit(a, b);
  const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const d = { x: p.x - m.x, y: p.y - m.y };
  return { along: d.x * u.x + d.y * u.y, across: -d.x * u.y + d.y * u.x, len: dist(a, b) };
};
/** The reverse: the point that far along and to the side of the straight line a to b. */
const toStraight = (a: Pt, b: Pt, along: number, across: number): Pt => {
  const u = unit(a, b);
  return { x: (a.x + b.x) / 2 + u.x * along - u.y * across, y: (a.y + b.y) / 2 + u.y * along + u.x * across };
};

/**
 * A line from `a` to `b`. `bend` curves it: how far the middle swings out, as
 * a fraction of the length. Positive swings to the right of the direction of
 * travel (downwards for a line drawn left to right), negative to the left.
 */
export const lineFrom = (a: Pt, b: Pt, bend = 0): LineGeometry =>
  lineGeometry({ a, b, mid: bend ? toStraight(a, b, 0, bend * dist(a, b)) : undefined });

/** Closer to straight than this (page units), a bent line snaps back to straight. */
export const STRAIGHT_SNAP = 8;

/**
 * A handle dragged to `to` (page units): an end moves there; the middle bends
 * the line through that point. A curve keeps its bend when an end moves,
 * turned and scaled with the line. The middle handle stays between the ends,
 * and let go next to the straight line, the line is straight again.
 */
export function moveLinePoint(el: LineGeometry, which: 'a' | 'b' | 'mid', to: Pt): LineGeometry {
  const l = linePoints(el);
  if (which === 'mid') {
    const at = fromStraight(l.a, l.b, to);
    if (at.len === 0 || Math.abs(at.across) < STRAIGHT_SNAP) return lineGeometry({ a: l.a, b: l.b });
    return lineGeometry({ a: l.a, b: l.b, mid: toStraight(l.a, l.b, clamp(at.along, -0.4 * at.len, 0.4 * at.len), at.across) });
  }
  const a = which === 'a' ? to : l.a;
  const b = which === 'b' ? to : l.b;
  if (!l.mid) return lineGeometry({ a, b });
  const was = fromStraight(l.a, l.b, l.mid);
  const scale = was.len ? dist(a, b) / was.len : 1;
  return lineGeometry({ a, b, mid: toStraight(a, b, was.along * scale, was.across * scale) });
}

/** Straight to curved (a gentle bend to the left of the direction of travel) and back. */
export const bendLine = (el: LineGeometry, bend = -0.18): LineGeometry => {
  const { a, b } = linePoints(el);
  return lineFrom(a, b, bend);
};
export const straightenLine = (el: LineGeometry): LineGeometry => {
  const { a, b } = linePoints(el);
  return lineGeometry({ a, b });
};
/** The same line drawn the other way round, so an arrowhead changes ends. */
export const flipLine = (el: LineGeometry): LineGeometry => {
  const { a, b, mid } = linePoints(el);
  return lineGeometry({ a: b, b: a, mid });
};

/** Which way the line is heading as it arrives at an end (a unit vector pointing out of the line). */
export const headingAt = (l: LinePoints, end: 'a' | 'b'): Pt => {
  const c = controlPoint(l);
  const tip = end === 'a' ? l.a : l.b;
  const other = end === 'a' ? l.b : l.a;
  // a curve arrives from its control point; if that sits on the end itself, fall back to the other end
  return unit(c && dist(c, tip) > 0.5 ? c : other, tip);
};

/** How long the two strokes of an arrowhead are for a line this thick. */
export const arrowSize = (weight: number): number => clamp(weight * 3 + 10, 16, 46);

/** The two back corners of an open arrowhead whose tip is at `tip`, pointing along `heading`. */
export const arrowWings = (tip: Pt, heading: Pt, size: number, spread = 0.5): [Pt, Pt] => {
  const wing = (turn: number): Pt => {
    const cos = Math.cos(turn);
    const sin = Math.sin(turn);
    return { x: tip.x - (heading.x * cos - heading.y * sin) * size, y: tip.y - (heading.x * sin + heading.y * cos) * size };
  };
  return [wing(spread), wing(-spread)];
};

const n1 = (v: number) => String(Math.round(v * 10) / 10);
const xy = (p: Pt) => `${n1(p.x)} ${n1(p.y)}`;

/**
 * The line as an SVG path. A straight line gets a very slight S-shaped wobble,
 * as if drawn by hand; it still starts and ends exactly at its ends. A curve
 * is drawn as it is.
 */
export const linePath = (l: LinePoints): string => {
  const c = controlPoint(l);
  if (c) return `M${xy(l.a)} Q${xy(c)} ${xy(l.b)}`;
  const len = dist(l.a, l.b);
  const wobble = Math.min(3, len * 0.012);
  return `M${xy(l.a)} C${xy(toStraight(l.a, l.b, -len / 6, wobble))} ${xy(toStraight(l.a, l.b, len / 6, -wobble * 0.6))} ${xy(l.b)}`;
};

/** The arrowheads of a line, each as an SVG path (none, one at the second end, or one at both). */
export const arrowPaths = (l: LinePoints, arrow: LineElement['arrow'], weight: number): string[] => {
  const head = (end: 'a' | 'b') => {
    const tip = end === 'a' ? l.a : l.b;
    const [p, q] = arrowWings(tip, headingAt(l, end), arrowSize(weight));
    return `M${xy(p)} L${xy(tip)} L${xy(q)}`;
  };
  return arrow === 'both' ? [head('a'), head('b')] : arrow === 'end' ? [head('b')] : [];
};

/** The dash pattern for a line this thick (drawn with round ends), or none for a solid line. */
export const lineDash = (dash: LineElement['dash'], weight: number): string | undefined =>
  dash === 'dashed' ? `${n1(weight * 3)} ${n1(weight * 2.6)}` : dash === 'dotted' ? `0.1 ${n1(weight * 2.2)}` : undefined;
