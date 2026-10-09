import type { Config } from '../config.js';
import { StoreId, type StoreId as Sid } from '../types.js';
import { MockStoreProvider } from './mock.js';
import { PlaywrightStoreProvider, type StoreFlow } from './playwright/base.js';
import { amazonfreshFlow } from './playwright/amazonfresh.js';
import { bigbasketFlow } from './playwright/bigbasket.js';
import { blinkitFlow } from './playwright/blinkit.js';
import { instamartFlow } from './playwright/instamart.js';
import { zeptoFlow } from './playwright/zepto.js';
import type { GroceryProvider } from './types.js';
import { instamartMcp, McpStoreProvider, zeptoMcp } from './mcp/base.js';

const FLOWS: Record<Sid, StoreFlow> = {
  instamart: instamartFlow,
  blinkit: blinkitFlow,
  zepto: zeptoFlow,
  bigbasket: bigbasketFlow,
  'amazon-fresh': amazonfreshFlow,
};

/**
 * One provider per store. If the store is listed in PROVIDERS: official MCP (partner) when its token is
 * set, else Playwright when its session is set up, else Mock. Unlisted stores use Mock (sample data).
 */
export function buildProviders(cfg: Config) {
  const wanted = new Set(
    cfg.PROVIDERS.split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
  const byStore = new Map<Sid, GroceryProvider>();
  const real: PlaywrightStoreProvider[] = [];
  const partners: McpStoreProvider[] = [instamartMcp, zeptoMcp].map((f) => new McpStoreProvider(f, cfg));
  for (const store of StoreId.options) {
    const pw = new PlaywrightStoreProvider(FLOWS[store], cfg);
    real.push(pw);
    const mcp = partners.find((p) => p.store === store);
    const chosen = !wanted.has(store) ? null : mcp?.configured() ? mcp : pw.configured() ? pw : null;
    byStore.set(store, chosen ?? new MockStoreProvider(store, cfg.MOCK_LATENCY_MS));
  }
  return { byStore, real, partners, wanted };
}
