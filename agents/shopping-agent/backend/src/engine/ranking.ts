/**
 * Ranking engine: scores every offer, groups offers of the same product across stores, assigns
 * "Best price / Best rated / Best value / Fastest" badges, then filters and sorts.
 *
 * score = Σ weight_i × signal_i − fakePenalty, every signal normalised to 0..1 within the result set:
 *   price    (min price / price)^0.7          rating  Bayesian average (prior 3.8★, C=200)
 *   reviews  log10(count) / log10(max count)  trust   seller rating, fulfilled-by-store, seller age
 *   delivery 1 − (days − 1) / 9               fakePenalty = 0.3 × fake-review risk
 */
import { fakeReviewRisk } from './fakeReview.js';
import type { Badge, Filters, Offer, Preset, ProductResult, RankedOffer } from '../types.js';

export type Weights = { price: number; rating: number; reviews: number; trust: number; delivery: number };
export const PRESETS: Record<Preset, Weights> = {
  balanced: { price: 0.3, rating: 0.24, reviews: 0.12, trust: 0.16, delivery: 0.18 },
  cheapest: { price: 0.55, rating: 0.15, reviews: 0.08, trust: 0.12, delivery: 0.1 },
  fastest: { price: 0.2, rating: 0.15, reviews: 0.08, trust: 0.12, delivery: 0.45 },
  quality: { price: 0.14, rating: 0.36, reviews: 0.2, trust: 0.2, delivery: 0.1 },
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const r3 = (n: number) => Math.round(n * 1000) / 1000;
export const PRIOR = 3.8;
export const bayes = (rating: number, n: number, m = PRIOR, C = 200) => (rating > 0 ? (C * m + rating * n) / (C + n) : m);

export function trustScore(o: Offer): number {
  const sr = o.seller.rating ?? 4;
  const years = o.seller.years;
  return clamp01((sr / 5) * 0.55 + (o.seller.fulfilled ? 0.25 : 0) + (years === undefined ? 0.1 : (Math.min(years, 5) / 5) * 0.2));
}

export function rankOffers(offers: Offer[], preset: Preset = 'balanced', link: (o: Offer) => string = (o) => o.url): RankedOffer[] {
  if (!offers.length) return [];
  const w = PRESETS[preset];
  const minPrice = Math.min(...offers.map((o) => o.price));
  const maxN = Math.max(10, ...offers.map((o) => o.ratingCount));
  return offers.map((o) => {
    const fakeRisk = fakeReviewRisk(o);
    const breakdown = {
      price: r3(Math.pow(minPrice / o.price, 0.7)),
      rating: r3(clamp01((bayes(o.rating, o.ratingCount) - 3) / 2)),
      reviews: r3(clamp01(Math.log10(o.ratingCount + 1) / Math.log10(maxN + 1))),
      trust: r3(trustScore(o)),
      delivery: r3(clamp01(1 - (Math.min(o.delivery.days, 10) - 1) / 9)),
      fakePenalty: r3(fakeRisk.score * 0.3),
    };
    const score =
      w.price * breakdown.price +
      w.rating * breakdown.rating +
      w.reviews * breakdown.reviews +
      w.trust * breakdown.trust +
      w.delivery * breakdown.delivery -
      breakdown.fakePenalty -
      (o.inStock ? 0 : 0.5);
    return {
      ...o,
      score: r3(score),
      breakdown,
      fakeRisk,
      discountPct: o.mrp > o.price ? Math.round((1 - o.price / o.mrp) * 100) : 0,
      affiliateUrl: link(o),
    };
  }).sort((a, b) => b.score - a.score);
}

export function groupProducts(ranked: RankedOffer[]): ProductResult[] {
  const groups = new Map<string, RankedOffer[]>();
  for (const o of ranked) groups.set(o.productKey, [...(groups.get(o.productKey) ?? []), o]);
  const products: ProductResult[] = [];
  for (const [key, offers] of groups) {
    offers.sort((a, b) => b.score - a.score);
    const best = offers.find((o) => o.inStock) ?? offers[0];
    const prices = offers.map((o) => o.price);
    products.push({
      key,
      title: best.title,
      brand: best.brand,
      category: best.category,
      emoji: best.emoji,
      rank: 0,
      // small bonus when the product is sold by several stores (easier to get the best deal)
      score: r3(best.score + Math.min(0.03, (offers.length - 1) * 0.01)),
      badges: [],
      best,
      offers,
      priceRange: [Math.min(...prices), Math.max(...prices)],
      sample: offers.some((o) => o.sample),
    });
  }
  return products;
}

/** Badges are only given to trustworthy products (in stock, fake risk not high). */
export function assignBadges(products: ProductResult[]): ProductResult[] {
  const ok = products.filter((p) => p.best.inStock && p.best.fakeRisk.level !== 'high');
  const pick = (cmp: (a: ProductResult, b: ProductResult) => number, filter: (p: ProductResult) => boolean = () => true) =>
    ok.filter(filter).sort(cmp)[0];
  const give = (p: ProductResult | undefined, b: Badge) => p && !p.badges.includes(b) && p.badges.push(b);
  give(pick((a, b) => b.score - a.score), 'best_value');
  give(pick((a, b) => a.best.price - b.best.price, (p) => bayes(p.best.rating, p.best.ratingCount) >= 3.7), 'best_price');
  give(pick((a, b) => bayes(b.best.rating, b.best.ratingCount) - bayes(a.best.rating, a.best.ratingCount), (p) => p.best.ratingCount >= 100), 'best_rated');
  give(pick((a, b) => a.best.delivery.days - b.best.delivery.days || b.score - a.score), 'fastest');
  return products;
}

export function applyFilters(products: ProductResult[], f: Filters): ProductResult[] {
  const keep = (o: RankedOffer) =>
    (f.minPrice === undefined || o.price >= f.minPrice) &&
    (f.maxPrice === undefined || o.price <= f.maxPrice) &&
    (f.minRating === undefined || o.rating >= f.minRating) &&
    (f.maxDeliveryDays === undefined || o.delivery.days <= f.maxDeliveryDays) &&
    (!f.stores?.length || f.stores.includes(o.store)) &&
    (!f.hideHighFakeRisk || o.fakeRisk.level !== 'high') &&
    (!f.inStockOnly || o.inStock);
  const out: ProductResult[] = [];
  for (const p of products) {
    const offers = p.offers.filter(keep);
    if (!offers.length) continue;
    const best = offers.find((o) => o.inStock) ?? offers[0];
    out.push({ ...p, offers, best, title: best.title, score: r3(best.score + Math.min(0.03, (offers.length - 1) * 0.01)), priceRange: [Math.min(...offers.map((o) => o.price)), Math.max(...offers.map((o) => o.price))] });
  }
  return out;
}

export type SortBy = 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'delivery' | 'discount';
export function sortProducts(products: ProductResult[], sort: SortBy = 'relevance'): ProductResult[] {
  const by: Record<SortBy, (a: ProductResult, b: ProductResult) => number> = {
    relevance: (a, b) => b.score - a.score,
    price_asc: (a, b) => a.best.price - b.best.price,
    price_desc: (a, b) => b.best.price - a.best.price,
    rating: (a, b) => bayes(b.best.rating, b.best.ratingCount) - bayes(a.best.rating, a.best.ratingCount),
    delivery: (a, b) => a.best.delivery.days - b.best.delivery.days || b.score - a.score,
    discount: (a, b) => b.best.discountPct - a.best.discountPct,
  };
  return [...products].sort(by[sort]).map((p, i) => ({ ...p, rank: i + 1 }));
}

/** Full pipeline: rank → group → filter → badges → sort. */
export function rankAndGroup(
  offers: Offer[],
  opts: { preset?: Preset; filters?: Filters; sort?: SortBy; link?: (o: Offer) => string } = {},
): ProductResult[] {
  const ranked = rankOffers(offers, opts.preset ?? 'balanced', opts.link);
  const grouped = applyFilters(groupProducts(ranked), opts.filters ?? {});
  return sortProducts(assignBadges(grouped), opts.sort ?? 'relevance');
}
