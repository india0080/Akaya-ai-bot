/**
 * go.akaya.one: short links → 302 to the affiliate URL, with a click log; short-link API; earnings imports;
 * per-platform report. Targets are always rebuilt by @akaya/affiliate from a platform + intent, so the
 * service can only ever redirect to registry hosts (or the configured network wrappers): no open redirect.
 */
import Fastify, { type FastifyInstance } from 'fastify';
import { readFileSync } from 'node:fs';
import { timingSafeEqual } from 'node:crypto';
import { buildLink, LinkError, PLATFORM_IDS, summarize, type BuildLinkInput, type Intent } from '@akaya/affiliate';
import { z } from 'zod';
import type { Config } from './config.js';
import { anonToken, istDate, SHORT_ID, shortId } from './ids.js';
import { getAdapter, ImportError, NotConfigured, ADAPTERS } from './imports/index.js';
import type { ShortLink, Store } from './store.js';

const INTENTS = [
  'home',
  'search',
  'product',
  'hotel',
  'flight',
  'experience',
  'food',
  'grocery',
  'cart',
  'ride',
] as const satisfies readonly Intent[];
const YMD = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const LinkInput = z.object({
  platform: z.enum(PLATFORM_IDS as [string, ...string[]]),
  intent: z.enum(INTENTS),
  params: z.record(z.string(), z.union([z.string().max(500), z.number()])).optional(),
  campaign: z.string().max(60).optional(),
  content: z.string().max(60).optional(),
});
const ReportQuery = z.object({
  from: YMD.optional(),
  to: YMD.optional(),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .default('INR'),
});
const ApiImport = z.object({ from: YMD, to: YMD });

export function buildApp(
  cfg: Config,
  store: Store,
  opts: { logger?: boolean; now?: () => number } = {},
): FastifyInstance {
  const app = Fastify({ logger: opts.logger ?? false, trustProxy: true });
  const now = opts.now ?? Date.now;
  const admin = Buffer.from(`Bearer ${cfg.ADMIN_TOKEN}`);

  app.addContentTypeParser(
    ['text/csv', 'text/plain'],
    { parseAs: 'string', bodyLimit: 10 * 1024 * 1024 },
    (_req, body, done) => done(null, body),
  );

  app.addHook('onRequest', async (req, reply) => {
    const open = req.url === '/healthz' || req.url === '/openapi.yaml' || req.url.startsWith('/go/');
    if (open) return;
    const got = Buffer.from(req.headers.authorization ?? '');
    if (got.length !== admin.length || !timingSafeEqual(got, admin))
      return reply.code(401).send({ error: 'unauthorized' });
  });

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof z.ZodError)
      return reply
        .code(400)
        .send({ error: 'bad request', issues: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`) });
    if (err instanceof LinkError || err instanceof ImportError) return reply.code(422).send({ error: err.message });
    if (err instanceof NotConfigured) return reply.code(501).send({ error: err.message, missing: err.missing });
    const status = (err as { statusCode?: number }).statusCode;
    if (status && status < 500) return reply.code(status).send({ error: (err as Error).message });
    app.log.error(err);
    return reply.code(500).send({ error: 'internal error' });
  });

  const view = (l: ShortLink) => ({ ...l, shortUrl: `${cfg.PUBLIC_BASE_URL}/go/${l.id}` });

  app.get('/healthz', async () => ({ ok: true }));
  app.get('/openapi.yaml', async (_req, reply) =>
    reply.type('application/yaml').send(readFileSync(new URL('../openapi.yaml', import.meta.url), 'utf8')),
  );

  /** public redirect: log the click, 302 to the tracked URL */
  app.get<{ Params: { id: string }; Querystring: { u?: string } }>('/go/:id', async (req, reply) => {
    const link = SHORT_ID.test(req.params.id) ? store.data.links[req.params.id] : undefined;
    if (!link) return reply.code(404).type('text/plain').send('Link not found');
    store.addClick({
      linkId: link.id,
      platform: link.input.platform,
      campaign: link.input.campaign ?? null,
      anon: anonToken(req.headers['x-akaya-anon'] ?? req.query.u, cfg.ANON_SALT),
      ts: now(),
    });
    return reply
      .code(302)
      .header('cache-control', 'no-store')
      .header('referrer-policy', 'no-referrer-when-downgrade')
      .redirect(link.targetUrl);
  });

  /** create (or reuse) a short link for a platform + intent */
  app.post('/links', async (req, reply) => {
    const body = LinkInput.parse(req.body);
    const input = { ...body, campaign: body.campaign ?? 'general' } as ShortLink['input'];
    const key = JSON.stringify([
      input.platform,
      input.intent,
      input.params ?? {},
      input.campaign,
      input.content ?? null,
    ]);
    const existing = store.linkByInput(key);
    if (existing) return reply.code(200).send(view(existing));
    const built = buildLink({ ...(input as BuildLinkInput), env: cfg.affiliate });
    let id = shortId();
    while (store.data.links[id]) id = shortId();
    const link: ShortLink = { id, input, targetUrl: built.trackedUrl, affiliate: built.affiliate, createdAt: now() };
    store.addLink(key, link);
    return reply.code(201).send(view(link));
  });

  app.get<{ Params: { id: string } }>('/links/:id', async (req, reply) => {
    const link = store.data.links[req.params.id];
    if (!link) return reply.code(404).send({ error: 'not found' });
    const clicks = store.data.clicks.filter((c) => c.linkId === link.id).length;
    return { ...view(link), clicks };
  });

  app.get('/imports', async () =>
    Object.values(ADAPTERS).map(({ source, label, csvHelp, apiEnv }) => ({ source, label, csvHelp, apiEnv })),
  );

  /** upload a CSV export from a network dashboard */
  app.post<{ Params: { source: string } }>('/imports/:source', async (req) => {
    if (typeof req.body !== 'string')
      throw new ImportError('send the CSV as the request body with Content-Type: text/csv');
    const rows = getAdapter(req.params.source).parseCsv(req.body);
    return { source: req.params.source, rows: rows.length, ...store.addEarnings(rows) };
  });

  /** pull from the network's reporting API (stubs: 501 until configured) */
  app.post<{ Params: { source: string } }>('/imports/:source/sync', async (req) => {
    const range = ApiImport.parse(req.body ?? {});
    const rows = await getAdapter(req.params.source).fetchApi(cfg.raw, range);
    return { source: req.params.source, rows: rows.length, ...store.addEarnings(rows) };
  });

  /** clicks (from the redirect log) + imported orders / commission per platform */
  app.get('/reports', async (req) => {
    const q = ReportQuery.parse(req.query);
    const inRange = (d: string) => (!q.from || d >= q.from) && (!q.to || d <= q.to);
    const clicks: Record<string, number> = {};
    for (const c of store.data.clicks) if (inRange(istDate(c.ts))) clicks[c.platform] = (clicks[c.platform] ?? 0) + 1;
    return summarize(
      clicks,
      store.data.earnings.filter((r) => inRange(r.date)),
      q,
    );
  });

  return app;
}
