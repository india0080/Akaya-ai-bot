/**
 * Flipkart via the Flipkart Affiliate API (product search feed).
 *
 * NOT CONNECTED until FLIPKART_AFFILIATE_ID and FLIPKART_AFFILIATE_TOKEN are set.
 * TODO(flipkart): Flipkart's affiliate programme and API versions change over time. Confirm the
 * current endpoint and response fields in your affiliate dashboard before going live.
 */
import type { Config } from '../config.js';
import type { Offer } from '../types.js';
import { ProviderNotConfiguredError, type SearchOptions, type ShoppingProvider } from './types.js';

interface FkProduct {
  productBaseInfoV1?: {
    productId: string;
    title: string;
    productBrand?: string;
    categoryPath?: string;
    flipkartSellingPrice?: { amount: number };
    flipkartSpecialPrice?: { amount: number };
    maximumRetailPrice?: { amount: number };
    productUrl: string;
    inStock?: boolean;
    codAvailable?: boolean;
    attributes?: Record<string, string>;
  };
  productShippingInfoV1?: {
    shippingCharges?: { amount: number };
    estimatedDeliveryTime?: string;
    sellerName?: string;
    sellerAverageRating?: number;
    sellerNoOfRatings?: number;
    sellerNoOfReviews?: number;
  };
}

export class FlipkartProvider implements ShoppingProvider {
  id = 'flipkart';
  label = 'Flipkart Affiliate API';
  kind = 'api' as const;
  stores = ['flipkart' as const];
  setupHint = 'Set FLIPKART_AFFILIATE_ID and FLIPKART_AFFILIATE_TOKEN (affiliate.flipkart.com → API token).';
  constructor(private cfg: Config) {}

  configured() {
    return !!(this.cfg.FLIPKART_AFFILIATE_ID && this.cfg.FLIPKART_AFFILIATE_TOKEN);
  }

  async search(query: string, opts: SearchOptions = {}): Promise<Offer[]> {
    if (!this.configured()) throw new ProviderNotConfiguredError(this.id, this.setupHint);
    opts.onProgress?.({ provider: this.id, store: 'flipkart', status: 'searching' });
    const url = `https://affiliate-api.flipkart.net/affiliate/1.0/search.json?query=${encodeURIComponent(query)}&resultCount=${Math.min(10, opts.limit ?? 10)}`;
    const res = await fetch(url, {
      headers: { 'Fk-Affiliate-Id': this.cfg.FLIPKART_AFFILIATE_ID!, 'Fk-Affiliate-Token': this.cfg.FLIPKART_AFFILIATE_TOKEN! },
      signal: opts.signal,
    });
    if (!res.ok) throw new Error(`Flipkart affiliate ${res.status}`);
    const json = (await res.json()) as { products?: FkProduct[] };
    const offers = (json.products ?? []).map((p) => this.toOffer(p)).filter((o): o is Offer => !!o);
    opts.onProgress?.({ provider: this.id, store: 'flipkart', status: 'done', count: offers.length });
    return offers;
  }

  toOffer(p: FkProduct): Offer | null {
    const b = p.productBaseInfoV1;
    if (!b) return null;
    const price = b.flipkartSpecialPrice?.amount ?? b.flipkartSellingPrice?.amount;
    if (!price) return null;
    const s = p.productShippingInfoV1 ?? {};
    return {
      id: `flipkart:${b.productId}`,
      productKey: `flipkart:${b.productId}`,
      store: 'flipkart',
      storeName: 'Flipkart',
      title: b.title,
      brand: b.productBrand ?? '',
      category: b.categoryPath?.split('>').pop()?.trim() || 'general',
      price,
      mrp: b.maximumRetailPrice?.amount ?? price,
      currency: 'INR',
      // TODO(flipkart): product ratings are not in all feed versions; seller ratings are used for trust
      rating: 0,
      ratingCount: 0,
      reviewCount: 0,
      seller: { name: s.sellerName ?? 'Flipkart seller', rating: s.sellerAverageRating },
      delivery: { days: Number(s.estimatedDeliveryTime?.match(/\d+/)?.[0] ?? 4), free: !s.shippingCharges?.amount, cod: b.codAvailable },
      inStock: b.inStock !== false,
      url: b.productUrl, // affiliate URL from the feed
      specs: b.attributes ?? {},
      source: this.id,
      sample: false,
    };
  }
}
