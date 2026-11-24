import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { assetSize, releasePhotoUrls } from '../data/assets';
import { keepsPrintPhotos } from '../data/printPhotos';
import { useActiveTrackers } from '../data/hooks';
import { isUnsavedCover, useStore } from '../data/store';
import { coverPage, matchingBack, standardCover } from '../domain/covers';
import { bookOrder, coverOf, PAGE_DIMS, type Page } from '../domain/pages';
import { previewOf } from '../templates/preview';
import { themeAccent } from '../ui/dom';
import { EmptyState, PageHeader } from '../ui/Layout';
import { StaticPage } from '../ui/PageCanvas';
import { MIN_DPI, nearTheCut, photosOn } from './checks';
import './export.css';
import { isCancel, makePdf, makePngs } from './job';
import { BLEED, bookletSequence, bookletSheets, coverSpread, homeSheets, pageRange, PAPERS, pressSheets, SAFE, stageOf, TRIMS, type PaperId, type Sheet, type TrimId } from './layout';
import { printItem, SheetView, type PrintItem } from './PrintPage';
import { zip } from './zip';

// The "Print and export" screen: choose pages, choose a format, look at the
// result, then save it, share it or hand it to the print dialog. Everything is
// made on this device; nothing is sent anywhere.

type Scope = 'all' | 'range' | 'pick' | 'one';
type Format = 'pdf' | 'booklet' | 'press' | 'png';

const FORMATS: { id: Format; name: string; hint: string }[] = [
  { id: 'pdf', name: 'PDF to print at home', hint: 'One page per sheet, with a small white margin.' },
  { id: 'booklet', name: 'Booklet', hint: 'Two pages side by side on each side of a sheet, to fold in half and staple.' },
  { id: 'press', name: 'Photo book or print shop', hint: 'Pages at the trim size with bleed, and a separate cover file.' },
  { id: 'png', name: 'Pictures', hint: 'Each page as a PNG picture.' },
];

const QUALITY = [
  { dpi: 150, name: 'Smaller file' },
  { dpi: 200, name: 'Standard' },
  { dpi: 300, name: 'Best' },
];

const mb = (bytes: number) => (bytes < 1_000_000 ? `${Math.max(1, Math.round(bytes / 1000))} KB` : `${(bytes / 1_000_000).toFixed(1)} MB`);
const fileSafe = (s: string) => s.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'Daybook';

/** Can this browser hand files to other apps (WhatsApp, email, Drive…)? */
const canShareFiles = (): boolean => {
  try {
    return typeof navigator.share === 'function' && Boolean(navigator.canShare?.({ files: [new File(['x'], 'x.pdf', { type: 'application/pdf' })] }));
  } catch {
    return false;
  }
};

function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // long enough for the download to start; the file itself stays with the screen for "Save again"
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** A small page thumbnail, drawn once it is near the screen. */
function Thumb({ page }: { page: Page }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    const node = ref.current;
    if (near || !node) return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setNear(true), { rootMargin: '300px 0px' });
    io.observe(node);
    return () => io.disconnect();
  }, [near]);
  const width = page.size === 'portrait' ? 78 : 104;
  return (
    <div ref={ref} className="xp-thumb" style={{ width, height: (PAGE_DIMS[page.size].h * width) / PAGE_DIMS[page.size].w }}>
      {near && <StaticPage page={page} width={width} />}
    </div>
  );
}

