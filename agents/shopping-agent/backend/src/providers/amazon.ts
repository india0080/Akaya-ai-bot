/**
 * Amazon.in via the Amazon Associates **Creators API** (successor of PA-API 5.0, which Amazon
 * deprecated on 30 Apr 2026 and retired on 15 May 2026; old AWS-SigV4 keys no longer work).
 *
 * Auth: OAuth 2.0 client credentials (Credential ID + Secret from Associates Central → Tools →
 * Creators API). India uses the EU token endpoint (credential version 3.2):
 *   POST https://api.amazon.co.uk/auth/o2/token  { grant_type, client_id, client_secret, scope: "creatorsapi::default" }
 * Calls: POST https://creatorsapi.amazon/catalog/v1/searchItems  (Bearer token, x-marketplace: www.amazon.in)
 *
 * Eligibility (per Amazon docs at time of writing): approved Associates account for amazon.in with
 * at least 10 qualifying sales in the last 30 days. NOT CONNECTED until the keys below are set.
 *
 * TODO(amazon): verify the offersV2 / customer-review field names against a live response; the
 * mapping below is best-effort from the docs and returns null for items without a price.
 */
import type { Config } from '../config.js';
import type { Offer } from '../types.js';
import { ProviderNotConfiguredError, type SearchOptions, type ShoppingProvider } from './types.js';

const API = 'https://creatorsapi.amazon/catalog/v1';
const RESOURCES = [
  'itemInfo.title',
  'itemInfo.byLineInfo',
  'itemInfo.classifications',
  'images.primary.medium',
  'offersV2.listings.price',
  'offersV2.listings.availability',
  'offersV2.listings.merchantInfo',
  'offersV2.listings.condition',
  'customerReviews.count',
  'customerReviews.starRating',
];

/** Cached OAuth2 client-credentials token (tokens live ~1 h). Exported for tests. */
export class TokenCache {
  private token: { value: string; exp: number } | null = null;
  constructor(
    private url: string,
    private clientId: string,
    private clientSecret: string,
    private fetchFn: typeof fetch = fetch,
  ) {}
  async get(signal?: AbortSignal): Promise<string> {
    if (this.token && this.token.exp > Date.now() + 60_000) return this.token.value;
    const res = await this.fetchFn(this.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: 'creatorsapi::default',
      }),
      signal,
    });
    if (!res.ok) throw new Error(`Creators API token ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const j = (await res.json()) as { access_token: string; expires_in?: number };
    this.token = { value: j.access_token, exp: Date.now() + (j.expires_in ?? 3600) * 1000 };
    return j.access_token;
  }
}

interface Money {
  amount?: number;
  currency?: string;
}
export interface CreatorsItem {
  asin: string;
  detailPageURL: string;
  itemInfo?: {
    title?: { displayValue?: string };
    byLineInfo?: { brand?: { displayValue?: string } };
    classifications?: { productGroup?: { displayValue?: string } };
  };
  offersV2?: {
    listings?: {
      price?: { money?: Money; savingBasis?: { money?: Money } };
      availability?: { type?: string };
      merchantInfo?: { name?: string };
      isBuyBoxWinner?: boolean;
    }[];
  };
  customerReviews?: { count?: number; starRating?: { value?: number } };
}

export class AmazonProvider implements ShoppingProvider {
  id = 'amazon';
  label = 'Amazon.in (Creators API)';
  kind = 'api' as const;
  stores = ['amazon' as const];
  setupHint = 'Set AMAZON_CREDENTIAL_ID, AMAZON_CREDENTIAL_SECRET, AMAZON_TAG_IN (Associates Central → Creators API).';
  private tokens: TokenCache | null = null;
  constructor(
    private cfg: Config,
    private fetchFn: typeof fetch = fetch,
  ) {}

  configured() {
    return !!(this.cfg.AMAZON_CREDENTIAL_ID && this.cfg.AMAZON_CREDENTIAL_SECRET && this.cfg.AMAZON_TAG_IN);
  }

  /** Builds the searchItems request (exported shape is unit-tested). */
  searchRequest(query: string, limit = 10) {
    return {
      keywords: query,
      partnerTag: this.cfg.AMAZON_TAG_IN,
      marketplace: this.cfg.AMAZON_MARKETPLACE,
      itemCount: Math.min(10, limit),
      resources: RESOURCES,
    };
  }

  async search(query: string, opts: SearchOptions = {}): Promise<Offer[]> {
    if (!this.configured()) throw new ProviderNotConfiguredError(this.id, this.setupHint);
    opts.onProgress?.({ provider: this.id, store: 'amazon', status: 'searching' });
    this.tokens ??= new TokenCache(
      this.cfg.AMAZON_TOKEN_URL,
      this.cfg.AMAZON_CREDENTIAL_ID!,
      this.cfg.AMAZON_CREDENTIAL_SECRET!,
      this.fetchFn,
    );
    const token = await this.tokens.get(opts.signal);
    const res = await this.fetchFn(`${API}/searchItems`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'x-marketplace': this.cfg.AMAZON_MARKETPLACE,
      },
      body: JSON.stringify(this.searchRequest(query, opts.limit)),
      signal: opts.signal,
    });
    if (!res.ok) throw new Error(`Creators API searchItems ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const json = (await res.json()) as { searchResult?: { items?: CreatorsItem[] } };
    const offers = (json.searchResult?.items ?? []).map((it) => this.toOffer(it)).filter((o): o is Offer => !!o);
    opts.onProgress?.({ provider: this.id, store: 'amazon', status: 'done', count: offers.length });
    return offers;
    // TODO(amazon): getItems for refreshPrice() (watchlist) and respect the per-account request quota.
  }

  toOffer(it: CreatorsItem): Offer | null {
    const listings = it.offersV2?.listings ?? [];
    const l = listings.find((x) => x.isBuyBoxWinner) ?? listings[0];
    const price = l?.price?.money?.amount;
    if (!price) return null;
    return {
      id: `amazon:${it.asin}`,
      productKey: `amazon:${it.asin}`,
      store: 'amazon',
      storeName: 'Amazon',
      title: it.itemInfo?.title?.displayValue ?? it.asin,
      brand: it.itemInfo?.byLineInfo?.brand?.displayValue ?? '',
      category: it.itemInfo?.classifications?.productGroup?.displayValue ?? 'general',
      price,
      mrp: l?.price?.savingBasis?.money?.amount ?? price,
      currency: 'INR',
      rating: it.customerReviews?.starRating?.value ?? 0,
      ratingCount: it.customerReviews?.count ?? 0,
      reviewCount: 0, // not exposed by the API
      seller: { name: l?.merchantInfo?.name ?? 'Amazon seller' },
      delivery: { days: 3, free: false }, // TODO(amazon): map delivery info when available
      inStock: !/out ?of ?stock/i.test(l?.availability?.type ?? ''),
      url: it.detailPageURL, // already carries your partnerTag
      specs: {},
      source: this.id,
      sample: false,
    };
  }
}
