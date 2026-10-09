/**
 * Provider adapter interface. Every data source (Mock, Amazon Creators API, Flipkart
 * Affiliate, SerpApi Google Shopping, optional browser fallback) implements this.
 */
import type { Offer, StoreId } from '../types.js';

export interface PricePoint {
  /** ISO date (yyyy-mm-dd) */
  date: string;
  price: number;
}

export interface SearchProgress {
  provider: string;
  store: StoreId | string;
  status: 'searching' | 'done' | 'error' | 'skipped';
  count?: number;
  message?: string;
}

export interface SearchOptions {
  limit?: number;
  signal?: AbortSignal;
  onProgress?: (p: SearchProgress) => void;
}

export interface ShoppingProvider {
  id: string;
  label: string;
  kind: 'mock' | 'api' | 'browser';
  /** stores this provider can return offers from */
  stores: StoreId[];
  /** true when the required keys are present */
  configured(): boolean;
  /** human hint shown in /api/providers when not configured */
  setupHint: string;
  search(query: string, opts?: SearchOptions): Promise<Offer[]>;
  /** price history if the source offers it (Mock simulates 90 days) */
  priceHistory?(offer: Offer, days?: number): Promise<PricePoint[]>;
  /** current price of a known offer, used by the price-alert checker */
  refreshPrice?(offer: Offer): Promise<number | null>;
}

export class ProviderNotConfiguredError extends Error {
  constructor(provider: string, hint: string) {
    super(`${provider} is not configured: ${hint}`);
  }
}
