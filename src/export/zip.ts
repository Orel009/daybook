// A plain ZIP file with nothing compressed (PNG pictures are compressed
// already), to save several pictures as one download.

const TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const u16 = (v: number) => [v & 0xff, (v >>> 8) & 0xff];
const u32 = (v: number) => [v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff];

/** Files with the same name get " (2)", " (3)"… before the ending. */
export function uniqueNames(names: string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((name) => {
    const n = (seen.get(name.toLowerCase()) ?? 0) + 1;
    seen.set(name.toLowerCase(), n);
    if (n === 1) return name;
    const dot = name.lastIndexOf('.');
    return dot > 0 ? `${name.slice(0, dot)} (${n})${name.slice(dot)}` : `${name} (${n})`;
  });
}

export async function zip(files: { name: string; blob: Blob }[]): Promise<Blob> {
  const encoder = new TextEncoder();
  const names = uniqueNames(files.map((f) => f.name));
  const parts: BlobPart[] = [];
  const central: number[] = [];
  let offset = 0;
  for (let i = 0; i < files.length; i++) {
    const name = encoder.encode(names[i]);
    const data = new Uint8Array(await files[i].blob.arrayBuffer());
    const crc = crc32(data);
    // version 2.0, UTF-8 names (bit 11), stored, no date
    const head = [...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0)];
    parts.push(new Uint8Array([...u32(0x04034b50), ...head, ...name]), data);
    central.push(...u32(0x02014b50), ...u16(20), ...head, ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset), ...name);
    offset += 30 + name.length + data.length;
  }
  parts.push(new Uint8Array(central), new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(central.length), ...u32(offset), ...u16(0)]));
  return new Blob(parts, { type: 'application/zip' });
}