/** The sheets at life size for the browser's own print dialog, with the paper sizes they ask for. */
function PrintRoot({ sheets, onDone }: { sheets: Sheet<PrintItem>[]; onDone: () => void }) {
  const done = useRef(onDone);
  done.current = onDone;
  // one named paper size per sheet shape, so tall and wide sheets can share a print job
  const names = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of sheets) {
      const key = `${s.w}x${s.h}`;
      if (!map.has(key)) map.set(key, `daybook${map.size}`);
    }
    return map;
  }, [sheets]);
  const css = useMemo(() => {
    const first = sheets[0];
    const rules = [`@page { size: ${first.w}mm ${first.h}mm; margin: 0; }`];
    for (const [key, name] of names) rules.push(`@page ${name} { size: ${key.replace('x', 'mm ')}mm; margin: 0; }`);
    return rules.join('\n');
  }, [sheets, names]);

  useEffect(() => {
    let live = true;
    const root = document.getElementById('print-root');
    const wait = async () => {
      // every photo and font in before the dialog opens
      const until = performance.now() + 15000;
      for (;;) {
        await new Promise((r) => setTimeout(r, 120));
        const images = Array.from(root?.querySelectorAll('img') ?? []);
        const expected = sheets.reduce((n, s) => n + s.placed.reduce((m, p) => m + photosOn(p.item.page).length, 0), 0);
        if ((images.length >= expected && images.every((i) => i.complete)) || performance.now() > until) break;
      }
      await document.fonts.ready;
      await new Promise((r) => setTimeout(r, 150));
      if (!live) return;
      window.print();
    };
    const after = () => done.current();
    window.addEventListener('afterprint', after);
    void wait();
    return () => {
      live = false;
      window.removeEventListener('afterprint', after);
    };
  }, [sheets]);

  return createPortal(
    <div id="print-root" aria-hidden="true">
      <style>{css}</style>
      {sheets.map((s, i) => (
        <section key={i} className="pr-sheet" style={{ width: `${s.w}mm`, height: `${s.h}mm`, page: names.get(`${s.w}x${s.h}`) } as React.CSSProperties}>
          <SheetView sheet={s} mm={96 / 25.4} />
        </section>
      ))}
    </div>,
    document.body,
  );
}

interface Warning {
  where: string;
  text: string;
}

