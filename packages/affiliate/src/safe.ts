/** Input validation + encoding. Every builder goes through these so links are always URL-safe. */
import { LinkError, type LinkParams } from './types.js';

export const enc = encodeURIComponent;

/** trimmed text, max 200 chars, control characters removed */
export function text(v: string | undefined, max = 200): string | null {
  if (typeof v !== 'string') return null;
  // eslint-disable-next-line no-control-regex
  const t = v
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
  return t || null;
}

/** "Tata Cliq!" → "tata-cliq" */
export function slug(v: string | undefined): string | null {
  const t = text(v);
  if (!t) return null;
  const s = t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return s || null;
}

/** platform product ids: letters, digits, dot, dash, underscore */
export function id(v: string | undefined): string | null {
  return typeof v === 'string' && /^[A-Za-z0-9._-]{1,64}$/.test(v) ? v : null;
}

export function iata(v: string | undefined): string | null {
  const t = typeof v === 'string' ? v.trim().toUpperCase() : '';
  return /^[A-Z]{3}$/.test(t) ? t : null;
}

/** YYYY-MM-DD that is a real calendar date → [y, m, d] */
export function ymd(v: string | undefined): [string, string, string] | null {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) return null;
  const [y, m, dd] = v.split('-');
  return [y, m, dd];
}

export function adults(p: LinkParams): number {
  const n = Math.floor(Number(p.adults ?? 2));
  return Number.isFinite(n) ? Math.min(Math.max(n, 1), 9) : 2;
}

export function coord(v: number | undefined, limit: number): string | null {
  return typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= limit ? v.toFixed(6) : null;
}

/** A supplied product URL must be HTTPS on one of the platform's hosts (blocks open redirects). */
export function ownUrl(v: string | undefined, hosts: string[]): string | null {
  if (typeof v !== 'string') return null;
  let u: URL;
  try {
    u = new URL(v);
  } catch {
    throw new LinkError('url is not a valid URL');
  }
  const ok = u.protocol === 'https:' && hosts.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`));
  if (!ok) throw new LinkError(`url must be https on ${hosts.join(', ')}`);
  return u.toString();
}

/** build a query string from defined values only */
export function qs(pairs: Record<string, string | number | null | undefined>): string {
  return Object.entries(pairs)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${enc(k)}=${enc(String(v))}`)
    .join('&');
}
