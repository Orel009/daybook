// Turns a piece of the page that is already on screen (off to the side, in
// the "stage") into a picture, using the browser's own drawing: the piece is
// copied into an SVG image together with the app's styles, the fonts it uses
// and its photos, and that image is painted onto a canvas at print size.
// Because the browser lays it out and draws it, lettering comes out exactly as
// it does on screen, at any resolution.
//
// An SVG image can't fetch anything, so everything it needs travels inside it:
// fonts and photos as data.

const XHTML = 'http://www.w3.org/1999/xhtml';
const SVG = 'http://www.w3.org/2000/svg';

/** Properties a page inherits from the screen around it; copied onto the copy so it starts from the same place. */
const INHERITED = [
  'color', 'font-family', 'font-size', 'font-weight', 'font-style', 'font-variant', 'font-stretch', 'font-kerning', 'font-feature-settings', 'font-variation-settings',
  'font-optical-sizing', 'line-height', 'letter-spacing', 'word-spacing', 'text-align', 'text-transform', 'text-indent', 'text-rendering', 'white-space', 'word-break',
  'overflow-wrap', 'direction', 'tab-size', 'hyphens', 'list-style', '-webkit-font-smoothing', 'color-scheme',
];

const toDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

// ----- styles

interface Styles {
  /** Every style rule of the app except fonts, as text. */
  rules: { selector: string | null; text: string }[];
  fontRules: CSSFontFaceRule[];
  customProps: string[];
}

let styles: Styles | null = null;

/** Reads the app's style sheets once. */
function readStyles(): Styles {
  if (styles) return styles;
  const rules: Styles['rules'] = [];
  const fontRules: CSSFontFaceRule[] = [];
  const props = new Set<string>();
  const noteProps = (style: CSSStyleDeclaration) => {
    for (let i = 0; i < style.length; i++) if (style[i].startsWith('--')) props.add(style[i]);
  };
  for (const sheet of Array.from(document.styleSheets)) {
    let list: CSSRuleList;
    try {
      list = sheet.cssRules;
    } catch {
      continue; // a sheet from elsewhere can't be read, and isn't ours
    }
    for (const rule of Array.from(list)) {
      if (rule instanceof CSSFontFaceRule) fontRules.push(rule);
      else if (rule instanceof CSSStyleRule) {
        noteProps(rule.style);
        rules.push({ selector: rule.selectorText, text: rule.cssText });
      } else if (rule instanceof CSSMediaRule && rule.conditionText.includes('print')) continue;
      else {
        // media queries, keyframes and the like: kept whole
        if ('cssRules' in rule) for (const inner of Array.from((rule as CSSGroupingRule).cssRules)) if (inner instanceof CSSStyleRule) noteProps(inner.style);
        rules.push({ selector: null, text: rule.cssText });
      }
    }
  }
  styles = { rules, fontRules, customProps: [...props] };
  return styles;
}

/** A selector without the parts that can't be asked of an element (::before, :hover…), for "does anything here match?". */
const askable = (selector: string) => selector.replace(/::?(before|after|placeholder|marker|selection|first-line|first-letter)/g, '').replace(/:(hover|active|focus-visible|focus-within|focus|visited|link)/g, '');

/** The style rules that apply to something inside `node`, as one text. Rules that can't be judged are kept. */
function stylesFor(node: HTMLElement): string {
  const out: string[] = [];
  for (const rule of readStyles().rules) {
    if (rule.selector === null) {
      out.push(rule.text);
      continue;
    }
    let applies = true;
    try {
      const sel = askable(rule.selector);
      applies = node.matches(sel) || node.querySelector(sel) !== null;
    } catch {
      applies = true;
    }
    if (applies) out.push(rule.text);
  }
  return out.join('\n');
}

// ----- fonts

