import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useStore } from '../data/store';
import { useToday } from '../data/hooks';
import { draftFromPreset, EMOJI_CHOICES, PRESETS, type TrackerDraft } from '../data/defaults';
import { defaultValueColor } from '../domain/colors';
import { WEEKDAY_SHORT } from '../domain/dates';
import { buildDayMap, type DayMap } from '../domain/stats';
import { TAPE_COLORS, VALUE_TYPE_LABELS, type Schedule, type TrackerDefinition, type ValueType } from '../domain/types';
import { EmptyState } from '../ui/Layout';
import { DurationInput } from '../ui/ValueInput';
import { configFor, FALLBACK_VISUALIZATION, getVisualization, visualizationsFor } from '../visualizations';

const SCHEDULE_KINDS: { kind: Schedule['kind']; name: string }[] = [
  { kind: 'daily', name: 'Every day' },
  { kind: 'weekdays', name: 'Certain days' },
  { kind: 'perWeek', name: 'Times a week' },
  { kind: 'perMonth', name: 'Times a month' },
  { kind: 'everyN', name: 'Every few days' },
];

const defaultSchedule = (kind: Schedule['kind']): Schedule => {
  switch (kind) {
    case 'weekdays':
      return { kind, days: [1, 3, 5] };
    case 'perWeek':
      return { kind, times: 3 };
    case 'perMonth':
      return { kind, times: 4 };
    case 'everyN':
      return { kind, n: 2 };
    default:
      return { kind: 'daily' };
  }
};

