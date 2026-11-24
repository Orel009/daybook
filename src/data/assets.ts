import { useEffect, useState } from 'react';
import { newId } from '../domain/types';
import * as db from './db';
import { markDirty } from './outbox';
import { keepsPrintPhotos, PRINT_SIDE, printPhoto, removeAllPrintPhotos, removePrintPhoto, savePrintPhoto } from './printPhotos';

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
// Copies sent to the cloud are smaller, to stay well inside the free storage.
const CLOUD_SIDE = 1200;
const CLOUD_QUALITY = 0.8;

// Pages that show a photo still downloading wait for it here.
const arrivals = new Set<(id: string) => void>();

async function compress(file: Blob, maxSide: number, quality = 0.85): Promise<{ blob: Blob; w: number; h: number }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const encode = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
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
  void markDirty('asset', record.id);
  // for printing: a larger copy that stays on this device, if she asked for that and the photo has more to give
  if (maxSide === MAX_SIDE && keepsPrintPhotos()) {
    try {
      const big = await compress(file, PRINT_SIDE, 0.9);
      if (Math.max(big.w, big.h) > Math.max(w, h)) await savePrintPhoto({ id: record.id, blob: big.blob, w: big.w, h: big.h });
    } catch {
      /* the page copy is saved; printing uses that */
    }
  }
  return { id: record.id, w, h };
}

async function load(id: string): Promise<AssetRecord | undefined> {
  const cached = memory.get(id);
  if (cached) return cached;
  const record = await db.get<AssetRecord>('assets', id);
  if (record) memory.set(id, record);
  return record;
}

/** The size in pixels of the best copy of a photo on this device (`print`: a print-quality copy), or undefined if there is none. */
export const assetSize = async (id: string): Promise<{ w: number; h: number; print: boolean } | undefined> => {
  const big = await printPhoto(id);
  if (big) return { w: big.w, h: big.h, print: true };
  const record = await load(id);
  return record && { w: record.w, h: record.h, print: false };
};

/**
 * Where a page's photos come from when it isn't one of this book's own pages:
 * a page someone shares with this account, or a public link. `ns` keeps their
 * object URLs apart from the book's own photos.
 */
export interface PhotoSource {
  ns: string;
  load: (id: string) => Promise<Blob | undefined>;
}

const ownPhotos: PhotoSource = { ns: '', load: async (id) => (await load(id))?.blob };

/** For printing and exporting: the print-quality copy of a photo where there is one, otherwise the photo as the page has it. */
export const bestPhotos: PhotoSource = { ns: 'best', load: async (id) => (await printPhoto(id))?.blob ?? (await load(id))?.blob };

/** Lets go of the addresses made for a source's photos (after an export: its large copies need not stay in memory). */
export function releasePhotoUrls(ns: string): void {
  for (const [key, url] of urls) {
    if (!key.startsWith(`${ns}:`)) continue;
    URL.revokeObjectURL(url);
    urls.delete(key);
  }
}

/** Object URL for a stored photo, or undefined while loading / if missing. */
export function useAssetUrl(id: string | undefined, source: PhotoSource = ownPhotos): string | undefined {
  const key = id ? `${source.ns}:${id}` : '';
  const [url, setUrl] = useState<string | undefined>(() => (key ? urls.get(key) : undefined));
  useEffect(() => {
    if (!id) return setUrl(undefined);
    const ready = urls.get(key);
    if (ready) return setUrl(ready);
    let live = true;
    const show = () =>
      source.load(id).then((blob) => {
        if (!blob) return false;
        const made = urls.get(key) ?? URL.createObjectURL(blob);
        urls.set(key, made);
        if (live) setUrl(made);
        return true;
      });
    // Not on this device yet (still syncing): show it as soon as it arrives.
    const waiting = (arrived: string) => arrived === key && void show();
    void show().then((found) => found || arrivals.add(waiting));
    return () => {
      live = false;
      arrivals.delete(waiting);
    };
  }, [key, id, source]);
  return url;
}

/** Tells pages waiting for a photo from another source that it has arrived. */
export const photoArrived = (ns: string, id: string) => {
  for (const fn of arrivals) fn(`${ns}:${id}`);
};

/** A received copy's photo, saved as this book's own (new id, synced like any photo). */
export async function addReceivedPhoto(blob: Blob, w: number, h: number): Promise<string> {
  const record: AssetRecord = { id: newId(), blob, w, h, createdAt: new Date().toISOString() };
  memory.set(record.id, record);
  await db.put('assets', record);
  void markDirty('asset', record.id);
  return record.id;
}

/** base64 from the Data API back to a picture. */
export const blobFromBase64 = (mime: string, data: string) => fromDataUrl(`data:${mime};base64,${data}`);

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
  await removeAllPrintPhotos(); // they belonged to the photos that were replaced
}

/**
 * Deletes photos no page uses any more. Called on start-up and when a page is
 * deleted. Only the second also deletes them from the cloud (`fromCloud`): at
 * start-up a photo may have arrived before the page that uses it.
 */
export async function removeUnusedAssets(used: Set<string>, fromCloud = false): Promise<void> {
  for (const id of await localAssetIds()) {
    if (used.has(id)) continue;
    await deleteLocalAsset(id);
    if (fromCloud) void markDirty('asset', id);
  }
}

// ---------- cloud sync ----------

export const localAssetIds = async (): Promise<Set<string>> => new Set([...(await db.keys('assets')), ...memory.keys()]);

export async function deleteLocalAsset(id: string): Promise<void> {
  memory.delete(id);
  const url = urls.get(id);
  if (url) URL.revokeObjectURL(url);
  urls.delete(id);
  await db.remove('assets', id).catch(() => undefined);
  await removePrintPhoto(id);
}

export interface CloudAsset {
  id: string;
  mime: string;
  w: number;
  h: number;
  data: string; // base64
}

/** A smaller copy of a stored photo for upload, or undefined if it isn't on this device. */
export async function encodeForCloud(id: string): Promise<CloudAsset | undefined> {
  const record = await load(id);
  if (!record) return undefined;
  // If the browser can't re-encode it, send the stored copy rather than nothing.
  const { blob, w, h } = await compress(record.blob, CLOUD_SIDE, CLOUD_QUALITY).catch(() => record);
  const dataUrl = await toDataUrl(blob);
  return { id, mime: blob.type, w, h, data: dataUrl.slice(dataUrl.indexOf(',') + 1) };
}

/** Saves a photo downloaded from the cloud and shows it wherever it is waited for. */
export async function storeCloudAsset(a: CloudAsset): Promise<void> {
  const record: AssetRecord = { id: a.id, w: a.w, h: a.h, blob: fromDataUrl(`data:${a.mime};base64,${a.data}`), createdAt: new Date().toISOString() };
  memory.set(record.id, record);
  await db.put('assets', record);
  photoArrived('', record.id);
}

/** Forgets every photo held in memory (after the local data is cleared). */
export function forgetAllAssets(): void {
  for (const url of urls.values()) URL.revokeObjectURL(url);
  urls.clear();
  memory.clear();
  void removeAllPrintPhotos();
}
