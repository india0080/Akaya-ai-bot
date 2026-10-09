/**
 * Grocery store provider interface. Quick-commerce apps (Instamart, Blinkit, Zepto, BB Now, Amazon
 * Fresh) have NO public APIs. Production options: (a) a partnership / affiliate API from the store,
 * or (b) a Playwright adapter that drives the store website in the USER'S OWN logged-in session.
 *
 * HARD RULE: providers may search, price and FILL A CART. They must never place an order or pay.
 * There is deliberately no `checkout()` / `pay()` method. The user always pays in the store app
 * (UPI / card / OTP), consistent with RBI rules on payment authentication.
 */
import type { Fees, ParsedItem, Sku, StoreId } from '../types.js';

export interface Serviceability {
  serviceable: boolean;
  etaMin: number;
  etaLabel: string;
}
export interface CartLineInput {
  skuId: string;
  name: string;
  packs: number;
}
export interface FillProgress {
  store: StoreId;
  step: 'opening' | 'adding' | 'added' | 'failed' | 'verifying' | 'ready';
  name?: string;
  i?: number;
  n?: number;
  message?: string;
}
export interface FillResult {
  added: number;
  failed: { skuId: string; reason: string }[];
  /** total read back from the store cart (when the adapter can read it) */
  verifiedTotal?: number;
  appUrl: string;
  webUrl: string;
}

export interface GroceryProvider {
  id: string;
  store: StoreId;
  label: string;
  kind: 'mock' | 'playwright' | 'partner';
  configured(): boolean;
  setupHint: string;
  serviceability(pincode: string, now?: Date): Promise<Serviceability>;
  /** every in-catalogue pack (any brand / size, with stock + price) for the given items */
  findSkus(items: ParsedItem[], ctx: { pincode: string; signal?: AbortSignal }): Promise<Sku[]>;
  /** fees the store would charge for a cart subtotal (sample rules for Mock) */
  fees(subtotal: number): Fees;
  getSku(id: string): Sku | undefined;
  /** add lines to the user's cart in their own session. NEVER places the order or pays. */
  fillCart(lines: CartLineInput[], ctx: { onProgress?: (p: FillProgress) => void; signal?: AbortSignal }): Promise<FillResult>;
}

export class ProviderNotConfiguredError extends Error {
  constructor(id: string, hint: string) {
    super(`${id} is not configured. ${hint}`);
  }
}
