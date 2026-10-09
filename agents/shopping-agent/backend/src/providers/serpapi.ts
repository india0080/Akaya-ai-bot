/**
 * Google Shopping results via SerpApi (covers many Indian stores in one call).
 *
 * NOT CONNECTED until SERPAPI_KEY is set. The engine/params follow SerpApi's google_shopping
 * engine docs (gl=in). Results carry the store name in `source`, mapped to a StoreId below.
 * TODO(serpapi): SerpApi is a paid metered API; the cache (CACHE_TTL_SECONDS) limits spend.
 */
import type { Config } from '../config.js';
import type { Offer, StoreId } from '../types.js';
import { ProviderNotConfiguredError, type SearchOptions, type ShoppingProvider } from './types.js';

interface SerpItem {
  title: string;
  source?: string;
  extracted_price?: number;
  extracted_old_price?: number;
  rating?: number;
  reviews?: number;
  delivery?: string;
  link?: string;
  product_link?: string;
  product_id?: string;
}

export function storeFromSource(source = ''): StoreId {
  const s = source.toLowerCase();
  if (s.includes('amazon')) return 'amazon';
  if (s.includes('flipkart')) return 'flipkart';
  if (s.includes('myntra')) return 'myntra';
  if (s.includes('meesho')) return 'meesho';
  if (s.includes('croma')) return 'croma';
  if (s.includes('ajio')) return 'ajio';
  if (s.includes('reliance')) return 'reliance-digital';
  if (s.includes('tata')) return 'tatacliq';
  if (s.includes('nykaa')) return 'nykaa';
  return 'other';
}

export class SerpApiProvider implements ShoppingProvider {
  id = 'serpapi';
  label = 'Google Shopping (SerpApi)';
  kind = 'api' as const;
  stores: StoreId[] = [
    'amazon',
    'flipkart',
    'myntra',
    'croma',
    'reliance-digital',
    'tatacliq',
    'ajio',
    'nykaa',
    'other',
  ];
  setupHint = 'Set SERPAPI_KEY (serpapi.com → API key).';
  constructor(private cfg: Config) {}

  configured() {
    return !!this.cfg.SERPAPI_KEY;
  }

  async search(query: string, opts: SearchOptions = {}): Promise<Offer[]> {
    if (!this.configured()) throw new ProviderNotConfiguredError(this.id, this.setupHint);
    opts.onProgress?.({ provider: this.id, store: 'google-shopping', status: 'searching' });
    const params = new URLSearchParams({
      engine: 'google_shopping',
      q: query,
      gl: 'in',
      hl: 'en',
      location: 'India',
      api_key: this.cfg.SERPAPI_KEY!,
    });
    const res = await fetch(`https://serpapi.com/search.json?${params}`, { signal: opts.signal });
    if (!res.ok) throw new Error(`SerpApi ${res.status}`);
    const json = (await res.json()) as { shopping_results?: SerpItem[] };
    const offers = (json.shopping_results ?? [])
      .slice(0, opts.limit ?? 30)
      .map((x, i) => this.toOffer(x, i))
      .filter((o): o is Offer => !!o);
    opts.onProgress?.({ provider: this.id, store: 'google-shopping', status: 'done', count: offers.length });
    return offers;
  }

  toOffer(x: SerpItem, i: number): Offer | null {
    if (!x.extracted_price || !(x.link || x.product_link)) return null;
    const store = storeFromSource(x.source);
    const days = Number(x.delivery?.match(/(\d+)\s*day/i)?.[1] ?? 5);
    return {
      id: `serpapi:${x.product_id ?? i}:${store}`,
      productKey: `serp:${x.product_id ?? x.title.toLowerCase().slice(0, 60)}`,
      store,
      storeName: x.source ?? 'Store',
      title: x.title,
      brand: x.title.split(' ')[0],
      category: 'general',
      price: x.extracted_price,
      mrp: x.extracted_old_price ?? x.extracted_price,
      currency: 'INR',
      rating: x.rating ?? 0,
      ratingCount: x.reviews ?? 0,
      reviewCount: 0,
      seller: { name: x.source ?? 'Store' },
      delivery: { days, free: /free/i.test(x.delivery ?? '') },
      inStock: true,
      url: (x.link ?? x.product_link)!,
      specs: {},
      source: this.id,
      sample: false,
    };
  }
}
