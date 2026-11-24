import { describe, expect, it } from 'vitest';
import { pageContent, pdfDate, pdfText, PdfWriter, type PdfPage } from './pdf';

const PT = 72 / 25.4;
const jpeg = (bytes: number) => new Blob([new Uint8Array(bytes).fill(7)], { type: 'image/jpeg' });
const latin1 = async (blob: Blob) => new TextDecoder('latin1').decode(await blob.arrayBuffer());

const a4: PdfPage = { w: 210, h: 297, images: [{ jpeg: jpeg(500), pw: 1654, ph: 2205, box: { x: 8, y: 9, w: 194, h: 258.67 } }] };
const wide: PdfPage = { w: 297, h: 210, images: [{ jpeg: jpeg(300), pw: 2000, ph: 1500, box: { x: 10, y: 8, w: 277, h: 194 } }] };

describe('the PDF writer', () => {
  it('writes a file whose table of contents points exactly at every object', async () => {
    const pdf = new PdfWriter();
    pdf.addPage(a4);
    pdf.addPage(wide);
    const text = await latin1(pdf.finish({ title: 'My book', created: new Date(Date.UTC(2026, 10, 23, 9, 30, 5)) }));
    expect(text.startsWith('%PDF-1.4\n')).toBe(true);
    expect(text.trimEnd().endsWith('%%EOF')).toBe(true);
    const start = Number(/startxref\n(\d+)\n%%EOF/.exec(text)![1]);
    expect(text.slice(start, start + 5)).toBe('xref\n');
    const table = text.slice(start).split('\n');
    const count = Number(table[1].split(' ')[1]);
    expect(table[2]).toBe('0000000000 65535 f ');
    for (let i = 1; i < count; i++) {
      const offset = Number(table[2 + i].slice(0, 10));
      expect(table[2 + i].length, `entry ${i}`).toBe(19); // 20 bytes with its line end
      expect(text.slice(offset, offset + `${i} 0 obj`.length), `object ${i}`).toBe(`${i} 0 obj`);
    }
    expect(new RegExp(`/Size ${count} /Root 1 0 R`).test(text)).toBe(true);
    // two pages, each with a picture and its instructions: 2 x 3 objects, plus catalogue, page list and info
    expect(count - 1).toBe(9);
    expect(/\/Type \/Pages \/Count 2 \/Kids \[(\d+) 0 R (\d+) 0 R\]/.test(text)).toBe(true);
  });
  it('gives each page its own size, so tall and wide pages share one file', async () => {
    const pdf = new PdfWriter();
    pdf.addPage(a4);
    pdf.addPage(wide);
    expect(pdf.pageCount).toBe(2);
    const text = await latin1(pdf.finish({ title: 't' }));
    const boxes = [...text.matchAll(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/g)].map((m) => [Number(m[1]), Number(m[2])]);
    expect(boxes).toEqual([[595.28, 841.89], [841.89, 595.28]]);
    expect(text.includes('/TrimBox')).toBe(false);
  });
  it('stores each picture untouched, with its length', async () => {
    const pdf = new PdfWriter();
    pdf.addPage(a4);
    const blob = pdf.finish({ title: 't' });
    const text = await latin1(blob);
    expect(text).toContain('/Subtype /Image /Width 1654 /Height 2205 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length 500 >>\nstream\n');
    const at = text.indexOf('stream\n') + 7;
    expect(text.slice(at, at + 500)).toBe('\x07'.repeat(500));
    expect(text.slice(at + 500, at + 500 + 11)).toBe('\nendstream\n');
    expect(blob.type).toBe('application/pdf');
  });
  it('marks where a print-ready page is cut: trim box inside, bleed box to the edge', async () => {
    const pdf = new PdfWriter();
    pdf.addPage({ w: 209.55, h: 260.35, trim: { x: 3.175, y: 3.175, w: 203.2, h: 254 }, images: [] });
    const text = await latin1(pdf.finish({ title: 't' }));
    expect(text).toContain('/MediaBox [0 0 594 738]');
    expect(text).toContain('/BleedBox [0 0 594 738]');
    expect(text).toContain('/TrimBox [9 9 585 729]'); // 0.125 in = 9 pt; 8 x 10 in = 576 x 720 pt
  });
  it('the size of the file so far is known while it is being written', () => {
    const pdf = new PdfWriter();
    const before = pdf.size;
    pdf.addPage(a4);
    expect(pdf.size).toBeGreaterThan(before + 500);
  });
});

describe('placing things on a page', () => {
  it('counts from the bottom left in points: a picture goes where its box is', () => {
    const c = pageContent(a4, ['Im1']);
    const y = (297 - 9 - 258.67) * PT;
    expect(c).toBe(`q ${(194 * PT).toFixed(2)} 0 0 ${(258.67 * PT).toFixed(2)} ${(8 * PT).toFixed(2)} ${y.toFixed(2)} cm /Im1 Do Q`);
  });
  it('a turned picture is rotated a quarter anticlockwise inside its box', () => {
    const page: PdfPage = { w: 100, h: 200, images: [{ jpeg: jpeg(1), pw: 4, ph: 3, box: { x: 10, y: 20, w: 60, h: 80 }, turned: true }] };
    const [, a, b, c, d, e, f] = /q (\S+) (\S+) (\S+) (\S+) (\S+) (\S+) cm/.exec(pageContent(page, ['Im1']))!.map(Number);
    const at = (x: number, y: number) => [a * x + c * y + e, b * x + d * y + f].map((v) => Math.round((v / PT) * 100) / 100);
    // the picture's bottom left lands on the box's bottom right, its top left on the box's bottom left... seen from the top left of the page:
    expect(at(0, 0)).toEqual([70, 100]); // bottom right of the box (y measured up from the bottom: 200 - 20 - 80)
    expect(at(0, 1)).toEqual([10, 100]); // the picture's top edge runs down the left side of the box
    expect(at(1, 1)).toEqual([10, 180]);
    expect(at(1, 0)).toEqual([70, 180]);
  });
  it('fills come first (under the pictures), marks last, in the right colours', () => {
    const page: PdfPage = { w: 100, h: 50, images: [{ jpeg: jpeg(1), pw: 1, ph: 1, box: { x: 0, y: 0, w: 40, h: 50 } }], fills: [{ x: 40, y: 0, w: 10, h: 50, color: '#FF8000' }], marks: [{ x1: 40, y1: 0, x2: 40, y2: 3 }] };
    const lines = pageContent(page, ['Im1']).split('\n');
    // a quarter of a millimetre wider all round, so it tucks under the picture beside it
    expect(lines[0]).toBe(`1 0.5 0 rg ${(39.75 * PT).toFixed(2)} ${(-0.25 * PT).toFixed(2)} ${(10.5 * PT).toFixed(2)} ${(50.5 * PT).toFixed(2)} re f`);
    expect(lines[1].endsWith('/Im1 Do Q')).toBe(true);
    expect(lines[2]).toBe('0.2 0.2 0.2 RG 0.5 w');
    expect(lines[3]).toBe(`${(40 * PT).toFixed(2)} ${(50 * PT).toFixed(2)} m ${(40 * PT).toFixed(2)} ${(47 * PT).toFixed(2)} l S`);
  });
});

describe('text in the file', () => {
  it('titles are written so any letter survives', () => {
    expect(pdfText('Ab')).toBe('<FEFF00410062>');
    expect(pdfText('é☀')).toBe('<FEFF00E92600>');
  });
  it('dates are written the PDF way', () => {
    expect(pdfDate(new Date(Date.UTC(2026, 10, 23, 9, 30, 5)))).toBe('(D:20261123093005Z)');
  });
});
