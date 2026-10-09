import { getPlatform } from '@akaya/affiliate';
import type { StoreId } from '../api/types';

export const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
export const compact = (n: number) =>
  n >= 100000
    ? `${(n / 100000).toFixed(1).replace(/\.0$/, '')}L`
    : n >= 1000
      ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
      : String(n);
export const days = (d: number) => (d <= 0 ? 'Today' : d === 1 ? 'Tomorrow' : `${d} days`);
export function ago(t: number, now: number) {
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}
export const BADGES = {
  best_price: { label: 'Best price', cls: 'b-price', icon: 'rupee' },
  best_rated: { label: 'Best rated', cls: 'b-rated', icon: 'star' },
  best_value: { label: 'Best value', cls: 'b-value', icon: 'spark' },
  fastest: { label: 'Fastest', cls: 'b-fast', icon: 'truck' },
} as const;
/** store name / brand colour / monogram, from the shared platform registry */
export function storeMeta(id: string): { name: string; color: string; mono: string } {
  const p = getPlatform(id);
  return p ? { name: p.name, color: p.color, mono: p.mono } : { name: 'Other store', color: '#64748b', mono: '•' };
}
/** stores the agent searches (filter chips) */
export const STORE_IDS: StoreId[] = [
  'amazon',
  'flipkart',
  'myntra',
  'meesho',
  'croma',
  'ajio',
  'reliance-digital',
  'tatacliq',
  'nykaa',
];