const fontData = new Map<string, Promise<string>>();
const clean = (s: string) => s.replace(/["'\s]/g, '').toLowerCase();
const faceKey = (family: string, weight: string, style: string, range: string) => [clean(family), clean(weight), clean(style || 'normal'), clean(range || 'U+0-10FFFF')].join('|');

/** The fonts in use on screen right now, as @font-face rules that carry the font itself. */
async function fontsInUse(): Promise<string> {
  const loaded = new Set<string>();
  document.fonts.forEach((face) => {
    if (face.status === 'loaded') loaded.add(faceKey(face.family, face.weight, face.style, face.unicodeRange));
  });
  const keyOf = (rule: CSSFontFaceRule) => {
    const s = rule.style;
    return faceKey(s.getPropertyValue('font-family'), s.getPropertyValue('font-weight') || 'normal', s.getPropertyValue('font-style'), s.getPropertyValue('unicode-range'));
  };
  const all = readStyles().fontRules;
  // if the browser describes its fonts in a way that can't be matched, send them all rather than none
  const inUse = all.filter((rule) => loaded.has(keyOf(rule)));
  const out: string[] = [];
  for (const rule of inUse.length ? inUse : all) {
    const s = rule.style;
    const src = s.getPropertyValue('src');
    const url = /url\(["']?([^"')]+)["']?\)\s*format\(["']woff2["']\)/.exec(src)?.[1] ?? /url\(["']?([^"')]+)["']?\)/.exec(src)?.[1];
    if (!url) continue;
    const absolute = new URL(url, rule.parentStyleSheet?.href ?? location.href).href;
    let data = fontData.get(absolute);
    if (!data) {
      data = fetch(absolute)
        .then((r) => r.blob())
        .then(toDataUrl);
      fontData.set(absolute, data);
    }
    const descriptors = ['font-family', 'font-style', 'font-weight', 'font-stretch', 'font-display', 'unicode-range']
      .map((p) => (s.getPropertyValue(p) ? `${p}: ${s.getPropertyValue(p)};` : ''))
      .join(' ');
    out.push(`@font-face { ${descriptors} src: url("${await data}"); }`);
  }
  return out.join('\n');
}

// ----- photos

const photoData = new Map<string, Promise<string>>();
let shrinker: HTMLCanvasElement | null = null;

/**
 * A photo as data, as large as it will be drawn and no larger. `shown` is the
 * photo as it sits on the stage, `scale` how many pixels a stage pixel becomes.
 *
 * The browser unpacks every photo in every page's picture at the photo's full
 * size and keeps that around. A photo shown small is therefore handed over
 * small; one that is printed at (nearly) its full size goes in untouched, so
 * nothing is lost where it counts. Remembered for a while: the same photo is
 * often on several pages.
 */
function photoAsData(src: string, shown: HTMLImageElement, scale: number): Promise<string> {
  const nw = shown.naturalWidth;
  const nh = shown.naturalHeight;
  let width = nw;
  if (nw && nh) {
    // a photo that covers its box is as wide as the box or, if the box is the taller, wider
    const cover = getComputedStyle(shown).objectFit === 'cover';
    const boxW = shown.offsetWidth;
    const boxH = shown.offsetHeight;
    const shownW = cover ? Math.max(boxW, (boxH * nw) / nh) : boxW;
    // in steps, so nearly equal sizes share one copy
    width = Math.ceil((shownW * scale) / 64) * 64;
  }
  const whole = !nw || !nh || width >= nw * 0.85;
  const key = whole ? src : `${src}@${width}`;
  let data = photoData.get(key);
  if (!data) {
    const original = fetch(src).then((r) => r.blob());
    data = whole
      ? original.then(toDataUrl)
      : original
          .then(async (blob) => {
            const height = Math.max(1, Math.round((width * nh) / nw));
            // unpacked and made smaller in one go, and let go of at once: nothing full-size is left behind
            const small = await createImageBitmap(blob, { resizeWidth: width, resizeHeight: height, resizeQuality: 'high' });
            shrinker ??= document.createElement('canvas');
            shrinker.width = width;
            shrinker.height = height;
            shrinker.getContext('2d')!.drawImage(small, 0, 0);
            small.close();
            // WebP keeps see-through stickers see-through; a browser that can't write it gives PNG instead
            const out = shrinker.toDataURL('image/webp', 0.92);
            shrinker.width = 0;
            shrinker.height = 0;
            return out;
          })
          // a browser that can't do this gets the photo as it is
          .catch(() => original.then(toDataUrl));
    photoData.set(key, data);
    // a long book would otherwise keep every photo twice
    if (photoData.size > 12) photoData.delete(photoData.keys().next().value as string);
  }
  return data;
}

// ----- where the SVG pictures are loaded
//
// A document keeps every picture it has loaded for as long as it lives, and
// each of these pictures is a whole page with its fonts and photos, a megabyte
// or two as text. Loaded by the app itself they would stay until the app is
// closed. So they are loaded by a small empty frame instead, which is thrown
// away, with everything it loaded, every few pages and at the end.

const PICTURES_PER_FRAME = 4;
let loader: HTMLIFrameElement | null = null;
let loaded = 0;

function newImage(): HTMLImageElement {
  if (!loader || loaded >= PICTURES_PER_FRAME) {
    loader?.remove();
    loader = document.createElement('iframe');
    loader.setAttribute('aria-hidden', 'true');
    loader.tabIndex = -1;
    loader.style.cssText = 'position:fixed;left:-9999px;top:0;width:10px;height:10px;border:0;visibility:hidden';
    document.body.appendChild(loader);
    loaded = 0;
  }
  loaded++;
  const win = loader.contentWindow as (Window & typeof globalThis) | null;
  return win ? new win.Image() : new Image();
}

// ----- letting go

let canvas: HTMLCanvasElement | null = null;

/**
 * Lets go of everything that was gathered for drawing: after an export, and
 * when one is cancelled. The canvases are emptied and dropped, the frame that
 * loaded the pictures is removed, and the photos, fonts and styles read for
 * the job are forgotten (they are read again next time).
 *
 * What this cannot reach is the browser's own cache of unpacked photos: it
 * fills while pages are drawn, up to a ceiling the browser sets, and the
 * browser alone decides when to empty it. Photos are handed over no larger
 * than they print (see photoAsData) to keep that small.
 */
export function forgetDrawingData(): void {
  photoData.clear();
  fontData.clear();
  styles = null;
  loader?.remove();
  loader = null;
  loaded = 0;
  for (const c of [canvas, shrinker]) {
    if (!c) continue;
    c.width = 0;
    c.height = 0;
  }
  canvas = null;
  shrinker = null;
}

// ----- drawing

export interface Picture {
  type: 'image/jpeg' | 'image/png';
  quality?: number;
}

/**
 * A picture of `node` (which is `w` by `h` CSS pixels on the stage), `pw` by
 * `ph` pixels large. The node must be in the document with its fonts and
 * photos loaded.
 */
export async function drawNode(node: HTMLElement, w: number, h: number, pw: number, ph: number, picture: Picture): Promise<Blob> {
  const from = getComputedStyle(node.parentElement ?? node);
  const copy = node.cloneNode(true) as HTMLElement;
  const shown = Array.from(node.querySelectorAll('img'));
  const images = Array.from(copy.querySelectorAll('img'));
  await Promise.all(
    images.map(async (img, i) => {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('data:')) img.setAttribute('src', await photoAsData(src, shown[i], pw / w).catch(() => ''));
      img.removeAttribute('loading');
    }),
  );

  const doc = document.implementation.createDocument(SVG, 'svg', null);
  const svg = doc.documentElement;
  svg.setAttribute('width', String(pw));
  svg.setAttribute('height', String(ph));
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  const foreign = doc.createElementNS(SVG, 'foreignObject');
  foreign.setAttribute('x', '0');
  foreign.setAttribute('y', '0');
  foreign.setAttribute('width', String(w));
  foreign.setAttribute('height', String(h));
  const root = doc.createElementNS(XHTML, 'div');
  // the same starting point as on screen: the theme, its variables, and the text settings the page inherits
  const theme = document.documentElement.dataset.theme;
  if (theme) root.setAttribute('data-theme', theme);
  const start: string[] = [`width: ${w}px`, `height: ${h}px`, 'position: relative', 'overflow: hidden', 'margin: 0'];
  for (const name of readStyles().customProps) {
    const value = from.getPropertyValue(name);
    if (value) start.push(`${name}: ${value}`);
  }
  for (const name of INHERITED) {
    const value = from.getPropertyValue(name);
    if (value) start.push(`${name}: ${value}`);
  }
  root.setAttribute('style', start.join('; '));
  const style = doc.createElementNS(XHTML, 'style');
  style.textContent = `${await fontsInUse()}\n${stylesFor(node)}`;
  root.appendChild(style);
  root.appendChild(doc.importNode(copy, true));
  foreign.appendChild(root);
  svg.appendChild(foreign);

  const image = newImage();
  image.decoding = 'sync';
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
  await image.decode();

  canvas ??= document.createElement('canvas');
  canvas.width = pw;
  canvas.height = ph;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, pw, ph);
  ctx.drawImage(image, 0, 0, pw, ph);
  // the picture is done with: let its megabyte-long address go now, not when the browser next tidies up
  image.removeAttribute('src');
  // Encoded here and now rather than with toBlob: toBlob keeps a copy of the whole canvas (tens of megabytes) alive
  // until the browser next tidies its memory, which for a long book is far too late.
  const encoded = canvas.toDataURL(picture.type, picture.quality);
  // give the pixels back straight away; the next page asks for its own size
  canvas.width = 0;
  canvas.height = 0;
  const comma = encoded.indexOf(',');
  if (comma < 0 || !encoded.startsWith(`data:${picture.type}`)) throw new Error('This page could not be drawn.');
  const text = atob(encoded.slice(comma + 1));
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
  return new Blob([bytes], { type: picture.type });
}
