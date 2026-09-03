import fs from 'node:fs';
import path from 'node:path';

/**
 * The 29 product photographs are dropped into /public/products by filename.
 * Until a given file exists, every component that would show it renders an
 * elegant typeset placeholder instead.
 *
 * The alternative — shipping a broken <img> and letting the browser draw its
 * own icon — makes a page look unfinished in exactly the way a manufacturer's
 * site cannot afford. This makes the gap look deliberate.
 *
 * Checked at build time, so there is no client-side flash and no runtime cost.
 */
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const cache = new Map<string, boolean>();

export function photoExists(src: string | undefined | null): boolean {
  if (!src) return false;
  if (cache.has(src)) return cache.get(src)!;
  const clean = src.split('?')[0].replace(/^\//, '');
  let exists = false;
  try {
    exists = fs.existsSync(path.join(PUBLIC_DIR, clean));
  } catch {
    exists = false;
  }
  cache.set(src, exists);
  return exists;
}

/** Every image path the site expects, for the readiness report. */
export function missingPhotos(paths: string[]): string[] {
  return [...new Set(paths)].filter((p) => !photoExists(p));
}
