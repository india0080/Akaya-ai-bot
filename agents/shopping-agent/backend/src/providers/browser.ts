/**
 * OPTIONAL browser-agent fallback (Playwright) for stores without an API.
 *
 * ⚠️ OFF by default (ENABLE_BROWSER_FALLBACK=false). Automated scraping can breach a store's
 * Terms of Use, trigger bot protection (CAPTCHA, IP blocks) and break when the page changes.
 * Get legal review and prefer official APIs / affiliate feeds. Never automate checkout.
 *
 * TODO(browser): `npm i playwright` + `npx playwright install chromium`, then implement
 * per-store selectors in `extract()`. Respect robots.txt, rate-limit hard and identify the bot.
 */
import type { Config } from '../config.js';
import type { Offer, StoreId } from '../types.js';
import { ProviderNotConfiguredError, type SearchOptions, type ShoppingProvider } from './types.js';

export class BrowserFallbackProvider implements ShoppingProvider {
  id = 'browser';
  label = 'Browser fallback (Playwright, off)';
  kind = 'browser' as const;
  stores: StoreId[] = ['myntra', 'meesho', 'ajio'];
  setupHint = 'Disabled. Set ENABLE_BROWSER_FALLBACK=true only after legal review (ToS / blocking risk).';
  constructor(private cfg: Config) {}

  configured() {
    return this.cfg.ENABLE_BROWSER_FALLBACK;
  }

  async search(_query: string, _opts: SearchOptions = {}): Promise<Offer[]> {
    if (!this.configured()) throw new ProviderNotConfiguredError(this.id, this.setupHint);
    // Dynamic import keeps Playwright optional for normal installs.
    const mod = 'playwright';
    const pw = await import(/* @vite-ignore */ mod).catch(() => null);
    if (!pw) throw new Error('Playwright is not installed. Run: npm i playwright && npx playwright install chromium');
    throw new Error('TODO(browser): implement per-store extraction (see docs/PROVIDERS.md).');
  }
}
