// A small PDF writer: pages of any size, each made of pictures placed by
// position (and optionally turned a quarter), flat areas of colour and
// hairlines. It writes the file piece by piece into a list of blobs, so a long
// book is never held in memory as one block: each page's picture is handed to
// the browser as soon as it is made.
//
// Sizes come in millimetres from the top left of the page, as in layout.ts;
// PDF itself counts in points from the bottom left.

const PT = 72 / 25.4;
const n2 = (v: number) => String(Math.round(v * 100) / 100);

export interface PdfBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PdfImage {
  /** A JPEG as the browser's canvas makes it. */
  jpeg: Blob;
  /** Its size in pixels. */
  pw: number;
  ph: number;
  /** Where it goes on the page, in millimetres. */
  box: PdfBox;
  /** Turned a quarter anticlockwise: the picture's top is at the left of its box. */
  turned?: boolean;
}

export interface PdfPage {
  w: number;
  h: number;
  /** Where the page is cut, for print shops (TrimBox). The whole page is then the bleed box. */
  trim?: PdfBox;
  images: PdfImage[];
  fills?: (PdfBox & { color: string })[];
  marks?: { x1: number; y1: number; x2: number; y2: number }[];
}

/** A PDF text string for a title: UTF-16 in hex, so any character survives. */
export function pdfText(text: string): string {
  let hex = 'FEFF';
  for (let i = 0; i < text.length; i++) hex += text.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0');
  return `<${hex}>`;
}

/** D:YYYYMMDDHHmmSSZ */
export const pdfDate = (d: Date) => `(D:${d.toISOString().replace(/[-:T]/g, '').slice(0, 14)}Z)`;

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => n2(c / 255)).join(' ');
};

/** The drawing instructions for one page. Exported for the tests. */
export function pageContent(page: PdfPage, imageNames: string[]): string {
  const H = page.h;
  const out: string[] = [];
  // fills are drawn first and run a hair under the pictures beside them, so no white line can show between the two
  const under = 0.25;
  for (const f of page.fills ?? []) out.push(`${rgb(f.color)} rg ${n2((f.x - under) * PT)} ${n2((H - f.y - f.h - under) * PT)} ${n2((f.w + 2 * under) * PT)} ${n2((f.h + 2 * under) * PT)} re f`);
  page.images.forEach((im, i) => {
    const x = im.box.x * PT;
    const y = (H - im.box.y - im.box.h) * PT;
    const w = im.box.w * PT;
    const h = im.box.h * PT;
    // a picture is one unit square; this stretches it over its box, turned or not
    const matrix = im.turned ? `0 ${n2(h)} ${n2(-w)} 0 ${n2(x + w)} ${n2(y)}` : `${n2(w)} 0 0 ${n2(h)} ${n2(x)} ${n2(y)}`;
    out.push(`q ${matrix} cm /${imageNames[i]} Do Q`);
  });
  if (page.marks?.length) {
    out.push('0.2 0.2 0.2 RG 0.5 w');
    for (const m of page.marks) out.push(`${n2(m.x1 * PT)} ${n2((H - m.y1) * PT)} m ${n2(m.x2 * PT)} ${n2((H - m.y2) * PT)} l S`);
  }
  return out.join('\n');
}

export class PdfWriter {
  private parts: BlobPart[] = [];
  private length = 0;
  /** Byte position of each object, by its number (1 is the catalogue, 2 the list of pages). */
  private offsets: number[] = [0, 0, 0];
  private pageRefs: number[] = [];
  private encoder = new TextEncoder();

  constructor() {
    // the second line holds four high bytes so the file is treated as binary
    this.push(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));
  }

  get pageCount(): number {
    return this.pageRefs.length;
  }

  /** How many bytes have been written so far. */
  get size(): number {
    return this.length;
  }

  private push(part: Uint8Array<ArrayBuffer> | Blob): void {
    this.parts.push(part);
    this.length += part instanceof Blob ? part.size : part.byteLength;
  }

  private text(s: string): void {
    this.push(this.encoder.encode(s) as Uint8Array<ArrayBuffer>);
  }

  private reserve(): number {
    this.offsets.push(0);
    return this.offsets.length - 1;
  }

  private begin(num: number): void {
    this.offsets[num] = this.length;
    this.text(`${num} 0 obj\n`);
  }

  private object(num: number, body: string): void {
    this.begin(num);
    this.text(`${body}\nendobj\n`);
  }

  private stream(num: number, dict: string, data: Uint8Array<ArrayBuffer> | Blob): void {
    const size = data instanceof Blob ? data.size : data.byteLength;
    this.begin(num);
    this.text(`<< ${dict} /Length ${size} >>\nstream\n`);
    this.push(data);
    this.text('\nendstream\nendobj\n');
  }

  addPage(page: PdfPage): void {
    const names = page.images.map((_, i) => `Im${i + 1}`);
    const refs = page.images.map((im) => {
      const num = this.reserve();
      this.stream(num, `/Type /XObject /Subtype /Image /Width ${im.pw} /Height ${im.ph} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`, im.jpeg);
      return num;
    });
    const content = this.reserve();
    this.stream(content, '', this.encoder.encode(pageContent(page, names)) as Uint8Array<ArrayBuffer>);
    const num = this.reserve();
    const W = n2(page.w * PT);
    const H = n2(page.h * PT);
    const boxes = [`/MediaBox [0 0 ${W} ${H}]`];
    if (page.trim) {
      const t = page.trim;
      boxes.push(`/BleedBox [0 0 ${W} ${H}]`);
      boxes.push(`/TrimBox [${n2(t.x * PT)} ${n2((page.h - t.y - t.h) * PT)} ${n2((t.x + t.w) * PT)} ${n2((page.h - t.y) * PT)}]`);
    }
    const xobjects = names.map((name, i) => `/${name} ${refs[i]} 0 R`).join(' ');
    this.object(num, `<< /Type /Page /Parent 2 0 R ${boxes.join(' ')} /Resources << /XObject << ${xobjects} >> >> /Contents ${content} 0 R >>`);
    this.pageRefs.push(num);
  }

  /** Closes the file and returns it. */
  finish(info: { title: string; created?: Date }): Blob {
    const infoNum = this.reserve();
    this.object(infoNum, `<< /Title ${pdfText(info.title)} /Producer (Daybook) /Creator (Daybook) /CreationDate ${pdfDate(info.created ?? new Date())} >>`);
    this.object(1, '<< /Type /Catalog /Pages 2 0 R >>');
    this.object(2, `<< /Type /Pages /Count ${this.pageRefs.length} /Kids [${this.pageRefs.map((r) => `${r} 0 R`).join(' ')}] >>`);
    const start = this.length;
    const count = this.offsets.length;
    let xref = `xref\n0 ${count}\n0000000000 65535 f \n`;
    for (let i = 1; i < count; i++) xref += `${String(this.offsets[i]).padStart(10, '0')} 00000 n \n`;
    this.text(`${xref}trailer\n<< /Size ${count} /Root 1 0 R /Info ${infoNum} 0 R >>\nstartxref\n${start}\n%%EOF\n`);
    return new Blob(this.parts, { type: 'application/pdf' });
  }
}
