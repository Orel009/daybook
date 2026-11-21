import { useEffect, useState } from 'react';
import { newId } from '../domain/types';
import * as db from './db';

// Photos are stored once as compressed blobs in their own store and referenced
// by id from pages, so page records stay small and a photo used on several
// pages (or in a duplicated page) is not stored twice.

interface AssetRecord {
  id: string;
  blob: Blob;
  w: number;
  h: number;
  createdAt: string;
}

const memory = new Map<string, AssetRecord>(); // also the fallback when nothing can be saved
const urls = new Map<string, string>();

const MAX_SIDE = 1600;

async function compress(file: Blob, maxSide: number): Promise<{ blob: Blob; w: number; h: number }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const encode = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
  // WebP keeps transparency and is small; fall back to JPEG where it can't be written
  let blob = await encode('image/webp');
  if (!blob || blob.type !== 'image/webp') blob = await encode('image/jpeg');
  if (!blob) throw new Error('This image could not be read.');
  return { blob, w, h };
}

export async function addImage(file: Blob, maxSide = MAX_SIDE): Promise<{ id: string; w: number; h: number }> {
  const { blob, w, h } = await compress(file, maxSide);
  const record: AssetRecord = { id: newId(), blob, w, h, createdAt: new Date().toISOString() };
  memory.set(record.id, record);
  await db.put('assets', record).catch((err) => console.error('Could not save photo', err));
  return { id: record.id, w, h };
}

async function load(id: string): Promise<AssetRecord | undefined> {
  const cached = memory.get(id);
  if (cached) return cached;
  const record = await db.get<AssetRecord>('assets', id);
  if (record) memory.set(id, record);
  return record;
}

/** Object URL for a stored photo, or undefined while loading / if missing. */
export function useAssetUrl(id: string | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>(() => (id ? urls.get(id) : undefined));
  useEffect(() => {
    if (!id) return setUrl(undefined);
    const ready = urls.get(id);
    if (ready) return setUrl(ready);
    let live = true;
    void load(id).then((record) => {
      if (!record) return;
      const made = urls.get(id) ?? URL.createObjectURL(record.blob);
      urls.set(id, made);
      if (live) setUrl(made);
    });
    return () => {
      live = false;
    };
  }, [id]);
  return url;
}

const toDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

function fromDataUrl(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(',');
  const type = head.match(/data:(.*?);/)?.[1] ?? 'image/jpeg';
  const bytes = atob(body);
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i);
  return new Blob([buffer], { type });
}

export interface BackupAsset {
  id: string;
  w: number;
  h: number;
  dataUrl: string;
}

export async function exportAssets(ids: string[]): Promise<BackupAsset[]> {
  const out: BackupAsset[] = [];
  for (const id of new Set(ids)) {
    const record = await load(id);
    if (record) out.push({ id, w: record.w, h: record.h, dataUrl: await toDataUrl(record.blob) });
  }
  return out;
}

/** Replaces every stored photo with the ones from a backup. */
export async function importAssets(list: BackupAsset[]): Promise<void> {
  for (const url of urls.values()) URL.revokeObjectURL(url);
  urls.clear();
  memory.clear();
  const records: AssetRecord[] = list.map((a) => ({ id: a.id, w: a.w, h: a.h, blob: fromDataUrl(a.dataUrl), createdAt: new Date().toISOString() }));
  for (const r of records) memory.set(r.id, r);
  await db.replaceAll({ assets: records }).catch((err) => console.error('Could not restore photos', err));
}

/** Deletes photos no page uses any more. Called on start-up and when a page is deleted. */
export async function removeUnusedAssets(used: Set<string>): Promise<void> {
  const stored = new Set([...(await db.keys('assets')), ...memory.keys()]);
  for (const id of stored) {
    if (used.has(id)) continue;
    memory.delete(id);
    const url = urls.get(id);
    if (url) URL.revokeObjectURL(url);
    urls.delete(id);
    await db.remove('assets', id).catch(() => undefined);
  }
}
