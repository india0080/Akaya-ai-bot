import { buildLink } from '@akaya/affiliate';
/**
 * Playwright adapter base: drives a store's website in the USER'S OWN logged-in browser session
 * (Playwright `storageState` file exported after the user logs in once with OTP).
 *
 * Status: SKELETON, not connected. Selectors and flows are TODOs per store; enable only with
 * ENABLE_PLAYWRIGHT=true and a storage-state path. Read docs/PROVIDERS.md first:
 *  - These sites have no public API; automation may breach their terms of service and can be blocked
 *    (bot detection, CAPTCHAs, account flags). Prefer a partnership API where one is offered.
 *  - Runs only for the logged-in user, at human pace, on their explicit request.
 *  - NEVER clicks "Place order" / "Pay". The flow stops at a filled cart; the user pays in the app.
 */
import type { Config } from '../../config.js';
import { STORES, type Fees, type ParsedItem, type Sku, type StoreId } from '../../types.js';
import { PROFILES } from '../mock.js';
import {
  ProviderNotConfiguredError,
  type CartLineInput,
  type FillProgress,
  type FillResult,
  type GroceryProvider,
  type Serviceability,
} from '../types.js';

/** store home / search pages come from the shared link registry (@akaya/affiliate) */
export const storeHome = (store: StoreId) => buildLink({ platform: store, intent: 'home' }).webUrl;
export const storeSearchUrl = (store: StoreId, q: string) =>
  buildLink({ platform: store, intent: 'grocery', params: { q } }).webUrl;

export interface StoreFlow {
  store: StoreId;
  /** env key holding the storage-state JSON path */
  stateKey: keyof Config;
  /** TODO selectors: fill these in per store after inspecting the logged-in site */
  selectors: {
    locationPill?: string;
    productCard: string;
    productName: string;
    productPrice: string;
    productSize: string;
    addButton: string;
    cartTotal: string;
  };
}

export class PlaywrightStoreProvider implements GroceryProvider {
  id: string;
  label: string;
  kind = 'playwright' as const;
  setupHint: string;
  readonly store: StoreId;
  constructor(
    private flow: StoreFlow,
    private cfg: Config,
  ) {
    this.store = flow.store;
    this.id = `playwright:${flow.store}`;
    this.label = `${STORES[flow.store].name} (your session · Playwright)`;
    this.setupHint = `ENABLE_PLAYWRIGHT=true and ${String(flow.stateKey)}=<path to storage-state.json> (see docs/PROVIDERS.md)`;
  }
  configured() {
    return !!(this.cfg.ENABLE_PLAYWRIGHT && this.cfg[this.flow.stateKey]);
  }

  private async browser() {
    if (!this.configured()) throw new ProviderNotConfiguredError(this.id, this.setupHint);
    const pw = await import(/* @vite-ignore */ 'playwright' as string).catch(() => null);
    if (!pw) throw new Error('Playwright is not installed: npm i playwright && npx playwright install chromium');
    const browser = await pw.chromium.launch({ headless: this.cfg.PLAYWRIGHT_HEADLESS });
    const context = await browser.newContext({
      storageState: String(this.cfg[this.flow.stateKey]),
      locale: 'en-IN',
      timezoneId: 'Asia/Kolkata',
    });
    return { browser, context };
  }

  async serviceability(): Promise<Serviceability> {
    // TODO(playwright): open home, read the delivery-time pill / slot for the saved address.
    const p = PROFILES[this.store];
    return {
      serviceable: this.configured(),
      etaMin: Array.isArray(p.eta) ? p.eta[1] : 180,
      etaLabel: 'from store (TODO)',
    };
  }

  async findSkus(items: ParsedItem[]): Promise<Sku[]> {
    const { browser, context } = await this.browser();
    try {
      const page = await context.newPage();
      // TODO(playwright): for each item → page.goto(storeSearchUrl(flow.store, item.name)); wait for flow.selectors.productCard;
      // read name/size/price/stock for the first ~10 cards; map to Sku (unit from size text). Keep a
      // polite delay between searches. Return [] for items with no results.
      void page;
      void items;
      throw new Error(
        `TODO(playwright:${this.store}): implement product extraction (selectors in providers/playwright/${this.store}.ts)`,
      );
    } finally {
      await browser.close();
    }
  }

  fees(subtotal: number): Fees {
    // TODO(playwright): read real fees from the cart page; until then reuse sample rules.
    const f = PROFILES[this.store].fee;
    return {
      delivery: subtotal >= f.freeAbove ? 0 : f.delivery,
      handling: f.handling,
      smallCart: subtotal < f.smallCartBelow ? f.smallCart : 0,
      platform: f.platform,
    };
  }
  getSku() {
    return undefined;
  }

  async fillCart(lines: CartLineInput[], ctx: { onProgress?: (p: FillProgress) => void } = {}): Promise<FillResult> {
    const { browser, context } = await this.browser();
    try {
      ctx.onProgress?.({ store: this.store, step: 'opening' });
      const page = await context.newPage();
      // TODO(playwright): for each line → search → click flow.selectors.addButton `packs` times → verify
      // the cart badge; then open the cart, read flow.selectors.cartTotal into verifiedTotal.
      // STOP HERE. Do not click checkout / place order / pay. The user completes payment in the app.
      void page;
      void lines;
      throw new Error(`TODO(playwright:${this.store}): implement add-to-cart`);
    } finally {
      await browser.close();
    }
  }
}
