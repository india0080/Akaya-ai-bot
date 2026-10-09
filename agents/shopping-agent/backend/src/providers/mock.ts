/**
 * MockProvider: realistic SAMPLE offers in INR across Indian stores, so the agent runs with no keys.
 * Every offer is `sample: true` and the UI labels it. Prices drift slowly so price alerts can fire.
 */
import { STORES, type Offer, type StoreId } from '../types.js';
import { rng, indianPrice, hash } from '@akaya/server-kit';
import { storeSearchUrl } from '../engine/affiliate.js';
import { CATALOG, GENERIC_BRANDS, type CategoryDef, type Template } from './mockCatalog.js';
import type { PricePoint, SearchOptions, ShoppingProvider } from './types.js';

const STORE_PRICE: Partial<Record<StoreId, number>> = {
  meesho: 0.9,
  croma: 1.03,
  'reliance-digital': 1.02,
  tatacliq: 1.01,
  ajio: 0.98,
};
const STORE_DAYS: Record<StoreId, [number, number]> = {
  amazon: [1, 3],
  flipkart: [2, 4],
  myntra: [3, 5],
  meesho: [5, 8],
  croma: [1, 3],
  ajio: [4, 6],
  'reliance-digital': [2, 4],
  tatacliq: [3, 6],
  nykaa: [3, 5],
  other: [4, 7],
};
const STORE_SHARE: Partial<Record<StoreId, number>> = {
  amazon: 0.46,
  flipkart: 0.34,
  myntra: 0.16,
  meesho: 0.12,
  ajio: 0.08,
};
const SELLERS: Record<StoreId, string[]> = {
  amazon: ['Cocoblu Retail', 'Appario Retail', 'RetailEZ', 'Clicktech Retail'],
  flipkart: ['RetailNet', 'SuperComNet', 'OmniTechRetail', 'TrueComRetail'],
  myntra: ['Myntra (brand store)', 'Vision Star', 'Omnitech Retail'],
  meesho: ['Supplier #48213', 'Supplier #10977', 'Supplier #77120'],
  croma: ['Croma'],
  ajio: ['AJIO (brand store)', 'Reliance Retail'],
  'reliance-digital': ['Reliance Digital'],
  tatacliq: ['Tata CLiQ (brand store)', 'Tatacliq Seller'],
  nykaa: ['Nykaa'],
  other: ['Marketplace seller'],
};
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
const r1 = (n: number) => Math.round(n * 10) / 10;

function histogramFor(rating: number, suspicious: boolean): number[] {
  if (suspicious) return [0.78, 0.04, 0.02, 0.03, 0.13];
  // simple shape whose mean ≈ rating
  const five = clamp((rating - 3) * 0.42, 0.18, 0.75);
  const one = clamp((4.6 - rating) * 0.07, 0.02, 0.14);
  const rest = 1 - five - one;
  const h = [five, rest * 0.5, rest * 0.3, rest * 0.2, one];
  return h.map((x) => Math.round(x * 1000) / 1000);
}

export function makeOffer(t: Template, cat: Pick<CategoryDef, 'id' | 'emoji'>, store: StoreId, drift = 1): Offer {
  const r = rng(`${t.key}:${store}`);
  const price = indianPrice(t.base * (0.93 + r() * 0.14) * (STORE_PRICE[store] ?? 1) * drift);
  const sus = !!t.suspicious;
  const ratingCount = Math.max(12, Math.round(t.ratings * (STORE_SHARE[store] ?? 0.1) * (0.7 + r() * 0.6)));
  const [d0, d1] = STORE_DAYS[store];
  const sellers = SELLERS[store];
  return {
    id: `mock:${store}:${t.key}`,
    productKey: t.key,
    store,
    storeName: STORES[store].name,
    title: t.title,
    brand: t.brand,
    category: cat.id,
    emoji: cat.emoji,
    price,
    mrp: Math.max(price, t.mrp),
    currency: 'INR',
    rating: r1(clamp(t.rating + (r() - 0.5) * 0.3, 1, 5)),
    ratingCount,
    reviewCount: Math.round(ratingCount * (sus ? 0.68 + r() * 0.1 : 0.08 + r() * 0.1)),
    histogram: histogramFor(t.rating, sus),
    verifiedShare: r1(sus ? 0.35 + r() * 0.15 : 0.8 + r() * 0.15),
    recentShare: Math.round((sus ? 0.55 + r() * 0.15 : 0.04 + r() * 0.08) * 100) / 100,
    seller: {
      name: sus ? 'Supplier #' + (10000 + (hash(t.key + store) % 89999)) : sellers[Math.floor(r() * sellers.length)],
      rating: r1(sus ? 3.4 + r() * 0.4 : 4.1 + r() * 0.8),
      years: sus ? r1(0.3 + r() * 0.6) : Math.round(2 + r() * 8),
      fulfilled: !sus && (store === 'amazon' || store === 'flipkart' ? r() > 0.25 : store !== 'meesho'),
    },
    delivery: {
      days: d0 + Math.floor(r() * (d1 - d0 + 1)),
      free: price > 499 || store === 'meesho',
      cod: store !== 'tatacliq' || price < 20000,
    },
    inStock: r() > 0.06,
    url: storeSearchUrl(store, t.title),
    specs: t.specs ?? {},
    source: 'mock',
    sample: true,
  };
}

