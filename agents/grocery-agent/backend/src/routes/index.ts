import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { Config } from '../config.js';
import { parseList } from '../engine/listParser.js';
import { openSse, userId } from '@akaya/server-kit';
import type { GroceryProvider } from '../providers/types.js';
import type { PlaywrightStoreProvider } from '../providers/playwright/base.js';
import type { McpStoreProvider } from '../providers/mcp/base.js';
import { ParsedItem, STORES, StoreId, Strategy } from '../types.js';
import type { TtlCache } from '@akaya/server-kit';
import type { CheckoutService } from '../services/checkout.js';
import type { ListService } from '../services/lists.js';
import type { NotificationService } from '@akaya/server-kit';
import type { JobQueue } from '@akaya/server-kit';
import type { QuoteService } from '../services/quotes.js';

export interface Deps {
  cfg: Config;
  quotes: QuoteService;
  checkout: CheckoutService;
  lists: ListService;
  queue: JobQueue;
  notifications: NotificationService;
  cache: TtlCache<unknown>;
  providers: Map<StoreId, GroceryProvider>;
  real: PlaywrightStoreProvider[];
  partners: McpStoreProvider[];
  wanted: Set<string>;
}

const Err = z.object({ error: z.string() });
const JobView = z.object({
  id: z.string(),
  type: z.string(),
  status: z.enum(['queued', 'running', 'done', 'failed']),
  progress: z.array(z.any()),
  error: z.string().optional(),
  result: z.any().optional(),
});
const QuoteBody = z.object({
  text: z.string().max(2000).optional().describe('free-text list, e.g. "2 kg aata, 1 L Amul milk, 6 eggs"'),
  items: z.array(ParsedItem).max(60).optional().describe('already-parsed (and possibly edited) items'),
  pincode: z
    .string()
    .regex(/^\d{6}$/)
    .optional(),
  address: z.string().max(120).optional(),
  budget: z.number().positive().optional(),
  stores: z.array(StoreId).optional(),
  wait: z.boolean().optional(),
});
const ScheduleZ = z.object({
  enabled: z.boolean(),
  days: z.array(z.number().int().min(0).max(6)),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  strategy: Strategy,
  autoFill: z.boolean(),
});
const ListBody = z.object({
  name: z.string().min(1).max(60),
  text: z.string().min(1).max(2000),
  emoji: z.string().max(8).optional(),
  budget: z.number().positive().optional(),
  schedule: ScheduleZ.optional(),
});