export default function ExportScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const templateId = params.get('template');
  const pageId = params.get('page');

  const allPages = useStore((s) => s.pages);
  const owner = useStore((s) => s.settings.ownerName);
  const weekStartsOn = useStore((s) => s.settings.weekStartsOn);
  const trackers = useActiveTrackers();
  const book = useMemo(() => bookOrder(allPages), [allPages]);
  const saved = useMemo(() => allPages.filter((p) => !isUnsavedCover(p.id)), [allPages]);
  // the covers as designed, or the book's standard ones
  const covers = useMemo(() => {
    const accent = themeAccent();
    const designed = coverOf(saved, 'cover');
    const front = designed ?? coverPage('cover', standardCover(owner, accent));
    const back = coverOf(saved, 'back') ?? (designed ? matchingBack(designed) : coverPage('back', { ...standardCover('', accent), elements: [] }));
    return { front, back };
  }, [saved, owner]);

  // ----- a template printed blank
  const [template, setTemplate] = useState<PrintItem | null>(null);
  const [templateMissing, setTemplateMissing] = useState(false);
  useEffect(() => {
    if (!templateId) return;
    let live = true;
    void import('../templates/library').then((lib) => {
      if (!live) return;
      const t = lib.BUILT_IN_TEMPLATES.find((x) => x.id === templateId);
      if (!t) return setTemplateMissing(true);
      // trackers are drawn empty, from their presets; nothing is created
      const { ctx, source } = previewOf({ today: new Date(), weekStartsOn, own: trackers, entries: [], withData: false });
      const page = { ...lib.buildTemplatePage(t, ctx), title: t.name };
      setTemplate(printItem(page, { source }));
    });
    return () => {
      live = false;
    };
  }, [templateId, weekStartsOn]);

  // ----- which pages
  const single = pageId ? allPages.find((p) => p.id === pageId) : undefined;
  const singleInBook = Boolean(single && book.some((p) => p.id === single.id));
  const fixed = templateId ? template : single && !singleInBook ? printItem(single) : null; // a page that isn't part of the book: just that page
  const [scope, setScope] = useState<Scope>(singleInBook ? 'one' : 'all');
  const [withCovers, setWithCovers] = useState(true);
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(Math.max(1, book.length));
  const [picked, setPicked] = useState<Set<string>>(() => new Set());
  const [oneId, setOneId] = useState(singleInBook ? single!.id : (book[0]?.id ?? ''));

  const chosen = useMemo<Page[]>(() => {
    if (scope === 'range') return pageRange(book, from, to);
    if (scope === 'pick') return book.filter((p) => picked.has(p.id));
    if (scope === 'one') return book.filter((p) => p.id === oneId);
    return book;
  }, [scope, book, from, to, picked, oneId]);

  // ----- how
  const [format, setFormat] = useState<Format>('pdf');
  const [paper, setPaper] = useState<PaperId>('a4');
  const [dpi, setDpi] = useState(200);
  const [coversOutside, setCoversOutside] = useState(true);
  const [printInside, setPrintInside] = useState(false);
  const [trim, setTrim] = useState<TrimId>('8x10');
  const [spineText, setSpineText] = useState('6');
  const [spineUnit, setSpineUnit] = useState<'mm' | 'in'>('mm');
  const spine = Math.max(0, Math.min(80, (Number(spineText.replace(',', '.')) || 0) * (spineUnit === 'in' ? 25.4 : 1)));
  const [pressPart, setPressPart] = useState<'inside' | 'cover'>('inside');
  const formats = fixed ? FORMATS.filter((f) => f.id === 'pdf' || f.id === 'png') : FORMATS;

  /** The pages in the order they are printed, covers included where they belong. */
  const items = useMemo<PrintItem[]>(() => {
    if (fixed) return [fixed];
    const inside = chosen.map((p) => printItem(p));
    const wrap = scope === 'all' && withCovers && (format === 'pdf' || format === 'png') && inside.length > 0;
    return wrap ? [printItem(covers.front), ...inside, printItem(covers.back)] : inside;
  }, [fixed, chosen, scope, withCovers, format, covers]);

  const canMixSheets = useMemo(() => typeof CSS !== 'undefined' && CSS.supports('page', 'daybook'), []);
  const coverSheet = useMemo(
    () => coverSpread(printItem(covers.front, { hideSpine: true }), printItem(covers.back, { hideSpine: true }), trim, spine, covers.front.spine ?? covers.front.background.color),
    [covers, trim, spine],
  );
  const sheets = useMemo<Sheet<PrintItem>[]>(() => {
    if (items.length === 0) return [];
    if (format === 'booklet') {
      const useCovers = coversOutside && !fixed;
      return bookletSheets(bookletSequence(items, useCovers ? { front: printItem(covers.front), back: printItem(covers.back), printInside } : undefined), paper === 'letter' ? 'letter' : 'a4');
    }
    if (format === 'press') return pressSheets(items, trim);
    return homeSheets(items, paper);
  }, [items, format, paper, trim, coversOutside, printInside, covers, fixed]);
  const shown = format === 'press' && pressPart === 'cover' ? [coverSheet] : sheets;

  // ----- preview
  const [at, setAt] = useState(0);
  const index = Math.min(at, Math.max(0, shown.length - 1));
  const previewBox = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState({ w: 300, h: 420 });
  useLayoutEffect(() => {
    const measure = () => setRoom({ w: previewBox.current?.clientWidth ?? 300, h: Math.max(260, Math.min(560, window.innerHeight * 0.55)) });
    measure();
    const ro = new ResizeObserver(measure);
    if (previewBox.current) ro.observe(previewBox.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);
  const sheet = shown[index];
  const mm = sheet ? Math.min((room.w - 4) / sheet.w, room.h / sheet.h) : 1;

  // ----- warnings for print-ready files
  const [warnings, setWarnings] = useState<Warning[]>([]);
  useEffect(() => {
    if (format !== 'press') return setWarnings([]);
    let live = true;
    void (async () => {
      const found: Warning[] = [];
      const all = [...sheets.map((s, i) => ({ s, where: `Page ${i + 1}` })), { s: coverSheet, where: 'Cover' }];
      for (const { s, where } of all) {
        for (const p of s.placed) {
          const name = s === coverSheet ? (p.item.page.role === 'back' ? 'Back cover' : 'Front cover') : `${where}${p.item.page.title ? ` (${p.item.page.title})` : ''}`;
          const cut = s === coverSheet ? { x: p.item.page.role === 'back' ? s.trim!.x : p.box.x, y: s.trim!.y, w: TRIMS[trim].w, h: TRIMS[trim].h } : s.trim!;
          const close = nearTheCut(p.item.page, p, cut);
          if (close.length) {
            const worst = Math.min(...close.map((c) => c.distance));
            found.push({ where: name, text: worst < 0 ? `${close.length === 1 ? 'A part goes' : `${close.length} parts go`} past the cut line and would be trimmed.` : `${close.length === 1 ? 'A part is' : `${close.length} parts are`} closer than ${SAFE} mm to the cut (the nearest ${worst} mm).` });
          }
          const size = stageOf(p);
          for (const use of photosOn(p.item.page)) {
            const px = await assetSize(use.assetId);
            if (!px) continue;
            const got = Math.round(use.dpi(px, size.unitsPerMm, size));
            if (got >= MIN_DPI) continue;
            // how to get it sharper depends on what this device keeps
            const how = px.print
              ? 'This is already its print-quality copy: make it smaller on the page.'
              : keepsPrintPhotos()
                ? 'Make it smaller on the page, or add the photo again from the original: this one was added before print-quality copies were kept, or on another device.'
                : 'Make it smaller on the page. For sharper prints of photos you add from now on, switch on "Keep print-quality photos on this device" in Settings, then add the photo again.';
            found.push({ where: name, text: `${use.what[0].toUpperCase()}${use.what.slice(1)} would print at about ${got} dots per inch; under ${MIN_DPI} it starts to look soft. ${how}` });
          }
        }
      }
      if (live) setWarnings(found);
    })();
    return () => {
      live = false;
    };
  }, [format, sheets, coverSheet, trim]);

  // ----- making the file
  const [progress, setProgress] = useState<{ done: number; total: number; label: string } | null>(null);
  const [ready, setReady] = useState<{ blob: Blob; name: string; seconds: number } | null>(null);
  const [error, setError] = useState('');
  const [printing, setPrinting] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const share = useMemo(canShareFiles, []);
  // whatever was made belongs to the choices it was made with
  useEffect(() => setReady(null), [items, format, paper, dpi, trim, spine, coversOutside, printInside]);
  // leaving the screen stops whatever is running and lets go of the large photo copies it showed
  useEffect(
    () => () => {
      abort.current?.abort();
      releasePhotoUrls('best');
    },
    [],
  );

  const title = fixed ? fixed.page.title || 'Untitled page' : items.length === 1 ? items[0].page.title || 'Untitled page' : owner ? `${owner}’s Daybook` : 'My Daybook';
  const run = async (what: 'file' | 'cover', then: 'save' | 'hold') => {
    setError('');
    setReady(null);
    const controller = new AbortController();
    abort.current = controller;
    const o = { signal: controller.signal, onProgress: (done: number, total: number, label: string) => setProgress({ done, total, label }) };
    const started = performance.now();
    try {
      let blob: Blob;
      let name: string;
      if (what === 'cover') {
        setProgress({ done: 0, total: 2, label: 'Cover' });
        blob = await makePdf([coverSheet], 300, `${title} cover`, o);
        name = `${fileSafe(title)} - cover.pdf`;
      } else if (format === 'png') {
        setProgress({ done: 0, total: items.length, label: '' });
        const pictures = await makePngs(items, 2, o);
        if (pictures.length === 1) {
          blob = pictures[0];
          name = `${fileSafe(title)}.png`;
        } else {
          blob = await zip(pictures.map((b, i) => ({ blob: b, name: `${String(i + 1).padStart(2, '0')} ${fileSafe(items[i].page.title || 'Untitled page')}.png` })));
          name = `${fileSafe(title)} - pictures.zip`;
        }
      } else {
        setProgress({ done: 0, total: sheets.reduce((n, s) => n + s.placed.length, 0), label: '' });
        blob = await makePdf(sheets, format === 'press' ? 300 : dpi, title, o);
        name = `${fileSafe(title)}${format === 'booklet' ? ' - booklet' : format === 'press' ? ' - pages' : ''}.pdf`;
      }
      const made = { blob, name, seconds: Math.round((performance.now() - started) / 100) / 10 };
      setReady(made);
      if (then === 'save') download(blob, name);
    } catch (err) {
      if (!isCancel(err)) {
        console.error(err);
        setError('That could not be made. Try fewer pages or a smaller file.');
      }
    }
    setProgress(null);
    abort.current = null;
  };
  const shareIt = async () => {
    if (!ready) return;
    try {
      await navigator.share({ files: [new File([ready.blob], ready.name, { type: ready.blob.type })], title });
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) setError('Sharing did not work here. Save the file and send it from your files instead.');
    }
  };

  // ----- what to show
  if (templateId && templateMissing) return <EmptyState emoji="🔍" title="That template is gone" />;
  if (pageId && !single) return <EmptyState emoji="🔍" title="This page is gone" />;
  const back = (
    <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back">
      ‹
    </button>
  );
  if (!fixed && !templateId && book.length === 0) {
    return (
      <>
        <PageHeader title="Print and export" back={back} />
        <EmptyState emoji="🖨️" title="Nothing to print yet">
          <p>Pages you make in the journal can be printed or saved as a PDF from here.</p>
          <Link className="btn btn-primary" to="/journal">
            Go to the journal
          </Link>
        </EmptyState>
      </>
    );
  }
  const busy = Boolean(progress) || printing;
  const sheetCount = sheets.length;
  const paperChoices: PaperId[] = format === 'booklet' ? ['a4', 'letter'] : ['a4', 'letter', 'a5'];
  const number = (p: Page) => book.findIndex((x) => x.id === p.id) + 1;

  return (
    <div className="xp">
      <PageHeader title={templateId ? 'Print blank' : 'Print and export'} sub="Made on this device. Nothing is uploaded." back={back} />

      {fixed ? (
        <p className="xp-what">
          <strong>{fixed.page.title || 'Untitled page'}</strong>
          {templateId ? ', printed empty, ready to fill in by hand.' : '.'}
        </p>
      ) : templateId ? (
        <p className="muted" role="status">
          Getting the template…
        </p>
      ) : (
        <section className="card xp-card" aria-labelledby="xp-pages">
          <h2 id="xp-pages">Which pages</h2>
          <div className="seg seg-small seg-wrap" role="radiogroup" aria-label="Which pages">
            {([['all', 'The whole book'], ['range', 'A range'], ['pick', 'Selected pages'], ['one', 'One page']] as const).map(([id, name]) => (
              <button key={id} role="radio" aria-checked={scope === id} className={scope === id ? 'is-on' : ''} onClick={() => setScope(id)}>
                {name}
              </button>
            ))}
          </div>
          {scope === 'all' && (format === 'pdf' || format === 'png') && (
            <button className={`chip ${withCovers ? 'is-on' : ''}`} aria-pressed={withCovers} onClick={() => setWithCovers(!withCovers)}>
              With the covers
            </button>
          )}
          {scope === 'range' && (
            <div className="inline">
              <label className="xp-num">
                <span>From page</span>
                <input type="number" inputMode="numeric" min={1} max={book.length} value={from} onChange={(e) => setFrom(Number(e.target.value) || 1)} />
              </label>
              <label className="xp-num">
                <span>to page</span>
                <input type="number" inputMode="numeric" min={1} max={book.length} value={to} onChange={(e) => setTo(Number(e.target.value) || 1)} />
              </label>
              <span className="muted">of {book.length}</span>
            </div>
          )}
          {(scope === 'pick' || scope === 'one') && (
            <>
              {scope === 'pick' && (
                <div className="inline">
                  <button className="btn btn-small" onClick={() => setPicked(new Set(book.map((p) => p.id)))}>
                    Select all
                  </button>
                  <button className="btn btn-small" onClick={() => setPicked(new Set())} disabled={picked.size === 0}>
                    Select none
                  </button>
                  <span className="muted" aria-live="polite">
                    {picked.size} of {book.length} selected
                  </span>
                </div>
              )}
              <div className="xp-picker" role={scope === 'one' ? 'radiogroup' : 'group'} aria-label={scope === 'one' ? 'Page' : 'Pages to include'}>
                {book.map((p) => {
                  const on = scope === 'one' ? oneId === p.id : picked.has(p.id);
                  return (
                    <button
                      key={p.id}
                      role={scope === 'one' ? 'radio' : undefined}
                      aria-checked={scope === 'one' ? on : undefined}
                      aria-pressed={scope === 'pick' ? on : undefined}
                      aria-label={`Page ${number(p)}: ${p.title || 'Untitled page'}`}
                      className={on ? 'is-on' : ''}
                      onClick={() => {
                        if (scope === 'one') return setOneId(p.id);
                        const next = new Set(picked);
                        if (next.has(p.id)) next.delete(p.id);
                        else next.add(p.id);
                        setPicked(next);
                      }}
                    >
                      <Thumb page={p} />
                      <small>{number(p)}</small>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </section>
      )}

      {(fixed || !templateId) && (
        <>
          <section className="card xp-card" aria-labelledby="xp-format">
            <h2 id="xp-format">As what</h2>
            <div className="xp-formats" role="radiogroup" aria-label="Format">
              {formats.map((f) => (
                <button key={f.id} role="radio" aria-checked={format === f.id} className={format === f.id ? 'is-on' : ''} onClick={() => { setFormat(f.id); setAt(0); }}>
                  <strong>{f.id === 'pdf' && templateId ? 'PDF to print' : f.name}</strong>
                  <small>{f.hint}</small>
                </button>
              ))}
            </div>

            {(format === 'pdf' || format === 'booklet') && (
              <div className="xp-options">
                <div className="field">
                  <span className="label" id="xp-paper">Paper</span>
                  <div className="seg seg-small" role="radiogroup" aria-labelledby="xp-paper">
                    {paperChoices.map((id) => (
                      <button key={id} role="radio" aria-checked={(format === 'booklet' && paper === 'a5' ? 'a4' : paper) === id} className={(format === 'booklet' && paper === 'a5' ? 'a4' : paper) === id ? 'is-on' : ''} onClick={() => setPaper(id)}>
                        {PAPERS[id].name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <span className="label" id="xp-quality">Quality</span>
                  <div className="seg seg-small" role="radiogroup" aria-labelledby="xp-quality">
                    {QUALITY.map((q) => (
                      <button key={q.dpi} role="radio" aria-checked={dpi === q.dpi} className={dpi === q.dpi ? 'is-on' : ''} onClick={() => setDpi(q.dpi)}>
                        {q.name}
                      </button>
                    ))}
                  </div>
                </div>
                {format === 'booklet' && !fixed && (
                  <div className="inline">
                    <button className={`chip ${coversOutside ? 'is-on' : ''}`} aria-pressed={coversOutside} onClick={() => setCoversOutside(!coversOutside)}>
                      Covers on the outside sheet
                    </button>
                    {coversOutside && (
                      <button className={`chip ${printInside ? 'is-on' : ''}`} aria-pressed={printInside} onClick={() => setPrintInside(!printInside)}>
                        Print on the inside of the covers
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            {format === 'booklet' && sheetCount > 0 && (
              <p className="xp-note">
                <strong>Print on both sides, flip on short edge.</strong> {sheetCount / 2} sheet{sheetCount === 2 ? '' : 's'} of paper: stack them in order, fold in half and staple in the fold.
                {coversOutside && !fixed && !printInside && ' The insides of the covers stay blank.'}
                {sheets.reduce((n, s) => n + 2 - s.placed.length, 0) > (coversOutside && !fixed && !printInside ? 2 : 0) && ' Blank pages fill it up to a multiple of four.'}
              </p>
            )}
            {format === 'press' && (
              <div className="xp-options">
                <div className="field">
                  <span className="label" id="xp-trim">Trim size</span>
                  <div className="seg seg-small seg-wrap" role="radiogroup" aria-labelledby="xp-trim">
                    {(Object.keys(TRIMS) as TrimId[]).map((id) => (
                      <button key={id} role="radio" aria-checked={trim === id} className={trim === id ? 'is-on' : ''} onClick={() => setTrim(id)}>
                        {TRIMS[id].name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="xp-spine">Spine width</label>
                  <div className="inline">
                    <input id="xp-spine" className="xp-spine" type="text" inputMode="decimal" value={spineText} onChange={(e) => setSpineText(e.target.value)} aria-describedby="xp-spine-note" />
                    <div className="seg seg-small" role="radiogroup" aria-label="Spine width in">
                      {(['mm', 'in'] as const).map((u) => (
                        <button key={u} role="radio" aria-checked={spineUnit === u} className={spineUnit === u ? 'is-on' : ''} onClick={() => setSpineUnit(u)}>
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                  <small className="muted" id="xp-spine-note">
                    Your print service gives this number: it depends on how many pages the book has and on their paper.
                  </small>
                </div>
                <p className="xp-note">
                  Pages are {TRIMS[trim].name} with {BLEED} mm (0.125 in) of bleed on every side, at 300 dots per inch. Backgrounds run to the edge of the bleed; wide pages are turned a quarter. The cover is a second file: back cover, spine, front cover.
                </p>
              </div>
            )}
            {format === 'png' && <p className="xp-note">{items.length > 1 ? `${items.length} pictures, saved together as one ZIP file.` : 'One picture, 1800 pixels wide for a tall page.'}</p>}
          </section>

          <section className="card xp-card" aria-labelledby="xp-preview">
            <div className="xp-preview-head">
              <h2 id="xp-preview">Preview</h2>
              {format === 'press' && (
                <div className="seg seg-small" role="radiogroup" aria-label="Preview of">
                  {([['inside', 'Pages'], ['cover', 'Cover']] as const).map(([id, name]) => (
                    <button key={id} role="radio" aria-checked={pressPart === id} className={pressPart === id ? 'is-on' : ''} onClick={() => { setPressPart(id); setAt(0); }}>
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="xp-preview" ref={previewBox}>
              {sheet ? <SheetView sheet={sheet} mm={mm} guides={format === 'press'} /> : <p className="muted">Choose at least one page.</p>}
            </div>
            {sheet && (
              <div className="xp-pager">
                <button className="btn btn-small" onClick={() => setAt(index - 1)} disabled={index === 0} aria-label="Previous sheet">
                  ‹
                </button>
                <span aria-live="polite">
                  {format === 'png' ? `Picture ${index + 1} of ${shown.length}` : `${sheet.label}${shown.length > 1 ? ` · ${index + 1} of ${shown.length}` : ''}`}
                  <small className="muted"> · {Math.round(sheet.w)} × {Math.round(sheet.h)} mm</small>
                </span>
                <button className="btn btn-small" onClick={() => setAt(index + 1)} disabled={index >= shown.length - 1} aria-label="Next sheet">
                  ›
                </button>
              </div>
            )}
            {format === 'press' && <small className="muted">The dashed line is where the page is cut; outside it is bleed.</small>}
          </section>

          {format === 'press' && warnings.length > 0 && (
            <section className="card xp-card xp-warnings" aria-labelledby="xp-warn">
              <h2 id="xp-warn">
                {warnings.length} thing{warnings.length === 1 ? '' : 's'} to check before printing
              </h2>
              <ul>
                {warnings.slice(0, 30).map((w, i) => (
                  <li key={i}>
                    <strong>{w.where}:</strong> {w.text}
                  </li>
                ))}
              </ul>
              {warnings.length > 30 && <small className="muted">And {warnings.length - 30} more.</small>}
            </section>
          )}

          <div className="xp-actions">
            {progress ? (
              <div className="xp-progress" role="status" aria-live="polite">
                <strong>
                  Making page {Math.min(progress.done + 1, progress.total)} of {progress.total}…
                </strong>
                <progress value={progress.done} max={Math.max(1, progress.total)} />
                <button className="btn" onClick={() => abort.current?.abort()}>
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <button className="btn btn-primary" onClick={() => void run('file', 'save')} disabled={busy || items.length === 0}>
                  {format === 'png' ? (items.length > 1 ? 'Save pictures' : 'Save picture') : format === 'press' ? 'Save pages PDF' : 'Save PDF'}
                </button>
                {format === 'press' && (
                  <button className="btn btn-primary" onClick={() => void run('cover', 'save')} disabled={busy}>
                    Save cover PDF
                  </button>
                )}
                {share && (
                  <button className="btn" onClick={() => void run('file', 'hold')} disabled={busy || items.length === 0}>
                    Share…
                  </button>
                )}
                {(format === 'pdf' || format === 'booklet') && (
                  <button className="btn" onClick={() => setPrinting(true)} disabled={busy || items.length === 0}>
                    Open print dialog
                  </button>
                )}
              </>
            )}
          </div>
          {printing && (
            <p className="xp-note" role="status">
              Getting {sheetCount} sheet{sheetCount === 1 ? '' : 's'} ready for the print dialog…{' '}
              <button className="text-link" onClick={() => setPrinting(false)}>
                Cancel
              </button>
            </p>
          )}
          {(format === 'pdf' || format === 'booklet') && !printing && !progress && (
            <small className="muted">
              "Open print dialog" lets the browser print or save the pages itself, with the sharpest text. In its options, switch on background graphics if the paper colour is missing.
              {!canMixSheets && ' In this browser wide pages are turned to fit upright paper there.'}
            </small>
          )}
          {ready && !progress && (
            <div className="xp-ready" role="status">
              <span>
                <strong>{ready.name}</strong> is ready: {mb(ready.blob.size)}, made in {ready.seconds} s.
              </span>
              <span className="inline">
                <button className="btn btn-small" onClick={() => download(ready.blob, ready.name)}>
                  Save again
                </button>
                {share && (
                  <button className="btn btn-small btn-primary" onClick={() => void shareIt()}>
                    Share
                  </button>
                )}
              </span>
            </div>
          )}
          {error && (
            <p className="warning" role="alert">
              {error}
            </p>
          )}
          {printing && <PrintRoot sheets={format === 'pdf' && !canMixSheets ? homeSheets(items, paper, { turnWide: true }) : sheets} onDone={() => setPrinting(false)} />}
        </>
      )}
    </div>
  );
}
