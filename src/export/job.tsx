import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import { PAGE_DIMS } from '../domain/pages';
import { releasePhotoUrls } from '../data/assets';
import { photosOn } from './checks';
import { pixelsFor, stageOf, type Sheet, type StageSize } from './layout';
import { PdfWriter, type PdfImage } from './pdf';
import { PrintPage, type PrintItem } from './PrintPage';
import { drawNode, forgetDrawingData } from './render';

// Making the files. A book is built one page at a time: the page is drawn off
// to the side of the screen, waited for (fonts, photos), turned into one
// picture, written into the file, and let go before the next one starts. Only
// the finished pictures pile up, and those the browser keeps outside the
// app's own memory.

/** One step of waiting for the screen. A hidden tab gets no frames, so a short timer stands in. */
const frame = () =>
  new Promise<void>((resolve) => {
    let done = false;
    const go = () => {
      if (!done) {
        done = true;
        resolve();
      }
    };
    requestAnimationFrame(go);
    setTimeout(go, 60);
  });

/** Largest picture drawn in one piece; some tablets refuse a bigger canvas. */
const MAX_PIXELS = 16_000_000;

export const cancelled = () => new DOMException('Cancelled', 'AbortError');
export const isCancel = (err: unknown) => err instanceof DOMException && err.name === 'AbortError';

/** The off-screen place where one page at a time is drawn at full size. */
class Stage {
  private host: HTMLDivElement;
  private root: Root;
  private serial = 0;

  constructor() {
    this.host = document.createElement('div');
    this.host.className = 'px-stage';
    this.host.setAttribute('aria-hidden', 'true');
    this.host.inert = true;
    document.body.appendChild(this.host);
    this.root = createRoot(this.host);
  }

  /** Draws the page and waits until its photos and fonts are in. */
  async show(item: PrintItem, size: StageSize): Promise<HTMLElement> {
    flushSync(() => this.root.render(<PrintPage key={++this.serial} item={item} pad={size.pad} />));
    const node = this.host.firstElementChild as HTMLElement;
    const expected = photosOn(item.page).length;
    const giveUp = performance.now() + 3000; // a photo that isn't on this device is left out rather than waited for
    for (;;) {
      await frame();
      const images = Array.from(node.querySelectorAll('img'));
      // loaded is enough: their sizes are known, which is all the layout needs. Asking for them to be unpacked
      // here would leave every photo of the book in the browser's picture cache at full size.
      if ((images.length >= expected && images.every((i) => i.complete)) || performance.now() > giveUp) break;
    }
    await document.fonts.ready;
    // text that is fitted to its spot measures itself again once the fonts are in
    await frame();
    await frame();
    return node;
  }

  close(): void {
    this.root.unmount();
    this.host.remove();
  }
}

/** After a job, finished or cancelled: the stage goes, and with it everything drawn, loaded or addressed for it. */
function letGo(stage: Stage): void {
  stage.close();
  forgetDrawingData();
  releasePhotoUrls('best');
}

export interface JobOptions {
  signal: AbortSignal;
  onProgress: (done: number, total: number, label: string) => void;
}

/** A PDF of these sheets, with pictures drawn at `dpi` dots per inch. */
export async function makePdf(sheets: Sheet<PrintItem>[], dpi: number, title: string, o: JobOptions): Promise<Blob> {
  const stage = new Stage();
  const pdf = new PdfWriter();
  const total = sheets.reduce((n, s) => n + s.placed.length, 0);
  let done = 0;
  try {
    for (const sheet of sheets) {
      const images: PdfImage[] = [];
      for (const p of sheet.placed) {
        if (o.signal.aborted) throw cancelled();
        const size = stageOf(p);
        let px = pixelsFor(size, dpi);
        if (px.w * px.h > MAX_PIXELS) {
          const k = Math.sqrt(MAX_PIXELS / (px.w * px.h));
          px = { w: Math.floor(px.w * k), h: Math.floor(px.h * k) };
        }
        const node = await stage.show(p.item, size);
        if (o.signal.aborted) throw cancelled();
        const jpeg = await drawNode(node, size.w, size.h, px.w, px.h, { type: 'image/jpeg', quality: 0.9 });
        images.push({ jpeg, pw: px.w, ph: px.h, box: p.box, turned: p.turned });
        o.onProgress(++done, total, sheet.label);
      }
      pdf.addPage({ w: sheet.w, h: sheet.h, trim: sheet.trim, images, fills: sheet.fills, marks: sheet.marks });
    }
    return pdf.finish({ title });
  } finally {
    letGo(stage);
  }
}

/** Each page as a PNG picture, `scale` pixels to the page unit (2 gives 1800 × 2400 for a tall page). */
export async function makePngs(items: PrintItem[], scale: number, o: JobOptions): Promise<Blob[]> {
  const stage = new Stage();
  const out: Blob[] = [];
  try {
    for (const item of items) {
      if (o.signal.aborted) throw cancelled();
      const { w, h } = PAGE_DIMS[item.size];
      const node = await stage.show(item, { unitsPerMm: 1, pad: { left: 0, top: 0, right: 0, bottom: 0 }, w, h });
      if (o.signal.aborted) throw cancelled();
      out.push(await drawNode(node, w, h, Math.round(w * scale), Math.round(h * scale), { type: 'image/png' }));
      o.onProgress(out.length, items.length, item.page.title || 'Untitled page');
    }
    return out;
  } finally {
    letGo(stage);
  }
}
