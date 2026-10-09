/**
 * Brand logo loader. The generated table (~300 KB of SVG paths) is code-split and loaded once,
 * so first paint never waits on it; tiles show the monogram until it arrives.
 * Each logo is rendered as an <img> data URI so SVG ids (gradients) never clash between tiles.
 */
import { useSyncExternalStore } from 'react';
import type { BrandLogo } from './logo-types';

type Table = Record<string, BrandLogo>;

let table: Table | null = null;
let fallbacks: string[] = [];
let pending: Promise<void> | null = null;
const listeners = new Set<() => void>();
const uriCache = new Map<string, string>();

export function loadLogos(): Promise<void> {
  if (!pending) {
    pending = import('./logos.generated').then((m) => {
      table = m.LOGOS;
      fallbacks = m.LOGO_FALLBACKS;
      listeners.forEach((l) => l());
    });
  }
  return pending;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  void loadLogos();
  return () => listeners.delete(cb);
}

/** Logo table, or null while it loads. */
export function useLogoTable(): Table | null {
  return useSyncExternalStore(subscribe, () => table);
}

export function logoFallbackIds(): string[] {
  return fallbacks;
}

/** perceived luminance 0..1 */
export function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** data: URI for a logo; mono glyphs are drawn in `fill`. */
export function logoUri(id: string, logo: BrandLogo, fill: string): string {
  const key = `${id}|${fill}`;
  const hit = uriCache.get(key);
  if (hit) return hit;
  const inner = logo.mono ? `<g fill="${fill}" style="color:${fill}">${logo.body}</g>` : logo.body;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${logo.vb}">${inner}</svg>`;
  const uri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  uriCache.set(key, uri);
  return uri;
}
