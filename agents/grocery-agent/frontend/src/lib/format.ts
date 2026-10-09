import { getPlatform } from '@akaya/affiliate';
import type { StoreId, Strategy, Unit } from '../api/types';

export const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

const trim = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
/** mirrors backend formatQty */
export function formatQty(qty: number, unit: Unit, dozenItem = false): string {
  if (unit === 'g') return qty >= 1000 ? `${trim(qty / 1000)} kg` : `${trim(qty)} g`;
  if (unit === 'ml') return qty >= 1000 ? `${trim(qty / 1000)} L` : `${trim(qty)} ml`;
  if (dozenItem && qty % 12 === 0) return `${qty / 12} dozen`;
  return `${trim(qty)} pcs`;
}
export const DOZEN = new Set(['eggs', 'banana']);
/** sensible +/- step for a quantity */
export function stepFor(key: string, qty: number, unit: Unit) {
  if (unit === 'pc') return key === 'eggs' ? 6 : 1;
  return qty < 1000 ? 250 : 500;
}

const IST = 'Asia/Kolkata';
export const istTime = (t: number | string) =>
  new Date(t).toLocaleTimeString('en-IN', { timeZone: IST, hour: 'numeric', minute: '2-digit' }).toUpperCase();
export const istDay = (t: number | string) =>
  new Date(t).toLocaleDateString('en-IN', { timeZone: IST, weekday: 'short', day: 'numeric', month: 'short' });
export const istWhen = (t: number | string) => `${istDay(t)}, ${istTime(t)} IST`;
export function ago(t: number, now: number) {
  const m = Math.round((now - t) / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
}
export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function hhmm12(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

export const STRATEGY: Record<Strategy, { label: string; short: string }> = {
  balanced: { label: 'Best overall', short: 'Best' },
  cheapest: { label: 'Cheapest', short: 'Cheapest' },
  fastest: { label: 'Fastest', short: 'Fastest' },
  split: { label: 'Split stores', short: 'Split' },
};

/** store display data from the shared platform registry */
const STORE_ID_LIST: StoreId[] = ['instamart', 'blinkit', 'zepto', 'bigbasket', 'amazon-fresh'];
export const STORES = Object.fromEntries(
  STORE_ID_LIST.map((s) => {
    const p = getPlatform(s)!;
    return [
      s,
      {
        name: p.name,
        short: p.short ?? p.name,
        color: p.color,
        ink: p.ink ?? '#fff',
        mono: p.mono,
        mode: p.delivery ?? 'slot',
      },
    ];
  }),
) as Record<StoreId, { name: string; short: string; color: string; ink: string; mono: string; mode: 'quick' | 'slot' }>;
export const STORE_IDS = STORE_ID_LIST;
