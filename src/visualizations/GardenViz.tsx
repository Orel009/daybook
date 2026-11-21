import type { ReactNode } from 'react';
import { streakRuns } from '../domain/stats';
import { TAPE_COLORS } from '../domain/types';
import { registerVisualization, type VisualizationProps } from './registry';

// The garden rule:
//   - the plant grows with the current streak, a little every completed day
//   - a missed scheduled day starts again from a seed (rest days never do)
//   - every plant that reached full size stays on the shelf for good
//   - decorations unlock with the total number of completed days
// All of it is derived from the entries, so nothing here can be lost by
// switching to another look and back.

const PLANTS = [
  { id: 'flower', name: 'Flower' },
  { id: 'tree', name: 'Tree' },
  { id: 'cactus', name: 'Cactus' },
] as const;
type PlantId = (typeof PLANTS)[number]['id'];

const LENGTHS = [7, 14, 21, 30];

const DECORATIONS = [
  { at: 5, name: 'a mushroom' },
  { at: 15, name: 'a butterfly' },
  { at: 30, name: 'the sun' },
];

const STEM = '#5e9e71';
const LEAF = '#8fcb9b';
const INK = 'var(--ink)';
const BASE_Y = 150;

function stageName(count: number, g: number): string {
  if (count <= 0) return 'Seed';
  if (g >= 1) return 'Fully grown';
  if (g >= 0.7) return 'Budding';
  if (g >= 0.45) return 'Growing';
  if (g >= 0.2) return 'Seedling';
  return 'Sprout';
}

function Flower({ g, color }: { g: number; color: string }) {
  const h = 18 + 104 * g;
  const top = BASE_Y - h;
  const pairs = Math.min(3, 1 + Math.floor(g * 3));
  const s = 8 + 13 * g;
  return (
    <g>
      <path d={`M100 ${BASE_Y} C 95 ${BASE_Y - h * 0.4}, 105 ${BASE_Y - h * 0.7}, 100 ${top}`} fill="none" stroke={STEM} strokeWidth={5} strokeLinecap="round" />
      {Array.from({ length: pairs }, (_, i) => {
        const y = BASE_Y - h * (0.22 + 0.22 * i);
        return (
          <g key={i} stroke={INK} strokeWidth={1.3} fill={LEAF}>
            <ellipse cx={100 - s} cy={y} rx={s} ry={s * 0.45} transform={`rotate(28 100 ${y})`} />
            <ellipse cx={100 + s} cy={y} rx={s} ry={s * 0.45} transform={`rotate(-28 100 ${y})`} />
          </g>
        );
      })}
      {g >= 1 ? (
        <g stroke={INK} strokeWidth={1.3}>
          {Array.from({ length: 8 }, (_, i) => (
            <ellipse key={i} cx={100} cy={top - 15} rx={7} ry={13} fill={color} transform={`rotate(${i * 45} 100 ${top})`} />
          ))}
          <circle cx={100} cy={top} r={8.5} fill="#f6db7d" />
        </g>
      ) : g >= 0.7 ? (
        <ellipse cx={100} cy={top - 4} rx={7} ry={10} fill={color} stroke={INK} strokeWidth={1.3} />
      ) : null}
    </g>
  );
}

function Tree({ g, color }: { g: number; color: string }) {
  const h = 16 + 66 * g;
  const top = BASE_Y - h;
  const w = 4 + 8 * g;
  const r = 9 + 27 * g;
  return (
    <g stroke={INK} strokeWidth={1.3}>
      <rect x={100 - w / 2} y={top} width={w} height={h} rx={w / 3} fill="#b98b6b" />
      {g >= 0.45 && (
        <>
          <circle cx={100 - r * 0.7} cy={top + r * 0.1} r={r * 0.72} fill={LEAF} />
          <circle cx={100 + r * 0.7} cy={top + r * 0.1} r={r * 0.72} fill={LEAF} />
        </>
      )}
      <circle cx={100} cy={top - r * 0.45} r={r} fill={LEAF} />
      {g >= 1 &&
        [[-20, -4], [14, -26], [22, 4], [-6, -40], [-2, -8]].map(([dx, dy], i) => (
          <circle key={i} cx={100 + dx} cy={top + dy} r={5.5} fill={color} />
        ))}
    </g>
  );
}

