import { describe, expect, it, vi } from 'vitest';
import { TtlCache } from '@akaya/server-kit';
import { JobQueue } from '@akaya/server-kit';
import { AmazonProvider } from '../src/providers/amazon.js';
import { offerLink, storeSearchUrl } from '../src/engine/affiliate.js';
import { buildProviders } from '../src/providers/registry.js';
import { loadConfig } from '../src/config.js';

describe('TtlCache', () => {
  it('expires entries and counts hits', () => {
    vi.useFakeTimers();
    const c = new TtlCache<number>(1000);
    c.set('a', 1);
    expect(c.get('a')).toBe(1);
    vi.advanceTimersByTime(1500);
    expect(c.get('a')).toBeUndefined();
    expect(c.stats().hits).toBe(1);
    vi.useRealTimers();
  });
  it('evicts least recently used past max size', () => {
    const c = new TtlCache<number>(60000, 2);
    c.set('a', 1);
    c.set('b', 2);
    c.get('a');
    c.set('c', 3);
    expect(c.get('b')).toBeUndefined();
    expect(c.get('a')).toBe(1);
  });
});

describe('JobQueue', () => {
  it('respects concurrency and records progress/results', async () => {
    const q = new JobQueue(2);
    let live = 0;
    let peak = 0;
    const jobs = Array.from({ length: 5 }, (_, i) =>
      q.enqueue('t', async (report) => {
        live++;
        peak = Math.max(peak, live);
        report({ step: i });
        await new Promise((r) => setTimeout(r, 20));
        live--;
        return i * 2;
      }),
    );
    await new Promise((r) => setTimeout(r, 200));
    expect(peak).toBe(2);
    expect(jobs.map((j) => j.status)).toEqual(Array(5).fill('done'));
    expect(jobs[3].result).toBe(6);
    expect(jobs[3].progress).toEqual([{ step: 3 }]);
  });
  it('marks failures', async () => {
    const q = new JobQueue(1);
    const j = q.enqueue('t', async () => {
      throw new Error('boom');
    });
    await new Promise((r) => setTimeout(r, 20));
    expect(j.status).toBe('failed');
    expect(j.error).toContain('boom');
  });
});

describe('providers & affiliate', () => {
  it('falls back to Mock when no real keys are set', () => {
    const { active } = buildProviders(loadConfig({ PROVIDERS: 'amazon,flipkart,serpapi' }));
    expect(active.map((p) => p.id)).toEqual(['mock']);
  });
  it('real providers report not configured without keys', () => {
    const { all } = buildProviders(loadConfig({}));
    for (const p of all.filter((x) => x.kind !== 'mock')) expect(p.configured()).toBe(false);
  });
  it('builds store links with @akaya/affiliate: UTM always, partner tags only when configured', () => {
    const o = { store: 'amazon', url: 'https://www.amazon.in/s?k=bag', title: 'Bag' } as const;
    const plain = new URL(offerLink(o, {}));
    expect(plain.searchParams.get('k')).toBe('bag');
    expect(plain.searchParams.get('utm_source')).toBe('akaya');
    expect(plain.searchParams.get('utm_campaign')).toBe('shopping-agent');
    expect(plain.searchParams.has('tag')).toBe(false);
    expect(new URL(offerLink(o, { AMAZON_TAG_IN: 'akaya-21' })).searchParams.get('tag')).toBe('akaya-21');
    expect(new URL(offerLink({ store: 'flipkart', url: 'https://www.flipkart.com/search?q=bag', title: 'Bag' }, { FLIPKART_AFFILIATE_ID: 'akayafk' })).searchParams.get('affid')).toBe('akayafk');
    // a URL on another host never gets a tag (falls back to a store search)
    expect(new URL(offerLink({ store: 'amazon', url: 'https://evil.example/x', title: 'Bag' }, { AMAZON_TAG_IN: 'akaya-21' })).host).toBe('www.amazon.in');
    expect(storeSearchUrl('reliance-digital', 'buds')).toBe('https://www.reliancedigital.in/search?q=buds');
  });
  it('Amazon Creators API: caches the OAuth token and sends the India marketplace', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fake = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      if (url.includes('/auth/o2/token')) return new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }));
      return new Response(JSON.stringify({ searchResult: { items: [{ asin: 'B0TEST', detailPageURL: 'https://www.amazon.in/dp/B0TEST?tag=akaya-21', itemInfo: { title: { displayValue: 'Test Bag' } }, offersV2: { listings: [{ price: { money: { amount: 999 }, savingBasis: { money: { amount: 1499 } } } }] }, customerReviews: { count: 120, starRating: { value: 4.3 } } }] } }));
    }) as unknown as typeof fetch;
    const cfg = loadConfig({ AMAZON_CREDENTIAL_ID: 'id', AMAZON_CREDENTIAL_SECRET: 'secret', AMAZON_TAG_IN: 'akaya-21' });
    const p = new AmazonProvider(cfg, fake);
    expect(p.configured()).toBe(true);
    const offers = await p.search('school bag');
    await p.search('earbuds');
    expect(calls.filter((c) => c.url.includes('/auth/o2/token')).length).toBe(1);
    const req = calls.find((c) => c.url.endsWith('/searchItems'))!;
    expect(req.url).toBe('https://creatorsapi.amazon/catalog/v1/searchItems');
    expect((req.init.headers as Record<string, string>)['x-marketplace']).toBe('www.amazon.in');
    expect((req.init.headers as Record<string, string>).authorization).toBe('Bearer tok');
    expect(JSON.parse(String(req.init.body))).toMatchObject({ keywords: 'school bag', partnerTag: 'akaya-21', marketplace: 'www.amazon.in' });
    expect(offers[0]).toMatchObject({ price: 999, mrp: 1499, rating: 4.3, sample: false, store: 'amazon' });
  });
});
