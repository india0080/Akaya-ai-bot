/**
 * Store links for offers, built by @akaya/affiliate (the one link registry for every Akaya surface).
 * The agent only OPENS the store page; the user checks out in the store.
 * IDs come from env (AMAZON_TAG_IN, FLIPKART_AFFILIATE_ID, CUELINKS_CID, …; see docs/AFFILIATE.md).
 */
import { buildLink, tryBuildLink, type AffiliateEnv } from '@akaya/affiliate';
import type { Offer, StoreId } from '../types.js';

/** public search page for a store (sample offers link here) */
export function storeSearchUrl(store: StoreId, q: string): string {
  if (store === 'other') return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(q)}`;
  return buildLink({ platform: store, intent: 'search', params: { q } }).webUrl;
}

/** tracked "Buy on X" link: affiliate ID or network wrapper when configured, plus UTM */
export function offerLink(o: Pick<Offer, 'store' | 'url' | 'title'>, env: AffiliateEnv): string {
  if (o.store === 'other') return o.url;
  const base = { platform: o.store, campaign: 'shopping-agent', content: 'offer', env } as const;
  // a URL off the store's own hosts is never tagged or forwarded: fall back to a store search
  const link =
    tryBuildLink({ ...base, intent: 'product', params: { url: o.url, q: o.title } }) ??
    tryBuildLink({ ...base, intent: 'search', params: { q: o.title } });
  return link?.trackedUrl ?? storeSearchUrl(o.store, o.title);
}
