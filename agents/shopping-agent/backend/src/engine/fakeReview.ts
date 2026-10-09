/**
 * Fake-review risk heuristics. Not proof of fraud: a transparent risk signal the UI explains.
 * Signals (each adds weight, total clamped to 0..1):
 *  - polarised "J-shaped" ratings (very high 5★ and unusually high 1★ share)
 *  - near-perfect rating with few ratings
 *  - review burst: large share of reviews in the last 30 days
 *  - low verified-purchase share
 *  - unusually high written-review / rating ratio
 *  - new or low-rated seller with a large review count
 */
import type { FakeRisk, Offer } from '../types.js';

export function fakeReviewRisk(o: Offer): FakeRisk {
  const signals: string[] = [];
  let s = 0;
  const h = o.histogram;
  if (h && h[0] >= 0.7 && h[4] >= 0.1) {
    s += 0.3;
    signals.push(`Polarised ratings: ${Math.round(h[0] * 100)}% 5★ but ${Math.round(h[4] * 100)}% 1★`);
  }
  if (o.rating >= 4.6 && o.ratingCount > 0 && o.ratingCount < 2500) {
    s += 0.15;
    signals.push(`Very high ${o.rating}★ from only ${o.ratingCount.toLocaleString('en-IN')} ratings`);
  }
  if ((o.recentShare ?? 0) >= 0.4) {
    s += 0.25;
    signals.push(`Review burst: ${Math.round((o.recentShare ?? 0) * 100)}% of reviews in the last 30 days`);
  }
  if (o.verifiedShare !== undefined && o.verifiedShare < 0.6) {
    s += 0.2;
    signals.push(`Only ${Math.round(o.verifiedShare * 100)}% verified purchases`);
  }
  if (o.ratingCount > 50 && o.reviewCount / o.ratingCount > 0.45) {
    s += 0.1;
    signals.push('Unusually many written reviews per rating');
  }
  if ((o.seller.years ?? 5) < 1 && o.reviewCount > 300) {
    s += 0.1;
    signals.push(`Seller is under a year old but has ${o.reviewCount.toLocaleString('en-IN')} reviews`);
  }
  if ((o.seller.rating ?? 5) < 3.8) {
    s += 0.05;
    signals.push(`Low seller rating (${o.seller.rating}★)`);
  }
  const score = Math.min(1, Math.round(s * 100) / 100);
  return { score, level: score >= 0.5 ? 'high' : score >= 0.25 ? 'medium' : 'low', signals };
}
