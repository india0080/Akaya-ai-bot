import { createHmac, randomBytes } from 'node:crypto';

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
export const SHORT_ID = /^[0-9A-Za-z]{7}$/;

/** 7-char base62 id (~3.5e12 space) */
export function shortId(): string {
  const bytes = randomBytes(7);
  return Array.from(bytes, (b) => ALPHABET[b % 62]).join('');
}

/** anonymous install id → stable, non-reversible token (null when absent or malformed) */
export function anonToken(raw: unknown, salt: string): string | null {
  if (typeof raw !== 'string' || !/^[A-Za-z0-9_-]{8,64}$/.test(raw)) return null;
  return createHmac('sha256', salt).update(raw).digest('hex').slice(0, 16);
}

/** YYYY-MM-DD in IST */
export const istDate = (ts: number) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(ts);
