import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { Config } from '../config.js';
import { STORES, Filters, Preset, SortBy, ProductResult, ParsedQuery, StoreId } from '../types.js';
import { parseQuery } from '../engine/queryParser.js';
import { bayes } from '../engine/ranking.js';
import type { ShoppingProvider } from '../providers/types.js';
import type { SearchService, SearchResult } from '../services/search.js';
import type { JobQueue } from '../services/queue.js';
import type { WatchlistService } from '../services/watchlist.js';
import type { NotificationService } from '../services/notifications.js';
import type { TtlCache } from '../services/cache.js';
import type { JsonDb } from '../services/db.js';
import { openSse, userId } from '../lib/sse.js';

export interface Deps {
  cfg: Config;
  search: SearchService;
  queue: JobQueue;
  watchlist: WatchlistService;
  notifications: NotificationService;
  cache: TtlCache<unknown>;
  allProviders: ShoppingProvider[];
  wanted: Set<string>;
  db: JsonDb<{ recent: { userId: string; q: string; at: number }[] } & object>;
}

const ErrorRes = z.object({ error: z.string() });
const SearchBody = z.object({
  query: z.string().min(1).max(200).describe('Natural language, e.g. "school bag under 1500" or "1500 se kam ka basta"'),
  filters: Filters.optional(),
  sort: SortBy.optional(),
  preset: Preset.optional().describe('Ranking weights preset'),
  /** wait for the job and return results in the same response */
  wait: z.boolean().optional(),
});
const JobView = z.object({
  id: z.string(),
  type: z.string(),
  status: z.enum(['queued', 'running', 'done', 'failed']),
  progress: z.array(z.any()),
  error: z.string().optional(),
  result: z.any().optional().describe('SearchResult when done'),
});

