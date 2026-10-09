/**
 * Affiliate deep links. The agent only OPENS the store page; the user checks out in the store.
 * Amazon: `tag=<AMAZON_PARTNER_TAG>`; Flipkart: `affid=<FLIPKART_AFFILIATE_ID>`.
 * TODO(affiliate): other stores (Myntra, AJIO, Croma, Meesho…) pay via affiliate networks
 * (e.g. Cuelinks, EarnKaro, INRDeals, Admitad). Add a link wrapper here once you join one.
 */
import type { Config } from '../config.js';
import type { Offer } from '../types.js';

export function affiliateUrl(o: Offer, cfg: Pick<Config, 'AMAZON_PARTNER_TAG' | 'FLIPKART_AFFILIATE_ID'>): string {
  try {
    const u = new URL(o.url);
    if (o.store === 'amazon' && cfg.AMAZON_PARTNER_TAG && !u.searchParams.has('tag')) u.searchParams.set('tag', cfg.AMAZON_PARTNER_TAG);
    if (o.store === 'flipkart' && cfg.FLIPKART_AFFILIATE_ID && !u.searchParams.has('affid')) u.searchParams.set('affid', cfg.FLIPKART_AFFILIATE_ID);
    return u.toString();
  } catch {
    return o.url;
  }
}
