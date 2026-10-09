import type { Config } from '../config.js';
import { AmazonProvider } from './amazon.js';
import { BrowserFallbackProvider } from './browser.js';
import { FlipkartProvider } from './flipkart.js';
import { MockProvider } from './mock.js';
import { SerpApiProvider } from './serpapi.js';
import type { ShoppingProvider } from './types.js';

export function buildProviders(cfg: Config) {
  const all: ShoppingProvider[] = [
    new MockProvider(cfg.MOCK_LATENCY_MS),
    new AmazonProvider(cfg),
    new FlipkartProvider(cfg),
    new SerpApiProvider(cfg),
    new BrowserFallbackProvider(cfg),
  ];
  const wanted = new Set(cfg.PROVIDERS.split(',').map((s) => s.trim()).filter(Boolean));
  const active = all.filter((p) => wanted.has(p.id) && p.configured());
  // Never end up with nothing: fall back to Mock (sample data) and say so in /api/providers.
  if (!active.length) active.push(all[0]);
  return { all, active, wanted };
}
