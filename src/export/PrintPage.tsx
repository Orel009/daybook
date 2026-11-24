import { bestPhotos, useAssetUrl } from '../data/assets';
import { isDarkColor, PAGE_DIMS, type Page, type PageElement } from '../domain/pages';
import { ElementBody, frameStyle, PageSourceContext, PrintPhotosContext, type PageSource } from '../ui/PageCanvas';
import { stageOf, type Sheet, type StageSize } from './layout';

// A page drawn for paper: the same parts as on screen, without the screen's
// frame around the sheet, and with its background running on past its edges
// where the layout asks for that (bleed, and the leftover beside a page that
// doesn't have the paper's shape).

export interface PrintItem {
  page: Page;
  size: Page['size'];
  /** Where trackers and photos come from when this isn't one of the book's own pages (a template printed blank). */
  source?: PageSource;
  /** Covers on a cover spread: the strip along the binding is drawn by the spread, not by the page. */
  hideSpine?: boolean;
}

export const printItem = (page: Page, extra: Partial<PrintItem> = {}): PrintItem => ({ page, size: page.size, ...extra });

/** On paper an empty photo slot says what goes there, not what to tap. */
const forPaper = (el: PageElement): PageElement => (el.type === 'frame' && !el.assetId && !el.hint ? { ...el, hint: 'Photo' } : el);

export function PrintPage({ item, pad, scale = 1 }: { item: PrintItem; pad: StageSize['pad']; scale?: number }) {
  const { page } = item;
  const { w, h } = PAGE_DIMS[page.size];
  const W = w + pad.left + pad.right;
  const H = h + pad.top + pad.bottom;
  const bgUrl = useAssetUrl(page.background.assetId, item.source?.photos ?? bestPhotos);
  const dark = isDarkColor(page.background.color);
  const body = (
    <div className="pg is-thumb is-print" style={{ width: W * scale, height: H * scale }}>
      <div
        className={`pg-layer pattern-${page.background.pattern}`}
        style={{
          width: W,
          height: H,
          transform: `scale(${scale})`,
          backgroundColor: page.background.color,
          ['--pg-line' as string]: dark ? 'rgb(255 255 255 / 0.16)' : 'rgb(58 43 71 / 0.16)',
          ['--pg-scale' as string]: scale,
        }}
      >
        {bgUrl && <img className="pg-bg" src={bgUrl} alt="" draggable={false} />}
        <div className="pg-print-sheet" style={{ left: pad.left, top: pad.top, width: w, height: h }}>
          {page.role && !item.hideSpine && <span className={`pg-spine is-${page.role}`} style={page.spine ? { background: page.spine } : undefined} aria-hidden="true" />}
          {page.elements.map((el) => (
            <div key={el.id} className={`pg-el type-${el.type}`} style={frameStyle(el)}>
              <ElementBody el={forPaper(el)} live={false} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  // the book's own pages print from the best copy of each photo this device has
  return item.source ? <PageSourceContext.Provider value={item.source}>{body}</PageSourceContext.Provider> : <PrintPhotosContext.Provider value={bestPhotos}>{body}</PrintPhotosContext.Provider>;
}

/**
 * One sheet of paper, drawn `mm` screen pixels to the millimetre: for the
 * preview (small) and for the browser's print dialog (life size). `guides`
 * shows where a print-ready page is cut.
 */
export function SheetView({ sheet, mm, guides = false }: { sheet: Sheet<PrintItem>; mm: number; guides?: boolean }) {
  return (
    <div className="xs-sheet" style={{ width: sheet.w * mm, height: sheet.h * mm }}>
      {sheet.fills.map((f, i) => (
        <i key={`f${i}`} className="xs-fill" style={{ left: f.x * mm, top: f.y * mm, width: f.w * mm, height: f.h * mm, background: f.color }} />
      ))}
      {sheet.placed.map((p, i) => {
        const size = stageOf(p);
        // a turned page is drawn upright and swung a quarter about its top left corner, which sits at the bottom left of its box
        const at = p.turned ? { left: p.box.x * mm, top: (p.box.y + p.box.h) * mm, transform: 'rotate(-90deg)' } : { left: p.box.x * mm, top: p.box.y * mm };
        return (
          <div key={`${p.item.page.id}-${i}`} className="xs-item" style={at}>
            <PrintPage item={p.item} pad={size.pad} scale={mm / size.unitsPerMm} />
          </div>
        );
      })}
      {sheet.marks.map((m, i) => (
        <i key={`m${i}`} className="xs-mark" style={{ left: Math.min(m.x1, m.x2) * mm, top: Math.min(m.y1, m.y2) * mm, width: Math.max(Math.abs(m.x2 - m.x1) * mm, 1), height: Math.max(Math.abs(m.y2 - m.y1) * mm, 1) }} />
      ))}
      {guides && sheet.trim && <i className="xs-trim" style={{ left: sheet.trim.x * mm, top: sheet.trim.y * mm, width: sheet.trim.w * mm, height: sheet.trim.h * mm }} />}
    </div>
  );
}
