// Where the tiles of a challenge sit when they are not in plain rows: along a
// winding path, or as the segments of a picture (marbles in a jar, bands of a
// thermometer, stops on a mountain trail, leaves on a tree, little hearts in
// a big one). Pure geometry, unit tested; PageParts draws it.

/** A segment's box in picture units, with an optional turn (degrees). */
export interface Spot {
  x: number;
  y: number;
  w: number;
  h: number;
  rot?: number;
}

export type Picture = 'jar' | 'thermo' | 'trail' | 'tree' | 'heart';

/** Size of each picture's drawing, in its own units. */
export const PICTURE_SIZE: Record<Picture, { w: number; h: number }> = {
  jar: { w: 300, h: 380 },
  thermo: { w: 260, h: 480 },
  trail: { w: 480, h: 360 },
  tree: { w: 360, h: 400 },
  heart: { w: 400, h: 370 },
};

export const isPicture = (layout: string | undefined): layout is Picture => layout !== undefined && layout in PICTURE_SIZE;

// ----- path: tiles in rows that run left to right, then right to left, like a board game

export interface PathCell {
  row: number;
  col: number;
  /** Where the path goes next from this tile. */
  next: 'right' | 'left' | 'down' | 'end';
}

export function pathCells(n: number, cols: number): PathCell[] {
  const c = Math.max(1, Math.floor(cols));
  return Array.from({ length: Math.max(0, n) }, (_, i) => {
    const row = Math.floor(i / c);
    const k = i % c;
    const forward = row % 2 === 0;
    const col = forward ? k : c - 1 - k;
    const next = i === n - 1 ? 'end' : k === c - 1 ? 'down' : forward ? 'right' : 'left';
    return { row, col, next };
  });
}

// ----- jar: marbles packed in rows from the bottom

/** Inside of the jar, in picture units. */
export const JAR_INSIDE = { left: 48, right: 252, top: 138, bottom: 350 };

export function jarSpots(n: number): Spot[] {
  const { left, right, top, bottom } = JAR_INSIDE;
  const width = right - left;
  const height = bottom - top;
  const rowsFor = (d: number) => {
    const per = Math.max(1, Math.floor(width / d));
    const rows = Math.floor((height - d) / (d * 0.87)) + 1;
    // odd rows sit in the gaps and hold one marble fewer
    let room = 0;
    for (let r = 0; r < rows; r++) room += r % 2 === 0 || per === 1 ? per : per - 1;
    return { per, room };
  };
  let d = 64;
  while (d > 6 && rowsFor(d).room < n) d -= 0.5;
  const { per } = rowsFor(d);
  const spots: Spot[] = [];
  for (let r = 0; spots.length < n; r++) {
    const count = r % 2 === 0 || per === 1 ? per : per - 1;
    const y = bottom - d - r * d * 0.87;
    const x0 = left + (width - count * d) / 2;
    for (let j = 0; j < count && spots.length < n; j++) spots.push({ x: x0 + j * d, y, w: d, h: d });
  }
  return spots;
}

// ----- thermometer: bands stacked in the tube, bottom first

export const THERMO_TUBE = { left: 70, right: 130, top: 30, bottom: 380 };

export function thermoSpots(n: number): Spot[] {
  const { left, right, top, bottom } = THERMO_TUBE;
  const h = (bottom - top) / Math.max(1, n);
  return Array.from({ length: Math.max(0, n) }, (_, i) => ({ x: left, y: bottom - (i + 1) * h, w: right - left, h }));
}

// ----- mountain trail: stops spread evenly along a zigzag path to the summit

export const TRAIL_POINTS: readonly [number, number][] = [
  [50, 322], [396, 298], [128, 238], [330, 186], [190, 134], [262, 88], [240, 46],
];