function Cactus({ g, color }: { g: number; color: string }) {
  const h = 20 + 78 * g;
  const top = BASE_Y - h;
  const w = 16 + 14 * g;
  const arm = 9 + 5 * g;
  return (
    <g stroke={INK} strokeWidth={1.3} fill={LEAF}>
      {g >= 0.45 && (
        <path d={`M${100 - w / 2} ${BASE_Y - h * 0.35} h${-arm * 1.6} a${arm / 2} ${arm / 2} 0 0 1 ${-arm / 2} ${-arm / 2} v${-h * 0.28} a${arm / 2} ${arm / 2} 0 0 1 ${arm} 0 v${h * 0.28 - arm / 2} h${arm * 1.1} z`} />
      )}
      {g >= 0.7 && (
        <path d={`M${100 + w / 2} ${BASE_Y - h * 0.5} h${arm * 1.6} a${arm / 2} ${arm / 2} 0 0 0 ${arm / 2} ${-arm / 2} v${-h * 0.22} a${arm / 2} ${arm / 2} 0 0 0 ${-arm} 0 v${h * 0.22 - arm / 2} h${-arm * 1.1} z`} />
      )}
      <rect x={100 - w / 2} y={top} width={w} height={h + 2} rx={w / 2} />
      <path d={`M100 ${top + 10} V${BASE_Y - 6}`} stroke={STEM} strokeWidth={2} strokeDasharray="2 7" strokeLinecap="round" fill="none" />
      {g >= 1 && (
        <g>
          {Array.from({ length: 6 }, (_, i) => (
            <ellipse key={i} cx={100} cy={top - 10} rx={5} ry={9} fill={color} transform={`rotate(${i * 60} 100 ${top - 2})`} />
          ))}
          <circle cx={100} cy={top - 2} r={5} fill="#f6db7d" />
        </g>
      )}
    </g>
  );
}

const PLANT_ART: Record<PlantId, (p: { g: number; color: string }) => ReactNode> = {
  flower: Flower,
  tree: Tree,
  cactus: Cactus,
};

