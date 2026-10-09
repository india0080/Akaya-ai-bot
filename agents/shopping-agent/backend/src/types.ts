/** Domain schemas (zod) shared by providers, the ranking engine and the REST API. */
import { getPlatform } from '@akaya/affiliate';
import { z } from 'zod';

/** Store ids are @akaya/affiliate platform ids (plus 'other'). */
export const StoreId = z.enum([
  'amazon',
  'flipkart',
  'myntra',
  'meesho',
  'croma',
  'ajio',
  'reliance-digital',
  'tatacliq',
  'nykaa',
  'other',
]);
export type StoreId = z.infer<typeof StoreId>;

/** name / brand colour / monogram per store, from the shared platform registry */
export const STORES = Object.fromEntries(
  StoreId.options.map((s) => {
    const p = s === 'other' ? null : getPlatform(s);
    return [
      s,
      p ? { name: p.name, color: p.color, mono: p.mono } : { name: 'Other store', color: '#64748b', mono: '•' },
    ];
  }),
) as Record<StoreId, { name: string; color: string; mono: string }>;

export const Offer = z.object({
  id: z.string(),
  /** offers for the same product across stores share a productKey */
  productKey: z.string(),
  store: StoreId,
  storeName: z.string(),
  title: z.string(),
  brand: z.string(),
  category: z.string(),
  emoji: z.string().optional(),
  price: z.number(),
  mrp: z.number(),
  currency: z.literal('INR'),
  rating: z.number().min(0).max(5),
  ratingCount: z.number().int(),
  reviewCount: z.number().int(),
  /** share of ratings per star, index 0 = 5★ … 4 = 1★ (sums to ~1) */
  histogram: z.array(z.number()).length(5).optional(),
  /** share of reviews from verified buyers (0..1) */
  verifiedShare: z.number().min(0).max(1).optional(),
  /** share of all reviews posted in the last 30 days (0..1) */
  recentShare: z.number().min(0).max(1).optional(),
  seller: z.object({
    name: z.string(),
    rating: z.number().min(0).max(5).optional(),
    years: z.number().optional(),
    /** Amazon Fulfilled / Flipkart Assured / store-owned */
    fulfilled: z.boolean().optional(),
  }),
  delivery: z.object({ days: z.number(), free: z.boolean(), cod: z.boolean().optional() }),
  inStock: z.boolean(),
  url: z.string().url(),
  specs: z.record(z.string(), z.string()).default({}),
  /** provider that returned it */
  source: z.string(),
  /** true for Mock-provider sample data (never real prices) */
  sample: z.boolean(),
});
export type Offer = z.infer<typeof Offer>;

export const FakeRisk = z.object({
  score: z.number(),
  level: z.enum(['low', 'medium', 'high']),
  signals: z.array(z.string()),
});
export type FakeRisk = z.infer<typeof FakeRisk>;

export const ScoreBreakdown = z.object({
  price: z.number(),
  rating: z.number(),
  reviews: z.number(),
  trust: z.number(),
  delivery: z.number(),
  fakePenalty: z.number(),
});

export const RankedOffer = Offer.extend({
  score: z.number(),
  breakdown: ScoreBreakdown,
  fakeRisk: FakeRisk,
  discountPct: z.number(),
  affiliateUrl: z.string(),
});
export type RankedOffer = z.infer<typeof RankedOffer>;

export const Badge = z.enum(['best_price', 'best_rated', 'best_value', 'fastest']);
export type Badge = z.infer<typeof Badge>;

export const ProductResult = z.object({
  key: z.string(),
  title: z.string(),
  brand: z.string(),
  category: z.string(),
  emoji: z.string().optional(),
  rank: z.number().int(),
  score: z.number(),
  badges: z.array(Badge),
  best: RankedOffer,
  offers: z.array(RankedOffer),
  priceRange: z.tuple([z.number(), z.number()]),
  sample: z.boolean(),
});
export type ProductResult = z.infer<typeof ProductResult>;

export const Preset = z.enum(['balanced', 'cheapest', 'fastest', 'quality']);
export type Preset = z.infer<typeof Preset>;

export const SortBy = z.enum(['relevance', 'price_asc', 'price_desc', 'rating', 'delivery', 'discount']);

export const Filters = z.object({
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minRating: z.number().min(0).max(5).optional(),
  maxDeliveryDays: z.number().optional(),
  stores: z.array(StoreId).optional(),
  hideHighFakeRisk: z.boolean().optional(),
  inStockOnly: z.boolean().optional(),
});
export type Filters = z.infer<typeof Filters>;

export const ParsedQuery = z.object({
  raw: z.string(),
  q: z.string(),
  filters: Filters,
  hints: z.array(z.string()),
  lang: z.enum(['en', 'hi', 'hinglish']),
});
export type ParsedQuery = z.infer<typeof ParsedQuery>;
