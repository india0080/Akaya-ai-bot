import Fastify, { type FastifyInstance } from 'fastify';
import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { CHANNELS } from './channels.js';
import { isValidZone } from '@akaya/tz';
import { NotFound, Scheduler, ValidationError } from './scheduler.js';
import type { MessageStore } from './store/types.js';
import type { ChannelId } from './types.js';

const channelIds = Object.keys(CHANNELS) as [ChannelId, ...ChannelId[]];

const MessageInput = z.object({
  channels: z.array(z.enum(channelIds)).min(1),
  to: z.string().min(1).max(200),
  targets: z.record(z.string(), z.string().max(500)).optional(),
  subject: z.string().max(300).optional(),
  text: z.string().max(70000).default(''),
  media: z
    .object({
      kind: z.enum(['image', 'video']),
      url: z.string().url().startsWith('https://'),
      mime: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
  sendAt: z
    .union([z.number().int(), z.string().datetime({ offset: true })])
    .transform((v) => (typeof v === 'number' ? v : Date.parse(v))),
  timezone: z.string().default('Asia/Kolkata').refine(isValidZone, 'unknown IANA time zone'),
  repeat: z.enum(['once', 'daily', 'weekly', 'monthly', 'yearly']).default('once'),
});

export interface AppOptions {
  scheduler: Scheduler;
  store: MessageStore;
  apiToken: string;
  logger?: boolean;
}

/**
 * REST API (see openapi.yaml). Auth: `Authorization: Bearer <API_TOKEN>`; the caller identifies the user with
 * `X-User-Id` (in production the gateway verifies the user's session and sets it).
 */
export function buildApp({ scheduler, store, apiToken, logger = false }: AppOptions): FastifyInstance {
  const app = Fastify({ logger });

  app.get('/healthz', async () => ({ ok: true }));
  app.get('/openapi.yaml', async (_req, reply) => {
    reply.type('application/yaml');
    return readFileSync(new URL('../openapi.yaml', import.meta.url), 'utf8');
  });
  app.get('/v1/channels', async () => Object.values(CHANNELS));

  app.addHook('onRequest', async (req, reply) => {
    if (!req.url.startsWith('/v1/messages')) return;
    if (req.headers.authorization !== `Bearer ${apiToken}`) return reply.code(401).send({ error: 'unauthorized' });
    if (!req.headers['x-user-id']) return reply.code(400).send({ error: 'X-User-Id header required' });
  });
  const uid = (req: { headers: Record<string, unknown> }) => String(req.headers['x-user-id']);

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof ValidationError) return reply.code(422).send({ error: 'validation', issues: err.issues });
    if (err instanceof NotFound) return reply.code(404).send({ error: 'not found' });
    if (err instanceof z.ZodError)
      return reply
        .code(400)
        .send({ error: 'bad request', issues: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`) });
    reply.code(500).send({ error: 'internal error' });
  });

  app.post('/v1/messages', async (req, reply) => {
    const body = MessageInput.parse(req.body);
    const msg = await scheduler.schedule(uid(req), body);
    return reply.code(201).send(msg);
  });
  app.get('/v1/messages', async (req) => {
    const q = z.object({ status: z.string().optional() }).parse(req.query);
    return store.list(uid(req), q);
  });
  app.get('/v1/messages/:id', async (req) => {
    const { id } = req.params as { id: string };
    const m = await store.get(id);
    if (!m || m.userId !== uid(req)) throw new NotFound();
    return m;
  });
  app.patch('/v1/messages/:id', async (req) => {
    const { id } = req.params as { id: string };
    return scheduler.update(uid(req), id, MessageInput.partial().parse(req.body));
  });
  app.delete('/v1/messages/:id', async (req) => {
    const { id } = req.params as { id: string };
    return scheduler.cancel(uid(req), id);
  });
  app.post('/v1/messages/:id/retry', async (req) => scheduler.retry(uid(req), (req.params as { id: string }).id));
  app.post('/v1/messages/:id/send-now', async (req) => scheduler.sendNow(uid(req), (req.params as { id: string }).id));

  return app;
}
