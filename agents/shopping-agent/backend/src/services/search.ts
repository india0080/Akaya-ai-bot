/**
 * Search orchestration: parse → cache lookup → fan out to providers on the job queue →
 * rank/group/badge → keep an index for product detail, compare and the watchlist.
 */
import type { Config } from '../config.js';
import { affiliateUrl } from '../engine/affiliate.js';
import { parseQuery } from '../engine/queryParser.js';
import { rankAndGroup, type SortBy } from '../engine/ranking.js';
import { CATALOG } from '../providers/mockCatalog.js';
import { makeOffer } from '../providers/mock.js';
import type { SearchProgress, ShoppingProvider } from '../providers/types.js';
import type { Filters, Offer, ParsedQuery, Preset, ProductResult } from '../types.js';
import type { TtlCache } from './cache.js';
import type { JobQueue } from './queue.js';

export interface ProviderRun {
  id: string;
  label: string;
  kind: string;
  count: number;
  error?: string;
}
export interface SearchResult {
  query: string;
  parsed: ParsedQuery;
  preset: Preset;
  sort: SortBy;
  products: ProductResult[];
  totalOffers: number;
  stores: string[];
  providers: ProviderRun[];
  cached: boolean;
  tookMs: number;
  /** true when any result is Mock sample data */
  sample: boolean;
}
export interface SearchInput {
  query: string;
  filters?: Filters;
  sort?: SortBy;
  preset?: Preset;
}

interface CachedOffers {
  offers: Offer[];
  providers: ProviderRun[];
}

export class SearchService {
  private offers = new Map<string, Offer>();
  private products = new Map<string, ProductResult>();
  constructor(
    private cfg: Config,
    readonly providers: ShoppingProvider[],
    private cache: TtlCache<CachedOffers>,
    private queue: JobQueue,
  ) {}

  link = (o: Offer) => affiliateUrl(o, this.cfg);

  prepare(input: SearchInput) {
    const parsed = parseQuery(input.query);
    const filters: Filters = { ...parsed.filters, ...(input.filters ?? {}) };
    const hint = parsed.hints[0] as Preset | undefined;
    const preset: Preset = input.preset ?? (hint && ['cheapest', 'fastest', 'quality'].includes(hint) ? hint : 'balanced');
    const sort = input.sort ?? 'relevance';
    const cacheKey = `${this.providers.map((p) => p.id).join('+')}|${parsed.q.toLowerCase()}`;
    return { parsed, filters, preset, sort, cacheKey };
  }

  /** Starts a search job (or returns a finished job on cache hit). */
  start(input: SearchInput) {
    const t0 = Date.now();
    const { parsed, filters, preset, sort, cacheKey } = this.prepare(input);
    const finish = (c: CachedOffers, cached: boolean): SearchResult => {
      for (const o of c.offers) this.offers.set(o.id, o);
      const products = rankAndGroup(c.offers, { preset, filters, sort, link: this.link });
      for (const p of products) this.products.set(p.key, p);
      return {
        query: input.query,
        parsed: { ...parsed, filters },
        preset,
        sort,
        products,
        totalOffers: products.reduce((n, p) => n + p.offers.length, 0),
        stores: [...new Set(c.offers.map((o) => o.storeName))],
        providers: c.providers,
        cached,
        tookMs: Date.now() - t0,
        sample: c.offers.some((o) => o.sample),
      };
    };
    const hit = this.cache.get(cacheKey);
    if (hit) return this.queue.done('search', finish(hit, true));
    return this.queue.enqueue<SearchResult, SearchProgress>('search', async (report, signal) => {
      const runs = await Promise.allSettled(
        this.providers.map((p) => p.search(parsed.q, { limit: 30, signal, onProgress: report })),
      );
      const offers: Offer[] = [];
      const providers: ProviderRun[] = runs.map((r, i) => {
        const p = this.providers[i];
        if (r.status === 'fulfilled') {
          offers.push(...r.value);
          return { id: p.id, label: p.label, kind: p.kind, count: r.value.length };
        }
        report({ provider: p.id, store: p.id, status: 'error', message: String(r.reason?.message ?? r.reason) });
        return { id: p.id, label: p.label, kind: p.kind, count: 0, error: String(r.reason?.message ?? r.reason) };
      });
      const c = { offers, providers };
      if (offers.length) this.cache.set(cacheKey, c, this.cfg.CACHE_TTL_SECONDS * 1000);
      return finish(c, false);
    });
  }

  getOffer(id: string) {
    return this.offers.get(id);
  }

  /** Product from the last results; Mock products can be rebuilt after a restart. */
  getProduct(key: string): ProductResult | undefined {
    const hit = this.products.get(key);
    if (hit) return hit;
    for (const c of CATALOG) {
      const t = c.items.find((x) => x.key === key);
      if (t) {
        const offers = t.stores.map((s) => makeOffer(t, c, s));
        const [p] = rankAndGroup(offers, { link: this.link });
        for (const o of offers) this.offers.set(o.id, o);
        this.products.set(key, p);
        return p;
      }
    }
    return undefined;
  }

  providerFor(offer: Offer) {
    return this.providers.find((p) => p.id === offer.source);
  }
}