export const routes =
  (d: Deps): FastifyPluginAsyncZod =>
  async (app) => {
    const waitFor = (job: { id: string; status: string }) =>
      job.status === 'done' || job.status === 'failed'
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            const on = () => {
              if (job.status === 'done' || job.status === 'failed') {
                d.queue.off(job.id, on);
                resolve();
              }
            };
            d.queue.on(job.id, on);
          });

    app.get('/api/health', { schema: { tags: ['meta'], summary: 'Health check' } }, async () => ({
      ok: true,
      service: 'akaya-grocery-agent',
      queue: d.queue.stats(),
      cache: d.cache.stats(),
    }));

    app.get(
      '/api/providers',
      { schema: { tags: ['meta'], summary: 'Store providers: Mock (sample) vs Playwright (your session)' } },
      async () => ({
        stores: [...d.providers.entries()].map(([store, p]) => {
          const real = d.real.find((r) => r.store === store)!;
          const partner = d.partners.find((r) => r.store === store);
          return {
            store,
            name: STORES[store].name,
            mode: STORES[store].mode,
            active: { id: p.id, label: p.label, kind: p.kind, sampleData: p.kind === 'mock' },
            playwright: { requested: d.wanted.has(store), configured: real.configured(), setupHint: real.setupHint },
            officialMcp: partner ? { configured: partner.configured(), setupHint: partner.setupHint } : null,
          };
        }),
        note: 'No store offers a public price API. Instamart and Zepto run official MCP servers (OAuth, your account); others need your own logged-in session (Playwright) or a partnership. Payment always happens in the store app.',
      }),
    );

    app.get('/api/stores', { schema: { tags: ['meta'], summary: 'Stores' } }, async () =>
      Object.entries(STORES).map(([id, s]) => ({ id, ...s })),
    );

    app.post(
      '/api/parse',
      {
        schema: {
          tags: ['lists'],
          summary: 'Parse a grocery list (EN / HI / Hinglish)',
          body: z.object({ text: z.string().min(1).max(2000) }),
        },
      },
      async (req) => parseList(req.body.text),
    );

    app.post(
      '/api/quotes',
      {
        config: { rateLimit: { max: d.cfg.QUOTE_RATE_LIMIT_PER_MINUTE, timeWindow: '1 minute' } },
        schema: {
          tags: ['quotes'],
          summary: 'Compare stores and build optimized baskets (job)',
          description: 'Send `text` or edited `items`. Stream progress at /api/jobs/{id}/events, or pass `wait: true`.',
          body: QuoteBody,
          response: { 200: JobView, 202: JobView, 400: Err },
        },
      },
      async (req, reply) => {
        if (!req.body.text && !req.body.items) return reply.code(400).send({ error: 'text or items required' });
        const st = d.lists.settings(userId(req));
        const job = d.quotes.start({
          ...req.body,
          pincode: req.body.pincode ?? st.pincode,
          address: req.body.address ?? st.address,
          budget: req.body.budget ?? st.budget,
          stores: req.body.stores ?? st.stores,
        });
        if (req.body.wait) await waitFor(job);
        return reply.code(job.status === 'done' ? 200 : 202).send(job);
      },
    );
    app.get(
      '/api/quotes/:id',
      {
        schema: {
          tags: ['quotes'],
          summary: 'A finished quote (plans, per-store quotes)',
          params: z.object({ id: z.string() }),
        },
      },
      async (req, reply) =>
        d.quotes.get(req.params.id) ?? reply.code(404).send({ error: 'quote not found or expired' }),
    );

    app.get(
      '/api/jobs/:id',
      {
        schema: {
          tags: ['jobs'],
          summary: 'Job status',
          params: z.object({ id: z.string() }),
          response: { 200: JobView, 404: Err },
        },
      },
      async (req, reply) => {
        const j = d.queue.get(req.params.id);
        return j ?? reply.code(404).send({ error: 'job not found' });
      },
    );
    app.get(
      '/api/jobs/:id/events',
      {
        schema: {
          tags: ['jobs'],
          summary: 'SSE job progress (progress · status · done)',
          params: z.object({ id: z.string() }),
        },
      },
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
          }
        };
        d.queue.on(job.id, on);
        sse.onClose(() => d.queue.off(job.id, on));
      },
    );

    // ---------- checkout (fill cart → ready to pay → handoff → user-confirmed paid)
    const Ov = z.object({
      itemId: z.string(),
      store: StoreId,
      skuId: z.string(),
      packs: z.number().int().min(1).max(50),
    });
    app.post(
      '/api/checkouts',
      {
        schema: {
          tags: ['checkout'],
          summary: 'Fill store cart(s) for a plan (no payment)',
          description:
            'Creates one cart per store and fills it via the provider. Notifies "ready to pay" when done. Never pays.',
          body: z.object({
            quoteId: z.string(),
            planId: z.string(),
            overrides: z.array(Ov).optional(),
            removed: z.array(z.string()).optional(),
          }),
        },
      },
      async (req, reply) => reply.code(201).send(d.checkout.create(userId(req), req.body)),
    );
    app.get('/api/checkouts', { schema: { tags: ['checkout'], summary: 'Checkouts' } }, async (req) =>
      d.checkout.list(userId(req)),
    );
    app.get(
      '/api/checkouts/:id',
      { schema: { tags: ['checkout'], summary: 'Checkout status', params: z.object({ id: z.string() }) } },
      async (req, reply) => d.checkout.get(userId(req), req.params.id) ?? reply.code(404).send({ error: 'not found' }),
    );
    const CartP = z.object({ id: z.string(), store: StoreId });
    app.post(
      '/api/checkouts/:id/carts/:store/handoff',
      {
        schema: { tags: ['checkout'], summary: 'Confirm: get the store app / web link to pay yourself', params: CartP },
      },
      async (req) => d.checkout.handoff(userId(req), req.params.id, req.params.store),
    );
    app.post(
      '/api/checkouts/:id/carts/:store/paid',
      {
        schema: {
          tags: ['checkout'],
          summary: 'User confirms they paid in the store app (starts tracking)',
          params: CartP,
          body: z.object({ userConfirmed: z.literal(true) }),
        },
      },
      async (req, reply) => reply.code(201).send(d.checkout.markPaid(userId(req), req.params.id, req.params.store)),
    );
    app.post(
      '/api/checkouts/:id/cancel',
      {
        schema: {
          tags: ['checkout'],
          summary: 'Cancel (all carts or one store)',
          params: z.object({ id: z.string() }),
          body: z.object({ store: StoreId.optional() }),
        },
      },
      async (req) => d.checkout.cancel(userId(req), req.params.id, req.body.store),
    );

    app.get(
      '/api/orders',
      { schema: { tags: ['orders'], summary: 'Orders with tracking (simulated for Mock)' } },
      async (req) => d.checkout.orders(userId(req)),
    );
    app.get(
      '/api/orders/:id',
      { schema: { tags: ['orders'], summary: 'Order tracking', params: z.object({ id: z.string() }) } },
      async (req, reply) =>
        d.checkout.order(userId(req), req.params.id) ?? reply.code(404).send({ error: 'not found' }),
    );

    // ---------- lists & schedules
    app.get('/api/lists', { schema: { tags: ['lists'], summary: 'Saved lists' } }, async (req) =>
      d.lists.list(userId(req)),
    );
    app.post(
      '/api/lists',
      { schema: { tags: ['lists'], summary: 'Save a list (optional budget + weekly schedule)', body: ListBody } },
      async (req, reply) => reply.code(201).send(d.lists.create(userId(req), req.body)),
    );
    app.patch(
      '/api/lists/:id',
      {
        schema: {
          tags: ['lists'],
          summary: 'Update a list',
          params: z.object({ id: z.string() }),
          body: ListBody.partial(),
        },
      },
      async (req, reply) =>
        d.lists.update(userId(req), req.params.id, req.body) ?? reply.code(404).send({ error: 'not found' }),
    );
    app.delete(
      '/api/lists/:id',
      { schema: { tags: ['lists'], summary: 'Delete a list', params: z.object({ id: z.string() }) } },
      async (req, reply) =>
        d.lists.remove(userId(req), req.params.id)
          ? reply.code(204).send()
          : reply.code(404).send({ error: 'not found' }),
    );
    app.post(
      '/api/lists/:id/run',
      {
        schema: {
          tags: ['lists'],
          summary: 'Run a list now (quote, and fill cart if autoFill)',
          params: z.object({ id: z.string() }),
          body: z.object({ autoFill: z.boolean().optional() }),
        },
      },
      async (req, reply) => {
        const r = await d.lists.run(userId(req), req.params.id, { autoFill: req.body.autoFill });
        return r
          ? { quoteId: r.quote.id, checkoutId: r.checkoutId, plans: r.quote.plans.length }
          : reply.code(404).send({ error: 'not found' });
      },
    );

    // ---------- settings
    const SettingsZ = z.object({
      pincode: z.string().regex(/^\d{6}$/),
      address: z.string().max(120),
      budget: z.number().positive().nullable(),
      stores: z.array(StoreId).min(1),
      strategy: Strategy,
    });
    app.get(
      '/api/settings',
      { schema: { tags: ['settings'], summary: 'Delivery address, budget, stores, default strategy' } },
      async (req) => d.lists.settings(userId(req)),
    );
    app.patch(
      '/api/settings',
      { schema: { tags: ['settings'], summary: 'Update settings', body: SettingsZ.partial() } },
      async (req) => {
        const { budget, ...rest } = req.body;
        return d.lists.updateSettings(userId(req), {
          ...rest,
          ...(budget !== undefined ? { budget: budget ?? undefined } : {}),
        });
      },
    );

    // ---------- notifications
    app.get(
      '/api/notifications',
      { schema: { tags: ['notifications'], summary: 'In-app notifications' } },
      async (req) => d.notifications.list(userId(req)),
    );
    app.post(
      '/api/notifications/read',
      { schema: { tags: ['notifications'], summary: 'Mark read', body: z.object({ id: z.string().optional() }) } },
      async (req) => {
        d.notifications.markRead(userId(req), req.body.id);
        return { ok: true };
      },
    );
    app.get(
      '/api/notifications/stream',
      {
        schema: {
          tags: ['notifications'],
          summary: 'SSE stream (event: notification)',
          querystring: z.object({ user: z.string().optional() }),
        },
      },
      async (req, reply) => {
        const uid = req.query.user ?? userId(req);
        const sse = openSse(req, reply, d.cfg.CORS_ORIGIN);
        const on = (n: unknown) => sse.send('notification', n);
        d.notifications.on(`user:${uid}`, on);
        sse.onClose(() => d.notifications.off(`user:${uid}`, on));
      },
    );
    app.post(
      '/api/notifications/subscribe',
      {
        schema: {
          tags: ['notifications'],
          summary: 'Register Web Push / FCM token (delivery stub until keys are set)',
          body: z.object({ kind: z.enum(['webpush', 'fcm']), token: z.string().min(10) }),
        },
      },
      async (req) => {
        d.notifications.subscribe(userId(req), req.body.kind, req.body.token);
        return {
          ok: true,
          delivery:
            req.body.kind === 'webpush'
              ? d.cfg.VAPID_PUBLIC_KEY
                ? 'stub (add web-push)'
                : 'stub (VAPID keys not set)'
              : 'stub (FCM not configured)',
        };
      },
    );
    app.post(
      '/api/notifications/test',
      { schema: { tags: ['notifications'], summary: 'Send a test notification' } },
      async (req) =>
        d.notifications.notify(userId(req), {
          kind: 'test',
          title: 'Test from Akaya Grocery',
          body: 'Notifications are working.',
        }),
    );
  };