function tokens(s: string) {
  return s
    .toLowerCase()
    .normalize('NFC')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

/** Categories that match the query; empty when nothing matches. */
export function matchCategories(q: string): CategoryDef[] {
  const ql = q.toLowerCase();
  const toks = tokens(q);
  const scored = CATALOG.map((c) => {
    let s = 0;
    for (const k of c.keywords) if (ql.includes(k)) s += k.includes(' ') ? 3 : 2;
    for (const it of c.items) if (toks.some((t) => t.length > 2 && it.brand.toLowerCase() === t)) s += 1;
    return { c, s };
  });
  return scored
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.c);
}

function genericCategory(q: string): CategoryDef {
  const label = q.trim().replace(/\s+/g, ' ');
  const r = rng('generic:' + label);
  const base = 299 + Math.floor(r() * 2400);
  const all: StoreId[] = ['amazon', 'flipkart', 'meesho', 'tatacliq', 'myntra'];
  return {
    id: 'general',
    label,
    emoji: '🛍️',
    keywords: [],
    items: GENERIC_BRANDS.slice(0, 5).map((b, i) => ({
      key: `gen-${hash(label)}-${i}`,
      brand: b,
      title: `${b} ${label.replace(/\b\w/g, (m) => m.toUpperCase())}${i === 4 ? ' (Combo pack)' : ''}`,
      base: Math.round(base * (0.7 + i * 0.18)),
      mrp: Math.round(base * (1.6 + i * 0.2)),
      rating: r1(3.7 + r() * 0.8),
      ratings: Math.round(800 + r() * 20000),
      stores: all.filter((_, j) => (i + j) % 3 !== 0).slice(0, 3),
      suspicious: i === 3,
    })),
  };
}

export class MockProvider implements ShoppingProvider {
  id = 'mock';
  label = 'Mock (sample data)';
  kind = 'mock' as const;
  stores: StoreId[] = ['amazon', 'flipkart', 'myntra', 'meesho', 'croma', 'ajio', 'reliance-digital', 'tatacliq'];
  setupHint = 'Always available. Returns SAMPLE data only.';
  /** offerId → price multiplier (simulated market movement) */
  private drift = new Map<string, number>();
  constructor(private latencyMs = 350) {}

  configured() {
    return true;
  }

  async search(query: string, opts: SearchOptions = {}): Promise<Offer[]> {
    const cats = matchCategories(query);
    const useCats = cats.length ? cats.slice(0, 2) : [genericCategory(query)];
    const brandToks = tokens(query);
    const offers: Offer[] = [];
    for (const c of useCats) {
      let items = c.items;
      const branded = items.filter((it) => brandToks.includes(it.brand.toLowerCase()));
      if (branded.length) items = [...branded, ...items.filter((x) => !branded.includes(x))];
      for (const t of items)
        for (const s of t.stores) offers.push(makeOffer(t, c, s, this.drift.get(`mock:${s}:${t.key}`) ?? 1));
    }
    // simulate per-store fan-out so the UI can show progress
    const byStore = new Map<StoreId, number>();
    for (const o of offers) byStore.set(o.store, (byStore.get(o.store) ?? 0) + 1);
    let i = 0;
    for (const store of this.stores) {
      opts.onProgress?.({ provider: this.id, store, status: 'searching' });
      if (this.latencyMs) await new Promise((r) => setTimeout(r, this.latencyMs * (0.4 + (i++ % 3) * 0.3)));
      if (opts.signal?.aborted) throw new Error('aborted');
      opts.onProgress?.({ provider: this.id, store, status: 'done', count: byStore.get(store) ?? 0 });
    }
    return offers;
  }

  async priceHistory(offer: Offer, days = 90): Promise<PricePoint[]> {
    const r = rng('hist:' + offer.id);
    const out: PricePoint[] = [];
    const today = new Date();
    let p = offer.price * (1.08 + r() * 0.12);
    for (let d = days; d >= 0; d--) {
      const date = new Date(today.getTime() - d * 86400000);
      if (d === 0) p = offer.price;
      else {
        p *= 1 + (r() - 0.52) * 0.025;
        // festive sale dips (sample): ~25-35 and ~5-10 days ago
        if ((d >= 25 && d <= 32) || (d >= 5 && d <= 9)) p = Math.min(p, offer.price * (0.9 + r() * 0.05));
        p = clamp(p, offer.price * 0.82, offer.mrp);
      }
      out.push({ date: date.toISOString().slice(0, 10), price: indianPrice(p) });
    }
    return out;
  }

  /** Simulated price movement for alerts: mostly flat, sometimes a 3-12% drop. */
  async refreshPrice(offer: Offer): Promise<number | null> {
    const cur = this.drift.get(offer.id) ?? 1;
    const roll = Math.random();
    const next = roll < 0.35 ? cur * (0.88 + Math.random() * 0.09) : roll > 0.9 ? cur * 1.03 : cur;
    this.drift.set(offer.id, clamp(next, 0.7, 1.15));
    const [, store, key] = offer.id.split(':');
    for (const c of CATALOG) {
      const t = c.items.find((x) => x.key === key);
      if (t) return makeOffer(t, c, store as StoreId, this.drift.get(offer.id)).price;
    }
    return indianPrice(offer.price * (next / cur));
  }
}
