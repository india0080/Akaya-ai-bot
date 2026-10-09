import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import type { Config } from './config.js';
import { buildProviders } from './providers/registry.js';
import { TtlCache } from '@akaya/server-kit';
import { JobQueue } from '@akaya/server-kit';
import { JsonDb } from '@akaya/server-kit';
import { NotificationService, type NotifState } from '@akaya/server-kit';
import { SearchService } from './services/search.js';
import { WatchlistService, type WatchState } from './services/watchlist.js';
import { routes } from './routes/index.js';

type DbShape = NotifState & WatchState & { recent: { userId: string; q: string; at: number }[] };

export async function buildApp(cfg: Config, opts: { logger?: boolean; persist?: boolean; watchers?: boolean } = {}) {
  const app = Fastify({ logger: opts.logger ?? false }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(cors, {
    origin: cfg.CORS_ORIGIN === '*' ? true : cfg.CORS_ORIGIN.split(','),
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['content-type', 'x-user-id'],
  });
  await app.register(rateLimit, { max: cfg.RATE_LIMIT_PER_MINUTE, timeWindow: '1 minute' });
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Akaya Shopping Agent API',
        version: '0.1.0',
        description:
          'Multi-store product search for India with ranking (price, rating, reviews, seller trust, delivery, fake-review signals), compare, price history, watchlist and price alerts. Runs on the Mock provider (SAMPLE data) until real provider keys are configured. The agent never checks out: "Buy" links open the store.',
      },
      servers: [{ url: `http://localhost:${cfg.PORT}` }],
      tags: [
        { name: 'search' },
        { name: 'jobs' },
        { name: 'products' },
        { name: 'watchlist' },
        { name: 'notifications' },
        { name: 'meta' },
      ],
    },
    transform: jsonSchemaTransform,
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  const { all, active, wanted } = buildProviders(cfg);
  const cache = new TtlCache<never>(cfg.CACHE_TTL_SECONDS * 1000);
  const queue = new JobQueue(cfg.QUEUE_CONCURRENCY);
  const db = new JsonDb<DbShape>(opts.persist === false ? null : cfg.DATA_FILE, {
    notifications: [],
    pushSubs: [],
    watchlist: [],
    recent: [],
  });
  const notifications = new NotificationService(db, cfg, (m) => app.log.info(m));
  const search = new SearchService(cfg, active, cache, queue);
  const watchlist = new WatchlistService(db, search, notifications);
  if (opts.watchers !== false) watchlist.startChecker(cfg.PRICE_CHECK_INTERVAL_MS);
  app.addHook('onClose', async () => watchlist.stop());

  await app.register(
    routes({
      cfg,
      search,
      queue,
      watchlist,
      notifications,
      cache: cache as TtlCache<unknown>,
      allProviders: all,
      wanted,
      db,
    }),
  );
  return Object.assign(app, { services: { search, queue, watchlist, notifications, cache } });
}