export function trailSpots(n: number): Spot[] {
  const pts = TRAIL_POINTS;
  const lengths = pts.slice(1).map(([x, y], i) => Math.hypot(x - pts[i][0], y - pts[i][1]));
  const total = lengths.reduce((a, b) => a + b, 0);
  const centres = Array.from({ length: Math.max(0, n) }, (_, i) => {
    // the last stop is the summit; the first is a step in from the start
    let at = n === 1 ? total : (total * (i + 0.6)) / (n - 0.4);
    at = Math.min(total, at);
    let seg = 0;
    while (seg < lengths.length - 1 && at > lengths[seg]) at -= lengths[seg++];
    const t = lengths[seg] ? at / lengths[seg] : 0;
    return { x: pts[seg][0] + (pts[seg + 1][0] - pts[seg][0]) * t, y: pts[seg][1] + (pts[seg + 1][1] - pts[seg][1]) * t };
  });
  // stops on either side of a bend come close to each other: keep them from touching
  let nearest = Infinity;
  for (let i = 0; i < centres.length; i++)
    for (let j = i + 1; j < centres.length; j++) nearest = Math.min(nearest, Math.hypot(centres[i].x - centres[j].x, centres[i].y - centres[j].y));
  const d = Math.max(6, Math.min(40, nearest * 0.94));
  return centres.map((c) => ({ x: c.x - d / 2, y: c.y - d / 2, w: d, h: d }));
}

// ----- tree: leaves spread over the crown like seeds in a sunflower

export const TREE_CROWN = { cx: 180, cy: 150, rx: 150, ry: 124 };
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

export function treeSpots(n: number): Spot[] {
  const { cx, cy, rx, ry } = TREE_CROWN;
  const d = Math.max(10, Math.min(64, Math.sqrt((Math.PI * rx * ry * 0.74) / Math.max(1, n)) * 1.02));
  const reach = 1 - d / (rx + ry);
  return Array.from({ length: Math.max(0, n) }, (_, i) => {
    const r = Math.sqrt((i + 0.5) / n) * reach;
    const a = i * GOLDEN;
    const x = cx + Math.cos(a) * rx * r;
    const y = cy + Math.sin(a) * ry * r;
    return { x: x - d / 2, y: y - d / 2, w: d, h: d, rot: Math.round((a * 180) / Math.PI + 90) % 360 };
  });
}

// ----- big heart: little hearts on a grid, kept where they fall inside a heart

/** Is the point inside the heart curve? x, y in about -1.2…1.2, y pointing up. */
const inHeart = (x: number, y: number) => {
  const a = x * x + y * y - 1;
  return a * a * a - x * x * y * y * y <= 0;
};

export function heartSpots(n: number): Spot[] {
  const { w, h } = PICTURE_SIZE.heart;
  const sx = w / 2 / 1.22; // curve units to picture units
  const sy = h / 2.3;
  const cyTop = 1.26; // the curve spans y = -1 … 1.25
  const pointsFor = (g: number) => {
    const pts: { x: number; y: number }[] = [];
    let row = 0;
    for (let y = cyTop - g * 0.5; y > -1.05; y -= g * 0.9, row++) {
      const shift = row % 2 === 0 ? 0.5 : 0;
      for (let k = 0; k * g < 1.25; k++) {
        const x = (k + shift) * g;
        // keep the whole little heart inside, not just its middle
        if (!inHeart(x + g * 0.34, y) || !inHeart(x, y + g * 0.3) || !inHeart(x, y - g * 0.34)) continue;
        pts.push({ x, y });
        if (x > 0) pts.push({ x: -x, y });
      }
    }
    return pts;
  };
  let g = 1.2;
  let pts = pointsFor(g);
  while (pts.length < n && g > 0.02) {
    g *= 0.985;
    pts = pointsFor(g);
  }
  // too many: drop the ones nearest the bottom tip, a pair at a time
  pts.sort((a, b) => b.y - a.y || Math.abs(a.x) - Math.abs(b.x) || a.x - b.x);
  const kept = pts.slice(0, n).sort((a, b) => b.y - a.y || a.x - b.x);
  const centres = kept.map((p) => ({ x: w / 2 + p.x * sx, y: (cyTop - p.y) * sy + 6 }));
  // as big as the grid allows, but never past the edge of the picture
  const room = Math.min(...centres.map((c) => 2 * Math.min(c.x, w - c.x, c.y, h - c.y)));
  const d = Math.min(g * sx * 1.04, room);
  return centres.map((c) => ({ x: c.x - d / 2, y: c.y - d / 2, w: d, h: d }));
}

export function pictureSpots(layout: Picture, n: number): Spot[] {
  switch (layout) {
    case 'jar':
      return jarSpots(n);
    case 'thermo':
      return thermoSpots(n);
    case 'trail':
      return trailSpots(n);
    case 'tree':
      return treeSpots(n);
    case 'heart':
      return heartSpots(n);
  }
}