/** A colour swatch that opens the full palette underneath its row. */
function ColorPick({ value, label, onChange }: { value: string; label: string; onChange: (color: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="swatch-btn"
        style={{ background: TAPE_COLORS[value] }}
        aria-label={`Colour for ${label}: ${value}. Change`}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      />
      {open && (
        <div className="color-row is-small colorpick-pop" role="radiogroup" aria-label={`Colour for ${label}`}>
          {Object.entries(TAPE_COLORS).map(([key, hex]) => (
            <button
              type="button"
              key={key}
              role="radio"
              aria-checked={value === key}
              aria-label={key}
              className={value === key ? 'is-on' : ''}
              style={{ background: hex }}
              onClick={() => {
                onChange(key);
                setOpen(false);
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}

interface OptionRow {
  key: number;
  name: string;
  color: string;
}

/** Keyed by tracker and starting idea, so choosing another idea starts the form afresh. */
export function TrackerFormRoute() {
  const { id } = useParams();
  const [params] = useSearchParams();
  return <TrackerForm key={`${id ?? 'new'}-${params.get('preset') ?? ''}`} />;
}

function TrackerForm() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const today = useToday();
  const existing = useStore((s) => (id ? s.trackers.find((t) => t.id === id) : undefined));
  const entries = useStore((s) => s.entries);
  const categories = useStore((s) => s.categories);
  const weekStartsOn = useStore((s) => s.settings.weekStartsOn);
  const { createTracker, updateTracker, addCategory } = useStore.getState();
  const hasEntries = useMemo(() => !!id && entries.some((e) => e.trackerId === id), [entries, id]);

  const [draft, setDraft] = useState<TrackerDraft>(() => {
    if (existing) return { ...existing };
    const preset = params.get('preset');
    return draftFromPreset(preset !== null ? PRESETS[Number(preset)] : undefined);
  });
  // "pick one" options, each with its own colour
  const [options, setOptions] = useState<OptionRow[]>(() =>
    (draft.choices ?? ['', '']).map((name, i) => ({
      key: i,
      name,
      color: draft.valueColors?.[name] ?? defaultValueColor({ valueType: 'choice' }, name, i),
    })),
  );
  // rating colours, kept for both scales so switching 5 <-> 10 loses nothing
  const [ratingColors, setRatingColors] = useState<Record<string, string>>(() =>
    draft.valueType === 'rating' ? { ...(draft.valueColors ?? {}) } : {},
  );
  const [newCategory, setNewCategory] = useState<string | null>(null);
  const [tried, setTried] = useState(false);

  const set = (patch: Partial<TrackerDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const type = draft.valueType;
  const ratingMax = draft.ratingMax ?? 5;
  const hasTarget = type === 'number' || type === 'duration' || type === 'timeRange';
  const s = draft.schedule;

  const cleanOptions = options
    .map((o) => ({ ...o, name: o.name.trim() }))
    .filter((o, i, all) => o.name && all.findIndex((x) => x.name === o.name) === i);
  const ratingColor = (n: number) =>
    ratingColors[String(n)] ?? defaultValueColor({ valueType: 'rating', ratingMax }, String(n), n - 1);

  const valueColors: Record<string, string> | undefined =
    type === 'choice'
      ? Object.fromEntries(cleanOptions.map((o) => [o.name, o.color]))
      : type === 'rating'
        ? Object.fromEntries(Array.from({ length: ratingMax }, (_, i) => [String(i + 1), ratingColor(i + 1)]))
        : undefined;

  const looks = visualizationsFor(type);
  const lookId = looks.some((l) => l.id === draft.visualizationId) ? draft.visualizationId : FALLBACK_VISUALIZATION;
  const look = getVisualization(lookId);
  const lookConfig = configFor(draft.visualizationConfig, lookId);

  // The tracker as it would be saved right now. Drives the live preview.
  const clean: TrackerDraft = {
    ...draft,
    name: draft.name.trim(),
    unit: type === 'number' ? draft.unit?.trim() || undefined : undefined,
    step: type === 'number' && draft.step && draft.step > 0 ? draft.step : undefined,
    ratingMax: type === 'rating' ? ratingMax : undefined,
    choices: type === 'choice' ? cleanOptions.map((o) => o.name) : undefined,
    valueColors,
    target: hasTarget && draft.target && draft.target > 0 ? draft.target : undefined,
    visualizationId: lookId,
  };
  const previewTracker: TrackerDefinition = {
    id: existing?.id ?? 'preview',
    archived: false,
    sortOrder: 0,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: '',
    ...clean,
    name: clean.name || 'New tracker',
  };
  const previewDays: DayMap = useMemo(
    () => (existing ? buildDayMap(previewTracker, entries) : new Map()),
    // only the fields that change how a day is summarised
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [existing?.id, entries, clean.valueType, clean.target],
  );

  if (id && !existing) {
    return (
      <EmptyState emoji="🔍" title="This tracker is gone">
        <Link className="btn btn-primary" to="/trackers">
          Back to trackers
        </Link>
      </EmptyState>
    );
  }

  const errors: string[] = [];
  if (!clean.name) errors.push('Give the tracker a name.');
  if (type === 'choice' && cleanOptions.length < 2) errors.push('Add at least two different options to pick from.');
  if (s.kind === 'weekdays' && s.days.length === 0) errors.push('Choose at least one day.');

  const submit = () => {
    setTried(true);
    if (errors.length) return;
    let categoryId = draft.categoryId;
    if (newCategory?.trim()) categoryId = addCategory(newCategory.trim(), '📎').id;
    const toSave = { ...clean, categoryId };
    if (existing) {
      updateTracker(existing.id, toSave);
      navigate(`/trackers/${existing.id}`);
    } else {
      const t = createTracker(toSave);
      navigate(`/trackers/${t.id}`, { replace: true });
    }
  };

  const num = (v: string) => (v === '' ? undefined : Number(v));
  const setOption = (key: number, patch: Partial<OptionRow>) =>
    setOptions((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const addOption = () =>
    setOptions((rows) => {
      const key = rows.reduce((m, r) => Math.max(m, r.key), -1) + 1;
      return [...rows, { key, name: '', color: defaultValueColor({ valueType: 'choice' }, '', rows.length) }];
    });

  return (
    <>
      <header className="page-head">
        <Link to={existing ? `/trackers/${existing.id}` : '/trackers'} className="icon-btn" aria-label="Back">
          ‹
        </Link>
        <div className="page-head-text">
          <h1>{existing ? 'Edit tracker' : 'New tracker'}</h1>
        </div>
      </header>

      <div className="form">
        {!existing && (
          <section className="card form-card">
            <div className="field">
              <span className="label" id="idea-label">Start from an idea, or fill in your own below</span>
              <div className="chips" role="group" aria-labelledby="idea-label">
                {PRESETS.map((p, i) => (
                  <button type="button" key={p.name} className={`chip ${params.get('preset') === String(i) ? 'is-on' : ''}`} aria-pressed={params.get('preset') === String(i)} onClick={() => navigate(`/trackers/new?preset=${i}`, { replace: true })}>
                    <span aria-hidden="true">{p.emoji}</span> {p.name}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}
        <form
          id="tracker-form"
          className="form-fields"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <section className="card form-card">
            <div className="field">
              <label htmlFor="t-name">Name</label>
              <input id="t-name" type="text" value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="Morning walk" maxLength={40} />
            </div>

            <div className="field">
              <span className="label" id="emoji-label">Icon</span>
              <div className="emoji-grid" role="radiogroup" aria-labelledby="emoji-label">
                {EMOJI_CHOICES.map((e) => (
                  <button type="button" key={e} role="radio" aria-checked={draft.emoji === e} className={draft.emoji === e ? 'is-on' : ''} onClick={() => set({ emoji: e })}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <span className="label" id="color-label">Colour</span>
              <div className="color-row" role="radiogroup" aria-labelledby="color-label">
                {Object.entries(TAPE_COLORS).map(([key, hex]) => (
                  <button
                    type="button"
                    key={key}
                    role="radio"
                    aria-checked={draft.color === key}
                    aria-label={key}
                    className={draft.color === key ? 'is-on' : ''}
                    style={{ background: hex }}
                    onClick={() => set({ color: key })}
                  />
                ))}
              </div>
            </div>

            <div className="field">
              <label htmlFor="t-category">Category</label>
              {newCategory === null ? (
                <select
                  id="t-category"
                  value={draft.categoryId}
                  onChange={(e) => (e.target.value === '__new' ? setNewCategory('') : set({ categoryId: e.target.value }))}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {c.name}
                    </option>
                  ))}
                  <option value="__new">＋ New category…</option>
                </select>
              ) : (
                <div className="inline">
                  <input id="t-category" type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Category name" maxLength={30} autoFocus />
                  <button type="button" className="btn btn-quiet" onClick={() => setNewCategory(null)}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="card form-card">
            <div className="field">
              <span className="label" id="type-label">What do you record?</span>
              {hasEntries ? (
                <p className="muted">
                  {VALUE_TYPE_LABELS[type].name}. This can't change once there are entries, so the history always stays readable.
                </p>
              ) : (
                <div className="type-grid" role="radiogroup" aria-labelledby="type-label">
                  {(Object.keys(VALUE_TYPE_LABELS) as ValueType[]).map((v) => (
                    <button type="button" key={v} role="radio" aria-checked={type === v} className={type === v ? 'is-on' : ''} onClick={() => set({ valueType: v })}>
                      <strong>{VALUE_TYPE_LABELS[v].name}</strong>
                      <small>{VALUE_TYPE_LABELS[v].hint}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {type === 'number' && (
              <div className="field-row">
                <div className="field">
                  <label htmlFor="t-unit">Unit (optional)</label>
                  <input id="t-unit" type="text" value={draft.unit ?? ''} onChange={(e) => set({ unit: e.target.value })} placeholder="glasses, km, pages" maxLength={16} />
                </div>
                <div className="field">
                  <label htmlFor="t-step">Quick-add amount (optional)</label>
                  <input id="t-step" type="number" inputMode="decimal" min={0} step="any" value={draft.step ?? ''} onChange={(e) => set({ step: num(e.target.value) })} placeholder="1" />
                </div>
              </div>
            )}

            {type === 'rating' && (
              <>
                <div className="field">
                  <span className="label" id="scale-label">Scale</span>
                  <div className="seg" role="radiogroup" aria-labelledby="scale-label">
                    {([5, 10] as const).map((m) => (
                      <button type="button" key={m} role="radio" aria-checked={ratingMax === m} className={ratingMax === m ? 'is-on' : ''} onClick={() => set({ ratingMax: m })}>
                        1 to {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <span className="label">A colour for each score</span>
                  <div className="opt-list">
                    {Array.from({ length: ratingMax }, (_, i) => i + 1).map((n) => (
                      <div className="opt-row is-rating" key={n}>
                        <ColorPick value={ratingColor(n)} label={`score ${n}`} onChange={(c) => setRatingColors((r) => ({ ...r, [String(n)]: c }))} />
                        <strong>{n}</strong>
                      </div>
                    ))}
                  </div>
                  <small className="muted">Tap a colour to change it. Pixels and Calendar draw each day in the colour of its score.</small>
                </div>
              </>
            )}

            {type === 'choice' && (
              <div className="field">
                <span className="label">Options, each with its own colour</span>
                <div className="opt-list">
                  {options.map((o, i) => (
                    <div className="opt-row" key={o.key}>
                      <ColorPick value={o.color} label={o.name || `option ${i + 1}`} onChange={(c) => setOption(o.key, { color: c })} />
                      <input type="text" value={o.name} onChange={(e) => setOption(o.key, { name: e.target.value })} placeholder={['Happy', 'Tired', 'Sad', 'Calm'][i] ?? 'Another option'} maxLength={24} aria-label={`Option ${i + 1}`} />
                      <button type="button" className="icon-btn" onClick={() => setOptions((rows) => rows.filter((r) => r.key !== o.key))} disabled={options.length <= 2} aria-label={`Remove ${o.name || `option ${i + 1}`}`}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" className="btn btn-small add-option" onClick={addOption} disabled={options.length >= 12}>
                  + Add an option
                </button>
                <small className="muted">Tap a colour to change it. Pixels and Calendar draw each day in the colour of what you picked.</small>
              </div>
            )}

            {hasTarget && (
              <div className="field">
                <label htmlFor={type === 'number' ? 't-target' : 'target-h'}>Daily goal (optional)</label>
                {type === 'number' ? (
                  <input id="t-target" type="number" inputMode="decimal" min={0} step="any" value={draft.target ?? ''} onChange={(e) => set({ target: num(e.target.value) })} placeholder="8" />
                ) : (
                  <DurationInput idPrefix="target" minutes={draft.target ?? 0} onChange={(m) => set({ target: m })} />
                )}
                <small className="muted">A day counts as done when the goal is reached. Without a goal, any entry counts.</small>
              </div>
            )}
          </section>

          <section className="card form-card">
            <div className="field">
              <span className="label" id="sched-label">How often?</span>
              <div className="chips" role="radiogroup" aria-labelledby="sched-label">
                {SCHEDULE_KINDS.map((k) => (
                  <button type="button" key={k.kind} role="radio" aria-checked={s.kind === k.kind} className={`chip ${s.kind === k.kind ? 'is-on' : ''}`} onClick={() => s.kind !== k.kind && set({ schedule: defaultSchedule(k.kind) })}>
                    {k.name}
                  </button>
                ))}
              </div>
            </div>

            {s.kind === 'weekdays' && (
              <div className="field">
                <span className="label" id="days-label">Which days? The others are rest days.</span>
                <div className="day-row" role="group" aria-labelledby="days-label">
                  {Array.from({ length: 7 }, (_, i) => (weekStartsOn + i) % 7).map((d) => {
                    const on = s.days.includes(d);
                    return (
                      <button
                        type="button"
                        key={d}
                        aria-pressed={on}
                        className={on ? 'is-on' : ''}
                        onClick={() => set({ schedule: { kind: 'weekdays', days: on ? s.days.filter((x) => x !== d) : [...s.days, d] } })}
                      >
                        {WEEKDAY_SHORT[d]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {(s.kind === 'perWeek' || s.kind === 'perMonth') && (
              <div className="field">
                <label htmlFor="t-times">How many times a {s.kind === 'perWeek' ? 'week' : 'month'}?</label>
                <input
                  id="t-times"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={s.kind === 'perWeek' ? 7 : 31}
                  value={s.times}
                  onChange={(e) => set({ schedule: { kind: s.kind, times: Math.max(1, Math.min(s.kind === 'perWeek' ? 7 : 31, Number(e.target.value) || 1)) } })}
                />
                <small className="muted">Any days count. The streak is counted in {s.kind === 'perWeek' ? 'weeks' : 'months'}.</small>
              </div>
            )}

            {s.kind === 'everyN' && (
              <div className="field">
                <label htmlFor="t-every">Every how many days?</label>
                <input id="t-every" type="number" inputMode="numeric" min={2} max={30} value={s.n} onChange={(e) => set({ schedule: { kind: 'everyN', n: Math.max(2, Math.min(30, Number(e.target.value) || 2)) } })} />
              </div>
            )}
          </section>
        </form>

        {/* Outside the <form> on purpose: the preview has its own buttons. */}
        <section className="card form-card">
          <div className="field">
            <span className="label" id="look-label">How should it look?</span>
            <div className="type-grid" role="radiogroup" aria-labelledby="look-label">
              {looks.map((l) => (
                <button type="button" key={l.id} role="radio" aria-checked={lookId === l.id} className={lookId === l.id ? 'is-on' : ''} onClick={() => set({ visualizationId: l.id })}>
                  <strong>
                    <span aria-hidden="true">{l.icon}</span> {l.name}
                  </strong>
                  <small>{l.description}</small>
                </button>
              ))}
            </div>
            <small className="muted">You can come back and switch looks any time. The history stays exactly the same.</small>
          </div>

          <div className="field">
            <span className="label">Preview and options</span>
            <div className="look-preview" style={{ ['--tracker' as string]: TAPE_COLORS[draft.color] }}>
              <look.Component
                tracker={previewTracker}
                days={previewDays}
                today={today}
                weekStartsOn={weekStartsOn}
                config={lookConfig}
                editing
                onConfigChange={(patch) =>
                  set({ visualizationConfig: { ...draft.visualizationConfig, [lookId]: { ...lookConfig, ...patch } } })
                }
              />
            </div>
          </div>
        </section>

        {tried && errors.length > 0 && (
          <ul className="errors" role="alert">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}

        <div className="form-actions">
          <Link className="btn btn-quiet" to={existing ? `/trackers/${existing.id}` : '/trackers'}>
            Cancel
          </Link>
          <button type="submit" form="tracker-form" className="btn btn-primary">
            {existing ? 'Save changes' : 'Add tracker'}
          </button>
        </div>
      </div>
    </>
  );
}
