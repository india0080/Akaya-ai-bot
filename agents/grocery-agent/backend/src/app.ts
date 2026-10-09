import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { jsonSchemaTransform, serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod';
import type { Config } from './config.js';
import { buildProviders } from './providers/registry.js';
import { routes } from './routes/index.js';
import { TtlCache } from './services/cache.js';
import { CheckoutService, HttpError, type CheckoutState } from './services/checkout.js';
import { JsonDb } from './services/db.js';
import { ListService, type ListState } from './services/lists.js';
import { NotificationService, type NotifState } from './services/notifications.js';
import { JobQueue } from './services/queue.js';
import { QuoteService } from './services/quotes.js';
import { StoreId } from './types.js';

type DbShape = NotifState & CheckoutState & ListState;

export async function buildApp(cfg: Config, opts: { logger?: boolean; persist?: boolean; timers?: boolean } = {}) {
  const app = Fastify({ logger: opts.logger ?? false }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof HttpError) return reply.code(err.status).send({ error: err.message });
    const e = err as { statusCode?: number; message: string; code?: string };
    if (e.statusCode && e.statusCode < 500) return reply.code(e.statusCode).send({ statusCode: e.statusCode, code: e.code, error: e.message, message: e.message });
    app.log.error(err);
    return reply.code(500).send({ error: 'internal error' });
  });

  await app.register(cors, {
    origin: cfg.CORS_ORIGIN === '*' ? true : cfg.CORS_ORIGIN.split(','),
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['content-type', 'x-user-id'],
  });
  await app.register(rateLimit, { max: cfg.RATE_LIMIT_PER_MINUTE, timeWindow: '1 minute' });
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Akaya Grocery Agent API',
        version: '0.1.0',
        description:
          'Parses grocery lists (English / Hindi / Hinglish), compares Swiggy Instamart, Blinkit, Zepto, BigBasket and Amazon Fresh, builds the cheapest / fastest / split basket, fills the cart and notifies the user to pay. **Never pays**: the user pays in the store app (UPI / card / OTP). Store providers run on Mock (SAMPLE data) until a Playwright session or partnership API is configured.',
      },
      servers: [{ url: `http://localhost:${cfg.PORT}` }],
      tags: [{ name: 'lists' }, { name: 'quotes' }, { name: 'jobs' }, { name: 'checkout' }, { name: 'orders' }, { name: 'settings' }, { name: 'notifications' }, { name: 'meta' }],
    },
    transform: jsonSchemaTransform,
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  const { byStore, real, partners, wanted } = buildProviders(cfg);
  const cache = new TtlCache<never>(cfg.CACHE_TTL_SECONDS * 1000);
  const queue = new JobQueue(cfg.QUEUE_CONCURRENCY);
  const db = new JsonDb<DbShape>(opts.persist === false ? null : cfg.DATA_FILE, { notifications: [], pushSubs: [], checkouts: [], orders: [], lists: [], settings: {} });
  const notifications = new NotificationService(db, cfg, (m) => app.log.info(m));
  const quotes = new QuoteService(cfg, byStore, cache, queue);
  const checkout = new CheckoutService(cfg, db, quotes, queue, notifications);
  const lists = new ListService(db, quotes, queue, checkout, notifications, {
    pincode: cfg.DEFAULT_PINCODE,
    address: cfg.DEFAULT_ADDRESS,
    stores: [...StoreId.options],
    strategy: 'balanced',
  });
  if (cfg.SEED_SAMPLE_LISTS && opts.persist !== false && !db.data.lists.length) {
    // sample lists for the demo user (labelled as samples in docs); delete or edit them freely
    lists.create('demo', { name: 'Weekly staples', emoji: '🧺', text: '2 kg aata, 1 L Amul milk, 6 eggs, 1 kg pyaz, 500 g tamatar, 1 kg toor dal, 200 g paneer', budget: 900, schedule: { enabled: true, days: [6], time: '09:00', strategy: 'cheapest', autoFill: true } });
    lists.create('demo', { name: 'Breakfast', emoji: '🍳', text: '1 bread, 500 g Amul butter, 12 eggs, 1 dozen kele, 500 g poha', schedule: { enabled: false, days: [3], time: '19:00', strategy: 'fastest', autoFill: false } });
    lists.create('demo', { name: 'Party snacks', emoji: '🎉', text: '3 Lays chips, 2 L Coca-Cola, 2 biscuits, 2 L paani' });
  }
  if (opts.timers !== false) {
    lists.start(cfg.SCHEDULE_TICK_MS);
    const t = setInterval(() => checkout.tickOrders(), 5000);
    t.unref();
    app.addHook('onClose', async () => clearInterval(t));
  }
  app.addHook('onClose', async () => lists.stop());

  await app.register(routes({ cfg, quotes, checkout, lists, queue, notifications, cache: cache as TtlCache<unknown>, providers: byStore, real, partners, wanted }));
  return Object.assign(app, { services: { quotes, checkout, lists, queue, notifications, cache, providers: byStore } });
}