function Scene({ plant, count, g, color, doneDays }: { plant: PlantId; count: number; g: number; color: string; doneDays: number }) {
  const Art = PLANT_ART[plant];
  return (
    <svg className="garden-svg" viewBox="0 0 200 200" aria-hidden="true">
      {doneDays >= 30 && (
        <g stroke={INK} strokeWidth={1.3}>
          <circle cx={30} cy={30} r={13} fill="#f6db7d" />
          {Array.from({ length: 8 }, (_, i) => (
            <path key={i} d="M30 10 V5" strokeLinecap="round" transform={`rotate(${i * 45} 30 30)`} />
          ))}
        </g>
      )}
      {doneDays >= 15 && (
        <g stroke={INK} strokeWidth={1.2} transform="translate(174 50) rotate(14)">
          <ellipse cx={-7} cy={-3} rx={7} ry={9} fill="#c9b6f0" />
          <ellipse cx={7} cy={-3} rx={7} ry={9} fill="#c9b6f0" />
          <path d="M0 -10 V8" strokeLinecap="round" />
        </g>
      )}
      {/* the plant grows up out of the pot; keyed so each new size eases in */}
      {count > 0 ? (
        <g key={count} className="garden-plant">
          <Art g={g} color={color} />
        </g>
      ) : null}
      <g stroke={INK} strokeWidth={1.5}>
        <path d="M66 156 H134 L127 190 H73 Z" fill="#ecc9a6" />
        <rect x={60} y={146} width={80} height={13} rx={4} fill="#ecc9a6" />
        <path d="M68 150 H132" stroke="#8a6248" strokeWidth={3} strokeLinecap="round" />
      </g>
      {count <= 0 && <ellipse cx={100} cy={143} rx={7} ry={4.5} fill="#8a6248" stroke={INK} strokeWidth={1.3} />}
      {doneDays >= 5 && (
        <g stroke={INK} strokeWidth={1.3}>
          <rect x={150} y={178} width={7} height={12} rx={3} fill="#fffdf9" />
          <path d="M141 180 a12.5 11 0 0 1 25 0 z" fill="#f59c8e" />
        </g>
      )}
      <path d="M22 190.5 H178" stroke={INK} strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

function GardenViz({ tracker, days, today, weekStartsOn, config, onConfigChange, compact, editing }: VisualizationProps) {
  const plant = (PLANTS.find((p) => p.id === config.plant) ?? PLANTS[0]).id;
  const full = LENGTHS.includes(config.daysToFull as number) ? (config.daysToFull as number) : 14;
  const color = TAPE_COLORS[tracker.color] ?? TAPE_COLORS.rose;

  const { runs, unit } = streakRuns(tracker, days, today, weekStartsOn);
  const count = runs[runs.length - 1];
  const g = Math.min(1, count / full);
  const grown = runs.filter((r) => r >= full).length;
  const hadEarlier = runs.length > 1;
  const doneDays = [...days.values()].filter((d) => d.done).length;
  const nextDecoration = DECORATIONS.find((d) => doneDays < d.at);
  const units = (n: number) => `${n} ${unit}${n === 1 ? '' : 's'}`;
  const stage = stageName(count, g);

  let message: string;
  if (count === 0) {
    message = hadEarlier
      ? `A ${unit} was missed, so a new seed is planted. The next completed ${unit} starts it growing again.`
      : `Complete the first ${unit} and the seed sprouts.`;
  } else if (g >= 1) {
    message = `${units(count)} in a row. This one is fully grown and stays on your shelf.`;
  } else {
    message = `${units(count)} in a row. Fully grown at ${full}.`;
  }

  return (
    <div className={`garden ${compact ? 'is-compact' : ''}`}>
      <div className="garden-stage" role="img" aria-label={`${stage}. ${message}`}>
        <Scene plant={plant} count={count} g={g} color={color} doneDays={doneDays} />
      </div>
      <div className="garden-info">
        <h3>{stage}</h3>
        <p className="muted">{message}</p>
        <div className="garden-bar" aria-hidden="true">
          <i style={{ width: `${g * 100}%`, background: color }} />
        </div>

        {!compact && (
          <>
            <div className="garden-shelf">
              <strong>Shelf</strong>
              {grown === 0 ? (
                <span className="muted">Fully grown plants are kept here, even after a missed {unit}.</span>
              ) : (
                <span className="shelf-row" role="img" aria-label={`${grown} fully grown`}>
                  {Array.from({ length: Math.min(grown, 10) }, (_, i) => (
                    <svg key={i} viewBox="60 20 80 175" className="shelf-plant" aria-hidden="true">
                      {PLANT_ART[plant]({ g: 1, color })}
                      <path d="M80 156 H120 L116 190 H84 Z" fill="#ecc9a6" stroke={INK} strokeWidth={2} />
                    </svg>
                  ))}
                  {grown > 10 && <span className="muted">and {grown - 10} more</span>}
                </span>
              )}
            </div>
            <p className="muted viz-caption">
              {nextDecoration
                ? `${doneDays} completed so far. At ${nextDecoration.at}, ${nextDecoration.name} joins the garden.`
                : `${doneDays} completed so far. Every decoration is unlocked.`}
            </p>
          </>
        )}
      </div>

      {editing && onConfigChange && (
        <div className="viz-options garden-options">
          <div className="seg seg-small" role="radiogroup" aria-label="Plant">
            {PLANTS.map((p) => (
              <button key={p.id} role="radio" aria-checked={plant === p.id} className={plant === p.id ? 'is-on' : ''} onClick={() => onConfigChange({ plant: p.id })}>
                {p.name}
              </button>
            ))}
          </div>
          <div className="inline">
            <span className="muted option-label">Fully grown after</span>
            <div className="seg seg-small" role="radiogroup" aria-label={`${unit}s until fully grown`}>
              {LENGTHS.map((n) => (
                <button key={n} role="radio" aria-checked={full === n} className={full === n ? 'is-on' : ''} onClick={() => onConfigChange({ daysToFull: n })} aria-label={`Fully grown after ${n} ${unit}s`}>
                  {n} {unit}s
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

registerVisualization({
  id: 'garden',
  name: 'Garden',
  icon: '🌱',
  description: 'A plant that grows with every day in a row, and starts from a seed after a miss.',
  supports: 'all',
  defaultConfig: { plant: 'flower', daysToFull: 14 },
  Component: GardenViz,
});