export const routes =
  (d: Deps): FastifyPluginAsyncZod =>
  async (app) => {
    const searchLimit = { config: { rateLimit: { max: d.cfg.SEARCH_RATE_LIMIT_PER_MINUTE, timeWindow: '1 minute' } } };

    app.get('/api/health', { schema: { tags: ['meta'], summary: 'Health check' } }, async () => ({
      ok: true,
      service: 'akaya-shopping-agent',
      providers: d.search.providers.map((p) => p.id),
      queue: d.queue.stats(),
      cache: d.cache.stats(),
    }));

    app.get('/api/providers', { schema: { tags: ['meta'], summary: 'Data providers and whether they are connected' } }, async () => ({
      active: d.search.providers.map((p) => p.id),
      providers: d.allProviders.map((p) => ({
        id: p.id,
        label: p.label,
        kind: p.kind,
        stores: p.stores,
        requested: d.wanted.has(p.id),
        configured: p.configured(),
        active: d.search.providers.includes(p),
        sampleData: p.kind === 'mock',
        setupHint: p.setupHint,
      })),
      stores: STORES,
    }));

    app.post(
      '/api/parse',
      { schema: { tags: ['search'], summary: 'Parse a natural-language query (EN / HI / Hinglish)', body: z.object({ query: z.string().min(1).max(200) }), response: { 200: ParsedQuery } } },
      async (req) => parseQuery(req.body.query),
    );

    app.post(
      '/api/search',
      {
        ...searchLimit,
        schema: {
          tags: ['search'],
          summary: 'Start a multi-store search job',
          description: 'Returns a job. Poll GET /api/jobs/{id} or stream GET /api/jobs/{id}/events. With `wait: true` the response includes results.',
          body: SearchBody,
          response: { 202: JobView, 200: JobView },
        },
      },
      async (req, reply) => {
        const uid = userId(req);
        d.db.data.recent = [{ userId: uid, q: req.body.query, at: Date.now() }, ...d.db.data.recent.filter((r) => !(r.userId === uid && r.q.toLowerCase() === req.body.query.toLowerCase()))].slice(0, 50);
        d.db.save();
        const job = d.search.start(req.body);
        if (req.body.wait && job.status !== 'done') {
          await new Promise<void>((resolve) => {
            const on = () => {
              if (job.status === 'done' || job.status === 'failed') {
                d.queue.off(job.id, on);
                resolve();
              }
            };
            d.queue.on(job.id, on);
          });
        }
        return reply.code(job.status === 'done' ? 200 : 202).send(job);
      },
    );

    app.get('/api/searches/recent', { schema: { tags: ['search'], summary: 'Recent searches for the user' } }, async (req) =>
      d.db.data.recent.filter((r) => r.userId === userId(req)).slice(0, 10),
    );

    app.get(
      '/api/jobs/:id',
      { schema: { tags: ['jobs'], summary: 'Job status, progress and result', params: z.object({ id: z.string() }), response: { 200: JobView, 404: ErrorRes } } },
      async (req, reply) => {
        const job = d.queue.get(req.params.id);
        if (!job) return reply.code(404).send({ error: 'job not found' });
        return job;
      },
    );

    app.get(
      '/api/jobs/:id/events',
      { schema: { tags: ['jobs'], summary: 'SSE stream of job progress (events: progress, status, done)', params: z.object({ id: z.string() }) } },
      async (req, reply) => {
        const job = d.queue.get(req.params.id);
        if (!job) return reply.code(404).send({ error: 'job not found' });
        const sse = openSse(req, reply, d.cfg.CORS_ORIGIN);
        for (const p of job.progress) sse.send('progress', p);
        if (job.status === 'done' || job.status === 'failed') {
          sse.send('done', job);
          return sse.end();
        }
        const on = (e: { type: string; progress?: unknown }) => {
          if (e.type === 'progress') sse.send('progress', e.progress);
          else if (job.status === 'done' || job.status === 'failed') {
            sse.send('done', job);
            sse.end();
          } else sse.send('status', { status: job.status });
        };
        d.queue.on(job.id, on);
        sse.onClose(() => d.queue.off(job.id, on));
      },
    );

    app.get(
      '/api/products/:key',
      { schema: { tags: ['products'], summary: 'Product with ranked offers from every store', params: z.object({ key: z.string() }), response: { 200: ProductResult, 404: ErrorRes } } },
      async (req, reply) => {
        const p = d.search.getProduct(req.params.key);
        if (!p) return reply.code(404).send({ error: 'product not found (search first)' });
        return p;
      },
    );

    app.get(
      '/api/products/:key/history',
      {
        schema: {
          tags: ['products'],
          summary: 'Price history per store + buy-now verdict',
          params: z.object({ key: z.string() }),
          querystring: z.object({ days: z.coerce.number().int().min(7).max(365).default(90) }),
        },
      },
      async (req, reply) => {
        const p = d.search.getProduct(req.params.key);
        if (!p) return reply.code(404).send({ error: 'product not found' });
        const series = await Promise.all(
          p.offers.map(async (o) => ({
            store: o.store,
            storeName: o.storeName,
            points: (await d.search.providerFor(o)?.priceHistory?.(o, req.query.days)) ?? [],
          })),
        );
        const bestSeries = series.find((s) => s.store === p.best.store) ?? series[0];
        const prices = bestSeries?.points.map((x) => x.price) ?? [];
        const low = prices.length ? Math.min(...prices) : p.best.price;
        const high = prices.length ? Math.max(...prices) : p.best.price;
        const avg = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : p.best.price;
        const cur = p.best.price;
        const verdict = cur <= low * 1.03 ? 'great' : cur <= avg ? 'good' : 'wait';
        return {
          key: p.key,
          days: req.query.days,
          series,
          stats: { current: cur, low, high, avg },
          verdict,
          verdictText:
            verdict === 'great'
              ? `Near the ${req.query.days}-day low. Good time to buy.`
              : verdict === 'good'
                ? `Below the ${req.query.days}-day average (₹${avg.toLocaleString('en-IN')}).`
                : `Above average. Prices dipped to ₹${low.toLocaleString('en-IN')} recently, so consider a price alert.`,
          sample: p.sample,
        };
      },
    );

    app.post(
      '/api/compare',
      { schema: { tags: ['products'], summary: 'Side-by-side comparison of 2–4 products', body: z.object({ keys: z.array(z.string()).min(2).max(4) }) } },
      async (req, reply) => {
        const products = req.body.keys.map((k) => d.search.getProduct(k)).filter((p): p is NonNullable<typeof p> => !!p);
        if (products.length < 2) return reply.code(404).send({ error: 'need at least 2 known products' });
        type Row = { label: string; values: (string | number)[]; best: number | null };
        const row = (label: string, vals: number[], fmt: (n: number) => string, better: 'low' | 'high' | null): Row => {
          const target = better === 'low' ? Math.min(...vals) : better === 'high' ? Math.max(...vals) : NaN;
          return { label, values: vals.map(fmt), best: better ? vals.indexOf(target) : null };
        };
        const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
        const rows: Row[] = [
          row('Best price', products.map((p) => p.best.price), inr, 'low'),
          row('Store', products.map((_, i) => i), (i) => products[i].best.storeName, null),
          row('Rating', products.map((p) => p.best.rating), (n) => `${n}★`, 'high'),
          row('Adjusted rating', products.map((p) => Math.round(bayes(p.best.rating, p.best.ratingCount) * 100) / 100), (n) => n.toFixed(2), 'high'),
          row('Ratings', products.map((p) => p.best.ratingCount), (n) => n.toLocaleString('en-IN'), 'high'),
          row('Delivery', products.map((p) => p.best.delivery.days), (n) => `${n} day${n === 1 ? '' : 's'}`, 'low'),
          row('Seller trust', products.map((p) => Math.round(p.best.breakdown.trust * 100)), (n) => `${n}/100`, 'high'),
          row('Fake-review risk', products.map((p) => Math.round(p.best.fakeRisk.score * 100)), (n) => (n >= 50 ? `High (${n})` : n >= 25 ? `Medium (${n})` : `Low (${n})`), 'low'),
          row('Discount', products.map((p) => p.best.discountPct), (n) => `${n}%`, 'high'),
          row('Stores', products.map((p) => p.offers.length), (n) => String(n), 'high'),
          row('Akaya score', products.map((p) => Math.round(p.score * 100)), (n) => `${n}`, 'high'),
        ];
        const specKeys = [...new Set(products.flatMap((p) => Object.keys(p.best.specs)))];
        for (const k of specKeys) rows.push({ label: k, values: products.map((p) => p.best.specs[k] ?? '—'), best: null });
        const winner = products.reduce((a, b) => (b.score > a.score ? b : a));
        return { products, rows, winner: winner.key, sample: products.some((p) => p.sample) };
      },
    );

    // ---------- watchlist & alerts
    const WatchBody = z.object({
      offerId: z.string().optional(),
      productKey: z.string().optional(),
      targetPrice: z.number().positive().optional(),
      anyDrop: z.boolean().optional(),
    });
    app.get('/api/watchlist', { schema: { tags: ['watchlist'], summary: 'Watchlist with current prices' } }, async (req) => d.watchlist.list(userId(req)));
    app.post('/api/watchlist', { schema: { tags: ['watchlist'], summary: 'Watch a product / set a price alert', body: WatchBody } }, async (req, reply) => {
      if (!req.body.offerId && !req.body.productKey) return reply.code(400).send({ error: 'offerId or productKey required' });
      const w = d.watchlist.add(userId(req), req.body);
      if (!w) return reply.code(404).send({ error: 'offer not found (search first)' });
      return reply.code(201).send(w);
    });
    app.patch(
      '/api/watchlist/:id',
      { schema: { tags: ['watchlist'], summary: 'Update target price / drop alerts', params: z.object({ id: z.string() }), body: z.object({ targetPrice: z.number().positive().nullable().optional(), anyDrop: z.boolean().optional() }) } },
      async (req, reply) => d.watchlist.update(userId(req), req.params.id, req.body) ?? reply.code(404).send({ error: 'not found' }),
    );
    app.delete('/api/watchlist/:id', { schema: { tags: ['watchlist'], summary: 'Stop watching', params: z.object({ id: z.string() }) } }, async (req, reply) =>
      d.watchlist.remove(userId(req), req.params.id) ? reply.code(204).send() : reply.code(404).send({ error: 'not found' }),
    );
    app.post('/api/watchlist/check', { schema: { tags: ['watchlist'], summary: 'Run the price checker now (normally periodic)' } }, async (req) => {
      const fired = await d.watchlist.checkPrices(userId(req));
      return { checked: d.watchlist.list(userId(req)).length, alerts: fired.map((f) => ({ id: f.item.id, title: f.item.title, price: f.item.currentPrice, reason: f.reason })) };
    });

    // ---------- notifications
    app.get('/api/notifications', { schema: { tags: ['notifications'], summary: 'In-app notifications' } }, async (req) => d.notifications.list(userId(req)));
    app.post('/api/notifications/read', { schema: { tags: ['notifications'], summary: 'Mark notifications read', body: z.object({ id: z.string().optional() }) } }, async (req) => {
      d.notifications.markRead(userId(req), req.body.id);
      return { ok: true };
    });
    app.get('/api/notifications/stream', { schema: { tags: ['notifications'], summary: 'SSE stream of new notifications (event: notification)', querystring: z.object({ user: z.string().optional() }) } }, async (req, reply) => {
      const uid = req.query.user ?? userId(req);
      const sse = openSse(req, reply, d.cfg.CORS_ORIGIN);
      const on = (n: unknown) => sse.send('notification', n);
      d.notifications.on(`user:${uid}`, on);
      sse.onClose(() => d.notifications.off(`user:${uid}`, on));
    });
    app.post(
      '/api/notifications/subscribe',
      { schema: { tags: ['notifications'], summary: 'Register a Web Push subscription or FCM token (delivery is a stub until keys are set)', body: z.object({ kind: z.enum(['webpush', 'fcm']), token: z.string().min(10) }) } },
      async (req) => {
        d.notifications.subscribe(userId(req), req.body.kind, req.body.token);
        return { ok: true, delivery: req.body.kind === 'webpush' ? (d.cfg.VAPID_PUBLIC_KEY ? 'stub (add web-push)' : 'stub (VAPID keys not set)') : 'stub (FCM not configured)' };
      },
    );
    app.post('/api/notifications/test', { schema: { tags: ['notifications'], summary: 'Send a test notification', body: z.object({ title: z.string().default('Test from Akaya Shopping') }) } }, async (req) =>
      d.notifications.notify(userId(req), { kind: 'test', title: req.body.title, body: 'Notifications are working.' }),
    );

    app.get('/api/stores', { schema: { tags: ['meta'], summary: 'Known stores' } }, async () => Object.entries(STORES).map(([id, s]) => ({ id: id as z.infer<typeof StoreId>, ...s })));
  };

export type { SearchResult };
