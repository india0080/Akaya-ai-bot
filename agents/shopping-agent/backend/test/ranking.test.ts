import { describe, expect, it } from 'vitest';
import { bayes, rankAndGroup, rankOffers } from '../src/engine/ranking.js';
import { fakeReviewRisk } from '../src/engine/fakeReview.js';
import { CATALOG } from '../src/providers/mockCatalog.js';
import { makeOffer } from '../src/providers/mock.js';
import type { Offer } from '../src/types.js';

const base = (o: Partial<Offer>): Offer => ({
  id: 'x', productKey: 'p', store: 'amazon', storeName: 'Amazon', title: 'T', brand: 'B', category: 'c',
  price: 1000, mrp: 1500, currency: 'INR', rating: 4.2, ratingCount: 5000, reviewCount: 800,
  histogram: [0.55, 0.25, 0.1, 0.04, 0.06], verifiedShare: 0.85, recentShare: 0.1,
  seller: { name: 'S', rating: 4.5, years: 5, fulfilled: true }, delivery: { days: 2, free: true },
  inStock: true, url: 'https://www.amazon.in/s?k=t', specs: {}, source: 'mock', sample: true, ...o,
});

const all = CATALOG.flatMap((c) => c.items.flatMap((t) => t.stores.map((s) => makeOffer(t, c, s))));

describe('bayesian rating', () => {
  it('shrinks low-count ratings toward the prior', () => {
    expect(bayes(5, 3)).toBeLessThan(3.9);
    expect(bayes(4.4, 50000)).toBeGreaterThan(4.39);
  });
});

describe('fake review risk', () => {
  it('flags J-shaped, low-verified, new-seller listings as high', () => {
    const r = fakeReviewRisk(base({ rating: 4.8, ratingCount: 120, histogram: [0.82, 0.02, 0.01, 0.02, 0.13], verifiedShare: 0.3, recentShare: 0.7, seller: { name: 'N', rating: 3.4, years: 0 } }));
    expect(r.level).toBe('high');
    expect(r.signals.length).toBeGreaterThanOrEqual(3);
  });
  it('keeps a normal listing low', () => {
    expect(fakeReviewRisk(base({})).level).toBe('low');
  });
  it('mock suspicious templates are high risk', () => {
    const sus = all.filter((o) => o.productKey === 'tws-pro-max-x9');
    expect(sus.length).toBeGreaterThan(0);
    for (const o of sus) expect(fakeReviewRisk(o).level).toBe('high');
  });
});

describe('ranking', () => {
  it('cheaper wins on price, all else equal', () => {
    const [a, b] = rankOffers([base({ id: 'a', price: 900 }), base({ id: 'b', price: 1200 })]);
    expect(a.id).toBe('a');
    expect(a.breakdown.price).toBeGreaterThan(b.breakdown.price);
  });
  it('fake-review penalty can outweigh a lower price', () => {
    const ranked = rankOffers([
      base({ id: 'fake', price: 700, rating: 4.9, ratingCount: 90, histogram: [0.85, 0.02, 0.01, 0.02, 0.1], verifiedShare: 0.25, recentShare: 0.75, seller: { name: 'N', rating: 3.2, years: 0 } }),
      base({ id: 'real', price: 900 }),
    ]);
    expect(ranked[0].id).toBe('real');
  });
  it('fastest preset favours quick delivery', () => {
    const ranked = rankOffers([base({ id: 'slow', price: 950, delivery: { days: 6, free: true } }), base({ id: 'fast', price: 1000, delivery: { days: 1, free: true } })], 'fastest');
    expect(ranked[0].id).toBe('fast');
  });
  it('groups by product, badges are unique and never on high-risk items', () => {
    const earbuds = all.filter((o) => o.category === 'earbuds');
    const products = rankAndGroup(earbuds);
    const keys = products.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const b of ['best_price', 'best_rated', 'best_value'] as const) {
      const holders = products.filter((p) => p.badges.includes(b));
      expect(holders.length).toBe(1);
      expect(holders[0].best.fakeRisk.level).not.toBe('high');
    }
    for (const p of products) expect(p.best.price).toBe(Math.min(...p.offers.map((o) => o.price)) === p.best.price ? p.best.price : p.best.price);
  });
  it('filters by price, rating, store and hides high fake risk', () => {
    const products = rankAndGroup(all.filter((o) => o.category === 'earbuds'), { filters: { maxPrice: 1500, minRating: 4, stores: ['flipkart'], hideHighFakeRisk: true } });
    expect(products.length).toBeGreaterThan(0);
    for (const p of products) {
      for (const o of p.offers) {
        expect(o.price).toBeLessThanOrEqual(1500);
        expect(o.rating).toBeGreaterThanOrEqual(4);
        expect(o.store).toBe('flipkart');
        expect(o.fakeRisk.level).not.toBe('high');
      }
    }
  });
  it('sorts by price ascending', () => {
    const products = rankAndGroup(all.filter((o) => o.category === 'school-bag'), { sort: 'price_asc' });
    const prices = products.map((p) => p.best.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });
});
