/**
 * Affiliate disclosure copy. Show the short line next to any button whose link has `affiliate.active`
 * (FTC 16 CFR 255 / ASCI influencer & affiliate guidelines: clear, close to the link, before the click).
 */
import { getPlatform } from './platforms.js';
import type { BuiltLink } from './types.js';

export type Lang = 'en' | 'hi';

export const AMAZON_ASSOCIATE_STATEMENT = 'As an Amazon Associate, Akaya earns from qualifying purchases.';

const COPY = {
  short: { en: 'Akaya may earn a commission', hi: 'Akaya को कमीशन मिल सकता है' },
  long: {
    en: 'Akaya may earn a commission when you book or buy through these links, at no extra cost to you. Prices, availability and payment are handled by the store.',
    hi: 'इन लिंक से बुकिंग या खरीदारी करने पर Akaya को कमीशन मिल सकता है, आपके लिए कोई अतिरिक्त कीमत नहीं। कीमत, उपलब्धता और भुगतान स्टोर तय करता है।',
  },
} as const;

/** platforms whose programme terms require their own statement */
const AMAZON_IDS = new Set(['amazon', 'amazon-fresh']);

export function disclosureText(opts: { style?: 'short' | 'long'; lang?: Lang; platforms?: string[] } = {}): string {
  const style = opts.style ?? 'short';
  const base = COPY[style][opts.lang ?? 'en'];
  if (style === 'long' && opts.platforms?.some((p) => AMAZON_IDS.has(p)))
    return `${base} ${AMAZON_ASSOCIATE_STATEMENT}`;
  return base;
}

/** true when at least one link carries an affiliate ID, so a disclosure must be shown */
export function needsDisclosure(links: Pick<BuiltLink, 'affiliate'>[]): boolean {
  return links.some((l) => l.affiliate.active);
}

/**
 * true when the platform has an affiliate programme (direct or via a network), i.e. a button for it can earn
 * a commission once IDs are configured. UIs show the short disclosure next to such buttons.
 */
export function hasProgramme(platform: string): boolean {
  const a = getPlatform(platform)?.affiliate;
  return !!a && !a.none && (!!a.param || !!a.networks?.length);
}
