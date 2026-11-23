import { arrowPaths, lineDash, linePath, linePoints } from '../domain/line';
import type { LineElement, ShapeElement, ShapeKind } from '../domain/pages';
import { shapeFill, shapePath, shapeWeight } from '../domain/shapes';

// The two drawn parts: a line or arrow, and a shape outline. Both are plain
// SVG in page units, so they scale with the sheet like everything else.

/**
 * A hand-drawn line. The SVG is a dot at the corner of the line's box that
 * lets its drawing show outside it, because a level line's box has no height.
 * The wide see-through stroke underneath is what a finger catches in Edit.
 */
export function LineBody({ el }: { el: LineElement }) {
  const l = linePoints(el, true);
  const d = linePath(l);
  return (
    <svg className="pg-line" width="1" height="1" aria-hidden="true">
      <path className="pg-line-hit" d={d} />
      <path d={d} stroke={el.color} strokeWidth={el.weight} strokeDasharray={lineDash(el.dash, el.weight)} />
      {arrowPaths(l, el.arrow, el.weight).map((head, i) => (
        <path key={i} d={head} stroke={el.color} strokeWidth={el.weight} />
      ))}
    </svg>
  );
}

/** The outline of a shape in a box, for the part itself and for the shape picker. */
export function ShapeOutline({ shape, w, h, color, fill, dashed, weight }: { shape: ShapeKind; w: number; h: number; color: string; fill?: boolean; dashed?: boolean; weight: number }) {
  return (
    <svg className="pg-shape" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path d={shapePath(shape, w, h, weight)} fill={fill ? shapeFill(color) : 'none'} stroke={color} strokeWidth={weight} strokeDasharray={dashed ? `${weight * 3} ${weight * 2.6}` : undefined} />
    </svg>
  );
}

export function ShapeBody({ el }: { el: ShapeElement }) {
  return <ShapeOutline shape={el.shape} w={el.w} h={el.h} color={el.color} fill={el.fill} dashed={el.dashed} weight={shapeWeight(el)} />;
}
