/** Quote orchestration: parse → ask every store provider (job queue, per-store progress) → optimize. */
import { randomUUID } from 'node:crypto';
import type { Config } from '../config.js';
import { parseList } from '../engine/listParser.js';
import { budgetTips, buildPlans, quoteStore, type StoreInput } from '../engine/optimizer.js';
import type { GroceryProvider } from '../providers/types.js';
import type { ParsedItem, Plan, StoreId, StoreQuote } from '../types.js';
import type { TtlCache } from '@akaya/server-kit';
import type { JobQueue } from '@akaya/server-kit';

export interface QuoteProgress {
  store: StoreId;
  status: 'checking' | 'done' | 'error';
  found?: number;
  etaLabel?: string;
  message?: string;
}
export interface Quote {
  id: string;
  text?: string;
  items: ParsedItem[];
  unknown: string[];
  lang: string;
  pincode: string;
  address: string;
  quotes: StoreQuote[];
  plans: Plan[];
  recommended?: string;
  splitNote: string;
  budget?: number;
  budgetTips: ReturnType<typeof budgetTips>;
  createdAt: number;
  sample: boolean;
}
export interface QuoteInput {
  text?: string;
  items?: ParsedItem[];
  pincode?: string;
  address?: string;
  budget?: number;
  stores?: StoreId[];
}

export class QuoteService {
  private quotes = new Map<string, Quote>();
  /** last StoreInput per quote, used for re-pricing in checkout */
  inputs = new Map<string, StoreInput[]>();
  constructor(
    private cfg: Config,
    readonly providers: Map<StoreId, GroceryProvider>,
    private cache: TtlCache<{ inputs: StoreInput[] }>,
    private queue: JobQueue,
  ) {}

  get(id: string) {
    return this.quotes.get(id);
  }

  prepare(input: QuoteInput) {
    const parsed = input.items ? { items: input.items, unknown: [], lang: 'en' as const } : parseList(input.text ?? '');
    return parsed;
  }

  start(input: QuoteInput) {
    const parsed = this.prepare(input);
    const pincode = input.pincode ?? this.cfg.DEFAULT_PINCODE;
    const address = input.address ?? this.cfg.DEFAULT_ADDRESS;
    const stores = (input.stores?.length ? input.stores : [...this.providers.keys()]).filter((s) =>
      this.providers.has(s),
    );
    const sig = `${pincode}|${stores.join(',')}|${new Date().getUTCHours()}|${parsed.items.map((i) => `${i.key}:${i.qty}:${i.brand ?? ''}:${i.variant ?? ''}`).join(';')}`;
    const finish = (inputs: StoreInput[]): Quote => {
      // quotes are always rebuilt from the current items (cache holds only store data), so item ids stay consistent
      const quotes = inputs
        .map((i) => quoteStore(parsed.items, i))
        .sort((a, b) => a.missing.length - b.missing.length || a.total - b.total);
      const r = { quotes, inputs };
      const { plans, recommended, splitNote } = buildPlans(parsed.items, r.quotes, r.inputs, { budget: input.budget });
      const rec = plans.find((p) => p.id === recommended);
      const q: Quote = {
        id: randomUUID(),
        text: input.text,
        items: parsed.items,
        unknown: parsed.unknown,
        lang: parsed.lang,
        pincode,
        address,
        quotes: r.quotes,
        plans,
        recommended,
        splitNote,
        budget: input.budget,
        budgetTips: rec ? budgetTips(rec, parsed.items, input.budget) : [],
        createdAt: Date.now(),
        sample: r.quotes.some((x) => x.sample),
      };
      this.quotes.set(q.id, q);
      this.inputs.set(q.id, r.inputs);
      if (this.quotes.size > 300) this.quotes.delete(this.quotes.keys().next().value!);
      return q;
    };
    if (!parsed.items.length) return this.queue.done('quote', finish([]));
    const hit = this.cache.get(sig);
    if (hit) return this.queue.done('quote', finish(hit.inputs));
    return this.queue.enqueue<Quote, QuoteProgress>('quote', async (report, signal) => {
      const results = await Promise.all(
        stores.map(async (store): Promise<StoreInput | null> => {
          const p = this.providers.get(store)!;
          report({ store, status: 'checking' });
          try {
            const sv = await p.serviceability(pincode);
            const skus = await p.findSkus(parsed.items, { pincode, signal });
            report({
              store,
              status: 'done',
              found: new Set(skus.filter((s) => s.inStock).map((s) => s.itemKey)).size,
              etaLabel: sv.etaLabel,
            });
            return { store, ...sv, skus, fees: (s) => p.fees(s), sample: p.kind === 'mock' };
          } catch (e) {
            report({ store, status: 'error', message: (e as Error).message });
            return null;
          }
        }),
      );
      const inputs = results.filter((x): x is StoreInput => !!x);
      if (inputs.length) this.cache.set(sig, { inputs }, this.cfg.CACHE_TTL_SECONDS * 1000);
      return finish(inputs);
    });
  }
}
